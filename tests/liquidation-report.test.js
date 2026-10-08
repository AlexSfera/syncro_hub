import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler,{canDownloadLiquidationReport,reportMonth,liquidationReportCsv} from '../api/liquidation-report.js';

const sources={
 reception:[
  {id:'r1',empleado_id:'r',empleado_nombre:'Persona R',mes:'2026-08',incentivo_final:'10.10',liquidado_at:'2026-09-30T22:15:00Z',notas:'PRIVATE',penalizacion_fio:999},
  {id:'r2',empleado_id:'r',empleado_nombre:'Persona R',mes:'2026-09',incentivo_final:'20.20',liquidado_at:'2026-10-03T10:00:00Z'},
  {id:'old',empleado_id:'old',empleado_nombre:'Otro mes',mes:'2026-09',incentivo_final:777,liquidado_at:'2026-09-30T21:59:59Z'}
 ],
 trainers:[
  {id:'t1',employee_id:'t',employee_nombre:'Persona T',ym:'2026-09',incentivo_bruto:'0.10',liquidado:true,liquidado_ts:'2026-10-05T10:00:00Z',liquidado_fotos:['PRIVATE']},
  {id:'t2',employee_id:'t',employee_nombre:'Persona T',ym:'2026-08',incentivo_bruto:'0.20',liquidado:true,liquidado_ts:'2026-10-05T10:00:00Z'},
  {id:'pending',employee_id:'pending',employee_nombre:'Pendiente',ym:'2026-10',incentivo_bruto:888,liquidado:false}
 ],
 housekeeping:[
  {id:'h1',employee_id:'h',employee_nombre:'Persona H',periodo:'2026-S1',importe_premio:'250',estado:'liquidado',liquidado_at:'2026-10-31T23:00:00Z',dias_baja:999},
  {id:'h2',employee_id:'h2',employee_nombre:'Persona H2',periodo:'2026-S1',importe_premio:'320',estado:'liquidado',liquidado_at:'2026-10-31T22:59:59Z'},
  {id:'hp',employee_id:'hp',employee_nombre:'HK pendiente',periodo:'2026-S2',importe_premio:999,estado:'pendiente'}
 ]
};
test('el informe agrupa por mes real de pago en Madrid, departamento y empleado con totales exactos',()=>{
 const csv=liquidationReportCsv('2026-10',sources);
 assert.match(csv,/"Empleado";"Recepción Hotel";"Persona R";"r";"30,30"/);
 assert.match(csv,/"Empleado";"Entrenadores";"Persona T";"t";"0,30"/);
 assert.match(csv,/"Total departamento";"Housekeeping";"";"";"320,00"/);
 assert.match(csv,/"Total general";"";"";"";"350,60"/);
 assert.doesNotMatch(csv,/PRIVATE|999|888|777|Pendiente|Persona H";/);
 assert.match(liquidationReportCsv('2026-11',sources),/"250,00"/);
});
test('ventanas de mes respetan cambios de hora y rechazan fechas manipuladas',()=>{
 assert.deepEqual(reportMonth('2026-10'),{id:'2026-10',start:'2026-09-30T22:00:00.000Z',end:'2026-10-31T23:00:00.000Z'});
 assert.deepEqual(reportMonth('2026-03'),{id:'2026-03',start:'2026-02-28T23:00:00.000Z',end:'2026-03-31T22:00:00.000Z'});
 for(const bad of ['2019-12','2026-00','2026-13','2026-1','2026-10&role=admin','2101-01'])assert.equal(reportMonth(bad),null);
});
test('CSV escapa celdas y neutraliza fórmulas procedentes de nombres e identificadores',()=>{
 const row={...sources.reception[0],empleado_id:'=1+1',empleado_nombre:'  @SUM(1;2)\n"Prueba"'};
 const csv=liquidationReportCsv('2026-10',{reception:[row]});
 assert.match(csv,/"'  @SUM\(1;2\) ""Prueba"""/);assert.match(csv,/"'=1\+1"/);
 assert.equal(csv.split('\r\n').length,5);
});
test('datos incompletos o una liquidación duplicada impiden emitir totales engañosos',()=>{
 const row=sources.reception[0];
 for(const changed of [{incentivo_final:null},{incentivo_final:'bad'},{liquidado_at:null},{empleado_id:null}])
   assert.throws(()=>liquidationReportCsv('2026-10',{reception:[{...row,...changed}]}));
 assert.throws(()=>liquidationReportCsv('2026-10',{reception:[row,{...row,id:'duplicate'}]}),/Duplicate/);
 assert.match(liquidationReportCsv('2026-07',sources),/"Total general";"";"";"";"0,00"/);
});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const token=encode({alg:'none'})+'.'+encode({app_metadata:{syncro_authz_version:7,role:'admin'},user_metadata:{role:'admin'}})+'.fixture';
const request=(path='/api/liquidation-report?mes=2026-10',method='GET',auth=true)=>new Request('https://syncro.test'+path,{method,headers:auth?{Authorization:'Bearer '+token}:{}});
async function mocked(rol,run,options={}){
 const keys=['SYNCRO_AUTH_ENABLED','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_KEY'];
 const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch,calls=[];
 Object.assign(process.env,{SYNCRO_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_KEY:'fixture-service'});
 const actor={id:'actor',nombre:'Actor de prueba',rol,area:'Administración',estado:'Activo',puesto:rol==='admin'?'Administrador':rol==='contable'?'Contable':'Empleado'};
 globalThis.fetch=async(input,init={})=>{
  const url=new URL(String(input));calls.push({url,method:init.method||'GET'});
  if(url.pathname==='/auth/v1/user')return json({id:'auth-actor'});
  if(url.pathname.endsWith('/syncro_auth_identities'))return json([{employee_id:'actor',auth_user_id:'auth-actor',active:options.active!==false,force_pin_change:false,authz_version:options.stale?8:7}]);
  if(url.pathname.endsWith('/employees'))return json([actor]);
  const table=url.pathname.split('/').at(-1);
  if(options.fail&&table==='entrenadores_incentivos_mes')return json({message:'offline'},503);
  if(url.searchParams.get('select')==='id')return json(options.undated?[{id:'undated'}]:[]);
  if(table==='incentivos_liquidaciones'){
   if(options.pagination){
    return json(Number(url.searchParams.get('offset'))===0
      ?Array.from({length:1000},(_,i)=>({...sources.reception[0],id:'r'+i,empleado_id:'r'+i,incentivo_final:1}))
      :[{...sources.reception[0],id:'late',empleado_id:'late',incentivo_final:2}]);
   }
   return json(sources.reception.filter(r=>r.id!=='old'));
  }
  if(table==='entrenadores_incentivos_mes')return json(sources.trainers);
  if(table==='housekeeping_semester_incentives')return json(sources.housekeeping);
  throw Error('Unexpected request '+url);
 };
 try{return await run(calls);}finally{globalThis.fetch=original;for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
}
test('solo Administrador y Contabilidad descargan CSV de liquidaciones, sin notas, FIO ni comprobantes',async()=>{
 for(const rol of ['admin','contable'])await mocked(rol,async calls=>{
  const response=await handler(request());
  assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/text\/csv/);
  assert.equal(response.headers.get('Content-Disposition'),'attachment; filename="liquidaciones-2026-10.csv"');
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal(response.headers.get('Vary'),'Authorization, Cookie');
  const csv=await response.text();assert.match(csv,/"350,60"/);assert.doesNotMatch(csv,/PRIVATE|dias_baja|penalizacion_fio/);
  assert.ok(calls.every(c=>c.method==='GET'));
  const paidCalls=calls.filter(c=>!['user','syncro_auth_identities','employees'].includes(c.url.pathname.split('/').at(-1)));
  assert.ok(paidCalls.every(c=>!c.url.searchParams.get('select').includes('*')));
  assert.ok(paidCalls.some(c=>c.url.searchParams.get('liquidado')==='is.true'));
  assert.ok(paidCalls.some(c=>c.url.searchParams.get('estado')==='eq.liquidado'));
 });
});
test('jefes, adjunto, RRHH y empleados no consultan liquidaciones aunque falsifiquen el rol del token',async()=>{
 for(const rol of ['jefe','chef','supervisor','jefe_recepcion','gobernante','coord_entrenadores','adjunto','tecnico_rrhh','empleado'])await mocked(rol,async calls=>{
  assert.equal((await handler(request())).status,403);
  assert.equal(canDownloadLiquidationReport({rol}),false);
  assert.ok(calls.every(c=>!/incentivos|semester/.test(c.url.pathname)));
 });
});
test('sesión ausente, revocada o con versión obsoleta no permite descargar',async()=>{
 await mocked('contable',async()=>assert.equal((await handler(request(undefined,'GET',false))).status,401));
 for(const options of [{active:false},{stale:true}])await mocked('contable',async calls=>{
  assert.equal((await handler(request())).status,401);
  assert.ok(!calls.some(c=>/incentivos|semester/.test(c.url.pathname)));
 },options);
});
test('el endpoint rechaza escritura, otras proyecciones, selección de persona y mes ambiguo',async()=>{
 await mocked('contable',async calls=>{
  assert.equal((await handler(request(undefined,'POST'))).status,405);
  for(const query of ['', '?mes=2026-10&employee_id=other','?mes=2026-10&format=json','?mes=2026-10&mes=2026-09','?mes=2026-13','?mes=2026-10&rol=admin'])
   assert.equal((await handler(request('/api/liquidation-report'+query))).status,400);
  assert.ok(!calls.some(c=>/incentivos|semester/.test(c.url.pathname)));
 });
});
test('paginación recupera más de mil liquidaciones y los fallos impiden un CSV parcial',async()=>{
 await mocked('contable',async calls=>{
  const response=await handler(request());assert.equal(response.status,200);
  assert.match(await response.text(),/"late";"2,00"/);
  assert.ok(calls.some(c=>c.url.searchParams.get('offset')==='1000'));
 },{pagination:true});
 for(const options of [{fail:true},{undated:true}])await mocked('contable',async()=>{
  const response=await handler(request());assert.equal(response.status,503);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.match((await response.json()).error,/\[NO DATA\]/);
 },options);
});
test('el botón de descarga bloquea la respuesta si cambia la sesión o la pantalla',async()=>{
 const source=fs.readFileSync(new URL('../workflow-ui.js',import.meta.url),'utf8');
 for(const change of ['session','screen','role']){
  const nodes={'workflow-liquidation-month':{value:'2026-10'},'workflow-liquidation-download':{},'workflow-liquidation-status':{}};
  let resolve,downloads=0;
  const ctx=vm.createContext({window:{showScreen(){}},document:{getElementById:id=>nodes[id],querySelectorAll:()=>[],createElement:()=>({click(){downloads++;},remove(){}}),body:{appendChild(){}}},
   currentUser:{id:'actor',rol:'contable'},canDownloadLiquidationReportUI:u=>['admin','contable'].includes(u?.rol),
   syncroSupabaseFetch:()=>new Promise(r=>resolve=r),toast(){},setTimeout(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},getScreens:()=>[]});
  vm.runInContext(source,ctx);
  const pending=ctx.window.workflowDownloadLiquidations();
  if(change==='session')ctx.currentUser={id:'other',rol:'contable'};
  if(change==='role')ctx.currentUser={id:'actor',rol:'empleado'};
  if(change==='screen')ctx.window.workflowClearSession();
  resolve({ok:true,blob:async()=>new Blob(['fixture'])});await pending;
  assert.equal(downloads,0,change);
 }
});
