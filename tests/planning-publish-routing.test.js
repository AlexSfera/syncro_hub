import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldQueueAutomatically } from '../api/planning/publish.js';

const ready = { enabled: true, tokenConfigured: true,
  mappings: [{ bitrix_schedule_id: 33 }], existingRequest: null };

test('solo el horario piloto 33 entra en la cola automática', () => {
  assert.equal(shouldQueueAutomatically(ready), true);
  assert.equal(shouldQueueAutomatically({ ...ready,
    mappings: [{ bitrix_schedule_id: 55 }] }), false);
  assert.equal(shouldQueueAutomatically({ ...ready,
    mappings: [{ bitrix_schedule_id: 33 }, { bitrix_schedule_id: 55 }] }), false);
  assert.equal(shouldQueueAutomatically({ ...ready, enabled: false }), false);
  assert.equal(shouldQueueAutomatically({ ...ready, tokenConfigured: false }), false);
});

test('una petición manual anterior no se anuncia como automática', () => {
  assert.equal(shouldQueueAutomatically({ ...ready,
    existingRequest: { response_snapshot: { automatic: false } } }), false);
  assert.equal(shouldQueueAutomatically({ ...ready,
    existingRequest: { response_snapshot: { automatic: true } } }), true);
});
