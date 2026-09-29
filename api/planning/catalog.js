import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../../lib/auth-server.js';
import {
  assertCanEditDepartment,
  planningError,
  refreshDepartmentCatalog,
  requirePlanningActor
} from '../../lib/planning-server.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  const wrongMethod = requireMethod(req, 'POST');
  if (wrongMethod) return wrongMethod;
  const crossOrigin = requireSameOrigin(req);
  if (crossOrigin) return crossOrigin;

  try {
    const session = await requirePlanningActor(req);
    const body = await readJson(req, 4096);
    const department = String(body.department || '').trim();
    if (!department || department.length > 120) throw planningError('INVALID_REQUEST', 400);
    assertCanEditDepartment(session.profile, department);
    const schedules = await refreshDepartmentCatalog(department);
    const loggedAt = new Date().toISOString();
    await Promise.all(schedules.map(schedule => adminRequest('planificacion_sync_log', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        semana_id: null,
        version: null,
        asignacion_id: null,
        operacion: 'leer_catalogo_bitrix',
        idempotency_key: `catalog:${department}:${schedule.id}:${schedule.readAt}`,
        resultado_envio: 'ok',
        resultado_verificacion: 'catalogo_actualizado',
        intentos: 1,
        error_seguro: null,
        actor: session.profile.id,
        request_snapshot: { department, bitrix_schedule_id: schedule.id },
        response_snapshot: { shifts: schedule.shifts, exclusions: schedule.exclusions },
        created_at: loggedAt
      })
    })));
    return jsonResponse({ ok: true, department, schedules, refreshed_at: new Date().toISOString() });
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({
      error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'CATALOG_REFRESH_FAILED'),
      detail: error.detail || undefined
    }, invalidBody ? 400 : (error.status || 503));
  }
}
