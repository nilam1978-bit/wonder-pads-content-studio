// Mobile screens for Wonder Pads Content Studio.
// Renders when useIsMobile() is true (< 640px viewport).
// All three surfaces (Home, Editor, Carousel Maker) get mobile-native layouts.

const { useState: mbS, useEffect: mbE, useRef: mbR, useMemo: mbM, useCallback: mbCB } = React;

// ==================== BOTTOM SHEET PRIMITIVE ====================
function BottomSheet({ open, onClose, title, height = '70vh', children, actionRight }) {
  const sheetRef = mbR(null);
  const [dragY, setDragY] = mbS(0);
  const [dragging, setDragging] = mbS(false);

  mbE(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const onHandleDown = (e) => {
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragging(true);
    const move = (ev) => {
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      setDragY(Math.max(0, y - startY));
    };
    const up = () => {
      setDragging(false);
      if (sheetRef.current) {
        const h = sheetRef.current.getBoundingClientRect().height;
        if (dragY > h * 0.28) onClose();
      }
      setDragY(0);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
  };

  if (!open) return null;

  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet safe-bottom" ref={sheetRef}
        onClick={e => e.stopPropagation()}
        style={{
          height,
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }}>
        <div className="sheet-handle"
          onPointerDown={onHandleDown}
          onTouchStart={onHandleDown}
          style={{ cursor: 'grab' }} />
        {(title || actionRight) && (
          <div style={{
            padding: '4px 20px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, fontWeight: 400 }}>
              {title}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {actionRight}
              <button className="icon-btn" onClick={onClose}>
                <Icon name="x" size={18} />
              </button>
            </div>
          </div>
        )}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ==================== MOBILE HOME ====================
function MobileHome() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = mbS('recent');
  const [menuOpen, setMenuOpen] = mbS(false);
  const [renameId, setRenameId] = mbS(null);
  const [renameValue, setRenameValue] = mbS('');
  const [saveTemplateFor, setSaveTemplateFor] = mbS(null);
  const [saveTemplateName, setSaveTemplateName] = mbS('');
  const importRef = mbR(null);
  const studioRestoreRef = mbR(null);

  const createBlank = () => {
    dispatch({ type: 'create-project', name: 'Untitled design', preset: SIZE_PRESETS[0] });
  };
  const openCarousel = () => {
    setMenuOpen(false);
    dispatch({ type: 'set-view', view: 'carousel' });
  };

  // Restore an ENTIRE studio backup — matches the desktop restore in editor-home.jsx.
  const onStudioRestore = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const restored = parseEditableProjectFile(ev.target.result);
        const projectCount = restored.projects?.length || 0;
        if (!confirm(
          `Restore ${projectCount} project${projectCount === 1 ? '' : 's'} + all brand data, saved backgrounds, arrangements, calendar and content history?\n\nThis replaces your current Studio data.`
        )) { e.target.value = ''; return; }
        dispatch({ type: 'load-state', state: { ...restored, past: [], future: [], selection: [], saveStatus: 'idle' } });
        alert('Studio backup restored successfully.');
      } catch (err) {
        alert('This is not a valid Wonder Pads Content Studio backup file.\n\n' + (err.message || ''));
      }
      e.target.value = '';
    };
    r.readAsText(f);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.__petal === 'project' && data.project) {
          const p = data.project;
          p.id = uid(); p.createdAt = now(); p.updatedAt = now();
          p.canvases = p.canvases.map(c => ({ ...c, id: uid(),
            elements: c.elements.map(el => ({ ...el, id: uid() })) }));
          p.activeCanvasId = p.canvases[0]?.id;
          dispatch({ type: 'create-project', project: p });
        } else alert("Not a Petal project file");
      } catch (err) { alert('Import failed: ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = mbM(() => {
    const q = state.search.trim().toLowerCase();
    if (!q) return state.projects;
    return state.projects.filter(p => p.name.toLowerCase().includes(q));
  }, [state.projects, state.search]);

  const handleAction = (project, action) => {
    if (action === 'rename') {
      setRenameId(project.id); setRenameValue(project.name);
    } else if (action === 'duplicate') {
      dispatch({ type: 'duplicate-project', id: project.id });
    } else if (action === 'delete') {
      if (confirm(`Delete "${project.name}"?`))
        dispatch({ type: 'delete-project', id: project.id });
    } else if (action === 'save-template') {
      setSaveTemplateFor(project); setSaveTemplateName(project.name + ' template');
    } else if (action === 'export') {
      exportProjectFile(project);
    }
  };

  const commitRename = () => {
    if (renameId && renameValue.trim())
      dispatch({ type: 'rename-project', id: renameId, name: renameValue.trim() });
    setRenameId(null);
  };
  const commitSaveTemplate = () => {
    if (!saveTemplateFor) return;
    const tpl = {
      id: uid(), name: saveTemplateName.trim() || (saveTemplateFor.name + ' template'),
      createdAt: now(), thumbnail: saveTemplateFor.thumbnail,
      canvases: JSON.parse(JSON.stringify(saveTemplateFor.canvases)),
    };
    dispatch({ type: 'load-state', state: { templates: [tpl, ...state.templates] } });
    setSaveTemplateFor(null);
  };

  return (
    <div style={{
      height: 'var(--studio-viewport-height, 100dvh)', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(180deg, var(--pink-200) 0%, var(--pink-100) 200px, #FBF5F9 500px)',
    }}>
      {/* Top bar */}
      <div className="safe-top" style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'white',
          boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0,
        }}>
          <img src="assets/wpr-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'DM Serif Display', fontSize: 16, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Wonder Pads
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.16em',
            textTransform: 'uppercase', marginTop: 1 }}>Content Studio</div>
        </div>
        <button className="icon-btn" onClick={() => setMenuOpen(true)}>
          <Icon name="more" size={20} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 12px',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
      }}>
        {[
          { id: 'recent', label: 'Recent', icon: 'templates' },
          { id: 'templates', label: 'Templates', icon: 'star' },
          { id: 'brand', label: 'Brand', icon: 'brand_kit' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 500,
              color: tab === t.id ? 'var(--pink-600)' : 'var(--ink-2)',
              borderBottom: tab === t.id ? '2px solid var(--pink-500)' : '2px solid transparent',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {tab === 'recent' && <MobileRecentTab
          projects={filtered}
          hasSearch={!!state.search}
          onSearchChange={v => dispatch({ type: 'set-search', search: v })}
          searchValue={state.search}
          onOpen={p => dispatch({ type: 'open-project', id: p.id })}
          onAction={handleAction}
          onCreate={createBlank}
          onOpenCarousel={openCarousel}
          onOpenRepurpose={() => dispatch({ type: 'set-view', view: 'repurpose' })}
          onOpenLaunch={() => dispatch({ type: 'set-view', view: 'launch' })}
          onOpenHistory={() => dispatch({ type: 'set-view', view: 'history' })}
          onOpenLibrary={() => {
            window.__wprOpenHistoryTab = 'library';
            dispatch({ type: 'set-view', view: 'history' });
          }}
          onOpenCalendar={() => dispatch({ type: 'set-view', view: 'calendar' })}
          savedRepurpose={state.savedRepurpose.length}
          savedLaunches={state.savedLaunches.length}
          calendarEntries={(state.calendar || []).length}
          totalDesigns={state.projects.length}
          totalTemplates={state.templates.length}
        />}
        {tab === 'templates' && <MobileTemplatesTab
          userTemplates={state.templates}
          onApplyUser={t => {
            const proj = {
              id: uid(), name: t.name,
              createdAt: now(), updatedAt: now(), thumbnail: t.thumbnail || null,
              canvases: t.canvases.map(c => ({ ...c, id: uid(),
                elements: c.elements.map(el => ({ ...el, id: uid() })) })),
            };
            proj.activeCanvasId = proj.canvases[0]?.id;
            dispatch({ type: 'create-project', project: proj });
          }}
          onDeleteUser={t => { if (confirm(`Delete template "${t.name}"?`))
            dispatch({ type: 'delete-template', id: t.id }); }}
          onApplyStarter={tpl => {
            const seed = tpl.els.map(e => ({ type: e.type, patch: e.patch }));
            const proj = newProject(tpl.name, tpl.preset, seed);
            proj.canvases[0].bg = { type: 'color', value: tpl.bg };
            proj.appliedStarter = tpl.name;
            dispatch({ type: 'create-project', project: proj });
          }}
          onApplyPreset={p => dispatch({ type: 'create-project', name: p.name, preset: p })}
        />}
        {tab === 'brand' && <MobileBrandTab />}
      </div>

      {/* Menu sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Actions" height="auto">
        <div style={{ display: 'grid', gap: 6, paddingBottom: 8 }}>
          <MobileMenuItem icon="plus" label="New design" desc="Blank canvas"
            onClick={() => { setMenuOpen(false); createBlank(); }} />
          <MobileMenuItem icon="carousel" label="Text to carousel" desc="Turn text into IG slides"
            highlight onClick={openCarousel} />

          {/* Section divider */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
            color: 'var(--ink-3)', padding: '10px 4px 4px',
          }}>Entire Studio</div>

          {/* Complete-state backup — matches the desktop backup format */}
          <MobileMenuItem icon="save" label="Backup entire Studio" desc="All projects + brand + backgrounds + calendar + content"
            onClick={() => { setMenuOpen(false); exportEditableProjectFile(state); }} />
          <MobileMenuItem icon="upload" label="Restore entire Studio" desc="Replace with a full Studio backup file"
            onClick={() => { setMenuOpen(false); studioRestoreRef.current?.click(); }} />

          {/* Section divider */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
            color: 'var(--ink-3)', padding: '10px 4px 4px',
          }}>Single project</div>

          <MobileMenuItem icon="upload" label="Import .petal.json (project only)" desc="Restores one design, keeps everything else"
            onClick={() => { setMenuOpen(false); importRef.current?.click(); }} />
        </div>
      </BottomSheet>
      <input type="file" ref={importRef} accept=".json,.petal.json,application/json"
        style={{ display: 'none' }} onChange={importFile} />
      {/* Entire-Studio restore — full state replace, matches the desktop restore flow */}
      <input type="file" ref={studioRestoreRef} accept=".json,application/json"
        style={{ display: 'none' }} onChange={onStudioRestore} />

      {/* Rename modal */}
      {renameId && (
        <div className="sheet-back" onClick={() => setRenameId(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ height: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '4px 20px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 20 }}>
                Rename design
              </h3>
              <input autoFocus className="text-input" value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); }}
                style={{ fontSize: 16, padding: 12 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setRenameId(null)}
                  style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button className="btn btn-primary" onClick={commitRename}
                  style={{ flex: 1, justifyContent: 'center' }}>Rename</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save-as-template modal */}
      {saveTemplateFor && (
        <div className="sheet-back" onClick={() => setSaveTemplateFor(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{ height: 'auto' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '4px 20px 20px' }}>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 20 }}>
                Save as template
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--ink-3)' }}>
                Reuse "{saveTemplateFor.name}" as a starting point.
              </p>
              <input autoFocus className="text-input" value={saveTemplateName}
                onChange={e => setSaveTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitSaveTemplate(); }}
                style={{ fontSize: 15, padding: 12 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setSaveTemplateFor(null)}
                  style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button className="btn btn-primary" onClick={commitSaveTemplate}
                  style={{ flex: 1, justifyContent: 'center' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenuItem({ icon, label, desc, onClick, highlight }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 14,
        borderRadius: 12, textAlign: 'left',
        background: highlight ? 'linear-gradient(120deg, #2A1F2A 0%, #C260A8 100%)' : 'var(--pink-50)',
        color: highlight ? 'white' : 'var(--ink)',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: highlight ? 'rgba(255,255,255,0.15)' : 'white',
        color: highlight ? 'white' : 'var(--pink-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{desc}</div>
      </div>
      <Icon name="chevron_r" size={14} style={{ opacity: 0.5 }} />
    </button>
  );
}

// ------------ Mobile Recent Tab ------------
function MobileRecentTab({ projects, hasSearch, onSearchChange, searchValue, onOpen, onAction,
  onCreate, onOpenCarousel, onOpenRepurpose, onOpenLaunch, onOpenHistory, onOpenLibrary, onOpenCalendar,
  savedRepurpose = 0, savedLaunches = 0, calendarEntries = 0, totalDesigns, totalTemplates }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '.14em',
          textTransform: 'uppercase', marginBottom: 4 }}>Welcome back</div>
        <h1 style={{ margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400,
          fontSize: 32, color: 'var(--ink)', lineHeight: 1.05 }}>
          Your studio, in bloom.
        </h1>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>
          <MobileStat value={totalDesigns} label={totalDesigns === 1 ? 'Design' : 'Designs'} />
          <MobileStat value={totalTemplates} label={totalTemplates === 1 ? 'Template' : 'Templates'} />
        </div>
      </div>

      {/* Mobile parity: This-week strip from desktop.
          Renders inline as a horizontally-scrolling row (its own component handles wrapping).
          Only appears when there are upcoming calendar entries. */}
      {window.ThisWeekStrip && (
        <div style={{ margin: '0 -16px 20px' }}>
          <window.ThisWeekStrip />
        </div>
      )}

      {/* Carousel CTA card */}
      <button onClick={onOpenCarousel} style={{
        width: '100%', textAlign: 'left', padding: 0, marginBottom: 20,
        background: 'transparent',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'linear-gradient(120deg, #2A1F2A 0%, #C260A8 100%)',
          color: 'white', borderRadius: 20, padding: '18px 20px',
          boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="carousel" size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase',
              opacity: 0.75, marginBottom: 2 }}>NEW · FOR INSTAGRAM</div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, lineHeight: 1.1 }}>Text to carousel</div>
          </div>
          <Icon name="chevron_r" size={18} style={{ opacity: 0.8 }} />
        </div>
      </button>

      {/* Content tools — Repurpose + Launch */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <button onClick={onOpenRepurpose} style={{
          background: 'white', border: '1px solid var(--line)', borderRadius: 16,
          padding: 14, textAlign: 'left', boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--pink-100)', color: 'var(--pink-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 15, color: 'var(--ink)', lineHeight: 1.15, marginBottom: 2 }}>
              Repurpose
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>
              One idea, everywhere
            </div>
          </div>
        </button>
        <button onClick={onOpenLaunch} style={{
          background: 'white', border: '1px solid var(--line)', borderRadius: 16,
          padding: 14, textAlign: 'left', boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--ink)', color: 'var(--pink-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="launch" size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 15, color: 'var(--ink)', lineHeight: 1.15, marginBottom: 2 }}>
              Launch pack
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>
              One product, 8 pieces
            </div>
          </div>
        </button>
      </div>

      <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          <button onClick={onOpenLibrary} style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--pink-50)', border: '1px solid var(--line)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <Icon name="book" size={13} style={{ color: 'var(--pink-600)' }} />
            <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>
              <b style={{ color: 'var(--ink)' }}>66</b> ready posts · library
            </span>
            <Icon name="chevron_r" size={12} style={{ color: 'var(--ink-3)' }} />
          </button>
          {(savedRepurpose + savedLaunches > 0) && (
            <button onClick={onOpenHistory} style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--pink-50)', border: '1px solid var(--line)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <Icon name="save" size={13} style={{ color: 'var(--pink-600)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>
                <b style={{ color: 'var(--ink)' }}>{savedRepurpose + savedLaunches}</b> saved · history
              </span>
              <Icon name="chevron_r" size={12} style={{ color: 'var(--ink-3)' }} />
            </button>
          )}
          {calendarEntries > 0 && (
            <button onClick={onOpenCalendar} style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--pink-50)', border: '1px solid var(--line)', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <Icon name="history" size={13} style={{ color: 'var(--pink-600)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>
                <b style={{ color: 'var(--ink)' }}>{calendarEntries}</b> queued · calendar
              </span>
              <Icon name="chevron_r" size={12} style={{ color: 'var(--ink-3)' }} />
            </button>
          )}
        </div>

      {/* New design CTA */}
      <button onClick={onCreate} style={{
        width: '100%', padding: '14px 16px', marginBottom: 20,
        background: 'var(--ink)', color: 'var(--cream)',
        borderRadius: 14, fontSize: 14, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Icon name="plus" size={16} /> New design
      </button>

      {/* Mobile parity: inline Brand kit summary card (same component as desktop).
          Padding is negative on the sides so the card can breathe to the phone edges. */}
      {window.BrandKitSection && (
        <div style={{ margin: '0 -16px 8px' }}>
          <window.BrandKitSection />
        </div>
      )}

      {/* Mobile parity: entire-Studio backup / restore card (same component as desktop). */}
      {window.BackupRestoreCard && (
        <div style={{ margin: '0 -16px 12px' }}>
          <window.BackupRestoreCard />
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Icon name="search" size={16} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--ink-3)', pointerEvents: 'none',
        }} />
        <input className="text-input" placeholder="Search your designs"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          style={{ paddingLeft: 40, padding: '12px 16px 12px 40px', background: 'white',
            boxShadow: 'var(--shadow-sm)', borderRadius: 999, fontSize: 14 }} />
      </div>

      {/* Recent designs */}
      <h2 style={{ margin: '4px 0 12px', fontFamily: 'DM Serif Display',
        fontWeight: 400, fontSize: 20 }}>
        {hasSearch ? `Search results (${projects.length})` : 'Recent designs'}
      </h2>

      {projects.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center', background: 'white',
          borderRadius: 20, border: '1px dashed var(--line-2)',
        }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 14px', borderRadius: 18,
            background: 'linear-gradient(135deg, var(--pink-100), var(--pink-200))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--pink-500)',
          }}>
            <Icon name={hasSearch ? 'search' : 'flower'} size={26} />
          </div>
          <div style={{ fontFamily: 'DM Serif Display', fontSize: 18, marginBottom: 4 }}>
            {hasSearch ? 'Nothing matches' : 'Fresh page'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {hasSearch ? 'Try a different search.' : 'Tap "New design" to begin.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {projects.slice().sort((a, b) => b.updatedAt - a.updatedAt).map(p => (
            <MobileProjectCard key={p.id} project={p}
              onOpen={() => onOpen(p)}
              onAction={a => onAction(p, a)} />
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

function MobileStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'DM Serif Display', fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em',
        textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function MobileProjectCard({ project, onOpen, onAction }) {
  const [menu, setMenu] = mbS(false);
  const first = project.canvases[0];
  const ratio = first ? first.w / first.h : 1;

  return (
    <>
      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        <button onClick={onOpen} style={{
          width: '100%', padding: 0, background: 'transparent', textAlign: 'left',
        }}>
          <div style={{
            aspectRatio: `${ratio}`, background: first?.bg?.value || '#FDFBFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid var(--line)',
          }}>
            {project.thumbnail
              ? <img src={project.thumbnail} draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <MiniPreview canvas={first} maxW={400} maxH={400} />
            }
            {project.canvases.length > 1 && (
              <div style={{
                position: 'absolute', bottom: 10, left: 10,
                background: 'rgba(42,31,42,0.85)', color: 'white',
                padding: '3px 8px', borderRadius: 999,
                fontSize: 10, fontWeight: 500,
                backdropFilter: 'blur(6px)',
              }}>{project.canvases.length} pages</div>
            )}
          </div>
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {project.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              {first?.w}×{first?.h} · edited {timeAgo(project.updatedAt)}
            </div>
          </div>
          <button className="icon-btn" onClick={() => setMenu(true)}>
            <Icon name="more" size={16} />
          </button>
        </div>
      </div>

      <BottomSheet open={menu} onClose={() => setMenu(false)}
        title={project.name} height="auto">
        <div style={{ display: 'grid', gap: 4, paddingBottom: 8 }}>
          <SheetAction icon="templates" label="Open"
            onClick={() => { setMenu(false); onOpen(); }} />
          <SheetAction icon="text" label="Rename"
            onClick={() => { setMenu(false); onAction('rename'); }} />
          <SheetAction icon="duplicate" label="Duplicate"
            onClick={() => { setMenu(false); onAction('duplicate'); }} />
          <SheetAction icon="save" label="Save as template"
            onClick={() => { setMenu(false); onAction('save-template'); }} />
          <SheetAction icon="upload" label="Export .petal.json"
            onClick={() => { setMenu(false); onAction('export'); }} />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <SheetAction icon="trash" label="Delete" danger
            onClick={() => { setMenu(false); onAction('delete'); }} />
        </div>
      </BottomSheet>
    </>
  );
}

function SheetAction({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 14,
      borderRadius: 12, textAlign: 'left',
      color: danger ? 'var(--pink-600)' : 'var(--ink)',
      background: 'transparent',
      transition: 'background .12s',
    }}
    onTouchStart={e => e.currentTarget.style.background = 'var(--pink-50)'}
    onTouchEnd={e => e.currentTarget.style.background = 'transparent'}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-50)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon name={icon} size={18} style={{ color: danger ? 'var(--pink-500)' : 'var(--ink-2)' }} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// ------------ Mobile Templates Tab ------------
function MobileTemplatesTab({ userTemplates, onApplyUser, onDeleteUser, onApplyStarter, onApplyPreset }) {
  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <h2 style={{ margin: '0 0 4px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>
        Start something new
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink-3)' }}>Pick a size and dive in</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        {SIZE_PRESETS.slice(0, 8).map(p => (
          <button key={p.id} onClick={() => onApplyPreset(p)}
            style={{
              padding: 12, borderRadius: 12,
              background: 'white', boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--line)', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
            <div style={{
              aspectRatio: '1.5', background: 'var(--pink-50)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--pink-200), var(--pink-300))',
                width: p.w > p.h ? '70%' : `${70 * (p.w / p.h)}%`,
                height: p.w > p.h ? `${70 * (p.h / p.w)}%` : '70%',
                borderRadius: 3, boxShadow: 'var(--shadow-sm)',
              }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1,
                fontVariantNumeric: 'tabular-nums' }}>{p.w} × {p.h}</div>
            </div>
          </button>
        ))}
      </div>

      {userTemplates.length > 0 && (
        <>
          <h2 style={{ margin: '0 0 4px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>
            My templates
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink-3)' }}>Your saved starting points</p>
          <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
            {userTemplates.map(t => (
              <MobileTemplateCard key={t.id} template={t} isCustom
                onApply={() => onApplyUser(t)}
                onDelete={() => onDeleteUser(t)} />
            ))}
          </div>
        </>
      )}

      <h2 style={{ margin: '0 0 4px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>
        Starter templates
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--ink-3)' }}>Curated for Wonder Pads</p>
      <div style={{ display: 'grid', gap: 14 }}>
        {STARTER_TEMPLATES.map((t, i) => {
          const canvas = { ...defaultCanvas(t.name, t.preset), bg: { type: 'color', value: t.bg },
            elements: t.els.map(e => newElement(e.type, e.patch)) };
          return (
            <MobileTemplateCard key={i} template={{ name: t.name, canvases: [canvas] }}
              onApply={() => onApplyStarter(t)} />
          );
        })}
      </div>
    </div>
  );
}

function MobileTemplateCard({ template, onApply, onDelete, isCustom }) {
  const first = template.canvases[0];
  const ratio = first ? first.w / first.h : 1;
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)',
      overflow: 'hidden',
    }}>
      <button onClick={onApply} style={{
        width: '100%', padding: 0, background: 'transparent',
      }}>
        <div style={{
          aspectRatio: `${ratio}`, background: first?.bg?.value || '#FDFBFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {template.thumbnail
            ? <img src={template.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <MiniPreview canvas={first} maxW={500} maxH={500} />}
        </div>
      </button>
      <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {isCustom ? `Saved ${timeAgo(template.createdAt)}` : `Starter · ${first?.w}×${first?.h}`}
          </div>
        </div>
        {isCustom && onDelete && (
          <button className="icon-btn" onClick={onDelete}>
            <Icon name="trash" size={14} />
          </button>
        )}
        <button className="icon-btn" onClick={onApply}
          style={{ background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}

// ------------ Mobile Brand Tab ------------
function MobileBrandTab() {
  const { state, dispatch } = useStore();
  const brand = state.brand;
  const fileRef = mbR(null);
  const update = (patch) => dispatch({ type: 'update-brand', patch });

  const handleLogoUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => update({ logo: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      {/* Logo card */}
      <h2 style={{ margin: '0 0 12px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>
        Brand kit
      </h2>
      <div style={{
        background: 'white', borderRadius: 16, padding: 18, marginBottom: 16,
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: 16, background: 'var(--pink-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {brand.logo
            ? <img src={brand.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <Icon name="images" size={30} style={{ color: 'var(--ink-3)' }} />}
        </div>
        <button className="btn btn-tonal" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={14} /> Change logo
        </button>
        <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
      </div>

      {/* Text fields */}
      <MobileField label="Shop name">
        <input className="text-input" value={brand.shopName}
          onChange={e => update({ shopName: e.target.value })}
          style={{ fontSize: 15, padding: 12 }} />
      </MobileField>

      <MobileField label="Tagline">
        <input className="text-input" value={brand.tagline}
          onChange={e => update({ tagline: e.target.value })}
          style={{ fontSize: 15, padding: 12 }} />
      </MobileField>

      <MobileField label="Heading font">
        <select className="pk-select" style={{ width: '100%', fontSize: 15, padding: '12px 30px 12px 14px',
          fontFamily: brand.fontHeading }}
          value={brand.fontHeading} onChange={e => update({ fontHeading: e.target.value })}>
          {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
        </select>
      </MobileField>

      <MobileField label="Body font">
        <select className="pk-select" style={{ width: '100%', fontSize: 15, padding: '12px 30px 12px 14px',
          fontFamily: brand.fontBody }}
          value={brand.fontBody} onChange={e => update({ fontBody: e.target.value })}>
          {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
        </select>
      </MobileField>

      {/* Handles */}
      <MobileField label="Social handles" action={
        <button className="btn btn-tonal" style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => dispatch({ type: 'add-brand-handle', handle: { platform: 'instagram', value: '' } })}>
          <Icon name="plus" size={12} /> Add
        </button>
      }>
        <div style={{ display: 'grid', gap: 8 }}>
          {brand.handles.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: 8 }}>No handles yet.</div>
          )}
          {brand.handles.map(h => (
            <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select className="pk-select" style={{ width: 110, padding: '10px 24px 10px 10px', fontSize: 12 }}
                value={h.platform}
                onChange={e => dispatch({ type: 'update-brand-handle', id: h.id, patch: { platform: e.target.value } })}>
                {HANDLE_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <input className="text-input" value={h.value} style={{ flex: 1, fontSize: 13 }}
                placeholder={platformById(h.platform).prefix + 'handle'}
                onChange={e => dispatch({ type: 'update-brand-handle', id: h.id, patch: { value: e.target.value } })} />
              <button className="icon-btn" onClick={() => dispatch({ type: 'remove-brand-handle', id: h.id })}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      </MobileField>

      {/* Colors */}
      <MobileField label="Brand colors" action={
        <button className="btn btn-tonal" style={{ padding: '6px 12px', fontSize: 12 }}
          onClick={() => dispatch({ type: 'add-brand-color', color: '#F1CFEA' })}>
          <Icon name="plus" size={12} /> Add
        </button>
      }>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {brand.colors.map((c, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <input type="color" value={c}
                onChange={e => {
                  const next = [...brand.colors]; next[i] = e.target.value;
                  update({ colors: next });
                }}
                style={{ width: 48, height: 48, borderRadius: 12 }} />
              <button onClick={() => dispatch({ type: 'remove-brand-color', index: i })}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--pink-600)', border: '1px solid var(--line)',
                }}>
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}
        </div>
      </MobileField>
    </div>
  );
}

function MobileField({ label, action, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
        letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <span>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, {
  BottomSheet, MobileHome, MobileMenuItem, MobileStat,
  MobileRecentTab, MobileTemplatesTab, MobileBrandTab,
  MobileProjectCard, MobileTemplateCard, MobileField, SheetAction,
});
