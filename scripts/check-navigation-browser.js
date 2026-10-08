// Local UI routing/layout smoke test. Fixtures; no LIVE requests or writes.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(?=[A-Z]:)/,''));
const chrome=process.env.SYNCRO_TEST_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shared=fs.readFileSync(path.join(root,'shared.js'),'utf8');
const nav=shared.slice(shared.indexOf('function navSection'),shared.indexOf('async function showScreen'));
const workflow=fs.readFileSync(path.join(root,'workflow-ui.js'),'utf8');
const finance=['incentivos.js','housekeeping_incentivos.js','mi_rendimiento.js'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
const profiles=[['admin','Administración','Administrador'],['adjunto','Administración','Adjunto Directivo'],
 ['contable','Administración','Contable'],['tecnico_rrhh','Administración','Técnico de Recursos Humanos'],
 ['chef','Cocina','Jefe de Cocina'],['supervisor','Sala','Jefe de Sala'],['gobernante','Housekeeping','Gobernanta'],
 ['empleado','Cocina','Cocinero'],['empleado','Housekeeping','Camarera de pisos'],['empleado','SYNCROLAB','Entrenador(a)']];
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
 .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
 .replace(/<link\b[^>]*href=["']https?:[^>]*>/gi,'');
const server=http.createServer((req,res)=>{
 const p=profiles[Number(new URL(req.url,'http://fixture').searchParams.get('profile')||0)];
 const fixture=`
 window.__errors=[];window.__denials=0;addEventListener('error',e=>__errors.push(e.message));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));
 var currentUser={id:'fixture',nombre:'Persona de prueba',rol:${JSON.stringify(p[0])},area:${JSON.stringify(p[1])},puesto:${JSON.stringify(p[2])}};
 var isAdjuntoDirectivo=u=>['adjunto','adjunto_directivo'].includes(u.rol),isTecnicoRrhh=u=>u.rol==='tecnico_rrhh';
 var isSupervisor=u=>['chef','supervisor','gobernante','tecnico_rrhh','jefe'].includes(u.rol);
 var _esEntrenador=u=>u.puesto==='Entrenador(a)';
 var canSeeMermaTab=u=>['admin','chef','adjunto'].includes(u.rol),_canSeeNotasTab=u=>isSupervisor(u)||u.rol==='admin',_canSeeFIOTab=_canSeeNotasTab;
 var _hkSemesterState={},_infDept=null,_incImportTab=null,_mrEntrMonth='';
 var getMonthOptions=()=>[{value:'2026-10'}],toast=()=>{__denials++;};
 var getDB=async()=>[],syncroSupabaseFetch=async()=>({ok:true,json:async()=>({records:[]})});
 var renderHorasMensuales=async()=>{document.getElementById('horas-mes-content').innerHTML='Horas registradas';};
 var renderFichaje=async()=>{document.getElementById('fichaje-content').innerHTML='Incidencias de marcaje';};
 var renderDashPrevision=async()=>{},renderPlanificacionHoraria=async()=>{document.getElementById('planificacion-horaria-content').innerHTML='Planificación o saldos';};
 var _mrEntrMis=async()=>'<p>Actividad propia</p>';
 var renderLiquidacionesPorDepartamento=async el=>{el.innerHTML='<p>Control financiero autorizado</p>';};
 var getMonthDateRange=()=>({inicio:'2026-08-01',fin:'2026-08-31'}),fmtDate=v=>v,formatDisplayValue=v=>v;
 var renderIncentivos=async()=>{},renderIncReglas=async()=>{},_renderRRHH=async el=>{el.innerHTML='Disponibilidad';};
 var switchValTab=()=>{};
 var showScreen=async function(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('screen-'+id).classList.add('active');};
 `;
 const run=`
 addEventListener('DOMContentLoaded',async()=>{
  const checks=[];function check(ok,label){checks.push({ok:!!ok,label});}
  try{
   document.getElementById('portal-screen').style.display='none';document.getElementById('app').style.display='block';
   buildNav();
   await showScreen('jornada');check(document.getElementById('screen-jornada').classList.contains('active'),'journey active');
   await workflowJourney('balance');check(document.getElementById('screen-jornada').contains(document.getElementById('horas-mes-content')),'monthly mounted');
   await workflowJourney('fichajes');check(document.getElementById('screen-horas-mes').contains(document.getElementById('horas-mes-content')),'monthly restored');
   check(document.getElementById('screen-jornada').contains(document.getElementById('fichaje-content')),'alerts mounted');
   await workflowJourney('saldos');check(document.getElementById('screen-fichaje').contains(document.getElementById('fichaje-content')),'alerts restored');
   if(currentUser.rol==='admin'){await showScreen('configuracion');check(document.getElementById('screen-configuracion').contains(document.getElementById('workflow-backup-tools')),'backup moved');await showScreen('jornada');check(document.getElementById('screen-export').contains(document.getElementById('workflow-backup-tools')),'backup restored');await showScreen('liquidaciones');}
   else{var before=__denials;await showScreen('liquidaciones');check(__denials===before+1,'settlement denied');}
   if(currentUser.rol!=='admin'){var before=__denials;await showScreen('control-incentivos');check(__denials===before+1,'general financial control denied');}
   if(canDownloadLiquidationReportUI(currentUser)){
    await showScreen('informe-liquidaciones');
    var reportScreen=document.getElementById('screen-informe-liquidaciones');
    check(reportScreen.textContent.includes('Mes de liquidación'),'accounting selects payment month');
    check(!reportScreen.querySelector('table')&&!reportScreen.textContent.includes('Marcar liquidado'),'report screen only offers a download');
    var reportFetch=syncroSupabaseFetch,savedAnchorClick=HTMLAnchorElement.prototype.click,downloaded='';
    HTMLAnchorElement.prototype.click=function(){downloaded=this.download;};
    syncroSupabaseFetch=async(url,init)=>({ok:true,blob:async()=>new Blob(['Mes;Importe\\r\\n2026-10;10,00'])});
    document.getElementById('workflow-liquidation-month').value='2026-10';
    await workflowDownloadLiquidations();
    check(downloaded==='liquidaciones-2026-10.csv','report downloads chosen month');
    check(document.getElementById('workflow-liquidation-status').textContent==='Informe descargado.','download completes');
    syncroSupabaseFetch=reportFetch;HTMLAnchorElement.prototype.click=savedAnchorClick;
   }else{
    var before=__denials;await showScreen('informe-liquidaciones');
    check(__denials===before+1,'report denied for other roles');
    check(!getScreens(currentUser.rol).some(i=>i.id==='informe-liquidaciones'),'report absent for other roles');
   }
   if(canReadDepartmentIncentivesUI(currentUser)){
    var savedFetch=syncroSupabaseFetch;
    syncroSupabaseFetch=async()=>({ok:true,json:async()=>({department:currentUser.area,records:[{employee_name:'Equipo de prueba',department:currentUser.area,period:'2026-10',amount:10}]})});
    await showScreen('incentivos-departamento');
    var deptScreen=document.getElementById('screen-incentivos-departamento');
    check(deptScreen.textContent.includes('Equipo de prueba'),'department head sees scoped records');
    check(!deptScreen.querySelector('select')&&!deptScreen.querySelector('button'),'department consultation has no selector or payment actions');
    syncroSupabaseFetch=savedFetch;
   }else check(!getScreens(currentUser.rol).some(i=>i.id==='incentivos-departamento'),'non-head has no team incentives');
   if(currentUser.rol==='admin'){
    check(!getScreens(currentUser.rol).some(i=>i.id==='liquidaciones'),'one finance entry');
    await showScreen('control-incentivos');
    check(document.getElementById('screen-control-incentivos').textContent.includes('Incentivos y liquidaciones'),'unified title');
    var record={employee_id:'trainer',employee_nombre:'Persona de prueba',ym:'2026-08',n_dir_efectivas:1,n_dir_no_efect:1,n_pt:1,n_pt_duo:1,n_pt_30:1,n_val_funcional:1,n_visbody:0,n_banera_hielo:0};
    var shifts=[{employee_id:'trainer',fecha:'2026-08-01',servicio:'Mañana',estado:'Validado',kpi_entrenador:{pt:0}}];
    _mrEntrMonth='2026-08';getDB=async table=>table==='shifts'?shifts:[record];
    var host=document.getElementById('liquidaciones-departamento-content');host.innerHTML=await _mrEntrEquipo();
    host.querySelector('button[onclick^="mrRevisarEntrenador"]').click();
    var modal=document.getElementById('workflow-evidence-overlay');
    check(modal&&modal.textContent.includes('6 indicadores con diferencias')&&modal.textContent.includes('2026-08-01'),'trainer button opens evidence');
    check(modal.querySelector('[role="dialog"]').getBoundingClientRect().right<=innerWidth,'evidence fits viewport');
    modal.querySelector('button').click();check(!document.getElementById('workflow-evidence-overlay'),'evidence closes');
    var data={permissions:{can_liquidate:currentUser.rol==='admin'},rows:[{employee_id:'reception',employee_name:'Recepción de prueba',sales_count:1,sales_net:100,incentive_gross:10,incentive_final:10,sales:[{date:'2026-08-01',reservation_reference:'RES-123',type_label:'Desayuno',closure_service:'Mañana',closure_status:'Validado',gross:110,vat_percent:10,net:100,incentive:10}]}]};
    _incSetReceptionReviewData(data,'2026-08');host.innerHTML=_incReceptionLiquidationHtml(data,'2026-08');
    host.querySelector('button[onclick^="incRevisarRecepcion"]').click();
    modal=document.getElementById('inc-reception-review-overlay');
    check(modal&&modal.textContent.includes('RES-123')&&modal.textContent.includes('N.º reserva'),'reception button opens reservation reference');
    if(currentUser.rol==='contable')check(!host.textContent.includes('Marcar liquidado'),'accounting cannot pay');
    incCerrarRevisionRecepcion();
    _hkSemesterState.data={records:[{employee_id:'hk',employee_nombre:'Housekeeping de prueba',dias_baja:0,elegible_antiguedad:true,elegible_baja:true,nivel_premio:1,importe_premio:50,estado:'pendiente'}],permissions:{can_liquidate:currentUser.rol==='admin'}};
    _hkSemesterState.period='2026-S1';_hkSemesterState.reviewActor=currentUser.id;host.innerHTML=_hkLiquidationHtml(_hkSemesterState.data);
    host.querySelector('button[onclick^="hkRevisarAutocontrol"]').click();
    check(document.getElementById('workflow-evidence-overlay').textContent.includes('Cumple antigüedad'),'housekeeping button opens criteria');
    workflowCloseEvidence();
    _incSetReceptionReviewData(data,'2026-08');incRevisarRecepcion('reception');
    workflowClearSession();
    check(!document.getElementById('inc-reception-review-overlay')&&!_mrEntrReviewState&&!_incReceptionReviewState&&!_hkSemesterState.data,'logout clears finance evidence');
    getDB=async()=>[];
   }
   if(getScreens(currentUser.rol).some(i=>i.id==='mi-rendimiento')){await showScreen('mi-rendimiento');check(document.getElementById('screen-mi-rendimiento').textContent.includes('No tienes incentivos pendientes'),'own pending');}
   check(document.querySelectorAll('.screen.active .workflow-body').length===1,'single workflow host');
   check(document.querySelectorAll('.screen.active').length===1,'single active screen');
   check(document.querySelectorAll('#topbar-nav .nav-btn-dropdown-toggle').length===getScreens(currentUser.rol).filter(i=>i.sep).length,'all work areas in top navigation');
   for(const t of document.querySelectorAll('#topbar-nav .nav-btn-dropdown-toggle')){
     t.click();const menu=t.closest('.nav-group').querySelector('.nav-dropdown-menu');if(menu){var r=menu.getBoundingClientRect();check(r.left>=0&&r.right<=innerWidth+1,'dropdown fits');}t.click();
   }
  }catch(e){__errors.push(e.message);}
  const report=document.createElement('pre');report.id='browser-result';report.textContent=JSON.stringify({profile:currentUser.rol,checks,errors:__errors});document.body.appendChild(report);
 });
 `;
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
 res.end(html.replace('</body>','<script>'+fixture+'</script><script>'+nav+'</script><script>'+finance+'</script><script>'+workflow+'</script><script>renderLiquidacionesPorDepartamento=async el=>{el.innerHTML="Control financiero autorizado";};</script><script>'+run+'</script></body>'));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port, results=[];
async function browser(profile,width){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'syncro-nav-chrome-'));
 return new Promise((resolve,reject)=>{
  const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--no-first-run','--disable-default-apps','--user-data-dir='+directory,'--window-size='+width+',900','--dump-dom','--virtual-time-budget=2500','http://127.0.0.1:'+port+'/?profile='+profile],{windowsHide:true});
  let stdout='';child.stdout.on('data',b=>stdout+=b);
  const timer=setTimeout(()=>{child.kill();reject(Error('Chrome timeout'));},15000);
  child.on('error',reject);child.on('close',()=>{
   clearTimeout(timer);
   const match=stdout.match(/<pre id="browser-result">([\s\S]*?)<\/pre>/);
   if(!match){reject(Error('Browser report missing'));return;}
   const report=JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
   resolve({width,...report});
  });
 });
}
try{
 for(let i=0;i<profiles.length;i++)for(const width of [390,768,1366])results.push(await browser(i,width));
 const failed=results.filter(r=>r.errors.length||r.checks.some(c=>!c.ok));
 fs.writeFileSync(path.join(os.tmpdir(),'syncro-navigation-browser.json'),JSON.stringify({fixtures:true,scenarios:results},null,2));
 console.log(JSON.stringify({scenarios:results.length,failed:failed.length,details:failed}));
 if(failed.length)process.exitCode=1;
}finally{server.close();}
