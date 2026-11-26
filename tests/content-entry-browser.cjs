// Run: node tests/content-entry-browser.cjs with Playwright installed.
// CONTENT_TEST_VENDOR_DIR: directory containing react.development.js,
// react-dom.development.js and babel.min.js for offline browser checks.
// Optional: PLAYWRIGHT_MODULE, CHROME_EXECUTABLE, CONTENT_TEST_OUTPUT_DIR.
// Keyboard checks simulate visualViewport.height; they do not establish native iOS behaviour.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=path.resolve(__dirname,'..'),vendor=process.env.CONTENT_TEST_VENDOR_DIR,outputs=process.env.CONTENT_TEST_OUTPUT_DIR||path.join(require('node:os').tmpdir(),'wonder-pads-entry-checks');
if(!vendor)throw new Error('Set CONTENT_TEST_VENDOR_DIR to local React, ReactDOM and Babel UMD scripts.');
fs.mkdirSync(outputs,{recursive:true});
const initial='# From your message to your door.\n## How a custom Wonder Pad comes together.\nA supporting sentence.\n# Start with a conversation.\nTell me what you are looking for.\n# Your next step\nEvery ending stays.';
const revised=initial+'\n# One more step\nThis new ending must become a separate slide.';
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());
 await page.route('http://127.0.0.1:8770/**',async route=>{
  const u=new URL(route.request().url()),file=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));
  const target=file.startsWith('__test-vendor/')?path.join(vendor,file.slice(14)):path.join(repo,file);
  if(!fs.existsSync(target))return route.fulfill({status:404,body:''});
  let body=fs.readFileSync(target);if(file==='index.html')body=body.toString().replace(/https:\/\/unpkg.com\/react@[^"\s]+/,'/__test-vendor/react.development.js').replace(/https:\/\/unpkg.com\/react-dom@[^"\s]+/,'/__test-vendor/react-dom.development.js').replace(/https:\/\/unpkg.com\/@babel\/standalone@[^"\s]+/,'/__test-vendor/babel.min.js').replace(/ integrity="[^"]*"/g,'');
  await route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':/\.jsx?$/.test(file)?'text/javascript; charset=utf-8':'application/octet-stream',body});
 });
 const snapshot=()=>page.evaluate(async()=>(await studioStorage.read())?.state||{});
 async function poll(check){for(let n=0;n<80;n++){const state=await snapshot();if(check(state))return;await page.waitForTimeout(100);}throw Error('Save did not settle');}
 try{
  await page.goto('http://127.0.0.1:8770/');await page.getByRole('button',{name:/Start creating/}).click({timeout:60000});await page.getByRole('button',{name:/Start with your words/}).click();
  const source=page.locator('#cw-source');await source.fill('Typing on a phone.');
  for(const [width,height] of [[390,380],[320,300],[390,470]]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>new Promise(requestAnimationFrame));
   await source.focus();await page.evaluate(height=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>height});visualViewport.dispatchEvent(new Event('resize'));},height);
   await page.locator('.cw-entry-typing').waitFor();
   const text=await source.boundingBox(),markers=await page.locator('.cw-entry-markers').boundingBox(),bar=await page.locator('.cw-entry-wordbar').boundingBox();
   assert(text.height>=height-130,`writing area priority at ${width}x${height}`);assert(markers.y+markers.height<=text.y+1);assert(text.y+text.height<=bar.y+1);assert(bar.y+bar.height<=height+1);
   assert.equal(await page.locator('.cw-entry-footer').isVisible(),false);assert(await page.getByRole('button',{name:'Done',exact:true}).isVisible());
   await page.getByRole('button',{name:'+ Slide',exact:true}).tap();assert(await source.evaluate(el=>document.activeElement===el));await page.locator('.cw-entry-typing').waitFor();
   await page.screenshot({path:path.join(outputs,`keyboard-writing-${width}-${height}.png`),clip:{x:0,y:0,width,height}});
   await page.getByRole('button',{name:'Done',exact:true}).tap();assert.equal(await source.evaluate(el=>document.activeElement===el),false);
   await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});await page.locator('.cw-entry-footer').waitFor();
  }
  await page.setViewportSize({width:390,height:844});await source.fill(initial);await page.getByRole('button',{name:'Prepare slides',exact:true}).click();await page.getByRole('heading',{name:'Find your look',exact:true}).waitFor();await poll(s=>s.contentDraft?.slides.length===4);
  const original=(await snapshot()).contentDraft,oldSlides=JSON.stringify(original.slides);
  for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});const b=await page.getByRole('button',{name:'Edit source text',exact:true}).boundingBox();assert(b&&b.x>=0&&b.x+b.width<=width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.screenshot({path:path.join(outputs,'design-edit-source-desktop.png')});
  await page.getByRole('button',{name:'Edit source text',exact:true}).click();assert.equal(await source.inputValue(),initial);await source.fill(revised);
  await page.locator('.cw-entry-options').click();await page.getByRole('button',{name:'Square · 1:1',exact:true}).click();await page.getByRole('button',{name:'Apply options',exact:true}).click();
  await poll(s=>s.contentDraft?.source===revised&&s.contentDraft.sourceSettings?.size==='post');assert.equal((await snapshot()).contentDraft.settings.size,'portrait');assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  await page.getByRole('button',{name:'Back to design',exact:true}).click();await page.getByRole('heading',{name:'Find your look',exact:true}).waitFor();assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  await page.getByRole('button',{name:'Edit source text',exact:true}).click();assert.equal(await source.inputValue(),revised);await page.getByRole('button',{name:'Preview updated slides',exact:true}).click();await page.getByRole('heading',{name:'Review updated slides',exact:true}).waitFor();await page.getByRole('button',{name:'Keep current slides',exact:true}).click();assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);assert(await source.isVisible());
  await page.getByRole('button',{name:'Preview updated slides',exact:true}).click();await page.getByRole('button',{name:'Apply this version',exact:true}).click();await page.getByRole('heading',{name:'Find your look',exact:true}).waitFor();await poll(s=>s.contentDraft?.slides.length===5&&s.contentDraft.settings.size==='post');
  const updated=(await snapshot()).contentDraft;assert.equal(updated.slides[3].blocks[0].text,'One more step');assert.equal(updated.slides[0].blocks[1].role,'sub');assert(updated.slides.every(s=>!s.blocks.some(b=>/^# /m.test(b.text))));assert.equal(updated.sourceSettings,null);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await poll(s=>s.contentDraft?.slides.length===4);assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Edit source text',exact:true}).click();await source.focus();await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>380});visualViewport.dispatchEvent(new Event('resize'));});await page.locator('.cw-entry-typing').waitFor();assert((await source.boundingBox()).height>200);
  await page.getByRole('button',{name:'Done',exact:true}).tap();await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});await page.getByRole('button',{name:'Back to design',exact:true}).click();await page.screenshot({path:path.join(outputs,'design-edit-source-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: simulated keyboard viewports at 390x380, 320x300 and 390x470; large usable text area, visible markers/Done, touch marking and restored controls. Source editing at desktop/mobile: retained drafts, staged options, exact slides kept on Back/Cancel, review/apply, marker parsing and Undo.');
 }catch(e){await page.screenshot({path:path.join(outputs,'source-mobile-failure.png')});console.error(errors);throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
