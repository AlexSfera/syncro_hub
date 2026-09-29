import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadChecklist() {
  const source = fs.readFileSync(new URL('../checklist.js', import.meta.url), 'utf8');
  const elements = new Map([
    ['chk-items', { innerHTML:'' }],
    ['chk-bar', { style:{} }],
    ['chk-warn', { style:{}, textContent:'' }],
    ['chk-confirm-btn', { style:{}, disabled:false }],
    ['modal-checklist', { classList:{ add() {}, remove() {} } }]
  ]);
  let saved = 0;
  let labCashOpened = 0;
  const context = vm.createContext({
    Array,
    Date,
    JSON,
    Math,
    String,
    console,
    currentUser: {
      id:'sofia', nombre:'Sofia Veiga', area:'SYNCROLAB',
      puesto:'Club Manager', rol:'jefe'
    },
    document: {
      getElementById:id => elements.get(id) || null,
      querySelector:() => null
    },
    localStorage: {
      getItem:() => null,
      setItem() {},
      removeItem() {}
    },
    window: {},
    today:() => '2026-09-29',
    autoAssignTurno:() => ({ turno:'Mañana' }),
    _cache:{},
    async _doSaveTurno() { saved += 1; },
    openLabCajaChoice() { labCashOpened += 1; }
  });
  vm.runInContext(source + `
    this.api = {
      chkOpen,
      chkConfirm,
      managerItems: CHK_CLUB_MANAGER_ITEMS,
      managerSections: CHK_CLUB_MANAGER_SECTIONS
    };`, context);
  return {
    api:context.api,
    elements,
    counters:() => ({ saved, labCashOpened })
  };
}

test('Club Manager recibe un checklist propio de control de SYNCROLAB', () => {
  const { api, elements } = loadChecklist();
  api.chkOpen(null);

  assert.equal(api.managerItems.length, 10);
  assert.equal(
    api.managerSections.reduce((total, section) => total + section.count, 0),
    api.managerItems.length
  );
  const html = elements.get('chk-items').innerHTML;
  assert.match(html, /todos los empleados que trabajaron hoy/);
  assert.match(html, /incidencias abiertas o en proceso/);
  assert.match(html, /tareas pendientes o vencidas/);
  assert.doesNotMatch(html, /Encender ordenadores/);
  assert.doesNotMatch(html, /Arqueo de cajas Fitness y Clínica/);
});

test('Club Manager guarda el turno sin abrir la caja operativa de Recepción SYNCROLAB', async () => {
  const { api, counters } = loadChecklist();
  api.chkOpen({ cierre:true });
  await api.chkConfirm();

  assert.deepEqual(counters(), { saved:1, labCashOpened:0 });
});

test('las instrucciones separan el control de Club Manager de la operación de caja', () => {
  const source = fs.readFileSync(new URL('../mi_turno.js', import.meta.url), 'utf8');
  assert.match(source, /Club Manager — Control diario de SYNCROLAB/);
  assert.match(source, /No se abrirá el cierre de caja de Recepción SYNCROLAB/);
});
