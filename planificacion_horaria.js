// SYNCRO SHIFT · Planificación horaria semanal
// Catálogo de turnos: Bitrix24 timeman.schedule.get. Publicación: bloqueada
// hasta disponer de una API oficial documentada de escritura ShiftPlan.

var _ph = {
  weekStart: '', department: '', data: null, assignments: [], loading: false,
  timer: null, modalEmployee: '', modalDate: ''
};

var PH_DEPARTMENTS = [
  'Cocina', 'Sala', 'Housekeeping', 'Mantenimiento', 'Recepción',
  'Recepción SYNCROLAB', 'Entrenadores', 'Fisioterapeutas', 'RRHH',
  'Comercial', 'Marketing', 'Dirección Comercial', 'C&C'
];

function _phEsc(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(char){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
  });
}

function _phToday(){
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(new Date());
  var pick = function(type){ return parts.find(function(part){ return part.type === type; }).value; };
  return pick('year') + '-' + pick('month') + '-' + pick('day');
}

function _phAddDays(ymd, days){
  var date = new Date(ymd + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function _phMonday(ymd){
  var date = new Date(ymd + 'T12:00:00Z');
  var day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function _phInitialDepartment(){
  var area = currentUser && currentUser.area || '';
  var puesto = currentUser && currentUser.puesto || '';
  if(area === 'Friegue') return 'Cocina';
  if(area === 'Limpieza' || area === 'HK') return 'Housekeeping';
  if(area === 'Recepción SFERA') return 'Recepción';
  if(/syncrolab/i.test(area)){
    if(/fisio/i.test(puesto)) return 'Fisioterapeutas';
    if(/entrenador/i.test(puesto)) return 'Entrenadores';
    return 'Recepción SYNCROLAB';
  }
  if(area === 'Administración' || area === 'Recursos Humanos') return 'RRHH';
  return PH_DEPARTMENTS.indexOf(area) >= 0 ? area : 'Cocina';
}

async function _phApi(path, options){
  var opts = Object.assign({ headers:{} }, options || {});
  if(opts.body && typeof opts.body !== 'string'){
    opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers);
    opts.body = JSON.stringify(opts.body);
  }
  var response = await syncroSupabaseFetch(path, opts);
  var payload = await response.json().catch(function(){ return {}; });
  if(!response.ok){
    var error = new Error(payload.error || ('HTTP_' + response.status));
    error.payload = payload;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function _phEnsureStyle(){
  if(document.getElementById('ph-style')) return;
  var style = document.createElement('style');
  style.id = 'ph-style';
  style.textContent = [
    '.ph-toolbar{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:12px}',
    '.ph-toolbar .fg{min-width:160px}.ph-actions{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}',
    '.ph-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px;color:var(--text3);margin:8px 0 14px}',
    '.ph-pill{padding:4px 8px;border-radius:999px;background:var(--bg3);border:1px solid var(--border)}',
    '.ph-table-wrap{overflow:auto;border:1px solid var(--border);border-radius:10px;background:var(--bg2)}',
    '.ph-table{border-collapse:separate;border-spacing:0;min-width:1180px;width:100%}',
    '.ph-table th,.ph-table td{border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:8px;vertical-align:top}',
    '.ph-table th{position:sticky;top:0;background:var(--bg3);z-index:2;font-size:11px}.ph-table th:first-child{left:0;z-index:3}',
    '.ph-table td:first-child{position:sticky;left:0;background:var(--bg2);z-index:1;min-width:190px}',
    '.ph-cell{min-height:62px;border-radius:7px;padding:6px;background:var(--bg3);font-size:11px}',
    '.ph-cell.editable{cursor:pointer;border:1px dashed var(--border)}.ph-cell.editable:hover{border-color:var(--accent1)}',
    '.ph-cell.shift{border-left:3px solid #2ec4b6}.ph-cell.rest{border-left:3px solid #64748b}.ph-cell.abs{border-left:3px solid #f59e0b}',
    '.ph-name{font-weight:700;font-size:12px}.ph-muted{color:var(--text3);font-size:10px;margin-top:3px}',
    '.ph-alert{padding:12px 14px;border-radius:8px;margin:10px 0;font-size:12px;border:1px solid var(--border)}',
    '.ph-alert.warn{background:#f59e0b16;border-color:#f59e0b;color:#fbbf24}.ph-alert.err{background:#ef444416;border-color:#ef4444;color:#fca5a5}',
    '.ph-modal-layer{position:fixed;inset:0;background:#0009;display:none;align-items:center;justify-content:center;z-index:9990;padding:18px}',
    '.ph-modal-layer.open{display:flex}.ph-modal-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:18px;max-width:600px;width:100%;max-height:92vh;overflow:auto}',
    '.ph-modal-title{font-weight:800;font-size:17px;margin-bottom:14px}.ph-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.ph-modal-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}',
    '@media(max-width:700px){.ph-grid2{grid-template-columns:1fr}.ph-actions{margin-left:0}.ph-toolbar .fg{flex:1}.ph-modal-layer{padding:8px}}'
  ].join('');
  document.head.appendChild(style);
}

async function renderPlanificacionHoraria(){
  _phEnsureStyle();
  if(!_ph.weekStart) _ph.weekStart = _phMonday(_phToday());
  if(!_ph.department) _ph.department = _phInitialDepartment();
  _phStartTimer();
  await _phLoad(true);
}
window.renderPlanificacionHoraria = renderPlanificacionHoraria;

function _phStartTimer(){
  if(_ph.timer) return;
  _ph.timer = setInterval(function(){
    var screen = document.getElementById('screen-planificacion-horaria');
    if(screen && screen.classList.contains('active') && _ph.data && _ph.data.permissions.canEdit){
      _phRefreshCatalog(true);
    }
  }, 5 * 60 * 1000);
}

async function _phLoad(syncOnOpen){
  var root = document.getElementById('planificacion-horaria-content');
  if(!root || _ph.loading) return;
  _ph.loading = true;
  root.innerHTML = '<div class="card"><p style="padding:16px 0;color:var(--text3)">Cargando planificación…</p></div>';
  try{
    var url = '/api/planning/bootstrap?week_start=' + encodeURIComponent(_ph.weekStart)
      + '&department=' + encodeURIComponent(_ph.department);
    _ph.data = await _phApi(url, {method:'GET'});
    _ph.assignments = (_ph.data.assignments || []).map(function(item){
      return Object.assign({}, item, {
        tramos: (_ph.data.segments || []).filter(function(segment){ return String(segment.asignacion_id) === String(item.id); })
      });
    });
    _phRender();
    if(syncOnOpen && _ph.data.permissions.canEdit) await _phRefreshCatalog(true);
  }catch(error){
    var schemaPending = error.message === 'PLANNING_SCHEMA_NOT_READY';
    root.innerHTML = '<div class="card"><div class="ph-alert ' + (schemaPending ? 'warn' : 'err') + '">'
      + (schemaPending
        ? 'La estructura de Planificación Horaria está preparada, pero aún no está autorizada en Supabase LIVE. [NO DATA]'
        : 'No se pudo cargar la planificación: ' + _phEsc(error.message))
      + '</div><button class="btn" onclick="renderPlanificacionHoraria()">Reintentar</button></div>';
  }finally{
    _ph.loading = false;
  }
}

function _phDepartmentOptions(){
  var list = PH_DEPARTMENTS.slice();
  (_ph.data && _ph.data.mappings || []).forEach(function(item){
    if(list.indexOf(item.departamento_id) < 0) list.push(item.departamento_id);
  });
  return list.map(function(department){
    return '<option value="' + _phEsc(department) + '"' + (department === _ph.department ? ' selected' : '') + '>'
      + _phEsc(department) + '</option>';
  }).join('');
}

function _phRender(){
  var root = document.getElementById('planificacion-horaria-content');
  if(!root || !_ph.data) return;
  var canEdit = !!_ph.data.permissions.canEdit;
  var week = _ph.data.week;
  var state = week ? week.estado : 'sin planificación';
  var version = week ? week.version_actual : 0;
  var refreshed = (_ph.data.mappings || []).filter(function(item){
    return item.departamento_id === _ph.department && item.ultima_lectura_at;
  }).map(function(item){ return new Date(item.ultima_lectura_at).toLocaleString('es-ES'); })[0] || '[NO DATA]';
  var rows = (_ph.data.employees || []).map(_phEmployeeRow).join('');
  if(!rows) rows = '<tr><td colspan="8"><div class="ph-alert warn">No hay empleados activos vinculados a este departamento. [NO DATA]</div></td></tr>';

  root.innerHTML = '<div class="card">'
    + '<div class="ph-toolbar">'
    + '<div class="fg"><label>Departamento</label><select onchange="_phChangeDepartment(this.value)">' + _phDepartmentOptions() + '</select></div>'
    + '<div class="fg"><label>Semana</label><input type="date" value="' + _phEsc(_ph.weekStart) + '" onchange="_phChangeWeek(this.value)"></div>'
    + '<button class="btn" onclick="_phMoveWeek(-7)">← Anterior</button><button class="btn" onclick="_phMoveWeek(7)">Siguiente →</button>'
    + '<div class="ph-actions">'
    + (canEdit ? '<button class="btn" onclick="_phOpenOperation(\'absence\')">Ausencia</button>' : '')
    + (canEdit ? '<button class="btn" onclick="_phOpenOperation(\'extra\')">Extra / recuperación</button>' : '')
    + (_ph.data.permissions.canManageLaborConditions ? '<button class="btn" onclick="_phOpenOperation(\'labor\')">Condición laboral</button>' : '')
    + (canEdit ? '<button class="btn" onclick="_phRefreshCatalog(false)">Actualizar Bitrix24</button>' : '')
    + (canEdit ? '<button class="btn btn-primary" onclick="_phSaveWeek()">Guardar borrador</button>' : '')
    + (canEdit && week ? '<button class="btn" onclick="_phPublishWeek()">Comprobar publicación</button>' : '')
    + '</div></div>'
    + '<div class="ph-status"><span class="ph-pill">Estado: ' + _phEsc(state) + '</span><span class="ph-pill">Versión: ' + version + '</span>'
    + '<span class="ph-pill">Catálogo Bitrix24: ' + _phEsc(refreshed) + '</span><span class="ph-pill">Vacaciones: [NO DATA] hasta completar condiciones laborales</span></div>'
    + (!_ph.data.bitrixWriteSupported ? '<div class="ph-alert warn"><strong>Publicación protegida:</strong> la escritura de ShiftPlan en Bitrix24 permanece bloqueada porque no existe una API oficial documentada. No se usan clics internos ni endpoints no oficiales.</div>' : '')
    + '<div class="ph-table-wrap"><table class="ph-table"><thead><tr><th>Empleado</th>'
    + (_ph.data.dates || []).map(function(date){ return '<th>' + _phEsc(_phDayLabel(date)) + '<div class="ph-muted">' + _phEsc(date.slice(5)) + '</div></th>'; }).join('')
    + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<div class="ph-muted" style="margin-top:10px">Los turnos se eligen únicamente desde el catálogo oficial de Bitrix24. Los turnos partidos admiten dos tramos.</div>'
    + '</div><div class="ph-modal-layer" id="ph-modal"><div class="ph-modal-card" id="ph-modal-card"></div></div>';
}

function _phDayLabel(date){
  return new Intl.DateTimeFormat('es-ES', {weekday:'short', timeZone:'UTC'}).format(new Date(date + 'T12:00:00Z'));
}

function _phAssignment(employeeId, date){
  return _ph.assignments.find(function(item){
    return String(item.empleado_id) === String(employeeId) && item.fecha_operativa === date;
  }) || null;
}

function _phAbsence(employeeId, date){
  return (_ph.data.absences || []).find(function(item){
    return String(item.empleado_id) === String(employeeId) && item.fecha_inicio <= date && item.fecha_fin >= date;
  });
}

function _phHoliday(date){
  return (_ph.data.holidays || []).find(function(item){ return item.fecha === date; });
}

function _phExtra(employeeId, date){
  return (_ph.data.extras || []).filter(function(item){
    return String(item.empleado_id) === String(employeeId) && item.fecha === date;
  });
}

function _phEmployeeRow(employee){
  var balance = (_ph.data.balances || []).find(function(item){ return String(item.employee_id) === String(employee.id); });
  var cells = (_ph.data.dates || []).map(function(date){
    var assignment = _phAssignment(employee.id, date);
    var absence = _phAbsence(employee.id, date);
    var holiday = _phHoliday(date);
    var extras = _phExtra(employee.id, date);
    var html = '';
    var className = 'ph-cell';
    if(assignment){
      if(assignment.tipo_dia === 'turno'){
        className += ' shift';
        var times = (assignment.tramos || []).map(function(segment){
          return _phTime(segment.inicio) + '–' + _phTime(segment.fin);
        }).join(' / ');
        html = '<strong>' + _phEsc(times || 'Turno') + '</strong><div class="ph-muted">' + Number(assignment.minutos_planificados || 0) + ' min</div>';
      }else{
        className += assignment.tipo_dia === 'descanso' ? ' rest' : ' abs';
        html = '<strong>' + _phEsc(assignment.tipo_dia) + '</strong>';
      }
    }else if(absence){
      className += ' abs'; html = '<strong>' + _phEsc(absence.etiqueta_publica || 'Ausencia') + '</strong>';
    }else if(holiday){
      className += ' abs'; html = '<strong>Festivo</strong><div class="ph-muted">' + _phEsc(holiday.nombre || '') + '</div>';
    }else{
      html = '<span class="ph-muted">Sin asignar</span>';
    }
    if(extras.length){
      html += '<div class="ph-muted">' + extras.map(function(item){
        return (item.tipo === 'extra' ? 'Extra +' : 'Recuperación ') + Number(item.minutos || 0) + ' min';
      }).join(' · ') + '</div>';
    }
    if(_ph.data.permissions.canEdit) className += ' editable';
    return '<td><div class="' + className + '"' + (_ph.data.permissions.canEdit
      ? ' onclick="_phOpenCell(\'' + _phEsc(String(employee.id)) + '\',\'' + date + '\')"' : '') + '>' + html + '</div></td>';
  }).join('');
  return '<tr><td><div class="ph-name">' + _phEsc(employee.nombre) + '</div><div class="ph-muted">' + _phEsc(employee.puesto || employee.area || '')
    + '</div><div class="ph-muted">Derecho ' + _phEsc(balance ? balance.exercise : '') + ': ' + _phEsc(balance ? balance.entitlement : '[NO DATA]')
    + ' · Saldo: ' + _phEsc(balance ? balance.value : '[NO DATA]') + ' · Pendiente anterior: ' + _phEsc(balance ? balance.previous_value : '[NO DATA]') + '</div></td>' + cells + '</tr>';
}

function _phTime(value){
  if(!value) return '';
  var date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0,5) : date.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'});
}

function _phChangeDepartment(value){ _ph.department = value; _ph.data = null; _phLoad(true); }
function _phChangeWeek(value){ _ph.weekStart = _phMonday(value); _ph.data = null; _phLoad(false); }
function _phMoveWeek(days){ _ph.weekStart = _phAddDays(_ph.weekStart, days); _ph.data = null; _phLoad(false); }
window._phChangeDepartment = _phChangeDepartment;
window._phChangeWeek = _phChangeWeek;
window._phMoveWeek = _phMoveWeek;

function _phShiftOptions(selected){
  return '<option value="">— Sin tramo —</option>' + (_ph.data.catalog || []).filter(function(shift){ return shift.activo; }).map(function(shift){
    var value = String(shift.id);
    var label = (shift.nombre || ('Turno ' + shift.bitrix_shift_id)) + ' · ' + String(shift.inicio || '').slice(0,5) + '–' + String(shift.fin || '').slice(0,5);
    return '<option value="' + _phEsc(value) + '"' + (String(selected || '') === value ? ' selected' : '') + '>' + _phEsc(label) + '</option>';
  }).join('');
}

function _phOpenCell(employeeId, date){
  var employee = (_ph.data.employees || []).find(function(item){ return String(item.id) === String(employeeId); });
  var assignment = _phAssignment(employeeId, date);
  var selectedIds = (assignment && assignment.tramos || []).map(function(segment){
    var found = (_ph.data.catalog || []).find(function(shift){
      return String(shift.bitrix_shift_id) === String(segment.bitrix_shift_id);
    });
    return found ? found.id : '';
  });
  _ph.modalEmployee = employeeId; _ph.modalDate = date;
  var card = document.getElementById('ph-modal-card');
  card.innerHTML = '<div class="ph-modal-title">' + _phEsc(employee ? employee.nombre : employeeId) + ' · ' + _phEsc(date) + '</div>'
    + '<div class="fg"><label>Tipo de día</label><select id="ph-day-type" onchange="_phToggleShiftFields()">'
    + ['turno','descanso','festivo','ausencia','vacaciones'].map(function(type){ return '<option value="' + type + '"' + (assignment && assignment.tipo_dia === type ? ' selected' : '') + '>' + type + '</option>'; }).join('')
    + '</select></div><div id="ph-shift-fields" class="ph-grid2" style="margin-top:12px">'
    + '<div class="fg"><label>Primer tramo oficial</label><select id="ph-shift-1">' + _phShiftOptions(selectedIds[0]) + '</select></div>'
    + '<div class="fg"><label>Segundo tramo (opcional)</label><select id="ph-shift-2">' + _phShiftOptions(selectedIds[1]) + '</select></div></div>'
    + '<div class="ph-modal-footer">' + (assignment ? '<button class="btn" onclick="_phDeleteCell()">Quitar</button>' : '')
    + '<button class="btn" onclick="_phCloseModal()">Cancelar</button><button class="btn btn-primary" onclick="_phApplyCell()">Aplicar</button></div>';
  document.getElementById('ph-modal').classList.add('open');
  _phToggleShiftFields();
}
window._phOpenCell = _phOpenCell;

function _phToggleShiftFields(){
  var type = document.getElementById('ph-day-type');
  var fields = document.getElementById('ph-shift-fields');
  if(fields) fields.style.display = type && type.value === 'turno' ? 'grid' : 'none';
}
window._phToggleShiftFields = _phToggleShiftFields;

function _phMadridDate(date, time){
  var dateParts = date.split('-').map(Number);
  var timeParts = String(time).slice(0,8).split(':').map(Number);
  var guess = Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2] || 0);
  var formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/Madrid', year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(guess));
  var value = function(type){ return Number(formatted.find(function(part){ return part.type === type; }).value); };
  var represented = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
  return new Date(guess - (represented - guess));
}

function _phSegmentFromShift(shift, date, order){
  var startTime = String(shift.inicio).slice(0,8);
  var endTime = String(shift.fin).slice(0,8);
  var endDate = (shift.cruza_medianoche || endTime <= startTime) ? _phAddDays(date, 1) : date;
  var start = _phMadridDate(date, startTime);
  var end = _phMadridDate(endDate, endTime);
  return {orden:order, inicio:start.toISOString(), fin:end.toISOString(), bitrix_shift_id:String(shift.bitrix_shift_id)};
}

function _phApplyCell(){
  var type = document.getElementById('ph-day-type').value;
  var shiftIds = [document.getElementById('ph-shift-1').value, document.getElementById('ph-shift-2').value].filter(Boolean);
  if(type === 'turno' && !shiftIds.length){ toast('Selecciona al menos un turno oficial','err'); return; }
  var shifts = shiftIds.map(function(id){ return (_ph.data.catalog || []).find(function(item){ return String(item.id) === String(id); }); }).filter(Boolean);
  var segments = shifts.map(function(shift, index){ return _phSegmentFromShift(shift, _ph.modalDate, index + 1); });
  var minutes = segments.reduce(function(total, segment){ return total + Math.round((new Date(segment.fin) - new Date(segment.inicio)) / 60000); }, 0);
  var assignment = {
    empleado_id:_ph.modalEmployee, fecha_operativa:_ph.modalDate, tipo_dia:type,
    turno_catalogo_id:type === 'turno' ? Number(shifts[0].id) : null,
    descanso_minutos:type === 'turno' ? Number(shifts[0].descanso_minutos || 0) : 0,
    minutos_planificados:type === 'turno' ? minutes : 0, tramos:type === 'turno' ? segments : []
  };
  var index = _ph.assignments.findIndex(function(item){ return String(item.empleado_id) === String(_ph.modalEmployee) && item.fecha_operativa === _ph.modalDate; });
  if(index >= 0) _ph.assignments[index] = assignment; else _ph.assignments.push(assignment);
  _phCloseModal(); _phRender();
}
window._phApplyCell = _phApplyCell;

function _phDeleteCell(){
  _ph.assignments = _ph.assignments.filter(function(item){ return !(String(item.empleado_id) === String(_ph.modalEmployee) && item.fecha_operativa === _ph.modalDate); });
  _phCloseModal(); _phRender();
}
window._phDeleteCell = _phDeleteCell;

function _phCloseModal(){ var modal = document.getElementById('ph-modal'); if(modal) modal.classList.remove('open'); }
window._phCloseModal = _phCloseModal;

async function _phRefreshCatalog(silent){
  if(!_ph.data || !_ph.data.permissions.canEdit) return;
  try{
    await _phApi('/api/planning/catalog', {method:'POST', body:{department:_ph.department}});
    if(!silent) toast('Catálogo Bitrix24 actualizado','ok');
    await _phLoad(false);
  }catch(error){
    if(!silent) toast('No se pudo actualizar: ' + error.message,'err');
  }
}
window._phRefreshCatalog = _phRefreshCatalog;

async function _phSaveWeek(){
  try{
    var expected = _ph.data.week ? Number(_ph.data.week.version_actual) : 0;
    await _phApi('/api/planning/week', {method:'PUT', body:{
      department:_ph.department, week_start:_ph.weekStart, expected_version:expected,
      type:'borrador', assignments:_ph.assignments
    }});
    toast('Borrador guardado con nueva versión','ok');
    await _phLoad(false);
  }catch(error){
    var details = error.payload && error.payload.validation && error.payload.validation.errors;
    toast('No guardado: ' + (details && details[0] ? details[0].code : error.message),'err');
  }
}
window._phSaveWeek = _phSaveWeek;

async function _phPublishWeek(){
  try{
    await _phRefreshCatalog(true);
    await _phApi('/api/planning/publish', {method:'POST', body:{
      week_id:_ph.data.week.id, expected_version:_ph.data.week.version_actual
    }});
  }catch(error){
    if(error.message === 'BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO'){
      toast('Publicación bloqueada de forma segura: API oficial no disponible','warn');
    }else toast('Comprobación fallida: ' + error.message,'err');
  }
}
window._phPublishWeek = _phPublishWeek;

function _phEmployeeOptions(){
  return (_ph.data.employees || []).map(function(employee){
    return '<option value="' + _phEsc(employee.id) + '">' + _phEsc(employee.nombre) + '</option>';
  }).join('');
}

function _phOpenOperation(kind){
  var card = document.getElementById('ph-modal-card');
  var employees = _phEmployeeOptions();
  if(kind === 'absence'){
    card.innerHTML = '<div class="ph-modal-title">Registrar ausencia</div><div class="ph-grid2">'
      + '<div class="fg"><label>Rectificar registro existente (opcional)</label><select id="ph-op-previous" onchange="_phSelectAbsence(this.value)"><option value="">— Registro nuevo —</option>'
      + (_ph.data.absences || []).map(function(item){ return '<option value="' + _phEsc(item.id) + '">' + _phEsc((item.etiqueta_publica || 'Ausencia') + ' · ' + item.fecha_inicio + '–' + item.fecha_fin) + '</option>'; }).join('') + '</select></div>'
      + '<div class="fg"><label>Empleado</label><select id="ph-op-employee">' + employees + '</select></div>'
      + '<div class="fg"><label>Tipo</label><input id="ph-op-type" maxlength="80" placeholder="baja, permiso…"></div>'
      + '<div class="fg"><label>Desde</label><input id="ph-op-start" type="date" value="' + _ph.weekStart + '"></div>'
      + '<div class="fg"><label>Hasta</label><input id="ph-op-end" type="date" value="' + _ph.weekStart + '"></div>'
      + '<div class="fg"><label>Etiqueta pública</label><input id="ph-op-label" maxlength="120" placeholder="Ausencia"></div>'
      + '<div class="fg"><label>Motivo de registro</label><input id="ph-op-reason" maxlength="1000"></div></div>'
      + _phOperationFooter(kind);
  }else if(kind === 'extra'){
    card.innerHTML = '<div class="ph-modal-title">Extra / recuperación</div><div class="ph-grid2">'
      + '<div class="fg"><label>Empleado</label><select id="ph-op-employee">' + employees + '</select></div>'
      + '<div class="fg"><label>Tipo</label><select id="ph-op-type"><option value="extra">Extra</option><option value="recuperacion">Recuperación</option></select></div>'
      + '<div class="fg"><label>Fecha</label><input id="ph-op-date" type="date" value="' + _ph.weekStart + '"></div>'
      + '<div class="fg"><label>Minutos</label><input id="ph-op-minutes" type="number" min="1" max="1440"></div>'
      + '<div class="fg"><label>Motivo</label><input id="ph-op-reason" maxlength="1000"></div>'
      + '<div class="fg"><label><input id="ph-op-approve" type="checkbox"> Aprobar ahora</label></div></div>'
      + '<div class="ph-alert warn">No se permite autoasignación ni autoaprobación. Los jefes solo pueden ser gestionados por la persona autorizada mediante ID estable.</div>' + _phOperationFooter(kind);
  }else{
    var conventions = (_ph.data.conventionVersions || []).map(function(item){
      return '<option value="' + _phEsc(item.id) + '">' + _phEsc(item.convenio_id + ' · ' + item.version) + '</option>';
    }).join('');
    card.innerHTML = '<div class="ph-modal-title">Condición laboral vigente</div><div class="ph-grid2">'
      + '<div class="fg"><label>Empleado</label><select id="ph-op-employee">' + employees + '</select></div>'
      + '<div class="fg"><label>Convenio</label><select id="ph-op-convention">' + conventions + '</select></div>'
      + '<div class="fg"><label>Vigente desde</label><input id="ph-op-effective" type="date" value="' + _ph.weekStart + '"></div>'
      + '<div class="fg"><label>Inicio contrato</label><input id="ph-op-contract" type="date"></div>'
      + '<div class="fg"><label>% jornada</label><input id="ph-op-percentage" type="number" min="0.001" max="100" step="0.001" value="100"></div>'
      + '<div class="fg"><label>Minutos semanales (opcional)</label><input id="ph-op-weekly" type="number" min="1"></div>'
      + '<div class="fg"><label>Minutos anuales (opcional)</label><input id="ph-op-annual" type="number" min="1"></div>'
      + '<div class="fg"><label>Motivo del cambio</label><input id="ph-op-reason" maxlength="1000"></div></div>'
      + '<div class="ph-alert warn">La antigüedad y el prorrateo se calculan desde la fecha real de inicio de contrato, no desde la activación en Bitrix24.</div>' + _phOperationFooter(kind);
  }
  document.getElementById('ph-modal').classList.add('open');
}
window._phOpenOperation = _phOpenOperation;

function _phSelectAbsence(id){
  var item = (_ph.data.absences || []).find(function(absence){ return String(absence.id) === String(id); });
  if(!item) return;
  document.getElementById('ph-op-employee').value = item.empleado_id;
  document.getElementById('ph-op-type').value = item.tipo_ausencia_id || '';
  document.getElementById('ph-op-start').value = item.fecha_inicio;
  document.getElementById('ph-op-end').value = item.fecha_fin;
  document.getElementById('ph-op-label').value = item.etiqueta_publica || '';
}
window._phSelectAbsence = _phSelectAbsence;

function _phOperationFooter(kind){
  return '<div class="ph-modal-footer"><button class="btn" onclick="_phCloseModal()">Cancelar</button><button class="btn btn-primary" onclick="_phSaveOperation(\'' + kind + '\')">Guardar</button></div>';
}

function _phValue(id){ var element = document.getElementById(id); return element ? element.value : ''; }

async function _phSaveOperation(kind){
  try{
    var path, body;
    if(kind === 'absence'){
      path = '/api/planning/absence'; body = {employee_id:_phValue('ph-op-employee'), start_date:_phValue('ph-op-start'), end_date:_phValue('ph-op-end'), absence_type:_phValue('ph-op-type'), public_label:_phValue('ph-op-label'), reason:_phValue('ph-op-reason'), previous_id:_phValue('ph-op-previous') || null};
    }else if(kind === 'extra'){
      path = '/api/planning/extra-recovery'; body = {employee_id:_phValue('ph-op-employee'), date:_phValue('ph-op-date'), type:_phValue('ph-op-type'), minutes:Number(_phValue('ph-op-minutes')), reason:_phValue('ph-op-reason'), approve:!!document.getElementById('ph-op-approve').checked};
    }else{
      path = '/api/planning/labor-condition'; body = {employee_id:_phValue('ph-op-employee'), convention_version_id:_phValue('ph-op-convention'), effective_from:_phValue('ph-op-effective'), contract_start:_phValue('ph-op-contract'), work_percentage:Number(_phValue('ph-op-percentage')), weekly_minutes:_phValue('ph-op-weekly') || null, annual_minutes:_phValue('ph-op-annual') || null, reason:_phValue('ph-op-reason')};
    }
    await _phApi(path, {method:'POST', body:body});
    _phCloseModal(); toast('Registro guardado con trazabilidad','ok'); await _phLoad(false);
  }catch(error){ toast('No guardado: ' + error.message,'err'); }
}
window._phSaveOperation = _phSaveOperation;
