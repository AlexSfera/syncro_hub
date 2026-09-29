import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('migración aplica RLS y deniega acceso directo a todas las tablas nuevas', async () => {
  const sql = await read('supabase/migrations/20260929223545_planificacion_horaria_v1.sql');
  const tables = [...sql.matchAll(/create table public\.([a-z0-9_]+)/g)].map(match => match[1]);
  assert.ok(tables.length >= 15);
  for(const table of tables){
    assert.match(sql, new RegExp("'" + table + "'"));
  }
  assert.match(sql, /execute format\('alter table public\.%I enable row level security'/);
  assert.match(sql, /execute format\('revoke all on table public\.%I from public, anon, authenticated'/);
  assert.match(sql, /execute format\('grant select, insert, update, delete on table public\.%I to service_role'/);
});

test('historial crítico es append-only y RPC no se expone al cliente', async () => {
  const sql = await read('supabase/migrations/20260929223545_planificacion_horaria_v1.sql');
  assert.match(sql, /planificacion_prevent_history_mutation/);
  assert.match(sql, /raise exception 'planning history is append-only'/);
  assert.match(sql, /revoke all on function public\.planificacion_guardar_semana[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.planificacion_guardar_semana[\s\S]*to service_role/);
});

test('rollback se detiene si existen datos operativos', async () => {
  const sql = await read('supabase/rollback/20260929223545_planificacion_horaria_v1_rollback.sql');
  assert.match(sql, /Rollback detenido: existen datos en/);
  assert.match(sql, /select exists \(select 1 from public\.%I limit 1\)/);
  assert.match(sql, /drop function public\.planificacion_guardar_semana/);
  assert.match(sql, /drop table public\.planificacion_audit/);
});

test('todas las claves foráneas operativas tienen índice de cobertura', async () => {
  const sql = await read('supabase/migrations/20260929224043_planificacion_horaria_v1_fk_indexes.sql');
  const indexes = [...sql.matchAll(/create index if not exists ([a-z0-9_]+)/g)]
    .map(match => match[1]);
  assert.equal(indexes.length, 20);
  assert.match(sql, /empleado_condiciones_laborales \(convenio_version_id\)/);
  assert.match(sql, /planificacion_asignaciones \(turno_catalogo_id\)/);
  assert.match(sql, /planificacion_audit \(semana_id\)/);
  assert.match(sql, /vacaciones_movimientos \(referencia_ausencia_id\)/);
});

test('APIs mutables exigen autenticación y mismo origen', async () => {
  for(const file of ['catalog.js','week.js','publish.js','absence.js','extra-recovery.js','labor-condition.js']){
    const source = await read('api/planning/' + file);
    assert.match(source, /requireAuthEnabled\(\)/, file);
    assert.match(source, /requireSameOrigin\(req\)/, file);
    assert.match(source, /requirePlanningActor\(req\)/, file);
  }
});

test('la integración Bitrix solo lee el método oficial de catálogo', async () => {
  const server = await read('lib/planning-server.js');
  const publish = await read('api/planning/publish.js');
  assert.match(server, /bitrixCall\('timeman\.schedule\.get'/);
  assert.doesNotMatch(server, /ShiftPlan|\.click\(|querySelector\(/);
  assert.match(publish, /BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO/);
  assert.match(publish, /safe: true/);
});

test('interfaz expone planificación a todas las ramas de navegación', async () => {
  const shared = await read('shared.js');
  const html = await read('index.html');
  assert.match(shared, /planificacion:\{id:'planificacion-horaria'/);
  assert.ok((shared.match(/ITEMS\.planificacion/g) || []).length >= 4);
  assert.match(html, /id="screen-planificacion-horaria"/);
  assert.match(html, /src="planificacion_horaria\.js"/);
});

test('interfaz conserva NO DATA y refresco periódico de cinco minutos', async () => {
  const ui = await read('planificacion_horaria.js');
  assert.match(ui, /\[NO DATA\]/);
  assert.match(ui, /5 \* 60 \* 1000/);
  assert.match(ui, /_phRefreshCatalog\(true, false\)/);
  assert.match(ui, /if\(refreshAfterLoad\) await _phLoad\(false\)/);
  assert.match(ui, /timeman\.schedule\.get|catálogo oficial|catálogo de turnos/i);
  assert.match(ui, /API oficial documentada/);
});

test('bootstrap no expone motivos confidenciales ni IDs Bitrix de empleados', async () => {
  const server = await read('lib/planning-server.js');
  assert.match(server, /employees\?estado=eq\.Activo&select=id,nombre,area,puesto,rol,estado&order=nombre\.asc/);
  assert.doesNotMatch(server, /justificante_ref/);
  assert.doesNotMatch(server, /motivo_cambio/);
  assert.match(server, /conditions: capabilities\.canManageLaborConditions \? visibleConditions : \[\]/);
  assert.match(server, /\(!canEdit && !week\) \? \[\]/);
});
