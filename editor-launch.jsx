// Launch Pack — pick a product + angle, get 8 pieces of copy in your voice.
const { useState: lpS, useEffect: lpE, useRef: lpR } = React;

const LAUNCH_PIECES = [
  { key: 'announcement',       label: 'Announcement',       icon: 'sparkles', hint: 'the "it\'s happening" moment' },
  { key: 'instagram_caption',  label: 'Instagram caption',  icon: 'instagram', hint: 'warm, chatty' },
  { key: 'carousel',           label: 'Instagram carousel', icon: 'carousel', hint: '6 slides', bridge: 'carousel' },
  { key: 'tiktok_hook',        label: 'TikTok hook',        icon: 'tiktok', hint: 'one killer line' },
  { key: 'tiktok_script',      label: 'TikTok script',      icon: 'tiktok', hint: '30–45 sec spoken' },
  { key: 'facebook_post',      label: 'Facebook post',      icon: 'facebook', hint: 'longer, storytelling' },
  { key: 'story_frames',       label: 'Story frames',       icon: 'story', hint: '4 tap-through frames', bridge: 'carousel' },
  { key: 'website_blurb',      label: 'Website blurb',      icon: 'website', hint: 'shop page intro' },
];

function LpToast() {
  // handled by useRpToast in repurpose file — replicate inline for isolation
  const [msg, setMsg] = lpS(null);
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

function LaunchPieceCard({ pieceKey, label, icon, text, isLoading, isArray, onCopy, onRegen, onSendToCarousel, onSendToCalendar, bridge }) {
  const [expanded, setExpanded] = lpS(false);
  const displayText = isArray && Array.isArray(text) ? text.map((t, i) => `${i + 1}. ${t}`).join('\n\n') : text;
  const trimmed = !expanded && displayText && displayText.length > 240;
  const shown = trimmed ? displayText.slice(0, 240) + '…' : displayText;

  return (
    <div style={{
      background: 'white', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'var(--pink-50)', color: 'var(--pink-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name={icon} size={14} />
          </div>
          <div style={{
            fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{label}</div>
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
            <button className="icon-btn compact" title="Regenerate" onClick={onRegen}>
              <Icon name="refresh" size={14} />
            </button>
            <button className="icon-btn compact" title="Copy" onClick={onCopy}>
              <Icon name="copy" size={14} />
            </button>
          </div>
        )}
      </div>
      {isLoading ? (
        <div>
          <div style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, marginBottom: 6, width: '90%' }} />
          <div style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, marginBottom: 6, width: '70%' }} />
          <div style={{ height: 10, background: 'var(--pink-50)', borderRadius: 4, width: '80%' }} />
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
          }}>{shown}</div>
          {trimmed && (
            <button onClick={() => setExpanded(true)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--pink-500)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
              Show more
            </button>
          )}
          {expanded && displayText && displayText.length > 240 && (
            <button onClick={() => setExpanded(false)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--pink-500)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
              Show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

function LaunchScreen() {
  const { state, dispatch } = useStore();
  const { show: toast, Toast } = LpToast();

  const [productId, setProductId] = lpS(() => state.products[0]?.id || '');
  const [angle, setAngle] = lpS(() => state.launchAngles[0] || 'brand new product launch');
  const [heroFact, setHeroFact] = lpS('');
  const [carouselCount, setCarouselCount] = lpS(6);
  const [storyCount, setStoryCount] = lpS(4);
  const [outputs, setOutputs] = lpS(null);
  const [loading, setLoading] = lpS(false);

  const product = state.products.find(p => p.id === productId) || state.products[0];

  const runLaunch = async () => {
    if (!product) { toast('add a product first'); return; }
    setLoading(true);
    // skeleton
    const skel = {};
    LAUNCH_PIECES.forEach(p => { skel[p.key] = '__LOADING__'; });
    setOutputs(skel);
    try {
      const results = await aiLaunchPack({
        brand: state.brand,
        vocab: state.vocab,
        product,
        angle,
        heroFact,
        carouselCount,
        storyCount,
      });
      setOutputs(results);
    } catch (e) {
      console.error(e);
      toast('generation failed — try again');
      setOutputs(null);
    }
    setLoading(false);
  };

  const regenerateOne = async (pieceKey) => {
    if (!product || !outputs) return;
    setOutputs(prev => ({ ...prev, [pieceKey]: '__LOADING__' }));
    try {
      // Re-run full pack + swap the one piece (cheaper: just aiGenerate for text pieces)
      const piece = LAUNCH_PIECES.find(p => p.key === pieceKey);
      const isArray = pieceKey === 'carousel' || pieceKey === 'story_frames';
      const results = await aiLaunchPack({
        brand: state.brand,
        vocab: state.vocab,
        product,
        angle,
        heroFact,
        carouselCount,
        storyCount,
      });
      setOutputs(prev => ({ ...prev, [pieceKey]: results[pieceKey] }));
    } catch (e) {
      console.error(e);
      toast('regen failed');
      setOutputs(prev => { const n = { ...prev }; delete n[pieceKey]; return n; });
    }
  };

  const copyPiece = async (pieceKey) => {
    const val = outputs[pieceKey];
    const text = Array.isArray(val) ? val.join('\n\n') : val;
    const ok = await copyText(text);
    toast(ok ? 'copied ✓' : 'copy failed');
  };

  const sendToCarousel = (pieceKey) => {
    const val = outputs[pieceKey];
    const text = Array.isArray(val) ? val.join('\n\n') : val;
    // Parse + decorate the text into slides — this is what the carousel maker actually reads.
    const parsed = parseCarouselText(text);
    const nextCarousel = { ...state.carousel, applyBrand: true };
    const decorated = decorateSlides(parsed.map(p => ({ ...p, kind: 'content' })), nextCarousel);
    dispatch({ type: 'update-carousel', patch: { applyBrand: true, slides: decorated, activeSlideIdx: 0 } });
    dispatch({ type: 'set-view', view: 'carousel' });
  };

  const sendToCalendar = (pieceKey) => {
    const val = outputs[pieceKey];
    if (!val || val === '__LOADING__') return;
    const text = Array.isArray(val) ? val.join('\n\n') : val;
    // Default to tomorrow 9am.
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    dispatch({
      type: 'add-calendar-entry',
      entry: { ts: d.getTime(), platform: pieceKey, text, productId: product?.id },
    });
    toast('added to calendar');
  };

  const saveAll = () => {
    if (!outputs) { toast('nothing to save yet'); return; }
    const entry = {
      id: 'l_' + Date.now(),
      productId: product?.id,
      productName: product?.name,
      angle,
      heroFact,
      outputs: { ...outputs },
      ts: Date.now(),
    };
    dispatch({ type: 'save-launch', entry });
    toast('saved to history');
  };

  return (
    <div style={{
      height: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--pink-100) 0%, #FBF5F9 400px)', overflow: 'hidden',
    }}>
      {Toast}

      {/* Top bar */}
      <div className="safe-top" style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,.7)',
        backdropFilter: 'blur(8px)', flexShrink: 0,
      }}>
        <button className="btn-ghost" onClick={() => dispatch({ type: 'set-view', view: 'home' })}
          style={{ padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
          <Icon name="arrow_left" size={16} /> <span className="desktop-only" style={{ fontSize: 13 }}>Home</span>
        </button>
        <div style={{ height: 20, width: 1, background: 'var(--line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: 'var(--pink-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink-600)',
          }}>
            <Icon name="launch" size={16} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>Launch Pack</div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>one product → full bundle</div>
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
            <div style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Launch</div>
            <h1 style={{
              margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400,
              fontSize: 'clamp(30px, 5vw, 44px)', color: 'var(--ink)', lineHeight: 1.05,
            }}>
              Pick a product. <span style={{ fontStyle: 'italic', color: 'var(--pink-500)' }}>Get the whole pack.</span>
            </h1>
            <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 15, maxWidth: 560, lineHeight: 1.5 }}>
              8 pieces of copy in your voice — announcement, IG caption, carousel, TikTok, Facebook, story frames + more.
            </p>
          </div>

          {/* Setup card */}
          <div style={{
            background: 'white', border: '1px solid var(--line)', borderRadius: 20,
            padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-sm)',
          }}>
            {/* Product picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Product
              </label>
              {state.products.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                  {state.products.map(p => {
                    const active = p.id === productId;
                    return (
                      <button key={p.id} onClick={() => setProductId(p.id)}
                        style={{
                          textAlign: 'left', padding: 12, borderRadius: 12,
                          background: active ? 'var(--pink-100)' : 'var(--pink-50)',
                          border: `1px solid ${active ? 'var(--pink-400)' : 'transparent'}`,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          {p.absorbency} · ${p.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: 12, background: 'var(--pink-50)', borderRadius: 10 }}>
                  No products yet — add some in Brand Kit → Products.
                </div>
              )}
            </div>

            {/* Angle picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Angle
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {state.launchAngles.map(a => {
                  const active = a === angle;
                  return (
                    <button key={a} onClick={() => setAngle(a)}
                      style={{
                        background: active ? 'var(--ink)' : 'white',
                        color: active ? 'white' : 'var(--ink-2)',
                        border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                        padding: '6px 12px', borderRadius: 999, fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero fact */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Hero fact <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>(optional — the "lead with this" thing)</span>
              </label>
              <input
                type="text" value={heroFact} onChange={e => setHeroFact(e.target.value)}
                placeholder="e.g. only 8 available, poppy floral print, ships in 2 weeks"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: 12,
                  background: 'var(--pink-50)', border: '1px solid transparent',
                  borderRadius: 12, fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--pink-300)'}
                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
              />
            </div>

            {/* Slide counts */}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LaunchCountStepper
                label="Carousel slides"
                icon="carousel"
                value={carouselCount}
                min={3} max={10}
                onChange={setCarouselCount}
              />
              <LaunchCountStepper
                label="Story frames"
                icon="story"
                value={storyCount}
                min={3} max={8}
                onChange={setStoryCount}
              />
            </div>
          </div>

          {/* Voice style rules */}
          <VoiceRulesBar />

          {/* Generate */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button onClick={runLaunch} disabled={loading || !product}
              style={{
                flex: 1, padding: '14px 24px', fontSize: 15, borderRadius: 14,
                background: loading ? 'var(--pink-400)' : 'var(--ink)',
                color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: (loading || !product) ? 'wait' : 'pointer', opacity: (loading || !product) ? 0.7 : 1,
                boxShadow: 'var(--shadow-md)', border: 'none', fontFamily: 'inherit',
              }}>
              {loading ? 'Building your pack…' : (<><Icon name="launch" size={16} /> Build launch pack</>)}
            </button>
          </div>

          {/* Outputs */}
          {outputs && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Launch pack for {product?.name}
                </div>
                <button onClick={saveAll} className="btn btn-tonal"
                  style={{ padding: '6px 12px', fontSize: 12 }}>
                  <Icon name="save" size={12} /> Save all
                </button>
              </div>
              {LAUNCH_PIECES.map(piece => {
                const val = outputs[piece.key];
                const isArr = piece.key === 'carousel' || piece.key === 'story_frames';
                return (
                  <LaunchPieceCard
                    key={piece.key}
                    pieceKey={piece.key}
                    label={piece.label}
                    icon={piece.icon}
                    text={val}
                    isArray={isArr}
                    isLoading={val === '__LOADING__'}
                    bridge={piece.bridge}
                    onCopy={() => copyPiece(piece.key)}
                    onRegen={() => regenerateOne(piece.key)}
                    onSendToCarousel={() => sendToCarousel(piece.key)}
                    onSendToCalendar={() => sendToCalendar(piece.key)}
                  />
                );
              })}
            </>
          )}

          {!outputs && !loading && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)',
              color: 'var(--ink-3)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8, color: 'var(--pink-300)' }}>✿</div>
              <div style={{ fontSize: 14 }}>Your launch pack will appear here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact stepper — "− N +" — matches the pill aesthetic of the platform-count controls.
function LaunchCountStepper({ label, icon, value, min, max, onChange }) {
  const bump = (d) => onChange(Math.max(min, Math.min(max, value + d)));
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', background: 'var(--pink-50)', borderRadius: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pink-500)', flexShrink: 0,
      }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          background: 'white', borderRadius: 999, padding: 2,
          border: '1px solid var(--line)',
        }}>
          <button onClick={() => bump(-1)} disabled={value <= min}
            style={{
              width: 26, height: 26, borderRadius: '50%', border: 'none',
              background: 'transparent', color: 'var(--ink-2)',
              cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.3 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
            }}>−</button>
          <span style={{
            minWidth: 22, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
            fontWeight: 600, fontSize: 13, color: 'var(--ink)',
          }}>{value}</span>
          <button onClick={() => bump(1)} disabled={value >= max}
            style={{
              width: 26, height: 26, borderRadius: '50%', border: 'none',
              background: 'transparent', color: 'var(--ink-2)',
              cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.3 : 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
            }}>+</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LaunchScreen, LaunchPieceCard, LAUNCH_PIECES, LaunchCountStepper });
