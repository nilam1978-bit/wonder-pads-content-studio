// Run: node tests/content-workspace.cjs
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');let id=0;
const ctx={uid:()=>String(++id),now:()=>1000,window:{},React:{createContext:()=>({})},document:{createElement:()=>({getContext:()=>({font:'',measureText(s){return {width:s.length*parseFloat(this.font.match(/([\d.]+)px/)[1])*.55};}})})},brandBackgroundElements:()=>[],ctaEngagementElements:()=>[],cleanSlideSwipe:e=>e};vm.createContext(ctx);
const utils=read('editor-utils.jsx'),renderer=read('editor-export.jsx'),old=read('final-carousel.jsx'),workspace=read('content-workspace.jsx');
vm.runInContext(utils.slice(utils.indexOf('function applyBrandSlideFonts'),utils.indexOf('function slideTextRole')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const newElement ='),utils.indexOf('// Branded backgrounds')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const SLIDE_TEXT_STYLES'),utils.indexOf('function ctaEngagementElements')),ctx);
vm.runInContext(renderer.slice(renderer.indexOf('let textMeasureContext'),renderer.indexOf('function fitTextSize')),ctx);
vm.runInContext(old.slice(0,old.indexOf('const CAROUSEL_STYLE_PAIRS')),ctx);
vm.runInContext(workspace.slice(0,workspace.indexOf('function ContentWorkspace()'))+'\nglobalThis.looks=CONTENT_LOOKS;',ctx);
vm.runInContext(utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('function deepMerge')),ctx);
const settings={format:'carousel',split:'balanced',count:6,cover:true,closing:true,size:'portrait'},brand={};
const source='# My own cover\nExact punctuation — kept!\n\n# My details\n## Subheading one\nMy wording.\n## Subheading two\nAnother point.\n\n# My own closing\nMessage me.';
const slides=ctx.prepareContentSlides(source,settings);assert.equal(slides.length,3);assert.equal(slides[0].kind,'hook');assert.equal(slides[2].kind,'cta');assert.equal(slides[1].blocks.filter(b=>b.role==='sub').length,2);
let draft={id:'draft',slides,index:1,settings};draft.slides[1].blocks[0].text='Edited after splitting';
const words=s=>s.blocks.map(b=>b.text).join('');const before=slides.map(words);
for(const look of ctx.looks){draft=ctx.contentWithLook(draft,look.id,'all');assert.deepEqual(draft.slides.map(words),before);assert.deepEqual(draft.slides.map(s=>s.id),slides.map(s=>s.id));for(const size of ['portrait','post'])for(const slide of draft.slides){const c=ctx.renderContentSlide(slide,{...settings,size},brand);assert.equal(c.h,size==='post'?1080:1350);assert.deepEqual(c.elements.filter(ctx.isContentText).map(e=>e.text),slide.blocks.map(b=>b.text));}}
const once=ctx.contentWithLook(draft,'clear','current');assert.equal(once.slides[0],draft.slides[0]);assert.equal(once.slides[2],draft.slides[2]);assert.equal(once.slides[1].look,'clear');
const split=ctx.contentSplitSlide(slides[1]);assert.equal(split.map(words).join(''),words(slides[1]));assert.equal(split.length,2);assert.notEqual(split[0].id,split[1].id);
const long={id:'long',kind:'content',blocks:[{id:'b',role:'body',text:'Many words. '.repeat(300)}],look:'gentle'};const overflowing=ctx.renderContentSlide(long,settings,brand);assert(ctx.contentOverflow(overflowing));assert.equal(overflowing.elements.filter(ctx.isContentText)[0].text,long.blocks[0].text);const fit=ctx.renderContentSlide({...long,fit:true},settings,brand);assert(fit.elements.filter(ctx.isContentText).every(e=>e.fontSize>=28));
const existing={id:'project',name:'Existing',canvases:[ctx.renderContentSlide(slides[1],settings,brand)],activeCanvasId:slides[1].id};existing.canvases[0].elements.find(ctx.isContentText).text='Canvas edit survives';const resumed=ctx.contentDraftFromProject(existing);assert.equal(ctx.renderContentSlide(resumed.slides[0],resumed.settings,brand),existing.canvases[0]);assert(resumed.slides[0].blocks.some(b=>b.text==='Canvas edit survives'));
let state={projects:[existing],contentDraft:draft,contentDrafts:[],past:[],future:[],carousel:{}};state=ctx.reducer(state,{type:'start-content-draft',draft:ctx.contentDraftNew('New words')});assert.equal(state.contentDrafts.length,1);state=ctx.reducer(state,{type:'resume-content-draft',id:'draft'});assert.equal(state.contentDraft.id,'draft');assert.equal(state.contentDrafts[0].source,'New words');const completed={...existing,canvases:resumed.slides.map(s=>ctx.renderContentSlide(s,resumed.settings,brand))};state=ctx.reducer(state,{type:'finish-content-draft',project:completed});assert.equal(state.projects.length,1);assert.equal(state.contentDraft,null);assert.equal(state.past[0],existing);state=ctx.reducer(state,{type:'undo'});assert.deepEqual(state.projects[0],existing);
assert.throws(()=>ctx.prepareContentSlides('   ',settings),/Add your words/);
// Updating saved source text works for new projects with no legacy carouselSettings.
ctx.canvasSlideText=pages=>pages.flatMap(c=>c.elements.filter(ctx.isContentText).map(e=>e.text)).join('\n');
const revisedSource='# Revised cover\nMy new supporting words.\n# Revised content\n## Still a subheading\nExact revised body.\n# Revised ending\nMy own closing.';
const sourceProject={...existing,sourceText:'Original paste',sourceDraft:revisedSource,contentWorkspaceSettings:{...settings,count:3}};
const originalCanvases=JSON.stringify(sourceProject.canvases);
const sourceDraft=ctx.contentDraftFromProject(sourceProject);assert.equal(sourceDraft.source,revisedSource);
const sourceReview=ctx.contentDraftForSource(sourceProject,revisedSource);
assert.equal(JSON.stringify(sourceProject.canvases),originalCanvases,'Preview must leave the saved design intact');
assert.equal(ctx.renderContentSlide(sourceReview.slides[0],sourceReview.settings,brand),sourceProject.canvases[0]);
assert.equal(sourceReview.sourceReview.slides.length,3);
assert.equal(sourceReview.sourceReview.slides[0].blocks[0].text,'Revised cover');
assert.equal(sourceReview.sourceReview.slides[1].blocks.filter(b=>b.role==='sub').length,1);
assert.equal(sourceReview.sourceReview.slides[0].look,sourceDraft.slides[0].look);
assert.throws(()=>ctx.contentDraftForSource(sourceProject,'  '),/Add your words/);
console.log('PASS: revised source draft restored; preview updates new projects without legacy settings; current canvases retained until apply.');
console.log('PASS: preserved words/edits/roles/subheadings across all looks and ratios; current-slide scope; lossless explicit splits; visible overflow; editor round trip; draft recovery; atomic handoff and Undo.');

// One global font choice reaches saved/archived projects, drafts, history and every look.
const fontBrand={slideFontHeading:'Caveat',slideFontSubheading:'Playfair Display'};
const fontCanvas=ctx.renderContentSlide(slides[1],settings,{});
fontCanvas.elements.push({id:'brand',type:'text',__role:'heading',fromBrand:true,text:'Brand',fontFamily:'Montserrat'});
const fontProject={id:'fonts',canvases:[fontCanvas],thumbnail:'old'};
const fontState={brand:{},projects:[fontProject,{...fontProject,id:'archived',archived:true}],templates:[],contentDraft:{slides:[{originalCanvas:fontCanvas}]},contentDrafts:[{slides:[{originalCanvas:fontCanvas}]}],past:[fontProject],future:[fontProject]};
const applied=ctx.reducer(fontState,{type:'update-brand',patch:fontBrand});
for(const p of [...applied.projects,...applied.past,...applied.future]){
  assert.equal(p.canvases[0].elements.find(e=>e.__role==='heading'&&!e.fromBrand).fontFamily,'Caveat');
  assert.equal(p.canvases[0].elements.find(e=>e.__role==='sub').fontFamily,'Playfair Display');
  assert.equal(p.thumbnail,null);
  p.canvases[0].elements.forEach((e,i)=>{for(const k of ['text','x','y','w','fontSize','color'])assert.equal(e[k],fontCanvas.elements[i][k]);});
  assert.equal(p.canvases[0].elements.at(-1).fontFamily,'Montserrat');
}
assert.equal(applied.contentDraft.slides[0].originalCanvas.elements.find(e=>e.__role==='sub').fontFamily,'Playfair Display');
assert.equal(applied.contentDrafts[0].slides[0].originalCanvas.elements.find(e=>e.__role==='heading').fontFamily,'Caveat');
for(const look of ctx.looks){
  const c=ctx.renderContentSlide({...slides[1],look:look.id},settings,fontBrand);
  assert.equal(c.elements.find(e=>e.__role==='heading').fontFamily,'Caveat');
  assert.equal(c.elements.find(e=>e.__role==='sub').fontFamily,'Playfair Display');
}
const reset=ctx.reducer(applied,{type:'update-brand',patch:{slideFontHeading:'',slideFontSubheading:''}});
assert.deepEqual(reset.projects[0].canvases[0].elements,fontCanvas.elements);
const single=ctx.prepareContentSlides('# One post\n## Important point\nMy details',{...settings,format:'post'});
assert.equal(single.length,1);assert.equal(single[0].blocks[1].role,'sub');
assert.equal(ctx.renderContentSlide(single[0],settings,fontBrand).elements.find(e=>e.__role==='sub').fontFamily,'Playfair Display');
console.log('PASS: global heading/subheading fonts across looks, saved/archived designs, drafts, history, reset and single-post ## parsing; wording/geometry/branding preserved.');
