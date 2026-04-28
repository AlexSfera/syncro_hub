// ═══════════════════════════════════════════════════
// SALA — Funciones exclusivas de Sala
// Depende de: shared.js, checklist.js
// ═══════════════════════════════════════════════════

var _salaState = {};

function setSalaBlock(name, val) {
  _salaState[name] = val;
  var blockMap = {
    'descuentos':'block-descuentos',
    'anulaciones':'block-anulaciones',
    'invitaciones':'block-invitaciones',
    'devoluciones':'block-devoluciones',
  };
  if(blockMap[name]) {
    var block = document.getElementById(blockMap[name]);
    if(block) block.classList.toggle('visible', val==='si');
  }
  var allBtns = ['desc-si','desc-no','anul-si','anul-no','anulresp-si','anulresp-no',
                 'inv-si','inv-no','invpos-si','invpos-no','dev-si','dev-no','devcliente-si','devcliente-no'];
  allBtns.forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    var baseName=id.replace('-si','').replace('-no','');
    var keyMap={'desc':'descuentos','anul':'anulaciones','anulresp':'anulresp',
                'inv':'invitaciones','invpos':'invposmews','dev':'devoluciones','devcliente':'devcliente'};
    if(keyMap[baseName]===name){
      var isMatch=(id.endsWith('-si')&&val==='si')||(id.endsWith('-no')&&val==='no');
      el.classList.toggle('active',isMatch);
    }
  });
}

function collectSalaData() {
  var d={};
  d.descuentos_si=_salaState['descuentos']==='si';
  d.descuentos_num=parseInt((document.getElementById('s-desc-num')||{}).value)||0;
  d.descuentos_motivo=(document.getElementById('s-desc-motivo')||{}).value||'';
  d.descuentos_obs=(document.getElementById('s-desc-obs')||{}).value||'';
  d.anulaciones_si=_salaState['anulaciones']==='si';
  d.anulaciones_num=parseInt((document.getElementById('s-anul-num')||{}).value)||0;
  d.anulaciones_motivo=(document.getElementById('s-anul-motivo')||{}).value||'';
  d.anulaciones_resp_inf=_salaState['anulresp']==='si';
  d.invitaciones_si=_salaState['invitaciones']==='si';
  d.invitaciones_tipo=(document.getElementById('s-inv-tipo')||{}).value||'';
  d.invitaciones_num=parseInt((document.getElementById('s-inv-num')||{}).value)||0;
  d.invitaciones_producto=(document.getElementById('s-inv-producto')||{}).value||'';
  d.invitaciones_posmews=_salaState['invposmews']==='si';
  d.devoluciones_si=_salaState['devoluciones']==='si';
  d.devoluciones_num=parseInt((document.getElementById('s-dev-num')||{}).value)||0;
  d.devoluciones_motivo=(document.getElementById('s-dev-motivo')||{}).value||'';
  d.devoluciones_cliente=_salaState['devcliente']==='si';
  return d;
}

function clearSalaFields() {
  _salaState={};
  ['s-desc-num','s-desc-obs','s-anul-num','s-anul-obs',
   's-inv-num','s-inv-producto','s-dev-num','s-dev-obs'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  ['s-desc-motivo','s-anul-motivo','s-inv-tipo','s-dev-motivo'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  ['block-descuentos','block-anulaciones','block-invitaciones','block-devoluciones'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.classList.remove('visible');
  });
}

// ── AJUSTES MODAL (antes del checklist) ──
var _ajustesChoice = null;
var _ajustesLines = [];
var _ajToggles = {};

function openAjustesModal() {
  _ajustesChoice=null;
  _ajustesLines=[];
  document.getElementById('ajustes-lines-block').style.display='none';
  document.getElementById('ajustes-lines').innerHTML='';
  document.getElementById('ajustes-confirm-btn').disabled=true;
  ['ajustes-no-btn','ajustes-si-btn'].forEach(function(id){
    var el=document.getElementById(id); if(el){el.style.outline='none';el.style.boxShadow='none';}
  });
  document.getElementById('modal-ajustes').style.display='flex';
}

function ajustesChoice(choice) {
  _ajustesChoice=choice;
  var noBtn=document.getElementById('ajustes-no-btn');
  var siBtn=document.getElementById('ajustes-si-btn');
  var linesBlock=document.getElementById('ajustes-lines-block');
  var confirmBtn=document.getElementById('ajustes-confirm-btn');
  if(choice==='no'){
    if(noBtn) noBtn.style.boxShadow='0 0 0 2px var(--green)';
    if(siBtn) siBtn.style.boxShadow='none';
    if(linesBlock) linesBlock.style.display='none';
    if(confirmBtn) confirmBtn.disabled=false;
  } else {
    if(siBtn) siBtn.style.boxShadow='0 0 0 2px #3b82f6';
    if(noBtn) noBtn.style.boxShadow='none';
    if(linesBlock) linesBlock.style.di
