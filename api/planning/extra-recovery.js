import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../../lib/auth-server.js';
import {
  planningCapabilities,
  validateExtraRecoveryAction
} from '../../lib/planning-domain.js';
import { isLeadershipProfile } from '../../lib/org-governance.js';
import { targetIsInScope } from '../../lib/authz-server.js';
import { planningError, requirePlanningActor } from '../../lib/planning-server.js';

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
    const employeeId = String(body.employee_id || '').trim();
    const date = String(body.date || '').trim();
    const type = String(body.type || '').trim();
    const minutes = Number(body.minutes);
    const reason = String(body.reason || '').trim();
    const approve = body.approve === true;
    if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(date)
        || !new Set(['extra', 'recuperacion']).has(type)
        || !Number.isInteger(minutes) || minutes <= 0 || minutes > 1440
        || !reason || reason.length > 1000) {
      throw planningError('INVALID_REQUEST', 400);
    }

    const rows = await adminRequest(
      'employees?id=eq.' + encodeURIComponent(employeeId)
        + '&select=id,nombre,area,puesto,rol,estado,validador&limit=1'
    );
    const target = Array.isArray(rows) && rows[0];
    if (!target) throw planningError('EMPLOYEE_NOT_FOUND', 404);
    const capabilities = planningCapabilities(session.profile, process.env.ANGELICA_EMPLOYEE_ID || '');
    if (!capabilities.canEditGlobally && !targetIsInScope(session.profile, target)) {
      throw planningError('FORBIDDEN', 403);
    }
    const action = validateExtraRecoveryAction({
      actor: session.profile,
      target,
      approver: approve ? session.profile : null,
      targetIsManager: isLeadershipProfile(target),
      angelicaEmployeeId: process.env.ANGELICA_EMPLOYEE_ID || ''
    });
    if (!action.valid) return jsonResponse({ error: 'EXTRA_RECOVERY_FORBIDDEN', reasons: action.errors }, 403);

    const saved = await adminRequest('rpc/planificacion_guardar_extra_recuperacion', {
      method: 'POST',
      body: JSON.stringify({
        p_empleado_id: employeeId,
        p_fecha: date,
        p_tipo: type,
        p_minutos: minutes,
        p_actor: session.profile.id,
        p_aprobador: approve ? session.profile.id : null,
        p_motivo: reason
      })
    });
    return jsonResponse({ ok: true, saved });
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({ error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'EXTRA_RECOVERY_SAVE_FAILED') },
      invalidBody ? 400 : (error.status || 503));
  }
}
