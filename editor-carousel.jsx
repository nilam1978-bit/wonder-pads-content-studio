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
function slidesToText(slides) {
  return slides
    .filter(s => s.kind !== 'outro') // outro is generated
    .map(s => {
      const label = s.label ? s.label.toUpperCase() + ': ' : '';
      const heading = s.heading || '';
      const body = s.body ? '\n' + s.body : '';
      return label + heading + body;
    })
    .join('\n\n');
}

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
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - size)/2, y: H*0.22, w: size, h: size })));
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
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - size)/2, y: H*0.22, w: size, h: size })));
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
    els.push(R('logo', newElement('image', { src: brand.logo, x: W*0.08, y: H*0.86 + (Math.round(W*0.08) - lw)/2, w: lw, h: lw, opacity: 0.85 })));
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
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W - W*0.24)/2, y: H*0.28, w: W*0.24, h: W*0.24 })));
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
    src: brand.logo, x: W - W*0.08 - lw, y: H - W*0.08 - lw, w: lw, h: lw, opacity: 0.7,
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
    els.push(R('logo', newElement('image', { src: brand.logo, x: (W-W*0.22)/2, y: H*0.24, w: W*0.22, h: W*0.22 })));
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

  const { elements: baseEls, bg } = styleDef.render(slide, W, H, brandForRender, isCover, isOutro, slideIdx, totalContent, carousel);

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
        if (el.type !== 'text' || !el.fontSize) return el;
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
function CarouselMakerScreen() {
  const { state, dispatch } = useStore();
  const carousel = state.carousel;
  const brand = state.brand;
  const [saving, setSaving] = cS(false);
  const [focusedSlideId, setFocusedSlideId] = cS(null);
  const [textDirty, setTextDirty] = cS(false);

  const update = (patch) => dispatch({ type: 'update-carousel', patch });

  // Ensure slides always exists (older data compatibility)
  cE(() => {
    if (!carousel.slides) update({ slides: [] });
  }, []);

  const slides = carousel.slides || [];

  // Rebuild canvases whenever anything changes
  const canvases = cM(
    () => buildCarouselCanvases(carousel, brand),
    [carousel, brand]
  );

  // Text field: read from slides UNLESS user is actively typing (textDirty).
  const [textLocal, setTextLocal] = cS('');
  cE(() => {
    if (!textDirty) setTextLocal(slidesToText(slides));
  }, [slides, textDirty]);

  const commitText = () => {
    // Parse textLocal into slides, but preserve id/overrides where possible
    const parsed = parseCarouselText(textLocal);
    const oldContent = slides.filter(s => s.kind !== 'outro');
    // Best-effort merge: reuse id + overrides if position matches
    const merged = parsed.map((p, i) => {
      const existing = oldContent[i];
      if (existing) {
        return {
          ...p,
          id: existing.id,
          kind: existing.kind === 'cover' ? 'cover' : 'content',
          styleOverride: existing.styleOverride,
          bgOverride: existing.bgOverride,
          elementOverrides: existing.elementOverrides,
        };
      }
      return { ...p, kind: 'content' };
    });
    const decorated = decorateSlides(merged, carousel);
    update({ slides: decorated });
    setTextDirty(false);
  };

  const applyExample = () => {
    setTextLocal(EXAMPLE_TEXT);
    // Immediately commit example
    const parsed = parseCarouselText(EXAMPLE_TEXT);
    const decorated = decorateSlides(parsed, carousel);
    update({ slides: decorated });
    setTextDirty(false);
  };

  // Toggle cover / outro / style / size — regenerate the derived slides
  const setCarouselOption = (patch) => {
    const nextCarousel = { ...carousel, ...patch };
    // If cover/outro toggled, re-decorate slides
    if ('addCover' in patch || 'addOutro' in patch) {
      const content = (carousel.slides || []).filter(s => s.kind !== 'outro');
      // Coerce first slide back to 'content' before re-decorating
      const normalized = content.map((s, i) => ({ ...s, kind: 'content' }));
      const decorated = decorateSlides(normalized, nextCarousel);
      update({ ...patch, slides: decorated });
    } else {
      update(patch);
    }
  };

  const updateSlide = (id, patch) => {
    const next = slides.map(s => s.id === id ? { ...s, ...patch } : s);
    update({ slides: next });
  };

  const deleteSlide = (id) => {
    if (!confirm('Delete this slide?')) return;
    update({ slides: slides.filter(s => s.id !== id) });
  };

  const duplicateSlide = (id) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const src = slides[idx];
    const dup = { ...JSON.parse(JSON.stringify(src)), id: uid() };
    const next = [...slides.slice(0, idx + 1), dup, ...slides.slice(idx + 1)];
    update({ slides: next });
  };

  // Merge into an explicitly selected adjacent content slide.
  const mergeSlide = (id, direction) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const src = slides[idx];
    if (src.kind !== 'content') { alert("Only content slides can be merged."); return; }

    let targetIdx = -1;
    if (direction === 'prev') {
      for (let i = idx - 1; i >= 0; i--) {
        if (slides[i].kind === 'content') { targetIdx = i; break; }
      }
    } else {
      for (let i = idx + 1; i < slides.length; i++) {
        if (slides[i].kind === 'content') { targetIdx = i; break; }
      }
    }
    if (targetIdx < 0) { alert(`No ${direction === 'prev' ? 'previous' : 'next'} content slide to merge with.`); return; }

    const target = slides[targetIdx];
    const first = idx < targetIdx ? src : target;
    const second = idx < targetIdx ? target : src;

    const parts = [];
    // Combine headings: keep the target's heading as primary; if the merged-in slide had its
    // own heading, tack it into the body so nothing is lost.
    const primaryHeading = target.heading || first.heading || second.heading || '';
    const extraHeading = src.heading;
    if (extraHeading && extraHeading !== primaryHeading) parts.push(extraHeading);
    if (first.body) parts.push(first.body);
    if (second.body && second.body !== first.body) parts.push(second.body);

    const mergedBody = parts.join('\n\n').trim();
    const mergedLabel = target.label || (first === target ? second.label : first.label) || null;

    const merged = {
      ...target,
      heading: primaryHeading,
      body: mergedBody,
      label: mergedLabel,
      // Preserve target's overrides; discard the source's.
    };

    const next = slides
      .map((s, i) => i === targetIdx ? merged : s)
      .filter((_, i) => i !== idx);
    update({ slides: next });
    setFocusedSlideId(target.id);
  };

  // Split a slide into two. If the body has a paragraph break we cut at the FIRST double newline;
  // otherwise we cut at the sentence closest to the midpoint. The new second slide inherits
  // the style but starts with an empty heading so the user can retitle it.
  const splitSlide = (id) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const src = slides[idx];
    if (src.kind !== 'content') { alert("Only content slides can be split."); return; }

    const body = (src.body || '').trim();
    if (!body) { alert("Nothing to split — this slide has no body text."); return; }

    // Prefer splitting at a paragraph break; otherwise split near the middle at a sentence end.
    let leftBody = '', rightBody = '';
    const paraBreak = body.indexOf('\n\n');
    if (paraBreak > 0) {
      leftBody  = body.slice(0, paraBreak).trim();
      rightBody = body.slice(paraBreak + 2).trim();
    } else {
      const mid = Math.floor(body.length / 2);
      // Find the closest sentence-ending punctuation to the midpoint.
      let cut = -1, best = Infinity;
      for (const m of body.matchAll(/[.!?]\s+/g)) {
        const end = m.index + m[0].length;
        const dist = Math.abs(end - mid);
        if (dist < best) { best = dist; cut = end; }
      }
      if (cut < 0) {
        // No sentence boundary — split on the nearest space to the midpoint.
        for (let d = 0; d < body.length; d++) {
          if (body[mid + d] === ' ') { cut = mid + d + 1; break; }
          if (body[mid - d] === ' ') { cut = mid - d + 1; break; }
        }
      }
      if (cut < 0) cut = mid;
      leftBody  = body.slice(0, cut).trim();
      rightBody = body.slice(cut).trim();
    }

    if (!leftBody || !rightBody) { alert("Couldn't split — try splitting a longer slide."); return; }

    const left = { ...src, body: leftBody };
    // New slide: same kind + label carried across, blank heading so the user retitles.
    const right = {
      id: uid(),
      kind: 'content',
      label: null,
      heading: '',
      body: rightBody,
      styleOverride: src.styleOverride,
      bgOverride: src.bgOverride,
    };

    const next = [
      ...slides.slice(0, idx),
      left,
      right,
      ...slides.slice(idx + 1),
    ];
    update({ slides: next });
  };

  const addSlide = (kind = 'content') => {
    const newS = { id: uid(), kind, label: null, heading: 'New slide', body: '' };
    // Insert before outro if present, else append
    const outroIdx = slides.findIndex(s => s.kind === 'outro');
    const next = outroIdx >= 0
      ? [...slides.slice(0, outroIdx), newS, ...slides.slice(outroIdx)]
      : [...slides, newS];
    update({ slides: next });
  };

  const reorderSlide = (from, to) => {
    const arr = [...slides];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    update({ slides: arr });
  };

  const saveAsDesign = () => {
    if (!canvases.length) { alert('Add some text first!'); return; }
    setSaving(true);
    const name = getCarouselTitle(carousel) || 'Carousel';
    // Strip __role and __slideId from canvases before saving
    const cleanCanvases = canvases.map(c => ({
      ...c, __slideId: undefined,
      elements: c.elements.map(el => { const { __role, ...rest } = el; return rest; }),
    }));
    const proj = {
      id: uid(),
      name,
      createdAt: now(),
      updatedAt: now(),
      thumbnail: null,
      canvases: cleanCanvases,
      activeCanvasId: cleanCanvases[0].id,
    };
    dispatch({ type: 'create-project', project: proj });
    dispatch({ type: 'set-view', view: 'editor' });
    setSaving(false);
  };

  const focusedSlide = focusedSlideId ? slides.find(s => s.id === focusedSlideId) : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--pink-100)' }}>
      {/* Top bar */}
      <div style={{
        height: 60, background: 'white', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'set-view', view: 'home' })}
          style={{ padding: '6px 10px 6px 6px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'white',
            boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--line)',
          }}>
            <img src="assets/wpr-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 15, color: 'var(--ink)' }}>Wonder Pads</span>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>Studio</span>
          </div>
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--line)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
          <Icon name="carousel" size={16} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Text-to-carousel</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {canvases.length} slide{canvases.length === 1 ? '' : 's'}</span>
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-tonal" onClick={() => { if (confirm('Clear this carousel and start over?')) { dispatch({ type: 'reset-carousel' }); setTextLocal(''); setTextDirty(false); } }}>
          <Icon name="clear" size={14} /> Clear
        </button>
        <button className="btn btn-primary" onClick={saveAsDesign} disabled={saving || !canvases.length}>
          Save & open in editor <Icon name="chevron_r" size={14} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* LEFT: input & config & slide editor */}
        <div style={{
          width: 460, background: 'white', borderRight: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {/* Text input */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>Your text</h2>
              <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--pink-500)' }} onClick={applyExample}>
                Try example
              </button>
            </div>
            <p style={{ margin: '2px 0 10px', color: 'var(--ink-3)', fontSize: 12 }}>
              Split slides with blank line or <code style={{ background: 'var(--pink-50)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>---</code>.
              Prefix a line with <code style={{ background: 'var(--pink-50)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>LABEL:</code> to tag.
            </p>
            <textarea
              value={textLocal}
              onChange={e => { setTextLocal(e.target.value); setTextDirty(true); }}
              onBlur={() => { if (textDirty) commitText(); }}
              placeholder={PLACEHOLDER_TEXT}
              className="scroll"
              style={{
                width: '100%', minHeight: 180,
                padding: 14, borderRadius: 12,
                border: textDirty ? '1.5px solid var(--pink-400)' : '1px solid var(--line)',
                background: 'var(--pink-50)',
                fontFamily: 'inherit', fontSize: 13, lineHeight: 1.55,
                color: 'var(--ink)', resize: 'vertical',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {textDirty && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 11 }}>
                <span style={{ color: 'var(--pink-500)' }}>Unsaved text changes</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => { setTextLocal(slidesToText(slides)); setTextDirty(false); }}>
                    Cancel
                  </button>
                  <button className="btn btn-tonal" style={{ fontSize: 11, padding: '4px 12px' }}
                    onClick={commitText}>
                    Apply to slides
                  </button>
                </div>
              </div>
            )}

            {/* Style */}
            <div style={{ marginTop: 22 }}>
              <SectionLabel>Default style</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CAROUSEL_STYLES.map(s => (
                  <button key={s.id}
                    onClick={() => setCarouselOption({ style: s.id })}
                    style={{
                      padding: 12, borderRadius: 10, textAlign: 'left',
                      background: carousel.style === s.id ? 'var(--pink-100)' : 'var(--pink-50)',
                      border: carousel.style === s.id ? '1px solid var(--pink-400)' : '1px solid transparent',
                      transition: 'all .12s',
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div style={{ marginTop: 6 }}>
              <SectionLabel>Slide size</SectionLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                {CAROUSEL_SIZES.map(s => (
                  <button key={s.id}
                    onClick={() => setCarouselOption({ size: s.id })}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      background: carousel.size === s.id ? 'var(--pink-200)' : 'var(--pink-50)',
                      color: carousel.size === s.id ? 'var(--pink-600)' : 'var(--ink-2)',
                      fontSize: 12, fontWeight: 500,
                      transition: 'all .12s',
                    }}>
                    {s.label}
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {s.w}×{s.h}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div style={{ marginTop: 6 }}>
              <SectionLabel>Options</SectionLabel>

              {/* Text-size scale — global multiplier applied to every text element */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--pink-50)',
                borderRadius: 10, marginBottom: 6,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--pink-500)', flexShrink: 0,
                }}>
                  <Icon name="text" size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>Text size</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { v: 0.7,  label: 'XS' },
                      { v: 0.8,  label: 'S'  },
                      { v: 0.9,  label: 'M-' },
                      { v: 1.0,  label: 'M'  },
                      { v: 1.1,  label: 'L'  },
                      { v: 1.25, label: 'XL' },
                    ].map(opt => {
                      const active = Math.abs((carousel.textScale || 1) - opt.v) < 0.02;
                      return (
                        <button key={opt.v} onClick={() => update({ textScale: opt.v })}
                          style={{
                            flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 500,
                            background: active ? 'var(--ink)' : 'white',
                            color: active ? 'white' : 'var(--ink-2)',
                            border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                            borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all .12s',
                          }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 4 }}>
                <ToggleRow label="Apply my brand kit" hint="Uses your logo, colors and fonts"
                  value={carousel.applyBrand} onChange={v => setCarouselOption({ applyBrand: v })} icon="brand_kit" />
                <ToggleRow label="Cover slide" hint="First block becomes the hook"
                  value={carousel.addCover} onChange={v => setCarouselOption({ addCover: v })} icon="templates" />
                <ToggleRow label="Slide numbers" hint="Show 01 / 02 / 03 on content slides"
                  value={carousel.showNumbers !== false} onChange={v => setCarouselOption({ showNumbers: v })} icon="text" />
                <ToggleRow label="'Save this post' outro" hint="Final slide with logo + handles"
                  value={carousel.addOutro} onChange={v => setCarouselOption({ addOutro: v })} icon="bolt" />
              </div>
            </div>

            {/* Editable slide cards */}
            <div style={{ marginTop: 6 }}>
              <SectionLabel action={
                <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: 'var(--pink-500)' }}
                  onClick={() => addSlide('content')}>
                  <Icon name="plus" size={11} /> Add
                </button>
              }>
                Slides <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>({slides.length})</span>
              </SectionLabel>
              {slides.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12,
                  background: 'var(--pink-50)', borderRadius: 10 }}>
                  Add text above or hit "Try example"
                </div>
              )}
              <EditableSlideList
                slides={slides}
                defaultStyle={carousel.style}
                brandColors={brand.colors}
                onUpdate={updateSlide}
                onDelete={deleteSlide}
                onDuplicate={duplicateSlide}
                onMerge={mergeSlide}
                onSplit={splitSlide}
                onReorder={reorderSlide}
                onFocus={setFocusedSlideId}
                focusedId={focusedSlideId}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: preview grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--line)', background: 'rgba(253,251,252,.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="instagram" size={16} style={{ color: 'var(--pink-500)' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Instagram preview</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Click any slide to edit its layout & elements
            </span>
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 60px' }}>
            <PreviewGrid canvases={canvases} onEdit={(canvas) => setFocusedSlideId(canvas.__slideId)} />
          </div>
        </div>
      </div>

      {/* Focused slide editor modal */}
      {focusedSlide && (
        <SlideEditorModal
          slide={focusedSlide}
          canvas={canvases.find(c => c.__slideId === focusedSlide.id)}
          carousel={carousel}
          brand={brand}
          onClose={() => setFocusedSlideId(null)}
          onUpdate={(patch) => updateSlide(focusedSlide.id, patch)}
        />
      )}
    </div>
  );
}

function ToggleRow({ label, hint, value, onChange, icon }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10, textAlign: 'left',
        background: 'transparent', transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-50)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: value ? 'var(--pink-100)' : 'var(--pink-50)',
          color: value ? 'var(--pink-600)' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all .12s',
        }}>
          <Icon name={icon} size={14} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{hint}</div>
      </div>
      <div style={{
        width: 32, height: 20, borderRadius: 999,
        background: value ? 'var(--pink-500)' : 'var(--line-2)',
        position: 'relative', transition: 'background .12s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 14 : 2,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          transition: 'left .16s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </div>
    </button>
  );
}

// -------------------- EDITABLE SLIDE CARDS --------------------
function EditableSlideList({ slides, defaultStyle, brandColors, onUpdate, onDelete, onDuplicate, onMerge, onSplit, onReorder, onFocus, focusedId }) {
  const [dragIdx, setDragIdx] = cS(null);
  // Count content slides to help EditableSlideCard decide when merge is possible.
  const contentSlideCount = slides.filter(s => s.kind === 'content').length;
  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {slides.map((s, i) => (
        <EditableSlideCard
          key={s.id}
          slide={s}
          index={i}
          count={slides.length}
          contentSlideCount={contentSlideCount}
          defaultStyle={defaultStyle}
          brandColors={brandColors}
          isFocused={focusedId === s.id}
          onUpdate={(patch) => onUpdate(s.id, patch)}
          onDelete={() => onDelete(s.id)}
          onDuplicate={() => onDuplicate(s.id)}
          onMergePrev={() => onMerge(s.id, 'prev')}
          onMergeNext={() => onMerge(s.id, 'next')}
          canMergePrev={slides.slice(0, i).some(item => item.kind === 'content')}
          canMergeNext={slides.slice(i + 1).some(item => item.kind === 'content')}
          onSplit={() => onSplit(s.id)}
          onFocus={() => onFocus(s.id)}
          onDragStart={() => setDragIdx(i)}
          onDropAt={() => { if (dragIdx !== null && dragIdx !== i) onReorder(dragIdx, i); setDragIdx(null); }}
          isDragging={dragIdx === i}
        />
      ))}
    </div>
  );
}

function EditableSlideCard({ slide, index, count, contentSlideCount, defaultStyle, brandColors, isFocused, onUpdate, onDelete, onDuplicate, onMergePrev, onMergeNext, canMergePrev, canMergeNext, onSplit, onFocus, onDragStart, onDropAt, isDragging }) {
  const [expanded, setExpanded] = cS(false);
  const kindLabel = slide.kind === 'cover' ? 'COVER' : slide.kind === 'outro' ? 'OUTRO' : `SLIDE ${index}`;
  const kindColor = slide.kind === 'cover' ? 'var(--pink-500)' : slide.kind === 'outro' ? '#8A7684' : 'var(--pink-400)';

  return (
    <div
      draggable={slide.kind !== 'outro'}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropAt}
      style={{
        background: isFocused ? 'var(--pink-100)' : 'var(--pink-50)',
        border: isFocused ? '1px solid var(--pink-400)' : '1px solid transparent',
        borderRadius: 12,
        padding: 12,
        opacity: isDragging ? 0.4 : 1,
        transition: 'all .12s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: expanded ? 10 : 0 }}>
        <div style={{ color: 'var(--ink-3)', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
          <Icon name="grip" size={14} />
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: kindColor,
          padding: '2px 8px', background: 'white', borderRadius: 4,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {kindLabel}
        </div>
        <button onClick={() => setExpanded(x => !x)}
          style={{
            flex: 1, textAlign: 'left', minWidth: 0,
            fontSize: 12, color: 'var(--ink)', padding: 0, background: 'transparent',
          }}>
          <div style={{
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontWeight: 500,
          }}>
            {slide.heading || (slide.kind === 'outro' ? '(outro slide)' : '(empty)')}
          </div>
        </button>
        <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={onFocus} title="Edit layout">
          <Icon name="templates" size={12} />
        </button>
        <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setExpanded(x => !x)}>
          <Icon name={expanded ? 'chevron_u' : 'chevron_dn'} size={12} />
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
          {slide.kind !== 'outro' && (
            <>
              <MiniInput
                label="Label (optional)"
                value={slide.label || ''}
                onChange={v => onUpdate({ label: v || null })}
                placeholder="e.g. TIP 01"
              />
              <MiniInput
                label="Heading"
                value={slide.heading}
                onChange={v => onUpdate({ heading: v })}
                placeholder="Slide title"
              />
              <MiniTextarea
                label="Body"
                value={slide.body}
                onChange={v => onUpdate({ body: v })}
                placeholder="Supporting text"
              />
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Style override</div>
              <select className="pk-select" style={{ width: '100%', fontSize: 12, padding: '6px 22px 6px 10px' }}
                value={slide.styleOverride || ''} onChange={e => onUpdate({ styleOverride: e.target.value || null })}>
                <option value="">Use default ({getStyleDef(defaultStyle).label})</option>
                {CAROUSEL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Background</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="color" value={slide.bgOverride || '#F1CFEA'}
                  onChange={e => onUpdate({ bgOverride: e.target.value })}
                  style={{ width: 30, height: 30, borderRadius: 8 }} />
                {slide.bgOverride && (
                  <button className="btn-ghost" style={{ fontSize: 10, padding: '4px 6px', color: 'var(--ink-3)' }}
                    onClick={() => onUpdate({ bgOverride: null })}>
                    reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {brandColors && brandColors.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {brandColors.map(c => (
                <button key={c}
                  onClick={() => onUpdate({ bgOverride: c })}
                  title={c}
                  style={{
                    width: 22, height: 22, borderRadius: 6, background: c,
                    border: slide.bgOverride === c ? '2px solid var(--pink-500)' : '1px solid var(--line)',
                  }} />
              ))}
            </div>
          )}

          {slide.elementOverrides && Object.keys(slide.elementOverrides).length > 0 && (
            <div style={{
              padding: '6px 8px', background: 'white', borderRadius: 8, fontSize: 10,
              color: 'var(--pink-600)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>✱ Layout customized</span>
              <button className="btn-ghost" style={{ fontSize: 10, padding: '2px 6px' }}
                onClick={() => onUpdate({ elementOverrides: null })}>
                Reset layout
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
            {slide.kind !== 'outro' && (
              <>
                <button className="btn btn-tonal" style={{ fontSize: 11, padding: '5px 10px' }} onClick={onFocus}>
                  <Icon name="templates" size={11} /> Edit layout
                </button>
                <button className="btn btn-tonal" style={{ fontSize: 11, padding: '5px 10px' }} onClick={onDuplicate}>
                  <Icon name="duplicate" size={11} /> Duplicate
                </button>
                {/* Explicit merge direction avoids surprising movement or end-of-list failures. */}
                {slide.kind === 'content' && (() => {
                  return (
                    <>
                      <button className="btn btn-tonal" onClick={canMergePrev ? onMergePrev : undefined}
                        disabled={!canMergePrev} title="Merge with previous slide"
                        style={{ fontSize: 11, padding: '5px 10px', opacity: canMergePrev ? 1 : 0.5 }}>
                        <Icon name="chevron_r" size={11} style={{ transform: 'rotate(180deg)' }} /> Merge previous
                      </button>
                      <button className="btn btn-tonal" onClick={canMergeNext ? onMergeNext : undefined}
                        disabled={!canMergeNext} title="Merge with next slide"
                        style={{ fontSize: 11, padding: '5px 10px', opacity: canMergeNext ? 1 : 0.5 }}>
                        Merge next <Icon name="chevron_r" size={11} />
                      </button>
                    </>
                  );
                })()}
                {/* Split — content slides with a non-empty body */}
                {slide.kind === 'content' && (() => {
                  const canSplit = !!(slide.body && slide.body.trim());
                  return (
                    <button
                      className="btn btn-tonal"
                      onClick={canSplit ? onSplit : undefined}
                      disabled={!canSplit}
                      title={canSplit ? 'Split this slide into two — cuts at a paragraph break or the nearest sentence to the middle' : 'Add body text to enable splitting'}
                      style={{
                        fontSize: 11, padding: '5px 10px',
                        opacity: canSplit ? 1 : 0.5,
                        cursor: canSplit ? 'pointer' : 'not-allowed',
                      }}>
                      <Icon name="plus" size={11} /> Split
                    </button>
                  );
                })()}
              </>
            )}
            <button className="btn btn-tonal" style={{ fontSize: 11, padding: '5px 10px', color: 'var(--pink-600)' }} onClick={onDelete}>
              <Icon name="trash" size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <input className="text-input" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: 12, padding: '7px 10px', background: 'white' }} />
    </div>
  );
}

function MiniTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', minHeight: 52, padding: '7px 10px', borderRadius: 8,
          border: '1px solid transparent', background: 'white',
          fontSize: 12, lineHeight: 1.5, color: 'var(--ink)',
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--pink-400)'}
        onBlur={e => e.target.style.borderColor = 'transparent'} />
    </div>
  );
}

// -------------------- PREVIEW GRID --------------------
function PreviewGrid({ canvases, onEdit }) {
  if (!canvases.length) {
    return (
      <div style={{
        padding: '80px 20px', textAlign: 'center', maxWidth: 480, margin: '0 auto',
        background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)',
      }}>
        <div style={{
          width: 72, height: 72, margin: '0 auto 18px', borderRadius: 22,
          background: 'linear-gradient(135deg, var(--pink-100), var(--pink-200))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pink-500)',
        }}>
          <Icon name="carousel" size={32} />
        </div>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>
          Paste your text on the left
        </div>
        <div style={{ color: 'var(--ink-3)', fontSize: 13, maxWidth: 320, margin: '0 auto' }}>
          Each paragraph becomes a slide. Try tapping "Try example" to see it in action.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          {canvases.length} slide{canvases.length === 1 ? '' : 's'} · {canvases[0].w}×{canvases[0].h}
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 150px)',
        gap: 14,
        justifyContent: 'flex-start',
      }}>
        {canvases.map((c, i) => (
          <PreviewSlide key={c.id} canvas={c} index={i} total={canvases.length} onEdit={() => onEdit(c)} />
        ))}
      </div>
    </div>
  );
}

function PreviewSlide({ canvas, index, total, onEdit }) {
  const [hover, setHover] = cS(false);
  const svg = cM(() => canvasToSVG(canvas), [canvas]);
  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

  return (
    <div
      onClick={onEdit}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        position: 'relative',
        aspectRatio: `${canvas.w}/${canvas.h}`,
        background: canvas.bg?.value || '#FDFBFC',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all .18s',
        border: '1px solid var(--line)',
      }}>
        <img src={dataUrl} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
        }} draggable={false} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(42,31,42,0.75)', color: 'white',
          padding: '2px 6px', borderRadius: 999,
          fontSize: 9, fontWeight: 500,
          backdropFilter: 'blur(6px)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {index + 1}/{total}
        </div>
        {hover && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 55%, rgba(42,31,42,0.55))',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: 8,
          }}>
            <div style={{
              background: 'white', color: 'var(--ink)',
              padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Icon name="templates" size={10} /> Edit
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '6px 2px 0', fontSize: 10, color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{canvas.name}</span>
        <span style={{ flexShrink: 0 }}>{index + 1}</span>
      </div>
    </div>
  );
}

// -------------------- SLIDE EDITOR MODAL --------------------
// Interactive: drag elements, click text to edit, resize with handles.
function SlideEditorModal({ slide, canvas, carousel, brand, onClose, onUpdate }) {
  const [selectedRole, setSelectedRole] = cS(null);
  const stageRef = cR(null);
  const [stageSize, setStageSize] = cS({ w: 0, h: 0 });
  const [editingRole, setEditingRole] = cS(null);
  const dragRef = cR(null);

  cE(() => {
    const onResize = () => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    onResize();
    window.addEventListener('resize', onResize);
    // Escape to close
    const onKey = (e) => { if (e.key === 'Escape') { if (editingRole) setEditingRole(null); else onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, editingRole]);

  if (!canvas) return null;

  const scale = stageSize.w && stageSize.h
    ? Math.min(stageSize.w / canvas.w, stageSize.h / canvas.h)
    : 0;

  const setOverride = (role, patch) => {
    const prev = slide.elementOverrides || {};
    const merged = { ...(prev[role] || {}), ...patch };
    onUpdate({ elementOverrides: { ...prev, [role]: merged } });
  };

  const clearOverride = (role) => {
    const prev = slide.elementOverrides || {};
    const { [role]: _, ...rest } = prev;
    onUpdate({ elementOverrides: Object.keys(rest).length ? rest : null });
  };

  const selectedEl = selectedRole
    ? canvas.elements.find(e => e.__role === selectedRole)
    : null;

  const startDrag = (e, role, mode, handleKey) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedRole(role);
    const el = canvas.elements.find(x => x.__role === role);
    if (!el) return;
    dragRef.current = {
      role, mode, handleKey,
      startX: e.clientX, startY: e.clientY,
      origX: el.x, origY: el.y, origW: el.w, origH: el.h,
    };
    const move = (ev) => {
      const dRef = dragRef.current;
      if (!dRef) return;
      const dx = (ev.clientX - dRef.startX) / scale;
      const dy = (ev.clientY - dRef.startY) / scale;
      if (dRef.mode === 'drag') {
        setOverride(dRef.role, { x: dRef.origX + dx, y: dRef.origY + dy });
      } else if (dRef.mode === 'resize') {
        const h = dRef.handleKey;
        let nx = dRef.origX, ny = dRef.origY, nw = dRef.origW, nh = dRef.origH;
        if (h.includes('e')) nw = Math.max(20, dRef.origW + dx);
        if (h.includes('w')) { nw = Math.max(20, dRef.origW - dx); nx = dRef.origX + (dRef.origW - nw); }
        if (h.includes('s')) nh = Math.max(20, dRef.origH + dy);
        if (h.includes('n')) { nh = Math.max(20, dRef.origH - dy); ny = dRef.origY + (dRef.origH - nh); }
        setOverride(dRef.role, { x: nx, y: ny, w: nw, h: nh });
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      dragRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{
          width: '96vw', height: '92vh', maxWidth: 1600,
          background: 'var(--pink-100)', borderRadius: 20,
          overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}>
        {/* Modal header */}
        <div style={{
          padding: '14px 20px', background: 'white', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 18 }}>{canvas.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Click any element to select · drag to reposition · use side panel to tweak</div>
          </div>
          <div style={{ flex: 1 }} />
          {slide.elementOverrides && Object.keys(slide.elementOverrides).length > 0 && (
            <button className="btn btn-tonal" onClick={() => onUpdate({ elementOverrides: null })}>
              <Icon name="clear" size={12} /> Reset layout
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Stage */}
          <div ref={stageRef}
            onClick={() => setSelectedRole(null)}
            style={{
              flex: 1, background: 'var(--pink-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 30, position: 'relative', overflow: 'hidden',
            }}
            className="checker"
          >
            {scale > 0 && (
              <div style={{
                position: 'absolute',
                left: (stageSize.w - canvas.w * scale) / 2,
                top:  (stageSize.h - canvas.h * scale) / 2,
                width: canvas.w * scale,
                height: canvas.h * scale,
                background: canvas.bg?.value || '#FDFBFC',
                boxShadow: 'var(--shadow-lg)',
              }}>
                {/* Scaled canvas layer */}
                <div style={{
                  position: 'absolute', inset: 0,
                  transform: `scale(${scale})`, transformOrigin: 'top left',
                  width: canvas.w, height: canvas.h,
                }}>
                  {canvas.elements.map(el => (
                    <InteractiveElementView
                      key={el.__role || el.id}
                      el={el}
                      role={el.__role}
                      selected={selectedRole === el.__role}
                      editing={editingRole === el.__role}
                      onSelect={(e) => { e.stopPropagation(); setSelectedRole(el.__role); }}
                      onDoubleClick={() => { if (el.type === 'text') { setSelectedRole(el.__role); setEditingRole(el.__role); } }}
                      onDragStart={(e) => startDrag(e, el.__role, 'drag')}
                      onCommitText={(text) => { setOverride(el.__role, { text }); setEditingRole(null); }}
                    />
                  ))}
                </div>
                {/* Selection ring (screen space) */}
                {selectedEl && (
                  <SelectionOverlay
                    el={selectedEl}
                    scale={scale}
                    onResize={(handleKey, e) => startDrag(e, selectedRole, 'resize', handleKey)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{
            width: 320, background: 'white', borderLeft: '1px solid var(--line)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {selectedEl ? (
                <ElementPropertiesPanel
                  el={selectedEl}
                  role={selectedRole}
                  onUpdate={(patch) => setOverride(selectedRole, patch)}
                  onReset={() => { clearOverride(selectedRole); setSelectedRole(null); }}
                  brandColors={brand.colors}
                />
              ) : (
                <SlideMetaPanel slide={slide} canvas={canvas} carousel={carousel} onUpdate={onUpdate} brandColors={brand.colors} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Self-contained interactive element renderer for the carousel slide editor.
// Renders the visual for the element AND handles click/drag/double-click.
function InteractiveElementView({ el, role, selected, editing, onSelect, onDoubleClick, onDragStart, onCommitText }) {
  const containerStyle = {
    position: 'absolute',
    left: el.x, top: el.y, width: el.w, height: el.h,
    transform: `rotate(${el.rot || 0}deg)`,
    transformOrigin: 'center center',
    opacity: el.opacity ?? 1,
    cursor: editing ? 'text' : 'move',
    pointerEvents: 'auto',
  };

  const handlePointerDown = (e) => {
    if (editing) return;
    onSelect(e);
    onDragStart(e);
  };

  // Render the visual
  let inner;
  if (el.type === 'text') {
    const textStyle = {
      width: '100%', height: '100%',
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.italic ? 'italic' : 'normal',
      textDecoration: el.underline ? 'underline' : 'none',
      textAlign: el.align,
      color: el.color,
      letterSpacing: el.letterSpacing,
      lineHeight: el.lineHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
      userSelect: 'none', padding: 4, boxSizing: 'border-box',
      wordBreak: 'break-word', whiteSpace: 'pre-wrap',
    };
    inner = editing ? (
      <textarea
        autoFocus
        defaultValue={el.text || ''}
        onBlur={e => onCommitText(e.target.value)}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Escape') e.target.blur();
        }}
        style={{
          ...textStyle,
          display: 'block',
          background: 'rgba(255,255,255,0.9)',
          border: '2px solid var(--pink-500)',
          borderRadius: 4,
          resize: 'none', outline: 'none',
        }}
      />
    ) : (
      <div style={textStyle}>{el.text}</div>
    );
  } else if (el.type === 'rect') {
    inner = <div style={{
      width: '100%', height: '100%',
      background: el.fill,
      border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke}` : 'none',
      borderRadius: el.radius, boxSizing: 'border-box',
    }} />;
  } else if (el.type === 'circle') {
    inner = <div style={{
      width: '100%', height: '100%',
      background: el.fill,
      border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke}` : 'none',
      borderRadius: '50%', boxSizing: 'border-box',
    }} />;
  } else if (el.type === 'line') {
    inner = <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none">
      <line x1="0" y1={el.h / 2} x2={el.w} y2={el.h / 2}
        stroke={el.stroke} strokeWidth={el.strokeWidth || 4} strokeLinecap="round" />
    </svg>;
  } else if (el.type === 'image') {
    const f = el.filter || { brightness: 100, contrast: 100, saturate: 100, blur: 0 };
    inner = <img src={el.src} draggable={false}
      style={{
        width: '100%', height: '100%', objectFit: 'contain',
        display: 'block', borderRadius: el.radius || 0,
        filter: `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`,
        pointerEvents: 'none',
      }} />;
  } else if (el.type === 'icon') {
    inner = <div style={{ width: '100%', height: '100%', color: el.color, pointerEvents: 'none' }}>
      <Icon name={el.name} size="100%" stroke={el.strokeWidth || 1.5} />
    </div>;
  } else {
    // Fallback: render nothing meaningful, but keep hit area
    inner = <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div style={containerStyle}
      onPointerDown={handlePointerDown}
      onDoubleClick={onDoubleClick}
      data-role={role}>
      {inner}
    </div>
  );
}

function SelectionOverlay({ el, scale, onResize }) {
  const style = {
    position: 'absolute',
    left: el.x * scale, top: el.y * scale,
    width: el.w * scale, height: el.h * scale,
    transform: `rotate(${el.rot || 0}deg)`,
    transformOrigin: 'center center',
    pointerEvents: 'none',
  };
  const handles = [
    { key: 'nw', style: { left: -5, top: -5, cursor: 'nwse-resize' } },
    { key: 'n',  style: { left: '50%', top: -5, marginLeft: -5, cursor: 'ns-resize' } },
    { key: 'ne', style: { right: -5, top: -5, cursor: 'nesw-resize' } },
    { key: 'e',  style: { right: -5, top: '50%', marginTop: -5, cursor: 'ew-resize' } },
    { key: 'se', style: { right: -5, bottom: -5, cursor: 'nwse-resize' } },
    { key: 's',  style: { left: '50%', bottom: -5, marginLeft: -5, cursor: 'ns-resize' } },
    { key: 'sw', style: { left: -5, bottom: -5, cursor: 'nesw-resize' } },
    { key: 'w',  style: { left: -5, top: '50%', marginTop: -5, cursor: 'ew-resize' } },
  ];
  return (
    <div style={style}>
      <div style={{ position: 'absolute', inset: 0, outline: '1.5px solid var(--pink-500)' }} />
      {handles.map(h => (
        <div key={h.key} style={{
          position: 'absolute', width: 10, height: 10,
          background: 'white', border: '1.5px solid var(--pink-500)',
          borderRadius: 2, boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0,0,0,.15)',
          pointerEvents: 'auto', ...h.style,
        }} onPointerDown={(e) => onResize(h.key, e)} />
      ))}
    </div>
  );
}

// Properties panel when an element is selected
function ElementPropertiesPanel({ el, role, onUpdate, onReset, brandColors }) {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Selected element
        </div>
        <h3 style={{ margin: '4px 0 0', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 20 }}>
          {roleLabel(role)}
        </h3>
      </div>

      {el.type === 'text' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Text</div>
            <textarea
              value={el.text || ''}
              onChange={e => onUpdate({ text: e.target.value })}
              style={{
                width: '100%', minHeight: 60, padding: 8, borderRadius: 8,
                border: '1px solid var(--line)', background: 'var(--pink-50)',
                fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Size</div>
              <input type="number" className="num-input" value={Math.round(el.fontSize)}
                onChange={e => onUpdate({ fontSize: Math.max(6, +e.target.value) })} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Line</div>
              <input type="number" step="0.1" className="num-input" value={el.lineHeight || 1.2}
                onChange={e => onUpdate({ lineHeight: +e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {['left', 'center', 'right'].map(a => (
              <button key={a} onClick={() => onUpdate({ align: a })}
                className={'icon-btn' + (el.align === a ? ' active' : '')}>
                <Icon name={'align_' + a[0]} size={14} />
              </button>
            ))}
            <div style={{ width: 1, background: 'var(--line)', margin: '0 4px' }} />
            <button className={'icon-btn' + (el.italic ? ' active' : '')} onClick={() => onUpdate({ italic: !el.italic })}>
              <Icon name="italic" size={14} />
            </button>
            <button className={'icon-btn' + (el.underline ? ' active' : '')} onClick={() => onUpdate({ underline: !el.underline })}>
              <Icon name="underline" size={14} />
            </button>
          </div>

          <ColorField label="Color" value={el.color} onChange={v => onUpdate({ color: v })} palette={brandColors} />
        </>
      )}

      {(el.type === 'rect' || el.type === 'circle') && (
        <>
          <ColorField label="Fill" value={el.fill} onChange={v => onUpdate({ fill: v })} palette={brandColors} />
          {el.type === 'rect' && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Corner radius</div>
              <input type="range" min="0" max="200" value={el.radius || 0}
                onChange={e => onUpdate({ radius: +e.target.value })} />
            </div>
          )}
        </>
      )}

      {el.type === 'line' && (
        <>
          <ColorField label="Color" value={el.stroke} onChange={v => onUpdate({ stroke: v })} palette={brandColors} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Thickness</div>
            <input type="range" min="1" max="20" value={el.strokeWidth || 1}
              onChange={e => onUpdate({ strokeWidth: +e.target.value })} />
          </div>
        </>
      )}

      {el.type === 'icon' && (
        <ColorField label="Color" value={el.color} onChange={v => onUpdate({ color: v })} palette={brandColors} />
      )}

      {el.type === 'image' && (
        <>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>
            Image linked to your brand logo. Change in Brand kit.
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Opacity</div>
            <input type="range" min="0" max="1" step="0.01" value={el.opacity ?? 1}
              onChange={e => onUpdate({ opacity: +e.target.value })} />
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 20 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Position
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <MiniNum label="X" value={Math.round(el.x)} onChange={v => onUpdate({ x: +v })} />
          <MiniNum label="Y" value={Math.round(el.y)} onChange={v => onUpdate({ y: +v })} />
          <MiniNum label="W" value={Math.round(el.w)} onChange={v => onUpdate({ w: Math.max(10, +v) })} />
          <MiniNum label="H" value={Math.round(el.h)} onChange={v => onUpdate({ h: Math.max(10, +v) })} />
        </div>
      </div>

      <button className="btn btn-tonal" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
        onClick={onReset}>
        <Icon name="clear" size={12} /> Reset this element
      </button>
    </>
  );
}

function MiniNum({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <input type="number" className="num-input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({ label, value, onChange, palette }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="color" value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)} />
        <input type="text" className="text-input" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      {palette && palette.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginTop: 6 }}>
          {palette.map((c, i) => (
            <button key={c + '-' + i} onClick={() => onChange(c)}
              style={{
                aspectRatio: '1', background: c, borderRadius: 4,
                border: value === c ? '2px solid var(--pink-500)' : '1px solid var(--line)',
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlideMetaPanel({ slide, canvas, carousel, onUpdate, brandColors }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Slide meta
        </div>
        <h3 style={{ margin: '4px 0 0', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 20 }}>
          Nothing selected
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
          Click any element on the canvas to edit it.
        </p>
      </div>

      {slide.kind !== 'outro' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Label</div>
            <input className="text-input" value={slide.label || ''} onChange={e => onUpdate({ label: e.target.value || null })} placeholder="Optional label" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Heading</div>
            <input className="text-input" value={slide.heading} onChange={e => onUpdate({ heading: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Body</div>
            <textarea value={slide.body} onChange={e => onUpdate({ body: e.target.value })}
              style={{
                width: '100%', minHeight: 70, padding: 8, borderRadius: 8,
                border: '1px solid var(--line)', background: 'var(--pink-50)',
                fontFamily: 'inherit', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              }} />
          </div>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Style override</div>
        <select className="pk-select" style={{ width: '100%', fontSize: 13, padding: '8px 24px 8px 12px' }}
          value={slide.styleOverride || ''} onChange={e => onUpdate({ styleOverride: e.target.value || null })}>
          <option value="">Use default ({getStyleDef(carousel.style).label})</option>
          {CAROUSEL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <ColorField label="Background" value={slide.bgOverride || canvas.bg.value} onChange={v => onUpdate({ bgOverride: v })} palette={brandColors} />
    </>
  );
}

function roleLabel(role) {
  const map = {
    heading: 'Heading', body: 'Body', label: 'Label', chip: 'Chip',
    number: 'Number', accent: 'Accent line', card: 'Card',
    quote: 'Quote mark', logo: 'Logo', shopName: 'Shop name',
    outroCta: 'Outro CTA', handles: 'Handles', counter: 'Slide counter',
    swipeText: 'Swipe hint', swipeBg: 'Swipe button',
  };
  if (map[role]) return map[role];
  if (role?.startsWith('handleIcon')) return 'Handle icon';
  if (role?.startsWith('handleText')) return 'Handle text';
  return role || 'Element';
}

function getCarouselTitle(carousel) {
  const first = (carousel.slides || []).find(s => s.kind !== 'outro');
  if (!first) return '';
  return (first.heading || '').slice(0, 40);
}

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

Object.assign(window, {
  CarouselMakerScreen, parseCarouselText, buildCarouselCanvases,
  CAROUSEL_STYLES, CAROUSEL_SIZES, decorateSlides, slidesToText,
});
