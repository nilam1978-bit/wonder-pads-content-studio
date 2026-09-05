// Lightweight inline SVG icon set — stroke-based, minimal.
const Icon = ({ name, size = 20, stroke = 1.5, style, className }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         style={style} className={className}
         dangerouslySetInnerHTML={{ __html: paths }} />
  );
};

const ICONS = {
  // rail
  templates: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  text: '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>',
  shapes: '<circle cx="8" cy="16" r="4"/><rect x="12" y="12" width="9" height="9" rx="1"/><path d="M12 3l5 8H7l5-8z"/>',
  images: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  icons: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  frames: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>',
  bg: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18"/>',

  // top bar
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-4"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h4"/>',
  zoom_in: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
  zoom_out: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
  fit: '<path d="M4 9V5a1 1 0 011-1h4M20 9V5a1 1 0 00-1-1h-4M4 15v4a1 1 0 001 1h4M20 15v4a1 1 0 01-1 1h-4"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  share: '<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',

  // panel actions
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6l-12 12"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/>',
  duplicate: '<rect x="7" y="7" width="12" height="12" rx="1.5"/><path d="M5 15V6a1 1 0 011-1h9"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 017.5-2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eye_off: '<path d="M17 17A9.7 9.7 0 0112 19c-6.5 0-10-7-10-7a17 17 0 013.9-4.6M9.9 4.2A9.9 9.9 0 0112 4c6.5 0 10 7 10 7a17 17 0 01-3.2 4M2 2l20 20M14.1 14.1A3 3 0 019.9 9.9"/>',

  // align
  align_l: '<path d="M4 4v16M8 8h11M8 14h7"/>',
  align_c: '<path d="M12 4v16M6 8h12M8 14h8"/>',
  align_r: '<path d="M20 4v16M5 8h11M9 14h7"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z"/>',
  italic: '<path d="M19 4h-9M14 20H5M15 4L9 20"/>',
  underline: '<path d="M6 4v8a6 6 0 0012 0V4M4 20h16"/>',

  // shapes for pickers
  square: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  triangle: '<path d="M12 3l10 18H2z"/>',
  line: '<path d="M4 20L20 4"/>',
  star: '<path d="M12 2l3 7 7.5.6-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 9z"/>',
  heart: '<path d="M12 21s-8-5.3-8-11.5A5.5 5.5 0 0112 5a5.5 5.5 0 018 4.5C20 15.7 12 21 12 21z"/>',
  arrow: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  pentagon: '<path d="M12 2l10 7.3-3.8 11.7H5.8L2 9.3z"/>',
  hexagon: '<path d="M17.2 3H6.8L2 12l4.8 9h10.4L22 12z"/>',
  diamond: '<path d="M12 2l10 10-10 10L2 12z"/>',

  // layers
  layer: '<path d="M12 2l10 6-10 6-10-6z"/><path d="M2 14l10 6 10-6"/>',

  // menus
  chevron_d: '<path d="M6 9l6 6 6-6"/>',
  chevron_r: '<path d="M9 6l6 6-6 6"/>',
  chevron_u: '<path d="M18 15l-6-6-6 6"/>',
  chevron_dn: '<path d="M6 9l6 6 6-6"/>',
  arrow_up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrow_down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
  file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/>',
  save: '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  clear: '<path d="M4 7h16"/><path d="M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"/><path d="M9 7V4h6v3"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="1.5"/><path d="M5 15V6a1 1 0 011-1h9"/>',
  paste: '<rect x="6" y="4" width="12" height="16" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/>',
  select_all: '<path d="M4 4h4M16 4h4M4 20h4M16 20h4M20 8v4M20 16M4 8v4M4 16"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  ruler: '<path d="M4 20L20 4"/><path d="M4 20l3-3M8 16l3-3M12 12l3-3M16 8l3-3"/>',
  image_export: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5-6 6"/>',
  pdf: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h1a1.5 1.5 0 010 3H8v-3zM8 13v6M13 13v6M13 13h2M13 16h2M17 13v6M17 13h2"/>',
  svg_icon: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>',
  tiktok: '<path d="M9 12v4a3 3 0 103 3v-9a5 5 0 005 5"/>',
  facebook: '<path d="M18 3h-3a5 5 0 00-5 5v3H7v4h3v6h4v-6h3l1-4h-4V8a1 1 0 011-1h3z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9l6 3-6 3z" fill="currentColor"/>',
  twitter: '<path d="M22 5.8a8 8 0 01-2.4.7 4 4 0 001.8-2.2 8 8 0 01-2.6 1 4 4 0 00-6.9 3.6A11.4 11.4 0 013 4.8a4 4 0 001.2 5.3 4 4 0 01-1.8-.5v.05a4 4 0 003.2 3.9 4 4 0 01-1.8.07 4 4 0 003.7 2.8A8 8 0 012 18a11.4 11.4 0 006.2 1.8c7.4 0 11.5-6.2 11.5-11.5v-.5A8 8 0 0022 5.8z"/>',
  website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 20 20 0 01-8.6-3.1 20 20 0 01-6-6 20 20 0 01-3.1-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7 13 13 0 00.7 2.8 2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5 13 13 0 002.8.7 2 2 0 011.7 2z"/>',
  brand_kit: '<path d="M12 3l3 3-2 2 4 4-2 2-4-4-2 2-3-3z"/><circle cx="18" cy="18" r="3"/>',
  logo_placement: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/>',
  carousel: '<rect x="7" y="4" width="10" height="16" rx="1.5"/><path d="M4 6v12M20 6v12" opacity=".6"/>',
  slides: '<rect x="2" y="4" width="10" height="16" rx="1.5"/><rect x="14" y="4" width="8" height="16" rx="1.5" opacity=".5"/>',
  swipe: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  wand: '<path d="M15 4V2M15 10v-2M18 7h2M10 7h2M4 22l11-11 3 3L7 25z"/><path d="M14 8l2 2"/>',
  grip: '<circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  upload: '<path d="M12 3v13"/><path d="M6 9l6-6 6 6"/><path d="M4 21h16"/>',

  // sticker glyphs (used in icon library)
  sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/>',
  flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 4a3 3 0 010 6M12 14a3 3 0 010 6M4 12a3 3 0 016 0M14 12a3 3 0 016 0"/>',
  leaf: '<path d="M4 20c8-2 14-8 16-16-8 2-14 8-16 16z"/><path d="M4 20c4-4 8-8 16-16"/>',
  moon: '<path d="M20 14A8 8 0 019.9 3.9 8 8 0 1020 14z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  cloud: '<path d="M17 20H7a5 5 0 01-.6-9.9A6 6 0 0117.7 11H18a4.5 4.5 0 01-1 9z"/>',
  music: '<path d="M9 18V6l12-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  bolt: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 001 1h12a1 1 0 001-1v-8"/><path d="M12 8s-1-6-4-6-3 4 0 6M12 8s1-6 4-6 3 4 0 6"/>',
  drop: '<path d="M12 2s7 8 7 13a7 7 0 01-14 0c0-5 7-13 7-13z"/>',

  // Repurpose / Launch / History extras
  sparkles: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 013 3L7 19l-4 1 1-4z"/>',
  refresh: '<path d="M4 12a8 8 0 0114-5"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 01-14 5"/><path d="M4 20v-5h5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M4 4h6a3 3 0 013 3v13"/><path d="M20 4h-6a3 3 0 00-3 3"/><path d="M4 4v14a2 2 0 002 2h14V4"/>',
  story: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 2"/>',
  arrow_left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  history: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 3"/>',
  launch: '<path d="M5 19l4-4"/><path d="M14 5l5 5-8 8-5-5z"/><path d="M14 5l3-2 2 2-2 3"/><circle cx="14" cy="10" r="1"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z"/>',
  package: '<path d="M12 3l9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v10"/>',
  eye_open: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chat: '<path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 4v-4H6a2 2 0 01-2-2z"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
};

Object.assign(window, { Icon, ICONS });
