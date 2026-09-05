// History — browse saved Repurpose sessions + Launch packs.
const { useState: hxS, useMemo: hxM, useEffect: hxE } = React;

function HistoryToast() {
  const [msg, setMsg] = hxS(null);
  const show = (t) => { setMsg(t); setTimeout(() => setMsg(null), 1800); };
  const Toast = msg ? (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'white', padding: '10px 16px',
      borderRadius: 999, fontSize: 13, boxShadow: 'var(--shadow-lg)', zIndex: 10000,
    }}>{msg}</div>
  ) : null;
  return { show, Toast };
}

function fmtTs(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Today · ${time}`;
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + time;
}

function RepurposeHistoryCard({ entry, onCopy, onSendToCarousel, onDelete, onOpen, expanded }) {
  const platforms = Object.keys(entry.outputs || {});
  return (
    <div style={{
      background: 'white', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
            {fmtTs(entry.ts)} · {platforms.length} piece{platforms.length !== 1 ? 's' : ''}
          </div>
          <div style={{
            fontSize: 14, color: 'var(--ink)', lineHeight: 1.4,
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
          }}>{entry.sourceText}</div>
        </div>
        <button onClick={onDelete} className="icon-btn compact"
          title="Delete" style={{ flexShrink: 0, color: 'var(--ink-3)' }}>
          <Icon name="trash" size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: expanded ? 12 : 0 }}>
        {platforms.map(p => {
          const tmpl = CONTENT_SEED.repurposeTemplates[p];
          return (
            <button key={p} onClick={() => onOpen(p)}
              style={{
                background: expanded === p ? 'var(--ink)' : 'var(--pink-50)',
                color: expanded === p ? 'white' : 'var(--ink-2)',
                border: 'none', padding: '4px 10px', borderRadius: 999,
                fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: 'inherit',
              }}>
              <Icon name={PLATFORM_ICON[p] || 'sparkles'} size={10} /> {tmpl?.label || p}
            </button>
          );
        })}
      </div>
      {expanded && entry.outputs[expanded] && (
        <div style={{
          background: 'var(--pink-50)', borderRadius: 12, padding: 12, marginTop: 4,
        }}>
          <div style={{
            fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
            maxHeight: 240, overflow: 'auto',
          }}>{entry.outputs[expanded]}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onCopy(entry.outputs[expanded])} className="btn btn-tonal"
              style={{ padding: '5px 10px', fontSize: 11 }}>
              <Icon name="copy" size={11} /> Copy
            </button>
            {CONTENT_SEED.repurposeTemplates[expanded]?.bridge === 'carousel' && (
              <button onClick={() => onSendToCarousel(entry.outputs[expanded])} className="btn btn-tonal"
                style={{ padding: '5px 10px', fontSize: 11, background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
                <Icon name="carousel" size={11} /> To carousel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LaunchHistoryCard({ entry, onCopy, onSendToCarousel, onDelete, onOpen, expanded }) {
  const pieces = Object.keys(entry.outputs || {});
  return (
    <div style={{
      background: 'white', border: '1px solid var(--line)', borderRadius: 16,
      padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
            {fmtTs(entry.ts)} · launch pack
          </div>
          <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)', marginBottom: 2 }}>
            {entry.productName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>
            {entry.angle}{entry.heroFact ? ` · ${entry.heroFact}` : ''}
          </div>
        </div>
        <button onClick={onDelete} className="icon-btn compact"
          title="Delete" style={{ flexShrink: 0, color: 'var(--ink-3)' }}>
          <Icon name="trash" size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: expanded ? 12 : 0 }}>
        {pieces.map(p => {
          const piece = LAUNCH_PIECES.find(x => x.key === p);
          return (
            <button key={p} onClick={() => onOpen(p)}
              style={{
                background: expanded === p ? 'var(--ink)' : 'var(--pink-50)',
                color: expanded === p ? 'white' : 'var(--ink-2)',
                border: 'none', padding: '4px 10px', borderRadius: 999,
                fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: 'inherit',
              }}>
              <Icon name={piece?.icon || 'sparkles'} size={10} /> {piece?.label || p}
            </button>
          );
        })}
      </div>
      {expanded && entry.outputs[expanded] && (
        <div style={{
          background: 'var(--pink-50)', borderRadius: 12, padding: 12, marginTop: 4,
        }}>
          {(() => {
            const val = entry.outputs[expanded];
            const text = Array.isArray(val) ? val.map((t, i) => `${i + 1}. ${t}`).join('\n\n') : val;
            const rawText = Array.isArray(val) ? val.join('\n\n') : val;
            const piece = LAUNCH_PIECES.find(x => x.key === expanded);
            return (
              <>
                <div style={{
                  fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  maxHeight: 240, overflow: 'auto',
                }}>{text}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => onCopy(rawText)} className="btn btn-tonal"
                    style={{ padding: '5px 10px', fontSize: 11 }}>
                    <Icon name="copy" size={11} /> Copy
                  </button>
                  {piece?.bridge === 'carousel' && (
                    <button onClick={() => onSendToCarousel(rawText)} className="btn btn-tonal"
                      style={{ padding: '5px 10px', fontSize: 11, background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
                      <Icon name="carousel" size={11} /> To carousel
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function HistoryScreen() {
  const { state, dispatch } = useStore();
  const { show: toast, Toast } = HistoryToast();
  // Default to Library tab when the user has no saved sessions yet — the built-in pack is the star of the show.
  const [tab, setTab] = hxS(() => {
    if (window.__wprOpenHistoryTab === 'library') {
      window.__wprOpenHistoryTab = null;
      return 'library';
    }
    if (state.savedRepurpose.length === 0 && state.savedLaunches.length === 0) return 'library';
    return 'repurpose';
  });
  const [expandedById, setExpandedById] = hxS({});
  // Library filters
  const [libPart, setLibPart] = hxS('all');       // 'all' | month-1 | month-2 | bonus
  const [libFormat, setLibFormat] = hxS('all');
  const [libSearch, setLibSearch] = hxS('');
  const [libOpen, setLibOpen] = hxS(null);        // id of currently open library card
  const [libLoaded, setLibLoaded] = hxS(false);
  const [libEntries, setLibEntries] = hxS([]);

  // Lazy-load the built-in content pack on first Library open.
  hxE(() => {
    if (tab !== 'library' || libLoaded) return;
    fetch('content-pack.json')
      .then(r => r.json())
      .then(data => { setLibEntries(data); setLibLoaded(true); })
      .catch(e => { console.error('content-pack load failed', e); toast("couldn't load content pack"); setLibLoaded(true); });
  }, [tab, libLoaded]);

  const toggleOpen = (id, pieceKey) => {
    setExpandedById(prev => ({ ...prev, [id]: prev[id] === pieceKey ? null : pieceKey }));
  };

  const doCopy = async (text) => {
    const ok = await copyText(text);
    toast(ok ? 'copied ✓' : 'copy failed');
  };
  const doSendToCarousel = (text) => {
    // Parse + decorate the text into slides — this is what the carousel maker actually reads.
    const parsed = parseCarouselText(text);
    const nextCarousel = { ...state.carousel, applyBrand: true };
    const decorated = decorateSlides(parsed.map(p => ({ ...p, kind: 'content' })), nextCarousel);
    dispatch({ type: 'update-carousel', patch: { applyBrand: true, slides: decorated, activeSlideIdx: 0 } });
    dispatch({ type: 'set-view', view: 'carousel' });
  };

  const items = tab === 'repurpose' ? state.savedRepurpose : state.savedLaunches;

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
            <Icon name="history" size={16} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>History</div>
            <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>saved sessions + content library</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px', width: '100%', boxSizing: 'border-box' }}>

          {/* Tabs */}
          <div style={{
            display: 'inline-flex', background: 'white', padding: 4, borderRadius: 999,
            border: '1px solid var(--line)', marginBottom: 20, boxShadow: 'var(--shadow-sm)',
          }}>
            {[
              { id: 'repurpose', label: 'Repurpose', count: state.savedRepurpose.length, icon: 'sparkles' },
              { id: 'launch',    label: 'Launch',    count: state.savedLaunches.length,  icon: 'launch' },
              { id: 'library',   label: 'Library',   count: libLoaded ? libEntries.length : '·', icon: 'book' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? 'var(--ink)' : 'transparent',
                  color: tab === t.id ? 'white' : 'var(--ink-2)',
                  border: 'none', padding: '8px 16px', borderRadius: 999,
                  fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}>
                <Icon name={t.icon} size={12} /> {t.label}
                <span style={{
                  background: tab === t.id ? 'rgba(255,255,255,.2)' : 'var(--pink-100)',
                  color: tab === t.id ? 'white' : 'var(--pink-600)',
                  padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                }}>{t.count}</span>
              </button>
            ))}
          </div>

          {tab === 'library' ? (
            <LibraryPane
              entries={libEntries}
              loaded={libLoaded}
              part={libPart} setPart={setLibPart}
              format={libFormat} setFormat={setLibFormat}
              search={libSearch} setSearch={setLibSearch}
              open={libOpen} setOpen={setLibOpen}
              onCopy={doCopy}
              onSendToCarousel={doSendToCarousel}
              onSaveToRepurpose={(entry) => {
                // Turn a library entry into a savedRepurpose entry so it shows in "Repurpose" tab and can be edited.
                const outputs = {};
                if (entry.caption) outputs['instagram-caption'] = entry.caption;
                if (entry.slides && entry.slides.length) outputs['instagram-carousel'] = entry.slides.join('\n\n');
                if (entry.hashtags) outputs['hashtags'] = entry.hashtags;
                const savedEntry = {
                  id: 'r_' + Date.now(),
                  sourceText: entry.title,
                  outputs,
                  ts: Date.now(),
                  fromLibrary: entry.id,
                };
                dispatch({ type: 'save-repurpose', entry: savedEntry });
                toast('saved to your Repurpose history');
              }}
              onRewrite={(entry) => {
                // Seed the Repurpose screen with this post's caption + smart platform defaults,
                // then jump straight there. The Repurpose screen picks up the seed on mount.
                const seed = {
                  input: entry.caption || entry.title || '',
                  // Sensible starting mix based on the library entry's original format.
                  platforms: entry.slides && entry.slides.length
                    ? ['instagram-caption', 'instagram-carousel', 'tiktok-hook']
                    : ['instagram-caption', 'tiktok-hook', 'facebook-post'],
                };
                try { sessionStorage.setItem('wpr-repurpose-seed', JSON.stringify(seed)); } catch {}
                dispatch({ type: 'set-view', view: 'repurpose' });
              }}
            />
          ) : items.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)',
              color: 'var(--ink-3)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--pink-300)' }}>✿</div>
              <div style={{ fontSize: 14, marginBottom: 4, color: 'var(--ink-2)' }}>
                {tab === 'repurpose' ? 'No saved repurpose sessions yet' : 'No saved launch packs yet'}
              </div>
              <div style={{ fontSize: 13 }}>
                Save any generated copy from the {tab === 'repurpose' ? 'Repurpose' : 'Launch'} tool to see it here.
              </div>
              <button onClick={() => dispatch({ type: 'set-view', view: tab })}
                className="btn btn-primary"
                style={{ marginTop: 20, padding: '10px 20px', fontSize: 13, background: 'var(--ink)', color: 'white', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name={tab === 'repurpose' ? 'sparkles' : 'launch'} size={13} /> Open {tab === 'repurpose' ? 'Repurpose' : 'Launch'}
              </button>
            </div>
          ) : (
            <>
              {tab === 'repurpose' && state.savedRepurpose.map(entry => (
                <RepurposeHistoryCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedById[entry.id]}
                  onOpen={(p) => toggleOpen(entry.id, p)}
                  onCopy={doCopy}
                  onSendToCarousel={doSendToCarousel}
                  onDelete={() => {
                    if (confirm('Delete this saved session?')) dispatch({ type: 'remove-repurpose', id: entry.id });
                  }}
                />
              ))}
              {tab === 'launch' && state.savedLaunches.map(entry => (
                <LaunchHistoryCard
                  key={entry.id}
                  entry={entry}
                  expanded={expandedById[entry.id]}
                  onOpen={(p) => toggleOpen(entry.id, p)}
                  onCopy={doCopy}
                  onSendToCarousel={doSendToCarousel}
                  onDelete={() => {
                    if (confirm('Delete this saved launch pack?')) dispatch({ type: 'remove-launch', id: entry.id });
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Content Library — browsable pre-written content pack ----
function LibraryPane({ entries, loaded, part, setPart, format, setFormat, search, setSearch, open, setOpen, onCopy, onSendToCarousel, onSaveToRepurpose, onRewrite }) {
  // Format options extracted from the loaded entries so we don't hardcode a stale list.
  const formatOpts = hxM(() => {
    const s = new Set();
    for (const e of entries) if (e.format) s.add(e.format);
    return ['all', ...Array.from(s).sort()];
  }, [entries]);

  const partOpts = hxM(() => {
    const s = new Set();
    for (const e of entries) if (e.part) s.add(e.part);
    return [
      { id: 'all', label: 'All' },
      ...Array.from(s).map(p => ({
        id: p,
        // Short label so the pill isn't huge.
        label: p.startsWith('Month 1') ? 'Month 1' : p.startsWith('Month 2') ? 'Month 2 · SG' : p.startsWith('Bonus') ? 'Bonus' : p,
      })),
    ];
  }, [entries]);

  const filtered = hxM(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (part !== 'all' && e.part !== part) return false;
      if (format !== 'all' && e.format !== format) return false;
      if (q) {
        const hay = (e.title + ' ' + (e.caption || '') + ' ' + (e.audience || '') + ' ' + (e.hashtags || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, part, format, search]);

  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)', fontSize: 13 }}>
        Loading content pack…
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: 'white', borderRadius: 20, border: '1px dashed var(--line-2)',
        color: 'var(--ink-3)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--pink-300)' }}>✿</div>
        <div style={{ fontSize: 14 }}>Content pack didn't load. Refresh the page and try again.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{
        background: 'white', border: '1px solid var(--line)', borderRadius: 16,
        padding: 14, marginBottom: 16,
      }}>
        {/* Part filter */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {partOpts.map(p => {
            const active = p.id === part;
            return (
              <button key={p.id} onClick={() => setPart(p.id)}
                style={{
                  background: active ? 'var(--ink)' : 'var(--pink-50)',
                  color: active ? 'white' : 'var(--ink-2)',
                  border: 'none', padding: '5px 12px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>{p.label}</button>
            );
          })}
        </div>

        {/* Search + format */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search caption, title, hashtag…"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 30px',
                background: 'var(--pink-50)', border: '1px solid transparent',
                borderRadius: 10, fontSize: 12, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--pink-300)'}
              onBlur={e => e.currentTarget.style.borderColor = 'transparent'} />
          </div>
          <select value={format} onChange={e => setFormat(e.target.value)}
            style={{
              background: 'var(--pink-50)', border: '1px solid transparent',
              borderRadius: 10, padding: '8px 10px', fontSize: 12, color: 'var(--ink)',
              fontFamily: 'inherit', cursor: 'pointer', minWidth: 120,
            }}>
            {formatOpts.map(f => (
              <option key={f} value={f}>{f === 'all' ? 'Any format' : f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600,
      }}>
        <span>{filtered.length} of {entries.length} posts</span>
        {(part !== 'all' || format !== 'all' || search) && (
          <button onClick={() => { setPart('all'); setFormat('all'); setSearch(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--pink-500)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', fontWeight: 600 }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)', fontSize: 13 }}>
          No posts match your filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(e => (
            <LibraryCard key={e.id} entry={e}
              expanded={open === e.id}
              onToggle={() => setOpen(open === e.id ? null : e.id)}
              onCopy={onCopy}
              onSendToCarousel={onSendToCarousel}
              onSaveToRepurpose={() => onSaveToRepurpose(e)}
              onRewrite={() => onRewrite(e)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({ entry, expanded, onToggle, onCopy, onSendToCarousel, onSaveToRepurpose, onRewrite }) {
  const formatColor = {
    'Carousel': 'var(--pink-500)',
    'Reel': '#8B7BB8',
    'Single image': 'var(--ink-2)',
    'Infographic': '#5FA3B8',
    'Q&A graphic': '#5FA3B8',
    'Quote / community post': 'var(--pink-600)',
    'Before / after carousel': 'var(--pink-500)',
    'Myth-bust carousel': 'var(--pink-500)',
    'Tips carousel': 'var(--pink-500)',
    'Tips list': 'var(--ink-2)',
    'Q&A stories series / saved post': '#5FA3B8',
    'Single image quote': 'var(--pink-600)',
  }[entry.format] || 'var(--ink-3)';

  const badge = entry.kind === 'Bonus' ? '★ Bonus' : `${entry.kind} ${entry.num}`;

  return (
    <div style={{
      background: 'white', border: `1px solid ${expanded ? 'var(--pink-300)' : 'var(--line)'}`,
      borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      transition: 'border-color .12s',
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', padding: 14, background: 'transparent',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
        <div style={{
          flexShrink: 0, minWidth: 54, textAlign: 'center',
          fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700,
          color: 'var(--pink-600)', background: 'var(--pink-50)',
          padding: '6px 8px', borderRadius: 8,
        }}>
          {badge}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'DM Serif Display', fontSize: 15, color: 'var(--ink)',
            lineHeight: 1.25, marginBottom: 6,
          }}>{entry.title}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              color: formatColor,
            }}>{entry.format}</span>
            {entry.audience && (
              <>
                <span style={{ color: 'var(--line-2)', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{entry.audience}</span>
              </>
            )}
            {entry.slides && (
              <>
                <span style={{ color: 'var(--line-2)', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{entry.slides.length} slides</span>
              </>
            )}
          </div>
        </div>
        <Icon name="chevron_d" size={14} style={{
          color: 'var(--ink-3)', flexShrink: 0, marginTop: 4,
          transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
        }} />
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--line)' }}>
          {/* Caption */}
          {entry.caption && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Caption</div>
              <div style={{
                fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                background: 'var(--pink-50)', padding: 12, borderRadius: 10,
              }}>{entry.caption}</div>
            </div>
          )}

          {/* Slides */}
          {entry.slides && entry.slides.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
                Slide-by-slide ({entry.slides.length})
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {entry.slides.map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--pink-50)', padding: 10, borderRadius: 10,
                    fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                    borderLeft: '3px solid var(--pink-300)',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--pink-600)', marginBottom: 4 }}>SLIDE {i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual brief */}
          {entry.visualBrief && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Visual brief</div>
              <div style={{
                fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontStyle: 'italic',
              }}>{entry.visualBrief}</div>
            </div>
          )}

          {/* CTA */}
          {entry.cta && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Call to action</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{entry.cta}</div>
            </div>
          )}

          {/* Hashtags */}
          {entry.hashtags && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Hashtags</div>
              <div style={{ fontSize: 12, color: 'var(--pink-600)', lineHeight: 1.5, wordBreak: 'break-word' }}>{entry.hashtags}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {entry.caption && (
              <button onClick={() => onCopy(entry.caption)} className="btn btn-tonal"
                style={{ padding: '6px 12px', fontSize: 11 }}>
                <Icon name="copy" size={11} /> Copy caption
              </button>
            )}
            {entry.caption && onRewrite && (
              <button onClick={onRewrite}
                style={{
                  padding: '6px 12px', fontSize: 11, fontFamily: 'inherit',
                  background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 999,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <Icon name="sparkles" size={11} /> Rewrite in Repurpose
              </button>
            )}
            {entry.slides && entry.slides.length > 0 && (
              <button onClick={() => onSendToCarousel(entry.slides.join('\n\n'))} className="btn btn-tonal"
                style={{ padding: '6px 12px', fontSize: 11, background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
                <Icon name="carousel" size={11} /> To carousel maker
              </button>
            )}
            {entry.hashtags && (
              <button onClick={() => onCopy(entry.hashtags)} className="btn btn-tonal"
                style={{ padding: '6px 12px', fontSize: 11 }}>
                <Icon name="copy" size={11} /> Copy tags
              </button>
            )}
            <button onClick={onSaveToRepurpose} className="btn btn-tonal"
              style={{ padding: '6px 12px', fontSize: 11 }}>
              <Icon name="save" size={11} /> Save to my library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HistoryScreen, LibraryPane, LibraryCard });
