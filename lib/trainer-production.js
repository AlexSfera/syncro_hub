import { effectiveDepartment, targetIsInScope } from './authz-server.js';

export const TRAINER_COUNTS = Object.freeze({
  dir_efectiva: 'n_dir_efectivas', dir_no_efectiva: 'n_dir_no_efect', pt: 'n_pt',
  pt_duo: 'n_pt_duo', pt_30: 'n_pt_30', val_funcional: 'n_val_funcional',
  visbody: 'n_visbody', banera_hielo: 'n_banera_hielo'
});

export function isTrainer(employee) { return effectiveDepartment(employee) === 'Entrenadores'; }
export function canImportTrainerProduction(actor, employee) {
  return isTrainer(employee) && (actor.rol === 'admin'
    || ['adjunto', 'adjunto_directivo'].includes(actor.rol)
    || targetIsInScope(actor, employee));
}
export function trainerProductionProjection(row) {
  const out = { id: row.id, employee_id: row.employee_id, employee_nombre: row.employee_nombre,
    ym: row.ym, planes_online: row.planes_online };
  for (const column of Object.values(TRAINER_COUNTS)) out[column] = row[column];
  return out;
}

const round = value => Math.round(value * 100) / 100;
export function calculateTrainerProduction(input, employee) {
  if (!input || typeof input !== 'object' || !input.kpi) throw new Error('Producción inválida');
  const counts = {};
  for (const [key, column] of Object.entries(TRAINER_COUNTS)) {
    const value = input.kpi[key];
    if (!Number.isInteger(value) || value < 0 || value > 100000) throw new Error('Contador inválido');
    counts[column] = value;
  }
  const planes = input.planes_online;
  if (!Number.isInteger(planes) || planes < 0 || planes > 100000) throw new Error('Planes inválidos');
  const k = input.kpi;
  const effective = round(k.dir_efectiva + k.pt + k.pt_duo * 1.5
    + (k.pt_30 + k.val_funcional + k.visbody + k.banera_hielo) * .5);
  const hours = round(effective + k.dir_no_efectiva);
  const method = employee.inc_metodo || 'umbral';
  const threshold = employee.inc_umbral == null ? 85 : Number(employee.inc_umbral);
  const price = Number(employee.inc_precio_hora || 0);
  const base = Number(employee.inc_base_neto || 0);
  if (!['umbral', 'precio_hora'].includes(method) || ![threshold, price, base].every(Number.isFinite)
      || threshold < 0 || price < 0 || base < 0 || method === 'precio_hora' && price <= 0) {
    throw new Error('Revisa la configuración de incentivos del entrenador');
  }
  const extra = method === 'umbral' ? Math.max(0, effective - threshold) : 0;
  const sessionBonus = round(extra * 10);
  const hourlyBonus = method === 'precio_hora' ? round(hours * price) : 0;
  return { ...counts, planes_online: planes, metodo_calculo: method,
    sesiones_efectivas: method === 'umbral' ? effective : 0,
    umbral: method === 'umbral' ? threshold : 0, sesiones_extra: extra,
    incentivo_sesiones: sessionBonus, incentivo_planes: planes * 6,
    horas_efectivas: method === 'precio_hora' ? hours : 0,
    precio_hora: method === 'precio_hora' ? price : 0,
    base_neto: method === 'precio_hora' ? base : 0, incentivo_horas: hourlyBonus,
    incentivo_bruto: round((method === 'precio_hora' ? hourlyBonus - base : sessionBonus) + planes * 6) };
}
