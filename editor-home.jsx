// Home dashboard — Recent designs, New from preset, My templates, Starter templates
const { useState: hS, useRef: hR, useEffect: hE, useMemo: hM } = React;

// Wonder Pads starter templates — actual shop moments a small handmade-pad business posts about.
// Real products, real language, real turnaround times. Not generic quote cards.
const STARTER_TEMPLATES = [
  // 1. Restock drop — the "new drop Friday" post every handmade shop makes weekly
  { name: 'New Drop Friday', preset: SIZE_PRESETS[0], bg: '#F7E1F0', accent: '#C260A8',
    els: [
      { type: 'text', patch: { text: 'FRIDAY · 8PM SGT', fontFamily: 'Instrument Sans', fontSize: 28, color: '#C260A8', x: 100, y: 130, w: 880, h: 40, align: 'left', letterSpacing: 8, fontWeight: 700 } },
      { type: 'text', patch: { text: 'new drop\nis coming.', fontFamily: 'DM Serif Display', fontSize: 180, color: '#2A1F2A', x: 100, y: 220, w: 880, h: 460, align: 'left', lineHeight: 1.05 } },
      { type: 'rect', patch: { fill: '#D98BC6', x: 100, y: 720, w: 80, h: 5, radius: 4 } },
      { type: 'text', patch: { text: '6 new prints. made-to-order.\nships in 2 weeks.', fontFamily: 'Instrument Sans', fontSize: 34, color: '#56454F', x: 100, y: 760, w: 880, h: 160, align: 'left', lineHeight: 1.45 } },
    ],
  },

  // 2. Made-to-order explainer — the #1 FAQ every handmade seller answers
  { name: 'Made-to-Order', preset: SIZE_PRESETS[0], bg: '#FDFBFC', accent: '#F1CFEA',
    els: [
      { type: 'rect', patch: { fill: '#F1CFEA', x: 0, y: 0, w: 1080, h: 380, radius: 0 } },
      { type: 'text', patch: { text: 'MADE-TO-ORDER', fontFamily: 'Instrument Sans', fontSize: 28, color: '#7d2960', x: 100, y: 150, w: 880, h: 40, align: 'left', letterSpacing: 8, fontWeight: 700 } },
      { type: 'text', patch: { text: 'why it takes\n4–6 weeks.', fontFamily: 'DM Serif Display', fontSize: 100, color: '#2A1F2A', x: 100, y: 210, w: 880, h: 260, italic: true, align: 'left', lineHeight: 1.1 } },
      { type: 'text', patch: { text: 'every pad is cut, sewn and packed by me. one woman, one studio, one order at a time.\n\nit means longer waits. it also means each one is made just for you.', fontFamily: 'Instrument Sans', fontSize: 32, color: '#56454F', x: 100, y: 540, w: 880, h: 400, align: 'left', lineHeight: 1.55 } },
    ],
  },

  // 3. Absorbency guide — the "which size do I need?" question, visualised
  { name: 'Absorbency Guide', preset: SIZE_PRESETS[0], bg: '#FBF0F7', accent: '#7d2960',
    els: [
      { type: 'text', patch: { text: 'THE GUIDE', fontFamily: 'Instrument Sans', fontSize: 24, color: '#C260A8', x: 100, y: 110, w: 880, h: 40, align: 'center', letterSpacing: 8, fontWeight: 700 } },
      { type: 'text', patch: { text: 'which absorbency\ndo you need?', fontFamily: 'DM Serif Display', fontSize: 90, color: '#2A1F2A', x: 80, y: 180, w: 920, h: 220, align: 'center', lineHeight: 1.1 } },
      { type: 'rect', patch: { fill: 'white', x: 100, y: 430, w: 880, h: 90, radius: 12 } },
      { type: 'text', patch: { text: 'liner', fontFamily: 'DM Serif Display', fontSize: 40, color: '#7d2960', x: 130, y: 450, w: 200, h: 50, align: 'left' } },
      { type: 'text', patch: { text: 'spotting, discharge, cup backup', fontFamily: 'Instrument Sans', fontSize: 26, color: '#56454F', x: 350, y: 460, w: 620, h: 40, align: 'left' } },
      { type: 'rect', patch: { fill: 'white', x: 100, y: 540, w: 880, h: 90, radius: 12 } },
      { type: 'text', patch: { text: 'light', fontFamily: 'DM Serif Display', fontSize: 40, color: '#7d2960', x: 130, y: 560, w: 200, h: 50, align: 'left' } },
      { type: 'text', patch: { text: 'light days, teens, tweens', fontFamily: 'Instrument Sans', fontSize: 26, color: '#56454F', x: 350, y: 570, w: 620, h: 40, align: 'left' } },
      { type: 'rect', patch: { fill: 'white', x: 100, y: 650, w: 880, h: 90, radius: 12 } },
      { type: 'text', patch: { text: 'regular', fontFamily: 'DM Serif Display', fontSize: 40, color: '#7d2960', x: 130, y: 670, w: 240, h: 50, align: 'left' } },
      { type: 'text', patch: { text: 'most days for most bodies', fontFamily: 'Instrument Sans', fontSize: 26, color: '#56454F', x: 380, y: 680, w: 590, h: 40, align: 'left' } },
      { type: 'rect', patch: { fill: 'white', x: 100, y: 760, w: 880, h: 90, radius: 12 } },
      { type: 'text', patch: { text: 'heavy', fontFamily: 'DM Serif Display', fontSize: 40, color: '#7d2960', x: 130, y: 780, w: 200, h: 50, align: 'left' } },
      { type: 'text', patch: { text: 'heavy days, postpartum start', fontFamily: 'Instrument Sans', fontSize: 26, color: '#56454F', x: 350, y: 790, w: 620, h: 40, align: 'left' } },
      { type: 'text', patch: { text: 'not sure? most people love a set with 2 regulars + 1 heavy + 1 overnight.', fontFamily: 'Instrument Sans', fontSize: 22, color: '#8A7684', x: 100, y: 900, w: 880, h: 60, align: 'center', italic: true, lineHeight: 1.4 } },
    ],
  },

  // 4. Product highlight — spotlighting the everyday regular (bestseller)
  { name: 'Product Spotlight', preset: SIZE_PRESETS[0], bg: '#D98BC6', accent: '#FDFBFC',
    els: [
      { type: 'text', patch: { text: 'BESTSELLER', fontFamily: 'Instrument Sans', fontSize: 24, color: '#FDFBFC', x: 100, y: 130, w: 880, h: 40, align: 'left', letterSpacing: 8, fontWeight: 700 } },
      { type: 'text', patch: { text: 'everyday\nregular.', fontFamily: 'DM Serif Display', fontSize: 200, color: '#FDFBFC', x: 100, y: 200, w: 880, h: 460, align: 'left', italic: true, lineHeight: 1.05 } },
      { type: 'rect', patch: { fill: '#FDFBFC', x: 100, y: 720, w: 880, h: 1, radius: 0 } },
      { type: 'text', patch: { text: '10"  ·  cotton woven top  ·  bamboo hemp core', fontFamily: 'Instrument Sans', fontSize: 28, color: '#FDFBFC', x: 100, y: 760, w: 880, h: 40, align: 'left', letterSpacing: 1 } },
      { type: 'text', patch: { text: '$18', fontFamily: 'DM Serif Display', fontSize: 120, color: '#FDFBFC', x: 100, y: 820, w: 400, h: 140, align: 'left' } },
      { type: 'text', patch: { text: 'wonder-pads.com', fontFamily: 'Instrument Sans', fontSize: 26, color: '#FDFBFC', x: 480, y: 880, w: 500, h: 40, align: 'right', letterSpacing: 2 } },
    ],
  },

  // 5. Customer thank-you / review card — engagement post
  { name: 'Thank You Card', preset: SIZE_PRESETS[0], bg: '#F1CFEA', accent: '#7d2960',
    els: [
      { type: 'text', patch: { text: '"', fontFamily: 'DM Serif Display', fontSize: 400, color: '#D98BC6', x: 80, y: 60, w: 300, h: 400, align: 'left' } },
      { type: 'text', patch: { text: 'switched to cloth\nsix months ago.\nI\'m never going\nback.', fontFamily: 'DM Serif Display', fontSize: 84, color: '#2A1F2A', x: 100, y: 340, w: 880, h: 460, italic: true, align: 'left', lineHeight: 1.2 } },
      { type: 'rect', patch: { fill: '#7d2960', x: 100, y: 840, w: 60, h: 3, radius: 2 } },
      { type: 'text', patch: { text: '— a wonder pads customer', fontFamily: 'Instrument Sans', fontSize: 24, color: '#56454F', x: 100, y: 870, w: 500, h: 40, align: 'left', letterSpacing: 3 } },
      { type: 'text', patch: { text: 'thank you.', fontFamily: 'Caveat', fontSize: 64, color: '#C260A8', x: 700, y: 850, w: 280, h: 80, align: 'right', italic: true } },
    ],
  },

  // 6. Story-format announcement — story-sized (Portrait 1080x1350)
  { name: 'Story Announcement', preset: SIZE_PRESETS[1], bg: '#7d2960', accent: '#FDFBFC',
    els: [
      { type: 'text', patch: { text: 'WONDER PADS  ·  RESTOCK', fontFamily: 'Instrument Sans', fontSize: 26, color: '#F1CFEA', x: 80, y: 100, w: 920, h: 40, align: 'left', letterSpacing: 6, fontWeight: 600 } },
      { type: 'text', patch: { text: 'back in\nstock.', fontFamily: 'DM Serif Display', fontSize: 260, color: '#FDFBFC', x: 80, y: 380, w: 920, h: 620, align: 'left', italic: true, lineHeight: 1 } },
      { type: 'rect', patch: { fill: '#D98BC6', x: 80, y: 1050, w: 100, h: 6, radius: 4 } },
      { type: 'text', patch: { text: 'orders open now.\nships in 4–6 weeks.', fontFamily: 'Instrument Sans', fontSize: 36, color: '#F1CFEA', x: 80, y: 1090, w: 920, h: 140, align: 'left', lineHeight: 1.45 } },
      { type: 'text', patch: { text: '↑ swipe up', fontFamily: 'Instrument Sans', fontSize: 24, color: '#FDFBFC', x: 80, y: 1260, w: 920, h: 40, align: 'center', letterSpacing: 4, fontWeight: 600 } },
    ],
  },
];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// A mini svg-preview of a canvas (used for cards without a rasterized thumbnail yet).
function MiniPreview({ canvas, maxW = 240, maxH = 240 }) {
  if (!canvas) return null;
  const scale = Math.min(maxW / canvas.w, maxH / canvas.h);
  const w = canvas.w * scale;
  const h = canvas.h * scale;
  const svg = canvasToSVG(canvas);
  const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  return (
    <div style={{
      width: w, height: h,
      background: canvas.bg?.value || '#FDFBFC',
      backgroundImage: `url("${url}")`,
      backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
      borderRadius: 6, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
    }} />
  );
}

function ProjectCard({ project, onOpen, onMenu }) {
  const [hover, setHover] = hS(false);
  const [menuOpen, setMenuOpen] = hS(false);
  const menuRef = hR(null);
  const btnRef = hR(null);

  hE(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  const firstCanvas = project.canvases[0];
  const ratio = firstCanvas ? firstCanvas.w / firstCanvas.h : 1;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative' }}
    >
      <button
        onClick={onOpen}
        style={{
          width: '100%', textAlign: 'left', padding: 0,
          background: 'transparent',
          borderRadius: 14, display: 'block',
        }}
      >
        <div style={{
          aspectRatio: `${ratio}`,
          background: 'white',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-2px)' : 'none',
          transition: 'transform .18s, box-shadow .18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--line)',
          position: 'relative',
        }}>
          {project.thumbnail
            ? <img src={project.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
            : <MiniPreview canvas={firstCanvas} maxW={400} maxH={400} />
          }
          {project.canvases.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'rgba(42,31,42,0.85)', color: 'white',
              padding: '3px 8px', borderRadius: 999,
              fontSize: 10, fontWeight: 500, letterSpacing: '.04em',
              backdropFilter: 'blur(6px)',
            }}>
              {project.canvases.length} pages
            </div>
          )}
        </div>
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 4px 0',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500, color: 'var(--ink)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {project.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {firstCanvas?.w}×{firstCanvas?.h} · edited {timeAgo(project.updatedAt)}
          </div>
        </div>
        <button ref={btnRef}
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
          style={{ width: 28, height: 28 }}>
          <Icon name="more" size={16} />
        </button>
      </div>

      {menuOpen && (
        <div ref={menuRef}
          style={{
            position: 'absolute', right: 4, top: 'calc(100% - 8px)',
            width: 200, background: 'white', borderRadius: 12,
            padding: 6, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)',
            zIndex: 20,
          }}>
          <ProjectMenuItem icon="templates" label="Open" onClick={() => { setMenuOpen(false); onOpen(); }} />
          <ProjectMenuItem icon="text"      label="Rename" onClick={() => { setMenuOpen(false); onMenu('rename'); }} />
          <ProjectMenuItem icon="duplicate" label="Duplicate" onClick={() => { setMenuOpen(false); onMenu('duplicate'); }} />
          <ProjectMenuItem icon="save"      label="Save as template" onClick={() => { setMenuOpen(false); onMenu('save-template'); }} />
          <ProjectMenuItem icon="upload"    label="Export .petal.json" onClick={() => { setMenuOpen(false); onMenu('export'); }} />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 2px' }} />
          <ProjectMenuItem icon="trash" label="Delete" danger onClick={() => { setMenuOpen(false); onMenu('delete'); }} />
        </div>
      )}
    </div>
  );
}

function ProjectMenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 10px', borderRadius: 8,
        fontSize: 13, textAlign: 'left',
        color: danger ? 'var(--pink-600)' : 'var(--ink)',
        transition: 'background .1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-50)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon name={icon} size={14} />
      <span>{label}</span>
    </button>
  );
}

// ------------------ Home ------------------
function HomeScreen() {
  const { state, dispatch } = useStore();
  const importRef = hR(null);
  const [renameId, setRenameId] = hS(null);
  const [renameValue, setRenameValue] = hS('');
  const [saveTemplateFor, setSaveTemplateFor] = hS(null);
  const [saveTemplateName, setSaveTemplateName] = hS('');

  const filtered = hM(() => {
    const q = state.search.trim().toLowerCase();
    if (!q) return state.projects;
    return state.projects.filter(p => p.name.toLowerCase().includes(q));
  }, [state.projects, state.search]);

  const createFromPreset = (preset) => {
    dispatch({ type: 'create-project', name: preset.name, preset });
  };

  const createBlank = () => {
    dispatch({ type: 'create-project', name: 'Untitled design', preset: SIZE_PRESETS[0] });
  };

  const applyStarter = (tpl) => {
    const seed = tpl.els.map(e => ({ type: e.type, patch: e.patch }));
    const proj = newProject(tpl.name, tpl.preset, seed);
    proj.canvases[0].bg = { type: 'color', value: tpl.bg };
    // Remember which starter this came from so the editor can show a "you're editing X" chip.
    proj.appliedStarter = tpl.name;
    dispatch({ type: 'create-project', project: proj });
  };

  const applyMyTemplate = (tpl) => {
    // Clone into a new project
    const proj = {
      id: uid(),
      name: tpl.name,
      createdAt: now(), updatedAt: now(),
      thumbnail: tpl.thumbnail || null,
      canvases: tpl.canvases.map(c => ({
        ...c, id: uid(),
        elements: c.elements.map(el => ({ ...el, id: uid() })),
      })),
    };
    proj.activeCanvasId = proj.canvases[0]?.id;
    dispatch({ type: 'create-project', project: proj });
  };

  const handleAction = (project, action) => {
    if (action === 'rename') {
      setRenameId(project.id); setRenameValue(project.name);
    } else if (action === 'duplicate') {
      dispatch({ type: 'duplicate-project', id: project.id });
    } else if (action === 'delete') {
      if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
        dispatch({ type: 'delete-project', id: project.id });
      }
    } else if (action === 'save-template') {
      setSaveTemplateFor(project); setSaveTemplateName(project.name + ' template');
    } else if (action === 'export') {
      exportProjectFile(project);
    }
  };

  const commitRename = () => {
    if (renameId && renameValue.trim()) {
      dispatch({ type: 'rename-project', id: renameId, name: renameValue.trim() });
    }
    setRenameId(null);
  };

  const commitSaveTemplate = () => {
    if (!saveTemplateFor) return;
    const tpl = {
      id: uid(),
      name: saveTemplateName.trim() || (saveTemplateFor.name + ' template'),
      createdAt: now(),
      thumbnail: saveTemplateFor.thumbnail,
      canvases: JSON.parse(JSON.stringify(saveTemplateFor.canvases)),
    };
    dispatch({ type: 'load-state', state: { templates: [tpl, ...state.templates] } });
    setSaveTemplateFor(null);
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
          p.id = uid();
          p.createdAt = now(); p.updatedAt = now();
          p.canvases = p.canvases.map(c => ({ ...c, id: uid(), elements: c.elements.map(el => ({ ...el, id: uid() })) }));
          p.activeCanvasId = p.canvases[0]?.id;
          dispatch({ type: 'create-project', project: p });
        } else {
          alert('That doesn\'t look like a Petal project file.');
        }
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{
      height: '100vh', width: '100%',
      background: 'linear-gradient(180deg, var(--pink-200) 0%, var(--pink-100) 340px, #FBF5F9 800px)',
      overflowY: 'auto', overflowX: 'hidden',
    }} className="scroll">

      {/* Home top bar */}
      <div style={{
        padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 20,
        maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'white', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="assets/wpr-logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ lineHeight: 1.15, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)' }}>Wonder Pads</div>
            <div style={{ fontSize: 10, color: 'var(--ink-2)', letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 4 }}>Content Studio</div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <Icon name="search" size={16} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ink-3)', pointerEvents: 'none',
          }} />
          <input
            className="text-input"
            style={{ paddingLeft: 40, background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: 999, padding: '12px 16px 12px 40px', fontSize: 13 }}
            placeholder="Search your designs"
            value={state.search}
            onChange={e => dispatch({ type: 'set-search', search: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-tonal" onClick={() => importRef.current?.click()}>
            <Icon name="upload" size={14} /> Import
          </button>
          <input type="file" ref={importRef} accept=".json,.petal.json,application/json" style={{ display: 'none' }} onChange={importFile} />
          <button className="btn btn-tonal" onClick={() => dispatch({ type: 'set-view', view: 'carousel' })}
            style={{ background: 'var(--pink-200)', color: 'var(--pink-600)' }}>
            <Icon name="carousel" size={14} /> Text to carousel
          </button>
          <button className="btn btn-primary" onClick={createBlank}>
            <Icon name="plus" size={14} /> New design
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 40px 40px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>
              Welcome back
            </div>
            <h1 style={{
              margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400,
              fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--ink)', lineHeight: 1.05,
              maxWidth: 720,
            }}>
              Your studio, in bloom.
            </h1>
            <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 15, maxWidth: 560, lineHeight: 1.5 }}>
              Design social posts, product cards and story assets for Wonder Pads Reusables — all in one soft place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 20, fontVariantNumeric: 'tabular-nums' }}>
            <Stat value={state.projects.length} label={state.projects.length === 1 ? 'Design' : 'Designs'} />
            <Stat value={state.templates.length} label={state.templates.length === 1 ? 'Template' : 'Templates'} />
          </div>
        </div>
      </div>

      {/* Text-to-carousel feature card */}
      <div style={{ padding: '10px 40px 20px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <button
          onClick={() => dispatch({ type: 'set-view', view: 'carousel' })}
          style={{
            width: '100%', textAlign: 'left', padding: 0,
            background: 'transparent',
          }}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            gap: 24, alignItems: 'center',
            background: 'linear-gradient(120deg, #2A1F2A 0%, #C260A8 100%)',
            color: 'white',
            borderRadius: 24, padding: '28px 32px',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform .18s, box-shadow .18s',
            overflow: 'hidden', position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          >
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', minWidth: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)', flexShrink: 0,
              }}>
                <Icon name="carousel" size={30} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 4 }}>
                  New · Made for Instagram
                </div>
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 28, lineHeight: 1.1, marginBottom: 6 }}>
                  Text to carousel
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, maxWidth: 520 }}>
                  Paste any text — Petal splits it into on-brand IG slides. Editorial, tip cards, testimonial and more.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                padding: '10px 20px', background: 'white', color: 'var(--ink)',
                borderRadius: 999, fontWeight: 500, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                Open carousel maker <Icon name="chevron_r" size={14} />
              </div>
            </div>

            {/* Decorative slide thumbnails */}
            <div style={{
              position: 'absolute', right: 200, top: -10, opacity: 0.14, pointerEvents: 'none',
              display: 'flex', gap: 6,
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 90, height: 116, background: 'white', borderRadius: 8,
                  transform: `rotate(${(i - 1) * 6}deg) translateY(${i === 1 ? -8 : 0}px)`,
                }} />
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* This week — upcoming calendar entries */}
      {window.ThisWeekStrip && <window.ThisWeekStrip />}

      {/* Content tools — Repurpose + Launch */}
      <div style={{ padding: '4px 40px 20px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Repurpose card */}
          <button onClick={() => dispatch({ type: 'set-view', view: 'repurpose' })}
            style={{
              width: '100%', textAlign: 'left', padding: 0, background: 'transparent',
            }}>
            <div style={{
              background: 'white', borderRadius: 20, padding: 24,
              border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
              transition: 'transform .18s, box-shadow .18s',
              display: 'flex', gap: 18, alignItems: 'flex-start',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--pink-100)', color: 'var(--pink-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="sparkles" size={26} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
                  Content Repurposer
                </div>
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 6 }}>
                  One idea, everywhere
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  Type once. Get IG caption, TikTok hook, story frames + more — all in your voice.
                </div>
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--pink-600)', fontWeight: 600,
                }}>
                  Open <Icon name="chevron_r" size={12} />
                </div>
              </div>
            </div>
          </button>

          {/* Launch card */}
          <button onClick={() => dispatch({ type: 'set-view', view: 'launch' })}
            style={{
              width: '100%', textAlign: 'left', padding: 0, background: 'transparent',
            }}>
            <div style={{
              background: 'white', borderRadius: 20, padding: 24,
              border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
              transition: 'transform .18s, box-shadow .18s',
              display: 'flex', gap: 18, alignItems: 'flex-start',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'var(--ink)', color: 'var(--pink-200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="launch" size={26} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>
                  Launch Pack
                </div>
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)', lineHeight: 1.1, marginBottom: 6 }}>
                  Pick a product. Get the pack.
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  8 pieces of ready-to-post copy — announcement, IG, TikTok, Facebook, story frames + more.
                </div>
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--pink-600)', fontWeight: 600,
                }}>
                  Open <Icon name="chevron_r" size={12} />
                </div>
              </div>
            </div>
          </button>
        </div>

        {true && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <button onClick={() => dispatch({ type: 'set-view', view: 'history' })}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: 'var(--pink-50)', border: '1px solid var(--line)', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; }}>
              <Icon name="book" size={14} style={{ color: 'var(--pink-600)' }} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                <b style={{ color: 'var(--ink)' }}>66</b> ready posts · library
              </span>
              <div style={{ flex: 1 }} />
              <Icon name="chevron_r" size={14} style={{ color: 'var(--ink-3)' }} />
            </button>
            <button onClick={() => dispatch({ type: 'set-view', view: 'calendar' })}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: 'var(--pink-50)', border: '1px solid var(--line)', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; }}>
              <Icon name="history" size={14} style={{ color: 'var(--pink-600)' }} />
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                <b style={{ color: 'var(--ink)' }}>{(state.calendar || []).length}</b> queued · calendar
              </span>
              <div style={{ flex: 1 }} />
              <Icon name="chevron_r" size={14} style={{ color: 'var(--ink-3)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Brand kit */}
      <BrandKitSection />

      {/* Editable-project backup + restore — clearly visible per Petal spec */}
      <BackupRestoreCard />

      {/* Presets row */}
      <SectionHome title="Start something new" subtitle="Pick a size and dive in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {SIZE_PRESETS.slice(0, 10).map(p => (
            <PresetCard key={p.id} preset={p} onClick={() => createFromPreset(p)} />
          ))}
        </div>
      </SectionHome>

      {/* Recent */}
      <SectionHome title={state.search ? `Search results (${filtered.length})` : 'Recent designs'}
        subtitle={state.search ? '' : 'Pick up where you left off'}>
        {filtered.length === 0 ? (
          <EmptyState onCreate={createBlank} isSearch={!!state.search} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
            {filtered
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(p => (
                <ProjectCard key={p.id} project={p}
                  onOpen={() => dispatch({ type: 'open-project', id: p.id })}
                  onMenu={(action) => handleAction(p, action)}
                />
              ))}
          </div>
        )}
      </SectionHome>

      {/* My templates */}
      {state.templates.length > 0 && (
        <SectionHome title="My templates" subtitle="Your saved starting points">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
            {state.templates.map(t => (
              <TemplateCard key={t.id} template={t}
                onApply={() => applyMyTemplate(t)}
                onDelete={() => { if (confirm(`Delete template "${t.name}"?`)) dispatch({ type: 'delete-template', id: t.id }); }}
                isCustom
              />
            ))}
          </div>
        </SectionHome>
      )}

      {/* Starter templates */}
      <SectionHome title="Starter templates" subtitle="Curated for Wonder Pads Reusables">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 22 }}>
          {STARTER_TEMPLATES.map((t, i) => (
            <TemplateCard key={i} template={{
              name: t.name,
              canvases: [{ ...defaultCanvas(t.name, t.preset), bg: { type: 'color', value: t.bg },
                elements: t.els.map(e => newElement(e.type, e.patch)) }],
            }} onApply={() => applyStarter(t)} />
          ))}
        </div>
      </SectionHome>

      <div style={{ height: 60 }} />
      <div style={{
        textAlign: 'center', color: 'var(--ink-3)', fontSize: 11, padding: '0 20px 30px',
      }}>
        Your designs are saved to this browser. Export to .petal.json for backup.
      </div>

      {/* Rename modal */}
      {renameId && (
        <div className="modal-back" onClick={() => setRenameId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>Rename design</h3>
            <input autoFocus className="text-input" value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenameId(null); }}
              style={{ fontSize: 16, padding: 12 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRenameId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={commitRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Save-as-template modal */}
      {saveTemplateFor && (
        <div className="modal-back" onClick={() => setSaveTemplateFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 22 }}>Save as template</h3>
            <p style={{ margin: '0 0 14px', color: 'var(--ink-3)', fontSize: 12 }}>
              This will save a copy of "{saveTemplateFor.name}" to your templates library. You can start a new design from it any time.
            </p>
            <input autoFocus className="text-input" value={saveTemplateName}
              onChange={e => setSaveTemplateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitSaveTemplate(); if (e.key === 'Escape') setSaveTemplateFor(null); }}
              style={{ fontSize: 15, padding: 12 }} placeholder="Template name" />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSaveTemplateFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={commitSaveTemplate}>Save template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: 'DM Serif Display', fontSize: 36, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SectionHome({ title, subtitle, children }) {
  return (
    <div style={{ padding: '10px 40px 30px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 24, color: 'var(--ink)' }}>
          {title}
        </h2>
        {subtitle && <p style={{ margin: '2px 0 0', color: 'var(--ink-3)', fontSize: 13 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function PresetCard({ preset, onClick }) {
  const [hover, setHover] = hS(false);
  const ratio = preset.w / preset.h;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 14, borderRadius: 14,
        background: hover ? 'white' : 'rgba(255,255,255,0.7)',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all .18s',
        textAlign: 'left',
        border: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{
        aspectRatio: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--pink-50)', borderRadius: 10,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--pink-200), var(--pink-300))',
          width: ratio > 1 ? '70%' : `${70 * ratio}%`,
          height: ratio > 1 ? `${70 / ratio}%` : '70%',
          borderRadius: 4,
          boxShadow: 'var(--shadow-sm)',
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{preset.name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {preset.w} × {preset.h}
        </div>
      </div>
    </button>
  );
}

function TemplateCard({ template, onApply, onDelete, isCustom }) {
  const [hover, setHover] = hS(false);
  const first = template.canvases[0];
  const ratio = first ? first.w / first.h : 1;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative' }}
    >
      <button onClick={onApply}
        style={{
          width: '100%', padding: 0, background: 'transparent',
          textAlign: 'left', display: 'block',
        }}
      >
        <div style={{
          aspectRatio: `${ratio}`,
          background: 'white',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-2px)' : 'none',
          transition: 'transform .18s, box-shadow .18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--line)',
        }}>
          {template.thumbnail
            ? <img src={template.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <MiniPreview canvas={first} maxW={500} maxH={500} />
          }
        </div>
      </button>
      <div style={{ padding: '10px 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</div>
          {isCustom && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Saved {timeAgo(template.createdAt)}</div>}
          {!isCustom && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Starter · {first?.w}×{first?.h}</div>}
        </div>
        {isCustom && onDelete && (
          <button className="icon-btn" onClick={onDelete} style={{ width: 24, height: 24 }}>
            <Icon name="trash" size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreate, isSearch }) {
  return (
    <div style={{
      padding: '60px 20px', textAlign: 'center',
      background: 'white', borderRadius: 20,
      border: '1px dashed var(--line-2)',
    }}>
      <div style={{
        width: 64, height: 64, margin: '0 auto 16px', borderRadius: 20,
        background: 'linear-gradient(135deg, var(--pink-100), var(--pink-200))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pink-500)',
      }}>
        <Icon name={isSearch ? 'search' : 'flower'} size={30} />
      </div>
      <div style={{ fontFamily: 'DM Serif Display', fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>
        {isSearch ? 'Nothing matches that search' : 'Your studio is a fresh page'}
      </div>
      <div style={{ color: 'var(--ink-3)', fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>
        {isSearch
          ? 'Try a different phrase, or start a new design from scratch.'
          : 'Start with a preset size, apply a starter template, or import a Petal file.'}
      </div>
      <button className="btn btn-primary" onClick={onCreate}>
        <Icon name="plus" size={14} /> Create your first design
      </button>
    </div>
  );
}

// Export helpers
function exportProjectFile(project) {
  const payload = {
    __petal: 'project',
    version: 1,
    exportedAt: now(),
    project: JSON.parse(JSON.stringify(project)),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${(project.name || 'design').replace(/[^\w-]/g, '_')}.petal.json`);
}

// Show the next 7 days of queued content on the home page — turns a "generator" into a "workflow".
function ThisWeekStrip() {
  const { state, dispatch } = useStore();
  const calendar = state.calendar || [];

  // Group next-7-days entries by date.
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
  const upcoming = calendar
    .filter(e => e.status !== 'posted' && e.ts >= now.getTime() && e.ts < in7.getTime())
    .sort((a, b) => a.ts - b.ts);

  if (upcoming.length === 0) return null;

  const daysMap = new Map();
  for (const e of upcoming) {
    const d = new Date(e.ts); d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    if (!daysMap.has(key)) daysMap.set(key, []);
    daysMap.get(key).push(e);
  }
  const days = [...daysMap.entries()].sort((a, b) => a[0] - b[0]);

  const fmtDayLabel = (ts) => {
    const d = new Date(ts);
    const today = new Date(); today.setHours(0,0,0,0);
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === tmr.getTime()) return 'Tomorrow';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const icons = window.CAL_PLATFORM_ICON || {};
  const labels = window.CAL_PLATFORM_LABEL || {};

  return (
    <div className="wpr-this-week-strip" style={{ padding: '10px 40px 20px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>This week</div>
          <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, color: 'var(--ink)' }}>
            {upcoming.length} post{upcoming.length !== 1 ? 's' : ''} queued
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'set-view', view: 'calendar' })}
          className="btn btn-tonal"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
          Open calendar <Icon name="chevron_r" size={12} />
        </button>
      </div>
      <div className="scroll" style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
      }}>
        {days.map(([ts, items]) => (
          <div key={ts} style={{
            flexShrink: 0, minWidth: 240, maxWidth: 280,
            background: 'white', border: '1px solid var(--line)', borderRadius: 16,
            padding: 14, boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--pink-500)', marginBottom: 8, fontWeight: 600 }}>
              {fmtDayLabel(ts)}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {items.slice(0, 3).map(e => (
                <button key={e.id} onClick={() => dispatch({ type: 'set-view', view: 'calendar' })}
                  style={{
                    background: 'var(--pink-50)', border: 'none', borderRadius: 10,
                    padding: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                  <Icon name={icons[e.platform] || 'edit'} size={12} style={{ color: 'var(--pink-600)', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>
                      {labels[e.platform] || e.platform} · {new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4,
                      display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                    }}>{e.text}</div>
                  </div>
                </button>
              ))}
              {items.length > 3 && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', paddingTop: 4 }}>
                  +{items.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Petal — clearly visible Backup / Restore of the entire editable project.
// The backup keeps every project, canvas, brand data, saved backgrounds, arrangements,
// content-tool history, calendar and relevant application state.
function BackupRestoreCard() {
  const { state, dispatch } = useStore();
  const fileRef = hR(null);

  const onRestore = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const restored = parseEditableProjectFile(ev.target.result);
        const projectCount = restored.projects?.length || 0;
        if (!confirm(
          `Restore ${projectCount} project${projectCount === 1 ? '' : 's'} + all brand data, saved backgrounds, arrangements, calendar and content history?\n\nThis replaces your current studio data.`
        )) { e.target.value = ''; return; }
        dispatch({ type: 'load-state', state: { ...restored, past: [], future: [], selection: [], saveStatus: 'idle' } });
        alert('Backup restored successfully.');
      } catch (err) {
        alert('This is not a valid Wonder Pads Content Studio backup file.\n\n' + (err.message || ''));
      }
      e.target.value = '';
    };
    r.readAsText(f);
  };

  const nProjects = state.projects.length;
  const nDesigns  = state.projects.reduce((sum, p) => sum + p.canvases.length, 0);
  const nBackgrounds = (state.savedBackgrounds || []).length;
  const nArrangements = (state.brand.savedArrangements || []).length;

  return (
    <div className="wpr-backup-restore-card" style={{ padding: '10px 40px 20px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        background: 'white', border: '1px solid var(--line)', borderRadius: 20,
        padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'var(--pink-100)', color: 'var(--pink-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="save" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
            Editable project safety
          </div>
          <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, color: 'var(--ink)', lineHeight: 1.15 }}>
            Back up everything to a file
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.5 }}>
            {nProjects} project{nProjects === 1 ? '' : 's'} · {nDesigns} canvas{nDesigns === 1 ? '' : 'es'} · {nBackgrounds} saved bg · {nArrangements} arrangement{nArrangements === 1 ? '' : 's'} · brand data · content history
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportEditableProjectFile(state)}
            style={{
              padding: '10px 16px', background: 'var(--ink)', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}>
            <Icon name="upload" size={14} style={{ transform: 'rotate(180deg)' }} /> Backup editable project
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="btn btn-tonal"
            style={{ padding: '10px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="upload" size={14} /> Restore editable project
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onRestore} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, STARTER_TEMPLATES, exportProjectFile, timeAgo, MiniPreview, ThisWeekStrip, BackupRestoreCard });
