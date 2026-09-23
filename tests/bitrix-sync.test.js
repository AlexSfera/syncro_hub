import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_KEY = 'service-test-key';
process.env.BITRIX_WEBHOOK = 'https://bitrix.test/rest/1/webhook';
process.env.CRON_SECRET = 'cron-test-secret';

const { default: bitrixSyncHandler, __test } = await import('../api/bitrix-sync.js');

function jsonResponse(data, status = 200) {
  return new Response(data == null ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function createFetchScenario({ rawRecord, shiftRecord, bitrixRecord }) {
  const state = {
    raw: { ...rawRecord },
    shift: { ...shiftRecord },
    audit: [],
    createdShifts: [],
    calls: []
  };

  const fetchMock = async (url, options = {}) => {
    const method = options.method || 'GET';
    const target = String(url);
    const body = options.body ? JSON.parse(options.body) : null;
    state.calls.push({ method, target, body });

    if (target.startsWith('https://bitrix.test/rest/api/')) {
      return jsonResponse({ result: { items: [bitrixRecord] } });
    }

    const path = target.replace('https://supabase.test/rest/v1/', '');
    if (method === 'GET' && path.startsWith('employees?nombre=eq.BOSS')) {
      return jsonResponse([{ id: 'BOSS', nombre: 'BOSS', bitrix_user_id: '999', estado: 'Activo' }]);
    }
    if (method === 'GET' && path.startsWith('employees?select=')) {
      return jsonResponse([{ id: 'E1', nombre: 'Empleado Uno', area: 'Cocina', puesto: 'Cocinero', bitrix_user_id: '16609' }]);
    }
    if (method === 'GET' && path.startsWith('bitrix_time_records?id=in.')) {
      return jsonResponse([{ ...state.raw }]);
    }
    if (method === 'GET' && path.startsWith('bitrix_time_records?fecha_operativa=')) {
      return jsonResponse([{ ...state.raw }]);
    }
    if (method === 'GET' && path.startsWith('shifts?fecha=')) {
      return jsonResponse([{ ...state.shift }, ...state.createdShifts.map(item => ({ ...item }))]);
    }
    if (method === 'PATCH' && path.startsWith('bitrix_time_records?id=')) {
      Object.assign(state.raw, body);
      return new Response(null, { status: 204 });
    }
    if (method === 'PATCH' && path.startsWith('shifts?id=eq.')) {
      Object.assign(state.shift, body);
      return new Response(null, { status: 204 });
    }
    if (method === 'POST' && path === 'shifts') {
      state.createdShifts.push({ ...body });
      return new Response(null, { status: 201 });
    }
    if (method === 'POST' && path === 'audit_log') {
      state.audit.push(...(Array.isArray(body) ? body : [body]));
      return new Response(null, { status: 201 });
    }
    throw new Error(`Unexpected fetch: ${method} ${target}`);
  };

  return { state, fetchMock };
}

function baseRaw(overrides = {}) {
  return {
    id: 'BX_50891',
    bitrix_record_id: '50891',
    bitrix_user_id: '16609',
    employee_id: 'E1',
    start_ts: '2026-09-19T08:30:00+02:00',
    end_ts: '2026-09-19T16:30:00+02:00',
    duration_seconds: 28800,
    break_length: null,
    is_approved: true,
    fecha_operativa: '2026-09-19',
    servicio: 'Mañana',
    sync_status: 'matched',
    matched_shift_id: 'SHIFT_1',
    sync_error: null,
    ...overrides
  };
}

function baseShift(overrides = {}) {
  return {
    id: 'SHIFT_1',
    employee_id: 'E1',
    nombre: 'Empleado Uno',
    fecha: '2026-09-19',
    servicio: 'Mañana',
    estado: 'Validado',
    horas: 8,
    horas_bitrix: 8,
    horas_source: 'bitrix',
    hora_registro: '2026-09-19T16:30:00+02:00',
    created_at: '2026-09-19T16:30:00+02:00',
    bitrix_shift_id: '50891',
    bitrix_started_at: '2026-09-19T08:30:00+02:00',
    bitrix_closed_at: '2026-09-19T16:30:00+02:00',
    bitrix_duration_minutes: 480,
    ...overrides
  };
}

const changedBitrixRecord = {
  id: 50891,
  userId: 16609,
  startTime: '2026-09-19T08:30:00+02:00',
  endTime: '2026-09-19T17:30:00+02:00',
  duration: 32400,
  breakLength: null,
  isApproved: true
};

test('detecta una modificación Bitrix24, actualiza el turno y registra antes/después', async t => {
  const previousFetch = global.fetch;
  const { state, fetchMock } = createFetchScenario({
    rawRecord: baseRaw(),
    shiftRecord: baseShift(),
    bitrixRecord: changedBitrixRecord
  });
  global.fetch = fetchMock;
  t.after(() => { global.fetch = previousFetch; });

  const response = mockResponse();
  await bitrixSyncHandler({
    headers: { authorization: 'Bearer cron-test-secret' },
    query: { modo: 'range', fecha: '2026-09-19' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.records_updated, 1);
  assert.equal(response.body.shifts_updated, 1);
  assert.equal(state.raw.duration_seconds, 32400);
  assert.equal(state.raw.end_ts, '2026-09-19T17:30:00+02:00');
  assert.equal(state.shift.horas, 9);
  assert.equal(state.shift.horas_bitrix, 9);

  const recordLog = state.audit.find(item => item.action === 'BITRIX_RECORD_CHANGED');
  const shiftLog = state.audit.find(item => item.action === 'BITRIX_SHIFT_UPDATED');
  assert.ok(recordLog, 'debe existir log del cambio recibido de Bitrix24');
  assert.ok(shiftLog, 'debe existir log de la actualización del turno');
  const detail = JSON.parse(recordLog.detail);
  assert.deepEqual(detail.changes.duration_seconds, { before: 28800, after: 32400 });
  assert.deepEqual(detail.changes.end_ts, {
    before: '2026-09-19T14:30:00.000Z',
    after: '2026-09-19T15:30:00.000Z'
  });
});

test('no asocia una jornada con un turno manual de la fecha siguiente', async t => {
  const previousFetch = global.fetch;
  const unchangedBitrixRecord = {
    ...changedBitrixRecord,
    endTime: '2026-09-19T16:30:00+02:00',
    duration: 28800
  };
  const { state, fetchMock } = createFetchScenario({
    rawRecord: baseRaw({ matched_shift_id: 'SHIFT_WRONG_DAY' }),
    shiftRecord: baseShift({ id: 'SHIFT_WRONG_DAY', fecha: '2026-09-20', horas: 0, horas_bitrix: 8 }),
    bitrixRecord: unchangedBitrixRecord
  });
  global.fetch = fetchMock;
  t.after(() => { global.fetch = previousFetch; });

  const response = mockResponse();
  await bitrixSyncHandler({
    headers: { authorization: 'Bearer cron-test-secret' },
    query: { modo: 'range', fecha: '2026-09-19' }
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.shifts_auto_created, 1);
  assert.equal(state.createdShifts.length, 1);
  assert.equal(state.createdShifts[0].id, 'BXAUTO_E1_20260919');
  assert.equal(state.createdShifts[0].fecha, '2026-09-19');
  assert.equal(state.createdShifts[0].horas, 8);
  assert.equal(state.raw.matched_shift_id, 'BXAUTO_E1_20260919');
  assert.ok(state.audit.some(item => item.action === 'BITRIX_SHIFT_CREATED'));
});

test('la comparación no marca como cambio dos timestamps equivalentes', () => {
  const before = baseRaw();
  const after = { ...before, start_ts: '2026-09-19T06:30:00.000Z' };
  assert.deepEqual(__test.changedRawFields(before, after), {});
});

test('Vercel conserva dos revisiones diarias compatibles con el plan Hobby', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.crons, [
    { path: '/api/bitrix-sync', schedule: '0 23 * * *' },
    { path: '/api/bitrix-sync-history', schedule: '35 1 * * *' }
  ]);
});

test('la migración programa la comprobación frecuente sin guardar el secreto', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260923122947_bitrix_continuous_sync_cron.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /'syncro-bitrix-hours-continuous'/);
  assert.match(migration, /'\*\/15 \* \* \* \*'/);
  assert.match(migration, /vault\.decrypted_secrets/);
  assert.match(migration, /syncro_bitrix_cron_secret/);
  assert.doesNotMatch(migration, /Bearer\s+[A-Za-z0-9_-]{16,}/);
});
