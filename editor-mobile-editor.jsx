// Mobile editor screen — canvas fills viewport, tools open as bottom sheets,
// selection triggers a compact properties bar at the bottom.

const { useState: meS, useEffect: meE, useRef: meR, useMemo: meM } = React;

function MobileEditor() {
  const { state, dispatch } = useStore();
  const proj = activeProject(state);
  const canvas = activeCanvas(state);

  const [openSheet, setOpenSheet] = meS(null); // 'templates'|'brand'|'text'|'shapes'|'images'|'icons'|'frames'|'bg'|'more'|'pages'|'layers'|'properties'|'menu'|'download'|'rename'
  const [longPressMenu, setLongPressMenu] = meS(false);

  meE(() => { if (!state.tool) dispatch({ type: 'set-tool', tool: 'templates' }); }, []);

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

  const primaryEl = canvas.elements.find(e => e.id === state.selection[0]);

  const openTool = (tool) => {
    dispatch({ type: 'set-tool', tool });
    setOpenSheet(tool);
  };

  const closeSheet = () => setOpenSheet(null);

  return (
    <div style={{
      height: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--pink-100)',
    }}>
      {/* Top bar */}
      <MobileEditorTopBar proj={proj} canvas={canvas}
        onBack={() => dispatch({ type: 'close-project' })}
        onMenu={() => setOpenSheet('menu')}
        onRename={() => setOpenSheet('rename')}
        onDownload={() => setOpenSheet('download')}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
      />

      {/* Pages strip */}
      <MobilePagesStrip proj={proj} onOpen={() => setOpenSheet('pages')} />

      {/* Canvas area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MobileCanvasArea onLongPress={() => setLongPressMenu(true)} />
      </div>

      {/* Selection properties bar */}
      {primaryEl && !openSheet && (
        <MobileSelectionBar el={primaryEl}
          onOpenProperties={() => setOpenSheet('properties')}
          onDuplicate={() => dispatch({ type: 'duplicate-elements', ids: [primaryEl.id] })}
          onDelete={() => dispatch({ type: 'delete-elements', ids: [primaryEl.id] })}
          onDeselect={() => dispatch({ type: 'set-selection', ids: [] })}
        />
      )}

      {/* Bottom tool bar */}
      {!primaryEl && (
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

      {/* Properties sheet */}
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
          <SheetAction icon="bg" label="Background"
            onClick={() => { closeSheet(); setTimeout(() => openTool('bg'), 100); }} />
          <SheetAction icon="brand_kit" label="Brand kit"
            onClick={() => { closeSheet(); setTimeout(() => openTool('brand'), 100); }} />
          <SheetAction icon="templates" label="Templates"
            onClick={() => { closeSheet(); setTimeout(() => openTool('templates'), 100); }} />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <SheetAction icon="layer" label="Layers"
            onClick={() => { closeSheet(); setTimeout(() => setOpenSheet('layers'), 100); }} />
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
      <BottomSheet open={openSheet === 'download'} onClose={closeSheet}
        title="Download" height="auto">
        <MobileDownloadOptions proj={proj} canvas={canvas} onDone={closeSheet} />
      </BottomSheet>

      {/* Rename */}
      {openSheet === 'rename' && (
        <MobileRenameSheet proj={proj} onClose={closeSheet}
          onRename={n => { dispatch({ type: 'rename-project', id: proj.id, name: n }); closeSheet(); }} />
      )}

      {/* Long-press context menu */}
      {longPressMenu && primaryEl && (
        <BottomSheet open onClose={() => setLongPressMenu(false)}
          title={typeLabel(primaryEl.type)} height="auto">
          <div style={{ display: 'grid', gap: 4, paddingBottom: 8 }}>
            <SheetAction icon="duplicate" label="Duplicate"
              onClick={() => { dispatch({ type: 'duplicate-elements', ids: [primaryEl.id] }); setLongPressMenu(false); }} />
            <SheetAction icon="arrow_up" label="Bring to front"
              onClick={() => { dispatch({ type: 'reorder-element', id: primaryEl.id,
                to: canvas.elements.length - 1 }); setLongPressMenu(false); }} />
            <SheetAction icon="arrow_down" label="Send to back"
              onClick={() => { dispatch({ type: 'reorder-element', id: primaryEl.id, to: 0 }); setLongPressMenu(false); }} />
            <SheetAction icon="lock" label={primaryEl.locked ? 'Unlock' : 'Lock'}
              onClick={() => { dispatch({ type: 'update-element', id: primaryEl.id,
                patch: { locked: !primaryEl.locked } }); setLongPressMenu(false); }} />
            <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
            <SheetAction icon="trash" label="Delete" danger
              onClick={() => { dispatch({ type: 'delete-elements', ids: [primaryEl.id] }); setLongPressMenu(false); }} />
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function MobileEditorTopBar({ proj, canvas, onBack, onMenu, onRename, onDownload, onUndo, onRedo, canUndo, canRedo }) {
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
  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto',
      padding: '8px 12px', background: 'white',
      borderBottom: '1px solid var(--line)',
      flexShrink: 0,
    }} className="scroll">
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
            }} />
            <div style={{ fontSize: 9, color: active ? 'var(--pink-500)' : 'var(--ink-3)',
              fontWeight: active ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </div>
          </button>
        );
      })}
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

function MobileCanvasArea({ onLongPress }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const stageRef = meR(null);
  const [pan, setPan] = meS({ x: 0, y: 0 });
  const [guides, setGuides] = meS([]);
  const startDataRef = meR(null);
  const gestureRef = meR(null);
  const longPressRef = meR(null);
  const [editingId, setEditingId] = meS(null);

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
    const z = Math.min(availW / canvas.w, availH / canvas.h);
    dispatch({ type: 'set-zoom', zoom: clamp(z, 0.05, 4) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas?.id]);

  const prevZoom = meR(state.zoom);
  meE(() => {
    if (!stageRef.current) return;
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
    e.stopPropagation();
    if (e.touches && e.touches.length > 1) return; // ignore multi-touch on element
    const el = canvas.elements.find(x => x.id === elId);
    if (el?.locked) return;

    // Set selection immediately
    if (!state.selection.includes(elId)) {
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
      if (Math.abs(dx) + Math.abs(dy) > 4) {
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
      if (startDataRef.current?.moved) {
        dispatch({ type: 'commit-transient', snapshot: startDataRef.current.canvasSnapshot });
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
    e.stopPropagation();
    const el = canvas.elements.find(x => x.id === elId);
    if (!el) return;
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
        const scale = Math.min(nw / startData.orig.w, nh / startData.orig.h);
        patch.fontSize = Math.max(6, Math.round((startData.orig.fontSize || 24) * scale));
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

  // Stage-level touch (pinch zoom, pan, tap-empty to deselect)
  const onStageTouchStart = (e) => {
    if (e.target.dataset.canvasBg && e.touches.length === 1) {
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
              onDoubleClick={() => { if (el.type === 'text') setEditingId(el.id); }}
              style={{ position: 'absolute', left: 0, top: 0,
                cursor: el.locked ? 'not-allowed' : 'move' }}
            >
              <ElementView el={el} selected={state.selection.includes(el.id)}
                dispatch={dispatch} scale={state.zoom}
                editing={editingId === el.id} setEditing={setEditingId} />
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
            onResize={(handle, e) => startResize(e, primary.id, handle)} />
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

function MobileSelectionOverlay({ el, scale, onResize }) {
  const style = {
    position: 'absolute',
    left: el.x * scale, top: el.y * scale,
    width: el.w * scale, height: el.h * scale,
    transform: `rotate(${el.rot}deg)`,
    transformOrigin: 'center center',
    pointerEvents: 'none',
  };
  // Only show 4 corner handles on mobile (bigger)
  const handles = [
    { key: 'nw', style: { left: -9, top: -9, cursor: 'nwse-resize' } },
    { key: 'ne', style: { right: -9, top: -9, cursor: 'nesw-resize' } },
    { key: 'se', style: { right: -9, bottom: -9, cursor: 'nwse-resize' } },
    { key: 'sw', style: { left: -9, bottom: -9, cursor: 'nesw-resize' } },
  ];
  return (
    <div style={style}>
      <div style={{ position: 'absolute', inset: 0, outline: '2px solid var(--pink-500)' }} />
      {handles.map(h => (
        <div key={h.key}
          style={{
            position: 'absolute', width: 18, height: 18,
            background: 'white', border: '2px solid var(--pink-500)',
            borderRadius: 4, boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            pointerEvents: 'auto',
            touchAction: 'none',
            ...h.style,
          }}
          onTouchStart={(e) => { e.stopPropagation(); onResize(h.key, e); }}
          onPointerDown={(e) => { if (e.pointerType !== 'touch') { e.stopPropagation(); onResize(h.key, e); } }}
        />
      ))}
    </div>
  );
}

function MobileEditorBottomBar({ activeTool, onOpen, onMore }) {
  const tools = [
    { id: 'templates', icon: 'templates', label: 'Layout' },
    { id: 'text', icon: 'text', label: 'Text' },
    { id: 'shapes', icon: 'shapes', label: 'Shapes' },
    { id: 'images', icon: 'images', label: 'Image' },
    { id: 'icons', icon: 'icons', label: 'Icons' },
  ];
  return (
    <div className="safe-bottom" style={{
      display: 'flex', background: 'white',
      borderTop: '1px solid var(--line)',
      flexShrink: 0, padding: '4px 4px',
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
        <span style={{ fontSize: 9, fontWeight: 500 }}>More</span>
      </button>
    </div>
  );
}

function MobileSelectionBar({ el, onOpenProperties, onDuplicate, onDelete, onDeselect }) {
  return (
    <div className="safe-bottom" style={{
      display: 'flex', gap: 4, padding: '8px 12px',
      background: 'white', borderTop: '1px solid var(--line)',
      flexShrink: 0, alignItems: 'center', zIndex: 15,
    }}>
      <div style={{ flex: 1, minWidth: 0, padding: '0 4px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {typeLabel(el.type)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
          {Math.round(el.w)}×{Math.round(el.h)}
        </div>
      </div>
      <button className="icon-btn" onClick={onOpenProperties}
        style={{ background: 'var(--pink-100)', color: 'var(--pink-600)' }}>
        <Icon name="templates" size={18} />
      </button>
      <button className="icon-btn" onClick={onDuplicate}>
        <Icon name="duplicate" size={18} />
      </button>
      <button className="icon-btn" onClick={onDelete}>
        <Icon name="trash" size={18} />
      </button>
      <button className="icon-btn" onClick={onDeselect}>
        <Icon name="x" size={18} />
      </button>
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
  MobileEditor, MobileEditorTopBar, MobilePagesStrip,
  MobileCanvasArea, MobileSelectionOverlay, MobileEditorBottomBar,
  MobileSelectionBar, MobilePagesList, MobileDownloadOptions, MobileRenameSheet,
});
