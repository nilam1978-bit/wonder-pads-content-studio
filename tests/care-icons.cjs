// Run with node tests/care-icons.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../editor-icons.jsx'),'utf8'),ctx={window:{}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('const ICONS ='),source.indexOf('Object.assign(window'))+'\nglobalThis.items=CARE_ICON_LIBRARY;globalThis.markup=iconMarkup;',ctx);
assert.equal(ctx.items.length,24);assert.equal(new Set(ctx.items.map(i=>i.id)).size,24);
for(const item of ctx.items){
 assert(item.label&&item.keywords&&item.svg);
 for(const colour of ['none','#F0CEE7','#849879']){
  const result=ctx.markup(item.id,colour);assert(!result.includes('__ACCENT__'));assert(!/script|onload|href/i.test(result));
  if(item.svg.includes('__ACCENT__'))assert(result.includes('fill="'+colour+'"'));
 }
}
assert(!ctx.markup('washer','" onload="bad').includes('onload'));
assert.equal(ctx.markup('missing'),'');assert(ctx.markup('undo'));
assert.notEqual(ctx.markup('reuse_cycle'),ctx.markup('recycle_triangle'));
console.log('PASS 24 named icons, unique IDs, editable fill substitution, safe colour handling and unchanged general icon lookup.');
