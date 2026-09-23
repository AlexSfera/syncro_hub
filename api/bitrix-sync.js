// ═══════════════════════════════════════════════════════════════════════
// /api/bitrix-sync.js — Sincronización Bitrix24 Timeman → SYNCRO SHIFT
// v4 (Sep 2026) — ACTUALIZACIÓN CONTINUA + TRAZABILIDAD DE CAMBIOS.
//
// PRINCIPIO (decisión CEO Jul 2026):
//   · El turno MANUAL de SYNCRO SHIFT es la fuente de verdad operativa.
//   · Bitrix24 es la fuente de verdad de horas trabajadas.
//   · La integración PRIMERO asocia horas a un turno manual existente.
//   · Si NO hay turno manual → CREA un turno mínimo (id=BXAUTO_*, estado
//     Pendiente) para que las horas Bitrix no se pierdan. El empleado
//     completa los datos operativos (checklist, gestión, incidencia) vía
//     la ventana de gracia de 1 día en la app.
//   · El turno es la unidad operativa central: cero duplicados.
//
// LÓGICA:
//   1. Lee employees.bitrix_user_id IS NOT NULL desde Supabase
//   2. Por cada empleado: pide timeman.record.list del rango objetivo (Bitrix V3)
//   3. Convierte startTime a Europe/Madrid → deduce fecha_operativa + servicio
//   4. Crea o ACTUALIZA intervalos raw en bitrix_time_records. Si Bitrix24
//      cambia entrada, salida, duración, pausa o aprobación, el registro se
//      marca para reconciliación y se guarda el antes/después en audit_log.
//   5. PASE DE ASOCIACIÓN: comprueba todos los grupos del rango y
//        · conserva el vínculo válido existente
//        · busca turnos MANUALES del empleado en la MISMA fecha operativa
//          (excluye id 'BXSH_%', 'BXAUTO_%' y estado 'Sin declarar')
//        · coincidencia válida: |cierre Bitrix − hora_registro del turno| ≤ 1h
//        · 1 candidato  → PATCH turno: horas + referencia Bitrix
//                          (NUNCA toca checklist, KPIs, estado, declaraciones)
//                          y marca registros sync_status='matched'
//        · >1 candidato → sync_status='ambiguous' (revisión Admin)
//        · 0 candidatos → AUTO-CREA turno mínimo (BXAUTO_*) con horas
//                          Bitrix, marca registros sync_status='matched'.
//                          El empleado lo completa desde la app con gracia 1d.
//   6. Escribe audit_log de cada alta, cambio, actualización de turno y error.
//
// TRIGGERS:
//   · Vercel Cron frecuente + revisión histórica diaria (vercel.json)
//   · Manual: POST /api/bitrix-sync?modo=range&fecha=YYYY-MM-DD con header
//     Authorization: Bearer <CRON_SECRET>   (añade &dry_run=1 para simular)
//
// VARIABLES DE ENTORNO REQUERIDAS (Vercel Project Settings):
//   BITRIX_WEBHOOK       — URL completa del webhook Bitrix
//   SUPABASE_URL         — https://tsfhrpdpbkciofvejrao.supabase.co
//   SUPABASE_SERVICE_KEY — service_role key (NO la publishable/anon)
//   CRON_SECRET          — 16+ chars aleatorios
//
// REQUIERE (una vez): ejecutar migracion_bitrix_merge.sql en Supabase.
// ═══════════════════════════════════════════════════════════════════════

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BITRIX_WEBHOOK       = process.env.BITRIX_WEBHOOK;
const CRON_SECRET          = process.env.CRON_SECRET;

const MADRID_TZ   = 'Europe/Madrid';
const TOLERANCIA_MS = 60 * 60 * 1000; // ±1 hora (decisión CEO)
const FAST_LOOKBACK_DAYS = 45;
const FULL_LOOKBACK_DAYS = 400;
const MAX_LOOKBACK_DAYS  = 800;
const AUDIT_ACTOR = 'system_bitrix_sync';

const RAW_SOURCE_FIELDS = [
  'bitrix_record_id', 'bitrix_user_id', 'employee_id', 'start_ts', 'end_ts',
  'duration_seconds', 'break_length', 'is_approved', 'fecha_operativa', 'servicio'
];

// ─── VÍNCULOS EXPLÍCITOS SYNCRO SHIFT ↔ BITRIX (decisión CEO Jul 2026) ──
// El empleado 'BOSS' de SYNCRO SHIFT es 'Alexander Kolobnev' en Bitrix24.
// En cada ejecución, si el empleado existe y aún no tiene bitrix_user_id,
// se busca su usuario en Bitrix (user.get) y se escribe el vínculo en
// employees.bitrix_user_id automáticamente (sin SQL manual).
const EMPLOYEE_BITRIX_LINKS = [
  { syncro_nombre: 'BOSS', bitrix_name: 'Alexander', bitrix_last_name: 'Kolobnev' }
];

// ─── HELPERS TIMEZONE MADRID ──────────────────────────────────────────
function nowMadridTs() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(d);
  const g = k => parts.find(p => p.type === k).value;
  const madridStr = `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;
  const madridAsUtc = new Date(madridStr + 'Z');
  const offMin = Math.round((madridAsUtc.getTime() - d.getTime()) / 60000);
  const sign = offMin >= 0 ? '+' : '-';
  const oh = String(Math.floor(Math.abs(offMin) / 60)).padStart(2, '0');
  const om = String(Math.abs(offMin) % 60).padStart(2, '0');
  return `${madridStr}${sign}${oh}:${om}`;
}

function toMadridParts(isoStr) {
  const d = new Date(isoStr);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false
  }).formatToParts(d);
  const g = k => parts.find(p => p.type === k).value;
  return {
    fechaMadrid: `${g('year')}-${g('month')}-${g('day')}`,
    horaMadrid:  parseInt(g('hour'), 10),
    minMadrid:   parseInt(g('minute'), 10)
  };
}

function deducirServicioYFecha(isoStr) {
  const { fechaMadrid, horaMadrid } = toMadridParts(isoStr);
  if (horaMadrid >= 5 && horaMadrid < 15) return { servicio: 'Mañana', fecha: fechaMadrid };
  if (horaMadrid >= 15 && horaMadrid < 23) return { servicio: 'Tarde',  fecha: fechaMadrid };
  if (horaMadrid >= 23) return { servicio: 'Noche', fecha: fechaMadrid };
  const [y, m, d] = fechaMadrid.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d));
  prev.setUTCDate(prev.getUTCDate() - 1);
  const py = prev.getUTCFullYear();
  const pm = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const pd = String(prev.getUTCDate()).padStart(2, '0');
  return { servicio: 'Noche', fecha: `${py}-${pm}-${pd}` };
}

function rangoBitrixParaIntervalo(desde, hasta) {
  const [y, m, d] = desde.split('-').map(Number);
  const [hy, hm, hd] = hasta.split('-').map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d, -6, 0, 0));
  const fin    = new Date(Date.UTC(hy, hm - 1, hd + 1, 5, 0, 0));
  const fmt = dt => dt.toISOString().replace(/\.\d+Z$/, '+00:00');
  return { inicio: fmt(inicio), fin: fmt(fin) };
}

function ymdShift(fechaYmd, deltaDias) {
  const [y, m, d] = fechaYmd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDias);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function todayMadridYmd() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MADRID_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function validYmd(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function inYmdRange(value, desde, hasta) {
  return value >= desde && value <= hasta;
}

function canonicalTs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : String(value);
}

function comparableRaw(row) {
  return {
    bitrix_record_id: String(row.bitrix_record_id),
    bitrix_user_id: String(row.bitrix_user_id),
    employee_id: String(row.employee_id),
    start_ts: canonicalTs(row.start_ts),
    end_ts: canonicalTs(row.end_ts),
    duration_seconds: Number(row.duration_seconds || 0),
    break_length: row.break_length == null || Number(row.break_length) === 0
      ? null
      : Number(row.break_length),
    is_approved: !!row.is_approved,
    fecha_operativa: String(row.fecha_operativa || ''),
    servicio: String(row.servicio || '')
  };
}

function changedRawFields(before, after) {
  const a = comparableRaw(before);
  const b = comparableRaw(after);
  return RAW_SOURCE_FIELDS.reduce((out, field) => {
    if (a[field] !== b[field]) out[field] = { before: a[field], after: b[field] };
    return out;
  }, {});
}

function auditRow(action, detail) {
  return {
    id: 'AL_BX_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
    ts: nowMadridTs(),
    usuario: AUDIT_ACTOR,
    rol: 'system',
    action,
    detail: typeof detail === 'string' ? detail : JSON.stringify(detail)
  };
}

// ─── BITRIX V3 ────────────────────────────────────────────────────────
async function bitrixV3(metodo, params) {
  const url = BITRIX_WEBHOOK.replace('/rest/', '/rest/api/') + '/' + metodo;
  const results = [];
  let page = 1;

  async function fetchWithRetry(body, attempt = 0) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.status >= 500 && attempt < 1) {
        await new Promise(res => setTimeout(res, 1500));
        return fetchWithRetry(body, attempt + 1);
      }
      return r;
    } catch (e) {
      if (attempt < 1) {
        await new Promise(res => setTimeout(res, 1500));
        return fetchWithRetry(body, attempt + 1);
      }
      throw e;
    }
  }

  while (true) {
    const body = Object.assign({}, params || {}, { pagination: { page, limit: 50 } });
    const r = await fetchWithRetry(body);
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Bitrix ${metodo} HTTP ${r.status}: ${txt.slice(0, 300)}`);
    }
    const data = await r.json();
    if (data.error) throw new Error(`Bitrix ${metodo} error: ${JSON.stringify(data.error)}`);
    const items = (data.result && data.result.items) || [];
    results.push(...items);
    if (items.length < 50) break;
    page++;
    if (page > 40) break; // safety cap
  }
  return results;
}

// ─── BITRIX REST CLÁSICO (webhook v2: user.get, etc.) ─────────────────
async function bitrixV2(metodo, params) {
  const base = BITRIX_WEBHOOK.replace(/\/+$/, '');
  const r = await fetch(base + '/' + metodo, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {})
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Bitrix ${metodo} HTTP ${r.status}: ${txt.slice(0, 300)}`);
  }
  const data = await r.json();
  if (data.error) throw new Error(`Bitrix ${metodo} error: ${JSON.stringify(data.error)}`);
  return data.result;
}

// ─── AUTO-VÍNCULO employees.bitrix_user_id ────────────────────────────
// Para cada entrada de EMPLOYEE_BITRIX_LINKS: si el empleado existe en
// SYNCRO SHIFT y no tiene bitrix_user_id, localiza el usuario en Bitrix
// por nombre+apellido (user.get) y escribe el vínculo. Idempotente.
// Falla en silencio controlado (se reporta en 'errores', no bloquea el sync).
async function autoLinkEmployees(DRY_RUN, errores) {
  let linked = 0;
  for (const link of EMPLOYEE_BITRIX_LINKS) {
    try {
      const emps = await sb('GET',
        'employees?nombre=eq.' + encodeURIComponent(link.syncro_nombre)
        + '&select=id,nombre,bitrix_user_id,estado'
      );
      const emp = (emps || []).find(e => e.estado !== 'Baja');
      if (!emp) { errores.push({ link: link.syncro_nombre, error: 'empleado no encontrado en SYNCRO SHIFT' }); continue; }
      if (emp.bitrix_user_id != null && emp.bitrix_user_id !== '') continue; // ya vinculado

      const users = await bitrixV2('user.get', {
        FILTER: { NAME: link.bitrix_name, LAST_NAME: link.bitrix_last_name, ACTIVE: true }
      });
      const arr = Array.isArray(users) ? users : [];
      if (arr.length !== 1) {
        errores.push({ link: link.syncro_nombre, error: 'user.get devolvió ' + arr.length + ' usuarios para ' + link.bitrix_name + ' ' + link.bitrix_last_name + ' (se requiere exactamente 1)' });
        continue;
      }
      if (!DRY_RUN) {
        await sb('PATCH', 'employees?id=eq.' + encodeURIComponent(emp.id),
          { bitrix_user_id: arr[0].ID },
          { 'Prefer': 'return=minimal' });
        try {
          await sb('POST', 'audit_log', {
            id: 'AL_BXLINK_' + Date.now(),
            ts: nowMadridTs(),
            usuario: 'system_bitrix_sync',
            rol: 'system',
            action: 'BITRIX_LINK',
            detail: emp.nombre + ' (' + emp.id + ') vinculado a Bitrix user ' + arr[0].ID + ' (' + link.bitrix_name + ' ' + link.bitrix_last_name + ')'
          }, { 'Prefer': 'return=minimal' });
        } catch (_) {}
      }
      linked++;
    } catch (e) {
      errores.push({ link: link.syncro_nombre, error: String(e.message || e).slice(0, 200) });
    }
  }
  return linked;
}

// ─── SUPABASE ─────────────────────────────────────────────────────────
async function sb(method, path, body, extraHeaders) {
  const url = SUPABASE_URL + '/rest/v1/' + path;
  const headers = Object.assign({
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
    'Content-Type':  'application/json'
  }, extraHeaders || {});
  const opts = { method, headers };
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Supabase ${method} ${path} HTTP ${r.status}: ${txt.slice(0, 300)}`);
  }
  if (r.status === 204) return null;
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function sbAll(path, pageSize = 1000) {
  const all = [];
  let offset = 0;
  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const page = await sb('GET', path + sep + `limit=${pageSize}&offset=${offset}`) || [];
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function flushAudit(events) {
  if (!events.length) return;
  for (let i = 0; i < events.length; i += 100) {
    await sb('POST', 'audit_log', events.slice(i, i + 100), { 'Prefer': 'return=minimal' });
  }
}

// ─── PASE DE ASOCIACIÓN ───────────────────────────────────────────────
// Revisa todos los grupos del rango, incluidos los ya asociados. Así corrige
// tanto cambios nuevos de Bitrix24 como divergencias históricas en shifts.
async function paseAsociacion(desde, hasta, DRY_RUN, projectedById, employeesById, auditEvents) {
  const records = await sbAll(
    'bitrix_time_records?fecha_operativa=gte.' + desde
    + '&fecha_operativa=lte.' + hasta
    + '&end_ts=not.is.null'
    + '&select=id,bitrix_record_id,employee_id,start_ts,end_ts,duration_seconds,fecha_operativa,servicio,sync_status,matched_shift_id,sync_error'
    + '&order=start_ts.asc'
  );

  const recordMap = new Map(records.map(row => [String(row.id), row]));
  for (const [id, projected] of projectedById.entries()) {
    if (!inYmdRange(projected.fecha_operativa, desde, hasta)) continue;
    recordMap.set(id, Object.assign({}, recordMap.get(id) || {}, projected));
  }

  const grupos = new Map();
  for (const row of recordMap.values()) {
    if (!row.end_ts || !inYmdRange(row.fecha_operativa, desde, hasta)) continue;
    const key = row.employee_id + '|' + row.fecha_operativa;
    if (!grupos.has(key)) grupos.set(key, { employee_id: row.employee_id, fecha: row.fecha_operativa, recs: [] });
    grupos.get(key).recs.push(row);
  }
  for (const group of grupos.values()) {
    group.recs.sort((a, b) => new Date(a.start_ts) - new Date(b.start_ts));
  }

  const shifts = await sbAll(
    'shifts?fecha=gte.' + ymdShift(desde, -1)
    + '&fecha=lte.' + ymdShift(hasta, 1)
    + '&select=id,employee_id,nombre,fecha,servicio,estado,horas,horas_bitrix,horas_source,hora_registro,created_at,bitrix_shift_id,bitrix_started_at,bitrix_closed_at,bitrix_duration_minutes'
  );
  const shiftById = new Map(shifts.map(row => [String(row.id), row]));
  const shiftsByEmployee = new Map();
  for (const shift of shifts) {
    const key = String(shift.employee_id);
    if (!shiftsByEmployee.has(key)) shiftsByEmployee.set(key, []);
    shiftsByEmployee.get(key).push(shift);
  }

  let matched = 0;
  let updated = 0;
  let ambiguous = 0;
  let stillPending = 0;
  let autoCreated = 0;
  const detalles = [];

  for (const group of grupos.values()) {
    const recordIds = group.recs.map(row => String(row.id));
    const bitrixIds = group.recs.map(row => String(row.bitrix_record_id)).join(',');
    try {
      const totalSeg = group.recs.reduce((sum, row) => sum + (Number(row.duration_seconds) || 0), 0);
      const horasBx = Math.round(totalSeg / 36) / 100;
      const cierreBx = Math.max(...group.recs.map(row => new Date(row.end_ts).getTime()));
      if (!Number.isFinite(cierreBx) || totalSeg <= 0) {
        stillPending += group.recs.length;
        continue;
      }

      const linkedIds = [...new Set(group.recs.map(row => row.matched_shift_id).filter(Boolean).map(String))];
      let selected = null;
      let selectionReason = 'manual_match';
      if (linkedIds.length === 1) {
        const linked = shiftById.get(linkedIds[0]);
        if (linked && String(linked.employee_id) === String(group.employee_id) && linked.fecha === group.fecha) {
          selected = linked;
          selectionReason = 'existing_link';
        }
      }

      const autoId = 'BXAUTO_' + String(group.employee_id).replace(/[^a-zA-Z0-9]/g, '_')
                   + '_' + group.fecha.replace(/-/g, '');
      if (!selected && shiftById.has(autoId)) {
        selected = shiftById.get(autoId);
        selectionReason = 'existing_auto';
      }

      const employeeShifts = shiftsByEmployee.get(String(group.employee_id)) || [];
      const candidates = employeeShifts.filter(shift => {
        if (shift.fecha !== group.fecha || shift.estado === 'Sin declarar') return false;
        if (String(shift.id).startsWith('BXAUTO_') || String(shift.id).startsWith('BXSH_')) return false;
        const ref = shift.hora_registro || shift.created_at;
        const refMs = ref ? new Date(ref).getTime() : NaN;
        return Number.isFinite(refMs) && Math.abs(refMs - cierreBx) <= TOLERANCIA_MS;
      });

      if (!selected && candidates.length > 1) {
        const error = 'multiple_manual_shift_candidates: ' + candidates.map(item => item.id).join(',');
        const needsStatus = group.recs.some(row => row.sync_status !== 'ambiguous' || row.sync_error !== error);
        if (!DRY_RUN && needsStatus) {
          await sb('PATCH', `bitrix_time_records?id=in.(${recordIds.join(',')})`, {
            sync_status: 'ambiguous', sync_error: error
          }, { 'Prefer': 'return=minimal' });
          auditEvents.push(auditRow('BITRIX_SYNC_AMBIGUOUS', {
            employee_id: group.employee_id, fecha_operativa: group.fecha,
            bitrix_record_ids: bitrixIds, candidates: candidates.map(item => item.id)
          }));
        }
        ambiguous++;
        detalles.push(`ambiguous ${group.employee_id} ${group.fecha}`);
        continue;
      }

      if (!selected && candidates.length === 1) selected = candidates[0];

      if (!selected) {
        const emp = employeesById.get(String(group.employee_id));
        if (!emp) {
          stillPending += group.recs.length;
          continue;
        }
        const nowTs = nowMadridTs();
        const autoShift = {
          id: autoId,
          employee_id: emp.id,
          nombre: emp.nombre || '',
          puesto: emp.puesto || '',
          area: emp.area || '',
          fecha: group.fecha,
          servicio: (group.recs[0] && group.recs[0].servicio) || 'Mañana',
          horas: horasBx,
          horas_bitrix: horasBx,
          horas_source: 'bitrix',
          estado: 'Pendiente',
          responsable_id: null,
          responsable_nombre: '',
          follow_up: 'no',
          merma_declarada: 'no',
          incidencia_declarada: 'no',
          observacion: 'Turno auto-creado por bitrix-sync (sin turno manual registrado)',
          bitrix_shift_id: bitrixIds,
          bitrix_started_at: group.recs[0].start_ts,
          bitrix_closed_at: group.recs[group.recs.length - 1].end_ts,
          bitrix_duration_minutes: Math.round(totalSeg / 60),
          bitrix_synced_at: nowTs,
          created_at: nowTs
        };
        if (!DRY_RUN) {
          await sb('POST', 'shifts', autoShift, { 'Prefer': 'resolution=ignore-duplicates,return=minimal' });
          auditEvents.push(auditRow('BITRIX_SHIFT_CREATED', {
            shift_id: autoId, employee_id: group.employee_id, fecha_operativa: group.fecha,
            bitrix_record_ids: bitrixIds, horas: horasBx,
            previous_linked_shift_ids: linkedIds
          }));
        }
        selected = autoShift;
        autoCreated++;
        selectionReason = linkedIds.length ? 'invalid_previous_link_repaired' : 'auto_created';
        shiftById.set(autoId, autoShift);
      }

      const desired = {
        horas: horasBx,
        horas_bitrix: horasBx,
        horas_source: 'bitrix',
        bitrix_shift_id: bitrixIds,
        bitrix_started_at: group.recs[0].start_ts,
        bitrix_closed_at: group.recs[group.recs.length - 1].end_ts,
        bitrix_duration_minutes: Math.round(totalSeg / 60)
      };
      const shiftDiff = {};
      for (const field of Object.keys(desired)) {
        const before = selected[field];
        const after = desired[field];
        const equal = field === 'horas' || field === 'horas_bitrix' || field === 'bitrix_duration_minutes'
          ? Math.abs(Number(before || 0) - Number(after || 0)) < 0.005
          : (field === 'bitrix_started_at' || field === 'bitrix_closed_at')
            ? canonicalTs(before) === canonicalTs(after)
            : String(before == null ? '' : before) === String(after == null ? '' : after);
        if (!equal) shiftDiff[field] = { before: before == null ? null : before, after };
      }

      if (Object.keys(shiftDiff).length && !DRY_RUN && selectionReason !== 'auto_created' && selectionReason !== 'invalid_previous_link_repaired') {
        const patch = Object.assign({}, desired, { bitrix_synced_at: nowMadridTs(), updated_at: nowMadridTs() });
        await sb('PATCH', `shifts?id=eq.${encodeURIComponent(selected.id)}`, patch, { 'Prefer': 'return=minimal' });
        auditEvents.push(auditRow('BITRIX_SHIFT_UPDATED', {
          shift_id: selected.id, employee_id: group.employee_id, fecha_operativa: group.fecha,
          bitrix_record_ids: bitrixIds, reason: selectionReason, changes: shiftDiff
        }));
        Object.assign(selected, patch);
        updated++;
      }

      const needsRawUpdate = group.recs.some(row => row.sync_status !== 'matched' || String(row.matched_shift_id || '') !== String(selected.id));
      if (!DRY_RUN && needsRawUpdate) {
        await sb('PATCH', `bitrix_time_records?id=in.(${recordIds.join(',')})`, {
          sync_status: 'matched', matched_shift_id: selected.id,
          matched_ts: nowMadridTs(), sync_error: null
        }, { 'Prefer': 'return=minimal' });
      }
      matched++;
      detalles.push(`match ${group.employee_id} ${group.fecha} → ${selected.id} (${horasBx}h)`);
    } catch (error) {
      const message = String(error.message || error).slice(0, 300);
      auditEvents.push(auditRow('BITRIX_SYNC_ERROR', {
        employee_id: group.employee_id, fecha_operativa: group.fecha,
        bitrix_record_ids: bitrixIds, error: message
      }));
      detalles.push(`error ${group.employee_id} ${group.fecha}: ${message}`);
      stillPending += group.recs.length;
    }
  }

  return { matched, updated, ambiguous, stillPending, autoCreated, detalles };
}

async function existingRecordsByIds(ids) {
  const result = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    if (!chunk.length) continue;
    const rows = await sb('GET',
      'bitrix_time_records?id=in.(' + chunk.map(id => encodeURIComponent(id)).join(',') + ')'
      + '&select=id,bitrix_record_id,bitrix_user_id,employee_id,start_ts,end_ts,duration_seconds,break_length,is_approved,fecha_operativa,servicio,sync_status,matched_shift_id,sync_error'
    ) || [];
    result.push(...rows);
  }
  return result;
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────
export default async function handler(req, res) {
  const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (!CRON_SECRET || auth !== 'Bearer ' + CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const q = (req.query && typeof req.query === 'object') ? req.query
          : (new URL(req.url || '/', 'http://x').searchParams);
  const readQ = name => q && typeof q.get === 'function' ? q.get(name) : q[name];
  const modo = readQ('modo') || 'continuous';
  const DRY_RUN = String(readQ('dry_run') || '') === '1';
  const hoy = todayMadridYmd();
  let desde;
  let hasta;
  if (modo === 'range' && validYmd(readQ('fecha'))) {
    desde = readQ('fecha');
    hasta = readQ('fecha');
  } else {
    const defaultDays = modo === 'history' ? FULL_LOOKBACK_DAYS : FAST_LOOKBACK_DAYS;
    const requestedDays = Number.parseInt(readQ('dias') || defaultDays, 10);
    const days = Math.min(Math.max(requestedDays || defaultDays, 1), MAX_LOOKBACK_DAYS);
    hasta = hoy;
    desde = ymdShift(hasta, -(days - 1));
  }

  const startedAt = Date.now();
  const auditEvents = [];
  let createdRecords = 0;
  let updatedRecords = 0;
  let unchangedRecords = 0;
  let totalIntervals = 0;
  const detectedChanges = [];

  try {
    const errores = [];
    const autoLinked = await autoLinkEmployees(DRY_RUN, errores);
    const employees = await sb('GET',
      'employees?select=id,nombre,area,puesto,bitrix_user_id&bitrix_user_id=not.is.null&estado=eq.Activo'
    ) || [];
    const employeesById = new Map(employees.map(emp => [String(emp.id), emp]));
    const projectedById = new Map();
    const rango = rangoBitrixParaIntervalo(desde, hasta);

    const BATCH = 6;
    for (let i = 0; i < employees.length; i += BATCH) {
      const chunk = employees.slice(i, i + BATCH);
      await Promise.all(chunk.map(async emp => {
        try {
          const registros = await bitrixV3('timeman.record.list', {
            filter: [
              ['userId', Number.parseInt(emp.bitrix_user_id, 10)],
              ['startTime', 'between', [rango.inicio, rango.fin]]
            ],
            select: ['id', 'userId', 'startTime', 'endTime', 'duration', 'breakLength', 'isApproved'],
            order: { startTime: 'ASC' }
          });

          const importedTs = new Date().toISOString();
          const incoming = [];
          for (const record of registros) {
            const startTs = typeof record.startTime === 'string' ? record.startTime : record.startTime && record.startTime.date;
            const endTs = typeof record.endTime === 'string' ? record.endTime : record.endTime && record.endTime.date;
            if (!startTs || !endTs || !record.duration) continue;
            const { servicio, fecha } = deducirServicioYFecha(startTs);
            if (!inYmdRange(fecha, desde, hasta)) continue;
            incoming.push({
              id: 'BX_' + record.id,
              bitrix_record_id: record.id,
              bitrix_user_id: emp.bitrix_user_id,
              employee_id: emp.id,
              start_ts: startTs,
              end_ts: endTs,
              duration_seconds: record.duration,
              break_length: record.breakLength == null || Number(record.breakLength) === 0
                ? null
                : record.breakLength,
              is_approved: !!record.isApproved,
              fecha_operativa: fecha,
              servicio,
              imported_ts: importedTs,
              sync_status: 'pending_manual_shift',
              sync_error: null
            });
          }
          totalIntervals += incoming.length;
          if (!incoming.length) return;

          const existing = await existingRecordsByIds(incoming.map(row => row.id));
          const existingById = new Map(existing.map(row => [String(row.id), row]));
          const newRows = [];

          for (const row of incoming) {
            const before = existingById.get(String(row.id));
            if (!before) {
              newRows.push(row);
              projectedById.set(String(row.id), row);
              continue;
            }
            const changes = changedRawFields(before, row);
            if (!Object.keys(changes).length) {
              unchangedRecords++;
              projectedById.set(String(row.id), Object.assign({}, before));
              continue;
            }
            detectedChanges.push({
              bitrix_record_id: String(row.bitrix_record_id),
              employee_id: emp.id,
              previous_matched_shift_id: before.matched_shift_id || null,
              changes
            });

            const patch = {};
            for (const field of RAW_SOURCE_FIELDS) patch[field] = row[field];
            patch.imported_ts = importedTs;
            patch.sync_status = 'pending_manual_shift';
            patch.sync_error = null;
            if (!DRY_RUN) {
              await sb('PATCH', 'bitrix_time_records?id=eq.' + encodeURIComponent(row.id), patch, { 'Prefer': 'return=minimal' });
              auditEvents.push(auditRow('BITRIX_RECORD_CHANGED', {
                bitrix_record_id: String(row.bitrix_record_id), employee_id: emp.id,
                previous_matched_shift_id: before.matched_shift_id || null, changes
              }));
            }
            projectedById.set(String(row.id), Object.assign({}, before, patch));
            updatedRecords++;
          }

          if (newRows.length) {
            if (!DRY_RUN) {
              await sb('POST', 'bitrix_time_records', newRows, {
                'Prefer': 'resolution=ignore-duplicates,return=minimal'
              });
              for (const row of newRows) {
                auditEvents.push(auditRow('BITRIX_RECORD_CREATED', {
                  bitrix_record_id: String(row.bitrix_record_id), employee_id: emp.id,
                  fecha_operativa: row.fecha_operativa, start_ts: row.start_ts,
                  end_ts: row.end_ts, duration_seconds: row.duration_seconds
                }));
              }
            }
            createdRecords += newRows.length;
          }
        } catch (error) {
          const item = {
            empleado: emp.nombre, bitrix_user_id: emp.bitrix_user_id,
            error: String(error.message || error).slice(0, 300)
          };
          errores.push(item);
          auditEvents.push(auditRow('BITRIX_SYNC_ERROR', item));
        }
      }));
    }

    const association = await paseAsociacion(
      desde, hasta, DRY_RUN, projectedById, employeesById, auditEvents
    );
    const durationMs = Date.now() - startedAt;
    const summary = {
      version: 'v4-continuous-audit', modo, desde, hasta,
      employees: employees.length, intervals: totalIntervals,
      records_created: createdRecords, records_updated: updatedRecords,
      records_unchanged: unchangedRecords, shifts_updated: association.updated,
      shifts_matched: association.matched, shifts_auto_created: association.autoCreated,
      ambiguous: association.ambiguous, pending: association.stillPending,
      autolinked: autoLinked, errors: errores.length, duration_ms: durationMs
    };

    if (!DRY_RUN) {
      auditEvents.push(auditRow('BITRIX_SYNC', summary));
      await flushAudit(auditEvents);
    }

    return res.status(200).json({
      ok: errores.length === 0,
      ...summary,
      dry_run: DRY_RUN,
      audit_events: DRY_RUN ? 0 : auditEvents.length,
      cambios_detectados: DRY_RUN ? detectedChanges.slice(0, 50) : undefined,
      detalles: association.detalles.slice(0, 50),
      errores
    });
  } catch (error) {
    const message = String(error.message || error).slice(0, 500);
    if (!DRY_RUN) {
      try {
        await flushAudit([auditRow('BITRIX_SYNC_ERROR', { modo, desde, hasta, error: message })]);
      } catch (_) {}
    }
    return res.status(500).json({ error: message, desde, hasta });
  }
}

export const __test = {
  changedRawFields,
  comparableRaw,
  canonicalTs,
  deducirServicioYFecha,
  ymdShift
};
