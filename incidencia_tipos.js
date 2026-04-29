// ═══════════════════════════════════════════════════════════════
// INCIDENCIA_TIPOS — Tipos de incidencia/gestión por departamento
// Usado por: formulario de turno, dashboard, filtros
// ═══════════════════════════════════════════════════════════════

var INCIDENCIA_TIPOS = {

  'Cocina': [
    'Petición de cliente',
    'Queja / cliente insatisfecho',
    'Error de comanda / servicio',
    'Error de cobro / TPV',
    'Ajuste operativo: descuento / anulación / invitación',
    'Devolución',
    'Problema cocina-sala',
    'Problema con recepción / PMS',
    'Falta de producto',
    'Calidad del producto',
    'Limpieza / orden',
    'APPCC / seguridad alimentaria',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Accidente o seguridad',
    'Tarea operativa pendiente',
    'Otro'
  ],

  'Sala': [
    'Petición de cliente',
    'Queja / cliente insatisfecho',
    'Error de comanda / servicio',
    'Error de cobro / TPV',
    'Ajuste operativo: descuento / anulación / invitación',
    'Devolución',
    'Problema cocina-sala',
    'Problema con recepción / PMS',
    'Falta de producto',
    'Calidad del producto',
    'Limpieza / orden',
    'APPCC / seguridad alimentaria',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Accidente o seguridad',
    'Tarea operativa pendiente',
    'Otro'
  ],

  'Friegue': [
    'Limpieza / orden',
    'Falta de producto / material',
    'APPCC / seguridad alimentaria',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Accidente o seguridad',
    'Tarea operativa pendiente',
    'Otro'
  ],

  'Recepción': [
    'Petición de cliente',
    'Queja / cliente insatisfecho',
    'Error check-in / check-out',
    'Error de reserva',
    'Reserva / lead pendiente',
    'Comunicación pendiente',
    'Error en MEWS',
    'Error de cobro / caja',
    'Room charge / pensiones / desayuno',
    'Problema con habitación',
    'Problema con housekeeping',
    'Problema con restaurante',
    'Documentación pendiente',
    'Pulsera / acceso',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Accidente o seguridad',
    'Otro'
  ],

  'Recepción SYNCROLAB': [
    'Petición de cliente',
    'Queja / cliente insatisfecho',
    'Error de reserva',
    'Reserva / lead pendiente',
    'Comunicación pendiente',
    'Error de cobro / TPV',
    'Venta pendiente',
    'Problema con acceso / pulsera',
    'Problema con fisioterapia',
    'Problema con entrenadores',
    'Problema con hotel',
    'Problema con Nubimed / Bitrix24',
    'Documentación pendiente',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Accidente o seguridad',
    'Otro'
  ],

  'Entrenadores': [
    'Cliente no presentado / cancelación',
    'Sesión pendiente de registrar',
    'Queja / cliente insatisfecho',
    'Petición de cliente',
    'Problema con reserva',
    'Problema con material / instalación',
    'Problema de seguridad / lesión',
    'Derivación a fisioterapia',
    'Seguimiento cliente pendiente',
    'Evaluación pendiente',
    'Problema con recepción / sistema',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Otro'
  ],

  'Fisioterapeutas': [
    'Paciente no presentado / cancelación',
    'Tratamiento pendiente de registrar',
    'Queja / paciente insatisfecho',
    'Petición de paciente',
    'Error en Nubimed / reserva',
    'Seguimiento clínico pendiente',
    'Derivación médica / interna',
    'Problema con sala / equipo técnico',
    'Problema con recepción',
    'Documentación pendiente',
    'Problema de seguridad',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Otro'
  ],

  'Housekeeping': [
    'Habitación no lista / pendiente',
    'Repaso pendiente',
    'Limpieza insuficiente',
    'Queja / huésped insatisfecho',
    'Objeto olvidado',
    'Daño en habitación',
    'Falta de amenities / lencería',
    'Problema con lavandería',
    'Problema con mantenimiento',
    'Problema con recepción / estado habitación',
    'Accidente o seguridad',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso / disciplina',
    'Otro'
  ],

  'Mantenimiento': [
    'Avería crítica',
    'Avería habitación',
    'Avería restaurante',
    'Avería hotel / zonas comunes',
    'Avería SYNCROLAB',
    'Climatización / electricidad / fontanería',
    'Cerrajería / accesos',
    'Piscina / SPA',
    'Equipamiento gimnasio',
    'Tarea preventiva / correctiva',
    'Proveedor externo pendiente',
    'Material / repuesto pendiente',
    'Reincidencia',
    'Seguridad / riesgo',
    'Retraso / comunicación interna',
    'Otro'
  ],

  'Economato': [
    'Pedido no recibido / incompleto',
    'Producto incorrecto',
    'Producto en mal estado / rechazado',
    'Diferencia de albarán',
    'Falta de stock / stock bajo',
    'Error de inventario',
    'Error de almacenamiento / conservación',
    'Problema con proveedor',
    'Pedido urgente',
    'Compra no autorizada',
    'Tarea operativa pendiente',
    'Incumplimiento de procedimiento / comunicación interna',
    'Retraso',
    'Otro'
  ],

  'RRHH': [
    'Documentación pendiente',
    'Alta / baja pendiente',
    'Vacaciones pendiente',
    'Ausencia no justificada',
    'Incidencia de fichaje',
    'Horas no cuadran',
    'Cambio de horario pendiente',
    'Incidencia disciplinaria / conflicto interno',
    'Comunicación pendiente',
    'Revisión de desempeño',
    'Formación pendiente',
    'Acceso sistema pendiente',
    'Error de datos empleado',
    'Nómina / variable pendiente',
    'Retraso',
    'Otro'
  ]

};

// Alias para compatibilidad con IDs del dashboard
INCIDENCIA_TIPOS['FnB'] = INCIDENCIA_TIPOS['Cocina'];
INCIDENCIA_TIPOS['RecepcionSyncrolab'] = INCIDENCIA_TIPOS['Recepción SYNCROLAB'];

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────
// Devuelve la lista de tipos para un departamento dado
function getInciTipos(dept) {
  return INCIDENCIA_TIPOS[dept] || INCIDENCIA_TIPOS['Cocina'];
}

// ── POBLAR SELECTOR EN FORMULARIO DE TURNO ────────────────────
// Llama esto cuando el departamento del usuario esté definido
function populateInciTipoSelector(selectId, dept) {
  var el = document.getElementById(selectId);
  if (!el) return;
  var tipos = getInciTipos(dept);
  var currentVal = el.value;
  el.innerHTML = '<option value="">— Seleccionar tipo —</option>'
    + tipos.map(function(t) {
      return '<option value="' + t + '"' + (t === currentVal ? ' selected' : '') + '>' + t + '</option>';
    }).join('');
}

// ── POBLAR SELECTOR EN FILTROS DEL DASHBOARD ─────────────────
function populateDashInciFilter(dept) {
  var selectIds = ['di-cat', 'it-tipo'];
  selectIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var tipos = getInciTipos(dept);
    var currentVal = el.value;
    el.innerHTML = '<option value="">Todas</option>'
      + tipos.map(function(t) {
        return '<option value="' + t + '"' + (t === currentVal ? ' selected' : '') + '>' + t + '</option>';
      }).join('');
  });
}

// ── AUTO-INIT AL CARGAR ───────────────────────────────────────
// Se ejecuta automáticamente cuando el usuario está logado
// y tiene área definida
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.area) {
      populateInciTipoSelector('it-tipo', currentUser.area);
      populateInciTipoSelector('inci-tipo', currentUser.area);
    }
  }, 800);
});
