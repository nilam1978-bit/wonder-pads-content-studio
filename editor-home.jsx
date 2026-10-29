// Home dashboard — Recent designs, New from preset, My templates, Starter templates
const { useState: hS, useRef: hR, useEffect: hE, useMemo: hM } = React;

// Small illustration kits drawn from plain shapes, so they stay editable and recolourable on the canvas.
const illoTent = (x, y, w, c) => { // little market stall: roof, scalloped awning, table
  const k = w / 300, d = 75 * k;
  return [
    {type:'triangle',patch:{fill:c.roof,x,y,w,h:110*k}},
    {type:'rect',patch:{fill:c.awning,x,y:y+110*k,w,h:34*k,radius:0}},
    ...[0,1,2,3].map(i => ({type:'circle',patch:{fill:i%2 ? c.awning : c.roof,x:x+i*d,y:y+128*k,w:d,h:d*0.8}})),
    {type:'rect',patch:{fill:c.post,x:x+14*k,y:y+150*k,w:10*k,h:120*k,radius:4}},
    {type:'rect',patch:{fill:c.post,x:x+w-24*k,y:y+150*k,w:10*k,h:120*k,radius:4}},
    {type:'rect',patch:{fill:c.table,x:x-6*k,y:y+250*k,w:w+12*k,h:26*k,radius:8*k}},
  ];
};
const illoPad = (x, y, w, c) => { // a cloth pad with wings, seen from above
  const k = w / 280;
  return [
    {type:'rect',patch:{fill:c.wing,x:x+100*k,y:y-28*k,w:80*k,h:44*k,radius:18*k}},
    {type:'rect',patch:{fill:c.wing,x:x+100*k,y:y+68*k,w:80*k,h:44*k,radius:18*k}},
    {type:'rect',patch:{fill:c.body,x,y,w,h:84*k,radius:42*k}},
    {type:'rect',patch:{fill:c.line,x:x+44*k,y:y+37*k,w:192*k,h:10*k,radius:5*k}},
    ...[0,1,2].map(i => ({type:'circle',patch:{fill:c.line,x:x+72*k+i*68*k,y:y+14*k,w:12*k,h:12*k}})),
  ];
};
const illoFlower = (cx, cy, r, c) => [ // the Wonder Pads floral touch
  ...[0,1,2,3,4].map(i => { const a = -Math.PI/2 + i*2*Math.PI/5; return {type:'circle',patch:{fill:c.petal,x:cx+Math.cos(a)*r*1.15-r*0.7,y:cy+Math.sin(a)*r*1.15-r*0.7,w:r*1.4,h:r*1.4}}; }),
  {type:'circle',patch:{fill:c.heart,x:cx-r*0.55,y:cy-r*0.55,w:r*1.1,h:r*1.1}},
];
const illoSparkle = (x, y, size, color) => ({type:'icon',patch:{name:'sparkle',color,x,y,w:size,h:size,strokeWidth:2}});

// Big-text covers (restored from the first version of the app). These carry their own words and layout.
// Wording is a placeholder only: no prices, dates or customer quotes. Replace every line with your own.
const BIG_TEXT_STARTERS = [
  // Dark plum story announcement (portrait 1080x1350)
  {name:'Big text · Plum announcement',preset:SIZE_PRESETS[1],bg:'#7d2960',accent:'#FDFBFC',
    els:[
      {type:'text',patch:{text:'WONDER PADS  ·  NEWS',fontFamily:'Instrument Sans',fontSize:26,color:'#F1CFEA',x:80,y:100,w:920,h:40,align:'left',letterSpacing:6,fontWeight:600}},
      {type:'text',patch:{text:'big news\nhere.',fontFamily:'DM Serif Display',fontSize:230,color:'#FDFBFC',x:80,y:380,w:920,h:560,align:'left',italic:true,lineHeight:1}},
      {type:'rect',patch:{fill:'#D98BC6',x:80,y:1050,w:100,h:6,radius:4}},
      {type:'text',patch:{text:'Add one or two short lines\nof detail here.',fontFamily:'Instrument Sans',fontSize:36,color:'#F1CFEA',x:80,y:1090,w:920,h:140,align:'left',lineHeight:1.45}},
    ]},
  // Orchid product spotlight
  {name:'Big text · Orchid spotlight',preset:SIZE_PRESETS[0],bg:'#D98BC6',accent:'#FDFBFC',
    els:[
      {type:'text',patch:{text:'FEATURED',fontFamily:'Instrument Sans',fontSize:24,color:'#FDFBFC',x:100,y:130,w:880,h:40,align:'left',letterSpacing:8,fontWeight:700}},
      {type:'text',patch:{text:'your pad\nname.',fontFamily:'DM Serif Display',fontSize:190,color:'#FDFBFC',x:100,y:200,w:880,h:460,align:'left',italic:true,lineHeight:1.05}},
      {type:'rect',patch:{fill:'#FDFBFC',x:100,y:720,w:880,h:1,radius:0}},
      {type:'text',patch:{text:'length  ·  top fabric  ·  absorbency',fontFamily:'Instrument Sans',fontSize:28,color:'#FDFBFC',x:100,y:760,w:880,h:40,align:'left',letterSpacing:1}},
      {type:'text',patch:{text:'wonder-pads.com',fontFamily:'Instrument Sans',fontSize:26,color:'#FDFBFC',x:480,y:900,w:500,h:40,align:'right',letterSpacing:2}},
    ]},
  // Blush "drop" announcement
  {name:'Big text · Blush announcement',preset:SIZE_PRESETS[0],bg:'#F7E1F0',accent:'#C260A8',
    els:[
      {type:'text',patch:{text:'DAY  ·  TIME',fontFamily:'Instrument Sans',fontSize:28,color:'#C260A8',x:100,y:130,w:880,h:40,align:'left',letterSpacing:8,fontWeight:700}},
      {type:'text',patch:{text:'new drop\nis coming.',fontFamily:'DM Serif Display',fontSize:180,color:'#2A1F2A',x:100,y:220,w:880,h:460,align:'left',lineHeight:1.05}},
      {type:'rect',patch:{fill:'#D98BC6',x:100,y:720,w:80,h:5,radius:4}},
      {type:'text',patch:{text:'Add what is new and\nwhen it is available.',fontFamily:'Instrument Sans',fontSize:34,color:'#56454F',x:100,y:760,w:880,h:160,align:'left',lineHeight:1.45}},
    ]},
  // Pink quote card
  {name:'Big text · Pink quote',preset:SIZE_PRESETS[0],bg:'#F1CFEA',accent:'#7d2960',
    els:[
      {type:'text',patch:{text:'“',fontFamily:'DM Serif Display',fontSize:400,color:'#D98BC6',x:80,y:60,w:300,h:400,align:'left'}},
      {type:'text',patch:{text:'your words or\na kind message\ngo here.',fontFamily:'DM Serif Display',fontSize:84,color:'#2A1F2A',x:100,y:340,w:880,h:460,italic:true,align:'left',lineHeight:1.2}},
      {type:'rect',patch:{fill:'#7d2960',x:100,y:840,w:60,h:3,radius:2}},
      {type:'text',patch:{text:'— name, or a Wonder Pads customer',fontFamily:'Instrument Sans',fontSize:24,color:'#56454F',x:100,y:870,w:600,h:40,align:'left',letterSpacing:3}},
      {type:'text',patch:{text:'thank you.',fontFamily:'Caveat',fontSize:64,color:'#C260A8',x:700,y:850,w:280,h:80,align:'right',italic:true}},
    ]},
  // Sage pop-up announcement
  {name:'Big text · Pop-up announcement',preset:SIZE_PRESETS[1],bg:'#4F6B53',accent:'#FDFBFC',
    els:[
      {type:'circle',patch:{fill:'#5C7A60',x:640,y:-160,w:620,h:620}},
      ...illoTent(700,120,300,{roof:'#F1CFEA',awning:'#D98BC6',post:'#E3EEDF',table:'#FDFBFC'}),
      ...illoFlower(840,1010,34,{petal:'#F1CFEA',heart:'#D98BC6'}),
      ...illoPad(700,1160,280,{body:'#FDFBFC',wing:'#F1CFEA',line:'#D98BC6'}),
      illoSparkle(590,200,48,'#F1CFEA'),illoSparkle(980,640,44,'#E3EEDF'),
      {type:'text',patch:{text:'POP-UP  ·  DAY & DATE',fontFamily:'Instrument Sans',fontSize:26,color:'#E3EEDF',x:80,y:100,w:920,h:40,align:'left',letterSpacing:6,fontWeight:600}},
      {type:'text',patch:{text:'come say\nhello.',fontFamily:'DM Serif Display',fontSize:230,color:'#FDFBFC',x:80,y:380,w:920,h:560,align:'left',italic:true,lineHeight:1}},
      {type:'rect',patch:{fill:'#F1CFEA',x:80,y:1050,w:100,h:6,radius:4}},
      {type:'text',patch:{text:'Event name\nTime  ·  Venue and address',fontFamily:'Instrument Sans',fontSize:36,color:'#E3EEDF',x:80,y:1090,w:600,h:140,align:'left',lineHeight:1.45}},
    ]},
  // Cream event reminder
  {name:'Big text · Event reminder',preset:SIZE_PRESETS[0],bg:'#FDFBFC',accent:'#4F6B53',
    els:[
      {type:'circle',patch:{fill:'#EEF3EA',x:700,y:-180,w:520,h:520}},
      ...illoTent(770,90,230,{roof:'#4F6B53',awning:'#D98BC6',post:'#4F6B53',table:'#F1CFEA'}),
      ...illoFlower(840,830,30,{petal:'#F1CFEA',heart:'#C260A8'}),
      ...illoPad(710,930,260,{body:'#F1CFEA',wing:'#E8B8DC',line:'#C260A8'}),
      illoSparkle(640,120,44,'#D98BC6'),illoSparkle(960,700,40,'#4F6B53'),
      {type:'text',patch:{text:'TOMORROW',fontFamily:'Instrument Sans',fontSize:28,color:'#4F6B53',x:100,y:130,w:880,h:40,align:'left',letterSpacing:8,fontWeight:700}},
      {type:'text',patch:{text:'see you\nthere.',fontFamily:'DM Serif Display',fontSize:190,color:'#2A1F2A',x:100,y:220,w:880,h:460,align:'left',italic:true,lineHeight:1.05}},
      {type:'rect',patch:{fill:'#4F6B53',x:100,y:720,w:80,h:5,radius:4}},
      {type:'text',patch:{text:'Event name\nTime  ·  Venue',fontFamily:'Instrument Sans',fontSize:34,color:'#56454F',x:100,y:760,w:560,h:160,align:'left',lineHeight:1.45}},
    ]},
];

// Blank brand backgrounds: keep the familiar Wonder Pads palette, not sample claims.
const STARTER_TEMPLATES = [
  {name:'Hook · Blush',preset:SIZE_PRESETS[0],bg:'#F1CFEA',accent:'#C260A8',brandLayout:'hook',slideKind:'hook'},
  {name:'Closing CTA · Blush',preset:SIZE_PRESETS[0],bg:'#F1CFEA',accent:'#C260A8',brandLayout:'signature',slideKind:'cta'},
  {name:'Hook · Cream',preset:SIZE_PRESETS[1],bg:'#FDFBFC',accent:'#C260A8',brandLayout:'hook',slideKind:'hook'},
  {name:'Closing CTA · Cream',preset:SIZE_PRESETS[1],bg:'#FDFBFC',accent:'#C260A8',brandLayout:'signature',slideKind:'cta'},
  {name:'Blush · Corner branding',preset:SIZE_PRESETS[0],bg:'#F7E1F0',accent:'#C260A8',brandLayout:'corner'},
  {name:'Cream · Header bar',preset:SIZE_PRESETS[0],bg:'#FDFBFC',accent:'#F1CFEA',brandLayout:'header'},
  {name:'Soft blush · Handle strip',preset:SIZE_PRESETS[0],bg:'#FBF0F7',accent:'#7d2960',brandLayout:'strip'},
  {name:'Orchid · Footer bar',preset:SIZE_PRESETS[0],bg:'#D98BC6',accent:'#FDFBFC',brandLayout:'footer'},
  {name:'Pink · Signature',preset:SIZE_PRESETS[0],bg:'#F1CFEA',accent:'#7d2960',brandLayout:'signature'},
  {name:'Plum · Writing frame',preset:SIZE_PRESETS[1],bg:'#7d2960',accent:'#FDFBFC',brandLayout:'frame'},
].map(t => ({...t,els:starterBackgroundElements(t,t.preset).map(el=>({type:el.type,patch:el}))}));
// Big-text covers first (they are the eye-catching ones), then the blank branded backgrounds.
// All big-text looks are 4:5 portrait. Square layouts are centred on the taller canvas (the full-bleed corner circle stays put).
BIG_TEXT_STARTERS.forEach(t => {
  if (t.preset.w === t.preset.h) {
    const dy = (SIZE_PRESETS[1].h - t.preset.h) / 2;
    t.els.forEach(e => { if (typeof e.patch.y === 'number' && e.patch.y >= 0) e.patch.y += dy; });
    t.preset = SIZE_PRESETS[1];
  }
});
STARTER_TEMPLATES.unshift(...BIG_TEXT_STARTERS);

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
      borderRadius: 0, boxShadow: 'none',
      overflow:'hidden', position:'relative',
    }}><div style={{width:canvas.w,height:canvas.h,transform:`scale(${scale})`,transformOrigin:'top left'}} dangerouslySetInnerHTML={{__html:svg}}/></div>
  );
}


// ------------------ Home ------------------


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

Object.assign(window, { STARTER_TEMPLATES, exportProjectFile, timeAgo, MiniPreview, BackupRestoreCard });
