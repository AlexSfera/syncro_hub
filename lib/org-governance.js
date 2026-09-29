const entries = [
  ['F&B Manager',                 'F&B',            'fb',       3, 80, true],
  ['Jefe de Cocina',              'Cocina',         'chef',     2, 70, true],
  ['Segundo Jefe de Cocina',      'Cocina',         'chef',     2, 60, true],
  ['Cocinero',                     'Cocina',         'empleado', 1, 10, false],
  ['Cocinera',                     'Cocina',         'empleado', 1, 10, false],
  ['Ayudante de cocina',           'Cocina',         'empleado', 1, 10, false],
  ['Freelancer',                   'Cocina',         'empleado', 1, 10, false],
  ['Jefe de Sala',                 'Sala',           'supervisor', 2, 70, true],
  ['Jefe de Sector',               'Sala',           'supervisor', 2, 60, true],
  ['Camarero',                     'Sala',           'empleado', 1, 10, false],
  ['Camarera',                     'Sala',           'empleado', 1, 10, false],
  ['Ayudante camarero',            'Sala',           'empleado', 1, 10, false],
  ['Ayudante camarera',            'Sala',           'empleado', 1, 10, false],
  ['Jefe de Recepción',            'Recepción',      'jefe_recepcion', 2, 70, true],
  ['Subjefe de Recepción',         'Recepción',      'jefe_recepcion', 2, 60, true],
  ['Recepcionista',                'Recepción',      'empleado', 1, 10, false],
  ['Ayudante de Recepción',        'Recepción',      'empleado', 1, 10, false],
  ['Auditor de Noche',             'Recepción',      'empleado', 1, 10, false],
  ['Gobernanta',                   'Housekeeping',   'gobernante', 2, 70, true],
  ['Subgobernanta',                'Housekeeping',   'subgobernante', 2, 60, true],
  ['Camarera de pisos',            'Housekeeping',   'empleado', 1, 10, false],
  ['Ayudante camarera de pisos',   'Housekeeping',   'empleado', 1, 10, false],
  ['Jefe de Mantenimiento',        'Mantenimiento',  'jefe_mantenimiento', 2, 70, true],
  ['Técnico',                      'Mantenimiento',  'empleado', 1, 10, false],
  ['Club Manager',                 'SYNCROLAB',      'jefe',     3, 80, true],
  ['Coordinador(a) de Atención al Cliente', 'SYNCROLAB', 'coord_recepcion_syncrolab', 2, 60, true],
  ['Coordinador(a) de Entrenadores',        'SYNCROLAB', 'coord_entrenadores', 2, 60, true],
  ['Coordinador(a) de Fisioterapeutas',     'SYNCROLAB', 'coord_fisioterapeutas', 2, 60, true],
  ['Atención al Cliente',          'SYNCROLAB',      'empleado', 1, 10, false],
  ['Entrenador(a)',                'SYNCROLAB',      'empleado', 1, 10, false],
  ['Fisioterapeuta',               'SYNCROLAB',      'empleado', 1, 10, false],
  ['Administrador',                'Administración', 'admin',    5, 100, true],
  ['Adjunto Directivo',            'Administración', 'adjunto',  4, 90, true],
  ['Contable',                     'Administración', 'contable', 1, 20, false],
  ['Técnico de Recursos Humanos',  'Administración', 'tecnico_rrhh', 2, 70, true]
];

export const POSITION_GOVERNANCE = Object.freeze(Object.fromEntries(entries.map(entry => {
  const [position, area, role, accessLevel, rank, canValidate] = entry;
  return [position, Object.freeze({ area, role, accessLevel, rank, canValidate, legacy: false })];
})));

// Compatibilidad de lectura/edición para fichas históricas. Estos puestos ya no
// se ofrecen al crear empleados nuevos y no pueden asignarse a otra persona.
const LEGACY_POSITION_GOVERNANCE = Object.freeze({
  Friegue: Object.freeze({ area: 'Cocina', role: 'empleado', accessLevel: 1, rank: 10, canValidate: false, legacy: true }),
  'Camarero de pisos': Object.freeze({ area: 'Housekeeping', role: 'empleado', accessLevel: 1, rank: 10, canValidate: false, legacy: true }),
  'Ayudante camarero de pisos': Object.freeze({ area: 'Housekeeping', role: 'empleado', accessLevel: 1, rank: 10, canValidate: false, legacy: true }),
  'Lavandería': Object.freeze({ area: 'Housekeeping', role: 'empleado', accessLevel: 1, rank: 10, canValidate: false, legacy: true })
});

const ROLE_RANK = Object.freeze({
  admin: 100,
  adjunto: 90,
  adjunto_directivo: 90,
  fb: 80,
  jefe: 60,
  tecnico_rrhh: 70,
  supervisor: 60,
  chef: 60,
  jefe_recepcion: 60,
  gobernante: 60,
  subgobernante: 60,
  jefe_mantenimiento: 60,
  coord_recepcion_syncrolab: 60,
  coord_entrenadores: 60,
  coord_fisioterapeutas: 60,
  contable: 20,
  empleado: 10
});

export function governanceForPosition(position, options = {}) {
  const normalized = String(position || '').trim();
  if (POSITION_GOVERNANCE[normalized]) return POSITION_GOVERNANCE[normalized];
  if (options.allowLegacy === true && LEGACY_POSITION_GOVERNANCE[normalized]) {
    return LEGACY_POSITION_GOVERNANCE[normalized];
  }
  return null;
}

export function canonicalizeEmployeeProfile(profile, options = {}) {
  if (!profile || typeof profile !== 'object') return profile;
  const governance = governanceForPosition(profile.puesto, {
    allowLegacy: options.allowLegacy !== false
  });
  if (!governance) return { ...profile };
  const storedRole = String(profile.rol || '').trim();
  const protectedLeadershipMismatch = governance.rank >= 90 && storedRole
    && !(governance.role === 'admin' && storedRole === 'admin')
    && !(governance.role === 'adjunto'
      && (storedRole === 'adjunto' || storedRole === 'adjunto_directivo'));
  return {
    ...profile,
    area: governance.area,
    rol: protectedLeadershipMismatch ? storedRole : governance.role,
    validador: protectedLeadershipMismatch
      ? Number(profile.validador) || 0
      : (governance.canValidate ? 1 : 0)
  };
}

export function positionRank(profile) {
  if (!profile) return 0;
  const governance = governanceForPosition(profile.puesto, { allowLegacy: true });
  const storedRole = String(profile.rol || '').trim();
  if (governance) {
    if (governance.rank === 100 && storedRole && storedRole !== 'admin') {
      return ROLE_RANK[storedRole] || 0;
    }
    if (governance.rank === 90 && storedRole
        && storedRole !== 'adjunto' && storedRole !== 'adjunto_directivo') {
      return ROLE_RANK[storedRole] || 0;
    }
    return governance.rank;
  }
  return ROLE_RANK[storedRole] || 0;
}

export function isClubManagerProfile(profile) {
  return String(profile && profile.puesto || '').trim() === 'Club Manager';
}

export function isFnbManagerProfile(profile) {
  return String(profile && profile.puesto || '').trim() === 'F&B Manager'
    || String(profile && profile.rol || '').trim() === 'fb';
}

export function isLeadershipProfile(profile) {
  return positionRank(profile) >= 60;
}
