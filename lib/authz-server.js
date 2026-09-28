import {
  getBearerToken,
  sessionProfile
} from './auth-server.js';
import {
  canonicalizeEmployeeProfile,
  governanceForPosition,
  isClubManagerProfile,
  isFnbManagerProfile,
  isLeadershipProfile,
  positionRank
} from './org-governance.js';

const SUPERVISOR_DEPT_MAP = Object.freeze({
  chef: ['Cocina', 'Friegue'],
  fb: ['Sala', 'Cocina', 'Friegue', 'FnB', 'Food & Beverage'],
  jefe_recepcion: ['Recepción', 'Recepción SFERA'],
  gobernante: ['Housekeeping', 'Limpieza'],
  subgobernante: ['Housekeeping', 'Limpieza'],
  jefe_mantenimiento: ['Mantenimiento'],
  coord_recepcion_syncrolab: ['Recepción SYNCROLAB'],
  coord_entrenadores: ['Entrenadores'],
  coord_fisioterapeutas: ['Fisioterapeutas', 'Clínica'],
  adjunto_directivo: ['*'],
  adjunto: ['*']
});

const AREA_GROUPS = Object.freeze({
  'F&B': ['Sala', 'Cocina', 'Friegue', 'FnB', 'Food & Beverage'],
  'Food & Beverage': ['Sala', 'Cocina', 'Friegue', 'FnB', 'Food & Beverage'],
  Cocina: ['Cocina', 'Friegue'],
  Sala: ['Sala'],
  'Recepción': ['Recepción', 'Recepción SFERA'],
  Housekeeping: ['Housekeeping', 'Limpieza'],
  Limpieza: ['Housekeeping', 'Limpieza'],
  SYNCROLAB: ['SYNCROLAB', 'SyncroLab', 'Recepción SYNCROLAB', 'Entrenadores', 'Fisioterapeutas', 'Clínica'],
  'Recepción SYNCROLAB': ['SYNCROLAB', 'SyncroLab', 'Recepción SYNCROLAB', 'Entrenadores', 'Fisioterapeutas', 'Clínica'],
  Mantenimiento: ['Mantenimiento'],
  Economato: ['Economato'],
  'Administración': ['Administración']
});

const SYNCROLAB_TRAINER_POSITIONS = new Set([
  'Entrenador(a)', 'Coordinador(a) de Entrenadores'
]);

const SYNCROLAB_PHYSIO_POSITIONS = new Set([
  'Fisioterapeuta', 'Coordinador(a) de Fisioterapeutas'
]);

const CREATABLE_ROLES = new Set([
  'empleado', 'jefe', 'supervisor', 'chef', 'jefe_recepcion',
  'gobernante', 'subgobernante', 'jefe_mantenimiento',
  'coord_recepcion_syncrolab', 'coord_entrenadores', 'coord_fisioterapeutas',
  'fb', 'adjunto', 'adjunto_directivo', 'admin', 'contable'
]);

function cleanText(value, maxLength, required = false) {
  if (typeof value !== 'string') return required ? null : '';
  const clean = value.trim();
  if ((required && !clean) || clean.length > maxLength) return null;
  return clean;
}

export function normalizeDepartment(value) {
  return String(value || '').trim().toLocaleLowerCase('es');
}

export function isAdminProfile(profile) {
  return !!profile && profile.rol === 'admin';
}

export function isAdjuntoProfile(profile) {
  return !!profile && (profile.rol === 'adjunto' || profile.rol === 'adjunto_directivo');
}

export function effectiveDepartment(profile) {
  if (!profile) return '';
  const canonical = canonicalizeEmployeeProfile(profile);
  const area = String(canonical.area || '').trim();
  if (isClubManagerProfile(canonical)) return 'SYNCROLAB';
  if (!/^syncro\s*lab$/i.test(area)) return area;
  if (canonical.rol === 'coord_entrenadores'
      || SYNCROLAB_TRAINER_POSITIONS.has(canonical.puesto)) {
    return 'Entrenadores';
  }
  if (canonical.rol === 'coord_fisioterapeutas'
      || SYNCROLAB_PHYSIO_POSITIONS.has(canonical.puesto)) {
    return 'Fisioterapeutas';
  }
  return 'Recepción SYNCROLAB';
}

export function supervisorDepartments(profile) {
  if (!profile) return [];
  const canonical = canonicalizeEmployeeProfile(profile);
  if (isAdminProfile(canonical)) return ['*'];
  if (isClubManagerProfile(canonical)) return AREA_GROUPS.SYNCROLAB;
  if (isFnbManagerProfile(canonical)) return AREA_GROUPS['F&B'];
  if (isLeadershipProfile(canonical)) {
    const department = effectiveDepartment(canonical);
    if (department === 'Entrenadores') {
      return SUPERVISOR_DEPT_MAP.coord_entrenadores;
    }
    if (department === 'Recepción SYNCROLAB') {
      return SUPERVISOR_DEPT_MAP.coord_recepcion_syncrolab;
    }
    if (department === 'Fisioterapeutas') {
      return SUPERVISOR_DEPT_MAP.coord_fisioterapeutas;
    }
    return AREA_GROUPS[department] || (department ? [department] : []);
  }
  return SUPERVISOR_DEPT_MAP[canonical.rol] || [];
}

export function targetIsInScope(actor, target) {
  const departments = supervisorDepartments(actor);
  if (departments.includes('*')) return true;
  const targetDepartment = normalizeDepartment(effectiveDepartment(canonicalizeEmployeeProfile(target)));
  return !!targetDepartment
    && departments.some(dept => normalizeDepartment(dept) === targetDepartment);
}

function canManageLowerProfile(actor, target) {
  if (!actor || !target) return false;
  const canonicalActor = canonicalizeEmployeeProfile(actor);
  const canonicalTarget = canonicalizeEmployeeProfile(target);
  if (isAdminProfile(canonicalActor)) return true;
  if (isAdminProfile(canonicalTarget)) return false;
  if (isAdjuntoProfile(canonicalActor)) {
    return positionRank(canonicalTarget) < positionRank(canonicalActor);
  }
  return isLeadershipProfile(canonicalActor)
    && targetIsInScope(canonicalActor, canonicalTarget)
    && positionRank(canonicalTarget) < positionRank(canonicalActor);
}

export function canCreateEmployee(actor, target) {
  if (!actor || !target) return false;
  const canonicalTarget = canonicalizeEmployeeProfile(target);
  if (!CREATABLE_ROLES.has(canonicalTarget.rol)) return false;
  return canManageLowerProfile(actor, canonicalTarget);
}

export function canResetEmployeePin(actor, target) {
  return canManageLowerProfile(actor, target);
}

export function canEditEmployee(actor, target) {
  return canManageLowerProfile(actor, target);
}

export function canUpdateEmployee(actor, currentTarget, proposedTarget) {
  if (!canEditEmployee(actor, currentTarget)) return false;
  if (!canCreateEmployee(actor, proposedTarget)) return false;
  const trustedGovernance = governanceForPosition(proposedTarget && proposedTarget.puesto, {
    allowLegacy: !!currentTarget && currentTarget.puesto === proposedTarget.puesto
  });
  if (!trustedGovernance && !isAdminProfile(actor) && !isAdjuntoProfile(actor)
      && Number(proposedTarget.validador) !== Number(currentTarget.validador)) {
    return false;
  }
  return true;
}

export function canDeleteEmployee(actor, target) {
  return isAdminProfile(actor) && !!target
    && target.estado === 'Baja' && actor.id !== target.id;
}

export function normalizeEmployeeDraft(body, options = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const nombre = cleanText(body.nombre, 160, true);
  const puesto = cleanText(body.puesto, 120, true);
  const allowLegacy = !!options.allowLegacyPosition
    && String(options.allowLegacyPosition).trim() === puesto;
  const governance = governanceForPosition(puesto, { allowLegacy });
  const area = governance && governance.area;
  const existing = options.existingProfile;
  const preserveProtectedRole = !!existing && governance && governance.rank >= 90
    && String(existing.puesto || '').trim() === puesto
    && String(existing.rol || '').trim() !== governance.role;
  const rol = preserveProtectedRole ? String(existing.rol || '').trim() : (governance && governance.role);
  const email = cleanText(body.email, 320, false);
  const obs = cleanText(body.obs, 2000, false);
  const estado = cleanText(body.estado, 20, true);
  const coste = Number(body.coste);
  if (!nombre || !puesto || !area || !rol || !CREATABLE_ROLES.has(rol)) return null;
  if (email === null || obs === null || !new Set(['Activo', 'Baja', 'Vacaciones']).has(estado)) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!Number.isFinite(coste) || coste < 0 || coste > 10000) return null;
  return {
    nombre,
    puesto,
    area,
    rol,
    email,
    obs,
    estado,
    coste,
    responsable: body.responsable === 1 || body.responsable === true ? 1 : 0,
    validador: preserveProtectedRole
      ? (Number(existing.validador) || 0)
      : (governance.canValidate ? 1 : 0)
  };
}

export async function loadManagementActor(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = await sessionProfile(token);
  if (!session || session.forcePinChange) return null;
  return { token, profile: session.profile };
}
