import { adminRequest, jsonResponse, readJson, requireAuthEnabled } from '../../lib/auth-server.js';
import { employeeBelongsToPlanningDepartment, missingWeekAssignments } from '../../lib/planning-domain.js';
import { validateDraftAgainstDatabase } from '../../lib/planning-server.js';

export const config = { runtime: 'edge' };

function authorized(req) {
  const secret = process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN || '';
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (secret.length < 32 || supplied.length !== secret.length) return false;
  let difference = 0;
  for (let i = 0; i < secret.length; i += 1) difference |= secret.charCodeAt(i) ^ supplied.charCodeAt(i);
  return difference === 0;
}

async function pendingRequest() {
  for (let offset = 0; offset < 10000; offset += 100) {
    const requests = await adminRequest(
      'planificacion_sync_log?operacion=eq.solicitar_carga_bitrix'
        + '&response_snapshot->>automatic=eq.true'
        + '&select=id,semana_id,version,actor,created_at&order=created_at.asc,id.asc',
      { headers: { Range: `${offset}-${offset + 99}` } }
    );
    for (const request of requests || []) {
      const finished = await adminRequest('planificacion_sync_log?semana_id=eq.' + encodeURIComponent(request.semana_id)
        + '&version=eq.' + encodeURIComponent(request.version)
        + '&operacion=eq.ejecutor_resultado_bitrix&select=id&limit=1');
      if (!finished || !finished.length) return request;
    }
    if (!requests || requests.length < 100) return null;
  }
  throw new Error('EXECUTOR_QUEUE_LIMIT_REACHED');
}

async function loadJob(request) {
  const weeks = await adminRequest('planificacion_semanas?id=eq.' + encodeURIComponent(request.semana_id)
    + '&select=id,departamento_id,fecha_inicio,fecha_fin,version_actual&limit=1');
  const week = weeks && weeks[0];
  if (!week || Number(week.version_actual) !== Number(request.version)) {
    return { request_id: request.id, week_id: request.semana_id, version: request.version, blocked: 'VERSION_OBSOLETA' };
  }
  if (week.departamento_id !== 'Recepción SYNCROLAB') {
    return { request_id: request.id, week_id: week.id, version: request.version, blocked: 'DEPARTMENT_NOT_ALLOWED' };
  }
  const assignments = await adminRequest('planificacion_asignaciones?semana_id=eq.' + encodeURIComponent(week.id)
    + '&version=eq.' + encodeURIComponent(request.version) + '&select=*&order=empleado_id.asc,fecha_operativa.asc');
  const employees = await adminRequest('employees?estado=eq.Activo'
    + '&select=id,nombre,area,puesto,rol,estado,bitrix_user_id&limit=1001');
  const mappings = await adminRequest('bitrix_horarios_departamento?departamento_id=eq.'
    + encodeURIComponent(week.departamento_id)
    + '&tipo_uso=eq.principal_departamento&activo=eq.true&select=bitrix_schedule_id');
  if (!Array.isArray(mappings) || mappings.length !== 1 || Number(mappings[0].bitrix_schedule_id) !== 33) {
    return { request_id: request.id, week_id: week.id, version: request.version, blocked: 'SCHEDULE_NOT_ALLOWED' };
  }
  const scheduleId = Number(mappings[0].bitrix_schedule_id);
  if (!Array.isArray(employees) || employees.length >= 1000) {
    return { request_id: request.id, week_id: week.id, version: request.version, blocked: 'EMPLOYEE_ROSTER_UNAVAILABLE' };
  }
  if (!employees.some(employee => employeeBelongsToPlanningDepartment(employee, week.departamento_id))) {
    return { request_id: request.id, week_id: week.id, version: request.version, blocked: 'DEPARTMENT_ROSTER_EMPTY' };
  }
  const missing = missingWeekAssignments({ weekStart: week.fecha_inicio,
    department: week.departamento_id, employees, assignments });
  if (missing.length) {
    return { request_id: request.id, week_id: week.id, version: request.version,
      blocked: 'WEEK_INCOMPLETE', missing_count: missing.length };
  }
  const ids = assignments.map(item => item.id);
  const segments = ids.length ? await adminRequest('planificacion_tramos?asignacion_id=in.('
    + ids.map(encodeURIComponent).join(',') + ')&select=*&order=asignacion_id.asc,orden.asc') : [];
  const grouped = new Map();
  for (const item of segments) {
    const key = String(item.asignacion_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const checked = await validateDraftAgainstDatabase({ department: week.departamento_id,
    weekStart: week.fecha_inicio,
    assignments: assignments.map(item => ({ ...item, tramos: grouped.get(String(item.id)) || [] })) });
  if (!checked.validation.valid) {
    return { request_id: request.id, week_id: week.id, version: request.version, blocked: 'VALIDATION_FAILED' };
  }
  const employeeMap = new Map(employees.map(item => [String(item.id), item]));
  const catalogMap = new Map(checked.catalog.map(item => [String(item.bitrix_shift_id), item]));
  return {
    request_id: request.id,
    week_id: week.id,
    version: request.version,
    department: week.departamento_id,
    week_start: week.fecha_inicio,
    assignments: assignments.map(item => {
      const employee = employeeMap.get(String(item.empleado_id));
      const tramos = grouped.get(String(item.id)) || [];
      return {
        id: item.id,
        date: item.fecha_operativa,
        day_type: item.tipo_dia,
        bitrix_user_id: String(employee && employee.bitrix_user_id || ''),
        bitrix_schedule_id: scheduleId,
        shifts: item.tipo_dia === 'turno' ? tramos.map(segment => {
          const shift = catalogMap.get(String(segment.bitrix_shift_id));
          return { bitrix_shift_id: String(segment.bitrix_shift_id),
            name: shift && shift.nombre || '', start: shift && shift.inicio || '', end: shift && shift.fin || '' };
        }) : []
      };
    })
  };
}

async function recordResult(body) {
  const weekId = Number(body.week_id);
  const version = Number(body.version);
  if (!Number.isInteger(weekId) || weekId <= 0 || !Number.isInteger(version) || version <= 0) {
    return jsonResponse({ error: 'INVALID_REQUEST' }, 400);
  }
  const requestKey = `${weekId}:${version}:request-bitrix`;
  const original = await adminRequest('planificacion_sync_log?idempotency_key=eq.'
    + encodeURIComponent(requestKey) + '&select=id,actor&limit=1');
  if (!original || !original[0]) return jsonResponse({ error: 'REQUEST_NOT_FOUND' }, 404);
  const result = String(body.result || '');
  if (!['blocked', 'verified_shifts', 'partial', 'error'].includes(result)) {
    return jsonResponse({ error: 'INVALID_RESULT' }, 400);
  }
  const evidence = Array.isArray(body.evidence) ? body.evidence : [];
  if (evidence.length > 500 || evidence.some(item =>
    !Number.isInteger(Number(item.assignment_id))
    || !['verified', 'conflict', 'error'].includes(item.status))) {
    return jsonResponse({ error: 'INVALID_EVIDENCE' }, 400);
  }
  const assignments = await adminRequest('planificacion_asignaciones?semana_id=eq.' + weekId
    + '&version=eq.' + version + '&select=id,tipo_dia');
  const expected = new Set(assignments.map(item => Number(item.id)));
  if (evidence.some(item => !expected.has(Number(item.assignment_id)))) {
    return jsonResponse({ error: 'FOREIGN_ASSIGNMENT' }, 400);
  }
  if (result === 'verified_shifts') {
    const currentJob = await loadJob({ id: original[0].id, semana_id: weekId, version });
    if (currentJob.blocked) return jsonResponse({ error: currentJob.blocked }, 409);
    const reported = new Set(evidence.filter(item => item.status === 'verified').map(item => Number(item.assignment_id)));
    if (reported.size !== assignments.length || evidence.length !== assignments.length) {
      return jsonResponse({ error: 'INCOMPLETE_EVIDENCE' }, 409);
    }
  }
  const key = `${weekId}:${version}:executor-result`;
  await adminRequest('planificacion_sync_log?on_conflict=idempotency_key', {
    method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({
      semana_id: weekId, version, asignacion_id: null,
      operacion: 'ejecutor_resultado_bitrix', idempotency_key: key,
      resultado_envio: result, resultado_verificacion: result === 'verified_shifts' ? 'turnos_verificados' : 'no_verificado',
      actor: original[0].actor, intentos: 1,
      error_seguro: result === 'blocked' || result === 'error' ? String(body.error || 'EXECUTOR_FAILED').slice(0, 120) : null,
      request_snapshot: { week_id: weekId, version },
      response_snapshot: { evidence: evidence.map(item => ({ assignment_id: Number(item.assignment_id), status: item.status })) }
    })
  });
  return jsonResponse({ ok: true, result }, 200);
}

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  if (!authorized(req)) return jsonResponse({ error: 'UNAUTHORIZED' }, 401);
  try {
    if (req.method === 'GET') {
      const request = await pendingRequest();
      return jsonResponse({ ok: true, job: request ? await loadJob(request) : null });
    }
    if (req.method === 'POST') return await recordResult(await readJson(req, 128 * 1024));
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'GET, POST' });
  } catch (error) {
    return jsonResponse({ error: error.code || 'EXECUTOR_API_FAILED' }, error.status || 503);
  }
}
