// CAJAS_CONFIG — configuracion base para futura arquitectura de cierres de caja.
// Este archivo no reemplaza caja.js ni modifica flujos existentes.
(function(global) {
  'use strict';

  var CAMPOS_COMUNES = [
    'fecha',
    'empleado_responsable',
    'turno',
    'fondo_inicial',
    'fondo_final',
    'retiro_caja_fuerte',
    'comentario',
    'estado',
    'validacion',
    'audit_log',
    'permisos'
  ];

  var CAJAS_TIPOS = {
    sala: {
      id: 'sala',
      nombre: 'Caja Sala',
      tabla_actual: 'sala_cash_closures',
      campos_comunes: CAMPOS_COMUNES,
      campos_especificos: [
        'efectivo_posmews',
        'efectivo_real_contado',
        'tpv_posmews',
        'tpv_fisico',
        'stripe_posmews',
        'stripe_real',
        'room_charge_declarado',
        'pensiones_desayuno_ticadas',
        'pensiones_comida_ticadas',
        'propinas_tpv',
        'cargo_alexander_declarado',
        'retiro_caja_fuerte',
        'fondo_caja_final'
      ],
      campos_obligatorios: [
        'fecha',
        'empleado_responsable',
        'efectivo_posmews',
        'efectivo_real_contado',
        'tpv_posmews',
        'tpv_fisico',
        'stripe_posmews',
        'stripe_real',
        'fondo_caja_final'
      ]
    },

    recepcion_hotel: {
      id: 'recepcion_hotel',
      nombre: 'Caja Recepcion Hotel',
      tabla_actual: 'cash_closings',
      departamento_actual: 'recepcion',
      campos_comunes: CAMPOS_COMUNES,
      turnos: {
        manana: {
          nombre: 'Manana',
          campos_especificos: [
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'retiro_caja_fuerte',
            'fondo_caja_final'
          ],
          campos_obligatorios: [
            'fecha',
            'empleado_responsable',
            'turno',
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'fondo_caja_final'
          ]
        },
        tarde: {
          nombre: 'Tarde',
          campos_especificos: [
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'retiro_caja_fuerte',
            'fondo_caja_final'
          ],
          campos_obligatorios: [
            'fecha',
            'empleado_responsable',
            'turno',
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'fondo_caja_final'
          ]
        },
        noche: {
          nombre: 'Noche',
          campos_especificos: [
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'stripe_web_hotel',
            'stripe_mews',
            'transferencias_banco',
            'transferencias_mews',
            'room_charge_recibido_mews',
            'pensiones_desayuno_mews',
            'pensiones_comida_mews',
            'cargo_alexander_confirmado',
            'cargos_syncrolab_mews',
            'diferencias_detectadas',
            'retiro_caja_fuerte',
            'fondo_caja_final'
          ],
          campos_obligatorios: [
            'fecha',
            'empleado_responsable',
            'turno',
            'efectivo_real_contado',
            'efectivo_mews',
            'tpv_real',
            'tpv_mews',
            'stripe_web_hotel',
            'stripe_mews',
            'fondo_caja_final'
          ]
        }
      }
    },

    recepcion_syncrolab: {
      id: 'recepcion_syncrolab',
      nombre: 'Caja Recepcion SYNCROLAB',
      tabla_actual: 'cash_closings',
      departamento_actual: 'recepcion_syncrolab',
      campos_comunes: CAMPOS_COMUNES,
      turnos: {
        manana: {
          nombre: 'Manana',
          campos_especificos: [
            'efectivo_training_real',
            'efectivo_flyby',
            'tpv_total_real',
            'tpv_flyby_nubimed',
            'efectivo_clinica_real',
            'efectivo_nubimed',
            'retiro_caja_fuerte',
            'fondo_caja_final'
          ],
          campos_obligatorios: [
            'fecha',
            'empleado_responsable',
            'turno',
            'efectivo_training_real',
            'efectivo_flyby',
            'tpv_total_real',
            'tpv_flyby_nubimed',
            'efectivo_clinica_real',
            'efectivo_nubimed',
            'fondo_caja_final'
          ]
        },
        tarde: {
          nombre: 'Tarde',
          campos_especificos: [
            'efectivo_training_real',
            'efectivo_flyby',
            'tpv_total_real',
            'tpv_flyby_nubimed',
            'stripe_web_syncrolab',
            'stripe_flyby',
            'stripe_nubimed',
            'efectivo_clinica_real',
            'efectivo_nubimed',
            'cargo_mews_flyby',
            'cargo_mews_nubimed',
            'retiro_caja_fuerte',
            'fondo_caja_final'
          ],
          campos_obligatorios: [
            'fecha',
            'empleado_responsable',
            'turno',
            'efectivo_training_real',
            'efectivo_flyby',
            'tpv_total_real',
            'tpv_flyby_nubimed',
            'stripe_web_syncrolab',
            'stripe_flyby',
            'stripe_nubimed',
            'efectivo_clinica_real',
            'efectivo_nubimed',
            'fondo_caja_final'
          ]
        }
      }
    }
  };

  var CONCILIACIONES = {
    sala_recepcion_hotel: {
      nombre: 'Sala ↔ Recepcion Hotel',
      origen: 'sala',
      destino: 'recepcion_hotel',
      campos: [
        ['room_charge_declarado', 'room_charge_recibido_mews'],
        ['pensiones_desayuno_ticadas', 'pensiones_desayuno_mews'],
        ['pensiones_comida_ticadas', 'pensiones_comida_mews'],
        ['cargo_alexander_declarado', 'cargo_alexander_confirmado']
      ]
    },
    syncrolab_recepcion_hotel: {
      nombre: 'SYNCROLAB ↔ Recepcion Hotel',
      origen: 'recepcion_syncrolab',
      destino: 'recepcion_hotel',
      campos: [
        ['cargo_mews_flyby', 'cargos_syncrolab_mews'],
        ['cargo_mews_nubimed', 'cargos_syncrolab_mews']
      ]
    },
    stripe_web_hotel_mews: {
      nombre: 'Stripe Web Hotel ↔ MEWS',
      origen: 'stripe_web_hotel',
      confirmado: 'stripe_mews'
    },
    stripe_web_sala_posmews: {
      nombre: 'Stripe Web Sala ↔ POSMEWS',
      origen: 'stripe_real',
      confirmado: 'stripe_posmews'
    },
    stripe_web_syncrolab_flyby_nubimed: {
      nombre: 'Stripe Web SYNCROLAB ↔ Flyby + Nubimed',
      origen: 'stripe_web_syncrolab',
      confirmado: ['stripe_flyby', 'stripe_nubimed']
    }
  };

  function toNumber(valor) {
    var n = parseFloat(valor);
    return isNaN(n) ? 0 : n;
  }

  function calcularDiferencia(origen, confirmado) {
    var origenTotal = Array.isArray(origen)
      ? origen.reduce(function(total, valor) { return total + toNumber(valor); }, 0)
      : toNumber(origen);
    var confirmadoTotal = Array.isArray(confirmado)
      ? confirmado.reduce(function(total, valor) { return total + toNumber(valor); }, 0)
      : toNumber(confirmado);
    return origenTotal - confirmadoTotal;
  }

  function calcularEstadoConciliacion(origen, confirmado) {
    var diferencia = calcularDiferencia(origen, confirmado);
    if (Math.abs(diferencia) < 0.01) return 'cuadrado';
    return diferencia > 0 ? 'sobrante' : 'faltante';
  }

  function formatEuro(valor) {
    return (toNumber(valor)).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  function normalizarTurno(turno) {
    var t = String(turno || '').toLowerCase();
    if (t === 'mañana' || t === 'manana') return 'manana';
    if (t === 'tarde') return 'tarde';
    if (t === 'noche') return 'noche';
    return t;
  }

  function getConfigCaja(cajaTipo, turno) {
    var cfg = CAJAS_TIPOS[cajaTipo];
    if (!cfg) return null;
    if (!cfg.turnos) return cfg;
    var turnoKey = normalizarTurno(turno);
    return cfg.turnos[turnoKey] || null;
  }

  function validarCamposObligatorios(cajaTipo, datos) {
    datos = datos || {};
    var tipoCfg = CAJAS_TIPOS[cajaTipo];
    if (!tipoCfg) {
      return {
        ok: false,
        faltantes: [],
        errores: ['Tipo de caja no configurado: ' + cajaTipo]
      };
    }

    var cfg = getConfigCaja(cajaTipo, datos.turno) || tipoCfg;
    var obligatorios = cfg.campos_obligatorios || tipoCfg.campos_obligatorios || [];
    var faltantes = obligatorios.filter(function(campo) {
      return datos[campo] === undefined || datos[campo] === null || datos[campo] === '';
    });

    return {
      ok: faltantes.length === 0,
      faltantes: faltantes,
      errores: faltantes.map(function(campo) { return 'Campo obligatorio: ' + campo; })
    };
  }

  function calcularDiferenciaFisicaCaja(args) {
    args = args || {};
    return toNumber(args.efectivoReal) - toNumber(args.fondoFinal) - toNumber(args.retiro);
  }

  function calcularDiferenciaSistemaCaja(args) {
    args = args || {};
    return toNumber(args.efectivoSistema) - toNumber(args.retiro) - (toNumber(args.fondoFinal) - toNumber(args.fondoInicial));
  }

  function calcularEstadoCaja(args) {
    args = args || {};
    var otras = Array.isArray(args.otrasDiferencias) ? args.otrasDiferencias : [args.otrasDiferencias || 0];
    var hasDiff = Math.abs(toNumber(args.diferenciaFisica)) >= 0.01
      || Math.abs(toNumber(args.diferenciaSistema)) >= 0.01
      || otras.some(function(dif) { return Math.abs(toNumber(dif)) >= 0.01; });
    return hasDiff ? 'Revisar' : 'OK';
  }

  function getRecordSortValue(row) {
    var fecha = row && row.fecha ? String(row.fecha) : '';
    var ts = row && (row.created_at || row.updated_at || row.validado_ts || '') ? String(row.created_at || row.updated_at || row.validado_ts || '') : '';
    return fecha + 'T' + ts;
  }

  function getPreviousCashRecord(rows, options) {
    options = options || {};
    rows = Array.isArray(rows) ? rows.slice() : [];
    var finalFundField = options.finalFundField || 'fondo_final';
    var department = options.department;
    var excludeId = options.excludeId;

    return rows.filter(function(row) {
      if (!row) return false;
      if (excludeId && row.id === excludeId) return false;
      if (department && row.departamento !== department) return false;
      return row[finalFundField] !== undefined && row[finalFundField] !== null && row[finalFundField] !== '';
    }).sort(function(a, b) {
      return getRecordSortValue(b).localeCompare(getRecordSortValue(a));
    })[0] || null;
  }

  function clearInitialFundAutomation(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.readOnly = false;
    delete input.dataset.autoFundLocked;
    delete input.dataset.autoFundOriginal;
    delete input.dataset.autoFundPreviousId;
    delete input.dataset.autoInitialFund;
    delete input.dataset.originalAutoValue;
    delete input.dataset.previousClosureId;
    delete input.dataset.unlockAuditOk;
    delete input.dataset.unlockReason;
    delete input.dataset.changeAuditLogged;
    var btn = document.getElementById(inputId + '-unlock-btn');
    if (btn) btn.remove();
  }

  function applyAutoInitialFund(options) {
    options = options || {};
    var input = document.getElementById(options.inputId);
    if (!input) return;
    var value = toNumber(options.value);
    clearInitialFundAutomation(options.inputId);
    input.value = value.toFixed(2);
    input.readOnly = true;
    input.dataset.autoFundLocked = '1';
    input.dataset.autoFundOriginal = String(value);
    input.dataset.autoFundPreviousId = options.previousId || '';
    input.dataset.autoInitialFund = '1';
    input.dataset.originalAutoValue = String(value);
    input.dataset.previousClosureId = options.previousId || '';

    var canUnlock = global.currentUser && (
      global.currentUser.rol === 'admin'
      || global.currentUser.rol === 'jefe_recepcion'
      || global.currentUser.validador === true
      || global.currentUser.validador === 1
    );
    if (!canUnlock) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = options.inputId + '-unlock-btn';
    btn.className = 'btn btn-secondary btn-sm';
    btn.style.marginTop = '6px';
    btn.textContent = 'Desbloquear fondo inicial';
    btn.onclick = async function() {
      var motivo = prompt('Motivo obligatorio para desbloquear fondo inicial:');
      if (!motivo || !motivo.trim()) {
        if (typeof global.toast === 'function') global.toast('Motivo obligatorio para desbloquear fondo inicial', 'err');
        return;
      }
      input.readOnly = false;
      input.dataset.unlockAuditOk = '1';
      input.dataset.unlockReason = motivo.trim();
      if (typeof global.auditLog === 'function') {
        await global.auditLog(
          'CAJA_FONDO_INICIAL_UNLOCK',
          (options.label || options.inputId) + ' — motivo: ' + motivo.trim()
            + ' — valor anterior: ' + value.toFixed(2)
            + ' — cierre anterior: ' + (options.previousId || 'sin id')
        );
      }
      if (typeof global.toast === 'function') global.toast('Fondo inicial desbloqueado para Admin', 'ok');
    };

    if (input.parentNode && !document.getElementById(btn.id)) input.parentNode.appendChild(btn);
  }

  function validateAutoInitialFundBeforeSave(inputId) {
    var input = document.getElementById(inputId);
    if (!input || (input.dataset.autoFundLocked !== '1' && input.dataset.autoInitialFund !== '1')) return true;
    var original = toNumber(input.dataset.autoFundOriginal || input.dataset.originalAutoValue);
    var current = toNumber(input.value);
    if (Math.abs(current - original) < 0.01) return true;
    if (input.dataset.unlockAuditOk === '1') return true;
    if (typeof global.toast === 'function') {
      global.toast('El fondo inicial viene del cierre anterior y no puede modificarse sin desbloqueo Admin y motivo.', 'err');
    }
    return false;
  }

  async function auditAutoInitialFundChange(inputId, label) {
    var input = document.getElementById(inputId);
    if (!input || (input.dataset.autoFundLocked !== '1' && input.dataset.autoInitialFund !== '1')) return true;
    var original = toNumber(input.dataset.autoFundOriginal || input.dataset.originalAutoValue);
    var current = toNumber(input.value);
    if (Math.abs(current - original) < 0.01) return true;
    if (input.dataset.unlockAuditOk !== '1') {
      if (typeof global.toast === 'function') {
        global.toast('El fondo inicial viene del cierre anterior y no puede modificarse sin desbloqueo Admin y motivo.', 'err');
      }
      return false;
    }
    if (input.dataset.changeAuditLogged === '1') return true;
    if (typeof global.auditLog === 'function') {
      await global.auditLog(
        'CAJA_FONDO_INICIAL_CHANGED',
        (label || inputId)
          + ' — usuario: ' + ((global.currentUser && global.currentUser.nombre) || '?')
          + ' — fecha/hora: ' + new Date().toISOString()
          + ' — valor original: ' + original.toFixed(2)
          + ' — valor nuevo: ' + current.toFixed(2)
          + ' — motivo: ' + (input.dataset.unlockReason || 'sin motivo')
          + ' — cierre anterior: ' + (input.dataset.autoFundPreviousId || input.dataset.previousClosureId || 'sin id')
      );
    }
    input.dataset.changeAuditLogged = '1';
    return true;
  }

  global.CAJAS_CONFIG = {
    version: 'fase-1',
    tipos: CAJAS_TIPOS,
    campos_comunes: CAMPOS_COMUNES,
    conciliaciones: CONCILIACIONES,
    helpers: {
      calcularDiferencia: calcularDiferencia,
      calcularEstadoConciliacion: calcularEstadoConciliacion,
      formatEuro: formatEuro,
      calcularDiferenciaFisicaCaja: calcularDiferenciaFisicaCaja,
      calcularDiferenciaSistemaCaja: calcularDiferenciaSistemaCaja,
      calcularEstadoCaja: calcularEstadoCaja,
      validarCamposObligatorios: validarCamposObligatorios,
      getConfigCaja: getConfigCaja,
      normalizarTurno: normalizarTurno,
      getPreviousCashRecord: getPreviousCashRecord,
      applyAutoInitialFund: applyAutoInitialFund,
      clearInitialFundAutomation: clearInitialFundAutomation,
      validateAutoInitialFundBeforeSave: validateAutoInitialFundBeforeSave,
      auditAutoInitialFundChange: auditAutoInitialFundChange
    }
  };
})(window);
