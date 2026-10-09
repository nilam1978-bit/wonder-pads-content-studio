// Exact scripted pages: never redistribute text or append an automatic outro.
function fullSinglePostCanvas(post,size,pairId,brand){
  const W=1080,H=size==='portrait'?1350:1080,pair=CAROUSEL_STYLE_PAIRS.find(p=>p.id===pairId)||CAROUSEL_STYLE_PAIRS[0];
  const paragraphs=(post.caption||'').trim().split(/\n\s*\n/);
  const titleText=paragraphs.shift()||post.imageText||post.title||'',bodyText=paragraphs.join('\n\n');
  const c={id:uid(),name:'Post',slideKind:'content',w:W,h:H,bg:{type:'color',value:pair.bg},elements:[]};
  const title=newElement('text',{...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',text:titleText,x:86,y:86,w:908,fontSize:84,color:pair.ink,italic:!!pair.italic});
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
function readyPostCanvases(post, size, pair, brand) {
  if(!post.slides?.length&&post.includeFullText!==false)return [fullSinglePostCanvas(post,size,pair,brand)];
  const W=1080,H=size==='portrait'?1350:1080;
  const settings={size,pair,cta:post.cta||'message',logo:true,handles:true,swipe:true};
  const slides=post.slides?.length?post.slides:[{title:(post.imageText||'').replace(/ \/ /g,'\n'),body:''}];
  return slides.map((slide,i)=>{
    if(slides.length===1&&!post.imageText)return {id:uid(),name:'Photo post',slideKind:'content',w:W,h:H,bg:{type:'color',value:'#FDFBFC'},elements:[]};
    let c;
    if(i===0||i===slides.length-1){
      c=endpointSlide(i===0?'hook':'cta',slide.title,slide.body,'', {...settings,swipe:slides.length>1},brand,W,H);
      c.name=slides.length===1?'Post':i===0?'Cover':'Closing slide';
      // Leave a predictable safe area even for longer imported hook lines.
      const title=c.elements.find(e=>e.__role==='heading');
      if(title){
        const originalBottom=title.y+title.h;
        while(title.fontSize>64&&title.y+textLayout(title).height>H-210) title.fontSize-=2;
        title.h=textLayout(title).height;
        const delta=title.y+title.h-originalBottom;
        if(delta<0)for(const e of c.elements)if(e.endpointDecoration&&e.type==='rect'&&e.h<=3)e.y+=delta;
      }
    }else{
      c={id:uid(),name:`Slide ${i+1}`,slideKind:'content',w:W,h:H,bg:{type:'color',value:i%2?'#FDFBFC':'#FBF0F7'},elements:[]};
      const label=newElement('text',{...SLIDE_TEXT_STYLES.label,text:slide.title,x:86,y:86,w:908,fontSize:32,textStyle:'label',__role:'number',color:'#963d80'});label.h=textLayout(label).height;c.elements.push(label);
      const body=newElement('text',{...SLIDE_TEXT_STYLES.body,text:slide.body,x:86,y:Math.round(H*.28),w:908,fontSize:50,lineHeight:1.4,textStyle:'body',__role:'body',color:'#2A1F2A'});
      while(body.fontSize>38&&body.y+textLayout(body).height>H-230)body.fontSize-=2;
      body.h=textLayout(body).height;c.elements.push(body,...brandBackgroundElements('signature',c,brand));
    }
    // Photo-only posts start with a genuinely blank canvas, not instruction text.
    if(slides.length===1&&!post.imageText)c={id:uid(),name:'Photo post',slideKind:'content',w:W,h:H,bg:{type:'color',value:'#FDFBFC'},elements:[]};
    return c;
  });
}

function ReadyContentPlan(){
  const {state,dispatch}=useStore();
  const [week,setWeek]=React.useState(''),[selected,setSelected]=React.useState(null),[size,setSize]=React.useState('portrait'),[pair,setPair]=React.useState('clear'),[busy,setBusy]=React.useState(false),[notice,setNotice]=React.useState('');
  React.useEffect(()=>{dispatch({type:'import-ready-posts',posts:window.WONDER_READY_POSTS||[]});},[]);
  const posts=(state.calendar||[]).filter(p=>p.packId==='wp-weeks-1-8').sort((a,b)=>a.date.localeCompare(b.date));
  const post=posts.find(p=>p.id===selected);
  const patch=changes=>dispatch({type:'update-calendar-entry',id:post.id,patch:changes});
  const caption=post?[post.caption,post.hashtags].filter(Boolean).join('\n\n'):'';
  const unresolved=post&&/\[[^\]]+\]/.test(JSON.stringify(post.slides)+post.caption);
  const project=post&&state.projects.find(p=>p.contentEntryId===post.id);
  const home=()=>{sessionStorage.setItem('wpr-simple-section','create');dispatch({type:'set-view',view:'home'});};
  const create=async(rebuild=false)=>{
    setBusy(true);setNotice('');
    try{
      if(unresolved)throw new Error('Replace the bracketed prices and quantities in Edit words first.');
      if(post.confirmation&&!post.confirmed)throw new Error('Confirm the product details below before creating your design.');
      if(post.slides?.length&&(!post.slides[0].title.trim()||!post.slides[post.slides.length-1].title.trim()))throw new Error('Add a title to the opening and closing slides in Edit words.');
      if(project&&!rebuild){dispatch({type:'open-project',id:project.id});return;}
      await Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('400 50px "Montserrat"')]);
      const canvases=readyPostCanvases(post,size,pair,state.brand),id=uid();
      dispatch({type:'create-project',project:{id,name:post.title.slice(0,70),createdAt:now(),updatedAt:now(),canvases,activeCanvasId:canvases[0].id,projectType:post.format==='Carousel'?'carousel':'post',contentEntryId:post.id,caption,contentDate:post.date}});
      patch({designCreated:true});
    }catch(e){setNotice(e.message||'Could not create the design.');}finally{setBusy(false);}
  };
  return <div className="simple-shell"><SimpleStudioStyles/><style>{`.ready-fields textarea{width:100%;box-sizing:border-box;font:16px/1.6 Montserrat,sans-serif;min-height:120px;border:1px solid #dfcbd9;border-radius:10px;padding:12px}.ready-fields label{display:block;margin:16px 0 6px}.ready-actions{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}.ready-actions button,.ready-actions select{min-height:44px}.ready-notes{white-space:pre-wrap}.ready-list{display:grid;gap:12px}.ready-list button{width:100%}`}</style>
    <header className="simple-header"><div><strong>Content Plan</strong><small>Eight weeks · ready-written content</small></div><button className="simple-action simple-secondary" onClick={post?()=>{setSelected(null);setNotice('');}:home}>{post?'← All posts':'← Home'}</button></header>
    <main className="simple-content"><div className="simple-inner">
    {!post?<><p className="simple-muted">Choose a post. Carousel text is ready to transfer to editable slides; photo posts need your images, and Reels need filming. Everything saves in this browser and is included in your app backup.</p><label>Week <select aria-label="Filter content week" value={week} onChange={e=>setWeek(e.target.value)}><option value="">All weeks</option>{Array.from({length:8},(_,i)=><option key={i} value={i+1}>Week {i+1}</option>)}</select></label><div className="ready-list">{posts.filter(p=>!week||p.week===+week).map(p=><button className="simple-card" key={p.id} onClick={()=>{setSelected(p.id);setNotice('');}}><span>Week {p.week} · {p.date} · {p.format}</span><h3>{p.title}</h3><p>{p.status==='posted'?'Posted':p.confirmation&&!p.confirmed?'Needs your confirmation':p.designCreated?'Design saved':p.format==='Carousel'?'Text ready · 8 slides':p.format==='Reel'?'Script ready · filming needed':'Text ready · add your photo'}</p></button>)}</div></>:<div className="simple-card ready-fields">
      <p className="simple-muted">Week {post.week} · {post.date} · {post.format}</p><h1 className="simple-title">{post.title}</h1>
      {post.format!=='Reel'&&<div className="ready-actions"><select aria-label="Post aspect ratio" value={size} onChange={e=>setSize(e.target.value)}><option value="portrait">Portrait · 1080 × 1350</option><option value="post">Square · 1080 × 1080</option></select><select aria-label="Opening and closing style" value={pair} onChange={e=>setPair(e.target.value)}>{CAROUSEL_STYLE_PAIRS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="simple-action" disabled={busy||!!unresolved||!!(post.confirmation&&!post.confirmed)} onClick={()=>create()}>{busy?'Creating…':project?'Open saved design':post.format==='Carousel'?'Create my 8 slides':'Create single post'}</button>{project&&<button className="simple-action simple-secondary" disabled={busy||!!unresolved||!!(post.confirmation&&!post.confirmed)} onClick={()=>create(true)}>Create updated copy</button>}</div>}
      {post.format==='Reel'?<><h2>Filming script</h2><pre style={{whiteSpace:'pre-wrap',font:'inherit',lineHeight:1.7}}>{post.script}</pre><p className="simple-muted">This app does not produce video. Film these scenes separately.</p></>:<p className="simple-muted">{post.format==='Carousel'?'Exact slide order, with no extra CTA page. Fonts, text and elements remain editable on the canvas.':'Full written content wraps onto one page by default. Hashtags stay in the caption, not on the slide.'}</p>}
      {post.confirmation&&<div role="status"><p>{post.confirmation}</p>{unresolved?<p>Unfilled prices/quantities remain. Replace them in Edit words below.</p>:<label><input type="checkbox" checked={!!post.confirmed} onChange={e=>patch({confirmed:e.target.checked})}/> I checked this against my actual products and care instructions</label>}</div>}
      {post.format==='Static post'&&<label><input type="checkbox" checked={post.includeFullText!==false} onChange={e=>patch({includeFullText:e.target.checked})}/> Put the full written content on this one-page slide (uncheck for headline/photo only)</label>}
      <h2>Caption & hashtags</h2><textarea aria-label="Post caption" value={post.caption} onChange={e=>patch({caption:e.target.value})}/><label>Hashtags <input aria-label="Post hashtags" value={post.hashtags} onChange={e=>patch({hashtags:e.target.value})}/></label>
      <div className="ready-actions"><button className="simple-action simple-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(caption);setNotice('Caption and hashtags copied.');}catch{setNotice('Copy is unavailable here. Select the caption and hashtags manually.');}}}>Copy caption & hashtags</button><button className="simple-action simple-secondary" onClick={()=>patch({status:post.status==='posted'?'queued':'posted'})}>{post.status==='posted'?'Mark not posted':'Mark posted'}</button></div>
      <details><summary>Preparation notes</summary><p className="ready-notes simple-muted">{post.notes||'No additional preparation notes.'}</p><p className="simple-muted">Contacts: @ecoclothpad · wonder-pads.com. No WhatsApp number has been invented.</p></details>
      {post.format!=='Reel'&&<details><summary>Edit words before creating slides</summary>{project&&<p>These edits change the saved script. Your existing design is kept. Use Create updated copy to transfer the current text and settings without overwriting it.</p>}{post.slides?.length?post.slides.map((s,i)=><div key={i}><label>Slide {i+1} title <input value={s.title} onChange={e=>patch({slides:post.slides.map((x,j)=>j===i?{...x,title:e.target.value}:x),confirmed:false})}/></label><textarea aria-label={`Slide ${i+1} text`} value={s.body} onChange={e=>patch({slides:post.slides.map((x,j)=>j===i?{...x,body:e.target.value}:x),confirmed:false})}/></div>):<textarea aria-label="Image text" value={post.imageText||''} onChange={e=>patch({imageText:e.target.value})}/>}</details>}
      {notice&&<p role="status">{notice}</p>}
    </div>}
    </div></main>
  </div>;
}
