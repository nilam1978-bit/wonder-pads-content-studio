// Left tool rail, expanding panels, right properties, pages list
const { useState: pS, useRef: pR, useEffect: pE, useMemo: pM } = React;

// ------- Fonts available -------
const FONT_OPTIONS = [
  // Core family — always shown in the font select.
  { family: 'DM Serif Display', label: 'DM Serif Display', kind: 'display' },
  { family: 'Instrument Serif', label: 'Instrument Serif', kind: 'serif' },
  { family: 'Fraunces', label: 'Fraunces', kind: 'serif' },
  { family: 'Playfair Display', label: 'Playfair', kind: 'serif' },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', kind: 'serif' },
  { family: 'Libre Baskerville', label: 'Libre Baskerville', kind: 'serif' },
  { family: 'Instrument Sans', label: 'Instrument Sans', kind: 'sans' },
  { family: 'Space Grotesk', label: 'Space Grotesk', kind: 'sans' },
  { family: 'Josefin Sans', label: 'Josefin Sans', kind: 'sans' },
  { family: 'Bebas Neue', label: 'Bebas Neue', kind: 'display' },
  { family: 'Caveat', label: 'Caveat', kind: 'script' },
];

// Additional curated fonts — shown under "More fonts" in the Text panel.
// Kept out of the main FONT_OPTIONS so the default select stays calm.
const MORE_FONT_OPTIONS = [
  { family: 'Lora',          label: 'Lora',          kind: 'serif' },
  { family: 'Montserrat',    label: 'Montserrat',    kind: 'sans' },
  { family: 'Nunito',        label: 'Nunito',        kind: 'sans' },
  { family: 'Poppins',       label: 'Poppins',       kind: 'sans' },
  { family: 'Raleway',       label: 'Raleway',       kind: 'sans' },
  { family: 'Kalam',         label: 'Kalam',         kind: 'script' },
  { family: 'Shantell Sans', label: 'Shantell Sans', kind: 'script' },
  { family: 'Pacifico',      label: 'Pacifico',      kind: 'script' },
  { family: 'Chewy',         label: 'Chewy',         kind: 'display' },
];

// Shared by every selected-text editor, including generated slides and mobile.
const ALL_FONT_OPTIONS = [...FONT_OPTIONS, ...MORE_FONT_OPTIONS];

// ------- Palette swatches -------
const BRAND_PALETTE = ['#F1CFEA', '#E8B8DC', '#D98BC6', '#C260A8', '#A0447F', '#2A1F2A', '#FDFBFC', '#F7E1F0'];
const NEUTRAL_PALETTE = ['#2A1F2A', '#56454F', '#8A7684', '#EADDE5', '#FDFBFC', '#FFFFFF', '#000000'];
const COMPLEMENT_PALETTE = ['#B8E3D9', '#F9E2B0', '#FFB59F', '#B9CFF1', '#DAB9F1', '#F1B9C1'];

const GRADIENTS = [
  'linear-gradient(135deg, #F1CFEA 0%, #F7E1F0 100%)',
  'linear-gradient(135deg, #F1CFEA 0%, #D98BC6 100%)',
  'linear-gradient(135deg, #F7E1F0 0%, #B9CFF1 100%)',
  'linear-gradient(135deg, #FDFBFC 0%, #F1CFEA 100%)',
  'linear-gradient(135deg, #F9E2B0 0%, #F1CFEA 100%)',
  'linear-gradient(180deg, #F7E1F0 0%, #FDFBFC 100%)',
  'radial-gradient(circle at 30% 20%, #F1CFEA 0%, #F7E1F0 50%, #FDFBFC 100%)',
  'linear-gradient(135deg, #E8B8DC 0%, #DAB9F1 50%, #B9CFF1 100%)',
];

const ICON_LIBRARY = [
  'sparkle', 'flower', 'leaf', 'moon', 'sun', 'cloud', 'music', 'bolt', 'gift', 'drop',
  'heart', 'star',
];

// ---------- LEFT RAIL ----------
const RAIL_TOOLS = [
  { id: 'templates', label: 'Templates', icon: 'templates' },
  { id: 'brand',     label: 'Brand',     icon: 'brand_kit' },
  { id: 'text',      label: 'Text',      icon: 'text' },
  { id: 'shapes',    label: 'Shapes',    icon: 'shapes' },
  { id: 'images',    label: 'Images',    icon: 'images' },
  { id: 'icons',     label: 'Icons',     icon: 'icons' },
  { id: 'frames',    label: 'Frames',    icon: 'frames' },
  { id: 'bg',        label: 'Background',icon: 'bg' },
];

function LeftRail() {
  const { state, dispatch } = useStore();
  return (
    <div style={{
      width: 84, background: 'var(--pink-100)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      padding: '12px 0', gap: 4,
    }}>
      {RAIL_TOOLS.map(t => (
        <button key={t.id}
          onClick={() => dispatch({ type: 'set-tool', tool: state.tool === t.id ? null : t.id })}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 4px', margin: '0 8px', borderRadius: 12,
            color: state.tool === t.id ? 'var(--pink-600)' : 'var(--ink-2)',
            background: state.tool === t.id ? 'white' : 'transparent',
            transition: 'background .12s, color .12s',
            boxShadow: state.tool === t.id ? 'var(--shadow-sm)' : 'none',
            gap: 4,
          }}
          onMouseEnter={(e) => { if (state.tool !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
          onMouseLeave={(e) => { if (state.tool !== t.id) e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon name={t.icon} size={22} />
          <span style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- LEFT PANEL ----------
function LeftPanel() {
  const { state } = useStore();
  if (!state.tool) return null;

  return (
    <div style={{
      width: 220, background: 'white',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      minHeight: 0,
    }}>
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {state.tool === 'templates' && <TemplatesPanel />}
        {state.tool === 'brand' && <BrandPanel />}
        {state.tool === 'text' && <TextPanel />}
        {state.tool === 'shapes' && <ShapesPanel />}
        {state.tool === 'images' && <ImagesPanel />}
        {state.tool === 'icons' && <IconsPanel />}
        {state.tool === 'frames' && <FramesPanel />}
        {state.tool === 'bg' && <BackgroundPanel />}
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontFamily: 'DM Serif Display', fontSize: 18, fontWeight: 400 }}>{title}</h3>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.35 }}>{subtitle}</p>}
    </div>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      margin: '20px 0 10px', fontSize: 11, fontWeight: 600,
      color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase',
    }}>
      <span>{children}</span>
      {action}
    </div>
  );
}

// ------- Templates panel -------
const TEMPLATES = [
  { name: 'Bloom', bg: '#F7E1F0', accent: '#D98BC6',
    els: [
      { type: 'text', patch: { text: 'Bloom', fontFamily: 'DM Serif Display', fontSize: 200, color: '#2A1F2A', x: 140, y: 380, w: 800, h: 260, align: 'center' } },
      { type: 'text', patch: { text: 'in your own time', fontFamily: 'Caveat', fontSize: 80, color: '#C260A8', x: 240, y: 620, w: 600, h: 120, align: 'center', italic: true } },
      { type: 'circle', patch: { fill: '#F1CFEA', x: 80, y: 80, w: 160, h: 160 } },
      { type: 'circle', patch: { fill: '#E8B8DC', x: 840, y: 840, w: 160, h: 160 } },
    ],
  },
  { name: 'Cycle',  bg: '#FDFBFC', accent: '#F1CFEA',
    els: [
      { type: 'rect', patch: { fill: '#F1CFEA', x: 0, y: 0, w: 1080, h: 360, radius: 0 } },
      { type: 'text', patch: { text: 'Cycle care', fontFamily: 'Instrument Serif', fontSize: 100, color: '#2A1F2A', x: 100, y: 130, w: 880, h: 140, italic: true, align: 'left' } },
      { type: 'text', patch: { text: '01', fontFamily: 'DM Serif Display', fontSize: 320, color: '#F1CFEA', x: 80, y: 500, w: 500, h: 400, align: 'center' } },
      { type: 'text', patch: { text: 'A softer approach to your monthly rhythm — reusable, radiant, real.', fontFamily: 'Instrument Sans', fontSize: 34, color: '#56454F', x: 540, y: 580, w: 460, h: 240, align: 'left', lineHeight: 1.4 } },
    ],
  },
  { name: 'Sale',   bg: '#D98BC6', accent: '#2A1F2A',
    els: [
      { type: 'text', patch: { text: '25% OFF', fontFamily: 'DM Serif Display', fontSize: 240, color: '#FDFBFC', x: 40, y: 300, w: 1000, h: 300, align: 'center' } },
      { type: 'text', patch: { text: 'FIRST BLOOM COLLECTION', fontFamily: 'Instrument Sans', fontSize: 32, color: '#2A1F2A', x: 100, y: 620, w: 880, h: 60, align: 'center', letterSpacing: 8, fontWeight: 600 } },
      { type: 'circle', patch: { fill: 'transparent', stroke: '#FDFBFC', strokeWidth: 3, x: 60, y: 60, w: 960, h: 960 } },
    ],
  },
  { name: 'Quote',  bg: '#F1CFEA', accent: '#2A1F2A',
    els: [
      { type: 'text', patch: { text: '"', fontFamily: 'DM Serif Display', fontSize: 400, color: '#D98BC6', x: 60, y: 40, w: 300, h: 400, align: 'left' } },
      { type: 'text', patch: { text: 'Nature does not\nhurry, yet\neverything is\naccomplished.', fontFamily: 'Instrument Serif', fontSize: 72, color: '#2A1F2A', x: 100, y: 320, w: 880, h: 500, align: 'left', italic: true, lineHeight: 1.3 } },
      { type: 'text', patch: { text: '— LAO TZU', fontFamily: 'Instrument Sans', fontSize: 24, color: '#56454F', x: 100, y: 880, w: 300, h: 40, align: 'left', letterSpacing: 4 } },
    ],
  },
];

function TemplatesPanel() {
  const { state, dispatch } = useStore();
  // Use the Wonder Pads shop-specific starters from the home page (not the old generic 4).
  const list = window.STARTER_TEMPLATES || TEMPLATES;
  const proj = activeProject(state);
  const appliedName = proj?.appliedStarter;
  const [tab, setTab] = pS('templates'); // 'templates' | 'blank'

  const applyTemplate = (tpl) => {
    const canvas = activeCanvas(state);
    const elements = tpl.els.map(e => newElement(e.type, e.patch));
    dispatch({ type: 'update-canvas', id: canvas.id, patch: { elements, bg: { type: 'color', value: tpl.bg } } });
    // Track which starter is now applied so the chip in the top bar updates.
    if (proj) {
      dispatch({ type: 'update-project', id: proj.id, patch: { appliedStarter: tpl.name } });
    }
  };
  return (
    <>
      <PanelHeader title="Templates" subtitle="Start from a curated design" />

      {/* Tabs — Templates | Blank pages */}
      <div style={{
        display: 'flex', gap: 2, padding: 3, background: 'var(--pink-50)',
        borderRadius: 10, marginBottom: 12,
      }}>
        {[
          { id: 'templates', label: 'Templates' },
          { id: 'blank',     label: 'Blank pages' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 500,
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all .12s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div style={{ display: 'grid', gap: 6 }}>
          {list.map(t => (
            <TemplateRow key={t.name}
              template={t}
              active={t.name === appliedName}
              onApply={() => applyTemplate(t)} />
          ))}
        </div>
      )}

      {tab === 'blank' && (
        <BlankPagesGrid dispatch={dispatch} />
      )}
    </>
  );
}

// ------- Single template thumbnail card -------
// Colored card with the name inside + palette dots at the bottom.
// Kept as its own component so hooks stay stable across tab switches.
function TemplateRow({ template, active, onApply }) {
  const isPortrait = template.preset && template.preset.h > template.preset.w;
  return (
    <button onClick={onApply}
      style={{
        width: '100%',
        background: template.bg,
        borderRadius: 8, padding: 0, border: 'none',
        boxShadow: active
          ? '0 0 0 2px var(--pink-500), var(--shadow-sm)'
          : 'var(--shadow-sm)',
        position: 'relative', overflow: 'hidden',
        transition: 'transform .12s, box-shadow .12s',
        cursor: 'pointer', fontFamily: 'inherit',
        aspectRatio: isPortrait ? '4/5' : '1',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 5, right: 5, zIndex: 2,
          background: 'var(--pink-500)', color: 'white',
          width: 14, height: 14, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }} title="Active template">
          <Icon name="check" size={9} />
        </div>
      )}
      <div style={{
        padding: 8, textAlign: 'left', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: 'DM Serif Display', fontSize: 12, color: 'var(--ink)',
          lineHeight: 1.15,
          overflow: 'hidden', display: '-webkit-box',
          WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
          wordBreak: 'break-word',
          maxWidth: active ? 'calc(100% - 18px)' : '100%',
        }}>{template.name}</div>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: template.accent }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pink-300)' }} />
        </div>
      </div>
    </button>
  );
}

// ------- Blank pages grid -------
// Shows every preset as a scaled thumbnail so aspect ratio is instantly obvious
// (square = IG post, tall = portrait/story/reel, wide = FB/YouTube).
function BlankPagesGrid({ dispatch }) {
  // Category → subset of SIZE_PRESETS. Keep ordering intentional.
  const grouped = [
    {
      label: 'Instagram',
      icon: 'instagram',
      items: SIZE_PRESETS.filter(p => p.id === 'ig-post' || p.id === 'ig-portrait' || p.id === 'ig-story'),
    },
    {
      label: 'Video',
      icon: 'tiktok',
      items: SIZE_PRESETS.filter(p => p.id === 'tiktok' || p.id === 'yt-thumb'),
    },
    {
      label: 'Other',
      icon: 'facebook',
      items: SIZE_PRESETS.filter(p => p.id === 'fb-post' || p.id === 'square-sm' || p.id === 'presentation' || p.id === 'a4-l' || p.id === 'poster'),
    },
  ];

  // Short, familiar labels — "Post" instead of "Instagram Post" (category already provides context).
  const shortLabel = (p) => {
    if (p.id === 'ig-post') return 'Post';
    if (p.id === 'ig-portrait') return 'Portrait';
    if (p.id === 'ig-story') return 'Story / Reel';
    if (p.id === 'tiktok') return 'TikTok';
    if (p.id === 'yt-thumb') return 'YouTube';
    if (p.id === 'fb-post') return 'Facebook';
    if (p.id === 'square-sm') return 'Square';
    if (p.id === 'presentation') return 'Slide 16:9';
    if (p.id === 'a4-l') return 'A4 Landscape';
    if (p.id === 'poster') return 'Poster';
    return p.name;
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {grouped.map(group => (
        <div key={group.label}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}>
            <Icon name={group.icon} size={11} />
            {group.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {group.items.map(p => {
              // Scale so the largest dimension fits in a 62px cell.
              const MAX = 48;
              const scale = MAX / Math.max(p.w, p.h);
              const tw = Math.max(20, Math.round(p.w * scale));
              const th = Math.max(20, Math.round(p.h * scale));
              return (
                <button key={p.id}
                  onClick={() => dispatch({ type: 'add-canvas', preset: p })}
                  style={{
                    padding: '10px 6px', borderRadius: 10, textAlign: 'center',
                    background: 'var(--pink-50)', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    fontFamily: 'inherit',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-100)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--pink-50)'}
                  title={`${p.name} — ${p.w}×${p.h}`}>
                  {/* Aspect-ratio-accurate thumbnail — you see instantly if it's square, portrait, or wide */}
                  <div style={{
                    width: MAX, height: MAX,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: tw, height: th, background: 'white',
                      borderRadius: 3, boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--line)',
                    }} />
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--ink-2)', fontWeight: 500,
                    lineHeight: 1.2,
                  }}>{shortLabel(p)}</div>
                  <div style={{
                    fontSize: 9, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums',
                    marginTop: -3,
                  }}>{p.w === p.h ? `${p.w}²` : `${p.w}×${p.h}`}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------- Text panel -------
function TextPanel() {
  const { state, dispatch } = useStore();
  const addText = (patch) => {
    const canvas = activeCanvas(state);
    const el = newElement('text', {
      x: canvas.w / 2 - 300, y: canvas.h / 2 - 60,
      w: 600, h: 120,
      ...patch,
    });
    dispatch({ type: 'add-element', element: el });
  };

  const presets = [
    { label: 'Add a heading', fontFamily: 'DM Serif Display', fontSize: 96, text: 'Heading' },
    { label: 'Add a subheading', fontFamily: 'Instrument Serif', fontSize: 56, text: 'Subheading', italic: true },
    { label: 'Add body text', fontFamily: 'Instrument Sans', fontSize: 32, text: 'A little body text goes here' },
  ];

  const [showMoreFonts, setShowMoreFonts] = pS(false);

  return (
    <>
      <PanelHeader title="Text" subtitle="Click to add to canvas" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {presets.map((p, i) => (
          <button key={i} onClick={() => addText(p)}
            style={{
              padding: 20, background: 'var(--pink-50)', borderRadius: 12,
              textAlign: 'left', transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--pink-50)'}
          >
            <div style={{
              fontFamily: p.fontFamily,
              fontSize: Math.min(p.fontSize / 2.5, 32),
              fontStyle: p.italic ? 'italic' : 'normal',
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}>{p.label}</div>
          </button>
        ))}
      </div>

      {/* Calm Handmade text presets — each preset adds a new independent text element
          with exact Petal-reference values. Selecting one never restyles or moves existing work. */}
      <SectionLabel>Calm Handmade</SectionLabel>
      <div style={{ display: 'grid', gap: 6 }}>
        {CALM_HANDMADE_PRESETS.map((p) => (
          <button key={p.name}
            onClick={() => addText({
              text: p.sample,
              w: 700, h: 200,
              ...p.patch,
            })}
            style={{
              padding: '10px 12px', background: 'var(--pink-50)', borderRadius: 10,
              textAlign: 'left', border: '1px solid transparent',
              transition: 'background .12s, border-color .12s',
              display: 'flex', flexDirection: 'column', gap: 3,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; e.currentTarget.style.borderColor = 'var(--pink-300)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; e.currentTarget.style.borderColor = 'transparent'; }}
            title={`Adds a "${p.name}" text element`}
          >
            <span style={{
              fontFamily: p.patch.fontFamily,
              fontStyle: p.patch.italic ? 'italic' : 'normal',
              fontWeight: p.patch.fontWeight || 400,
              fontSize: 20, color: 'var(--ink)', lineHeight: 1.1,
              letterSpacing: p.patch.letterSpacing ? p.patch.letterSpacing * 0.5 : 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.sample}</span>
            <span style={{
              fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600,
            }}>{p.name}</span>
          </button>
        ))}
      </div>

      <SectionLabel>Font styles</SectionLabel>
      <div style={{ display: 'grid', gap: 8 }}>
        {FONT_OPTIONS.map(f => (
          <button key={f.family}
            onClick={() => addText({ fontFamily: f.family, fontSize: 72, text: f.label })}
            style={{
              padding: '12px 14px', background: 'var(--pink-50)', borderRadius: 10,
              textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--pink-50)'}
          >
            <span style={{ fontFamily: f.family, fontSize: 22 }}>{f.label}</span>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{f.kind}</span>
          </button>
        ))}
      </div>

      {/* Collapsible "More fonts" — kept out of the main list to preserve the calm visual style. */}
      <button onClick={() => setShowMoreFonts(v => !v)}
        style={{
          marginTop: 10, width: '100%', padding: '8px 12px', background: 'white',
          border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer',
          fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
          color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'inherit',
        }}>
        <span>More fonts</span>
        <Icon name="chevron_d" size={12} style={{ transform: showMoreFonts ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {showMoreFonts && (
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {MORE_FONT_OPTIONS.map(f => (
            <button key={f.family}
              onClick={() => addText({ fontFamily: f.family, fontSize: 60, text: f.label })}
              style={{
                padding: '10px 12px', background: 'white', border: '1px solid var(--line)',
                borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                transition: 'border-color .12s, background .12s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pink-300)'; e.currentTarget.style.background = 'var(--pink-50)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'white'; }}>
              <span style={{ fontFamily: f.family, fontSize: 18 }}>{f.label}</span>
              <span style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{f.kind}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// Petal "Calm Handmade" text presets. Values are copied verbatim from Petal —
// selecting one adds a new independent text element and must never restyle existing work.
const CALM_HANDMADE_PRESETS = [
  { name: 'Handmade Note',            sample: 'A little note from my sewing table',      patch: { fontFamily: 'Caveat',             fontSize: 58, fontWeight: 600, align: 'left', lineHeight: 1.05 } },
  { name: 'Soft Script',              sample: 'Made gently, just for you',                patch: { fontFamily: 'Caveat',             fontSize: 66, fontWeight: 400, italic: true, align: 'left', lineHeight: 1.05 } },
  { name: 'Painted Headline',         sample: 'Comfort you can trust',                    patch: { fontFamily: 'Bebas Neue',         fontSize: 72, fontWeight: 400, align: 'left', letterSpacing: 1 } },
  { name: 'Fabric Label',             sample: 'Handmade · reusable · soft',               patch: { fontFamily: 'Space Grotesk',      fontSize: 38, fontWeight: 600, align: 'left', letterSpacing: 1.2 } },
  { name: 'Storybook Serif',          sample: 'Every pad begins with a piece of fabric',  patch: { fontFamily: 'Libre Baskerville',  fontSize: 44, fontWeight: 400, align: 'left', lineHeight: 1.12 } },
  { name: 'Friendly Marker',          sample: "Let's talk about cloth pads",              patch: { fontFamily: 'Caveat',             fontSize: 64, fontWeight: 700, align: 'left', lineHeight: 1.02 } },
  { name: 'Small-Business Signature', sample: 'Wonder Pads Reusables',                    patch: { fontFamily: 'Caveat',             fontSize: 52, fontWeight: 400, italic: true, align: 'left' } },
  { name: 'Product Tag',              sample: 'Overnight cloth pad',                      patch: { fontFamily: 'Josefin Sans',       fontSize: 42, fontWeight: 600, align: 'left', letterSpacing: 0.8 } },
  { name: 'Gentle Quote',             sample: 'Your period care can feel softer.',        patch: { fontFamily: 'Cormorant Garamond', fontSize: 52, fontWeight: 400, align: 'left', lineHeight: 1.08 } },
  { name: 'Social Handle',            sample: '@ecoclothpad',                              patch: { fontFamily: 'Space Grotesk',      fontSize: 38, fontWeight: 600, align: 'left' } },
];

// ------- Shapes panel -------
function ShapesPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const addShape = (type, extra = {}) => {
    const el = newElement(type, {
      x: canvas.w / 2 - 150, y: canvas.h / 2 - 150,
      w: 300, h: 300, ...extra,
    });
    dispatch({ type: 'add-element', element: el });
  };
  const shapes = [
    { type: 'rect', icon: 'square', label: 'Square' },
    { type: 'circle', icon: 'circle', label: 'Circle' },
    { type: 'triangle', icon: 'triangle', label: 'Triangle' },
    { type: 'diamond', icon: 'diamond', label: 'Diamond' },
    { type: 'polygon', icon: 'pentagon', label: 'Pentagon', extra: { sides: 5 } },
    { type: 'polygon', icon: 'hexagon', label: 'Hexagon', extra: { sides: 6 } },
    { type: 'star', icon: 'star', label: 'Star' },
    { type: 'heart', icon: 'heart', label: 'Heart' },
    { type: 'line', icon: 'line', label: 'Line', extra: { w: 300, h: 20 } },
    { type: 'arrow', icon: 'arrow', label: 'Arrow', extra: { w: 300, h: 40 } },
  ];

  return (
    <>
      <PanelHeader title="Shapes" subtitle="Click to place" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shapes.map(s => (
          <button key={s.label} onClick={() => addShape(s.type, s.extra)}
            style={{
              aspectRatio: '1', background: 'var(--pink-50)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--pink-500)', transition: 'background .12s, transform .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon name={s.icon} size={44} stroke={1.5} />
          </button>
        ))}
      </div>
    </>
  );
}

// ------- Images panel -------
function ImagesPanel() {
  const { state, dispatch } = useStore();
  const [uploads, setUploads] = pS(() => {
    try { return JSON.parse(localStorage.getItem('petal-uploads') || '[]'); } catch { return []; }
  });
  const fileRef = pR(null);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        const newList = [src, ...uploads].slice(0, 24);
        setUploads(newList);
        try { localStorage.setItem('petal-uploads', JSON.stringify(newList)); } catch {}
      };
      reader.readAsDataURL(file);
    });
  };

  const addImage = (src) => {
    const canvas = activeCanvas(state);
    const img = new Image();
    img.onload = () => {
      const maxW = canvas.w * 0.6;
      const ratio = img.width / img.height;
      const w = Math.min(maxW, img.width);
      const h = w / ratio;
      dispatch({
        type: 'add-element',
        element: newElement('image', {
          src, w, h,
          x: canvas.w / 2 - w / 2, y: canvas.h / 2 - h / 2,
        })
      });
    };
    img.src = src;
  };

  const stockImages = [
    'assets/wonder-pads-logo.png',
  ];

  return (
    <>
      <PanelHeader title="Images" subtitle="Upload or pick from your library" />
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px' }}
        onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={16} /> Upload image
      </button>
      <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)} />

      <SectionLabel>Your library</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[...uploads, ...stockImages].map((src, i) => (
          <button key={i} onClick={() => addImage(src)}
            style={{
              aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
              background: 'var(--pink-50)', padding: 0,
              transition: 'transform .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
        {!uploads.length && (
          <div style={{ gridColumn: 'span 3', padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
            No uploads yet — drop images to begin
          </div>
        )}
      </div>
    </>
  );
}

// ------- Icons panel -------
function IconsPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const addIcon = (name) => {
    dispatch({
      type: 'add-element',
      element: newElement('icon', {
        name, w: 200, h: 200,
        x: canvas.w / 2 - 100, y: canvas.h / 2 - 100,
      })
    });
  };
  return (
    <>
      <PanelHeader title="Icons & stickers" subtitle="Click to add" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {ICON_LIBRARY.map(name => (
          <button key={name} onClick={() => addIcon(name)}
            style={{
              aspectRatio: '1', background: 'var(--pink-50)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--pink-500)', transition: 'background .12s, transform .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon name={name} size={40} stroke={1.5} />
          </button>
        ))}
      </div>
    </>
  );
}

// ------- Frames panel -------
function FramesPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const addFrame = (shape) => {
    dispatch({
      type: 'add-element',
      element: newElement('frame', {
        shape, w: 400, h: 400,
        x: canvas.w / 2 - 200, y: canvas.h / 2 - 200,
      })
    });
  };
  const frames = [
    { shape: 'circle', label: 'Circle' },
    { shape: 'rounded', label: 'Rounded' },
    { shape: 'square', label: 'Square' },
  ];
  return (
    <>
      <PanelHeader title="Frames" subtitle="Drop images into shaped frames" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {frames.map(f => (
          <button key={f.shape} onClick={() => addFrame(f.shape)}
            style={{
              aspectRatio: '1', background: 'var(--pink-50)', borderRadius: 12,
              padding: 20, transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-100)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--pink-50)'}
          >
            <div style={{
              width: '100%', height: '80%',
              background: 'var(--pink-200)',
              borderRadius: f.shape === 'circle' ? '50%' : f.shape === 'rounded' ? 16 : 0,
              border: '2px dashed var(--pink-500)',
              boxSizing: 'border-box',
            }} />
            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 6 }}>{f.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ------- Background panel -------
function BackgroundPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const proj = activeProject(state);
  const setBg = (bg) => dispatch({ type: 'update-canvas', id: canvas.id, patch: { bg } });
  // Merge patch onto existing bg to keep opacity when only value changes and vice versa.
  const patchBg = (patch) => setBg({ type: 'color', value: '#FDFBFC', ...(canvas.bg || {}), ...patch });

  const currentOpacity = canvas.bg?.opacity ?? 1;

  const [saveName, setSaveName] = pS('');
  const [previewBg, setPreviewBg] = pS(null);  // full saved-bg object being previewed

  // Save just the bg layer — a colour/gradient/image + opacity snapshot.
  const handleSaveBgOnly = () => {
    const name = (saveName || `Background ${(state.savedBackgrounds || []).length + 1}`).trim();
    const bgCopy = JSON.parse(JSON.stringify(canvas.bg || { type: 'color', value: '#FDFBFC' }));
    dispatch({
      type: 'save-background',
      entry: {
        id: 'bg_' + Date.now(), name,
        kind: 'bg-only',
        bg: bgCopy,
        createdAt: Date.now(),
      },
    });
    setSaveName('');
  };

  // Save the ENTIRE canvas — bg + every element (shapes, text, logos, images) as a frozen snapshot.
  // Later edits to the source design never affect this saved copy.
  const handleSaveComplete = () => {
    const name = (saveName || `Complete ${(state.savedBackgrounds || []).length + 1}`).trim();
    const bgCopy = JSON.parse(JSON.stringify(canvas.bg || { type: 'color', value: '#FDFBFC' }));
    // Deep-clone elements; the applied copy will get fresh IDs at apply time.
    const elementsCopy = JSON.parse(JSON.stringify(canvas.elements || []));
    dispatch({
      type: 'save-background',
      entry: {
        id: 'bg_' + Date.now(), name,
        kind: 'complete',
        bg: bgCopy,
        elements: elementsCopy,
        w: canvas.w, h: canvas.h,
        createdAt: Date.now(),
      },
    });
    setSaveName('');
  };

  // Apply the previewed saved background to the current canvas or every canvas in the project.
  // For 'complete' snapshots the frozen elements are re-created with fresh IDs and locked=false
  // (still independently editable, per the same guarantee as brand arrangements).
  const applyPreviewTo = (scope) => {
    if (!previewBg || !proj) return;
    const applyTo = (targetCanvas) => {
      const bgCopy = JSON.parse(JSON.stringify(previewBg.bg));
      const patch = { bg: bgCopy };
      if (previewBg.kind === 'complete' && Array.isArray(previewBg.elements)) {
        // Freeze semantics: layer the frozen composition BELOW existing elements as background art.
        // Each element gets a fresh ID + isBackground:true tag so later selection tools can distinguish
        // them. Later edits to the source canvas will not affect these (they were deep-cloned at save).
        const bakedEls = previewBg.elements.map(src => {
          const cloned = JSON.parse(JSON.stringify(src));
          return newElement(cloned.type, { ...cloned, isBackground: true });
        });
        // Preserve the target canvas's own elements above the frozen bake.
        patch.elements = [...bakedEls, ...(targetCanvas.elements || [])];
      }
      dispatch({ type: 'update-canvas', id: targetCanvas.id, patch });
    };
    if (scope === 'current') {
      applyTo(canvas);
    } else if (scope === 'all') {
      for (const c of proj.canvases) applyTo(c);
    }
    setPreviewBg(null);
  };

  const handleUploadImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setBg({ type: 'image', value: ev.target.result, opacity: currentOpacity });
    r.readAsDataURL(f);
    e.target.value = '';
  };
  const uploadRef = pR(null);

  const saved = state.savedBackgrounds || [];

  return (
    <>
      <PanelHeader title="Background" subtitle="Solid, gradient, or image" />

      <SectionLabel>Brand palette</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {BRAND_PALETTE.map(c => (
          <button key={c} onClick={() => setBg({ type: 'color', value: c, opacity: currentOpacity })}
            style={{
              aspectRatio: '1', background: c, borderRadius: 10,
              border: canvas.bg?.value === c ? '2px solid var(--pink-500)' : '1px solid var(--line)',
              transition: 'transform .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>

      <SectionLabel>Gradients</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {GRADIENTS.map((g, i) => (
          <button key={i} onClick={() => setBg({ type: 'gradient', value: g, opacity: currentOpacity })}
            style={{
              aspectRatio: '1', background: g, borderRadius: 10,
              border: canvas.bg?.value === g ? '2px solid var(--pink-500)' : '1px solid var(--line)',
              transition: 'transform .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>

      <SectionLabel>Custom color</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="color" value={canvas.bg?.type === 'color' ? canvas.bg.value : '#FDFBFC'}
          onChange={(e) => setBg({ type: 'color', value: e.target.value, opacity: currentOpacity })} />
        <input type="text" className="text-input"
          value={canvas.bg?.type === 'color' ? canvas.bg.value : ''}
          onChange={(e) => setBg({ type: 'color', value: e.target.value, opacity: currentOpacity })}
          placeholder="#FDFBFC" />
      </div>

      {/* Petal — background image upload */}
      <SectionLabel>Image</SectionLabel>
      <button onClick={() => uploadRef.current?.click()}
        style={{
          width: '100%', padding: '10px 12px', background: 'var(--pink-50)',
          border: '1px dashed var(--line-2)', borderRadius: 10, cursor: 'pointer',
          fontSize: 12, color: 'var(--ink-2)', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
        <Icon name="upload" size={12} /> Upload background image
      </button>
      <input ref={uploadRef} type="file" accept="image/*" hidden onChange={handleUploadImage} />

      {/* Petal — opacity slider. Affects only the background layer, never other elements. */}
      <SectionLabel>Background opacity</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="range" min="0" max="1" step="0.05" value={currentOpacity}
          onChange={(e) => patchBg({ opacity: +e.target.value })}
          style={{ flex: 1 }} />
        <span style={{
          fontSize: 11, color: 'var(--ink-2)', minWidth: 36, textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}>{Math.round(currentOpacity * 100)}%</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4 }}>
        Only the background layer is affected. Elements on the canvas keep their own opacity.
      </div>

      {/* Petal — My Backgrounds. Two save modes: bg-only and complete-canvas (frozen snapshot). */}
      <SectionLabel>My Backgrounds</SectionLabel>
      <input className="text-input"
        value={saveName} onChange={e => setSaveName(e.target.value)}
        placeholder="Name for saved background"
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '8px 10px', marginBottom: 6 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <button className="btn btn-tonal" onClick={handleSaveBgOnly}
          title="Save just the current bg colour/gradient/image + opacity"
          style={{ padding: '8px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Icon name="save" size={11} /> Save bg only
        </button>
        <button className="btn btn-primary" onClick={handleSaveComplete}
          title="Freeze the entire canvas — bg, shapes, text, logos, images — as a reusable snapshot"
          style={{ padding: '8px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Icon name="templates" size={11} /> Save complete canvas
        </button>
      </div>
      {saved.length === 0 ? (
        <div style={{
          fontSize: 11, color: 'var(--ink-3)', textAlign: 'center',
          padding: 16, background: 'var(--pink-50)', borderRadius: 10,
          border: '1px dashed var(--line-2)', lineHeight: 1.5,
        }}>
          <b style={{ color: 'var(--ink-2)' }}>Save bg only</b> keeps just the colour/gradient/image.<br/>
          <b style={{ color: 'var(--ink-2)' }}>Save complete canvas</b> freezes the whole design — shapes, text, logos and all — so later edits to the source never change it.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {saved.map(bg => (
            <div key={bg.id} style={{ position: 'relative' }}>
              <button onClick={() => setPreviewBg(bg)}
                title={`${bg.name}${bg.kind === 'complete' ? ' — complete canvas snapshot' : ' — background only'}`}
                style={{
                  width: '100%', aspectRatio: '1', border: `1px solid ${previewBg?.id === bg.id ? 'var(--pink-500)' : 'var(--line)'}`,
                  borderRadius: 8, padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  background: renderBackgroundCss(bg.bg),
                  boxShadow: previewBg?.id === bg.id ? '0 0 0 2px var(--pink-200)' : 'none',
                }}>
                {/* Composite thumbnail for 'complete' snapshots: render the frozen canvas as SVG behind the bg. */}
                {bg.kind === 'complete' && bg.elements && bg.w && bg.h && window.canvasToSVG && (
                  <img
                    src={'data:image/svg+xml;utf8,' + encodeURIComponent(window.canvasToSVG({ ...bg, name: bg.name }))}
                    alt=""
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'contain', pointerEvents: 'none',
                    }} />
                )}
                {/* Kind badge — top-left corner */}
                <span style={{
                  position: 'absolute', top: 3, left: 3,
                  padding: '1px 5px', borderRadius: 4,
                  fontSize: 8, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  background: bg.kind === 'complete' ? 'var(--ink)' : 'rgba(255,255,255,.85)',
                  color: bg.kind === 'complete' ? 'white' : 'var(--ink-2)',
                }}>
                  {bg.kind === 'complete' ? 'Full' : 'Bg'}
                </span>
              </button>
              <button onClick={() => dispatch({ type: 'remove-background', id: bg.id })}
                title="Remove"
                style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)', border: 'none',
                  cursor: 'pointer', color: 'var(--pink-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <Icon name="x" size={9} />
              </button>
              <div style={{
                fontSize: 9, color: 'var(--ink-2)', marginTop: 3, textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{bg.name}</div>
            </div>
          ))}
        </div>
      )}
      {previewBg && (
        <div style={{
          marginTop: 10, padding: 10, background: 'var(--pink-50)', borderRadius: 10,
          border: '1px solid var(--pink-300)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 8, lineHeight: 1.4 }}>
            <b>{previewBg.name}</b> {previewBg.kind === 'complete' ? '(complete canvas)' : '(background only)'} is previewed only. Apply it to:
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            <button className="btn btn-primary" onClick={() => applyPreviewTo('current')}
              style={{ padding: '7px 10px', fontSize: 12 }}>
              Current slide
            </button>
            <button className="btn btn-tonal" onClick={() => applyPreviewTo('all')}
              style={{ padding: '7px 10px', fontSize: 12 }}>
              All slides in this design
            </button>
            <button className="btn-ghost" onClick={() => setPreviewBg(null)}
              style={{ padding: '5px 10px', fontSize: 11, color: 'var(--ink-3)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Render a Wonder Pads bg object as a CSS `background:` value (used for preview thumbnails).
function renderBackgroundCss(bg) {
  if (!bg) return '#FDFBFC';
  if (bg.type === 'color')    return bg.value;
  if (bg.type === 'gradient') return bg.value;
  if (bg.type === 'image')    return `url("${bg.value}") center/cover no-repeat`;
  return '#FDFBFC';
}

// ---------- RIGHT PANEL (properties) ----------
function RightPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  if (!canvas) return <div style={{ width: 300, background: 'white', borderLeft: '1px solid var(--line)' }} />;
  const selEls = canvas.elements.filter(e => state.selection.includes(e.id));
  const el = selEls[0];

  return (
    <div style={{
      width: 300, background: 'white',
      borderLeft: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      minHeight: 0,
    }}>
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {el ? <ElementProperties el={el} /> : <CanvasProperties />}
      </div>
      <LayersPanel />
    </div>
  );
}

function CanvasProperties() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const preset = SIZE_PRESETS.find(p => p.w === canvas.w && p.h === canvas.h);
  return (
    <>
      <PanelHeader title="Design" subtitle={canvas.name} />

      <SectionLabel>Size</SectionLabel>
      <select className="pk-select" style={{ width: '100%', fontSize: 13, padding: '10px 24px 10px 12px' }}
        value={preset?.id || 'custom'}
        onChange={(e) => {
          const p = SIZE_PRESETS.find(x => x.id === e.target.value);
          if (p) dispatch({ type: 'update-canvas', id: canvas.id, patch: { w: p.w, h: p.h } });
        }}>
        {SIZE_PRESETS.map(p => (
          <option key={p.id} value={p.id}>{p.name} — {p.w}×{p.h}</option>
        ))}
        {!preset && <option value="custom">Custom — {canvas.w}×{canvas.h}</option>}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Width</div>
          <input type="number" className="num-input" value={Math.round(canvas.w)}
            onChange={(e) => dispatch({ type: 'update-canvas', id: canvas.id, patch: { w: +e.target.value || 100 } })} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Height</div>
          <input type="number" className="num-input" value={Math.round(canvas.h)}
            onChange={(e) => dispatch({ type: 'update-canvas', id: canvas.id, patch: { h: +e.target.value || 100 } })} />
        </div>
      </div>

      <SectionLabel>Background</SectionLabel>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: canvas.bg?.value || '#FDFBFC',
          boxShadow: 'var(--shadow-sm)', border: '2px solid white',
        }} />
        <input type="text" className="text-input"
          value={typeof canvas.bg?.value === 'string' ? canvas.bg.value : ''}
          onChange={(e) => dispatch({ type: 'update-canvas', id: canvas.id, patch: { bg: { type: 'color', value: e.target.value } } })} />
      </div>

      <SectionLabel>Page</SectionLabel>
      <input type="text" className="text-input" value={canvas.name}
        onChange={(e) => dispatch({ type: 'update-canvas', id: canvas.id, patch: { name: e.target.value } })} />
    </>
  );
}

function ElementProperties({ el }) {
  const { state, dispatch } = useStore();
  const update = (patch) => dispatch({ type: 'update-element', id: el.id, patch });

  return (
    <>
      <PanelHeader title={typeLabel(el.type)} subtitle={`${Math.round(el.w)} × ${Math.round(el.h)}`} />

      {/* Position & size */}
      <SectionLabel>Position</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <LabeledInput label="X" value={Math.round(el.x)} onChange={v => update({ x: +v })} />
        <LabeledInput label="Y" value={Math.round(el.y)} onChange={v => update({ y: +v })} />
        <LabeledInput label="W" value={Math.round(el.w)} onChange={v => update({ w: Math.max(10, +v) })} />
        <LabeledInput label="H" value={Math.round(el.h)} onChange={v => update({ h: Math.max(10, +v) })} />
      </div>
      <div style={{ marginTop: 10 }}>
        <LabeledInput label="Rotation" value={Math.round(el.rot)} suffix="°" onChange={v => update({ rot: +v })} />
      </div>

      {/* Position on page — 6 quick-align buttons. Distinct from text alignment. */}
      <SectionLabel>Position on page</SectionLabel>
      <PagePositionControls />

      {/* Text-specific */}
      {el.type === 'text' && <TextProps el={el} update={update} />}

      {/* Shape / rect / etc fills */}
      {['rect', 'circle', 'triangle', 'star', 'heart', 'diamond', 'polygon'].includes(el.type) &&
        <ShapeProps el={el} update={update} />}

      {['line', 'arrow'].includes(el.type) &&
        <LineProps el={el} update={update} />}

      {el.type === 'image' && <ImageProps el={el} update={update} />}
      {el.type === 'icon' && <IconProps el={el} update={update} />}
      {el.type === 'frame' && <FrameProps el={el} update={update} />}

      {/* Opacity */}
      <SectionLabel>Opacity</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="range" min="0" max="1" step="0.01"
          value={el.opacity} onChange={(e) => update({ opacity: +e.target.value })} />
        <span style={{ fontSize: 11, color: 'var(--ink-2)', width: 32, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
          {Math.round(el.opacity * 100)}%
        </span>
      </div>

      {/* Layer order */}
      <SectionLabel>Arrange</SectionLabel>
      <LayerArrangeControls elId={el.id} />

      {/* Actions */}
      <SectionLabel>Actions</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn btn-tonal" style={{ justifyContent: 'center' }}
          onClick={() => dispatch({ type: 'duplicate-elements', ids: [el.id] })}>
          <Icon name="duplicate" size={14} /> Duplicate
        </button>
        <button className="btn btn-tonal" style={{ justifyContent: 'center', color: 'var(--pink-600)' }}
          onClick={() => dispatch({ type: 'delete-elements', ids: [el.id] })}>
          <Icon name="trash" size={14} /> Delete
        </button>
      </div>
    </>
  );
}

// Petal — 6 buttons that align the current selection to a side of the canvas.
// Text-alignment (left/center/right of the text inside the box) stays separate.
function PagePositionControls() {
  const { state, dispatch } = useStore();
  const btn = (position, icon, label, title) => (
    <button
      onClick={() => alignElementsToPage(state, dispatch, position)}
      disabled={!state.selection.length}
      title={title}
      style={{
        padding: '8px 6px', borderRadius: 8, border: '1px solid var(--line)',
        background: 'white', color: 'var(--ink-2)', cursor: state.selection.length ? 'pointer' : 'not-allowed',
        opacity: state.selection.length ? 1 : 0.5,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        fontFamily: 'inherit', fontSize: 10, fontWeight: 500,
      }}
      onMouseEnter={e => { if (state.selection.length) e.currentTarget.style.borderColor = 'var(--pink-300)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}>
      <Icon name={icon} size={14} />
      <span>{label}</span>
    </button>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {btn('left',    'align_l',    'Page left',   'Move selection to the left edge of the page')}
      {btn('hcenter', 'align_c',    'H centre',    'Horizontally centre selection on the page')}
      {btn('right',   'align_r',    'Page right',  'Move selection to the right edge of the page')}
      {btn('top',     'chevron_u',  'Page top',    'Move selection to the top edge of the page')}
      {btn('vmiddle', 'minus',      'V middle',    'Vertically centre selection on the page')}
      {btn('bottom',  'chevron_d',  'Page bottom', 'Move selection to the bottom edge of the page')}
    </div>
  );
}

function LayerArrangeControls({ elId }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const idx = canvas.elements.findIndex(e => e.id === elId);
  const max = canvas.elements.length - 1;
  const move = (to) => dispatch({ type: 'reorder-element', id: elId, to: Math.max(0, Math.min(max, to)) });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      <button className="btn btn-tonal" style={{ justifyContent: 'center', fontSize: 12 }}
        disabled={idx >= max} onClick={() => move(max)}>
        <Icon name="arrow_up" size={12} /> To front
      </button>
      <button className="btn btn-tonal" style={{ justifyContent: 'center', fontSize: 12 }}
        disabled={idx >= max} onClick={() => move(idx + 1)}>
        <Icon name="chevron_u" size={12} /> Forward
      </button>
      <button className="btn btn-tonal" style={{ justifyContent: 'center', fontSize: 12 }}
        disabled={idx <= 0} onClick={() => move(idx - 1)}>
        <Icon name="chevron_dn" size={12} /> Backward
      </button>
      <button className="btn btn-tonal" style={{ justifyContent: 'center', fontSize: 12 }}
        disabled={idx <= 0} onClick={() => move(0)}>
        <Icon name="arrow_down" size={12} /> To back
      </button>
      <div style={{ gridColumn: 'span 2', fontSize: 10, color: 'var(--ink-3)', marginTop: 2, textAlign: 'center' }}>
        Layer {idx + 1} of {canvas.elements.length} · shortcuts <span style={{ fontFamily: 'monospace' }}>[</span> / <span style={{ fontFamily: 'monospace' }}>]</span>
      </div>
    </div>
  );
}

function typeLabel(t) {
  return { text: 'Text', rect: 'Rectangle', circle: 'Circle', triangle: 'Triangle',
    star: 'Star', heart: 'Heart', diamond: 'Diamond', polygon: 'Polygon',
    line: 'Line', arrow: 'Arrow', image: 'Image', icon: 'Icon', frame: 'Frame' }[t] || t;
}

function LabeledInput({ label, value, onChange, suffix }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>{label}</div>
      <input type="number" className="num-input" value={value} onChange={e => onChange(e.target.value)} />
      {suffix && <span style={{
        position: 'absolute', right: 8, top: 24,
        fontSize: 11, color: 'var(--ink-3)', pointerEvents: 'none',
      }}>{suffix}</span>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      {label && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)} />
        <input type="text" className="text-input" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginTop: 8 }}>
        {[...BRAND_PALETTE].map(c => (
          <button key={c} onClick={() => onChange(c)}
            style={{
              aspectRatio: '1', background: c, borderRadius: 6,
              border: value === c ? '2px solid var(--pink-500)' : '1px solid var(--line)',
            }} />
        ))}
      </div>
    </div>
  );
}

function TextProps({ el, update }) {
  return (
    <>
      <SectionLabel>Text</SectionLabel>
      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 5 }}>Font library · {ALL_FONT_OPTIONS.length} fonts</div>
      <select className="pk-select" style={{ width: '100%', padding: '10px 24px 10px 12px', fontSize: 13, fontFamily: el.fontFamily }}
        value={el.fontFamily} onChange={e => update({ fontFamily: e.target.value })}>
        <optgroup label="Core fonts">
          {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
        </optgroup>
        <optgroup label="Handmade & extra fonts">
          {MORE_FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
        </optgroup>
      </select>
      <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
        {['Chewy', 'Kalam', 'Shantell Sans'].map(family => (
          <button key={family} onClick={() => update({ fontFamily: family })}
            style={{
              padding: '6px 9px', borderRadius: 7, border: '1px solid var(--line)',
              background: el.fontFamily === family ? 'var(--pink-100)' : 'white',
              color: el.fontFamily === family ? 'var(--pink-600)' : 'var(--ink-2)',
              fontFamily: family, fontSize: 12,
            }}>
            {family}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <LabeledInput label="Size" value={el.fontSize} onChange={v => update({ fontSize: Math.max(6, +v) })} />
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Weight</div>
          <select className="pk-select" style={{ width: '100%' }}
            value={el.fontWeight} onChange={e => update({ fontWeight: +e.target.value })}>
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </div>
      </div>

      {/* Fit text to the current box + a subtle hint about corner-drag scaling */}
      <button onClick={() => {
        // Auto-fit: estimate how many chars fit per line at various sizes, pick the largest that fits.
        const text = String(el.text || '');
        if (!text.trim()) return;
        const rawLines = text.split(/\r?\n/);
        const lineHeight = el.lineHeight || 1.2;
        // Binary search over fontSize (6 to 400)
        let lo = 6, hi = 400, best = el.fontSize || 24;
        while (lo <= hi) {
          const mid = Math.round((lo + hi) / 2);
          const avgCharW = mid * (el.italic ? 0.48 : 0.52);
          const maxCharsPerLine = Math.max(1, Math.floor((el.w - 8) / avgCharW));
          // Count wrapped lines
          let totalLines = 0;
          for (const raw of rawLines) {
            if (!raw.trim()) { totalLines++; continue; }
            const words = raw.split(/\s+/);
            let cur = '';
            for (const w of words) {
              const next = cur ? cur + ' ' + w : w;
              if (next.length <= maxCharsPerLine) cur = next;
              else { if (cur) totalLines++; cur = w; }
            }
            if (cur) totalLines++;
          }
          const neededH = totalLines * mid * lineHeight;
          if (neededH <= el.h) { best = mid; lo = mid + 1; }
          else hi = mid - 1;
        }
        update({ fontSize: best });
      }}
        style={{
          width: '100%', marginTop: 8, padding: '8px 12px',
          background: 'var(--pink-50)', border: '1px solid var(--line)',
          borderRadius: 8, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer',
          fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background .1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-100)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--pink-50)'}
        title="Auto-size the text to fill this box">
        <Icon name="fit" size={12} /> Fit to box
      </button>
      <div style={{
        fontSize: 10, color: 'var(--ink-3)', marginTop: 6, padding: '6px 8px',
        background: 'var(--pink-50)', borderRadius: 6, lineHeight: 1.5,
      }}>
        <b style={{ color: 'var(--ink-2)' }}>Tip:</b> Drag a <b>corner</b> handle to scale the text; drag a <b>side</b> to reflow it.
      </div>

      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        <button className={'icon-btn' + (el.italic ? ' active' : '')} onClick={() => update({ italic: !el.italic })}>
          <Icon name="italic" size={16} />
        </button>
        <button className={'icon-btn' + (el.underline ? ' active' : '')} onClick={() => update({ underline: !el.underline })}>
          <Icon name="underline" size={16} />
        </button>
        <div style={{ width: 1, background: 'var(--line)', margin: '0 6px' }} />
        <button className={'icon-btn' + (el.align === 'left' ? ' active' : '')} onClick={() => update({ align: 'left' })}>
          <Icon name="align_l" size={16} />
        </button>
        <button className={'icon-btn' + (el.align === 'center' ? ' active' : '')} onClick={() => update({ align: 'center' })}>
          <Icon name="align_c" size={16} />
        </button>
        <button className={'icon-btn' + (el.align === 'right' ? ' active' : '')} onClick={() => update({ align: 'right' })}>
          <Icon name="align_r" size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <LabeledInput label="Letter" value={el.letterSpacing} onChange={v => update({ letterSpacing: +v })} />
        <LabeledInput label="Line" value={el.lineHeight} onChange={v => update({ lineHeight: +v })} />
      </div>

      <SectionLabel>Color</SectionLabel>
      <ColorPicker value={el.color} onChange={v => update({ color: v })} />
    </>
  );
}

function ShapeProps({ el, update }) {
  return (
    <>
      <SectionLabel>Fill</SectionLabel>
      <ColorPicker value={el.fill} onChange={v => update({ fill: v })} />

      <SectionLabel>Stroke</SectionLabel>
      <ColorPicker value={el.stroke} onChange={v => update({ stroke: v })} />
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Stroke width</div>
        <input type="range" min="0" max="20" step="0.5" value={el.strokeWidth}
          onChange={e => update({ strokeWidth: +e.target.value })} />
      </div>

      {el.type === 'rect' && (
        <>
          <SectionLabel>Corner radius</SectionLabel>
          <input type="range" min="0" max="200" step="1" value={el.radius}
            onChange={e => update({ radius: +e.target.value })} />
        </>
      )}
      {el.type === 'polygon' && (
        <>
          <SectionLabel>Sides</SectionLabel>
          <input type="range" min="3" max="12" step="1" value={el.sides || 6}
            onChange={e => update({ sides: +e.target.value })} />
        </>
      )}
    </>
  );
}

function LineProps({ el, update }) {
  return (
    <>
      <SectionLabel>Color</SectionLabel>
      <ColorPicker value={el.stroke} onChange={v => update({ stroke: v })} />
      <SectionLabel>Thickness</SectionLabel>
      <input type="range" min="1" max="40" step="1" value={el.strokeWidth}
        onChange={e => update({ strokeWidth: +e.target.value })} />
    </>
  );
}

function ImageProps({ el, update }) {
  const f = el.filter || {};
  return (
    <>
      <SectionLabel>Adjustments</SectionLabel>
      <div style={{ display: 'grid', gap: 8 }}>
        {[
          ['brightness', 'Brightness', 0, 200, 100],
          ['contrast', 'Contrast', 0, 200, 100],
          ['saturate', 'Saturation', 0, 200, 100],
          ['blur', 'Blur', 0, 20, 0],
        ].map(([key, label, mn, mx, def]) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-2)' }}>
              <span>{label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{f[key] ?? def}</span>
            </div>
            <input type="range" min={mn} max={mx} value={f[key] ?? def}
              onChange={e => update({ filter: { ...f, [key]: +e.target.value } })} />
          </div>
        ))}
      </div>

      <SectionLabel>Corner radius</SectionLabel>
      <input type="range" min="0" max="200" value={el.radius || 0}
        onChange={e => update({ radius: +e.target.value })} />
    </>
  );
}

function IconProps({ el, update }) {
  return (
    <>
      <SectionLabel>Icon</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {ICON_LIBRARY.map(name => (
          <button key={name} onClick={() => update({ name })}
            style={{
              aspectRatio: '1', background: el.name === name ? 'var(--pink-200)' : 'var(--pink-50)',
              borderRadius: 8, color: el.name === name ? 'var(--pink-600)' : 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon name={name} size={20} />
          </button>
        ))}
      </div>
      <SectionLabel>Color</SectionLabel>
      <ColorPicker value={el.color} onChange={v => update({ color: v })} />
      <SectionLabel>Stroke width</SectionLabel>
      <input type="range" min="0.5" max="3" step="0.1" value={el.strokeWidth}
        onChange={e => update({ strokeWidth: +e.target.value })} />
    </>
  );
}

function FrameProps({ el, update }) {
  const fileRef = pR(null);
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ src: ev.target.result });
    reader.readAsDataURL(f);
  };
  return (
    <>
      <SectionLabel>Frame shape</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        {['circle', 'rounded', 'square'].map(s => (
          <button key={s} onClick={() => update({ shape: s })}
            style={{
              flex: 1, padding: '10px', background: el.shape === s ? 'var(--pink-200)' : 'var(--pink-50)',
              borderRadius: 10, fontSize: 12, textTransform: 'capitalize',
              color: el.shape === s ? 'var(--pink-600)' : 'var(--ink-2)',
            }}>
            {s}
          </button>
        ))}
      </div>
      <SectionLabel>Image</SectionLabel>
      <button className="btn btn-tonal" style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={14} /> {el.src ? 'Change image' : 'Add image'}
      </button>
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </>
  );
}

// ---------- LAYERS PANEL ----------
function LayersPanel() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = pS(true);
  const canvas = activeCanvas(state);
  if (!canvas) return null;
  const els = [...canvas.elements].reverse(); // top-down

  return (
    <div style={{ borderTop: '1px solid var(--line)', background: 'var(--pink-50)' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
          textTransform: 'uppercase', letterSpacing: '.08em',
        }}>
        <Icon name={open ? 'chevron_d' : 'chevron_r'} size={12} />
        Layers <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>({els.length})</span>
      </button>
      {open && (
        <div className="scroll" style={{ maxHeight: 240, overflowY: 'auto', paddingBottom: 8 }}>
          {els.map((el, i) => {
            const realIdx = canvas.elements.findIndex(e => e.id === el.id);
            const isTop = realIdx === canvas.elements.length - 1;
            const isBottom = realIdx === 0;
            return (
              <div key={el.id}
                onClick={() => dispatch({ type: 'set-selection', ids: [el.id] })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px 6px 16px', cursor: 'pointer',
                  background: state.selection.includes(el.id) ? 'var(--pink-100)' : 'transparent',
                  fontSize: 12,
                  borderLeft: state.selection.includes(el.id) ? '3px solid var(--pink-500)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!state.selection.includes(el.id)) e.currentTarget.style.background = 'rgba(241, 207, 234, 0.4)'; }}
                onMouseLeave={e => { if (!state.selection.includes(el.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: layerPreviewBg(el),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)', fontSize: 10, overflow: 'hidden', flexShrink: 0,
                }}>
                  {layerPreviewGlyph(el)}
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 4 }}>
                  {layerName(el)}
                </span>
                {/* Up/down (up = forward in stack = higher realIdx) */}
                <button className="icon-btn tt" data-tt="Bring forward" style={{ width: 22, height: 22 }}
                  disabled={isTop}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'reorder-element', id: el.id, to: Math.min(realIdx + 1, canvas.elements.length - 1) }); }}>
                  <Icon name="chevron_u" size={12} />
                </button>
                <button className="icon-btn tt" data-tt="Send backward" style={{ width: 22, height: 22 }}
                  disabled={isBottom}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'reorder-element', id: el.id, to: Math.max(realIdx - 1, 0) }); }}>
                  <Icon name="chevron_dn" size={12} />
                </button>
                <button className="icon-btn" style={{ width: 22, height: 22 }}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'update-element', id: el.id, patch: { hidden: !el.hidden } }); }}>
                  <Icon name={el.hidden ? 'eye_off' : 'eye'} size={12} />
                </button>
                <button className="icon-btn" style={{ width: 22, height: 22 }}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'update-element', id: el.id, patch: { locked: !el.locked } }); }}>
                  <Icon name={el.locked ? 'lock' : 'unlock'} size={12} />
                </button>
              </div>
            );
          })}
          {!els.length && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
              No layers yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function layerName(el) {
  if (el.type === 'text') return `“${(el.text || '').slice(0, 20)}”`;
  return typeLabel(el.type);
}
function layerPreviewBg(el) {
  if (el.type === 'rect' || el.type === 'circle') return el.fill;
  if (el.type === 'image') return `url(${el.src}) center/cover`;
  if (el.type === 'frame') return el.bg;
  return 'var(--pink-100)';
}
function layerPreviewGlyph(el) {
  if (el.type === 'text') return <span style={{ fontFamily: el.fontFamily, fontSize: 12 }}>T</span>;
  if (el.type === 'icon') return <Icon name={el.name} size={14} />;
  if (['triangle', 'star', 'heart', 'diamond', 'polygon', 'line', 'arrow'].includes(el.type))
    return <Icon name={el.type === 'polygon' ? 'hexagon' : el.type === 'diamond' ? 'diamond' : el.type} size={14} />;
  return null;
}

// ---------- PAGES LIST (bottom-left) ----------
function PagesList() {
  const { state, dispatch } = useStore();
  const [drag, setDrag] = pS(null);
  const proj = activeProject(state);
  if (!proj) return null;
  const canvases = proj.canvases;
  const activeCanvasId = proj.activeCanvasId;

  return (
    <div style={{
      width: 90, background: 'var(--pink-50)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      minHeight: 0,
    }}>
      <div style={{
        padding: '14px 12px 8px', fontSize: 10, fontWeight: 600,
        color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em',
        textAlign: 'center',
      }}>Pages</div>
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {canvases.map((c, i) => (
          <div key={c.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null && drag !== i) dispatch({ type: 'reorder-canvas', from: drag, to: i }); setDrag(null); }}
            onClick={() => dispatch({ type: 'set-active-canvas', id: c.id })}
            style={{
              marginBottom: 8, padding: 6, borderRadius: 10,
              background: activeCanvasId === c.id ? 'white' : 'transparent',
              cursor: 'pointer', boxShadow: activeCanvasId === c.id ? 'var(--shadow-sm)' : 'none',
              transition: 'background .12s',
            }}
          >
            <div style={{
              aspectRatio: `${c.w}/${c.h}`,
              background: c.bg?.value || '#FDFBFC',
              borderRadius: 4,
              border: '1px solid var(--line)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {c.elements.slice(0, 6).map(el => (
                <div key={el.id} style={{
                  position: 'absolute',
                  left: (el.x / c.w) * 100 + '%',
                  top: (el.y / c.h) * 100 + '%',
                  width: (el.w / c.w) * 100 + '%',
                  height: (el.h / c.h) * 100 + '%',
                  background: el.type === 'text' ? 'transparent' :
                              el.type === 'image' ? `url(${el.src}) center/cover` :
                              (el.fill || 'var(--pink-300)'),
                  borderRadius: el.type === 'circle' ? '50%' : (el.radius || 0) / c.w * 100 + '%',
                  fontSize: 5, color: el.color,
                  fontFamily: el.fontFamily,
                  display: 'flex', alignItems: 'center', justifyContent: el.align,
                  overflow: 'hidden',
                  transform: `rotate(${el.rot}deg)`,
                }}>
                  {el.type === 'text' && (el.text || '').slice(0, 10)}
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 4, fontSize: 10, color: 'var(--ink-2)',
            }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="icon-btn" style={{ width: 18, height: 18 }}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'duplicate-canvas', id: c.id }); }}>
                  <Icon name="duplicate" size={10} />
                </button>
                {canvases.length > 1 && (
                  <button className="icon-btn" style={{ width: 18, height: 18 }}
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this page?')) dispatch({ type: 'delete-canvas', id: c.id }); }}>
                    <Icon name="trash" size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => dispatch({ type: 'add-canvas' })}
        style={{
          margin: '4px 8px 10px', padding: '10px', background: 'white', borderRadius: 10,
          border: '1.5px dashed var(--pink-400)', color: 'var(--pink-500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 11, fontWeight: 500,
        }}>
        <Icon name="plus" size={14} /> Page
      </button>
    </div>
  );
}

Object.assign(window, { LeftRail, LeftPanel, RightPanel, PagesList, LayerArrangeControls, FONT_OPTIONS, PanelHeader, SectionLabel });
