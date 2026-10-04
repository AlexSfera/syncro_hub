import { adminRequest } from './auth-server.js';
import {
  canEditPlanningDepartment,
  calculateVacationEntitlement,
  employeeBelongsToPlanningDepartment,
  mondayOfWeek,
  planningDepartmentForEmployee,
  planningCapabilities,
  validateWeekDraft,
  weekDates
} from './planning-domain.js';
import {
  loadManagementActor,
  supervisorDepartments
} from './authz-server.js';

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;

export function planningError(code, status = 400, detail = null) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  error.detail = detail;
  return error;
}

export async function requirePlanningActor(req) {
  const session = await loadManagementActor(req);
  if (!session) throw planningError('UNAUTHORIZED', 401);
  return session;
}

export function departmentsForActor(actor) {
  const capabilities = planningCapabilities(actor, process.env.ANGELICA_EMPLOYEE_ID || '');
  if (capabilities.canEditGlobally) return ['*'];
  return supervisorDepartments(actor);
}

export function assertCanEditDepartment(actor, department) {
  const departments = departmentsForActor(actor);
  if (!canEditPlanningDepartment(actor, department, departments)) {
    throw planningError('FORBIDDEN_DEPARTMENT', 403);
  }
  return departments;
}

function restEq(value) {
  return encodeURIComponent(String(value));
}

function normalizeTimeFromSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const normalized = seconds % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const secs = Math.floor(normalized % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function bitrixCall(method, params = {}) {
  if (!BITRIX_WEBHOOK) throw planningError('BITRIX_NOT_CONFIGURED', 503);
  const url = BITRIX_WEBHOOK.replace(/\/+$/, '') + '/' + method;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.error) {
    throw planningError('BITRIX_READ_FAILED', 502, {
      method,
      status: response.status,
      bitrix_code: data && data.error ? String(data.error).slice(0, 80) : null
    });
  }
  return data.result;
}

export function normalizeBitrixSchedule(schedule, department) {
  if (!schedule || typeof schedule !== 'object') {
    throw planningError('BITRIX_SCHEDULE_EMPTY', 502);
  }
  const scheduleId = Number(schedule.ID);
  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    throw planningError('BITRIX_SCHEDULE_INVALID', 502);
  }
  const readAt = new Date().toISOString();
  const shifts = (Array.isArray(schedule.SHIFTS) ? schedule.SHIFTS : []).map(shift => {
    const startSeconds = Number(shift.WORK_TIME_START);
    const endSeconds = Number(shift.WORK_TIME_END);
    const active = shift.DELETED !== true && shift.DELETED !== '1';
    const validTimes = Number.isFinite(startSeconds) && Number.isFinite(endSeconds);
    return {
      bitrix_schedule_id: scheduleId,
      bitrix_shift_id: String(shift.ID),
      nombre: String(shift.NAME || '').trim() || null,
      inicio: validTimes ? normalizeTimeFromSeconds(startSeconds) : null,
      fin: validTimes ? normalizeTimeFromSeconds(endSeconds) : null,
      cruza_medianoche: validTimes && (endSeconds <= startSeconds || endSeconds >= 86400),
      descanso_minutos: Math.max(0, Math.round(Number(shift.BREAK_DURATION || 0) / 60)),
      tramos_json: [],
      activo: active && validTimes,
      source_updated_by: schedule.UPDATED_BY == null ? null : String(schedule.UPDATED_BY),
      source_snapshot: {
        work_days: shift.WORK_DAYS == null ? null : String(shift.WORK_DAYS),
        deleted: shift.DELETED === true || shift.DELETED === '1'
      },
      ultima_lectura_at: readAt,
      departamento_id: department
    };
  });
  const exclusions = schedule.CALENDAR && Array.isArray(schedule.CALENDAR.EXCLUSIONS)
    ? schedule.CALENDAR.EXCLUSIONS.map(String)
    : [];
  return {
    schedule: {
      id: scheduleId,
      name: String(schedule.NAME || ''),
      type: String(schedule.SCHEDULE_TYPE || ''),
      reportPeriod: String(schedule.REPORT_PERIOD || ''),
      calendarId: schedule.CALENDAR_ID == null ? null : String(schedule.CALENDAR_ID),
      deleted: schedule.DELETED === '1' || schedule.DELETED === true,
      readAt
    },
    shifts,
    exclusions
  };
}

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return [];
  return adminRequest(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows)
  });
}

export async function refreshDepartmentCatalog(department) {
  const mappings = await adminRequest(
    'bitrix_horarios_departamento?departamento_id=eq.' + restEq(department)
      + '&tipo_uso=eq.principal_departamento&activo=eq.true'
      + '&select=id,departamento_id,bitrix_schedule_id,tipo_uso'
      + '&order=bitrix_schedule_id.asc'
  );
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw planningError('BITRIX_SCHEDULE_MAPPING_NO_DATA', 409);
  }

  const result = [];
  for (const mapping of mappings) {
    const raw = await bitrixCall('timeman.schedule.get', { id: mapping.bitrix_schedule_id });
    const normalized = normalizeBitrixSchedule(raw, mapping.departamento_id);
    await adminRequest(
      'bitrix_turnos_catalogo?bitrix_schedule_id=eq.' + restEq(mapping.bitrix_schedule_id),
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ activo: false, updated_at: normalized.schedule.readAt })
      }
    );
    const persistedShifts = normalized.shifts.map(({ departamento_id: _department, ...shift }) => shift);
    await upsertRows('bitrix_turnos_catalogo', persistedShifts, 'bitrix_schedule_id,bitrix_shift_id');
    await adminRequest('bitrix_horarios_departamento?id=eq.' + restEq(mapping.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        ultima_lectura_at: normalized.schedule.readAt,
        ultimo_resultado: 'ok',
        updated_at: normalized.schedule.readAt
      })
    });

    await adminRequest(
      'festivos_calendario?bitrix_schedule_id=eq.' + restEq(mapping.bitrix_schedule_id)
        + '&origen=eq.bitrix24',
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ activo: false, ultima_lectura_at: normalized.schedule.readAt })
      }
    );
    const holidayRows = normalized.exclusions
      .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .map(value => ({
        centro_calendario_id: normalized.schedule.calendarId || `schedule:${normalized.schedule.id}`,
        fecha: value,
        nombre: 'Festivo Bitrix24',
        bitrix_schedule_id: normalized.schedule.id,
        origen: 'bitrix24',
        activo: true,
        source_snapshot: { schedule_id: normalized.schedule.id },
        ultima_lectura_at: normalized.schedule.readAt
      }));
    await upsertRows('festivos_calendario', holidayRows, 'centro_calendario_id,fecha');
    result.push({ ...normalized.schedule, shifts: normalized.shifts.length, exclusions: holidayRows.length });
  }
  return result;
}

async function safeQuery(path, fallback = []) {
  try { return await adminRequest(path); }
  catch (error) {
    if (error && (error.status === 404 || error.status === 400)) {
      throw planningError('PLANNING_SCHEMA_NOT_READY', 503);
    }
    if (fallback !== undefined && error && error.status === 204) return fallback;
    throw planningError('PLANNING_DATA_UNAVAILABLE', 503);
  }
}

export async function loadPlanningBootstrap({ actor, weekStart, department }) {
  const monday = mondayOfWeek(weekStart);
  if (!monday || monday !== weekStart) throw planningError('INVALID_WEEK_START', 400);
  const dates = weekDates(weekStart);
  const capabilities = planningCapabilities(actor, process.env.ANGELICA_EMPLOYEE_ID || '');
  const allowedDepartments = departmentsForActor(actor);
  const canEdit = canEditPlanningDepartment(actor, department, allowedDepartments);

  const mappings = await safeQuery(
    'bitrix_horarios_departamento?activo=eq.true'
      + '&select=id,departamento_id,bitrix_schedule_id,tipo_uso,ultima_lectura_at,ultimo_resultado'
      + '&order=departamento_id.asc,bitrix_schedule_id.asc'
  );
  const selectedMappings = mappings.filter(mapping => mapping.departamento_id === department);
  const scheduleIds = selectedMappings
    .filter(mapping => mapping.tipo_uso === 'principal_departamento')
    .map(mapping => mapping.bitrix_schedule_id);
  const configuredDepartments = [...new Set(mappings
    .filter(mapping => mapping.tipo_uso === 'principal_departamento')
    .map(mapping => mapping.departamento_id))];
  const ownDepartment = planningDepartmentForEmployee(actor);
  const availableDepartments = capabilities.canEditGlobally
    ? configuredDepartments
    : configuredDepartments.filter(candidate => {
      if (capabilities.canManageTeam) {
        return canEditPlanningDepartment(actor, candidate, allowedDepartments);
      }
      return String(candidate).localeCompare(String(ownDepartment), 'es', { sensitivity: 'accent' }) === 0;
    });

  const exercise = Number(weekStart.slice(0, 4));
  const [employees, weeks, conditions, absences, extras, holidays, conventionVersions, vacationMovements] = await Promise.all([
    safeQuery('employees?estado=eq.Activo&select=id,nombre,area,puesto,rol,estado&order=nombre.asc'),
    safeQuery('planificacion_semanas?fecha_inicio=eq.' + restEq(weekStart)
      + '&select=*&order=departamento_id.asc'),
    safeQuery('empleado_condiciones_laborales?vigente_desde=lte.' + restEq(dates[6])
      + '&or=(vigente_hasta.is.null,vigente_hasta.gte.' + restEq(dates[0]) + ')&select=*'
      + '&order=vigente_desde.desc'),
    safeQuery('planificacion_ausencias?fecha_inicio=lte.' + restEq(dates[6])
      + '&fecha_fin=gte.' + restEq(dates[0])
      + '&estado=neq.anulada&select=id,empleado_id,fecha_inicio,fecha_fin,tipo_ausencia_id,etiqueta_publica,estado,version,reemplaza_ausencia_id'),
    safeQuery('extra_recuperacion_movimientos?fecha=gte.' + restEq(dates[0])
      + '&fecha=lte.' + restEq(dates[6]) + '&select=id,empleado_id,fecha,tipo,minutos,estado'),
    safeQuery('festivos_calendario?fecha=gte.' + restEq(dates[0])
      + '&fecha=lte.' + restEq(dates[6])
      + '&activo=eq.true&select=id,centro_calendario_id,fecha,nombre,bitrix_schedule_id,origen'),
    safeQuery('convenio_versiones?select=id,convenio_id,version,unidad_vacaciones,vacaciones_anuales,jornada_anual_minutos&order=convenio_id.asc,version.desc'),
    safeQuery('vacaciones_movimientos?ejercicio=in.(' + (exercise - 1) + ',' + exercise
      + ')&select=id,empleado_id,ejercicio,tipo,unidad,dias')
  ]);

  // El corte procede de la auditoria certificada existente. No se reescribe
  // el historial de movimientos ni se usa la fecha de creacion como corte.
  const movementIds = vacationMovements.map(item => String(item.id));
  const openingAudits = movementIds.length
    ? await safeQuery('planificacion_audit?accion=eq.IMPORTAR_SALDO_VACACIONES'
      + '&entidad=eq.vacaciones_movimientos&entidad_id=in.('
      + movementIds.map(restEq).join(',') + ')'
      + '&select=entidad_id,fecha_operativa')
    : [];
  const openingDates = new Map(openingAudits.map(item => [
    String(item.entidad_id), item.fecha_operativa
  ]));
  const datedVacationMovements = vacationMovements.map(item => ({
    ...item,
    fecha_corte: openingDates.get(String(item.id)) || null
  }));

  let week = weeks.find(item => item.departamento_id === department) || null;
  if (week && !canEdit && week.estado !== 'publicado_bitrix' && week.estado !== 'rectificado_bitrix') {
    week = null;
  }

  let assignments = [];
  let segments = [];
  if (week) {
    assignments = await safeQuery(
      'planificacion_asignaciones?semana_id=eq.' + restEq(week.id)
        + '&version=eq.' + restEq(week.version_actual) + '&select=*&order=empleado_id.asc,fecha_operativa.asc'
    );
    const ids = assignments.map(item => item.id);
    if (ids.length) {
      segments = await safeQuery(
        'planificacion_tramos?asignacion_id=in.(' + ids.map(restEq).join(',') + ')'
          + '&select=*&order=asignacion_id.asc,orden.asc'
      );
    }
  }
  if (week && !canEdit) {
    week = {
      id: week.id,
      departamento_id: week.departamento_id,
      fecha_inicio: week.fecha_inicio,
      fecha_fin: week.fecha_fin,
      version_actual: week.version_actual,
      estado: week.estado,
      publicado_at: week.publicado_at,
      ultima_verificacion_at: week.ultima_verificacion_at,
      updated_at: week.updated_at
    };
    assignments = assignments.map(item => ({
      id: item.id,
      empleado_id: item.empleado_id,
      fecha_operativa: item.fecha_operativa,
      tipo_dia: item.tipo_dia,
      turno_catalogo_id: item.turno_catalogo_id,
      inicio: item.inicio,
      fin: item.fin,
      cruza_medianoche: item.cruza_medianoche,
      descanso_minutos: item.descanso_minutos,
      minutos_planificados: item.minutos_planificados
    }));
  }

  let catalog = [];
  if (scheduleIds.length) {
    catalog = await safeQuery(
      'bitrix_turnos_catalogo?bitrix_schedule_id=in.(' + scheduleIds.join(',') + ')'
        + '&select=*&order=bitrix_schedule_id.asc,bitrix_shift_id.asc'
    );
  }
  catalog = catalog.map(shift => ({
    id: shift.id,
    bitrix_schedule_id: shift.bitrix_schedule_id,
    bitrix_shift_id: shift.bitrix_shift_id,
    nombre: shift.nombre,
    inicio: shift.inicio,
    fin: shift.fin,
    cruza_medianoche: shift.cruza_medianoche,
    descanso_minutos: shift.descanso_minutos,
    activo: shift.activo,
    ultima_lectura_at: shift.ultima_lectura_at,
    departamento_id: department
  }));

  const visibleEmployees = employees.filter(employee =>
    employeeBelongsToPlanningDepartment(employee, department)
  );
  const visibleEmployeeIds = new Set(visibleEmployees.map(employee => String(employee.id)));
  const visibleConditions = conditions.filter(item => visibleEmployeeIds.has(String(item.empleado_id)));
  const visibleAbsences = (!canEdit && !week) ? []
    : absences.filter(item => visibleEmployeeIds.has(String(item.empleado_id)));
  const visibleExtras = (!canEdit && !week) ? []
    : extras.filter(item => visibleEmployeeIds.has(String(item.empleado_id)));
  const selectedScheduleIds = new Set(scheduleIds.map(String));
  const visibleHolidays = holidays.filter(item => selectedScheduleIds.has(String(item.bitrix_schedule_id)));
  const balances = vacationBalances({
    employees: visibleEmployees,
    conditions: visibleConditions,
    conventionVersions,
    movements: datedVacationMovements,
    exercise,
    actor,
    canEdit
  });

  return {
    weekStart,
    dates,
    selectedDepartment: department,
    permissions: { ...capabilities, canEdit, allowedDepartments },
    mappings: mappings.filter(mapping => availableDepartments.includes(mapping.departamento_id)),
    availableDepartments,
    employees: visibleEmployees,
    week,
    assignments,
    segments,
    catalog,
    conditions: capabilities.canManageLaborConditions ? visibleConditions : [],
    absences: visibleAbsences,
    extras: visibleExtras,
    holidays: visibleHolidays,
    conventionVersions,
    balances,
    bitrixWriteSupported: false
  };
}

export function vacationBalances({ employees, conditions, conventionVersions, movements, exercise, actor, canEdit }) {
  const conventionMap = new Map(conventionVersions.map(item => [String(item.id), item]));
  const conditionMap = new Map();
  for (const condition of conditions) {
    const key = String(condition.empleado_id);
    if (!conditionMap.has(key)) conditionMap.set(key, condition);
  }
  const totals = new Map();
  const counts = new Map();
  const units = new Map();
  const openings = new Map();
  for (const movement of movements) {
    const key = `${movement.empleado_id}|${movement.ejercicio}`;
    totals.set(key, (totals.get(key) || 0) + Number(movement.dias || 0));
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!units.has(key)) units.set(key, new Set());
    if (movement.unidad) units.get(key).add(movement.unidad);
    if (/^\d{4}-\d{2}-\d{2}$/.test(movement.fecha_corte || '')) {
      const opening = openings.get(key) || { value: 0, asOf: null };
      opening.value += Number(movement.dias || 0);
      if (!opening.asOf || movement.fecha_corte > opening.asOf) {
        opening.asOf = movement.fecha_corte;
      }
      openings.set(key, opening);
    }
  }
  const round = value => Math.round(value * 100) / 100;
  return employees.map(employee => {
    const canSeeBalance = canEdit || String(employee.id) === String(actor.id);
    const condition = conditionMap.get(String(employee.id));
    const convention = condition && conventionMap.get(String(condition.convenio_version_id));
    const entitlement = condition && convention
      ? calculateVacationEntitlement({
          conventionId: convention.convenio_id,
          year: exercise,
          contractStart: condition.fecha_inicio_contrato,
          contractEnd: condition.fecha_fin_contrato
        })
      : '[NO DATA]';
    const currentKey = `${employee.id}|${exercise}`;
    const previousKey = `${employee.id}|${exercise - 1}`;
    const currentUnits = units.get(currentKey) || new Set();
    const previousUnits = units.get(previousKey) || new Set();
    const currentUnit = currentUnits.size === 1 ? [...currentUnits][0] : null;
    const previousUnit = previousUnits.size === 1 ? [...previousUnits][0] : null;
    const currentOpening = openings.get(currentKey);
    const previousOpening = openings.get(previousKey);
    const canShowCurrent = canSeeBalance && currentUnits.size <= 1;
    const canShowPrevious = canSeeBalance && previousUnits.size <= 1;
    return {
      employee_id: employee.id,
      exercise,
      unit: canSeeBalance ? (currentUnit || (convention ? convention.unidad_vacaciones : null)) : null,
      entitlement_unit: canSeeBalance && convention ? convention.unidad_vacaciones : null,
      previous_unit: canSeeBalance ? previousUnit : null,
      entitlement: canSeeBalance ? entitlement : '[NO DATA]',
      value: canShowCurrent && counts.has(currentKey)
        ? round(totals.get(currentKey) || 0) : '[NO DATA]',
      previous_value: canShowPrevious && counts.has(previousKey)
        ? round(totals.get(previousKey) || 0) : '[NO DATA]',
      opening_value: canShowCurrent && currentOpening
        ? round(currentOpening.value) : '[NO DATA]',
      opening_as_of: canShowCurrent && currentOpening ? currentOpening.asOf : null,
      previous_opening_value: canShowPrevious && previousOpening
        ? round(previousOpening.value) : '[NO DATA]',
      previous_opening_as_of: canShowPrevious && previousOpening ? previousOpening.asOf : null
    };
  });
}

export async function validateDraftAgainstDatabase({ department, weekStart, assignments }) {
  const employeeIds = [...new Set(assignments.map(item => String(item.empleado_id || '')).filter(Boolean))];
  const [employees, conditions, mappings] = await Promise.all([
    employeeIds.length
      ? safeQuery('employees?id=in.(' + employeeIds.map(restEq).join(',')
        + ')&select=id,nombre,area,puesto,rol,estado,bitrix_user_id')
      : [],
    employeeIds.length
      ? safeQuery('empleado_condiciones_laborales?empleado_id=in.(' + employeeIds.map(restEq).join(',')
        + ')&vigente_desde=lte.' + restEq(addWeekEnd(weekStart))
        + '&or=(vigente_hasta.is.null,vigente_hasta.gte.' + restEq(weekStart) + ')&select=*')
      : [],
    safeQuery(
      'bitrix_horarios_departamento?departamento_id=eq.' + restEq(department)
        + '&tipo_uso=eq.principal_departamento&activo=eq.true&select=bitrix_schedule_id'
    )
  ]);
  const scheduleIds = new Set(mappings.map(item => String(item.bitrix_schedule_id)));
  const catalog = scheduleIds.size
    ? await safeQuery('bitrix_turnos_catalogo?bitrix_schedule_id=in.(' + [...scheduleIds].map(restEq).join(',')
      + ')&select=*')
    : [];
  const enrichedCatalog = catalog.map(shift => ({
    ...shift,
    departamento_id: scheduleIds.has(String(shift.bitrix_schedule_id)) ? department : '[NO DATA]'
  }));
  const validation = validateWeekDraft({
    weekStart,
    department,
    assignments,
    employees,
    catalog: enrichedCatalog,
    conditions
  });
  return { validation, employees, catalog: enrichedCatalog, conditions };
}

function addWeekEnd(weekStart) {
  return weekDates(weekStart)[6] || weekStart;
}
