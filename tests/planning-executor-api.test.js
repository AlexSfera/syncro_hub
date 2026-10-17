import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { completeExecutorEvidence } from '../api/planning/executor.js';

const original = {
  fetch: global.fetch,
  auth: process.env.SYNCRO_AUTH_ENABLED,
  token: process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN,
  url: process.env.SUPABASE_URL,
  service: process.env.SUPABASE_SERVICE_KEY
};

test.afterEach(() => {
  global.fetch = original.fetch;
  for (const [key, value] of [
    ['SYNCRO_AUTH_ENABLED', original.auth],
    ['SYNCRO_PLANNING_EXECUTOR_TOKEN', original.token],
    ['SUPABASE_URL', original.url],
    ['SUPABASE_SERVICE_KEY', original.service]
  ]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

test('el ejecutor rechaza lecturas sin credencial antes de consultar datos', async () => {
  process.env.SYNCRO_AUTH_ENABLED = 'true';
  process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN = 'a'.repeat(64);
  global.fetch = () => { throw new Error('DATA_LEAK'); };
  const response = await handler(new Request('https://syncro-shift.vercel.app/api/planning/executor'));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'UNAUTHORIZED');
});

test('la API no publica sin una prueba única de turno y calendario por jornada', () => {
  const assignments = [{ id: 1, tipo_dia: 'turno' }, { id: 2, tipo_dia: 'descanso' }];
  const good = [{ assignment_id: 1, status: 'verified', calendar_status: 'clear' },
    { assignment_id: 2, status: 'verified', calendar_status: 'verified' }];
  assert.equal(completeExecutorEvidence(assignments, good, true), true);
  assert.equal(completeExecutorEvidence(assignments, [good[0], good[0]], true), false);
  assert.equal(completeExecutorEvidence(assignments, [good[0], { ...good[1], calendar_status: 'missing' }], true), false);
  assert.equal(completeExecutorEvidence(assignments, good.slice(0, 1), true), false);
});

test('entrega solo la semana solicitada y bloquea una versión incompleta', async () => {
  process.env.SYNCRO_AUTH_ENABLED = 'true';
  process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN = 'b'.repeat(64);
  process.env.SUPABASE_URL = 'https://example.supabase.test';
  process.env.SUPABASE_SERVICE_KEY = 'test-only';
  const requests = [];
  global.fetch = async url => {
    const path = String(url);
    requests.push(path);
    let data = [];
    if (path.includes('operacion=eq.solicitar_carga_bitrix')) {
      data = [{ id: 515, semana_id: 84, version: 4, actor: 'J', created_at: '2026-10-15T12:00:00Z' }];
    } else if (path.includes('planificacion_semanas')) {
      data = [{ id: 84, departamento_id: 'Recepción SYNCROLAB', fecha_inicio: '2026-10-19',
        fecha_fin: '2026-10-25', version_actual: 4 }];
    } else if (path.includes('planificacion_asignaciones')) {
      data = [{ id: 1, empleado_id: 'J', fecha_operativa: '2026-10-19', tipo_dia: 'descanso' }];
    } else if (path.includes('employees?')) {
      data = [{ id: 'J', nombre: 'Jefa', area: 'Recepción SYNCROLAB', puesto: 'Coordinadora',
        rol: 'jefe', estado: 'Activo', bitrix_user_id: '17215' }];
    } else if (path.includes('bitrix_horarios_departamento')) {
      data = [{ bitrix_schedule_id: 33 }];
    }
    return new Response(JSON.stringify(data), { status: 200 });
  };
  const response = await handler(new Request('https://syncro-shift.vercel.app/api/planning/executor', {
    headers: { Authorization: `Bearer ${'b'.repeat(64)}` }
  }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.job.blocked, 'WEEK_INCOMPLETE');
  assert.equal(payload.job.missing_count, 6);
  assert.ok(requests.every(path => path.startsWith('https://example.supabase.test/rest/v1/')));
  assert.ok(requests.some(path => path.includes('response_snapshot-%3E%3Eautomatic=eq.true')
    || path.includes('response_snapshot->>automatic=eq.true')));
});

test('una semana completa solo pasa a publicada con los siete turnos y ausencias verificados', async () => {
  process.env.SYNCRO_AUTH_ENABLED = 'true';
  process.env.SYNCRO_PLANNING_EXECUTOR_TOKEN = 'c'.repeat(64);
  process.env.SUPABASE_URL = 'https://example.supabase.test';
  process.env.SUPABASE_SERVICE_KEY = 'test-only';
  const dates = Array.from({ length: 7 }, (_, index) => `2026-10-${String(19 + index).padStart(2, '0')}`);
  const assignments = dates.map((date, index) => ({ id: index + 1, empleado_id: 'J',
    fecha_operativa: date, tipo_dia: 'descanso' }));
  const employee = { id: 'J', nombre: 'Jefa', area: 'Recepción SYNCROLAB', puesto: 'Coordinadora',
    rol: 'jefe', estado: 'Activo', bitrix_user_id: '17215' };
  const week = { id: 84, departamento_id: 'Recepción SYNCROLAB', fecha_inicio: '2026-10-19',
    fecha_fin: '2026-10-25', version_actual: 4, estado: 'borrador' };
  const writes = [];
  global.fetch = async (url, init = {}) => {
    const path = String(url);
    const method = init.method || 'GET';
    if (method !== 'GET') writes.push({ path, method, body: init.body && JSON.parse(init.body) });
    let data = [];
    if (path.includes('planificacion_sync_log?idempotency_key')) data = [{ id: 515, actor: 'J' }];
    else if (path.includes('planificacion_semanas') && method === 'PATCH') data = [{ id: 84, estado: 'publicado_bitrix' }];
    else if (path.includes('planificacion_semanas')) data = [week];
    else if (path.includes('planificacion_asignaciones')) data = assignments;
    else if (path.includes('employees?')) data = [employee];
    else if (path.includes('bitrix_horarios_departamento')) data = [{ bitrix_schedule_id: 33 }];
    return new Response(JSON.stringify(data), { status: 200 });
  };
  const evidence = assignments.map(item => ({ assignment_id: item.id, status: 'verified',
    calendar_status: 'verified' }));
  const response = await handler(new Request('https://syncro-shift.vercel.app/api/planning/executor', {
    method: 'POST', headers: { Authorization: `Bearer ${'c'.repeat(64)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ week_id: 84, version: 4, result: 'verified_schedule', evidence })
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result, 'verified_schedule');
  assert.ok(writes.some(item => item.method === 'PATCH' && item.path.includes('planificacion_semanas')
    && item.body.estado === 'publicado_bitrix'));
  assert.ok(writes.some(item => item.path.includes('planificacion_sync_log')
    && item.body.resultado_verificacion === 'planificacion_verificada'));
  writes.length = 0;
  const incomplete = await handler(new Request('https://syncro-shift.vercel.app/api/planning/executor', {
    method: 'POST', headers: { Authorization: `Bearer ${'c'.repeat(64)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ week_id: 84, version: 4, result: 'verified_schedule',
      evidence: evidence.map((item, index) => index === 0 ? { ...item, calendar_status: 'missing' } : item) })
  }));
  assert.equal(incomplete.status, 409);
  assert.equal((await incomplete.json()).error, 'INCOMPLETE_CALENDAR_EVIDENCE');
  assert.equal(writes.length, 0);
});
