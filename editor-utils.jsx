// Multi-project state + reducer + history + helpers
const { useReducer, useEffect, useRef, useState, useCallback, useMemo, createContext, useContext } = React;

const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const now = () => Date.now();

// Canvas size presets
const SIZE_PRESETS = [
  { id: 'ig-post',      name: 'Instagram Post',     w: 1080, h: 1080, group: 'Social' },
  { id: 'ig-portrait',  name: 'Instagram Portrait', w: 1080, h: 1350, group: 'Social' },
  { id: 'ig-story',     name: 'Instagram Story',    w: 1080, h: 1920, group: 'Social' },
  { id: 'fb-post',      name: 'Facebook Post',      w: 1200, h: 630,  group: 'Social' },
  { id: 'yt-thumb',     name: 'YouTube Thumbnail',  w: 1280, h: 720,  group: 'Social' },
  { id: 'tiktok',       name: 'TikTok Video',       w: 1080, h: 1920, group: 'Social' },
  { id: 'presentation', name: 'Presentation 16:9',  w: 1920, h: 1080, group: 'Print' },
  { id: 'a4-l',         name: 'A4 Landscape',       w: 1123, h: 794,  group: 'Print' },
  { id: 'poster',       name: 'Poster 18×24',       w: 1800, h: 2400, group: 'Print' },
  { id: 'square-sm',    name: 'Square 800',         w: 800,  h: 800,  group: 'Print' },
];

const defaultCanvas = (name = 'Page 1', preset = SIZE_PRESETS[0]) => ({
  id: uid(),
  name,
  w: preset.w, h: preset.h,
  bg: { type: 'color', value: '#FDFBFC' },
  elements: [],
});

const newElement = (type, patch = {}) => {
  const base = {
    id: uid(), type,
    x: 100, y: 100, w: 200, h: 200,
    rot: 0, opacity: 1, locked: false, hidden: false,
  };
  const defaults = {
    text: { text: 'Add your text', fontFamily: 'DM Serif Display', fontSize: 64, fontWeight: 400, italic: false, underline: false, align: 'center', color: '#2A1F2A', letterSpacing: 0, lineHeight: 1.2 },
    rect: { fill: '#F1CFEA', stroke: 'transparent', strokeWidth: 0, radius: 12 },
    circle: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    triangle: { fill: '#E8B8DC', stroke: 'transparent', strokeWidth: 0 },
    line: { stroke: '#2A1F2A', strokeWidth: 4 },
    star: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    heart: { fill: '#D98BC6', stroke: 'transparent', strokeWidth: 0 },
    polygon: { fill: '#F1CFEA', stroke: 'transparent', strokeWidth: 0, sides: 6 },
    diamond: { fill: '#E8B8DC', stroke: 'transparent', strokeWidth: 0 },
    arrow: { stroke: '#2A1F2A', strokeWidth: 4 },
    image: { src: '', filter: { brightness: 100, contrast: 100, saturate: 100, blur: 0 }, radius: 0 },
    icon: { name: 'sparkle', color: '#C260A8', strokeWidth: 1.5 },
    frame: { shape: 'circle', src: '', bg: '#F7E1F0' },
  };
  return { ...base, ...defaults[type], ...patch };
};

// -------------- Project factory --------------
const newProject = (name, preset = SIZE_PRESETS[0], seedElements = []) => {
  const canvas = defaultCanvas('Page 1', preset);
  canvas.elements = seedElements.map(e => newElement(e.type, e.patch || e));
  return {
    id: uid(),
    name: name || 'Untitled design',
    createdAt: now(),
    updatedAt: now(),
    thumbnail: null,
    canvases: [canvas],
    activeCanvasId: canvas.id,
  };
};

// -------------- Reducer with history --------------
const HISTORY_LIMIT = 60;

function reducer(state, action) {
  // History is per active project. We mutate state.projects, then push snapshot to state.past.
  const activeProjectMutate = (mutator, opts = {}) => {
    const idx = state.projects.findIndex(p => p.id === state.activeProjectId);
    if (idx < 0) return state;
    const proj = state.projects[idx];
    const next = mutator(proj);
    if (next === proj) return state;
    next.updatedAt = now();
    const projects = [...state.projects];
    projects[idx] = next;
    // History
    if (!opts.transient) {
      const past = [...state.past, proj].slice(-HISTORY_LIMIT);
      return { ...state, projects, past, future: [] };
    }
    return { ...state, projects };
  };

  const patchCanvas = (proj, canvasId, patch) => ({
    ...proj,
    canvases: proj.canvases.map(c => c.id === canvasId ? { ...c, ...patch } : c),
  });

  switch (action.type) {
    // ---------- App-level navigation ----------
    case 'open-project':
      return { ...state, activeProjectId: action.id, past: [], future: [], selection: [] };
    case 'close-project':
      return { ...state, activeProjectId: null, past: [], future: [], selection: [] };

    // ---------- Project CRUD ----------
    case 'create-project': {
      const proj = action.project || newProject(action.name, action.preset, action.seedElements);
      return {
        ...state,
        projects: [proj, ...state.projects],
        activeProjectId: proj.id,
        past: [], future: [], selection: [],
      };
    }
    case 'delete-project':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.id),
        activeProjectId: state.activeProjectId === action.id ? null : state.activeProjectId,
      };
    case 'rename-project': {
      const projects = state.projects.map(p => p.id === action.id ? { ...p, name: action.name, updatedAt: now() } : p);
      return { ...state, projects };
    }
    case 'duplicate-project': {
      const src = state.projects.find(p => p.id === action.id);
      if (!src) return state;
      const dup = JSON.parse(JSON.stringify(src));
      dup.id = uid();
      dup.name = src.name + ' (copy)';
      dup.createdAt = now();
      dup.updatedAt = now();
      dup.canvases = dup.canvases.map(c => ({ ...c, id: uid(), elements: c.elements.map(el => ({ ...el, id: uid() })) }));
      dup.activeCanvasId = dup.canvases[0]?.id;
      return { ...state, projects: [dup, ...state.projects] };
    }
    case 'update-project-thumbnail': {
      const projects = state.projects.map(p => p.id === action.id ? { ...p, thumbnail: action.thumbnail } : p);
      return { ...state, projects };
    }
    case 'update-project': {
      // Generic patch, e.g. { appliedStarter: 'Made-to-Order' }
      const projects = state.projects.map(p => p.id === action.id ? { ...p, ...action.patch, updatedAt: now() } : p);
      return { ...state, projects };
    }

    // ---------- Custom template CRUD ----------
    case 'save-template': {
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const tpl = {
        id: uid(),
        name: action.name || (proj.name + ' template'),
        createdAt: now(),
        thumbnail: proj.thumbnail,
        canvases: JSON.parse(JSON.stringify(proj.canvases)),
      };
      return { ...state, templates: [tpl, ...state.templates] };
    }
    case 'delete-template':
      return { ...state, templates: state.templates.filter(t => t.id !== action.id) };
    case 'apply-template': {
      // Apply a template's first canvas as new project OR to current active canvas
      const tpl = state.templates.find(t => t.id === action.id) || action.template;
      if (!tpl) return state;
      const first = tpl.canvases[0];
      return activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
        elements: first.elements.map(el => ({ ...el, id: uid() })),
        bg: first.bg,
      }));
    }

    // ---------- Canvas within active project ----------
    case 'update-canvas':
      return activeProjectMutate(proj => patchCanvas(proj, action.id, action.patch));

    case 'add-canvas': {
      const preset = action.preset || SIZE_PRESETS[0];
      return activeProjectMutate(proj => {
        const c = defaultCanvas(`Page ${proj.canvases.length + 1}`, preset);
        return { ...proj, canvases: [...proj.canvases, c], activeCanvasId: c.id };
      });
    }

    case 'delete-canvas':
      return activeProjectMutate(proj => {
        if (proj.canvases.length <= 1) return proj;
        const idx = proj.canvases.findIndex(c => c.id === action.id);
        const canvases = proj.canvases.filter(c => c.id !== action.id);
        const activeCanvasId = proj.activeCanvasId === action.id
          ? canvases[Math.max(0, idx - 1)].id : proj.activeCanvasId;
        return { ...proj, canvases, activeCanvasId };
      });

    case 'duplicate-canvas':
      return activeProjectMutate(proj => {
        const src = proj.canvases.find(c => c.id === action.id);
        if (!src) return proj;
        const idx = proj.canvases.findIndex(c => c.id === action.id);
        const dup = {
          ...JSON.parse(JSON.stringify(src)),
          id: uid(),
          name: src.name + ' copy',
          elements: src.elements.map(el => ({ ...el, id: uid() })),
        };
        const canvases = [...proj.canvases.slice(0, idx + 1), dup, ...proj.canvases.slice(idx + 1)];
        return { ...proj, canvases, activeCanvasId: dup.id };
      });

    case 'reorder-canvas':
      return activeProjectMutate(proj => {
        const arr = [...proj.canvases];
        const [moved] = arr.splice(action.from, 1);
        arr.splice(action.to, 0, moved);
        return { ...proj, canvases: arr };
      });

    case 'set-active-canvas':
      return {
        ...state,
        projects: state.projects.map(p => p.id === state.activeProjectId ? { ...p, activeCanvasId: action.id } : p),
        selection: [],
      };

    // ---------- Element CRUD ----------
    case 'add-element':
      return {
        ...activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
          elements: [...proj.canvases.find(c => c.id === proj.activeCanvasId).elements, action.element],
        })),
        selection: [action.element.id],
      };

    case 'update-element':
      return activeProjectMutate(proj => {
        const cId = proj.activeCanvasId;
        return patchCanvas(proj, cId, {
          elements: proj.canvases.find(c => c.id === cId).elements
            .map(e => e.id === action.id ? deepMerge(e, action.patch) : e),
        });
      }, { transient: action.transient });

    case 'commit-transient': {
      const past = [...state.past, action.snapshot].slice(-HISTORY_LIMIT);
      return { ...state, past, future: [] };
    }

    case 'delete-elements':
      return {
        ...activeProjectMutate(proj => patchCanvas(proj, proj.activeCanvasId, {
          elements: proj.canvases.find(c => c.id === proj.activeCanvasId).elements
            .filter(e => !action.ids.includes(e.id)),
        })),
        selection: [],
      };

    case 'duplicate-elements': {
      let newIds = [];
      const nextState = activeProjectMutate(proj => {
        const c = proj.canvases.find(c => c.id === proj.activeCanvasId);
        const dupes = c.elements
          .filter(e => action.ids.includes(e.id))
          .map(e => ({ ...JSON.parse(JSON.stringify(e)), id: uid(), x: e.x + 20, y: e.y + 20 }));
        newIds = dupes.map(d => d.id);
        return patchCanvas(proj, proj.activeCanvasId, { elements: [...c.elements, ...dupes] });
      });
      return { ...nextState, selection: newIds };
    }

    case 'reorder-element':
      return activeProjectMutate(proj => {
        const c = proj.canvases.find(c => c.id === proj.activeCanvasId);
        const arr = [...c.elements];
        const from = arr.findIndex(e => e.id === action.id);
        if (from < 0) return proj;
        const [moved] = arr.splice(from, 1);
        arr.splice(action.to, 0, moved);
        return patchCanvas(proj, proj.activeCanvasId, { elements: arr });
      });

    case 'set-selection':
      return { ...state, selection: action.ids };

    // ---------- Undo/Redo ----------
    case 'undo': {
      if (!state.past.length) return state;
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const prev = state.past[state.past.length - 1];
      const projects = state.projects.map(p => p.id === state.activeProjectId ? prev : p);
      return {
        ...state, projects,
        past: state.past.slice(0, -1),
        future: [proj, ...state.future].slice(0, HISTORY_LIMIT),
        selection: [],
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      if (!proj) return state;
      const nxt = state.future[0];
      const projects = state.projects.map(p => p.id === state.activeProjectId ? nxt : p);
      return {
        ...state, projects,
        past: [...state.past, proj].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        selection: [],
      };
    }

    // ---------- Brand ----------
    case 'update-brand':
      return { ...state, brand: { ...state.brand, ...action.patch } };
    case 'add-brand-handle':
      return { ...state, brand: { ...state.brand, handles: [...state.brand.handles, { id: uid(), platform: 'instagram', value: '', ...action.handle }] } };
    case 'update-brand-handle':
      return { ...state, brand: { ...state.brand, handles: state.brand.handles.map(h => h.id === action.id ? { ...h, ...action.patch } : h) } };
    case 'remove-brand-handle':
      return { ...state, brand: { ...state.brand, handles: state.brand.handles.filter(h => h.id !== action.id) } };
    case 'add-brand-color':
      return { ...state, brand: { ...state.brand, colors: [...state.brand.colors, action.color] } };
    case 'remove-brand-color':
      return { ...state, brand: { ...state.brand, colors: state.brand.colors.filter((_, i) => i !== action.index) } };

    // ---------- Voice do/don't/tags (arrays on brand) ----------
    case 'add-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: [...(state.brand.voiceDo || []), action.value] } };
    case 'update-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: state.brand.voiceDo.map((v, i) => i === action.index ? action.value : v) } };
    case 'remove-brand-voice-do':
      return { ...state, brand: { ...state.brand, voiceDo: state.brand.voiceDo.filter((_, i) => i !== action.index) } };
    case 'add-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: [...(state.brand.voiceDont || []), action.value] } };
    case 'update-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: state.brand.voiceDont.map((v, i) => i === action.index ? action.value : v) } };
    case 'remove-brand-voice-dont':
      return { ...state, brand: { ...state.brand, voiceDont: state.brand.voiceDont.filter((_, i) => i !== action.index) } };
    case 'update-brand-voice-tags':
      return { ...state, brand: { ...state.brand, voiceTags: action.tags } };
    case 'add-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: [...(state.brand.voiceExamples || []), { id: uid(), text: '', note: '', ...action.example }] } };
    case 'update-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: (state.brand.voiceExamples || []).map(e => e.id === action.id ? { ...e, ...action.patch } : e) } };
    case 'remove-voice-example':
      return { ...state, brand: { ...state.brand, voiceExamples: (state.brand.voiceExamples || []).filter(e => e.id !== action.id) } };

    // ---------- Vocabulary ----------
    case 'add-vocab':
      return { ...state, vocab: [...state.vocab, { id: uid(), term: '', def: '', ...action.entry }] };
    case 'update-vocab':
      return { ...state, vocab: state.vocab.map(v => v.id === action.id ? { ...v, ...action.patch } : v) };
    case 'remove-vocab':
      return { ...state, vocab: state.vocab.filter(v => v.id !== action.id) };

    // ---------- Copy blocks ----------
    case 'add-copy-block':
      return { ...state, copyBlocks: [...state.copyBlocks, { id: 'b_' + uid(), title: 'Untitled', category: 'general', content: '', ...action.block }] };
    case 'update-copy-block':
      return { ...state, copyBlocks: state.copyBlocks.map(b => b.id === action.id ? { ...b, ...action.patch } : b) };
    case 'remove-copy-block':
      return { ...state, copyBlocks: state.copyBlocks.filter(b => b.id !== action.id) };

    // ---------- Products ----------
    case 'add-product':
      return { ...state, products: [...state.products, { id: uid(), name: 'New product', absorbency: '', length: '', fabric: '', price: 0, notes: '', ...action.product }] };
    case 'update-product':
      return { ...state, products: state.products.map(p => p.id === action.id ? { ...p, ...action.patch } : p) };
    case 'remove-product':
      return { ...state, products: state.products.filter(p => p.id !== action.id) };

    // ---------- Saved history ----------
    case 'save-repurpose':
      return { ...state, savedRepurpose: [action.entry, ...state.savedRepurpose] };
    case 'remove-repurpose':
      return { ...state, savedRepurpose: state.savedRepurpose.filter(e => e.id !== action.id) };
    case 'save-launch':
      return { ...state, savedLaunches: [action.entry, ...state.savedLaunches] };
    case 'remove-launch':
      return { ...state, savedLaunches: state.savedLaunches.filter(e => e.id !== action.id) };

    // ---------- Calendar ----------
    case 'add-calendar-entry':
      return { ...state, calendar: [...(state.calendar || []), { id: 'c_' + uid(), status: 'queued', ...action.entry }] };
    case 'update-calendar-entry':
      return { ...state, calendar: (state.calendar || []).map(e => e.id === action.id ? { ...e, ...action.patch } : e) };
    case 'remove-calendar-entry':
      return { ...state, calendar: (state.calendar || []).filter(e => e.id !== action.id) };

    // ---------- Saved backgrounds (Petal — My Backgrounds) ----------
    // Stored as SNAPSHOTS. `bg` is deep-cloned on save so future edits to the source canvas
    // never mutate the saved copy.
    case 'save-background':
      return { ...state, savedBackgrounds: [action.entry, ...(state.savedBackgrounds || [])].slice(0, 60) };
    case 'remove-background':
      return { ...state, savedBackgrounds: (state.savedBackgrounds || []).filter(b => b.id !== action.id) };
    case 'rename-background':
      return { ...state, savedBackgrounds: (state.savedBackgrounds || []).map(b => b.id === action.id ? { ...b, name: action.name } : b) };

    // ---------- Named branding arrangements ----------
    // Snapshots of a set of independent brand elements (logo, name, handle, website, socials).
    // Applied elements are deep-cloned with fresh IDs so they stay independently editable.
    case 'save-brand-arrangement':
      return {
        ...state,
        brand: {
          ...state.brand,
          savedArrangements: [action.entry, ...((state.brand.savedArrangements || []).filter(a => a.name !== action.entry.name))].slice(0, 30),
        },
      };
    case 'remove-brand-arrangement':
      return {
        ...state,
        brand: {
          ...state.brand,
          savedArrangements: (state.brand.savedArrangements || []).filter(a => a.id !== action.id),
        },
      };

    // ---------- Element batch update (used by page-position controls) ----------
    case 'update-elements-batch': {
      if (!action.updates?.length) return state;
      const patchMap = new Map(action.updates.map(u => [u.id, u.patch]));
      return activeProjectMutate(proj => {
        const cId = proj.activeCanvasId;
        return patchCanvas(proj, cId, {
          elements: proj.canvases.find(c => c.id === cId).elements
            .map(e => patchMap.has(e.id) ? deepMerge(e, patchMap.get(e.id)) : e),
        });
      });
    }

    // ---------- Carousel ----------
    case 'set-view':
      return { ...state, view: action.view };
    case 'update-carousel':
      return { ...state, carousel: { ...state.carousel, ...action.patch } };
    case 'reset-carousel':
      return { ...state, carousel: defaultCarousel() };

    // ---------- UI state ----------
    case 'set-zoom': return { ...state, zoom: action.zoom };
    case 'set-tool': return { ...state, tool: action.tool };
    case 'set-search': return { ...state, search: action.search };

    // ---------- Persistence ----------
    case 'load-state': return { ...state, ...action.state };
    case 'set-save-status': return { ...state, saveStatus: action.status, savedAt: action.savedAt ?? state.savedAt };

    default:
      return state;
  }
}

function deepMerge(target, patch) {
  const out = { ...target };
  for (const k in patch) {
    const v = patch[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') {
      out[k] = deepMerge(target[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// -------------- Snap guides --------------
function computeSnapGuides(dragBox, otherBoxes, canvasBox, threshold = 6) {
  const guides = [];
  const xs = [{ v: dragBox.l, side: 'l' }, { v: dragBox.cx, side: 'cx' }, { v: dragBox.r, side: 'r' }];
  const ys = [{ v: dragBox.t, side: 't' }, { v: dragBox.cy, side: 'cy' }, { v: dragBox.b, side: 'b' }];
  const targets = [...otherBoxes, { ...canvasBox, isCanvas: true }];

  let bestX = null, bestY = null;
  for (const x of xs) for (const t of targets) for (const tx of [t.l, t.cx, t.r]) {
    const d = Math.abs(x.v - tx);
    if (d < threshold && (!bestX || d < bestX.d)) bestX = { d, snap: tx, side: x.side };
  }
  for (const y of ys) for (const t of targets) for (const ty of [t.t, t.cy, t.b]) {
    const d = Math.abs(y.v - ty);
    if (d < threshold && (!bestY || d < bestY.d)) bestY = { d, snap: ty, side: y.side };
  }

  let dx = 0, dy = 0;
  if (bestX) {
    dx = bestX.snap - (bestX.side === 'l' ? dragBox.l : bestX.side === 'cx' ? dragBox.cx : dragBox.r);
    guides.push({ type: 'v', x: bestX.snap });
  }
  if (bestY) {
    dy = bestY.snap - (bestY.side === 't' ? dragBox.t : bestY.side === 'cy' ? dragBox.cy : dragBox.b);
    guides.push({ type: 'h', y: bestY.snap });
  }
  return { dx, dy, guides };
}

function rotatePoint(px, py, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return [(px - cx) * cos - (py - cy) * sin + cx, (px - cx) * sin + (py - cy) * cos + cy];
}

// -------------- Store --------------
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);

const STORAGE_KEY = 'wpr-studio-v1';
const LEGACY_KEY = 'petal-editor-v2';

function migrateLegacy() {
  // Convert the old single-workspace to a single project.
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw);
    if (!legacy.canvases) return null;
    return {
      id: uid(),
      name: 'My first design',
      createdAt: now() - 86400000,
      updatedAt: now(),
      thumbnail: null,
      canvases: legacy.canvases,
      activeCanvasId: legacy.activeCanvasId || legacy.canvases[0]?.id,
    };
  } catch { return null; }
}

const defaultBrand = () => ({
  shopName: 'Wonder Pads Reusables',
  tagline: 'Your one stop shop for healthy menstruation',
  aboutLine: 'handmade reusable cloth pads, made with love — cotton woven tops, bamboo hemp cores, soft fleece backing.',
  logo: 'assets/wpr-logo.png',
  fontHeading: 'DM Serif Display',
  fontBody: 'Instrument Sans',
  handles: [
    { id: uid(), platform: 'instagram', value: '@wonderpadsreusables' },
    { id: uid(), platform: 'website',   value: 'wonderpadsreusables.com' },
  ],
  colors: ['#F1CFEA', '#E8B8DC', '#D98BC6', '#C260A8', '#2A1F2A', '#FDFBFC'],
  // AI voice
  voiceTags: ['warm', 'friendly', 'chatty', 'affirming', 'body-positive', 'cozy', 'no-nonsense', 'handmade'],
  voiceDo: [
    "talk like you're texting a friend",
    "use lowercase sometimes for softness",
    "say 'your flow' 'your body' 'your rhythm'",
    "be reassuring about the switch to cloth",
    "celebrate periods, don't hide them",
    "keep sentences short & warm",
  ],
  voiceDont: [
    "avoid clinical / medical-sounding language",
    "no shame-y phrases like 'discreet' or 'hidden'",
    "no fake urgency or hype (\"LAST CHANCE!!!\")",
    "no jargon without explaining it",
    "avoid pink-tax pastels-only aesthetic clichés",
  ],
  // Writing style toggles (post-processed and reinforced in the system prompt)
  voiceRules: {
    capitalizeSentences: true,   // Capitalise the first letter of every sentence
    avoidEmDashes: true,         // Replace — and – with commas / periods
  },
  // Real posts the user has written — the AI matches this tone more strongly than any Do/Don't rule.
  voiceExamples: [],       // [{ id, text, note? }]
  savedArrangements: [],   // [{ id, name, elements: Element[] }] — named brand layouts (logo/handle/etc arrangement)
});

// Content data: seeded from CONTENT_SEED on first load, editable by the user.
const defaultVocab = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.vocab.map(v => ({ ...v, id: uid() }))
  : [];
const defaultCopyBlocks = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.copyBlocks.map(b => ({ ...b }))
  : [];
const defaultProducts = () => (typeof CONTENT_SEED !== 'undefined')
  ? CONTENT_SEED.products.map(p => ({ ...p, id: uid() }))
  : [];
const defaultLaunchAngles = () => (typeof CONTENT_SEED !== 'undefined')
  ? [...CONTENT_SEED.launchAngles]
  : [];

const defaultCarousel = () => ({
  text: '',
  style: 'cover-list',
  size: 'ig-post',
  applyBrand: true,
  addCover: true,
  addOutro: true,
  swipeHint: true,
  textScale: 1,        // global multiplier applied to every text element (0.7 → 1.25)
  showNumbers: true,   // draw "01" / "02" slide numbers on content slides
  activeSlideIdx: 0,
});

const initialState = () => ({
  view: 'home',                 // 'home' | 'editor' | 'carousel' | 'repurpose' | 'launch' | 'history' | 'calendar'
  projects: [],
  templates: [],
  brand: defaultBrand(),
  carousel: defaultCarousel(),
  // Content Repurposer data
  vocab: defaultVocab(),
  copyBlocks: defaultCopyBlocks(),
  products: defaultProducts(),
  launchAngles: defaultLaunchAngles(),
  savedRepurpose: [],           // [{ id, sourceText, outputs, ts }]
  savedLaunches: [],            // [{ id, productId, angle, outputs, ts }]
  calendar: [],                 // [{ id, ts, platform, text, status: 'queued'|'posted', productId?, note? }]
  savedBackgrounds: [],         // [{ id, name, kind: 'bg-only' | 'complete', bg, elements?, w?, h?, createdAt }] — frozen snapshots
  activeProjectId: null,
  selection: [],
  tool: 'templates',
  zoom: 0.4,
  search: '',
  past: [],
  future: [],
  saveStatus: 'idle',
  savedAt: null,
});

function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Backfill brand + carousel if missing (older data)
        if (!saved.brand) saved.brand = defaultBrand();
        else saved.brand = { ...defaultBrand(), ...saved.brand };
        if (!saved.carousel) saved.carousel = defaultCarousel();
        else saved.carousel = { ...defaultCarousel(), ...saved.carousel };
        // Backfill Content Repurposer data
        if (!saved.vocab || !saved.vocab.length) saved.vocab = defaultVocab();
        if (!saved.copyBlocks || !saved.copyBlocks.length) saved.copyBlocks = defaultCopyBlocks();
        if (!saved.products || !saved.products.length) saved.products = defaultProducts();
        if (!saved.launchAngles || !saved.launchAngles.length) saved.launchAngles = defaultLaunchAngles();
        if (!saved.savedRepurpose) saved.savedRepurpose = [];
        if (!saved.savedLaunches) saved.savedLaunches = [];
        if (!saved.calendar) saved.calendar = [];
        if (!saved.savedBackgrounds) saved.savedBackgrounds = [];
        // Always land on home when reloading
        saved.view = 'home';
        dispatch({ type: 'load-state', state: { ...saved, past: [], future: [], selection: [], saveStatus: 'idle' } });
      } else {
        // Try legacy migration
        const legacy = migrateLegacy();
        if (legacy) {
          dispatch({ type: 'load-state', state: { projects: [legacy], activeProjectId: null } });
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Debounced save — includes every persisted slice so new Petal features persist reliably.
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!loadedRef.current) return;
    dispatch({ type: 'set-save-status', status: 'saving' });
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const { past, future, selection, saveStatus, savedAt, ...persist } = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
        dispatch({ type: 'set-save-status', status: 'saved', savedAt: now() });
      } catch (e) {
        console.warn('Save failed', e);
      }
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [
    state.projects, state.templates, state.activeProjectId,
    state.brand, state.vocab, state.copyBlocks, state.products, state.launchAngles,
    state.savedRepurpose, state.savedLaunches, state.calendar,
    state.savedBackgrounds, state.carousel,
  ]);

  return (
    <StoreCtx.Provider value={{ state, dispatch }}>
      {children}
    </StoreCtx.Provider>
  );
}

const activeProject = (state) => state.projects.find(p => p.id === state.activeProjectId);
const activeCanvas = (state) => {
  const proj = activeProject(state);
  return proj?.canvases.find(c => c.id === proj.activeCanvasId);
};

// ---------------- Responsive hooks ----------------
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange); // Safari fallback
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);
  return matches;
}

function useIsMobile() {
  const matches = useMediaQuery('(max-width: 639px)');
  // Dev override: ?mobile=1 forces mobile mode for testing on desktop.
  if (typeof window !== 'undefined') {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mobile') === '1') return true;
      if (p.get('mobile') === '0') return false;
    } catch {}
  }
  return matches;
}

// Page-position aligner — moves the current selection so its bounding box sits at the
// requested side of the canvas. Ported from Petal. Independent of text alignment.
function alignElementsToPage(state, dispatch, position) {
  const canvas = activeCanvas(state);
  const elements = canvas?.elements.filter(el => state.selection.includes(el.id)) || [];
  if (!canvas || !elements.length) return false;
  const left = Math.min(...elements.map(el => el.x));
  const top = Math.min(...elements.map(el => el.y));
  const right = Math.max(...elements.map(el => el.x + el.w));
  const bottom = Math.max(...elements.map(el => el.y + el.h));
  const groupW = right - left, groupH = bottom - top;
  let dx = 0, dy = 0;
  if (position === 'left')    dx = -left;
  if (position === 'hcenter') dx = (canvas.w - groupW) / 2 - left;
  if (position === 'right')   dx = canvas.w - right;
  if (position === 'top')     dy = -top;
  if (position === 'vmiddle') dy = (canvas.h - groupH) / 2 - top;
  if (position === 'bottom')  dy = canvas.h - bottom;
  if (dx === 0 && dy === 0) return false;
  dispatch({
    type: 'update-elements-batch',
    updates: elements.map(el => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } })),
  });
  return true;
}

// ------- Backup / Restore editable project -------
// Exports the entire persisted store as a downloadable JSON file. This is a superset of what
// localStorage holds — projects, canvases, brand, saved backgrounds, brand arrangements,
// content-tool history, calendar, carousel state, all app data.
function exportEditableProjectFile(state) {
  const { past, future, selection, saveStatus, savedAt, ...persist } = state;
  const payload = {
    app: 'Wonder Pads Content Studio',
    version: 2,
    exportedAt: new Date().toISOString(),
    state: persist,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `wonder-pads-content-studio-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Restore reads a JSON backup and returns the state to load. Throws on invalid input.
function parseEditableProjectFile(text) {
  const parsed = JSON.parse(text);
  // Accept either { state: {...} } (v2) or a raw state object (v1 for legacy)
  const state = parsed.state || parsed;
  if (!state || typeof state !== 'object') throw new Error('Backup file is empty or malformed.');
  if (!Array.isArray(state.projects)) throw new Error('This does not look like a Wonder Pads backup.');
  return state;
}

Object.assign(window, {
  uid, clamp, now, SIZE_PRESETS, defaultCanvas, newElement, newProject, defaultBrand, defaultCarousel,
  reducer, initialState, computeSnapGuides, rotatePoint,
  StoreCtx, useStore, StoreProvider, activeProject, activeCanvas,
  useMediaQuery, useIsMobile, alignElementsToPage,
  exportEditableProjectFile, parseEditableProjectFile, STORAGE_KEY,
});
