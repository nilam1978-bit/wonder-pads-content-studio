// Content Repurposer — one idea, shaped for every platform, in your brand voice.
// Responsive: works desktop + mobile with the same tree.
const { useState: rpS, useEffect: rpE, useRef: rpR, useMemo: rpM } = React;

// ---- Platform icon mapping ----
const PLATFORM_ICON = {
  'instagram-caption':  'instagram',
  'instagram-carousel': 'carousel',
  'tiktok-hook':        'tiktok',
  'facebook-post':      'facebook',
  'youtube-shorts':     'youtube',
  'story-frames':       'story',
  'website-blurb':      'website',
  'reel-hook':          'sparkles',
};

// ---- Toast ----
function useRpToast() {
  const [msg, setMsg] = rpS(null);
  const show = (t) => { setMsg(t); setTimeout(() => setMsg(null), 1800); };
  const Toast = msg ? (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'white', padding: '10px 16px',
      borderRadius: 999, fontSize: 13, boxShadow: 'var(--shadow-lg)', zIndex: 10000,
      fontFamily: 'Instrument Sans',
    }}>{msg}</div>
  ) : null;
  return { show, Toast };
}

// ---- Output card ----
function RpOutputCard({
  title, platformKey, text, isLoading, onCopy, onRegen, onEdit, onSendToCarousel, onSendToCalendar,
  variants = null, activeIdx = 0, onSwitchVariant,
}) {
  const [editing, setEditing] = rpS(false);
  const ref = rpR(null);
  const bridge = CONTENT_SEED.repurposeTemplates[platformKey]?.bridge;
  const hasVariants = Array.isArray(variants) && variants.length > 1;

  const handleBlur = () => {
    if (editing && ref.current) {
      onEdit(ref.current.innerText);
      setEditing(false);
    }
  };

  return (
    <div style={{
      background: 'white', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasVariants ? 6 : 10, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'var(--pink-50)', color: 'var(--pink-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name={PLATFORM_ICON[platformKey] || 'sparkles'} size={14} />
          </div>
          <div style={{
            fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</div>
        </div>
        {!isLoading && text && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {bridge === 'carousel' && onSendToCarousel && (
              <button className="btn btn-tonal" onClick={onSendToCarousel}
                style={{ padding: '6px 10px', fontSize: 11, background: 'var(--pink-100)', color: 'var(--pink-600)' }}
                title="Open in Carousel maker">
                <Icon name="carousel" size={12} /> To carousel
              </button>
            )}
            {onSendToCalendar && (
              <button className="icon-btn compact" title="Add to calendar" onClick={onSendToCalendar}>
                <Icon name="history" size={14} />
              </button>
            )}
            <button className="icon-btn compact" title="Edit"
              onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}>
              <Icon name="edit" size={14} />
            </button>
            <button className="icon-btn compact" title="Regenerate" onClick={onRegen}>
              <Icon name="refresh" size={14} />
            </button>
            <button className="icon-btn compact" title="Copy" onClick={onCopy}>
              <Icon name="copy" size={14} />
            </button>
          </div>
        )}
      </div>
      {hasVariants && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {variants.map((v, i) => {
            const active = i === activeIdx;
            const isVarLoading = v === '__LOADING__';
            return (
              <button key={i} onClick={() => onSwitchVariant && onSwitchVariant(i)}
                style={{
                  padding: '4px 12px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: active ? 'var(--ink)' : 'var(--pink-50)',
                  color: active ? 'white' : 'var(--ink-3)',
                  border: 'none', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  opacity: isVarLoading ? 0.6 : 1,
                }}>
                v{i + 1}{isVarLoading ? '…' : ''}
              </button>
            );
          })}
        </div>
      )}
      {isLoading ? (
        <div>
          <div className="skel" style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, marginBottom: 6, width: '90%' }} />
          <div className="skel" style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, marginBottom: 6, width: '75%' }} />
          <div className="skel" style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, marginBottom: 6, width: '85%' }} />
          <div className="skel" style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, width: '60%' }} />
        </div>
      ) : (
        <div
          ref={ref}
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          style={{
            fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55,
            whiteSpace: 'pre-wrap', outline: editing ? '2px solid var(--pink-400)' : 'none',
            outlineOffset: 4, borderRadius: 4, minHeight: 40,
          }}>{text || ''}</div>
      )}
    </div>
  );
}

// ---- Main screen ----
function RepurposeScreen() {
  const { state, dispatch } = useStore();
  const { show: toast, Toast } = useRpToast();

  const [input, setInput] = rpS('');
  const [platforms, setPlatforms] = rpS(['instagram-caption', 'tiktok-hook', 'story-frames']);
  const [outputs, setOutputs] = rpS({});
  const [loading, setLoading] = rpS(false);
  const [showBlocks, setShowBlocks] = rpS(false);
  const [showIdeas, setShowIdeas] = rpS(false);
  const [ideas, setIdeas] = rpS([]);
  const [ideasLoading, setIdeasLoading] = rpS(false);
  const [linkedProductId, setLinkedProductId] = rpS(null);
  const [variantCount, setVariantCount] = rpS(1);      // 1, 2, or 3 versions per platform
  const [activeVariant, setActiveVariant] = rpS({});   // per-platform active tab index
  // Per-platform slide counts for platforms with variableCount (e.g. IG carousel, story frames).
  const [counts, setCounts] = rpS(() => {
    const c = {};
    for (const [key, tmpl] of Object.entries(CONTENT_SEED.repurposeTemplates)) {
      if (tmpl.variableCount) c[key] = tmpl.defaultCount || 6;
    }
    return c;
  });

  const linkedProduct = state.products.find(p => p.id === linkedProductId) || null;

  // Restore draft (session-only, not persisted through dispatch — kept simple)
  rpE(() => {
    try {
      // A one-shot seed from other screens (e.g. Library "Rewrite here") takes priority
      // over the previous draft, then gets cleared so a refresh doesn't re-seed.
      const seedRaw = sessionStorage.getItem('wpr-repurpose-seed');
      if (seedRaw) {
        const seed = JSON.parse(seedRaw);
        if (seed.input) setInput(seed.input);
        if (seed.platforms) setPlatforms(seed.platforms);
        // Reset outputs so the old ones don't get confused with the new seed.
        setOutputs({});
        sessionStorage.removeItem('wpr-repurpose-seed');
        return;
      }
      const draft = JSON.parse(sessionStorage.getItem('wpr-repurpose-draft') || '{}');
      if (draft.input) setInput(draft.input);
      if (draft.platforms) setPlatforms(draft.platforms);
      if (draft.outputs) setOutputs(draft.outputs);
      if (draft.counts) setCounts(prev => ({ ...prev, ...draft.counts }));
      if (draft.linkedProductId) setLinkedProductId(draft.linkedProductId);
      if (draft.variantCount) setVariantCount(draft.variantCount);
      if (draft.activeVariant) setActiveVariant(draft.activeVariant);
    } catch {}
  }, []);
  rpE(() => {
    sessionStorage.setItem('wpr-repurpose-draft', JSON.stringify({
      input, platforms, outputs, counts, linkedProductId, variantCount, activeVariant,
    }));
  }, [input, platforms, outputs, counts, linkedProductId, variantCount, activeVariant]);

  const togglePlatform = (p) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // Helper: get the currently active variant text for a platform.
  // Outputs shape: outputs[platform] can be a string, '__LOADING__', or an array of strings.
  const getActive = (platform) => {
    const val = outputs[platform];
    if (val === undefined || val === '__LOADING__') return val;
    if (Array.isArray(val)) return val[activeVariant[platform] || 0] || val[0];
    return val;
  };

  const runRepurpose = async () => {
    if (!input.trim()) { toast('write your idea first'); return; }
    if (platforms.length === 0) { toast('pick at least one platform'); return; }
    setLoading(true);
    const skel = {};
    platforms.forEach(p => skel[p] = '__LOADING__');
    setOutputs(skel);
    try {
      // For variant count > 1, we call aiRepurposeAll multiple times in parallel.
      // Each returns a full map; we merge into arrays.
      const runs = [];
      for (let i = 0; i < variantCount; i++) {
        runs.push(aiRepurposeAll({
          brand: state.brand,
          vocab: state.vocab,
          input,
          platforms,
          counts,
          product: linkedProduct,
        }));
      }
      const allResults = await Promise.all(runs);
      const merged = {};
      for (const p of platforms) {
        const variants = allResults.map(r => r[p]).filter(v => v !== undefined && v !== null);
        // Store as string if just 1, array if more.
        merged[p] = variants.length === 1 ? variants[0] : variants;
      }
      setOutputs(merged);
      setActiveVariant({});  // reset all to variant 0
    } catch (e) {
      console.error(e);
      toast('generation failed — try again');
      setOutputs({});
    }
    setLoading(false);
  };

  // Regenerate replaces just the ACTIVE variant of a platform (or the single value if variantCount=1).
  const regenerateOne = async (platform) => {
    const currentIdx = activeVariant[platform] || 0;
    setOutputs(prev => {
      const val = prev[platform];
      if (Array.isArray(val)) {
        const next = [...val];
        next[currentIdx] = '__LOADING__';
        return { ...prev, [platform]: next };
      }
      return { ...prev, [platform]: '__LOADING__' };
    });
    try {
      const tmpl = CONTENT_SEED.repurposeTemplates[platform];
      const n = counts[platform] || tmpl.defaultCount;
      const hint = tmpl.variableCount && n ? tmpl.hint.replace(/\bN\b/, String(n)) : tmpl.hint;
      const text = await aiGenerate({
        brand: state.brand,
        vocab: state.vocab,
        task: `Write: ${tmpl.label}. Hint: ${hint}`,
        input,
        platform,
        product: linkedProduct,
      });
      setOutputs(prev => {
        const val = prev[platform];
        if (Array.isArray(val)) {
          const next = [...val];
          next[currentIdx] = text;
          return { ...prev, [platform]: next };
        }
        return { ...prev, [platform]: text };
      });
    } catch (e) {
      console.error(e);
      toast('regen failed');
      setOutputs(prev => { const n = { ...prev }; delete n[platform]; return n; });
    }
  };

  const saveAll = () => {
    if (Object.keys(outputs).length === 0) { toast('nothing to save yet'); return; }
    const entry = {
      id: 'r_' + Date.now(),
      sourceText: input,
      outputs: { ...outputs },
      ts: Date.now(),
    };
    dispatch({ type: 'save-repurpose', entry });
    toast('saved to history');
  };

  const insertBlock = (block) => {
    setInput(prev => (prev ? prev + '\n\n' : '') + block.content);
    setShowBlocks(false);
  };

  const loadIdeas = async () => {
    setShowIdeas(true);
    setIdeasLoading(true);
    try {
      // Pull recent subject lines from saved sessions so ideas stay fresh.
      const recentSubjects = (state.savedRepurpose || [])
        .slice(0, 6)
        .map(e => (e.sourceText || '').split('\n')[0].slice(0, 80));
      const list = await aiGenerateIdeas({
        brand: state.brand,
        vocab: state.vocab,
        products: state.products,
        recentSubjects,
      });
      setIdeas(list);
    } catch (e) {
      console.error(e);
      toast('couldn\'t load ideas — try again');
      setShowIdeas(false);
    }
    setIdeasLoading(false);
  };

  const useIdea = (idea) => {
    setInput(idea.seed || idea.title || '');
    setShowIdeas(false);
    toast('idea loaded');
  };

  const clearAll = () => {
    if (!input && Object.keys(outputs).length === 0) return;
    if (confirm('clear input and outputs?')) {
      setInput('');
      setOutputs({});
    }
  };

  const sendToCalendar = (platform) => {
    const text = getActive(platform);
    if (!text || text === '__LOADING__') return;
    // Default to tomorrow 9am so it doesn't collide with 'now'.
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    dispatch({
      type: 'add-calendar-entry',
      entry: { ts: d.getTime(), platform, text, productId: linkedProductId || undefined },
    });
    toast('added to calendar');
  };

  const sendToCarousel = (platform) => {
    const text = getActive(platform);
    if (!text || text === '__LOADING__') return;
    // Parse + decorate the text into slides — this is what the carousel maker actually reads.
    const parsed = parseCarouselText(text);
    const nextCarousel = { ...state.carousel, applyBrand: true };
    const decorated = decorateSlides(parsed.map(p => ({ ...p, kind: 'content' })), nextCarousel);
    dispatch({ type: 'update-carousel', patch: { applyBrand: true, slides: decorated, activeSlideIdx: 0 } });
    dispatch({ type: 'set-view', view: 'carousel' });
  };

  const copyOne = async (text) => {
    const ok = await copyText(text);
    toast(ok ? 'copied ✓' : 'copy failed');
  };

  return (
    <div style={{
      height: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--pink-100) 0%, #FBF5F9 400px)',
      overflow: 'hidden',
    }}>
      {Toast}

      {/* Top bar */}
      <div className="safe-top" style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,.7)',
        backdropFilter: 'blur(8px)', flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'set-view', view: 'home' })}
          style={{ padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}
          title="Back to studio home">
          <Icon name="arrow_left" size={16} /> <span className="desktop-only" style={{ fontSize: 13 }}>Home</span>
        </button>
        <div style={{ height: 20, width: 1, background: 'var(--line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--pink-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink-600)',
          }}>
            <Icon name="sparkles" size={16} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>Content Repurposer</div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>one idea → everywhere</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-tonal" onClick={() => dispatch({ type: 'set-view', view: 'history' })}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="history" size={14} /> <span className="desktop-only">History</span>
        </button>
      </div>

      {/* Body */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px', width: '100%', boxSizing: 'border-box' }}>

          {/* Hero */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Repurpose</div>
            <h1 style={{
              margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400,
              fontSize: 'clamp(30px, 5vw, 44px)', color: 'var(--ink)', lineHeight: 1.05,
            }}>
              One idea, <span style={{ fontStyle: 'italic', color: 'var(--pink-500)' }}>everywhere.</span>
            </h1>
            <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 15, maxWidth: 560, lineHeight: 1.5 }}>
              Type it once. We'll shape it for every platform in your voice.
            </p>
          </div>

          {/* Input card */}
          <div style={{
            background: 'white', border: '1px solid var(--line)', borderRadius: 20,
            padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)',
          }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Your idea, in your own words
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. new cotton woven print just dropped, poppy floral, only 8 available, made-to-order, ships in 2 weeks..."
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box', padding: 12,
                background: 'var(--pink-50)', border: '1px solid transparent',
                borderRadius: 12, fontSize: 14, color: 'var(--ink)', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--pink-300)'}
              onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={loadIdeas}
                style={{
                  padding: '6px 12px', fontSize: 12, borderRadius: 999,
                  background: 'var(--ink)', color: 'white', border: 'none', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                }}>
                <Icon name="sparkles" size={12} /> Give me ideas
              </button>
              <button className="btn btn-tonal" onClick={() => setShowBlocks(!showBlocks)}
                style={{ padding: '6px 12px', fontSize: 12, background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
                <Icon name="book" size={12} /> Pull from copy blocks
              </button>
              {(input || Object.keys(outputs).length > 0) && (
                <button className="btn-ghost" onClick={clearAll}
                  style={{ padding: '6px 12px', fontSize: 12, color: 'var(--ink-3)' }}>
                  <Icon name="close" size={12} /> Clear
                </button>
              )}
            </div>

            {showBlocks && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--pink-50)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, marginBottom: 8, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Tap a block to add it to your idea
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {state.copyBlocks.map(b => (
                    <button key={b.id} onClick={() => insertBlock(b)}
                      style={{
                        background: 'white', border: '1px solid var(--line)',
                        padding: '6px 10px', borderRadius: 999, fontSize: 12,
                        color: 'var(--ink-2)', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pink-300)'; e.currentTarget.style.background = 'var(--pink-50)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'white'; }}>
                      {b.title}
                    </button>
                  ))}
                  {state.copyBlocks.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No copy blocks yet — add them in Brand Kit.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Linked product + variants row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {/* Linked product */}
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Linked product <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· optional</span>
              </div>
              <div style={{
                background: 'white', border: '1px solid var(--line)', borderRadius: 10,
                padding: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
              }}>
                <button onClick={() => setLinkedProductId(null)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, fontSize: 12,
                    background: !linkedProductId ? 'var(--pink-100)' : 'transparent',
                    color: !linkedProductId ? 'var(--pink-600)' : 'var(--ink-3)',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}>None</button>
                {state.products.map(p => {
                  const active = p.id === linkedProductId;
                  return (
                    <button key={p.id} onClick={() => setLinkedProductId(p.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12,
                        background: active ? 'var(--pink-100)' : 'transparent',
                        color: active ? 'var(--pink-600)' : 'var(--ink-2)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                      title={`${p.absorbency} · $${p.price}`}>
                      <Icon name="package" size={11} /> {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Variants stepper */}
            <div style={{ flex: '0 0 auto', minWidth: 160 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Variants
              </div>
              <div style={{
                background: 'white', border: '1px solid var(--line)', borderRadius: 10,
                padding: 4, display: 'flex', alignItems: 'center', gap: 2,
              }}>
                {[1, 2, 3].map(n => {
                  const active = n === variantCount;
                  return (
                    <button key={n} onClick={() => setVariantCount(n)}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12,
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'white' : 'var(--ink-2)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                      }}
                      title={`${n} version${n !== 1 ? 's' : ''} per platform`}>
                      {n === 1 ? '1' : `${n} versions`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Make it for…
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(CONTENT_SEED.repurposeTemplates).map(([key, tmpl]) => {
                const active = platforms.includes(key);
                const hasStepper = tmpl.variableCount;
                const n = counts[key] || tmpl.defaultCount || 6;
                const bumpCount = (delta) => {
                  const clamped = Math.max(tmpl.minCount, Math.min(tmpl.maxCount, n + delta));
                  setCounts(prev => ({ ...prev, [key]: clamped }));
                };
                return (
                  <div key={key}
                    style={{
                      background: active ? 'var(--ink)' : 'white',
                      color: active ? 'white' : 'var(--ink-2)',
                      border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                      borderRadius: 999, fontSize: 13,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      transition: 'all .15s', overflow: 'hidden',
                    }}>
                    <button onClick={() => togglePlatform(key)}
                      style={{
                        background: 'transparent', color: 'inherit', border: 'none',
                        padding: hasStepper ? '8px 8px 8px 14px' : '8px 14px',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontFamily: 'inherit', fontSize: 13,
                      }}>
                      <Icon name={PLATFORM_ICON[key] || 'sparkles'} size={12} /> {tmpl.label}
                    </button>
                    {hasStepper && active && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 999, marginRight: 4, padding: '2px 2px',
                      }}>
                        <button onClick={() => bumpCount(-1)}
                          disabled={n <= tmpl.minCount}
                          title={`Fewer (min ${tmpl.minCount})`}
                          style={{
                            width: 22, height: 22, borderRadius: '50%', border: 'none',
                            background: 'transparent', color: 'inherit', cursor: n <= tmpl.minCount ? 'not-allowed' : 'pointer',
                            opacity: n <= tmpl.minCount ? 0.35 : 1,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, lineHeight: 1, fontFamily: 'inherit',
                          }}>−</button>
                        <span style={{
                          minWidth: 18, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600, fontSize: 12,
                        }}>{n}</span>
                        <button onClick={() => bumpCount(1)}
                          disabled={n >= tmpl.maxCount}
                          title={`More (max ${tmpl.maxCount})`}
                          style={{
                            width: 22, height: 22, borderRadius: '50%', border: 'none',
                            background: 'transparent', color: 'inherit', cursor: n >= tmpl.maxCount ? 'not-allowed' : 'pointer',
                            opacity: n >= tmpl.maxCount ? 0.35 : 1,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, lineHeight: 1, fontFamily: 'inherit',
                          }}>+</button>
                      </div>
                    )}
                    {hasStepper && !active && (
                      <span style={{
                        marginRight: 10, fontSize: 11, opacity: 0.6,
                        fontVariantNumeric: 'tabular-nums',
                      }}>· {n}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice style rules */}
          <VoiceRulesBar />

          {/* Generate button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button className="btn btn-primary"
              onClick={runRepurpose} disabled={loading}
              style={{
                flex: 1, padding: '14px 24px', fontSize: 15, borderRadius: 14,
                background: loading ? 'var(--pink-400)' : 'var(--ink)',
                color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                boxShadow: 'var(--shadow-md)',
              }}>
              {loading ? 'Writing…' : (<><Icon name="sparkles" size={16} /> Write it for me</>)}
            </button>
          </div>

          {/* Outputs */}
          {Object.keys(outputs).length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Your posts
                </div>
                <button onClick={saveAll} className="btn btn-tonal"
                  style={{ padding: '6px 12px', fontSize: 12 }}>
                  <Icon name="save" size={12} /> Save all
                </button>
              </div>
              {platforms.filter(p => outputs[p] !== undefined).map(p => {
                const tmpl = CONTENT_SEED.repurposeTemplates[p];
                const val = outputs[p];
                const variants = Array.isArray(val) ? val : [val];
                const activeIdx = activeVariant[p] || 0;
                const currentText = variants[activeIdx];
                const isLoading = currentText === '__LOADING__';
                return (
                  <RpOutputCard
                    key={p}
                    platformKey={p}
                    title={tmpl?.label || p}
                    text={currentText}
                    isLoading={isLoading}
                    variants={variants}
                    activeIdx={activeIdx}
                    onSwitchVariant={(i) => setActiveVariant(prev => ({ ...prev, [p]: i }))}
                    onCopy={() => copyOne(currentText)}
                    onRegen={() => regenerateOne(p)}
                    onEdit={(newText) => setOutputs(prev => {
                      const val = prev[p];
                      if (Array.isArray(val)) {
                        const next = [...val];
                        next[activeIdx] = newText;
                        return { ...prev, [p]: next };
                      }
                      return { ...prev, [p]: newText };
                    })}
                    onSendToCarousel={() => sendToCarousel(p)}
                    onSendToCalendar={() => sendToCalendar(p)}
                  />
                );
              })}
            </>
          )}

          {Object.keys(outputs).length === 0 && !loading && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)',
              color: 'var(--ink-3)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--pink-300)' }}>✿</div>
              <div style={{ fontSize: 14 }}>Your posts will bloom here.</div>
            </div>
          )}
        </div>
      </div>

      {/* Ideas modal */}
      {showIdeas && (
        <IdeasModal
          ideas={ideas}
          loading={ideasLoading}
          onClose={() => setShowIdeas(false)}
          onPick={useIdea}
          onRegen={loadIdeas}
        />
      )}
    </div>
  );
}

// ---- Ideas modal ----
const ANGLE_META = {
  spotlight:  { label: 'Product spotlight', icon: 'package', color: 'var(--pink-500)' },
  education:  { label: 'Educational',       icon: 'book',    color: '#8B7BB8' },
  faq:        { label: 'FAQ',                icon: 'chat',    color: '#5FA3B8' },
  seasonal:   { label: 'Seasonal',          icon: 'sun',     color: '#D9A46E' },
  personal:   { label: 'Personal',          icon: 'heart',   color: 'var(--pink-600)' },
  tip:        { label: 'Tip',               icon: 'sparkles', color: 'var(--ink-2)' },
};

function IdeasModal({ ideas, loading, onClose, onPick, onRegen }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42,31,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000, padding: 20, backdropFilter: 'blur(6px)',
      }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--cream)', borderRadius: 24, maxWidth: 720, width: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Ideas</div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)' }}>Pick one to start writing</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onRegen} disabled={loading} className="btn btn-tonal"
              style={{ padding: '6px 12px', fontSize: 12 }}>
              <Icon name="refresh" size={12} /> Refresh
            </button>
            <button onClick={onClose} className="icon-btn compact"
              style={{ color: 'var(--ink-3)' }}>
              <Icon name="close" size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} className="skel" style={{
                  height: 62, background: 'var(--pink-50)', borderRadius: 12,
                }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {ideas.map((idea, i) => {
                const meta = ANGLE_META[idea.angle] || ANGLE_META.tip;
                return (
                  <button key={i} onClick={() => onPick(idea)}
                    style={{
                      background: 'white', border: '1px solid var(--line)', borderRadius: 12,
                      padding: 14, textAlign: 'left', cursor: 'pointer',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      fontFamily: 'inherit', transition: 'all .12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pink-300)'; e.currentTarget.style.background = 'var(--pink-50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'white'; }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: 'var(--pink-50)', color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={meta.icon} size={14} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10, color: meta.color, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>
                        {idea.title}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                        {idea.seed}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RepurposeScreen, RpOutputCard, PLATFORM_ICON, IdeasModal });
