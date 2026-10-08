import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import department from '../api/department-incentives.js';
import personal from '../api/pending-incentives.js';
import reception from '../api/reception-incentives.js';
import housekeeping from '../api/housekeeping-semester-incentives.js';
import {canControlIncentives,canMarkLiquidation,canReadDepartmentIncentives,pendingIncentivesFor} from '../lib/incentive-access.js';

const staff=[
  {id:'cook',nombre:'Cocina',area:'Cocina',puesto:'Cocinero',rol:'empleado',estado:'Activo'},
  {id:'waiter',nombre:'Sala',area:'Sala',puesto:'Camarero',rol:'empleado',estado:'Activo'},
  {id:'reception',nombre:'Recepción',area:'Recepción',puesto:'Recepcionista',rol:'empleado',estado:'Activo'},
  {id:'trainer',nombre:'Entrenadores',area:'SYNCROLAB',puesto:'Entrenador(a)',rol:'empleado',estado:'Activo'},
  {id:'physio',nombre:'Fisioterapia',area:'SYNCROLAB',puesto:'Fisioterapeuta',rol:'empleado',estado:'Activo'},
  {id:'lab-reception',nombre:'Recepción SYNCROLAB',area:'SYNCROLAB',puesto:'Atención al Cliente',rol:'empleado',estado:'Activo'},
  {id:'hk',nombre:'Housekeeping',area:'Housekeeping',puesto:'Camarera de pisos',rol:'empleado',estado:'Activo'}
];
const approved=[
  ...[['cook','Cocina'],['waiter','Sala'],['physio','Fisioterapeutas'],['lab-reception','Recepción SYNCROLAB']]
    .map(([employee_id,departamento])=>({id:employee_id+'-pending',employee_id,departamento,month:'2026-10',status:'approved',bonus_final:15})),
  {id:'cook-paid',employee_id:'cook',departamento:'Cocina',month:'2026-09',status:'approved',bonus_final:25},
  {id:'wrong-department',employee_id:'cook',departamento:'Sala',month:'2026-10',status:'approved',bonus_final:999},
  {id:'draft',employee_id:'cook',departamento:'Cocina',month:'2026-08',status:'calculated',bonus_final:888},
  {id:'trainer-paid-duplicate',employee_id:'trainer',departamento:'Entrenadores',month:'2026-09',status:'approved',bonus_final:25}
];
const trainers=[
  {id:'trainer-pending',employee_id:'trainer',ym:'2026-10',incentivo_bruto:30,liquidado:false},
  {id:'trainer-paid',employee_id:'trainer',ym:'2026-09',incentivo_bruto:40,liquidado:true,liquidado_por:'PRIVATE'},
  {id:'trainer-shadow',employee_id:'trainer',ym:'2026-09',incentivo_bruto:45,liquidado:false}
];
const awards=[
  {id:'hk-pending',employee_id:'hk',periodo:'2026-S1',estado:'pendiente',importe_premio:55},
  {id:'hk-paid',employee_id:'hk',periodo:'2025-S2',estado:'liquidado',importe_premio:65},
  {id:'hk-shadow',employee_id:'hk',periodo:'2025-S2',estado:'pendiente',importe_premio:75}
];
const liquidations=[{empleado_id:'cook',mes:'2026-09'},{empleado_id:'reception',mes:'2026-09'}];
const sales=[
  {id:'reception-sale',empleado_id:'reception',fecha:'2026-10-01',tipo_venta:'desayuno',importe:110},
  {id:'reception-paid-sale',empleado_id:'reception',fecha:'2026-09-01',tipo_venta:'desayuno',importe:110},
  {id:'outsider-sale',empleado_id:'waiter',fecha:'2026-10-01',tipo_venta:'desayuno',importe:11000}
];
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const token=encode({alg:'none'})+'.'+encode({app_metadata:{syncro_authz_version:7}})+'.fixture';
function req(path,method='GET'){
  return new Request('https://syncro.test'+path,{method,headers:{Authorization:'Bearer '+token,Origin:'https://syncro.test','Content-Type':'application/json'}});
}
async function mocked(actor,run,options={}){
  const keys=['SYNCRO_AUTH_ENABLED','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_KEY'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  const fetch=globalThis.fetch,calls=[];
  Object.assign(process.env,{SYNCRO_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_KEY:'fixture-service'});
  globalThis.fetch=async(input,init={})=>{
    const url=String(input),method=init.method||'GET';calls.push({url,method});
    if(url.includes('/auth/v1/user'))return json({id:'auth-actor'});
    if(url.includes('/syncro_auth_identities?'))return json([{employee_id:actor.id,auth_user_id:'auth-actor',active:true,force_pin_change:false,authz_version:7}]);
    if(url.includes('/employees?id=eq.'+actor.id))return json([actor]);
    if(url.includes('/employees?'))return json(staff);
    if(options.fail&&url.includes('/employee_incentives?'))return json({message:'offline'},503);
    if(url.includes('/employee_incentives?')){
      if(options.pagination){
        if(url.includes('offset=0'))return json(Array.from({length:1000},(_,i)=>({id:'draft-'+i,employee_id:'cook',departamento:'Cocina',month:'2026-07',status:'calculated',bonus_final:1})));
        return json([{id:'late-pending',employee_id:'cook',departamento:'Cocina',month:'2026-06',status:'approved',bonus_final:12}]);
      }
      return json(options.approved||approved);
    }
    if(url.includes('/entrenadores_incentivos_mes?'))return json(options.trainers||trainers);
    if(url.includes('/housekeeping_semester_incentives?'))return json(options.awards||awards);
    if(url.includes('/incentivos_liquidaciones?'))return json(options.liquidations||liquidations);
    if(url.includes('/recepcion_ventas?'))return json(sales);
    if(url.includes('/fio?'))return json([{employee_id:'waiter',incentive_month:'2026-10',status:'Validado',applied_points:100,saldado:false}]);
    throw Error('Unexpected fixture '+method+' '+url);
  };
  try{return await run(calls);}finally{globalThis.fetch=fetch;for(const k of keys){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
}
const heads=[
  {id:'chef-head',area:'Cocina',puesto:'Jefe de Cocina',rol:'chef',expected:['cook']},
  {id:'sala-head',area:'Sala',puesto:'Jefe de Sala',rol:'supervisor',expected:['waiter']},
  {id:'reception-head',area:'Recepción',puesto:'Jefe de Recepción',rol:'jefe_recepcion',expected:['reception']},
  {id:'trainer-head',area:'SYNCROLAB',puesto:'Coordinador(a) de Entrenadores',rol:'coord_entrenadores',expected:['trainer']},
  {id:'physio-head',area:'SYNCROLAB',puesto:'Coordinador(a) de Fisioterapeutas',rol:'coord_fisioterapeutas',expected:['physio']},
  {id:'lab-head',area:'SYNCROLAB',puesto:'Coordinador(a) de Atención al Cliente',rol:'coord_recepcion_syncrolab',expected:['lab-reception']},
  {id:'hk-head',area:'Housekeeping',puesto:'Gobernanta',rol:'gobernante',expected:['hk']},
  {id:'fb-head',area:'F&B',puesto:'F&B Manager',rol:'fb',expected:['cook','waiter']},
  {id:'club-head',area:'SYNCROLAB',puesto:'Club Manager',rol:'jefe',expected:['lab-reception','physio','trainer']}
];

test('jefes de cada departamento y coordinadores SYNCROLAB reciben solo su equipo y nunca pagos liquidados',async()=>{
  for(const head of heads){
    const actor={...head,nombre:'Responsable',estado:'Activo'};
    await mocked(actor,async calls=>{
      const response=await department(req('/api/department-incentives'));
      assert.equal(response.status,200,head.puesto);
      assert.equal(response.headers.get('Cache-Control'),'no-store');
      const data=await response.json();
      assert.deepEqual([...new Set(data.records.map(r=>r.employee_id))].sort(),head.expected,head.puesto);
      assert.ok(data.records.every(r=>r.state==='pending'));
      assert.equal(data.permissions.can_liquidate,false);
      const text=JSON.stringify(data);
      assert.doesNotMatch(text,/PRIVATE/);
      for(const row of data.records)for(const field of ['liquidado_por','liquidado_at','liquidado_fotos','precio_hora','base_neto','pin','email'])assert.ok(!(field in row));
      assert.ok(!data.records.some(r=>/paid|shadow|draft/.test(r.id)));
      assert.ok(calls.every(call=>call.method==='GET'));
      if(head.rol==='chef')assert.ok(!data.records.some(r=>r.id==='wrong-department'));
      if(head.rol==='jefe_recepcion')assert.equal(data.records[0].amount,10);
    });
  }
});

test('Contabilidad, RRHH, adjunto y empleados carecen de consulta global o departamental',async()=>{
  const actors=[
    {id:'accountant',rol:'contable',puesto:'Contable',area:'Administración'},
    {id:'hr',rol:'tecnico_rrhh',puesto:'Técnico de Recursos Humanos',area:'Administración'},
    {id:'director',rol:'adjunto',puesto:'Adjunto Directivo',area:'Administración'},
    {...staff[0]}
  ];
  for(const actor of actors)await mocked({...actor,estado:'Activo'},async calls=>{
    for(const [handler,path]of [[department,'/api/department-incentives'],[reception,'/api/reception-incentives?mes=2026-10'],[housekeeping,'/api/housekeeping-semester-incentives?periodo=2026-S1']]){
      const response=await handler(req(path));
      assert.equal(response.status,403,actor.rol+' '+path);
    }
    assert.ok(!calls.some(c=>/employee_incentives|incentivos_liquidaciones|entrenadores_incentivos_mes|recepcion_ventas|housekeeping_semester_incentives/.test(c.url)));
  });
});

test('el jefe tampoco puede entrar en endpoints de liquidación ni seleccionar otro departamento o empleado',async()=>{
  await mocked({...heads[0],estado:'Activo'},async calls=>{
    for(const suffix of ['?department=Sala','?employee_id=waiter','?empleado_id=waiter','?rol=admin']){
      const response=await department(req('/api/department-incentives'+suffix));
      assert.equal(response.status,400);
    }
    assert.equal((await department(req('/api/department-incentives','POST'))).status,405);
    assert.equal((await reception(req('/api/reception-incentives?mes=2026-10'))).status,403);
    assert.equal((await housekeeping(req('/api/housekeeping-semester-incentives?periodo=2026-S1'))).status,403);
    assert.ok(calls.every(c=>c.method==='GET'));
    assert.ok(!calls.some(c=>c.url.includes('/employees?select=')));
  });
});

test('cada empleado recibe sus pendientes y desaparecen cuando la fuente registra la liquidación',async()=>{
  for(const employee of staff)await mocked(employee,async()=>{
    const response=await personal(req('/api/pending-incentives'));
    assert.equal(response.status,200);
    const data=await response.json();
    assert.ok(data.records.every(r=>r.state==='pending'&&!('employee_id'in r)&&!('employee_name'in r)));
    assert.ok(!data.records.some(r=>/paid|shadow|draft/.test(r.id)));
    if(employee.id==='reception')assert.deepEqual(data.records.map(r=>r.amount),[10]);
    if(employee.id==='trainer')assert.deepEqual(data.records.map(r=>r.id),['trainer-pending']);
    if(employee.id==='hk')assert.deepEqual(data.records.map(r=>r.id),['hk-pending']);
    assert.equal((await personal(req('/api/pending-incentives?employee_id=other'))).status,400);
  });
  await mocked(staff[3],async()=>{
    const response=await personal(req('/api/pending-incentives'));
    assert.deepEqual((await response.json()).records,[]);
  },{trainers:trainers.map(r=>({...r,liquidado:true}))});
  await mocked(staff[6],async()=>{
    const response=await personal(req('/api/pending-incentives'));
    assert.deepEqual((await response.json()).records,[]);
  },{awards:awards.map(r=>({...r,estado:'liquidado'}))});
  await mocked(staff[2],async()=>{
    const response=await personal(req('/api/pending-incentives'));
    assert.deepEqual((await response.json()).records,[]);
  },{liquidations:[...liquidations,{empleado_id:'reception',mes:'2026-10'}]});
});

test('el acceso directo a control y marcar liquidado es exclusivamente Administrador',()=>{
  for(const rol of ['admin','contable','adjunto','tecnico_rrhh','chef','supervisor','jefe_recepcion','gobernante','coord_entrenadores','empleado']){
    assert.equal(canControlIncentives({rol}),rol==='admin');
    assert.equal(canMarkLiquidation({rol}),rol==='admin');
  }
  assert.equal(canReadDepartmentIncentives({rol:'contable',area:'Cocina'}),false);
});

test('la paginación conserva pendientes posteriores a mil registros y un error no se presenta como saldo cero',async()=>{
  await mocked({...heads[0],estado:'Activo'},async calls=>{
    const response=await department(req('/api/department-incentives'));
    assert.equal(response.status,200);
    assert.deepEqual((await response.json()).records.map(r=>r.id),['late-pending']);
    assert.ok(calls.some(c=>c.url.includes('offset=1000')));
  },{pagination:true});
  await mocked({...heads[0],estado:'Activo'},async()=>{
    assert.equal((await department(req('/api/department-incentives'))).status,503);
  },{fail:true});
});

test('duplicados de una mensualidad o semestre pagados no reaparecen como pendientes',()=>{
  assert.deepEqual(pendingIncentivesFor('trainer',{trainers:trainers.slice(1)}),[]);
  assert.deepEqual(pendingIncentivesFor('hk',{housekeeping:awards.slice(1)}),[]);
});

test('protección preparada limita cuatro lecturas financieras sin cambiar datos, grants o protección de pagos',()=>{
  const sql=fs.readFileSync(new URL('../supabase/changes/incentives_admin_read_ceiling.sql',import.meta.url),'utf8');
  assert.match(sql,/ALTER POLICY syncro_finance_read_ceiling/);
  assert.match(sql,/RESTRICTIVE/);
  assert.match(sql,/''role''\) = ''admin''/);
  assert.doesNotMatch(sql,/\b(?:INSERT INTO|UPDATE public|DELETE FROM|DROP|GRANT|REVOKE|CREATE FUNCTION|CREATE TRIGGER)\b/i);
});
