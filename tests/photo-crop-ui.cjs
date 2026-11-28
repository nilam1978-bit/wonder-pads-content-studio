// React/JSDOM checks; same vendor setup as tests/photo-adjustments.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom'),vendor=process.env.CONTENT_TEST_VENDOR_DIR;
if(!vendor)throw Error('Set CONTENT_TEST_VENDOR_DIR to React, ReactDOM and Babel UMD files.');
const Babel=require(path.join(vendor,'babel.min.js')),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
for(const f of ['react.development.js','react-dom.development.js'])w.eval(fs.readFileSync(path.join(vendor,f),'utf8'));
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
w.Image=class{constructor(){this.naturalWidth=1200;this.naturalHeight=600;}set src(value){queueMicrotask(()=>value==='bad.jpg'?this.onerror?.():this.onload?.());}};
w.eval(`var count=0;function uid(){return String(++count);}function now(){return 123;}function clamp(n,min,max){return Math.max(min,Math.min(max,n));}function fitsWholeImage(el){return el.imageFit==='contain';}var Context=React.createContext();function useStore(){return React.useContext(Context);}`);
const utils=read('editor-utils.jsx');
w.eval(Babel.transform(utils.slice(utils.indexOf('function photoSizePatch'),utils.indexOf('// Branded backgrounds'))+'\n'+utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('// -------------- Snap guides'))+'\n'+read('photo-crop.jsx'),{presets:['react']}).code);
w.eval(Babel.transform(`function Harness({type,src='photo.jpg'}){const [state,dispatch]=React.useReducer(reducer,{activeProjectId:'p',projects:[{id:'p',activeCanvasId:'c',canvases:[{id:'c',elements:[{id:'photo',type,shape:'circle',src,x:20,y:30,w:400,h:400,filter:{brightness:125,contrast:100,saturate:100,blur:0}}]}]}],past:[],future:[],selection:['photo']});window.latest=state;return <Context.Provider value={{state,dispatch}}><button onClick={()=>dispatch({type:'open-photo-crop',id:'photo'})}>Crop photo</button><PhotoCropPicker/></Context.Provider>;}window.Harness=Harness;`,{presets:['react']}).code);
const root=w.ReactDOM.createRoot(w.document.getElementById('root'));
const click=name=>{const button=[...w.document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent)===name);assert(button,name);w.ReactDOM.flushSync(()=>button.click());};
const photo=()=>w.latest.projects[0].canvases[0].elements[0];
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const change=(input,value)=>w.ReactDOM.flushSync(()=>{Object.getOwnPropertyDescriptor(input.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new w.Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));});
async function main(){
 for(const type of ['image','frame']){
  w.ReactDOM.flushSync(()=>root.render(w.React.createElement(w.Harness,{key:type,type})));
  const before=JSON.stringify(photo());click('Crop photo');await tick();assert(w.document.querySelector('dialog[open]'));
  const zoom=w.document.querySelector('[aria-label="Crop zoom"]');assert(!zoom.disabled);change(zoom,2);
  const preview=w.document.querySelector('.photo-crop-preview');preview.getBoundingClientRect=()=>({width:300,height:300});
  const event=(name,x)=>{const e=new w.Event(name,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,button:0,clientX:x,clientY:100});w.ReactDOM.flushSync(()=>preview.dispatchEvent(e));};
  event('pointerdown',150);event('pointermove',60);event('pointerup',60);assert.equal(JSON.stringify(photo()),before,'Dragging and zooming remain a local draft');
  if(type==='image')change(w.document.querySelector('[aria-label="Crop shape"]'),'portrait');else assert.equal(w.document.querySelector('select'),null);
  click('Cancel');assert.equal(JSON.stringify(photo()),before);assert.equal(w.latest.past.length,0);
  click('Crop photo');await tick();change(w.document.querySelector('[aria-label="Crop zoom"]'),2);
  if(type==='image')change(w.document.querySelector('[aria-label="Crop shape"]'),'original');
  click('Apply crop');assert.equal(w.document.querySelector('dialog'),null);assert.equal(photo().src,'photo.jpg');assert.equal(w.latest.past.length,1);assert.equal(photo().filter.brightness,125);
  assert.equal(photo().h,type==='image'?200:400);assert.equal(photo().crop.zoom,type==='image'?1:2);
  click('Crop photo');await tick();click('Reset crop');click('Apply crop');assert.equal(photo().crop.zoom,1);assert.equal(photo().crop.x,.5);
 }
 w.ReactDOM.flushSync(()=>root.render(w.React.createElement(w.Harness,{key:'error',type:'image',src:'bad.jpg'})));click('Crop photo');await tick();assert(w.document.querySelector('[role="alert"]'));assert([...w.document.querySelectorAll('button')].find(b=>b.textContent==='Apply crop').disabled);click('Cancel crop');
 console.log('PASS: image/frame crop dialog loads, pans and zooms locally; ratios, Apply/Cancel, reset, frame-size preservation and load-error handling.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{w.ReactDOM.flushSync(()=>root.unmount());w.close();});
