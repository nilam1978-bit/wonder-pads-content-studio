function ResizeCopyDialog({ project, onClose, onCreate }) {
  const dialog = React.useRef(null);
  const [presetId, setPresetId] = React.useState('ig-story');
  const [index, setIndex] = React.useState(Math.max(0, project.canvases.findIndex(c => c.id === project.activeCanvasId)));
  const preset = SIZE_PRESETS.find(size => size.id === presetId);
  const resized = React.useMemo(() => project.canvases.map(canvas => resizeSlideToFit(canvas, preset)), [project.canvases, preset]);
  const sameSize = project.canvases.every(canvas => canvas.w === preset.w && canvas.h === preset.h);
  const preview = resized[index];
  const textOverflow = preview.elements.some(el => el.type === 'text' && !el.hidden &&
    (el.x < 0 || el.y < 0 || el.x + el.w > preview.w || el.y + textLayout(el).height > preview.h));
  React.useEffect(() => { dialog.current.showModal(); }, []);

  function createCopy() {
    const canvases = structuredClone(resized).map(canvas => ({
      ...canvas, id: uid(), elements: canvas.elements.map(el => ({ ...el, id: uid() })),
    }));
    const timestamp = now();
    onCreate({
      ...project, id: uid(), name: project.name + ' — ' + preset.name,
      createdAt: timestamp, updatedAt: timestamp, thumbnail: null,
      finished: false, finishedAt: null, contentEntryId: null,
      canvases, activeCanvasId: canvases[index].id,
    });
  }

  return <dialog ref={dialog} className="studio-resize-dialog" aria-labelledby="studio-resize-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id="studio-resize-title">Resize as a copy</h2>
    <label>New size<select aria-label="New size" value={presetId} onChange={event => setPresetId(event.target.value)}>
      {SIZE_PRESETS.map(size => <option key={size.id} value={size.id}>{size.name} · {size.w} × {size.h}</option>)}
    </select></label>
    <p>Fits every slide proportionally and centres the layout on the new page.</p>
    <div className="studio-resize-preview">
      <MiniPreview canvas={preview} maxW={Math.min(350, window.innerWidth - 72)} maxH={Math.min(400, Math.round(window.innerHeight * .43))} />
    </div>
    {resized.length > 1 && <div className="studio-resize-actions">
      <button className="btn btn-tonal" aria-label="Previous resized slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>‹</button>
      <span>Slide {index + 1} of {resized.length}</span>
      <button className="btn btn-tonal" aria-label="Next resized slide" disabled={index === resized.length - 1} onClick={() => setIndex(index + 1)}>›</button>
    </div>}
    {textOverflow && <p role="status">Some text extends beyond this slide. Check the layout before posting.</p>}
    {sameSize && <p>This design already uses that size.</p>}
    <div className="studio-resize-actions">
      <button className="simple-action simple-secondary" onClick={onClose}>Cancel</button>
      <button className="simple-action" onClick={createCopy} disabled={sameSize}>Create resized copy</button>
    </div>
  </dialog>;
}

function FinalProjectWorkspace({isMobile}){
  const {state,dispatch,retrySave}=useStore();const project=activeProject(state);
  const [step,setStep]=React.useState('design'),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  const [copyFallback,setCopyFallback]=React.useState(null),[copyNotice,setCopyNotice]=React.useState('');
  const fallbackRef=React.useRef(null);
  const sourceDraft=project.sourceDraft??project.sourceText??'';
  const updateSourceDraft=sourceDraft=>dispatch({type:'update-project',id:project.id,patch:{sourceDraft}});
  const [sourceNotice,setSourceNotice]=React.useState('');
  const [resizeOpen,setResizeOpen]=React.useState(false);
  const openResize=()=>setResizeOpen(true);
  React.useEffect(()=>{setSourceNotice('');},[project.id]);
  const regenerateSource=async()=>{
    setBusy(true);setSourceNotice('');
    try{
      await loadCarouselFonts(); await Promise.all([document.fonts.load('600 76px "Cormorant Garamond"'),document.fonts.load('italic 600 76px "Cormorant Garamond"'),document.fonts.load('400 46px "Montserrat"')]);
      const canvases=createSimpleCanvases(sourceDraft,project.carouselSettings,state.brand);
      const copy={...project,id:uid(),name:project.name+' — revised',createdAt:now(),updatedAt:now(),sourceText:sourceDraft,generatedSourceText:sourceDraft,sourceDraft,canvases,activeCanvasId:canvases[0].id,thumbnail:null,finished:false,finishedAt:null,contentEntryId:null,aiError:''};
      dispatch({type:'create-project',project:copy});setStep('design');
    }catch(e){setSourceNotice(e.message||'Could not regenerate. Your current design is unchanged.');}finally{setBusy(false);}
  };
  const [dismissedCheck,setDismissedCheck]=React.useState('');
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
  const slideActions=<div aria-label="Slide actions" style={{display:'flex',gap:8,padding:isMobile?'0 12px':'6px 12px',alignItems:'center',flexWrap:'wrap',background:'#fff',fontSize:isMobile?13:undefined}}><span>Slide {index+1} / {project.canvases.length}</span><button onClick={()=>dispatch({type:'add-canvas'})}>+ Add slide</button><details style={{position:'relative'}}><summary style={{cursor:'pointer',padding:isMobile?'6px 8px':8}}>Slide actions</summary><div style={{position:'absolute',right:0,top:'100%',zIndex:100,background:'white',padding:12,boxShadow:'0 4px 20px #0003',minWidth:190,display:'grid',gap:8}}><button onClick={()=>dispatch({type:'duplicate-canvas',id:canvas.id})}>Duplicate slide</button><button disabled={index===0} onClick={()=>dispatch({type:'reorder-canvas',from:index,to:index-1})}>Move slide earlier</button><button disabled={index===project.canvases.length-1} onClick={()=>dispatch({type:'reorder-canvas',from:index,to:index+1})}>Move slide later</button><button disabled={project.canvases.length===1} onClick={()=>{if(confirm('Delete this slide? You can restore it with Undo.'))dispatch({type:'delete-canvas',id:canvas.id});}}>Delete slide</button>{project.canvases.length===1&&<small>Keep one slide, or delete the whole design in My Work.</small>}</div></details></div>;
  const contentEntry=(state.calendar||[]).find(e=>e.id===project.contentEntryId);
  const postCaption=contentEntry?[contentEntry.caption,contentEntry.hashtags].filter(Boolean).join('\n\n'):project.caption;
  const crowded=project.canvases.flatMap((c,i)=>c.elements.some(e=>e.type==='text'&&!e.hidden&&(e.y+textLayout(e).height>c.h||e.x+e.w>c.w||e.x<0||e.y<0||e.fontSize<24))?[i+1]:[]);
  const go=i=>dispatch({type:'set-active-canvas',id:project.canvases[Math.max(0,Math.min(project.canvases.length-1,i))].id});
  const touch=React.useRef(null);
  const download=async()=>{setBusy(true);setError('');try{await exportCanvases(project.canvases,'png',project.name.replace(/[^\w-]/g,'_'));if(!project.finished)dispatch({type:'update-project',id:project.id,patch:{finished:true,finishedAt:now()}});}catch(e){setError(e.message||'Download failed');}finally{setBusy(false);}};
  const nav=<nav className="simple-nav final-progress" aria-label="Carousel workflow"><button onClick={()=>{dispatch({type:'close-project'});dispatch({type:'set-view',view:project.contentEntryId?'ready-content':'home'});}}>{project.contentEntryId?'← Content Library':'← Home'}</button><button aria-current={step==='design'} onClick={()=>setStep('design')}>Design</button><button aria-current={step==='source'} onClick={()=>setStep('source')}>Source text</button><button aria-current={step==='preview'} onClick={()=>setStep('preview')}>Preview & Download</button></nav>;
  return <div className="simple-workspace"><SimpleStudioStyles/><style>{`.final-progress{justify-content:flex-start!important;padding:6px!important;gap:2px!important}.final-progress button{padding:10px 8px!important;font-size:13px!important}.final-review{display:flex;flex-direction:column;align-items:center;gap:16px}.final-review button{min-height:44px}.final-review .preview-buttons{display:flex;align-items:center;gap:20px}.final-review .preview-image{max-width:100%;overflow:hidden}`}</style>
    {resizeOpen && <ResizeCopyDialog project={project} onClose={()=>setResizeOpen(false)} onCreate={copy=>{
      dispatch({type:'create-project',project:copy});
      setResizeOpen(false);
      setStep('design');
    }}/>}
    <style>{`.posting-tools{width:100%;max-width:680px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px}.posting-copy-buttons{display:flex;gap:10px;flex-wrap:wrap}.posting-copy-buttons button{flex:1 1 220px}.posting-tools textarea{display:block;width:100%;box-sizing:border-box;min-height:180px;font:16px/1.6 Montserrat,sans-serif}`}</style>
    {crowded.length>0&&dismissedCheck!==crowded.join(',')&&(isMobile
      ?<div role="status" style={{display:'flex',alignItems:'center',gap:6,padding:'2px 4px 2px 12px',background:'#fff3d6',fontSize:12}}><button style={{flex:1,textAlign:'left',padding:'8px 0',background:'transparent',color:'inherit',fontSize:12}} onClick={()=>go(crowded[0]-1)}>⚠ Check slide{crowded.length>1?'s':''} {crowded.join(', ')} — text is tiny or off the page. Tap to open.</button><button aria-label="Dismiss this notice" style={{width:40,height:36,background:'transparent',fontSize:16,color:'inherit'}} onClick={()=>setDismissedCheck(crowded.join(','))}>✕</button></div>
      :<div role="status" style={{padding:'6px 12px',background:'#fff3d6',fontSize:12}}>Check slides {crowded.join(', ')}: some text is very small or extends outside the page. Resize it or use Fit text.</div>)}
    {project.aiError&&<p role="alert" style={{margin:0,padding:'8px 12px',background:'#fff3d6',fontSize:13}}>{project.aiError}</p>}
    {step==='design'&&!isMobile&&slideActions}
    {step==='design'?<div className="simple-design">{isMobile?<MobileEditor onResize={openResize} onSource={()=>setStep('source')} onPreview={()=>setStep('preview')}/>:<EditorScreen onResize={openResize} progressNav={nav}/>}</div>:step==='source'?<>{nav}<main className="simple-content"><section className="posting-tools" style={{margin:'0 auto'}}><h2>View / edit pasted text</h2><p>Your source draft saves automatically. Use Regenerate to create slides from your revised text.</p>{typeof project.sourceText==='string'?<><label>Source text<textarea aria-label="Source text" value={sourceDraft} onChange={e=>updateSourceDraft(e.target.value)} style={{minHeight:320}}/></label><p>For carousel generation, # starts a slide. ## adds a subheading on that same slide. Multiple ## points stay together; a new # moves content to another slide.</p><div className="ready-actions"><button className="simple-action" onClick={retrySave}>Save now</button><button className="simple-action simple-secondary" onClick={()=>updateSourceDraft(project.sourceText)}>Restore original paste</button></div>{project.carouselSettings?<><p>Regenerate creates a separate design using these words and the original carousel settings. Manual layout changes are not copied. Your current design is kept. AI rewriting is not rerun.</p><button className="simple-action" disabled={busy||!sourceDraft.trim()} onClick={regenerateSource}>{busy?'Regenerating…':'Regenerate as a new copy'}</button></>:<p>This design has no saved carousel-generation settings. You can save or copy the source, but regeneration is unavailable.</p>}</>:<p>The original paste was not saved with this design. All current slide text is available below, including text outside the visible page.</p>}{sourceNotice&&<p role="status">{sourceNotice}</p>}<details open><summary>All current slide text — including overflow</summary><textarea aria-label="All current slide text" readOnly value={canvasSlideText(project.canvases.map(c=>({...c,elements:c.elements.map(e=>({...e,hidden:false}))})))} style={{minHeight:240}}/></details>{project.generatedSourceText&&project.generatedSourceText!==project.sourceText&&<details><summary>Text used after AI rewriting</summary><textarea readOnly aria-label="AI generated source" value={project.generatedSourceText}/></details>}</section></main></>:<>{nav}<main className="simple-content"><div className="final-review">
      <h2 style={{margin:0}}>Preview your carousel</h2><p className="simple-muted" style={{margin:0}}>{canvas.w} × {canvas.h} · saved in this browser after autosave completes</p>
      <div className="preview-image" onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current==null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)go(index+(dx<0?1:-1));touch.current=null;}}><MiniPreview canvas={canvas} maxW={Math.min(440,window.innerWidth-48)} maxH={Math.min(540,window.innerHeight*.56)}/></div>
      <div className="preview-buttons"><button aria-label="Previous preview slide" disabled={index===0} onClick={()=>go(index-1)}>←</button><span>Slide {index+1} of {project.canvases.length}</span><button aria-label="Next preview slide" disabled={index===project.canvases.length-1} onClick={()=>go(index+1)}>→</button></div>
      <button className="simple-action simple-secondary" onClick={()=>setStep('design')}>Edit this slide</button>
      <button className="simple-action simple-secondary" onClick={openResize}>Resize as a copy</button>
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
