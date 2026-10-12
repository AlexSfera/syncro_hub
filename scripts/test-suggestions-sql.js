import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createFixture } from './suggestions-fixture.js';
const db=await createFixture();
let checks=0;
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const get=async id=>(await db.query('SELECT * FROM employee_notes WHERE id=$1',[id])).rows[0];
const move=async(id,state,before=null,reason='',actor='A1',version=null)=>{
  const note=await get(id);
  return (await db.query('SELECT syncro_move_suggestion($1,$2,$3,$4,$5,$6) AS result',[id,state,before,reason,version??note?.version??1,actor])).rows[0].result;
};
const order=async state=>(await db.query('SELECT id FROM employee_notes WHERE estado=$1 ORDER BY posicion NULLS LAST,created_at,id',[state])).rows.map(n=>n.id);
try {
  const original=(await db.query('SELECT id,employee_id,nombre,area,texto,created_at FROM employee_notes ORDER BY id')).rows;
  check((await get('N1')).estado==='pendiente','Existing notes are retained and start pending');
  check(!(await move('N3','pendiente','N1')).error,'Admin can move a card to the top');
  assert.deepEqual(await order('pendiente'),['N3','N1','N2']);checks++;
  const stale=await move('N1','terminado',null,'','A1',1);check(stale.error==='CONFLICT','Concurrent changes cannot overwrite a stale card');
  await move('N3','pendiente','N2');assert.deepEqual(await order('pendiente'),['N1','N3','N2']);checks++;
  await move('N1','en_desarrollo');check((await get('N1')).estado==='en_desarrollo','State is persisted');
  const version=(await get('N1')).version;
  check((await move('N1','rechazado')).error==='INVALID_REQUEST','Rejected proposals require an explanation');
  check((await get('N1')).version===version,'Failed changes are atomic');
  check((await move('N1','terminado',null,'','E1')).error==='FORBIDDEN','SQL also rejects non-admin management');
  check((await move('N1','terminado','missing')).error==='INVALID_ANCHOR','Unknown drop anchor cannot reorder a different column');
  await move('N1','rechazado',null,'Ya existe esta función');
  check((await get('N1')).respuesta==='Ya existe esta función','Rejection reason is persisted');
  await move('N1','terminado');check((await get('N1')).respuesta==='','Moving out of rejection clears the obsolete reason');
  await db.exec('SET ROLE authenticated');
  for(const sql of ['SELECT * FROM employee_notes',"UPDATE employee_notes SET estado='terminado' WHERE id='N2'", "SELECT syncro_move_suggestion('N2','terminado',NULL,'',1,'A1')"]){
    let denied=false;try{await db.exec(sql);}catch(error){denied=error.code==='42501';}check(denied,'Direct authenticated REST/RPC bypass denied');
  }
  await db.exec('RESET ROLE; SET ROLE service_role');
  check((await db.query('SELECT id FROM employee_notes')).rows.length===3,'Server role retains required access');
  const current=await get('N2');
  check(!(await db.query("SELECT syncro_move_suggestion('N2','en_desarrollo',NULL,'',$1,'A1') AS result",[current.version])).rows[0].result.error,'RPC works as the server role, without SECURITY DEFINER');
  await db.exec('RESET ROLE');
  assert.deepEqual((await db.query('SELECT id,employee_id,nombre,area,texto,created_at FROM employee_notes ORDER BY id')).rows,original);checks++;
  await db.exec(await fs.readFile(new URL('../supabase/changes/employee_notes_board_rollback.sql',import.meta.url),'utf8'));
  await db.exec('SET ROLE authenticated');check((await db.query('SELECT id FROM employee_notes')).rows.length===3,'Rollback restores previous app access without deleting workflow data');
  await db.exec('RESET ROLE');check((await get('N1')).estado==='terminado','Rollback keeps decisions');
  console.log('PostgreSQL: '+checks+' checks PASS; isolated fictitious data; no LIVE access.');
} finally { await db.close(); }
