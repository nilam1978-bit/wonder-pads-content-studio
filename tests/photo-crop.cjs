// Run: node tests/photo-crop.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8'),utils=read('editor-utils.jsx'),exportsCode=read('editor-export.jsx');let id=0;
const ctx={uid:()=>String(++id),now:()=>123,clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),FLORAL_STICKERS:[]};vm.createContext(ctx);
vm.runInContext(utils.slice(utils.indexOf('const isIllustration'),utils.indexOf('// Branded backgrounds')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('// -------------- Snap guides')),ctx);
vm.runInContext(exportsCode.slice(exportsCode.indexOf('function canvasToSVG'),exportsCode.indexOf('// ---------- File save helper')),ctx);
const photo=(type='image')=>({id:'photo',type,shape:'circle',src:'data:image/png;base64,PHOTO',x:40,y:60,w:400,h:200,rot:15,opacity:.8,filter:{brightness:120,contrast:100,saturate:100,blur:0}});
const editor=read('editor.jsx');vm.runInContext(editor.slice(editor.indexOf('function sigForThumb('),editor.indexOf('function blobToDataURL(')),ctx);
assert.notEqual(ctx.sigForThumb({w:400,h:200,bg:{},elements:[photo()]}),ctx.sigForThumb({w:400,h:200,bg:{},elements:[{...photo(),crop:{sourceW:1200,sourceH:600,zoom:2,x:.5,y:.5}}]}),'Crop changes refresh saved previews even when the box is unchanged');
const fixture=type=>({activeProjectId:'p',projects:[{id:'p',activeCanvasId:'c',canvases:[{id:'c',elements:[photo(type)]},{id:'next',elements:[]}]}],selection:['photo'],past:[],future:[],uploads:[]});
const element=s=>s.projects[0].canvases[0].elements[0],near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const type of ['image','frame']){
 const el=photo(type);assert(ctx.keepsAspectOnResize?ctx.keepsAspectOnResize(el):vm.runInContext(`keepsAspectOnResize({type:'${type}'})`,ctx));
 for(const corner of ['nw','ne','sw','se']){
  const p=ctx.proportionalElementResize(el,corner,650,230,20);near(p.w/p.h,el.w/el.h);
  near(corner.includes('w')?p.x+p.w:p.x,corner.includes('w')?el.x+el.w:el.x);
  near(corner.includes('n')?p.y+p.h:p.y,corner.includes('n')?el.y+el.h:el.y);
 }
 const size=ctx.photoSizePatch(el,200);near(size.w/size.h,2);near(size.x+size.w/2,el.x+el.w/2);near(size.y+size.h/2,el.y+el.h/2);
}
for(const [sourceW,sourceH]of [[1200,600],[600,1200],[800,800]])for(const [w,h]of [[300,300],[400,500],[500,200]])for(const zoom of [1,2,5])for(const x of [0,.5,1])for(const y of [0,.5,1]){
 const p={...photo(),w,h,crop:{sourceW,sourceH,zoom,x,y}},r=ctx.photoCropRect(p);
 assert(r.sx>=-1e-8&&r.sy>=-1e-8&&r.sx+r.sw<=sourceW+1e-8&&r.sy+r.sh<=sourceH+1e-8);near(r.sw/r.sh,w/h);
 const scaled=ctx.photoCropRect({...p,w:w*2,h:h*2});for(const key of ['sx','sy','sw','sh'])near(r[key],scaled[key]);
 const svg=ctx.elementToSVG(p,true);assert(svg.includes(`viewBox="${r.sx} ${r.sy} ${r.sw} ${r.sh}"`));
 const style=ctx.photoImageStyle(p);assert.equal(style.objectPosition,`${x*100}% ${y*100}%`);assert.equal(style.transform,`scale(${zoom})`);
 // CSS cover + zoom + transform-origin produces exactly the same source window.
 const scale=Math.max(w/sourceW,h/sourceH)*zoom;near(-(w-sourceW*scale)*x/scale,r.sx);near(-(h-sourceH*scale)*y/scale,r.sy);
}
for(const type of ['image','frame']){
 let s=ctx.reducer(fixture(type),{type:'open-photo-crop',id:'photo'}),t=s.photoCropTarget;
 const before=JSON.stringify(s.projects),crop={sourceW:1200,sourceH:600,zoom:2,x:.8,y:.25};
 const cancelled=ctx.reducer(s,{type:'close-photo-crop'});assert.equal(JSON.stringify(cancelled.projects),before);assert.equal(cancelled.past.length,0);
 const applied=ctx.reducer(s,{type:'apply-photo-crop',requestId:t.requestId,crop,size:{w:400,h:500}});
 assert.equal(element(applied).src,element(s).src);assert.equal(element(applied).filter.brightness,120);assert.equal(applied.photoCropTarget,null);assert.equal(applied.past.length,1);
 assert.equal(element(applied).h,type==='frame'?200:500,'Frames keep their existing shape and size');
 const persisted=JSON.parse(JSON.stringify(applied));assert.deepEqual(JSON.parse(JSON.stringify(ctx.photoCropRect(element(persisted)))),JSON.parse(JSON.stringify(ctx.photoCropRect(element(applied)))));
 const undo=ctx.reducer(applied,{type:'undo'});assert.equal(JSON.stringify(undo.projects),before);const redo=ctx.reducer(undo,{type:'redo'});assert.equal(element(redo).crop.zoom,2);
 const replaced=ctx.reducer(applied,{type:'update-element',id:'photo',patch:{src:'new-photo.jpg'}});assert.equal(element(replaced).crop,null,'A new source never inherits the old photo crop');
 for(const mutation of ['cancel','slide','replace','lock','resize','token']){
  let state=JSON.parse(JSON.stringify(s));
  if(mutation==='cancel')state=ctx.reducer(state,{type:'close-photo-crop'});
  if(mutation==='slide')state=ctx.reducer(state,{type:'set-active-canvas',id:'next'});
  if(mutation==='replace')element(state).src='new.jpg';
  if(mutation==='lock')element(state).locked=true;
  if(mutation==='resize')element(state).w+=1;
  assert.equal(ctx.reducer(state,{type:'apply-photo-crop',requestId:mutation==='token'?'stale':t.requestId,crop,size:{w:400,h:500}}),state,mutation);
 }
}
// Raster PNG/JPEG uses the very same crop rectangle as SVG/PDF/inline previews.
async function rasterCheck(){
 const calls=[],context={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(...a){calls.push(a);},beginPath(){},roundRect(){},clip(){}};
 ctx.document={fonts:{ready:Promise.resolve()},createElement:()=>({getContext:()=>context,toBlob:cb=>cb({type:'image/png'})})};
 ctx.Image=class{constructor(){this.naturalWidth=1200;this.naturalHeight=600;}async decode(){}};
 ctx.URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};ctx.rasterizeSVG=async()=>({});
 vm.runInContext(exportsCode.slice(exportsCode.indexOf('async function rasterizeDesign'),exportsCode.indexOf('async function prepareImageFiles')),ctx);
 const el={...photo(),crop:{sourceW:1200,sourceH:600,zoom:2,x:.8,y:.25}},r=ctx.photoCropRect(el);
 await ctx.rasterizeDesign({w:1080,h:1350,bg:{type:'color',value:'#fff'},elements:[el]});
 assert.deepEqual(calls.find(c=>c.length===9).slice(1),[r.sx,r.sy,r.sw,r.sh,0,0,el.w,el.h]);
}
rasterCheck().then(()=>console.log('PASS: proportional photos/frames and anchored corners; 243 bounded crop cases; editor/SVG/raster crop agreement; Apply/Cancel, Undo/Redo, persistence and stale-target/replacement guards.')).catch(e=>{console.error(e);process.exitCode=1;});
