// Local UI → actual API handler → isolated PostgreSQL. Fixtures only.
import http from 'node:http';
import fs from 'node:fs/promises';
import handler from '../api/suggestions.js';
import { createFixture, profiles } from './suggestions-fixture.js';
const db=await createFixture(true),port=Number(process.env.SYNCRO_FIXTURE_PORT||4317);
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const tokens=Object.fromEntries(Object.entries(profiles).map(([key,p])=>[key,encode({alg:'fixture'})+'.'+encode({sub:'auth-'+p.id,app_metadata:{syncro_authz_version:7}})+'.fixture']));
Object.assign(process.env,{SYNCRO_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.test',SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SERVICE_KEY:'fixture-service'});
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(String(input));if(url.hostname!=='fixture.supabase.test')throw Error('External network disabled in this fixture');
  const headers=new Headers(init.headers||{}),method=init.method||'GET';let rows;
  if(url.pathname==='/auth/v1/user'){
    const profile=Object.keys(tokens).find(key=>headers.get('Authorization')==='Bearer '+tokens[key]);
    return new Response(JSON.stringify(profile?{id:'auth-'+profiles[profile].id}:null),{status:profile?200:401});
  }
  if(url.pathname.endsWith('/syncro_auth_identities')){
    const authId=url.searchParams.get('auth_user_id').slice(3),profile=Object.values(profiles).find(p=>'auth-'+p.id===authId);
    rows=profile?[{employee_id:profile.id,auth_user_id:authId,active:true,force_pin_change:false,authz_version:7}]:[];
  } else if(url.pathname.endsWith('/employees')){
    rows=(await db.query('SELECT * FROM employees WHERE id=$1',[url.searchParams.get('id').slice(3)])).rows;
  } else if(url.pathname.endsWith('/employee_notes')){
    if(method==='GET')rows=(await db.query('SELECT * FROM employee_notes ORDER BY created_at,id LIMIT $1 OFFSET $2',[Number(url.searchParams.get('limit')||1000),Number(url.searchParams.get('offset')||0)])).rows;
    else if(method==='POST'){
      const body=JSON.parse(init.body),keys=['id','employee_id','nombre','area','categoria','texto','titulo','modulo','leida','estado','posicion','respuesta','version'];
      rows=(await db.query('INSERT INTO employee_notes('+keys.join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING *',keys.map(k=>body[k]))).rows;
    }
  } else if(url.pathname.endsWith('/rpc/syncro_move_suggestion')){
    const body=JSON.parse(init.body);
    rows=(await db.query('SELECT syncro_move_suggestion($1,$2,$3,$4,$5,$6) AS result',[body.p_id,body.p_estado,body.p_before_id,body.p_respuesta,body.p_expected_version,body.p_actor])).rows[0].result;
  } else throw Error('Unsupported fixture request');
  return new Response(JSON.stringify(rows),{headers:{'Content-Type':'application/json'}});
};
const original=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(url.pathname==='/api/suggestions'){
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const response=await handler(new Request(url,{method:req.method,headers:req.headers,...(req.method==='GET'?{}:{body:Buffer.concat(chunks)})}));
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
      console.log(req.method+' /api/suggestions '+response.status);return;
    }
    if(['/notas.js','/notas.css'].includes(url.pathname)){
      res.writeHead(200,{'Content-Type':url.pathname.endsWith('.css')?'text/css':'text/javascript'});res.end(await fs.readFile(new URL('..'+url.pathname,import.meta.url)));return;
    }
    if(url.pathname!=='/'){res.writeHead(404);res.end();return;}
    const profile=Object.hasOwn(profiles,url.searchParams.get('profile'))?url.searchParams.get('profile'):'admin';
    const setup=`var currentUser=${JSON.stringify(profiles[profile])};window.syncroSupabaseFetch=(url,init)=>fetch(url,{...init,headers:{...init.headers,Authorization:'Bearer ${tokens[profile]}'}});document.getElementById('portal-screen').style.display='none';document.getElementById('app').style.display='block';document.getElementById('screen-notas-mod').classList.add('active');document.getElementById('topbar-nav').innerHTML='<span style="font-size:12px">Prueba local · datos ficticios · ${profiles[profile].nombre}</span>';renderNotasMod();`;
    const html=original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*href=["']https?:[^>]*>/gi,'');
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(html.replace('</body>','<script src="notas.js"></script><script>'+setup+'</script></body>'));
  } catch(error){console.error(error.message);res.writeHead(500);res.end('Local fixture error');}
});
server.listen(port,'127.0.0.1',()=>console.log('Fixture only: http://127.0.0.1:'+port+'/?profile=admin'));
process.on('SIGINT',async()=>{server.close();await db.close();globalThis.fetch=nativeFetch;process.exit(0);});
