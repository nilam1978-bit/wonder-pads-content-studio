// Crop is a local draft until Apply; the original upload is always retained.
function PhotoCropPicker(){
  const {state,dispatch}=useStore(),target=state.photoCropTarget,el=photoCropContext(state,target);
  React.useEffect(()=>{if(target&&!el)dispatch({type:'close-photo-crop'});},[target,!!el,dispatch]);
  return el?<PhotoCropDialog key={target.requestId} target={target} el={el}/>:null;
}
function PhotoCropDialog({target,el}){
  const {dispatch}=useStore(),dialog=React.useRef(null),drag=React.useRef(null);
  const [dimensions,setDimensions]=React.useState(null),[error,setError]=React.useState('');
  const [size,setSize]=React.useState({w:el.w,h:el.h}),[ratio,setRatio]=React.useState('current');
  const [crop,setCrop]=React.useState({zoom:el.crop?.zoom||1,x:el.crop?.x??.5,y:el.crop?.y??.5});
  const close=()=>dispatch({type:'close-photo-crop'});
  React.useEffect(()=>{dialog.current.showModal();},[]);
  React.useEffect(()=>{
    let alive=true;const img=new Image();
    img.onload=()=>{if(alive){if(img.naturalWidth>0&&img.naturalHeight>0)setDimensions({w:img.naturalWidth,h:img.naturalHeight});else setError('This photo could not be opened for cropping.');}};
    img.onerror=()=>{if(alive)setError('This photo could not be opened for cropping. Try replacing the photo.');};img.src=el.src;
    return()=>{alive=false;img.onload=null;img.onerror=null;};
  },[el.src]);
  const chooseRatio=value=>{
    setRatio(value);const r=value==='original'?dimensions.w/dimensions.h:value==='square'?1:value==='portrait'?4/5:value==='landscape'?16/9:el.w/el.h;
    setSize({w:el.w,h:el.w/r});setCrop({zoom:1,x:.5,y:.5});
  };
  const start=e=>{
    if(!dimensions||drag.current||e.button>0)return;
    const rect=e.currentTarget.getBoundingClientRect(),scale=Math.max(rect.width/dimensions.w,rect.height/dimensions.h)*crop.zoom;
    drag.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:crop.x,y:crop.y,dx:dimensions.w*scale-rect.width,dy:dimensions.h*scale-rect.height};
    e.currentTarget.setPointerCapture?.(e.pointerId);e.preventDefault();
  };
  const move=e=>{
    const d=drag.current;if(!d||d.id!==e.pointerId)return;
    setCrop(c=>({...c,x:d.dx>.1?clamp(d.x-(e.clientX-d.startX)*(el.flipX?-1:1)/d.dx,0,1):d.x,y:d.dy>.1?clamp(d.y-(e.clientY-d.startY)*(el.flipY?-1:1)/d.dy,0,1):d.y}));
  };
  const finish=e=>{if(drag.current?.id===e.pointerId)drag.current=null;};
  const f=el.filter||{},preview={...el,...size,imageFit:'cover',crop:{...crop,sourceW:dimensions?.w||1,sourceH:dimensions?.h||1}};
  return <dialog ref={dialog} className="photo-crop-dialog" aria-labelledby="photo-crop-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><h2 id="photo-crop-title">Crop photo</h2><button type="button" onClick={close} aria-label="Cancel crop">×</button></header>
    <p id="photo-crop-help">Drag the photo to reposition it. Zoom to choose how much stays visible.</p>
    <div className="photo-crop-preview" tabIndex={0} role="img" aria-label="Photo crop preview" aria-describedby="photo-crop-help"
      style={{width:Math.min(320,300*size.w/size.h),aspectRatio:`${size.w}/${size.h}`,borderRadius:el.type==='frame'?(el.shape==='circle'?'50%':el.shape==='rounded'?16:0):el.radius||0}}
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}
      onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const key=e.key==='ArrowLeft'||e.key==='ArrowRight'?'x':'y',delta=((e.key==='ArrowLeft'||e.key==='ArrowUp') ? .02 : -.02)*((key==='x'?el.flipX:el.flipY)?-1:1);setCrop(c=>({...c,[key]:clamp(c[key]+delta,0,1)}));}}>
      <div style={{width:'100%',height:'100%',transform:`scale(${el.flipX?-1:1},${el.flipY?-1:1})`}}><img src={el.src} draggable={false} alt="" style={{...photoImageStyle(preview),filter:el.type==='image'?`brightness(${f.brightness??100}%) contrast(${f.contrast??100}%) saturate(${f.saturate??100}%) blur(${f.blur||0}px)`:undefined}}/></div>
    </div>
    {!dimensions&&!error&&<p role="status">Loading photo…</p>}
    {error&&<p role="alert">{error}</p>}
    <label className="photo-crop-zoom">Zoom <input aria-label="Crop zoom" type="range" min="1" max="5" step="0.01" value={crop.zoom} disabled={!dimensions} onChange={e=>setCrop(c=>({...c,zoom:+e.target.value}))}/><output>{Math.round(crop.zoom*100)}%</output></label>
    {el.type==='image'&&<label>Crop shape <select aria-label="Crop shape" value={ratio} disabled={!dimensions} onChange={e=>chooseRatio(e.target.value)}><option value="current">Current shape</option><option value="original">Original photo</option><option value="square">Square · 1:1</option><option value="portrait">Portrait · 4:5</option><option value="landscape">Landscape · 16:9</option></select></label>}
    <footer><button type="button" className="btn btn-tonal" onClick={()=>{setSize({w:el.w,h:el.h});setRatio('current');setCrop({zoom:1,x:.5,y:.5});}}>Reset crop</button><button type="button" className="btn btn-tonal" onClick={close}>Cancel</button><button type="button" className="btn btn-primary" disabled={!dimensions||!!error} onClick={()=>dispatch({type:'apply-photo-crop',requestId:target.requestId,crop:{...crop,sourceW:dimensions.w,sourceH:dimensions.h},size})}>Apply crop</button></footer>
    <style>{`.photo-crop-dialog{box-sizing:border-box;width:min(460px,calc(100% - 24px));max-height:90dvh;overflow:auto;padding:18px;border:1px solid #decbd9;border-radius:18px;background:#fff9fc;color:#2a1f2a;font:14px/1.5 Montserrat,sans-serif}.photo-crop-dialog::backdrop{background:#2a1f2a66}.photo-crop-dialog header,.photo-crop-dialog footer{display:flex;align-items:center;justify-content:space-between;gap:8px}.photo-crop-dialog h2{margin:0;font:24px 'DM Serif Display',serif}.photo-crop-dialog button{min-height:44px}.photo-crop-dialog header button{min-width:44px;border:0;border-radius:10px;font-size:24px;background:#f1cfea}.photo-crop-preview{max-width:100%;margin:12px auto;overflow:hidden;background:#eee;touch-action:none;cursor:grab;outline:2px solid #78265f}.photo-crop-preview:active{cursor:grabbing}.photo-crop-preview:focus-visible{outline:3px solid #78265f;outline-offset:3px}.photo-crop-preview img{user-select:none;-webkit-user-drag:none}.photo-crop-zoom{display:flex;align-items:center;gap:10px;margin:16px 0}.photo-crop-zoom input{flex:1;min-width:0}.photo-crop-dialog select{margin:8px 0 16px;padding:10px;max-width:100%;font:inherit}.photo-crop-dialog footer{margin-top:12px;flex-wrap:wrap}`}</style>
  </dialog>;
}
Object.assign(window,{PhotoCropPicker});
