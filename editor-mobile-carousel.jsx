// Mobile carousel maker — tabs (Input / Preview / Edit)
const { useState: mcS, useMemo: mcM, useRef: mcR, useEffect: mcE } = React;

function MobileCarouselMaker() {
  const { state, dispatch } = useStore();
  const carousel = state.carousel;
  const brand = state.brand;
  const [tab, setTab] = mcS('input');
  const [textDirty, setTextDirty] = mcS(false);
  const [textLocal, setTextLocal] = mcS('');
  const [saving, setSaving] = mcS(false);
  const [focusedSlideId, setFocusedSlideId] = mcS(null);

  mcE(() => {
    if (!carousel.slides) dispatch({ type: 'update-carousel', patch: { slides: [] } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slides = carousel.slides || [];

  const canvases = mcM(
    () => buildCarouselCanvases(carousel, brand),
    [carousel, brand]
  );

  mcE(() => {
    if (!textDirty) setTextLocal(slidesToText(slides));
  }, [slides, textDirty]);

  const update = (patch) => dispatch({ type: 'update-carousel', patch });

  const commitText = () => {
    const parsed = parseCarouselText(textLocal);
    const oldContent = slides.filter(s => s.kind !== 'outro');
    const merged = parsed.map((p, i) => {
      const existing = oldContent[i];
      if (existing) return {
        ...p, id: existing.id,
        kind: existing.kind === 'cover' ? 'cover' : 'content',
        styleOverride: existing.styleOverride, bgOverride: existing.bgOverride,
        elementOverrides: existing.elementOverrides,
      };
      return { ...p, kind: 'content' };
    });
    const decorated = decorateSlides(merged, carousel);
    update({ slides: decorated });
    setTextDirty(false);
  };

  const applyExample = () => {
    const example = getExampleText();
    setTextLocal(example);
    const parsed = parseCarouselText(example);
    const decorated = decorateSlides(parsed, carousel);
    update({ slides: decorated });
    setTextDirty(false);
  };

  const setCarouselOption = (patch) => {
    const nextCarousel = { ...carousel, ...patch };
    if ('addCover' in patch || 'addOutro' in patch) {
      const content = (carousel.slides || []).filter(s => s.kind !== 'outro');
      const normalized = content.map(s => ({ ...s, kind: 'content' }));
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

  // Merge with the previous or next content slide, chosen explicitly by the user.
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
    const primaryHeading = target.heading || first.heading || second.heading || '';
    const extraHeading = src.heading;
    if (extraHeading && extraHeading !== primaryHeading) parts.push(extraHeading);
    if (first.body) parts.push(first.body);
    if (second.body && second.body !== first.body) parts.push(second.body);
    const mergedBody = parts.join('\n\n').trim();
    const mergedLabel = target.label || (first === target ? second.label : first.label) || null;
    const merged = { ...target, heading: primaryHeading, body: mergedBody, label: mergedLabel };
    const next = slides.map((s, i) => i === targetIdx ? merged : s).filter((_, i) => i !== idx);
    update({ slides: next });
    setFocusedSlideId(target.id);
  };

  const splitSlide = (id) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const src = slides[idx];
    if (src.kind !== 'content') { alert("Only content slides can be split."); return; }
    const body = (src.body || '').trim();
    if (!body) { alert("Nothing to split — this slide has no body text."); return; }
    let leftBody = '', rightBody = '';
    const paraBreak = body.indexOf('\n\n');
    if (paraBreak > 0) {
      leftBody = body.slice(0, paraBreak).trim();
      rightBody = body.slice(paraBreak + 2).trim();
    } else {
      const mid = Math.floor(body.length / 2);
      let cut = -1, best = Infinity;
      for (const m of body.matchAll(/[.!?]\s+/g)) {
        const end = m.index + m[0].length;
        const dist = Math.abs(end - mid);
        if (dist < best) { best = dist; cut = end; }
      }
      if (cut < 0) {
        for (let d = 0; d < body.length; d++) {
          if (body[mid + d] === ' ') { cut = mid + d + 1; break; }
          if (body[mid - d] === ' ') { cut = mid - d + 1; break; }
        }
      }
      if (cut < 0) cut = mid;
      leftBody = body.slice(0, cut).trim();
      rightBody = body.slice(cut).trim();
    }
    if (!leftBody || !rightBody) { alert("Couldn't split — try splitting a longer slide."); return; }
    const left = { ...src, body: leftBody };
    const right = {
      id: uid(), kind: 'content', label: null, heading: '', body: rightBody,
      styleOverride: src.styleOverride, bgOverride: src.bgOverride,
    };
    const next = [...slides.slice(0, idx), left, right, ...slides.slice(idx + 1)];
    update({ slides: next });
  };
  const reorderSlide = (from, to) => {
    const arr = [...slides];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    update({ slides: arr });
  };
  const addSlide = () => {
    const newS = { id: uid(), kind: 'content', label: null, heading: 'New slide', body: '' };
    const outroIdx = slides.findIndex(s => s.kind === 'outro');
    const next = outroIdx >= 0
      ? [...slides.slice(0, outroIdx), newS, ...slides.slice(outroIdx)]
      : [...slides, newS];
    update({ slides: next });
  };

  const saveAsDesign = () => {
    if (!canvases.length) { alert('Add some text first'); return; }
    setSaving(true);
    const name = (slides.find(s => s.kind !== 'outro')?.heading || 'Carousel').slice(0, 40);
    const cleanCanvases = canvases.map(c => ({
      ...c, __slideId: undefined,
      elements: c.elements.map(el => { const { __role, ...rest } = el; return rest; }),
    }));
    const proj = {
      id: uid(), name, createdAt: now(), updatedAt: now(), thumbnail: null,
      canvases: cleanCanvases, activeCanvasId: cleanCanvases[0].id,
    };
    dispatch({ type: 'create-project', project: proj });
    setSaving(false);
  };

  const focusedSlide = focusedSlideId ? slides.find(s => s.id === focusedSlideId) : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--pink-100)' }}>
      <div className="safe-top" style={{
        padding: '10px 12px', background: 'white', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, zIndex: 20,
      }}>
        <button className="icon-btn" onClick={() => dispatch({ type: 'set-view', view: 'home' })}>
          <Icon name="chevron_r" size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="carousel" size={14} style={{ color: 'var(--pink-500)' }} /> Text to carousel
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            {canvases.length} slide{canvases.length === 1 ? '' : 's'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveAsDesign}
          disabled={saving || !canvases.length}
          style={{ padding: '8px 14px', fontSize: 12 }}>
          Save
        </button>
      </div>

      <div style={{
        display: 'flex', gap: 4, padding: '0 8px',
        borderBottom: '1px solid var(--line)', background: 'white', flexShrink: 0,
      }}>
        {[
          { id: 'input', label: 'Input', icon: 'text' },
          { id: 'preview', label: 'Preview', icon: 'instagram' },
          { id: 'edit', label: 'Edit', icon: 'templates' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '12px 4px', fontSize: 12, fontWeight: 500,
              color: tab === t.id ? 'var(--pink-600)' : 'var(--ink-2)',
              borderBottom: tab === t.id ? '2px solid var(--pink-500)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {tab === 'input' && <MobileCarouselInput
          textLocal={textLocal} setTextLocal={setTextLocal}
          textDirty={textDirty} setTextDirty={setTextDirty}
          commitText={commitText} applyExample={applyExample}
          carousel={carousel} setCarouselOption={setCarouselOption}
        />}
        {tab === 'preview' && <MobileCarouselPreview canvases={canvases}
          onEdit={(canvas) => { setFocusedSlideId(canvas.__slideId); setTab('edit'); }} />}
        {tab === 'edit' && <MobileCarouselEdit slides={slides} defaultStyle={carousel.style}
          brandColors={brand.colors}
          onUpdate={updateSlide} onDelete={deleteSlide} onDuplicate={duplicateSlide}
          onMerge={mergeSlide} onSplit={splitSlide}
          onReorder={reorderSlide} onAdd={addSlide}
          focusedId={focusedSlideId} onFocus={setFocusedSlideId} />}
      </div>

      {focusedSlide && (
        <MobileSlideEditor
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

// ------- Input tab -------
function MobileCarouselInput({ textLocal, setTextLocal, textDirty, setTextDirty,
  commitText, applyExample, carousel, setCarouselOption }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Your text</div>
        <button onClick={applyExample}
          style={{ fontSize: 11, color: 'var(--pink-500)', background: 'transparent', padding: 4 }}>
          Try example
        </button>
      </div>
      <p style={{ margin: '0 0 10px', color: 'var(--ink-3)', fontSize: 11 }}>
        Split with blank line or <code style={{ background: 'var(--pink-50)', padding: '1px 5px',
          borderRadius: 3, fontSize: 10 }}>---</code>. Prefix a line with <code style={{ background: 'var(--pink-50)',
          padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>LABEL:</code> to tag.
      </p>
      <textarea
        value={textLocal}
        onChange={e => { setTextLocal(e.target.value); setTextDirty(true); }}
        onBlur={() => { if (textDirty) commitText(); }}
        placeholder="Paste or type your carousel copy…"
        className="scroll"
        style={{
          width: '100%', minHeight: 180,
          padding: 12, borderRadius: 12,
          border: textDirty ? '1.5px solid var(--pink-400)' : '1px solid var(--line)',
          background: 'var(--pink-50)',
          fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
          color: 'var(--ink)', resize: 'vertical',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      {textDirty && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: 11, color: 'var(--pink-500)' }}>Unsaved</span>
          <button onClick={() => { setTextLocal(''); setTextDirty(false); }}
            style={{ fontSize: 11, padding: '4px 10px', background: 'transparent', color: 'var(--ink-3)' }}>
            Cancel
          </button>
          <button className="btn btn-tonal" onClick={commitText}
            style={{ fontSize: 11, padding: '4px 12px' }}>
            Apply
          </button>
        </div>
      )}

      <MobileFieldGroup label="Default style">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {CAROUSEL_STYLES.map(s => (
            <button key={s.id} onClick={() => setCarouselOption({ style: s.id })}
              style={{
                padding: 10, borderRadius: 10, textAlign: 'left',
                background: carousel.style === s.id ? 'var(--pink-100)' : 'var(--pink-50)',
                border: carousel.style === s.id ? '1px solid var(--pink-400)' : '1px solid transparent',
              }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </MobileFieldGroup>

      <MobileFieldGroup label="Slide size">
        <div style={{ display: 'flex', gap: 6 }}>
          {CAROUSEL_SIZES.map(s => (
            <button key={s.id} onClick={() => setCarouselOption({ size: s.id })}
              style={{
                flex: 1, padding: 10, borderRadius: 10,
                background: carousel.size === s.id ? 'var(--pink-200)' : 'var(--pink-50)',
                color: carousel.size === s.id ? 'var(--pink-600)' : 'var(--ink-2)',
                fontSize: 12, fontWeight: 500,
              }}>
              {s.label}
              <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2,
                fontVariantNumeric: 'tabular-nums' }}>{s.w}×{s.h}</div>
            </button>
          ))}
        </div>
      </MobileFieldGroup>

      <MobileFieldGroup label="Options">
        {/* Text-size scale */}
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
                  <button key={opt.v} onClick={() => setCarouselOption({ textScale: opt.v })}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 500,
                      background: active ? 'var(--ink)' : 'white',
                      color: active ? 'white' : 'var(--ink-2)',
                      border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                      borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <MobileToggle label="Apply brand kit" hint="Use logo, colors, fonts"
          value={carousel.applyBrand} onChange={v => setCarouselOption({ applyBrand: v })} icon="brand_kit" />
        <MobileToggle label="Cover slide" hint="First block becomes the hook"
          value={carousel.addCover} onChange={v => setCarouselOption({ addCover: v })} icon="templates" />
        <MobileToggle label="Slide numbers" hint="Show 01 / 02 / 03 on content slides"
          value={carousel.showNumbers !== false} onChange={v => setCarouselOption({ showNumbers: v })} icon="text" />
        <MobileToggle label="'Save this post' outro" hint="Final CTA slide"
          value={carousel.addOutro} onChange={v => setCarouselOption({ addOutro: v })} icon="bolt" />
      </MobileFieldGroup>
    </div>
  );
}

function MobileFieldGroup({ label, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)',
        letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function MobileToggle({ label, hint, value, onChange, icon }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 8px', borderRadius: 10, textAlign: 'left',
        background: 'transparent',
      }}>
      {icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: value ? 'var(--pink-100)' : 'var(--pink-50)',
          color: value ? 'var(--pink-600)' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={icon} size={14} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{hint}</div>
      </div>
      <div style={{
        width: 36, height: 22, borderRadius: 999,
        background: value ? 'var(--pink-500)' : 'var(--line-2)',
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 16 : 2,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left .16s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </div>
    </button>
  );
}

// ------- Preview tab -------
function MobileCarouselPreview({ canvases, onEdit }) {
  if (!canvases.length) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', margin: 16,
        background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)' }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 14px', borderRadius: 18,
          background: 'linear-gradient(135deg, var(--pink-100), var(--pink-200))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pink-500)',
        }}>
          <Icon name="carousel" size={26} />
        </div>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>
          No slides yet
        </div>
        <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>
          Head to the Input tab and add some text.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="instagram" size={14} style={{ color: 'var(--pink-500)' }} />
        <div style={{ fontSize: 12, fontWeight: 500 }}>Instagram preview</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>· {canvases.length} slides</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {canvases.map((c, i) => (
          <MobilePreviewSlide key={c.id} canvas={c} index={i} total={canvases.length}
            onEdit={() => onEdit(c)} />
        ))}
      </div>
    </div>
  );
}

function MobilePreviewSlide({ canvas, index, total, onEdit }) {
  const svg = mcM(() => canvasToSVG(canvas), [canvas]);
  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  return (
    <button onClick={onEdit} style={{
      padding: 0, background: 'transparent', width: '100%', textAlign: 'left',
    }}>
      <div style={{
        position: 'relative',
        aspectRatio: `${canvas.w}/${canvas.h}`,
        background: canvas.bg?.value || '#FDFBFC',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)',
      }}>
        <img src={dataUrl} draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: 'rgba(42,31,42,0.75)', color: 'white',
          padding: '2px 6px', borderRadius: 999,
          fontSize: 9, fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}>{index + 1}/{total}</div>
      </div>
      <div style={{ padding: '6px 2px 0', fontSize: 10, color: 'var(--ink-3)',
        display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{canvas.name}</span>
        <span>{index + 1}</span>
      </div>
    </button>
  );
}

// ------- Edit tab -------
function MobileCarouselEdit({ slides, defaultStyle, brandColors,
  onUpdate, onDelete, onDuplicate, onMerge, onSplit, onReorder, onAdd, focusedId, onFocus }) {
  const contentSlideCount = slides.filter(s => s.kind === 'content').length;
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Slides <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>({slides.length})</span></div>
        <button onClick={onAdd} className="btn btn-tonal" style={{ padding: '6px 12px', fontSize: 12 }}>
          <Icon name="plus" size={12} /> Add
        </button>
      </div>
      {slides.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--pink-50)',
          borderRadius: 12, color: 'var(--ink-3)', fontSize: 13 }}>
          Add text in the Input tab first.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {slides.map((s, i) => (
            <MobileEditableSlideCard key={s.id} slide={s} index={i}
              defaultStyle={defaultStyle} brandColors={brandColors}
              isFocused={focusedId === s.id}
              contentSlideCount={contentSlideCount}
              onUpdate={(patch) => onUpdate(s.id, patch)}
              onDelete={() => onDelete(s.id)}
              onDuplicate={() => onDuplicate(s.id)}
              onMergePrev={() => onMerge(s.id, 'prev')}
              onMergeNext={() => onMerge(s.id, 'next')}
              canMergePrev={slides.slice(0, i).some(item => item.kind === 'content')}
              canMergeNext={slides.slice(i + 1).some(item => item.kind === 'content')}
              onSplit={() => onSplit(s.id)}
              onFocus={() => onFocus(s.id)}
              canMoveUp={i > 0 && slides[i - 1]?.kind !== 'outro'}
              canMoveDown={i < slides.length - 1 && s.kind !== 'outro'}
              onMoveUp={() => onReorder(i, i - 1)}
              onMoveDown={() => onReorder(i, i + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileEditableSlideCard({ slide, index, defaultStyle, brandColors, isFocused, contentSlideCount,
  onUpdate, onDelete, onDuplicate, onMergePrev, onMergeNext, canMergePrev, canMergeNext,
  onSplit, onFocus, canMoveUp, canMoveDown, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = mcS(false);
  const kindLabel = slide.kind === 'cover' ? 'COVER' : slide.kind === 'outro' ? 'OUTRO' : `SLIDE ${index}`;
  const kindColor = slide.kind === 'cover' ? 'var(--pink-500)' : slide.kind === 'outro' ? '#8A7684' : 'var(--pink-400)';

  return (
    <div style={{
      background: isFocused ? 'var(--pink-100)' : 'var(--pink-50)',
      border: isFocused ? '1px solid var(--pink-400)' : '1px solid transparent',
      borderRadius: 12, padding: 10,
    }}>
      <button onClick={() => setExpanded(x => !x)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: 0, background: 'transparent', textAlign: 'left',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: kindColor,
          padding: '3px 8px', background: 'white', borderRadius: 4,
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>{kindLabel}</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
          {slide.heading || (slide.kind === 'outro' ? '(outro slide)' : '(empty)')}
        </div>
        <Icon name={expanded ? 'chevron_u' : 'chevron_dn'} size={14}
          style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {slide.kind !== 'outro' && (
            <>
              <MobileTextField label="Label" value={slide.label || ''}
                onChange={v => onUpdate({ label: v || null })} placeholder="e.g. TIP 01" />
              <MobileTextField label="Heading" value={slide.heading}
                onChange={v => onUpdate({ heading: v })} placeholder="Slide title" />
              <MobileTextArea label="Body" value={slide.body}
                onChange={v => onUpdate({ body: v })} placeholder="Supporting text" />
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>Style</div>
              <select className="pk-select" style={{ width: '100%', fontSize: 12, padding: '7px 22px 7px 10px' }}
                value={slide.styleOverride || ''} onChange={e => onUpdate({ styleOverride: e.target.value || null })}>
                <option value="">Default</option>
                {CAROUSEL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>Background</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="color" value={slide.bgOverride || '#F1CFEA'}
                  onChange={e => onUpdate({ bgOverride: e.target.value })}
                  style={{ width: 34, height: 34, borderRadius: 8 }} />
                {slide.bgOverride && (
                  <button onClick={() => onUpdate({ bgOverride: null })}
                    style={{ fontSize: 10, color: 'var(--ink-3)', background: 'transparent', padding: 4 }}>reset</button>
                )}
              </div>
            </div>
          </div>

          {brandColors?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {brandColors.map((c, i) => (
                <button key={c + '-' + i} onClick={() => onUpdate({ bgOverride: c })}
                  style={{
                    width: 24, height: 24, borderRadius: 6, background: c,
                    border: slide.bgOverride === c ? '2px solid var(--pink-500)' : '1px solid var(--line)',
                  }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {slide.kind !== 'outro' && (
              <button className="btn btn-primary" onClick={onFocus}
                style={{ fontSize: 11, padding: '6px 12px' }}>
                <Icon name="templates" size={12} /> Edit layout
              </button>
            )}
            {canMoveUp && (
              <button className="icon-btn compact" onClick={onMoveUp}>
                <Icon name="chevron_u" size={14} />
              </button>
            )}
            {canMoveDown && (
              <button className="icon-btn compact" onClick={onMoveDown}>
                <Icon name="chevron_dn" size={14} />
              </button>
            )}
            {slide.kind !== 'outro' && (
              <button className="icon-btn compact" onClick={onDuplicate} title="Duplicate">
                <Icon name="duplicate" size={14} />
              </button>
            )}
            {slide.kind === 'content' && canMergePrev && (
              <button className="btn btn-tonal" onClick={onMergePrev}
                title="Merge with previous slide" style={{ fontSize: 10, padding: '5px 8px' }}>
                <Icon name="chevron_r" size={11} style={{ transform: 'rotate(180deg)' }} /> Merge
              </button>
            )}
            {slide.kind === 'content' && canMergeNext && (
              <button className="btn btn-tonal" onClick={onMergeNext}
                title="Merge with next slide" style={{ fontSize: 10, padding: '5px 8px' }}>
                Merge <Icon name="chevron_r" size={11} />
              </button>
            )}
            {/* Split — content slides with a non-empty body */}
            {slide.kind === 'content' && !!(slide.body && slide.body.trim()) && (
              <button className="icon-btn compact" onClick={onSplit}
                title="Split this slide into two">
                <Icon name="plus" size={14} />
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="icon-btn compact" onClick={onDelete}
              style={{ color: 'var(--pink-600)' }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <input className="text-input" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ fontSize: 13, padding: '9px 12px', background: 'white' }} />
    </div>
  );
}
function MobileTextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 3 }}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', minHeight: 60, padding: '9px 12px', borderRadius: 8,
          border: '1px solid transparent', background: 'white',
          fontSize: 13, lineHeight: 1.5, color: 'var(--ink)',
          fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
        }} />
    </div>
  );
}

// ------- Mobile slide editor (fullscreen) -------
function MobileSlideEditor({ slide, canvas, carousel, brand, onClose, onUpdate }) {
  const [selectedRole, setSelectedRole] = mcS(null);
  const stageRef = mcR(null);
  const [stageSize, setStageSize] = mcS({ w: 0, h: 0 });
  const [propOpen, setPropOpen] = mcS(false);
  const dragRef = mcR(null);

  mcE(() => {
    const onResize = () => {
      if (!stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!canvas) return null;
  const scale = stageSize.w && stageSize.h
    ? Math.min(stageSize.w / canvas.w, stageSize.h / canvas.h) * 0.9
    : 0;

  const setOverride = (role, patch) => {
    const prev = slide.elementOverrides || {};
    onUpdate({ elementOverrides: { ...prev, [role]: { ...(prev[role] || {}), ...patch } } });
  };
  const clearOverride = (role) => {
    const prev = slide.elementOverrides || {};
    const { [role]: _, ...rest } = prev;
    onUpdate({ elementOverrides: Object.keys(rest).length ? rest : null });
  };

  const startDrag = (e, role, mode, handleKey) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedRole(role);
    const el = canvas.elements.find(x => x.__role === role);
    if (!el) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      role, mode, handleKey,
      startX: clientX, startY: clientY,
      origX: el.x, origY: el.y, origW: el.w, origH: el.h,
    };
    const move = (ev) => {
      const dRef = dragRef.current;
      if (!dRef) return;
      if (ev.touches?.length > 1) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = (cx - dRef.startX) / scale;
      const dy = (cy - dRef.startY) / scale;
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
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      dragRef.current = null;
    };
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const selectedEl = selectedRole ? canvas.elements.find(e => e.__role === selectedRole) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--pink-100)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="safe-top" style={{
        padding: '10px 12px', background: 'white', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <button className="icon-btn" onClick={onClose}>
          <Icon name="chevron_r" size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)',
            fontFamily: 'DM Serif Display' }}>{canvas.name}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            Tap to select · drag to move
          </div>
        </div>
        {slide.elementOverrides && Object.keys(slide.elementOverrides).length > 0 && (
          <button className="btn btn-tonal" onClick={() => onUpdate({ elementOverrides: null })}
            style={{ padding: '6px 10px', fontSize: 11 }}>Reset</button>
        )}
        <button className="btn btn-primary" onClick={onClose}
          style={{ padding: '6px 14px', fontSize: 12 }}>Done</button>
      </div>

      <div ref={stageRef}
        onClick={() => setSelectedRole(null)}
        style={{
          flex: 1, background: 'var(--pink-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, position: 'relative', overflow: 'hidden',
          touchAction: 'none',
        }} className="checker">
        {scale > 0 && (
          <div style={{
            position: 'absolute',
            left: (stageSize.w - canvas.w * scale) / 2,
            top:  (stageSize.h - canvas.h * scale) / 2,
            width: canvas.w * scale, height: canvas.h * scale,
            background: canvas.bg?.value || '#FDFBFC',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              transform: `scale(${scale})`, transformOrigin: 'top left',
              width: canvas.w, height: canvas.h,
            }}>
              {canvas.elements.map(el => (
                <InteractiveElementView key={el.__role || el.id}
                  el={el} role={el.__role}
                  selected={selectedRole === el.__role}
                  editing={false}
                  onSelect={(e) => { e.stopPropagation(); setSelectedRole(el.__role); }}
                  onDoubleClick={() => {}}
                  onDragStart={(e) => startDrag(e, el.__role, 'drag')}
                  onCommitText={() => {}}
                />
              ))}
            </div>
            {selectedEl && (
              <MobileSelectionOverlay el={selectedEl} scale={scale}
                onResize={(handle, e) => startDrag(e, selectedRole, 'resize', handle)} />
            )}
          </div>
        )}
      </div>

      <div className="safe-bottom" style={{
        padding: '10px 12px', background: 'white', borderTop: '1px solid var(--line)',
        display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
            {selectedEl ? roleLabel(selectedRole) : 'Slide meta'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            {selectedEl ? 'Tap Edit to change properties' : 'Tap an element on the canvas'}
          </div>
        </div>
        {selectedEl && (
          <button className="btn btn-tonal" onClick={() => clearOverride(selectedRole)}
            style={{ padding: '6px 10px', fontSize: 11 }}>Reset</button>
        )}
        <button className="btn btn-primary" onClick={() => setPropOpen(true)}
          style={{ padding: '6px 14px', fontSize: 12 }}>Edit</button>
      </div>

      <BottomSheet open={propOpen} onClose={() => setPropOpen(false)}
        title={selectedEl ? roleLabel(selectedRole) : 'Slide meta'}>
        {selectedEl ? (
          <ElementPropertiesPanel el={selectedEl} role={selectedRole}
            onUpdate={(patch) => setOverride(selectedRole, patch)}
            onReset={() => { clearOverride(selectedRole); setSelectedRole(null); setPropOpen(false); }}
            brandColors={brand.colors} />
        ) : (
          <SlideMetaPanel slide={slide} canvas={canvas} carousel={carousel}
            onUpdate={onUpdate} brandColors={brand.colors} />
        )}
      </BottomSheet>
    </div>
  );
}

function getExampleText() {
  return (typeof EXAMPLE_TEXT !== 'undefined' && EXAMPLE_TEXT) ||
    `THE GUIDE: Your first reusable pad, without the overwhelm

Getting started with reusable pads

Everything you need to know before your first cycle with reusables. Simple, gentle, effective.

---

TIP 01: Start with your usual flow

Track a single cycle with the pads you already own.

TIP 02: Build a rotation of three

Two absorbencies, one liner. Wash, rotate, repeat.

TIP 03: Rinse cold, then wash warm

Cold water first to protect the fibers.

TIP 04: Air-dry, always

Skip the dryer to keep the wings crisp.`;
}

Object.assign(window, {
  MobileCarouselMaker, MobileCarouselInput, MobileCarouselPreview, MobileCarouselEdit,
  MobileEditableSlideCard, MobileSlideEditor, MobileFieldGroup, MobileToggle,
});
