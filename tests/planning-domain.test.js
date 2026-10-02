import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_DATA,
  addDays,
  calculateSegments,
  calculateVacationConsumption,
  calculateVacationEntitlement,
  canEditPlanningDepartment,
  employeeBelongsToPlanningDepartment,
  mondayOfWeek,
  planningCapabilities,
  publicationReadiness,
  validateExtraRecoveryAction,
  validateWeekDraft,
  withinAbsenceCorrectionWindow,
  weekDates
} from '../lib/planning-domain.js';

test('normaliza la semana de lunes a domingo', () => {
  assert.equal(mondayOfWeek('2026-09-29'), '2026-09-28');
  assert.deepEqual(weekDates('2026-09-28'), [
    '2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'
  ]);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('calcula tramos partidos y turnos que cruzan medianoche', () => {
  const result = calculateSegments([
    { inicio:'2026-10-01T06:00:00Z', fin:'2026-10-01T10:00:00Z', bitrix_shift_id:'A' },
    { inicio:'2026-10-01T16:00:00Z', fin:'2026-10-01T20:00:00Z', bitrix_shift_id:'B' }
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.minutes, 480);

  const overnight = calculateSegments([
    { inicio:'2026-10-01T21:00:00Z', fin:'2026-10-02T05:00:00Z', bitrix_shift_id:'N' }
  ]);
  assert.equal(overnight.valid, true);
  assert.equal(overnight.minutes, 480);
});

test('bloquea solapes y duraciones diarias imposibles', () => {
  const overlap = calculateSegments([
    { inicio:'2026-10-01T08:00:00Z', fin:'2026-10-01T13:00:00Z' },
    { inicio:'2026-10-01T12:00:00Z', fin:'2026-10-01T16:00:00Z' }
  ]);
  assert.equal(overlap.valid, false);
  assert.ok(overlap.errors.includes('TRAMOS_SOLAPADOS'));
});

test('prorratea vacaciones desde la fecha real de contrato', () => {
  assert.equal(calculateVacationEntitlement({
    conventionId:'hosteleria_alicante', year:2026, contractStart:'2026-07-01'
  }), 15.63);
  assert.equal(calculateVacationEntitlement({
    conventionId:'instalaciones_deportivas_estatal', year:2024, contractStart:'2024-07-01'
  }), 11.56);
  assert.equal(calculateVacationEntitlement({
    conventionId:'desconocido', year:2026, contractStart:'2026-01-01'
  }), NO_DATA);
});

test('distingue vacaciones naturales y laborables', () => {
  assert.equal(calculateVacationConsumption({
    conventionId:'hosteleria_alicante', startDate:'2026-10-01', endDate:'2026-10-07'
  }), 7);
  assert.equal(calculateVacationConsumption({
    conventionId:'instalaciones_deportivas_estatal', startDate:'2026-10-01', endDate:'2026-10-07',
    workingDates:['2026-10-01','2026-10-02','2026-10-05','2026-10-06','2026-10-07','2026-10-07']
  }), 5);
  assert.equal(calculateVacationConsumption({
    conventionId:'instalaciones_deportivas_estatal', startDate:'2026-10-01', endDate:'2026-10-07'
  }), NO_DATA);
});

test('aplica ventana retrospectiva exacta de 28 días', () => {
  assert.equal(withinAbsenceCorrectionWindow('2026-09-01', '2026-09-29'), true);
  assert.equal(withinAbsenceCorrectionWindow('2026-08-31', '2026-09-29'), false);
  assert.equal(withinAbsenceCorrectionWindow('2026-09-30', '2026-09-29'), false);
});

test('resuelve ámbitos equivalentes de departamento', () => {
  assert.equal(employeeBelongsToPlanningDepartment({area:'Friegue'}, 'Cocina'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'Limpieza'}, 'Housekeeping'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'SYNCROLAB',puesto:'Entrenador(a)'}, 'Entrenadores'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'SYNCROLAB',puesto:'Fisioterapeuta'}, 'Fisioterapeutas'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'SYNCROLAB',puesto:'Atención al Cliente'}, 'Recepción SYNCROLAB'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'Administración',puesto:'Técnico de Recursos Humanos'}, 'RRHH'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'Administración',puesto:'Contable'}, 'C&C'), true);
  assert.equal(employeeBelongsToPlanningDepartment({area:'SYNCROLAB',puesto:'Entrenador(a)'}, 'Recepción SYNCROLAB'), false);
  assert.equal(employeeBelongsToPlanningDepartment({area:'Marketing'}, 'Cocina'), false);
  assert.equal(canEditPlanningDepartment({rol:'jefe', validador:1}, 'Cocina', ['Cocina','Friegue']), true);
  assert.equal(canEditPlanningDepartment({rol:'empleado', validador:0}, 'Cocina', ['Cocina']), false);
  assert.equal(planningCapabilities({rol:'tecnico_rrhh'}).canEditGlobally, true);
});

test('impide autoasignación, autoaprobación y protege a responsables', () => {
  const actor = {id:'10'};
  assert.deepEqual(validateExtraRecoveryAction({
    actor, target:{id:'10'}, approver:actor, targetIsManager:false, angelicaEmployeeId:'99'
  }).errors, ['AUTOASIGNACION_PROHIBIDA','AUTOAPROBACION_PROHIBIDA']);
  assert.ok(validateExtraRecoveryAction({
    actor, target:{id:'20'}, approver:null, targetIsManager:true, angelicaEmployeeId:'99'
  }).errors.includes('JEFE_SOLO_GESTIONABLE_POR_ANGELICA'));
  assert.equal(validateExtraRecoveryAction({
    actor:{id:'99'}, target:{id:'20'}, approver:null, targetIsManager:true, angelicaEmployeeId:'99'
  }).valid, true);
});

test('valida empleado, catálogo departamental y cada tramo oficial', () => {
  const validation = validateWeekDraft({
    weekStart:'2026-09-28', department:'Cocina',
    employees:[{id:'1',area:'Friegue',estado:'Activo',bitrix_user_id:'B1'}],
    conditions:[{empleado_id:'1'}],
    catalog:[
      {id:100,bitrix_schedule_id:55,bitrix_shift_id:'A',departamento_id:'Cocina',activo:true},
      {id:101,bitrix_schedule_id:55,bitrix_shift_id:'B',departamento_id:'Cocina',activo:true}
    ],
    assignments:[{
      empleado_id:'1', fecha_operativa:'2026-09-28', tipo_dia:'turno', turno_catalogo_id:100,
      tramos:[
        {inicio:'2026-09-28T06:00:00Z',fin:'2026-09-28T10:00:00Z',bitrix_shift_id:'A'},
        {inicio:'2026-09-28T16:00:00Z',fin:'2026-09-28T20:00:00Z',bitrix_shift_id:'B'}
      ]
    }]
  });
  assert.equal(validation.valid, true);
});

test('bloquea empleado de otro departamento y tramo ajeno', () => {
  const validation = validateWeekDraft({
    weekStart:'2026-09-28', department:'Cocina',
    employees:[{id:'1',area:'Marketing',estado:'Activo',bitrix_user_id:'B1'}], conditions:[],
    catalog:[{id:100,bitrix_schedule_id:55,bitrix_shift_id:'A',departamento_id:'Cocina',activo:true}],
    assignments:[{empleado_id:'1',fecha_operativa:'2026-09-28',tipo_dia:'turno',turno_catalogo_id:100,
      tramos:[{inicio:'2026-09-28T06:00:00Z',fin:'2026-09-28T14:00:00Z',bitrix_shift_id:'X'}]}]
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(item => item.code === 'EMPLEADO_OTRO_DEPARTAMENTO'));
  assert.ok(validation.errors.some(item => item.code === 'TRAMO_TURNO_NO_DISPONIBLE'));
  assert.ok(validation.warnings.some(item => item.code === 'CONDICION_LABORAL_NO_DATA'));
});

test('publicación permanece bloqueada sin escritura oficial ShiftPlan', () => {
  assert.deepEqual(publicationReadiness({
    validation:{valid:true}, catalogFresh:true, bitrixWriteSupported:false, assignments:[{}]
  }), {ready:false, blockers:['BITRIX_SHIFTPLAN_WRITE_NO_SOPORTADO']});
});
