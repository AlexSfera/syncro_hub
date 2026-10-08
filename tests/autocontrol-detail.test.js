import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function ui(){
  const context=vm.createContext({
    window:{},document:{},currentUser:{id:'reviewer',rol:'admin'},toast(){},
    canControlIncentivesUI:user=>['admin','contable'].includes(user?.rol),
    canMarkLiquidationUI:user=>user?.rol==='admin',
    getMonthDateRange:()=>({inicio:'2026-08-01',fin:'2026-08-31'}),fmtDate:v=>v,formatDisplayValue:v=>v
  });
  for(const file of ['mi_rendimiento.js','incentivos.js','housekeeping_incentivos.js'])
    vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
  return context;
}
function report(){
  return {employee_id:'trainer',employee_nombre:'Persona de prueba',ym:'2026-08',
    n_dir_efectivas:1,n_dir_no_efect:1,n_pt:1,n_pt_duo:1,n_pt_30:1,n_val_funcional:1,n_visbody:0,n_banera_hielo:0};
}
const parts=[
  {employee_id:'trainer',fecha:'2026-08-01',servicio:'Mañana',estado:'Validado',kpi_entrenador:{pt:0}},
  {employee_id:'other',fecha:'2026-08-10',kpi_entrenador:{pt:99}},
  {employee_id:'trainer',fecha:'2026-07-31',kpi_entrenador:{pt:99}},
  {employee_id:'trainer',fecha:'2026-09-01',kpi_entrenador:{pt:99}},
  {employee_id:'trainer',fecha:'2026-08-20',kpi_entrenador:'invalid'}
];

test('autocontrol cuenta seis indicadores distintos y muestra sus partes, sin sumar otros meses o personas',()=>{
  const ctx=ui(),model=ctx._mrEntrReviewModel(report(),parts,true);
  assert.equal(model.differences,6);
  assert.equal(model.parts.length,1);
  assert.equal(model.values.find(v=>v.key==='pt').declared,0);
  const html=ctx._mrEntrReviewHtml(report(),model);
  assert.match(html,/6 indicadores con diferencias/);
  assert.match(html,/no es un importe/);
  assert.match(html,/2026-08-01/);
  assert.match(html,/Archivo VirtuGym/);
  assert.match(html,/Validado/);
  assert.doesNotMatch(html,/2026-07-31|2026-09-01|99/);
});

test('sin partes, fallo de lectura y archivo incompleto no se presentan como coincidencia o ceros comprobados',()=>{
  const ctx=ui(),row=report();
  const noParts=ctx._mrEntrReviewModel(row,[],true);
  assert.equal(noParts.status,'Sin partes registrados');assert.equal(noParts.differences,null);
  assert.match(ctx._mrEntrReviewHtml(row,noParts),/\[NO DATA\]/);
  assert.equal(ctx._mrEntrReviewModel(row,[],false).status,'Comparación no disponible');
  delete row.n_pt;
  const incomplete=ctx._mrEntrReviewModel(row,parts,true);
  assert.equal(incomplete.status,'Archivo VirtuGym incompleto');
  assert.equal(incomplete.values.find(v=>v.key==='pt').official,null);
  assert.equal(incomplete.differences,null);
});

test('detalle de entrenadores limita el acceso al actor y conserva la consulta contable',()=>{
  const ctx=ui();let shown=0;
  ctx.window.workflowEvidence=()=>shown++;
  ctx._mrEntrReviewState={actor:'reviewer',ym:'2026-08',rows:[report()],shifts:parts,available:true};
  ctx.window.mrRevisarEntrenador('trainer');assert.equal(shown,1);
  ctx.currentUser={id:'reviewer',rol:'contable'};
  ctx.window.mrRevisarEntrenador('trainer');assert.equal(shown,2);
  ctx.currentUser={id:'different',rol:'admin'};
  ctx.window.mrRevisarEntrenador('trainer');assert.equal(shown,2);
  ctx.currentUser={id:'reviewer',rol:'empleado'};
  ctx.window.mrRevisarEntrenador('trainer');assert.equal(shown,2);
});

test('fila de entrenadores abre el detalle y distingue un error de lectura',async()=>{
  const ctx=ui();ctx._mrEntrMonth='2026-08';
  ctx.getDB=async table=>table==='shifts'?parts:[report()];
  let html=await ctx._mrEntrEquipo();
  assert.match(html,/onclick="mrRevisarEntrenador/);
  assert.match(html,/6 indicadores con diferencias · Ver detalle/);
  ctx.getDB=async table=>{if(table==='shifts')throw Error('offline');return [report()];};
  html=await ctx._mrEntrEquipo();
  assert.match(html,/Comparación no disponible · Ver detalle/);
  assert.doesNotMatch(html,/Sin partes registrados/);
});

test('autocontrol escapa referencias, muestra ausencias de datos y no expone formularios de pago',()=>{
  const ctx=ui();
  const html=ctx._incReceptionReviewHtml({employee_name:'<script>bad()</script>',sales:[
    {reservation_reference:'<img src=x onerror=bad()>',date:'2026-08-01'},
    {date:'2026-08-02'}
  ]},'2026-08');
  assert.match(html,/&lt;img/);assert.match(html,/\[NO DATA\]/);
  assert.doesNotMatch(html,/<script>|<img|Confirmar liquidación/);
  const trainer=ctx._mrEntrReviewHtml(report(),ctx._mrEntrReviewModel(report(),[
    {...parts[0],servicio:'<img src=x>',estado:'<script>'}
  ],true));
  assert.doesNotMatch(trainer,/<img|<script>/);
});

test('Recepción rechaza apertura con sesión cambiada, rol operativo o caché borrada',()=>{
  const ctx=ui();
  ctx.document={getElementById(){throw Error('No debe abrir un modal');}};
  ctx._incReceptionReviewState={actor:'reviewer',rows:[{employee_id:'reception'}]};
  ctx.currentUser={id:'reviewer',rol:'supervisor'};ctx.incRevisarRecepcion('reception');
  ctx.currentUser={id:'other',rol:'admin'};ctx.incRevisarRecepcion('reception');
  ctx._incReceptionReviewState=null;ctx.incRevisarRecepcion('reception');
});

test('Housekeeping abre los criterios existentes y conserva [NO DATA] para fechas no incluidas',()=>{
  const ctx=ui();let detail='';
  ctx.window.workflowEvidence=(title,html)=>{detail=title+html;};
  ctx._hkSemesterState={reviewActor:'reviewer',period:'2026-S1',data:{records:[
    {employee_id:'hk',employee_nombre:'Persona de prueba',dias_baja:0,elegible_antiguedad:true,elegible_baja:true,nivel_premio:1,importe_premio:50,estado:'pendiente'}
  ]}};
  ctx.window.hkRevisarAutocontrol('hk');
  assert.match(detail,/Días de baja registrados<\/th><td>0/);
  assert.match(detail,/Fechas individuales de baja: \[NO DATA\]/);
  detail='';ctx.currentUser={id:'reviewer',rol:'empleado'};
  ctx.window.hkRevisarAutocontrol('hk');assert.equal(detail,'');
});

test('solo se muestra un selector de departamento dentro de la pantalla unificada',()=>{
  const ctx=ui();ctx.getMonthOptions=()=>[];
  ctx._hkSemesterState.hideDepartmentSelector=true;
  assert.doesNotMatch(ctx._hkLiquidationsDepartmentHtml(),/hkSelectLiquidationDepartment/);
  assert.match(ctx._hkLiquidationsDepartmentHtml(),/hkChangeLiquidationPeriod/);
});
