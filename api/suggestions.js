import { adminRequest, jsonResponse, readJson, requireAuthEnabled, requireSameOrigin } from '../lib/auth-server.js';
import { loadManagementActor, isAdminProfile } from '../lib/authz-server.js';
import { canReadSuggestion, suggestionDraft, suggestionMove, suggestionProjection, SUGGESTION_FIELDS } from '../lib/suggestions.js';

export const config = { runtime: 'edge' };
const reply = (body, status = 200, headers = {}) => jsonResponse(body, status, { Vary: 'Authorization, Cookie', ...headers });

export default async function handler(req) {
  const disabled = requireAuthEnabled(); if (disabled) return disabled;
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return reply({ error: 'Método no permitido.' }, 405, { Allow: 'GET, POST, PATCH' });
  if (new URL(req.url).search) return reply({ error: 'El acceso se determina por tu perfil.' }, 400);
  if (req.method !== 'GET') { const crossOrigin = requireSameOrigin(req); if (crossOrigin) return crossOrigin; }
  let actor;
  try { actor = await loadManagementActor(req); } catch (_) { return reply({ error: 'No se pudo comprobar la sesión.' }, 503); }
  if (!actor) return reply({ error: 'Inicia sesión para consultar tus propuestas.' }, 401);
  if (req.method === 'PATCH' && !isAdminProfile(actor.profile)) return reply({ error: 'Solo el administrador puede priorizar y cambiar estados.' }, 403);
  try {
    if (req.method === 'GET') {
      const records = [];
      for (let offset = 0; offset <= 100000; offset += 1000) {
        const page = await adminRequest('employee_notes?select=' + SUGGESTION_FIELDS + '&order=created_at.asc,id.asc&limit=1000&offset=' + offset);
        if (!Array.isArray(page)) throw new Error('INVALID_BOARD_RESPONSE');
        records.push(...page.filter(note => canReadSuggestion(actor.profile, note)).map(suggestionProjection));
        if (page.length < 1000) return reply({ records, permissions: { can_manage: isAdminProfile(actor.profile) } });
      }
      throw new Error('BOARD_TOO_LARGE');
    }
    const body = await readJson(req, 24000);
    if (req.method === 'POST') {
      const draft = suggestionDraft(body, actor.profile);
      if (!draft) return reply({ error: 'Revisa el título, la descripción y el módulo.' }, 400);
      const saved = await adminRequest('employee_notes?select=' + SUGGESTION_FIELDS, {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(draft)
      });
      if (!Array.isArray(saved) || saved.length !== 1 || saved[0].id !== draft.id) throw new Error('SAVE_NOT_CONFIRMED');
      return reply({ record: suggestionProjection(saved[0]) }, 201);
    }
    const move = suggestionMove(body);
    if (!move) return reply({ error: body && body.estado === 'rechazado' ? 'Indica el motivo del rechazo (entre 3 y 2000 caracteres).' : 'El movimiento no es válido.' }, 400);
    const saved = await adminRequest('rpc/syncro_move_suggestion', { method: 'POST', body: JSON.stringify({ ...move, p_actor: actor.profile.id }) });
    if (saved && saved.error) {
      const status = { CONFLICT: 409, NOT_FOUND: 404, INVALID_ANCHOR: 409, FORBIDDEN: 403, INVALID_REQUEST: 400 }[saved.error] || 503;
      return reply({ error: status === 409 ? 'Otra persona ha actualizado el tablero. Recarga y vuelve a intentarlo.' : 'No se pudo realizar el movimiento.' }, status);
    }
    if (!saved || !saved.record || saved.record.id !== move.p_id) throw new Error('MOVE_NOT_CONFIRMED');
    return reply({ record: suggestionProjection(saved.record) });
  } catch (error) {
    if (['INVALID_JSON', 'REQUEST_TOO_LARGE'].includes(error.message)) return reply({ error: 'La propuesta no es válida o es demasiado larga.' }, 400);
    return reply({ error: 'No se pudo guardar o consultar el tablero. Tus cambios no se han confirmado; vuelve a intentarlo.' }, 503);
  }
}
