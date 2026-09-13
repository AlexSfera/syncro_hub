import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import receptionIncentivesHandler, {
  calculateReceptionIncentives,
  canLiquidateReceptionIncentives,
  canReadReceptionIncentives,
  parseReceptionMonth
} from '../api/reception-incentives.js';

function receptionRowsFixture() {
  return calculateReceptionIncentives({
    employees: [
      { id: 'employee-sales', nombre: 'Empleado Recepción A', area: 'Recepción', estado: 'Activo' },
      { id: 'employee-zero', nombre: 'Empleado Recepción B', area: 'Recepción', estado: 'Activo' },
      { id: 'inactive', nombre: 'Baja Recepción', area: 'Recepción', estado: 'Baja' },
      { id: 'sala', nombre: 'Persona Sala', area: 'Sala', estado: 'Activo' }
    ],
    sales: [
      {
        id: 'sale-1', shift_id: 'shift-1', fecha: '2026-08-03', empleado_id: 'employee-sales',
        tipo_venta: 'desayuno', importe: 110, reserva_mews: 'INV-45', comentario: 'Factura revisada'
      },
      {
        id: 'sale-2', shift_id: 'shift-2', fecha: '2026-08-05', empleado_id: 'employee-sales',
        tipo_venta: 'syncrolab', importe: 121, servicio_detalle: 'Bono', reserva_mews: 'MEWS-90'
      }
    ],
    fios: [
      { employee_id: 'employee-sales', status: 'Validado', applied_points: 2 },
      { employee_id: 'employee-sales', status: 'Registrado', applied_points: 999 }
    ],
    shifts: [
      { id: 'shift-1', servicio: 'Mañana', estado: 'Validado' },
      { id: 'shift-2', servicio: 'Tarde', estado: 'Pendiente' }
    ]
  });
}

async function loadIncentivesUi() {
  const source = await readFile(new URL('../incentivos.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    window: {}, document: {}, console, Date, JSON, Math, Number, String, Array,
    parseFloat, parseInt, encodeURIComponent, setTimeout, clearTimeout
  });
  vm.runInContext(source, context);
  return context;
}

test('valida el período mensual de Recepción Hotel', () => {
  assert.deepEqual(parseReceptionMonth('2026-08'), {
    id: '2026-08', year: 2026, month: 8,
    start: '2026-08-01', end: '2026-08-31', label: 'Agosto 2026'
  });
  assert.equal(parseReceptionMonth('2026-13'), null);
  assert.equal(parseReceptionMonth('08/2026'), null);
});

test('calcula el incentivo desde ventas de cierres y mantiene a cero a quien no tiene ventas', () => {
  const rows = receptionRowsFixture();
  assert.equal(rows.length, 2);

  const withSales = rows.find(row => row.employee_id === 'employee-sales');
  assert.equal(withSales.sales_count, 2);
  assert.equal(withSales.sales_net, 200);
  assert.equal(withSales.incentive_gross, 20);
  assert.equal(withSales.fio_points, 2);
  assert.equal(withSales.penalty_percent, 0.05);
  assert.equal(withSales.penalty_amount, 1);
  assert.equal(withSales.incentive_final, 19);
  assert.equal(withSales.sales[0].invoice_reference, 'INV-45');
  assert.equal(withSales.sales[0].closure_service, 'Mañana');
  assert.equal(withSales.sales[0].closure_status, 'Validado');

  const withoutSales = rows.find(row => row.employee_id === 'employee-zero');
  assert.equal(withoutSales.sales_count, 0);
  assert.equal(withoutSales.incentive_final, 0);
  assert.equal(withoutSales.liquidable, false);
  assert.equal(withoutSales.liquidated, false);
});

test('limita revisión y liquidación a los perfiles autorizados', () => {
  assert.equal(canReadReceptionIncentives({ rol: 'admin' }), true);
  assert.equal(canReadReceptionIncentives({ rol: 'adjunto', area: 'Administración' }), true);
  assert.equal(canReadReceptionIncentives({ rol: 'jefe', area: 'Recepción' }), true);
  assert.equal(canReadReceptionIncentives({ rol: 'chef', area: 'Cocina' }), false);
  assert.equal(canReadReceptionIncentives({ rol: 'empleado', area: 'Recepción' }), false);
  assert.equal(canLiquidateReceptionIncentives({ rol: 'admin' }), true);
  assert.equal(canLiquidateReceptionIncentives({ rol: 'adjunto' }), true);
  assert.equal(canLiquidateReceptionIncentives({ rol: 'jefe', area: 'Recepción' }), false);
});

test('Cálculo sustituye Liquidar por Revisar para todos, también con importe cero', async () => {
  const context = await loadIncentivesUi();
  const html = context._incReceptionCalculationRowsHtml(receptionRowsFixture());
  assert.match(html, /Empleado Recepción B/);
  assert.equal((html.match(/>◎ Revisar<\/button>/g) || []).length, 2);
  assert.doesNotMatch(html, /Liquidar/);
  assert.doesNotMatch(html, /Pendiente/);
});

test('el modal de revisión muestra fecha, cierre, factura MEWS y cálculo línea a línea', async () => {
  const context = await loadIncentivesUi();
  const withSales = receptionRowsFixture().find(row => row.employee_id === 'employee-sales');
  const html = context._incReceptionReviewHtml(withSales, '2026-08');
  assert.match(html, /REVISIÓN DEL CÁLCULO/);
  assert.match(html, /Nº factura \/ ref\. MEWS/);
  assert.match(html, /03\/08\/2026/);
  assert.match(html, /Mañana/);
  assert.match(html, /Validado/);
  assert.match(html, /INV-45/);
  assert.match(html, /Factura revisada/);
  assert.match(html, /INCENTIVO FINAL/);
});

test('Liquidación muestra Recepción y nunca deja un importe cero como pendiente', async () => {
  const context = await loadIncentivesUi();
  const rows = receptionRowsFixture();
  const html = context._incReceptionLiquidationHtml({
    rows,
    permissions: { can_liquidate: true }
  }, '2026-08');
  const withoutSalesRow = html.slice(html.indexOf('<strong>Empleado Recepción B'), html.indexOf('</tr>', html.indexOf('<strong>Empleado Recepción B')));
  const withSalesRow = html.slice(html.indexOf('<strong>Empleado Recepción A'), html.indexOf('</tr>', html.indexOf('<strong>Empleado Recepción A')));
  assert.match(html, /Recepción Hotel · Liquidación mensual/);
  assert.match(withoutSalesRow, /0 € · NO LIQUIDABLE/);
  assert.match(withoutSalesRow, /Sin pago/);
  assert.doesNotMatch(withoutSalesRow, /PENDIENTE/);
  assert.doesNotMatch(withoutSalesRow, /Marcar liquidado/);
  assert.match(withSalesRow, /PENDIENTE/);
  assert.match(withSalesRow, /Marcar liquidado/);
});

test('la liquidación segura ignora importes del navegador y guarda el cálculo del servidor', async () => {
  const originalFetch = globalThis.fetch;
  const trackedEnv = ['SYNCRO_AUTH_ENABLED', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_KEY'];
  const originalEnv = Object.fromEntries(trackedEnv.map(key => [key, process.env[key]]));
  const requests = [];
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' }
  });
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = encode({ alg: 'none' })+'.'
    +encode({ app_metadata: { syncro_authz_version: 7 } })+'.signature';

  process.env.SYNCRO_AUTH_ENABLED = 'true';
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';
  process.env.SUPABASE_SERVICE_KEY = 'service-test-key';

  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const method = init.method || 'GET';
    requests.push({ url, method, body: init.body ? JSON.parse(init.body) : null });
    if (url.includes('/auth/v1/user')) return json({ id: 'auth-user' });
    if (url.includes('/syncro_auth_identities?')) return json([{
      employee_id: 'admin', auth_user_id: 'auth-user', active: true,
      force_pin_change: false, authz_version: 7
    }]);
    if (url.includes('/employees?id=eq.admin')) return json([{
      id: 'admin', nombre: 'BOSS', area: 'Administración', puesto: 'Administrador',
      rol: 'admin', responsable: 1, validador: 1, estado: 'Activo'
    }]);
    if (url.includes('/employees?select=id,nombre,area,estado')) return json([
      { id: 'employee-sales', nombre: 'Empleado Recepción A', area: 'Recepción', estado: 'Activo' }
    ]);
    if (url.includes('/recepcion_ventas?')) return json([{
      id: 'sale-1', shift_id: 'shift-1', fecha: '2026-08-03', empleado_id: 'employee-sales',
      empleado_nombre: 'Empleado Recepción A', tipo_venta: 'desayuno', importe: 110,
      reserva_mews: 'INV-45', created_at: '2026-08-03T10:00:00Z'
    }]);
    if (url.includes('/fio?') && method === 'GET') return json([]);
    if (url.includes('/incentivos_liquidaciones?') && method === 'GET') return json([]);
    if (url.includes('/shifts?id=in.')) return json([
      { id: 'shift-1', fecha: '2026-08-03', servicio: 'Mañana', estado: 'Validado' }
    ]);
    if (url.endsWith('/rest/v1/incentivos_liquidaciones') && method === 'POST') {
      return json([requests.at(-1).body]);
    }
    if (url.includes('/fio?') && method === 'PATCH') return new Response(null, { status: 204 });
    if (url.endsWith('/rest/v1/audit_log') && method === 'POST') return new Response(null, { status: 204 });
    throw new Error('Petición inesperada: '+method+' '+url);
  };

  try {
    const response = await receptionIncentivesHandler(new Request(
      'https://syncro.example/api/reception-incentives',
      {
        method: 'POST',
        headers: {
          Origin: 'https://syncro.example',
          Authorization: 'Bearer '+token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'liquidate', employee_id: 'employee-sales', mes: '2026-08', notas: 'Nómina',
          incentivo_bruto: 99999, incentivo_final: 99999
        })
      }
    ));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.record.incentivo_bruto, 10);
    assert.equal(result.record.penalizacion_fio, 0);
    assert.equal(result.record.incentivo_final, 10);
    assert.equal(result.record.notas, 'Nómina');
    const insert = requests.find(request =>
      request.method === 'POST' && request.url.endsWith('/rest/v1/incentivos_liquidaciones')
    );
    assert.equal(insert.body.incentivo_final, 10);
    assert.ok(requests.some(request => request.method === 'PATCH' && request.url.includes('/fio?')));
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of trackedEnv) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});
