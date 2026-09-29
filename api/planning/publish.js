import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../../lib/auth-server.js';
import { publicationReadiness } from '../../lib/planning-domain.js';
import {
  assertCanEditDepartment,
  planningError,
  requirePlanningActor,
  validateDraftAgainstDatabase
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
    const body = await readJson(req, 8192);
    const weekId = Number(body.week_id);
    const expectedVersion = Number(body.expected_version);
    if (!Number.isInteger(weekId) || weekId <= 0 || !Number.isInteger(expectedVersion) || expectedVersion <= 0) {
      throw planningError('INVALID_REQUEST', 400);
    }
    const weeks = await adminRequest(
      'planificacion_semanas?id=eq.' + encodeURIComponent(weekId) + '&select=*&limit=1'
    );
    const week = Array.isArray(weeks) && weeks[0];
    if (!week) throw planningError('WEEK_NOT_FOUND', 404);
    assertCanEditDepartment(session.profile, week.departamento_id);
    if (Number(week.version_actual) !== expectedVersion) throw planningError('VERSION_CONFLICT', 409);

    const assignments = await adminRequest(
      'planificacion_asignaciones?semana_id=eq.' + encodeURIComponent(weekId)
        + '&version=eq.' + encodeURIComponent(expectedVersion) + '&select=*'
    );
    const assignmentIds = assignments.map(item => item.id);
    const segments = assignmentIds.length ? await adminRequest(
      'planificacion_tramos?asignacion_id=in.(' + assignmentIds.map(encodeURIComponent).join(',')
        + ')&select=*&order=asignacion_id.asc,orden.asc'
    ) : [];
    const segmentsByAssignment = new Map();
    for (const segment of segments) {
      const key = String(segment.asignacion_id);
      if (!segmentsByAssignment.has(key)) segmentsByAssignment.set(key, []);
      segmentsByAssignment.get(key).push(segment);
    }
    const checked = await validateDraftAgainstDatabase({
      department: week.departamento_id,
      weekStart: week.fecha_inicio,
      assignments: assignments.map(item => ({
        ...item,
        tramos: segmentsByAssignment.get(String(item.id)) || []
      }))
    });
    const validation = checked.validation;
    const mappings = await adminRequest(
      'bitrix_horarios_departamento?departamento_id=eq.' + encodeURIComponent(week.departamento_id)
        + '&tipo_uso=eq.principal_departamento&activo=eq.true&select=ultima_lectura_at,ultimo_resultado'
    );
    const freshLimit = Date.now() - 5 * 60 * 1000;
    const catalogFresh = mappings.length > 0 && mappings.every(mapping =>
      mapping.ultimo_resultado === 'ok'
        && mapping.ultima_lectura_at
        && new Date(mapping.ultima_lectura_at).getTime() >= freshLimit
    );
    const readiness = publicationReadiness({
      validation,
      catalogFresh,
      bitrixWriteSupported: false,
      assignments
    });

    const idempotencyKey = `${week.id}:${expectedVersion}:publish:unsupported`;
    await adminRequest('planificacion_sync_log?on_conflict=idempotency_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({
        semana_id: week.id,
        version: expectedVersion,
        asignacion_id: null,
        operacion: 'publicar_semana',
        idempotency_key: idempotencyKey,
        resultado_envio: 'no_soportado',
        resultado_verificacion: 'no_ejecutado',
        intentos: 1,
        error_seguro: 'BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO',
        actor: session.profile.id,
        request_snapshot: { week_id: week.id, version: expectedVersion },
        response_snapshot: { blockers: readiness.blockers }
      })
    });

    return jsonResponse({
      error: 'BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO',
      readiness,
      validation,
      safe: true
    }, 409);
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({
      error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'PUBLICATION_CHECK_FAILED'),
      detail: error.detail || undefined
    }, invalidBody ? 400 : (error.status || 503));
  }
}
