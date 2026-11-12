// Run: node tests/floral-covers.cjs. Layout logic regression; browser QA checks rendering.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'final-carousel.jsx'),'utf8');
const utils=fs.readFileSync(path.join(root,'editor-utils.jsx'),'utf8');
const renderer=fs.readFileSync(path.join(root,'editor-export.jsx'),'utf8');
let nextId=0;
const ctx={uid:()=>String(++nextId),document:{createElement:()=>({getContext:()=>({font:'',measureText(value){return {width:Array.from(value).length*Number(this.font.match(/([\d.]+)px/)[1])*.58};}})})},brandBackgroundElements:()=>[],ctaEngagementElements:()=>[],cleanSlideSwipe:els=>els};
vm.createContext(ctx);
ctx.window={};
vm.runInContext(fs.readFileSync(path.join(root,'floral-stickers.js'),'utf8'),ctx);
vm.runInContext(utils.slice(utils.indexOf('const newElement ='),utils.indexOf('// Branded backgrounds')),ctx);
vm.runInContext(utils.slice(utils.indexOf('const SLIDE_TEXT_STYLES'),utils.indexOf('function ctaEngagementElements')),ctx);
vm.runInContext(renderer.slice(renderer.indexOf('let textMeasureContext'),renderer.indexOf('function fitTextSize')),ctx);
vm.runInContext(source.slice(0,source.indexOf('function CarouselPairPreview'))+'\nglobalThis.pairs=CAROUSEL_STYLE_PAIRS;',ctx);
assert.equal(ctx.pairs.filter(p=>p.floral&&!p.kit).length,6);
const brand={name:'Wonder Pads',colors:[]};
for(const pair of ctx.pairs.filter(p=>p.floral&&!p.kit))for(const size of ['portrait','post']){
  const settings={size,pair:pair.id,cover:true,outro:true};
  const heading='A longer headline with enough words to check fitting without dropping the original content.';
  const slides=ctx.createSimpleCanvases('# '+heading+'\nA small supporting sentence.\n# Details\n## One\n## Two\n## Three\n## Four\n## Five',settings,brand);
  assert.equal(slides.length,3);
  for(const slide of slides){
    assert.equal(slide.w,1080);assert.equal(slide.h,size==='portrait'?1350:1080);
    for(const el of slide.elements.filter(e=>e.type==='text'))assert(el.y+ctx.textLayout(el).height<=slide.h,pair.id+' must keep text inside the slide');
  }
  assert.equal(slides[0].elements.filter(e=>e.__role==='heading').map(e=>e.text).join(' '),heading);
  assert.equal(slides[1].elements.filter(e=>e.__role==='sub').length,5);
  assert.throws(()=>ctx.createSimpleCanvases('# Heading\n'+('Too much text. '.repeat(1000)),settings,brand),/too much text/);
}
assert.equal(new Set(ctx.pairs.filter(p=>p.floral&&!p.kit).map(p=>p.look)).size,6);
console.log('PASS: six distinct editable layouts, both ratios, complete headings, five subheadings retained, and visible overflow errors.');

// Occasion kits keep their ready-made cover, every detail slide and the standard CTA.
for(const pair of ctx.pairs.filter(p=>p.kit))for(const size of ['portrait','post']){
  assert.equal(pair.floral,true);
  const slides=ctx.createSimpleCanvases('# First detail\nYour order details.\n# Second detail\nAnother detail.',{size,pair:pair.id,cover:true,outro:true},brand);
  assert.equal(slides.length,4);
  assert.equal(slides[0].elements.filter(e=>e.__role==='heading').map(e=>e.text).join(' '),pair.kit.cover.title);
  assert.equal(slides[1].elements.find(e=>e.__role==='heading').text,'First detail');
  assert.equal(slides[2].elements.find(e=>e.__role==='heading').text,'Second detail');
  assert.equal(slides[3].elements.find(e=>e.__role==='heading').text,'A little more comfort, your way.');
  for(const slide of slides){assert.equal(slide.h,size==='portrait'?1350:1080);for(const el of slide.elements.filter(e=>e.type==='text'))assert(el.y+ctx.textLayout(el).height<=slide.h);}
  if(pair.id==='popup'){
    assert.equal(slides[0].elements.find(e=>e.__role==='body').color,'#2A1F2A');
    assert(slides[0].elements.some(e=>e.type==='image'&&e.stickerId==='floral-charming-reusable-pad-market-stall'));
  }
}
console.log('PASS: all three bold occasion kits retain cover, details and CTA in both ratios.');

// Ready-to-post quotes are single editable images; captions never become slide text.
ctx.window={};
vm.runInContext(fs.readFileSync(path.join(root,'ready-content-data.js'),'utf8'),ctx);
const ready=fs.readFileSync(path.join(root,'ready-content.jsx'),'utf8');
vm.runInContext(ready.slice(0,ready.indexOf('const READY_CONTENT_SECTIONS')),ctx);
const quotes=ctx.window.WONDER_READY_POSTS.filter(p=>p.layout==='floral-quote');
assert.equal(quotes.length,18);
assert.equal(new Set(ctx.window.WONDER_READY_POSTS.map(p=>p.id)).size,ctx.window.WONDER_READY_POSTS.length);
for(const post of quotes)for(const size of ['portrait','post']){
  const pages=ctx.readyPostCanvases(post,size,post.stylePair,brand);assert.equal(pages.length,1);
  const image=pages[0];assert.equal(image.h,size==='portrait'?1350:1080);
  const words=image.elements.filter(e=>e.type==='text').map(e=>e.text).join('\n');
  assert(!words.includes(post.caption));assert(!image.elements.some(e=>e.__role==='swipe'));
  assert.equal(image.elements.filter(e=>e.__role==='heading').map(e=>e.text).join(' '),post.slides[0].title);
  if(post.footerLine)assert(words.includes(post.footerLine));
  for(const el of image.elements.filter(e=>e.type==='text'))assert(el.y+ctx.textLayout(el).height<=image.h);
}
console.log('PASS: 18 unique single-image quotes, preserved copy, separate captions and both ratios.');
