import test from 'node:test';
import assert from 'node:assert/strict';
import { absenceDefinition, bitrixDate, calendarResult,
  classifyAbsence, parseAbsenceEntry } from '../executor/absence-policy.mjs';

const rest = { id: 11, date: '2026-10-24', day_type: 'descanso', bitrix_user_id: '13659' };

test('clasifica todos los tipos permitidos con el tipo Bitrix apropiado', () => {
  assert.equal(absenceDefinition('descanso').category, '15');
  assert.equal(absenceDefinition('vacaciones').category, '13');
  assert.equal(absenceDefinition('baja_medica').category, '5');
  assert.equal(absenceDefinition('otras_ausencias').category, '9');
  assert.equal(absenceDefinition('turno'), null);
  assert.throws(() => absenceDefinition('recuperacion_festivo'), /RECOVERY_ORIGIN_MISSING/);
  assert.throws(() => absenceDefinition('inventado'), /UNSUPPORTED_ABSENCE_DAY_TYPE/);
  assert.equal(bitrixDate('2026-10-24'), '24.10.2026');
});

test('acepta vacaciones existentes y detecta conflicto de ausencia para turno', () => {
  const vacation = parseAbsenceEntry({ userId: '13659',
    text: 'Vacaciones (19.10.2026 - 23.10.2026)', testId: 'intranet-absence-entry-2-85213' });
  assert.equal(classifyAbsence({ ...rest, date: '2026-10-21', day_type: 'vacaciones' }, [vacation]), 'verified');
  assert.equal(classifyAbsence({ ...rest, date: '2026-10-21', day_type: 'turno' }, [vacation]), 'conflict');
  assert.equal(classifyAbsence(rest, [vacation]), 'missing');
  assert.equal(classifyAbsence({ ...rest, bitrix_user_id: '4909' }, [vacation]), 'missing');
});

test('no verifica días no laborables si el evento de Bitrix es distinto o duplicado', () => {
  const existing = parseAbsenceEntry({ userId: '13659',
    text: 'Descanso (24.10.2026 - 25.10.2026)' });
  assert.equal(classifyAbsence(rest, [existing]), 'verified');
  assert.equal(classifyAbsence(rest, [existing, existing]), 'conflict');
  assert.equal(classifyAbsence({ ...rest, day_type: 'vacaciones' }, [existing]), 'conflict');
});

test('solo acredita la semana con evidencia única de turno y calendario', () => {
  const assignments = [rest, { id: 12, date: '2026-10-25', day_type: 'turno', bitrix_user_id: '4909' }];
  const evidence = [
    { assignment_id: 11, status: 'verified', calendar_status: 'verified' },
    { assignment_id: 12, status: 'verified', calendar_status: 'clear' }
  ];
  assert.equal(calendarResult(assignments, evidence), 'verified_schedule');
  assert.equal(calendarResult(assignments, evidence.slice(0, 1)), 'error');
  assert.equal(calendarResult(assignments, [evidence[0], evidence[0]]), 'error');
  assert.equal(calendarResult(assignments, [evidence[0], { ...evidence[1], calendar_status: 'verified' }]), 'error');
});
