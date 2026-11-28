// Run: node tests/frame-photos.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const utils=fs.readFileSync(path.join(__dirname,'../editor-utils.jsx'),'utf8');let id=0;
const ctx={uid:()=>String(++id),now:()=>123};vm.createContext(ctx);
vm.runInContext(utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('function deepMerge')),ctx);
const frame=shape=>({id:'frame',type:'frame',shape,src:'',x:50,y:70,w:320,h:260,rot:12,opacity:.8});
const fixture=shape=>({activeProjectId:'project',projects:[{id:'project',activeCanvasId:'page',canvases:[{id:'page',elements:[frame(shape)]},{id:'other-page',elements:[]}]}],uploads:['library.jpg'],selection:[],past:[],future:[]});
const current=s=>s.projects[0].canvases[0].elements[0];
for(const shape of ['circle','rounded','square']){
 let s=fixture(shape),original=JSON.stringify(current(s));
 s=ctx.reducer(s,{type:'open-frame-photo',id:'frame'});const request=s.framePhotoTarget;
 assert(request);assert.equal(s.selection[0],'frame');assert.equal(JSON.stringify(current(s)),original);
 s=ctx.reducer(s,{type:'set-frame-photo',request,src:'library.jpg'});
 assert.equal(current(s).src,'library.jpg');assert.equal(s.framePhotoTarget,null);assert.equal(s.uploads.length,1);
 const photo=JSON.parse(JSON.stringify(current(s)));delete photo.src;
 const before=JSON.parse(original);delete before.src;assert.deepEqual(photo,before,'Only src changes, preserving frame geometry and shape');
 assert.equal(s.projects[0].canvases[0].elements.length,1,'A library photo fills the frame rather than adding an image');
 s=ctx.reducer(s,{type:'open-frame-photo',id:'frame'});
 s=ctx.reducer(s,{type:'set-frame-photo',request:s.framePhotoTarget,src:'data:image/png;base64,NEW'});
 assert.equal(current(s).src,'data:image/png;base64,NEW');assert.equal(s.uploads.length,2);
 s=ctx.reducer(s,{type:'undo'});assert.equal(current(s).src,'library.jpg');
 s=ctx.reducer(s,{type:'redo'});assert.equal(current(s).src,'data:image/png;base64,NEW');
}
let s=ctx.reducer(fixture('circle'),{type:'open-frame-photo',id:'frame'}),request=s.framePhotoTarget;
const cancelled=ctx.reducer(s,{type:'close-frame-photo'});
assert.equal(ctx.reducer(cancelled,{type:'set-frame-photo',request,src:'late.jpg'}),cancelled);
const reopened=ctx.reducer(cancelled,{type:'open-frame-photo',id:'frame'});
assert.notEqual(reopened.framePhotoTarget.requestId,request.requestId);
assert.equal(ctx.reducer(reopened,{type:'set-frame-photo',request,src:'late.jpg'}),reopened);
for(const change of ['slide','project','deleted','locked','hidden']){
 let state=ctx.reducer(fixture('rounded'),{type:'open-frame-photo',id:'frame'});const target=state.framePhotoTarget;
 if(change==='slide')state=ctx.reducer(state,{type:'set-active-canvas',id:'other-page'});
 if(change==='project')state={...state,activeProjectId:'elsewhere'};
 if(change==='deleted')state.projects[0].canvases[0].elements=[];
 if(change==='locked')current(state).locked=true;
 if(change==='hidden')current(state).hidden=true;
 assert.equal(ctx.reducer(state,{type:'set-frame-photo',request:target,src:'wrong.jpg'}),state,change+' target must not be changed');
 assert.equal(state.uploads.length,1);
}
s=fixture('square');current(s).locked=true;
assert.equal(ctx.reducer(s,{type:'open-frame-photo',id:'frame'}),s);
assert.equal(ctx.reducer(s,{type:'open-frame-photo',id:'missing'}),s);
console.log('PASS: all frame shapes fill/replace in place; library reuse and upload registration; Undo/Redo; cancel, reopened, moved, deleted, locked, hidden and stale upload targets.');
