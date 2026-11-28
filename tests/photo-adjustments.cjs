// React/JSDOM checks. Set CONTENT_TEST_VENDOR_DIR (React/ReactDOM UMD + Babel),
// and optionally JSDOM_MODULE to the installed jsdom module path.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.JSDOM_MODULE||'jsdom'),vendor=process.env.CONTENT_TEST_VENDOR_DIR;
if(!vendor)throw Error('Set CONTENT_TEST_VENDOR_DIR to the local React, ReactDOM and Babel UMD scripts.');
const Babel=require(path.join(vendor,'babel.min.js')),rootDir=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(rootDir,file),'utf8');
const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only',url:'http://localhost'}),w=dom.window;
const style=w.document.createElement('style');style.textContent=read('index.html').match(/<style>([\s\S]*?)<\/style>/)[1];w.document.head.appendChild(style);
for(const name of ['react.development.js','react-dom.development.js'])w.eval(fs.readFileSync(path.join(vendor,name),'utf8'));
w.eval(`var pR=React.useRef,pE=React.useEffect;function now(){return 123;}function Icon(){return React.createElement('span');}function activeProject(s){return s.projects[0];}var Context=React.createContext();function useStore(){return React.useContext(Context);}`);
const utils=read('editor-utils.jsx'),panels=read('editor-panels.jsx'),context=read('editor-mobile-context.jsx');
const code=utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('// -------------- Snap guides'))+'\n'+panels.slice(panels.indexOf('function useLiveElementEdit('),panels.indexOf('const stepperStyle'))+'\n'+context.slice(context.indexOf('const PHOTO_ADJUSTMENTS'),context.indexOf('function MobileToolTray('));
w.eval(Babel.transform(code,{presets:['react']}).code);
w.eval(Babel.transform(`function Harness(){
 const [open,setOpen]=React.useState(false),[state,dispatch]=React.useReducer(reducer,{activeProjectId:'p',selection:['a'],past:[],future:[],projects:[{id:'p',activeCanvasId:'c',canvases:[{id:'c',elements:[{id:'a',type:'image',filter:{brightness:100,contrast:115,saturate:90,blur:0}},{id:'b',type:'image',filter:{brightness:100,contrast:100,saturate:100,blur:0}}]}]}]});
 const el=state.projects[0].canvases[0].elements.find(e=>e.id===state.selection[0])||state.projects[0].canvases[0].elements[0];window.latest=state;window.send=dispatch;
 return <Context.Provider value={{state,dispatch}}><div className="mobile-ribbon-context">{open?<MobileImageAdjustments key={el.id} el={el} onClose={()=>setOpen(false)}/>:<div role="toolbar" aria-label="Selected element tools"><button onClick={()=>setOpen(true)}>Adjust image</button></div>}</div></Context.Provider>;
}window.Harness=Harness;`,{presets:['react']}).code);
const root=w.ReactDOM.createRoot(w.document.getElementById('root'));
const button=name=>[...w.document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||b.textContent).trim()===name);
const click=name=>{assert(button(name),'Missing '+name);w.ReactDOM.flushSync(()=>button(name).click());};
const current=()=>w.latest.projects[0].canvases[0].elements[0];
const input=()=>w.document.querySelector('input[type=range]');
const set=value=>w.ReactDOM.flushSync(()=>{Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input(),String(value));input().dispatchEvent(new w.Event('input',{bubbles:true}));});
try{
 w.ReactDOM.flushSync(()=>root.render(w.React.createElement(w.Harness)));
 click('Adjust image');assert(!input());assert.equal(w.document.querySelectorAll('.mobile-photo-adjust-choices button').length,4);
 const rowStyle=w.getComputedStyle(w.document.querySelector('.mobile-photo-adjust'));assert.equal(rowStyle.position,'static');assert.equal(rowStyle.flexDirection,'row');assert.equal(rowStyle.height,'58px');
 click('Brightness');assert.equal(input().value,'0');assert.equal(w.document.querySelectorAll('input[type=range]').length,1);assert(!button('Contrast'));
 assert.equal(w.document.querySelector('[data-ribbon-scroll]'),null);
 set(25);set(30);assert.equal(current().filter.brightness,130);assert.equal(current().filter.contrast,115);assert.equal(w.latest.past.length,0);
 w.ReactDOM.flushSync(()=>input().dispatchEvent(new w.Event('change',{bubbles:true})));assert.equal(w.latest.past.length,1);
 assert.equal(w.document.querySelector('output').textContent,'+30%');
 click('Back to adjustments');assert(!input());assert.equal(current().filter.brightness,130);
 click('Contrast');assert.equal(input().value,'15');set(-20);click('Back to adjustments');assert.equal(current().filter.contrast,80);assert.equal(w.latest.past.length,2,'Back commits a pending gesture once');
 click('Saturation');assert.equal(input().value,'-10');set(100);click('Done adjusting photo');assert.equal(current().filter.saturate,200);assert(button('Adjust image'));assert.equal(w.latest.selection[0],'a');assert.equal(w.latest.past.length,3);
 w.ReactDOM.flushSync(()=>w.send({type:'undo'}));assert.equal(current().filter.saturate,90);assert.equal(current().filter.contrast,80);
 w.ReactDOM.flushSync(()=>w.send({type:'redo'}));assert.equal(current().filter.saturate,200);
 for(const [label,key,value,expected]of [['Brightness','brightness',-100,0],['Contrast','contrast',100,200],['Saturation','saturate',0,100],['Blur','blur',20,20]]){
  click('Adjust image');click(label);assert.equal(input().min,label==='Blur'?'0':'-100');set(value);click('Done adjusting photo');assert.equal(current().filter[key],expected);
 }
 click('Adjust image');click('Brightness');w.ReactDOM.flushSync(()=>w.send({type:'set-selection',ids:['b']}));assert(!input(),'Switching images resets the adjustment subview');assert(button('Brightness'));click('Brightness');assert.equal(input().value,'0');
 click('Done adjusting photo');w.ReactDOM.flushSync(()=>w.send({type:'update-element',id:'b',patch:{locked:true}}));click('Adjust image');assert(button('Brightness').matches(':disabled'));click('Brightness');assert(!input(),'Locked images cannot be adjusted');
 console.log('PASS: four choices become one slider; live values/default mapping and filter preservation; Back/Done retain edits; one-step Undo/Redo; ranges; image-switch reset; locked controls.');
}finally{w.ReactDOM.flushSync(()=>root.unmount());w.close();}
