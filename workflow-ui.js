// Navigation V5: reuse existing domain screens and records.
(function(){
  var legacyShow=window.showScreen;
  var parked={};
  var journeyTab='planificacion';
  var reportMode='reports';
  var validationMode='parts';
  var financeDepartment='Entrenadores';
  var seq=0;
  window.workflowClearSession=function(){
    ++seq;restore();
    document.querySelectorAll('.workflow-body').forEach(function(body){body.replaceChildren();});
    if(typeof _hmData!=='undefined')_hmData=null;
    if(typeof _infEmployeesCache!=='undefined')_infEmployeesCache=null;
    if(typeof _hkSemesterState!=='undefined')_hkSemesterState.data=null;
    if(typeof _incReceptionReviewState!=='undefined')_incReceptionReviewState=null;
    ['modal-mr-liq','hk-liquidation-overlay'].forEach(function(id){var node=document.getElementById(id);if(node)node.remove();});
  };
  function esc(value){ return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function message(text){ return '<div class="card"><p>'+esc(text)+'</p></div>'; }
  function frame(id,title,sub){
    restore();
    document.querySelectorAll('.workflow-body').forEach(function(body){body.replaceChildren();});
    var node=document.getElementById('screen-'+id);
    if(!node){ node=document.createElement('div'); node.id='screen-'+id; node.className='screen';
      var container=document.getElementById('screen-turno').parentNode; container.appendChild(node); }
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    node.classList.add('active');
    document.querySelectorAll('.nav-btn,.bnav-btn,.nav-btn-dropdown-toggle').forEach(function(b){b.classList.remove('active');});
    var button=document.getElementById('nav-'+id);
    if(button){button.classList.add('active'); var g=button.closest('.nav-group'); var toggle=g&&g.querySelector('.nav-btn-dropdown-toggle'); if(toggle)toggle.classList.add('active');}
    node.innerHTML='<div class="page-header"><div class="page-title">'+esc(title)+'</div><div class="page-sub">'+esc(sub)+'</div></div><div class="workflow-body"></div>';
    return node.querySelector('.workflow-body');
  }
  function restore(){ Object.keys(parked).forEach(function(id){var n=document.getElementById(id);if(n&&parked[id])parked[id].appendChild(n);}); }
  function mount(body,id){var n=document.getElementById(id);if(!n)throw new Error('No se encuentra la vista '+id); if(!parked[id])parked[id]=n.parentNode;body.appendChild(n);return n;}
  function allowed(id){return getScreens(currentUser.rol).some(function(i){return i.id===id;});}
  function denied(){toast('No tienes permiso para esta función.','err');}

  window.workflowReportMode=function(){return reportMode;};
  window.workflowAllowedReportTabs=function(dept){
    if(reportMode==='reports') return dept==='RRHH'?[]:['informe-jefe'];
    if(dept==='Sala') return ['ventas'];
    if(dept==='Entrenadores') return ['kpi'];
    return [];
  };
  window.workflowValidationTabs=function(){
    if(validationMode==='cash')return ['caja'];
    var tabs=['followup','operativo'];
    if(typeof canSeeMermaTab==='function'&&canSeeMermaTab(currentUser))tabs.push('merma');
    if(typeof _canSeeNotasTab==='function'&&_canSeeNotasTab(currentUser))tabs.push('notas');
    if(typeof _canSeeFIOTab==='function'&&_canSeeFIOTab(currentUser))tabs.push('fio');
    return tabs;
  };

  async function journey(tab){
    restore(); journeyTab=tab||journeyTab; window._workflowJornadaTab=journeyTab;
    var body=frame('jornada','Jornada y saldos','Lo previsto, el tiempo registrado y los derechos de descanso tienen fuentes y estados distintos.');
    var tabs=[['planificacion','Planificación'],['fichajes','Fichajes'],['balance','Balance · vista mensual'],['saldos','Vacaciones y festivos']];
    if(allowed('dashboard'))tabs.push(['cobertura','Cobertura estimada']);
    body.innerHTML='<div class="card" style="display:flex;gap:8px;flex-wrap:wrap" role="tablist">'+tabs.map(function(t){return '<button class="btn '+(t[0]===journeyTab?'btn-primary':'btn-secondary')+'" role="tab" aria-selected="'+(t[0]===journeyTab)+'" onclick="workflowJourney(\''+t[0]+'\')">'+esc(t[1])+'</button>';}).join('')+'</div><div id="workflow-journey-view"></div>';
    var view=document.getElementById('workflow-journey-view');
    if(journeyTab==='balance'){
      view.innerHTML=message('Horas registradas en Bitrix24. La validación de un parte no valida todas las horas del mes. Validación laboral mensual y cierre: [NO DATA].');
      mount(view,'horas-mes-content'); await renderHorasMensuales();
    }else if(journeyTab==='fichajes'){
      view.innerHTML=message('Incidencias de marcaje: esta vista muestra alertas. Los tiempos y patrones se consultan en Balance.');
      mount(view,'fichaje-content'); await renderFichaje();
    }else if(journeyTab==='cobertura'){
      if(!allowed('dashboard')){denied();return;}
      view.innerHTML=message('Estimación a partir de históricos y ausencias; no representa turnos ya asignados.');
      mount(view,'dash-prevision-content'); await renderDashPrevision();
    }else{
      if(journeyTab==='saldos'&&['admin','adjunto','adjunto_directivo'].indexOf(currentUser.rol)>=0){
        view.innerHTML='<button class="btn" onclick="workflowAvailability()">Histórico de disponibilidad y bajas</button>';
      }
      mount(view,'planificacion-horaria-content'); await renderPlanificacionHoraria();
    }
  }
  window.workflowJourney=async function(tab){if(!allowed('jornada')){denied();return;}if(['planificacion','fichajes','balance','saldos','cobertura','conditions'].indexOf(tab)<0)return;try{await journey(tab);}catch(e){toast(e.message,'err');}};
  window.workflowAvailability=async function(){
    if(['admin','adjunto','adjunto_directivo'].indexOf(currentUser.rol)<0){denied();return;}
    var body=frame('jornada','Histórico de disponibilidad','Registro existente de employee_status. No acredita un nuevo saldo ni un cierre mensual.');
    await _renderRRHH(body);
  };

  async function pending(){
    var version=++seq;var body=frame('mi-rendimiento','Mis incentivos pendientes','Consulta personal. Los incentivos liquidados dejan de aparecer aquí y permanecen en el control interno.');
    body.innerHTML=message('Comprobando pendientes…');
    try{
      var res=await syncroSupabaseFetch('/api/pending-incentives',{method:'GET'});
      if(!res.ok)throw new Error('No se pudieron comprobar los pendientes. Reintenta más tarde.');
      var data=await res.json();if(version!==seq)return;
      var rows=data.records||[];
      body.innerHTML=rows.length?'<div class="card"><div style="overflow-x:auto"><table><thead><tr><th>Periodo</th><th>Departamento</th><th>Incentivo pendiente</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+esc(r.period)+'</td><td>'+esc(r.department)+'</td><td>'+Number(r.amount).toLocaleString('es-ES',{style:'currency',currency:'EUR'})+'</td></tr>';}).join('')+'</tbody></table></div></div>':message('No tienes incentivos pendientes de pagar registrados. Los cálculos provisionales no se presentan como pagos aprobados.');
    }catch(e){if(version===seq)body.innerHTML=message(e.message);}
  }
  // Personal legacy entry points must not load settlement history either.
  window.renderMiRendimiento=pending;

  async function control(marking){
    if(!canControlIncentivesUI(currentUser)||marking&&!canMarkLiquidationUI(currentUser)){denied();return;}
    restore();var id=marking?'liquidaciones':'control-incentivos';
    if(!marking){var old=document.getElementById('screen-liquidaciones');if(old)old.replaceChildren();}
    var body=frame(id,marking?'Liquidaciones internas':'Control de incentivos','Control interno de pendientes y liquidados. No es nómina oficial ni cierre de horas.');
    body.innerHTML='<div class="card"><label>Departamento <select onchange="workflowFinanceDepartment(this.value)">'+['Sala','Cocina','Recepción Hotel','Entrenadores','Housekeeping'].map(function(d){return '<option'+(d===financeDepartment?' selected':'')+'>'+esc(d)+'</option>';}).join('')+'</select></label></div><div id="workflow-finance-view"></div>';
    var view=document.getElementById('workflow-finance-view');
    view.id='liquidaciones-departamento-content';
    if(['Entrenadores','Housekeeping','Recepción Hotel'].indexOf(financeDepartment)>=0){
      _hkSemesterState.department=financeDepartment;
      await renderLiquidacionesPorDepartamento(view);
    }else{
      var rows=await getDB('employee_incentives');
      rows=(rows||[]).filter(function(r){return r.departamento===financeDepartment;});
      view.innerHTML='<div class="card"><h3>'+esc(financeDepartment)+'</h3>'+(canMarkLiquidationUI(currentUser)?'<button class="btn" onclick="workflowCalculateIncentives()">Cálculo e importación existentes</button>':'')+'<div style="overflow-x:auto"><table><thead><tr><th>Persona</th><th>Periodo</th><th>Incentivo calculado</th><th>Estado de revisión</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+esc(r.employee_name)+'</td><td>'+esc(r.month)+'</td><td>'+esc(r.bonus_final)+'</td><td>'+esc(r.status)+'</td></tr>';}).join('')+'</tbody></table></div>'+(!rows.length?'<p>Sin cálculos registrados.</p>':'')+'</div>';
    }
  }
  window.workflowFinanceDepartment=function(value){financeDepartment=value;return control(document.getElementById('screen-liquidaciones')&&document.getElementById('screen-liquidaciones').classList.contains('active'));};
  window.workflowCalculateIncentives=async function(){
    if(!canMarkLiquidationUI(currentUser)){denied();return;}
    var body=frame('control-incentivos','Cálculo de incentivos','Los cálculos no acreditan aprobación ni pago.');
    _infDept=financeDepartment;_incImportTab='calcular';body.innerHTML='<div id="incentivos-content"></div>';await renderIncentivos();
  };

  async function config(){
    if(!currentUser||currentUser.rol!=='admin'){denied();return;}
    var body=frame('configuracion','Configuración y accesos','Parámetros y herramientas existentes. Las fichas conservan sus permisos.');
    body.innerHTML='<div class="card"><button class="btn" onclick="showScreen(\'maestro\')">Plantilla y accesos</button> <button class="btn" onclick="workflowRules()">Reglas de incentivos</button> <button class="btn" onclick="_hmAbrirBackfill()">Herramienta histórica de Bitrix24</button></div><div id="workflow-config-data"></div>';
    var backup=document.getElementById('workflow-backup-tools');if(backup){backup.style.display='';mount(document.getElementById('workflow-config-data'),'workflow-backup-tools');}
  }
  window.workflowRules=async function(){
    if(!canMarkLiquidationUI(currentUser)){denied();return;}
    var body=frame('configuracion','Reglas de incentivos','Configuración interna autorizada.');
    _infDept='Sala';body.innerHTML='<div id="inc-gest-content"></div>';await renderIncReglas();
  };

  window.showScreen=async function(id){
    ++seq;
    if(['liquidaciones','control-incentivos','incentivos'].indexOf(id)>=0&&!canControlIncentivesUI(currentUser)){denied();return;}
    if(id==='liquidaciones'&&!canMarkLiquidationUI(currentUser)){denied();return;}
    if(['planificacion-horaria','fichaje','horas-mes','jornada','condiciones-laborales'].indexOf(id)>=0){
      if(!allowed('jornada')){denied();return;}
      var tab={'planificacion-horaria':'planificacion','fichaje':'fichajes','horas-mes':'balance','condiciones-laborales':'conditions'}[id];
      if(id==='condiciones-laborales'&&!allowed(id)){denied();return;}
      try{await journey(tab);}catch(e){toast(e.message,'err');}return;
    }
    if(id==='mi-rendimiento'){if(!allowed(id)){denied();return;}await pending();return;}
    if(id==='control-incentivos'||id==='liquidaciones'){try{await control(id==='liquidaciones');}catch(e){toast(e.message,'err');}return;}
    if(id==='configuracion'){if(!allowed(id)){denied();return;}await config();return;}
    if(id==='incentivos'){await control(false);return;}
    if(id==='produccion-propia'){
      if(!allowed(id)){denied();return;}
      restore();var body=frame(id,'Mi producción declarada','Actividad registrada en tus partes, separada del control de pagos.');
      _mrEntrMonth=getMonthOptions(1)[0].value;body.innerHTML=await _mrEntrMis();return;
    }
    restore();
    if(id==='produccion'||id==='informes'){
      if(!allowed(id)){denied();return;}
      reportMode=id==='produccion'?'production':'reports';
      var screen=document.getElementById('screen-informes');
      screen.querySelector('.page-title').textContent=reportMode==='production'?'Producción y ventas':'Informes de departamento';
      screen.querySelector('.page-sub').textContent=reportMode==='production'?'Datos oficiales existentes; conexiones LIVE no añadidas.':'Explicación de resultados por periodo y departamento.';
      await legacyShow('informes');
      document.querySelectorAll('.nav-btn,.bnav-btn').forEach(function(b){b.classList.remove('active');});
      var nav=document.getElementById('nav-'+id);if(nav)nav.classList.add('active');return;
    }
    if(id==='cajas-revision'||id==='validacion'){
      if(!allowed(id)){denied();return;}
      validationMode=id==='cajas-revision'?'cash':'parts';await legacyShow('validacion');
      var permitted=window.workflowValidationTabs();
      ['followup','operativo','caja','merma','notas','fio'].forEach(function(t){var b=document.getElementById('val-tab-'+t);if(b)b.style.display=permitted.indexOf(t)>=0?'':'none';});
      switchValTab(permitted[0]);return;
    }
    var backup=document.getElementById('workflow-backup-tools');if(backup)backup.style.display='none';
    await legacyShow(id);
  };
})();
