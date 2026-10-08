// Read-only accounting export. Never calculates or settles incentives.
import { adminRequest, jsonResponse, requireAuthEnabled, requireMethod } from '../lib/auth-server.js';
import { loadManagementActor } from '../lib/authz-server.js';

export const config = { runtime: 'edge' };
export const canDownloadLiquidationReport = profile => !!profile && ['admin','contable'].includes(profile.rol);
const madrid = new Intl.DateTimeFormat('en-GB', {
  timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
});
function dateParts(date) {
  return Object.fromEntries(madrid.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
}
function madridMidnight(year, month) {
  const utc = Date.UTC(year,month,1);
  const p = dateParts(new Date(utc));
  const offset = Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-utc;
  return new Date(utc-offset).toISOString();
}
export function reportMonth(value) {
  if(!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value||'') || +value.slice(0,4)<2020) return null;
  const [year,month]=value.split('-').map(Number);
  return {id:value,start:madridMidnight(year,month-1),end:madridMidnight(year,month)};
}
function csvCell(value) {
  let text=String(value==null?'':value).replace(/[\r\n\t]/g,' ');
  if(/^\s*[=+\-@]/.test(text))text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
function cents(value) {
  if(value==null || value==='' || !Number.isFinite(Number(value)) || Number(value)<0)throw Error('Incomplete amount');
  const result=Math.round((Number(value)+Number.EPSILON)*100);
  if(!Number.isSafeInteger(result))throw Error('Invalid amount');
  return result;
}
function paymentMonth(value) {
  if(!value || !Number.isFinite(new Date(value).getTime()))throw Error('Incomplete payment date');
  const p=dateParts(new Date(value));return p.year+'-'+p.month;
}
export function liquidationReportCsv(month, sources={}) {
  const grouped=new Map(),seen=new Set();
  const sourceTypes=[
    {rows:sources.reception||[],department:'Recepción Hotel',id:'empleado_id',name:'empleado_nombre',period:'mes',date:'liquidado_at',amount:'incentivo_final',paid:()=>true},
    {rows:sources.trainers||[],department:'Entrenadores',id:'employee_id',name:'employee_nombre',period:'ym',date:'liquidado_ts',amount:'incentivo_bruto',paid:r=>r.liquidado===true},
    {rows:sources.housekeeping||[],department:'Housekeeping',id:'employee_id',name:'employee_nombre',period:'periodo',date:'liquidado_at',amount:'importe_premio',paid:r=>r.estado==='liquidado'}
  ];
  for(const type of sourceTypes)for(const row of type.rows) {
    if(!type.paid(row))continue;
    if(paymentMonth(row[type.date])!==month)continue;
    if(!row[type.id] || !row[type.period])throw Error('Incomplete settlement');
    const unique=type.department+'|'+row[type.id]+'|'+row[type.period];
    if(seen.has(unique))throw Error('Duplicate settlement');
    seen.add(unique);
    const key=type.department+'|'+row[type.id];
    const item=grouped.get(key)||{department:type.department,id:row[type.id],name:row[type.name]||'[NO DATA]',amount:0};
    item.amount+=cents(row[type.amount]);
    if(!Number.isSafeInteger(item.amount))throw Error('Invalid total');
    grouped.set(key,item);
  }
  const records=[...grouped.values()].sort((a,b)=>a.department.localeCompare(b.department,'es')||a.name.localeCompare(b.name,'es')||a.id.localeCompare(b.id));
  const lines=[['Mes de liquidación','Tipo de fila','Departamento','Empleado','ID empleado','Importe liquidado EUR']];
  const totals=new Map();let total=0;
  const money=amount=>(amount/100).toFixed(2).replace('.',',');
  for(const row of records) {
    lines.push([month,'Empleado',row.department,row.name,row.id,money(row.amount)]);
    totals.set(row.department,(totals.get(row.department)||0)+row.amount);total+=row.amount;
  }
  if(!Number.isSafeInteger(total))throw Error('Invalid total');
  for(const [department,amount]of totals)lines.push([month,'Total departamento',department,'','',money(amount)]);
  lines.push([month,'Total general','','','',money(total)]);
  return '\uFEFF'+lines.map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
async function paidRows(table, params) {
  const rows=[];
  for(let offset=0;offset<=100000;offset+=1000) {
    const page=await adminRequest(table+'?'+params+'&order=id.asc&limit=1000&offset='+offset);
    if(!Array.isArray(page))throw Error('Unavailable source');
    rows.push(...page);if(page.length<1000)return rows;
  }
  throw Error('Incomplete export');
}
export async function loadLiquidationReport(month) {
  const window=reportMonth(month);if(!window)throw Error('Invalid month');
  const definitions=[
    {key:'reception',table:'incentivos_liquidaciones',date:'liquidado_at',filter:'',cols:'id,empleado_id,empleado_nombre,mes,incentivo_final,liquidado_at'},
    {key:'trainers',table:'entrenadores_incentivos_mes',date:'liquidado_ts',filter:'liquidado=is.true&',cols:'id,employee_id,employee_nombre,ym,incentivo_bruto,liquidado,liquidado_ts'},
    {key:'housekeeping',table:'housekeeping_semester_incentives',date:'liquidado_at',filter:'estado=eq.liquidado&',cols:'id,employee_id,employee_nombre,periodo,importe_premio,estado,liquidado_at'}
  ];
  const sources={};
  await Promise.all(definitions.map(async d=>{
    // A paid record without a date cannot be assigned to a month. Do not export a misleading total.
    const undated=await adminRequest(d.table+'?'+d.filter+d.date+'=is.null&select=id&limit=1');
    if(!Array.isArray(undated)||undated.length)throw Error('Incomplete payment dates');
    sources[d.key]=await paidRows(d.table,d.filter+'select='+d.cols+'&'+d.date+'=gte.'+encodeURIComponent(window.start)+'&'+d.date+'=lt.'+encodeURIComponent(window.end));
  }));
  return liquidationReportCsv(month,sources);
}
export default async function handler(req) {
  const disabled=requireAuthEnabled();if(disabled)return disabled;
  const method=requireMethod(req,'GET');if(method)return method;
  let actor;
  try{actor=await loadManagementActor(req);}catch(_){return jsonResponse({error:'Authentication unavailable'},503);}
  if(!actor)return jsonResponse({error:'Unauthorized'},401);
  if(!canDownloadLiquidationReport(actor.profile))return jsonResponse({error:'Forbidden'},403);
  const params=new URL(req.url).searchParams;
  if(params.getAll('mes').length!==1 || [...params.keys()].some(key=>key!=='mes') || !reportMonth(params.get('mes')))
    return jsonResponse({error:'Selecciona un mes válido.'},400);
  const month=params.get('mes');
  try {
    const csv=await loadLiquidationReport(month);
    return new Response(csv,{headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition':'attachment; filename="liquidaciones-'+month+'.csv"',
      'Cache-Control':'private, no-store',
      'Vary':'Authorization, Cookie',
      'X-Content-Type-Options':'nosniff'
    }});
  }catch(_){return jsonResponse({error:'[NO DATA] No se puede generar un informe completo. Revisa las fechas e importes de liquidación o vuelve a intentarlo.'},503);}
}
