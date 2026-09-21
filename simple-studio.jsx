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
  const [section,setSection]=React.useState(()=>sessionStorage.getItem('wpr-simple-section')||'home');
  const [workTab,setWorkTab]=React.useState('designs');
  const [query,setQuery]=React.useState('');
  const go=view=>dispatch({type:'set-view',view});
  const open=id=>dispatch({type:'open-project',id});
  const projects=[...state.projects].sort((a,b)=>b.updatedAt-a.updatedAt);
  const makePost=()=>setSection('post');
  React.useEffect(()=>sessionStorage.setItem('wpr-simple-section',section),[section]);
  const projectCard=p=><button className="simple-card" key={p.id} onClick={()=>open(p.id)}>
    {p.thumbnail?<img src={p.thumbnail} alt=""/>:<MiniPreview canvas={p.canvases[0]} maxW={210} maxH={135}/>}
    <h3>{p.name}</h3><p>{p.canvases.length===1?'Single post':`${p.canvases.length} slides`} · {timeAgo(p.updatedAt)}</p><span>Continue editing →</span>
  </button>;
  const applyTemplate=t=>{
    const p=t.canvases?{id:uid(),name:t.name,createdAt:now(),updatedAt:now(),canvases:JSON.parse(JSON.stringify(t.canvases)).map(c=>({...c,id:uid(),elements:c.elements.map(e=>({...e,id:uid()}))}))}:newProject(t.name,t.preset,t.els.map(e=>({type:e.type,patch:e.patch})));
    if(!t.canvases)p.canvases[0].bg={type:'color',value:t.bg};
    p.activeCanvasId=p.canvases[0].id;dispatch({type:'create-project',project:p});
  };
  return <div className="simple-shell"><SimpleStudioStyles/>
    <header className="simple-header"><div><strong>Wonder Pads Content Studio</strong><small>A little space for your handmade business</small></div><span className="simple-muted">Preview</span></header>
    <nav className="simple-nav" aria-label="Main navigation">
      {[['home','Home'],['create','Create'],['work','My Work'],['calendar','Calendar'],['brand','My Brand']].map(([id,label])=><button key={id} aria-current={section===id} onClick={()=>id==='calendar'?go('calendar'):setSection(id)}>{label}</button>)}
    </nav>
    <main className="simple-content"><div className="simple-inner">
      {section==='home'&&<><h1 className="simple-title">Pick up where you left off</h1><p className="simple-muted">Your words and designs, ready when you are.</p>
        {projects.length?<div className="simple-grid">{projects.slice(0,3).map(projectCard)}</div>:<div className="simple-card"><h3>Your next post starts here</h3><p>Make something small today. You can always come back to it.</p></div>}
      </>}
      {(section==='home'||section==='create')&&<><h2 className="simple-title">What would you like to make?</h2><div className="simple-grid">
        <button className="simple-card" onClick={makePost}><span>01 · A single image</span><h3>Make a post</h3><p>A product photo, care tip, quote or shop update. Start blank or use a template.</p><span>Choose your starting point →</span></button>
        <button className="simple-card" onClick={()=>setSection('carousel')}><span>02 · A story in slides</span><h3>Make a carousel</h3><p>Paste your words, organise your slides, then finish the design. No AI needed to split text.</p><span>Prepare your slides →</span></button>
        <button className="simple-card" onClick={()=>setSection('write')}><span>03 · A little writing help</span><h3>Help me write</h3><p>Turn an idea or customer question into captions, scripts or slide text.</p><span>Choose what to write →</span></button>
      </div></>}
      {section==='carousel'&&<><h1 className="simple-title">Your carousel</h1><div className="simple-grid">
        <button className="simple-card" onClick={()=>{dispatch({type:'reset-carousel'});go('carousel');}}><h3>Start a new carousel</h3><p>Start a fresh slide draft. Saved designs stay in My Work.</p></button>
        <button className="simple-card" onClick={()=>state.projects.some(p=>p.id===state.carousel.simpleProjectId)?open(state.carousel.simpleProjectId):go('carousel')}><h3>Continue your last carousel</h3><p>Return to your saved design or unfinished slide draft.</p></button>
      </div></>}
      {section==='write'&&<><h1 className="simple-title">What are you sharing?</h1><p className="simple-muted">Start with the message. You can design it afterwards.</p><div className="simple-grid">
        <button className="simple-card" onClick={()=>go('repurpose')}><h3>An idea, story or helpful tip</h3><p>Write captions or turn existing words into several formats.</p></button>
        <button className="simple-card" onClick={()=>go('launch')}><h3>A product launch</h3><p>Create a set of announcements for a product or restock.</p></button>
      </div></>}
      {section==='post'&&<><h1 className="simple-title">Make a post</h1><p className="simple-muted">Choose a size to start blank, or pick a ready-made layout below.</p><div className="simple-grid">{SIZE_PRESETS.slice(0,3).map(p=><button className="simple-card" key={p.id} onClick={()=>dispatch({type:'create-project',name:'My new post',preset:p})}><h3>{p.name}</h3><p>{p.w} × {p.h}</p></button>)}</div><h2>Start with a template</h2><div className="simple-grid">{STARTER_TEMPLATES.map(t=><button className="simple-card" key={t.name} onClick={()=>applyTemplate(t)}><h3>{t.name}</h3><p>Make it your own →</p></button>)}</div></>}
      {section==='work'&&<><h1 className="simple-title">My Work</h1><div className="simple-nav">{['designs','writing','templates'].map(t=><button key={t} aria-current={workTab===t} onClick={()=>setWorkTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
        {workTab==='designs'&&<><label className="simple-muted">Find a design <input aria-label="Find a design" value={query} onChange={e=>setQuery(e.target.value)} style={{padding:12,margin:12,borderRadius:10,border:'1px solid #dfcbd9'}}/></label><div className="simple-grid">{projects.filter(p=>p.name.toLowerCase().includes(query.toLowerCase())).map(projectCard)}</div>{!projects.length&&<p>No designs yet. Choose Create to start.</p>}<BackupRestoreCard/></>}
        {workTab==='writing'&&<div className="simple-card"><h3>Your saved writing</h3><p>{state.savedRepurpose.length+state.savedLaunches.length} saved writing sessions</p><button className="simple-action" onClick={()=>go('history')}>Open saved writing</button></div>}
        {workTab==='templates'&&<div className="simple-grid">{[...state.templates,...STARTER_TEMPLATES].map((t,i)=><button className="simple-card" key={t.id||i} onClick={()=>applyTemplate(t)}><h3>{t.name}</h3><p>Use as a starting point →</p></button>)}</div>}
      </>}
      {section==='brand'&&<><h1 className="simple-title">My Brand</h1><p className="simple-muted">Set this up once, then reuse it as you create.</p><BrandKitSection/></>}
      <p className="simple-muted">Preview work saves separately in this browser. Your existing studio is untouched.</p>
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
    <div style={{display:'flex',overflowX:'auto',gap:8,flex:1,minWidth:0}}>{p.canvases.map((c,i)=><button key={c.id} aria-label={`Slide ${i+1}`} aria-current={i===index} onClick={()=>select(i)} style={{flexShrink:0,width:74,padding:5,border:i===index?'2px solid #b65c9f':'2px solid transparent',borderRadius:9,background:'white'}}><MiniPreview canvas={c} maxW={60} maxH={55}/><span>{i+1}</span></button>)}</div>
    <button aria-label="Next slide" disabled={index>=p.canvases.length-1} onClick={()=>select(index+1)} style={{...arrow,opacity:index>=p.canvases.length-1?.3:1}}>›</button>
    <button aria-label="Add page" onClick={()=>dispatch({type:'add-canvas'})} style={arrow}>+</button>
  </nav>;
}

function SimpleProjectWorkspace({isMobile}) {
  const {state,dispatch}=useStore();
  React.useEffect(()=>{dispatch({type:'set-tool',tool:null});},[]);
  const project=activeProject(state);
  const isCarousel=state.carousel.simpleProjectId===project.id;
  React.useEffect(()=>{
    const canvases=project.canvases.map(c=>({...c,elements:c.elements.map(el=>{
      const isBrandLogo=el.type==='image'&&(el.__role==='logo'||el.role==='logo'||(state.brand.logo&&el.src===state.brand.logo));
      return isBrandLogo&&el.radius!==9999?{...el,radius:9999,fromBrand:true,role:'logo'}:el;
    })}));
    const changed=canvases.some((c,i)=>c.elements.some((el,j)=>el!==project.canvases[i].elements[j]));
    if(changed) dispatch({type:'update-project',id:project.id,patch:{canvases}});
  },[project.id]);
  const [step,setStep]=React.useState('design');
  const [busy,setBusy]=React.useState(false);
  const [error,setError]=React.useState('');
  const exit=()=>{dispatch({type:'close-project'});dispatch({type:'set-view',view:'home'});};
  const changeWords=(canvasId,id,text)=>dispatch({type:'update-project',id:project.id,patch:{canvases:project.canvases.map(c=>c.id===canvasId?{...c,elements:c.elements.map(e=>e.id===id?{...e,text}:e)}:c)}});
  const addText=canvasId=>dispatch({type:'update-project',id:project.id,patch:{canvases:project.canvases.map(c=>c.id===canvasId?{...c,elements:[...c.elements,newElement('text',{text:'Your words here',w:Math.round(c.w*.8),x:Math.round(c.w*.1),fontSize:48,align:'left'})]}:c)}});
  const download=async format=>{setBusy(true);setError('');try{await exportCanvases(project.canvases,format,project.name.replace(/[^\w-]/g,'_'));}catch(e){setError(e.message);}finally{setBusy(false);}};
  const selectStep=(id)=>{if(id==='words'&&isCarousel){dispatch({type:'close-project'});dispatch({type:'set-view',view:'carousel'});}else setStep(id);};
  const progress=<nav className="simple-nav simple-progress" aria-label="Project steps"><span style={{padding:'12px 10px',fontSize:12,color:'#806b7a',whiteSpace:'nowrap'}}>Workspace · {isCarousel?'Carousel':'Design'}</span><button onClick={exit}>← Home</button>{[['words','1 · Words'],['design','2 · Design'],['download','3 · Preview & Download']].map(([id,label])=><button key={id} aria-current={step===id} onClick={()=>selectStep(id)}>{label}</button>)}</nav>;
  return <div className="simple-workspace"><SimpleStudioStyles/>
    {step==='design'?<div className="simple-design">{isMobile?<MobileEditor progressNav={progress}/>:<EditorScreen progressNav={progress}/>}</div>:<>{progress}<main className="simple-content"><div className="simple-inner">
      <h1 className="simple-title">{step==='words'?'Your words':'Preview & download'}</h1>
      <p className="simple-muted">{step==='words'?'These are the words in this design. Changes stay in the same project and keep your layouts.':'Download your finished design, then post it wherever you share with your customers.'}</p>
      {step==='words'?<><div className="simple-card"><label>Project name</label><input value={project.name} onChange={e=>dispatch({type:'rename-project',id:project.id,name:e.target.value})}/></div>{project.canvases.map((c,i)=><section className="simple-card" key={c.id} style={{marginTop:16}}><h3>{project.canvases.length>1?`Slide ${i+1}`:'Your post'}</h3>{c.elements.filter(e=>e.type==='text').map((e,j)=><div key={e.id}><label htmlFor={'words-'+e.id}>Text {j+1}{e.locked?' (locked in design)':''}</label><textarea id={'words-'+e.id} disabled={e.locked} value={e.text||''} onChange={event=>changeWords(c.id,e.id,event.target.value)}/></div>)}<button className="simple-action simple-secondary" style={{marginTop:12}} onClick={()=>addText(c.id)}>Add text</button></section>)}</>:<><h2>Instagram preview</h2><div className="simple-grid">{project.canvases.map((c,i)=><div className="simple-card" key={c.id}><MiniPreview canvas={c} maxW={220} maxH={260}/><p>Slide {i+1} of {project.canvases.length}</p></div>)}</div><div className="simple-grid">{[['png','Images for posting','Download your pages as PNG images.'],['pdf','PDF document','Keep or share all pages in one document.']].map(([format,title,desc])=><button disabled={busy} className="simple-card" key={format} onClick={()=>download(format)}><h3>{title}</h3><p>{desc}</p><span>{busy?'Preparing…':'Download →'}</span></button>)}<button className="simple-card" onClick={()=>exportProjectFile(project)}><h3>Editable backup</h3><p>Keep a copy you can import and edit later.</p></button></div>{error&&<p role="alert">{error}</p>}<p className="simple-muted">Saved in this browser. Downloads and backups let you take your work elsewhere.</p></>}
    </div></main></>}
    {step==='words'&&<div className="simple-step-end"><button className="simple-action" onClick={()=>setStep('design')}>Continue to design →</button></div>}
  </div>;
}
