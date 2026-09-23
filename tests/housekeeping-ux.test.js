import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (name) => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('catálogo Housekeeping queda agrupado en nueve FIO activos', () => {
  const sql = read('supabase/migrations/202609230001_housekeeping_fio_catalog.sql');
  const rows = [...sql.matchAll(/\('HK26-\d{2}',\s*'Housekeeping'/g)];
  assert.equal(rows.length, 9);
  assert.match(sql, /Limpieza o higiene incorrectas/);
  assert.match(sql, /Habitación no lista o estado incorrecto/);
  assert.match(sql, /Incumplimiento de seguridad o privacidad/);
  assert.match(sql, /set activo = false/);
  const rollback = read('supabase/rollback/202609230001_housekeeping_fio_catalog_rollback.sql');
  assert.match(rollback, /HK26-09/);
  assert.match(rollback, /id not in/);
});

test('checklist de Gobernanta contiene exactamente los 15 controles acordados', () => {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(read('checklist.js'), context);
  assert.equal(context.CHK_HK_GOB_ITEMS.length, 15);
  assert.equal(context.CHK_HK_GOB_SECTIONS.reduce((n, section) => n + section.count, 0), 15);
  assert.match(context.CHK_HK_GOB_ITEMS.join(' | '), /MEWS/);
  assert.match(context.CHK_HK_GOB_ITEMS.join(' | '), /móviles tienen batería/);
});

test('reglas UX Housekeeping reflejan carga, destripe, inspección y multiselección', () => {
  const source = read('housekeeping.js');
  assert.match(source, /destripe:3/);
  assert.match(source, /HK_JORNADA_OBJETIVO_MIN = 480/);
  assert.match(source, /Inspección correcta/);
  assert.match(source, /hkSelAllObjects/);
  assert.match(source, /localeCompare/);
});

test('sesión caduca a los 40 minutos y Housekeeping inicia en Mi Ruta', () => {
  const source = read('shared.js');
  assert.match(source, /SESSION_IDLE_MS=40\*60\*1000/);
  assert.match(source, /showScreen\(_isHKStart\?'ruta-mod':'readme'\)/);
  assert.match(source, /if\(isJefe\) miDia\.push\(ITEMS\.checklist\)/);
});

test('Gobernanta no ve Caja y el diseño móvil mantiene controles táctiles', () => {
  const validation = read('validacion.js');
  const fio = read('fio.js');
  const css = read('index.html');
  assert.match(validation, /function canSeeCajaTab/);
  assert.match(validation, /housekeeping\|limpieza/);
  assert.match(fio, /gobernante','subgobernante/);
  assert.match(fio, /_fioCanViewDept\(currentUser, f\.departamento\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /min-height:44px/);
});
