// Rendering exports: PNG, JPEG, vector PDF, and reordering helpers.
// All exports render into an offscreen SVG so PDFs stay vector.
const { useEffect: xE, useState: xS, useRef: xR } = React;

// ---------- SVG builder (shared for PDF + PNG/JPEG raster fallback) ----------
// Converts a canvas object into an SVG string that is a pixel-perfect
// representation of the elements at their native size.
function canvasToSVG(canvas, { embedImages = true } = {}) {
  const parts = [];
  const w = canvas.w, h = canvas.h;

  // Background — opacity applies only to the background layer, never to elements above.
  const bg = canvas.bg || { type: 'color', value: '#FDFBFC' };
  const bgId = 'bg-' + uid();
  const bgOpacity = bg.opacity != null ? bg.opacity : 1;
  const opacityAttr = bgOpacity < 1 ? ` opacity="${bgOpacity}"` : '';
  // Always paint a solid backstop first so partial-opacity bgs don't reveal nothing.
  parts.push(`<rect width="${w}" height="${h}" fill="#FDFBFC"/>`);
  if (bg.type === 'color' || !bg.type) {
    parts.push(`<rect width="${w}" height="${h}" fill="${bg.value || '#FDFBFC'}"${opacityAttr}/>`);
  } else if (bg.type === 'gradient') {
    // Parse simple linear-gradient(<angle>deg, <c1> 0%, <c2> 100%)
    const g = parseGradient(bg.value, bgId);
    parts.push(g.defs);
    parts.push(`<rect width="${w}" height="${h}" fill="${g.fill}"${opacityAttr}/>`);
  } else if (bg.type === 'image') {
    parts.push(`<image width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="${escapeAttr(bg.value)}"${opacityAttr}/>`);
  }

  // Elements in draw order
  for (const el of canvas.elements) {
    if (el.hidden) continue;
    parts.push(elementToSVG(el, embedImages));
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`;
}

function parseGradient(gradientCss, id) {
  // Very small parser: supports linear-gradient(<Ndeg>, c1 p%, c2 p%[, ...])
  // and radial-gradient(circle at X% Y%, c1 p%, ...)
  const isRadial = gradientCss.startsWith('radial-gradient');
  const inner = gradientCss.slice(gradientCss.indexOf('(') + 1, gradientCss.lastIndexOf(')'));
  const tokens = splitTopLevel(inner);
  let angle = 180, cx = 50, cy = 50;
  let stops = [];

  if (isRadial) {
    // First token like "circle at 30% 20%"
    const m = tokens[0].match(/at\s+(\d+)%\s+(\d+)%/);
    if (m) { cx = +m[1]; cy = +m[2]; }
    stops = tokens.slice(1);
  } else {
    // First token like "135deg"
    const m = tokens[0].match(/(-?\d+)deg/);
    if (m) angle = +m[1];
    else if (!/^#|^rgb|^var/.test(tokens[0])) {
      // fallback — treat all tokens as stops
      stops = tokens;
    }
    if (m) stops = tokens.slice(1);
    else if (!stops.length) stops = tokens;
  }

  const stopEls = stops.map(s => {
    const m = s.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    if (m) return `<stop offset="${m[2]}%" stop-color="${m[1].trim()}"/>`;
    return `<stop stop-color="${s.trim()}"/>`;
  }).join('');

  if (isRadial) {
    return {
      defs: `<defs><radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="70%">${stopEls}</radialGradient></defs>`,
      fill: `url(#${id})`,
    };
  }
  // Convert CSS angle (0 = up) to SVG (x1,y1) -> (x2,y2)
  const rad = (angle - 90) * Math.PI / 180;
  const x1 = 50 - Math.cos(rad) * 50;
  const y1 = 50 - Math.sin(rad) * 50;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;
  return {
    defs: `<defs><linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopEls}</linearGradient></defs>`,
    fill: `url(#${id})`,
  };
}

function splitTopLevel(str) {
  const out = []; let depth = 0, buf = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(buf.trim()); buf = ''; }
    else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function transformFor(el) {
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  return `translate(${el.x}, ${el.y}) rotate(${el.rot || 0}, ${el.w / 2}, ${el.h / 2})`;
}

function elementToSVG(el, embedImages) {
  const t = transformFor(el);
  const op = el.opacity != null ? ` opacity="${el.opacity}"` : '';
  const stroke = el.stroke && el.stroke !== 'transparent' ? ` stroke="${el.stroke}" stroke-width="${el.strokeWidth || 0}"` : '';

  if (el.type === 'rect') {
    return `<g transform="${t}"${op}><rect width="${el.w}" height="${el.h}" fill="${el.fill}" rx="${el.radius || 0}" ry="${el.radius || 0}"${stroke}/></g>`;
  }
  if (el.type === 'circle') {
    return `<g transform="${t}"${op}><ellipse cx="${el.w / 2}" cy="${el.h / 2}" rx="${el.w / 2}" ry="${el.h / 2}" fill="${el.fill}"${stroke}/></g>`;
  }
  if (el.type === 'triangle') {
    const pts = `${el.w * 0.5},${el.h * 0.05} ${el.w * 0.95},${el.h * 0.95} ${el.w * 0.05},${el.h * 0.95}`;
    return `<g transform="${t}"${op}><polygon points="${pts}" fill="${el.fill}"${stroke}/></g>`;
  }
  if (el.type === 'diamond') {
    const pts = `${el.w * 0.5},${el.h * 0.05} ${el.w * 0.95},${el.h * 0.5} ${el.w * 0.5},${el.h * 0.95} ${el.w * 0.05},${el.h * 0.5}`;
    return `<g transform="${t}"${op}><polygon points="${pts}" fill="${el.fill}"${stroke}/></g>`;
  }
  if (el.type === 'star') {
    const cx = el.w / 2, cy = el.h / 2, oR = Math.min(cx, cy) * 0.9, iR = oR * 0.44;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? oR : iR;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
    }
    return `<g transform="${t}"${op}><polygon points="${pts.join(' ')}" fill="${el.fill}"${stroke}/></g>`;
  }
  if (el.type === 'heart') {
    // Path scaled from 24x24
    const s = `scale(${el.w / 24}, ${el.h / 24})`;
    return `<g transform="${t}"${op}><g transform="${s}"><path d="M12 21s-8-5.3-8-11.5A5.5 5.5 0 0112 5a5.5 5.5 0 018 4.5C20 15.7 12 21 12 21z" fill="${el.fill}"${stroke}/></g></g>`;
  }
  if (el.type === 'polygon') {
    const sides = el.sides || 6;
    const cx = el.w / 2, cy = el.h / 2, r = Math.min(cx, cy) * 0.96;
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 / sides) * i - Math.PI / 2;
      pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
    }
    return `<g transform="${t}"${op}><polygon points="${pts.join(' ')}" fill="${el.fill}"${stroke}/></g>`;
  }
  if (el.type === 'line') {
    return `<g transform="${t}"${op}><line x1="0" y1="${el.h / 2}" x2="${el.w}" y2="${el.h / 2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 4}" stroke-linecap="round"/></g>`;
  }
  if (el.type === 'arrow') {
    const mid = 'aM-' + el.id;
    return `<g transform="${t}"${op}><defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${el.stroke}"/></marker></defs><line x1="4" y1="${el.h / 2}" x2="${el.w - 8}" y2="${el.h / 2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 4}" stroke-linecap="round" marker-end="url(#${mid})"/></g>`;
  }
  if (el.type === 'text') {
    const fs = el.fontSize || 24;
    const ff = escapeAttr(el.fontFamily || 'sans-serif');
    const fw = el.fontWeight || 400;
    const fst = el.italic ? 'italic' : 'normal';
    const dec = el.underline ? 'underline' : 'none';
    const anchor = el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle';
    const anchorX = el.align === 'left' ? 4 : el.align === 'right' ? el.w - 4 : el.w / 2;
    // Word-wrap each explicit line to element width so text stays visible in thumbnails + previews.
    // Uses an average-glyph-width heuristic tuned for the mix of serif/sans used in this app.
    const rawLines = String(el.text || '').split(/\r?\n/);
    const avgCharW = fs * (el.italic ? 0.48 : 0.52) * (1 + (el.letterSpacing || 0) / fs);
    const maxChars = Math.max(1, Math.floor((el.w - 8) / avgCharW));
    const lines = [];
    for (const raw of rawLines) {
      if (raw.length <= maxChars) { lines.push(raw); continue; }
      const words = raw.split(/(\s+)/); // keep whitespace
      let cur = '';
      for (const tok of words) {
        if ((cur + tok).length <= maxChars) { cur += tok; continue; }
        if (cur.trim()) lines.push(cur.trimEnd());
        // Word alone longer than maxChars — hard-break it.
        if (tok.length > maxChars && !/^\s+$/.test(tok)) {
          let rem = tok;
          while (rem.length > maxChars) { lines.push(rem.slice(0, maxChars)); rem = rem.slice(maxChars); }
          cur = rem;
        } else {
          cur = /^\s+$/.test(tok) ? '' : tok;
        }
      }
      if (cur.trim()) lines.push(cur.trimEnd());
      if (!raw.trim() && cur === '') lines.push('');
    }
    const lh = fs * (el.lineHeight || 1.2);
    // Vertical center
    const totalH = lh * lines.length;
    const startY = (el.h - totalH) / 2 + fs * 0.85;
    const tspans = lines.map((ln, i) => `<tspan x="${anchorX}" y="${startY + i * lh}">${escapeText(ln)}</tspan>`).join('');
    return `<g transform="${t}"${op}><text font-family="${ff}" font-size="${fs}" font-weight="${fw}" font-style="${fst}" text-decoration="${dec}" letter-spacing="${el.letterSpacing || 0}" fill="${el.color}" text-anchor="${anchor}">${tspans}</text></g>`;
  }
  if (el.type === 'image') {
    const f = el.filter || { brightness: 100, contrast: 100, saturate: 100, blur: 0 };
    const fid = 'flt-' + el.id;
    const filter = (f.brightness !== 100 || f.contrast !== 100 || f.saturate !== 100 || f.blur !== 0)
      ? `<filter id="${fid}"><feColorMatrix type="saturate" values="${f.saturate / 100}"/><feComponentTransfer><feFuncR type="linear" slope="${(f.brightness / 100) * (f.contrast / 100)}" intercept="${(1 - f.contrast / 100) / 2}"/><feFuncG type="linear" slope="${(f.brightness / 100) * (f.contrast / 100)}" intercept="${(1 - f.contrast / 100) / 2}"/><feFuncB type="linear" slope="${(f.brightness / 100) * (f.contrast / 100)}" intercept="${(1 - f.contrast / 100) / 2}"/></feComponentTransfer>${f.blur ? `<feGaussianBlur stdDeviation="${f.blur}"/>` : ''}</filter>`
      : '';
    const filterAttr = filter ? ` filter="url(#${fid})"` : '';
    const clipId = 'clip-' + el.id;
    const clip = (el.radius || 0) > 0
      ? `<defs><clipPath id="${clipId}"><rect width="${el.w}" height="${el.h}" rx="${el.radius}" ry="${el.radius}"/></clipPath></defs>`
      : '';
    const clipAttr = (el.radius || 0) > 0 ? ` clip-path="url(#${clipId})"` : '';
    return `<g transform="${t}"${op}>${filter}${clip}<image width="${el.w}" height="${el.h}" preserveAspectRatio="xMidYMid slice" href="${escapeAttr(el.src)}"${filterAttr}${clipAttr}/></g>`;
  }
  if (el.type === 'icon') {
    const paths = ICONS[el.name] || '';
    // scale from 24x24
    const s = `scale(${el.w / 24}, ${el.h / 24})`;
    // Icons are stroke-based currentColor
    return `<g transform="${t}"${op}><g transform="${s}" fill="none" stroke="${el.color}" stroke-width="${el.strokeWidth || 1.5}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></g>`;
  }
  if (el.type === 'frame') {
    const rx = el.shape === 'circle' ? el.w / 2 : el.shape === 'rounded' ? 16 : 0;
    const ry = el.shape === 'circle' ? el.h / 2 : el.shape === 'rounded' ? 16 : 0;
    const clipId = 'clip-' + el.id;
    let inner = '';
    if (el.src) {
      inner = `<defs><clipPath id="${clipId}"><rect width="${el.w}" height="${el.h}" rx="${rx}" ry="${ry}"/></clipPath></defs><image width="${el.w}" height="${el.h}" preserveAspectRatio="xMidYMid slice" href="${escapeAttr(el.src)}" clip-path="url(#${clipId})"/>`;
    } else {
      inner = `<rect width="${el.w}" height="${el.h}" fill="${el.bg}" rx="${rx}" ry="${ry}" stroke="rgba(194,96,168,0.4)" stroke-width="2" stroke-dasharray="8 6"/>`;
    }
    return `<g transform="${t}"${op}>${inner}</g>`;
  }
  return '';
}

// ---------- File save helper ----------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataURL(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------- SVG → PNG/JPEG raster via <canvas> ----------
async function rasterizeSVG(svgString, w, h, mime = 'image/png', quality = 0.92, scale = 2) {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * scale;
      c.height = h * scale;
      const ctx = c.getContext('2d');
      // white bg for JPEG (no alpha)
      if (mime === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(blob => resolve(blob), mime, quality);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// ---------- Export orchestrator ----------
async function exportCanvases(canvases, format, filename = 'design') {
  if (format === 'png' || format === 'jpg') {
    // Export current canvases as N images (or zip if >1). Here: one per file.
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      const svg = canvasToSVG(c);
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : 'jpg';
      const blob = await rasterizeSVG(svg, c.w, c.h, mime, 0.92, 2);
      const suffix = canvases.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
      downloadBlob(blob, `${filename}${suffix}.${ext}`);
      // small pause so browsers don't merge downloads
      await new Promise(r => setTimeout(r, 250));
    }
    return;
  }
  if (format === 'svg') {
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      const svg = canvasToSVG(c);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const suffix = canvases.length > 1 ? `-${String(i + 1).padStart(2, '0')}` : '';
      downloadBlob(blob, `${filename}${suffix}.svg`);
      await new Promise(r => setTimeout(r, 250));
    }
    return;
  }
  if (format === 'pdf') {
    // Vector PDF: multi-page, each page = one canvas as embedded SVG.
    // We do this by writing a minimal PDF that draws each canvas as a rasterized page
    // OR by using print. Since a hand-rolled vector PDF is complex, we open a print window
    // where each canvas is a full-page SVG — user can Save as PDF via native dialog,
    // which preserves vectors from browsers.
    openPrintWindow(canvases, filename);
    return;
  }
}

function openPrintWindow(canvases, filename) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow popups to export as PDF'); return; }
  const pages = canvases.map(c => {
    const svg = canvasToSVG(c);
    return `<div class="page" style="width:${c.w}px;height:${c.h}px;">${svg}</div>`;
  }).join('');
  w.document.write(`<!doctype html><html><head><title>${filename}</title>
<style>
  @page { margin: 0; size: auto; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page { display: block; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .page svg { width: 100%; height: 100%; display: block; }
  .cta { position: fixed; top: 16px; right: 16px; z-index: 10;
    background: #2A1F2A; color: white; padding: 10px 16px; border-radius: 10px;
    font: 500 13px/1.4 system-ui, sans-serif; cursor: pointer; border: none;
    box-shadow: 0 8px 24px rgba(0,0,0,.2); }
  @media print { .cta { display: none; } }
</style>
</head><body>
<button class="cta" onclick="window.print()">Save as PDF ⌘P</button>
${pages}
<script>setTimeout(()=>window.print(), 500);</script>
</body></html>`);
  w.document.close();
}

// ---------- Reorder actions (dispatch helpers) ----------
function moveLayer(state, dispatch, id, direction) {
  const canvas = activeCanvas(state);
  const idx = canvas.elements.findIndex(e => e.id === id);
  if (idx < 0) return;
  let to = idx + direction;
  to = Math.max(0, Math.min(canvas.elements.length - 1, to));
  if (to === idx) return;
  dispatch({ type: 'reorder-element', id, to });
}

Object.assign(window, {
  canvasToSVG, elementToSVG, rasterizeSVG, exportCanvases,
  downloadBlob, downloadDataURL, moveLayer,
});
