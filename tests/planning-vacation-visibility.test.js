import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { vacationBalances, loadPlanningBootstrap } from '../lib/planning-server.js';

const employee={id:'fixture-a',nombre:'Empleado de prueba'};
const movement=(year,days,unit='laborable')=>({empleado_id:employee.id,ejercicio:year,dias:days,unidad:unit,tipo:'apertura'});
const holiday={empleado_id:employee.id,fecha_operativa:'2026-10-06',valor_nuevo:{ambito:'festivos_compensacion',saldo_dias:0}};
const calculate=(overrides={})=>vacationBalances({employees:[employee],conditions:[],conventionVersions:[],movements:[movement(2023,13),movement(2024,14),movement(2025,0),movement(2026,8)],holidayConfirmations:[holiday],exercise:2026,actor:employee,canEdit:false,...overrides})[0];

test('historico conserva 2023 y 2024 separados y festivos cero confirmados',()=>{
  const b=calculate();
  assert.deepEqual(b.historical_values,[{exercise:2023,value:13,unit:'laborable'},{exercise:2024,value:14,unit:'laborable'}]);
  assert.equal(b.value,8);
  assert.equal(b.previous_value,0);
  assert.equal(b.holiday_pending_value,0);
  assert.equal(b.holiday_confirmed_as_of,'2026-10-06');
});

test('saldos historicos y festivos no se revelan a otro empleado',()=>{
  const b=calculate({actor:{id:'fixture-other'}});
  assert.deepEqual(b.historical_values,[]);
  assert.equal(b.value,'[NO DATA]');
  assert.equal(b.holiday_pending_value,'[NO DATA]');
  assert.equal(b.holiday_confirmed_as_of,null);
});

test('datos ausentes y unidades historicas mezcladas no se convierten a cero',()=>{
  const missing=calculate({movements:[],holidayConfirmations:[]});
  assert.equal(missing.value,'[NO DATA]');
  assert.equal(missing.holiday_pending_value,'[NO DATA]');
  assert.deepEqual(missing.historical_values,[]);
  const mixed=calculate({movements:[movement(2023,13),movement(2023,2,'natural')]});
  assert.equal(mixed.historical_values[0].value,'[NO DATA]');
});

test('tabla y ayuda muestran historico, cero y ficha sin asignar con escape HTML',async()=>{
  const source=await readFile(new URL('../planificacion_horaria.js',import.meta.url),'utf8');
  const modal={innerHTML:''};
  const layer={classList:{add:value=>assert.equal(value,'open')}};
  const context=vm.createContext({window:{},document:{getElementById:id=>id==='ph-modal-card'?modal:layer}});
  vm.runInContext(source,context);
  context._ph.weekStart='2026-10-05';
  context._ph.data={balanceEmployees:[{...employee,nombre:'<img src=x>',estado:'Sin asignar',area:''}],balances:[calculate()]};
  const html=context._phBalancesPanel();
  assert.match(html,/Vacaciones y festivos pendientes de compensar/);
  assert.match(html,/2023: 13 días laborables/);
  assert.match(html,/2024: 14 días laborables/);
  assert.match(html,/Sin asignar/);
  assert.match(html,/&lt;img src=x&gt;/);
  assert.doesNotMatch(html,/<img src=x>/);
  assert.match(html,/Festivos pendientes/);
  assert.match(html,/<td>0<\/td>/);
  context._phBalanceHelp();
  assert.match(modal.innerHTML,/un 0 es confirmado/);
});

test('bootstrap separa consulta de saldos de empleados habilitados para turnos',async t=>{
  const employees=[
    {id:'fixture-a',nombre:'Activo',area:'Cocina',puesto:'Cocinero',rol:'cocina',estado:'Activo'},
    {id:'fixture-b',nombre:'Sin asignar',area:'Cocina',puesto:'Cocinero',rol:'cocina',estado:'Sin asignar'},
    {id:'fixture-c',nombre:'Baja',area:'Cocina',puesto:'Cocinero',rol:'cocina',estado:'Baja'},
    {id:'fixture-d',nombre:'Otro departamento',area:'Sales & Marketing',puesto:'',rol:'empleado',estado:'Activo'},
    {id:'fixture-e',nombre:'Sin departamento',area:'',puesto:'',rol:'empleado',estado:'Sin asignar'}
  ];
  t.mock.method(globalThis,'fetch',async input=>{
    const url=new URL(input),table=url.pathname.split('/').pop();
    let data=[];
    if(table==='employees'){
      assert.equal(url.searchParams.has('estado'),false);
      assert.doesNotMatch(url.searchParams.get('select'),/pin|email/);
      data=employees;
    }
    if(table==='bitrix_horarios_departamento')data=[{departamento_id:'Cocina',bitrix_schedule_id:1,tipo_uso:'principal_departamento'}];
    if(table==='vacaciones_movimientos'){
      assert.equal(url.searchParams.get('ejercicio'),'lte.2026');
      data=employees.map(e=>({...movement(2026,8),empleado_id:e.id}));
    }
    if(table==='planificacion_audit'&&url.searchParams.get('accion')==='eq.CONFIRMAR_SALDO_FESTIVOS')data=[holiday];
    return new Response(JSON.stringify(data),{status:200});
  });
  const prior={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_KEY};
  process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_KEY='fixture-only';
  try{
    const args={weekStart:'2026-10-05',department:'Cocina'};
    const admin=await loadPlanningBootstrap({...args,actor:{id:'fixture-admin',rol:'admin'}});
    assert.deepEqual(admin.employees.map(e=>e.id),['fixture-a']);
    assert.equal(admin.balanceEmployees.length,5);
    const manager=await loadPlanningBootstrap({...args,actor:{id:'fixture-chef',rol:'chef',puesto:'Jefe de Cocina',area:'Cocina',validador:1}});
    assert.deepEqual(manager.balanceEmployees.map(e=>e.id),['fixture-a','fixture-b','fixture-c']);
    const self=await loadPlanningBootstrap({...args,actor:employees[0]});
    assert.deepEqual(self.balanceEmployees.map(e=>e.id),['fixture-a']);
    assert.equal(self.balances[0].holiday_pending_value,0);
  }finally{
    if(prior.url===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=prior.url;
    if(prior.key===undefined)delete process.env.SUPABASE_SERVICE_KEY;else process.env.SUPABASE_SERVICE_KEY=prior.key;
  }
});
