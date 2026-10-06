import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../shared.js', import.meta.url), 'utf8');
const start = source.indexOf('function navSection');
const end = source.indexOf('function buildNav');

assert.ok(start >= 0 && end > start, 'navigation source must be extractable');

const supervisorRoles = new Set([
  'jefe', 'chef', 'fb', 'jefe_recepcion', 'supervisor',
  'coord_recepcion_syncrolab', 'coord_entrenadores', 'coord_fisioterapeutas',
  'gobernante', 'subgobernante', 'jefe_mantenimiento', 'tecnico_rrhh'
]);

const context = {
  currentUser: null,
  isAdjuntoDirectivo: user => ['adjunto', 'adjunto_directivo'].includes(user?.rol),
  isTecnicoRrhh: user => user?.rol === 'tecnico_rrhh',
  isSupervisor: user => !!user && supervisorRoles.has(user.rol),
  _esEntrenador: user => user?.rol === 'coord_entrenadores'
    || ['Entrenador(a)', 'Coordinador(a) de Entrenadores'].includes(user?.puesto)
};

vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

function navigationFor(profile) {
  context.currentUser = profile;
  return context.getScreens(profile.rol);
}

function idsFor(profile) {
  return Array.from(navigationFor(profile).filter(item => item.id), item => item.id).sort();
}

function assertAccess(profile, expected) {
  assert.deepEqual(idsFor(profile), expected.slice().sort());
}

test('navigation keeps the approved access set for representative roles', () => {
  assertAccess(
    { rol:'admin', area:'Administración', puesto:'Administrador' },
    ['gestiones','incidencias','tareas','hypoxic','validacion','mant-mod','hk-dash',
      'liquidaciones','fichaje','dashboard','maestro','export','fio','informes',
      'horas-mes','planificacion-horaria']
  );

  assertAccess(
    { rol:'adjunto', area:'Administración', puesto:'Adjunto Directivo' },
    ['turno','gestiones','incidencias','tareas','mis-fio','fichaje','notas-mod',
      'validacion','hk-dash','liquidaciones','dashboard','maestro','export','fio',
      'informes','planificacion-horaria']
  );

  assertAccess(
    { rol:'contable', area:'Administración', puesto:'Contable' },
    ['validacion','dashboard','planificacion-horaria']
  );

  assertAccess(
    { rol:'tecnico_rrhh', area:'Administración', puesto:'Técnico de Recursos Humanos' },
    ['turno','chk-mod','gestiones','tareas','incidencias','notas-mod',
      'planificacion-horaria','validacion','fichaje','mis-fio','maestro','fio']
  );

  assertAccess(
    { rol:'chef', area:'Cocina', puesto:'Jefe de Cocina' },
    ['turno','merma-mod','chk-mod','gestiones','tareas','incidencias','notas-mod',
      'planificacion-horaria','validacion','fichaje','mis-fio','mi-rendimiento',
      'dashboard','maestro','fio','informes']
  );

  assertAccess(
    { rol:'gobernante', area:'Housekeeping', puesto:'Gobernanta' },
    ['ruta-mod','chk-mod','turno','gestiones','tareas','incidencias','notas-mod',
      'planificacion-horaria','validacion','fichaje','mis-fio','mi-rendimiento',
      'hk-revision','hk-dash','hk-plan','hk-zonas','dashboard','maestro','fio',
      'informes','hk-config']
  );

  assertAccess(
    { rol:'jefe_mantenimiento', area:'Mantenimiento', puesto:'Jefe de Mantenimiento' },
    ['turno','chk-mod','gestiones','tareas','incidencias','hypoxic','notas-mod',
      'planificacion-horaria','validacion','mant-mod','fichaje','mis-fio',
      'dashboard','maestro','fio','informes']
  );

  assertAccess(
    { rol:'jefe', area:'SYNCROLAB', puesto:'Club Manager' },
    ['turno','chk-mod','lab-caja-op','gestiones','tareas','incidencias','notas-mod',
      'planificacion-horaria','validacion','fichaje','mis-fio','mi-rendimiento',
      'dashboard','maestro','fio','informes']
  );

  assertAccess(
    { rol:'empleado', area:'Cocina', puesto:'Cocinero' },
    ['turno','merma-mod','chk-mod','gestiones','tareas','incidencias','notas-mod',
      'planificacion-horaria','fichaje','mis-fio','mi-rendimiento']
  );

  assertAccess(
    { rol:'empleado', area:'Recepción', puesto:'Recepcionista' },
    ['turno','chk-mod','rec-caja-op','gestiones','tareas','incidencias','hypoxic',
      'notas-mod','planificacion-horaria','fichaje','mis-fio','mi-rendimiento']
  );
});

test('each role receives unique screens inside described dropdown sectors', () => {
  const profiles = [
    { rol:'admin', area:'Administración', puesto:'Administrador' },
    { rol:'adjunto', area:'Administración', puesto:'Adjunto Directivo' },
    { rol:'contable', area:'Administración', puesto:'Contable' },
    { rol:'tecnico_rrhh', area:'Administración', puesto:'Técnico de Recursos Humanos' },
    { rol:'fb', area:'F&B', puesto:'F&B Manager' },
    { rol:'chef', area:'Cocina', puesto:'Jefe de Cocina' },
    { rol:'supervisor', area:'Sala', puesto:'Jefe de Sala' },
    { rol:'jefe_recepcion', area:'Recepción', puesto:'Jefe de Recepción' },
    { rol:'gobernante', area:'Housekeeping', puesto:'Gobernanta' },
    { rol:'subgobernante', area:'Housekeeping', puesto:'Subgobernanta' },
    { rol:'jefe_mantenimiento', area:'Mantenimiento', puesto:'Jefe de Mantenimiento' },
    { rol:'coord_recepcion_syncrolab', area:'SYNCROLAB', puesto:'Coordinador(a) de Atención al Cliente' },
    { rol:'coord_entrenadores', area:'SYNCROLAB', puesto:'Coordinador(a) de Entrenadores' },
    { rol:'coord_fisioterapeutas', area:'SYNCROLAB', puesto:'Coordinador(a) de Fisioterapeutas' },
    { rol:'empleado', area:'Housekeeping', puesto:'Camarera de pisos' },
    { rol:'empleado', area:'SYNCROLAB', puesto:'Entrenador(a)' }
  ];

  for (const profile of profiles) {
    const navigation = navigationFor(profile);
    const screens = navigation.filter(item => item.id);
    const sectors = navigation.filter(item => item.sep);
    assert.equal(new Set(screens.map(item => item.id)).size, screens.length, profile.puesto);
    assert.ok(screens.every(item => item.description), `${profile.puesto}: missing screen description`);
    assert.ok(sectors.length >= 1 && sectors.length <= 3, `${profile.puesto}: invalid sector count`);
    assert.ok(sectors.every(item => item.dropdown && item.description && item.key), `${profile.puesto}: invalid sector metadata`);
  }
});

test('administrator and department leader navigation follows the new logical order', () => {
  const admin = navigationFor({ rol:'admin', area:'Administración', puesto:'Administrador' });
  assert.deepEqual(Array.from(admin.filter(item => item.sep), item => item.label), ['OPERACIÓN','EQUIPO','DIRECCIÓN']);

  const chef = navigationFor({ rol:'chef', area:'Cocina', puesto:'Jefe de Cocina' });
  assert.deepEqual(Array.from(chef.filter(item => item.sep), item => item.label), ['MI DÍA','MI DEPARTAMENTO','MANAGER']);

  const housekeeping = navigationFor({ rol:'gobernante', area:'Housekeeping', puesto:'Gobernanta' });
  assert.equal(housekeeping.filter(item => item.sep).some(item => item.label === 'GESTIÓN HK'), false);
  assert.equal(housekeeping.some(item => item.sub && item.label === 'OPERACIÓN HOUSEKEEPING'), true);
});

test('dropdown stays inside the viewport and above the mobile navigation', () => {
  for (const width of [320,390,768,1366]) {
    const height=900;
    const bottomHeight=width<768?60:0;
    context.window={innerWidth:width,innerHeight:height};
    context.document={getElementById:()=>({getBoundingClientRect:()=>({height:bottomHeight})})};
    for (const left of [0,width/2,width-100]) {
      const button={getBoundingClientRect:()=>({left,bottom:180})};
      const menu={style:{}};
      context._positionNavDropdown(button,menu);
      const positionedLeft=parseFloat(menu.style.left);
      const positionedWidth=parseFloat(menu.style.width);
      const top=parseFloat(menu.style.top);
      assert.ok(positionedLeft>=12 && positionedLeft+positionedWidth<=width-12);
      assert.ok(top+parseFloat(menu.style.maxHeight)<=height-bottomHeight-12);
    }
  }
});
