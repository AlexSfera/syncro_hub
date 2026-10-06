import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { vacationBalances } from '../lib/planning-server.js';
import { loadPlanningBootstrap } from '../lib/planning-server.js';

const employee = { id: 'sample-employee', nombre: 'Empleado de prueba' };
const movement = overrides => ({
  empleado_id: employee.id, ejercicio: 2026, tipo: 'apertura',
  unidad: 'natural', dias: 8, fecha_corte: '2026-09-30', ...overrides
});
const balance = (movements, overrides = {}) => vacationBalances({
  employees: [employee], conditions: [], conventionVersions: [], movements,
  exercise: 2026, actor: employee, canEdit: false, ...overrides
})[0];

test('cero certificado conserva cero y fecha; ausencia de datos conserva NO DATA', () => {
  const actual = balance([movement({dias:0}), movement({ejercicio:2025,dias:0})]);
  assert.equal(actual.value, 0);
  assert.equal(actual.previous_value, 0);
  assert.equal(actual.opening_value, 0);
  assert.equal(actual.opening_as_of, '2026-09-30');
  assert.equal(actual.previous_opening_as_of, '2026-09-30');
  assert.equal(actual.unit, 'natural');
  assert.equal(actual.entitlement, '[NO DATA]');
  const missing = balance([]);
  assert.equal(missing.value, '[NO DATA]');
  assert.equal(missing.previous_value, '[NO DATA]');
  assert.equal(missing.opening_as_of, null);
});

test('movimiento posterior cambia saldo y conserva apertura al corte', () => {
  const actual = balance([movement({}), movement({tipo:'consumo',dias:-2,fecha_corte:null})]);
  assert.equal(actual.value, 6);
  assert.equal(actual.opening_value, 8);
  assert.equal(actual.opening_as_of, '2026-09-30');
});

test('derecho y consumo acumulado concilian un saldo certificado cero', () => {
  const actual = balance([movement({dias:31}),movement({tipo:'consumo',dias:-31})]);
  assert.equal(actual.value, 0);
  assert.equal(actual.opening_value, 0);
  assert.equal(actual.opening_as_of, '2026-09-30');
});

test('no se mezclan unidades ni se publica el corte de otro empleado', () => {
  const mixed = balance([movement({}),movement({unidad:'laborable'})]);
  assert.equal(mixed.value, '[NO DATA]');
  assert.equal(mixed.opening_value, '[NO DATA]');
  const privateBalance = balance([movement({})], {actor:{id:'other-employee'}});
  assert.equal(privateBalance.value, '[NO DATA]');
  assert.equal(privateBalance.opening_value, '[NO DATA]');
  assert.equal(privateBalance.opening_as_of, null);
  assert.equal(privateBalance.unit, null);
});

test('pantalla muestra cero, unidades y fecha y separa apertura de saldo posterior', async () => {
  const source = await readFile(new URL('../planificacion_horaria.js', import.meta.url),'utf8');
  const context = vm.createContext({window:{},Intl,Array,Set,Number,String,Date});
  vm.runInContext(source,context);
  const actual = balance([movement({dias:0}),movement({ejercicio:2025,dias:0})]);
  const html = context._phBalanceLines(actual);
  assert.match(html,/Saldo 2026: 0 días naturales/);
  assert.match(html,/Apertura al 30\/09\/2026: 0 días naturales/);
  assert.match(html,/Pendiente 2025: 0 días naturales/);
  const later = balance([movement({}),movement({tipo:'consumo',dias:-2,fecha_corte:null})]);
  const laterHtml = context._phBalanceLines(later);
  assert.match(laterHtml,/Saldo 2026: 6 días naturales/);
  assert.match(laterHtml,/Apertura al 30\/09\/2026: 8 días naturales/);
  context._ph.data={balances:[actual]};
  assert.equal(context._phOpeningLabel(),'Saldos de apertura al 30/09/2026');
});

test('saldo importado conserva su unidad aunque el convenio tenga otra', () => {
  const actual = balance([movement({unidad:'natural'})], {
    conditions:[{empleado_id:employee.id,convenio_version_id:'sport',fecha_inicio_contrato:'2026-01-01'}],
    conventionVersions:[{id:'sport',convenio_id:'instalaciones_deportivas_estatal',unidad_vacaciones:'laborable'}]
  });
  assert.equal(actual.unit,'natural');
  assert.equal(actual.entitlement_unit,'laborable');
});

test('bootstrap entrega el corte auditado al render y conserva privacidad por departamento', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    const table = url.pathname.split('/').pop();
    const fixture = {
      bitrix_horarios_departamento:[{id:'map',departamento_id:'Cocina',bitrix_schedule_id:1,tipo_uso:'principal_departamento'}],
      employees:[{...employee,area:'Cocina',puesto:'',rol:'cocina',estado:'Activo'}],
      vacaciones_movimientos:[movement({id:'movement-1',dias:0})],
      planificacion_audit:[{entidad_id:'movement-1',fecha_operativa:'2026-09-30'}]
    };
    let data = fixture[table] || [];
    if (table === 'planificacion_audit' && url.searchParams.get('accion') === 'eq.CONFIRMAR_SALDO_FESTIVOS') data=[];
    if (table === 'planificacion_audit' && url.searchParams.get('accion') === 'eq.IMPORTAR_SALDO_VACACIONES') {
      assert.equal(url.searchParams.get('entidad_id'),'in.(movement-1)');
      assert.equal(url.searchParams.get('select'),'entidad_id,fecha_operativa');
    }
    const fields = url.searchParams.get('select');
    if (fields && fields !== '*') data=data.map(item=>Object.fromEntries(fields.split(',').filter(key=>key in item).map(key=>[key,item[key]])));
    return new Response(JSON.stringify(data), {status:200});
  });
  const prior = {url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_KEY};
  process.env.SUPABASE_URL='https://fixture.invalid';
  process.env.SUPABASE_SERVICE_KEY='fixture-only';
  try {
    const actual=await loadPlanningBootstrap({actor:{...employee,rol:'admin'},weekStart:'2026-09-28',department:'Cocina'});
    assert.equal(actual.balances[0].opening_as_of,'2026-09-30');
    assert.equal(actual.balances[0].opening_value,0);
    const privateResult=await loadPlanningBootstrap({actor:{id:'other-employee',area:'Cocina',rol:'cocina'},weekStart:'2026-09-28',department:'Cocina'});
    assert.equal(privateResult.balances.length,0);
    assert.equal(privateResult.balanceEmployees.length,0);
  } finally {
    if(prior.url===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=prior.url;
    if(prior.key===undefined)delete process.env.SUPABASE_SERVICE_KEY;else process.env.SUPABASE_SERVICE_KEY=prior.key;
  }
});

