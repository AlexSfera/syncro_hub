import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadTasks(seed = []) {
  const records = structuredClone(seed);
  const updates = [];
  const elements = {};
  for (const id of ['tk-estado', 'tk-dept', 'tk-prio', 'tk-origen', 'tk-desde', 'tk-hasta',
    'tareas-list', 'tareas-kpi', 'dash-tasks-table', 'dept-task-grid', 'modal-task-state',
    'task-state-body', 'task-state-foot', 'modal-mant-task', 'mmt-title', 'mmt-body', 'mmt-foot',
    'task-dept', 'task-dept-origen', 'task-prio', 'task-deadline', 'task-desc', 'task-room']) {
    elements[id] = { value: '', innerHTML: '', textContent: '', classList: { add() {} } };
  }
  const context = {
    console, TASK_STATES: { ABIERTA: 'Abierta', EN_PROCESO: 'En proceso', CERRADA: 'Cerrada', VALIDADA: 'Validada' },
    document: { getElementById: id => elements[id] || null, addEventListener() {} },
    currentUser: { rol: 'empleado', area: 'Limpieza', nombre: 'Perfil ficticio de Pisos' },
    getDB: async () => structuredClone(records),
    dbInsert: async (table, row) => { assert.equal(table, 'tareas'); records.push(structuredClone(row)); return row; },
    dbUpdate: async (table, id, patch) => {
      assert.equal(table, 'tareas'); updates.push(structuredClone(patch));
      Object.assign(records.find(row => row.id === id), patch); return true;
    },
    normalizeDeptName: name => String(name).toLowerCase(),
    isAdmin: user => user.rol === 'admin', canActAsAdmin: user => user.rol === 'admin',
    isSupervisor: user => user.rol === 'jefe', canViewDepartment: (user, dept) => user.area === dept,
    getSupervisorDepartments: user => [user.area],
    getDateOnly: date => new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    toYMD: date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,
    localTs: () => new Date().toISOString(), genId: () => 'task-from-housekeeping',
    today: () => new Date().toISOString().slice(0,10),
    fmtDate: value => value || '—', fmtTs: value => value || '—', _localHora: () => '08:00',
    formatDisplayValue: value => value || '—', isOverdue: () => false,
    deptBadge: dept => dept, deptIcon: () => '', bPrio: priority => priority,
    invalidateCache() {}, auditLog() {}, toast() {}, closeModal() {}, updateDots() {},
  };
  context.window = context;
  vm.createContext(context);
  for (const script of ['incidencias.js', 'tareas.js', 'mantenimiento.js']) {
    vm.runInContext(readFileSync(new URL(`../${script}`, import.meta.url), 'utf8'), context);
  }
  return { context, records, elements, updates };
}

const oldTask = {
  id: 'old-task', titulo: 'Revisar equipo', descripcion: 'Descripción original de Pisos',
  dept_origen: 'Limpieza', dept_destino: 'Mantenimiento', prioridad: 'Media', estado: 'Abierta',
  origen: 'manual', deadline: '2026-10-12', created_at: '2026-10-12T08:00:00Z', room: '104',
};

test('el selector de Pisos se guarda y la misma habitación llega a todas las vistas de Mantenimiento', async () => {
  const { context: c, records, elements: el } = loadTasks();
  el['task-dept'].value = 'Mantenimiento';
  el['task-dept-origen'].value = 'Limpieza';
  el['task-prio'].value = 'Media';
  el['task-deadline'].value = c.getMinTaskDeadline();
  el['task-desc'].value = oldTask.descripcion;
  el['task-room'].value = '104';
  await c.saveTask();
  assert.equal(records.length, 1);
  assert.equal(records[0].room, '104');
  assert.equal(records[0].descripcion, oldTask.descripcion);
  c.currentUser = { rol: 'empleado', area: 'Mantenimiento', nombre: 'Perfil ficticio' };
  await c.renderTareas();
  await c.openTaskStateModal(records[0].id);
  c._renderTareas(records);
  await c._mantOpenModal(records[0].id);
  for (const id of ['tareas-list', 'task-state-body', 'dash-tasks-table', 'mmt-body']) {
    assert.match(el[id].innerHTML, /Habitación 104/);
    assert.ok(el[id].innerHTML.includes(oldTask.descripcion));
  }
  assert.match(c._mantCard(records[0], 'a_planificar'), /Habitación 104/);
});

test('una tarea generada desde una incidencia conserva su habitación normalizada', async () => {
  const { context: c, records } = loadTasks();
  const task = await c.createTask({ ...oldTask, room: 'Habitación B201', origen: 'incidencia', shift_id: 'shift-fixture', deadline: c.getMinTaskDeadline() });
  assert.equal(task.room, 'B201');
  assert.equal(records[0].room, 'B201');
  assert.match(c.bTaskRoom(task), /Habitación B201/);
});

test('mostrar tareas antiguas conserva todos los campos y no inventa habitación desde la descripción', async () => {
  const legacy = { ...oldTask, room: null, descripcion: 'Revisar el equipo; referencia 104 pendiente de confirmar' };
  const { context: c, records, elements: el, updates } = loadTasks([legacy, { ...oldTask, id: 'other-dept', dept_destino: 'Sala', room: '205' }]);
  const before = structuredClone(records);
  c.currentUser = { rol: 'empleado', area: 'Mantenimiento' };
  await c.renderTareas();
  await c.openTaskStateModal(legacy.id);
  c._renderTareas([legacy]);
  await c._mantOpenModal(legacy.id);
  assert.equal(c.bTaskRoom(legacy), '');
  assert.ok(!el['tareas-list'].innerHTML.includes('task-room'));
  assert.ok(!el['tareas-list'].innerHTML.includes('Habitación 205'));
  assert.match(el['task-state-body'].innerHTML, /Sin habitación indicada/);
  assert.ok(!c._mantCard(legacy, 'a_planificar').includes('Habitación 104'));
  assert.deepEqual(records, before);
  assert.deepEqual(updates, []);
});

test('la habitación se escapa como texto en tarjetas y detalles', async () => {
  const task = { ...oldTask, room: '104"><img src=x onerror="alert(1)">' };
  const { context: c, elements: el } = loadTasks([task]);
  c.currentUser = { rol: 'empleado', area: 'Mantenimiento' };
  await c.renderTareas();
  await c.openTaskStateModal(task.id);
  await c._mantOpenModal(task.id);
  for (const html of [c.bTaskRoom(task), c._mantCard(task, 'a_planificar'), el['tareas-list'].innerHTML, el['task-state-body'].innerHTML, el['mmt-body'].innerHTML]) {
    assert.ok(!html.includes('<img'));
    assert.match(html, /104&quot;&gt;&lt;img/);
  }
});

test('avanzar la tarea mantiene habitación y descripción sin ampliar permisos de cierre', async () => {
  const { context: c, records, updates } = loadTasks([oldTask]);
  c.currentUser = { rol: 'empleado', area: 'Mantenimiento', nombre: 'Perfil ficticio' };
  await c.advanceTask(oldTask.id, 'En proceso');
  assert.equal(records[0].estado, 'En proceso');
  assert.equal(records[0].room, '104');
  assert.equal(records[0].descripcion, oldTask.descripcion);
  assert.deepEqual(Object.keys(updates[0]).sort(), ['estado', 'updated_at']);
  await c.advanceTask(oldTask.id, 'Cerrada');
  assert.equal(updates.length, 1);
  assert.equal(records[0].estado, 'En proceso');
});
