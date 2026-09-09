import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL(
  '../supabase/migrations/20260909154457_allow_null_employee_pin_for_secure_auth.sql',
  import.meta.url
);
const fixtureUrl = new URL('./sql/p0_auth_supabase_fixture.sql', import.meta.url);

test('secure-auth migration removes the legacy employees.pin NOT NULL constraint', async () => {
  const [migration, fixture] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(fixtureUrl, 'utf8')
  ]);

  assert.match(fixture, /\bpin\s+text\s+not\s+null\b/i);
  assert.match(migration, /alter\s+column\s+pin\s+drop\s+not\s+null/i);
});
