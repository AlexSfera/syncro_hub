import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../shared.js',import.meta.url),'utf8');
const context={
  currentUser:null,
  isAdjuntoDirectivo:u=>['adjunto','adjunto_directivo'].includes(u?.rol),
  isTecnicoRrhh:u=>u?.rol==='tecnico_rrhh',
  isSupervisor:u=>['jefe','chef','fb','jefe_recepcion','supervisor','coord_entrenadores','gobernante','subgobernante','jefe_mantenimiento','tecnico_rrhh','coord_recepcion_syncrolab','coord_fisioterapeutas'].includes(u?.rol),
  _esEntrenador:u=>u?.rol==='coord_entrenadores'||['Entrenador(a)','Coordinador(a) de Entrenadores'].includes(u?.puesto)
};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function navSection'),source.indexOf('function buildNav')),context);
const profiles=[
  ['admin','Administración','Administrador'],['adjunto','Administración','Adjunto Directivo'],
  ['adjunto_directivo','Administración','Adjunto Directivo'],['contable','Administración','Contable'],
  ['tecnico_rrhh','Administración','Técnico de Recursos Humanos'],['chef','Cocina','Jefe de Cocina'],
  ['fb','F&B','F&B Manager'],['supervisor','Sala','Jefe de Sala'],['gobernante','Housekeeping','Gobernanta'],
  ['subgobernante','Housekeeping','Subgobernanta'],['jefe_recepcion','Recepción','Jefe de Recepción'],
  ['jefe_mantenimiento','Mantenimiento','Jefe de Mantenimiento'],['jefe','SYNCROLAB','Club Manager'],
  ['coord_entrenadores','SYNCROLAB','Coordinador(a) de Entrenadores'],
  ['coord_recepcion_syncrolab','SYNCROLAB','Coordinador(a) de Atención al Cliente'],
  ['coord_fisioterapeutas','SYNCROLAB','Coordinador(a) de Fisioterapeutas'],
  ['empleado','Cocina','Cocinero'],['empleado','Sala','Camarero(a)'],
  ['empleado','Housekeeping','Camarera de pisos'],['empleado','Recepción','Recepcionista'],
  ['empleado','SYNCROLAB','Entrenador(a)'],['empleado','Mantenimiento','Técnico de Mantenimiento']
].map(([rol,area,puesto])=>({rol,area,puesto}));
function navigation(profile){context.currentUser=profile;return context.getScreens(profile.rol);}
test('NAV-01: seven areas preserve all previously accessible domain functions',()=>{
  const areas=['MI DÍA','OPERACIÓN','JORNADA Y SALDOS','PRODUCCIÓN E INCENTIVOS','RESULTADOS E INFORMES','EQUIPO','CONFIGURACIÓN'];
  for(const profile of profiles){
    const nav=navigation(profile);const screens=nav.filter(i=>i.id);const ids=new Set(screens.map(i=>i.id));
    assert.equal(ids.size,screens.length,profile.puesto);
    assert.ok(nav.filter(i=>i.sep).every(i=>areas.includes(i.label)&&i.dropdown&&i.key&&i.description));
    assert.ok(nav.filter(i=>i.sep).length<=7);assert.ok(screens.every(i=>i.description));
    assert.ok(ids.has('jornada'),profile.puesto);
    for(const old of context._legacyScreens(profile.rol).filter(i=>i.id)){
      if(['readme','fichaje','horas-mes','planificacion-horaria','incentivos','liquidaciones'].includes(old.id))continue;
      if(old.id==='validacion'&&profile.rol==='contable'){assert.ok(ids.has('cajas-revision'));continue;}
      assert.ok(ids.has(old.id),profile.puesto+': lost '+old.id);
    }
    for(const removed of ['readme','fichaje','horas-mes','planificacion-horaria','incentivos'])assert.ok(!ids.has(removed));
  }
});
test('PERM-06/07/08: operational authority does not grant finance control',()=>{
  for(const p of profiles){
    const ids=new Set(navigation(p).map(i=>i.id));
    assert.equal(ids.has('control-incentivos'),p.rol==='admin',p.puesto);
    assert.equal(ids.has('liquidaciones'),false,p.puesto);
    assert.equal(ids.has('configuracion'),p.rol==='admin',p.puesto);
  }
});
test('NAV-02: first screen follows each responsibility',()=>{
  for(const [rol,expected] of [['admin','dashboard'],['adjunto','dashboard'],['contable','mi-rendimiento'],['tecnico_rrhh','jornada'],['chef','validacion'],['empleado','turno']])assert.equal(context.workflowInitialScreen({rol,area:'Cocina'}),expected);
  assert.equal(context.workflowInitialScreen({rol:'empleado',area:'Housekeeping'}),'ruta-mod');
  const ids=navigation({rol:'empleado',area:'SYNCROLAB',puesto:'Entrenador(a)'}).map(i=>i.id);
  assert.ok(ids.includes('produccion-propia'));assert.ok(ids.includes('mi-rendimiento'));
});
test('navigation dropdown fits desktop, tablet and mobile viewports',()=>{
  for(const width of [320,390,768,1366]){
    const height=900,bottomHeight=width<768?60:0;
    context.window={innerWidth:width,innerHeight:height};
    context.document={getElementById:()=>({getBoundingClientRect:()=>({height:bottomHeight})})};
    for(const left of [0,width/2,width-100]){
      const menu={style:{}};context._positionNavDropdown({getBoundingClientRect:()=>({left,bottom:180})},menu);
      const x=parseFloat(menu.style.left),w=parseFloat(menu.style.width),top=parseFloat(menu.style.top);
      assert.ok(x>=12&&x+w<=width-12);assert.ok(top+parseFloat(menu.style.maxHeight)<=height-bottomHeight-12);
    }
  }
});

test('cada jefe dispone de consulta departamental y cada persona de pendientes propios',()=>{
  for(const profile of profiles){
    const ids=new Set(navigation(profile).map(item=>item.id));
    assert.equal(ids.has('incentivos-departamento'),context.canReadDepartmentIncentivesUI(profile),profile.puesto);
    assert.equal(ids.has('mi-rendimiento'),profile.rol!=='admin',profile.puesto);
  }
});
