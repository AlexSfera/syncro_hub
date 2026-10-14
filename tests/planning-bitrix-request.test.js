import test from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = global.fetch;
const originalWebhook = process.env.BITRIX_WEBHOOK;
const originalResponsible = process.env.BITRIX_PLANNING_RESPONSIBLE_ID;

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalWebhook === undefined) delete process.env.BITRIX_WEBHOOK;
  else process.env.BITRIX_WEBHOOK = originalWebhook;
  if (originalResponsible === undefined) delete process.env.BITRIX_PLANNING_RESPONSIBLE_ID;
  else process.env.BITRIX_PLANNING_RESPONSIBLE_ID = originalResponsible;
});

async function planningServer(suffix) {
  process.env.BITRIX_WEBHOOK = 'https://example.bitrix24.test/rest/1/token';
  process.env.BITRIX_PLANNING_RESPONSIBLE_ID = '1';
  return import(`../lib/planning-server.js?planning-task=${suffix}`);
}

const week = {
  id: 84,
  version_actual: 3,
  departamento_id: 'Recepción SYNCROLAB',
  fecha_inicio: '2026-10-19',
  fecha_fin: '2026-10-25'
};

test('crea un único aviso de carga para Alexander mediante la API oficial de tareas', async () => {
  const calls = [];
  global.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url: String(url), body });
    if (String(url).endsWith('/tasks.task.list')) {
      return new Response(JSON.stringify({ result: { tasks: [] } }), { status: 200 });
    }
    return new Response(JSON.stringify({ result: { task: { id: '921' } } }), { status: 200 });
  };
  const { ensureBitrixPlanningTask } = await planningServer('create');
  const result = await ensureBitrixPlanningTask({ week, assignmentCount: 14, actorName: 'Jefa Recepción' });

  assert.deepEqual(result, {
    id: '921', created: true, responsibleId: 1, marker: '[SYNCROSHIFT:84:3]'
  });
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /tasks\.task\.list$/);
  assert.match(calls[1].url, /tasks\.task\.add$/);
  assert.equal(calls[1].body.fields.RESPONSIBLE_ID, 1);
  assert.match(calls[1].body.fields.TITLE, /Recepción SYNCROLAB/);
  assert.match(calls[1].body.fields.DESCRIPTION, /Mac Mini de Alexander/);
  assert.match(calls[1].body.fields.DESCRIPTION, /\[SYNCROSHIFT:84:3\]/);
});

test('reutiliza la tarea marcada y no duplica el aviso', async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({
      result: { tasks: [{ id: '921', title: 'Cargar horario · Recepción SYNCROLAB · 2026-10-19 · v3 [SYNCROSHIFT:84:3]' }] }
    }), { status: 200 });
  };
  const { ensureBitrixPlanningTask } = await planningServer('existing');
  const result = await ensureBitrixPlanningTask({ week, assignmentCount: 14, actorName: 'Jefa Recepción' });

  assert.equal(result.id, '921');
  assert.equal(result.created, false);
  assert.equal(calls, 1);
});
