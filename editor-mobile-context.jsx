// Default property views are horizontal. Full controls remain available through expand.
function MobileControlSlider({label,value,min,max,step=1,onLive,onDone,onSet}){
  const [draft,setDraft]=React.useState(String(value));React.useEffect(()=>setDraft(String(Math.round(value*100)/100)),[value]);
  const commit=()=>{const n=Number(draft);if(draft!==''&&Number.isFinite(n)&&n!==value)onSet(clamp(n,min,max));else setDraft(String(value));};
  return <div className="mobile-control-card"><label>{label}<input aria-label={label+' value'} type="number" min={min} max={max} step={step} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label><div className="mobile-control-slider"><button aria-label={'Decrease '+label} onClick={()=>onSet(clamp(value-step,min,max))}>−</button><LiveSlider label={label} value={value} min={min} max={max} step={step} onLive={onLive} onDone={onDone}/><button aria-label={'Increase '+label} onClick={()=>onSet(clamp(value+step,min,max))}>+</button></div></div>;
}

function MobileContextShelf({el,tool,title,onClose,children}){
  const [open,setOpen]=React.useState(false);
  return <><MobileLibraryStrip title={title} onClose={onClose} onExpand={()=>setOpen(true)}>{children}</MobileLibraryStrip>{open&&<MobileLibraryDrawer title={title+' library'} onDismiss={onClose} onClose={()=>setOpen(false)}><div className="mobile-legacy-details"><MobileLegacyToolTray el={el} tool={tool} onClose={()=>setOpen(false)}/></div></MobileLibraryDrawer>}</>;
}

function MobileStyleChoices({el,update}){
  const [busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),alive=React.useRef(true);React.useEffect(()=>()=>{alive.current=false;},[]);
  const apply=async look=>{setBusy(true);setError('');try{await fontChangePatch({...el,fontWeight:look.fontWeight},look.fontFamily);if(!alive.current)return;const patch={...look,underline:false};delete patch.name;update(patch);}catch(e){if(alive.current)setError('This font could not load. Try again.');}finally{if(alive.current)setBusy(false);}};
  return <>{TEXT_LOOKS.map(look=><button key={look.name} className="mobile-font-choice" disabled={busy} style={{fontFamily:look.fontFamily,fontWeight:look.fontWeight,fontStyle:look.italic?'italic':'normal'}} onClick={()=>apply(look)}>{look.name}</button>)}{error&&<span role="alert">{error}</span>}</>;
}

function MobileToolTray({el,tool,onClose}){
  const {state,dispatch}=useStore(),canvas=activeCanvas(state),{live,done}=useLiveElementEdit(el.id),host=React.useRef(null);
  const update=patch=>dispatch({type:'update-element',id:el.id,patch});
  const slider=(label,key,min,max,step=1,value=el[key],make=value=>({[key]:value}))=><MobileControlSlider key={label} label={label} value={Number(value)||0} min={min} max={max} step={step} onLive={value=>live(make(value))} onDone={done} onSet={value=>update(make(value))}/>;
  if(tool==='font')return <MobileFontLibrary el={el} onClose={onClose}/>;
  if(['colour','outline','accent'].includes(tool)){const field=tool==='outline'?'stroke':tool==='accent'?'iconAccent':colourKey(el),title=el.type==='text'?'Colour':field==='fill'?'Fill':field==='iconAccent'?'Soft fill':'Outline';return <MobileColourLibrary key={field} el={el} field={field} title={title} onClose={onClose}/>;}
  if(['position','flip','fit'].includes(tool))return <MobileLegacyToolTray el={el} tool={tool} onClose={onClose}/>;
  if(tool==='size'&&el.type==='image')return <section className="mobile-ribbon-panel" aria-label="Size controls"><MobileImageSizeTool el={el}/></section>;
  const title=TRAY_LABELS[tool]||tool;
  let content;
  if(tool==='styles')content=<MobileStyleChoices el={el} update={update}/>;
  if(tool==='format')content=<><div className="mobile-horizontal-weights"><WeightChips el={el} update={update}/></div>{slider('Letter spacing','letterSpacing',-2,30,.5,el.letterSpacing||0)}{slider('Line spacing','lineHeight',.8,2.4,.05,el.lineHeight||1.2)}</>;
  if(tool==='opacity')content=slider('Visibility','opacity',0,100,1,(el.opacity??1)*100,value=>({opacity:value/100}));
  if(tool==='shape')content=<>{slider(el.type==='icon'?'Icon stroke width':'Stroke width','strokeWidth',el.type==='icon'?.5:0,el.type==='icon'?3:40,el.type==='icon'?.1:.5,el.strokeWidth??1)}{el.type==='rect'&&slider('Corner radius','radius',0,200,1,el.radius||0)}{el.type==='polygon'&&slider('Sides','sides',3,12,1,el.sides||6)}</>;
  if(tool==='size'){
    if(el.type==='text')content=<>{slider('Text size','fontSize',6,600,1,el.fontSize)}{slider('Box width','w',80,Math.max(el.w,canvas.w-el.x),4,el.w)}<button className="mobile-ribbon-tool" onClick={()=>update({fontSize:fitTextSize(el,el.h,400)})}>Fit to box</button></>;
    else {const ratio=el.h/Math.max(1,el.w),max=Math.max(canvas.w*1.2,el.w);const scale=w=>el.type==='icon'?illustrationSizePatch(el,w):{w,h:w*ratio,x:el.x+(el.w-w)/2,y:el.y+(el.h-w*ratio)/2};content=<>{slider('Size','w',10,max,2,el.type==='icon'?illustrationSize(el):el.w,scale)}{slider('Width','w',10,Math.max(canvas.w*2,el.w),2,el.w)}{slider('Height','h',10,Math.max(canvas.h*2,el.h),2,el.h)}{['line','arrow'].includes(el.type)&&slider('Thickness','strokeWidth',1,40,1,el.strokeWidth||4)}</>;}
  }
  if(tool==='adjust')content=<>{[['brightness','Brightness',200,100],['contrast','Contrast',200,100],['saturate','Saturation',200,100],['blur','Blur',20,0]].map(([key,label,max,fallback])=>slider(label,key,0,max,1,el.filter?.[key]??fallback,value=>({filter:{...el.filter,[key]:value}})))}{!fitsWholeImage(el)&&slider('Corner radius','radius',0,200,1,el.radius||0)}</>;
  if(tool==='frame')content=<div ref={host} className="mobile-context-frame"><FrameProps el={el} update={update}/></div>;
  if(['replace-icon','replace-artwork'].includes(tool))content=<>{tool==='replace-artwork'&&<button className="mobile-insert-upload" aria-label="Upload replacement" onClick={()=>host.current?.querySelector('input[type=file]')?.click()}><Icon name="upload" size={20}/></button>}<div ref={host} className="mobile-insert-preview">{tool==='replace-icon'?<IconLibraryGrid selected={el.name} accent={el.iconAccent||'none'} onChoose={name=>update({name})}/>:isIllustration(el)||isBrandLogo(el)?<IconsPanel replacement={el} onReplaced={onClose}/>:<ImagesPanel replacement={el} onReplaced={onClose}/>}</div></>;
  return <MobileContextShelf el={el} tool={tool} title={title} onClose={onClose}>{content}</MobileContextShelf>;
}
