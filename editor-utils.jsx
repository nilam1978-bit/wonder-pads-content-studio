// Multi-project state + reducer + history + helpers
const { useReducer, useEffect, useRef, useState, useCallback, useMemo, createContext, useContext } = React;

const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const now = () => Date.now();

// Canvas size presets
const SIZE_PRESETS = [
  { id: 'ig-post',      name: 'Instagram Post',     w: 1080, h: 1080, group: 'Social' },
  { id: 'ig-portrait',  name: 'Instagram Portrait', w: 1080, h: 1350, group: 'Social' },
  { id: 'ig-story',     name: 'Instagram Story',    w: 1080, h: 1920, group: 'Social' },
  { id: 'fb-post',      name: 'Facebook Post',      w: 1200, h: 630,  group: 'Social' },
  { id: 'yt-thumb',     name: 'YouTube Thumbnail',  w: 1280, h: 720,  group: 'Social' },
  { id: 'tiktok',       name: 'TikTok Video',       w: 1080, h: 1920, group: 'Social' },
  { id: 'presentation', name: 'Presentation 16:9',  w: 1920, h: 1080, group: 'Print' },
  { id: 'a4-l',         name: 'A4 Landscape',       w: 1123, h: 794,  group: 'Print' },
  { id: 'poster',       name: 'Poster 18×24',       w: 1800, h: 2400, group: 'Print' },
  { id: 'square-sm',    name: 'Square 800',         w: 800,  h: 800,  group: 'Print' },
];

const defaultCanvas = (name = 'Page 1', preset = SIZE_PRESETS[0]) => ({
  id: uid(),
  name,
  w: preset.w, h: preset.h,
  bg: { type: 'color', value: '#FDFBFC' },
  elements: [],
});

function defaultNewPageSize(project) {
  const sizeKey = canvas => `${canvas.w}x${canvas.h}`;
  const counts = new Map();
  for (const canvas of project.canvases) {
    const key = sizeKey(canvas);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Match the most common size so a stray square page cannot set the default.
  // If sizes are tied, prefer the active page.
  let best = project.canvases.find(canvas => canvas.id === project.activeCanvasId) || project.canvases[0];
  if (!best) return SIZE_PRESETS[0];
  for (const canvas of project.canvases) {
    if (counts.get(sizeKey(canvas)) > counts.get(sizeKey(best))) best = canvas;
  }
  return best;
}

function resizeSlideToFit(canvas, { w, h }) {
  const scale = Math.min(w / canvas.w, h / canvas.h);
  const offsetX = (w - canvas.w * scale) / 2;
  const offsetY = (h - canvas.h * scale) / 2;
  const elements = canvas.elements.map(el => {
    const next = { ...el, x: offsetX + el.x * scale, y: offsetY + el.y * scale, w: el.w * scale, h: el.h * scale };
    for (const key of ['fontSize', 'letterSpacing', 'radius', 'strokeWidth']) {
      if (Number.isFinite(el[key]) && !(key === 'strokeWidth' && el.type === 'icon')) next[key] = el[key] * scale;
    }
    if (el.filter?.blur) next.filter = { ...el.filter, blur: el.filter.blur * scale };
    return next;
  });
  return { ...canvas, w, h, elements };
}

const isIllustration = el => el.type === 'icon' || !!el.stickerId || !!el.ctaGroup;

const isBrandLogo = el => el.type === 'image' && (el.role === 'logo' || el.brandSlot === 'logo');
const hasBrandLogoMask = el => isBrandLogo(el) && el.src === 'assets/wpr-logo.png';
const keepsAspectOnResize = el => isIllustration(el) || el.type==='image' || el.type==='frame';
const fitsWholeImage = el => el.imageFit?el.imageFit==='contain':isBrandLogo(el)||isIllustration(el);
const brandLogoSize = el => Math.min(el.w, el.h);

function illustrationAspect(el) {
  if (el.type === 'icon') return 1;
  if (Number.isFinite(el.artworkAspect) && el.artworkAspect > 0) return el.artworkAspect;
  const sticker = FLORAL_STICKERS.find(item => item.id === el.stickerId);
  return sticker ? sticker.width / sticker.height : el.w / el.h;
}

function illustrationSize(el) {
  const aspect = illustrationAspect(el);
  return Math.min(el.w, el.h * aspect) * Math.max(1, 1 / aspect);
}

function illustrationSizePatch(el, size = illustrationSize(el)) {
  const aspect = illustrationAspect(el);
  const w = size * Math.min(1, aspect);
  const h = size * Math.min(1, 1 / aspect);
  return { w, h, x: el.x + (el.w - w) / 2, y: el.y + (el.h - h) / 2 };
}

function brandLogoSizePatch(el, size = brandLogoSize(el)) {
  return { w: size, h: size, x: el.x + (el.w - size) / 2, y: el.y + (el.h - size) / 2 };
}

function proportionalElementResize(el, handle, width, height, min) {
  if (isBrandLogo(el)) {
    const dx = width - el.w;
    const dy = height - el.h;
    const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    const size = Math.max(min, brandLogoSize(el) + delta);
    const x = handle.includes('w') ? el.x + el.w - size : el.x;
    const y = handle.includes('n') ? el.y + el.h - size : el.y;
    return { w: size, h: size, x, y };
  }

  const sx = width / el.w;
  const sy = height / el.h;
  const factor = Math.abs(sx - 1) >= Math.abs(sy - 1) ? sx : sy;
  if(!isIllustration(el)){
    const scale=Math.max(min/el.w,min/el.h,factor),w=el.w*scale,h=el.h*scale;
    return {w,h,x:handle.includes('w')?el.x+el.w-w:el.x,y:handle.includes('n')?el.y+el.h-h:el.y};
  }
  const size = Math.max(min, illustrationSize(el) * factor);
  const { w, h } = illustrationSizePatch(el, size);
  return { w, h, x: handle.includes('w') ? el.x + el.w - w : el.x, y: handle.includes('n') ? el.y + el.h - h : el.y };
}

const newElement = (type, patch = {}) => {
  const base = {
    id: uid(), type,
    x: 100, y: 100, w: 200, h: 200,
    rot: 0, opacity: 1, locked: false, hidden: false,
  };
  const defaults = {
    text: { text: 'Add your text', fontFamily: 'Montserrat', fontSize: 46, fontWeight: 400, italic: false, underline: false, align: 'center', color: '#2A1F2A', letterSpacing: 0, lineHeight: 1.2 },
    rect: { fill: '#F1CFEA', stroke: 'transparent', strokeWidth: 0, radius: 12 },
    circle: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    triangle: { fill: '#E8B8DC', stroke: 'transparent', strokeWidth: 0 },
    line: { stroke: '#2A1F2A', strokeWidth: 4 },
    star: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    heart: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    polygon: { fill: '#F1CFEA', stroke: 'transparent', strokeWidth: 0, sides: 6 },
    diamond: { fill: '#E8B8DC', stroke: 'transparent', strokeWidth: 0 },
    arrow: { stroke: '#2A1F2A', strokeWidth: 4 },
    image: { src: '', filter: { brightness: 100, contrast: 100, saturate: 100, blur: 0 }, radius: 0 },
    icon: { name: 'sparkle', color: '#C260A8', strokeWidth: 1.5 },
    frame: { shape: 'circle', src: '', bg: '#F7E1F0' },
  };
  return { ...base, ...defaults[type], ...patch };
};

function photoSizePatch(el,width){
  const w=Math.max(10,width),h=w*el.h/Math.max(1,el.w);
  return {w,h,x:el.x+(el.w-w)/2,y:el.y+(el.h-h)/2};
}
function photoCropRect(el){
  const c=el.crop;
  if(!c||!Number.isFinite(c.sourceW)||!Number.isFinite(c.sourceH)||c.sourceW<=0||c.sourceH<=0)return null;
  const zoom=clamp(Number(c.zoom)||1,1,5),x=clamp(Number(c.x)||0,0,1),y=clamp(Number(c.y)||0,0,1);
  const scale=Math.max(el.w/c.sourceW,el.h/c.sourceH)*zoom,sw=el.w/scale,sh=el.h/scale;
  return {sx:(c.sourceW-sw)*x,sy:(c.sourceH-sh)*y,sw,sh};
}
function photoImageStyle(el){
  const contain=el.type!=='frame'&&fitsWholeImage(el),c=!contain&&el.crop;
  const x=c?clamp(Number(c.x)||0,0,1)*100:50,y=c?clamp(Number(c.y)||0,0,1)*100:50,zoom=c?clamp(Number(c.zoom)||1,1,5):1;
  return {width:'100%',height:'100%',display:'block',objectFit:contain?'contain':'cover',objectPosition:`${x}% ${y}%`,transform:`scale(${zoom})`,transformOrigin:`${x}% ${y}%`,pointerEvents:'none'};
}

// Branded backgrounds use the short side for readable type and square logos.
// Semantic slots let ratio changes reflow branding without resetting user edits.
function brandBackgroundElements(kind, canvas, brand = defaultBrand()) {
  const W=canvas.w,H=canvas.h,s=Math.min(W,H)/1080,m=64*s,logo=80*s,band=140*s;
  const ink='#2A1F2A',cream='#FDFBFC',dark=kind==='footer'||kind==='frame',color=dark?cream:ink;
  const website=brand.handles?.find(h=>h.platform==='website')?.value||'wonder-pads.com';
  const social=brand.handles?.find(h=>h.platform==='instagram')?.value||'@ecoclothpad';
  const els=[];
  const add=(slot,type,patch)=>els.push(newElement(type,{...patch,fromBrand:true,role:slot,brandLayout:kind,brandSlot:slot}));
  const text=(slot,value,x,y,w,align='left',tone=color)=>add(slot,'text',{text:value,x,y,w,h:44*s,fontSize:32*s,fontFamily:brand.fontBody||'Montserrat',fontWeight:500,lineHeight:1.3,align,color:tone});
  const image=(x,y,size=logo)=>{if(brand.logo)add('logo','image',{src:brand.logo,x,y,w:size,h:size,radius:9999});};
  const rect=(slot,x,y,w,h,fill)=>add(slot,'rect',{x,y,w,h,fill,radius:0});
  const compact=(y,tone=color)=>{
    const footerLogo=108*s;
    image(m,y+16*s,footerLogo);
    const x=m+footerLogo+28*s,w=W-x-m,gap=28*s,col=(w-gap)/2;
    text('instagram',social,x,y+45*s,col,'left',tone);
    text('website',website,x+col+gap,y+45*s,col,'left',tone);
    for(const el of els.filter(e=>e.type==='text'))el.h=50*s;
  };
  if(kind==='content-cover'){const size=Math.max(48,Math.min(180,Number(brand.coverLogoSize)||88))*s;image(W-86*s-size,70*s,size);return els;}
  if(kind==='content-footer'){
    text('instagram',social,86*s,H-112*s,W-172*s,'left',ink);
    for(const el of els){el.fontSize=28*s;el.h=48*s;}
    return els;
  }
  if(kind==='content-closing'){
    image(86*s,H-170*s,80*s);
    const x=brand.logo?190*s:86*s,w=W-x-86*s;
    const gap=24*s,col=(w-gap)/2;
    text('instagram',social,x,H-148*s,col,'left',ink);
    text('website',website,x+col+gap,H-148*s,col,'left',ink);
    for(const el of els.filter(e=>e.type==='text')){
      el.fontSize=28*s;el.h=48*s;
      if(typeof textLayout==='function')while(el.fontSize>18*s&&textLayout(el).height>48*s)el.fontSize-=s;
    }
    return els;
  }
  if(kind==='hook'){image(W-160*s,50*s,96*s);return els;}
  if(kind==='header'){
    rect('brandBar',0,0,W,band,'#F1CFEA');compact(0);
  }else if(kind==='footer'||kind==='frame'){
    if(kind==='frame')rect('writingPanel',32*s,32*s,W-64*s,H-band-48*s,cream);
    else rect('brandBar',0,H-band,W,band,ink);
    compact(H-band);
  }else if(kind==='strip'||kind==='signature'){
    if(kind==='strip')rect('brandBar',0,H-band,W,band,cream);
    compact(H-band,ink);
  }else{
    compact(H-band,ink);
  }
  return els;
}

// Tiny logos still get a finger-sized target. This never changes artwork/export.
function logoHitTarget(el,zoom){
  const padX=Math.max(0,(44/Math.max(.05,zoom)-el.w)/2);
  const padY=Math.max(0,(44/Math.max(.05,zoom)-el.h)/2);
  return {position:'absolute',left:el.x-padX,top:el.y-padY,width:el.w+2*padX,height:el.h+2*padY,
    transform:`rotate(${el.rot||0}deg)`,background:'transparent',border:0,padding:0,touchAction:'none',cursor:el.locked?'not-allowed':'move'};
}
function refreshStockHookLogos(saved){
  for(const project of saved.projects||[])for(const canvas of project.canvases||[]){
    const s=Math.min(canvas.w,canvas.h)/1080;
    for(const el of canvas.elements||[]){
      if(el.type!=='image'||el.brandLayout!=='hook'||el.brandSlot!=='logo'||el.locked)continue;
      // Upgrade only untouched old placement; preserve uploaded source and edits.
      if(Math.abs(el.w-64*s)<.01&&Math.abs(el.h-64*s)<.01&&Math.abs(el.x-(canvas.w-150*s))<.01&&Math.abs(el.y-50*s)<.01){
        el.x=canvas.w-160*s;el.w=el.h=96*s;
      }
    }
  }
}

function reflowBrandBackground(canvas, W, H, brand) {
  const layouts = [...new Set(canvas.elements.map(e => e.brandLayout).filter(Boolean))];
  const maps = new Map(layouts.map(kind => [kind, {
    old: brandBackgroundElements(kind, canvas, brand),
    next: brandBackgroundElements(kind, {...canvas,w:W,h:H}, brand),
  }]));
  const scale = Math.min(W,H)/Math.min(canvas.w,canvas.h);
  return canvas.elements.map(el => {
    if(el.contentFrame){
      const oldMargin=30*Math.min(canvas.w,canvas.h)/1080,margin=30*Math.min(W,H)/1080;
      return {...el,x:margin+(el.x-oldMargin)*scale,y:margin+(el.y-oldMargin)*scale,w:W-2*margin+(el.w-(canvas.w-2*oldMargin))*scale,h:H-2*margin+(el.h-(canvas.h-2*oldMargin))*scale,strokeWidth:el.strokeWidth*scale};
    }
    if(el.engagementAction){
      const old=ctaEngagementElements(canvas).find(e=>e.type===el.type&&e.engagementAction===el.engagementAction);
      const next=ctaEngagementElements({...canvas,w:W,h:H}).find(e=>e.type===el.type&&e.engagementAction===el.engagementAction);
      if(old&&next){const patch={};for(const key of ['x','y','w','h'])patch[key]=next[key]+(el[key]-old[key])*scale;if(el.type==='text')patch.fontSize=el.fontSize*scale;return {...el,...patch};}
    }
    const map = maps.get(el.brandLayout);
    if (!map) {
      // Contain the existing composition in the new ratio, never crop its text.
      const basis=el._ratioBasis||{w:canvas.w,h:canvas.h};
      const before=Math.min(canvas.w/basis.w,canvas.h/basis.h),fit=Math.min(W/basis.w,H/basis.h),factor=fit/before;
      const oldX=(canvas.w-basis.w*before)/2,oldY=(canvas.h-basis.h*before)/2;
      const dx=(W-basis.w*fit)/2,dy=(H-basis.h*fit)/2;
      const next={...el,_ratioBasis:basis,x:dx+(el.x-oldX)*factor,y:dy+(el.y-oldY)*factor,w:el.w*factor,h:el.h*factor};
      if(el.type==='text'){next.fontSize=el.fontSize*factor;if(el.letterSpacing!=null)next.letterSpacing=el.letterSpacing*factor;}
      if(el.radius!=null)next.radius=el.radius*factor;
      return next;
    }
    const old = map.old.find(e => e.brandSlot === el.brandSlot);
    const next = map.next.find(e => e.brandSlot === el.brandSlot);
    if (!old || !next) return el;
    const patch = {};
    for (const key of ['x','y','w','h']) patch[key] = next[key] + (el[key]-old[key])*scale;
    if (el.type === 'text') patch.fontSize = el.fontSize * scale;
    return {...el,...patch};
  });
}

const SLIDE_TEXT_STYLES = {
  label:{label:'Label',fontFamily:'Montserrat',fontSize:30,fontWeight:500,lineHeight:1.3},
  h1:{label:'H1 · Cover title',fontFamily:'Cormorant Garamond',fontSize:96,fontWeight:600,lineHeight:1.1},
  h2:{label:'H2 · Slide heading',fontFamily:'Cormorant Garamond',fontSize:76,fontWeight:600,lineHeight:1.15},
  body:{label:'Body',fontFamily:'Montserrat',fontSize:46,fontWeight:400,lineHeight:1.4},
  handle:{label:'Contact details',fontFamily:'Montserrat',fontSize:32,fontWeight:500,lineHeight:1.3},
};
function ctaEngagementElements(canvas,color='#2A1F2A') {
  const scale=Math.min(canvas.w,canvas.h)/1080;
  const ink=String(color).replace(/[^#a-zA-Z0-9(),.% -]/g,'');
  // A vector block is one selectable, movable, duplicatable and resizable object.
  const paths=['<path d="M8 4h16v25l-8-5-8 5z"/>','<path d="M4 5h24v18H14l-8 6v-6H4z"/>','<circle cx="12" cy="10" r="6"/><path d="M2 29v-4c0-9 20-9 20 0v4M27 9v12m-6-6h12"/>'];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="115" viewBox="0 0 900 115">'+['Save','Comment','Follow'].map((label,i)=>'<g transform="translate('+(150+i*300)+',0)" fill="none" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(-27,0) scale(1.7)">'+paths[i]+'</g><text x="0" y="105" text-anchor="middle" fill="'+ink+'" stroke="none" font-family="Arial,sans-serif" font-size="30">'+label+'</text></g>').join('')+'</svg>';
  return [newElement('image',{src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),x:(canvas.w-900*scale)/2,y:canvas.h-310*scale,w:900*scale,h:115*scale,ctaGroup:true,engagementAction:'group',__role:'engagementGroup',alt:'Save, Comment, Follow'})];
}
function starterBackgroundElements(template, canvas, brand = defaultBrand()) {
  const els=brandBackgroundElements(template.brandLayout,canvas,brand);
  if(template.slideKind){
    const scale=Math.min(canvas.w,canvas.h)/1080;
    const title=newElement('text',{...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',
      text:template.slideKind==='hook'?'Your hook goes here':'Save this for later',
      x:86*scale,y:canvas.h*(template.slideKind==='hook'?.25:.3),w:canvas.w-172*scale,
      fontSize:96*scale,align:template.slideKind==='cta'?'center':'left'});
    delete title.label;title.h=textLayout(title).height;
    els.push(title);
    if(template.slideKind==='cta')els.push(...ctaEngagementElements(canvas));
  }
  return els;
}

// Content heading fonts are independent of logo/shop typography.
function applyBrandSlideFonts(canvas, brand = {}) {
  let changed=false;
  const elements=canvas.elements.map(el=>{
    if(el.brandLayout==='content-cover'&&el.brandSlot==='logo'&&brand.coverLogoSize){
      const size=Math.max(48,Math.min(180,Number(brand.coverLogoSize)||88))*Math.min(canvas.w,canvas.h)/1080;
      if(el.w===size&&el.h===size)return el;
      changed=true;return {...el,x:el.x+el.w-size,w:size,h:size};
    }
    if(el.type!=='text'||el.fromBrand||el.brandSlot||el.engagementAction||el.endpointDecoration)return el;
    const role=el.__role||el.role;
    const key=role==='heading'?'slideFontHeading':role==='sub'?'slideFontSubheading':null;
    if(!key)return el;
    const family=brand[key],style=brand[key+'Style']||{},base=el.brandFontBase;
    const custom=!!family||Object.keys(style).length>0;
    if(!custom&&!base)return el;
    const original=base||{fontFamily:el.fontFamily,fontWeight:el.fontWeight,italic:el.italic,underline:el.underline};
    const font=family||original.fontFamily;
    const target=style.bold===undefined?original.fontWeight:style.bold?700:400;
    const weight=style.bold!==undefined?target:typeof nearestWeight==='function'?nearestWeight(font,target):target;
    const next={...el,fontFamily:font,fontWeight:weight,italic:style.italic??original.italic,underline:style.underline??original.underline};
    if(custom)next.brandFontBase=original;else delete next.brandFontBase;
    if(['fontFamily','fontWeight','italic','underline'].every(k=>next[k]===el[k])&&JSON.stringify(next.brandFontBase)===JSON.stringify(base))return el;
    changed=true;return next;
  });
  return changed?{...canvas,elements}:canvas;
}
function applyBrandFontsToState(state,brand) {
  const project=p=>{
    const canvases=p.canvases.map(c=>applyBrandSlideFonts(c,brand));
    return canvases.some((c,i)=>c!==p.canvases[i])?{...p,canvases,thumbnail:null,updatedAt:now()}:p;
  };
  const draft=d=>d?{...d,slides:(d.slides||[]).map(s=>s.originalCanvas?{...s,originalCanvas:applyBrandSlideFonts(s.originalCanvas,brand)}:s)}:d;
  return {...state,brand,projects:state.projects.map(project),
    templates:(state.templates||[]).map(t=>t.canvases?project(t):t),
    contentDraft:draft(state.contentDraft),contentDrafts:(state.contentDrafts||[]).map(draft),
    past:(state.past||[]).map(project),future:(state.future||[]).map(project)};
}
function slideTextRole(el,canvas) {
  if(el.textStyle) return el.textStyle;
  const role=el.__role || el.role;
  if(role==='heading') return canvas.name==='Cover'?'h1':'h2';
  if(role==='number'||role==='label'||role==='swipe'||el.text==='Swipe →') return 'label';
  if(role==='handle'||role==='website'||role==='instagram') return 'handle';
  return 'body';
}
function styleSlideText(canvas) {
  const scale=Math.min(canvas.w,canvas.h)/1080;
  let elements=canvas.elements.map(el=>{
    if(el.type!=='text'||el.fromBrand)return el;
    const role=slideTextRole(el,canvas),style=SLIDE_TEXT_STYLES[role]||SLIDE_TEXT_STYLES.body;
    const next={...el,...style,textStyle:role,fontSize:style.fontSize*scale};
    delete next.label;
    next.h=textLayout(next).height;
    return next;
  });
  const title=elements.find(e=>e.__role==='heading');
  if(title)elements=elements.map(e=>e.__role==='body'?{...e,y:title.y+title.h+42*scale}:e);
  return {...canvas,elements:cleanSlideSwipe(elements,canvas)};
}
function cleanSlideSwipe(elements,canvas) {
  const scale=Math.min(canvas.w,canvas.h)/1080;
  const branded=elements.some(e=>e.brandLayout);
  const y=canvas.h-(branded?260:140)*scale;
  const contentBottom=Math.max(0,...elements.filter(e=>e.type==='text'&&!e.fromBrand&&!e.hidden&&e.text!=='Swipe →'&&e.__role!=='handle'&&e.__role!=='number').map(e=>e.y+textLayout(e).height));
  return elements.map(e=>e.text==='Swipe →'?{...e,__role:'swipe',textStyle:'label',x:canvas.w-280*scale,y,w:194*scale,h:40*scale,fontFamily:'Montserrat',fontWeight:500,fontSize:30*scale,hidden:contentBottom+24*scale>y}:e);
}

// -------------- Project factory --------------
const newProject = (name, preset = SIZE_PRESETS[0], seedElements = []) => {
  const canvas = defaultCanvas('Page 1', preset);
  canvas.elements = seedElements.map(e => newElement(e.type, e.patch || e));
  return {
    id: uid(),
    name: name || 'Untitled design',
    createdAt: now(),
    updatedAt: now(),
    thumbnail: null,
    canvases: [canvas],
    activeCanvasId: canvas.id,
  };
};

function newBlankProject(size='portrait') {
  const project=newProject('My blank post',{w:1080,h:size==='post'?1080:1350});
  project.canvases[0]={...project.canvases[0],contentLook:'blank',bg:{type:'color',value:'transparent'}};
  return {...project,projectType:'post',contentWorkspaceSettings:{size,format:'post',blank:true,cover:false,closing:false}};
}

// -------------- Reducer with history --------------
const HISTORY_LIMIT = 60;

function normalizeLongDashes(value) {
  return String(value).replace(/(^|\n)[ \t]*[\u2013\u2014][ \t]*/g,'$1').replace(/(\d)[\u2013\u2014](?=\d)/g,'$1-').replace(/[ \t]*[\u2013\u2014][ \t]*/g,', ').replace(/,\s*([,.!?;:])/g,'$1');
}
function normalizeAppProse(value,key='') {
  if(typeof value==='string')return !/(^id$|Id$|^ids$|Ids$|^src$|^logo$|^uploads$|url$|uri$|fontFamily|^fontHeading$|^fontBody$|^slideFont|apiKey|token|password|secret)/i.test(key)&&! /^(https?:|data:|assets\/)/.test(value)?normalizeLongDashes(value):value;
  if(Array.isArray(value))return value.map(v=>normalizeAppProse(v,key));
  if(!value||Object.prototype.toString.call(value)!=='[object Object]')return value;
  const result={};for(const [k,v] of Object.entries(value))result[k]=normalizeAppProse(v,k);return result;
}

function framePhotoContext(state,target) {
  if(!target||state.activeProjectId!==target.projectId)return null;
  const project=state.projects.find(p=>p.id===target.projectId);
  if(!project||project.activeCanvasId!==target.canvasId)return null;
  const canvas=project.canvases.find(c=>c.id===target.canvasId);
  const frame=canvas?.elements.find(e=>e.id===target.elementId&&e.type==='frame'&&!e.locked&&!e.hidden);
  return frame?{project,canvas,frame}:null;
}

function photoCropContext(state,target){
  if(!target||state.activeProjectId!==target.projectId)return null;
  const project=state.projects.find(p=>p.id===target.projectId);
  if(!project||project.activeCanvasId!==target.canvasId)return null;
  return project.canvases.find(c=>c.id===target.canvasId)?.elements.find(e=>e.id===target.elementId&&['image','frame'].includes(e.type)&&e.src===target.src&&!e.locked&&!e.hidden&&e.w===target.w&&e.h===target.h)||null;
}

function reducer(state, action) {
  action=normalizeAppProse(action);
  // History is per active project. We mutate state.projects, then push snapshot to state.past.
  const activeProjectMutate = (mutator, opts = {}) => {
    const idx = state.projects.findIndex(p => p.id === state.activeProjectId);
    if (idx < 0) return state;
    const proj = state.projects[idx];
    const next = mutator(proj);
    if (next === proj) return state;
    next.updatedAt = now();
    const projects = [...state.projects];
    projects[idx] = next;
    // History
    if (!opts.transient) {
      const past = [...state.past, proj].slice(-HISTORY_LIMIT);
      return { ...state, projects, past, future: [] };
    }
    return { ...state, projects };
  };

  const patchCanvas = (proj, canvasId, patch) => ({
    ...proj,
    canvases: proj.canvases.map(c => c.id === canvasId ? { ...c, ...patch } : c),
  });

  switch (action.type) {
    case 'import-ready-posts': {
      const existing=new Set((state.calendar||[]).map(p=>p.id));
      const added=action.posts.filter(p=>!existing.has(p.id)).map(p=>({...p,packId:'wp-weeks-1-8',ts:p.date?new Date(p.date+'T12:00:00').getTime():Date.now(),platform:p.format==='Carousel'?'instagram-carousel':'instagram-caption',text:p.caption+'\n\n'+p.hashtags,status:'queued',confirmed:false}));
      // Correct only unchanged stock copy. Never overwrite the user's words,
      // posted entries, or existing canvas designs.
      let updated=false;
      const calendar=(state.calendar||[]).map(entry=>{
        if(entry.packId!=='wp-weeks-1-8')return entry;
        const source=action.posts.find(p=>p.id===entry.id),patch={};
        if(!source)return entry;
        // Convert untouched Reel library copy as one unit. Keep personal edits,
        // posted entries and already-created designs intact.
        if(source.reelConversionFrom && entry.format==='Reel'){
          const unchanged=Object.entries(source.reelConversionFrom).every(([key,value])=>
            JSON.stringify(entry[key]??null)===JSON.stringify(value));
          const hasDesign=(state.projects||[]).some(p=>p.contentEntryId===entry.id);
          if(entry.status==='posted'||hasDesign||!unchanged)return entry;
          updated=true;
          return {...entry,...source,platform:'instagram-carousel',text:source.caption+'\n\n'+source.hashtags};
        }
        for(const key of ['librarySection','priority','stylePair','middleStyle','defaultSize','archived','hookLabel'])
          if(entry[key]===undefined&&source[key]!==undefined)patch[key]=source[key];
        for(const [key,old] of Object.entries(entry.status==='posted'?{}:source.previousCopy||{}))
          if(JSON.stringify(entry[key])===JSON.stringify(old))patch[key]=source[key];
        // Unedited saved copies of the occasion templates move to the new cover/closing structure together.
        if(patch.slides!==undefined&&source.kitId){patch.kitId=source.kitId;patch.stylePair=source.stylePair;}
        if(!Object.keys(patch).length)return entry;
        updated=true;
        const next={...entry,...patch};
        if(patch.caption!==undefined)next.text=next.caption+'\n\n'+next.hashtags;
        return next;
      });
      return added.length||updated?{...state,calendar:[...calendar,...added]}:state;
    }
    // ---------- App-level navigation ----------
    case 'set-content-draft':
      return {...state,contentDraft:action.draft};
    case 'start-content-draft': {
      const current=state.contentDraft;
      const drafts=current&&(current.source||current.slides?.length)?[current,...(state.contentDrafts||[]).filter(d=>d.id!==current.id)]:state.contentDrafts||[];
      return {...state,contentDraft:action.draft,contentDrafts:drafts,activeProjectId:null,view:'carousel'};
    }
    case 'resume-content-draft': {
      const next=(state.contentDrafts||[]).find(d=>d.id===action.id);
      if(!next)return {...state,activeProjectId:null,view:'carousel'};
      const current=state.contentDraft;
      return {...state,contentDraft:next,contentDrafts:[...(current?[current]:[]),...(state.contentDrafts||[]).filter(d=>d.id!==next.id&&d.id!==current?.id)],activeProjectId:null,view:'carousel'};
    }
    case 'finish-content-draft': {
      const project=action.project,existing=state.projects.find(p=>p.id===project.id);
      return {...state,projects:existing?state.projects.map(p=>p.id===project.id?project:p):[project,...state.projects],activeProjectId:project.id,
        contentDraft:null,past:existing?[existing]:[],future:[],selection:[],tool:null};
    }
    case 'open-project':
      return { ...state, activeProjectId: action.id, tool: null, past: [], future: [], selection: [] };
    case 'close-project':
      return { ...state, view:'home', activeProjectId: null, past: [], future: [], selection: [] };

    // ---------- Project CRUD ----------
    case 'create-project':
    case 'create-projects': {
      const projects = action.projects || [action.project || newProject(action.name, action.preset, action.seedElements)];
      if (!projects.length) return state;
      return {
        ...state,
        projects: [...projects, ...state.projects],
        activeProjectId: projects[0].id, tool: null,
        past: [], future: [], selection: [],
      };
    }
    case 'delete-project': {
      // If this design was the saved copy of the carousel draft, drop the draft too,
      // otherwise the deleted design comes back as an "Unfinished draft".
      const wasDraft = state.carousel && state.carousel.simpleProjectId === action.id;
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        activeProjectId: state.activeProjectId === action.id ? null : state.activeProjectId,
        carousel: wasDraft ? { ...state.carousel, slides: [], simpleProjectId: null } : state.carousel,
      };
    }
    case 'rename-project': {
      const projects = state.projects.map(p => p.id === action.id ? { ...p, name: action.name, updatedAt: now() } : p);
      return { ...state, projects };
    }
    case 'duplicate-project': {
      const src = state.projects.find(p => p.id === action.id);
      if (!src) return state;
      const dup = JSON.parse(JSON.stringify(src));
      dup.id = uid();
      dup.name = src.name + ' (copy)';
      dup.finished = false; dup.finishedAt = null;
      dup.createdAt = now();
      dup.updatedAt = now();
      dup.canvases = dup.canvases.map(c => ({ ...c, id: uid(), elements: c.elements.map(el => ({ ...el, id: uid() })) }));
      dup.activeCanvasId = dup.canvases[0]?.id;
      return { ...state, projects: [dup, ...state.projects] };
    }
    case 'update-project-thumbnail': {
      const projects = state.projects.map(p => p.id === action.id ? { ...p, thumbnail: action.thumbnail } : p);
      return { ...state, projects };
    }
    case 'update-project': {
      // Generic patch, e.g. { appliedStarter: 'Made-to-Order' }
      const projects = state.projects.map(p => p.id === action.id ? { ...p, ...action.patch, updatedAt: now() } : p);
      return { ...state, projects };
    }

    // ---------- Custom template CRUD ----------
    case 'save-template': {
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const tpl = {
        id: uid(),
        name: action.name || (proj.name + ' template'),
        createdAt: now(),
        thumbnail: proj.thumbnail,
        canvases: JSON.parse(JSON.stringify(proj.canvases)),
      };
      return { ...state, templates: [tpl, ...state.templates] };
    }
    case 'delete-template':
      return { ...state, templates: state.templates.filter(t => t.id !== action.id) };
    case 'apply-template': {
      // Apply a template's first canvas as new project OR to current active canvas
      const tpl = state.templates.find(t => t.id === action.id) || action.template;
      if (!tpl) return state;
      const first = tpl.canvases[0];
      return activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
        elements: first.elements.map(el => ({ ...el, id: uid() })),
        bg: first.bg,
      }));
    }

    // ---------- Canvas within active project ----------
    case 'update-canvas':
      return activeProjectMutate(proj => {
        const c = proj.canvases.find(c => c.id === action.id);
        const patch = {...action.patch};
        if (c && (patch.w || patch.h) && !patch.elements) {
          patch.elements = reflowBrandBackground(c, patch.w || c.w, patch.h || c.h, state.brand);
        }
        return patchCanvas(proj, action.id, patch);
      });

    case 'apply-slide-text-styles':
      return activeProjectMutate(proj=>({...proj,canvases:proj.canvases.map(c=>action.scope==='all'||c.id===proj.activeCanvasId?styleSlideText(c):c)}));

    case 'add-canvas':
      return activeProjectMutate(proj => {
        const size = action.preset || defaultNewPageSize(proj);
        const c = defaultCanvas(`Page ${proj.canvases.length + 1}`, size);
        const current=proj.canvases.find(page=>page.id===proj.activeCanvasId)||proj.canvases[0];
        if(current?.contentLook==='blank'){
          c.contentLook='blank';c.bg={type:'color',value:'transparent'};
          return {...proj,canvases:[...proj.canvases,c],activeCanvasId:c.id,projectType:'carousel',
            contentWorkspaceSettings:{...proj.contentWorkspaceSettings,format:'carousel',blank:proj.canvases.every(page=>page.contentLook==='blank')}};
        }
        return { ...proj, canvases: [...proj.canvases, c], activeCanvasId: c.id };
      });

    case 'delete-canvas':
      return activeProjectMutate(proj => {
        if (proj.canvases.length <= 1) return proj;
        const idx = proj.canvases.findIndex(c => c.id === action.id);
        const canvases = proj.canvases.filter(c => c.id !== action.id);
        const activeCanvasId = proj.activeCanvasId === action.id
          ? canvases[Math.max(0, idx - 1)].id : proj.activeCanvasId;
        return { ...proj, canvases, activeCanvasId };
      });

    case 'duplicate-canvas':
      return activeProjectMutate(proj => {
        const src = proj.canvases.find(c => c.id === action.id);
        if (!src) return proj;
        const idx = proj.canvases.findIndex(c => c.id === action.id);
        const dup = {
          ...JSON.parse(JSON.stringify(src)),
          id: uid(),
          name: src.name + ' copy',
          elements: src.elements.map(el => ({ ...el, id: uid() })),
        };
        const canvases = [...proj.canvases.slice(0, idx + 1), dup, ...proj.canvases.slice(idx + 1)];
        return { ...proj, canvases, activeCanvasId: dup.id };
      });

    case 'reorder-canvas':
      return activeProjectMutate(proj => {
        const arr = [...proj.canvases];
        const [moved] = arr.splice(action.from, 1);
        arr.splice(action.to, 0, moved);
        return { ...proj, canvases: arr };
      });

    case 'set-active-canvas':
      return {
        ...state,
        projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, activeCanvasId: action.id } : p),
        selection: [],
      };

    // ---------- Element CRUD ----------
    case 'open-photo-crop': {
      const project=state.projects.find(p=>p.id===state.activeProjectId),el=project?.canvases.find(c=>c.id===project.activeCanvasId)?.elements.find(e=>e.id===action.id);
      if(!el?.src||!['image','frame'].includes(el.type)||el.locked||el.hidden)return state;
      return {...state,photoCropTarget:{projectId:project.id,canvasId:project.activeCanvasId,elementId:el.id,src:el.src,w:el.w,h:el.h,requestId:uid()}};
    }
    case 'close-photo-crop':return {...state,photoCropTarget:null};
    case 'apply-photo-crop': {
      const t=state.photoCropTarget,el=photoCropContext(state,t),crop=action.crop;
      if(!el||t.requestId!==action.requestId||!photoCropRect({...el,crop})||!['zoom','x','y'].every(k=>Number.isFinite(crop[k]))||crop.zoom<1||crop.zoom>5||crop.x<0||crop.x>1||crop.y<0||crop.y>1)return state;
      const size=el.type==='frame'?{w:el.w,h:el.h}:action.size;
      if(!size||!Number.isFinite(size.w)||!Number.isFinite(size.h)||size.w<10||size.h<10)return state;
      const patch={crop:{...crop},imageFit:'cover',w:size.w,h:size.h,x:el.x+(el.w-size.w)/2,y:el.y+(el.h-size.h)/2};
      const next=activeProjectMutate(proj=>patchCanvas(proj,t.canvasId,{elements:proj.canvases.find(c=>c.id===t.canvasId).elements.map(e=>e.id===el.id?{...e,...patch}:e)}));
      return {...next,photoCropTarget:null};
    }
    case 'open-frame-photo': {
      const project=state.projects.find(p=>p.id===state.activeProjectId);
      const target={projectId:project?.id,canvasId:project?.activeCanvasId,elementId:action.id,requestId:uid()};
      return framePhotoContext(state,target)?{...state,framePhotoTarget:target,selection:[action.id]}:state;
    }
    case 'close-frame-photo':
      return {...state,framePhotoTarget:null};
    case 'set-frame-photo': {
      const target=state.framePhotoTarget;
      if(!target||action.request?.requestId!==target.requestId||!framePhotoContext(state,target)||typeof action.src!=='string'||!action.src)return state;
      const next=activeProjectMutate(proj=>patchCanvas(proj,target.canvasId,{
        elements:proj.canvases.find(c=>c.id===target.canvasId).elements.map(e=>e.id===target.elementId?{...e,src:action.src,...(e.crop?{crop:null}:{})}:e),
      }));
      return {...next,framePhotoTarget:null,uploads:state.uploads?.includes(action.src)?state.uploads:[action.src,...(state.uploads||[])].slice(0,24)};
    }
    case 'add-element':
      return {
        ...activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
          elements: [...proj.canvases.find(c => c.id === proj.activeCanvasId).elements, action.element],
        })),
        selection: [action.element.id],
      };

    case 'update-element':
      return activeProjectMutate(proj => {
        const cId = proj.activeCanvasId;
        return patchCanvas(proj, cId, {
          elements: proj.canvases.find(c => c.id === cId).elements
            .map(e => {
              if(e.id !== action.id) return e;
              const merged=deepMerge(e,action.patch);
              if(action.patch.src!==undefined&&action.patch.src!==e.src&&!Object.prototype.hasOwnProperty.call(action.patch,'crop'))merged.crop=null;
              if(merged.type==='text') merged.h=textLayout(merged).height;
              return merged;
            }),
        });
      }, { transient: action.transient });

    case 'commit-transient': {
      const past = [...state.past, action.snapshot].slice(-HISTORY_LIMIT);
      return { ...state, past, future: [] };
    }

    case 'commit-text-edit': {
      const project = state.projects.find(p => p.id === state.activeProjectId);
      const canvas = project?.canvases.find(c => c.id === project.activeCanvasId);
      const element = canvas?.elements.find(e => e.id === action.id);
      if (!element) return state;
      const next = element.text === action.text ? state : reducer(state, {
        type: 'update-element', id: action.id, patch: { text: action.text }, transient: true,
      });
      if (action.text === action.originalText) return next;
      const original = { ...element, text: action.originalText };
      original.h = textLayout(original).height;
      const snapshot = patchCanvas(project, canvas.id, {
        elements: canvas.elements.map(e => e.id === action.id ? original : e),
      });
      return reducer(next, { type: 'commit-transient', snapshot });
    }

    case 'delete-elements':
      return {
        ...activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
          elements: proj.canvases.find(c => c.id === proj.activeCanvasId).elements
            .filter(e => !action.ids.includes(e.id)),
        })),
        selection: [],
      };

    case 'duplicate-elements': {
      let newIds = [];
      const nextState = activeProjectMutate(proj => {
        const c = proj.canvases.find(c => c.id === proj.activeCanvasId);
        const dupes = c.elements
          .filter(e => action.ids.includes(e.id))
          .map(e => ({ ...JSON.parse(JSON.stringify(e)), id: uid(), x: e.x + 20, y: e.y + 20 }));
        newIds = dupes.map(d => d.id);
        return patchCanvas(proj, proj.activeCanvasId, { elements: [...c.elements, ...dupes] });
      });
      return { ...nextState, selection: newIds };
    }

    case 'reorder-elements':
      return activeProjectMutate(proj=>{const c=proj.canvases.find(c=>c.id===proj.activeCanvasId),ids=action.ids||[];
        if(ids.length!==c.elements.length||new Set(ids).size!==ids.length||ids.some(id=>!c.elements.some(e=>e.id===id))||ids.every((id,i)=>id===c.elements[i].id))return proj;
        const map=new Map(c.elements.map(e=>[e.id,e]));return patchCanvas(proj,c.id,{elements:ids.map(id=>map.get(id))});});
    case 'reorder-element':
      return activeProjectMutate(proj => {
        const c = proj.canvases.find(c => c.id === proj.activeCanvasId);
        const arr = [...c.elements];
        const from = arr.findIndex(e => e.id === action.id);
        if (from < 0) return proj;
        const [moved] = arr.splice(from, 1);
        arr.splice(action.to, 0, moved);
        return patchCanvas(proj, proj.activeCanvasId, { elements: arr });
      });

    case 'set-selection':
      return { ...state, selection: action.ids };

    // ---------- Undo/Redo ----------
    case 'undo': {
      if (!state.past.length) return state;
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const prev = state.past[state.past.length - 1];
      const projects = state.projects.map(p => p.id === state.activeProjectId ? prev : p);
      return {
        ...state, projects,
        past: state.past.slice(0, -1),
        future: [proj, ...state.future].slice(0, HISTORY_LIMIT),
        selection: [],
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const nxt = state.future[0];
      const projects = state.projects.map(p => p.id === state.activeProjectId ? nxt : p);
      return {
        ...state, projects,
        past: [...state.past, proj].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        selection: [],
      };
    }

    // ---------- Brand ----------
    case 'update-brand': {
      const brand={...state.brand,...action.patch};
      return ['slideFontHeading','slideFontSubheading','slideFontHeadingStyle','slideFontSubheadingStyle','coverLogoSize'].some(key=>key in action.patch)
        ?applyBrandFontsToState(state,brand):{...state,brand};
    }
    case 'add-brand-handle':
      return { ...state, brand: { ...state.brand, handles: [...state.brand.handles, { id: uid(), platform: 'instagram', value: '', ...action.handle }] } };
    case 'update-brand-handle':
      return { ...state, brand: { ...state.brand, handles: state.brand.handles.map(h => h.id === action.id ? { ...h, ...action.patch } : h) } };
    case 'remove-brand-handle':
      return { ...state, brand: { ...state.brand, handles: state.brand.handles.filter(h => h.id !== action.id) } };
    case 'add-brand-color':
      return { ...state, brand: { ...state.brand, colors: [...state.brand.colors, action.color] } };
    case 'remove-brand-color':
      return { ...state, brand: { ...state.brand, colors: state.brand.colors.filter((_, i) => i !== action.index) } };

    // ---------- Voice do/don't/tags (arrays on brand) ----------
    case 'add-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: [...(state.brand.voiceDo || []), action.value] } };
    case 'update-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: state.brand.voiceDo.map((v, i) => i === action.index ? action.value : v) } };
    case 'remove-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: state.brand.voiceDo.filter((_, i) => i !== action.index) } };
    case 'add-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: [...(state.brand.voiceDont || []), action.value] } };
    case 'update-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: state.brand.voiceDont.map((v, i) => i === action.index ? action.value : v) } };
    case 'remove-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: state.brand.voiceDont.filter((_, i) => i !== action.index) } };
    case 'update-brand-voice-tags':
      return { ...state, brand: { ...state.brand, voiceTags: action.tags } };
    case 'add-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: [...(state.brand.voiceExamples || []), { id: uid(), text: '', note: '', ...action.example }] } };
    case 'update-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: (state.brand.voiceExamples || []).map(e => e.id === action.id ? { ...e, ...action.patch } : e) } };
    case 'remove-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: (state.brand.voiceExamples || []).filter(e => e.id !== action.id) } };

    // ---------- Vocabulary ----------
    case 'add-vocab':
      return { ...state, vocab: [...state.vocab, { id: uid(), term: '', def: '', ...action.entry }] };
    case 'update-vocab':
      return { ...state, vocab: state.vocab.map(v => v.id === action.id ? { ...v, ...action.patch } : v) };
    case 'remove-vocab':
      return { ...state, vocab: state.vocab.filter(v => v.id !== action.id) };

    // ---------- Copy blocks ----------
    case 'add-copy-block':
      return { ...state, copyBlocks: [...state.copyBlocks, { id: 'b_' + uid(), title: 'Untitled', category: 'general', content: '', ...action.block }] };
    case 'update-copy-block':
      return { ...state, copyBlocks: state.copyBlocks.map(b => b.id === action.id ? { ...b, ...action.patch } : b) };
    case 'remove-copy-block':
      return { ...state, copyBlocks: state.copyBlocks.filter(b => b.id !== action.id) };

    // ---------- Products ----------
    case 'add-product':
      return { ...state, products: [...state.products, { id: uid(), name: 'New product', absorbency: '', length: '', fabric: '', price: 0, notes: '', ...action.product }] };
    case 'update-product':
      return { ...state, products: state.products.map(p => p.id === action.id ? { ...p, ...action.patch } : p) };
    case 'remove-product':
      return { ...state, products: state.products.filter(p => p.id !== action.id) };

    // ---------- Saved history ----------
    case 'save-repurpose':
      return { ...state, savedRepurpose: [action.entry, ...state.savedRepurpose] };
    case 'remove-repurpose':
      return { ...state, savedRepurpose: state.savedRepurpose.filter(e => e.id !== action.id) };
    case 'save-launch':
      return { ...state, savedLaunches: [action.entry, ...state.savedLaunches] };
    case 'remove-launch':
      return { ...state, savedLaunches: state.savedLaunches.filter(e => e.id !== action.id) };

    // ---------- Calendar ----------
    case 'add-content-batch': {
      const keys=new Set((state.calendar||[]).map(p=>p.uploadKey).filter(Boolean));
      const entries=action.entries.filter(p=>{if(!p.uploadKey||keys.has(p.uploadKey))return false;keys.add(p.uploadKey);return true;});
      return entries.length?{...state,calendar:[...(state.calendar||[]),...entries]}:state;
    }
    case 'undo-content-batch':
      return {...state,calendar:(state.calendar||[]).filter(p=>p.importBatchId!==action.batchId)};
    case 'add-calendar-entry':
      return { ...state, calendar: [...(state.calendar || []), { id: 'c_' + uid(), status: 'queued', ...action.entry }] };
    case 'update-calendar-entry':
      return { ...state, calendar: (state.calendar || []).map(e => e.id === action.id ? { ...e, ...action.patch } : e) };
    case 'remove-calendar-entry':
      return { ...state, calendar: (state.calendar || []).filter(e => e.id !== action.id) };

    // ---------- Saved backgrounds (Petal — My Backgrounds) ----------
    // Stored as SNAPSHOTS. `bg` is deep-cloned on save so future edits to the source canvas
    // never mutate the saved copy.
    case 'save-background':
      return { ...state, savedBackgrounds: [action.entry, ...(state.savedBackgrounds || [])].slice(0, 60) };
    case 'remove-background':
      return { ...state, savedBackgrounds: (state.savedBackgrounds || []).filter(b => b.id !== action.id) };
    case 'rename-background':
      return { ...state, savedBackgrounds: (state.savedBackgrounds || []).map(b => b.id === action.id ? { ...b, name: action.name } : b) };

    // ---------- Named branding arrangements ----------
    // Snapshots of a set of independent brand elements (logo, name, handle, website, socials).
    // Applied elements are deep-cloned with fresh IDs so they stay independently editable.
    case 'save-brand-arrangement':
      return {
        ...state,
        brand: {
          ...state.brand,
          savedArrangements: [action.entry, ...((state.brand.savedArrangements || []).filter(a => a.name !== action.entry.name))].slice(0, 30),
        },
      };
    case 'remove-brand-arrangement':
      return {
        ...state,
        brand: {
          ...state.brand,
          savedArrangements: (state.brand.savedArrangements || []).filter(a => a.id !== action.id),
        },
      };

    // ---------- Element batch update (used by page-position controls) ----------
    case 'update-elements-batch': {
      if (!action.updates?.length) return state;
      const patchMap = new Map(action.updates.map(u => [u.id, u.patch]));
      return activeProjectMutate(proj => {
        const cId = proj.activeCanvasId;
        return patchCanvas(proj, cId, {
          elements: proj.canvases.find(c => c.id === cId).elements
            .map(e => {if(!patchMap.has(e.id)||e.locked)return e;const next=deepMerge(e,patchMap.get(e.id));if(next.type==='text')next.h=textLayout(next).height;return next;}),
        });
      }, {transient:action.transient});
    }

    // ---------- Carousel ----------
    case 'set-view':
      return { ...state, view: action.view };
    case 'update-carousel':
      return { ...state, carousel: { ...state.carousel, ...action.patch } };
    case 'reset-carousel':
      return { ...state, carousel: defaultCarousel() };

    // ---------- UI state ----------
    case 'set-zoom': return { ...state, zoom: action.zoom };
    case 'set-tool': return { ...state, tool: action.tool };
    case 'set-search': return { ...state, search: action.search };

    // ---------- Persistence ----------
    case 'load-state': return { ...state, ...action.state };
    case 'set-save-status':
      return { ...state, saveStatus: action.status, saveError: action.error || '', savedAt: action.savedAt ?? state.savedAt };
    case 'add-upload':
      return { ...state, uploads: [action.src, ...state.uploads.filter(src => src !== action.src)].slice(0, 24) };

    default:
      return state;
  }
}

function deepMerge(target, patch) {
  const out = { ...target };
  for (const k in patch) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') {
      out[k] = deepMerge(target[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// -------------- Snap guides --------------
function computeSnapGuides(dragBox, otherBoxes, canvasBox, threshold = 6) {
  const guides = [];
  const xs = [{ v: dragBox.l, side: 'l' }, { v: dragBox.cx, side: 'cx' }, { v: dragBox.r, side: 'r' }];
  const ys = [{ v: dragBox.t, side: 't' }, { v: dragBox.cy, side: 'cy' }, { v: dragBox.b, side: 'b' }];
  const targets = [...otherBoxes, { ...canvasBox, isCanvas: true }];

  let bestX = null, bestY = null;
  for (const x of xs) for (const t of targets) for (const tx of [t.l, t.cx, t.r]) {
    const d = Math.abs(x.v - tx);
    if (d < threshold && (!bestX || d < bestX.d)) bestX = { d, snap: tx, side: x.side };
  }
  for (const y of ys) for (const t of targets) for (const ty of [t.t, t.cy, t.b]) {
    const d = Math.abs(y.v - ty);
    if (d < threshold && (!bestY || d < bestY.d)) bestY = { d, snap: ty, side: y.side };
  }

  let dx = 0, dy = 0;
  if (bestX) {
    dx = bestX.snap - (bestX.side === 'l' ? dragBox.l : bestX.side === 'cx' ? dragBox.cx : dragBox.r);
    guides.push({ type: 'v', x: bestX.snap });
  }
  if (bestY) {
    dy = bestY.snap - (bestY.side === 't' ? dragBox.t : bestY.side === 'cy' ? dragBox.cy : dragBox.b);
    guides.push({ type: 'h', y: bestY.snap });
  }
  return { dx, dy, guides };
}


// -------------- Store --------------
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);

const STORAGE_KEY = 'wpr-simple-preview-v1';
const LEGACY_KEY = 'wpr-simple-preview-legacy';
const UPLOADS_KEY = 'simple-preview-uploads';

function migrateLegacy() {
  // Convert the old single-workspace to a single project.
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw);
    if (!legacy.canvases) return null;
    return {
      id: uid(),
      name: 'My first design',
      createdAt: now() - 86400000,
      updatedAt: now(),
      thumbnail: null,
      canvases: legacy.canvases,
      activeCanvasId: legacy.activeCanvasId || legacy.canvases[0]?.id,
    };
  } catch { return null; }
}

const defaultBrand = () => ({
  shopName: 'Wonder Pads Reusables',
  tagline: 'Your one stop shop for healthy menstruation',
  aboutLine: 'Handmade reusable cloth pads with printed cotton toppers, with organic solid cotton toppers available as options.',
  logo: 'assets/wpr-logo.png',
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Montserrat',
  handles: [
    { id: uid(), platform: 'instagram', value: '@ecoclothpad' },
    { id: uid(), platform: 'website',   value: 'wonder-pads.com' },
  ],
  colors: ['#F1CFEA', '#E8B8DC', '#D98BC6', '#C260A8', '#2A1F2A', '#FDFBFC'],
  // AI voice
  voiceTags: ['warm', 'friendly', 'chatty', 'affirming', 'body-positive', 'cozy', 'no-nonsense', 'handmade'],
  voiceDo: [
    "talk like you're texting a friend",
    "use lowercase sometimes for softness",
    "say 'your flow' 'your body' 'your rhythm'",
    "be reassuring about the switch to cloth",
    "celebrate periods, don't hide them",
    "keep sentences short & warm",
  ],
  voiceDont: [
    "avoid clinical / medical-sounding language",
    "no shame-y phrases like 'discreet' or 'hidden'",
    "no fake urgency or hype (\"LAST CHANCE!!!\")",
    "no jargon without explaining it",
    "avoid pink-tax pastels-only aesthetic clichés",
  ],
  // Writing style toggles (post-processed and reinforced in the system prompt)
  voiceRules: {
    capitalizeSentences: true,   // Capitalise the first letter of every sentence
    avoidEmDashes: true,         // Replace — and – with commas / periods
  },
  // Real posts the user has written — the AI matches this tone more strongly than any Do/Don't rule.
  voiceExamples: [],       // [{ id, text, note? }]
  savedArrangements: [],   // [{ id, name, elements: Element[] }] — named brand layouts (logo/handle/etc arrangement)
});

// Content data: seeded from CONTENT_SEED on first load, editable by the user.
const defaultVocab = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.vocab.map(v => ({ ...v, id: uid() }))
  : [];
const defaultCopyBlocks = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.copyBlocks.map(b => ({ ...b }))
  : [];
const defaultProducts = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.products.map(p => ({ ...p, id: uid() }))
  : [];
const defaultLaunchAngles = () => (typeof CONTENT_SEED !== 'undefined')
  ? [...CONTENT_SEED.launchAngles]
  : [];

const defaultCarousel = () => ({
  text: '',
  style: 'cover-list',
  size: 'ig-post',
  applyBrand: true,
  addCover: true,
  addOutro: true,
  swipeHint: true,
  textScale: 1,        // global multiplier applied to every text element (0.7 → 1.25)
  showNumbers: true,   // draw "01" / "02" slide numbers on content slides
  activeSlideIdx: 0,
});

const initialState = () => ({
  view: 'home',                 // 'home' | 'editor' | 'carousel' | 'repurpose' | 'launch' | 'history' | 'calendar'
  projects: [],
    contentDraft: null,
    contentDrafts: [],
  templates: [],
  brand: defaultBrand(),
  carousel: defaultCarousel(),
  // Content Repurposer data
  vocab: defaultVocab(),
  copyBlocks: defaultCopyBlocks(),
  products: defaultProducts(),
  launchAngles: defaultLaunchAngles(),
  savedRepurpose: [],           // [{ id, sourceText, outputs, ts }]
  savedLaunches: [],            // [{ id, productId, angle, outputs, ts }]
  calendar: [],                 // [{ id, ts, platform, text, status: 'queued'|'posted', productId?, note? }]
  savedBackgrounds: [],         // [{ id, name, kind: 'bg-only' | 'complete', bg, elements?, w?, h?, createdAt }] — frozen snapshots
  uploads: [],
  activeProjectId: null,
  selection: [],
  tool: 'templates',
  framePhotoTarget: null,
  zoom: 0.4,
  search: '',
  past: [],
  future: [],
  saveStatus: 'idle',
  saveError: '',
  savedAt: null,
});

function studioSnapshot(state) {
  const { past, future, selection, framePhotoTarget, photoCropTarget, saveStatus, saveError, savedAt, ...persist } = state;
  return persist;
}

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const [ready, setReady] = useState(false);
  const revision = useRef(null);
  const loaded = useRef(false);
  const migrate = useRef(false);
  const pending = useRef(null);
  const writing = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      let record;
      let storageError;
      try {
        record = await studioStorage.read();
      } catch (error) {
        storageError = error;
      }
      if (!active) return;
      revision.current = record?.revision ?? null;
      let saved = record?.state;
      if (!saved) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) saved = JSON.parse(raw);
          if (!saved) {
            const legacy = migrateLegacy();
            if (legacy) saved = { projects: [legacy] };
          }
          const uploads = JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]');
          if (Array.isArray(uploads) && uploads.length) saved = { ...saved, uploads };
        } catch (error) {
          storageError ||= error;
        }
        migrate.current = !!saved;
      }
      if (saved) {
        saved=normalizeAppProse(saved);
        // Backfill brand + carousel if missing (older data)
        if (!saved.brand) saved.brand = defaultBrand();
        else saved.brand = { ...defaultBrand(), ...saved.brand };
        // Correct only obsolete shipped defaults; keep custom brand data intact.
        if(saved.brand.fontHeading==='DM Serif Display')saved.brand.fontHeading='Cormorant Garamond';
        if(saved.brand.fontBody==='Instrument Sans')saved.brand.fontBody='Montserrat';
        saved.brand.handles = (saved.brand.handles || defaultBrand().handles).map(h => ({...h,
          value: h.value === '@wonderpadsreusables' ? '@ecoclothpad' : h.value === 'wonderpadsreusables.com' ? 'wonder-pads.com' : h.value,
        }));
        if (!saved.carousel) saved.carousel = defaultCarousel();
        else saved.carousel = { ...defaultCarousel(), ...saved.carousel };
        // Backfill Content Repurposer data
        if (!saved.vocab || !saved.vocab.length) saved.vocab = defaultVocab();
        if (!saved.copyBlocks || !saved.copyBlocks.length) saved.copyBlocks = defaultCopyBlocks();
        if (!saved.products || !saved.products.length) saved.products = defaultProducts();
        if (!saved.launchAngles || !saved.launchAngles.length) saved.launchAngles = defaultLaunchAngles();
        if (!saved.savedRepurpose) saved.savedRepurpose = [];
        if (!saved.savedLaunches) saved.savedLaunches = [];
        if (!saved.calendar) saved.calendar = [];
        if (!saved.savedBackgrounds) saved.savedBackgrounds = [];
        if(typeof refreshWonderBrandCopy==='function')refreshWonderBrandCopy(saved);
        refreshStockHookLogos(saved);
        // Always land on home when reloading
        dispatch({ type: 'load-state', state: {
          ...saved, view: 'home', activeProjectId: null, past: [], future: [], selection: [],
          saveStatus: record ? 'saved' : 'idle',
        } });
      }
      if (storageError) {
        console.warn('Could not load studio storage', storageError);
        dispatch({ type: 'set-save-status', status: 'error', error: 'The browser could not read saved work.' });
      }
      setReady(true);
    }
    load().catch(error => {
      if (!active) return;
      console.warn('Could not open studio workspace', error);
      dispatch({ type: 'set-save-status', status: 'error', error: 'The browser could not open saved work.' });
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (writing.current || !pending.current) return;
    writing.current = true;
    dispatch({ type: 'set-save-status', status: 'saving' });
    try {
      while (pending.current) {
        const snapshot = pending.current;
        revision.current = await studioStorage.write(snapshot, revision.current);
        if (pending.current === snapshot) pending.current = null;
      }
      dispatch({ type: 'set-save-status', status: 'saved', savedAt: now() });
    } catch (error) {
      console.warn('Save failed', error);
      dispatch({ type: 'set-save-status', status: 'error', error: studioSaveError(error) });
    } finally {
      writing.current = false;
    }
  }, []);

  // Queue the latest committed edit before the next paint, including text input.
  React.useLayoutEffect(() => {
    if (!ready) return;
    const shouldWrite = loaded.current || migrate.current;
    loaded.current = true;
    if (!shouldWrite) return;
    pending.current = studioSnapshot(state);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 250);
  }, [
    ready, flush, state.projects, state.templates,
    state.brand, state.vocab, state.copyBlocks, state.products, state.launchAngles,
    state.savedRepurpose, state.savedLaunches, state.calendar,
    state.savedBackgrounds, state.carousel, state.uploads, state.contentDraft, state.contentDrafts,
  ]);

  useEffect(() => {
    const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
    const beforeUnload = event => {
      if (!pending.current) return;
      flush();
      event.preventDefault();
      event.returnValue = true;
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', beforeUnload);
      clearTimeout(timer.current);
    };
  }, [flush]);

  if (!ready) return <p role="status" style={{ padding: 24 }}>Opening saved work…</p>;
  return (
    <StoreCtx.Provider value={{ state, dispatch, retrySave: flush, hasPendingSave: !!pending.current }}>
      {children}
    </StoreCtx.Provider>
  );
}

const activeProject = (state) => state.projects.find(p => p.id === state.activeProjectId);
const activeCanvas = (state) => {
  const proj = activeProject(state);
  return proj?.canvases.find(c => c.id === proj.activeCanvasId);
};

// ---------------- Responsive hooks ----------------
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange); // Safari fallback
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);
  return matches;
}

function useIsMobile() {
  const matches = useMediaQuery('(max-width: 639px)');
  // Dev override: ?mobile=1 forces mobile mode for testing on desktop.
  if (typeof window !== 'undefined') {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mobile') === '1') return true;
      if (p.get('mobile') === '0') return false;
    } catch {}
  }
  return matches;
}

// Page-position aligner — moves the current selection so its bounding box sits at the
// requested side of the canvas. Ported from Petal. Independent of text alignment.
function alignElementsToPage(state, dispatch, position) {
  const canvas = activeCanvas(state);
  const elements = canvas?.elements.filter(el => state.selection.includes(el.id)) || [];
  if (!canvas || !elements.length) return false;
  const left = Math.min(...elements.map(el => el.x));
  const top = Math.min(...elements.map(el => el.y));
  const right = Math.max(...elements.map(el => el.x + el.w));
  const bottom = Math.max(...elements.map(el => el.y + el.h));
  const groupW = right - left, groupH = bottom - top;
  let dx = 0, dy = 0;
  if (position === 'left')    dx = -left;
  if (position === 'hcenter') dx = (canvas.w - groupW) / 2 - left;
  if (position === 'right')   dx = canvas.w - right;
  if (position === 'top')     dy = -top;
  if (position === 'vmiddle') dy = (canvas.h - groupH) / 2 - top;
  if (position === 'bottom')  dy = canvas.h - bottom;
  if (dx === 0 && dy === 0) return false;
  dispatch({
    type: 'update-elements-batch',
    updates: elements.map(el => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } })),
  });
  return true;
}

// ------- Backup / Restore editable project -------
// Export the current workspace, including changes that have not reached storage.
function exportEditableProjectFile(state) {
  try { localStorage.setItem('wpr-last-backup', String(Date.now())); } catch {}
  const payload = {
    app: 'Wonder Pads Content Studio',
    version: 2,
    exportedAt: new Date().toISOString(),
    state: studioSnapshot(state),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `wonder-pads-content-studio-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Restore reads a JSON backup and returns the state to load. Throws on invalid input.
function parseEditableProjectFile(text) {
  const parsed = JSON.parse(text);
  // Accept either { state: {...} } (v2) or a raw state object (v1 for legacy)
  const state = parsed.state || parsed;
  if (!state || typeof state !== 'object') throw new Error('Backup file is empty or malformed.');
  if (!Array.isArray(state.projects)) throw new Error('This does not look like a Wonder Pads backup.');
  return state;
}

Object.assign(window, { uid, clamp, now, SIZE_PRESETS, defaultCanvas, newElement, framePhotoContext, photoCropContext, photoCropRect, photoImageStyle, photoSizePatch, newProject, newBlankProject, defaultBrand, defaultCarousel, reducer, initialState, computeSnapGuides, brandBackgroundElements, reflowBrandBackground, SLIDE_TEXT_STYLES, slideTextRole, styleSlideText, cleanSlideSwipe, starterBackgroundElements, StoreCtx, useStore, StoreProvider, activeProject, activeCanvas, useMediaQuery, useIsMobile, alignElementsToPage, exportEditableProjectFile, parseEditableProjectFile, STORAGE_KEY });

