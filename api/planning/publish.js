import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../../lib/auth-server.js';
import { employeeBelongsToPlanningDepartment, missingWeekAssignments, publicationReadiness } from '../../lib/planning-domain.js';
import {
  assertCanEditDepartment,
  ensureBitrixPlanningTask,
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
    const activeEmployees = await adminRequest(
      'employees?estado=eq.Activo&select=id,nombre,area,puesto,rol,estado&limit=1001'
    );
    if (!Array.isArray(activeEmployees) || activeEmployees.length >= 1000) {
      throw planningError('EMPLOYEE_ROSTER_UNAVAILABLE', 503);
    }
    if (!activeEmployees.some(employee =>
      employeeBelongsToPlanningDepartment(employee, week.departamento_id))) {
      throw planningError('DEPARTMENT_ROSTER_EMPTY', 409);
    }
    const missing = missingWeekAssignments({
      weekStart: week.fecha_inicio,
      department: week.departamento_id,
      employees: activeEmployees,
      assignments
    });
    if (missing.length) {
      return jsonResponse({
        error: 'WEEK_INCOMPLETE',
        missing,
        validation
      }, 409);
    }
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
      bitrixWriteSupported: true,
      assignments
    });
    if (!readiness.ready) {
      return jsonResponse({ error: 'PUBLICATION_REQUEST_BLOCKED', readiness, validation }, 409);
    }

    const requestKey = `${week.id}:${expectedVersion}:request-bitrix`;
    const notificationKey = `${week.id}:${expectedVersion}:notify-bitrix`;
    const existingRequests = await adminRequest(
      'planificacion_sync_log?idempotency_key=eq.' + encodeURIComponent(requestKey)
        + '&select=id,response_snapshot,error_seguro,created_at&limit=1'
    );
    const existingNotifications = await adminRequest(
      'planificacion_sync_log?idempotency_key=eq.' + encodeURIComponent(notificationKey)
        + '&select=id,response_snapshot,created_at&limit=1'
    );

    const automatic = process.env.SYNCRO_PLANNING_EXECUTOR_ENABLED === 'true'
      && String(process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN || '').length >= 32;
    let notification = automatic ? { sent: false, skipped: 'EXECUTOR_QUEUE' }
      : Array.isArray(existingNotifications) && existingNotifications[0]
      ? { sent: true, task_id: existingNotifications[0].response_snapshot.bitrix_task_id, duplicate: true }
      : { sent: false, error: null };
    if (!automatic && !notification.sent) {
      try {
        const task = await ensureBitrixPlanningTask({
          week,
          assignmentCount: assignments.length,
          actorName: session.profile.nombre
        });
        notification = { sent: true, task_id: task.id, created: task.created };
        await adminRequest('planificacion_sync_log?on_conflict=idempotency_key', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify({
            semana_id: week.id,
            version: expectedVersion,
            asignacion_id: null,
            operacion: 'notificar_carga_bitrix',
            idempotency_key: notificationKey,
            resultado_envio: 'aviso_enviado',
            resultado_verificacion: 'pendiente_mac_mini',
            intentos: 1,
            error_seguro: null,
            actor: session.profile.id,
            request_snapshot: { week_id: week.id, version: expectedVersion },
            response_snapshot: { bitrix_task_id: task.id, responsible_id: task.responsibleId }
          })
        });
      } catch (error) {
        const bitrixCode = error.detail && error.detail.bitrix_code;
        console.warn('PLANNING_BITRIX_NOTIFY_FAILED', JSON.stringify({
          code: error.code || 'BITRIX_TASK_NOTIFICATION_FAILED',
          method: error.detail && error.detail.method || null,
          status: error.detail && error.detail.status || null,
          bitrix_code: bitrixCode || null
        }));
        notification = {
          sent: false,
          error: bitrixCode || error.code || 'BITRIX_TASK_NOTIFICATION_FAILED',
          http_status: error.detail && error.detail.status || null
        };
      }
    }

    if (!Array.isArray(existingRequests) || !existingRequests[0]) {
      await adminRequest('planificacion_sync_log?on_conflict=idempotency_key', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify({
          semana_id: week.id,
          version: expectedVersion,
          asignacion_id: null,
          operacion: 'solicitar_carga_bitrix',
          idempotency_key: requestKey,
          resultado_envio: 'pendiente_mac_mini',
          resultado_verificacion: 'pendiente',
          intentos: 1,
          error_seguro: automatic || notification.sent ? null : notification.error,
          actor: session.profile.id,
          request_snapshot: {
            week_id: week.id,
            version: expectedVersion,
            department: week.departamento_id,
            week_start: week.fecha_inicio,
            assignments: assignments.length
          },
          response_snapshot: {
            notification_sent: notification.sent,
            bitrix_task_id: notification.task_id || null,
            executor: 'mac_mini',
            automatic
          }
        })
      });
    }

    return jsonResponse({
      ok: true,
      status: 'PENDING_MAC_MINI',
      duplicate: !!(Array.isArray(existingRequests) && existingRequests[0]),
      automatic,
      notification,
      readiness,
      validation
    }, 202);
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({
      error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'PUBLICATION_CHECK_FAILED'),
      detail: error.detail || undefined
    }, invalidBody ? 400 : (error.status || 503));
  }
}
