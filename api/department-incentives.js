import { adminRequest, jsonResponse, requireAuthEnabled, requireMethod } from '../lib/auth-server.js';
import { loadManagementActor, targetIsInScope, effectiveDepartment } from '../lib/authz-server.js';
import { canReadDepartmentIncentives, departmentIncentiveNames, incentiveDepartmentName } from '../lib/incentive-access.js';
import { pendingForProfiles } from './pending-incentives.js';

export const config={runtime:'edge'};

export default async function handler(req){
  const disabled=requireAuthEnabled();if(disabled)return disabled;
  const method=requireMethod(req,'GET');if(method)return method;
  let actor;
  try{actor=await loadManagementActor(req);}catch(_){return jsonResponse({error:'Authentication unavailable'},503);}
  if(!actor)return jsonResponse({error:'Unauthorized'},401);
  if(!canReadDepartmentIncentives(actor.profile))return jsonResponse({error:'Forbidden'},403);
  if([...new URL(req.url).searchParams.keys()].length)return jsonResponse({error:'El departamento se determina por tu permiso; no puede cambiarse en la petición.'},400);
  try{
    const all=[];
    for(let offset=0;offset<=100000;offset+=1000){
      const page=await adminRequest('employees?select=id,nombre,area,puesto,rol,estado,responsable,validador&order=id.asc&limit=1000&offset='+offset);
      all.push(...page);if(page.length<1000)break;
      if(offset===100000)throw new Error('Too many employees');
    }
    const profiles=all.filter(profile=>targetIsInScope(actor.profile,profile));
    const allowed=departmentIncentiveNames(actor.profile);
    const records=(await pendingForProfiles(profiles)).filter(row=>allowed.has(incentiveDepartmentName(row.department).toLocaleLowerCase('es')));
    return jsonResponse({department:effectiveDepartment(actor.profile),records,permissions:{can_liquidate:false}});
  }catch(_){return jsonResponse({error:'No se pudieron comprobar los incentivos del departamento.'},503);}
}
