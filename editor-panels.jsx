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
  { family: 'Dancing Script',    label: 'Dancing Script',    kind: 'script' },
  { family: 'Fredoka',           label: 'Fredoka',           kind: 'display' },
  { family: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', kind: 'sans' },
];

// Shared by every selected-text editor, including generated slides and mobile.
const ALL_FONT_OPTIONS = [...FONT_OPTIONS, ...MORE_FONT_OPTIONS];

// Which weights each font really has (matches the Google Fonts link in index.html).
// Used so Bold / weight choices never fake-bold a font that has only one weight.
const FONT_WEIGHTS = {
  'Bebas Neue': [400], 'Chewy': [400], 'Pacifico': [400], 'DM Serif Display': [400], 'Instrument Serif': [400],
  'Caveat': [400, 500, 600, 700], 'Dancing Script': [400, 500, 600, 700],
  'Cormorant Garamond': [400, 600], 'Libre Baskerville': [400, 700], 'Kalam': [300, 400, 700],
  'Lora': [400, 500, 600, 700], 'Instrument Sans': [400, 500, 600, 700],
  'Josefin Sans': [300, 400, 500, 600, 700], 'Space Grotesk': [300, 400, 500, 600, 700], 'Fredoka': [300, 400, 500, 600, 700],
  'Montserrat': [300, 400, 500, 600, 700, 800], 'Nunito': [300, 400, 500, 600, 700, 800], 'Poppins': [300, 400, 500, 600, 700, 800],
  'Raleway': [300, 400, 500, 600, 700, 800], 'Shantell Sans': [300, 400, 500, 600, 700, 800], 'Plus Jakarta Sans': [300, 400, 500, 600, 700, 800],
  'Fraunces': [100, 200, 300, 400, 500, 600, 700, 800, 900], 'Playfair Display': [400, 500, 600, 700, 800, 900],
};
const WEIGHT_NAMES = { 100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };
const FONT_GROUPS = [
  { kind: 'serif', label: 'Serif' }, { kind: 'sans', label: 'Sans-serif' },
  { kind: 'script', label: 'Handwritten & script' }, { kind: 'display', label: 'Display & fun' },
];
const weightsFor = (family) => FONT_WEIGHTS[family] || [400, 700];
const nearestWeight = (family, w) => {
  const list = weightsFor(family); const n = Number(w) || 400;
  return list.reduce((best, x) => Math.abs(x - n) < Math.abs(best - n) ? x : best, list[0]);
};
const regularWeightFor = (family) => weightsFor(family).includes(400) ? 400 : weightsFor(family)[0];
const boldWeightFor = (family) => [700, 600].find(w => weightsFor(family).includes(w)) || null;
const isBoldText = (el) => Number(el.fontWeight) >= 600;
// Returns the patch for the Bold button, or null if this font has no bold.
const toggleBoldPatch = (el) => {
  if (isBoldText(el)) return { fontWeight: regularWeightFor(el.fontFamily) };
  const b = boldWeightFor(el.fontFamily);
  return b ? { fontWeight: b } : null;
};
// Waits for the font to be ready (so wrapping is measured correctly), then returns the patch.
async function fontChangePatch(el, family) {
  const weight = nearestWeight(family, el.fontWeight);
  try { await document.fonts.load(`${el.italic ? 'italic ' : ''}${weight} 32px "${family}"`); } catch (e) {}
  return { fontFamily: family, fontWeight: weight };
}

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
  const [more,setMore]=React.useState(false);
  return (
    <div style={{
      width: 84, background: 'var(--pink-100)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
      padding: '12px 0', gap: 4,
    }}>
      {RAIL_TOOLS.filter(t=>more||['text','images','brand','bg'].includes(t.id)).map(t => (
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
      <button className="btn-ghost" style={{padding:12}} onClick={()=>setMore(v=>!v)}>☰ More</button>
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

// Templates are drawn for one page size (e.g. 1080 x 1350). When applied to a page of another
// size, scale and centre them so nothing runs off the edge.
function fitTemplateToCanvas(tpl, canvas) {
  const from = tpl.preset || { w: 1080, h: 1080 };
  const s = Math.min(canvas.w / from.w, canvas.h / from.h);
  const dx = (canvas.w - from.w * s) / 2, dy = (canvas.h - from.h * s) / 2;
  if (Math.abs(s - 1) < 0.001 && Math.abs(dx) < 1 && Math.abs(dy) < 1) return tpl.els.map(e => newElement(e.type, e.patch));
  return tpl.els.map(e => {
    const q = { ...e.patch };
    for (const k of ['x', 'w']) if (typeof q[k] === 'number') q[k] = k === 'x' ? q[k] * s + dx : q[k] * s;
    for (const k of ['y', 'h']) if (typeof q[k] === 'number') q[k] = k === 'y' ? q[k] * s + dy : q[k] * s;
    for (const k of ['fontSize', 'letterSpacing', 'radius', 'strokeWidth']) if (typeof q[k] === 'number') q[k] = q[k] * s;
    return newElement(e.type, q);
  });
}

function TemplatesPanel() {
  const { state, dispatch } = useStore();
  // Use the Wonder Pads shop-specific starters from the home page (not the old generic 4).
  const list = window.STARTER_TEMPLATES || TEMPLATES;
  const proj = activeProject(state);
  const appliedName = proj?.appliedStarter;
  const [tab, setTab] = pS('templates'); // 'templates' | 'blank'

  const applyTemplate = (tpl) => {
    const canvas = activeCanvas(state);
    const isHook=tpl.slideKind==='hook'||(!tpl.slideKind&&(canvas.slideKind==='hook'||canvas.name==='Cover'));
    const isCta=tpl.slideKind==='cta'||(!tpl.slideKind&&(canvas.slideKind==='cta'||canvas.name==='Closing slide'));
    const branding = tpl.brandLayout ? brandBackgroundElements(isHook?'hook':isCta?'signature':tpl.brandLayout, canvas, state.brand) : [];
    const elements = tpl.brandLayout ? [
      ...branding.filter(e=>e.type==='rect'),
      ...canvas.elements.filter(e=>!e.fromBrand),
      ...branding.filter(e=>e.type!=='rect'),
    ] : fitTemplateToCanvas(tpl, canvas);
    if(tpl.slideKind&&!elements.some(e=>e.type==='text'&&!e.fromBrand)) elements.push(...starterBackgroundElements(tpl,canvas,state.brand).filter(e=>!e.fromBrand));
    dispatch({ type: 'update-canvas', id: canvas.id, patch: { elements:cleanSlideSwipe(elements,canvas), ...(tpl.slideKind?{slideKind:tpl.slideKind}:{}), bg: { type: 'color', value: tpl.bg } } });
    if(tpl.brandLayout&&(isHook||isCta)&&proj){
      for(const other of proj.canvases){
        if(other.id!==canvas.id&&(other.slideKind==='hook'||other.slideKind==='cta'||other.name==='Cover'||other.name==='Closing slide'))
          dispatch({type:'update-canvas',id:other.id,patch:{bg:{type:'color',value:tpl.bg}}});
      }
    }
    // Track which starter is now applied so the chip in the top bar updates.
    if (proj) {
      dispatch({ type: 'update-project', id: proj.id, patch: { appliedStarter: tpl.name } });
    }
  };
  return (
    <>
      <PanelHeader title="Branded backgrounds" subtitle="Blank space for your words · adapts to your slide size" />

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
  const {state} = useStore();
  const preset = template.preset || SIZE_PRESETS[0];
  const preview = {w:preset.w,h:preset.h,bg:{type:'color',value:template.bg},elements:template.brandLayout ? starterBackgroundElements(template,preset,state.brand) : template.els.map(e=>newElement(e.type,e.patch))};
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
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}><MiniPreview canvas={preview} maxW={160} maxH={180}/></div>
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
          position:'relative',background:'rgba(253,251,252,.94)',borderRadius:4,padding:4,
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
    { ...SLIDE_TEXT_STYLES.h1, label: 'Add a heading', textStyle:'h1', text: 'Heading' },
    { ...SLIDE_TEXT_STYLES.h2, label: 'Add a subheading', textStyle:'h2', text: 'Subheading' },
    { ...SLIDE_TEXT_STYLES.body, label: 'Add body text', textStyle:'body', text: 'A little body text goes here' },
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
    try { return JSON.parse(localStorage.getItem('simple-preview-uploads') || '[]'); } catch { return []; }
  });
  const fileRef = pR(null);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target.result;
        const newList = [src, ...uploads].slice(0, 24);
        setUploads(newList);
        try { localStorage.setItem('simple-preview-uploads', JSON.stringify(newList)); } catch {}
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
  const applyCurrentBgToAll = () => {
    if (!proj || !canvas) return;
    const bg = JSON.parse(JSON.stringify(canvas.bg || { type: 'color', value: '#FDFBFC' }));
    for (const target of proj.canvases) dispatch({ type: 'update-canvas', id: target.id, patch: { bg } });
  };

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
      <button className="btn btn-tonal" onClick={applyCurrentBgToAll}
        disabled={!proj || proj.canvases.length < 2}
        style={{ width:'100%', marginTop:10, padding:'9px 10px', fontSize:12 }}>
        Apply current background to all slides
      </button>

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


// Tap-to-open section: the title is always visible, the tools appear when tapped.
function PropFold({ title, children }) {
  return (
    <details className="prop-fold" style={{ margin: '10px 0', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--pink-50)' }}>
      <summary style={{ padding: '12px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}<span className="prop-chev" aria-hidden="true" style={{ color: 'var(--ink-3)', transition: 'transform .15s' }}>▾</span>
      </summary>
      <div style={{ padding: '0 14px 14px' }}>{children}</div>
    </details>
  );
}

// One small row of the actions people reach for most: copy, delete and layer order.
function ElementQuickBar({ el }) {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const idx = canvas.elements.findIndex(e => e.id === el.id), max = canvas.elements.length - 1;
  const move = (to) => dispatch({ type: 'reorder-element', id: el.id, to: Math.max(0, Math.min(max, to)) });
  const btn = (label, icon, onClick, opts = {}) => (
    <button key={label} className="btn btn-tonal" title={{Up:'Move forward one layer',Down:'Move backward one layer',Front:'Bring to front',Back:'Send to back',Copy:'Duplicate',Delete:'Delete'}[label]} aria-label={label} disabled={opts.disabled} onClick={onClick}
      style={{ flexDirection: 'column', gap: 2, padding: '8px 2px', justifyContent: 'center', minWidth: 0, fontSize: 10, color: opts.danger ? 'var(--pink-600)' : undefined }}>
      <Icon name={icon} size={15} />{label}
    </button>
  );
  return (
    <div role="group" aria-label="Quick actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, margin: '8px 0 12px' }}>
      {btn('Copy', 'duplicate', () => dispatch({ type: 'duplicate-elements', ids: [el.id] }))}
      {btn('Delete', 'trash', () => dispatch({ type: 'delete-elements', ids: [el.id] }), { danger: true })}
      {btn('Front', 'arrow_up', () => move(max), { disabled: idx >= max })}
      {btn('Up', 'chevron_u', () => move(idx + 1), { disabled: idx >= max })}
      {btn('Down', 'chevron_dn', () => move(idx - 1), { disabled: idx <= 0 })}
      {btn('Back', 'arrow_down', () => move(0), { disabled: idx <= 0 })}
    </div>
  );
}

function ElementProperties({ el }) {
  const { state, dispatch } = useStore();
  const update = (patch) => dispatch({ type: 'update-element', id: el.id, patch });

  return (
    <>
      <style>{`details.prop-fold>summary{list-style:none}details.prop-fold>summary::-webkit-details-marker{display:none}details.prop-fold[open]>summary .prop-chev{transform:rotate(180deg)}`}</style>
      <PanelHeader title={typeLabel(el.type)} subtitle={`${Math.round(el.w)} × ${Math.round(el.h)}`} />
      <ElementQuickBar el={el} />

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

      {el.type === 'text' && <PropFold title="Weight, spacing & fit"><TextProps el={el} update={update} mode="advanced" /></PropFold>}

      <PropFold title="Opacity">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min="0" max="1" step="0.01"
            value={el.opacity} onChange={(e) => update({ opacity: +e.target.value })} />
          <span style={{ fontSize: 11, color: 'var(--ink-2)', width: 32, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {Math.round(el.opacity * 100)}%
          </span>
        </div>
      </PropFold>

      <PropFold title="Position & size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <LabeledInput label="X" value={Math.round(el.x)} onChange={v => update({ x: +v })} />
          <LabeledInput label="Y" value={Math.round(el.y)} onChange={v => update({ y: +v })} />
          <LabeledInput label="W" value={Math.round(el.w)} onChange={v => update({ w: Math.max(10, +v) })} />
          <LabeledInput label="H" value={Math.round(el.h)} onChange={v => update({ h: Math.max(10, +v) })} />
        </div>
        <div style={{ marginTop: 10 }}>
          <LabeledInput label="Rotation" value={Math.round(el.rot)} suffix="°" onChange={v => update({ rot: +v })} />
        </div>
        <SectionLabel>Position on page</SectionLabel>
        <PagePositionControls />
      </PropFold>

      <ElementQuickBar el={el} />
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
  const { state } = useStore();
  const brand = (state.brand?.colors || []).filter(Boolean);
  const rows = [
    ['Brand', brand.length ? brand : BRAND_PALETTE],
    ['Neutral', NEUTRAL_PALETTE],
    ['Soft accents', COMPLEMENT_PALETTE],
  ];
  return (
    <div>
      {label && <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={value === 'transparent' ? '#ffffff' : value}
          onChange={e => onChange(e.target.value)} />
        <input type="text" className="text-input" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      {rows.map(([name, colors]) => (
        <div key={name} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 5 }}>{name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {colors.map(c => (
              <button key={name + c} aria-label={`Colour ${c}`} onClick={() => onChange(c)}
                style={{
                  width: 30, height: 30, background: c, borderRadius: 8, flexShrink: 0,
                  border: String(value).toLowerCase() === c.toLowerCase() ? '2.5px solid var(--pink-500)' : '1px solid var(--line-2)',
                  boxSizing: 'border-box',
                }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Live (drag) editing helpers ----------
// While a slider is dragged the element updates instantly but history is only
// written once, when the finger lifts - so Undo goes back to "before the drag".
function useLiveElementEdit(elId) {
  const { state, dispatch } = useStore();
  const snap = pR(null);
  const stateRef = pR(state); stateRef.current = state;
  const live = (patch) => {
    if (!snap.current) snap.current = JSON.parse(JSON.stringify(activeProject(stateRef.current)));
    dispatch({ type: 'update-element', id: elId, transient: true, patch });
  };
  const done = () => {
    if (snap.current) { dispatch({ type: 'commit-transient', snapshot: snap.current }); snap.current = null; }
  };
  pE(() => () => { if (snap.current) { dispatch({ type: 'commit-transient', snapshot: snap.current }); snap.current = null; } }, []);
  return { live, done };
}

function LiveSlider({ value, min, max, step = 1, onLive, onDone, label }) {
  const ref = pR(null);
  const doneRef = pR(onDone); doneRef.current = onDone;
  pE(() => {
    const node = ref.current; if (!node) return;
    const fire = () => doneRef.current && doneRef.current();
    node.addEventListener('change', fire);
    return () => node.removeEventListener('change', fire);
  }, []);
  return <input ref={ref} className="big-range" type="range" aria-label={label}
    min={min} max={max} step={step} value={value}
    onChange={e => onLive(+e.target.value)} />;
}

const stepperStyle = {
  width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'var(--pink-100)',
  color: 'var(--ink)', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// One slider row: [ - ] ====o==== [ + ]  with the value shown (and typeable) above.
function SliderRow({ label, value, min, max, step = 1, unit = '', onLive, onDone, onStep, display }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--pink-600)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{display ?? value}{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={stepperStyle} aria-label={`Decrease ${label}`} onClick={() => onStep(-step)}>−</button>
        <LiveSlider value={value} min={min} max={max} step={step} onLive={onLive} onDone={onDone} label={label} />
        <button style={stepperStyle} aria-label={`Increase ${label}`} onClick={() => onStep(step)}>+</button>
      </div>
    </div>
  );
}

// Font size as a slider (plus small - / + steps) instead of typing a number.
function FontSizeControl({ el }) {
  const { state, dispatch } = useStore();
  const { live, done } = useLiveElementEdit(el.id);
  const canvas = activeCanvas(state);
  const size = Math.round(el.fontSize || 24);
  const max = Math.max(240, size);
  const setSize = (v) => dispatch({ type: 'update-element', id: el.id, patch: { fontSize: clamp(v, 6, 600) } });
  return (
    <div>
      <SliderRow label="Text size" value={size} min={10} max={max} unit=" px"
        onLive={v => live({ fontSize: v })} onDone={done} onStep={d => setSize(size + d)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {[['Small', 32], ['Body', 44], ['Heading', 76], ['Big', 112]].map(([name, v]) => (
          <button key={name} className="btn btn-tonal" style={{ padding: '8px 12px', fontSize: 12 }}
            onClick={() => setSize(Math.round(v * Math.min(canvas.w, canvas.h) / 1080))}>{name}</button>
        ))}
        <button className="btn btn-tonal" style={{ padding: '8px 12px', fontSize: 12 }}
          onClick={() => setSize(fitTextSize(el, Math.max(40, canvas.h - el.y - 150), el.fontSize || 48))}>Fit to slide</button>
      </div>
    </div>
  );
}

// Every font, shown in its own typeface, grouped. Tap one to apply.
function FontPicker({ el, maxHeight = 260 }) {
  const { dispatch } = useStore();
  const pick = async (family) => {
    const patch = await fontChangePatch(el, family);
    dispatch({ type: 'update-element', id: el.id, patch });
  };
  return (
    <div className="scroll" style={{ maxHeight, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 12, background: 'white' }}>
      {FONT_GROUPS.map(g => {
        const fonts = ALL_FONT_OPTIONS.filter(f => f.kind === g.kind);
        if (!fonts.length) return null;
        return (
          <div key={g.kind}>
            <div style={{ position: 'sticky', top: 0, background: 'var(--pink-50)', padding: '6px 12px', fontSize: 10, fontWeight: 700,
              letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', zIndex: 1 }}>{g.label}</div>
            {fonts.map(f => {
              const on = el.fontFamily === f.family;
              return (
                <button key={f.family} onClick={() => pick(f.family)} aria-pressed={on}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '11px 14px', minHeight: 46, textAlign: 'left', borderBottom: '1px solid var(--line)',
                    background: on ? 'var(--pink-100)' : 'white', color: on ? 'var(--pink-600)' : 'var(--ink)' }}>
                  <span style={{ fontFamily: `"${f.family}", sans-serif`, fontSize: 21, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
                  {on && <Icon name="check" size={16} />}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Weight choices limited to the weights this font really has.
function WeightChips({ el, update }) {
  const list = weightsFor(el.fontFamily);
  if (list.length < 2) return <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>This font has one weight (Regular).</div>;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {list.map(w => (
        <button key={w} onClick={() => update({ fontWeight: w })}
          style={{ padding: '9px 12px', minHeight: 40, borderRadius: 10, fontSize: 13, fontWeight: w,
            fontFamily: `"${el.fontFamily}", sans-serif`,
            background: Number(el.fontWeight) === w ? 'var(--pink-200)' : 'var(--pink-50)',
            color: Number(el.fontWeight) === w ? 'var(--pink-600)' : 'var(--ink)' }}>
          {WEIGHT_NAMES[w] || w}
        </button>
      ))}
    </div>
  );
}

function SlideTextStyleControls({el,update}) {
  const {state,dispatch}=useStore(),canvas=activeCanvas(state);
  const [busy,setBusy]=React.useState(false);
  const load=()=>Promise.all([document.fonts.load('600 76px "Cormorant Garamond"'),document.fonts.load('400 46px "Montserrat"'),document.fonts.load('500 30px "Montserrat"')]);
  const apply=async scope=>{setBusy(true);try{await load();dispatch({type:'apply-slide-text-styles',scope});}finally{setBusy(false);}};
  return <div style={{marginBottom:16}}><label>Text style<select aria-label="Text style" className="pk-select" style={{width:'100%',padding:12,margin:'6px 0'}} value={slideTextRole(el,canvas)} onChange={async e=>{
    const role=e.target.value;await load();const patch={...SLIDE_TEXT_STYLES[role],textStyle:role,fontSize:SLIDE_TEXT_STYLES[role].fontSize*Math.min(canvas.w,canvas.h)/1080};delete patch.label;update(patch);
  }}>{Object.entries(SLIDE_TEXT_STYLES).map(([key,s])=><option key={key} value={key}>{s.label}</option>)}</select></label><div style={{display:'flex',flexWrap:'wrap',gap:8}}><button className="btn btn-tonal" disabled={busy} onClick={()=>apply('current')}>Apply styles to this slide</button><button className="btn btn-tonal" disabled={busy} onClick={()=>apply('all')}>Apply styles to all slides</button></div><p style={{fontSize:12}}>Uses each text role. Keeps your words, colours and branding. Undo is available.</p></div>;
}

function TextProps({ el, update, mode='basic' }) {
  const {state}=useStore();
  const [aiBusy,setAiBusy]=React.useState(false),[aiError,setAiError]=React.useState('');
  const improve=async()=>{
    if(!confirm('Rewrite this selected text? The other elements and slides will stay unchanged.'))return;
    setAiBusy(true);setAiError('');
    try{const text=await aiGenerate({brand:state.brand,vocab:state.vocab,provider:'gemini',task:'Improve this one carousel text element. Keep the meaning. Return only the revised words, without labels or commentary.',input:el.text,platform:'Instagram carousel'});if(text?.trim())update({text:text.trim()});else throw new Error('No revised text returned.');}catch(e){setAiError(e.message);}finally{setAiBusy(false);}
  };
  return (
    <>
      {mode==='basic'&&<>
      <SectionLabel>Text</SectionLabel>
      <SlideTextStyleControls el={el} update={update}/>
      <textarea className="text-input" value={el.text || ''}
        aria-label="Edit selected text"
        onChange={e => update({ text: e.target.value })}
        style={{ width: '100%', minHeight: 96, resize: 'vertical', lineHeight: 1.45,
          padding: '10px 12px', boxSizing: 'border-box', marginBottom: 10 }} />
      <button className="btn btn-tonal" disabled={aiBusy} onClick={improve} style={{ width: '100%', justifyContent: 'center', marginBottom: 6 }}>{aiBusy?'Improving…':'✦ Improve with AI'}</button>
      {aiError&&<p role="alert">{aiError}</p>}
      <SectionLabel>Font</SectionLabel>
      <FontPicker el={el} maxHeight={220}/>
      <SectionLabel>Size</SectionLabel>
      <FontSizeControl el={el}/>
      <div style={{display:'flex',gap:8,margin:'14px 0 12px'}}>{[['left','align_l'],['center','align_c'],['right','align_r']].map(([align,icon])=><button className={'btn btn-tonal'} aria-label={'Align '+align} aria-pressed={el.align===align} key={align} onClick={()=>update({align})} style={{flex:1,justifyContent:'center',background:el.align===align?'var(--pink-200)':undefined}}><Icon name={icon} size={16}/></button>)}</div>
      <ColorPicker value={el.color} onChange={color=>update({color})}/>
      <div style={{display:'flex',gap:8,margin:'12px 0'}}><button className="btn btn-tonal" disabled={!boldWeightFor(el.fontFamily)} title={boldWeightFor(el.fontFamily)?'':'This font has no bold'} aria-pressed={isBoldText(el)} onClick={()=>{const p=toggleBoldPatch(el);if(p)update(p);}} style={{flex:1,justifyContent:'center',fontWeight:700,background:isBoldText(el)?'var(--pink-200)':undefined}}>Bold</button><button className="btn btn-tonal" aria-pressed={!!el.italic} onClick={()=>update({italic:!el.italic})} style={{flex:1,justifyContent:'center',fontStyle:'italic',background:el.italic?'var(--pink-200)':undefined}}>Italic</button><button className="btn btn-tonal" aria-pressed={!!el.underline} onClick={()=>update({underline:!el.underline})} style={{flex:1,justifyContent:'center',textDecoration:'underline',background:el.underline?'var(--pink-200)':undefined}}>Underline</button></div>
      </>}
      {mode==='advanced'&&<>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Weight</div>
          <select className="pk-select" style={{ width: '100%' }}
            value={el.fontWeight} onChange={e => update({ fontWeight: +e.target.value })}>
            {weightsFor(el.fontFamily).map(w => <option key={w} value={w}>{WEIGHT_NAMES[w] || w}</option>)}
          </select>
        </div>
        <LabeledInput label="Letter spacing" value={el.letterSpacing} onChange={v => update({ letterSpacing: +v })} />
        <LabeledInput label="Line spacing" value={el.lineHeight} onChange={v => update({ lineHeight: +v })} />
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

      </>}
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


Object.assign(window, { LeftRail, LeftPanel, RightPanel, LayerArrangeControls, FONT_OPTIONS, PanelHeader, SectionLabel, FONT_WEIGHTS, WEIGHT_NAMES, FONT_GROUPS, weightsFor, nearestWeight, regularWeightFor, boldWeightFor, isBoldText, toggleBoldPatch, fontChangePatch, useLiveElementEdit, LiveSlider, SliderRow, FontSizeControl, FontPicker, WeightChips, ColorPicker });
