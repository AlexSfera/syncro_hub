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
  withinAbsenceCorrectionWindow
} from '../../lib/planning-domain.js';
import {
  planningError,
  requirePlanningActor
} from '../../lib/planning-server.js';
import { targetIsInScope } from '../../lib/authz-server.js';

export const config = { runtime: 'edge' };

function todayMadrid() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  const wrongMethod = requireMethod(req, 'POST');
  if (wrongMethod) return wrongMethod;
  const crossOrigin = requireSameOrigin(req);
  if (crossOrigin) return crossOrigin;

  try {
    const session = await requirePlanningActor(req);
    const body = await readJson(req, 16384);
    const employeeId = String(body.employee_id || '').trim();
    const startDate = String(body.start_date || '').trim();
    const endDate = String(body.end_date || '').trim();
    const absenceType = String(body.absence_type || '').trim();
    const publicLabel = String(body.public_label || '').trim();
    const reason = String(body.reason || '').trim();
    const previousId = body.previous_id == null ? null : Number(body.previous_id);
    if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
        || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate
        || !absenceType || absenceType.length > 80 || !publicLabel || publicLabel.length > 120
        || !reason || reason.length > 1000
        || (previousId !== null && (!Number.isInteger(previousId) || previousId <= 0))) {
      throw planningError('INVALID_REQUEST', 400);
    }

    const rows = await adminRequest(
      'employees?id=eq.' + encodeURIComponent(employeeId)
        + '&select=id,nombre,area,puesto,rol,estado,validador&limit=1'
    );
    const target = Array.isArray(rows) && rows[0];
    if (!target) throw planningError('EMPLOYEE_NOT_FOUND', 404);
    const capabilities = planningCapabilities(session.profile, process.env.ANGELICA_EMPLOYEE_ID || '');
    const inScope = capabilities.canEditGlobally || targetIsInScope(session.profile, target);
    if (!inScope || (!capabilities.canEditGlobally && String(session.profile.id) === employeeId)) {
      throw planningError('FORBIDDEN', 403);
    }
    if (startDate < todayMadrid()
        && !capabilities.canCorrectWorkedShift
        && !withinAbsenceCorrectionWindow(startDate, todayMadrid())) {
      throw planningError('ABSENCE_CORRECTION_WINDOW_EXPIRED', 403);
    }

    const saved = await adminRequest('rpc/planificacion_guardar_ausencia', {
      method: 'POST',
      body: JSON.stringify({
        p_empleado_id: employeeId,
        p_fecha_inicio: startDate,
        p_fecha_fin: endDate,
        p_tipo_ausencia_id: absenceType,
        p_etiqueta_publica: publicLabel,
        p_actor: session.profile.id,
        p_motivo: reason,
        p_reemplaza_ausencia_id: previousId
      })
    });
    return jsonResponse({ ok: true, saved });
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({ error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'ABSENCE_SAVE_FAILED') },
      invalidBody ? 400 : (error.status || 503));
  }
}
