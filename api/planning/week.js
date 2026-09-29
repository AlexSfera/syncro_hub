import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireSameOrigin
} from '../../lib/auth-server.js';
import { calculateSegments, mondayOfWeek } from '../../lib/planning-domain.js';
import {
  assertCanEditDepartment,
  planningError,
  requirePlanningActor,
  validateDraftAgainstDatabase
} from '../../lib/planning-server.js';

export const config = { runtime: 'edge' };

function normalizeAssignments(assignments) {
  if (!Array.isArray(assignments) || assignments.length > 500) {
    throw planningError('INVALID_ASSIGNMENTS', 400);
  }
  return assignments.map(item => {
    const assignment = item && typeof item === 'object' ? item : {};
    const base = {
      empleado_id: String(assignment.empleado_id || '').trim(),
      fecha_operativa: String(assignment.fecha_operativa || '').trim(),
      tipo_dia: String(assignment.tipo_dia || '').trim(),
      turno_catalogo_id: assignment.turno_catalogo_id == null ? null : Number(assignment.turno_catalogo_id),
      descanso_minutos: Number(assignment.descanso_minutos || 0)
    };
    if (base.tipo_dia !== 'turno') {
      return { ...base, tramos: [], minutos_planificados: 0, inicio: null, fin: null };
    }
    const calculated = calculateSegments(assignment.tramos);
    return {
      ...base,
      tramos: calculated.segments || [],
      minutos_planificados: calculated.minutes,
      inicio: calculated.segments && calculated.segments[0] ? calculated.segments[0].inicio : null,
      fin: calculated.segments && calculated.segments.length
        ? calculated.segments[calculated.segments.length - 1].fin
        : null,
      cruza_medianoche: !!(calculated.segments || []).some(segment =>
        segment.inicio.slice(0, 10) !== segment.fin.slice(0, 10)
      )
    };
  });
}

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  if (req.method !== 'PUT') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'PUT' });
  }
  const crossOrigin = requireSameOrigin(req);
  if (crossOrigin) return crossOrigin;

  try {
    const session = await requirePlanningActor(req);
    const body = await readJson(req, 256 * 1024);
    const department = String(body.department || '').trim();
    const weekStart = String(body.week_start || '').trim();
    const expectedVersion = Number(body.expected_version);
    const type = body.type === 'rectificacion' ? 'rectificacion' : 'borrador';
    const reason = String(body.reason || '').trim();
    if (!department || department.length > 120 || mondayOfWeek(weekStart) !== weekStart
        || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
      throw planningError('INVALID_REQUEST', 400);
    }
    assertCanEditDepartment(session.profile, department);
    const assignments = normalizeAssignments(body.assignments);
    const checked = await validateDraftAgainstDatabase({ department, weekStart, assignments });
    const validation = checked.validation;
    if (!validation.valid) {
      return jsonResponse({ error: 'VALIDATION_FAILED', validation }, 422);
    }
    if (type === 'rectificacion' && !reason) {
      throw planningError('RECTIFICATION_REASON_REQUIRED', 400);
    }

    const employeeMap = new Map(checked.employees.map(employee => [String(employee.id), employee]));
    const catalogMap = new Map(checked.catalog.map(shift => [String(shift.id), shift]));
    const trustedAssignments = assignments.map(assignment => {
      const employee = employeeMap.get(String(assignment.empleado_id));
      const shift = catalogMap.get(String(assignment.turno_catalogo_id));
      return {
        ...assignment,
        bitrix_user_id_snapshot: employee && employee.bitrix_user_id ? String(employee.bitrix_user_id) : null,
        bitrix_schedule_id_snapshot: shift ? Number(shift.bitrix_schedule_id) : null,
        bitrix_shift_id_snapshot: shift ? String(shift.bitrix_shift_id) : null,
        tramos: assignment.tramos.map(segment => ({
          ...segment,
          cruza_medianoche: segment.inicio.slice(0, 10) !== segment.fin.slice(0, 10)
        }))
      };
    });

    const snapshot = {
      department,
      week_start: weekStart,
      assignments: trustedAssignments,
      warnings: validation.warnings
    };
    const saved = await adminRequest('rpc/planificacion_guardar_semana', {
      method: 'POST',
      body: JSON.stringify({
        p_departamento_id: department,
        p_fecha_inicio: weekStart,
        p_expected_version: expectedVersion,
        p_snapshot: snapshot,
        p_actor: session.profile.id,
        p_tipo: type,
        p_motivo: reason || null
      })
    });
    return jsonResponse({ ok: true, saved, validation });
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({
      error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'WEEK_SAVE_FAILED'),
      detail: error.detail || undefined
    }, invalidBody ? 400 : (error.status || 503));
  }
}
