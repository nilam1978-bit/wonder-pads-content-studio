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
  await page.setViewportSize({width:1280,height:900});await source.waitFor();assert.equal(await source.inputValue(),initial);
  assert.equal(await page.locator('.cw-workspace .cw-entry-options').count(),0);
  assert.equal(await page.getByRole('button',{name:'Edit source text',exact:true}).count(),0);
  assert(await page.getByRole('button',{name:'Update slides',exact:true}).isDisabled());
  const middleBefore=JSON.stringify((await snapshot()).contentDraft.slides.slice(1,-1));
  await page.getByRole('button',{name:'Slide 2',exact:true}).click();
  await page.getByRole('button',{name:'Deep plum',exact:true}).click();await poll(s=>s.contentDraft?.slides[0].look==='floral-deep-plum');
  assert.equal((await snapshot()).contentDraft.index,0);assert.equal(JSON.stringify((await snapshot()).contentDraft.slides.slice(1,-1)),middleBefore);
  assert.equal((await page.locator('.cw-color-styles').boundingBox()).height<=64,true);assert.equal(await page.locator('.cw-color-styles .mobile-page-art').count(),0);
  assert((await page.getByRole('button',{name:'Deep plum',exact:true}).boundingBox()).height>=44);
  await page.getByRole('combobox',{name:'Style family',exact:true}).selectOption('Bold');assert.equal(await page.locator('.cw-color-styles button').count(),2);
  await page.getByRole('combobox',{name:'Style family',exact:true}).selectOption('All');
  await page.screenshot({path:path.join(outputs,'source-style-workspace-desktop.png')});
  for(const width of [390,320]){
   await page.setViewportSize({width,height:width===320?568:844});await page.getByRole('button',{name:'Design',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert((await page.locator('.cw-preview-stage').boundingBox()).height>(width===390?350:120));
   await page.getByRole('button',{name:'Peach',exact:true}).click();assert((await page.locator('.cw-color-styles').evaluate(el=>el.scrollLeft))>0);
   assert((await page.getByRole('button',{name:'Peach',exact:true}).boundingBox()).height<=52);
   if(width===390)await page.screenshot({path:path.join(outputs,'source-style-workspace-mobile-design.png')});
  }
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Slide 2',exact:true}).click();
  await page.getByRole('button',{name:'Text',exact:true}).click();await source.evaluate(el=>{el.focus();el.setSelectionRange(18,18);});
  await page.getByRole('button',{name:'Design',exact:true}).click();await page.getByRole('button',{name:'Text',exact:true}).click();assert.equal(await source.evaluate(el=>el.selectionStart),18);
  await poll(s=>s.contentDraft?.index===1);assert.equal(await source.inputValue(),initial);
  const original=(await snapshot()).contentDraft,oldSlides=JSON.stringify(original.slides);
  await source.fill(revised);await poll(s=>s.contentDraft?.source===revised);assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  assert(await page.getByRole('button',{name:'Update slides',exact:true}).isEnabled());
  await page.getByRole('button',{name:'Caption & hashtags',exact:true}).click();await page.getByRole('textbox',{name:'Caption & hashtags',exact:true}).fill('A retained caption #wonderpads');await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await page.getByRole('button',{name:'Design',exact:true}).click();assert(await page.getByRole('button',{name:'Continue with current slides',exact:true}).isVisible());
  await page.getByRole('button',{name:'Text',exact:true}).click();await page.getByRole('button',{name:'Update slides',exact:true}).click();await page.getByRole('heading',{name:'Review updated slides',exact:true}).waitFor();await page.getByRole('button',{name:'Keep current slides',exact:true}).click();assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);assert(await source.isVisible());
  await page.getByRole('button',{name:'Update slides',exact:true}).click();await page.getByRole('button',{name:'Apply this version',exact:true}).click();await poll(s=>s.contentDraft?.slides.length===5);
  const updated=(await snapshot()).contentDraft;assert.equal(updated.slides[3].blocks[0].text,'One more step');assert.equal(updated.slides[0].blocks[1].role,'sub');assert(updated.slides.every(s=>!s.blocks.some(b=>/^# /m.test(b.text))));assert.equal(updated.appliedSource,revised);assert.equal(updated.slides[0].look,'floral-peach');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await poll(s=>s.contentDraft?.slides.length===4);assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  await page.getByRole('button',{name:'Text',exact:true}).click();assert(await page.getByRole('button',{name:'Update slides',exact:true}).isEnabled());
  await page.screenshot({path:path.join(outputs,'source-style-workspace-mobile-text.png')});
  await source.focus();await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>380});visualViewport.dispatchEvent(new Event('resize'));});await page.locator('.cw-workspace-typing').waitFor();assert((await source.boundingBox()).height>200);
  await page.getByRole('button',{name:'+ Subheading',exact:true}).tap();await page.locator('.cw-workspace-typing').waitFor();assert(await source.evaluate(el=>document.activeElement===el));
  await page.screenshot({path:path.join(outputs,'source-style-workspace-keyboard.png'),clip:{x:0,y:0,width:390,height:380}});
  await page.getByRole('button',{name:'Done',exact:true}).tap();await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  const pendingSource=await source.inputValue();await poll(s=>s.contentDraft?.source===pendingSource);await page.reload();await page.getByRole('button',{name:/Continue with your words/}).click({timeout:60000});await page.getByRole('button',{name:'Text',exact:true}).click();assert.equal(await source.inputValue(),pendingSource);assert.equal(JSON.stringify((await snapshot()).contentDraft.slides),oldSlides);
  await page.getByRole('button',{name:'Continue with current slides',exact:true}).click();await poll(s=>s.projects?.length===1);assert.equal((await snapshot()).projects[0].sourceDraft,pendingSource);
  await page.getByRole('button',{name:'Back to studio',exact:true}).click();await page.getByRole('button',{name:/Start with your words/}).click();
  await source.fill('A first sentence with several useful words. A second point also has enough words for balanced slides. A final sentence completes this small example.');
  await page.locator('.cw-entry-options').click();await page.getByRole('combobox',{name:'Split by',exact:true}).selectOption('balanced');await page.getByRole('spinbutton',{name:'Source slides',exact:true}).fill('2');await page.getByRole('button',{name:'Apply options',exact:true}).click();await page.getByRole('button',{name:'Prepare slides',exact:true}).click();await page.getByRole('button',{name:'Text',exact:true}).click();
  await page.getByRole('button',{name:'Slide breaks: Balanced · Change',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Square · 1:1',exact:true}).count(),0);await page.getByRole('spinbutton',{name:'Source slides',exact:true}).fill('3');await page.getByRole('button',{name:'Save changes',exact:true}).click();await poll(s=>s.contentDraft?.sourceSettings?.count===3);assert.equal((await snapshot()).contentDraft.settings.count,2);
  await page.getByRole('button',{name:'Update slides',exact:true}).click();await page.getByRole('button',{name:'Apply this version',exact:true}).click();await poll(s=>s.contentDraft?.slides.length===4&&s.contentDraft.settings.count===3);
  assert.deepEqual(errors,[]);console.log('PASS: keyboard layouts; persistent raw source and caret/slide retention; compact scrollable colour cards with larger canvas; no repeated post settings; review/cancel/apply/Undo; caption, pending draft and reload preservation; splitting-only options for balanced designs.');
 }catch(e){await page.screenshot({path:path.join(outputs,'source-mobile-failure.png')});console.error(errors);throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
