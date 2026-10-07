import { adminRequest, jsonResponse, readJson, requireAuthEnabled, requireSameOrigin } from '../lib/auth-server.js';
import { loadManagementActor } from '../lib/authz-server.js';
import { canMarkLiquidation } from '../lib/incentive-access.js';
import { isTrainer, canImportTrainerProduction, trainerProductionProjection, calculateTrainerProduction } from '../lib/trainer-production.js';

export const config = { runtime: 'edge' };
const monthOK = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');

export default async function handler(req) {
  const disabled = requireAuthEnabled(); if (disabled) return disabled;
  if (!['GET', 'POST'].includes(req.method)) return jsonResponse({ error:'Method not allowed' },405,{Allow:'GET, POST'});
  if (req.method === 'POST') { const origin = requireSameOrigin(req); if (origin) return origin; }
  let actor;
  try { actor = await loadManagementActor(req); } catch (_) { return jsonResponse({error:'Authentication unavailable'},503); }
  if (!actor) return jsonResponse({error:'Unauthorized'},401);
  try {
    const profile = actor.profile;
    if (req.method === 'GET') {
      const month = new URL(req.url).searchParams.get('mes');
      if (month && !monthOK(month)) return jsonResponse({error:'Mes inválido'},400);
      const employees = await adminRequest('employees?select=id,area,puesto,rol,responsable,validador');
      const ids = new Set(employees.filter(e => isTrainer(e)
        && (e.id === profile.id || canImportTrainerProduction(profile,e))).map(e => e.id));
      if (!ids.size) return jsonResponse({error:'Forbidden'},403);
      const rows = await adminRequest('entrenadores_incentivos_mes?select=id,employee_id,employee_nombre,ym,n_dir_efectivas,n_dir_no_efect,n_pt,n_pt_duo,n_pt_30,n_val_funcional,n_visbody,n_banera_hielo,planes_online'
        + (month ? '&ym=eq.'+encodeURIComponent(month) : '') + '&order=ym.desc');
      return jsonResponse({records:rows.filter(r => ids.has(r.employee_id)).map(trainerProductionProjection)});
    }
    const body = await readJson(req,200000);
    if (body.action === 'configure') {
      if (!canMarkLiquidation(profile)) return jsonResponse({error:'Forbidden'},403);
      if (!Array.isArray(body.rows) || !body.rows.length || body.rows.length > 200) return jsonResponse({error:'Configuración inválida'},400);
      const employees = await adminRequest('employees?select=id,area,puesto,rol');
      const drafts = body.rows.map(row => {
        if (!employees.some(e => e.id === row.id && isTrainer(e))
            || !['umbral','precio_hora'].includes(row.inc_metodo)) throw new Error('Configuración inválida');
        const draft = { inc_metodo:row.inc_metodo };
        for (const key of ['inc_umbral','inc_precio_hora','inc_base_neto']) {
          const value = row[key];
          if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000)) throw new Error('Configuración inválida');
          draft[key] = value;
        }
        if (draft.inc_metodo === 'precio_hora' && !(draft.inc_precio_hora > 0)
            || draft.inc_metodo === 'umbral' && !(draft.inc_umbral > 0)) throw new Error('Configuración inválida');
        return {id:row.id,draft};
      });
      for (const {id,draft} of drafts) await adminRequest('employees?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(draft)});
      return jsonResponse({ok:true});
    }
    if (!monthOK(body.mes)) return jsonResponse({error:'Mes inválido'},400);
    const previous = await adminRequest('entrenadores_incentivos_mes?ym=eq.'+encodeURIComponent(body.mes)+'&select=*');
    if (body.action === 'liquidate') {
      if (!canMarkLiquidation(profile)) return jsonResponse({error:'Forbidden'},403);
      const row = previous.find(r => r.employee_id === body.employee_id);
      if (!row) return jsonResponse({error:'Registro no encontrado'},404);
      if (row.liquidado === true) return jsonResponse({ok:true,already_liquidated:true});
      if (!(Number(row.incentivo_bruto)>0)) return jsonResponse({error:'No hay importe pendiente positivo'},409);
      const photos = body.fotos || [];
      if (!Array.isArray(photos) || photos.length > 10 || photos.some(p => typeof p !== 'string' || p.length > 2000 || !/^https:\/\//.test(p))) return jsonResponse({error:'Comprobante inválido'},400);
      const updated = await adminRequest('entrenadores_incentivos_mes?id=eq.'+encodeURIComponent(row.id)+'&liquidado=not.is.true',{
        method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({liquidado:true,
          liquidado_ts:new Date().toISOString(),liquidado_por:profile.nombre || profile.id,liquidado_fotos:photos})});
      return updated.length ? jsonResponse({ok:true}) : jsonResponse({error:'El registro ha cambiado. Recarga.'},409);
    }
    if (body.action !== 'import' || !Array.isArray(body.rows) || !body.rows.length || body.rows.length > 200) return jsonResponse({error:'Importación inválida'},400);
    const employees = await adminRequest('employees?select=id,nombre,area,puesto,rol,estado,inc_metodo,inc_umbral,inc_precio_hora,inc_base_neto');
    const seen = new Set();
    const drafts = [];
    for (const input of body.rows) {
      const employee = employees.find(e => e.id === input.employee_id && e.estado === 'Activo');
      if (!employee || !canImportTrainerProduction(profile,employee)) return jsonResponse({error:'Persona fuera del equipo autorizado o sin correspondencia confirmada'},403);
      if (seen.has(employee.id)) return jsonResponse({error:'Persona duplicada'},400); seen.add(employee.id);
      const current = previous.find(r => r.employee_id === employee.id || r.employee_nombre === employee.nombre);
      if (current && current.liquidado === true) return jsonResponse({error:'El mes contiene incentivos liquidados. No se puede reimportar esa persona.'},409);
      const calculated = calculateTrainerProduction(input,employee);
      drafts.push({id:current?.id || crypto.randomUUID(),employee_id:employee.id,employee_nombre:employee.nombre,
        ym:body.mes,...calculated,subido_por:profile.nombre || profile.id,
        fuente_archivo:typeof body.fuente === 'string' ? body.fuente.slice(0,200) : '',updated_at:new Date().toISOString()});
    }
    // Atomic bulk upsert; settled-row protection also applies in the database.
    await adminRequest('entrenadores_incentivos_mes?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(drafts)});
    return jsonResponse({ok:true,imported:drafts.length});
  } catch (_) { return jsonResponse({error:'No se pudo completar la operación. Revisa los datos y reintenta.'},409); }
}
