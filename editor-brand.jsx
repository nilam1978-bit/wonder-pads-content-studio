// Brand kit: home section + editor panel + placement generators
const { useState: bS, useRef: bR, useEffect: bE } = React;

const HANDLE_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram', prefix: '@' },
  { id: 'tiktok',    label: 'TikTok',    icon: 'tiktok',    prefix: '@' },
  { id: 'facebook',  label: 'Facebook',  icon: 'facebook',  prefix: '@' },
  { id: 'youtube',   label: 'YouTube',   icon: 'youtube',   prefix: '@' },
  { id: 'twitter',   label: 'X / Twitter', icon: 'twitter', prefix: '@' },
  { id: 'website',   label: 'Website',   icon: 'website',   prefix: '' },
  { id: 'email',     label: 'Email',     icon: 'email',     prefix: '' },
  { id: 'phone',     label: 'Phone',     icon: 'phone',     prefix: '' },
];

const platformById = (id) => HANDLE_PLATFORMS.find(p => p.id === id) || HANDLE_PLATFORMS[0];

// -------------- PLACEMENT GENERATORS --------------
// Each returns an array of elements to add to the current canvas.
function placementElements(kind, canvas, brand) {
  const W = canvas.w, H = canvas.h;
  const primary = brand.colors?.[0] || '#F1CFEA';
  const accent  = brand.colors?.[2] || '#D98BC6';
  const ink     = '#2A1F2A';
  const cream   = '#FDFBFC';

  // Every helper below tags its output with `fromBrand: true` and a semantic `role` so
  // BrandArrangements can identify which elements on a canvas belong to the branding system,
  // and so downstream consumers (undo history, exports, mobile) can style them consistently.
  const logoEl = (x, y, w, h, opacity = 1) => newElement('image', {
    src: brand.logo, x, y, w, h, opacity,
    fromBrand: true, role: 'logo',
  });
  const nameEl = (x, y, w, h, opts = {}) => newElement('text', {
    text: brand.shopName || 'Shop name',
    fontFamily: brand.fontHeading || 'DM Serif Display',
    fontSize: opts.fontSize || Math.round(W * 0.03),
    color: opts.color || ink,
    align: opts.align || 'left',
    x, y, w, h,
    fromBrand: true, role: 'shopName',
    ...opts.extra,
  });
  const tagEl = (x, y, w, h, opts = {}) => newElement('text', {
    text: brand.tagline || '',
    fontFamily: brand.fontBody || 'Instrument Sans',
    fontSize: opts.fontSize || Math.round(W * 0.015),
    color: opts.color || '#56454F',
    align: opts.align || 'left',
    letterSpacing: opts.letterSpacing || 2,
    x, y, w, h,
    fromBrand: true, role: 'tagline',
    ...opts.extra,
  });
  const barEl = (x, y, w, h, color) => newElement('rect', {
    x, y, w, h, fill: color, radius: 0,
    stroke: 'transparent', strokeWidth: 0,
    fromBrand: true, role: 'brandBar',
  });
  const handleTextEl = (x, y, w, h, text, opts = {}) => newElement('text', {
    text,
    fontFamily: brand.fontBody || 'Instrument Sans',
    fontSize: opts.fontSize || Math.round(W * 0.018),
    color: opts.color || ink,
    align: opts.align || 'center',
    letterSpacing: 1,
    x, y, w, h,
    fromBrand: true, role: 'handleText',
  });

  const logoSize = Math.round(W * 0.14);
  const margin = Math.round(W * 0.04);

  if (kind === 'corner-tl') {
    return [logoEl(margin, margin, logoSize, logoSize)];
  }
  if (kind === 'corner-tr') {
    return [logoEl(W - margin - logoSize, margin, logoSize, logoSize)];
  }
  if (kind === 'corner-bl') {
    return [logoEl(margin, H - margin - logoSize, logoSize, logoSize)];
  }
  if (kind === 'corner-br') {
    return [logoEl(W - margin - logoSize, H - margin - logoSize, logoSize, logoSize)];
  }
  if (kind === 'watermark') {
    return [logoEl(W - margin - Math.round(logoSize * 0.7), H - margin - Math.round(logoSize * 0.7), Math.round(logoSize * 0.7), Math.round(logoSize * 0.7), 0.35)];
  }
  if (kind === 'centered') {
    const big = Math.round(Math.min(W, H) * 0.55);
    return [logoEl((W - big) / 2, (H - big) / 2, big, big)];
  }
  if (kind === 'header-bar') {
    const barH = Math.round(H * 0.11);
    const iconSize = Math.round(barH * 0.7);
    return [
      barEl(0, 0, W, barH, primary),
      logoEl(margin, (barH - iconSize) / 2, iconSize, iconSize),
      nameEl(margin + iconSize + 16, 0, W - (margin + iconSize + 16) - margin, barH, {
        fontSize: Math.round(barH * 0.42), color: ink,
        extra: { lineHeight: 1, align: 'left' },
      }),
    ];
  }
  if (kind === 'footer-bar') {
    const barH = Math.round(H * 0.09);
    const iconSize = Math.round(barH * 0.65);
    return [
      barEl(0, H - barH, W, barH, ink),
      logoEl(margin, H - barH + (barH - iconSize) / 2, iconSize, iconSize),
      nameEl(margin + iconSize + 14, H - barH, (W - margin - iconSize - 14) * 0.5, barH, {
        fontSize: Math.round(barH * 0.34), color: cream,
        extra: { lineHeight: 1, align: 'left' },
      }),
      tagEl(W * 0.55, H - barH, W * 0.42, barH, {
        fontSize: Math.round(barH * 0.22), color: 'rgba(253,251,252,0.7)', align: 'right',
        extra: { lineHeight: 1 },
      }),
    ];
  }
  if (kind === 'stacked-center') {
    const size = Math.round(W * 0.24);
    const cx = W / 2;
    const totalTop = H * 0.28;
    return [
      logoEl(cx - size / 2, totalTop, size, size),
      nameEl(0, totalTop + size + 20, W, Math.round(W * 0.07), {
        fontSize: Math.round(W * 0.055), color: ink, align: 'center',
        extra: { lineHeight: 1 },
      }),
      tagEl(0, totalTop + size + 20 + Math.round(W * 0.09), W, Math.round(W * 0.03), {
        fontSize: Math.round(W * 0.02), color: '#56454F', align: 'center', letterSpacing: 3,
        extra: { lineHeight: 1 },
      }),
    ];
  }
  if (kind === 'handle-strip') {
    const barH = Math.round(H * 0.07);
    const y = H - barH;
    const handles = brand.handles.slice(0, 4);
    const els = [barEl(0, y, W, barH, cream)];
    if (!handles.length) {
      els.push(handleTextEl(0, y, W, barH, brand.shopName || 'Add your handles', {
        color: ink, fontSize: Math.round(barH * 0.36),
      }));
      return els;
    }
    const step = W / handles.length;
    handles.forEach((h, i) => {
      const p = platformById(h.platform);
      const cxSlot = i * step + step / 2;
      const iconSize = Math.round(barH * 0.42);
      els.push(newElement('icon', {
        name: p.icon, color: ink, strokeWidth: 1.6,
        x: cxSlot - Math.round(W * 0.14) - iconSize - 10,
        y: y + (barH - iconSize) / 2,
        w: iconSize, h: iconSize,
        fromBrand: true, role: 'handleIcon',
      }));
      els.push(handleTextEl(cxSlot - Math.round(W * 0.14), y, Math.round(W * 0.28), barH, h.value, {
        fontSize: Math.round(barH * 0.3), color: ink, align: 'left',
      }));
    });
    return els;
  }
  return [];
}

const PLACEMENTS = [
  { id: 'corner-tl',     label: 'Corner · TL',   preview: 'corner-tl' },
  { id: 'corner-tr',     label: 'Corner · TR',   preview: 'corner-tr' },
  { id: 'corner-bl',     label: 'Corner · BL',   preview: 'corner-bl' },
  { id: 'corner-br',     label: 'Corner · BR',   preview: 'corner-br' },
  { id: 'watermark',     label: 'Watermark',     preview: 'watermark' },
  { id: 'centered',      label: 'Centered',      preview: 'centered' },
  { id: 'header-bar',    label: 'Header bar',    preview: 'header-bar' },
  { id: 'footer-bar',    label: 'Footer bar',    preview: 'footer-bar' },
  { id: 'stacked-center',label: 'Stacked',       preview: 'stacked-center' },
  { id: 'handle-strip',  label: 'Handle strip',  preview: 'handle-strip' },
];

// Little mini preview of a placement (renders a stylized card)
function PlacementPreview({ id }) {
  const box = (style) => <div style={{ position: 'absolute', ...style }} />;
  const c = 'var(--pink-300)';   // logo color
  const b = 'var(--pink-200)';   // bar color
  const t = 'var(--ink-3)';      // text stripe
  const wrap = { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' };

  if (id === 'corner-tl') return <div style={wrap}>{box({ left: '8%', top: '8%', width: 14, height: 14, borderRadius: '50%', background: c })}</div>;
  if (id === 'corner-tr') return <div style={wrap}>{box({ right: '8%', top: '8%', width: 14, height: 14, borderRadius: '50%', background: c })}</div>;
  if (id === 'corner-bl') return <div style={wrap}>{box({ left: '8%', bottom: '8%', width: 14, height: 14, borderRadius: '50%', background: c })}</div>;
  if (id === 'corner-br') return <div style={wrap}>{box({ right: '8%', bottom: '8%', width: 14, height: 14, borderRadius: '50%', background: c })}</div>;
  if (id === 'watermark') return <div style={wrap}>{box({ right: '10%', bottom: '10%', width: 12, height: 12, borderRadius: '50%', background: c, opacity: .4 })}</div>;
  if (id === 'centered') return <div style={wrap}>{box({ left: '50%', top: '50%', width: 26, height: 26, marginLeft: -13, marginTop: -13, borderRadius: '50%', background: c })}</div>;
  if (id === 'header-bar') return <div style={wrap}>{box({ left: 0, right: 0, top: 0, height: '20%', background: b })}{box({ left: '10%', top: '5%', width: 10, height: 10, borderRadius: '50%', background: c })}{box({ left: '30%', top: '8%', right: '10%', height: 3, background: t, borderRadius: 2 })}</div>;
  if (id === 'footer-bar') return <div style={wrap}>{box({ left: 0, right: 0, bottom: 0, height: '18%', background: 'var(--ink)' })}{box({ left: '10%', bottom: '4%', width: 10, height: 10, borderRadius: '50%', background: c })}{box({ left: '30%', bottom: '7%', right: '10%', height: 3, background: 'rgba(253,251,252,.7)', borderRadius: 2 })}</div>;
  if (id === 'stacked-center') return <div style={wrap}>{box({ left: '50%', top: '30%', width: 18, height: 18, marginLeft: -9, borderRadius: '50%', background: c })}{box({ left: '20%', right: '20%', top: '58%', height: 4, background: t, borderRadius: 2 })}{box({ left: '30%', right: '30%', top: '70%', height: 2, background: t, borderRadius: 2, opacity: .6 })}</div>;
  if (id === 'handle-strip') return <div style={wrap}>{box({ left: 0, right: 0, bottom: 0, height: '18%', background: 'var(--cream, #FDFBFC)', borderTop: '1px solid var(--line)' })}{[0, 1, 2, 3].map(i => (
    <React.Fragment key={i}>
      {box({ left: `${8 + i * 22}%`, bottom: '6%', width: 6, height: 6, background: c, borderRadius: 2 })}
      {box({ left: `${16 + i * 22}%`, bottom: '7.5%', width: 12, height: 3, background: t, borderRadius: 2 })}
    </React.Fragment>
  ))}</div>;
  return null;
}

// -------------- EDITOR: BrandPanel --------------
function BrandPanel() {
  const { state, dispatch } = useStore();
  const canvas = activeCanvas(state);
  const brand = state.brand;

  const applyPlacement = (id) => {
    if (!canvas) return;
    const els = placementElements(id, canvas, brand);
    els.forEach(el => dispatch({ type: 'add-element', element: el }));
  };

  // "Add as element" buttons — every element created here is tagged fromBrand + role
  // so BrandArrangements can identify them (and only them) when saving an arrangement.
  const addSingle = (kind) => {
    if (!canvas) return;
    const w = canvas.w, h = canvas.h;
    let el;
    if (kind === 'logo') {
      const s = Math.round(w * 0.2);
      el = newElement('image', {
        src: brand.logo, x: (w - s) / 2, y: (h - s) / 2, w: s, h: s,
        fromBrand: true, role: 'logo',
      });
    } else if (kind === 'shopName') {
      el = newElement('text', {
        text: brand.shopName, fontFamily: brand.fontHeading, fontSize: Math.round(w * 0.06),
        x: (w - w * 0.8) / 2, y: h / 2 - Math.round(w * 0.04), w: w * 0.8, h: Math.round(w * 0.08),
        align: 'center', color: '#2A1F2A',
        fromBrand: true, role: 'shopName',
      });
    } else if (kind === 'tagline') {
      el = newElement('text', {
        text: brand.tagline, fontFamily: brand.fontBody, fontSize: Math.round(w * 0.022),
        x: (w - w * 0.8) / 2, y: h / 2 - Math.round(w * 0.015), w: w * 0.8, h: Math.round(w * 0.05),
        align: 'center', color: '#56454F', letterSpacing: 2,
        fromBrand: true, role: 'tagline',
      });
    }
    if (el) dispatch({ type: 'add-element', element: el });
  };

  const addHandle = (handle) => {
    if (!canvas) return;
    const w = canvas.w;
    const platform = platformById(handle.platform);
    const iconSize = Math.round(w * 0.05);
    dispatch({ type: 'add-element', element: newElement('icon', {
      name: platform.icon, color: '#2A1F2A', strokeWidth: 1.6,
      x: (canvas.w - w * 0.4) / 2, y: canvas.h / 2 - iconSize / 2,
      w: iconSize, h: iconSize,
      fromBrand: true, role: 'handleIcon',
    })});
    dispatch({ type: 'add-element', element: newElement('text', {
      text: handle.value,
      fontFamily: state.brand.fontBody, fontSize: Math.round(w * 0.028),
      color: '#2A1F2A', letterSpacing: 1,
      x: (canvas.w - w * 0.4) / 2 + iconSize + 12,
      y: canvas.h / 2 - Math.round(w * 0.02),
      w: w * 0.35, h: Math.round(w * 0.05),
      align: 'left',
      fromBrand: true, role: 'handleText',
    })});
  };

  const applyColorToSelection = (color) => {
    state.selection.forEach(id => {
      const el = canvas.elements.find(e => e.id === id);
      if (!el) return;
      if (el.type === 'text') dispatch({ type: 'update-element', id, patch: { color } });
      else if (el.type === 'line' || el.type === 'arrow') dispatch({ type: 'update-element', id, patch: { stroke: color } });
      else dispatch({ type: 'update-element', id, patch: { fill: color } });
    });
  };

  return (
    <>
      <PanelHeader title="Brand" subtitle="One-click apply your brand" />

      {/* Brand summary card */}
      <div style={{
        background: 'var(--pink-50)', borderRadius: 12, padding: 12,
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
          {brand.logo && <img src={brand.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{brand.shopName}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{brand.tagline}</div>
        </div>
      </div>

      <SectionLabel>Logo placement</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {PLACEMENTS.map(p => (
          <button key={p.id} onClick={() => applyPlacement(p.id)}
            style={{
              padding: 6, borderRadius: 10, background: 'var(--pink-50)',
              display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'background .12s, transform .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pink-100)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--pink-50)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              aspectRatio: canvas ? `${canvas.w}/${canvas.h}` : '1',
              background: 'white', borderRadius: 6, border: '1px solid var(--line)',
              position: 'relative', overflow: 'hidden',
            }}>
              <PlacementPreview id={p.preview} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-2)', textAlign: 'left', padding: '0 2px' }}>{p.label}</div>
          </button>
        ))}
      </div>

      <SectionLabel>Add individually</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button className="btn btn-tonal" style={{ justifyContent: 'flex-start', fontSize: 12 }} onClick={() => addSingle('logo')}>
          <Icon name="images" size={12} /> Logo
        </button>
        <button className="btn btn-tonal" style={{ justifyContent: 'flex-start', fontSize: 12 }} onClick={() => addSingle('shopName')}>
          <Icon name="text" size={12} /> Shop name
        </button>
        <button className="btn btn-tonal" style={{ justifyContent: 'flex-start', fontSize: 12, gridColumn: 'span 2' }} onClick={() => addSingle('tagline')}>
          <Icon name="text" size={12} /> Tagline
        </button>
      </div>

      {brand.handles.length > 0 && (
        <>
          <SectionLabel>Social handles</SectionLabel>
          <div style={{ display: 'grid', gap: 6 }}>
            {brand.handles.map(h => {
              const p = platformById(h.platform);
              return (
                <button key={h.id} onClick={() => addHandle(h)}
                  className="btn btn-tonal"
                  style={{ justifyContent: 'flex-start', fontSize: 12, gap: 8, padding: '8px 12px' }}>
                  <Icon name={p.icon} size={14} />
                  <span style={{ color: 'var(--ink)', flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.value || p.label}</span>
                  <Icon name="plus" size={12} />
                </button>
              );
            })}
          </div>
        </>
      )}

      <SectionLabel action={state.selection.length ? <span style={{ fontSize: 10, color: 'var(--pink-500)' }}>tap to apply</span> : null}>Brand colors</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {brand.colors.map((c, i) => (
          <button key={i}
            onClick={() => applyColorToSelection(c)}
            title={state.selection.length ? 'Apply to selection' : 'Select an element first'}
            style={{
              aspectRatio: '1', background: c, borderRadius: 8,
              border: '1px solid var(--line)',
              cursor: state.selection.length ? 'pointer' : 'not-allowed',
              opacity: state.selection.length ? 1 : 0.85,
            }} />
        ))}
      </div>

      {/* Named branding arrangements — save the current arrangement of independent brand elements
          and apply it to other canvases. Applied elements stay independently editable. */}
      <BrandArrangements canvas={canvas} brand={brand} dispatch={dispatch} />

      <div style={{ marginTop: 14, padding: 10, background: 'var(--pink-50)', borderRadius: 10, fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="brand_kit" size={14} style={{ flexShrink: 0, marginTop: 1, color: 'var(--pink-500)' }} />
        <span>Edit your brand kit on the studio home page — logo, name, tagline, handles and colors flow through here.</span>
      </div>
    </>
  );
}

// Petal — save/apply named arrangements of brand elements.
// An "arrangement" is a snapshot of the elements currently on the canvas that came from the
// brand (logo, shopName, tagline, handles, socials). Applying it deep-clones the elements onto
// another canvas with fresh IDs so they remain independently editable and don't flatten.
function BrandArrangements({ canvas, brand, dispatch }) {
  const [name, setName] = bS('');
  const arrangements = brand.savedArrangements || [];

  // Only elements explicitly tagged fromBrand qualify. No fallback to "all elements" —
  // that risks capturing headlines, product images or unrelated decorations as branding.
  const brandingEls = canvas
    ? canvas.elements.filter(el => el.fromBrand === true)
    : [];
  const canSave = brandingEls.length > 0;

  const save = () => {
    if (!canSave) return;
    const cleaned = JSON.parse(JSON.stringify(brandingEls)).map(el => {
      // Drop live-only fields; keep geometry + type + content + fromBrand + role.
      const { id, ...rest } = el;
      return rest;
    });
    const entryName = (name || `Arrangement ${arrangements.length + 1}`).trim();
    dispatch({
      type: 'save-brand-arrangement',
      entry: { id: 'ba_' + Date.now(), name: entryName, elements: cleaned, savedAt: Date.now() },
    });
    setName('');
  };

  const apply = (arr) => {
    if (!canvas || !arr.elements?.length) return;
    // Deep clone with fresh IDs so applied elements remain independently editable.
    // Re-apply fromBrand + role so they stay identifiable for future arrangement captures.
    for (const template of arr.elements) {
      const cloned = JSON.parse(JSON.stringify(template));
      dispatch({
        type: 'add-element',
        element: newElement(cloned.type, {
          ...cloned,
          fromBrand: true,
          role: cloned.role || 'branding',
        }),
      });
    }
  };

  return (
    <>
      <SectionLabel action={
        arrangements.length ? <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{arrangements.length} saved</span> : null
      }>Save arrangement</SectionLabel>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input className="text-input"
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Name this arrangement"
          style={{ flex: 1, fontSize: 12, padding: '8px 10px' }} />
        <button className="btn btn-primary" onClick={save}
          disabled={!canSave}
          title={canSave ? 'Save arrangement' : 'Add or select branding elements first'}
          style={{ padding: '8px 12px', fontSize: 12, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
          Save
        </button>
      </div>
      {canSave ? (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 10, lineHeight: 1.4 }}>
          Captures the {brandingEls.length} branding element{brandingEls.length === 1 ? '' : 's'} currently on this canvas
          (logo, shop name, handles, brand bars, etc). Applying later re-creates them as independently editable elements.
        </div>
      ) : (
        <div style={{
          fontSize: 11, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5,
          padding: 10, background: 'var(--pink-50)', borderRadius: 9,
          border: '1px dashed var(--line-2)',
        }}>
          <b>Add or select branding elements first.</b> Use the buttons above (logo, shop name,
          handles or a placement preset) to add branding to this canvas — arrangements only
          capture elements from the branding system.
        </div>
      )}
      {arrangements.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {arrangements.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 10px', background: 'var(--pink-50)', borderRadius: 9,
            }}>
              <span style={{
                fontSize: 12, flex: 1, minWidth: 0,
                color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{a.name}</span>
              <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{a.elements?.length || 0} els</span>
              <button className="icon-btn compact" title="Apply arrangement" onClick={() => apply(a)}>
                <Icon name="plus" size={12} />
              </button>
              <button className="icon-btn compact" title="Remove arrangement"
                onClick={() => dispatch({ type: 'remove-brand-arrangement', id: a.id })}
                style={{ color: 'var(--ink-3)' }}>
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// -------------- HOME: BrandKitSection + Modal --------------
function BrandKitSection({ onOpenEditor }) {
  const { state, dispatch } = useStore();
  const brand = state.brand;
  const [open, setOpen] = bS(false);

  return (
    <div className="wpr-brand-kit-section" style={{ padding: '10px 40px 30px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 24, color: 'var(--ink)' }}>
            Brand kit
          </h2>
          <p style={{ margin: '2px 0 0', color: 'var(--ink-3)', fontSize: 13 }}>
            Your logo, handles and colors — reused across every design
          </p>
        </div>
        <button className="btn btn-tonal" onClick={() => setOpen(true)}>
          <Icon name="brand_kit" size={14} /> Edit brand kit
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr auto',
        gap: 20, alignItems: 'stretch',
        background: 'white', borderRadius: 20, padding: 24,
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)',
      }}>
        {/* Logo card */}
        <div style={{
          background: 'var(--pink-50)', borderRadius: 14, padding: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          textAlign: 'center',
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: 20, background: 'white',
            boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {brand.logo
              ? <img src={brand.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <Icon name="images" size={40} style={{ color: 'var(--ink-3)' }} />
            }
          </div>
          <div>
            <div style={{ fontFamily: brand.fontHeading || 'DM Serif Display', fontSize: 18, color: 'var(--ink)', lineHeight: 1.1 }}>{brand.shopName}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, fontFamily: brand.fontBody }}>{brand.tagline}</div>
          </div>
        </div>

        {/* Handles & Colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
              Handles
            </div>
            {brand.handles.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {brand.handles.map(h => {
                  const p = platformById(h.platform);
                  return (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', background: 'var(--pink-50)',
                      borderRadius: 999, fontSize: 12, color: 'var(--ink)',
                    }}>
                      <Icon name={p.icon} size={13} style={{ color: 'var(--pink-500)' }} />
                      <span>{h.value || <span style={{ color: 'var(--ink-3)' }}>Add {p.label.toLowerCase()}</span>}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>No handles yet.</div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
              Palette
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {brand.colors.map((c, i) => (
                <div key={i} title={c} style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: c, border: '1px solid var(--line)',
                  boxShadow: 'inset 0 0 0 2px white',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: hint */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minWidth: 140, gap: 12,
        }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: 200 }}>
            When you open a design, use the <b style={{ color: 'var(--ink)' }}>Brand</b> tool in the sidebar to drop these onto your canvas in one click.
          </div>
          <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ justifyContent: 'center' }}>
            <Icon name="brand_kit" size={14} /> Customize
          </button>
        </div>
      </div>

      {open && <BrandKitModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function BrandKitModal({ onClose }) {
  const { state, dispatch } = useStore();
  const brand = state.brand;
  const fileRef = bR(null);

  const update = (patch) => dispatch({ type: 'update-brand', patch });
  const handleLogoUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ logo: ev.target.result });
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 640, width: '92%', maxHeight: '88vh', overflowY: 'auto', overflowX: 'hidden', padding: 28, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: 26 }}>Brand kit</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>These flow into every design you create.</p>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Logo */}
        <ModalSection label="Logo">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: 16, background: 'var(--pink-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '1px solid var(--line)',
            }}>
              {brand.logo
                ? <img src={brand.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <Icon name="images" size={30} style={{ color: 'var(--ink-3)' }} />
              }
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-tonal" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={14} /> Upload new logo
              </button>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              {brand.logo && brand.logo !== 'assets/wpr-logo.png' && (
                <button className="btn btn-ghost" style={{ color: 'var(--pink-600)', fontSize: 12 }}
                  onClick={() => update({ logo: 'assets/wpr-logo.png' })}>
                  Reset to default
                </button>
              )}
            </div>
          </div>
        </ModalSection>

        {/* Text */}
        <ModalSection label="Shop name">
          <input className="text-input" value={brand.shopName}
            onChange={e => update({ shopName: e.target.value })}
            placeholder="Wonder Pads Reusables" />
        </ModalSection>

        <ModalSection label="Tagline">
          <input className="text-input" value={brand.tagline}
            onChange={e => update({ tagline: e.target.value })}
            placeholder="Your one stop shop for healthy menstruation" />
        </ModalSection>

        <ModalSection label="Fonts">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Heading font</div>
              <select className="pk-select" style={{ width: '100%', fontSize: 13, padding: '10px 24px 10px 12px', fontFamily: brand.fontHeading }}
                value={brand.fontHeading} onChange={e => update({ fontHeading: e.target.value })}>
                {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>Body font</div>
              <select className="pk-select" style={{ width: '100%', fontSize: 13, padding: '10px 24px 10px 12px', fontFamily: brand.fontBody }}
                value={brand.fontBody} onChange={e => update({ fontBody: e.target.value })}>
                {FONT_OPTIONS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
              </select>
            </div>
          </div>
        </ModalSection>

        <ModalSection label="Social handles" action={
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => dispatch({ type: 'add-brand-handle', handle: { platform: 'instagram', value: '' } })}>
            <Icon name="plus" size={12} /> Add
          </button>
        }>
          <div style={{ display: 'grid', gap: 8 }}>
            {brand.handles.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: 8 }}>No handles yet. Add one above.</div>
            )}
            {brand.handles.map(h => (
              <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select className="pk-select" style={{ minWidth: 130, padding: '8px 24px 8px 10px' }}
                  value={h.platform}
                  onChange={e => dispatch({ type: 'update-brand-handle', id: h.id, patch: { platform: e.target.value } })}>
                  {HANDLE_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <input className="text-input" value={h.value} style={{ flex: 1 }}
                  placeholder={platformById(h.platform).prefix + 'yourhandle'}
                  onChange={e => dispatch({ type: 'update-brand-handle', id: h.id, patch: { value: e.target.value } })} />
                <button className="icon-btn" onClick={() => dispatch({ type: 'remove-brand-handle', id: h.id })}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        </ModalSection>

        <ModalSection label="Brand colors" action={
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => dispatch({ type: 'add-brand-color', color: '#F1CFEA' })}>
            <Icon name="plus" size={12} /> Add
          </button>
        }>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {brand.colors.map((c, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <input type="color" value={c}
                  onChange={e => {
                    const next = [...brand.colors]; next[i] = e.target.value;
                    dispatch({ type: 'update-brand', patch: { colors: next } });
                  }}
                  style={{ width: 44, height: 44, borderRadius: 12 }} />
                <button
                  onClick={() => dispatch({ type: 'remove-brand-color', index: i })}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'white', boxShadow: 'var(--shadow-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--pink-600)', border: '1px solid var(--line)',
                    opacity: 0, transition: 'opacity .1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  className="color-remove"
                >
                  <Icon name="x" size={10} />
                </button>
              </div>
            ))}
          </div>
        </ModalSection>

        {/* Voice examples — real posts the AI learns from */}
        <ModalSection label="Voice examples" action={
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => dispatch({ type: 'add-voice-example', example: { text: '' } })}>
            <Icon name="plus" size={12} /> Add a post
          </button>
        }>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12, lineHeight: 1.5 }}>
            Paste 2–5 real posts you've written and love. The AI will match this tone more strongly than any rule — cadence, quirks, sentence length, everything.
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(brand.voiceExamples || []).map((ex, idx) => (
              <div key={ex.id} style={{
                background: 'var(--pink-50)', borderRadius: 12, padding: 12,
                border: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <input value={ex.note || ''}
                    onChange={e => dispatch({ type: 'update-voice-example', id: ex.id, patch: { note: e.target.value } })}
                    placeholder={`Example ${idx + 1} · optional label (e.g. "restock post")`}
                    style={{
                      flex: 1, background: 'transparent', border: 'none',
                      fontSize: 11, color: 'var(--ink-3)', fontFamily: 'inherit',
                      textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600,
                      outline: 'none', padding: 0,
                    }} />
                  <button onClick={() => dispatch({ type: 'remove-voice-example', id: ex.id })}
                    className="icon-btn compact" title="Remove"
                    style={{ color: 'var(--ink-3)' }}>
                    <Icon name="x" size={12} />
                  </button>
                </div>
                <textarea
                  value={ex.text}
                  onChange={e => dispatch({ type: 'update-voice-example', id: ex.id, patch: { text: e.target.value } })}
                  placeholder="paste a real post here — caption, TikTok script, whatever you've actually written and love"
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: 10,
                    background: 'white', border: '1px solid transparent',
                    borderRadius: 8, fontSize: 13, color: 'var(--ink)',
                    fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--pink-300)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                />
              </div>
            ))}
            {(!brand.voiceExamples || brand.voiceExamples.length === 0) && (
              <div style={{
                textAlign: 'center', padding: '20px 16px',
                background: 'var(--pink-50)', borderRadius: 12,
                border: '1px dashed var(--line-2)',
                color: 'var(--ink-3)', fontSize: 13,
              }}>
                No examples yet. Click "Add a post" — even one or two will noticeably improve the AI's voice.
              </div>
            )}
          </div>
        </ModalSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ label, action, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8, fontSize: 11, fontWeight: 600,
        color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase',
      }}>
        <span>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, {
  BrandPanel, BrandKitSection, BrandKitModal,
  placementElements, PLACEMENTS, HANDLE_PLATFORMS, platformById,
});
