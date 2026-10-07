// Business financial access is narrower than transversal operational access.
export function canControlIncentives(profile) {
  return !!profile && ['admin', 'contable'].includes(profile.rol);
}

export function canMarkLiquidation(profile) {
  return !!profile && profile.rol === 'admin';
}

export function pendingIncentivesFor(employeeId, sources = {}) {
  const result = [];
  const settled = new Set((sources.liquidations || [])
    .filter(row => row.empleado_id === employeeId)
    .map(row => row.mes));
  const settledDepartments = new Set();
  for (const row of sources.trainers || []) {
    if(row.employee_id === employeeId && row.liquidado === true) settledDepartments.add('Entrenadores|'+row.ym);
  }
  for (const row of sources.housekeeping || []) {
    if(row.employee_id === employeeId && row.estado === 'liquidado') settledDepartments.add('Housekeeping|'+row.periodo);
  }
  for (const row of sources.approved || []) {
    if (row.employee_id !== employeeId || row.status !== 'approved'
        || settled.has(row.month) || settledDepartments.has(row.departamento+'|'+row.month) || !(Number(row.bonus_final) > 0)) continue;
    result.push({ id:row.id, department:/^recepci[oó]n(?: hotel| sfera)?$/i.test(row.departamento||'')?'Recepción Hotel':row.departamento, period:row.month,
      amount:Number(row.bonus_final), source:'approved', state:'pending' });
  }
  for (const row of sources.trainers || []) {
    if (row.employee_id !== employeeId || row.liquidado === true
        || !(Number(row.incentivo_bruto) > 0)) continue;
    result.push({ id:row.id, department:'Entrenadores', period:row.ym,
      amount:Number(row.incentivo_bruto), source:'official_import', state:'pending' });
  }
  for (const row of sources.housekeeping || []) {
    if (row.employee_id !== employeeId || row.estado !== 'pendiente'
        || !(Number(row.importe_premio) > 0)) continue;
    result.push({ id:row.id, department:'Housekeeping', period:row.periodo,
      amount:Number(row.importe_premio), source:'semester_award', state:'pending' });
  }
  for (const row of sources.reception || []) {
    if(row.employee_id!==employeeId || settled.has(row.period) || !(Number(row.amount)>0))continue;
    result.push({id:row.id,department:'Recepción Hotel',period:row.period,amount:Number(row.amount),source:'closure_sales',state:'pending'});
  }
  // Official department sources take precedence over a duplicated generic record.
  const unique = new Map();
  for (const row of result) unique.set(row.department+'|'+row.period, row);
  return [...unique.values()].sort((a,b) => b.period.localeCompare(a.period));
}
