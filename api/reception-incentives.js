// /api/reception-incentives.js
// Revisión y liquidación segura del incentivo mensual de Recepción Hotel.

import {
  adminRequest,
  jsonResponse,
  normalizeEmployeeId,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../lib/auth-server.js';
import {
  isAdjuntoProfile,
  isAdminProfile,
  loadManagementActor,
  normalizeDepartment,
  supervisorDepartments
} from '../lib/authz-server.js';

export const config = { runtime: 'edge' };

const MONTH_RE = /^(\d{4})-(\d{2})$/;
const VALID_FIO_STATES = new Set(['Validado', 'Cerrado', 'Disputado']);
const TYPE_CONFIG = Object.freeze({
  desayuno: { label: 'Desayuno', vatPercent: 10 },
  comida_cena: { label: 'Comida/Cena', vatPercent: 10 },
  syncrolab: { label: 'SYNCROLAB', vatPercent: 21 }
});

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function fioPenalty(points) {
  if (points <= 0) return 0;
  if (points <= 2) return 0.05;
  if (points <= 4) return 0.10;
  if (points <= 7) return 0.25;
  if (points <= 10) return 0.50;
  if (points <= 14) return 0.75;
  return 1;
}

export function parseReceptionMonth(value) {
  const match = MONTH_RE.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || year < 2020 || year > 2100
      || !Number.isInteger(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return {
    id: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    label: `${monthNames[month - 1]} ${year}`
  };
}

function isReceptionDepartment(value) {
  const department = normalizeDepartment(value);
  return department === normalizeDepartment('Recepción')
    || department === normalizeDepartment('Recepción SFERA');
}

export function canReadReceptionIncentives(profile) {
  if (isAdminProfile(profile) || isAdjuntoProfile(profile)) return true;
  return supervisorDepartments(profile).some(isReceptionDepartment);
}

export function canLiquidateReceptionIncentives(profile) {
  return isAdminProfile(profile) || isAdjuntoProfile(profile);
}

export function calculateReceptionIncentives({
  employees = [], sales = [], fios = [], liquidations = [], shifts = []
} = {}) {
  const activeEmployees = (Array.isArray(employees) ? employees : [])
    .filter(employee => employee && employee.estado === 'Activo'
      && isReceptionDepartment(employee.area));
  const shiftsById = new Map(
    (Array.isArray(shifts) ? shifts : []).filter(Boolean).map(shift => [shift.id, shift])
  );
  const salesByEmployee = new Map();

  for (const sale of (Array.isArray(sales) ? sales : [])) {
    if (!sale || !sale.empleado_id) continue;
    const type = TYPE_CONFIG[sale.tipo_venta] || { label: sale.tipo_venta || 'Otro', vatPercent: 10 };
    const gross = Number(sale.importe) || 0;
    const netRaw = gross / (1 + type.vatPercent / 100);
    const incentiveRaw = netRaw * 0.10;
    const closure = shiftsById.get(sale.shift_id) || null;
    const detail = {
      id: sale.id,
      shift_id: sale.shift_id || null,
      date: String(sale.fecha || '').slice(0, 10),
      type: sale.tipo_venta || '',
      type_label: type.label,
      service_detail: sale.servicio_detalle || null,
      invoice_reference: sale.reserva_mews || null,
      comment: sale.comentario || null,
      gross: roundMoney(gross),
      vat_percent: type.vatPercent,
      net: roundMoney(netRaw),
      incentive: roundMoney(incentiveRaw),
      closure_service: closure && closure.servicio ? closure.servicio : null,
      closure_status: closure && closure.estado ? closure.estado : null,
      created_at: sale.created_at || null,
      _netRaw: netRaw,
      _incentiveRaw: incentiveRaw
    };
    if (!salesByEmployee.has(sale.empleado_id)) salesByEmployee.set(sale.empleado_id, []);
    salesByEmployee.get(sale.empleado_id).push(detail);
  }

  return activeEmployees.map(employee => {
    const employeeSales = (salesByEmployee.get(employee.id) || []).sort((a, b) =>
      String(a.date || a.created_at || '').localeCompare(String(b.date || b.created_at || ''))
    );
    const salesNetRaw = employeeSales.reduce((total, sale) => total + sale._netRaw, 0);
    const incentiveGrossRaw = employeeSales.reduce((total, sale) => total + sale._incentiveRaw, 0);
    const fioPoints = (Array.isArray(fios) ? fios : [])
      .filter(fio => fio && fio.employee_id === employee.id
        && (!fio.status || VALID_FIO_STATES.has(fio.status)))
      .reduce((total, fio) => total + (Number(fio.applied_points) || 0), 0);
    const penaltyPercent = fioPenalty(fioPoints);
    const penaltyRaw = incentiveGrossRaw * penaltyPercent;
    const finalRaw = Math.max(0, incentiveGrossRaw - penaltyRaw);
    const liquidation = (Array.isArray(liquidations) ? liquidations : [])
      .find(row => row && row.empleado_id === employee.id) || null;

    return {
      employee_id: employee.id,
      employee_name: employee.nombre,
      sales_count: employeeSales.length,
      sales_net: roundMoney(salesNetRaw),
      incentive_gross: roundMoney(incentiveGrossRaw),
      fio_points: Math.round(fioPoints * 10) / 10,
      penalty_percent: penaltyPercent,
      penalty_amount: roundMoney(penaltyRaw),
      incentive_final: roundMoney(finalRaw),
      liquidable: finalRaw > 0,
      liquidated: !!liquidation,
      liquidation,
      sales: employeeSales.map(({ _netRaw, _incentiveRaw, ...sale }) => sale)
    };
  }).sort((a, b) => a.employee_name.localeCompare(b.employee_name, 'es'));
}

async function loadReceptionMonth(month) {
  const [employees, sales, fios, liquidations] = await Promise.all([
    adminRequest('employees?select=id,nombre,area,estado&order=nombre.asc'),
    adminRequest(
      'recepcion_ventas?fecha=gte.' + encodeURIComponent(month.start)
        + '&fecha=lte.' + encodeURIComponent(month.end)
        + '&select=id,shift_id,fecha,empleado_id,empleado_nombre,tipo_venta,importe,'
        + 'reserva_mews,servicio_detalle,comentario,created_at&order=fecha.asc,created_at.asc'
    ),
    adminRequest(
      'fio?incentive_month=eq.' + encodeURIComponent(month.id)
        + '&status=in.(Validado,Cerrado,Disputado)&select=employee_id,status,applied_points,saldado'
    ),
    adminRequest(
      'incentivos_liquidaciones?mes=eq.' + encodeURIComponent(month.id)
        + '&select=id,empleado_id,empleado_nombre,mes,incentivo_bruto,penalizacion_fio,'
        + 'incentivo_final,liquidado_por,liquidado_at,notas'
    )
  ]);
  const shiftIds = Array.from(new Set(
    (Array.isArray(sales) ? sales : []).map(sale => sale && sale.shift_id).filter(Boolean)
  ));
  const shifts = shiftIds.length
    ? await adminRequest(
      'shifts?id=in.(' + shiftIds.map(id => encodeURIComponent(id)).join(',')
        + ')&select=id,fecha,servicio,estado'
    )
    : [];
  return calculateReceptionIncentives({ employees, sales, fios, liquidations, shifts });
}

function cleanNotes(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return null;
  const notes = value.trim();
  return notes.length <= 1000 ? notes : null;
}

async function actorFrom(req) {
  try { return await loadManagementActor(req); }
  catch (_) { return undefined; }
}

async function recordLiquidationAudit(actor, employee, month, amount) {
  try {
    await adminRequest('audit_log', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        usuario: actor.profile.nombre || actor.profile.id,
        usuario_id: actor.profile.id,
        rol: actor.profile.rol || '',
        action: 'INC_LIQUIDACION_RECEPCION',
        detail: `${employee.employee_name} · ${month.id} · ${amount.toFixed(2)}€`,
        tabla: 'incentivos_liquidaciones',
        registro_id: employee.employee_id
      })
    });
  } catch (_) {
    // La auditoría auxiliar no debe convertir una liquidación ya guardada en error.
  }
}

async function settleReceptionFio(employeeId, monthId) {
  await adminRequest(
    'fio?employee_id=eq.' + encodeURIComponent(employeeId)
      + '&incentive_month=eq.' + encodeURIComponent(monthId)
      + '&status=in.(Validado,Cerrado,Disputado)',
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ saldado: true })
    }
  );
}

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;

  if (req.method === 'GET') {
    const actor = await actorFrom(req);
    if (actor === undefined) return jsonResponse({ error: 'Authentication unavailable' }, 503);
    if (!actor) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!canReadReceptionIncentives(actor.profile)) return jsonResponse({ error: 'Forbidden' }, 403);
    const month = parseReceptionMonth(new URL(req.url, 'http://x').searchParams.get('mes'));
    if (!month) return jsonResponse({ error: 'Mes inválido' }, 400);
    try {
      return jsonResponse({
        month,
        source: 'recepcion_ventas',
        rows: await loadReceptionMonth(month),
        permissions: { can_liquidate: canLiquidateReceptionIncentives(actor.profile) }
      });
    } catch (_) {
      return jsonResponse({ error: 'No se pudieron cargar los incentivos de Recepción Hotel' }, 503);
    }
  }

  const wrongMethod = requireMethod(req, 'POST');
  if (wrongMethod) return wrongMethod;
  const crossOrigin = requireSameOrigin(req);
  if (crossOrigin) return crossOrigin;

  const actor = await actorFrom(req);
  if (actor === undefined) return jsonResponse({ error: 'Authentication unavailable' }, 503);
  if (!actor) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (!canLiquidateReceptionIncentives(actor.profile)) return jsonResponse({ error: 'Forbidden' }, 403);

  let body;
  try { body = await readJson(req, 4096); }
  catch (_) { return jsonResponse({ error: 'Solicitud inválida' }, 400); }
  if (body.action !== 'liquidate') return jsonResponse({ error: 'Acción inválida' }, 400);
  const month = parseReceptionMonth(body.mes);
  const employeeId = normalizeEmployeeId(body.employee_id);
  const notes = cleanNotes(body.notas);
  if (!month || !employeeId || notes === null) {
    return jsonResponse({ error: 'Solicitud inválida' }, 400);
  }

  try {
    const rows = await loadReceptionMonth(month);
    const employee = rows.find(row => row.employee_id === employeeId);
    if (!employee) return jsonResponse({ error: 'Empleado de Recepción Hotel no encontrado' }, 404);
    if (employee.liquidated) {
      await settleReceptionFio(employee.employee_id, month.id);
      return jsonResponse({ ok: true, already_liquidated: true, record: employee.liquidation });
    }
    if (!employee.liquidable || employee.incentive_final <= 0) {
      return jsonResponse({ error: 'No hay importe pendiente de liquidar' }, 409);
    }

    const timestamp = new Date().toISOString();
    const liquidation = {
      id: crypto.randomUUID(),
      empleado_id: employee.employee_id,
      empleado_nombre: employee.employee_name,
      mes: month.id,
      incentivo_bruto: employee.incentive_gross,
      penalizacion_fio: employee.penalty_amount,
      incentivo_final: employee.incentive_final,
      liquidado_por: actor.profile.nombre || actor.profile.id,
      liquidado_at: timestamp,
      notas: notes || null
    };
    const inserted = await adminRequest('incentivos_liquidaciones', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(liquidation)
    });
    const record = Array.isArray(inserted) ? inserted[0] : inserted;
    if (!record) throw new Error('EMPTY_LIQUIDATION');

    await settleReceptionFio(employee.employee_id, month.id);
    await recordLiquidationAudit(actor, employee, month, employee.incentive_final);
    return jsonResponse({ ok: true, record });
  } catch (_) {
    return jsonResponse({ error: 'No se pudo registrar la liquidación de Recepción Hotel' }, 409);
  }
}
