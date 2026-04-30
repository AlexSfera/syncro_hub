// ═══════════════════════════════════════════════════════════════
// DASHBOARD — Plataforma BDS SYNCROSFERA
// Reemplaza renderDashboard() del index.html
// Depende de: shared.js, checklist.js, sala.js, caja.js, recepcion.js
// ═══════════════════════════════════════════════════════════════

// ── CONFIG DEPARTAMENTOS ──────────────────────────────────────
var DASH_DEPTS = [
  { id: 'Cocina',              label: 'Cocina',              activo: true,  icono: '🍳', color: '#f59e0b' },
  { id: 'Sala',                label: 'Sala',                activo: true,  icono: '🍽️', color: '#3b82f6' },
  { id: 'FnB',                 label: 'Restaurante / F&B',   activo: true,  icono: '🏪', color: '#10b981', consolidado: true },
  { id: 'Recepción',           label: 'Recepción Hotel',     activo: true,  icono: '🏨', color: '#8b5cf6' },
  { id: 'RecepcionSyncrolab',  label: 'Recepción SYNCROLAB', activo: false, icono: '🏋️', color: '#2ec4b6' },
  { id: 'Entrenadores',        label: 'Entrenadores',        activo: false, icono: '💪', color: '#06b6d4' },
  { id: 'Fisioterapeutas',     label: 'Fisioterapeutas',     activo: false, icono: '🩺', color: '#84cc16' },
  { id: 'Housekeeping',        label: 'Housekeeping',        activo: false, icono: '🛏️', color: '#a78bfa' },
  { id: 'Mantenimiento',       label: 'Mantenimiento',       activo: false, icono: '🔧', color: '#f97316' },
  { id: 'Economato',           label: 'Economato',           activo: false, icono: '📦', color: '#94a3b8' },
  { id: 'RRHH',                label: 'Recursos Humanos',    activo: false, icono: '👥', color: '#ec4899' },
];

// ── PERMISOS POR ROL ─────────────────────────────────────────
function getDashDeptsForUser() {
  if (!currentUser) return [];
  var rol = currentUser.rol;
  var area = currentUser.area;
  if (rol === 'admin') return DASH_DEPTS;
  if (rol === 'fb') return DASH_DEPTS.filter(function(d) {
    return ['Cocina','Sala','FnB'].indexOf(d.id) !== -1;
  });
  if (rol === 'jefe_recepcion') return DASH_DEPTS.filter(function(d) {
    return d.id === 'Recepción';
  });
  // Responsable departamento — solo su área
  return DASH_DEPTS.filter(function(d) { return d.id === area; });
}

// ── HELPERS LOCALES ───────────────────────────────────────────
function _isFio(s) {
  return s.fio === true || s.fio === 1 || s.fio === 'true' || s.fio === '1';
}
function _tareaActiva(t) {
  return t.estado === 'Pendiente' || t.estado === 'En proceso';
}

// ── ESTADO ACTUAL DEL DASHBOARD ──────────────────────────────
var _dashCurrentDept = null;
var _dashCurrentTab = 'turnos';

function _activateDashTab(tabId) {
  _dashCurrentTab = tabId;
  document.querySelectorAll('.dash-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.dash-panel').forEach(function(panel) {
    panel.classList.toggle('active', panel.id === 'tab-panel-' + tabId);
  });
}

// ── SKELETON LOADER ───────────────────────────────────────────
function _showDashSkeleton() {
  var kpiEl = document.getElementById('kpi-grid');
  if (kpiEl) {
    kpiEl.innerHTML = [1,2,3,4,5].map(function() {
      return '<div class="kpi"><div class="skel skel-kpi"></div></div>';
    }).join('');
  }
  var espEl = document.getElementById('dash-kpi-especifico');
  if (espEl) espEl.innerHTML = '<div class="skel skel-card"></div>';
  var empEl = document.getElementById('dash-emp-table');
  if (empEl) empEl.innerHTML = [1,2,3].map(function() {
    return '<div class="skel skel-row"></div>';
  }).join('');
  var alertEl = document.getElementById('dash-alertas');
  if (alertEl) alertEl.innerHTML = '<div class="skel skel-row"></div>'
    + '<div class="skel skel-row" style="width:70%;margin-top:8px"></div>';
}

// ── RENDERIZADO PRINCIPAL ─────────────────────────────────────
async function renderDashboard() {
  // Determinar qué departamento mostrar
  var deptSel = document.getElementById('dash-dept');
  var depts = getDashDeptsForUser();

  // Si no hay selector o está vacío, usar el primero disponible
  if (!_dashCurrentDept) {
    _dashCurrentDept = depts.length ? depts[0].id : 'Cocina';
  }
  if (deptSel && deptSel.value) {
    _dashCurrentDept = deptSel.value;
  }
  // Asegurar que _dashCurrentDept es válido
  if (!_dashCurrentDept || _dashCurrentDept === '') {
    _dashCurrentDept = 'Cocina';
  }

  var deptCfg = DASH_DEPTS.find(function(d) { return d.id === _dashCurrentDept; }) || DASH_DEPTS[0];

  // Topbar dept accent
  document.documentElement.style.setProperty('--topbar-accent-color', deptCfg.color);

  // Actualizar selector si existe
  if (deptSel) {
    _buildDeptSelector(depts, deptSel);
    deptSel.value = _dashCurrentDept;
  }

  // Título del dashboard
  var sub = document.getElementById('dash-sub');
  if (sub) {
    var icon = deptCfg.icono;
    var label = deptCfg.consolidado ? label = '🏪 Restaurante / F&B — vista consolidada' : icon + ' ' + deptCfg.label;
    sub.textContent = label;
  }

  // Si el departamento no está activo — mostrar placeholder
  if (!deptCfg.activo) {
    _renderPlaceholder(deptCfg);
    return;
  }

  // Cargar datos según periodo
  var periodo = (document.getElementById('dash-periodo') || {}).value || 'semana';
  var empFilt = (document.getElementById('dash-emp') || {}).value || '';
  var sevFilt = (document.getElementById('dash-sev') || {}).value || '';

  var desde = null;
  if (periodo === 'hoy') desde = today();
  if (periodo === 'semana') desde = startOfWeek();
  if (periodo === 'mes') desde = startOfMonth();

  // Mostrar skeleton mientras cargan los datos
  _showDashSkeleton();

  // Cargar datos
  var allShifts = await getDB('shifts');
  var allMermas = await getDB('merma');
  var allIncis = await getDB('incidencias');
  var allTareas = await getDB('tareas');

  // Mapa rápido shift_id → area para fallback de incidencias sin area guardada
  var _shiftAreaMap = {};
  allShifts.forEach(function(s) { if(s.id) _shiftAreaMap[s.id] = (s.area || '').trim(); });

  // Filtrar por departamento
  function _inArea(val, depts) { return depts.indexOf((val||'').trim()) !== -1; }

  function inciMatchDept(i, depts) {
    // Datos nuevos: campo area/departamento correcto
    var d = (i.area || i.departamento || '').trim();
    if (d) return depts.indexOf(d) !== -1;
    // Fallback histórico: buscar por shift_id
    if (i.shift_id) return depts.indexOf(_shiftAreaMap[i.shift_id] || '') !== -1;
    return false;
  }
  function mermaMatchDept(m, depts) {
    var d = (m.area || m.departamento || '').trim();
    return !d || depts.indexOf(d) !== -1;
  }
  function tareaMatchDept(t, depts) {
    return _inArea(t.dept_destino, depts) || _inArea(t.dept_origen, depts);
  }

  var shifts, mermas, incis, tareas;
  if (_dashCurrentDept === 'FnB') {
    var fnbDepts = ['Cocina', 'Sala', 'Friegue'];
    shifts = allShifts.filter(function(s) { return _inArea(s.area, fnbDepts); });
    mermas = allMermas.filter(function(m) { return mermaMatchDept(m, ['Cocina', 'Friegue']); });
    incis  = allIncis.filter(function(i)  { return inciMatchDept(i, fnbDepts); });
    tareas = allTareas.filter(function(t) { return tareaMatchDept(t, fnbDepts); });
  } else {
    var deptArea = _dashCurrentDept;
    var areaMap = {
      'Cocina': ['Cocina'],
      'Sala': ['Sala'],
      'Recepcion': ['Recepción'],
      'Recepción': ['Recepción'],
      'RecepcionSyncrolab': ['Recepción SYNCROLAB', 'SYNCROLAB'],
      'Entrenadores': ['Entrenadores'],
      'Fisioterapeutas': ['Fisioterapeutas'],
      'Housekeeping': ['Housekeeping'],
      'Mantenimiento': ['Mantenimiento'],
      'Economato': ['Economato'],
      'RRHH': ['RRHH', 'Recursos Humanos']
    };
    var validAreas = areaMap[deptArea] || [deptArea];
    shifts = allShifts.filter(function(s) { return _inArea(s.area, validAreas); });
    mermas = allMermas.filter(function(m) { return mermaMatchDept(m, validAreas); });
    incis  = allIncis.filter(function(i)  { return inciMatchDept(i, validAreas); });
    tareas = allTareas.filter(function(t) { return tareaMatchDept(t, validAreas); });
  }

  // Filtrar por periodo
  if (desde) {
    shifts = shifts.filter(function(s) { return s.fecha >= desde; });
    mermas = mermas.filter(function(m) { return m.fecha >= desde; });
    incis = incis.filter(function(i) { return i.fecha >= desde; });
  }
  if (empFilt) shifts = shifts.filter(function(s) { return s.nombre === empFilt; });
  if (sevFilt) shifts = shifts.filter(function(s) { return s.gravedad_error === sevFilt; });

  // Poblar selector de empleados
  _populateDashEmpDropdown(allShifts, _dashCurrentDept);

  // Renderizar secciones
  _renderKpiCards(shifts, mermas, incis, tareas, deptCfg);
  _renderActividadEmpleado(shifts, allShifts);
  _renderAlertas(shifts, mermas, incis, tareas);
  _renderIncidencias(incis);
  _renderMerma(mermas);
  _renderTareas(tareas);
  _renderFIO(shifts);
  renderCostTable();

  // Sincronizar filtro de tipos de incidencia
  _syncInciTiposFilter();

  // Bloque específico por departamento
  if (_dashCurrentDept === 'Cocina') _renderKpiCocina(shifts, mermas);
  else if (_dashCurrentDept === 'Sala') _renderKpiSala(shifts);
  else if (_dashCurrentDept === 'FnB') _renderKpiFnB(allShifts, allMermas, allIncis, desde);
  else if (_dashCurrentDept === 'Recepción') _renderKpiRecepcion(shifts);

  // Mostrar/ocultar sección merma
  var secMerma = document.getElementById('dash-sec-merma');
  if (secMerma) {
    secMerma.style.display = (_dashCurrentDept === 'Cocina' || _dashCurrentDept === 'FnB') ? 'block' : 'none';
  }

  // Restaurar pestaña activa tras el render
  _activateDashTab(_dashCurrentTab);
}

// ── SELECTOR DE DEPARTAMENTO ──────────────────────────────────
function _buildDeptSelector(depts, el) {
  if (el._built && el.options.length > 1) return;
  el._built = true;
  el.innerHTML = '';
  depts.forEach(function(d) {
    var opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = (d.consolidado ? '🏪 ' : d.icono + ' ') + d.label + (d.activo ? '' : ' — Próximamente');
    el.appendChild(opt);
  });
}

// ── KPI CARDS PRINCIPALES ─────────────────────────────────────
function _renderKpiCards(shifts, mermas, incis, tareas, deptCfg) {
  var el = document.getElementById('kpi-grid');
  if (!el) return;

  var totalTurnos = shifts.length;
  var valTurnos = shifts.filter(function(s) { return s.estado === 'Validado' || s.estado === 'Validado con FIO'; }).length;
  var pendTurnos = shifts.filter(function(s) { return s.estado === 'Pendiente'; }).length;
  var totalHoras = shifts.reduce(function(a, s) { return a + (parseFloat(s.horas) || 0); }, 0);
  var employees = shifts.reduce(function(acc, s) { acc[s.employee_id || s.nombre] = (parseFloat(s.horas) || 0); return acc; }, {});
  var costePersonal = 0; // calculado en renderCostTable

  var inciTotal = incis.length;
  var inciAbiertas = incis.filter(function(i) { return i.estado === 'Abierta'; }).length;
  var inciCriticas = incis.filter(function(i) { return i.severidad === 'Crítica' && i.estado === 'Abierta'; }).length;

  var fioTotal = shifts.filter(function(s) { return _isFio(s); }).length;
  var fioCrit  = shifts.filter(function(s) { return _isFio(s) && (s.gravedad_error === 'Alta' || s.gravedad_error === 'Crítica'); }).length;
  var fioPend  = shifts.filter(function(s) { return _isFio(s) && !s.validado_por; }).length;

  var tareasPend = tareas.filter(_tareaActiva).length;
  var tareasVenc = tareas.filter(function(t) { return isOverdue(t.deadline) && t.estado !== 'Verificada' && t.estado !== 'Completada'; }).length;

  var costeMerma = mermas.reduce(function(a, m) { return a + (m.coste_total || 0); }, 0);

  var html = '';
  html += '<div class="kpi k-amber"><div class="kpi-lbl">Turnos</div><div class="kpi-val">' + totalTurnos + '</div><div class="kpi-sub">' + valTurnos + ' validados · ' + pendTurnos + ' pendientes</div></div>';
  html += '<div class="kpi k-green"><div class="kpi-lbl">Horas</div><div class="kpi-val">' + totalHoras.toFixed(1) + 'h</div><div class="kpi-sub">Prom. ' + (totalTurnos ? (totalHoras / totalTurnos).toFixed(1) : 0) + 'h/turno</div></div>';
  html += '<div class="kpi k-red"><div class="kpi-lbl">Incidencias</div><div class="kpi-val">' + inciAbiertas + '</div><div class="kpi-sub">' + inciTotal + ' total · ' + inciCriticas + ' críticas</div></div>';
  html += '<div class="kpi k-red"><div class="kpi-lbl">FIO total</div><div class="kpi-val">' + fioTotal + '</div><div class="kpi-sub">' + fioCrit + ' alta/crítica · ' + fioPend + ' pendientes</div></div>';
  html += '<div class="kpi k-purple"><div class="kpi-lbl">Tareas pend.</div><div class="kpi-val">' + tareasPend + '</div><div class="kpi-sub">' + (tareasVenc > 0 ? '<span style="color:var(--red)">' + tareasVenc + ' vencidas</span>' : 'Sin vencer') + '</div></div>';

  // Card específica por departamento
  if (deptCfg.id === 'Cocina' || deptCfg.id === 'FnB') {
    html += '<div class="kpi k-orange"><div class="kpi-lbl">Coste merma</div><div class="kpi-val">' + costeMerma.toFixed(0) + '€</div><div class="kpi-sub">' + mermas.length + ' líneas</div></div>';
  }

  el.innerHTML = html;
}

// ── ACTIVIDAD POR EMPLEADO ────────────────────────────────────
function _renderActividadEmpleado(shifts, allShifts) {
  var el = document.getElementById('dash-emp-table');
  if (!el) return;

  var eMap = {};
  shifts.forEach(function(s) {
    var key = s.nombre;
    if (!eMap[key]) eMap[key] = { nombre: s.nombre, puesto: s.puesto || '—', turnos: 0, horas: 0, incis: 0, fio: 0, tareas: 0 };
    eMap[key].turnos++;
    eMap[key].horas += parseFloat(s.horas) || 0;
    if (s.incidencia_declarada === 'si') eMap[key].incis++;
    if (_isFio(s)) eMap[key].fio++;
  });

  var rows = Object.values(eMap).sort(function(a, b) { return b.horas - a.horas; });

  if (!rows.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">👥</div><div class="empty-text">Sin actividad en el periodo</div></div>';
    return;
  }

  el.innerHTML = '<table>'
    + '<tr><th>Empleado</th><th>Turnos</th><th>Horas</th><th>Incid.</th><th>FIO</th></tr>'
    + rows.map(function(e) {
      return '<tr>'
        + '<td><div style="font-weight:600">' + e.nombre + '</div><div style="font-size:11px;color:var(--text3)">' + e.puesto + '</div></td>'
        + '<td style="font-family:var(--font-mono);text-align:center">' + e.turnos + '</td>'
        + '<td style="font-family:var(--font-mono);text-align:center">' + e.horas.toFixed(1) + 'h</td>'
        + '<td style="text-align:center">' + (e.incis > 0 ? '<span class="badge b-red">' + e.incis + '</span>' : '—') + '</td>'
        + '<td style="text-align:center">' + (e.fio > 0 ? '<span class="badge b-red">' + e.fio + '</span>' : '—') + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

// ── ALERTAS ACTIVAS ───────────────────────────────────────────
function _renderAlertas(shifts, mermas, incis, tareas) {
  var el = document.getElementById('dash-alertas');
  if (!el) return;

  var msgs = [];

  var pendH = shifts.filter(function(s) { return s.estado === 'Pendiente'; }).length;
  if (pendH > 0) msgs.push({ t: 'warn', m: pendH + ' turno(s) pendiente(s) de validación' });

  var inciCrit = incis.filter(function(i) { return i.severidad === 'Crítica' && i.estado === 'Abierta'; });
  if (inciCrit.length) msgs.push({ t: 'err', m: '⛔ ' + inciCrit.length + ' incidencia(s) CRÍTICA(s) sin cerrar' });

  var fioPend = shifts.filter(function(s) { return _isFio(s) && !s.validado_por; }).length;
  if (fioPend > 0) msgs.push({ t: 'err', m: fioPend + ' FIO pendiente(s) de validación' });

  var tareasVenc = tareas.filter(function(t) { return isOverdue(t.deadline) && t.estado !== 'Verificada'; }).length;
  if (tareasVenc > 0) msgs.push({ t: 'err', m: tareasVenc + ' tarea(s) vencida(s) sin cerrar' });

  var sinCoste = mermas.filter(function(m) { return !m.coste_unitario || m.coste_unitario === 0; }).length;
  if (sinCoste > 0) msgs.push({ t: 'warn', m: sinCoste + ' línea(s) de merma sin coste asignado' });

  // Comprobar turnos hace más de 24h sin validar
  var ahora = new Date();
  var turnos24h = shifts.filter(function(s) {
    if (s.estado !== 'Pendiente') return false;
    var ts = new Date(s.created_at || s.fecha);
    return (ahora - ts) > 86400000;
  }).length;
  if (turnos24h > 0) msgs.push({ t: 'warn', m: turnos24h + ' follow-up(s) sin validar más de 24h' });

  if (!msgs.length) msgs.push({ t: 'ok', m: '✓ Sin alertas activas en el periodo' });

  el.innerHTML = msgs.map(function(x) {
    return '<div class="alert a-' + (x.t === 'ok' ? 'ok' : x.t === 'err' ? 'err' : 'warn') + '">' + x.m + '</div>';
  }).join('');
}

// ── INCIDENCIAS DETALLE ───────────────────────────────────────
function _renderIncidencias(incis) {
  var el = document.getElementById('dash-inci-table');
  if (!el) return;

  var diCat = (document.getElementById('di-cat') || {}).value || '';
  var diSev = (document.getElementById('di-sev') || {}).value || '';
  var diEstado = (document.getElementById('di-estado') || {}).value || '';

  var filtered = incis.slice();
  if (diCat) filtered = filtered.filter(function(i) { return i.categoria === diCat; });
  if (diSev) filtered = filtered.filter(function(i) { return i.severidad === diSev; });
  if (diEstado) filtered = filtered.filter(function(i) { return i.estado === diEstado; });

  // KPI incidencias
  var kpiEl = document.getElementById('kpi-incis');
  if (kpiEl) {
    var iAb = filtered.filter(function(i) { return i.estado === 'Abierta'; }).length;
    var iCrit = filtered.filter(function(i) { return i.severidad === 'Crítica'; }).length;
    kpiEl.innerHTML = '<div class="kpi k-red"><div class="kpi-lbl">Total</div><div class="kpi-val">' + filtered.length + '</div></div>'
      + '<div class="kpi k-red"><div class="kpi-lbl">Abiertas</div><div class="kpi-val">' + iAb + '</div></div>'
      + '<div class="kpi k-red"><div class="kpi-lbl">Críticas</div><div class="kpi-val">' + iCrit + '</div></div>';
  }

  if (!filtered.length) {
    el.innerHTML = '<div class="empty"><div class="empty-text">Sin incidencias en el periodo</div></div>';
    return;
  }

  filtered.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); });

  el.innerHTML = '<table>'
    + '<tr><th>Fecha</th><th>Categoría</th><th>Severidad</th><th>Descripción</th><th>Estado</th><th>Empleado</th></tr>'
    + filtered.map(function(i) {
      var sevColor = i.severidad === 'Crítica' ? 'b-red' : i.severidad === 'Alta' ? 'b-orange' : i.severidad === 'Media' ? 'b-yellow' : 'b-gray';
      var estColor = i.estado === 'Abierta' ? 'b-red' : i.estado === 'Gestionada' ? 'b-blue' : 'b-green';
      return '<tr>'
        + '<td style="font-family:var(--font-mono);font-size:11px">' + fmtDate(i.fecha) + '</td>'
        + '<td>' + (i.categoria || '—') + '</td>'
        + '<td><span class="badge ' + sevColor + '">' + (i.severidad || '—') + '</span></td>'
        + '<td style="max-width:200px;font-size:12px">' + (i.descripcion || '—') + '</td>'
        + '<td><span class="badge ' + estColor + '">' + (i.estado || '—') + '</span></td>'
        + '<td style="font-size:12px">' + (i.nombre || i.empleado || '—') + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

// ── TAREAS POR DEPARTAMENTO ───────────────────────────────────
function _renderTareas(tareas) {
  var el = document.getElementById('dash-tasks-table');
  if (!el) return;

  var pend = tareas.filter(function(t) { return t.estado === 'Pendiente'; });
  var enProc = tareas.filter(function(t) { return t.estado === 'En proceso'; });
  var comp = tareas.filter(function(t) { return t.estado === 'Completada'; });
  var venc = tareas.filter(function(t) { return isOverdue(t.deadline) && t.estado !== 'Verificada'; });

  // Grid resumen
  var gridEl = document.getElementById('dept-task-grid');
  if (gridEl) {
    gridEl.innerHTML = '<div class="kpi k-amber"><div class="kpi-lbl">Pendientes</div><div class="kpi-val">' + pend.length + '</div></div>'
      + '<div class="kpi k-blue"><div class="kpi-lbl">En proceso</div><div class="kpi-val">' + enProc.length + '</div></div>'
      + '<div class="kpi k-green"><div class="kpi-lbl">Completadas</div><div class="kpi-val">' + comp.length + '</div></div>'
      + '<div class="kpi k-red"><div class="kpi-lbl">Vencidas</div><div class="kpi-val">' + venc.length + '</div></div>';
  }

  var abiertas = tareas.filter(function(t) { return t.estado !== 'Verificada' && t.estado !== 'Completada'; });
  abiertas.sort(function(a, b) {
    if (isOverdue(a.deadline) && !isOverdue(b.deadline)) return -1;
    if (!isOverdue(a.deadline) && isOverdue(b.deadline)) return 1;
    return (a.deadline || '').localeCompare(b.deadline || '');
  });

  if (!abiertas.length) {
    el.innerHTML = '<div class="empty"><div class="empty-text">Sin tareas abiertas</div></div>';
    return;
  }

  el.innerHTML = '<table>'
    + '<tr><th>Prioridad</th><th>Descripción</th><th>Destino</th><th>Responsable</th><th>Deadline</th><th>Estado</th></tr>'
    + abiertas.map(function(t) {
      var vencida = isOverdue(t.deadline);
      var prioColor = t.prioridad === 'Alta' ? 'b-red' : t.prioridad === 'Media' ? 'b-yellow' : 'b-gray';
      return '<tr style="' + (vencida ? 'background:rgba(239,68,68,.05)' : '') + '">'
        + '<td><span class="badge ' + prioColor + '">' + (t.prioridad || '—') + '</span></td>'
        + '<td style="font-size:12px;max-width:200px">' + (t.descripcion || '—') + '</td>'
        + '<td>' + deptBadge(t.dept_destino) + '</td>'
        + '<td style="font-size:12px">' + (t.responsable_nombre || '—') + '</td>'
        + '<td style="font-family:var(--font-mono);font-size:11px;color:' + (vencida ? 'var(--red)' : 'var(--text)') + '">' + fmtDate(t.deadline) + (vencida ? ' ⚠' : '') + '</td>'
        + '<td>' + bTaskEstado(t.estado) + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

// ── FIO DEL PERIODO ───────────────────────────────────────────
function _renderFIO(shifts) {
  var el = document.getElementById('dash-fio-table');
  if (!el) return;

  var fioShifts = shifts.filter(_isFio);

  var countEl = document.getElementById('dash-fio-count');
  if (countEl) countEl.textContent = '(' + fioShifts.length + ' registros)';

  if (!fioShifts.length) {
    el.innerHTML = '<div class="empty"><div class="empty-text">Sin FIO en el periodo</div></div>';
    return;
  }

  fioShifts.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); });

  el.innerHTML = '<table>'
    + '<tr><th>Fecha</th><th>Responsable FIO</th><th>Tipo error</th><th>Severidad</th><th>Estado</th><th>Comentario</th></tr>'
    + fioShifts.map(function(s) {
      var sevColor = s.gravedad_error === 'Crítica' ? 'b-red' : s.gravedad_error === 'Alta' ? 'b-orange' : s.gravedad_error === 'Media' ? 'b-yellow' : 'b-gray';
      var estColor = s.validado_por ? 'b-green' : 'b-red';
      var fioResp = s.error_employee_nombre;
      if (!fioResp || fioResp.charAt(0) === '—' || fioResp.indexOf('Sin') !== -1) fioResp = s.nombre || '—';
      return '<tr>'
        + '<td style="font-family:var(--font-mono);font-size:11px">' + fmtDate(s.fecha) + '</td>'
        + '<td style="font-weight:600">' + fioResp + '</td>'
        + '<td style="font-size:12px">' + (s.tipo_error || '—') + '</td>'
        + '<td><span class="badge ' + sevColor + '">' + (s.gravedad_error || '—') + '</span></td>'
        + '<td><span class="badge ' + estColor + '">' + (s.validado_por ? '✓ Validado' : 'Pendiente') + '</span></td>'
        + '<td style="font-size:11px;color:var(--text3);max-width:180px">' + (s.comentario_validador || '—') + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

// ── KPI ESPECÍFICO COCINA ─────────────────────────────────────
function _renderKpiCocina(shifts, mermas) {
  var el = document.getElementById('dash-kpi-especifico');
  if (!el) return;

  var costeMerma = mermas.reduce(function(a, m) { return a + (m.coste_total || 0); }, 0);
  var mermaByProducto = {};
  mermas.forEach(function(m) {
    mermaByProducto[m.producto] = (mermaByProducto[m.producto] || 0) + (m.coste_total || 0);
  });
  var topMerma = Object.entries(mermaByProducto).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

  var chkPct = shifts.length ? Math.round(
    shifts.filter(function(s) { return s.checklist_items; }).length / shifts.length * 100
  ) : 0;

  el.innerHTML = '<div class="card-title" style="color:#f59e0b;">🍳 KPIs COCINA</div>'
    + '<div class="kpi-grid" style="margin-bottom:14px;">'
    + '<div class="kpi k-orange"><div class="kpi-lbl">Coste merma</div><div class="kpi-val">' + costeMerma.toFixed(2) + '€</div><div class="kpi-sub">' + mermas.length + ' líneas</div></div>'
    + '<div class="kpi k-amber"><div class="kpi-lbl">APPCC completado</div><div class="kpi-val">' + chkPct + '%</div><div class="kpi-sub">Checklists enviados</div></div>'
    + '</div>'
    + (topMerma.length ? '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#f59e0b;letter-spacing:.1em;margin-bottom:8px;">TOP MERMA POR PRODUCTO</div>'
      + '<table><tr><th>Producto</th><th>Coste total</th></tr>'
      + topMerma.map(function(kv) {
        return '<tr><td>' + kv[0] + '</td><td style="font-family:var(--font-mono);color:var(--orange)">' + kv[1].toFixed(2) + '€</td></tr>';
      }).join('') + '</table>' : '');
}

// ── KPI ESPECÍFICO SALA ───────────────────────────────────────
async function _renderKpiSala(shifts) {
  var el = document.getElementById('dash-kpi-especifico');
  if (!el) return;

  var periodo = (document.getElementById('dash-periodo') || {}).value || 'semana';
  var desde = null;
  if (periodo === 'hoy') desde = today();
  if (periodo === 'semana') desde = startOfWeek();
  if (periodo === 'mes') desde = startOfMonth();

  var cierres = [];
  try {
    cierres = await dbGetAll('sala_cash_closures');
    if (desde) cierres = cierres.filter(function(c) { return c.fecha >= desde; });
  } catch(e) {}

  var difTotal = cierres.reduce(function(a, c) { return a + (c.diferencia_caja || 0); }, 0);
  var difEf = cierres.reduce(function(a, c) { return a + (c.diferencia_efectivo || 0); }, 0);
  var difTar = cierres.reduce(function(a, c) { return a + (c.diferencia_tarjeta || 0); }, 0);
  var cierresPend = cierres.filter(function(c) { return c.estado === 'Pendiente validación' || c.estado === 'Pendiente Sala'; }).length;

  el.innerHTML = '<div class="card-title" style="color:#3b82f6;">🍽️ KPIs SALA</div>'
    + '<div class="kpi-grid" style="margin-bottom:14px;">'
    + '<div class="kpi k-blue"><div class="kpi-lbl">Cierres caja</div><div class="kpi-val">' + cierres.length + '</div><div class="kpi-sub">' + cierresPend + ' pendientes validación</div></div>'
    + '<div class="kpi ' + (Math.abs(difTotal) > 1 ? 'k-red' : 'k-green') + '"><div class="kpi-lbl">Diferencia total</div><div class="kpi-val">' + (difTotal >= 0 ? '+' : '') + difTotal.toFixed(2) + '€</div><div class="kpi-sub">Ef: ' + difEf.toFixed(2) + '€ · Tar: ' + difTar.toFixed(2) + '€</div></div>'
    + '</div>'
    + (cierres.length ? '<table><tr><th>Fecha</th><th>Responsable</th><th>Diferencia</th><th>Estado</th></tr>'
      + cierres.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 10).map(function(c) {
        var difColor = Math.abs(c.diferencia_caja || 0) > 0.01 ? 'var(--red)' : 'var(--green)';
        return '<tr>'
          + '<td style="font-family:var(--font-mono);font-size:11px">' + fmtDate(c.fecha) + '</td>'
          + '<td>' + (c.responsable_nombre || '—') + '</td>'
          + '<td style="font-family:var(--font-mono);color:' + difColor + '">' + ((c.diferencia_caja || 0) >= 0 ? '+' : '') + (c.diferencia_caja || 0).toFixed(2) + '€</td>'
          + '<td>' + bCajaEstado(c.estado || 'Pendiente Sala') + '</td>'
          + '</tr>';
      }).join('') + '</table>' : '<div class="empty"><div class="empty-text">Sin cierres en el periodo</div></div>');
}

// ── KPI ESPECÍFICO F&B CONSOLIDADO ────────────────────────────
async function _renderKpiFnB(allShifts, allMermas, allIncis, desde) {
  var el = document.getElementById('dash-kpi-especifico');
  if (!el) return;

  var shiftsCocina = allShifts.filter(function(s) { return s.area === 'Cocina' || s.area === 'Friegue'; });
  var shiftsSala = allShifts.filter(function(s) { return s.area === 'Sala'; });
  if (desde) {
    shiftsCocina = shiftsCocina.filter(function(s) { return s.fecha >= desde; });
    shiftsSala = shiftsSala.filter(function(s) { return s.fecha >= desde; });
  }

  var horasCocina = shiftsCocina.reduce(function(a, s) { return a + (parseFloat(s.horas) || 0); }, 0);
  var horasSala = shiftsSala.reduce(function(a, s) { return a + (parseFloat(s.horas) || 0); }, 0);

  var mermasCocina = allMermas.filter(function(m) { return !desde || m.fecha >= desde; });
  var costeMerma = mermasCocina.reduce(function(a, m) { return a + (m.coste_total || 0); }, 0);

  var cierres = [];
  try {
    cierres = await dbGetAll('sala_cash_closures');
    if (desde) cierres = cierres.filter(function(c) { return c.fecha >= desde; });
  } catch(e) {}
  var ventasBruto = cierres.reduce(function(a, c) { return a + (c.total_bruto || 0); }, 0);
  var ventasNeto = cierres.reduce(function(a, c) { return a + (c.subtotal_neto || 0); }, 0);

  el.innerHTML = '<div class="card-title" style="color:#10b981;">🏪 RESTAURANTE / F&B — CONSOLIDADO</div>'
    + '<div class="kpi-grid" style="margin-bottom:14px;">'
    + '<div class="kpi k-blue"><div class="kpi-lbl">Horas Cocina</div><div class="kpi-val">' + horasCocina.toFixed(1) + 'h</div><div class="kpi-sub">' + shiftsCocina.length + ' turnos</div></div>'
    + '<div class="kpi k-blue"><div class="kpi-lbl">Horas Sala</div><div class="kpi-val">' + horasSala.toFixed(1) + 'h</div><div class="kpi-sub">' + shiftsSala.length + ' turnos</div></div>'
    + '<div class="kpi k-green"><div class="kpi-lbl">Ventas neto</div><div class="kpi-val">' + ventasNeto.toFixed(0) + '€</div><div class="kpi-sub">Bruto: ' + ventasBruto.toFixed(0) + '€</div></div>'
    + '<div class="kpi k-orange"><div class="kpi-lbl">Coste merma</div><div class="kpi-val">' + costeMerma.toFixed(0) + '€</div><div class="kpi-sub">' + mermasCocina.length + ' líneas cocina</div></div>'
    + '</div>';
}

// ── KPI ESPECÍFICO RECEPCIÓN HOTEL ────────────────────────────
async function _renderKpiRecepcion(shifts) {
  var el = document.getElementById('dash-kpi-especifico');
  if (!el) return;

  var checkins = shifts.reduce(function(a, s) { return a + (parseInt(s.checkins) || 0); }, 0);
  var checkouts = shifts.reduce(function(a, s) { return a + (parseInt(s.checkouts) || 0); }, 0);
  var reservas = shifts.reduce(function(a, s) { return a + (parseInt(s.reservas) || 0); }, 0);
  var ventasSyncrolab = shifts.reduce(function(a, s) {
    if (s.syncrolab_ventas_data) {
      try {
        var ventas = JSON.parse(s.syncrolab_ventas_data);
        ventas.forEach(function(v) { a += parseFloat(v.importe) || 0; });
      } catch(e) {}
    }
    return a;
  }, 0);
  var leadsPend = shifts.reduce(function(a, s) { return a + (s.lead_pendiente === 'si' ? 1 : 0); }, 0);
  var clientesNoSat = shifts.reduce(function(a, s) { return a + (parseInt(s.clientes_num) || 0); }, 0);

  // Cierres caja recepción
  var cierresRec = [];
  try {
    var allRec = await getDB('rec_shift_data');
    var periodo = (document.getElementById('dash-periodo') || {}).value || 'semana';
    var desde = null;
    if (periodo === 'hoy') desde = today();
    if (periodo === 'semana') desde = startOfWeek();
    if (periodo === 'mes') desde = startOfMonth();
    cierresRec = desde ? allRec.filter(function(r) { return r.fecha >= desde; }) : allRec;
  } catch(e) {}

  el.innerHTML = '<div class="card-title" style="color:#8b5cf6;">🏨 KPIs RECEPCIÓN HOTEL</div>'
    + '<div class="kpi-grid" style="margin-bottom:14px;">'
    + '<div class="kpi k-purple"><div class="kpi-lbl">Check-ins</div><div class="kpi-val">' + checkins + '</div></div>'
    + '<div class="kpi k-purple"><div class="kpi-lbl">Check-outs</div><div class="kpi-val">' + checkouts + '</div></div>'
    + '<div class="kpi k-purple"><div class="kpi-lbl">Reservas</div><div class="kpi-val">' + reservas + '</div></div>'
    + '<div class="kpi k-green"><div class="kpi-lbl">Ventas SYNCROLAB</div><div class="kpi-val">' + ventasSyncrolab.toFixed(0) + '€</div></div>'
    + '<div class="kpi k-amber"><div class="kpi-lbl">Leads pendientes</div><div class="kpi-val">' + leadsPend + '</div></div>'
    + '<div class="kpi k-red"><div class="kpi-lbl">Clientes no sat.</div><div class="kpi-val">' + clientesNoSat + '</div></div>'
    + '</div>'
    + '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b5cf6;letter-spacing:.1em;margin-bottom:8px;">CUADRES DE CAJA RECEPCIÓN</div>'
    + (cierresRec.length ? '<table><tr><th>Fecha</th><th>Turno</th><th>Responsable</th><th>Estado</th></tr>'
      + cierresRec.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 10).map(function(r) {
        return '<tr>'
          + '<td style="font-family:var(--font-mono);font-size:11px">' + fmtDate(r.fecha) + '</td>'
          + '<td>' + (r.turno || '—') + '</td>'
          + '<td>' + (r.responsable_nombre || '—') + '</td>'
          + '<td><span class="badge ' + (r.validado_ts ? 'b-green' : 'b-gray') + '">' + (r.validado_ts ? '✓ Validado' : 'Pendiente') + '</span></td>'
          + '</tr>';
      }).join('') + '</table>'
      : '<div class="empty"><div class="empty-text">Sin cuadres en el periodo</div></div>');
}

// ── MERMA DETALLE ─────────────────────────────────────────────
function _renderMerma(mermas) {
  var kpiEl = document.getElementById('kpi-merma');
  var el = document.getElementById('dash-merma-table');

  var causa = (document.getElementById('dm-causa') || {}).value || '';
  var empFilt = (document.getElementById('dm-emp') || {}).value || '';

  // Populate employee filter
  var dmEmpEl = document.getElementById('dm-emp');
  if (dmEmpEl) {
    var currentV = dmEmpEl.value;
    var names = {};
    mermas.forEach(function(m) { if (m.nombre) names[m.nombre] = true; });
    dmEmpEl.innerHTML = '<option value="">Todos</option>'
      + Object.keys(names).sort().map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
    if (currentV) dmEmpEl.value = currentV;
  }

  var filtered = mermas.slice();
  if (causa) filtered = filtered.filter(function(m) { return m.causa === causa; });
  if (empFilt) filtered = filtered.filter(function(m) { return m.nombre === empFilt; });

  if (kpiEl) {
    var totalCoste = filtered.reduce(function(a, m) { return a + (m.coste_total || 0); }, 0);
    var sinCoste = filtered.filter(function(m) { return !m.coste_unitario || m.coste_unitario === 0; }).length;
    kpiEl.innerHTML = '<div class="kpi k-orange"><div class="kpi-lbl">Líneas</div><div class="kpi-val">' + filtered.length + '</div></div>'
      + '<div class="kpi k-orange"><div class="kpi-lbl">Coste total</div><div class="kpi-val">' + totalCoste.toFixed(0) + '€</div></div>'
      + '<div class="kpi k-red"><div class="kpi-lbl">Sin coste</div><div class="kpi-val">' + sinCoste + '</div><div class="kpi-sub">Pendiente valorar</div></div>';
  }

  if (!el) return;
  if (!filtered.length) {
    el.innerHTML = '<div class="empty"><div class="empty-text">Sin merma en el periodo</div></div>';
    return;
  }

  filtered.sort(function(a, b) { return b.fecha.localeCompare(a.fecha); });

  el.innerHTML = '<table>'
    + '<tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Causa</th><th>Coste total</th><th>Declarante</th></tr>'
    + filtered.map(function(m) {
      var sinC = !m.coste_unitario || m.coste_unitario === 0;
      return '<tr>'
        + '<td style="font-family:var(--font-mono);font-size:11px">' + fmtDate(m.fecha) + '</td>'
        + '<td style="font-weight:600">' + (m.producto || '—') + '</td>'
        + '<td style="font-family:var(--font-mono)">' + (m.cantidad || '—') + ' ' + (m.unidad || '') + '</td>'
        + '<td style="font-size:12px">' + (m.causa || '—') + '</td>'
        + '<td style="font-family:var(--font-mono);' + (sinC ? 'color:var(--amber)' : 'color:var(--orange)') + '">'
        + (sinC ? '⚠ Pendiente' : (m.coste_total || 0).toFixed(2) + '€') + '</td>'
        + '<td style="font-size:12px">' + (m.nombre || '—') + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

// ── PLACEHOLDER DEPARTAMENTOS FUTUROS ─────────────────────────
function _renderPlaceholder(deptCfg) {
  var el = document.getElementById('kpi-grid');
  if (el) el.innerHTML = '';
  var empEl = document.getElementById('dash-emp-table');
  if (empEl) empEl.innerHTML = '';
  var alertEl = document.getElementById('dash-alertas');
  if (alertEl) alertEl.innerHTML = '';
  var inciEl = document.getElementById('dash-inci-table');
  if (inciEl) inciEl.innerHTML = '';
  var kpiInciEl = document.getElementById('kpi-incis');
  if (kpiInciEl) kpiInciEl.innerHTML = '';
  var tasksEl = document.getElementById('dash-tasks-table');
  if (tasksEl) tasksEl.innerHTML = '';
  var gridEl = document.getElementById('dept-task-grid');
  if (gridEl) gridEl.innerHTML = '';
  var fioEl = document.getElementById('dash-fio-table');
  if (fioEl) fioEl.innerHTML = '';
  var costEl = document.getElementById('dash-cost-table');
  if (costEl) costEl.innerHTML = '';
  var espEl = document.getElementById('dash-kpi-especifico');
  if (espEl) espEl.innerHTML = '';

  var main = document.getElementById('kpi-grid');
  if (main) {
    main.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;">'
      + '<div style="font-size:48px;margin-bottom:16px;">' + deptCfg.icono + '</div>'
      + '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.15em;color:' + deptCfg.color + ';text-transform:uppercase;margin-bottom:8px;">PRÓXIMAMENTE</div>'
      + '<div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px;">' + deptCfg.label + '</div>'
      + '<div style="font-size:13px;color:var(--text3);max-width:400px;margin:0 auto;">Este módulo está en desarrollo. La estructura base está preparada — incidencias, tareas, FIO y costes de personal estarán disponibles al activar el departamento.</div>'
      + '</div>';
  }
}

// ── HELPER: POBLAR SELECTOR EMPLEADOS ─────────────────────────
function _populateDashEmpDropdown(allShifts, deptId) {
  var el = document.getElementById('dash-emp');
  if (!el) return;
  var current = el.value;
  var depts = deptId === 'FnB' ? ['Cocina', 'Sala', 'Friegue'] : [deptId];
  var names = {};
  allShifts.filter(function(s) { return depts.indexOf(s.area) !== -1; }).forEach(function(s) { names[s.nombre] = true; });
  el.innerHTML = '<option value="">Todos</option>';
  Object.keys(names).sort().forEach(function(n) {
    var opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    el.appendChild(opt);
  });
  if (current) el.value = current;
}

// ── HELPER: CAMBIO DE DEPT DESDE SELECTOR ────────────────────
function onDashDeptChange() {
  var el = document.getElementById('dash-dept');
  if (el) {
    _dashCurrentDept = el.value;
    el._built = false;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderDashboard();
}

// ── OVERRIDE renderCostTable PARA DASHBOARD ──────────────────
// Reemplaza la version de caja.js — respeta _dashCurrentDept
async function renderCostTable() {
  var el = document.getElementById('dash-cost-table');
  if (!el) return;

  var periodo = (document.getElementById('cost-period-filter') || {}).value || 'semana';
  var t = today();
  var fromD = periodo === 'mes' ? startOfMonth() : periodo === 'hoy' ? t : periodo === 'todo' ? '2020-01-01' : startOfWeek();

  var employees = await getDB('employees');
  var shifts = await getDB('shifts');

  // Filtrar shifts por periodo
  var filtShifts = shifts.filter(function(s) { return s.fecha >= fromD && s.fecha <= t; });

  // Filtrar por departamento activo en dashboard
  var areaMapCost = {
    'Cocina': ['Cocina'],
    'Sala': ['Sala'],
    'Recepcion': ['Recepción'],
    'Recepción': ['Recepción'],
    'FnB': ['Cocina', 'Sala', 'Friegue'],
    'RecepcionSyncrolab': ['Recepción SYNCROLAB', 'SYNCROLAB'],
    'Entrenadores': ['Entrenadores'],
    'Fisioterapeutas': ['Fisioterapeutas'],
    'Housekeeping': ['Housekeeping'],
    'Mantenimiento': ['Mantenimiento'],
    'Economato': ['Economato'],
    'RRHH': ['RRHH', 'Recursos Humanos']
  };
  if (_dashCurrentDept) {
    var validAreasCost = areaMapCost[_dashCurrentDept] || [_dashCurrentDept];
    filtShifts = filtShifts.filter(function(s) { return validAreasCost.indexOf(s.area) !== -1; });
  }

  // También respetar el filtro manual del selector de coste si existe
  var manualDeptF = (document.getElementById('cost-dept-filter') || {}).value || '';
  if (manualDeptF) {
    filtShifts = filtShifts.filter(function(s) { return s.area === manualDeptF; });
  }

  var costDeptAreas = _dashCurrentDept ? (areaMapCost[_dashCurrentDept] || [_dashCurrentDept]) : [];
  var costMap = {};
  employees.filter(function(e) {
    var inDept = !costDeptAreas.length || costDeptAreas.indexOf(e.area) !== -1;
    var inManual = !manualDeptF || e.area === manualDeptF;
    return e.estado === 'Activo' && inDept && inManual;
  }).forEach(function(e) {
    costMap[e.id] = { nombre: e.nombre, puesto: e.puesto, area: e.area, ch: parseFloat(e.coste) || 0, h: 0, n: 0 };
  });

  filtShifts.forEach(function(s) {
    if (!costMap[s.employee_id]) {
      // Añadir empleado aunque no esté en Maestro
      costMap[s.employee_id || s.nombre] = { nombre: s.nombre, puesto: s.puesto || '—', area: s.area || '—', ch: 0, h: 0, n: 0 };
    }
    var key = s.employee_id || s.nombre;
    if (costMap[key]) {
      costMap[key].h += parseFloat(s.horas) || 0;
      costMap[key].n++;
    }
  });

  var rows = Object.values(costMap).sort(function(a, b) { return (b.ch * b.h) - (a.ch * a.h) || b.n - a.n; });

  if (!rows.length) {
    el.innerHTML = '<div class="empty"><div class="empty-text">Sin datos en el periodo</div></div>';
    return;
  }

  var totH = rows.reduce(function(s, e) { return s + e.h; }, 0);
  var totC = rows.reduce(function(s, e) { return s + e.ch * e.h; }, 0);

  // Subtotales por departamento
  var depts = {};
  rows.forEach(function(e) {
    if (!depts[e.area]) depts[e.area] = { h: 0, c: 0 };
    depts[e.area].h += e.h;
    depts[e.area].c += e.ch * e.h;
  });

  var trs = rows.map(function(e) {
    var ct = e.ch * e.h;
    var noC = e.ch === 0;
    var areaColor = e.area === 'Sala' ? 'b-blue' : e.area === 'Cocina' ? 'b-orange' : 'b-gray';
    return '<tr>'
      + '<td><div style="font-weight:600">' + e.nombre + '</div><div style="font-size:11px;color:var(--text3)">' + e.puesto + '</div></td>'
      + '<td><span class="badge ' + areaColor + '">' + e.area + '</span></td>'
      + '<td style="text-align:center;font-family:var(--font-mono)">' + e.n + '</td>'
      + '<td style="text-align:center;font-family:var(--font-mono)">' + e.h.toFixed(1) + 'h</td>'
      + '<td style="text-align:right;font-family:var(--font-mono)">' + (noC ? '<span style="color:var(--amber)">⚠ Sin coste</span>' : e.ch.toFixed(2) + '€/h') + '</td>'
      + '<td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#3b82f6">' + (noC ? '—' : ct.toFixed(2) + '€') + '</td>'
      + '</tr>';
  }).join('');

  var subs = Object.entries(depts).map(function(kv) {
    return '<tr style="background:var(--bg3)">'
      + '<td colspan="3" style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text2);letter-spacing:.1em">SUBTOTAL ' + kv[0].toUpperCase() + '</td>'
      + '<td style="text-align:center;font-family:var(--font-mono);font-weight:700">' + kv[1].h.toFixed(1) + 'h</td>'
      + '<td></td>'
      + '<td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:#3b82f6">' + kv[1].c.toFixed(2) + '€</td>'
      + '</tr>';
  }).join('');

  el.innerHTML = '<div style="overflow-x:auto"><table>'
    + '<tr><th>Empleado</th><th>Dept.</th><th style="text-align:center">Turnos</th><th style="text-align:center">Horas</th><th style="text-align:right">€/hora</th><th style="text-align:right">Coste</th></tr>'
    + trs + subs
    + '<tr style="background:var(--bg2);border-top:2px solid var(--border)">'
    + '<td colspan="3" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.1em">TOTAL GENERAL</td>'
    + '<td style="text-align:center;font-family:var(--font-mono);font-weight:700">' + totH.toFixed(1) + 'h</td>'
    + '<td></td>'
    + '<td style="text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#3b82f6">' + totC.toFixed(2) + '€</td>'
    + '</tr></table>'
    + (rows.some(function(e) { return e.ch === 0; }) ? '<div style="font-size:11px;color:var(--amber);margin-top:8px;font-family:var(--font-mono)">⚠ Empleados sin coste/hora — edítalos en Maestro.</div>' : '')
    + '</div>';
}

// ── INTEGRACIÓN CON INCIDENCIA_TIPOS ─────────────────────────
// Se llama al final de renderDashboard para actualizar filtros
function _syncInciTiposFilter() {
  if (typeof populateDashInciFilter === 'function') {
    populateDashInciFilter(_dashCurrentDept);
  }
}
