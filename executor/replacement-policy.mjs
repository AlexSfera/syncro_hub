// Autorización puntual de Alexander para dos discrepancias de la semana 19–25/10/2026.
// No concede permiso para reemplazar otros turnos ni otras versiones del calendario.
export function approvedReplacement(job, assignment, current) {
  if (Number(job.week_id) !== 2 || job.week_start !== '2026-10-19'
      || job.department !== 'Recepción SYNCROLAB' || current.length !== 1) return false;
  const existing = current[0];
  if (assignment.bitrix_user_id === '4909' && assignment.date === '2026-10-21') {
    return assignment.day_type === 'turno' && assignment.shifts.length === 1
      && String(assignment.shifts[0].name || '').trim() === '*08:00-16:00*'
      && existing.name === '*13:15-21:15*' && existing.start === '13:15' && existing.end === '21:15';
  }
  if (assignment.bitrix_user_id === '17215' && assignment.date === '2026-10-25') {
    return assignment.day_type === 'descanso' && assignment.shifts.length === 0
      && existing.name === '09:00 - 14:00' && existing.start === '09:00' && existing.end === '14:00';
  }
  return false;
}
