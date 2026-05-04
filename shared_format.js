// shared_format.js — Date, format, and pure badge helpers
// Loaded after shared.js. Constants (TASK_STATES, INCIDENT_STATES, DEPT_COLORS, DEPT_ICONS)
// remain in shared.js and are read from global scope at call time.

// ── DEPT BADGES ──
function deptStyle(d) {
  const c = DEPT_COLORS[d]||'#888';
  return `background:${c}22;color:${c};border:1px solid ${c};font-size:10px;`;
}
function deptIcon(d){ return DEPT_ICONS[d]||'🏢'; }
function deptBadge(d) {
  if(!d) return '<span class="badge b-gray">—</span>';
  const c = DEPT_COLORS[d];
  const icon = DEPT_ICONS[d]||'';
  if(!c) return `<span class="badge b-gray">${d}</span>`;
  return `<span class="badge" style="background:${c}22;color:${c};border:1px solid ${c};">${icon} ${d}</span>`;
}

// ── ID ──
function genId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ── DATE & FORMAT HELPERS ──
function today(){ return new Date().toISOString().split('T')[0]; }
function fmtDate(d){ if(!d) return '—'; var p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function fmtTs(ts){ if(!ts) return '—'; var d=new Date(ts); return d.toLocaleDateString('es-ES')+' '+d.toTimeString().slice(0,5); }
function startOfWeek(){ var d=new Date(); d.setHours(0,0,0,0); var day=d.getDay(), diff=d.getDate()-day+(day===0?-6:1); d.setDate(diff); return d.toISOString().split('T')[0]; }
function startOfMonth(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01'; }
function isOverdue(dl){ return dl && dl < today(); }
function getDateOnly(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function toYMD(date){
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
function getMinTaskDeadline(){ var d=getDateOnly(new Date()); d.setDate(d.getDate()+1); return toYMD(d); }
function getMaxTaskDeadline(){ var d=getDateOnly(new Date()); d.setDate(d.getDate()+7); return toYMD(d); }
function validateTaskDeadline(deadline){
  if(!deadline) return {ok:false,msg:'El deadline es obligatorio.'};
  if(deadline<getMinTaskDeadline() || deadline>getMaxTaskDeadline()){
    return {ok:false,msg:'El deadline debe estar entre mañana y los próximos 7 días.'};
  }
  return {ok:true};
}

// ── STATE NORMALIZATION ──
function normalizeTaskState(state){
  if(state==='Pendiente') return TASK_STATES.ABIERTA;
  if(state==='Completada') return TASK_STATES.CERRADA;
  if(state==='Verificada') return TASK_STATES.VALIDADA;
  if(state===TASK_STATES.EN_PROCESO) return TASK_STATES.EN_PROCESO;
  if(state===TASK_STATES.CERRADA) return TASK_STATES.CERRADA;
  if(state===TASK_STATES.VALIDADA) return TASK_STATES.VALIDADA;
  return TASK_STATES.ABIERTA;
}
function normalizeIncidentState(state){
  if(state==='Pendiente' || state==='Gestionada') return state==='Gestionada'?INCIDENT_STATES.CERRADA:INCIDENT_STATES.ABIERTA;
  if(state===INCIDENT_STATES.ABIERTA || state==='abierta') return INCIDENT_STATES.ABIERTA;
  if(state===INCIDENT_STATES.EN_PROCESO || state==='en proceso') return INCIDENT_STATES.EN_PROCESO;
  if(state===INCIDENT_STATES.CERRADA) return INCIDENT_STATES.CERRADA;
  if(state===INCIDENT_STATES.VALIDADA) return INCIDENT_STATES.VALIDADA;
  return INCIDENT_STATES.ABIERTA;
}
function isTaskOpen(t){ var s=normalizeTaskState(t&&t.estado); return s===TASK_STATES.ABIERTA||s===TASK_STATES.EN_PROCESO; }
function isIncidentOpen(i){ var s=normalizeIncidentState(i&&i.estado); return s===INCIDENT_STATES.ABIERTA||s===INCIDENT_STATES.EN_PROCESO; }
function normalizeDeptName(dept){ return String(dept||'').trim().toLowerCase(); }

// ── DISPLAY FORMAT ──
function formatDisplayValue(value){
  if(value===null || value===undefined || value==='') return '—';
  if(Array.isArray(value)) return value.length?value.map(formatDisplayValue).join(', '):'—';
  if(typeof value==='string'){
    var v=value.trim();
    if(!v || v==='null' || v==='undefined') return '—';
    try{ var parsed=JSON.parse(v); if(Array.isArray(parsed)) return formatDisplayValue(parsed); }catch(e){}
    return v;
  }
  return String(value);
}
function formatServiceOrTurn(value){ return formatDisplayValue(value); }
function formatStaffList(value){ return formatDisplayValue(value); }
function recordMatchesShift(record, shift){
  if(!record || !shift) return false;
  if(record.shift_id) return String(record.shift_id) === String(shift.id);
  if(record.fecha && shift.fecha && record.fecha !== shift.fecha) return false;
  var sameEmployee = record.employee_id && shift.employee_id && record.employee_id === shift.employee_id;
  var sameName = record.nombre && shift.nombre && record.nombre === shift.nombre;
  if(!sameEmployee && !sameName) return false;
  if(record.servicio && shift.servicio && formatServiceOrTurn(record.servicio) !== formatServiceOrTurn(shift.servicio)) return false;
  return true;
}

// ── STATE BADGES ──
function bFU(v){if(v==='si')return'<span class="badge b-green">SÍ</span>';if(v==='no')return'<span class="badge b-red">NO</span>';if(v==='na')return'<span class="badge b-blue">N/A</span>';return'<span class="badge b-gray">—</span>';}
function bEstado(e){const m={'Validado':'b-green ✓ Validado','Pendiente':'b-red ● Pendiente','En corrección':'b-orange ↩ Corrección','Rechazado':'b-gray ✗ Rechazado'};const[cls,...r]=(m[e]||'b-gray '+e).split(' ');return`<span class="badge ${cls}">${r.join(' ')}</span>`;}
function bSev(s){if(s==='Crítica')return'<span class="badge b-red">⛔ CRÍTICA</span>';if(s==='Alta')return'<span class="badge b-red">🔴 Alta</span>';if(s==='Media')return'<span class="badge b-orange">🟠 Media</span>';return'<span class="badge b-blue">🟡 Baja</span>';}
function bPrio(p){if(p==='Alta')return'<span class="badge b-red">Alta</span>';if(p==='Media')return'<span class="badge b-orange">Media</span>';return'<span class="badge b-blue">Baja</span>';}
function bTaskEstado(e){var s=normalizeTaskState(e);if(s===TASK_STATES.VALIDADA)return'<span class="badge b-green">✓ Validada</span>';if(s===TASK_STATES.CERRADA)return'<span class="badge b-orange">Cerrada</span>';if(s===TASK_STATES.EN_PROCESO)return'<span class="badge b-blue">En proceso</span>';return'<span class="badge b-red">Abierta</span>';}
function bIncidentEstado(e){var s=normalizeIncidentState(e);if(s===INCIDENT_STATES.VALIDADA)return'<span class="badge b-green">✓ Validada</span>';if(s===INCIDENT_STATES.CERRADA)return'<span class="badge b-orange">Cerrada</span>';if(s===INCIDENT_STATES.EN_PROCESO)return'<span class="badge b-blue">En proceso</span>';return'<span class="badge b-red">Abierta</span>';}
