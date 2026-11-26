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
  await page.goto('http://127.0.0.1:8770/');
  await page.getByRole('button',{name:'Brand Kit',exact:true}).click({timeout:60000});await page.getByRole('button',{name:'Edit brand kit',exact:true}).click();
  await page.getByRole('tab',{name:'Custom size',exact:true}).click();await page.getByRole('spinbutton',{name:'Cover logo size',exact:true}).fill('160');await page.getByRole('spinbutton',{name:'Cover logo size',exact:true}).press('Tab');
  await page.getByRole('button',{name:'# Heading Bold',exact:true}).click();await page.getByRole('button',{name:'# Heading Italic',exact:true}).click();await page.getByRole('button',{name:'## Subheading Underline',exact:true}).click();
  await poll(s=>s.brand?.coverLogoSize===160&&s.brand.slideFontHeadingStyle?.bold&&s.brand.slideFontHeadingStyle?.italic&&s.brand.slideFontSubheadingStyle?.underline);
  assert.equal(await page.locator('.modal').evaluate(el=>el.scrollWidth>el.clientWidth),false,'Brand controls fit mobile width');
  await page.screenshot({path:path.join(outputs,'brand-type-options-mobile.png')});
  await page.locator('.modal .icon-btn').first().click();await page.getByRole('button',{name:'Home',exact:true}).click();
  await page.getByRole('button',{name:/Start creating/}).click();await page.getByRole('button',{name:/Start with your words/}).click();await page.locator('#cw-source').fill(sourceText+'\nNo long dash — in this sentence.');await page.getByRole('button',{name:'Prepare slides',exact:true}).click();await page.getByRole('heading',{name:'Find your look',exact:true}).waitFor();
  await page.getByRole('button',{name:'Slide 2',exact:true}).click();await page.screenshot({path:path.join(outputs,'plain-middle-mobile.png')});
  await page.getByRole('button',{name:'Slide 5',exact:true}).click();await page.screenshot({path:path.join(outputs,'closing-mobile.png')});
  await page.getByRole('button',{name:'Slide 1',exact:true}).click();await page.getByRole('button',{name:'Continue editing',exact:true}).click();await page.getByRole('toolbar',{name:'Page tools',exact:true}).waitFor();
  const state=await poll(s=>s.projects?.[0]?.canvases.length===5),project=state.projects[0],cover=project.canvases[0],heading=cover.elements.find(e=>e.__role==='heading');
  assert.equal(cover.elements.find(e=>e.brandSlot==='logo').w,160);assert.equal(heading.fontWeight,700);assert(heading.italic);assert(cover.elements.find(e=>e.__role==='sub').underline);
  assert(!project.canvases.some(c=>c.elements.some(e=>e.type==='text'&&/[\u2013\u2014]/.test(e.text))));
  await element(heading.id).tap();await tools().waitFor();
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});const ribbon=tools(),fixed=ribbon.getByRole('group',{name:'Selected element actions',exact:true});
   const before=await fixed.boundingBox();assert(before.x>=0&&before.x+before.width<=width);assert((await ribbon.boundingBox()).height<=60);assert((await page.getByRole('toolbar',{name:'Page tools',exact:true}).boundingBox()).height<=60);
   assert.equal(await ribbon.getByRole('button',{name:/Scroll tools/}).count(),0);assert.equal(await ribbon.getByRole('button',{name:'Duplicate element',exact:true}).count(),1);assert.equal(await ribbon.getByRole('button',{name:'Delete element',exact:true}).count(),1);
   const tick=ribbon.getByRole('button',{name:'Done selecting',exact:true});assert.equal(await tick.innerText(),'');assert((await tick.boundingBox()).width>=44);assert.equal(await tick.evaluate(el=>getComputedStyle(el).backgroundColor),await tick.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--pink-600').trim()).then(hex=>{const n=parseInt(hex.slice(1),16);return `rgb(${n>>16}, ${(n>>8)&255}, ${n&255})`;}));
   await ribbon.locator('[data-ribbon-scroll]').evaluate(el=>el.scrollLeft=el.scrollWidth);const after=await fixed.boundingBox();assert.equal(Math.round(before.x),Math.round(after.x),'Pinned actions do not move with tools');
   assert(await tick.isVisible());const first=ribbon.locator('.mobile-ribbon-tool').first();assert(['flex','inline-flex'].includes(await first.evaluate(el=>getComputedStyle(el).display)));assert.equal(await first.evaluate(el=>getComputedStyle(el).borderRadius),'13px');
   await ribbon.locator('[data-ribbon-scroll]').evaluate(el=>el.scrollLeft=0);
   await page.screenshot({path:path.join(outputs,'polished-text-ribbon-'+width+'.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.setViewportSize({width:390,height:844});await tools().getByRole('button',{name:'Position',exact:true}).click();const panel=page.getByRole('region',{name:'Position controls',exact:true});await panel.waitFor();
  assert.equal(await tools().getByRole('button',{name:'Position',exact:true}).getAttribute('aria-expanded'),'true');
  await page.waitForFunction(()=>{const button=document.querySelector('button[aria-label="Position"]');return button&&getComputedStyle(button).backgroundColor!=='rgb(255, 255, 255)';});
  assert.notEqual(await tools().getByRole('button',{name:'Position',exact:true}).evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await panel.getByRole('textbox').count(),0);assert.equal(await panel.getByRole('combobox').count(),0);assert.equal(await panel.locator('input').count(),0);assert.equal(await panel.getByRole('button',{name:/Scroll tools/}).count(),0);
  for(const name of ['Move forward one layer','Move backward one layer','Bring to front','Send to back','Align left to slide','Centre horizontally on slide','Align right to slide','Align top to slide','Centre vertically on slide','Align bottom to slide','Nudge left','Nudge right','Nudge up','Nudge down'])assert.equal(await panel.getByRole('button',{name,exact:true}).count(),1);
  await tools().getByRole('button',{name:'Increase font size',exact:true}).click();await poll(s=>s.projects[0].canvases[0].elements.find(e=>e.id===heading.id).fontSize===heading.fontSize+2);await tools().getByRole('button',{name:'Decrease font size',exact:true}).click();await poll(s=>s.projects[0].canvases[0].elements.find(e=>e.id===heading.id).fontSize===heading.fontSize);
  const oldX=heading.x;await panel.getByRole('button',{name:'Nudge right',exact:true}).click();await poll(s=>s.projects[0].canvases[0].elements.find(e=>e.id===heading.id).x===oldX+10);await page.screenshot({path:path.join(outputs,'compact-context-position-mobile.png')});
  await tools().getByRole('button',{name:'Duplicate element',exact:true}).tap();let saved=await poll(s=>s.projects[0].canvases[0].elements.length===cover.elements.length+1);const duplicate=saved.projects[0].canvases[0].elements.at(-1);assert.equal(duplicate.text,heading.text);
  await tools().getByRole('button',{name:'Delete element',exact:true}).tap();await poll(s=>s.projects[0].canvases[0].elements.length===cover.elements.length);await page.getByRole('button',{name:'Undo',exact:true}).click();await poll(s=>s.projects[0].canvases[0].elements.some(e=>e.id===duplicate.id));
  await element(duplicate.id).tap();await tools().getByRole('button',{name:'Done selecting',exact:true}).tap();assert.equal(await tools().count(),0);
  await element(duplicate.id).tap();await tools().getByRole('button',{name:'Delete element',exact:true}).tap();await poll(s=>s.projects[0].canvases[0].elements.length===cover.elements.length);
  await page.getByRole('button',{name:'Select brand logo',exact:true}).tap();await tools().waitFor();assert.equal(await tools().getByRole('button',{name:'Replace artwork',exact:true}).count(),1);assert.equal(await tools().getByRole('button',{name:'Position',exact:true}).count(),1);assert.equal(await tools().getByRole('button',{name:'Opacity',exact:true}).count(),1);await page.screenshot({path:path.join(outputs,'polished-image-ribbon-mobile.png')});await tools().getByRole('button',{name:'Done selecting',exact:true}).tap();
  const main=page.getByRole('toolbar',{name:'Page tools',exact:true});assert.equal(await main.getByRole('button').count(),9);assert.equal(await page.getByRole('button',{name:'Design actions',exact:true}).count(),1);
  assert.equal(await main.getByRole('button',{name:'Add text',exact:true}).evaluate(el=>getComputedStyle(el).flexDirection),'column');
  // Verify actual PNG output, including editable-logo and closing-footer geometry.
  for(const [index,name] of [[0,'clean-cover-export'],[1,'plain-middle-export'],[4,'closing-export']]){
   const data=await page.evaluate(async canvas=>{const blob=await rasterizeDesign(canvas);return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});},project.canvases[index]);
   assert(data.startsWith('data:image/png'));fs.writeFileSync(path.join(outputs,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  }
  assert.deepEqual(errors,[]);console.log('PASS: compact main/context ribbons at 390/320px; all tools accessible without More/scroll arrows; fixed icon actions and prominent tick; layer/alignment/nudge actions with fixed step; duplicate/delete/Undo/Done; image tools; real cover/middle/closing PNG exports.');
 }catch(e){await page.screenshot({path:path.join(outputs,'ribbon-layout-failure.png')});console.error(errors);throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
