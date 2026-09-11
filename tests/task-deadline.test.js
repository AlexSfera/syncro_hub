import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';

async function loadDeadlineApi() {
  const source = await readFile(new URL('../tareas.js', import.meta.url), 'utf8');
  const start = source.indexOf('function getMinTaskDeadline');
  const end = source.indexOf('function normalizeTaskState');
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const context = {
    getDateOnly(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    },
    toYMD(date) {
      return date.getFullYear() + '-'
        + String(date.getMonth() + 1).padStart(2, '0') + '-'
        + String(date.getDate()).padStart(2, '0');
    }
  };
  vm.runInNewContext(
    source.slice(start, end)
      + '\nthis.deadlineApi = { getMinTaskDeadline, getMaxTaskDeadline, validateTaskDeadline };',
    context
  );
  return context.deadlineApi;
}

function moveDate(ymd, days) {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return date.getFullYear() + '-'
    + String(date.getMonth() + 1).padStart(2, '0') + '-'
    + String(date.getDate()).padStart(2, '0');
}

test('las tareas permiten deadline hoy y mantienen el límite de siete días', async () => {
  const api = await loadDeadlineApi();
  const today = api.getMinTaskDeadline();

  assert.equal(api.validateTaskDeadline(today).ok, true);
  assert.equal(api.validateTaskDeadline(moveDate(today, 7)).ok, true);
  assert.equal(api.validateTaskDeadline(moveDate(today, -1)).ok, false);
  assert.equal(api.validateTaskDeadline(moveDate(today, 8)).ok, false);
  assert.equal(api.validateTaskDeadline('').ok, false);
});
