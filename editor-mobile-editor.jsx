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
              <button className="icon-btn" aria-label="Close" onClick={onClose}>
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

function MobileEditor({ onExit, progressNav, onPreview, onSource, onResize, onBulkCreate }) {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);
  const canvas = activeCanvas(state);

  const [openSheet, setOpenSheet] = meS(null);
  // The active tool opens above the ribbon without changing the canvas layout.
  const [tray, setTray] = meS(null);
  // Draft words separately; the canvas never becomes a keyboard input.
  const [wordDraft, setWordDraft] = meS(null);
  const [frozenCanvasHeight, setFrozenCanvasHeight] = meS(null);
  const canvasHost = meR(null);
  const closeTimer = meR(null);
  meE(() => () => clearTimeout(closeTimer.current), []);
  const editingId = null;
  const setEditingId = () => {};
  const endEdit = () => {};
  const beginEdit = (id) => {
    const el = canvas.elements.find(e => e.id === id);
    if (!el || el.locked || el.type !== 'text') return;
    clearTimeout(closeTimer.current);
    setFrozenCanvasHeight(canvasHost.current?.getBoundingClientRect().height || null);
    setWordDraft({id, text: el.text || '', original: el.text || ''});
  };
  const closeWords = (save) => {
    if (save && wordDraft.text !== wordDraft.original)
      dispatch({type:'update-element', id:wordDraft.id, patch:{text:wordDraft.text}});
    document.activeElement?.blur?.();
    setWordDraft(null);
    closeTimer.current = setTimeout(() => setFrozenCanvasHeight(null), 350);
  };

  const primaryEl = canvas ? canvas.elements.find(e => e.id === state.selection[0]) : null;
  // Stop typing if the selection moves to something else.
  meE(() => { if (editingId && (!primaryEl || primaryEl.id !== editingId)) endEdit(); }, [primaryEl?.id, editingId]);

  // A tool belongs to the item it was opened for.
  meE(() => {
    setTray(null);
  }, [canvas?.id, primaryEl?.id]);

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
    setTray(null);
    dispatch({ type: 'set-tool', tool });
    setOpenSheet(tool);
  };

  const closeSheet = () => setOpenSheet(null);
  const pickTool = (tool) => setTray(t => (t === tool ? null : tool));
  const clearSelection = () => {
    setTray(null);
    dispatch({ type: 'set-selection', ids: [] });
  };
  const activeTray = primaryEl && (!primaryEl.locked || tray === 'position') && trayToolsFor(primaryEl).includes(tray) ? tray : null;

  return (
    <div style={{
      height: 'var(--studio-viewport-height, 100dvh)', width: '100%', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'var(--pink-100)',
    }}>
      {wordDraft && <MobileWordsDialog draft={wordDraft} onChange={text=>setWordDraft(d=>({...d,text}))} onCancel={()=>closeWords(false)} onDone={()=>closeWords(true)} />}
      {/* Top bar */}
      <MobileEditorTopBar proj={proj} canvas={canvas} compact={!!editingId} onDone={endEdit}
        onBack={onExit}
        onRename={() => setOpenSheet('rename')}
        onDownload={() => onPreview ? onPreview() : openTool('download')}
        onLayers={() => openTool('layers')}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
      />
      {!editingId && progressNav}

      {/* Canvas area */}
      <div ref={canvasHost} style={{ flex: frozenCanvasHeight ? '0 0 '+frozenCanvasHeight+'px' : 1, minHeight: 0, position: 'relative' }}>
        <MobileCanvasArea editingId={editingId} setEditingId={setEditingId}
          showTransformHandles={!activeTray && !openSheet}
          onOverview={!openSheet && proj.canvases.length > 1 ? () => openTool('pages') : undefined}
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
        {!editingId && proj.canvases.length > 0 && (() => {
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
            <button aria-label={`View all slides, slide ${idx + 1} of ${n}`} onClick={() => openTool('pages')}
              style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 5, border: 0, borderRadius: 999,
                background: 'rgba(255,255,255,.9)', boxShadow: '0 1px 6px rgba(80,30,70,.16)', padding: '6px 14px', fontSize: 12, fontWeight: 600,
                color: 'var(--ink-2)', minHeight: 44, fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {n}</button>
          </>;
        })()}
      </div>

      <div className="mobile-ribbon-dock">
        {primaryEl && (
          <div className="mobile-ribbon-context">
            {activeTray && !openSheet && !wordDraft && (
              <MobileToolTray key={primaryEl.id + activeTray} el={primaryEl} tool={activeTray} onClose={() => setTray(null)} />
            )}
            <MobileRibbon key={primaryEl.type} label="Selected element tools"
              end={<button className="mobile-ribbon-pin mobile-ribbon-done" onClick={clearSelection}>Done</button>}>
              <MobileSelectionTools el={primaryEl} activeTool={activeTray}
                onTool={tool => tool === 'words' ? beginEdit(primaryEl.id) : pickTool(tool)} />
            </MobileRibbon>
          </div>
        )}
        <MobileRibbon label="Page tools" showScrollButton={false} end={
          <button className="mobile-ribbon-pin mobile-ribbon-arrow" aria-label="More tools"
            aria-expanded={openSheet === 'more'} onClick={() => openTool('more')}>
            <Icon name="menu" size={20} />
          </button>}>
          <MobilePageTools activeTool={openSheet} onOpen={openTool} />
        </MobileRibbon>
      </div>

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

      {openSheet === 'pages' && <MobilePagesOverview onClose={closeSheet} />}
      <BottomSheet open={openSheet === 'more'} onClose={closeSheet} title="More tools" height="auto">
        <SheetAction icon="brand_kit" label="Brand" onClick={() => openTool('brand')} />
        {onSource && <SheetAction icon="text" label="Source text" onClick={() => { closeSheet(); onSource(); }} />}
        {onResize && <SheetAction icon="duplicate" label="Resize as a copy" onClick={() => { closeSheet(); onResize(); }} />}
        {onBulkCreate && <SheetAction icon="grid" label="Bulk create" onClick={() => { closeSheet(); onBulkCreate(); }} />}
        <SheetAction icon="duplicate" label="Duplicate design" onClick={() => {
          dispatch({ type: 'duplicate-project', id: proj.id });
          closeSheet();
        }} />
        <SheetAction icon="save" label="Save as template" onClick={() => {
          const name = prompt('Template name', proj.name)?.trim();
          if (name) {
            dispatch({ type: 'save-template', name });
            closeSheet();
          }
        }} />
        <SheetAction icon="save" label="Save editable backup" onClick={() => { exportProjectFile(proj); closeSheet(); }} />
      </BottomSheet>

      {/* Layers sheet */}
      <BottomSheet open={openSheet === 'layers'} onClose={closeSheet} title="Layers">
        <LayersPanel onSelect={closeSheet} />
      </BottomSheet>

      {/* Download */}
      <BottomSheet open={openSheet === 'download'} onClose={closeSheet}
        title="Download" height="auto">
        <MobileDownloadOptions proj={proj} canvas={canvas} onDone={closeSheet} />
      </BottomSheet>

      {/* Rename */}
      {openSheet === 'rename' && (
        <MobileRenameSheet proj={proj} onClose={closeSheet}
          onRename={n => { dispatch({ type: 'rename-project', id: proj.id, name: n }); closeSheet(); }} />
      )}

    </div>
  );
}

function MobileEditorTopBar({ proj, canvas, compact, onDone, onBack, onRename, onDownload, onLayers, onUndo, onRedo, canUndo, canRedo }) {
  // While typing there is no top stripe at all: undo / redo float on the canvas instead (see MobileEditor).
  // This spacer only keeps the slide clear of the iPhone clock / notch (it is 0 height on browsers with no notch).
  if (compact) return <div className="safe-top" style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 12px',background:'white'}}><span style={{fontSize:13}}>Editing text</span><button className="btn btn-tonal" onClick={onDone}>Done</button></div>;
  return (
    <div className="safe-top" style={{
      padding: '10px 12px',
      background: 'white', borderBottom: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
      zIndex: 20,
    }}>
      <button className="icon-btn" aria-label="Back to studio" onClick={onBack}>
        <Icon name="chevron_r" size={20} style={{ transform: 'rotate(180deg)' }} />
      </button>

      <button onClick={onRename} style={{
        flex: 1, minWidth: 0, textAlign: 'left', padding: '4px 8px', background: 'transparent',
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {proj.name}
        </div>

      </button>

      <button className="icon-btn" aria-label="Undo" disabled={!canUndo} onClick={onUndo}>
        <Icon name="undo" size={18} />
      </button>

      <button className="icon-btn" aria-label="Redo" disabled={!canRedo} onClick={onRedo}><Icon name="redo" size={18} /></button>
      <button className="icon-btn" aria-label="Layers" onClick={onLayers}><Icon name="layer" size={20} /></button>
      <button className="icon-btn" aria-label="Preview and download" onClick={onDownload}
        style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
        <Icon name="upload" size={16} style={{ transform: 'rotate(180deg)' }} />
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

function MobileCanvasArea({ onEditWords, editingId: editingIdProp, setEditingId: setEditingIdProp, showTransformHandles = true, onOverview }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const stageRef = meR(null);
  const [pan, setPan] = meS({ x: 0, y: 0 });
  const [guides, setGuides] = meS([]);
  const [stageSize, setStageSize] = meS(null);
  meE(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const { width, height } = stage.getBoundingClientRect();
      setStageSize({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [canvas?.id]);
  const startDataRef = meR(null);
  const gestureRef = meR(null);
  const endElementGesture = meR(null);
  const endPinch = meR(null);
  const fitZoom = meR(1);
  meE(() => () => {
    endElementGesture.current?.();
    endPinch.current?.();
  }, []);
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
    fitZoom.current = z;
    skipZoomPan.current = z;
    setPan({ x: (rect.width - canvas.w * z) / 2, y: (rect.height - canvas.h * z) / 2 });
    dispatch({ type: 'set-zoom', zoom: z });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas?.id]);

  // Tool trays and the keyboard must not change the user's canvas framing.
  // Initial fit and explicit zoom remain available.
  const skipZoomPan = meR(false);

  const prevZoom = meR(state.zoom);
  meE(() => {
    if (!stageRef.current) return;
    if (skipZoomPan.current !== false) {
      if (Math.abs(skipZoomPan.current - state.zoom) < 0.0005) { skipZoomPan.current = false; prevZoom.current = state.zoom; }
      return;
    }
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

    const move = (ev) => {
      if (!startDataRef.current) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = (cx - startDataRef.current.startX) / state.zoom;
      const dy = (cy - startDataRef.current.startY) / state.zoom;
      // A real drag needs ~8 screen pixels of finger travel, so a normal tap never nudges the item.
      if (!startDataRef.current.moved && Math.hypot(cx - startDataRef.current.startX, cy - startDataRef.current.startY) > 8) {
        startDataRef.current.moved = true;
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
      endElementGesture.current = null;
      setGuides([]);
      const sd = startDataRef.current;
      if (sd?.moved) {
        dispatch({ type: 'commit-transient', snapshot: sd.canvasSnapshot });
      }
      startDataRef.current = null;
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };

    endElementGesture.current = up;
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
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
      if (keepsAspectOnResize(startData.orig) && isCorner) {
        Object.assign(patch, proportionalElementResize(startData.orig, h, nw, nh, 20));
      }
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
      endElementGesture.current = null;
      dispatch({ type: 'commit-transient', snapshot: startData.canvasSnapshot });
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    endElementGesture.current = up;
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
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
      endElementGesture.current = null;
      dispatch({ type: 'commit-transient', snapshot: startData.canvasSnapshot });
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    endElementGesture.current = up;
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // Stage-level touch (pinch zoom, pan, tap-empty to deselect)
  const onStageTouchStart = (e) => {
    if ((e.target.dataset.canvasBg || e.target === e.currentTarget) && e.touches.length === 1) {
      dispatch({ type: 'set-selection', ids: [] });
    }
    if (e.touches.length === 2 && !gestureRef.current) {
      endElementGesture.current?.();
      e.preventDefault();
      const [t1, t2] = e.touches;
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (!dist) return;
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
        const { startZoom, startPan } = gestureRef.current;
        const rawZoom = startZoom * zoomFactor;
        if (onOverview && zoomFactor < 0.85 && rawZoom <= fitZoom.current * 0.75) {
          up();
          skipZoomPan.current = prevZoom.current === startZoom ? false : startZoom;
          setPan(startPan);
          dispatch({ type: 'set-zoom', zoom: startZoom });
          onOverview();
          return;
        }
        const newZoom = clamp(rawZoom, 0.05, 4);
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
        skipZoomPan.current = prevZoom.current === newZoom ? false : newZoom;
        dispatch({ type: 'set-zoom', zoom: newZoom });
      };
      const up = () => {
        gestureRef.current = null;
        endPinch.current = null;
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
        window.removeEventListener('touchcancel', up);
      };
      endPinch.current = up;
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
      window.addEventListener('touchcancel', up);
    }
  };

  if (!canvas) return null;

  const primary = canvas.elements.find(el => state.selection.includes(el.id));
  const handlePosition = primary && stageSize && !primary.locked && !primary.hidden && !editingId && showTransformHandles
    ? mobileTransformHandlePosition(primary, state.zoom, pan, stageSize)
    : null;

  return (
    <div ref={stageRef}
      onTouchStartCapture={e => {
        if (e.touches.length === 2) {
          onStageTouchStart(e);
          e.stopPropagation();
        }
      }}
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
              {isBrandLogo(el) && !el.hidden&&<button
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
        {primary && !editingId && (
          <MobileSelectionOverlay el={primary} scale={state.zoom}
            onResize={(handle, e) => startResize(e, primary.id, handle)}
            onMove={(e) => startElementDrag(e, primary.id)} />
        )}
      </div>

      {handlePosition && <div className="mobile-transform-handles" role="group" aria-label="Canvas transform handles" style={handlePosition}>
        <MobileTransformHandle icon="rotate_element" label="Drag to rotate" onDrag={e => startRotate(e, primary.id)} />
        <MobileTransformHandle icon="move_element" label="Drag to move" onDrag={e => startElementDrag(e, primary.id)} />
      </div>}

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

function mobileTransformHandlePosition(el, zoom, pan, stage) {
  // Keep the controls upright beside the rotated selection and above the contextual ribbon.
  const angle = (el.rot || 0) * Math.PI / 180;
  const halfHeight = (Math.abs(el.w * Math.sin(angle)) + Math.abs(el.h * Math.cos(angle))) * zoom / 2;
  const centerX = pan.x + (el.x + el.w / 2) * zoom;
  const centerY = pan.y + (el.y + el.h / 2) * zoom;
  const halfGroupWidth = 50, halfTarget = 22, gap = 36;
  const topLimit = halfTarget + 4;
  const bottomLimit = Math.max(topLimit, stage.height - 60 - halfTarget - 4);
  const below = centerY + halfHeight + gap + halfTarget;
  const above = centerY - halfHeight - gap - halfTarget;
  const preferred = below <= bottomLimit ? below : above;
  return {
    left: clamp(centerX, halfGroupWidth, Math.max(halfGroupWidth, stage.width - halfGroupWidth)),
    top: clamp(preferred, topLimit, bottomLimit),
  };
}

function MobileTransformHandle({ icon, label, onDrag }) {
  return <button type="button" className="mobile-transform-handle" aria-label={label} title={label}
    onTouchStart={e => { e.stopPropagation(); if (e.touches.length === 1) onDrag(e); }}
    onPointerDown={e => { e.stopPropagation(); if (e.pointerType !== 'touch' && e.button === 0) onDrag(e); }}>
    <span aria-hidden="true"><Icon name={icon} size={16} stroke={1.8} /></span>
  </button>;
}

function MobileSelectionOverlay({ el, scale, onResize, onMove }) {
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
        <div aria-hidden="true" style={{
          position: 'absolute', left: '50%', top: '50%',
          width: Math.max(bw, 56), height: Math.max(bh, 56),
          transform: 'translate(-50%,-50%)', pointerEvents: 'auto', touchAction: 'none',
        }}
          onTouchStart={(e) => { onMove(e); }}
          onPointerDown={(e) => { if (e.pointerType !== 'touch') onMove(e); }} />
      )}
      {handles.filter(h => !keepsAspectOnResize(el) || h.key.length === 2).map(h => (
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
            width: h.side ? 6 : 10, height: h.side ? 16 : 10,
            transform: 'translate(-50%,-50%)',
            background: 'white', border: '1.5px solid var(--pink-500)',
            borderRadius: h.side ? 999 : 4, boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)', pointerEvents: 'none',
          }} />
        </button>
      ))}
    </div>
  );
}

function MobileRibbon({ label, children, end, showScrollButton = true }) {
  const scrollRef = meR(null);
  const [edges, setEdges] = meS({ before: false, after: false });
  meE(() => {
    if (!showScrollButton) return;
    const scroll = scrollRef.current;
    const measure = () => {
      const before = scroll.scrollLeft > 2;
      const after = scroll.scrollLeft + scroll.clientWidth < scroll.scrollWidth - 2;
      setEdges(old => old.before === before && old.after === after ? old : { before, after });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(scroll.firstElementChild);
    scroll.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', measure);
    };
  }, [showScrollButton]);
  const forward = edges.after || !edges.before;
  return (
    <div className="mobile-ribbon" role="toolbar" aria-label={label}>
      <div className="mobile-ribbon-scroll" data-ribbon-scroll ref={scrollRef}>
        <div className="mobile-ribbon-items">{children}</div>
      </div>
      {showScrollButton && <button className="mobile-ribbon-pin mobile-ribbon-arrow"
        aria-label={forward ? 'Scroll tools forward' : 'Scroll tools back'}
        disabled={!edges.after && !edges.before}
        onClick={() => {
          const scroll = scrollRef.current;
          scroll.scrollBy({ left: (forward ? 1 : -1) * scroll.clientWidth * 0.8 });
        }}>
        <span style={{ display: 'inline-flex', transform: forward ? undefined : 'scaleX(-1)' }}>
          <Icon name="chevron_r" size={16} />
        </span>
      </button>}
      {end}
    </div>
  );
}

function MobilePageTools({ activeTool, onOpen }) {
  const tools = [
    ['text', 'text', 'Add text'],
    ['images', 'images', 'Image'],
    ['icons', 'images', 'Illustrations'],
    ['bg', 'bg', 'Background'],
    ['pages', 'copy', 'Pages'],
    ['templates', 'templates', 'Templates'],
    ['shapes', 'shapes', 'Shapes'],
    ['frames', 'frames', 'Frames'],
  ];
  return (
    <>
      {tools.map(([id, icon, label]) => (
        <button key={id} className="mobile-ribbon-tool mobile-ribbon-page-tool"
          aria-expanded={activeTool === id} onClick={() => onOpen(id)}>
          <Icon name={icon} size={18} />
          <span>{label}</span>
        </button>
      ))}
    </>
  );
}

// ======================================================================
// SELECTION TOOLBAR + LIVE TOOL TRAY (phone)
// The toolbar is one flat, horizontally scrollable row. Every button shows its
// current value (font name, size, colour) so you can read the state at a glance.
// ======================================================================
const SHAPE_TYPES = ['rect', 'circle', 'triangle', 'star', 'heart', 'diamond', 'polygon'];

// Which tray tools make sense for each kind of item.
function trayToolsFor(el) {
  if (el.type === 'text') return ['font', 'size', 'colour', 'styles', 'format', 'opacity', 'position'];
  if (el.type === 'image') return ['size', ...(isIllustration(el) ? ['flip'] : []), 'replace-artwork', 'adjust', 'opacity', 'position'];
  if (el.type === 'icon') return ['colour', 'size', 'flip', 'replace-icon', 'opacity', 'position'];
  if (el.type === 'frame') return ['size', 'frame', 'opacity', 'position'];
  return ['colour', 'size', 'opacity', 'position'];
}
const TRAY_LABELS = { styles: 'Text styles', font: 'Font', size: 'Size', colour: 'Colour', format: 'Spacing', opacity: 'Opacity', position: 'Position', flip: 'Flip', adjust: 'Adjust image', frame: 'Frame', 'replace-icon': 'Change icon', 'replace-artwork': 'Replace artwork' };
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
        flex: '0 0 auto', width: 48, minHeight: 48, padding: '4px 2px', borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        background: active ? 'var(--pink-100)' : 'transparent',
        color: active ? 'var(--pink-600)' : 'var(--ink-2)',
      }}>
      <span style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>{children}</span>
      <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '.01em' }}>{label}</span>
    </button>
  );
}

function MobileIconAction({ label, icon, onClick, disabled, pressed, iconStyle }) {
  return <button type="button" className="mobile-ribbon-tool mobile-ribbon-icon"
    aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
    <Icon name={icon} size={19} style={iconStyle} />
  </button>;
}

function MobileSelectionTools({ el, activeTool, onTool }) {
  const {dispatch}=useStore();
  const locked = !!el.locked;
  const change=patch=>{if(!locked&&patch)dispatch({type:'update-element',id:el.id,patch});};
  const chip = 'mobile-ribbon-tool';
  const tool=(label,key,content=label)=><button className={chip} aria-label={label} aria-expanded={key === 'words' ? undefined : activeTool===key} disabled={locked&&key!=='position'} onClick={()=>onTool(key)}>{content}</button>;
  const update = patch => dispatch({ type: 'update-element', id: el.id, patch });
  return <>
    {el.type==='text'?<>
      {tool('Edit words','words')}
      {tool('Font: '+el.fontFamily,'font',<span style={{fontFamily:el.fontFamily,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{el.fontFamily}</span>)}
      {tool('Font size','size',Math.round(el.fontSize)+' px')}
      {tool('Text colour','colour',<><span className="mobile-ribbon-swatch" style={{background:el.color}}/>Colour</>)}
      <button className={chip} aria-label="Bold" aria-pressed={isBoldText(el)} disabled={locked||!boldWeightFor(el.fontFamily)} onClick={()=>change(toggleBoldPatch(el))}><b>B</b></button>
      <button className={chip} aria-label="Italic" aria-pressed={!!el.italic} disabled={locked} onClick={()=>change({italic:!el.italic})}><i>I</i></button>
      <button className={chip} aria-label="Underline" aria-pressed={!!el.underline} disabled={locked} onClick={()=>change({underline:!el.underline})}><u>U</u></button>
      <button className={chip} aria-label={'Alignment: '+el.align} disabled={locked} onClick={()=>change({align:el.align==='left'?'center':el.align==='center'?'right':'left'})}><Icon name={el.align==='center'?'align_c':el.align==='right'?'align_r':'align_l'} size={16}/></button>
      {tool('Text styles','styles')}
      {tool('Weight and spacing','format','Spacing')}
    </>:<>
      {isIllustration(el) && tool('Flip','flip')}
      {tool('Size','size')}
      {trayToolsFor(el).includes('colour') && tool('Colour','colour',<><span className="mobile-ribbon-swatch" style={{background:el[colourKey(el)]}}/>Colour</>)}
      {el.type==='image' && tool('Adjust image','adjust')}
      {el.type==='image' && tool('Replace artwork','replace-artwork')}
      {el.type==='icon' && tool('Change icon','replace-icon')}
      {el.type==='frame' && tool('Frame','frame')}
    </>}
    {tool('Position','position')}
    {tool('Opacity','opacity')}
    <MobileIconAction label="Duplicate element" icon="duplicate" onClick={() => dispatch({ type: 'duplicate-elements', ids: [el.id] })} />
    <MobileIconAction label={el.locked ? 'Unlock' : 'Lock'} icon={el.locked ? 'unlock' : 'lock'} onClick={() => update({ locked: !el.locked })} />
    <MobileIconAction label={el.hidden ? 'Show' : 'Hide'} icon={el.hidden ? 'eye' : 'eye_off'} onClick={() => update({ hidden: !el.hidden })} />
    <MobileIconAction label="Delete element" icon="trash" onClick={() => dispatch({ type: 'delete-elements', ids: [el.id] })} />
  </>;
}

function MobileToolTray({ el, tool, onClose }) {
  const {dispatch}=useStore();
  const update = patch => dispatch({type:'update-element',id:el.id,patch});
  const label = TRAY_LABELS[tool];
  return (
    <section className="mobile-ribbon-panel" aria-label={label + ' controls'}>
      <header>
        <strong>{label}</strong>
        <button className="mobile-ribbon-pin" aria-label={'Close ' + label + ' controls'} onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
      </header>
      <div className="mobile-ribbon-panel-body">
        {tool === 'styles' && <>
          <TextLookPicker el={el} update={update} />
          <SlideTextStyleControls el={el} update={update} />
        </>}
        {tool === 'font' && <FontPicker el={el} maxHeight={Math.round((window.visualViewport?.height || window.innerHeight) * 0.27)} />}
        {tool === 'size' && <SizeTool el={el} />}
        {tool === 'colour' && <ColourTool el={el} />}
        {tool === 'format' && <FormatTool el={el} />}
        {tool === 'opacity' && <OpacityTool el={el} />}
        {tool === 'position' && <PositionTool el={el} />}
        {tool === 'flip' && <div className="mobile-ribbon-icon-group" role="group" aria-label="Flip illustration">
          <MobileIconAction label="Flip horizontal" icon="flip_horizontal" pressed={!!el.flipX} onClick={() => update({ flipX: !el.flipX })} />
          <MobileIconAction label="Flip vertical" icon="flip_vertical" pressed={!!el.flipY} onClick={() => update({ flipY: !el.flipY })} />
        </div>}
        {tool === 'adjust' && <ImageProps el={el} update={update} showFlip={false} />}
        {tool === 'frame' && <FrameProps el={el} update={update} />}
        {tool === 'replace-icon' && <IconLibraryGrid selected={el.name} accent={el.iconAccent||'none'} onChoose={name=>update({name})} />}
        {tool === 'replace-artwork' && <IconsPanel replacement={el} onReplaced={onClose} />}
      </div>
    </section>
  );
}

// ---- Colour ----
function ColourTool({ el }) {
  const { dispatch } = useStore();
  const update = patch => dispatch({ type: 'update-element', id: el.id, patch });
  if (SHAPE_TYPES.includes(el.type)) return <ShapeProps el={el} update={update} />;
  if (el.type === 'icon') return <IconProps el={el} update={update} showFlip={false} showLibrary={false} />;
  const key = colourKey(el);
  return <ColorPicker value={el[key]} onChange={v => update({ [key]: v })} />;
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
        <button className="btn btn-tonal" onClick={() => dispatch({
          type: 'update-element', id: el.id, patch: { fontSize: fitTextSize(el, el.h, 400) },
        })}>Fit to box</button>
      </div>
    );
  }
  if (isBrandLogo(el)) {
    const update = patch => dispatch({ type: 'update-element', id: el.id, patch });
    return <BrandLogoSizeControl el={el} update={update} />;
  }
  // Scale about the centre, keeping the shape's proportions.
  const ratio = el.h / Math.max(1, el.w);
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  const maxW = Math.round(Math.max(canvas.w * 1.2, el.w));
  const apply = (nw) => ({ x: cx - nw / 2, y: cy - (nw * ratio) / 2, w: nw, h: nw * ratio });
  const setDimension = (key, value) => {
    if (value === '' || !Number.isFinite(Number(value))) return;
    const size = Math.max(10, Number(value));
    const patch = isIllustration(el) ? apply(key === 'w' ? size : size / ratio) : { [key]: size };
    dispatch({ type: 'update-element', id: el.id, patch });
  };
  const isLine = el.type === 'line' || el.type === 'arrow';
  return (
    <div>
      <SliderRow label="Size" value={Math.round(el.w)} min={24} max={maxW} step={2} unit=" px"
        onLive={v => live(apply(v))} onDone={done}
        onStep={d => dispatch({ type: 'update-element', id: el.id, patch: apply(clamp(el.w + d, 24, maxW)) })} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <LabeledInput label="Width" value={Math.round(el.w)} onChange={v => setDimension('w', v)} />
        <LabeledInput label="Height" value={Math.round(el.h)} onChange={v => setDimension('h', v)} />
      </div>
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
  const update = patch => dispatch({ type: 'update-element', id: el.id, patch });
  const ls = Number(el.letterSpacing || 0), lh = Number(el.lineHeight || 1.2);
  return <div>
    <SectionLabel>Weight</SectionLabel>
    <WeightChips el={el} update={update} />
    <SliderRow label="Letter spacing" value={ls} min={-2} max={30} step={0.5}
      onLive={v => live({ letterSpacing: v })} onDone={done}
      onStep={d => update({ letterSpacing: clamp(ls + d, -2, 30) })} />
    <SliderRow label="Line spacing" value={Math.round(lh * 100) / 100} min={0.8} max={2.4} step={0.05}
      onLive={v => live({ lineHeight: v })} onDone={done}
      onStep={d => update({ lineHeight: Math.round(clamp(lh + d, 0.8, 2.4) * 100) / 100 })} />
  </div>;
}

function PositionTool({ el }) {
  const { state, dispatch } = useStore();
  const [step, setStep] = meS(10);
  const canvas = activeCanvas(state);
  const index = canvas.elements.findIndex(item => item.id === el.id);
  const last = canvas.elements.length - 1;
  const move = to => dispatch({ type: 'reorder-element', id: el.id, to });
  const update = patch => dispatch({ type: 'update-element', id: el.id, patch });
  const setCoordinate = (key, value) => {
    if (value !== '' && Number.isFinite(Number(value))) update({ [key]: Number(value) });
  };
  const layerActions = [
    ['Move forward one layer', 'layer_forward', index + 1, index === last],
    ['Move backward one layer', 'layer_backward', index - 1, index === 0],
    ['Bring to front', 'layer_front', last, index === last],
    ['Send to back', 'layer_back', 0, index === 0],
  ];
  const aligns = [
    ['left', 'Align left to slide', 'align_l'],
    ['hcenter', 'Centre horizontally on slide', 'align_c'],
    ['right', 'Align right to slide', 'align_r'],
    ['top', 'Align top to slide', 'align_top'],
    ['vmiddle', 'Centre vertically on slide', 'align_middle'],
    ['bottom', 'Align bottom to slide', 'align_bottom'],
  ];
  const nudges = [
    ['Nudge left', 'arrow', -step, 0, { transform: 'rotate(180deg)' }],
    ['Nudge right', 'arrow', step, 0],
    ['Nudge up', 'arrow_up', 0, -step],
    ['Nudge down', 'arrow_down', 0, step],
  ];
  return <>
    <MobileRibbon label="Position actions">
      <div className="mobile-ribbon-icon-group" role="group" aria-label="Layer order">
        {layerActions.map(([label, icon, to, disabled]) =>
          <MobileIconAction key={icon} label={label} icon={icon} disabled={disabled} onClick={() => move(to)} />)}
      </div>
      <span className="mobile-ribbon-divider" aria-hidden="true" />
      <div className="mobile-ribbon-icon-group" role="group" aria-label="Align to slide">
        {aligns.map(([pos, label, icon]) =>
          <MobileIconAction key={pos} label={label} icon={icon} disabled={el.locked}
            onClick={() => alignElementsToPage(state, dispatch, pos)} />)}
      </div>
      <span className="mobile-ribbon-divider" aria-hidden="true" />
      <div className="mobile-ribbon-icon-group" role="group" aria-label="Nudge">
        {nudges.map(([label, icon, dx, dy, iconStyle]) =>
          <MobileIconAction key={label} label={label} icon={icon} iconStyle={iconStyle} disabled={el.locked}
            onClick={() => update({ x: el.x + dx, y: el.y + dy })} />)}
      </div>
    </MobileRibbon>
    {!el.locked && <div className="mobile-position-values">
      <LabeledInput label="X" value={Math.round(el.x)} onChange={v => setCoordinate('x', v)} />
      <LabeledInput label="Y" value={Math.round(el.y)} onChange={v => setCoordinate('y', v)} />
      <LabeledInput label="Rotation" value={Math.round(el.rot || 0)} suffix="°" onChange={v => setCoordinate('rot', v)} />
      <label>Nudge step
        <select className="pk-select" value={step} onChange={e => setStep(Number(e.target.value))}>
          {[2, 10, 40].map(pixels => <option key={pixels} value={pixels}>{pixels} px</option>)}
        </select>
      </label>
    </div>}
  </>;
}

function MobilePagesOverview({ onClose }) {
  const { state, dispatch } = useStore();
  const project = activeProject(state);
  const dialog = meR(null);
  const [menuId, setMenuId] = meS(null);

  meE(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  const run = action => {
    dispatch(action);
    dispatch({ type: 'set-selection', ids: [] });
    setMenuId(null);
  };

  return <dialog ref={dialog} className="mobile-pages-overview" aria-labelledby="mobile-pages-title"
    onCancel={e => { e.preventDefault(); onClose(); }}>
    <header className="safe-top">
      <h2 id="mobile-pages-title">Slides</h2>
      <button className="icon-btn" aria-label="Close slides" onClick={onClose}><Icon name="x" size={20} /></button>
    </header>
    <div className="mobile-pages-grid">
      {project.canvases.map((page, index) => {
        const active = page.id === project.activeCanvasId;
        const menuOpen = menuId === page.id;
        return <section key={page.id} className="mobile-page-tile">
          <button className="mobile-page-preview" aria-label={`Open slide ${index + 1}`}
            aria-current={active ? 'page' : undefined} onClick={() => {
              dispatch({ type: 'set-active-canvas', id: page.id });
              onClose();
            }}>
            <MiniPreview canvas={page} fluid />
          </button>
          <div className="mobile-page-caption">
            <span>Slide {index + 1}</span>
            <button className="icon-btn" aria-label={`Actions for slide ${index + 1}`}
              aria-expanded={menuOpen} onClick={() => setMenuId(menuOpen ? null : page.id)}>
              <Icon name="more" size={20} />
            </button>
          </div>
          {menuOpen && <div className="mobile-page-actions" role="group" aria-label={`Slide ${index + 1} actions`}>
            <button onClick={() => run({ type: 'duplicate-canvas', id: page.id })}>Duplicate slide</button>
            <button disabled={index === 0} onClick={() => run({ type: 'reorder-canvas', from: index, to: index - 1 })}>Move earlier</button>
            <button disabled={index === project.canvases.length - 1} onClick={() => run({ type: 'reorder-canvas', from: index, to: index + 1 })}>Move later</button>
            <button disabled={page.elements.length === 0} onClick={() => {
              if (confirm('Remove all elements on this slide?')) run({ type: 'update-canvas', id: page.id, patch: { elements: [] } });
            }}>Clear slide</button>
            <button disabled={project.canvases.length === 1} onClick={() => {
              if (confirm('Delete this slide? You can restore it with Undo.')) run({ type: 'delete-canvas', id: page.id });
            }}>Delete slide</button>
          </div>}
        </section>;
      })}
      <button className="mobile-add-page" onClick={() => run({ type: 'add-canvas' })}>
        <Icon name="plus" size={20} /> Add slide
      </button>
    </div>
  </dialog>;
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
  MobileCanvasArea, MobileSelectionOverlay, MobilePagesOverview, MobileDownloadOptions, MobileRenameSheet,
});

function MobileWordsDialog({draft,onChange,onCancel,onDone}) {
  const { state } = useStore();
  const [improving, setImproving] = meS(false);
  const [error, setError] = meS('');
  const field=meR(null),cancel=meR(null),done=meR(null),dialog=meR(null),improveButton=meR(null);
  meE(()=>{
    const previous=document.activeElement;
    const siblings=[...dialog.current.parentElement.children].filter(el=>el!==dialog.current);
    const old=siblings.map(el=>el.inert);
    siblings.forEach(el=>{el.inert=true;});
    field.current?.focus({preventScroll:true});
    return ()=>{siblings.forEach((el,i)=>{el.inert=old[i];});previous?.focus?.({preventScroll:true});};
  },[]);
  const keys=e=>{
    if(e.key==='Escape'){e.preventDefault();onCancel();}
    if(e.key==='Tab'){
      const items=[cancel.current,done.current,field.current,improveButton.current].filter(el=>el&&!el.disabled);
      const i=items.indexOf(document.activeElement);
      e.preventDefault();items[(i+(e.shiftKey?items.length-1:1))%items.length]?.focus();
    }
  };
  const improve = async () => {
    const input = draft.text;
    setImproving(true);
    setError('');
    try {
      const text = await aiGenerate({
        brand: state.brand, vocab: state.vocab, provider: 'gemini',
        task: 'Improve this one carousel text element. Keep the meaning. Return only the revised words, without labels or commentary.',
        input, platform: 'Instagram carousel',
      });
      if (!text?.trim()) throw new Error('No revised text returned.');
      if (field.current?.value === input) onChange(text.trim());
    } catch (err) {
      setError(err.message || 'AI could not rewrite this just now.');
    } finally {
      setImproving(false);
    }
  };
  return <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="mobile-words-title" onKeyDown={keys}
    style={{position:'fixed',inset:0,height:'var(--studio-viewport-height, 100dvh)',zIndex:2000,background:'var(--cream, #fff)',display:'flex',flexDirection:'column',boxSizing:'border-box',paddingTop:'env(safe-area-inset-top, 0px)'}}>
    <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'8px 12px',borderBottom:'1px solid var(--line)',flexShrink:0}}>
      <button ref={cancel} className="btn btn-ghost" style={{minHeight:44}} onClick={onCancel}>Cancel</button>
      <span id="mobile-words-title">Edit words</span>
      <button ref={done} className="btn btn-primary" style={{minHeight:44}} onClick={onDone}>Done</button>
    </header>
    <textarea ref={field} aria-label="Edit selected words" value={draft.text} onChange={e=>onChange(e.target.value)}
      style={{flex:1,minHeight:0,width:'100%',boxSizing:'border-box',resize:'none',border:0,padding:20,font:'18px/1.6 Montserrat, sans-serif',color:'var(--ink)',background:'transparent',outlineOffset:-3}} />
    <footer style={{padding:'6px 12px',borderTop:'1px solid var(--line)'}}>
      <button ref={improveButton} className="btn btn-tonal" disabled={improving||!draft.text.trim()} onClick={improve}>
        {improving?'Improving…':'Improve with AI'}
      </button>
      {error&&<p role="alert">{error}</p>}
    </footer>
  </div>;
}


