// Mobile editor screen — canvas fills viewport, tools open as bottom sheets,
// selection triggers a compact properties bar at the bottom.

const { useState: meS, useEffect: meE, useRef: meR, useMemo: meM } = React;

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

function MobileEditor({ progressNav }) {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);
  const canvas = activeCanvas(state);

  const [openSheet, setOpenSheet] = meS(null); // 'templates'|'brand'|'text'|'shapes'|'images'|'icons'|'frames'|'bg'|'more'|'pages'|'layers'|'properties'|'menu'|'download'|'rename'|'add'
  // The "tool tray" is the live-editing strip that sits under the slide (words, font, size, colour, format, move...).
  // Unlike a pop-up sheet it never covers or blurs the slide, so you see every change as you make it.
  const [tray, setTray] = meS(null);
  const [longPressMenu, setLongPressMenu] = meS(false);
  // Typing happens directly on the slide ("inline"). The slide is zoomed to the text while the keyboard is up.
  const [editingId, setEditingId] = meS(null);
  const beginEdit = (id) => {
    const go = () => setEditingId(id);
    try { ReactDOM.flushSync(go); } catch { go(); }
    const node = document.querySelector(`[data-text-content-id="${id}"]`);
    if (node) {
      try { node.focus({ preventScroll: true }); } catch { node.focus(); }
      try { const r = document.createRange(); r.selectNodeContents(node); r.collapse(false); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch {}
    }
  };
  // Hides the slide-count row above the editor while typing (see .wpr-typing in the studio styles).
  meE(() => { document.body.classList.toggle('wpr-typing', !!editingId); return () => document.body.classList.remove('wpr-typing'); }, [editingId]);
  const endEdit = () => { try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch {} setEditingId(null); };

  const primaryEl = canvas ? canvas.elements.find(e => e.id === state.selection[0]) : null;
  // Stop typing if the selection moves to something else.
  meE(() => { if (editingId && (!primaryEl || primaryEl.id !== editingId)) endEdit(); }, [primaryEl?.id, editingId]);

  // Close the tray when nothing is selected, or when the chosen tool does not suit the newly selected item.
  meE(() => {
    if (!tray) return;
    if (!primaryEl || !trayToolsFor(primaryEl).includes(tray)) setTray(null);
  }, [primaryEl?.id, primaryEl?.type]);

  // Regenerate thumbnail
  const thumbSig = proj ? sigForThumb(proj.canvases[0]) : '';
  meE(() => {
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
      } catch (e) { /* ignore */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [thumbSig, proj?.id]);

  if (!proj || !canvas) return null;

  const openTool = (tool) => {
    dispatch({ type: 'set-tool', tool });
    setOpenSheet(tool);
  };

  const closeSheet = () => setOpenSheet(null);
  const pickTool = (tool) => setTray(t => (t === tool ? null : tool));

  return (
    <div style={{
      height: 'var(--studio-viewport-height, 100dvh)', width: '100%', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'var(--pink-100)',
    }}>
      {/* Top bar */}
      <MobileEditorTopBar proj={proj} canvas={canvas} compact={!!editingId}
        onBack={() => dispatch({ type: 'close-project' })}
        onMenu={() => setOpenSheet('menu')}
        onLayers={() => setOpenSheet('layers')}
        onRename={() => setOpenSheet('rename')}
        onDownload={() => setOpenSheet('download')}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
      />
      {!editingId && progressNav}

      {/* Canvas area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MobileCanvasArea onLongPress={() => setLongPressMenu(true)}
          editingId={editingId} setEditingId={setEditingId}
          onEditWords={(id) => beginEdit(id)} />
        {/* Undo / redo float in the empty space beside the slide while typing (replaces the old top stripe). */}
        {editingId && (() => {
          const fb = (enabled) => ({ width: 36, height: 36, borderRadius: '50%', border: 0, padding: 0, display: 'grid', placeItems: 'center',
            background: 'rgba(255,255,255,.92)', color: 'var(--ink)', boxShadow: '0 1px 6px rgba(80,30,70,.18)', opacity: enabled ? 1 : 0.4 });
          return (
            <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button aria-label="Undo" disabled={state.past.length === 0} style={fb(state.past.length > 0)}
                onClick={() => dispatch({ type: 'undo' })}><Icon name="undo" size={18} /></button>
              <button aria-label="Redo" disabled={state.future.length === 0} style={fb(state.future.length > 0)}
                onClick={() => dispatch({ type: 'redo' })}><Icon name="redo" size={18} /></button>
            </div>
          );
        })()}
        {/* Subtle slide switcher, like Canva: arrows at the edges and a small "1 / 5" pill that opens all slides. */}
        {!editingId && proj.canvases.length > 1 && (() => {
          const idx = Math.max(0, proj.canvases.findIndex(c => c.id === canvas.id)), n = proj.canvases.length;
          const goTo = (i) => dispatch({ type: 'set-active-canvas', id: proj.canvases[Math.max(0, Math.min(n - 1, i))].id });
          const arrow = (dir, disabled) => (
            <button aria-label={dir < 0 ? 'Previous slide' : 'Next slide'} disabled={disabled} onClick={() => goTo(idx + dir)}
              style={{ position: 'absolute', top: '50%', [dir < 0 ? 'left' : 'right']: 4, transform: 'translateY(-50%)', width: 34, height: 52,
                borderRadius: 17, border: 0, background: 'rgba(255,255,255,.72)', color: 'var(--ink-2)', boxShadow: '0 1px 6px rgba(80,30,70,.16)',
                opacity: disabled ? 0 : 1, pointerEvents: disabled ? 'none' : 'auto', zIndex: 5, display: 'grid', placeItems: 'center' }}>
              <Icon name="chevron_r" size={18} style={dir < 0 ? { transform: 'rotate(180deg)' } : undefined} />
            </button>
          );
          return <>
            {arrow(-1, idx === 0)}{arrow(1, idx === n - 1)}
            <button aria-label="All slides" onClick={() => setOpenSheet('pages')}
              style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 5, border: 0, borderRadius: 999,
                background: 'rgba(255,255,255,.9)', boxShadow: '0 1px 6px rgba(80,30,70,.16)', padding: '6px 14px', fontSize: 12, fontWeight: 600,
                color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {n}</button>
          </>;
        })()}
      </div>

      {/* Slide thumbnails belong beneath the canvas in the simple workflow.
          They step aside while a tool tray is open so the slide stays big. */}

      {/* Live tool tray */}
      {primaryEl && tray && (
        <MobileToolTray el={primaryEl} tool={tray} setTool={setTray} onClose={() => setTray(null)} />
      )}

      {/* Selection toolbar */}
      {primaryEl && primaryEl.type === 'text' && editingId === primaryEl.id && !openSheet && !tray && (
        <MobileTextEditBar el={primaryEl} dispatch={dispatch}
          onDone={endEdit}
          onTool={(t) => { endEdit(); setTray(t); }} />
      )}
      {primaryEl && !openSheet && !tray && !editingId && (
        <MobileSelectionBar el={primaryEl} activeTool={tray}
          onAdd={() => setOpenSheet('add')}
          onTool={(t) => (t === 'words' && primaryEl.type === 'text' ? beginEdit(primaryEl.id) : pickTool(t))}
          onAdjust={() => setOpenSheet('properties')}
          locked={!!primaryEl.locked}
          onAction={(kind) => {
            const id = primaryEl.id;
            if (kind === 'duplicate') dispatch({ type: 'duplicate-elements', ids: [id] });
            else if (kind === 'front') dispatch({ type: 'reorder-element', id, to: canvas.elements.length - 1 });
            else if (kind === 'back') dispatch({ type: 'reorder-element', id, to: 0 });
            else if (kind === 'lock') dispatch({ type: 'update-element', id, patch: { locked: !primaryEl.locked } });
            else if (kind === 'hide') { dispatch({ type: 'update-element', id, patch: { hidden: true } }); dispatch({ type: 'set-selection', ids: [] }); }
            else if (kind === 'delete') dispatch({ type: 'delete-elements', ids: [id] });
            else if (kind === 'settings') setOpenSheet('properties');
          }}
        />
      )}

      {/* Bottom tool bar */}
      {!primaryEl && !openSheet && (
        <MobileEditorBottomBar activeTool={state.tool} onOpen={openTool}
          onMore={() => setOpenSheet('more')} />
      )}

      {/* Sheets */}
      <BottomSheet open={openSheet === 'templates'} onClose={closeSheet} title="Templates">
        <TemplatesPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'brand'} onClose={closeSheet} title="Brand">
        <BrandPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'text'} onClose={closeSheet} title="Text">
        <TextPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'shapes'} onClose={closeSheet} title="Shapes">
        <ShapesPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'images'} onClose={closeSheet} title="Images">
        <ImagesPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'icons'} onClose={closeSheet} title="Icons">
        <IconsPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'frames'} onClose={closeSheet} title="Frames">
        <FramesPanel />
      </BottomSheet>
      <BottomSheet open={openSheet === 'bg'} onClose={closeSheet} title="Background">
        <BackgroundPanel />
      </BottomSheet>

      {/* Add something new while an item is selected */}
      <BottomSheet open={openSheet === 'add'} onClose={closeSheet} title="Add to slide" height="auto">
        <div style={{ display: 'grid', gap: 10 }}>
          {[['text', 'Text'], ['images', 'Image'], ['shapes', 'Shape'], ['bg', 'Background']].map(([id, label]) =>
            <button className="btn btn-tonal" style={{ justifyContent: 'center', padding: 14 }} key={id}
              onClick={() => { dispatch({ type: 'set-selection', ids: [] }); openTool(id); }}>{label}</button>)}
        </div>
      </BottomSheet>

      {/* All settings for the selected item (the full properties list) */}
      <BottomSheet open={openSheet === 'properties'} onClose={closeSheet}
        title={primaryEl ? typeLabel(primaryEl.type) : 'Properties'}>
        {primaryEl ? <ElementProperties el={primaryEl} /> : <CanvasProperties />}
      </BottomSheet>

      {/* Pages sheet */}
      <BottomSheet open={openSheet === 'pages'} onClose={closeSheet} title="Pages">
        <MobilePagesList onSwitch={closeSheet} />
      </BottomSheet>

      {/* Layers sheet */}
      <BottomSheet open={openSheet === 'layers'} onClose={closeSheet} title="Layers">
        <LayersPanel />
      </BottomSheet>

      {/* More tools */}
      <BottomSheet open={openSheet === 'more'} onClose={closeSheet} title="More tools" height="auto">
        <div style={{ display: 'grid', gap: 4, paddingBottom: 8 }}>
          <SheetAction icon="frames" label="Frames"
            onClick={() => { closeSheet(); setTimeout(() => openTool('frames'), 100); }} />
          <SheetAction icon="icons" label="Icons" onClick={()=>openTool('icons')}/>
          <SheetAction icon="brand_kit" label="Brand kit"
            onClick={() => { closeSheet(); setTimeout(() => openTool('brand'), 100); }} />
          <SheetAction icon="templates" label="Templates"
            onClick={() => { closeSheet(); setTimeout(() => openTool('templates'), 100); }} />
        </div>
      </BottomSheet>

      {/* File menu */}
      <BottomSheet open={openSheet === 'menu'} onClose={closeSheet}
        title="File" height="auto">
        <div style={{ display: 'grid', gap: 4, paddingBottom: 8 }}>
          <SheetAction icon="templates" label="Back to home"
            onClick={() => { closeSheet(); dispatch({ type: 'close-project' }); }} />
          <SheetAction icon="plus" label="New page"
            onClick={() => { closeSheet(); dispatch({ type: 'add-canvas' }); }} />
          <SheetAction icon="duplicate" label="Duplicate design"
            onClick={() => { closeSheet(); dispatch({ type: 'duplicate-project', id: proj.id }); }} />
          <SheetAction icon="save" label="Save as template"
            onClick={() => { closeSheet(); setOpenSheet('save-template'); }} />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <SheetAction icon="undo" label="Undo"
            onClick={() => dispatch({ type: 'undo' })} />
          <SheetAction icon="redo" label="Redo"
            onClick={() => dispatch({ type: 'redo' })} />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <SheetAction icon="clear" label="Clear canvas" danger
            onClick={() => { if (confirm('Remove all elements?')) {
              dispatch({ type: 'update-canvas', id: canvas.id, patch: { elements: [] } });
              closeSheet();
            } }} />
        </div>
      </BottomSheet>

      {/* Download */}
      <BottomSheet open={openSheet === 'save-template'} onClose={closeSheet} title="Save as template" height="auto">
        <p>Download an editable copy, then import it from My Work whenever you want to reuse this design.</p>
        <button className="btn btn-tonal" onClick={()=>{exportProjectFile(proj);closeSheet();}}>Save editable template</button>
      </BottomSheet>
      <BottomSheet open={openSheet === 'download'} onClose={closeSheet}
        title="Download" height="auto">
        <MobileDownloadOptions proj={proj} canvas={canvas} onDone={closeSheet} />
      </BottomSheet>

      {/* Rename */}
      {openSheet === 'rename' && (
        <MobileRenameSheet proj={proj} onClose={closeSheet}
          onRename={n => { dispatch({ type: 'rename-project', id: proj.id, name: n }); closeSheet(); }} />
      )}

      {/* "More" for the selected item (also opens on long-press) */}
      {longPressMenu && primaryEl && (
        <BottomSheet open onClose={() => setLongPressMenu(false)}
          title={typeLabel(primaryEl.type)} height="auto">
          <div style={{ display: 'grid', gap: 4, paddingBottom: 8 }}>
            <SheetAction icon="duplicate" label="Duplicate"
              onClick={() => { dispatch({ type: 'duplicate-elements', ids: [primaryEl.id] }); setLongPressMenu(false); }} />
            <SheetAction icon="grid" label="Move & align"
              onClick={() => { setLongPressMenu(false); setTray('position'); }} />
            <SheetAction icon="arrow_up" label="Bring to front"
              onClick={() => { dispatch({ type: 'reorder-element', id: primaryEl.id,
                to: canvas.elements.length - 1 }); setLongPressMenu(false); }} />
            <SheetAction icon="arrow_down" label="Send to back"
              onClick={() => { dispatch({ type: 'reorder-element', id: primaryEl.id, to: 0 }); setLongPressMenu(false); }} />
            <SheetAction icon="lock" label={primaryEl.locked ? 'Unlock' : 'Lock'}
              onClick={() => { dispatch({ type: 'update-element', id: primaryEl.id,
                patch: { locked: !primaryEl.locked } }); setLongPressMenu(false); }} />
            <SheetAction icon="eye" label={primaryEl.hidden?'Show':'Hide'} onClick={()=>{dispatch({type:'update-element',id:primaryEl.id,patch:{hidden:!primaryEl.hidden}});dispatch({type:'set-selection',ids:[]});setLongPressMenu(false);}}/>
            <SheetAction icon="more" label="All settings"
              onClick={() => { setLongPressMenu(false); setOpenSheet('properties'); }} />
            <SheetAction icon="x" label="Deselect"
              onClick={() => { setLongPressMenu(false); dispatch({ type: 'set-selection', ids: [] }); }} />
            <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
            <SheetAction icon="trash" label="Delete" danger
              onClick={() => { dispatch({ type: 'delete-elements', ids: [primaryEl.id] }); setLongPressMenu(false); }} />
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function MobileEditorTopBar({ proj, canvas, compact, onBack, onMenu, onLayers, onRename, onDownload, onUndo, onRedo, canUndo, canRedo }) {
  // While typing there is no top stripe at all: undo / redo float on the canvas instead (see MobileEditor).
  // This spacer only keeps the slide clear of the iPhone clock / notch (it is 0 height on browsers with no notch).
  if (compact) return <div className="safe-top" style={{ flexShrink: 0 }} />;
  return (
    <div className="safe-top" style={{
      padding: '10px 12px',
      background: 'white', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      zIndex: 20,
    }}>
      <button className="icon-btn" onClick={onBack}>
        <Icon name="chevron_r" size={20} style={{ transform: 'rotate(180deg)' }} />
      </button>

      <button onClick={onRename} style={{
        flex: 1, minWidth: 0, textAlign: 'left', padding: '4px 8px', background: 'transparent',
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {proj.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
          {canvas.w}×{canvas.h}
        </div>
      </button>

      <button className="icon-btn" disabled={!canUndo} onClick={onUndo}>
        <Icon name="undo" size={18} />
      </button>
      <button className="icon-btn" disabled={!canRedo} onClick={onRedo}>
        <Icon name="redo" size={18} />
      </button>
      <button className="icon-btn" onClick={onLayers} aria-label="Layers" title="Layers">
        <Icon name="layer" size={18} />
      </button>
      <button className="icon-btn" onClick={onDownload}
        style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
        <Icon name="upload" size={16} style={{ transform: 'rotate(180deg)' }} />
      </button>
      <button className="icon-btn" onClick={onMenu}>
        <Icon name="more" size={20} />
      </button>
    </div>
  );
}

function MobilePagesStrip({ proj, onOpen }) {
  const { dispatch } = useStore();
  const activeIndex = Math.max(0, proj.canvases.findIndex(c => c.id === proj.activeCanvasId));
  const go = (index) => dispatch({ type: 'set-active-canvas', id: proj.canvases[index].id });
  const arrowStyle = {
    flexShrink: 0, width: 36, height: 36, alignSelf: 'center', border: 0,
    borderRadius: 18, background: 'rgba(255,255,255,.72)', color: 'var(--pink-600)',
    fontSize: 22,
  };
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto',
      padding: '8px 12px', background: 'white',
      borderTop: '1px solid var(--line)',
      flexShrink: 0,
    }} className="scroll">
      <button aria-label="Previous slide" disabled={activeIndex === 0}
        onClick={() => go(activeIndex - 1)} style={{ ...arrowStyle, opacity: activeIndex === 0 ? .3 : 1 }}>‹</button>
      {proj.canvases.map((c, i) => {
        const active = c.id === proj.activeCanvasId;
        return (
          <button key={c.id} onClick={() => dispatch({ type: 'set-active-canvas', id: c.id })}
            onDoubleClick={onOpen}
            style={{
              padding: 2, borderRadius: 6, background: 'transparent',
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2,
            }}>
            <div style={{
              width: 44, aspectRatio: `${c.w}/${c.h}`,
              maxHeight: 60, background: c.bg?.value || '#FDFBFC',
              border: active ? '2px solid var(--pink-500)' : '1px solid var(--line)',
              borderRadius: 4, overflow: 'hidden',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
            }}><MiniPreview canvas={c} maxW={44} maxH={60}/></div>
            <div style={{ fontSize: 9, color: active ? 'var(--pink-500)' : 'var(--ink-3)',
              fontWeight: active ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </div>
          </button>
        );
      })}
      <button aria-label="Next slide" disabled={activeIndex >= proj.canvases.length - 1}
        onClick={() => go(activeIndex + 1)} style={{ ...arrowStyle, opacity: activeIndex >= proj.canvases.length - 1 ? .3 : 1 }}>›</button>
      <button onClick={() => dispatch({ type: 'add-canvas' })}
        style={{
          padding: '0 12px', borderRadius: 6, background: 'transparent',
          flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 2, color: 'var(--pink-500)', border: '1.5px dashed var(--pink-400)',
          minWidth: 44,
        }}>
        <Icon name="plus" size={16} />
        <div style={{ fontSize: 9, fontWeight: 500 }}>Add</div>
      </button>
    </div>
  );
}

function MobileCanvasArea({ onLongPress, onEditWords, editingId: editingIdProp, setEditingId: setEditingIdProp }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const stageRef = meR(null);
  const [pan, setPan] = meS({ x: 0, y: 0 });
  const [guides, setGuides] = meS([]);
  const startDataRef = meR(null);
  const gestureRef = meR(null);
  const longPressRef = meR(null);
  const [editingLocal, setEditingLocal] = meS(null);
  const editingId = editingIdProp !== undefined ? editingIdProp : editingLocal;
  const setEditingId = setEditingIdProp || setEditingLocal;
  const editingRef = meR(editingId); editingRef.current = editingId;

  // Center canvas
  meE(() => {
    if (!stageRef.current || !canvas) return;
    const rect = stageRef.current.getBoundingClientRect();
    const scaledW = canvas.w * state.zoom;
    const scaledH = canvas.h * state.zoom;
    setPan({ x: (rect.width - scaledW) / 2, y: (rect.height - scaledH) / 2 });
  }, [canvas?.id, canvas?.w, canvas?.h]);

  // Auto-fit on first mount
  meE(() => {
    if (!stageRef.current || !canvas) return;
    const rect = stageRef.current.getBoundingClientRect();
    const availW = rect.width - 40;
    const availH = rect.height - 40;
    const z = clamp(Math.min(availW / canvas.w, availH / canvas.h), 0.05, 4);
    skipZoomPan.current = Math.abs(z - state.zoom) > 0.0005;
    setPan({ x: (rect.width - canvas.w * z) / 2, y: (rect.height - canvas.h * z) / 2 });
    dispatch({ type: 'set-zoom', zoom: z });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas?.id]);

  // When the area under the slide changes size (tool tray opens/closes, keyboard appears),
  // keep the slide centred, and re-fit it if it was already fitted to the screen.
  const lastRect = meR(null);
  const skipZoomPan = meR(false);
  meE(() => {
    const node = stageRef.current;
    if (!node || !canvas || typeof ResizeObserver === 'undefined') return;
    const fitFor = (r) => clamp(Math.min((r.width - 40) / canvas.w, (r.height - 40) / canvas.h), 0.05, 4);
    // While typing, the keyboard slides up in stages. Re-fitting on every stage makes the slide hop around,
    // so wait for the size to stop changing and then re-fit once.
    let settle = null;
    const refit = () => {
      settle = null;
      const r = node.getBoundingClientRect();
      const prev = lastRect.current;
      lastRect.current = { width: r.width, height: r.height };
      if (!prev || (prev.width === r.width && prev.height === r.height)) return;
      const wasFit = Math.abs(state.zoom - fitFor(prev)) < 0.012;
      if (wasFit) {
        const z = fitFor(r);
        skipZoomPan.current = Math.abs(z - state.zoom) > 0.0005;
        setPan({ x: (r.width - canvas.w * z) / 2, y: (r.height - canvas.h * z) / 2 });
        dispatch({ type: 'set-zoom', zoom: z });
      } else {
        setPan(p => ({ x: p.x + (r.width - prev.width) / 2, y: p.y + (r.height - prev.height) / 2 }));
      }
    };
    const ro = new ResizeObserver(() => {
      if (editingRef.current && lastRect.current) { clearTimeout(settle); settle = setTimeout(refit, 180); }
      else refit();
    });
    ro.observe(node);
    return () => { clearTimeout(settle); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas?.id, canvas?.w, canvas?.h, state.zoom]);

  const prevZoom = meR(state.zoom);
  meE(() => {
    if (!stageRef.current) return;
    if (skipZoomPan.current) { skipZoomPan.current = false; prevZoom.current = state.zoom; return; }
    const rect = stageRef.current.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    setPan(p => ({
      x: cx - (cx - p.x) * (state.zoom / prevZoom.current),
      y: cy - (cy - p.y) * (state.zoom / prevZoom.current),
    }));
    prevZoom.current = state.zoom;
  }, [state.zoom]);

  // Element interactions
  const startElementDrag = (e, elId) => {
    if (e.touches && e.touches.length > 1) return; // ignore multi-touch on element
    if (editingRef.current === elId) return; // let the finger place the cursor inside the text
    e.stopPropagation();
    const el = canvas.elements.find(x => x.id === elId);
    if (el?.locked) return;

    const wasSelected = state.selection.includes(elId);
    // Set selection immediately
    if (!wasSelected) {
      dispatch({ type: 'set-selection', ids: [elId] });
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startDataRef.current = {
      startX: clientX, startY: clientY,
      origEls: [{ ...el }],
      canvasSnapshot: JSON.parse(JSON.stringify(activeProject(state))),
      moved: false,
    };

    // Long-press timer
    clearTimeout(longPressRef.current);
    longPressRef.current = setTimeout(() => {
      if (startDataRef.current && !startDataRef.current.moved) {
        onLongPress?.();
        startDataRef.current = null;
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
    }, 500);

    const move = (ev) => {
      if (!startDataRef.current) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = (cx - startDataRef.current.startX) / state.zoom;
      const dy = (cy - startDataRef.current.startY) / state.zoom;
      // A real drag needs ~8 screen pixels of finger travel, so a normal tap never nudges the item.
      if (!startDataRef.current.moved && Math.hypot(cx - startDataRef.current.startX, cy - startDataRef.current.startY) > 8) {
        startDataRef.current.moved = true;
        clearTimeout(longPressRef.current);
      }
      if (!startDataRef.current.moved) return;

      const orig = startDataRef.current.origEls[0];
      const proposedX = orig.x + dx;
      const proposedY = orig.y + dy;
      const dragBox = {
        l: proposedX, t: proposedY, r: proposedX + orig.w, b: proposedY + orig.h,
        cx: proposedX + orig.w / 2, cy: proposedY + orig.h / 2,
      };
      const others = canvas.elements
        .filter(x => x.id !== elId)
        .map(x => ({ l: x.x, t: x.y, r: x.x + x.w, b: x.y + x.h,
          cx: x.x + x.w / 2, cy: x.y + x.h / 2 }));
      const canvasBox = { l: 0, t: 0, r: canvas.w, b: canvas.h,
        cx: canvas.w / 2, cy: canvas.h / 2 };
      const snap = computeSnapGuides(dragBox, others, canvasBox, 10 / state.zoom);
      setGuides(snap.guides);
      dispatch({ type: 'update-element', id: orig.id, transient: true,
        patch: { x: orig.x + dx + snap.dx, y: orig.y + dy + snap.dy } });
    };

    const up = () => {
      clearTimeout(longPressRef.current);
      setGuides([]);
      const sd = startDataRef.current;
      if (sd?.moved) {
        dispatch({ type: 'commit-transient', snapshot: sd.canvasSnapshot });
      } else if (sd && wasSelected && el.type === 'text') {
        // Tapping text that is already selected opens "Edit words".
        onEditWords?.(elId);
      }
      startDataRef.current = null;
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startResize = (e, elId, handleKey) => {
    e.preventDefault();
    e.stopPropagation();
    const el = canvas.elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startData = {
      startX: clientX, startY: clientY,
      orig: { ...el },
      canvasSnapshot: JSON.parse(JSON.stringify(activeProject(state))),
      handle: handleKey,
    };
    const move = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = (cx - startData.startX) / state.zoom;
      const dy = (cy - startData.startY) / state.zoom;
      const h = startData.handle;
      let nx = startData.orig.x, ny = startData.orig.y;
      let nw = startData.orig.w, nh = startData.orig.h;
      if (h.includes('e')) nw = Math.max(20, startData.orig.w + dx);
      if (h.includes('w')) { nw = Math.max(20, startData.orig.w - dx); nx = startData.orig.x + (startData.orig.w - nw); }
      if (h.includes('s')) nh = Math.max(20, startData.orig.h + dy);
      if (h.includes('n')) { nh = Math.max(20, startData.orig.h - dy); ny = startData.orig.y + (startData.orig.h - nh); }
      const isCorner = h === 'nw' || h === 'ne' || h === 'sw' || h === 'se';
      const patch = { x: nx, y: ny, w: nw, h: nh };
      if (startData.orig.type === 'text' && isCorner) {
        const sx = nw / startData.orig.w;
        const sy = nh / startData.orig.h;
        const factor = Math.max(6 / (startData.orig.fontSize || 24),
          Math.abs(sx - 1) >= Math.abs(sy - 1) ? sx : sy);
        patch.w = startData.orig.w * factor;
        patch.h = startData.orig.h * factor;
        patch.x = h.includes('w') ? startData.orig.x + startData.orig.w - patch.w : startData.orig.x;
        patch.y = h.includes('n') ? startData.orig.y + startData.orig.h - patch.h : startData.orig.y;
        patch.fontSize = (startData.orig.fontSize || 24) * factor;
      }
      dispatch({ type: 'update-element', id: elId, transient: true, patch });
    };
    const up = () => {
      dispatch({ type: 'commit-transient', snapshot: startData.canvasSnapshot });
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startRotate = (e, elId) => {
    e.preventDefault();
    e.stopPropagation();
    const el = canvas.elements.find(x => x.id === elId);
    if (!el || el.locked) return;
    const point = e.touches ? e.touches[0] : e;
    const stageRect = stageRef.current.getBoundingClientRect();
    const centerX = stageRect.left + pan.x + (el.x + el.w / 2) * state.zoom;
    const centerY = stageRect.top + pan.y + (el.y + el.h / 2) * state.zoom;
    const startAngle = Math.atan2(point.clientY - centerY, point.clientX - centerX) * 180 / Math.PI;
    const startData = {
      startAngle,
      startRotation: el.rot || 0,
      canvasSnapshot: JSON.parse(JSON.stringify(activeProject(state))),
    };
    const move = (ev) => {
      const p = ev.touches ? ev.touches[0] : ev;
      if (!p) return;
      if (ev.cancelable) ev.preventDefault();
      const angle = Math.atan2(p.clientY - centerY, p.clientX - centerX) * 180 / Math.PI;
      let rotation = startData.startRotation + angle - startData.startAngle;
      if (ev.shiftKey) rotation = Math.round(rotation / 15) * 15;
      dispatch({ type: 'update-element', id: elId, transient: true, patch: { rot: rotation } });
    };
    const up = () => {
      dispatch({ type: 'commit-transient', snapshot: startData.canvasSnapshot });
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Stage-level touch (pinch zoom, pan, tap-empty to deselect)
  const onStageTouchStart = (e) => {
    if ((e.target.dataset.canvasBg || e.target === e.currentTarget) && e.touches.length === 1) {
      dispatch({ type: 'set-selection', ids: [] });
    }
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      gestureRef.current = {
        startDist: dist, startZoom: state.zoom,
        startMidX: midX, startMidY: midY,
        startPan: { ...pan },
      };
      const move = (ev) => {
        if (!gestureRef.current || ev.touches.length !== 2) return;
        ev.preventDefault();
        const [a, b] = ev.touches;
        const newDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const newMidX = (a.clientX + b.clientX) / 2;
        const newMidY = (a.clientY + b.clientY) / 2;
        const zoomFactor = newDist / gestureRef.current.startDist;
        const newZoom = clamp(gestureRef.current.startZoom * zoomFactor, 0.05, 4);
        // Pan to keep midpoint locked
        const rect = stageRef.current.getBoundingClientRect();
        const anchorX = gestureRef.current.startMidX - rect.left;
        const anchorY = gestureRef.current.startMidY - rect.top;
        const newAnchorX = newMidX - rect.left;
        const newAnchorY = newMidY - rect.top;
        const zRatio = newZoom / gestureRef.current.startZoom;
        setPan({
          x: newAnchorX - (anchorX - gestureRef.current.startPan.x) * zRatio,
          y: newAnchorY - (anchorY - gestureRef.current.startPan.y) * zRatio,
        });
        dispatch({ type: 'set-zoom', zoom: newZoom });
      };
      const up = () => {
        gestureRef.current = null;
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
      };
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
    }
  };

  if (!canvas) return null;

  const primary = canvas.elements.find(el => state.selection.includes(el.id));

  return (
    <div ref={stageRef}
      onTouchStart={onStageTouchStart}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: 'var(--pink-100)',
        touchAction: 'none',
      }}
      className="checker">
      <div style={{
        position: 'absolute',
        left: pan.x, top: pan.y,
        width: canvas.w * state.zoom, height: canvas.h * state.zoom,
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div data-canvas-bg
          onPointerDown={(e) => { if (e.target.dataset.canvasBg) dispatch({ type: 'set-selection', ids: [] }); }}
          style={{
            position: 'absolute',
            width: canvas.w, height: canvas.h,
            transform: `scale(${state.zoom})`,
            transformOrigin: 'top left',
            background: canvas.bg?.value || '#FDFBFC',
            overflow: 'hidden',
          }}>
          {canvas.elements.map(el => (
            <div key={el.id}
              onTouchStart={(e) => { if (!el.locked) startElementDrag(e, el.id); }}
              onPointerDown={(e) => { if (e.pointerType !== 'touch' && !el.locked) startElementDrag(e, el.id); }}
              onDoubleClick={() => { if (el.type === 'text') onEditWords?.(el.id); }}
              style={{ position: 'absolute', left: 0, top: 0,
                cursor: el.locked ? 'not-allowed' : 'move' }}
            >
              <ElementView el={el} selected={state.selection.includes(el.id)}
                dispatch={dispatch} scale={state.zoom}
                editing={editingId === el.id} setEditing={setEditingId} />
              {/* Invisible, finger-sized grab area around items that are tiny on a phone screen. */}
              {!el.locked && !el.hidden && editingId !== el.id && (() => {
                const z = Math.max(0.05, state.zoom);
                const padX = Math.max(0, (48 / z - el.w) / 2), padY = Math.max(0, (48 / z - el.h) / 2);
                if (!padX && !padY) return null;
                return <div aria-hidden="true" style={{ position: 'absolute', left: el.x - padX, top: el.y - padY,
                  width: el.w + 2 * padX, height: el.h + 2 * padY, transform: `rotate(${el.rot || 0}deg)`,
                  background: 'transparent' }} />;
              })()}
              {el.type==='image'&&(el.role==='logo'||el.brandSlot==='logo')&&!el.hidden&&<button
                aria-label="Select brand logo" aria-pressed={state.selection.includes(el.id)}
                title="Tap to edit logo" style={logoHitTarget(el,state.zoom)}
                onTouchStart={e=>{e.stopPropagation();if(el.locked)dispatch({type:'set-selection',ids:[el.id]});else startElementDrag(e,el.id);}}
                onPointerDown={e=>{e.stopPropagation();if(e.pointerType!=='touch'){if(el.locked)dispatch({type:'set-selection',ids:[el.id]});else startElementDrag(e,el.id);}}}
                onClick={e=>{e.stopPropagation();dispatch({type:'set-selection',ids:[el.id]});}} />}
            </div>
          ))}
          {guides.map((g, i) => g.type === 'v' ? (
            <div key={i} style={{
              position: 'absolute', background: 'var(--pink-500)',
              left: g.x - 0.5, top: -1000, width: 1, height: canvas.h + 2000,
              pointerEvents: 'none', zIndex: 999,
            }} />
          ) : (
            <div key={i} style={{
              position: 'absolute', background: 'var(--pink-500)',
              top: g.y - 0.5, left: -1000, height: 1, width: canvas.w + 2000,
              pointerEvents: 'none', zIndex: 999,
            }} />
          ))}
        </div>

        {/* Selection overlay */}
        {primary && (
          <MobileSelectionOverlay el={primary} scale={state.zoom}
            onResize={(handle, e) => startResize(e, primary.id, handle)}
            onRotate={(e) => startRotate(e, primary.id)}
            onMove={(e) => startElementDrag(e, primary.id)} />
        )}
      </div>

      {/* Zoom badge */}
      <div style={{
        position: 'absolute', right: 12, bottom: 12,
        background: 'white', borderRadius: 999, padding: '4px 10px',
        fontSize: 10, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums',
        boxShadow: 'var(--shadow-sm)',
        pointerEvents: 'none',
      }}>
        {Math.round(state.zoom * 100)}%
      </div>
    </div>
  );
}

function MobileSelectionOverlay({ el, scale, onResize, onRotate, onMove }) {
  const bw = el.w * scale, bh = el.h * scale;
  // "Small" = hard to hold on a phone. Then: the handles sit just OUTSIDE the box so they never
  // cover it, and an extra finger-sized grab area makes the item easy to drag.
  const small = bw < 120 || bh < 56;
  const style = {
    position: 'absolute',
    left: el.x * scale, top: el.y * scale,
    width: bw, height: bh,
    transform: `rotate(${el.rot}deg)`,
    transformOrigin: 'center center',
    pointerEvents: 'none',
  };
  const out = small ? 16 : 0; // how far outside the box the handles sit
  const handles = [
    { key: 'nw', x: '0%', y: '0%', dx: -out, dy: -out, cursor: 'nwse-resize' },
    { key: 'ne', x: '100%', y: '0%', dx: out, dy: -out, cursor: 'nesw-resize' },
    { key: 'se', x: '100%', y: '100%', dx: out, dy: out, cursor: 'nwse-resize' },
    { key: 'sw', x: '0%', y: '100%', dx: -out, dy: out, cursor: 'nesw-resize' },
    ...(el.type === 'text' ? [
      { key: 'e', x: '100%', y: '50%', dx: out, dy: 0, cursor: 'ew-resize', side: true },
      { key: 'w', x: '0%', y: '50%', dx: -out, dy: 0, cursor: 'ew-resize', side: true },
    ] : []),
  ];
  return (
    <div style={style}>
      <div style={{ position: 'absolute', inset: 0, outline: '2px solid var(--pink-500)' }} />
      {onMove && (bw < 56 || bh < 56) && (
        <div aria-label="Drag to move" style={{
          position: 'absolute', left: '50%', top: '50%',
          width: Math.max(bw, 56), height: Math.max(bh, 56),
          transform: 'translate(-50%,-50%)', pointerEvents: 'auto', touchAction: 'none',
        }}
          onTouchStart={(e) => { onMove(e); }}
          onPointerDown={(e) => { if (e.pointerType !== 'touch') onMove(e); }} />
      )}
      {handles.map(h => (
        <button key={h.key} type="button" aria-label={`Resize ${h.key}`}
          style={{
            position: 'absolute', left: `calc(${h.x} + ${h.dx}px)`, top: `calc(${h.y} + ${h.dy}px)`,
            width: h.side ? 34 : 38, height: h.side ? 48 : 38,
            transform: 'translate(-50%,-50%)', padding: 0,
            background: 'transparent', border: 0, boxShadow: 'none',
            pointerEvents: 'auto',
            touchAction: 'none',
            cursor: h.cursor,
          }}
          onTouchStart={(e) => { e.stopPropagation(); onResize(h.key, e); }}
          onPointerDown={(e) => { if (e.pointerType !== 'touch') { e.stopPropagation(); onResize(h.key, e); } }}
        >
          <span aria-hidden="true" style={{
            position: 'absolute', left: '50%', top: '50%',
            width: h.side ? 8 : 14, height: h.side ? 22 : 14,
            transform: 'translate(-50%,-50%)',
            background: 'white', border: '2px solid var(--pink-500)',
            borderRadius: h.side ? 999 : 4, boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)', pointerEvents: 'none',
          }} />
        </button>
      ))}
      {onRotate && <div className="rotate-handle"
        style={{ left: '50%', top: small ? -56 : -44, marginLeft: -14, width: 28, height: 28, pointerEvents: 'auto', touchAction: 'none' }}
        onTouchStart={(e) => { e.stopPropagation(); onRotate(e); }}
        onPointerDown={(e) => { if (e.pointerType !== 'touch') { e.stopPropagation(); onRotate(e); } }} />}
    </div>
  );
}

function MobileEditorBottomBar({ activeTool, onOpen, onMore }) {
  const tools = [
    { id: 'text', icon: 'text', label: 'Text' },
    { id: 'images', icon: 'images', label: 'Image' },
    { id: 'bg', icon: 'bg', label: 'Background' },
    { id: 'brand', icon: 'brand_kit', label: 'Brand' },
  ];
  return (
    <div className="safe-bottom" style={{
      display: 'flex', background: 'white',
      borderTop: '1px solid var(--line)',
      flexShrink: 0, padding: '4px 4px calc(4px + env(safe-area-inset-bottom, 0px))',
      zIndex: 15,
    }}>
      {tools.map(t => (
        <button key={t.id} onClick={() => onOpen(t.id)}
          style={{
            flex: 1, padding: '10px 4px', borderRadius: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: activeTool === t.id ? 'var(--pink-600)' : 'var(--ink-2)',
            background: 'transparent',
          }}>
          <Icon name={t.icon} size={20} />
          <span style={{ fontSize: 9, fontWeight: 500 }}>{t.label}</span>
        </button>
      ))}
      <button onClick={onMore}
        style={{
          flex: 1, padding: '10px 4px', borderRadius: 8,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          color: 'var(--ink-2)', background: 'transparent',
        }}>
        <Icon name="more" size={20} />
        <span style={{ fontSize: 9, fontWeight: 500 }}>More ☰</span>
      </button>
    </div>
  );
}

// ======================================================================
// SELECTION TOOLBAR + LIVE TOOL TRAY (phone)
// The toolbar is always one tidy row (no sideways scrolling). Every button shows its
// current value (font name, size, colour) so you can read the state at a glance.
// ======================================================================
const SHAPE_TYPES = ['rect', 'circle', 'triangle', 'star', 'heart', 'diamond', 'polygon'];

// Which tray tools make sense for each kind of item.
function trayToolsFor(el) {
  if (el.type === 'text') return ['words', 'font', 'size', 'colour', 'format', 'position'];
  if (SHAPE_TYPES.includes(el.type) || ['line', 'arrow', 'icon'].includes(el.type)) return ['colour', 'size', 'opacity', 'position'];
  return ['size', 'opacity', 'position']; // image, frame
}
const TRAY_LABELS = { words: 'Edit', font: 'Font', size: 'Size', colour: 'Colour', format: 'Format', opacity: 'Fade', position: 'Move' };
// The property that holds this item's main colour.
function colourKey(el) {
  if (el.type === 'text' || el.type === 'icon') return 'color';
  if (SHAPE_TYPES.includes(el.type)) return 'fill';
  return 'stroke';
}

function ToolBtn({ label, onClick, active, children, keepFocus }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={!!active}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
      style={{
        flex: '0 0 auto', width: 62, minHeight: 54, padding: '7px 2px', borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        background: active ? 'var(--pink-100)' : 'transparent',
        color: active ? 'var(--pink-600)' : 'var(--ink-2)',
      }}>
      <span style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>{children}</span>
      <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '.01em' }}>{label}</span>
    </button>
  );
}

// Shown just above the keyboard while typing on the slide: one floating pill, like Canva.
// It scrolls sideways, and the round tick on the right finishes typing.
function MobileTextEditBar({ el, dispatch, onDone, onTool }) {
  const patch = (p) => dispatch({ type: 'update-element', id: el.id, patch: p });
  const aligns = ['left', 'center', 'right'];
  const nextAlign = aligns[(aligns.indexOf(el.align) + 1) % 3] || 'left';
  const chip = (active) => ({ flex: '0 0 auto', minWidth: 38, height: 38, padding: '0 7px', borderRadius: 19, border: 0,
    background: active ? 'var(--pink-100)' : 'transparent', color: active ? 'var(--pink-600)' : 'var(--ink)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 14, fontWeight: 600, fontFamily: 'inherit' });
  const keep = (e) => e.preventDefault();
  const Sep = () => <span aria-hidden="true" style={{ flex: '0 0 1px', width: 1, height: 20, background: 'var(--line-2)', margin: '0 2px' }} />;
  return (
    <div role="toolbar" aria-label="Text editing tools" style={{ flexShrink: 0, zIndex: 15, padding: '4px 8px calc(4px + max(0px, env(safe-area-inset-bottom, 0px) - var(--studio-keyboard, 0px)))', display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: 26, boxShadow: '0 4px 16px rgba(80,30,70,.18)', padding: '2px 4px',
        display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <button style={chip(false)} aria-label="Improve with AI" onClick={() => onTool('words')}><span style={{ fontSize: 18, color: 'var(--pink-600)' }}>✦</span></button>
        <Sep />
        <button style={chip(false)} aria-label="Text colour" onClick={() => onTool('colour')}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>A</span>
            <span style={{ width: 20, height: 4, borderRadius: 2, marginTop: 2, background: el.color, border: '1px solid var(--line-2)' }} />
          </span>
        </button>
        <button style={{ ...chip(false), maxWidth: 110 }} aria-label="Font" onClick={() => onTool('font')}>
          <span style={{ fontFamily: `"${el.fontFamily}", sans-serif`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.fontFamily}</span>
        </button>
        <button style={chip(false)} aria-label="Font size" onClick={() => onTool('size')}>{Math.round(el.fontSize)}</button>
        <button style={chip(false)} aria-label="Smaller" onMouseDown={keep} onClick={() => patch({ fontSize: Math.max(8, Math.round((el.fontSize || 40) / 1.1)) })}>A−</button>
        <button style={chip(false)} aria-label="Bigger" onMouseDown={keep} onClick={() => patch({ fontSize: Math.round((el.fontSize || 40) * 1.1) })}>A+</button>
        <Sep />
        <button style={chip(isBoldText(el))} aria-label="Bold" aria-pressed={isBoldText(el)} onMouseDown={keep} onClick={() => patch(toggleBoldPatch(el))}><Icon name="bold" size={20} /></button>
        <button style={chip(!!el.italic)} aria-label="Italic" aria-pressed={!!el.italic} onMouseDown={keep} onClick={() => patch({ italic: !el.italic })}><span style={{ fontStyle: 'italic', fontWeight: 700, fontSize: 19, fontFamily: 'serif' }}>I</span></button>
        <button style={chip(!!el.underline)} aria-label="Underline" aria-pressed={!!el.underline} onMouseDown={keep} onClick={() => patch({ underline: !el.underline })}><span style={{ textDecoration: 'underline', fontWeight: 700, fontSize: 18 }}>U</span></button>
        <button style={chip(false)} aria-label={'Align ' + (el.align || 'left')} onMouseDown={keep} onClick={() => patch({ align: nextAlign })}><Icon name={el.align === 'center' ? 'align_c' : el.align === 'right' ? 'align_r' : 'align_l'} size={20} /></button>
      </div>
      <button onClick={onDone} aria-label="Done typing" style={{ flex: '0 0 auto', width: 44, height: 44, borderRadius: '50%', border: 0, background: 'var(--ink)', color: 'white',
        boxShadow: '0 4px 16px rgba(80,30,70,.25)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700 }}>✓</button>
    </div>
  );
}
function MobileSelectionBar({ el, activeTool, onAdd, onTool, onAdjust, onAction, locked }) {
  const isText = el.type === 'text';
  const tools = trayToolsFor(el);
  const swatch = (c) => (
    <span style={{ width: 22, height: 22, borderRadius: '50%', background: c === 'transparent' ? '#fff' : c,
      border: '2px solid var(--line-2)', boxSizing: 'border-box', display: 'block' }} />
  );
  return (
    <div className="safe-bottom" style={{
      display: 'flex', gap: 2, padding: '6px 6px calc(6px + env(safe-area-inset-bottom, 0px))',
      background: 'white', borderTop: '1px solid var(--line)', flexShrink: 0, zIndex: 15,
      overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    }}>
      <ToolBtn label="Add" onClick={onAdd}><Icon name="plus" size={20} /></ToolBtn>
      {isText ? <>
        <ToolBtn label="Edit" onClick={() => onTool('words')} active={activeTool === 'words'}><Icon name="edit" size={19} /></ToolBtn>
        <ToolBtn label="Font" onClick={() => onTool('font')} active={activeTool === 'font'}>
          <span style={{ fontFamily: `"${el.fontFamily}", sans-serif`, fontSize: 21, lineHeight: '22px' }}>Aa</span>
        </ToolBtn>
        <ToolBtn label="Size" onClick={() => onTool('size')} active={activeTool === 'size'}>
          <span style={{ fontSize: 13, fontWeight: 700, border: '1.5px solid currentColor', borderRadius: 7, padding: '1px 6px', fontVariantNumeric: 'tabular-nums' }}>{Math.round(el.fontSize)}</span>
        </ToolBtn>
        <ToolBtn label="Colour" onClick={() => onTool('colour')} active={activeTool === 'colour'}>{swatch(el.color)}</ToolBtn>
        <ToolBtn label="Format" onClick={() => onTool('format')} active={activeTool === 'format'}><Icon name="bold" size={20} /></ToolBtn>
      </> : <>
        {tools.includes('colour')
          ? <ToolBtn label="Colour" onClick={() => onTool('colour')} active={activeTool === 'colour'}>{swatch(el[colourKey(el)])}</ToolBtn>
          : <ToolBtn label="Adjust" onClick={onAdjust}><Icon name="images" size={20} /></ToolBtn>}
        <ToolBtn label="Size" onClick={() => onTool('size')} active={activeTool === 'size'}><Icon name="fit" size={20} /></ToolBtn>
        <ToolBtn label="Fade" onClick={() => onTool('opacity')} active={activeTool === 'opacity'}><Icon name="eye" size={20} /></ToolBtn>
        <ToolBtn label="Move" onClick={() => onTool('position')} active={activeTool === 'position'}><Icon name="grid" size={20} /></ToolBtn>
      </>}
      {isText && <ToolBtn label="Move" onClick={() => onTool('position')} active={activeTool === 'position'}><Icon name="grid" size={20} /></ToolBtn>}
      <span aria-hidden="true" style={{ width: 1, background: 'var(--line)', margin: '8px 4px', flexShrink: 0 }} />
      <ToolBtn label="Copy" onClick={() => onAction('duplicate')}><Icon name="duplicate" size={20} /></ToolBtn>
      <ToolBtn label="Front" onClick={() => onAction('front')}><Icon name="arrow_up" size={20} /></ToolBtn>
      <ToolBtn label="Back" onClick={() => onAction('back')}><Icon name="arrow_down" size={20} /></ToolBtn>
      <ToolBtn label={locked ? 'Unlock' : 'Lock'} onClick={() => onAction('lock')}><Icon name={locked ? 'unlock' : 'lock'} size={20} /></ToolBtn>
      <ToolBtn label="Hide" onClick={() => onAction('hide')}><Icon name="eye_off" size={20} /></ToolBtn>
      <ToolBtn label="Delete" onClick={() => onAction('delete')}><Icon name="trash" size={20} /></ToolBtn>
      <ToolBtn label="Settings" onClick={() => onAction('settings')}><Icon name="more" size={20} /></ToolBtn>
    </div>
  );
}

// The strip that opens under the slide. Tabs along the top switch tools without closing it.
function MobileToolTray({ el, tool, setTool, onClose }) {
  const tabs = trayToolsFor(el);
  const tall = false;
  return (
    <div className="safe-bottom" style={{
      background: 'white', borderTop: '1px solid var(--line)', flexShrink: 0, zIndex: 15,
      display: 'flex', flexDirection: 'column',
      maxHeight: `calc(var(--studio-viewport-height, 100dvh) * ${tall ? 0.5 : 0.42})`,
      boxShadow: '0 -8px 24px rgba(150,60,120,.10)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <div className="scroll" role="tablist" style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', minWidth: 0 }}>
          {tabs.map(t => (
            <button key={t} role="tab" aria-selected={tool === t} onClick={() => setTool(t)}
              style={{ padding: '10px 8px', minWidth: 46, borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                background: tool === t ? 'var(--pink-200)' : 'transparent', color: tool === t ? 'var(--pink-600)' : 'var(--ink-2)' }}>
              {TRAY_LABELS[t]}
            </button>
          ))}
        </div>
        <button aria-label="Done" onClick={onClose}
          style={{ width: 44, height: 40, borderRadius: 10, background: 'var(--ink)', color: 'var(--cream)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="check" size={18} />
        </button>
      </div>
      <div className="scroll" style={{ overflowY: 'auto', padding: '12px 16px 14px', minHeight: 0 }}>
        {tool === 'words' && <WordsTool el={el} />}
        {tool === 'font' && <FontPicker el={el} maxHeight={Math.round((window.visualViewport?.height || window.innerHeight) * 0.27)} />}
        {tool === 'size' && <SizeTool el={el} />}
        {tool === 'colour' && <ColourTool el={el} />}
        {tool === 'format' && <FormatTool el={el} />}
        {tool === 'opacity' && <OpacityTool el={el} />}
        {tool === 'position' && <PositionTool el={el} />}
      </div>
    </div>
  );
}

// ---- Edit words: type straight into the box; Undo goes back to before you started typing ----
function WordsTool({ el }) {
  const { state } = useStore();
  const { live, done } = useLiveElementEdit(el.id);
  const { dispatch } = useStore();
  const [busy, setBusy] = meS(false), [err, setErr] = meS('');
  const improve = async () => {
    if (!confirm('Rewrite this text with AI? Other items and slides stay unchanged. You can Undo.')) return;
    setBusy(true); setErr('');
    try {
      const text = await aiGenerate({ brand: state.brand, vocab: state.vocab, provider: 'gemini',
        task: 'Improve this one carousel text element. Keep the meaning. Return only the revised words, without labels or commentary.',
        input: el.text, platform: 'Instagram carousel' });
      if (!text?.trim()) throw new Error('No revised text returned.');
      dispatch({ type: 'update-element', id: el.id, patch: { text: text.trim() } });
    } catch (e) { setErr(e.message || 'AI could not rewrite this just now.'); } finally { setBusy(false); }
  };
  return (
    <div>
      <textarea aria-label="Edit selected words" autoFocus value={el.text || ''}
        onChange={e => live({ text: e.target.value })} onBlur={done}
        style={{ width: '100%', minHeight: 96, fontSize: 16, lineHeight: 1.45, padding: 12, boxSizing: 'border-box',
          border: '1px solid var(--line-2)', borderRadius: 12, fontFamily: 'inherit', resize: 'vertical' }} />
      <button className="btn btn-tonal" disabled={busy} onClick={improve} style={{ marginTop: 10 }}>{busy ? 'Improving…' : '✦ Improve with AI'}</button>
      {err && <p role="alert" style={{ fontSize: 12, color: 'var(--pink-600)' }}>{err}</p>}
    </div>
  );
}

// ---- Colour ----
function ColourTool({ el }) {
  const { dispatch } = useStore();
  const key = colourKey(el);
  return <ColorPicker value={el[key]} onChange={v => dispatch({ type: 'update-element', id: el.id, patch: { [key]: v } })} />;
}

// ---- Size: text gets a size slider + box width; everything else scales as a whole ----
function SizeTool({ el }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const { live, done } = useLiveElementEdit(el.id);
  if (el.type === 'text') {
    const maxW = Math.max(Math.round(el.w), Math.round(canvas.w - el.x));
    return (
      <div>
        <FontSizeControl el={el} />
        <div style={{ height: 14 }} />
        <SliderRow label="Box width (wraps the words)" value={Math.round(el.w)} min={80} max={maxW} step={4} unit=" px"
          onLive={v => live({ w: v })} onDone={done}
          onStep={d => dispatch({ type: 'update-element', id: el.id, patch: { w: clamp(el.w + d, 80, maxW) } })} />
      </div>
    );
  }
  // Scale about the centre, keeping the shape's proportions.
  const ratio = el.h / Math.max(1, el.w);
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  const maxW = Math.round(Math.max(canvas.w * 1.2, el.w));
  const apply = (nw) => ({ x: cx - nw / 2, y: cy - (nw * ratio) / 2, w: nw, h: nw * ratio });
  const isLine = el.type === 'line' || el.type === 'arrow';
  return (
    <div>
      <SliderRow label="Size" value={Math.round(el.w)} min={24} max={maxW} step={2} unit=" px"
        onLive={v => live(apply(v))} onDone={done}
        onStep={d => dispatch({ type: 'update-element', id: el.id, patch: apply(clamp(el.w + d, 24, maxW)) })} />
      {isLine && <>
        <div style={{ height: 10 }} />
        <SliderRow label="Thickness" value={Math.round(el.strokeWidth || 4)} min={1} max={40} unit=" px"
          onLive={v => live({ strokeWidth: v })} onDone={done}
          onStep={d => dispatch({ type: 'update-element', id: el.id, patch: { strokeWidth: clamp((el.strokeWidth || 4) + d, 1, 40) } })} />
      </>}
    </div>
  );
}

// ---- See-through ----
function OpacityTool({ el }) {
  const { dispatch } = useStore();
  const { live, done } = useLiveElementEdit(el.id);
  const pct = Math.round((el.opacity ?? 1) * 100);
  return <SliderRow label="Visibility" value={pct} min={5} max={100} unit="%" onLive={v => live({ opacity: v / 100 })} onDone={done}
    onStep={d => dispatch({ type: 'update-element', id: el.id, patch: { opacity: clamp(pct + d, 5, 100) / 100 } })} />;
}

// ---- Format: bold / italic / underline, alignment, weight, spacing ----
function FormatTool({ el }) {
  const { dispatch } = useStore();
  const { live, done } = useLiveElementEdit(el.id);
  const update = (patch) => dispatch({ type: 'update-element', id: el.id, patch });
  const bold = boldWeightFor(el.fontFamily);
  const toggle = (on, extra = {}) => ({
    flex: 1, justifyContent: 'center', minHeight: 46, fontSize: 17,
    background: on ? 'var(--pink-200)' : 'var(--pink-50)', color: on ? 'var(--pink-600)' : 'var(--ink)', ...extra,
  });
  const ls = Number(el.letterSpacing || 0), lh = Number(el.lineHeight || 1.2);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" disabled={!bold} aria-pressed={isBoldText(el)} aria-label="Bold"
          onClick={() => { const p = toggleBoldPatch(el); if (p) update(p); }}
          style={toggle(isBoldText(el), { fontWeight: 800, opacity: bold ? 1 : 0.35 })}>B</button>
        <button className="btn" aria-pressed={!!el.italic} aria-label="Italic" onClick={() => update({ italic: !el.italic })}
          style={toggle(!!el.italic, { fontStyle: 'italic', fontFamily: 'serif' })}>I</button>
        <button className="btn" aria-pressed={!!el.underline} aria-label="Underline" onClick={() => update({ underline: !el.underline })}
          style={toggle(!!el.underline, { textDecoration: 'underline' })}>U</button>
        {[['left', 'align_l'], ['center', 'align_c'], ['right', 'align_r']].map(([a, icon]) => (
          <button key={a} className="btn" aria-label={`Align ${a}`} aria-pressed={el.align === a} onClick={() => update({ align: a })}
            style={toggle(el.align === a)}><Icon name={icon} size={18} /></button>
        ))}
      </div>
      {!bold && <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--ink-3)' }}>This font only comes in one weight, so Bold is off. Pick another font for bold.</p>}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', margin: '14px 0 6px' }}>Weight</div>
      <WeightChips el={el} update={update} />
      <div style={{ height: 12 }} />
      <SliderRow label="Letter spacing" value={ls} min={-2} max={30} step={0.5} onLive={v => live({ letterSpacing: v })} onDone={done}
        onStep={d => update({ letterSpacing: clamp(ls + d, -2, 30) })} />
      <SliderRow label="Line spacing" value={Math.round(lh * 100) / 100} min={0.8} max={2.4} step={0.05} onLive={v => live({ lineHeight: v })} onDone={done}
        onStep={d => update({ lineHeight: Math.round(clamp(lh + d, 0.8, 2.4) * 100) / 100 })} />
      <SliderRow label="Visibility" value={Math.round((el.opacity ?? 1) * 100)} min={5} max={100} unit="%" onLive={v => live({ opacity: v / 100 })} onDone={done}
        onStep={d => update({ opacity: clamp(Math.round((el.opacity ?? 1) * 100) + d, 5, 100) / 100 })} />
      <details style={{ marginTop: 10 }}>
        <summary style={{ padding: '10px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Slide text styles (Heading, Body…)</summary>
        <SlideTextStyleControls el={el} update={update} />
      </details>
    </div>
  );
}

// ---- Move: nudge with arrows, or snap to the page ----
function PositionTool({ el }) {
  const { state, dispatch } = useStore();
  const [step, setStep] = meS(10);
  const nudge = (dx, dy) => dispatch({ type: 'update-element', id: el.id, patch: { x: el.x + dx, y: el.y + dy } });
  const arrow = { width: 52, height: 48, borderRadius: 12, background: 'var(--pink-100)', color: 'var(--ink)', fontSize: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
  const aligns = [['left', 'Left'], ['hcenter', 'Centre'], ['right', 'Right'], ['top', 'Top'], ['vmiddle', 'Middle'], ['bottom', 'Bottom']];
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gap: 6 }}>
          <span />
          <button style={arrow} aria-label="Nudge up" onClick={() => nudge(0, -step)}>↑</button>
          <span />
          <button style={arrow} aria-label="Nudge left" onClick={() => nudge(-step, 0)}>←</button>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ink-3)' }}>{step}px</span>
          <button style={arrow} aria-label="Nudge right" onClick={() => nudge(step, 0)}>→</button>
          <span />
          <button style={arrow} aria-label="Nudge down" onClick={() => nudge(0, step)}>↓</button>
          <span />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[[2, 'Fine'], [10, 'Normal'], [40, 'Big']].map(([v, l]) => (
            <button key={v} onClick={() => setStep(v)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              background: step === v ? 'var(--pink-200)' : 'var(--pink-50)', color: step === v ? 'var(--pink-600)' : 'var(--ink-2)' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 150 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Snap to the slide</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {aligns.map(([pos, label]) => (
            <button key={pos} onClick={() => alignElementsToPage(state, dispatch, pos)}
              style={{ padding: '12px 4px', borderRadius: 10, background: 'var(--pink-50)', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobilePagesList({ onSwitch }) {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);
  if (!proj) return null;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {proj.canvases.map((c, i) => {
        const active = c.id === proj.activeCanvasId;
        return (
          <div key={c.id} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: 10, borderRadius: 12,
            background: active ? 'var(--pink-100)' : 'var(--pink-50)',
            border: active ? '1px solid var(--pink-400)' : '1px solid transparent',
          }}>
            <button onClick={() => { dispatch({ type: 'set-active-canvas', id: c.id }); onSwitch?.(); }}
              style={{ padding: 0, background: 'transparent', flexShrink: 0 }}>
              <div style={{
                width: 60, aspectRatio: `${c.w}/${c.h}`,
                background: c.bg?.value || '#FDFBFC',
                borderRadius: 4, border: '1px solid var(--line)',
              }} />
            </button>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
              <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.name || `Page ${i + 1}`}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2,
                fontVariantNumeric: 'tabular-nums' }}>{c.w}×{c.h}</div>
            </div>
            <button className="icon-btn" onClick={() => dispatch({ type: 'duplicate-canvas', id: c.id })}>
              <Icon name="duplicate" size={14} />
            </button>
            {proj.canvases.length > 1 && (
              <button className="icon-btn"
                onClick={() => { if (confirm('Delete this page?')) dispatch({ type: 'delete-canvas', id: c.id }); }}>
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        );
      })}
      <button onClick={() => dispatch({ type: 'add-canvas' })}
        style={{
          padding: 14, borderRadius: 12,
          background: 'white', border: '1.5px dashed var(--pink-400)',
          color: 'var(--pink-500)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 500,
        }}>
        <Icon name="plus" size={16} /> New page
      </button>
    </div>
  );
}

function MobileDownloadOptions({ proj, canvas, onDone }) {
  const [exporting, setExporting] = meS(false);
  const doExport = async (format, scope) => {
    setExporting(true);
    try {
      const cs = scope === 'current' ? [canvas] : proj.canvases;
      const base = (proj.name || 'design').replace(/[^\w-]/g, '_');
      await exportCanvases(cs, format, base);
      onDone?.();
    } catch (e) { alert('Export failed: ' + e.message); }
    setExporting(false);
  };
  return (
    <div style={{ display: 'grid', gap: 6, paddingBottom: 8 }}>
      <SheetAction icon="image_export" label="Export as PNG"
        onClick={() => doExport('png')} />
      <SheetAction icon="image_export" label="Export as JPEG"
        onClick={() => doExport('jpg')} />
      <SheetAction icon="pdf" label="Export as PDF (vector)"
        onClick={() => doExport('pdf')} />
      <SheetAction icon="svg_icon" label="Export as SVG"
        onClick={() => doExport('svg')} />
      <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
      <SheetAction icon="upload" label="Export current page only (PNG)"
        onClick={() => doExport('png', 'current')} />
      <SheetAction icon="upload" label="Export .petal.json (backup)"
        onClick={() => { exportProjectFile(proj); onDone?.(); }} />
      {exporting && <div style={{ padding: 12, textAlign: 'center', color: 'var(--pink-500)', fontSize: 12 }}>
        Exporting…
      </div>}
    </div>
  );
}

function MobileRenameSheet({ proj, onClose, onRename }) {
  const [val, setVal] = meS(proj.name);
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ height: 'auto' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '4px 20px 20px' }}>
          <h3 style={{ margin: '0 0 12px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 20 }}>
            Rename design
          </h3>
          <input autoFocus className="text-input" value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onRename(val.trim()); }}
            style={{ fontSize: 16, padding: 12 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onRename(val.trim())}
              style={{ flex: 1, justifyContent: 'center' }}>Rename</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  trayToolsFor, MobileToolTray, ToolBtn,
  MobileEditor, MobileEditorTopBar, MobilePagesStrip,
  MobileCanvasArea, MobileSelectionOverlay, MobileEditorBottomBar,
  MobileSelectionBar, MobilePagesList, MobileDownloadOptions, MobileRenameSheet,
});
