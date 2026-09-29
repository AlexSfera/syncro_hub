const DAY_MS = 24 * 60 * 60 * 1000;

export const NO_DATA = '[NO DATA]';

export const PLANNING_STATES = Object.freeze([
  'borrador',
  'validando',
  'listo_para_publicar',
  'publicando_bitrix',
  'publicacion_parcial',
  'publicado_bitrix',
  'error_publicacion',
  'rectificacion_pendiente',
  'rectificando_bitrix',
  'rectificado_bitrix'
]);

export const DAY_TYPES = Object.freeze([
  'turno', 'descanso', 'festivo', 'ausencia', 'vacaciones'
]);

export const CONVENTION_RULES = Object.freeze({
  hosteleria_alicante: Object.freeze({
    annualDays: 31,
    unit: 'natural'
  }),
  instalaciones_deportivas_estatal: Object.freeze({
    annualDays: 23,
    unit: 'laborable'
  })
});

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(ymd, days) {
  const date = dateOnly(ymd);
  if (!date || !Number.isInteger(days)) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function mondayOfWeek(ymd) {
  const date = dateOnly(ymd);
  if (!date) return null;
  const isoDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - isoDay + 1);
  return date.toISOString().slice(0, 10);
}

export function weekDates(weekStart) {
  if (mondayOfWeek(weekStart) !== weekStart) return [];
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function calendarDaysInclusive(startYmd, endYmd) {
  const start = dateOnly(startYmd);
  const end = dateOnly(endYmd);
  if (!start || !end || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function calculateVacationEntitlement({ conventionId, year, contractStart, contractEnd = null }) {
  const rules = CONVENTION_RULES[conventionId];
  const numericYear = Number(year);
  const start = dateOnly(contractStart);
  if (!rules || !Number.isInteger(numericYear) || !start) return NO_DATA;

  const yearStart = dateOnly(`${numericYear}-01-01`);
  const yearEnd = dateOnly(`${numericYear}-12-31`);
  let activeStart = start > yearStart ? start : yearStart;
  let activeEnd = yearEnd;
  if (contractEnd) {
    const parsedEnd = dateOnly(contractEnd);
    if (!parsedEnd) return NO_DATA;
    activeEnd = parsedEnd < yearEnd ? parsedEnd : yearEnd;
  }
  if (activeEnd < activeStart) return 0;

  const activeDays = Math.floor((activeEnd.getTime() - activeStart.getTime()) / DAY_MS) + 1;
  const daysInYear = calendarDaysInclusive(`${numericYear}-01-01`, `${numericYear}-12-31`);
  return Math.round((rules.annualDays * activeDays / daysInYear) * 100) / 100;
}

export function calculateVacationConsumption({ conventionId, startDate, endDate, workingDates }) {
  const rules = CONVENTION_RULES[conventionId];
  const totalCalendarDays = calendarDaysInclusive(startDate, endDate);
  if (!rules || totalCalendarDays === null) return NO_DATA;
  if (rules.unit === 'natural') return totalCalendarDays;
  if (!Array.isArray(workingDates)) return NO_DATA;
  const unique = new Set(workingDates.filter(date => {
    const parsed = dateOnly(date);
    return parsed && date >= startDate && date <= endDate;
  }));
  return unique.size;
}

function normalizedIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function calculateSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 8) {
    return { valid: false, minutes: null, errors: ['TRAMOS_REQUERIDOS'] };
  }
  const normalized = [];
  const errors = [];
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index] || {};
    const startIso = normalizedIso(segment.inicio);
    const endIso = normalizedIso(segment.fin);
    if (!startIso || !endIso || endIso <= startIso) {
      errors.push(`TRAMO_INVALIDO_${index + 1}`);
      continue;
    }
    normalized.push({
      orden: index + 1,
      inicio: startIso,
      fin: endIso,
      bitrix_shift_id: segment.bitrix_shift_id ? String(segment.bitrix_shift_id) : null
    });
  }
  normalized.sort((a, b) => a.inicio.localeCompare(b.inicio));
  for (let index = 1; index < normalized.length; index++) {
    if (normalized[index].inicio < normalized[index - 1].fin) {
      errors.push('TRAMOS_SOLAPADOS');
    }
  }
  const minutes = normalized.reduce((total, segment) => {
    return total + Math.round((new Date(segment.fin) - new Date(segment.inicio)) / 60000);
  }, 0);
  if (minutes <= 0 || minutes > 1440) errors.push('DURACION_DIARIA_INVALIDA');
  return { valid: errors.length === 0, minutes, segments: normalized, errors };
}

export function withinAbsenceCorrectionWindow(targetDate, todayYmd) {
  const target = dateOnly(targetDate);
  const today = dateOnly(todayYmd);
  if (!target || !today || target > today) return false;
  const difference = Math.floor((today.getTime() - target.getTime()) / DAY_MS);
  return difference <= 28;
}

export function planningCapabilities(actor, angelicaEmployeeId = '') {
  const role = String(actor && actor.rol || '').trim();
  const isAdmin = role === 'admin';
  const isAdjunto = role === 'adjunto' || role === 'adjunto_directivo';
  const isHr = role === 'tecnico_rrhh';
  const isManager = isAdmin || isAdjunto || isHr || Number(actor && actor.validador) === 1;
  return {
    canViewPublished: !!actor,
    canViewDraftsGlobally: isAdmin || isAdjunto || isHr,
    canEditGlobally: isAdmin || isAdjunto || isHr,
    canCorrectWorkedShift: isAdmin || isAdjunto || isHr,
    canManageLaborConditions: isAdmin || isAdjunto || isHr,
    canManageTeam: isManager,
    isAngelica: !!actor && !!angelicaEmployeeId && String(actor.id) === String(angelicaEmployeeId)
  };
}

function normalizeDepartment(value) {
  return String(value || '').trim().toLocaleLowerCase('es');
}

const DEPARTMENT_AREAS = Object.freeze({
  cocina: ['cocina', 'friegue'],
  sala: ['sala'],
  housekeeping: ['housekeeping', 'limpieza'],
  mantenimiento: ['mantenimiento'],
  'recepción': ['recepción', 'recepción sfera'],
  'recepción syncrolab': ['recepción syncrolab'],
  fisioterapeutas: ['fisioterapeutas', 'fisioterapia'],
  entrenadores: ['entrenadores', 'entrenamiento'],
  'rrhh': ['rrhh', 'recursos humanos'],
  comercial: ['comercial'],
  marketing: ['marketing'],
  'dirección comercial': ['dirección comercial'],
  'c&c': ['c&c', 'contabilidad', 'contabilidad y control']
});

export function employeeBelongsToPlanningDepartment(employee, department) {
  const normalizedDepartment = normalizeDepartment(department);
  const normalizedArea = normalizeDepartment(employee && employee.area);
  const acceptedAreas = DEPARTMENT_AREAS[normalizedDepartment] || [normalizedDepartment];
  return acceptedAreas.includes(normalizedArea);
}

export function canEditPlanningDepartment(actor, department, allowedDepartments = []) {
  const capabilities = planningCapabilities(actor);
  if (capabilities.canEditGlobally) return true;
  if (!capabilities.canManageTeam) return false;
  const target = normalizeDepartment(department);
  return allowedDepartments.some(item => item === '*' || normalizeDepartment(item) === target);
}

export function validateExtraRecoveryAction({ actor, target, approver, targetIsManager, angelicaEmployeeId }) {
  const errors = [];
  if (!actor || !target) errors.push('IDENTIDAD_INCOMPLETA');
  if (actor && target && String(actor.id) === String(target.id)) errors.push('AUTOASIGNACION_PROHIBIDA');
  if (approver && target && String(approver.id) === String(target.id)) errors.push('AUTOAPROBACION_PROHIBIDA');
  if (targetIsManager && (!actor || !angelicaEmployeeId || String(actor.id) !== String(angelicaEmployeeId))) {
    errors.push('JEFE_SOLO_GESTIONABLE_POR_ANGELICA');
  }
  return { valid: errors.length === 0, errors };
}

function assignmentKey(assignment) {
  return `${assignment.empleado_id || ''}|${assignment.fecha_operativa || ''}`;
}

export function validateWeekDraft({ weekStart, department, assignments, employees, catalog, conditions }) {
  const errors = [];
  const warnings = [];
  const dates = new Set(weekDates(weekStart));
  if (dates.size !== 7) errors.push({ code: 'SEMANA_INVALIDA' });
  if (!department) errors.push({ code: 'DEPARTAMENTO_REQUERIDO' });
  if (!Array.isArray(assignments)) errors.push({ code: 'ASIGNACIONES_INVALIDAS' });
  if (errors.length) return { valid: false, errors, warnings };

  const employeeMap = new Map((employees || []).map(employee => [String(employee.id), employee]));
  const catalogMap = new Map((catalog || []).map(shift => [String(shift.id), shift]));
  const conditionMap = new Map((conditions || []).map(condition => [String(condition.empleado_id), condition]));
  const seen = new Set();

  for (const assignment of assignments) {
    const key = assignmentKey(assignment);
    const context = { empleado_id: assignment.empleado_id, fecha: assignment.fecha_operativa };
    if (seen.has(key)) errors.push({ code: 'ASIGNACION_DUPLICADA', ...context });
    seen.add(key);
    if (!dates.has(assignment.fecha_operativa)) errors.push({ code: 'FECHA_FUERA_DE_SEMANA', ...context });
    if (!DAY_TYPES.includes(assignment.tipo_dia)) errors.push({ code: 'TIPO_DIA_INVALIDO', ...context });

    const employee = employeeMap.get(String(assignment.empleado_id));
    if (!employee || employee.estado !== 'Activo') {
      errors.push({ code: 'EMPLEADO_NO_ACTIVO', ...context });
      continue;
    }
    if (!employeeBelongsToPlanningDepartment(employee, department)) {
      errors.push({ code: 'EMPLEADO_OTRO_DEPARTAMENTO', ...context });
    }
    if (!conditionMap.has(String(assignment.empleado_id))) {
      warnings.push({ code: 'CONDICION_LABORAL_NO_DATA', ...context });
    }
    if (!employee.bitrix_user_id) errors.push({ code: 'BITRIX_USER_NO_DATA', ...context });

    if (assignment.tipo_dia === 'turno') {
      const shift = catalogMap.get(String(assignment.turno_catalogo_id));
      if (!shift || !shift.activo) errors.push({ code: 'TURNO_NO_DISPONIBLE', ...context });
      if (shift && normalizeDepartment(shift.departamento_id) !== normalizeDepartment(department)) {
        errors.push({ code: 'TURNO_OTRO_DEPARTAMENTO', ...context });
      }
      const segments = calculateSegments(assignment.tramos);
      for (const code of segments.errors) errors.push({ code, ...context });
      for (const segment of segments.segments || []) {
        const segmentShift = (catalog || []).find(item =>
          String(item.bitrix_shift_id) === String(segment.bitrix_shift_id)
          && String(item.bitrix_schedule_id) === String(shift && shift.bitrix_schedule_id)
        );
        if (!segment.bitrix_shift_id || !segmentShift || !segmentShift.activo) {
          errors.push({ code: 'TRAMO_TURNO_NO_DISPONIBLE', ...context });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function publicationReadiness({ validation, catalogFresh, bitrixWriteSupported, assignments }) {
  const blockers = [];
  if (!validation || !validation.valid) blockers.push('VALIDACION_PENDIENTE');
  if (!catalogFresh) blockers.push('CATALOGO_BITRIX_DESACTUALIZADO');
  if (!Array.isArray(assignments) || assignments.length === 0) blockers.push('SEMANA_SIN_ASIGNACIONES');
  if (!bitrixWriteSupported) blockers.push('BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO');
  return { ready: blockers.length === 0, blockers };
}
