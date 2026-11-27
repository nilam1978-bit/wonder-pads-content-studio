// Playwright browser checks. Uses the same environment variables as content-entry-browser.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..'),vendor=process.env.CONTENT_TEST_VENDOR_DIR,outputs=process.env.CONTENT_TEST_OUTPUT_DIR||path.join(require('node:os').tmpdir(),'wonder-pads-ribbon-checks');
if(!vendor)throw new Error('Set CONTENT_TEST_VENDOR_DIR to local React, ReactDOM and Babel UMD scripts.');fs.mkdirSync(outputs,{recursive:true});
const sourceText='# From your message to your door\n## Made with care\nA thoughtful choice, made by hand.\n# Start with a conversation\nTell me what you are looking for in a pad.\n# Choose your fabric\nExplore printed cotton and organic solid cotton options.\n# Made by hand\nYour original wording stays here.';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());
 await page.route('http://127.0.0.1:8770/**',async route=>{
  const file=decodeURIComponent(new URL(route.request().url()).pathname.slice(1))||'index.html',target=file.startsWith('__test-vendor/')?path.join(vendor,file.slice(14)):path.join(repo,file);
  if(!fs.existsSync(target))return route.fulfill({status:404,body:''});let body=fs.readFileSync(target);
  if(file==='index.html')body=body.toString().replace(/https:\/\/unpkg.com\/react@[^"\s]+/,'/__test-vendor/react.development.js').replace(/https:\/\/unpkg.com\/react-dom@[^"\s]+/,'/__test-vendor/react-dom.development.js').replace(/https:\/\/unpkg.com\/@babel\/standalone@[^"\s]+/,'/__test-vendor/babel.min.js').replace(/ integrity="[^"]*"/g,'');
  await route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':/\.jsx?$/.test(file)?'text/javascript; charset=utf-8':'application/octet-stream',body});
 });
 const snapshot=()=>page.evaluate(async()=>(await studioStorage.read())?.state||{});
 async function poll(check){for(let n=0;n<100;n++){const state=await snapshot();if(check(state))return state;await page.waitForTimeout(100);}throw Error('Save did not settle');}
 const element=id=>page.locator(`[data-el-id="${id}"]`);
 const tools=()=>page.getByRole('toolbar',{name:'Selected element tools',exact:true});

 try{
  await page.goto('http://127.0.0.1:8770/');await page.getByRole('button',{name:'Brand Kit',exact:true}).waitFor({timeout:60000});
  await page.evaluate(()=>{
   document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='context-audit';host.style.cssText='position:fixed;inset:0;background:#fdfbfc;';document.body.appendChild(host);
   const h=React.createElement;
   function Harness(){const [config,setConfig]=React.useState({kind:'text',tool:'size',seq:0}),[state,dispatch]=React.useReducer((s,a)=>a.type==='load-state'?a.state:reducer(s,a),null,initialState);window.auditState=state;
    window.auditConfigure=(kind,tool)=>{const source=FLORAL_STICKERS[0];let type=['photo','logo','art'].includes(kind)?'image':kind==='care-icon'||kind==='general-icon'?'icon':kind;const el=newElement(type,{id:'audit-element',text:'Audit words stay intact',x:80,y:80,w:400,h:200,fontFamily:'Montserrat',fontSize:44,color:'#78265F',fill:'#F1CFEA',stroke:'#7A2359',strokeWidth:2,radius:12,sides:6,shape:'rounded',src:kind==='logo'?'assets/wpr-logo.png':source.src,...(kind==='art'?{stickerId:source.id,artworkAspect:source.width/source.height}:{}),name:kind==='care-icon'?CARE_ICON_LIBRARY[0].id:'heart'});const canvas={id:'audit-canvas',w:1080,h:1350,elements:[el],bg:{type:'color',value:'#FFFFFF'}},project={id:'audit-project',activeCanvasId:canvas.id,canvases:[canvas]};const next={...initialState(),projects:[project],activeProjectId:project.id,selection:[el.id],uploads:['assets/wpr-logo.png']};dispatch({type:'load-state',state:next});setConfig(c=>({kind,tool,seq:c.seq+1,next}));};
    const actual=config.next&&state.activeProjectId!=='audit-project'?config.next:state,canvas=activeCanvas(actual),el=canvas?.elements[0];return h(StoreCtx.Provider,{value:{state:actual,dispatch}},el?h('div',{className:'mobile-ribbon-dock',style:{position:'absolute',bottom:0,left:0,right:0,height:44}},h('div',{className:'mobile-ribbon-context'},h(MobileToolTray,{key:config.seq,el,tool:config.tool,onClose:()=>{}}))):null);
   }ReactDOM.render(h(Harness),host);
  });
  const scenarios={text:['font','colour','styles','size','format','opacity','position'],rect:['colour','outline','shape','size','opacity','position'],polygon:['colour','outline','shape','size','opacity','position'],circle:['colour','outline','shape','size','opacity','position'],line:['colour','shape','size','opacity','position'],arrow:['colour','shape','size','opacity','position'],photo:['size','flip','fit','replace-artwork','adjust','opacity','position'],logo:['size','replace-artwork','adjust','opacity','position'],art:['size','flip','replace-artwork','adjust','opacity','position'],frame:['size','frame','opacity','position'],'care-icon':['colour','accent','shape','size','flip','replace-icon','opacity','position'],'general-icon':['colour','shape','size','flip','replace-icon','opacity','position']};let tested=0;
  for(const width of [320,390]){await page.setViewportSize({width,height:844});for(const [kind,tools]of Object.entries(scenarios))for(const tool of tools){await page.evaluate(({kind,tool})=>window.auditConfigure(kind,tool),{kind,tool});await page.locator('#context-audit .mobile-ribbon-panel').waitFor();
   const panel=page.locator('#context-audit .mobile-ribbon-panel').first(),box=await panel.boundingBox();assert(box.x>=-.5&&box.x+box.width<=width+.5,kind+' '+tool+' fits');assert(box.height<=160,kind+' '+tool+' defaults to a short row');
   const strip=panel.locator('.mobile-library-scroll');if(await strip.count()){assert.equal(await strip.evaluate(el=>getComputedStyle(el).overflowX),'auto');const expand=panel.locator('.mobile-library-expand');const before=await expand.boundingBox();await strip.evaluate(el=>el.scrollLeft=el.scrollWidth);assert.equal((await expand.boundingBox()).x,before.x);await expand.tap();const drawer=page.locator('dialog.mobile-library-drawer[open]');await drawer.waitFor();assert.equal(await drawer.count(),1);assert((await drawer.boundingBox()).height<=422.5,kind+' '+tool+' half screen');await drawer.getByRole('button',{name:/^Collapse /}).tap();}
   if(['photo','logo','art'].includes(kind)&&tool==='size'){await panel.getByRole('button',{name:'Expand image size settings',exact:true}).tap();const advanced=page.getByRole('dialog',{name:'Image size settings',exact:true});await advanced.waitFor();assert((await advanced.boundingBox()).height<=422.5);await advanced.getByRole('button',{name:'Collapse Image size settings',exact:true}).tap();}
   if(kind==='rect'&&tool==='colour'){await panel.getByRole('button',{name:'Fill #000000',exact:true}).tap();await page.waitForFunction(()=>window.auditState.projects[0]?.canvases[0].elements[0].fill==='#000000');await page.screenshot({path:path.join(outputs,'audit-shape-fill-'+width+'.png')});}
   if(kind==='rect'&&tool==='shape'){await panel.getByRole('button',{name:'Increase Corner radius',exact:true}).tap();await page.waitForFunction(()=>window.auditState.projects[0]?.canvases[0].elements[0].radius===13);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);tested++;
  }}
  assert.deepEqual(errors,[]);console.log('PASS: '+tested+' contextual tool/viewport cases across text, shapes, lines, images/logos/art, frames and icons; horizontal rows, short default panels, fixed expand controls, half-screen full settings and working shape edits.');
 }catch(e){await page.screenshot({path:path.join(outputs,'context-audit-failure.png')});console.error(errors);throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
