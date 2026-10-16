import test from 'node:test';
import assert from 'node:assert/strict';
import { approvedReplacement } from '../executor/replacement-policy.mjs';

const job = { week_id: 2, week_start: '2026-10-19', department: 'Recepción SYNCROLAB' };
const fabian = { bitrix_user_id: '4909', date: '2026-10-21', day_type: 'turno',
  shifts: [{ name: '*08:00-16:00*' }] };
const lucrezia = { bitrix_user_id: '17215', date: '2026-10-25', day_type: 'descanso', shifts: [] };
const oldFabian = [{ name: '*13:15-21:15*', start: '13:15', end: '21:15' }];
const oldLucrezia = [{ name: '09:00 - 14:00', start: '09:00', end: '14:00' }];

test('sólo se autorizan las dos sustituciones expresas', () => {
  assert.equal(approvedReplacement(job, fabian, oldFabian), true);
  assert.equal(approvedReplacement(job, lucrezia, oldLucrezia), true);
  assert.equal(approvedReplacement(job, { ...fabian, date: '2026-10-22' }, oldFabian), false);
  assert.equal(approvedReplacement(job, { ...fabian, bitrix_user_id: '22053' }, oldFabian), false);
  assert.equal(approvedReplacement(job, { ...fabian, shifts: [{ name: '*09:00-17:00*' }] }, oldFabian), false);
  assert.equal(approvedReplacement(job, fabian, [{ ...oldFabian[0], start: '13:00' }]), false);
  assert.equal(approvedReplacement(job, fabian, [...oldFabian, ...oldFabian]), false);
  assert.equal(approvedReplacement(job, { ...lucrezia, day_type: 'vacaciones' }, oldLucrezia), false);
  assert.equal(approvedReplacement({ ...job, week_id: 3 }, fabian, oldFabian), false);
  assert.equal(approvedReplacement({ ...job, department: 'Recepción SFERA' }, fabian, oldFabian), false);
});
