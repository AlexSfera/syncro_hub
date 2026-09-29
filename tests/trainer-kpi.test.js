import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function sliceFunction(source, name, nextMarker) {
  const start = source.indexOf('function ' + name);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0 && end > start, 'no se encontró ' + name);
  return source.slice(start, end);
}

test('Mi Rendimiento abre el mes más reciente entre autocontrol y VirtuGym', () => {
  const source = fs.readFileSync(new URL('../mi_rendimiento.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  const helpers = source.slice(
    source.indexOf('function _mrNormNombre'),
    source.indexOf('var _MR_ENTR_KPI_KEYS')
  );
  vm.runInContext(helpers + '\nthis.latest = _mrEntrLatestMonth;', context);
  const latest = context.latest(
    [{ employee_id:'trainer-1', employee_nombre:'Ana', ym:'2026-08' }],
    [{ employee_id:'trainer-1', fecha:'2026-09-29', kpi_entrenador:{ pt:2 } }],
    { id:'trainer-1', nombre:'Ana' },
    '2026-09'
  );
  assert.equal(latest, '2026-09');
});

test('la confirmación de guardado KPI exige exactamente la fila y valores persistidos', () => {
  const source = fs.readFileSync(new URL('../shared.js', import.meta.url), 'utf8');
  const helper = sliceFunction(source, '_verifyEntrKpiShiftWrite', '\nasync function setDB');
  const context = vm.createContext({ Object, Number, Array, JSON });
  vm.runInContext(helper + '\nthis.verify = _verifyEntrKpiShiftWrite;', context);
  const expected = { pt:2, pt_duo:1 };
  assert.equal(context.verify([{ id:'shift-1', kpi_entrenador:{ pt:2, pt_duo:1 } }], 'shift-1', expected), true);
  assert.equal(context.verify([], 'shift-1', expected), false);
  assert.equal(context.verify(null, 'shift-1', expected), false);
  assert.equal(context.verify([{ id:'shift-1', kpi_entrenador:{ pt:0, pt_duo:1 } }], 'shift-1', expected), false);
});

test('el formulario KPI conserva los valores al corregir o reintentar', () => {
  const source = fs.readFileSync(new URL('../mi_turno.js', import.meta.url), 'utf8');
  const start = source.indexOf('function openEntrKpiModal');
  const end = source.indexOf('function closeEntrKpiModal', start);
  assert.ok(start >= 0 && end > start);
  const elements = new Map();
  ['dir_efectiva','dir_no_efectiva','pt','pt_duo','pt_30','val_funcional','visbody','banera_hielo']
    .forEach(key => elements.set('entrkpi-' + key, { value:'' }));
  elements.set('entrkpi-err', { textContent:'' });
  elements.set('entrkpi-submit', { disabled:false, textContent:'' });
  elements.set('modal-entr-kpi', { style:{} });
  const context = vm.createContext({
    window: { _entrKpiState:{ pt:3, visbody:1 } },
    document: { getElementById:id => elements.get(id) || null },
    _ensureEntrKpiModal() {},
    _ENTR_KPI_CAMPOS: [
      {k:'dir_efectiva'},{k:'dir_no_efectiva'},{k:'pt'},{k:'pt_duo'},
      {k:'pt_30'},{k:'val_funcional'},{k:'visbody'},{k:'banera_hielo'}
    ]
  });
  vm.runInContext(source.slice(start, end) + '\nopenEntrKpiModal();', context);
  assert.equal(elements.get('entrkpi-pt').value, '3');
  assert.equal(elements.get('entrkpi-visbody').value, '1');
  assert.equal(elements.get('modal-entr-kpi').style.display, 'flex');
});

test('Mis informes incluye el detalle visible de los registros del mes', () => {
  const performance = fs.readFileSync(new URL('../mi_rendimiento.js', import.meta.url), 'utf8');
  const shiftForm = fs.readFileSync(new URL('../mi_turno.js', import.meta.url), 'utf8');
  const shared = fs.readFileSync(new URL('../shared.js', import.meta.url), 'utf8');
  assert.match(performance, /REGISTROS DEL MES/);
  assert.match(performance, /_mrEntrDetalle\(mios\)/);
  assert.match(shiftForm, /No se guardó el entrenamiento\. Reintenta\./);
  assert.match(shared, /<th>Actividad registrada<\/th>/);
  assert.match(shared, /entrKpiCell/);
});
