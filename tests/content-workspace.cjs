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
vm.runInContext(old.slice(old.indexOf('const CAROUSEL_CTA_CHOICES'),old.indexOf('function endpointSlide')),ctx);
vm.runInContext(utils.slice(utils.indexOf('function ctaEngagementElements'),utils.indexOf('function starterBackgroundElements')),ctx);
vm.runInContext(workspace.slice(0,workspace.indexOf('function ContentWorkspace('))+'\nglobalThis.looks=CONTENT_LOOKS.filter(look=>look.id!=="blank");',ctx);
// Mark the current line without losing text, indentation, selection or existing markers.
let marked=ctx.contentMarkedLine('First line\nSecond line',15,15,'# ');
assert.equal(marked.text,'First line\n# Second line');assert.equal(marked.start,17);
marked=ctx.contentMarkedLine(marked.text,marked.start,marked.end,'## ');
assert.equal(marked.text,'First line\n## Second line');assert.equal(marked.start,18);
marked=ctx.contentMarkedLine(marked.text,marked.start,marked.end,'## ');
assert.equal(marked.text,'First line\n## Second line');assert.equal(marked.start,18);
assert.equal(ctx.contentMarkedLine('  ## Heading\nBody',7,7,'# ').text,'  # Heading\nBody');
assert.equal(ctx.contentMarkedLine('Words\n',6,6,'# ').text,'Words\n# ');
assert.equal(ctx.contentMarkedLine('',0,0,'## ').text,'## ');
marked=ctx.contentMarkedLine('Alpha beta',0,5,'# ');
assert.equal(marked.text,'# Alpha beta');assert.equal(marked.start,2);assert.equal(marked.end,7);
console.log('PASS: current-line markers preserve words, indentation and selections; switching/repeating markers and empty lines.');
vm.runInContext(utils.slice(utils.indexOf('const HISTORY_LIMIT'),utils.indexOf('function deepMerge')),ctx);
const settings={format:'carousel',split:'balanced',count:6,cover:true,closing:true,size:'portrait'},brand={};
const source='# My own cover\nExact punctuation — kept!\n\n# My details\n## Subheading one\nMy wording.\n## Subheading two\nAnother point.\n\n# My own closing\nMessage me.';
const slides=ctx.prepareContentSlides(source,settings);assert.equal(slides.length,4);assert.equal(slides[0].kind,'hook');assert.equal(slides[2].kind,'content');assert.equal(slides[3].kind,'cta');assert(slides[3].standardCta);assert.equal(slides[1].blocks.filter(b=>b.role==='sub').length,2);
let draft={id:'draft',slides,index:1,settings};draft.slides[1].blocks[0].text='Edited after splitting';
const words=s=>s.blocks.map(b=>b.text).join('');const before=slides.map(words);
for(const look of ctx.looks){draft=ctx.contentWithLook(draft,look.id,'all');assert.deepEqual(draft.slides.map(words),before);assert.deepEqual(draft.slides.map(s=>s.id),slides.map(s=>s.id));for(const size of ['portrait','post'])for(const slide of draft.slides){const c=ctx.renderContentSlide(slide,{...settings,size},brand);assert.equal(c.h,size==='post'?1080:1350);assert.deepEqual(c.elements.filter(ctx.isContentText).map(e=>e.text),slide.blocks.map(b=>b.text));}}
const once=ctx.contentWithLook(draft,'clear');assert.equal(once.slides[1],draft.slides[1]);assert.equal(once.slides[2],draft.slides[2]);assert.equal(once.slides[0].look,'clear');assert.equal(once.slides[3].look,'clear');assert.equal(once.index,0);
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
assert.equal(sourceReview.sourceReview.slides.length,4);
assert.equal(sourceReview.sourceReview.slides[0].blocks[0].text,'Revised cover');
assert.equal(sourceReview.sourceReview.slides[1].blocks.filter(b=>b.role==='sub').length,1);
assert.equal(sourceReview.sourceReview.slides[0].look,sourceDraft.slides[0].look);
assert.throws(()=>ctx.contentDraftForSource(sourceProject,'  '),/Add your words/);
console.log('PASS: revised source draft restored; preview updates new projects without legacy settings; current canvases retained until apply.');
console.log('PASS: preserved words/edits/roles/subheadings across all looks and ratios; cover-only scope; lossless explicit splits; visible overflow; editor round trip; draft recovery; atomic handoff and Undo.');

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

// The cover controls only the endpoints. Every source slide survives; exactly one CTA is appended.
const middleBefore=JSON.stringify(draft.slides.slice(1,-1)),ctaWords=words(draft.slides.at(-1));
for(const look of ctx.looks){
  const changed=ctx.contentWithLook({...draft,index:2},look.id);
  assert.equal(changed.index,0);assert.equal(changed.slides.length,4);
  assert.equal(JSON.stringify(changed.slides.slice(1,-1)),middleBefore);
  assert.equal(changed.slides[2].blocks[0].text,'My own closing');
  assert.equal(words(changed.slides.at(-1)),ctaWords);
  assert.equal(changed.slides.filter(s=>s.kind==='cta').length,1);
  assert.equal(changed.slides[0].look,look.id);assert.equal(changed.slides.at(-1).look,look.id);
  for(const size of ['portrait','post']){
    const pages=changed.slides.map(s=>ctx.renderContentSlide(s,{...settings,size},fontBrand));
    const cover=pages[0],cta=pages.at(-1);
    assert.equal(cta.bg.value,cover.bg.value);assert.equal(pages[1].bg.value,'#FFF9FC');
    assert.equal(cta.elements.find(e=>e.__role==='heading').color,cover.elements.find(e=>e.__role==='heading').color);
    assert.equal(cta.elements.filter(e=>e.ctaGroup&&e.engagementAction).length,1);
    assert(cta.elements.filter(ctx.isContentText).every(e=>e.y+ctx.textLayout(e).height<=cta.h-380));
    const saved={id:'saved',canvases:pages,contentWorkspaceSettings:settings,activeCanvasId:pages[0].id};
    const resumed=ctx.contentDraftFromProject(saved);
    assert.equal(ctx.contentWithLook(resumed,look.id).slides.length,4,'Reopening must not duplicate the CTA');
  }
}
assert.equal(ctx.prepareContentSlides('# One carousel page\nDetails',settings).length,2);
assert.equal(ctx.prepareContentSlides('# Single image\nDetails',{...settings,format:'post'}).length,1);
assert(!/setScope|Whole carousel|This slide|Last slide is a closing slide/.test(workspace));
console.log('PASS: cover-only picker; fixed cream content; one standard CTA with cover colours and social actions; both ratios; preserved last source slide; no duplicate on reopen; single posts unchanged.');

// Uploaded templates retain their complete footer and aspect ratio on both sizes.
const floralLooks=ctx.looks.filter(look=>look.background);
assert.equal(floralLooks.length,5);
for(const look of floralLooks){
  assert(fs.existsSync(path.join(root,look.background)));
  for(const size of ['portrait','post']){
    const changed=ctx.contentWithLook(draft,look.id);
    const pages=changed.slides.map(slide=>ctx.renderContentSlide(slide,{...settings,size},fontBrand));
    const cover=pages[0],background=cover.elements.find(el=>el.src===look.background);
    assert(background&&background.locked&&background.fromBrand&&background.contentDecoration);
    assert.equal(background.w/background.h,1080/1350);
    assert.equal(background.y,0);assert.equal(background.h,cover.h);
    assert.equal(background.x,(cover.w-background.w)/2);
    assert(!pages.at(-1).elements.some(el=>el.src===look.background),'CTA only follows the palette');
    const saved={id:'floral',canvases:pages,activeCanvasId:cover.id,contentWorkspaceSettings:settings};
    const reopened=ctx.contentDraftFromProject(saved);
    assert.equal(reopened.slides[0].assets.length,0,'Background must not become duplicated artwork on restyle');
    const restyled=ctx.renderContentSlide(ctx.contentWithLook(reopened,look.id).slides[0],{...settings,size},fontBrand);
    assert.equal(restyled.elements.filter(el=>el.src===look.background).length,1);
  }
}
console.log('PASS: five bundled backgrounds, complete uncropped footer in both ratios, palette-only CTA and single background after restyling.');
const noHookSettings={...settings,cover:false};
const noHookDraft={...draft,settings:noHookSettings,slides:ctx.prepareContentSlides(source,noHookSettings)};
const noHookChanged=ctx.contentWithLook(noHookDraft,'floral-lavender');
assert(ctx.renderContentSlide(noHookChanged.slides[0],noHookSettings,fontBrand).elements.some(el=>el.src===floralLooks[0].background));
assert.equal(noHookChanged.slides[1],noHookDraft.slides[1]);

// Reopening reflects canvas wording edits while retaining an unapplied source draft.
const syncSource='# Original cover\nCover body.\n# Original detail\n## A subheading\nDetail body.';
const syncSettings={...settings,split:'markers'};
const syncSlides=ctx.prepareContentSlides(syncSource,syncSettings);
const syncPages=syncSlides.map(s=>ctx.renderContentSlide(s,syncSettings,brand));
const syncProject={id:'sync',name:'Sync',canvases:syncPages,activeCanvasId:syncPages[0].id,contentWorkspaceSettings:syncSettings,sourceText:syncSource,generatedSourceText:syncSource,sourceDraft:syncSource};
assert.equal(ctx.contentDraftFromProject(syncProject).source,syncSource);
syncPages[0].elements.find(e=>e.__role==='heading').text='Latest canvas heading';
const synced=ctx.contentDraftFromProject(syncProject);
assert(synced.source.startsWith('# Latest canvas heading'));
assert(synced.source.includes('## A subheading'));
assert.equal(synced.source,synced.appliedSource);
assert.equal(synced.source.split(/^# /m).length-1,2,'Automatic closing slide stays out of the authored source');
const pending=ctx.contentDraftFromProject({...syncProject,sourceDraft:'# My pending source\nDo not replace this draft.'});
assert.equal(pending.source,'# My pending source\nDo not replace this draft.');
assert(pending.appliedSource.includes('Latest canvas heading'));
assert.equal(ctx.contentSlidesSource(synced.slides,synced.settings),synced.source);
console.log('PASS: latest canvas wording reaches raw source; subheadings survive; automatic CTA excluded; unapplied source drafts preserved.');

// Blank entry skips text generation and keeps an existing writing draft intact.
vm.runInContext(utils.slice(utils.indexOf('const SIZE_PRESETS'),utils.indexOf('function resizeSlideToFit')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const newProject ='),utils.indexOf('// -------------- Reducer with history')),ctx);
for(const size of ['portrait','post']){
  const empty=ctx.newBlankProject(size),page=empty.canvases[0];
  assert.equal(page.w,1080);assert.equal(page.h,size==='post'?1080:1350);
  assert.equal(page.bg.value,'transparent');assert.equal(page.elements.length,0);
  assert.equal(empty.contentWorkspaceSettings.format,'post');
  const writing={id:'keep-writing',source:'My unfinished words',slides:[]};
  let blankState={projects:[],contentDraft:writing,contentDrafts:[],past:[],future:[],selection:[]};
  blankState=ctx.reducer(blankState,{type:'create-project',project:empty});
  assert.equal(blankState.contentDraft,writing);
  const photo={id:'photo',type:'image',src:'my-photo.jpg',x:0,y:0,w:page.w,h:page.h};
  blankState.projects[0].canvases[0].elements.push(photo);
  blankState.projects[0].canvases[0].bg={type:'image',value:'my-background.jpg'};
  blankState=ctx.reducer(blankState,{type:'add-canvas'});
  const expanded=blankState.projects[0],added=expanded.canvases[1];
  assert.equal(expanded.canvases.length,2);assert.equal(expanded.projectType,'carousel');
  assert.equal(expanded.contentWorkspaceSettings.format,'carousel');
  assert.equal(added.w,page.w);assert.equal(added.h,page.h);
  assert.equal(added.bg.value,'transparent');assert.equal(added.elements.length,0);
  assert.equal(expanded.canvases[0].elements[0],photo);
  const recovered=ctx.contentDraftFromProject(expanded);
  assert.equal(ctx.contentCarouselSlides(recovered.slides,recovered.settings).length,2,'Reopen never adds an automatic ending to a blank design');
  assert.equal(ctx.renderContentSlide(recovered.slides[0],recovered.settings,brand).bg.value,'my-background.jpg');
  const undone=ctx.reducer(blankState,{type:'undo'});assert.equal(undone.projects[0].canvases.length,1);
}
// Blank is an alternative to every predesigned look, for single posts and carousels.
const beforeBlank=JSON.stringify(slides),plain=ctx.contentWithLook({slides,index:1,settings},'blank');
assert.equal(JSON.stringify(slides),beforeBlank,'Choosing blank leaves the previous design available to Undo');
assert.deepEqual(plain.slides.map(words),slides.map(words));
assert.deepEqual(plain.slides.map(s=>s.id),slides.map(s=>s.id));
const plainUpdate=ctx.prepareSourceUpdate({...plain,source:ctx.contentSlidesSource(plain.slides,plain.settings)});
assert.deepEqual(plainUpdate.map(words),plain.slides.map(words),'Source updates retain the existing closing words without inventing another ending');
for(const size of ['portrait','post'])for(const slide of plain.slides){
  const page=ctx.renderContentSlide(slide,{...plain.settings,size},{logo:'logo.png',handles:[{value:'@ecoclothpad'}]});
  assert.equal(page.bg.value,'transparent');
  assert(page.elements.every(e=>e.type==='text'&&!e.fromBrand&&!e.contentDecoration&&!e.engagementAction));
  assert.deepEqual(page.elements.map(e=>e.text),slide.blocks.map(b=>b.text));
}
const restoredLook=ctx.contentWithLook(plain,'gentle');
assert(!restoredLook.settings.blank);assert.equal(restoredLook.slides[1].look,'informative');
assert.deepEqual(restoredLook.slides.map(words),slides.map(words));
const photoDraft={...plain,slides:[{...plain.slides[0],assets:[{id:'own-photo',type:'image',src:'mine.jpg'}],originalCanvas:{bg:{type:'image',value:'mine-bg.jpg'}}}]};
const withPhoto=ctx.contentWithLook(photoDraft,'blank'),photoPage=ctx.renderContentSlide(withPhoto.slides[0],withPhoto.settings,brand);
assert.equal(photoPage.bg.value,'mine-bg.jpg');assert(photoPage.elements.some(e=>e.id==='own-photo'));
vm.runInContext(read('ready-content.jsx').split('function fullSinglePostCanvas')[0],ctx);
const quote=ctx.contentDraftFromPost({id:'quote',title:'My quote',slides:[{title:'Words for the image',body:''}],caption:'Caption stays separate',hashtags:'#sewing'});
const plainQuote=ctx.contentWithLook(quote,'blank'),quotePage=ctx.renderContentSlide(plainQuote.slides[0],plainQuote.settings,brand);
assert.equal(quotePage.elements.map(e=>e.text).filter(Boolean).join('\n'),'Words for the image');
assert(plainQuote.caption.includes('Caption stays separate'));
console.log('PASS: blank entry without words; draft preservation; empty same-size added slides; Undo/reopen without automatic CTA; lossless blank styling in both ratios; photo preservation; ready-made quote/caption separation.');
