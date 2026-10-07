import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../shared.js',import.meta.url),'utf8');
function cacheContext(load){
 const context={currentUser:{id:'admin',rol:'admin',area:'Administración',puesto:'Administrador'},window:{},Date,dbGetAll:load};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('const _cache = {}'),source.indexOf('function invalidateCache')),context);
 return context;
}
test('browser cache belongs to a user and scope, not just a table',async()=>{
 let calls=0;
 const context=cacheContext(async()=>[{generation:++calls}]);
 assert.equal((await context.getDB('employee_incentives'))[0].generation,1);
 assert.equal((await context.getDB('employee_incentives'))[0].generation,1);
 context.currentUser={id:'employee',rol:'empleado',area:'Sala',puesto:'Camarero(a)'};
 assert.equal((await context.getDB('employee_incentives'))[0].generation,2);
 context.currentUser.area='Cocina';
 assert.equal((await context.getDB('employee_incentives'))[0].generation,3);
});
test('response started by a former session cannot enter the current cache',async()=>{
 let resolve;
 const context=cacheContext(()=>new Promise(done=>{resolve=done;}));
 const pending=context.getDB('employee_incentives');
 context.currentUser={id:'employee',rol:'empleado',area:'Sala',puesto:'Camarero(a)'};
 resolve([{amount:500}]);
 await assert.rejects(pending,/sesión ha cambiado/);
});
