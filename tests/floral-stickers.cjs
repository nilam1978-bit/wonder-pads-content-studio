// node tests/floral-stickers.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'floral-stickers.js'),'utf8'),ctx);
const items=ctx.window.FLORAL_STICKERS;assert.equal(new Set(items.map(i=>i.id)).size,items.length);
for (const id of ['watercolor-like','watercolor-share','watercolor-comment','watercolor-follow-me']) {
  const item=items.find(entry=>entry.id===id);
  assert(item && item.category==='social' && !item.crop && !item.opaque, id);
}
for(const item of items){assert(item.width>0&&item.height>0);if(item.crop){const c=item.crop;assert(c.x>=0&&c.y>=0&&c.x+c.w<=item.sheetWidth&&c.y+c.h<=item.sheetHeight);assert.equal(item.width,c.w);assert.equal(item.height,c.h);}assert(/^assets\/stickers\/[a-z0-9-]+\.webp$/.test(item.src));const b=fs.readFileSync(path.join(root,item.src));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.indexOf("'floral-stickers.js'")<html.indexOf("'editor-panels.jsx'"));
console.log(`PASS: ${items.length} unique bundled illustrations, image metadata, WebP assets and script loading order.`);
