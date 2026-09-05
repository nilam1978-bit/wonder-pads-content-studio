// Main app — routing between Home and Editor, top bar w/ auto-save & rename, keyboard shortcuts
const { useEffect: mE, useState: mS, useRef: mR } = React;

// ---------- Menu primitive ----------
function Menu({ label, children, minWidth = 220 }) {
  const [open, setOpen] = mS(false);
  const btnRef = mR(null);
  const menuRef = mR(null);
  mE(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onEsc);
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onEsc); };
  }, [open]);
  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} className="btn-ghost"
        style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13,
          background: open ? 'var(--pink-100)' : 'transparent',
          color: open ? 'var(--ink)' : 'var(--ink-2)' }}>
        {label}
      </button>
      {open && (
        <div ref={menuRef}
          onClick={(e) => { if (e.target.closest('[data-menu-item]')) setTimeout(() => setOpen(false), 0); }}
          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth,
            background: 'white', borderRadius: 12, padding: 6,
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)', zIndex: 1000 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, shortcut, onClick, disabled, danger }) {
  return (
    <button data-menu-item onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 8,
        fontSize: 13, textAlign: 'left',
        color: disabled ? 'var(--ink-3)' : (danger ? 'var(--pink-600)' : 'var(--ink)'),
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .1s' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--pink-50)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', color: 'var(--ink-2)' }}>
        {icon && <Icon name={icon} size={14} />}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{shortcut}</span>}
    </button>
  );
}
function MenuDivider() { return <div style={{ height: 1, background: 'var(--line)', margin: '4px 2px' }} />; }
function MenuLabel({ children }) {
  return <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '.08em', padding: '8px 10px 4px' }}>{children}</div>;
}

// ---------- Auto-save indicator ----------
function SaveIndicator() {
  const { state } = useStore();
  const [tick, setTick] = mS(0);
  mE(() => {
    const t = setInterval(() => setTick(x => x + 1), 15000);
    return () => clearInterval(t);
  }, []);
  const text = state.saveStatus === 'saving' ? 'Saving…'
    : state.savedAt ? `Saved · ${timeAgo(state.savedAt)}`
    : 'All changes local';
  const dot = state.saveStatus === 'saving' ? 'var(--pink-400)' : '#6EBB8F';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, color: 'var(--ink-3)',
      padding: '4px 10px', borderRadius: 999,
      background: 'var(--pink-50)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot,
        boxShadow: state.saveStatus === 'saving' ? `0 0 0 4px ${dot}22` : 'none',
        transition: 'all .3s' }} />
      <span key={tick}>{text}</span>
    </div>
  );
}

// ---------- Top bar ----------
function TopBar() {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);
  const canvas = activeCanvas(state);
  const [renaming, setRenaming] = mS(false);
  const [renameVal, setRenameVal] = mS('');
  const [downloadOpen, setDownloadOpen] = mS(false);
  const [exporting, setExporting] = mS(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = mS(false);
  const [saveTemplateName, setSaveTemplateName] = mS('');
  const downloadRef = mR(null);
  const downloadBtnRef = mR(null);
  const importRef = mR(null);

  mE(() => { setRenameVal(proj?.name || ''); }, [proj?.id, proj?.name]);

  mE(() => {
    if (!downloadOpen) return;
    const onDown = (e) => {
      if (!downloadRef.current) return;
      if (downloadRef.current.contains(e.target) || downloadBtnRef.current?.contains(e.target)) return;
      setDownloadOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [downloadOpen]);

  const zoomIn  = () => dispatch({ type: 'set-zoom', zoom: clamp(state.zoom * 1.2, 0.05, 4) });
  const zoomOut = () => dispatch({ type: 'set-zoom', zoom: clamp(state.zoom / 1.2, 0.05, 4) });
  const zoomFit = () => {
    if (!canvas) return;
    const availW = window.innerWidth - 84 - 90 - 320 - 300 - 40;
    const availH = window.innerHeight - 60 - 40;
    const z = Math.min(availW / canvas.w, availH / canvas.h);
    dispatch({ type: 'set-zoom', zoom: clamp(z, 0.05, 4) });
  };

  const doExport = async (format, scope = 'all') => {
    setDownloadOpen(false);
    setExporting(true);
    try {
      const cs = scope === 'current' ? [canvas] : proj.canvases;
      const base = (proj.name || 'design').replace(/[^\w-]/g, '_');
      await exportCanvases(cs, format, base);
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally { setExporting(false); }
  };

  const commitRename = () => {
    if (renameVal.trim()) dispatch({ type: 'rename-project', id: proj.id, name: renameVal.trim() });
    setRenaming(false);
  };

  const saveAsTemplate = () => {
    setSaveTemplateOpen(true);
    setSaveTemplateName((proj.name || 'design') + ' template');
  };
  const commitSaveTemplate = () => {
    dispatch({ type: 'save-template', name: saveTemplateName.trim() });
    setSaveTemplateOpen(false);
  };

  const importPetalFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.__petal === 'project' && data.project) {
          const p = data.project;
          p.id = uid();
          p.createdAt = now(); p.updatedAt = now();
          p.canvases = p.canvases.map(c => ({ ...c, id: uid(), elements: c.elements.map(el => ({ ...el, id: uid() })) }));
          p.activeCanvasId = p.canvases[0]?.id;
          dispatch({ type: 'create-project', project: p });
        } else alert('Not a Petal project file');
      } catch (err) { alert('Import failed: ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!proj || !canvas) return null;

  return (
    <div style={{
      height: 60, background: 'white', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
      flexShrink: 0, zIndex: 100, position: 'relative',
    }}>
      {/* Home / brand */}
      <button onClick={() => dispatch({ type: 'close-project' })}
        className="btn-ghost" style={{
          display: 'flex', alignItems: 'center', gap: 10, minWidth: 172,
          padding: '6px 10px 6px 6px', borderRadius: 10,
        }}
        title="Back to studio home">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'white', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', border: '1px solid var(--line)',
        }}>
          <img src="assets/wpr-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
          <span style={{ fontFamily: 'DM Serif Display', fontSize: 15, color: 'var(--ink)' }}>Wonder Pads</span>
          <span style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>Content Studio</span>
        </div>
      </button>

      {/* Menus */}
      <div style={{ display: 'flex', gap: 2 }}>
        <Menu label="File">
          <MenuItem icon="templates" label="Back to home" onClick={() => dispatch({ type: 'close-project' })} />
          <MenuItem icon="plus" label="New design" onClick={() => { dispatch({ type: 'close-project' }); }} />
          <MenuItem icon="duplicate" label="Duplicate design" onClick={() => dispatch({ type: 'duplicate-project', id: proj.id })} />
          <MenuItem icon="save" label="Save as template" shortcut="⌘⇧T" onClick={saveAsTemplate} />
          <MenuDivider />
          <MenuLabel>Pages</MenuLabel>
          <MenuItem icon="plus" label="New page" onClick={() => dispatch({ type: 'add-canvas' })} />
          <MenuItem icon="duplicate" label="Duplicate page" onClick={() => dispatch({ type: 'duplicate-canvas', id: canvas.id })} />
          <MenuDivider />
          <MenuLabel>Download</MenuLabel>
          <MenuItem icon="image_export" label="Export as PNG" onClick={() => doExport('png')} />
          <MenuItem icon="image_export" label="Export as JPEG" onClick={() => doExport('jpg')} />
          <MenuItem icon="pdf" label="Export as PDF (vector)" onClick={() => doExport('pdf')} />
          <MenuItem icon="svg_icon" label="Export as SVG" onClick={() => doExport('svg')} />
          <MenuDivider />
          <MenuItem icon="upload" label="Export .petal.json" onClick={() => exportProjectFile(proj)} />
          <MenuItem icon="upload" label="Import .petal.json" onClick={() => importRef.current?.click()} />
          <input type="file" ref={importRef} accept=".json,.petal.json,application/json" style={{ display: 'none' }} onChange={importPetalFile} />
        </Menu>

        <Menu label="Edit">
          <MenuItem icon="undo" label="Undo" shortcut="⌘Z"
            disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })} />
          <MenuItem icon="redo" label="Redo" shortcut="⌘⇧Z"
            disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })} />
          <MenuDivider />
          <MenuItem icon="copy" label="Copy" shortcut="⌘C" disabled={!state.selection.length}
            onClick={() => { const els = canvas.elements.filter(el => state.selection.includes(el.id));
              window.__petalClipboard = JSON.parse(JSON.stringify(els)); }} />
          <MenuItem icon="paste" label="Paste" shortcut="⌘V" disabled={!window.__petalClipboard?.length}
            onClick={() => { const dupes = (window.__petalClipboard || []).map(el => ({ ...el, id: uid(), x: el.x + 20, y: el.y + 20 }));
              dupes.forEach(el => dispatch({ type: 'add-element', element: el })); }} />
          <MenuItem icon="duplicate" label="Duplicate" shortcut="⌘D" disabled={!state.selection.length}
            onClick={() => dispatch({ type: 'duplicate-elements', ids: state.selection })} />
          <MenuItem icon="trash" label="Delete" shortcut="⌫" disabled={!state.selection.length}
            onClick={() => dispatch({ type: 'delete-elements', ids: state.selection })} danger />
          <MenuDivider />
          <MenuItem icon="select_all" label="Select all" shortcut="⌘A"
            onClick={() => dispatch({ type: 'set-selection', ids: canvas.elements.map(e => e.id) })} />
          <MenuItem icon="clear" label="Clear canvas"
            onClick={() => { if (confirm('Remove all elements from this page?'))
              dispatch({ type: 'update-canvas', id: canvas.id, patch: { elements: [] } }); }} danger />
        </Menu>

        <Menu label="View">
          <MenuItem icon="zoom_in" label="Zoom in" shortcut="⌘+" onClick={zoomIn} />
          <MenuItem icon="zoom_out" label="Zoom out" shortcut="⌘−" onClick={zoomOut} />
          <MenuItem icon="fit" label="Fit to screen" onClick={zoomFit} />
          <MenuDivider />
          <MenuItem icon="fit" label="Zoom to 50%" onClick={() => dispatch({ type: 'set-zoom', zoom: 0.5 })} />
          <MenuItem icon="fit" label="Zoom to 100%" onClick={() => dispatch({ type: 'set-zoom', zoom: 1 })} />
          <MenuItem icon="fit" label="Zoom to 200%" onClick={() => dispatch({ type: 'set-zoom', zoom: 2 })} />
        </Menu>

        <Menu label="Insert" minWidth={220}>
          <MenuLabel>Elements</MenuLabel>
          <MenuItem icon="text" label="Text" onClick={() => {
            dispatch({ type: 'set-tool', tool: 'text' });
            dispatch({ type: 'add-element', element: newElement('text', {
              x: canvas.w / 2 - 300, y: canvas.h / 2 - 60, w: 600, h: 120,
            }) });
          }} />
          <MenuItem icon="square" label="Rectangle" onClick={() => dispatch({ type: 'add-element', element:
            newElement('rect', { x: canvas.w / 2 - 150, y: canvas.h / 2 - 150, w: 300, h: 300 }) }) } />
          <MenuItem icon="circle" label="Circle" onClick={() => dispatch({ type: 'add-element', element:
            newElement('circle', { x: canvas.w / 2 - 150, y: canvas.h / 2 - 150, w: 300, h: 300 }) }) } />
          <MenuItem icon="line" label="Line" onClick={() => dispatch({ type: 'add-element', element:
            newElement('line', { x: canvas.w / 2 - 150, y: canvas.h / 2 - 10, w: 300, h: 20 }) }) } />
          <MenuItem icon="star" label="Star" onClick={() => dispatch({ type: 'add-element', element:
            newElement('star', { x: canvas.w / 2 - 150, y: canvas.h / 2 - 150, w: 300, h: 300 }) }) } />
          <MenuDivider />
          <MenuItem icon="images" label="Image (upload)" onClick={() => dispatch({ type: 'set-tool', tool: 'images' })} />
          <MenuItem icon="icons" label="Icon / sticker" onClick={() => dispatch({ type: 'set-tool', tool: 'icons' })} />
          <MenuItem icon="frames" label="Frame" onClick={() => dispatch({ type: 'set-tool', tool: 'frames' })} />
        </Menu>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--line)' }} />

      <div style={{ display: 'flex', gap: 2 }}>
        <button className="icon-btn tt" data-tt="Undo (⌘Z)"
          disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })}>
          <Icon name="undo" size={18} />
        </button>
        <button className="icon-btn tt" data-tt="Redo (⌘⇧Z)"
          disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })}>
          <Icon name="redo" size={18} />
        </button>
      </div>

      {/* Design name (editable) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {renaming ? (
          <input autoFocus className="text-input"
            style={{ maxWidth: 320, textAlign: 'center', fontSize: 14 }}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setRenameVal(proj.name); setRenaming(false); } }}
          />
        ) : (
          <button onClick={() => setRenaming(true)} className="btn-ghost"
            style={{ padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{proj.name}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>· {canvas.w}×{canvas.h}</span>
          </button>
        )}
        <SaveIndicator />
      </div>

      {/* Zoom cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--pink-50)', borderRadius: 10, padding: 3 }}>
        <button className="icon-btn tt" data-tt="Zoom out" onClick={zoomOut}><Icon name="zoom_out" size={16} /></button>
        <button className="btn-ghost" onClick={zoomFit} style={{ padding: '4px 10px', fontSize: 12, minWidth: 56, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(state.zoom * 100)}%
        </button>
        <button className="icon-btn tt" data-tt="Zoom in" onClick={zoomIn}><Icon name="zoom_in" size={16} /></button>
        <button className="icon-btn tt" data-tt="Fit" onClick={zoomFit}><Icon name="fit" size={16} /></button>
      </div>

      {/* Download */}
      <div style={{ position: 'relative' }}>
        <button ref={downloadBtnRef} className="btn btn-primary"
          onClick={() => setDownloadOpen(o => !o)} disabled={exporting}
          style={{ paddingRight: 10 }}>
          {exporting ? 'Exporting…' : 'Download'}
          <Icon name="chevron_dn" size={14} />
        </button>
        {downloadOpen && (
          <div ref={downloadRef}
            style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 280,
              background: 'white', borderRadius: 14, padding: 8,
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)', zIndex: 1000 }}>
            <MenuLabel>File type</MenuLabel>
            <ExportOption title="PNG image" desc="High-res raster, transparent bg" icon="image_export" onClick={() => doExport('png')} />
            <ExportOption title="JPEG image" desc="Smaller file, opaque background" icon="image_export" onClick={() => doExport('jpg')} />
            <ExportOption title="PDF (vector)" desc="Print-ready, all pages" icon="pdf" onClick={() => doExport('pdf')} recommended />
            <ExportOption title="SVG (vector)" desc="Editable in other apps" icon="svg_icon" onClick={() => doExport('svg')} />
            <MenuDivider />
            <MenuLabel>Scope</MenuLabel>
            <div style={{ padding: '4px 10px 8px', fontSize: 11, color: 'var(--ink-3)' }}>
              Exports all {proj.canvases.length} page{proj.canvases.length === 1 ? '' : 's'} by default.
            </div>
            <button data-menu-item onClick={() => doExport('png', 'current')}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12,
                textAlign: 'left', color: 'var(--ink-2)', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Export current page only (PNG)
            </button>
          </div>
        )}
      </div>

      {/* Save-as-template modal */}
      {saveTemplateOpen && (
        <div className="modal-back" onClick={() => setSaveTemplateOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>Save as template</h3>
            <p style={{ margin: '0 0 14px', color: 'var(--ink-3)', fontSize: 12 }}>
              Save this design so you can start new projects from it.
            </p>
            <input autoFocus className="text-input" value={saveTemplateName}
              onChange={e => setSaveTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitSaveTemplate(); if (e.key === 'Escape') setSaveTemplateOpen(false); }}
              style={{ fontSize: 15, padding: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSaveTemplateOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={commitSaveTemplate}>Save template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportOption({ title, desc, icon, onClick, recommended }) {
  return (
    <button data-menu-item onClick={onClick}
      style={{ display: 'flex', width: '100%', padding: 10, borderRadius: 10,
        alignItems: 'center', gap: 12, textAlign: 'left', transition: 'background .1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-50)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--pink-100)',
        color: 'var(--pink-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{title}</span>
          {recommended && (<span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em',
            background: 'var(--pink-200)', color: 'var(--pink-600)', padding: '2px 6px', borderRadius: 4 }}>Recommended</span>)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  );
}

// ---------- Editor screen ----------
function EditorScreen() {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);

  // Regenerate thumbnail when the project's element data changes.
  // Depend on a serialized signature of just the first canvas so this doesn't
  // re-fire on unrelated state updates (like our own thumbnail update).
  const thumbSig = proj ? sigForThumb(proj.canvases[0]) : '';
  mE(() => {
    if (!proj) return;
    const t = setTimeout(async () => {
      try {
        const p = activeProject(state);
        const c = p?.canvases[0];
        if (!c) return;
        const svg = canvasToSVG(c);
        const blob = await rasterizeSVG(svg, c.w, c.h, 'image/jpeg', 0.72, 0.4);
        if (!blob) return;
        const url = await blobToDataURL(blob);
        dispatch({ type: 'update-project-thumbnail', id: p.id, thumbnail: url });
      } catch (e) { /* ignore thumbnail errors */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [thumbSig, proj?.id]);

  // Keyboard
  mE(() => {
    const onKey = (e) => {
      if (isTypingInInput(e)) return;
      const meta = e.metaKey || e.ctrlKey;
      const canvas = activeCanvas(state);
      if (!canvas) return;
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'undo' }); return; }
      if (meta && (e.key === 'y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); dispatch({ type: 'redo' }); return; }
      if (meta && e.key === 'd' && state.selection.length) { e.preventDefault(); dispatch({ type: 'duplicate-elements', ids: state.selection }); return; }
      if (meta && e.key === 'a') { e.preventDefault(); dispatch({ type: 'set-selection', ids: canvas.elements.map(el => el.id) }); return; }
      if (meta && e.key === 'c' && state.selection.length) {
        const els = canvas.elements.filter(el => state.selection.includes(el.id));
        window.__petalClipboard = JSON.parse(JSON.stringify(els)); return;
      }
      if (meta && e.key === 'v' && window.__petalClipboard) {
        const dupes = window.__petalClipboard.map(el => ({ ...el, id: uid(), x: el.x + 20, y: el.y + 20 }));
        dupes.forEach(el => dispatch({ type: 'add-element', element: el })); return;
      }
      if (state.selection.length && (e.key === ']' || e.key === '[')) {
        e.preventDefault();
        const id = state.selection[0];
        const idx = canvas.elements.findIndex(el => el.id === id);
        if (idx < 0) return;
        const to = e.key === ']'
          ? (meta ? canvas.elements.length - 1 : Math.min(idx + 1, canvas.elements.length - 1))
          : (meta ? 0 : Math.max(idx - 1, 0));
        dispatch({ type: 'reorder-element', id, to }); return;
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && state.selection.length) {
        e.preventDefault(); dispatch({ type: 'delete-elements', ids: state.selection }); return;
      }
      if (e.key === 'Escape') { dispatch({ type: 'set-selection', ids: [] }); return; }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && state.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        canvas.elements.filter(el => state.selection.includes(el.id)).forEach(el => {
          dispatch({ type: 'update-element', id: el.id, patch: { x: el.x + dx, y: el.y + dy } });
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, dispatch]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftRail />
        <PagesList />
        <LeftPanel />
        <CanvasArea />
        <RightPanel />
      </div>
    </div>
  );
}

// A stable string signature of a canvas's user-visible content (for thumbnail effect dep).
function sigForThumb(canvas) {
  if (!canvas) return '';
  try {
    return canvas.w + 'x' + canvas.h + '|' + JSON.stringify(canvas.bg) + '|' +
      canvas.elements.map(e => e.id + ':' + Math.round(e.x) + ',' + Math.round(e.y) + ',' +
        Math.round(e.w) + ',' + Math.round(e.h) + ',' + Math.round(e.rot||0) + ',' +
        (e.text||'') + ',' + (e.fill||'') + ',' + (e.color||'')).join('|');
  } catch { return ''; }
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// ---------- App root ----------
function App() {
  const { state } = useStore();
  const isMobile = useIsMobile();
  const inEditor = !!state.activeProjectId && !!activeProject(state);
  if (inEditor) return isMobile ? <MobileEditor /> : <EditorScreen />;
  if (state.view === 'carousel') return isMobile ? <MobileCarouselMaker /> : <CarouselMakerScreen />;
  if (state.view === 'repurpose') return <RepurposeScreen />;
  if (state.view === 'launch') return <LaunchScreen />;
  if (state.view === 'history') return <HistoryScreen />;
  if (state.view === 'calendar') return <CalendarScreen />;
  return isMobile ? <MobileHome /> : <HomeScreen />;
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('App crash:', err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: 'white', color: '#900', height: '100vh', overflow: 'auto' }}>
          <h2 style={{ fontFamily: 'DM Serif Display', color: '#2A1F2A' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.err?.stack || this.state.err)}</pre>
          <button style={{ marginTop: 20, padding: '10px 16px', background: '#2A1F2A', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            onClick={() => { this.setState({ err: null }); }}>
            Try again
          </button>
          <button style={{ marginLeft: 8, padding: '10px 16px', background: '#F1CFEA', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            onClick={() => { localStorage.removeItem('wpr-studio-v1'); location.reload(); }}>
            Reset storage & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StoreProvider>
      <App />
    </StoreProvider>
  </ErrorBoundary>
);

Object.assign(window, { Menu, MenuItem, MenuDivider, MenuLabel, SaveIndicator, blobToDataURL });
