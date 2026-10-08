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

export async function pendingForProfiles(profiles) {
  if (!profiles.length) return [];
  const ids=[...new Set(profiles.map(p=>p.id))];
  if(ids.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,120}$/.test(id)))throw new Error('Invalid trusted employee identity');
  const filter=ids.length===1?'eq.'+encodeURIComponent(ids[0]):'in.'+encodeURIComponent('('+ids.join(',')+')');
  const receptionProfiles=profiles.filter(p=>/^recepci[oó]n(?: hotel| sfera)?$/i.test(p.area||''));
  const receptionIds=receptionProfiles.map(p=>p.id);
  const receptionFilter='in.'+encodeURIComponent('('+receptionIds.join(',')+')');
  const [approved,trainers,housekeeping,liquidations,sales,fios]=await Promise.all([
    ownRows('employee_incentives?employee_id='+filter+'&status=eq.approved&select=id,employee_id,departamento,month,bonus_final,status&order=id.asc'),
    ownRows('entrenadores_incentivos_mes?employee_id='+filter+'&select=id,employee_id,ym,incentivo_bruto,liquidado&order=id.asc'),
    ownRows('housekeeping_semester_incentives?employee_id='+filter+'&select=id,employee_id,periodo,importe_premio,estado&order=id.asc'),
    ownRows('incentivos_liquidaciones?empleado_id='+filter+'&select=empleado_id,mes&order=id.asc'),
    receptionIds.length?ownRows('recepcion_ventas?empleado_id='+receptionFilter+'&select=id,empleado_id,fecha,tipo_venta,importe&order=id.asc'):[],
    receptionIds.length?ownRows('fio?employee_id='+receptionFilter+'&select=id,employee_id,status,applied_points,incentive_month,saldado&order=id.asc'):[]
  ]);
  return profiles.flatMap(profile=>{
    const ownSales=sales.filter(s=>s.empleado_id===profile.id);
    const months=[...new Set(ownSales.map(s=>String(s.fecha).slice(0,7)))].filter(m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m));
    const reception=months.map(month=>{
      const row=calculateReceptionIncentives({employees:[{...profile,estado:'Activo'}],sales:ownSales.filter(s=>String(s.fecha).startsWith(month)),
        fios:fios.filter(f=>f.employee_id===profile.id&&f.incentive_month===month&&!f.saldado)})[0];
      return {id:'reception-'+month,employee_id:profile.id,period:month,amount:row.incentive_final};
    });
    return pendingIncentivesFor(profile.id,{approved,trainers,housekeeping,liquidations,reception})
      .map(row=>({...row,employee_id:profile.id,employee_name:profile.nombre}));
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
  try {
    const records=await pendingForProfiles([actor.profile]);
    return jsonResponse({records:records.map(({employee_id,employee_name,...row})=>row)});
  } catch (_) {
    return jsonResponse({ error:'No se pudieron comprobar los incentivos pendientes.' }, 503);
  }
}
