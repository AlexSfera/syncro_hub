// Notes board. All persisted access is authorized by /api/suggestions.
(function () {
  var states = [['pendiente','Pendiente','○'], ['en_desarrollo','En desarrollo','◐'], ['terminado','Terminado','✓'], ['rechazado','Rechazado','×']];
  var model = { records: [], canManage: false, actor: '', host: '', selected: 'pendiente', seq: 0, busy: false, drag: null };
  function actorKey() { return typeof currentUser !== 'undefined' && currentUser ? [currentUser.id,currentUser.rol,currentUser.area,currentUser.puesto].join('|') : ''; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function stateLabel(state) { var found=states.find(function(s){return s[0]===state;}); return found ? found[1] : state; }
  function managed() { return model.canManage && model.actor === actorKey() && currentUser.rol === 'admin'; }
  function ordered(state) {
    return model.records.filter(function(n){return n.estado===state;}).sort(function(a,b){
      var ap=a.posicion==null?Infinity:Number(a.posicion),bp=b.posicion==null?Infinity:Number(b.posicion);
      return ap-bp || String(a.created_at||'').localeCompare(String(b.created_at||'')) || String(a.id).localeCompare(String(b.id));
    });
  }
  function note(id) { return model.records.find(function(n){return n.id===id;}); }
  function date(value) { return value ? new Date(value).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) : ''; }
  async function request(method,body) {
    var response=await syncroSupabaseFetch('/api/suggestions',{method:method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    var data=await response.json();
    if(!response.ok){var error=new Error(data.error||'No se pudo completar la operación.');error.status=response.status;throw error;}
    return data;
  }
  function status(text,error) {
    var host=document.getElementById(model.host),node=host&&host.querySelector('.suggestion-feedback');
    if(node){node.textContent=text;node.classList.toggle('is-error',!!error);}
  }
  function clear() {
    model.seq++;model.actor='';model.records=[];model.canManage=false;model.busy=false;model.drag=null;
    closeDialog();
    ['screen-notas-mod','val-notas-table','val-notas-kpis'].forEach(function(id){var el=document.getElementById(id);if(el)el.replaceChildren();});
  }
  async function load(hostId) {
    var host=document.getElementById(hostId),actor=actorKey();if(!host||!actor)return;
    if(model.actor!==actor){model.records=[];model.canManage=false;model.selected='pendiente';closeDialog();}
    var seq=++model.seq;model.actor=actor;model.host=hostId;
    host.innerHTML='<div class="suggestion-loading" role="status">Cargando tus propuestas…</div>';
    try {
      var data=await request('GET');
      if(seq!==model.seq||actor!==actorKey())return;
      if(!Array.isArray(data.records))throw new Error('No se pudo comprobar el tablero.');
      model.records=data.records;model.canManage=!!(data.permissions&&data.permissions.can_manage);draw();
    } catch(error) {
      if(seq!==model.seq||actor!==actorKey())return;
      model.records=[];model.canManage=false;
      host.innerHTML='<div class="suggestion-error" role="alert"><p>'+esc(error.message)+'</p><button class="btn btn-secondary" data-action="retry">Reintentar</button></div>';
      host.querySelector('button').addEventListener('click',function(){load(hostId);});
    }
  }
  function card(n,index,length) {
    var title=n.titulo||String(n.texto||'').slice(0,90)||'Nota anterior';
    var controls=managed()?'<div class="suggestion-controls"><div class="suggestion-order"><button type="button" data-action="up" data-id="'+esc(n.id)+'" aria-label="Subir prioridad: '+esc(title)+'" '+(index===0||model.busy?'disabled':'')+'>↑</button><button type="button" data-action="down" data-id="'+esc(n.id)+'" aria-label="Bajar prioridad: '+esc(title)+'" '+(index===length-1||model.busy?'disabled':'')+'>↓</button></div><label class="suggestion-state-select"><span class="sr-only">Estado de '+esc(title)+'</span><select data-id="'+esc(n.id)+'" '+(model.busy?'disabled':'')+'>'+states.map(function(s){return '<option value="'+s[0]+'" '+(n.estado===s[0]?'selected':'')+'>'+s[1]+'</option>';}).join('')+'</select></label></div>':'';
    return '<article class="suggestion-card" data-id="'+esc(n.id)+'" '+(managed()&&!model.busy?'draggable="true"':'')+'>'
      +'<div class="suggestion-card-meta"><span>'+esc(n.modulo||n.categoria||'Mejora')+'</span><span>'+date(n.created_at)+'</span></div>'
      +'<button class="suggestion-detail-button" data-action="detail" data-id="'+esc(n.id)+'"><strong>'+esc(title)+'</strong><span class="suggestion-description">'+esc(n.texto)+'</span></button>'
      +(n.estado==='rechazado'?'<div class="suggestion-reason"><b>Motivo del rechazo</b><p>'+esc(n.respuesta)+'</p></div>':'')
      +'<div class="suggestion-author">'+esc(n.nombre)+' · '+esc(n.area)+'</div>'
      +((n.estado==='pendiente'||n.estado==='en_desarrollo')?'<div class="suggestion-rank">'+(n.posicion==null?'Sin priorizar':'Prioridad '+esc(n.posicion))+'</div>':'')+controls+'</article>';
  }
  function draw() {
    var host=document.getElementById(model.host);if(!host||model.actor!==actorKey())return;
    host.innerHTML='<div class="suggestions-head"><div><div class="page-title">Notas y Sugerencias</div><p>'+ (managed()?'Decide qué mejora se hace primero. Arrastra las tarjetas o usa las flechas.':'Propón una mejora y sigue su avance. Cada propuesta conserva su estado.')+'</p></div><div class="suggestion-head-actions"><button class="btn btn-secondary" data-action="refresh" '+(model.busy?'disabled':'')+'>Actualizar</button><button class="btn btn-primary" data-action="new" '+(model.busy?'disabled':'')+'>+ Nueva propuesta</button></div></div>'
      +'<div class="suggestion-feedback" role="status" aria-live="polite"></div>'
      +'<div class="suggestion-state-tabs" role="tablist" aria-label="Estados de las propuestas">'+states.map(function(s){return '<button role="tab" aria-selected="'+(model.selected===s[0])+'" data-state="'+s[0]+'" data-action="tab">'+s[1]+' <span>'+ordered(s[0]).length+'</span></button>';}).join('')+'</div>'
      +'<div class="suggestions-board" aria-label="Tablero de mejoras" '+(model.busy?'aria-busy="true"':'')+'>'+states.map(function(s){var list=ordered(s[0]);return '<section class="suggestion-column '+(model.selected===s[0]?'is-selected':'')+'" data-state="'+s[0]+'" aria-label="'+s[1]+'"><h3><span><i aria-hidden="true">'+s[2]+'</i> '+s[1]+'</span><span class="suggestion-count">'+list.length+'</span></h3><div class="suggestion-cards">'+(list.length?list.map(function(n,i){return card(n,i,list.length);}).join(''):'<div class="suggestion-empty">'+(managed()?'Sin propuestas. Puedes mover una tarjeta aquí.':'No tienes propuestas en este estado.')+'</div>')+'</div></section>';}).join('')+'</div>';
    host.onclick=onClick;host.onchange=onChange;
    host.ondragstart=function(event){var target=event.target.closest('.suggestion-card');if(!managed()||model.busy||!target){event.preventDefault();return;}model.drag=target.dataset.id;event.dataTransfer.setData('text/plain',model.drag);event.dataTransfer.effectAllowed='move';target.classList.add('is-dragging');};
    function clearDrag(){host.querySelectorAll('.is-dragging,.is-drop-target,.drop-before').forEach(function(el){el.classList.remove('is-dragging','is-drop-target','drop-before');});}
    host.ondragover=function(event){var column=event.target.closest('.suggestion-column');if(managed()&&!model.busy&&model.drag&&column){event.preventDefault();event.dataTransfer.dropEffect='move';host.querySelectorAll('.is-drop-target,.drop-before').forEach(function(el){el.classList.remove('is-drop-target','drop-before');});column.classList.add('is-drop-target');var target=event.target.closest('.suggestion-card');if(target&&target.dataset.id!==model.drag)target.classList.add('drop-before');}};
    host.ondrop=function(event){if(!managed()||model.busy||!model.drag)return;var column=event.target.closest('.suggestion-column');if(!column)return;event.preventDefault();var target=event.target.closest('.suggestion-card'),id=model.drag;model.drag=null;clearDrag();if(target&&target.dataset.id===id)return;chooseMove(id,column.dataset.state,target?target.dataset.id:null);};
    host.ondragend=function(){model.drag=null;clearDrag();};
  }
  function onClick(event) {
    var button=event.target.closest('[data-action]');if(!button)return;
    var action=button.dataset.action,id=button.dataset.id;
    if(action==='refresh'&&!model.busy){load(model.host);return;}
    if(action==='new'){openNew();return;}
    if(action==='tab'){model.selected=button.dataset.state;draw();var selected=document.getElementById(model.host).querySelector('[data-action="tab"][data-state="'+model.selected+'"]');if(selected)selected.focus();return;}
    if(action==='detail'){openDetail(id);return;}
    if(!managed()||model.busy)return;
    var record=note(id);if(!record)return;var list=ordered(record.estado),index=list.findIndex(function(n){return n.id===id;});
    if(action==='up'&&index>0)move(id,record.estado,list[index-1].id,record.respuesta);
    if(action==='down'&&index<list.length-1)move(id,record.estado,list[index+2]?list[index+2].id:null,record.respuesta);
  }
  function onChange(event) { if(event.target.matches('.suggestion-state-select select')){var record=note(event.target.dataset.id),state=event.target.value;if(record){event.target.value=record.estado;chooseMove(record.id,state,null);}} }
  function chooseMove(id,state,before) {
    if(!managed()||model.busy)return;var record=note(id);if(!record)return;
    if(state==='rechazado'&&record.estado!=='rechazado'){openRejection(id,before);return;}
    move(id,state,before,record.respuesta||'');
  }
  async function move(id,state,before,reason) {
    if(!managed()||model.busy)return;var record=note(id);if(!record)return;
    var actor=model.actor;model.busy=true;draw();status('Guardando cambio…');
    try {
      await request('PATCH',{id:id,estado:state,before_id:before,respuesta:state==='rechazado'?reason:'',expected_version:record.version});
      if(actor!==actorKey())return;
      model.busy=false;model.selected=state;closeDialog();await load(model.host);status('Cambio guardado.');
      var host=document.getElementById(model.host),cardButton=host&&host.querySelector('.suggestion-detail-button[data-id="'+id+'"]');if(cardButton)cardButton.focus();
    } catch(error) {
      if(actor!==actorKey())return;model.busy=false;draw();status(error.message,true);
      var dialog=document.getElementById('suggestion-dialog');if(dialog){dialog.querySelector('[role="alert"]').textContent=error.message;dialog.querySelectorAll('button').forEach(function(b){b.disabled=false;});}
      if(error.status===409){await load(model.host);status(error.message,true);closeDialog();}
    } finally { if(actor===actorKey())model.busy=false; }
  }
  var returnFocus=null;
  function closeDialog() { var el=document.getElementById('suggestion-dialog');if(el)el.remove();if(returnFocus&&returnFocus.isConnected)returnFocus.focus();returnFocus=null; }
  function dialog(title,body,submitLabel,onSubmit) {
    closeDialog();returnFocus=document.activeElement;
    var overlay=document.createElement('div');overlay.id='suggestion-dialog';overlay.className='suggestion-overlay';
    overlay.innerHTML='<section class="suggestion-modal" role="dialog" aria-modal="true" aria-labelledby="suggestion-dialog-title"><form><div class="suggestion-modal-head"><h3 id="suggestion-dialog-title">'+esc(title)+'</h3><button type="button" data-close aria-label="Cerrar">×</button></div><div class="suggestion-modal-body">'+body+'<p class="suggestion-form-error" role="alert"></p></div><div class="suggestion-modal-footer"><button type="button" class="btn btn-secondary" data-close>Cancelar</button>'+(submitLabel?'<button type="submit" class="btn btn-primary">'+esc(submitLabel)+'</button>':'')+'</div></form></section>';
    overlay.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){if(!model.busy)closeDialog();});});
    overlay.addEventListener('click',function(e){if(e.target===overlay&&!model.busy)closeDialog();});
    overlay.addEventListener('keydown',function(e){if(e.key==='Escape'&&!model.busy){closeDialog();return;}if(e.key==='Tab'){var nodes=Array.from(overlay.querySelectorAll('button:not(:disabled),input,textarea,select')).filter(function(n){return n.offsetParent!==null;});var first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}});
    overlay.querySelector('form').addEventListener('submit',function(e){e.preventDefault();if(onSubmit&&!model.busy)onSubmit(overlay);});
    document.body.appendChild(overlay);(overlay.querySelector('input,textarea')||overlay.querySelector('button')).focus();return overlay;
  }
  function openNew() {
    if(!actorKey()||model.busy)return;
    dialog('Nueva propuesta','<label>Título<input name="titulo" required minlength="3" maxlength="160" placeholder="¿Qué debemos mejorar?"></label><label>Módulo o apartado<input name="modulo" maxlength="120" placeholder="Por ejemplo: turnos, fichaje o informes"></label><label>Categoría<select name="categoria"><option>Mejora</option><option>Sugerencia</option><option>Queja</option></select></label><label>Descripción<textarea name="texto" rows="5" required minlength="5" maxlength="5000" placeholder="Explica qué ocurre y cómo te gustaría que funcionase."></textarea></label><p class="suggestion-form-hint">Tu propuesta aparecerá en Pendiente. Podrás consultar aquí su estado.</p>','Enviar propuesta',async function(overlay){
      var actor=actorKey(),form=overlay.querySelector('form');model.busy=true;overlay.querySelectorAll('button').forEach(function(b){b.disabled=true;});
      try {
        var data=await request('POST',{titulo:form.elements.titulo.value,texto:form.elements.texto.value,modulo:form.elements.modulo.value,categoria:form.elements.categoria.value});
        if(actor!==actorKey())return;
        if(!data.record)throw new Error('No se ha confirmado el guardado.');
        model.busy=false;model.selected='pendiente';closeDialog();await load(model.host||'screen-notas-mod');status('Propuesta enviada.');
      } catch(error) {if(actor!==actorKey())return;overlay.querySelector('[role="alert"]').textContent=error.message;overlay.querySelectorAll('button').forEach(function(b){b.disabled=false;});}
      finally {if(actor===actorKey())model.busy=false;}
    });
  }
  function openRejection(id,before) {
    var record=note(id);if(!record)return;
    dialog('Rechazar propuesta','<p>'+esc(record.titulo||record.texto)+'</p><label>Motivo del rechazo<textarea name="respuesta" required minlength="3" maxlength="2000" rows="4" placeholder="Explica al autor por qué no se realizará."></textarea></label><p class="suggestion-form-hint">El autor podrá consultar este motivo junto a su propuesta.</p>','Guardar rechazo',function(overlay){overlay.querySelectorAll('button').forEach(function(b){b.disabled=true;});move(id,'rechazado',before,overlay.querySelector('textarea').value);});
  }
  function openDetail(id) {
    var record=note(id);if(!record||model.actor!==actorKey())return;
    dialog(record.titulo||'Detalle de la propuesta','<div class="suggestion-detail-state">'+esc(stateLabel(record.estado))+'</div><p class="suggestion-detail-text">'+esc(record.texto)+'</p><p class="suggestion-author">'+esc(record.nombre)+' · '+esc(record.area)+' · '+date(record.created_at)+'</p>'+(record.respuesta?'<div class="suggestion-reason"><b>Motivo del rechazo</b><p>'+esc(record.respuesta)+'</p></div>':''),null,null);
  }
  window.renderNotasMod=function(){return load('screen-notas-mod');};
  window.renderValNotasList=function(){var kpi=document.getElementById('val-notas-kpis');if(kpi)kpi.replaceChildren();return load('val-notas-table');};
  window.openNewNotaMod=openNew;
  window.clearSuggestionsSession=clear;
})();
