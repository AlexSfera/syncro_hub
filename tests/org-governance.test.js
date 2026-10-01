import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  POSITION_GOVERNANCE,
  canonicalizeEmployeeProfile,
  positionRank
} from '../lib/org-governance.js';

test('active position catalog contains the approved organizational structure', () => {
  const expected = [
    'F&B Manager',
    'Jefe de Cocina', 'Segundo Jefe de Cocina', 'Cocinero', 'Cocinera',
    'Ayudante de cocina', 'Freelancer',
    'Jefe de Sala', 'Jefe de Sector', 'Camarero', 'Camarera',
    'Ayudante camarero', 'Ayudante camarera',
    'Jefe de Recepción', 'Subjefe de Recepción', 'Recepcionista',
    'Ayudante de Recepción', 'Auditor de Noche',
    'Gobernanta', 'Subgobernanta', 'Camarera de pisos',
    'Ayudante camarera de pisos',
    'Jefe de Mantenimiento', 'Técnico',
    'Club Manager', 'Coordinador(a) de Atención al Cliente',
    'Coordinador(a) de Entrenadores', 'Coordinador(a) de Fisioterapeutas',
    'Atención al Cliente', 'Entrenador(a)', 'Fisioterapeuta',
    'Administrador', 'Adjunto Directivo', 'Contable',
    'Técnico de Recursos Humanos'
  ];
  assert.deepEqual(Object.keys(POSITION_GOVERNANCE), expected);
});

test('parent managers outrank departmental leadership and operational staff', () => {
  const fnb = canonicalizeEmployeeProfile({ puesto: 'F&B Manager' });
  const kitchenHead = canonicalizeEmployeeProfile({ puesto: 'Jefe de Cocina' });
  const kitchenDeputy = canonicalizeEmployeeProfile({ puesto: 'Segundo Jefe de Cocina' });
  const cook = canonicalizeEmployeeProfile({ puesto: 'Cocinero' });
  assert.ok(positionRank(fnb) > positionRank(kitchenHead));
  assert.ok(positionRank(kitchenHead) > positionRank(kitchenDeputy));
  assert.ok(positionRank(kitchenDeputy) > positionRank(cook));
});

test('position governance preserves specialized operational permissions', () => {
  assert.equal(POSITION_GOVERNANCE['Jefe de Cocina'].role, 'chef');
  assert.equal(POSITION_GOVERNANCE['Jefe de Sala'].role, 'supervisor');
  assert.equal(POSITION_GOVERNANCE['Jefe de Recepción'].role, 'jefe_recepcion');
  assert.equal(POSITION_GOVERNANCE.Gobernanta.role, 'gobernante');
  assert.equal(
    POSITION_GOVERNANCE['Técnico de Recursos Humanos'].role,
    'tecnico_rrhh'
  );
  assert.equal(POSITION_GOVERNANCE['Técnico de Recursos Humanos'].accessLevel, 2);
  assert.equal(POSITION_GOVERNANCE['Técnico de Recursos Humanos'].rank, 70);
  assert.equal(
    POSITION_GOVERNANCE['Coordinador(a) de Entrenadores'].role,
    'coord_entrenadores'
  );
});

test('historic position labels cannot elevate a stored role to Administrator or Adjunto', () => {
  const historicAdjunto = canonicalizeEmployeeProfile({
    puesto: 'Administrador', rol: 'adjunto', validador: 1
  });
  assert.equal(historicAdjunto.rol, 'adjunto');
  assert.equal(positionRank(historicAdjunto), 90);

  const forgedAdmin = canonicalizeEmployeeProfile({
    puesto: 'Administrador', rol: 'empleado', validador: 0
  });
  assert.equal(forgedAdmin.rol, 'empleado');
  assert.equal(positionRank(forgedAdmin), 10);
});

test('employee modal removes retired positions and adds Freelancer and HR technician', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const employeeModal = html.slice(
    html.indexOf('id="modal-empleado"'),
    html.indexOf('id="modal-reset-pin"')
  );
  assert.match(employeeModal, /<option>Freelancer<\/option>/);
  assert.match(employeeModal, /<option>Técnico de Recursos Humanos<\/option>/);
  assert.match(employeeModal, /<option value="tecnico_rrhh">Técnico RRHH<\/option>/);
  assert.doesNotMatch(employeeModal, /<option>Friegue<\/option>/);
  assert.doesNotMatch(employeeModal, /<option>Camarero de pisos<\/option>/);
  assert.doesNotMatch(employeeModal, /<option>Ayudante camarero de pisos<\/option>/);
  assert.doesNotMatch(employeeModal, /<option>Lavandería<\/option>/);
});

test('permission matrix documents every active technical role', () => {
  const governanceDoc = readFileSync(
    new URL('../docs/context/23_organizational_governance.md', import.meta.url),
    'utf8'
  );
  const roles = [
    'admin', 'adjunto', 'fb', 'jefe', 'tecnico_rrhh', 'chef', 'supervisor',
    'jefe_recepcion', 'gobernante', 'subgobernante', 'jefe_mantenimiento',
    'coord_recepcion_syncrolab', 'coord_entrenadores',
    'coord_fisioterapeutas', 'contable', 'empleado'
  ];
  for (const role of roles) assert.match(governanceDoc, new RegExp('`' + role + '`'));
});

test('HR technician keeps leadership tools without restricted modules', () => {
  const shared = readFileSync(new URL('../shared.js', import.meta.url), 'utf8');
  const dashboard = readFileSync(new URL('../dashboard.js', import.meta.url), 'utf8');
  const informes = readFileSync(new URL('../informes.js', import.meta.url), 'utf8');
  const validacion = readFileSync(new URL('../validacion.js', import.meta.url), 'utf8');
  const governanceDoc = readFileSync(
    new URL('../docs/context/23_organizational_governance.md', import.meta.url),
    'utf8'
  );

  assert.match(shared, /if\(!isTecnicoRRHH\)\{[\s\S]*gestion\.push\(ITEMS\.dashboard, ITEMS\.informes\)/);
  assert.match(shared, /gestion\.push\(ITEMS\.maestro\)/);
  assert.match(shared, /gestion\.push\(ITEMS\.fio\)/);
  assert.match(shared, /\['dashboard','liquidaciones','hypoxic','informes'\]\.indexOf\(id\)/);
  assert.match(dashboard, /isTecnicoRrhh\(currentUser\)\) return \[\]/);
  assert.match(informes, /rol === 'tecnico_rrhh'.*return false/);
  assert.match(validacion, /isTecnicoRrhh\(currentUser\) && tab === 'hypoxic'/);
  assert.match(governanceDoc, /Sin acceso a Dashboard, Liquidaciones, Hypoxic Room ni Informes/);
});

test('BOSS is hidden from directory cards and opens only from the SYNCROSFERA logo', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const portal = readFileSync(new URL('../validacion.js', import.meta.url), 'utf8');

  assert.match(html, /class="ps-logo-shell" aria-label="Acceso BOSS" onclick="_pOpenBossLogin\(\)"/);
  assert.match(portal, /function _pHideBossFromDirectory\(employees\)/);
  assert.match(portal, /emps = _pHideBossFromDirectory\(emps\)/);
  assert.match(portal, /async function _pOpenBossLogin\(\)/);
  assert.match(portal, /directory\('administracion'\)/);
  assert.match(portal, /find\(_pIsBossEmployee\)/);
});

test('Dirección / RRHH portal does not include the F&B area', () => {
  const portal = readFileSync(new URL('../validacion.js', import.meta.url), 'utf8');

  assert.match(
    portal,
    /'administracion':\['Administración','RRHH','Recursos Humanos'\]/
  );
  assert.doesNotMatch(
    portal,
    /'administracion':\[[^\]]*'F&B'/
  );
});
