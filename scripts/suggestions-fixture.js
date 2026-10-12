// Isolated PostgreSQL fixture. No connection to Supabase or other LIVE services.
import fs from 'node:fs/promises';
export const profiles = {
  admin: { id:'A1',nombre:'Administrador de prueba',rol:'admin',area:'Administración',puesto:'Administrador',estado:'Activo' },
  employee: { id:'E1',nombre:'Empleado de prueba',rol:'empleado',area:'Cocina',puesto:'Cocinero',estado:'Activo' },
  chief: { id:'C1',nombre:'Jefe de prueba',rol:'chef',area:'Cocina',puesto:'Jefe de Cocina',estado:'Activo' },
  other: { id:'E2',nombre:'Otra persona de prueba',rol:'empleado',area:'Sala',puesto:'Camarero(a)',estado:'Activo' }
};
export async function createFixture(populateBoard=false) {
  const {PGlite}=await import(process.env.SYNCRO_PGLITE_MODULE || '@electric-sql/pglite');
  const db=new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE employees(id text PRIMARY KEY,nombre text,rol text,area text,puesto text,estado text);
    GRANT SELECT ON employees TO service_role;
    CREATE TABLE employee_notes(id text PRIMARY KEY,employee_id text,nombre text,area text,categoria text,texto text,leida boolean DEFAULT false,created_at timestamptz DEFAULT now());
    ALTER TABLE employee_notes ENABLE ROW LEVEL SECURITY;
    CREATE POLICY fixture_open ON employee_notes FOR ALL USING(true) WITH CHECK(true);
    GRANT SELECT,INSERT,UPDATE,DELETE ON employee_notes TO authenticated,service_role;`);
  for(const profile of Object.values(profiles))await db.query('INSERT INTO employees VALUES($1,$2,$3,$4,$5,$6)',Object.values(profile));
  for(const [id,actor,title,description] of [
    ['N1','employee','Ver mis sugerencias en el móvil','Consultar el estado y la respuesta sin tener que preguntar.'],
    ['N2','chief','Mejorar el resumen de turnos','Mostrar primero los cambios que requieren revisión.'],
    ['N3','other','Simplificar el filtro de informes','Recordar el último módulo seleccionado.']
  ]) {
    const p=profiles[actor];
    await db.query('INSERT INTO employee_notes(id,employee_id,nombre,area,categoria,texto,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,p.id,p.nombre,p.area,'Mejora',description,'2026-10-12T0'+id.slice(1)+':00:00Z']);
  }
  const sql=await fs.readFile(new URL('../supabase/changes/employee_notes_board.sql',import.meta.url),'utf8');await db.exec(sql);
  if(populateBoard) {
    await db.exec(`UPDATE employee_notes SET titulo=CASE id WHEN 'N1' THEN 'Ver mis sugerencias en el móvil' WHEN 'N2' THEN 'Mejorar el resumen de turnos' ELSE 'Simplificar el filtro de informes' END,modulo='Aplicación';`);
    for(const [id,title,state,reason] of [['N4','Guardar el filtro de fichajes','en_desarrollo',''],['N5','Mostrar el estado de mi propuesta','terminado',''],['N6','Duplicar la pantalla de informes','rechazado','La consulta ya está disponible en Informes. Mejoraremos su acceso.']]) {
      const p=profiles.employee;
      await db.query('INSERT INTO employee_notes(id,employee_id,nombre,area,categoria,texto,titulo,estado,respuesta) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,p.id,p.nombre,p.area,'Mejora','Propuesta ficticia para comprobar el seguimiento.',title,state,reason]);
    }
  }
  return db;
}
