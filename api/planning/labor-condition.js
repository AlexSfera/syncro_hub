import {
  adminRequest,
  jsonResponse,
  readJson,
  requireAuthEnabled,
  requireMethod,
  requireSameOrigin
} from '../../lib/auth-server.js';
import { planningCapabilities } from '../../lib/planning-domain.js';
import { planningError, requirePlanningActor } from '../../lib/planning-server.js';

export const config = { runtime: 'edge' };

function nullableInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN;
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
    const capabilities = planningCapabilities(session.profile, process.env.ANGELICA_EMPLOYEE_ID || '');
    if (!capabilities.canManageLaborConditions) throw planningError('FORBIDDEN', 403);
    const body = await readJson(req, 16384);
    const employeeId = String(body.employee_id || '').trim();
    const conventionVersionId = String(body.convention_version_id || '').trim();
    const effectiveFrom = String(body.effective_from || '').trim();
    const contractStart = String(body.contract_start || '').trim();
    const contractEnd = body.contract_end ? String(body.contract_end).trim() : null;
    const percentage = Number(body.work_percentage);
    const weeklyMinutes = nullableInteger(body.weekly_minutes);
    const annualMinutes = nullableInteger(body.annual_minutes);
    const calendarId = body.calendar_id ? String(body.calendar_id).trim() : null;
    const betterCondition = body.better_condition ? String(body.better_condition).trim() : null;
    const reason = String(body.reason || '').trim();
    if (!employeeId || !conventionVersionId
        || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
        || !/^\d{4}-\d{2}-\d{2}$/.test(contractStart)
        || (contractEnd && !/^\d{4}-\d{2}-\d{2}$/.test(contractEnd))
        || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100
        || Number.isNaN(weeklyMinutes) || Number.isNaN(annualMinutes)
        || !reason || reason.length > 1000
        || (betterCondition && betterCondition.length > 500)) {
      throw planningError('INVALID_REQUEST', 400);
    }
    const saved = await adminRequest('rpc/planificacion_guardar_condicion_laboral', {
      method: 'POST',
      body: JSON.stringify({
        p_empleado_id: employeeId,
        p_convenio_version_id: conventionVersionId,
        p_vigente_desde: effectiveFrom,
        p_fecha_inicio_contrato: contractStart,
        p_fecha_fin_contrato: contractEnd,
        p_porcentaje_jornada: percentage,
        p_minutos_semanales: weeklyMinutes,
        p_minutos_anuales: annualMinutes,
        p_centro_calendario_id: calendarId,
        p_condicion_mas_beneficiosa: betterCondition,
        p_actor: session.profile.id,
        p_motivo: reason
      })
    });
    return jsonResponse({ ok: true, saved });
  } catch (error) {
    const invalidBody = error && (error.message === 'INVALID_JSON' || error.message === 'REQUEST_TOO_LARGE');
    return jsonResponse({ error: invalidBody ? 'INVALID_REQUEST' : (error.code || 'LABOR_CONDITION_SAVE_FAILED') },
      invalidBody ? 400 : (error.status || 503));
  }
}
