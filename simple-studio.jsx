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

    .simple-shell{background:linear-gradient(180deg,#f1cfe9 0,#f8e4f2 280px,#fdf5fa 620px)}
    .simple-shell .simple-header{background:transparent;border:0;padding:18px 28px 4px}
    .brand-lockup{display:flex;align-items:center;gap:12px}.brand-lockup img{width:46px;height:46px;border-radius:12px;object-fit:cover;background:#fff;box-shadow:0 2px 8px rgba(150,60,120,.18)}
    .brand-lockup strong{display:block;font:22px/1 'DM Serif Display',serif}.brand-lockup small{display:block;letter-spacing:.16em;font-size:10px;text-transform:uppercase;color:#826d7e;margin-top:5px}
    .simple-shell .simple-nav{background:transparent;border:0;padding:12px 28px 0;gap:8px}
    .simple-shell .simple-nav button{background:rgba(255,255,255,.72);border:1px solid #ecd3e6;border-radius:999px;padding:10px 20px;font-weight:600;font-size:14px;color:#65505f}
    .simple-shell .simple-nav button[aria-current=true]{background:#2a1f2a;border-color:#2a1f2a;color:#fff}
    .studio-home-actions{display:grid;gap:12px;max-width:420px;margin:24px auto}
    .studio-home-actions button,.studio-brand-kit{min-height:44px}
    .studio-brand-kit{flex-shrink:0;padding-inline:12px;white-space:nowrap}
    .studio-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin:6px 0 24px}
    .studio-eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#826d7e}
    .studio-hero h1{font:44px/1.05 'DM Serif Display',serif;margin:8px 0 6px;color:#2a1f2a}.studio-hero p{margin:0;color:#6d5868;font-size:15px;max-width:520px;line-height:1.5}
    .hero-count{text-align:right;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#826d7e;white-space:nowrap}.hero-count b{display:block;font:36px/1 'DM Serif Display',serif;color:#2a1f2a;letter-spacing:0}
    .studio-banner{position:relative;overflow:hidden;display:block;width:100%;border:0;text-align:left;border-radius:22px;padding:30px;color:#fff;background:linear-gradient(100deg,#2a1f2a 15%,#7d2960 62%,#c260a8)}
    .studio-banner small{font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:.75}.studio-banner h2{font:34px/1.1 'DM Serif Display',serif;margin:8px 0}.studio-banner p{max-width:430px;margin:0;opacity:.92;font-size:14px;line-height:1.55}
    .studio-banner .go{display:inline-block;margin-top:16px;background:#fff;color:#2a1f2a;border-radius:999px;padding:10px 18px;font-weight:600;font-size:14px}
    .studio-banner.studio-create-card{background:#fffafb;color:#2a1f2a;border:1px solid #ecd3e6;padding:24px}.studio-create-card h2{font-size:28px}.studio-banner.studio-create-card .go{background:#893773;color:#fff}
    .studio-banner .deco{position:absolute;right:28px;top:-14px;display:flex;gap:10px;pointer-events:none}.studio-banner .deco i{display:block;width:86px;height:150px;border-radius:12px;background:rgba(241,207,234,.32);transform:rotate(9deg)}.studio-banner .deco i:nth-child(2){margin-top:26px;background:rgba(241,207,234,.22)}.studio-banner .deco i:nth-child(3){margin-top:4px;background:rgba(241,207,234,.4);transform:rotate(14deg)}
    .studio-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:16px 0}
    .feature{display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid #ecd3e6;border-radius:20px;padding:20px;text-align:left;color:inherit;box-shadow:0 6px 18px rgba(150,60,120,.07)}
    .feature:hover{border-color:#c260a8}.feature .ico{flex:0 0 44px;height:44px;border-radius:12px;background:#f7e1f0;display:grid;place-items:center;color:#893773}
    .feature small{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#826d7e}.feature h3{font:22px/1.15 'DM Serif Display',serif;margin:4px 0 6px}.feature p{margin:0;font-size:14px;color:#6d5868;line-height:1.5}.feature .open{display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:#893773}
    .studio-strip{display:flex;justify-content:space-between;align-items:center;width:100%;background:rgba(255,255,255,.7);border:1px solid #ecd3e6;border-radius:14px;padding:12px 18px;color:#65505f;font-size:14px;text-align:left}
    body.wpr-typing [aria-label="Slide actions"]{display:none!important}
    .studio-back{display:block;background:transparent;border:0;padding:0 0 8px;color:#893773;font:600 13px inherit;font-family:inherit;cursor:pointer}
    .studio-h2{font:26px 'DM Serif Display',serif;margin:30px 0 4px;color:#2a1f2a}
    .tile-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:22px;margin:18px 0 32px}
    .tile{position:relative;text-align:left;background:transparent;border:0;padding:0;color:inherit;min-width:0}
    .tile .frame{aspect-ratio:4/5;background:#fff;border-radius:16px;box-shadow:0 8px 22px rgba(150,60,120,.14);display:grid;place-items:center;overflow:hidden;border:2px solid transparent}
    .tile .frame img{width:100%;height:100%;object-fit:contain}.tile:hover .frame{border-color:#c260a8}.tile[aria-current=true] .frame{border-color:#7d2960;box-shadow:0 0 0 3px rgba(125,41,96,.2)}
    .tile h3{font:17px/1.2 'DM Serif Display',serif;margin:10px 2px 2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.tile small{display:block;margin:0 2px;font-size:12px;color:#826d7e}
    .tile .chip{position:absolute;left:8px;top:8px;background:rgba(255,255,255,.92);color:#893773;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px}
    .tile-wrap{position:relative}.tile-menu-btn{position:absolute;top:8px;right:8px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.94);border:0;font-size:18px;line-height:1;color:#2a1f2a;box-shadow:0 2px 8px rgba(0,0,0,.14)}
    .tile-menu{position:absolute;top:48px;right:8px;z-index:20;background:#fff;border:1px solid #ecd3e6;border-radius:14px;box-shadow:0 12px 30px rgba(80,30,70,.22);min-width:190px;padding:6px;display:grid}
    .tile-menu button{text-align:left;background:transparent;border:0;padding:11px 12px;border-radius:10px;font:inherit;font-size:14px;color:#2a1f2a}.tile-menu button:hover{background:#f7e1f0}.tile-menu .danger{color:#a02e63}
    .sc-shell{background:linear-gradient(180deg,#f1cfe9 0,#f8e4f2 240px,#fdf5fa 560px)!important}.sc-shell .sc-header{background:transparent!important;border-bottom:0!important}
    @media(max-width:640px){.simple-shell .simple-header{padding:14px 16px 2px}.simple-shell .simple-nav{padding:10px 16px 0}.simple-shell .simple-nav button{padding:9px 16px}.studio-hero h1{font-size:34px}.studio-banner{padding:22px}.studio-banner .deco{opacity:.5;right:6px}.tile-grid{grid-template-columns:repeat(2,1fr);gap:16px}}
  `}</style>;
}


function ProjectMenu({p,dispatch,onReuse}) {
  const [on,setOn]=React.useState(false);
  React.useEffect(()=>{if(!on)return;const close=()=>setOn(false);const t=setTimeout(()=>document.addEventListener('click',close),0);return()=>{clearTimeout(t);document.removeEventListener('click',close);};},[on]);
  return <>
    <button className="tile-menu-btn" aria-label={`Actions for ${p.name}`} aria-expanded={on} onClick={e=>{e.stopPropagation();setOn(v=>!v);}}>⋯</button>
    {on&&<div className="tile-menu" role="menu">
      <button role="menuitem" onClick={()=>{const name=prompt('Rename design',p.name);if(name?.trim())dispatch({type:'rename-project',id:p.id,name:name.trim()});}}>Rename</button>
      <button role="menuitem" onClick={()=>dispatch({type:'update-project',id:p.id,patch:{finished:!p.finished,finishedAt:p.finished?null:now()}})}>{p.finished?'Move back to in progress':'Mark as finished'}</button>
      {onReuse && <button role="menuitem" onClick={onReuse}>Reuse words</button>}
      <button role="menuitem" onClick={()=>dispatch({type:'duplicate-project',id:p.id})}>Duplicate design</button>
      <button role="menuitem" className="danger" onClick={()=>{if(confirm(`Delete design “${p.name}”? This removes its saved slides from this browser. Download an editable backup first if needed.`))dispatch({type:'delete-project',id:p.id});}}>Delete design</button>
    </div>}
  </>;
}

function SimpleStudioHome() {
  const {state,dispatch}=useStore();
  const [section,setSection]=React.useState(()=>{
    const saved=sessionStorage.getItem('wpr-simple-section');
    return saved === 'create' ? 'templates' : ['home','templates','work','brand'].includes(saved) ? saved : 'home';
  });
  const [workTab,setWorkTab]=React.useState(() => sessionStorage.getItem('wpr-simple-work-tab') || 'designs');
  const [workFilter,setWorkFilter]=React.useState('all');
  const [query,setQuery]=React.useState('');
  const go=view=>dispatch({type:'set-view',view});
  const textDraft = readStudioWordsDraft().input?.trim();
  const startWriting = (input, key) => {
    if (input !== undefined) sessionStorage.setItem('wpr-reused-words', JSON.stringify({ input, key }));
    go('carousel');
  };
  const open=id=>dispatch({type:'open-project',id});
  const projects=[...state.projects].sort((a,b)=>b.updatedAt-a.updatedAt);
  const inProgress=projects.filter(p=>!p.finished),finishedList=projects.filter(p=>p.finished);
  const shownProjects=projects.filter(p=>(workFilter==='all'||(workFilter==='finished'?p.finished:!p.finished))&&p.name.toLowerCase().includes(query.toLowerCase()));
  // A draft is only "unfinished" while it has slides and has not yet been saved as a design.
  const hasUnsavedDraft=(state.carousel.slides?.length>0)&&!state.projects.some(p=>p.id===state.carousel.simpleProjectId);
  React.useEffect(()=>sessionStorage.setItem('wpr-simple-section',section),[section]);
  React.useEffect(()=>sessionStorage.setItem('wpr-simple-work-tab',workTab),[workTab]);
  const projectCard=p=><div className="tile-wrap" key={p.id}>
    <button className="tile" onClick={()=>open(p.id)}>
      <div className="frame">{p.thumbnail?<img src={p.thumbnail} alt=""/>:<MiniPreview canvas={p.canvases[0]} maxW={190} maxH={238}/>}</div>
      <h3>{p.name}</h3><small>{p.canvases.length===1?'Single post':`${p.canvases.length} slides`} · {timeAgo(p.updatedAt)}</small>
    </button>
    <span className="chip" style={{position:'absolute',left:8,top:8,background:'rgba(255,255,255,.92)',color:'#893773',borderRadius:999,fontSize:10,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',padding:'4px 9px'}}>{p.finished?'Finished':'In progress'}</span>
    <ProjectMenu p={p} dispatch={dispatch} onReuse={p.sourceText?.trim() ? () => startWriting(p.sourceDraft ?? p.sourceText, p.id) : undefined}/>
  </div>;
  const applyTemplate=t=>{
    const p=t.canvases?{id:uid(),name:t.name,createdAt:now(),updatedAt:now(),canvases:JSON.parse(JSON.stringify(t.canvases)).map(c=>({...c,id:uid(),elements:c.elements.map(e=>({...e,id:uid()}))}))}:newProject(t.name,t.preset,t.els.map(e=>({type:e.type,patch:e.patch})));
    if(!t.canvases){
      p.canvases[0].bg={type:'color',value:t.bg};
      if(t.brandLayout){p.canvases[0].elements=starterBackgroundElements(t,p.canvases[0],state.brand);p.canvases[0].slideKind=t.slideKind;}
    }
    p.activeCanvasId=p.canvases[0].id;dispatch({type:'create-project',project:p});
  };
  return <div className="simple-shell"><SimpleStudioStyles/>
    <header className="simple-header">
      <button className="brand-lockup" aria-label="Studio home" onClick={() => setSection('home')} style={{background:'transparent',padding:0,textAlign:'left',color:'inherit'}}>
        <img src={state.brand?.logo || 'assets/wpr-logo.png'} alt="" />
        <div><strong>Wonder Pads</strong><small>Content Studio</small></div>
      </button>
      <button className="simple-action simple-secondary studio-brand-kit" aria-current={section === 'brand'}
        onClick={() => setSection('brand')}>Brand Kit</button>
    </header>
    <main className="simple-content"><div className="simple-inner">
      {section === 'home' && <div className="studio-home-actions">
        <button className="simple-action" onClick={() => setSection('templates')}>Start with a template</button>
        <button className="studio-back" onClick={() => startWriting()}>Enter my words</button>
        <button className="simple-action simple-secondary" onClick={() => { setWorkTab('designs'); setSection('work'); }}>My Work</button>
        {textDraft && <button className="studio-back" onClick={() => startWriting()}>Resume text draft</button>}
        {hasUnsavedDraft && <button className="studio-back" onClick={() => openCarouselDraft(state, dispatch)}>Resume unfinished carousel</button>}
      </div>}
      {section === 'templates' && <>
        <button className="studio-back" onClick={() => setSection('home')}>‹ Studio home</button>
        <h1 className="simple-title">Choose a template</h1>
        <div className="tile-grid">
          {[...state.templates, ...STARTER_TEMPLATES].map(t => {
            const preview = t.canvases?.[0] || {
              ...defaultCanvas(t.name, t.preset),
              bg: { type: 'color', value: t.bg },
              elements: t.els.map(e => newElement(e.type, e.patch)),
            };
            return <button key={t.id || t.name} className="tile" onClick={() => applyTemplate(t)}>
              <div className="frame"><MiniPreview canvas={preview} maxW={190} maxH={238} /></div>
              <h3>{t.name}</h3>
            </button>;
          })}
        </div>
      </>}
      {section==='work'&&<><div className="studio-hero"><div><button className="studio-back" onClick={()=>setSection('home')}>‹ Studio home</button><span className="studio-eyebrow">My work</span><h1>Everything you've made.</h1><p>Tap a design to open it. Use the ⋯ on a design to rename, finish, copy or delete.</p></div><div className="hero-count"><b>{projects.length}</b>Designs</div></div><nav className="simple-nav" aria-label="My Work sections" style={{padding:'0 0 12px'}}>{[['designs','Drafts & designs'],['writing','Saved writing'],['ready','Ready content']].map(([id,label])=><button key={id} aria-current={workTab===id} onClick={()=>setWorkTab(id)}>{label}</button>)}</nav>
        {workTab==='designs'&&<>{textDraft && <button className="simple-action simple-secondary" onClick={() => startWriting()}>Resume text draft</button>}
        {hasUnsavedDraft && <button className="simple-action simple-secondary" onClick={() => openCarouselDraft(state, dispatch)}>Resume unfinished carousel</button>}<p className="simple-muted">{finishedList.length} finished · {inProgress.length} in progress. A design counts as finished once you download it. You can change that on any card.</p><nav className="simple-nav" aria-label="Filter designs" style={{padding:'0 0 12px'}}>{[['all','All'],['progress','In progress'],['finished','Finished']].map(([id,label])=><button key={id} aria-current={workFilter===id} onClick={()=>setWorkFilter(id)}>{label}</button>)}</nav><label className="simple-muted">Find a design <input aria-label="Find a design" value={query} onChange={e=>setQuery(e.target.value)} style={{padding:12,margin:12,borderRadius:10,border:'1px solid #dfcbd9'}}/></label><div className="tile-grid">{shownProjects.map(projectCard)}</div>{!shownProjects.length&&<p>{projects.length?'Nothing matches here. Try another filter.':'No designs yet. Start from Home.'}</p>}<BackupRestoreCard/></>}
        {workTab==='writing'&&<><p className="simple-muted">Text you have reused or written for launches, saved so you can find it again and send it to a carousel.</p><div className="simple-grid"><button className="simple-card" onClick={()=>go('history')}><h3>Open saved writing</h3><p>Reused text, saved launches and your library.</p><span>Open →</span></button>
          <button className="simple-card" onClick={() => go('repurpose')}><h3>Reuse my words</h3><p>Adapt your writing for another platform.</p></button>
        </div></>}
        {workTab === 'ready' && <button className="simple-card" onClick={() => go('ready-content')}>
          <h3>Browse Ready content</h3><p>Open your ready-made posts and create editable slides.</p>
        </button>}
      </>}
      {section==='brand'&&<><div className="studio-hero"><div><button className="studio-back" onClick={()=>setSection('home')}>‹ Studio home</button><span className="studio-eyebrow">My brand</span><h1>Your look, set once.</h1><p>Your logo, colours and handles are reused on every design.</p></div></div><BrandKitSection/></>}
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


