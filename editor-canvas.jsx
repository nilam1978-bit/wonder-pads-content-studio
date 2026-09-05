// Canvas rendering + element rendering + interactions
const { useEffect: uE, useRef: uR, useState: uS, useCallback: uCB, useMemo: uM } = React;

// ---------------- ELEMENT RENDERER ----------------
function ElementView({ el, selected, dispatch, scale, editing, setEditing }) {
  if (el.hidden) return null;

  const style = {
    position: 'absolute',
    left: el.x, top: el.y, width: el.w, height: el.h,
    transform: `rotate(${el.rot}deg)`,
    transformOrigin: 'center center',
    opacity: el.opacity,
    pointerEvents: el.locked ? 'none' : 'auto',
  };

  const commonProps = {
    'data-el-id': el.id,
    style,
    className: 'element',
  };

  if (el.type === 'text') {
    return (
      <div {...commonProps}>
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => {
            setEditing(null);
            dispatch({ type: 'update-element', id: el.id, patch: { text: e.currentTarget.innerText } });
          }}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
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
            cursor: editing ? 'text' : 'move',
            userSelect: editing ? 'text' : 'none',
            padding: '4px',
            boxSizing: 'border-box',
            wordBreak: 'break-word',
          }}
        >
          {el.text}
        </div>
      </div>
    );
  }

  if (el.type === 'rect') {
    return (
      <div {...commonProps}>
        <div style={{
          width: '100%', height: '100%',
          background: el.fill,
          border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke}` : 'none',
          borderRadius: el.radius,
          boxSizing: 'border-box',
        }} />
      </div>
    );
  }

  if (el.type === 'circle') {
    return (
      <div {...commonProps}>
        <div style={{
          width: '100%', height: '100%',
          background: el.fill,
          border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke}` : 'none',
          borderRadius: '50%',
          boxSizing: 'border-box',
        }} />
      </div>
    );
  }

  if (el.type === 'triangle') {
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,5 95,95 5,95" fill={el.fill}
            stroke={el.stroke} strokeWidth={el.strokeWidth} />
        </svg>
      </div>
    );
  }

  if (el.type === 'diamond') {
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,5 95,50 50,95 5,50" fill={el.fill}
            stroke={el.stroke} strokeWidth={el.strokeWidth} />
        </svg>
      </div>
    );
  }

  if (el.type === 'star') {
    const pts = starPoints(50, 50, 45, 20, 5);
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points={pts} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />
        </svg>
      </div>
    );
  }

  if (el.type === 'heart') {
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox="0 0 24 24" preserveAspectRatio="none">
          <path d="M12 21s-8-5.3-8-11.5A5.5 5.5 0 0112 5a5.5 5.5 0 018 4.5C20 15.7 12 21 12 21z"
            fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />
        </svg>
      </div>
    );
  }

  if (el.type === 'polygon') {
    const pts = polygonPoints(50, 50, 48, el.sides || 6, -90);
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points={pts} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />
        </svg>
      </div>
    );
  }

  if (el.type === 'line') {
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none">
          <line x1="0" y1={el.h/2} x2={el.w} y2={el.h/2}
            stroke={el.stroke} strokeWidth={el.strokeWidth} strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (el.type === 'arrow') {
    return (
      <div {...commonProps}>
        <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} preserveAspectRatio="none">
          <defs>
            <marker id={`arrow-${el.id}`} viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill={el.stroke} />
            </marker>
          </defs>
          <line x1="4" y1={el.h/2} x2={el.w - 8} y2={el.h/2}
            stroke={el.stroke} strokeWidth={el.strokeWidth} strokeLinecap="round"
            markerEnd={`url(#arrow-${el.id})`} />
        </svg>
      </div>
    );
  }

  if (el.type === 'image') {
    const f = el.filter || { brightness: 100, contrast: 100, saturate: 100, blur: 0 };
    return (
      <div {...commonProps}>
        <img src={el.src} draggable={false}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', borderRadius: el.radius,
            filter: `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  if (el.type === 'icon') {
    return (
      <div {...commonProps}>
        <div style={{ width: '100%', height: '100%', color: el.color }}>
          <Icon name={el.name} size="100%" stroke={el.strokeWidth} />
        </div>
      </div>
    );
  }

  if (el.type === 'frame') {
    const clip = el.shape === 'circle' ? '50%'
      : el.shape === 'rounded' ? '16px' : '0';
    return (
      <div {...commonProps}>
        <div style={{
          width: '100%', height: '100%',
          background: el.bg,
          borderRadius: clip,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pink-500)',
          fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase',
          border: `2px dashed rgba(194, 96, 168, 0.4)`,
          boxSizing: 'border-box',
        }}>
          {el.src ? (
            <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>Drop image</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function starPoints(cx, cy, outerR, innerR, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(' ');
}
function polygonPoints(cx, cy, r, sides, startDeg = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((Math.PI * 2) / sides) * i + (startDeg * Math.PI) / 180;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(' ');
}

// ---------------- CANVAS AREA ----------------
function CanvasArea() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const stageRef = uR(null);
  const [space, setSpace] = uS(false);
  const [panning, setPanning] = uS(false);
  const [pan, setPan] = uS({ x: 0, y: 0 });
  const [editing, setEditing] = uS(null); // element id being text-edited
  const [drag, setDrag] = uS(null); // { mode, id, startX, startY, snapshot }
  const [guides, setGuides] = uS([]);
  const startDataRef = uR(null); // { origEls, canvasSnapshot }

  // Center canvas initially
  uE(() => {
    if (!stageRef.current || !canvas) return;
    const rect = stageRef.current.getBoundingClientRect();
    const scaledW = canvas.w * state.zoom;
    const scaledH = canvas.h * state.zoom;
    setPan({
      x: (rect.width - scaledW) / 2,
      y: (rect.height - scaledH) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas?.id, canvas?.w, canvas?.h]);

  // Re-center when zoom changes significantly
  const prevZoomRef = uR(state.zoom);
  uE(() => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const oldZ = prevZoomRef.current;
    const newZ = state.zoom;
    // Zoom around center of viewport
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setPan(p => ({
      x: cx - (cx - p.x) * (newZ / oldZ),
      y: cy - (cy - p.y) * (newZ / oldZ),
    }));
    prevZoomRef.current = newZ;
  }, [state.zoom]);

  // Space bar for pan
  uE(() => {
    const kd = (e) => { if (e.code === 'Space' && !editing && !isTypingInInput(e)) { e.preventDefault(); setSpace(true); } };
    const ku = (e) => { if (e.code === 'Space') setSpace(false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [editing]);

  // Wheel zoom (with Cmd)
  const onWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      const newZoom = clamp(state.zoom * (1 + delta), 0.05, 4);
      dispatch({ type: 'set-zoom', zoom: newZoom });
    }
  };

  // Element interactions
  const startInteract = (e, mode, elId) => {
    e.stopPropagation();
    const canvasEl = canvas.elements.find(el => el.id === elId);
    if (canvasEl?.locked && mode !== 'select') return;

    // Selection
    if (mode === 'drag') {
      const already = state.selection.includes(elId);
      if (!e.shiftKey && !already) {
        dispatch({ type: 'set-selection', ids: [elId] });
      } else if (e.shiftKey) {
        dispatch({ type: 'set-selection', ids: already ? state.selection.filter(i => i !== elId) : [...state.selection, elId] });
      }
    }

    const ids = mode === 'drag' && !state.selection.includes(elId) ? [elId] : state.selection.length ? state.selection : [elId];
    const origEls = canvas.elements.filter(el => ids.includes(el.id)).map(el => ({ ...el }));

    startDataRef.current = {
      startX: e.clientX, startY: e.clientY,
      origEls,
      canvasSnapshot: JSON.parse(JSON.stringify(activeProject(state))),
      handle: mode.startsWith('resize') ? mode.slice(7) : null,
    };

    setDrag({ mode, ids });

    const move = (ev) => onInteractMove(ev, mode, ids);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDrag(null);
      setGuides([]);
      // Commit transient — push snapshot to history
      if (startDataRef.current) {
        dispatch({ type: 'commit-transient', snapshot: startDataRef.current.canvasSnapshot });
      }
      startDataRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onInteractMove = (e, mode, ids) => {
    if (!startDataRef.current) return;
    const sd = startDataRef.current;
    const dx = (e.clientX - sd.startX) / state.zoom;
    const dy = (e.clientY - sd.startY) / state.zoom;

    if (mode === 'drag') {
      // Snap on the first (primary) element
      const primary = sd.origEls[0];
      const proposedX = primary.x + dx;
      const proposedY = primary.y + dy;

      const dragBox = {
        l: proposedX, t: proposedY,
        r: proposedX + primary.w, b: proposedY + primary.h,
        cx: proposedX + primary.w / 2, cy: proposedY + primary.h / 2,
      };
      const others = canvas.elements
        .filter(el => !ids.includes(el.id))
        .map(el => ({
          l: el.x, t: el.y, r: el.x + el.w, b: el.y + el.h,
          cx: el.x + el.w / 2, cy: el.y + el.h / 2,
        }));
      const canvasBox = {
        l: 0, t: 0, r: canvas.w, b: canvas.h,
        cx: canvas.w / 2, cy: canvas.h / 2,
      };
      const snap = computeSnapGuides(dragBox, others, canvasBox, 8 / state.zoom);
      const totalDX = dx + snap.dx;
      const totalDY = dy + snap.dy;
      setGuides(snap.guides);

      // Update all selected
      sd.origEls.forEach(orig => {
        dispatch({
          type: 'update-element', id: orig.id, transient: true,
          patch: { x: orig.x + totalDX, y: orig.y + totalDY },
        });
      });
    } else if (mode.startsWith('resize')) {
      const handle = sd.handle;
      const orig = sd.origEls[0];
      let nx = orig.x, ny = orig.y, nw = orig.w, nh = orig.h;
      // Handle each corner/side
      if (handle.includes('e')) nw = Math.max(10, orig.w + dx);
      if (handle.includes('w')) { nw = Math.max(10, orig.w - dx); nx = orig.x + (orig.w - nw); }
      if (handle.includes('s')) nh = Math.max(10, orig.h + dy);
      if (handle.includes('n')) { nh = Math.max(10, orig.h - dy); ny = orig.y + (orig.h - nh); }

      // Shift = maintain ratio (corners only)
      if (e.shiftKey && (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se')) {
        const ratio = orig.w / orig.h;
        if (Math.abs(dx) > Math.abs(dy)) {
          nh = nw / ratio;
          if (handle.includes('n')) ny = orig.y + (orig.h - nh);
        } else {
          nw = nh * ratio;
          if (handle.includes('w')) nx = orig.x + (orig.w - nw);
        }
      }

      // Canva-style: for TEXT elements resized via a corner handle,
      // scale fontSize proportionally to the box size so the text visually
      // grows/shrinks with the box (instead of just re-flowing).
      const isCorner = handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se';
      const patch = { x: nx, y: ny, w: nw, h: nh };
      if (orig.type === 'text' && isCorner) {
        const scale = Math.min(nw / orig.w, nh / orig.h);
        const nextFs = Math.max(6, Math.round((orig.fontSize || 24) * scale));
        patch.fontSize = nextFs;
      }
      dispatch({ type: 'update-element', id: orig.id, transient: true, patch });
    } else if (mode === 'rotate') {
      const orig = sd.origEls[0];
      const rect = stageRef.current.getBoundingClientRect();
      // Element center in screen coords
      const cx = rect.left + pan.x + (orig.x + orig.w / 2) * state.zoom;
      const cy = rect.top + pan.y + (orig.y + orig.h / 2) * state.zoom;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
      const snapped = e.shiftKey ? Math.round(angle / 15) * 15 : angle;
      dispatch({ type: 'update-element', id: orig.id, transient: true, patch: { rot: snapped } });
    }
  };

  // Canvas click (deselect)
  const onCanvasClick = (e) => {
    if (e.target.dataset.canvasBg) {
      dispatch({ type: 'set-selection', ids: [] });
      setEditing(null);
    }
  };

  // Panning
  const onStageDown = (e) => {
    if (!space) return;
    e.preventDefault();
    setPanning(true);
    const sx = e.clientX, sy = e.clientY, pox = pan.x, poy = pan.y;
    const mv = (ev) => setPan({ x: pox + (ev.clientX - sx), y: poy + (ev.clientY - sy) });
    const up = () => {
      setPanning(false);
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };

  if (!canvas) return null;

  const selEls = canvas.elements.filter(el => state.selection.includes(el.id));
  const primary = selEls[0];

  return (
    <div
      ref={stageRef}
      onWheel={onWheel}
      onPointerDown={onStageDown}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'var(--pink-100)',
        cursor: space ? (panning ? 'grabbing' : 'grab') : 'default',
      }}
      className="checker"
    >
      {/* Canvas artboard */}
      <div style={{
        position: 'absolute',
        left: pan.x, top: pan.y,
        width: canvas.w * state.zoom,
        height: canvas.h * state.zoom,
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 2,
      }}>
        <div
          data-canvas-bg
          onClick={onCanvasClick}
          onPointerDown={(e) => { if (e.target.dataset.canvasBg && !space) dispatch({ type: 'set-selection', ids: [] }); }}
          style={{
            position: 'absolute',
            width: canvas.w, height: canvas.h,
            transform: `scale(${state.zoom})`,
            transformOrigin: 'top left',
            // Backstop white so a transparent bg reveals white, not the pink stage.
            background: '#FDFBFC',
            overflow: 'hidden',
          }}
        >
          {/* Background layer — separate div so opacity affects only the background, not elements. */}
          <div style={{
            position: 'absolute', inset: 0,
            background: renderBg(canvas.bg),
            opacity: canvas.bg?.opacity ?? 1,
            pointerEvents: 'none',
          }} />
          {canvas.elements.map(el => (
            <div key={el.id}
              onPointerDown={(e) => { if (space) return; startInteract(e, 'drag', el.id); }}
              onDoubleClick={(e) => {
                if (el.type === 'text') { setEditing(el.id); dispatch({ type: 'set-selection', ids: [el.id] }); }
              }}
              style={{ position: 'absolute', left: 0, top: 0, cursor: el.locked ? 'not-allowed' : 'move' }}
            >
              <ElementView el={el} selected={state.selection.includes(el.id)}
                dispatch={dispatch} scale={state.zoom} editing={editing === el.id} setEditing={setEditing} />
            </div>
          ))}

          {/* Snap guides */}
          {guides.map((g, i) => g.type === 'v' ? (
            <div key={i} className="snap-guide" style={{
              left: g.x - 0.5, top: -1000, width: 1, height: canvas.h + 2000,
            }} />
          ) : (
            <div key={i} className="snap-guide" style={{
              top: g.y - 0.5, left: -1000, height: 1, width: canvas.w + 2000,
            }} />
          ))}
        </div>

        {/* Selection overlay (in screen space) */}
        {primary && !editing && (
          <SelectionOverlay el={primary} scale={state.zoom}
            onHandle={(handle, e) => startInteract(e, 'resize-' + handle, primary.id)}
            onRotate={(e) => startInteract(e, 'rotate', primary.id)}
          />
        )}
      </div>

      {/* Zoom badge */}
      <div style={{
        position: 'absolute', right: 16, bottom: 16,
        background: 'white', borderRadius: 999, padding: '6px 12px',
        fontSize: 12, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {Math.round(state.zoom * 100)}%
      </div>
    </div>
  );
}

function renderBg(bg) {
  if (!bg) return '#FDFBFC';
  if (bg.type === 'color') return bg.value;
  if (bg.type === 'gradient') return bg.value;
  if (bg.type === 'image') return `url(${bg.value}) center/cover no-repeat`;
  return '#FDFBFC';
}

function SelectionOverlay({ el, scale, onHandle, onRotate }) {
  const style = {
    position: 'absolute',
    left: el.x * scale, top: el.y * scale,
    width: el.w * scale, height: el.h * scale,
    transform: `rotate(${el.rot}deg)`,
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
      <div className="sel-ring" />
      {handles.map(h => (
        <div key={h.key}
          className={'handle' + (h.key.length === 1 ? ' side' : '')}
          style={{ ...h.style, pointerEvents: 'auto' }}
          onPointerDown={(e) => { e.stopPropagation(); onHandle(h.key, e); }}
        />
      ))}
      <div className="rotate-handle"
        style={{ left: '50%', top: -32, marginLeft: -7, pointerEvents: 'auto' }}
        onPointerDown={(e) => { e.stopPropagation(); onRotate(e); }}
      />
      {/* Size badge */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -26, transform: 'translateX(-50%)',
        background: 'var(--pink-500)', color: 'white',
        fontSize: 10, padding: '3px 8px', borderRadius: 6,
        whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
      }}>
        {Math.round(el.w)} × {Math.round(el.h)}
      </div>
    </div>
  );
}

function isTypingInInput(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

Object.assign(window, { CanvasArea, ElementView, isTypingInInput });
