// Occasion templates (custom order, new home, pop-up) keep only the detail slides.
// Their cover and closing slides come from the matching style (kitId).
function readyPostSlides(post){
  const kit=post.kitId&&CAROUSEL_STYLE_PAIRS.find(p=>p.id===post.kitId)?.kit;
  if(!kit||!post.slides?.length)return post.slides||[];
  const cta=CAROUSEL_CTA_CHOICES[kit.cta]||CAROUSEL_CTA_CHOICES.save;
  return [{title:kit.cover.title,body:kit.cover.body},...post.slides,{title:cta.title,body:cta.body}];
}
// Exact scripted pages: never redistribute text or append an automatic outro.
function fullSinglePostCanvas(post,size,pairId,brand){
  const W=1080,H=size==='portrait'?1350:1080,pair=CAROUSEL_STYLE_PAIRS.find(p=>p.id===pairId)||CAROUSEL_STYLE_PAIRS[0];
  const paragraphs=(post.caption||'').trim().split(/\n\s*\n/);
  const titleText=paragraphs.shift()||post.imageText||post.title||'',bodyText=paragraphs.join('\n\n');
  const c={id:uid(),name:'Post',slideKind:'content',w:W,h:H,bg:{type:'color',value:pair.bg},elements:[]};
  const title=newElement('text',{...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',text:titleText,x:86,y:86,w:908,fontSize:pair.kit?104:84,color:pair.ink,italic:!!pair.italic});
  const body=newElement('text',{...SLIDE_TEXT_STYLES.body,textStyle:'body',__role:'body',text:bodyText,x:86,y:0,w:908,fontSize:42,lineHeight:1.4,color:pair.split?'#2A1F2A':pair.ink});
  const measure=()=>{title.h=textLayout(title).height;body.y=title.y+title.h+60;body.h=bodyText?textLayout(body).height:0;};
  measure();
  while(body.y+body.h>H-220&&(title.fontSize>52||body.fontSize>32)){
    title.fontSize=Math.max(52,title.fontSize-2);body.fontSize=Math.max(32,body.fontSize-1);measure();
  }
  if(body.y+body.h>H-220)throw new Error('This text is too long to fit legibly on one page. Shorten it or use a carousel; no words have been removed.');
  if(pair.split)c.elements.push(newElement('rect',{x:0,y:body.y-30,w:W,h:H-(body.y-30),fill:'#FDFBFC',radius:0}));
  c.elements.push(title);
  if(bodyText)c.elements.push(body);
  const branding=brandBackgroundElements('signature',c,brand);
  for(const el of branding)if(el.type==='text')el.color=pair.split?'#2A1F2A':pair.ink;
  c.elements.push(...branding);
  return c;
}
// Big text lead post, modelled on the Quote starter: large quotation mark, big italic lead line,
// optional smaller supporting lines. Lines come from the image text (split on ' / ') or the caption's first paragraph.
function bigTextCanvas(post,size,pairId,brand){
  const W=1080,H=size==='portrait'?1350:1080,pair=CAROUSEL_STYLE_PAIRS.find(p=>p.id===pairId)||CAROUSEL_STYLE_PAIRS[0];
  const raw=post.imageText||(post.caption||'').trim().split(/\n\s*\n/)[0]||post.title||'';
  const lines=raw.split(/ \/ |\n/).map(x=>x.trim()).filter(Boolean);
  const dark=pair.ink==='#FDFBFC',ink=pair.split?'#2A1F2A':pair.ink;
  const c={id:uid(),name:'Post',slideKind:'content',w:W,h:H,bg:{type:'color',value:pair.bg},elements:[]};
  const mark=newElement('text',{...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',text:'\u201C',x:70,y:40,w:320,fontSize:340,lineHeight:.8,color:dark?'#E8B8DC':'#D98BC6'});
  mark.h=textLayout(mark).height;
  const support=lines.length>2;
  const lead=newElement('text',{...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',text:support?lines[0]:lines.join('\n'),x:86,y:Math.round(H*.26),w:908,fontSize:support?88:100,lineHeight:1.2,italic:true,color:ink});
  const rest=support?newElement('text',{...SLIDE_TEXT_STYLES.body,textStyle:'body',__role:'body',text:lines.slice(1).join('\n'),x:86,y:0,w:908,fontSize:48,lineHeight:1.45,color:ink}):null;
  const measure=()=>{lead.h=textLayout(lead).height;if(rest){rest.y=lead.y+lead.h+44;rest.h=textLayout(rest).height;}};
  const bottom=()=>rest?rest.y+rest.h:lead.y+lead.h;
  measure();
  while(bottom()>H-240&&(lead.fontSize>52||(rest&&rest.fontSize>34))){lead.fontSize=Math.max(52,lead.fontSize-2);if(rest)rest.fontSize=Math.max(34,rest.fontSize-1);measure();}
  if(bottom()>H-240)throw new Error('This text is too long for the big text layout. Shorten the image text; no words have been removed.');
  c.elements.push(mark,lead);if(rest)c.elements.push(rest);
  const branding=brandBackgroundElements('signature',c,brand);
  for(const el of branding)if(el.type==='text')el.color=ink;
  c.elements.push(...branding);
  return c;
}
function readyPostCanvases(post, size, pair, brand) {
  if(!post.slides?.length&&post.layout==='bigtext')return [bigTextCanvas(post,size,pair,brand)];
  if(!post.slides?.length&&post.includeFullText!==false)return [fullSinglePostCanvas(post,size,pair,brand)];
  const W=1080,H=size==='portrait'?1350:1080;
  const settings={size,pair,cta:post.cta||'message',logo:true,handles:true,swipe:true};
  const kitDef=post.kitId&&CAROUSEL_STYLE_PAIRS.find(p=>p.id===post.kitId)?.kit;
  const slides=post.slides?.length?readyPostSlides(post):[{title:(post.imageText||'').replace(/ \/ /g,'\n'),body:''}];
  return slides.map((slide,i)=>{
    if(slides.length===1&&!post.imageText)return {id:uid(),name:'Photo post',slideKind:'content',w:W,h:H,bg:{type:'color',value:'#FDFBFC'},elements:[]};
    let c;
    if(i===0||i===slides.length-1){
      const kind=i===0?'hook':'cta',limit=H-(kind==='hook'?170:390);
      // Fit the heading AND supporting copy together, preserving a separate
      // area for Swipe or Save/Share/Follow and the footer.
      for(let n=0;n<=12;n++){
        c=endpointSlide(kind,slide.title,slide.body,i===0&&slides.length>1?(post.hookLabel||kitDef?.label||''):'',{...settings,swipe:slides.length>1,textScale:1-n*.02},brand,W,H);
        const text=c.elements.filter(e=>e.__role==='heading'||e.__role==='body');
        if(text.every(e=>e.y+textLayout(e).height<=limit))break;
        if(n===12)throw new Error('The opening or closing text is too long to fit legibly. Shorten it in Edit words; no words have been removed.');
      }
      c.name=slides.length===1?'Post':i===0?'Cover':'Closing slide';
    }else{
      c={id:uid(),name:`Slide ${i+1}`,slideKind:'content',w:W,h:H,bg:{type:'color',value:i%2?'#FDFBFC':'#FBF0F7'},elements:[]};
      if(slide.photo){
        // Photo slide: heading, an empty photo area (no instruction text on the canvas), one short line below.
        const head=newElement('text',{...SLIDE_TEXT_STYLES.h2,text:slide.title,x:86,y:86,w:908,fontSize:64,textStyle:'h2',__role:'heading',color:'#2A1F2A'});head.h=textLayout(head).height;
        const frameY=head.y+head.h+30,frameH=Math.round(H*(H>1100?.44:.36));
        const note=newElement('text',{...SLIDE_TEXT_STYLES.body,text:slide.body,x:86,y:frameY+frameH+30,w:908,fontSize:42,lineHeight:1.4,textStyle:'body',__role:'body',color:'#2A1F2A'});
        while(note.fontSize>32&&note.y+textLayout(note).height>H-200)note.fontSize-=2;
        if(note.y+textLayout(note).height>H-200)throw new Error('Slide '+(i+1)+' has too much text next to the photo. Shorten the line in Edit words; no words have been removed.');
        note.h=textLayout(note).height;
        c.elements.push(head,newElement('rect',{x:86,y:frameY,w:908,h:frameH,fill:'#F4E3EF',radius:28}),note,...brandBackgroundElements('signature',c,brand));
        return c;
      }
      const numbered=/^\d+$/.test(slide.title);
      const label=newElement('text',{...SLIDE_TEXT_STYLES[numbered?'label':'h2'],text:slide.title,x:86,y:86,w:908,fontSize:numbered?32:76,textStyle:numbered?'label':'h2',__role:numbered?'number':'heading',color:numbered?'#963d80':'#2A1F2A'});label.h=textLayout(label).height;c.elements.push(label);
      if(post.middleStyle==='steps')c.elements.push(newElement('rect',{x:86,y:label.y+label.h+24,w:100,h:3,fill:'#963d80',radius:0}));
      const body=newElement('text',{...SLIDE_TEXT_STYLES.body,text:slide.body,x:86,y:Math.max(Math.round(H*.28),label.y+label.h+64),w:908,fontSize:post.middleStyle==='editorial'?60:50,lineHeight:post.middleStyle==='editorial'?1.28:1.4,textStyle:'body',__role:'body',color:'#2A1F2A',...(post.middleStyle==='editorial'?{fontFamily:'Cormorant Garamond'}:{})});
      while(body.fontSize>38&&body.y+textLayout(body).height>H-230)body.fontSize-=2;
      if(body.y+textLayout(body).height>H-230)throw new Error('Slide '+(i+1)+' has too much text to fit legibly. Shorten it in Edit words; no words have been removed.');
      body.h=textLayout(body).height;c.elements.push(body,...brandBackgroundElements('signature',c,brand));
    }
    // Photo-only posts start with a genuinely blank canvas, not instruction text.
    if(slides.length===1&&!post.imageText)c={id:uid(),name:'Photo post',slideKind:'content',w:W,h:H,bg:{type:'color',value:'#FDFBFC'},elements:[]};
    return c;
  });
}

// Check actual words, not JSON array brackets (every carousel has those).
function readyPostHasPlaceholders(post){
  return [post.caption,...(post.slides||[]).flatMap(s=>[s.title,s.body])]
    .some(text=>/\[[^\]]+\]/.test(text||''));
}
function readySlideText(post){
  return post.slides?.length?readyPostSlides(post).map((s,i)=>'Slide '+(i+1)+'\n'+[s.title,s.body].filter(Boolean).join('\n\n')).join('\n\n---\n\n'):
    (post.includeFullText!==false?post.caption:post.imageText)||'';
}
function canvasSlideText(canvases){
  return canvases.map((c,i)=>'Slide '+(i+1)+'\n'+c.elements
    .filter(e=>e.type==='text'&&!e.hidden&&!e.fromBrand&&!e.brandSlot&&!e.engagementAction&&e.__role!=='swipe')
    .slice().sort((a,b)=>a.y-b.y||a.x-b.x).map(e=>e.text).filter(Boolean).join('\n\n')).join('\n\n---\n\n');
}
const READY_CONTENT_SECTIONS=[
  {id:'priority',name:'New & priority'},{id:'all',name:'All content'},
  {id:'orders',name:'Custom orders & new homes'},{id:'events',name:'Events & pop-ups'},
  {id:'start',name:'Start here'},{id:'fit',name:'Find your fit'},
  {id:'care',name:'Care & troubleshooting'},{id:'brand',name:'About Wonder Pads'},
  {id:'small',name:'Small switches & savings'},{id:'archive',name:'Archive'}
];
function readyContentStatus(post){
  if(post.status==='posted')return 'posted';
  return readyPostHasPlaceholders(post)||(post.confirmation&&!post.confirmed)?'check':'ready';
}
function filterReadyLibrary(posts,{section='all',format='',status='',search=''}={}){
  const query=search.trim().toLowerCase();
  return posts.filter(p=>(section==='archive'?!!p.archived:!p.archived)&&
    (['all','archive'].includes(section)||section==='priority'&&p.priority!=null||p.librarySection===section)&&
    (!format||p.format===format)&&(!status||readyContentStatus(p)===status)&&
    (!query||[p.title,p.caption,...(p.slides||[]).flatMap(s=>[s.title,s.body])].join(' ').toLowerCase().includes(query)));
}
function readySectionName(post){return READY_CONTENT_SECTIONS.find(s=>s.id===post.librarySection)?.name||'About Wonder Pads';}
function ReadyContentPlan(){
  const {state,dispatch}=useStore();
  const [section,setSection]=React.useState('priority'),[selected,setSelected]=React.useState(null),[size,setSize]=React.useState('portrait'),[pair,setPair]=React.useState('clear'),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
  React.useEffect(()=>{dispatch({type:'import-ready-posts',posts:window.WONDER_READY_POSTS||[]});},[]);
  const posts=(state.calendar||[]).filter(p=>p.packId==='wp-weeks-1-8').sort((a,b)=>(a.priority??100)-(b.priority??100)||String(a.date||'').localeCompare(String(b.date||'')));
  const post=posts.find(p=>p.id===selected);
  const patch=changes=>dispatch({type:'update-calendar-entry',id:post.id,patch:changes});
  const caption=post?[post.caption,post.hashtags].filter(Boolean).join('\n\n'):'';
  const unresolved=post&&readyPostHasPlaceholders(post);
  const [copyFallback,setCopyFallback]=React.useState('');
  const [format,setFormat]=React.useState(''),[status,setStatus]=React.useState(''),[search,setSearch]=React.useState('');
  const visible=filterReadyLibrary(posts,{section,format,status,search});
  const openEntry=p=>{setSelected(p.id);setPair(p.stylePair||'clear');setSize(p.defaultSize||'portrait');setNotice('');};
  React.useEffect(()=>{setCopyFallback('');},[selected]);
  const copyWords=async()=>{const words=readySlideText(post);try{await navigator.clipboard.writeText(words);setCopyFallback('');setNotice('All slide text copied.');}catch{setCopyFallback(words);setNotice('Select and copy the slide text below.');}};
  const project=post&&state.projects.find(p=>p.contentEntryId===post.id);
  const home=()=>{sessionStorage.setItem('wpr-simple-section','create');dispatch({type:'set-view',view:'home'});};
  const create=async(rebuild=false)=>{
    setBusy(true);setNotice('');
    try{
      if(project&&!rebuild){dispatch({type:'open-project',id:project.id});return;}
      if(unresolved)throw new Error('Replace the bracketed prices and quantities in Edit words first.');
      if(post.confirmation&&!post.confirmed)throw new Error('Confirm the product details below before creating your design.');
      const allSlides=readyPostSlides(post);if(allSlides.length&&(!allSlides[0].title.trim()||!allSlides[allSlides.length-1].title.trim()))throw new Error('Add a title to the opening and closing slides in Edit words.');
      await Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('400 50px "Montserrat"')]);
      const canvases=readyPostCanvases(post,size,pair,state.brand),id=uid();
      dispatch({type:'create-project',project:{id,name:post.title.slice(0,70),createdAt:now(),updatedAt:now(),canvases,activeCanvasId:canvases[0].id,projectType:post.format==='Carousel'?'carousel':'post',contentEntryId:post.id,caption,contentDate:post.date}});
      patch({designCreated:true});
    }catch(e){setNotice(e.message||'Could not create the design.');}finally{setBusy(false);}
  };
  return <div className="simple-shell"><SimpleStudioStyles/><style>{`.ready-fields textarea{width:100%;box-sizing:border-box;font:16px/1.6 Montserrat,sans-serif;min-height:120px;border:1px solid #dfcbd9;border-radius:10px;padding:12px}.ready-fields label{display:block;margin:16px 0 6px}.ready-actions{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}.ready-actions button,.ready-actions select{min-height:44px}.ready-notes{white-space:pre-wrap}.ready-list{display:grid;gap:12px}.ready-list button{width:100%}.ready-sections{display:flex;gap:8px;overflow-x:auto;padding:10px 0}.ready-sections button{flex-shrink:0;min-height:44px;border:1px solid #dfcbd9;border-radius:24px;padding:8px 14px;background:#fff;color:#2A1F2A}.ready-sections button[aria-pressed="true"]{background:#963d80;color:#fff}.ready-filters{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}.ready-filters label{flex:1 1 180px;min-width:0}.ready-filters input,.ready-filters select{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #dfcbd9;border-radius:10px;padding:8px;background:#fff}.ready-fields input:not([type="checkbox"]){box-sizing:border-box;max-width:100%}.ready-fields select{max-width:100%}.ready-badge{display:inline-block;background:#F1CFEA;border-radius:16px;padding:4px 10px;margin-right:8px}.ready-list .simple-card{text-align:left}`}</style>
    <header className="simple-header"><div><strong>Content Library</strong><small>Choose what you want to post today</small></div><button className="simple-action simple-secondary" onClick={post?()=>{setSelected(null);setNotice('');}:home}>{post?'← All posts':'← Home'}</button></header>
    <main className="simple-content"><div className="simple-inner">
    {!post?<>
      <p className="simple-muted">Choose any topic, create editable slides, then download and post. New posts come first; the original plan dates are optional. Your edits and saved designs stay in this browser and your app backup.</p>
      <nav className="ready-sections" aria-label="Content sections">{READY_CONTENT_SECTIONS.map(s=><button key={s.id} aria-pressed={section===s.id} onClick={()=>setSection(s.id)}>{s.name}</button>)}</nav>
      <div className="ready-filters">
        <label>Find a topic<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. prints, washing, first pad"/></label>
        <label>Format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="">All formats</option><option value="Carousel">Carousel</option><option value="Static post">Single post</option><option value="Reel">Reel</option></select></label>
        <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="ready">Ready to use</option><option value="check">Needs checking</option><option value="posted">Posted</option></select></label>
      </div>
      <p className="simple-muted">{visible.length} {visible.length===1?'entry':'entries'}</p>
      {!visible.length&&<p role="status">No matching posts. Try another section or clear the filters.</p>}
      <div className="ready-list">{visible.map(p=><button className="simple-card" key={p.id} onClick={()=>openEntry(p)}>
        <span>{p.priority!=null&&<span className="ready-badge">New</span>}{readySectionName(p)} · {p.format==='Static post'?'Single post':p.format}</span>
        <h3>{p.title}</h3>
        <p>{readyContentStatus(p)==='posted'?'Posted':readyContentStatus(p)==='check'?'Needs your confirmation':p.designCreated?'Design saved':p.format==='Carousel'?`Text ready · ${readyPostSlides(p).length} slides`:p.format==='Reel'?'Script ready · filming needed':'Text ready · one page'}</p>
        {p.stylePair&&<small>Suggested style: {CAROUSEL_STYLE_PAIRS.find(s=>s.id===p.stylePair)?.name}</small>}
      </button>)}</div>
    </>:<div className="simple-card ready-fields">
      <p className="simple-muted">{readySectionName(post)} · {post.format==='Static post'?'Single post':post.format}{post.archived?' · Archived':''}</p><h1 className="simple-title">{post.title}</h1>
      {post.week&&<p className="simple-muted">Original plan: week {post.week} · {post.date}. Use it whenever you like.</p>}
      {post.stylePair&&<p className="simple-muted">Suggested style: {CAROUSEL_STYLE_PAIRS.find(s=>s.id===post.stylePair)?.name}. You can choose another below.</p>}
      {post.format!=='Reel'&&<div className="ready-actions"><select aria-label="Post aspect ratio" value={size} onChange={e=>setSize(e.target.value)}><option value="portrait">Portrait · 1080 × 1350</option><option value="post">Square · 1080 × 1080</option></select><select aria-label="Opening and closing style" value={pair} onChange={e=>setPair(e.target.value)}>{CAROUSEL_STYLE_PAIRS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="simple-action" disabled={busy} onClick={()=>create()}>{busy?'Creating…':project?'Open saved design':post.format==='Carousel'?`Create my ${readyPostSlides(post).length} slides`:'Create single post'}</button>{project&&<button className="simple-action simple-secondary" disabled={busy} onClick={()=>create(true)}>Create updated copy</button>}</div>}
      {notice&&<p role="status">{notice}</p>}
      {post.format!=='Reel'&&<div className="ready-actions"><button className="simple-action simple-secondary" onClick={copyWords}>Copy all slide text</button></div>}
      {copyFallback&&<textarea aria-label="Slide text to copy" readOnly value={copyFallback} onFocus={e=>e.target.select()}/>}
      {post.format==='Reel'?<><h2>Filming script</h2><pre style={{whiteSpace:'pre-wrap',font:'inherit',lineHeight:1.7}}>{post.script}</pre><p className="simple-muted">This app does not produce video. Film these scenes separately.</p></>:<p className="simple-muted">{post.format==='Carousel'?'Exact slide order, with no extra CTA page. Fonts, text and elements remain editable on the canvas.':'Full written content wraps onto one page by default. Hashtags stay in the caption, not on the slide.'}</p>}
      {post.confirmation&&<div role="status"><p>{post.confirmation}</p>{unresolved?<p>Unfilled prices/quantities remain. Replace them in Edit words below.</p>:<label><input type="checkbox" checked={!!post.confirmed} onChange={e=>patch({confirmed:e.target.checked})}/> I checked this against my actual products and care instructions</label>}</div>}
      {post.format==='Static post'&&<label><input type="checkbox" checked={post.includeFullText!==false} onChange={e=>patch({includeFullText:e.target.checked})}/> Put the full written content on this one-page slide (uncheck for headline/photo only)</label>}
      {post.format==='Static post'&&!post.slides?.length&&<label><input type="checkbox" checked={post.layout==='bigtext'} onChange={e=>patch({layout:e.target.checked?'bigtext':''})}/> Big text layout (large quotation mark and a big lead line, like the Quote template)</label>}
      <h2>Caption & hashtags</h2><textarea aria-label="Post caption" value={post.caption} onChange={e=>patch({caption:e.target.value})}/><label>Hashtags <input aria-label="Post hashtags" value={post.hashtags} onChange={e=>patch({hashtags:e.target.value})}/></label>
      <div className="ready-actions"><button className="simple-action simple-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(caption);setNotice('Caption and hashtags copied.');}catch{setNotice('Copy is unavailable here. Select the caption and hashtags manually.');}}}>Copy caption & hashtags</button><button className="simple-action simple-secondary" onClick={()=>patch({status:post.status==='posted'?'queued':'posted'})}>{post.status==='posted'?'Mark not posted':'Mark posted'}</button><button className="simple-action simple-secondary" onClick={()=>{patch({archived:!post.archived});setNotice(post.archived?'Returned to the library.':'Moved to Archive. Your words and design are kept.');}}>{post.archived?'Return to library':'Move to Archive'}</button></div>
      <details><summary>Preparation notes</summary><p className="ready-notes simple-muted">{post.notes||'No additional preparation notes.'}</p><p className="simple-muted">Contacts: @ecoclothpad · wonder-pads.com. No WhatsApp number has been invented.</p></details>
      {post.format!=='Reel'&&<details><summary>Edit words before creating slides</summary>{post.kitId&&CAROUSEL_STYLE_PAIRS.some(p=>p.id===post.kitId&&p.kit)&&<p className="simple-muted">The cover and closing slides come from the “{CAROUSEL_STYLE_PAIRS.find(p=>p.id===post.kitId).name}” style above, so only the detail slides are listed here. You can still edit the cover and closing words on the canvas.</p>}{project&&<p>These edits change the saved script. Your existing design is kept. Use Create updated copy to transfer the current text and settings without overwriting it.</p>}{post.slides?.length?post.slides.map((s,i)=>{
        const n=post.slides.length,wrapped=!!(post.kitId&&CAROUSEL_STYLE_PAIRS.some(p=>p.id===post.kitId&&p.kit)),off=wrapped?1:0,first=!wrapped&&i===0&&n>1,last=!wrapped&&i===n-1&&n>1;
        const setSlide=change=>patch({slides:post.slides.map((x,j)=>j===i?{...x,...change}:x),confirmed:false});
        return <div key={i} style={{marginTop:18,paddingTop:12,borderTop:'1px solid #ead5e5'}}>
          <h3 style={{margin:'0 0 4px'}}>{first?'Cover slide':last?'Closing slide':`Slide ${i+1+off}`}</h3>
          {first&&<label>Small label above the headline (optional)<input maxLength={32} aria-label="Cover label" value={post.hookLabel||''} onChange={e=>patch({hookLabel:e.target.value})} placeholder="e.g. CUSTOM ORDER"/></label>}
          {last&&<label>What should readers do next?<select aria-label="Closing slide action" value={post.cta||'message'} onChange={e=>{const c=CAROUSEL_CTA_CHOICES[e.target.value];patch({cta:e.target.value,slides:post.slides.map((x,j)=>j===i?{...x,title:c.title,body:c.body}:x),confirmed:false});}}>{Object.entries(CAROUSEL_CTA_CHOICES).map(([id,c])=><option key={id} value={id}>{c.label}</option>)}</select></label>}
          {last&&<p className="simple-muted">Picking an action fills in the closing words below. You can still edit them afterwards.</p>}
          {s.photo&&<p className="simple-muted">Photo slide: the pink area is where your picture goes.</p>}
          <label>{first?'Cover headline':last?'Closing headline':`Slide ${i+1+off} title`} <input value={s.title} onChange={e=>setSlide({title:e.target.value})}/></label>
          <textarea aria-label={`Slide ${i+1} text`} value={s.body} onChange={e=>setSlide({body:e.target.value})}/>
        </div>;
      }):<textarea aria-label="Image text" value={post.imageText||''} onChange={e=>patch({imageText:e.target.value})}/>}</details>}

    </div>}
    </div></main>
  </div>;
}
