// Text-to-Slides Carousel Maker — fully editable
// Data model:
//   carousel: { text, style, size, applyBrand, addCover, addOutro, swipeHint,
//               slides: [{ id, kind, label, heading, body, styleOverride?, bgOverride?, elementOverrides? }],
//               activeSlideId }
// Text is only the input UX for bulk-creating slides. Once slides exist, the
// slides array is source-of-truth and edits go into it directly.

const { useState: cS, useMemo: cM, useRef: cR, useEffect: cE, useCallback: cCB } = React;

// -------------------- PARSER --------------------
function parseCarouselText(text) {
  if (!text || !text.trim()) return [];
  // A line containing only --- or === is always an intentional slide break,
  // even when the user does not add blank lines around it.
  const normalized = text.replace(/^[ \t]*(?:---+|===+)[ \t]*$/gm, '\n---SPLIT---\n');
  const chunks = normalized
    .split(/\n---SPLIT---\n|\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
  return chunks.map((chunk, i) => {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    let label = null;
    let heading = lines[0] || '';
    const labelMatch = heading.match(/^([A-Z][A-Z0-9 ·\-]{2,20}):\s+(.+)$/);
    if (labelMatch) {
      label = labelMatch[1].trim();
      heading = labelMatch[2].trim();
    }
    const body = lines.slice(1).join(' ').trim();
    return { id: uid(), kind: 'content', label, heading, body };
  });
}

// Serialize slides back to text (for text field sync)


// -------------------- TEMPLATES --------------------
// Each returns { elements[], bg }. Every element carries a __role tag
// so per-slide element overrides can find & merge into it.

const R = (role, el) => ({ ...el, __role: role });

function templateEditorial(slide, W, H, brand, isCover, isOutro) {
  const bg = brand.colors?.[0] || '#F7E1F0';
  const ink = '#2A1F2A';
  const els = [];
  if (isOutro) {
    const size = Math.round(W * 0.28);
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - size)/2, y: H*0.22, w: size, h: size, radius: 9999, fromBrand: true, role: 'logo' })));
    els.push(R('shopName', newElement('text', {
      text: brand.shopName, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.055),
      color: ink, align: 'center', x: W*0.1, y: H*0.55, w: W*0.8, h: Math.round(W*0.08), lineHeight: 1.1,
    })));
    els.push(R('outroCta', newElement('text', {
      text: 'Save this post for later', fontFamily: brand.fontBody, fontSize: Math.round(W*0.03),
      color: ink, align: 'center', x: W*0.1, y: H*0.68, w: W*0.8, h: Math.round(W*0.05),
      letterSpacing: 2, fontWeight: 600,
    })));
    if (brand.handles?.length) {
      els.push(R('handles', newElement('text', {
        text: brand.handles.map(h => h.value).join('   ·   '),
        fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
        color: '#56454F', align: 'center',
        x: W*0.1, y: H*0.86, w: W*0.8, h: Math.round(W*0.04),
        letterSpacing: 1,
      })));
    }
    return { elements: els, bg };
  }
  if (slide.label) {
    els.push(R('label', newElement('text', {
      text: slide.label.toUpperCase(),
      fontFamily: brand.fontBody, fontSize: Math.round(W*0.022),
      color: '#C260A8', align: 'center',
      x: W*0.1, y: H*0.16, w: W*0.8, h: Math.round(W*0.04),
      letterSpacing: 6, fontWeight: 600,
    })));
  }
  els.push(R('accent', newElement('line', {
    stroke: '#C260A8', strokeWidth: 2,
    x: (W-Math.round(W*0.08))/2, y: isCover ? H*0.26 : H*0.24, w: Math.round(W*0.08), h: 4,
  })));
  els.push(R('heading', newElement('text', {
    text: slide.heading,
    fontFamily: brand.fontHeading,
    fontSize: Math.round(W * (isCover ? 0.09 : 0.075)),
    color: ink, align: 'center', italic: isCover,
    x: W*0.08, y: H*0.32, w: W*0.84, h: H*0.36, lineHeight: 1.2,
  })));
  if (slide.body) {
    els.push(R('body', newElement('text', {
      text: slide.body,
      fontFamily: brand.fontBody, fontSize: Math.round(W*0.028),
      color: '#56454F', align: 'center',
      x: W*0.12, y: H*0.70, w: W*0.76, h: H*0.18, lineHeight: 1.5,
    })));
  }
  return { elements: els, bg };
}

function templateCoverList(slide, W, H, brand, isCover, isOutro, slideIdx, totalContent, carousel) {
  const ink = '#2A1F2A';
  const accent = brand.colors?.[2] || '#D98BC6';
  const cream = '#FDFBFC';
  const els = [];

  if (isOutro) {
    // Soft pink outro — matches the rest of the deck instead of a jarring dark slide.
    const bg = brand.colors?.[0] || '#F7E1F0';
    const size = Math.round(W * 0.22);
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - size)/2, y: H*0.22, w: size, h: size, radius: 9999, fromBrand: true, role: 'logo' })));
    els.push(R('shopName', newElement('text', {
      text: brand.shopName, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.05),
      color: ink, align: 'center', x: W*0.1, y: H*0.5, w: W*0.8, h: Math.round(W*0.08),
    })));
    els.push(R('outroCta', newElement('text', {
      text: '↑  Save · Share · Follow', fontFamily: brand.fontBody, fontSize: Math.round(W*0.028),
      color: accent, align: 'center',
      x: W*0.1, y: H*0.62, w: W*0.8, h: Math.round(W*0.05),
      letterSpacing: 3, fontWeight: 600,
    })));
    if (brand.handles?.length) {
      const step = W * 0.8 / Math.max(brand.handles.length, 1);
      brand.handles.slice(0, 3).forEach((h, i) => {
        const p = platformById(h.platform);
        els.push(R('handleIcon' + i, newElement('icon', {
          name: p.icon, color: ink, strokeWidth: 1.6,
          x: W*0.1 + step*i + step/2 - Math.round(W*0.025), y: H*0.78,
          w: Math.round(W*0.05), h: Math.round(W*0.05),
        })));
        els.push(R('handleText' + i, newElement('text', {
          text: h.value, fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
          color: 'rgba(42,31,42,0.7)', align: 'center',
          x: W*0.1 + step*i, y: H*0.85, w: step, h: Math.round(W*0.04),
        })));
      });
    }
    return { elements: els, bg };
  }

  if (isCover) {
    const bg = brand.colors?.[0] || '#F1CFEA';
    if (slide.label) {
      els.push(R('label', newElement('text', {
        text: slide.label.toUpperCase(),
        fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
        color: ink, align: 'left',
        x: W*0.08, y: H*0.12, w: W*0.6, h: Math.round(W*0.04),
        letterSpacing: 6, fontWeight: 600,
      })));
    }
    els.push(R('heading', newElement('text', {
      text: slide.heading,
      fontFamily: brand.fontHeading, fontSize: Math.round(W*0.11),
      color: ink, align: 'left', x: W*0.08, y: H*0.22, w: W*0.84, h: H*0.5, lineHeight: 1.05,
    })));
    if (slide.body) {
      els.push(R('body', newElement('text', {
        text: slide.body,
        fontFamily: brand.fontBody, fontSize: Math.round(W*0.028),
        color: '#56454F', align: 'left',
        x: W*0.08, y: H*0.74, w: W*0.7, h: Math.round(W*0.09), lineHeight: 1.5,
      })));
    }
    els.push(R('swipeBg', newElement('rect', {
      x: W*0.72, y: H*0.86, w: Math.round(W*0.2), h: Math.round(W*0.08),
      fill: ink, radius: 999, stroke: 'transparent', strokeWidth: 0,
    })));
    els.push(R('swipeText', newElement('text', {
      text: 'Swipe  →', fontFamily: brand.fontBody, fontSize: Math.round(W*0.025),
      color: cream, align: 'center',
      x: W*0.72, y: H*0.86, w: Math.round(W*0.2), h: Math.round(W*0.08),
      letterSpacing: 3, fontWeight: 600,
    })));
    const lw = Math.round(W*0.09);
    els.push(R('logo', newElement('image', { src: brand.logo, x: W*0.08, y: H*0.86 + (Math.round(W*0.08) - lw)/2, w: lw, h: lw, opacity: 0.85, radius: 9999, fromBrand: true, role: 'logo' })));
    return { elements: els, bg };
  }

  // Rebalanced content slide: number is a discreet accent, heading + body get the space.
  const bg = cream;
  const showNumbers = carousel ? carousel.showNumbers !== false : true;
  if (showNumbers) {
    const n = String(slideIdx).padStart(2, '0');
    // Small number label in top-left
    els.push(R('number', newElement('text', {
      text: n, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.11),
      color: accent, align: 'left',
      x: W*0.08, y: H*0.09, w: W*0.4, h: Math.round(W*0.15), lineHeight: 1,
    })));
    els.push(R('accent', newElement('rect', {
      x: W*0.08, y: H*0.28, w: Math.round(W*0.08), h: 4,
      fill: accent, radius: 4, stroke: 'transparent', strokeWidth: 0,
    })));
  }
  // With no numbers, promote heading + body vertically so the layout still feels balanced.
  // Keep a comfortable top margin so wrapped multi-line headings don't clip.
  const headY = showNumbers ? H*0.32 : H*0.22;
  const bodyY = showNumbers ? H*0.6  : H*0.5;
  els.push(R('heading', newElement('text', {
    text: slide.heading, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.085),
    color: ink, align: 'left',
    x: W*0.08, y: headY, w: W*0.84, h: H*0.24, lineHeight: 1.1,
  })));
  if (slide.body) {
    els.push(R('body', newElement('text', {
      text: slide.body, fontFamily: brand.fontBody, fontSize: Math.round(W*0.032),
      color: '#56454F', align: 'left',
      x: W*0.08, y: bodyY, w: W*0.84, h: H*0.28, lineHeight: 1.5,
    })));
  }
  els.push(R('counter', newElement('text', {
    text: `${slideIdx} / ${totalContent}`, fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
    color: '#8A7684', align: 'right',
    x: W*0.6, y: H*0.92, w: W*0.32, h: Math.round(W*0.04),
    letterSpacing: 2,
  })));
  return { elements: els, bg };
}

function templateTestimonial(slide, W, H, brand, isCover, isOutro) {
  const bg = brand.colors?.[0] || '#F1CFEA';
  const ink = '#2A1F2A';
  const els = [];

  if (isOutro) {
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - W*0.24)/2, y: H*0.28, w: W*0.24, h: W*0.24, radius: 9999, fromBrand: true, role: 'logo' })));
    els.push(R('shopName', newElement('text', {
      text: brand.shopName, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.05),
      color: ink, align: 'center', x: W*0.1, y: H*0.58, w: W*0.8, h: Math.round(W*0.07),
    })));
    els.push(R('outroCta', newElement('text', {
      text: 'Save · Share · Follow', fontFamily: brand.fontBody, fontSize: Math.round(W*0.026),
      color: '#56454F', align: 'center',
      x: W*0.1, y: H*0.7, w: W*0.8, h: Math.round(W*0.05),
      letterSpacing: 3,
    })));
    return { elements: els, bg };
  }

  els.push(R('quote', newElement('text', {
    text: '"', fontFamily: brand.fontHeading, fontSize: Math.round(W*0.55),
    color: brand.colors?.[2] || '#D98BC6', align: 'left',
    x: W*0.08, y: H*0.06, w: W*0.4, h: H*0.4, lineHeight: 0.8,
  })));
  els.push(R('heading', newElement('text', {
    text: slide.heading, fontFamily: brand.fontHeading, fontSize: Math.round(W * (isCover ? 0.075 : 0.065)),
    color: ink, align: 'left', italic: true,
    x: W*0.08, y: H*0.38, w: W*0.84, h: H*0.34, lineHeight: 1.25,
  })));
  if (slide.body) {
    els.push(R('body', newElement('text', {
      text: '— ' + slide.body, fontFamily: brand.fontBody, fontSize: Math.round(W*0.026),
      color: '#56454F', align: 'left',
      x: W*0.08, y: H*0.76, w: W*0.84, h: Math.round(W*0.08),
      letterSpacing: 2, fontWeight: 500,
    })));
  }
  const lw = Math.round(W*0.08);
  els.push(R('logo', newElement('image', {
    src: brand.logo, x: W - W*0.08 - lw, y: H - W*0.08 - lw, w: lw, h: lw, opacity: 0.7, radius: 9999, fromBrand: true, role: 'logo',
  })));
  return { elements: els, bg };
}

function templateTipCards(slide, W, H, brand, isCover, isOutro, slideIdx, totalContent, carousel) {
  const bg = brand.colors?.[0] || '#F7E1F0';
  const ink = '#2A1F2A';
  const cream = '#FDFBFC';
  const accent = brand.colors?.[2] || '#D98BC6';
  const els = [];

  if (isOutro) {
    // Soft pink outro — matches the rest of the deck instead of a jarring dark slide.
    const dBg = brand.colors?.[0] || '#F7E1F0';
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W-W*0.22)/2, y: H*0.24, w: W*0.22, h: W*0.22, radius: 9999, fromBrand: true, role: 'logo' })));
    els.push(R('shopName', newElement('text', {
      text: brand.shopName, fontFamily: brand.fontHeading, fontSize: Math.round(W*0.05),
      color: ink, align: 'center', x: W*0.1, y: H*0.52, w: W*0.8, h: Math.round(W*0.07),
    })));
    els.push(R('outroCta', newElement('text', {
      text: '↑ Save this post for later', fontFamily: brand.fontBody, fontSize: Math.round(W*0.028),
      color: accent, align: 'center',
      x: W*0.1, y: H*0.64, w: W*0.8, h: Math.round(W*0.05),
      letterSpacing: 2, fontWeight: 600,
    })));
    return { elements: els, bg: dBg };
  }

  const cardX = W*0.08, cardY = H*0.1, cardW = W*0.84, cardH = H*0.8;
  els.push(R('card', newElement('rect', {
    x: cardX, y: cardY, w: cardW, h: cardH,
    fill: cream, radius: Math.round(W*0.04),
    stroke: 'transparent', strokeWidth: 0,
  })));
  const showNumbers = carousel ? carousel.showNumbers !== false : true;
  const chipLabel = slide.label
    || (isCover ? 'THE GUIDE' : (showNumbers ? `TIP ${String(slideIdx).padStart(2, '0')}` : 'TIP'));
  els.push(R('chip', newElement('rect', {
    x: cardX + W*0.06, y: cardY + W*0.06, w: Math.round(W*0.32), h: Math.round(W*0.06),
    fill: accent, radius: 999, stroke: 'transparent', strokeWidth: 0,
  })));
  els.push(R('label', newElement('text', {
    text: chipLabel, fontFamily: brand.fontBody, fontSize: Math.round(W*0.022),
    color: cream, align: 'center',
    x: cardX + W*0.06, y: cardY + W*0.06, w: Math.round(W*0.32), h: Math.round(W*0.06),
    letterSpacing: 4, fontWeight: 600,
  })));
  els.push(R('heading', newElement('text', {
    text: slide.heading, fontFamily: brand.fontHeading,
    fontSize: Math.round(W * (isCover ? 0.09 : 0.07)),
    color: ink, align: 'left',
    x: cardX + W*0.06, y: cardY + W*0.18, w: cardW - W*0.12, h: H*0.28, lineHeight: 1.1,
  })));
  if (slide.body) {
    els.push(R('body', newElement('text', {
      text: slide.body, fontFamily: brand.fontBody, fontSize: Math.round(W*0.028),
      color: '#56454F', align: 'left',
      x: cardX + W*0.06, y: cardY + W*0.5, w: cardW - W*0.12, h: H*0.28, lineHeight: 1.5,
    })));
  }
  els.push(R('shopName', newElement('text', {
    text: brand.shopName, fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
    color: '#8A7684', align: 'left',
    x: cardX + W*0.06, y: cardY + cardH - W*0.08, w: cardW*0.5, h: Math.round(W*0.04),
    letterSpacing: 2,
  })));
  if (!isCover) {
    els.push(R('counter', newElement('text', {
      text: `${slideIdx} / ${totalContent}`, fontFamily: brand.fontBody, fontSize: Math.round(W*0.02),
      color: '#8A7684', align: 'right',
      x: cardX + cardW*0.4, y: cardY + cardH - W*0.08, w: cardW*0.5 - W*0.06, h: Math.round(W*0.04),
      letterSpacing: 2,
    })));
  } else {
    els.push(R('swipeText', newElement('text', {
      text: 'Swipe  →', fontFamily: brand.fontBody, fontSize: Math.round(W*0.024),
      color: accent, align: 'right',
      x: cardX + cardW*0.4, y: cardY + cardH - W*0.08, w: cardW*0.5 - W*0.06, h: Math.round(W*0.04),
      letterSpacing: 3, fontWeight: 600,
    })));
  }
  return { elements: els, bg };
}

const CAROUSEL_STYLES = [
  { id: 'cover-list',  label: 'Cover + list',  desc: 'Big hook, then numbered steps',   render: templateCoverList },
  { id: 'editorial',   label: 'Editorial',     desc: 'Centered serif, quote-like',      render: templateEditorial },
  { id: 'tip-cards',   label: 'Tip cards',     desc: 'Label chip + heading + body',     render: templateTipCards },
  { id: 'testimonial', label: 'Testimonial',   desc: 'Big quote mark, italic body',     render: templateTestimonial },
];

const CAROUSEL_SIZES = [
  { id: 'ig-post',     label: 'Instagram Post',     w: 1080, h: 1080 },
  { id: 'ig-portrait', label: 'Instagram Portrait', w: 1080, h: 1350 },
];

const getStyleDef = (id) => CAROUSEL_STYLES.find(s => s.id === id) || CAROUSEL_STYLES[0];
const getSizeDef = (id) => CAROUSEL_SIZES.find(s => s.id === id) || CAROUSEL_SIZES[0];

// -------------------- BUILD CANVAS FOR SLIDE --------------------
function renderSlideToCanvas(slide, opts) {
  const { carousel, brand, slideIdx, totalContent } = opts;
  const styleId = slide.styleOverride || carousel.style;
  const styleDef = getStyleDef(styleId);
  const sizeDef = getSizeDef(carousel.size);
  const W = sizeDef.w, H = sizeDef.h;
  const isCover = slide.kind === 'cover';
  const isOutro = slide.kind === 'outro';

  const brandForRender = carousel.applyBrand
    ? brand
    : { ...brand, logo: '', shopName: '', tagline: '', handles: [] };

  const rendered = styleDef.render(slide, W, H, brandForRender, isCover, isOutro, slideIdx, totalContent, carousel);
  const bg=rendered.bg,scale=Math.min(W,H)/1080;
  // Older saved carousel builders use the same branding geometry as the
  // current creator. Content and explicit per-element edits stay editable.
  const baseEls=rendered.elements.filter(el=>!['logo','shopName','handles'].includes(el.__role)&&!/^handle(?:Icon|Text)\d+$/.test(el.__role||''));
  const brandCanvas={w:W,h:H};
  if(carousel.applyBrand){
    baseEls.push(...brandBackgroundElements(isCover?'hook':'signature',brandCanvas,brand).map(el=>({...el,__role:el.brandSlot})));
  }
  if(isOutro){
    const cta=baseEls.find(el=>el.__role==='outroCta');
    if(cta){
      Object.assign(cta,SLIDE_TEXT_STYLES.h1,{textStyle:'h1',x:86*scale,y:H*.28,w:W-172*scale,fontSize:84*scale,letterSpacing:0,color:'#2A1F2A',align:'left'});
      delete cta.label;cta.h=textLayout(cta).height;
    }
    baseEls.push(...ctaEngagementElements(brandCanvas));
  }
  if(carousel.applyBrand&&!isCover){
    for(const el of baseEls.filter(el=>['counter','swipe'].includes(el.__role)))el.y=Math.min(el.y,H-220*scale);
  }

  // Apply per-element overrides
  const overrides = slide.elementOverrides || {};
  const elements = baseEls.map(el => {
    const ov = overrides[el.__role];
    if (!ov) return el;
    // Deep-merge overrides
    const merged = { ...el };
    for (const k in ov) {
      if (k === 'filter' && el.filter) merged.filter = { ...el.filter, ...ov[k] };
      else merged[k] = ov[k];
    }
    return merged;
  });

  return {
    id: slide.id + '-canvas',
    name: isCover ? 'Cover' : isOutro ? 'Save this post' : (slide.label || `Slide ${slideIdx}`),
    w: W, h: H,
    bg: { type: 'color', value: slide.bgOverride || bg },
    elements,
    __slideId: slide.id,
  };
}

function buildCarouselCanvases(carousel, brand) {
  const slides = carousel.slides || [];
  // Count content slides for numbering
  let contentIdx = 0;
  const totalContent = slides.filter(s => s.kind === 'content').length;
  const canvases = slides.map(slide => {
    if (slide.kind === 'content') contentIdx++;
    return renderSlideToCanvas(slide, {
      carousel, brand,
      slideIdx: slide.kind === 'content' ? contentIdx : 0,
      totalContent,
    });
  });
  // Apply global text scale — a single multiplier for every text element on every slide.
  const scale = carousel.textScale || 1;
  if (scale !== 1) {
    for (const cv of canvases) {
      cv.elements = cv.elements.map(el => {
        if (el.type !== 'text' || !el.fontSize || el.fromBrand || el.engagementAction) return el;
        const nextFs = Math.max(6, Math.round(el.fontSize * scale));
        // Grow the box vertically a touch when scaling up so wrapped text still fits.
        const nextH = scale > 1 ? Math.round(el.h * scale) : el.h;
        return { ...el, fontSize: nextFs, h: nextH };
      });
    }
  }
  return canvases;
}

// Compute slides from carousel state (handles cover + outro decoration)
// Used only when text changes — regenerates the slides array from text.
function decorateSlides(parsedSlides, carousel) {
  const slides = parsedSlides.map(s => ({ ...s, kind: 'content' }));
  const result = [];
  if (carousel.addCover && slides.length > 0) {
    if (slides.length === 1) {
      result.push({ ...slides[0], id: slides[0].id, kind: 'cover' });
    } else {
      result.push({ ...slides[0], id: slides[0].id, kind: 'cover' });
      result.push(...slides.slice(1));
    }
  } else {
    result.push(...slides);
  }
  if (carousel.addOutro && result.length > 0) {
    result.push({ id: uid(), kind: 'outro', label: null, heading: '', body: '' });
  }
  return result;
}

// -------------------- SCREEN --------------------


// -------------------- EDITABLE SLIDE CARDS --------------------


// -------------------- PREVIEW GRID --------------------


// -------------------- SLIDE EDITOR MODAL --------------------
// Interactive: drag elements, click text to edit, resize with handles.


// Self-contained interactive element renderer for the carousel slide editor.
// Renders the visual for the element AND handles click/drag/double-click.


// Properties panel when an element is selected


// -------------------- EXAMPLES --------------------
const PLACEHOLDER_TEXT = `THE GUIDE: Your first reusable pad, without the overwhelm

Getting started with reusable pads

Everything you need to know before your first cycle with reusables. Simple, gentle, effective.

---

TIP 01: Start with your usual flow

Track a single cycle with the pads you already own. Notice heavy days vs light days — that's what you'll pack for.

TIP 02: Build a rotation of three

Two absorbencies, one liner. That's the whole starter kit. Wash, rotate, repeat — no landfill guilt.

TIP 03: Rinse cold, then wash warm

Cold water first to protect the fibers, then a warm cycle with the rest of your laundry. That's it.

TIP 04: Air-dry, always

Skip the dryer to keep the wings crisp and the leak-proof layer intact. Sunlight is a bonus.
`;

const EXAMPLE_TEXT = PLACEHOLDER_TEXT;

Object.assign(window, { parseCarouselText, buildCarouselCanvases, CAROUSEL_STYLES, CAROUSEL_SIZES, decorateSlides });
