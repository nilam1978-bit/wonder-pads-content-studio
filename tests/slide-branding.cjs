// Run: node tests/slide-branding.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');let id=0;
const ctx={uid:()=>String(++id),now:()=>1000,window:{},document:{createElement:()=>({getContext:()=>({font:'',measureText(text){return {width:text.length*Number(this.font.match(/([\d.]+)px/)[1])*.55};}})})}};vm.createContext(ctx);
const utils=read('editor-utils.jsx'),renderer=read('editor-export.jsx'),legacy=read('final-carousel.jsx'),workspace=read('content-workspace.jsx');
vm.runInContext(utils.slice(utils.indexOf('const newElement ='),utils.indexOf('// Branded backgrounds')),ctx);
vm.runInContext(utils.slice(utils.indexOf('function brandBackgroundElements'),utils.indexOf('// Tiny logos')),ctx);
vm.runInContext(utils.slice(utils.indexOf('function reflowBrandBackground'),utils.indexOf('const SLIDE_TEXT_STYLES')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const SLIDE_TEXT_STYLES'),utils.indexOf('function starterBackgroundElements')),ctx);
vm.runInContext(utils.slice(utils.indexOf('function applyBrandSlideFonts'),utils.indexOf('function slideTextRole')),ctx);
vm.runInContext(renderer.slice(renderer.indexOf('let textMeasureContext'),renderer.indexOf('function fitTextSize')),ctx);
vm.runInContext(legacy.slice(0,legacy.indexOf('const CAROUSEL_STYLE_PAIRS')),ctx);
vm.runInContext(legacy.slice(legacy.indexOf('const CAROUSEL_CTA_CHOICES'),legacy.indexOf('function endpointSlide')),ctx);
vm.runInContext(workspace.slice(0,workspace.indexOf('function ContentWorkspace()'))+'\nglobalThis.looks=CONTENT_LOOKS;',ctx);
const brand={logo:'assets/wpr-logo.png',fontBody:'Montserrat',handles:[{platform:'instagram',value:'@ecoclothpad'},{platform:'website',value:'wonder-pads.com'}]};
const text='# A clear cover\nSupporting words.\n# First detail\n## A helpful subheading\nEvery word stays here.\n# Second detail\nAnother point.\n# Final detail\nOur original ending.';
const bounds=e=>({x:e.x,y:e.y,w:e.w,h:e.type==='text'?ctx.textLayout(e).height:e.h});
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
for(const size of ['portrait','post'])for(const look of ctx.looks){
 const settings={format:'carousel',split:'markers',count:4,cover:true,size};
 const draft=ctx.contentWithLook({settings,slides:ctx.prepareContentSlides(text,settings),index:0},look.id);
 const pages=draft.slides.map((slide,i)=>ctx.renderContentSlide(slide,settings,brand,{slideNumber:i+1,totalSlides:draft.slides.length}));
 const cover=pages[0],closing=pages.at(-1),middle=pages.slice(1,-1);
 assert(!cover.elements.some(e=>e.contentDecoration&&e.type==='circle'),'Cover logo has no competing circle');
 if(!look.background){const logo=cover.elements.find(e=>e.brandSlot==='logo');assert(logo.x>=60&&logo.y>=60&&logo.x+logo.w<=1020);}
 for(const page of middle){
  assert(!page.elements.some(e=>e.contentDecoration),'Middle pages have no generated colour band, frame or competing decorations');
  assert(!page.elements.some(e=>e.type==='image'&&e.fromBrand),'Middle footer omits the logo');
  assert(!page.elements.some(e=>e.brandSlot==='website'),'Middle footer omits the website');
  assert.equal(page.elements.find(e=>e.brandSlot==='instagram').text,'@ecoclothpad');
  assert.equal(page.elements.filter(e=>e.fromBrand).length,1,'Only the small handle remains');
  for(const footer of page.elements.filter(e=>e.fromBrand))assert(footer.y+bounds(footer).h<=page.h-60);
 }
 assert.equal(new Set(middle.map(page=>page.bg.value)).size,3,'Subtle neutral variations');
 const branding=closing.elements.filter(e=>e.fromBrand);
 assert.equal(branding.filter(e=>e.brandSlot==='logo').length,1);
 for(const element of branding){const box=bounds(element);assert(box.x>=60&&box.y>=60&&box.x+box.w<=closing.w-60&&box.y+box.h<=closing.h-60,'Closing branding stays comfortably inside the frame');}
 for(let i=0;i<branding.length;i++)for(let j=i+1;j<branding.length;j++)assert(!overlaps(bounds(branding[i]),bounds(branding[j])),'Logo/contact fields do not overlap');
 for(const footer of branding)for(const content of closing.elements.filter(e=>ctx.isContentText(e)||e.engagementAction))assert(!overlaps(bounds(footer),bounds(content)),'Closing content/social actions clear the branding area');
 const resized=ctx.reflowBrandBackground(middle[0],1080,1080,brand);
 assert.equal(resized.find(e=>e.brandSlot==='instagram').y,968);
 const resizedClosing=ctx.reflowBrandBackground(closing,1080,1080,brand),frame=resizedClosing.find(e=>e.contentFrame);
 assert.equal(frame.x,30);assert.equal(frame.w,1020);assert.equal(frame.h,1020);
 for(const element of resizedClosing.filter(e=>e.fromBrand)){const box=bounds(element);assert(box.x>frame.x&&box.y>frame.y&&box.x+box.w<frame.x+frame.w&&box.y+box.h<frame.y+frame.h,'Resized branding stays inside the resized frame');}
 const untouched={...draft.slides[1],originalCanvas:middle[0]};assert.equal(ctx.renderContentSlide(untouched,settings,brand),middle[0],'Saved manual layouts stay intact');
}
console.log('PASS: all styles in portrait/square; plain varied middle slides; compact handle footer; clear cover logo; non-overlapping closing branding/socials inside border; resize reflow and saved layout preservation.');
