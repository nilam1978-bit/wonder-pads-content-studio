// Separate, locally saved preview of the simplified Wonder Pads workflow.
function SimpleStudioStyles() {
  return <style>{`
    .simple-shell{height:var(--studio-viewport-height,100dvh);display:flex;flex-direction:column;background:#fcf6fa;color:#2a1f2a;overflow:hidden}
    .simple-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:white;border-bottom:1px solid #efdfeb;gap:12px;flex-shrink:0}
    .simple-header strong{font:24px 'DM Serif Display',serif}.simple-header small{display:block;color:#826d7e;font-size:12px;margin-top:4px}
    .simple-nav{display:flex;gap:6px;padding:8px 20px;background:white;border-bottom:1px solid #efdfeb;overflow:auto;flex-shrink:0}
    .simple-nav button,.simple-shell button{cursor:pointer}.simple-nav button{white-space:nowrap;border:0;border-radius:12px;padding:12px 16px;background:transparent;color:#65505f;font:inherit}
    .simple-nav button[aria-current=true]{background:#f3dced;color:#893773}
    .simple-content{overflow:auto;flex:1;min-height:0;padding:28px 24px 40px}.simple-inner{max-width:1050px;margin:auto}
    .simple-title{font:30px 'DM Serif Display',serif;margin:0 0 8px}.simple-muted{color:#776371;line-height:1.6;font-size:14px}
    .simple-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:20px 0 32px}
    .simple-card{background:white;border:1px solid #ebdbe7;border-radius:18px;padding:22px;text-align:left;color:inherit;min-width:0}
    button.simple-card:hover{border-color:#bf65a5;background:#fffafd}.simple-card h3{font:22px 'DM Serif Display',serif;margin:8px 0}.simple-card p{font-size:14px;color:#776371;line-height:1.5;margin:8px 0}
    .simple-card img{max-width:100%;height:150px;object-fit:contain}.simple-card textarea,.simple-card input{width:100%;box-sizing:border-box;padding:12px;background:#fcf6fa;border:1px solid #dfcbd9;border-radius:10px;font:16px/1.5 inherit;color:#2a1f2a}
    .simple-card textarea{font-size:16px;line-height:1.5;min-height:90px;resize:vertical}.simple-card label{display:block;margin:16px 0 6px;font-size:13px;color:#776371}
    .simple-action{padding:12px 18px;border:0;border-radius:12px;background:#963d80;color:white;font:inherit}.simple-secondary{background:#f1e2ed;color:#653451}
    .simple-workspace{height:var(--studio-viewport-height,100dvh);display:flex;flex-direction:column;overflow:hidden;background:#fcf6fa}
    .simple-design{flex:1;min-height:0;overflow:hidden}.simple-design>div{height:100%!important;min-height:0}
    .simple-workspace .simple-nav{justify-content:center}.simple-step-end{padding:12px 20px calc(12px + env(safe-area-inset-bottom,0px));background:white;border-top:1px solid #efdfeb;display:flex;justify-content:flex-end;flex-shrink:0}
    @media(max-width:640px){.simple-header{padding:12px 16px}.simple-header strong{font-size:20px}.simple-nav{padding:6px}.simple-nav button{padding:10px;font-size:13px}.simple-content{padding:22px 16px}.simple-title{font-size:27px}.simple-grid{grid-template-columns:1fr;gap:12px}.simple-card{padding:18px}}
  `}</style>;
}

function SimpleStudioHome() {
  const {state,dispatch}=useStore();
  const [section,setSection]=React.useState(()=>{
    const saved=sessionStorage.getItem('wpr-simple-section');
    return ['create','work','brand'].includes(saved)?saved:'create';
  });
  const [workTab,setWorkTab]=React.useState('designs');
  const [workFilter,setWorkFilter]=React.useState('all');
  const [query,setQuery]=React.useState('');
  const go=view=>dispatch({type:'set-view',view});
  const open=id=>dispatch({type:'open-project',id});
  const projects=[...state.projects].sort((a,b)=>b.updatedAt-a.updatedAt);
  const makePost=()=>setSection('post');
  const isBigText=t=>t.name.startsWith('Big text');
  const templateCard=t=><button className="simple-card" key={t.name} onClick={()=>applyTemplate(t)}><MiniPreview canvas={{...defaultCanvas(t.name,t.preset),bg:{type:'color',value:t.bg},elements:t.els.map(e=>newElement(e.type,e.patch))}} maxW={200} maxH={200}/><h3>{t.name.replace('Big text · ','')}</h3><p>Make it your own →</p></button>;
  const inProgress=projects.filter(p=>!p.finished),finishedList=projects.filter(p=>p.finished);
  const shownProjects=projects.filter(p=>(workFilter==='all'||(workFilter==='finished'?p.finished:!p.finished))&&p.name.toLowerCase().includes(query.toLowerCase()));
  // A draft is only "unfinished" while it has slides and has not yet been saved as a design.
  const hasUnsavedDraft=(state.carousel.slides?.length>0)&&!state.projects.some(p=>p.id===state.carousel.simpleProjectId);
  React.useEffect(()=>sessionStorage.setItem('wpr-simple-section',section),[section]);
  const projectCard=p=><article className="simple-card" key={p.id}>
    <button onClick={()=>open(p.id)} style={{width:'100%',textAlign:'left',background:'transparent',border:0,color:'inherit'}}>
      {p.thumbnail?<img src={p.thumbnail} alt=""/>:<MiniPreview canvas={p.canvases[0]} maxW={210} maxH={135}/>}
      <h3>{p.name}</h3><p>{p.canvases.length===1?'Single post':`${p.canvases.length} slides`} · {timeAgo(p.updatedAt)} · {p.finished?'Finished':'In progress'}</p><span>Open design →</span>
    </button>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
      <button onClick={()=>{const name=prompt('Rename design',p.name);if(name?.trim())dispatch({type:'rename-project',id:p.id,name:name.trim()});}}>Rename</button>
      <button onClick={()=>dispatch({type:'update-project',id:p.id,patch:{finished:!p.finished,finishedAt:p.finished?null:now()}})}>{p.finished?'Move back to in progress':'Mark as finished'}</button>
      <button onClick={()=>dispatch({type:'duplicate-project',id:p.id})}>Duplicate design</button>
      <button onClick={()=>{if(confirm(`Delete design “${p.name}”? This removes its saved slides from this browser. Download an editable backup first if needed.`))dispatch({type:'delete-project',id:p.id});}}>Delete design</button>
    </div>
  </article>;
  const applyTemplate=t=>{
    const p=t.canvases?{id:uid(),name:t.name,createdAt:now(),updatedAt:now(),canvases:JSON.parse(JSON.stringify(t.canvases)).map(c=>({...c,id:uid(),elements:c.elements.map(e=>({...e,id:uid()}))}))}:newProject(t.name,t.preset,t.els.map(e=>({type:e.type,patch:e.patch})));
    if(!t.canvases){
      p.canvases[0].bg={type:'color',value:t.bg};
      if(t.brandLayout){p.canvases[0].elements=starterBackgroundElements(t,p.canvases[0],state.brand);p.canvases[0].slideKind=t.slideKind;}
    }
    p.activeCanvasId=p.canvases[0].id;dispatch({type:'create-project',project:p});
  };
  return <div className="simple-shell"><SimpleStudioStyles/>
    <header className="simple-header"><div><strong>Wonder Pads Content Studio</strong><small>A little space for your handmade business</small></div></header>
    <nav className="simple-nav" aria-label="Main navigation">
      {[['create','Create'],['work','My Work'],['brand','My Brand']].map(([id,label])=><button key={id} aria-current={section===id||(id==='create'&&section==='post')} onClick={()=>setSection(id)}>{label}</button>)}
    </nav>
    <main className="simple-content"><div className="simple-inner">
      {section==='create'&&<><h1 className="simple-title">Create</h1><p className="simple-muted">Start something new, or pick up where you left off.</p><div className="simple-grid">
        <button className="simple-card" onClick={()=>go('carousel')}><span>NEW</span><h3>Paste my words</h3><p>Paste your text once, then choose a carousel or a single post.</p><span>Add your words →</span></button>
        <button className="simple-card" onClick={makePost}><span>SINGLE</span><h3>Single post from scratch</h3><p>Start blank or from a branded background. To turn pasted text into a single post, use “Write a new carousel” and choose Single post.</p><span>Pick a layout →</span></button>
        <button className="simple-card" onClick={()=>go('repurpose')}><span>REUSE</span><h3>Reuse my words</h3><p>Turn something you have already written into a carousel, a Facebook post or a TikTok script.</p><span>Paste and reuse →</span></button>
        <button className="simple-card" onClick={()=>go('ready-content')}><span>READY-MADE</span><h3>Posts &amp; templates</h3><p>Care tips, fabric stories, custom orders, new homes and pop-ups. Change the words and go.</p><span>Browse posts →</span></button>
      </div>{(hasUnsavedDraft||inProgress.length>0)&&<><h2 className="simple-title" style={{marginTop:28}}>Pick up where you left off</h2><div className="simple-grid">
        {hasUnsavedDraft&&<button className="simple-card" onClick={()=>openCarouselDraft(state,dispatch)}><span>UNFINISHED DRAFT</span><h3>Continue your carousel</h3><p>{state.carousel.slides.length} slides are waiting for you.</p><span>Continue editing →</span></button>}
        {inProgress.slice(0,3).map(projectCard)}
      </div>{inProgress.length>3&&<button className="simple-action simple-secondary" onClick={()=>{setWorkTab('designs');setWorkFilter('progress');setSection('work');}}>See all {inProgress.length} in My Work</button>}</>}</>}
      {section==='post'&&<><button className="simple-action simple-secondary" onClick={()=>setSection('create')}>← Back to Create</button><h1 className="simple-title" style={{marginTop:16}}>Make a single post</h1><p className="simple-muted">One slide only. Choose a size to start blank, or pick a layout below and replace the words.</p><div className="simple-grid">{SIZE_PRESETS.slice(0,3).map(p=><button className="simple-card" key={p.id} onClick={()=>dispatch({type:'create-project',name:'My new post',preset:p})}><h3>{p.name}</h3><p>{p.w} × {p.h}</p></button>)}</div>
        <h2>Big text layouts</h2><p className="simple-muted">A large headline, ready for your own words. The words shown are placeholders.</p><div className="simple-grid">{STARTER_TEMPLATES.filter(isBigText).map(templateCard)}</div>
        <h2>Branded backgrounds</h2><p className="simple-muted">Blank Wonder Pads backgrounds with your logo and contact details in place.</p><div className="simple-grid">{STARTER_TEMPLATES.filter(t=>!isBigText(t)).map(templateCard)}</div></>}
      {section==='work'&&<><h1 className="simple-title">My Work</h1><nav className="simple-nav" aria-label="My Work sections" style={{padding:'0 0 12px'}}>{[['designs','Designs'],['writing','Saved writing']].map(([id,label])=><button key={id} aria-current={workTab===id} onClick={()=>setWorkTab(id)}>{label}</button>)}</nav>
        {workTab==='designs'&&<><p className="simple-muted">{finishedList.length} finished · {inProgress.length} in progress. A design counts as finished once you download it. You can change that on any card.</p><nav className="simple-nav" aria-label="Filter designs" style={{padding:'0 0 12px'}}>{[['all','All'],['progress','In progress'],['finished','Finished']].map(([id,label])=><button key={id} aria-current={workFilter===id} onClick={()=>setWorkFilter(id)}>{label}</button>)}</nav><label className="simple-muted">Find a design <input aria-label="Find a design" value={query} onChange={e=>setQuery(e.target.value)} style={{padding:12,margin:12,borderRadius:10,border:'1px solid #dfcbd9'}}/></label><div className="simple-grid">{shownProjects.map(projectCard)}</div>{!shownProjects.length&&<p>{projects.length?'Nothing matches here. Try another filter.':'No designs yet. Choose Create to start.'}</p>}<BackupRestoreCard/></>}
        {workTab==='writing'&&<><p className="simple-muted">Text you have reused or written for launches, saved so you can find it again and send it to a carousel.</p><div className="simple-grid"><button className="simple-card" onClick={()=>go('history')}><h3>Open saved writing</h3><p>Reused text, saved launches and your library.</p><span>Open →</span></button></div></>}</>}
      {section==='brand'&&<><h1 className="simple-title">My Brand</h1><p className="simple-muted">Set this up once, then reuse it as you create.</p><BrandKitSection/></>}
      <p className="simple-muted">Your work saves automatically in this browser. Keep an editable backup of anything important.</p>
    </div></main>
  </div>;
}

function SimpleCalendarWorkspace() {
  const {dispatch}=useStore();
  const openSection=(section)=>{
    sessionStorage.setItem('wpr-simple-section',section);
    dispatch({type:'set-view',view:'home'});
  };
  return <div className="simple-shell"><SimpleStudioStyles/>
    <header className="simple-header"><div><strong>Wonder Pads Content Studio</strong><small>Calendar workspace · plan what you will share</small></div><span className="simple-muted">Calendar</span></header>
    <nav className="simple-nav" aria-label="Main navigation">
      {[['home','Home'],['create','Create'],['work','My Work'],['calendar','Calendar'],['brand','My Brand']].map(([id,label])=><button key={id} aria-current={id==='calendar'} onClick={()=>id==='calendar'?null:openSection(id)}>{label}</button>)}
    </nav>
    <div style={{flex:1,minHeight:0,overflow:'hidden'}}><CalendarScreen embedded/></div>
  </div>;
}

function SimpleSlideStrip() {
  const {state,dispatch}=useStore();
  const p=activeProject(state);
  const index=p.canvases.findIndex(c=>c.id===p.activeCanvasId);
  const select=i=>dispatch({type:'set-active-canvas',id:p.canvases[i].id});
  const arrow={flexShrink:0,border:0,borderRadius:24,background:'rgba(255,255,255,.65)',width:40,height:40,fontSize:25,color:'#865575',cursor:'pointer'};
  return <nav aria-label="Slides" style={{display:'flex',alignItems:'center',gap:8,padding:8,background:'#faf1f8',minWidth:0}}>
    <button aria-label="Previous slide" disabled={index<=0} onClick={()=>select(index-1)} style={{...arrow,opacity:index<=0?.3:1}}>‹</button>
    <div style={{display:'flex',overflowX:'auto',gap:8,flex:1,minWidth:0}}>{p.canvases.map((c,i)=><button key={c.id} aria-label={`Slide ${i+1}`} aria-current={i===index} onClick={()=>select(i)} style={{flexShrink:0,width:74,padding:2,border:i===index?'2px solid #b65c9f':'2px solid transparent',borderRadius:0,background:'transparent'}}><MiniPreview canvas={c} maxW={60} maxH={55}/><span>{i+1}</span></button>)}</div>
    <button aria-label="Next slide" disabled={index>=p.canvases.length-1} onClick={()=>select(index+1)} style={{...arrow,opacity:index>=p.canvases.length-1?.3:1}}>›</button>
    <button aria-label="Add page" onClick={()=>dispatch({type:'add-canvas'})} style={arrow}>+</button>
  </nav>;
}


