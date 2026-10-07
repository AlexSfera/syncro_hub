import { adminRequest, jsonResponse, requireAuthEnabled, requireMethod } from '../lib/auth-server.js';
import { loadManagementActor } from '../lib/authz-server.js';
import { pendingIncentivesFor } from '../lib/incentive-access.js';
import { calculateReceptionIncentives } from './reception-incentives.js';

async function ownRows(path) {
  const rows=[];
  for(let offset=0;offset<=100000;offset+=1000){
    const page=await adminRequest(path+'&limit=1000&offset='+offset);
    rows.push(...page);
    if(page.length<1000)return rows;
  }
  throw new Error('Too many records');
}

async function receptionPending(profile,id) {
  if(!/^recepci[oó]n(?: sfera)?$/i.test(profile.area||''))return [];
  const [sales,fios]=await Promise.all([
    ownRows('recepcion_ventas?empleado_id=eq.'+id+'&select=id,empleado_id,fecha,tipo_venta,importe&order=fecha.asc'),
    ownRows('fio?employee_id=eq.'+id+'&select=employee_id,status,applied_points,incentive_month,saldado&order=id.asc')
  ]);
  const months=[...new Set(sales.filter(s=>s.empleado_id===profile.id).map(s=>String(s.fecha).slice(0,7)))];
  return months.filter(m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m)).map(month=>{
    const row=calculateReceptionIncentives({employees:[profile],sales:sales.filter(s=>String(s.fecha).startsWith(month)),
      fios:fios.filter(f=>f.incentive_month===month&&!f.saldado)})[0];
    return {id:'reception-'+month,employee_id:profile.id,period:month,amount:row.incentive_final};
  });
}

export const config = { runtime:'edge' };

export default async function handler(req) {
  const disabled = requireAuthEnabled();
  if (disabled) return disabled;
  const method = requireMethod(req, 'GET');
  if (method) return method;
  let actor;
  try { actor = await loadManagementActor(req); }
  catch (_) { return jsonResponse({ error:'Authentication unavailable' }, 503); }
  if (!actor) return jsonResponse({ error:'Unauthorized' }, 401);
  const url = new URL(req.url);
  if (url.searchParams.has('employee_id') || url.searchParams.has('empleado_id')) {
    return jsonResponse({ error:'La consulta es exclusivamente personal.' }, 400);
  }
  const id = encodeURIComponent(actor.profile.id);
  try {
    const [approved, trainers, housekeeping, liquidations] = await Promise.all([
      adminRequest('employee_incentives?employee_id=eq.'+id+'&status=eq.approved&select=id,employee_id,departamento,month,bonus_final,status'),
      adminRequest('entrenadores_incentivos_mes?employee_id=eq.'+id+'&select=id,employee_id,ym,incentivo_bruto,liquidado'),
      adminRequest('housekeeping_semester_incentives?employee_id=eq.'+id+'&select=id,employee_id,periodo,importe_premio,estado'),
      // These rows never leave the server; they only suppress settled periods.
      adminRequest('incentivos_liquidaciones?empleado_id=eq.'+id+'&select=empleado_id,mes')
    ]);
    return jsonResponse({ records:pendingIncentivesFor(actor.profile.id,
      { approved, trainers, housekeeping, liquidations, reception:await receptionPending(actor.profile,id) }) });
  } catch (_) {
    return jsonResponse({ error:'No se pudieron comprobar los incentivos pendientes.' }, 503);
  }
}
