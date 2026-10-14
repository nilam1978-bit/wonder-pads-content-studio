function FinalProjectWorkspace({isMobile}){
  const {state,dispatch}=useStore();const project=activeProject(state);
  const [step,setStep]=React.useState('design'),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  const [copyFallback,setCopyFallback]=React.useState(null),[copyNotice,setCopyNotice]=React.useState('');
  const fallbackRef=React.useRef(null);
  const copyForPosting=async(kind)=>{
    const words=kind==='caption'?postCaption:kind==='slides'?canvasSlideText(project.canvases):project.socialCopies?.[kind];
    const label=kind==='caption'?'Caption & hashtags':kind==='slides'?'All slide text':kind==='facebook-post'?'Facebook post':'TikTok hook & script';
    setCopyNotice('');setCopyFallback(null);
    if(!words?.trim()){setCopyNotice(kind==='caption'?'This design has no saved caption.':'There is no slide text to copy.');return;}
    let timer;
    try{
      await Promise.race([navigator.clipboard.writeText(words),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Clipboard unavailable')),2000);})]);
      setCopyNotice(`${label} copied.`);
    }catch{
      setCopyFallback({label,words});setCopyNotice('Your browser could not copy automatically. Select all below, then use Copy.');
    }finally{clearTimeout(timer);}
  };
  React.useEffect(()=>{dispatch({type:'set-tool',tool:null});},[project.id]);
  const index=Math.max(0,project.canvases.findIndex(c=>c.id===project.activeCanvasId));
  const canvas=project.canvases[index];
  const slideActions=<div aria-label="Slide actions" style={{display:'flex',gap:8,padding:'6px 12px',alignItems:'center',flexWrap:'wrap',background:'#fff'}}><span>Slide {index+1} / {project.canvases.length}</span><button onClick={()=>dispatch({type:'add-canvas'})}>+ Add slide</button><details style={{position:'relative'}}><summary style={{cursor:'pointer',padding:8}}>Slide actions</summary><div style={{position:'absolute',right:0,top:'100%',zIndex:100,background:'white',padding:12,boxShadow:'0 4px 20px #0003',minWidth:190,display:'grid',gap:8}}><button onClick={()=>dispatch({type:'duplicate-canvas',id:canvas.id})}>Duplicate slide</button><button disabled={index===0} onClick={()=>dispatch({type:'reorder-canvas',from:index,to:index-1})}>Move slide earlier</button><button disabled={index===project.canvases.length-1} onClick={()=>dispatch({type:'reorder-canvas',from:index,to:index+1})}>Move slide later</button><button disabled={project.canvases.length===1} onClick={()=>{if(confirm('Delete this slide? You can restore it with Undo.'))dispatch({type:'delete-canvas',id:canvas.id});}}>Delete slide</button>{project.canvases.length===1&&<small>Keep one slide, or delete the whole design in My Work.</small>}</div></details></div>;
  const contentEntry=(state.calendar||[]).find(e=>e.id===project.contentEntryId);
  const postCaption=contentEntry?[contentEntry.caption,contentEntry.hashtags].filter(Boolean).join('\n\n'):project.caption;
  const crowded=project.canvases.flatMap((c,i)=>c.elements.some(e=>e.type==='text'&&!e.hidden&&(e.y+textLayout(e).height>c.h||e.x+e.w>c.w||e.x<0||e.y<0||e.fontSize<24))?[i+1]:[]);
  const go=i=>dispatch({type:'set-active-canvas',id:project.canvases[Math.max(0,Math.min(project.canvases.length-1,i))].id});
  const touch=React.useRef(null);
  const download=async()=>{setBusy(true);setError('');try{await exportCanvases(project.canvases,'png',project.name.replace(/[^\w-]/g,'_'));}catch(e){setError(e.message||'Download failed');}finally{setBusy(false);}};
  const nav=<nav className="simple-nav final-progress" aria-label="Carousel workflow"><button onClick={()=>{dispatch({type:'close-project'});dispatch({type:'set-view',view:project.contentEntryId?'ready-content':'home'});}}>{project.contentEntryId?'← Content Library':'← Home'}</button><button aria-current={step==='design'} onClick={()=>setStep('design')}>Design</button><button aria-current={step==='preview'} onClick={()=>setStep('preview')}>Preview & Download</button></nav>;
  return <div className="simple-workspace"><SimpleStudioStyles/><style>{`.final-progress{justify-content:flex-start!important;padding:6px!important;gap:2px!important}.final-progress button{padding:10px 8px!important;font-size:13px!important}.final-review{display:flex;flex-direction:column;align-items:center;gap:16px}.final-review button{min-height:44px}.final-review .preview-buttons{display:flex;align-items:center;gap:20px}.final-review .preview-image{max-width:100%;overflow:hidden}`}</style>
    <style>{`.posting-tools{width:100%;max-width:680px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px}.posting-copy-buttons{display:flex;gap:10px;flex-wrap:wrap}.posting-copy-buttons button{flex:1 1 220px}.posting-tools textarea{display:block;width:100%;box-sizing:border-box;min-height:180px;font:16px/1.6 Montserrat,sans-serif}`}</style>
    {crowded.length>0&&<div role="status" style={{padding:'6px 12px',background:'#fff3d6',fontSize:12}}>Check slides {crowded.join(', ')}: some text is very small or extends outside the page. Resize it or use Fit text.</div>}
    {project.aiError&&<p role="alert" style={{margin:0,padding:'8px 12px',background:'#fff3d6',fontSize:13}}>{project.aiError}</p>}
    {step==='design'&&slideActions}
    {step==='design'?<div className="simple-design">{isMobile?<MobileEditor progressNav={nav}/>:<EditorScreen progressNav={nav}/>}</div>:<>{nav}<main className="simple-content"><div className="final-review">
      <h2 style={{margin:0}}>Preview your carousel</h2><p className="simple-muted" style={{margin:0}}>{canvas.w} × {canvas.h} · saved automatically in this browser</p>
      <div className="preview-image" onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current==null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)go(index+(dx<0?1:-1));touch.current=null;}}><MiniPreview canvas={canvas} maxW={Math.min(440,window.innerWidth-48)} maxH={Math.min(540,window.innerHeight*.56)}/></div>
      <div className="preview-buttons"><button aria-label="Previous preview slide" disabled={index===0} onClick={()=>go(index-1)}>←</button><span>Slide {index+1} of {project.canvases.length}</span><button aria-label="Next preview slide" disabled={index===project.canvases.length-1} onClick={()=>go(index+1)}>→</button></div>
      <button className="simple-action simple-secondary" onClick={()=>setStep('design')}>Edit this slide</button>
      <section className="posting-tools" aria-label="Download and copy for posting">
        <button className="simple-action" disabled={busy} onClick={download}>{busy?'Preparing images…':'Download carousel PNGs'}</button>
        <label>Caption &amp; hashtags<textarea aria-label="Caption and hashtags for manual copying" readOnly value={postCaption||''} placeholder="This design has no saved caption." onFocus={e=>e.target.select()}/></label>
        <button className="sc-link" onClick={()=>{const field=document.querySelector('[aria-label="Caption and hashtags for manual copying"]');field?.focus();field?.select();}}>Select caption text</button>
        <details><summary>View all slide text</summary><textarea aria-label="All slide text for manual copying" readOnly value={canvasSlideText(project.canvases)} onFocus={e=>e.target.select()}/></details>
        <div className="posting-copy-buttons"><button className="simple-action simple-secondary" disabled={!postCaption?.trim()} onClick={()=>copyForPosting('caption')}>Copy caption & hashtags</button><button className="simple-action simple-secondary" onClick={()=>copyForPosting('slides')}>Copy all slide text</button></div>
        {!postCaption?.trim()&&<p className="simple-muted">This design has no saved caption. You can copy its slide text instead.</p>}
        {copyNotice&&<p role="status" aria-live="polite" style={{margin:0}}>{copyNotice}</p>}
        {copyFallback&&<div><label>{copyFallback.label}<textarea ref={fallbackRef} aria-label={`${copyFallback.label} to copy`} readOnly value={copyFallback.words} onFocus={e=>e.target.select()} /></label><button onClick={()=>{fallbackRef.current?.focus();fallbackRef.current?.select();}}>Select all</button><button onClick={()=>{setCopyFallback(null);setCopyNotice('');}}>Close copy text</button></div>}
        {Object.entries(project.socialCopies||{}).map(([key,words])=><div key={key}><h3>{key==='facebook-post'?'Facebook post':'TikTok hook & script'}</h3><textarea aria-label={key==='facebook-post'?'Facebook post text':'TikTok script text'} value={words} onChange={e=>dispatch({type:'update-project',id:project.id,patch:{socialCopies:{...project.socialCopies,[key]:e.target.value}}})}/><button className="simple-action simple-secondary" onClick={()=>copyForPosting(key)}>Copy {key==='facebook-post'?'Facebook post':'TikTok script'}</button></div>)}
        <button className="sc-link" onClick={()=>exportProjectFile(project)}>Save editable backup</button><p className="simple-muted">Download the images, then select them in order when making your Instagram post. Other social versions are copyable text—not automatically published posts or videos.</p>{error&&<p role="alert">{error}</p>}
      </section>
    </div></main></>}
  </div>;
}
Object.assign(window,{FinalProjectWorkspace});
