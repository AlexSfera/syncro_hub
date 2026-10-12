import { isAdminProfile, isAdjuntoProfile, supervisorDepartments, effectiveDepartment } from './authz-server.js';

export const SUGGESTION_STATES = Object.freeze(['pendiente', 'en_desarrollo', 'terminado', 'rechazado']);
export const SUGGESTION_FIELDS = 'id,employee_id,nombre,area,categoria,texto,leida,created_at,titulo,modulo,estado,posicion,respuesta,version,updated_at';

export function canReadSuggestion(actor, note) {
  if (!actor || !note) return false;
  if (String(note.employee_id) === String(actor.id) || isAdminProfile(actor) || isAdjuntoProfile(actor)) return true;
  const departments = supervisorDepartments(actor);
  const area = String(note.area || '').trim().toLocaleLowerCase('es');
  return departments.includes('*') || departments.some(dept => dept.toLocaleLowerCase('es') === area);
}

export function suggestionProjection(note) {
  if (!SUGGESTION_STATES.includes(note.estado) || !Number.isInteger(note.version) || note.version < 1) {
    throw new Error('INVALID_BOARD_RECORD');
  }
  return Object.fromEntries(SUGGESTION_FIELDS.split(',').map(key => [key, note[key] ?? null]));
}

function text(value, min, max) {
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean.length >= min && clean.length <= max ? clean : null;
}

export function suggestionDraft(body, actor) {
  if (!body || Array.isArray(body) || typeof body !== 'object'
      || Object.keys(body).some(key => !['titulo', 'texto', 'modulo', 'categoria'].includes(key))) return null;
  const titulo = text(body.titulo, 3, 160), texto = text(body.texto, 5, 5000), modulo = text(body.modulo || '', 0, 120);
  const categoria = body.categoria || 'Mejora';
  if (!titulo || !texto || modulo === null || !['Sugerencia', 'Queja', 'Mejora'].includes(categoria)) return null;
  return {
    id: crypto.randomUUID(), employee_id: actor.id, nombre: actor.nombre,
    area: effectiveDepartment(actor), categoria, titulo, texto, modulo,
    leida: false, estado: 'pendiente', posicion: null, respuesta: '', version: 1
  };
}

export function suggestionMove(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object'
      || Object.keys(body).some(key => !['id', 'estado', 'before_id', 'respuesta', 'expected_version'].includes(key))) return null;
  const id = text(body.id, 1, 128), before = body.before_id == null ? null : text(body.before_id, 1, 128);
  const respuesta = text(body.respuesta || '', body.estado === 'rechazado' ? 3 : 0, 2000);
  if (!id || !/^[A-Za-z0-9._:-]+$/.test(id) || (before !== null && !/^[A-Za-z0-9._:-]+$/.test(before))
      || before === id || (body.before_id != null && !before) || respuesta === null
      || !SUGGESTION_STATES.includes(body.estado) || !Number.isInteger(body.expected_version) || body.expected_version < 1) return null;
  return { p_id: id, p_estado: body.estado, p_before_id: before, p_respuesta: respuesta, p_expected_version: body.expected_version };
}
