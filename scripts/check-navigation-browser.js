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
   if(currentUser.rol==='contable'){await showScreen('control-incentivos');check(document.getElementById('screen-control-incentivos').classList.contains('active'),'accounting readonly control');}
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
 res.end(html.replace('</body>','<script>'+fixture+'</script><script>'+nav+'</script><script>'+workflow+'</script><script>'+run+'</script></body>'));
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
