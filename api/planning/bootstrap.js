import {
  jsonResponse,
  requireAuthEnabled,
  requireMethod
} from '../../lib/auth-server.js';
import {
  loadPlanningBootstrap,
  planningError,
  requirePlanningActor
} from '../../lib/planning-server.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  const wrongMethod = requireMethod(req, 'GET');
  if (wrongMethod) return wrongMethod;

  try {
    const session = await requirePlanningActor(req);
    const url = new URL(req.url);
    const weekStart = url.searchParams.get('week_start');
    const department = String(url.searchParams.get('department') || '').trim();
    if (!weekStart || !department || department.length > 120) {
      throw planningError('INVALID_REQUEST', 400);
    }
    const data = await loadPlanningBootstrap({
      actor: session.profile,
      weekStart,
      department
    });
    return jsonResponse({ ok: true, ...data });
  } catch (error) {
    return jsonResponse({
      error: error.code || 'PLANNING_BOOTSTRAP_FAILED',
      detail: error.detail || undefined
    }, error.status || 503);
  }
}
