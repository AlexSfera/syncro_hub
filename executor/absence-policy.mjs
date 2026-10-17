const DEFINITIONS = Object.freeze({
  descanso: { category: '15', label: 'Descanso' },
  vacaciones: { category: '13', label: 'Vacaciones' },
  festivo: { category: '15', label: 'Festivo' },
  ausencia: { category: '9', label: 'Ausencia' },
  baja_medica: { category: '5', label: 'Baja médica' },
  otras_ausencias: { category: '9', label: 'Otra ausencia' }
});

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLocaleLowerCase('es');
}

export function absenceDefinition(dayType) {
  if (dayType === 'turno') return null;
  if (dayType === 'recuperacion_festivo') throw new Error('RECOVERY_ORIGIN_MISSING');
  const definition = DEFINITIONS[dayType];
  if (!definition) throw new Error('UNSUPPORTED_ABSENCE_DAY_TYPE');
  return definition;
}

export function bitrixDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) throw new Error('INVALID_ABSENCE_DATE');
  return `${isoDate.slice(8, 10)}.${isoDate.slice(5, 7)}.${isoDate.slice(0, 4)}`;
}

function isoDate(bitrixValue) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(bitrixValue || ''));
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

export function parseAbsenceEntry({ userId, text, testId }) {
  const match = /^(.+?)\s+\((\d{2}\.\d{2}\.\d{4})\s+-\s+(\d{2}\.\d{2}\.\d{4})\)$/.exec(String(text || '').trim());
  if (!match || !/^\d+$/.test(String(userId || ''))) return null;
  return { userId: String(userId), label: match[1].trim(),
    start: isoDate(match[2]), end: isoDate(match[3]), testId: String(testId || '') };
}

export function classifyAbsence(assignment, entries) {
  const definition = absenceDefinition(assignment.day_type);
  const sameDay = (entries || []).filter(entry => entry
    && String(entry.userId) === String(assignment.bitrix_user_id)
    && entry.start <= assignment.date && assignment.date <= entry.end);
  if (!definition) return sameDay.length ? 'conflict' : 'clear';
  if (!sameDay.length) return 'missing';
  const expected = normalized(definition.label);
  const actual = normalized(sameDay[0].label);
  return sameDay.length === 1 && (actual === expected || actual === `${expected} — syncro shift`)
    ? 'verified' : 'conflict';
}

export function calendarResult(assignments, evidence) {
  if (!Array.isArray(assignments) || !Array.isArray(evidence)) return 'error';
  const expected = new Map(assignments.map(item => [Number(item.id), item]));
  const reported = new Set();
  if (assignments.length === 0 || assignments.length !== evidence.length
      || expected.size !== assignments.length
      || evidence.some(item => {
        const id = Number(item.assignment_id);
        if (!expected.has(id) || reported.has(id) || item.status !== 'verified') return true;
        reported.add(id);
        return item.calendar_status !== (expected.get(id).day_type === 'turno' ? 'clear' : 'verified');
      })) {
    return 'error';
  }
  return 'verified_schedule';
}
