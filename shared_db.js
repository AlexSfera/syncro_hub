// ═══════════════════════════════════════════════════════════════
// SUPABASE CONFIG — replace localStorage with Supabase REST API
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://tsfhrpdpbkciofvejrao.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3GWGNkIs6byRG1F1BIxlkg_qhiRUgBt';

// HTTP helper for Supabase REST API
async function sbRequest(method, table, body=null, params='') {
  const url = SUPABASE_URL + '/rest/v1/' + table + (params ? '?' + params : '');
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': (method === 'POST' || method === 'PATCH') ? 'return=representation' : 'return=minimal'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    console.error('Supabase error:', method, table, err);
    return null;
  }
  if (method === 'DELETE') return true;
  const text = await res.text();
  if (!text || text === '' || text === 'null') return method === 'PATCH' ? true : [];
  try { return JSON.parse(text); } catch(e) { return method === 'PATCH' ? true : []; }
}

// ── ASYNC DB LAYER ──
// All operations return promises — UI must await them

async function dbGetAll(table) {
  // Try ordered by created_at; fallback to id if column missing; fallback to unordered
  let data = await sbRequest('GET', table, null, 'order=created_at.asc');
  if (data === null) data = await sbRequest('GET', table, null, 'order=id.asc');
  if (data === null) data = await sbRequest('GET', table, null, '');
  return data || [];
}

async function dbInsert(table, row) {
  return await sbRequest('POST', table, row);
}

async function dbUpdate(table, id, updates) {
  return await sbRequest('PATCH', table, updates, 'id=eq.' + id);
}

async function dbDelete(table, id) {
  return await sbRequest('DELETE', table, null, 'id=eq.' + id);
}

async function dbUpsert(table, rows) {
  // Insert array, skip conflicts
  return await sbRequest('POST', table, Array.isArray(rows)?rows:[rows],
    null);
}

// ── CACHE LAYER — keep data in memory for fast reads ──
const _cache = {};
const _cacheTs = {};
const CACHE_TTL = 30000; // 30 seconds

async function getDB(table) {
  const now = Date.now();
  if (_cache[table] && (now - (_cacheTs[table]||0)) < CACHE_TTL) {
    return _cache[table];
  }
  const data = await dbGetAll(table);
  _cache[table] = data;
  _cacheTs[table] = now;
  return data;
}

function invalidateCache(table) {
  delete _cache[table];
  delete _cacheTs[table];
}

async function setDB(table, data) {
  // setDB is used in bulk — for Supabase we upsert all rows
  // This is called from importBackup only
  for (const row of data) {
    await sbRequest('POST', table, row,
      'on_conflict=id');
  }
  invalidateCache(table);
}

// ── MIGRATION from localStorage to Supabase ──
async function migrateFromLocalStorage() {
  const tables = ['employees','shifts','merma','incidencias','tareas','cash_closings','rec_shift_data','closing_audit_log'];
  let migrated = 0;
  for (const t of tables) {
    try {
      const local = JSON.parse(localStorage.getItem('syncro_' + t) || '[]');
      if (local.length > 0) {
        for (const row of local) {
          await sbRequest('POST', t, row, 'on_conflict=id&ignore_duplicates=true');
        }
        migrated += local.length;
        console.log('Migrated', local.length, 'rows from', t);
      }
    } catch(e) { console.warn('Migration error for', t, e); }
  }
  return migrated;
}

// ═════════════════════════════════════════════════════════════════
// AUDIT
// ═════════════════════════════════════════════════════════════════
async function auditLog(action,detail){
  const row={
    id:genId(),
    ts:new Date().toISOString(),
    usuario:(currentUser&&currentUser.nombre)||'?',
    rol:(currentUser&&currentUser.rol)||'?',
    action:action,
    detail:detail
  };
  const saved=await dbInsert('audit_log',row);
  if(!saved) console.error('audit_log insert failed',row);
}
