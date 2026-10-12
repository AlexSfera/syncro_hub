import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import handler from '../api/suggestions.js';
import { canReadSuggestion, suggestionDraft, suggestionMove, suggestionProjection } from '../lib/suggestions.js';

const employee = { id: 'E1', nombre: 'Persona de prueba', area: 'Cocina', rol: 'empleado', puesto: 'Cocinero', estado: 'Activo' };
const admin = { ...employee, id: 'A1', area: 'Administración', rol: 'admin', puesto: 'Administrador' };
const chief = { ...employee, id: 'C1', rol: 'chef', puesto: 'Jefe de Cocina' };
const row = { id: 'N1', employee_id: 'E1', nombre: 'Persona de prueba', area: 'Cocina', categoria: 'Mejora', texto: 'Descripción ficticia', created_at: '2026-10-12T09:00:00Z', titulo: 'Mejora ficticia', modulo: 'Turnos', estado: 'pendiente', posicion: null, respuesta: '', version: 1 };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = encode({alg:'none'}) + '.' + encode({app_metadata:{syncro_authz_version:7},user_metadata:{role:'admin'}}) + '.fixture';
const json = (value, status=200) => new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json'}});
function request(method='GET',body,options={}) {
  return new Request('https://fixture.test/api/suggestions'+(options.query||''), { method,
    headers: { ...(options.noAuth?{}:{Authorization:'Bearer '+token}),Origin:options.origin||'https://fixture.test','Content-Type':'application/json' },
    ...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)}) });
}
async function mocked(actor,run,options={}) {
  const keys=['SYNCRO_AUTH_ENABLED','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_KEY'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]])),original=globalThis.fetch,calls=[];
  Object.assign(process.env,{SYNCRO_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_KEY:'fixture-service'});
  globalThis.fetch=async(input,init={})=>{
    const url=new URL(String(input)),method=init.method||'GET',body=init.body?JSON.parse(init.body):null;
    calls.push({url,method,body});
    if(url.pathname==='/auth/v1/user')return json({id:'auth-fixture'});
    if(url.pathname.endsWith('/syncro_auth_identities'))return json([{employee_id:actor.id,auth_user_id:'auth-fixture',active:options.active!==false,force_pin_change:!!options.force,authz_version:options.stale?8:7}]);
    if(url.pathname.endsWith('/employees'))return json([actor]);
    if(url.pathname.endsWith('/employee_notes')) {
      if(options.fail)return json({error:'Unavailable'},503);
      if(method==='POST')return json(options.emptySave?[]:[{...row,...body}]);
      if(options.page)return json(Number(url.searchParams.get('offset'))===0?Array.from({length:1000},(_,i)=>({...row,id:'N'+i})):[{...row,id:'last'}]);
      return json(options.rows||[row,{...row,id:'N2',employee_id:'E2'}, {...row,id:'N3',employee_id:'E3',area:'Sala'}]);
    }
    if(url.pathname.endsWith('/rpc/syncro_move_suggestion'))return json(options.rpc||{record:{...row,estado:body.p_estado,respuesta:body.p_respuesta,version:2,posicion:1}});
    throw Error('Unexpected fixture request');
  };
  try { return await run(calls); } finally { globalThis.fetch=original;for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];} }
}
test('visibility preserves own notes, department leadership and direction without employee IDOR',()=>{
  assert.equal(canReadSuggestion(employee,row),true);
  assert.equal(canReadSuggestion(employee,{...row,employee_id:'E2'}),false);
  assert.equal(canReadSuggestion(chief,{...row,employee_id:'E2'}),true);
  assert.equal(canReadSuggestion(chief,{...row,employee_id:'E3',area:'Sala'}),false);
  assert.equal(canReadSuggestion(admin,{...row,employee_id:'E3',area:'Sala'}),true);
  assert.equal(canReadSuggestion({...employee,rol:'adjunto'},{...row,employee_id:'E3',area:'Sala'}),true);
  assert.equal(canReadSuggestion(null,row),false);
});
test('proposal identity and pending state come from the trusted actor; forged metadata is rejected',()=>{
  const draft=suggestionDraft({titulo:'  Mejora propuesta ',texto:' Texto de prueba ',modulo:'Fichaje'},employee);
  assert.equal(draft.employee_id,'E1');assert.equal(draft.estado,'pendiente');assert.equal(draft.version,1);assert.equal(draft.titulo,'Mejora propuesta');
  for(const added of [{employee_id:'E2'},{estado:'terminado'},{posicion:1},{nombre:'Otra persona'},{rol:'admin'}])
    assert.equal(suggestionDraft({titulo:'Mejora',texto:'Prueba válida',...added},employee),null);
  for(const body of [null,[],{titulo:'x',texto:'Prueba'},{titulo:'Mejora',texto:'x'},{titulo:'Mejora',texto:'Prueba',categoria:'Otro'}])assert.equal(suggestionDraft(body,employee),null);
});
test('moves require a valid version, anchor, state and rejection reason; projection excludes unrelated fields',()=>{
  const body={id:'N1',estado:'rechazado',before_id:null,respuesta:'Duplicada',expected_version:1};
  assert.equal(suggestionMove(body).p_respuesta,'Duplicada');
  for(const change of [{respuesta:''},{estado:'inventado'},{expected_version:0},{expected_version:'1'},{before_id:'N1'},{id:'N1&role=admin'},{p_actor:'A1'}])assert.equal(suggestionMove({...body,...change}),null);
  assert.equal(suggestionProjection({...row,private_extra:'PRIVATE'}).private_extra,undefined);
  assert.throws(()=>suggestionProjection({...row,estado:undefined}));
});
test('GET returns only visible proposals and trusted management permissions for each role',async()=>{
  for(const [actor,ids] of [[employee,['N1']],[chief,['N1','N2']],[admin,['N1','N2','N3']]])await mocked(actor,async calls=>{
    const response=await handler(request());assert.equal(response.status,200);const data=await response.json();
    assert.deepEqual(data.records.map(n=>n.id),ids);assert.equal(data.permissions.can_manage,actor.rol==='admin');
    assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal(response.headers.get('Vary'),'Authorization, Cookie');assert.ok(calls.every(c=>c.method==='GET'));
  });
});
test('missing, expired and PIN-change sessions cannot read or write notes',async()=>{
  await mocked(employee,async calls=>{assert.equal((await handler(request('GET',undefined,{noAuth:true}))).status,401);assert.equal(calls.length,0);});
  for(const options of [{active:false},{stale:true},{force:true}])await mocked(employee,async calls=>{
    assert.equal((await handler(request())).status,401);assert.ok(!calls.some(c=>c.url.pathname.endsWith('/employee_notes')));
  },options);
});
test('employees and leaders cannot change state/order even if the token claims admin',async()=>{
  for(const actor of [employee,chief,{...employee,rol:'adjunto',puesto:'Adjunto Directivo'},{...employee,rol:'contable',puesto:'Contable'}])await mocked(actor,async calls=>{
    assert.equal((await handler(request('PATCH',{id:'N1',estado:'terminado',expected_version:1}))).status,403);
    assert.ok(calls.every(c=>c.method==='GET'));
  });
});
test('creating a proposal confirms persisted representation and never accepts an author supplied by the browser',async()=>{
  await mocked(employee,async calls=>{
    const response=await handler(request('POST',{titulo:'Mejora',texto:'Texto válido',modulo:'Turnos'}));assert.equal(response.status,201);
    const data=await response.json();assert.equal(data.record.employee_id,'E1');assert.equal(data.record.estado,'pendiente');
    const written=calls.find(c=>c.method==='POST');assert.equal(written.body.nombre,employee.nombre);assert.equal(written.body.posicion,null);
    assert.equal((await handler(request('POST',{titulo:'Mejora',texto:'Texto válido',employee_id:'E2'}))).status,400);
  });
  await mocked(employee,async()=>assert.equal((await handler(request('POST',{titulo:'Mejora',texto:'Texto válido'}))).status,503),{emptySave:true});
});
test('admin uses one transactional RPC for ordering, state and rejection with expected version',async()=>{
  await mocked(admin,async calls=>{
    const response=await handler(request('PATCH',{id:'N1',estado:'rechazado',expected_version:1,respuesta:'Ya existe esta función'}));assert.equal(response.status,200);
    const written=calls.find(c=>c.method==='POST');assert.equal(written.url.pathname,'/rest/v1/rpc/syncro_move_suggestion');assert.equal(written.body.p_actor,'A1');assert.equal(written.body.p_expected_version,1);
    assert.equal((await handler(request('PATCH',{id:'N1',estado:'rechazado',expected_version:1,respuesta:''}))).status,400);
    assert.equal(calls.filter(c=>c.method==='POST').length,1);
  });
  for(const error of ['CONFLICT','INVALID_ANCHOR'])await mocked(admin,async()=>assert.equal((await handler(request('PATCH',{id:'N1',estado:'terminado',expected_version:1}))).status,409),{rpc:{error}});
});
test('CSRF, unsupported filters, malformed JSON and deletion are rejected before a note write',async()=>{
  await mocked(admin,async calls=>{
    assert.equal((await handler(request('POST',{titulo:'Mejora',texto:'Prueba'},{origin:'https://other.test'}))).status,403);
    assert.equal((await handler(request('GET',undefined,{query:'?employee_id=E2'}))).status,400);
    assert.equal((await handler(request('DELETE'))).status,405);
    assert.equal((await handler(request('POST','{'))).status,400);
    assert.ok(calls.every(c=>c.method==='GET'));
  });
});
test('pagination includes late notes and database errors never masquerade as an empty board',async()=>{
  await mocked(employee,async()=>{const response=await handler(request());assert.equal((await response.json()).records.length,1001);},{page:true});
  await mocked(employee,async()=>assert.equal((await handler(request())).status,503),{fail:true});
});
test('a response from a former session cannot render suggestions or leave a detail modal behind',async()=>{
  const source=fs.readFileSync(new URL('../notas.js',import.meta.url),'utf8');
  const host={innerHTML:'',replaceChildren(){this.innerHTML='';}},modal={remove(){this.removed=true;}};
  let resolve;const ctx=vm.createContext({window:{},currentUser:{...employee},document:{getElementById:id=>id==='screen-notas-mod'?host:id==='suggestion-dialog'?modal:null},
    syncroSupabaseFetch:()=>new Promise(r=>resolve=r)});
  vm.runInContext(source,ctx);const pending=ctx.window.renderNotasMod();
  ctx.currentUser={...employee,id:'E2'};ctx.window.clearSuggestionsSession();
  resolve({ok:true,json:async()=>({records:[row],permissions:{can_manage:true}})});await pending;
  assert.equal(host.innerHTML,'');assert.equal(modal.removed,true);
});

test('HTML5 drag handlers save the intended state and version and deny a changed non-admin session',async()=>{
  const source=fs.readFileSync(new URL('../notas.js',import.meta.url),'utf8');
  const host={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};
  const ctx=vm.createContext({window:{},currentUser:{...admin},document:{getElementById:id=>id==='screen-notas-mod'?host:null},Date,Array});
  const calls=[];let records=[{...row}];
  ctx.syncroSupabaseFetch=async(_,init)=>{
    if(init.method==='PATCH'){const body=JSON.parse(init.body);calls.push(body);records=[{...row,estado:body.estado,version:2,posicion:1}];return {ok:true,json:async()=>({record:records[0]})};}
    return {ok:true,json:async()=>({records,permissions:{can_manage:true}})};
  };
  vm.runInContext(source,ctx);await ctx.window.renderNotasMod();
  const card={dataset:{id:'N1'},classList:{add(){}}};const transfer={setData(){}};
  host.ondragstart({target:{closest:()=>card},dataTransfer:transfer,preventDefault(){}});
  let prevented=false;
  host.ondrop({target:{closest:selector=>selector==='.suggestion-column'?{dataset:{state:'en_desarrollo'}}:null},preventDefault(){prevented=true;}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(prevented,true);assert.deepEqual(calls,[{id:'N1',estado:'en_desarrollo',before_id:null,respuesta:'',expected_version:1}]);
  ctx.currentUser={...employee};let denied=false;
  host.ondragstart({target:{closest:()=>card},dataTransfer:transfer,preventDefault(){denied=true;}});
  assert.equal(denied,true);assert.equal(calls.length,1);
});
