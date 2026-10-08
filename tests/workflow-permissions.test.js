import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {canControlIncentives,canMarkLiquidation,pendingIncentivesFor} from '../lib/incentive-access.js';
import {calculateTrainerProduction,trainerProductionProjection} from '../lib/trainer-production.js';
import {monthlyHoursInScope} from '../api/monthly-hours.js';
import monthly from '../api/monthly-hours.js';
import pending from '../api/pending-incentives.js';
import production from '../api/trainer-production.js';
import {canReadHousekeeping,canLiquidateHousekeeping} from '../api/housekeeping-semester-incentives.js';
import {canReadReceptionIncentives,canLiquidateReceptionIncentives} from '../api/reception-incentives.js';
import {employeeListForActor} from '../api/auth/employees.js';

const employee={id:'employee-a',nombre:'Persona A',rol:'empleado',area:'SYNCROLAB',puesto:'Entrenador(a)',estado:'Activo',bitrix_user_id:101};
const trainerB={...employee,id:'employee-b',nombre:'Persona B'};
const unrelated={...employee,id:'employee-c',nombre:'Persona C',area:'Cocina',puesto:'Cocinero'};
const counts={dir_efectiva:90,dir_no_efectiva:2,pt:2,pt_duo:2,pt_30:2,val_funcional:2,visbody:2,banera_hielo:2};
const approved=[
 {id:'pending',employee_id:employee.id,departamento:'Sala',month:'2026-10',bonus_final:40,status:'approved'},
 {id:'paid',employee_id:employee.id,departamento:'Sala',month:'2026-09',bonus_final:40,status:'approved'},
 {id:'draft',employee_id:employee.id,departamento:'Sala',month:'2026-08',bonus_final:40,status:'calculated'},
 {id:'other',employee_id:trainerB.id,departamento:'Sala',month:'2026-10',bonus_final:40,status:'approved'},
 {id:'paid-duplicate',employee_id:employee.id,departamento:'Entrenadores',month:'2026-08',bonus_final:99,status:'approved'}
];
const trainers=[
 {id:'trainer-pending',employee_id:employee.id,employee_nombre:employee.nombre,ym:'2026-10',incentivo_bruto:90,liquidado:false,n_pt:2},
 {id:'trainer-paid',employee_id:employee.id,employee_nombre:employee.nombre,ym:'2026-08',incentivo_bruto:99,liquidado:true,liquidado_por:'Internal',precio_hora:900},
 {id:'trainer-other',employee_id:trainerB.id,employee_nombre:trainerB.nombre,ym:'2026-10',incentivo_bruto:55,liquidado:false}
];
const liquidations=[{empleado_id:employee.id,mes:'2026-09'}];

test('financial capability matrix excludes leaders, HR and adjunto',()=>{
 for(const rol of ['admin','contable','adjunto','adjunto_directivo','tecnico_rrhh','chef','gobernante','coord_entrenadores','empleado']){
  assert.equal(canControlIncentives({rol}),rol==='admin');
  assert.equal(canMarkLiquidation({rol}),rol==='admin');
  assert.equal(canReadHousekeeping({rol}),rol==='admin');
  assert.equal(canReadReceptionIncentives({rol}),rol==='admin');
  assert.equal(canLiquidateHousekeeping({rol}),rol==='admin');
  assert.equal(canLiquidateReceptionIncentives({rol}),rol==='admin');
 }
});
test('paid, draft and third-party incentives never appear, even with a generic duplicate',()=>{
 const rows=pendingIncentivesFor(employee.id,{approved,trainers,liquidations});
 assert.deepEqual(rows.map(r=>r.id).sort(),['pending','trainer-pending']);
 assert.ok(rows.every(r=>r.state==='pending'));
 const reception=pendingIncentivesFor(employee.id,{liquidations,reception:[{id:'recep-pending',employee_id:employee.id,period:'2026-10',amount:25},{id:'recep-paid',employee_id:employee.id,period:'2026-09',amount:25}]});
 assert.deepEqual(reception.map(r=>r.id),['recep-pending']);
 const fields=new Set(rows.flatMap(r=>Object.keys(r)));
 for(const field of ['employee_nombre','liquidado','liquidado_por','reviewed_by','precio_hora'])assert.ok(!fields.has(field));
 const paid=pendingIncentivesFor(employee.id,{trainers:trainers.map(r=>({...r,liquidado:true}))});
 assert.deepEqual(paid,[]);
});
test('production uses server configuration and retains previous formula',()=>{
 const calculated=calculateTrainerProduction({kpi:counts,planes_online:2,incentivo_bruto:999999},{inc_metodo:'umbral',inc_umbral:85});
 assert.equal(calculated.sesiones_efectivas,99);assert.equal(calculated.incentivo_bruto,152);
 const hourly=calculateTrainerProduction({kpi:counts,planes_online:2},{inc_metodo:'precio_hora',inc_precio_hora:10,inc_base_neto:100});
 assert.equal(hourly.horas_efectivas,101);assert.equal(hourly.incentivo_bruto,922);
 assert.throws(()=>calculateTrainerProduction({kpi:{...counts,pt:-1},planes_online:0},{}));
 assert.throws(()=>calculateTrainerProduction({kpi:counts,planes_online:0},{inc_metodo:'precio_hora',inc_precio_hora:0}));
 assert.deepEqual(Object.keys(trainerProductionProjection(trainers[1])).filter(k=>/liquid|incentivo|precio|base_neto/.test(k)),[]);
});
test('monthly time scope and employee projection preserve operational limits',()=>{
 assert.equal(monthlyHoursInScope(employee,trainerB),false);
 assert.equal(monthlyHoursInScope(employee,employee),true);
 const leader={...employee,id:'lead',rol:'coord_entrenadores',puesto:'Coordinador(a) de Entrenadores'};
 assert.equal(monthlyHoursInScope(leader,trainerB),true);
 assert.equal(monthlyHoursInScope(leader,unrelated),false);
 for(const rol of ['admin','adjunto','tecnico_rrhh'])assert.equal(monthlyHoursInScope({...employee,rol},unrelated),true);
 const projected=employeeListForActor([{...trainerB,inc_precio_hora:500,inc_metodo:'precio_hora'}],leader);
 assert.equal(projected[0].inc_precio_hora,undefined);
 assert.equal(projected[0].inc_metodo,undefined);
});

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const token=encode({alg:'none'})+'.'+encode({app_metadata:{syncro_authz_version:7}})+'.signature';
function request(path,body){return new Request('https://syncro.example'+path,{method:body?'POST':'GET',
 headers:{Authorization:'Bearer '+token,Origin:'https://syncro.example','Content-Type':'application/json'},
 ...(body?{body:JSON.stringify(body)}:{})});}
async function mocked(actor,run,options={}){
 const keys=['SYNCRO_AUTH_ENABLED','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_KEY'];
 const env=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const originalFetch=globalThis.fetch;const calls=[];
 Object.assign(process.env,{SYNCRO_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_KEY:'fixture-service'});
 globalThis.fetch=async(input,init={})=>{
  const url=String(input),method=init.method||'GET';const body=init.body?JSON.parse(init.body):null;
  calls.push({url,method,body});
  if(url.includes('/auth/v1/user'))return json({id:'auth-fixture'});
  if(url.includes('/syncro_auth_identities?'))return json([{employee_id:actor.id,auth_user_id:'auth-fixture',active:true,force_pin_change:false,authz_version:7}]);
  if(url.includes('/employees?id=eq.'+actor.id))return json([actor]);
  if(url.includes('/employees?'))return json([employee,trainerB,unrelated]);
  if(url.includes('/recepcion_ventas?'))return json([{id:'sale-own',empleado_id:employee.id,fecha:'2026-10-05',tipo_venta:'desayuno',importe:110},{id:'sale-paid',empleado_id:employee.id,fecha:'2026-09-05',tipo_venta:'desayuno',importe:110},{id:'sale-other',empleado_id:trainerB.id,fecha:'2026-10-05',tipo_venta:'desayuno',importe:11000}]);
  if(url.includes('/fio?'))return json([]);
  if(url.includes('/employee_incentives?'))return json(approved);
  if(url.includes('/incentivos_liquidaciones?'))return json(liquidations);
  if(url.includes('/housekeeping_semester_incentives?'))return json([]);
  if(url.includes('/entrenadores_incentivos_mes')){
   if(method==='GET')return json(options.trainers||trainers);
   if(method==='PATCH')return json([{id:'trainer-pending',...body}]);
   if(method==='POST')return new Response(null,{status:204});
  }
  if(url.includes('/bitrix_time_records?'))return json([employee,trainerB,unrelated].map(e=>({employee_id:e.id,fecha_operativa:'2026-10-05',duration_seconds:3600,start_ts:'2026-10-05T08:00:00Z',end_ts:'2026-10-05T09:00:00Z'})));
  throw new Error('Unexpected fixture request '+method+' '+url);
 };
 try{return await run(calls);}finally{globalThis.fetch=originalFetch;for(const k of keys){if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}}
}
test('personal pending endpoint rejects IDOR and returns no settlement history',async()=>{
 await mocked(employee,async calls=>{
  const forbidden=await pending(request('/api/pending-incentives?employee_id=employee-b'));assert.equal(forbidden.status,400);
  const res=await pending(request('/api/pending-incentives'));assert.equal(res.status,200);
  const body=await res.json();assert.deepEqual(body.records.map(r=>r.id).sort(),['pending','trainer-pending']);
  assert.ok(!JSON.stringify(body).includes('trainer-paid'));assert.ok(!JSON.stringify(body).includes('Internal'));
  assert.ok(calls.every(c=>c.method==='GET'));
 });
});
test('trainer production GET returns own counts without payment fields',async()=>{
 await mocked(employee,async()=>{
  const res=await production(request('/api/trainer-production?mes=2026-10'));assert.equal(res.status,200);
  const body=await res.json();assert.ok(body.records.every(r=>r.employee_id===employee.id));
  assert.ok(!JSON.stringify(body).includes('liquidado'));assert.ok(!JSON.stringify(body).includes('incentivo_bruto'));
 });
});
test('employee, contable and adjunto cannot mark incentives paid',async()=>{
 for(const rol of ['empleado','contable','adjunto']){
  const actor={...employee,rol,puesto:rol==='contable'?'Contable':rol==='adjunto'?'Adjunto Directivo':employee.puesto};
  await mocked(actor,async calls=>{
   const res=await production(request('/api/trainer-production',{action:'liquidate',employee_id:employee.id,mes:'2026-10'}));
   assert.equal(res.status,403);assert.ok(calls.every(c=>c.method==='GET'));
  });
 }
});
test('import is scoped, never deletes a month and ignores forged amounts',async()=>{
 const actor={...employee,id:'lead',rol:'coord_entrenadores',puesto:'Coordinador(a) de Entrenadores'};
 await mocked(actor,async calls=>{
  const good=await production(request('/api/trainer-production',{action:'import',mes:'2026-10',rows:[{employee_id:employee.id,kpi:counts,planes_online:2,incentivo_bruto:999999}]}));
  assert.equal(good.status,200);
  const written=calls.find(c=>c.method==='POST'&&c.url.includes('/entrenadores_incentivos_mes'));
  assert.equal(written.body[0].id,'trainer-pending');assert.equal(written.body[0].incentivo_bruto,152);
  assert.ok(!('liquidado' in written.body[0]));assert.ok(!calls.some(c=>c.method==='DELETE'));
  const forbidden=await production(request('/api/trainer-production',{action:'import',mes:'2026-10',rows:[{employee_id:unrelated.id,kpi:counts,planes_online:0}]}));
  assert.equal(forbidden.status,403);
 });
});
test('reimport rejects paid records before any write',async()=>{
 await mocked({...employee,id:'admin',rol:'admin',puesto:'Administrador'},async calls=>{
  const res=await production(request('/api/trainer-production',{action:'import',mes:'2026-08',rows:[{employee_id:employee.id,kpi:counts,planes_online:0}]}));
  assert.equal(res.status,409);assert.ok(calls.every(c=>c.method==='GET'));
 },{trainers:[trainers[1]]});
});
test('admin cache cannot expose company hours to an employee or department leader',async()=>{
 await mocked({...employee,id:'admin',rol:'admin',puesto:'Administrador'},async()=>{
  const res=await monthly(request('/api/monthly-hours?desde=2026-10-01&hasta=2026-10-07&fresh=1'));
  assert.equal(res.status,200);assert.equal((await res.json()).employees.length,3);
 });
 await mocked(employee,async()=>{
  const res=await monthly(request('/api/monthly-hours?desde=2026-10-01&hasta=2026-10-07'));
  assert.equal(res.status,200);const data=await res.json();
  assert.deepEqual(data.employees.map(e=>e.id),[employee.id]);assert.equal(data.n_records,1);
  assert.equal(data.employees[0].rankGlobalOf,1);assert.equal(data.states.closed,'[NO DATA]');
 });
 await mocked({...employee,id:'lead',rol:'coord_entrenadores',puesto:'Coordinador(a) de Entrenadores'},async()=>{
  const res=await monthly(request('/api/monthly-hours?desde=2026-10-01&hasta=2026-10-07'));
  assert.equal(res.status,200);assert.deepEqual((await res.json()).employees.map(e=>e.id),[employee.id,trainerB.id]);
 });
});

test('personal Reception pending reuses closure sales and hides already settled months',async()=>{
 await mocked({...employee,area:'Recepción',puesto:'Recepcionista'},async()=>{
  const response=await pending(request('/api/pending-incentives'));
  assert.equal(response.status,200);
  const records=(await response.json()).records.filter(r=>r.source==='closure_sales');
  assert.equal(records.length,1);assert.equal(records[0].period,'2026-10');assert.equal(records[0].amount,10);
  assert.ok(records.every(r=>!Object.keys(r).some(k=>k.startsWith('liquidado'))));
 });
});


test('accounting reads an employee projection without identity or personal incentive configuration',()=>{
 const row={...employee,pin:'fixture-secret',email:'fixture@example.test',direccion:'fixture-address',coste:25,inc_precio_hora:100};
 const actor={id:'accountant',rol:'contable',area:'Administración',puesto:'Contable'};
 const projected=employeeListForActor([row],actor)[0];
 assert.equal(projected.coste,25);
 for(const field of ['pin','email','direccion','inc_precio_hora'])assert.ok(!(field in projected));
 assert.equal(projected.id,employee.id);
});


test('alert matching retains unmatched alerts without granting staff creation to operational roles',async()=>{
 const source=readFileSync(new URL('../fichaje.js',import.meta.url),'utf8');
 for(const rol of ['admin','adjunto','tecnico_rrhh','contable','empleado']){
  const writes=[];
  const context=vm.createContext({window:{},currentUser:{rol},isAdmin:user=>user.rol==='admin',
   getDB:async()=>[],dbInsert:async(table,row)=>{writes.push({table,row});return row;},invalidateCache:()=>{}});
  vm.runInContext(source,context);
  await context.fichajeEjecutarMatching([{nombre_empleado:'Persona sin ficha'}]);
  assert.equal(context._fichajeMatchResult.length,1);
  assert.equal(context._fichajeMatchResult[0].status,rol==='admin'?'creado':'sin_perfil');
  assert.equal(writes.length,rol==='admin'?1:0);
  if(writes.length){assert.equal(writes[0].table,'employees');assert.equal(writes[0].row.estado,'Sin asignar');assert.equal(writes[0].row.rol,'empleado');}
 }
});
