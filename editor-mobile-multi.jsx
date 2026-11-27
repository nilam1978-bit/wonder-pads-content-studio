// Shared geometry and atomic operations for temporary mobile selections.
function mobileSelectionElements(state){return activeCanvas(state).elements.filter(e=>state.selection.includes(e.id)&&!e.locked&&!e.hidden);}
function mobileSelectionBounds(elements){
  const points=elements.flatMap(e=>{const a=(e.rot||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=e.x+e.w/2,cy=e.y+e.h/2;return [[-e.w/2,-e.h/2],[e.w/2,-e.h/2],[e.w/2,e.h/2],[-e.w/2,e.h/2]].map(([x,y])=>({x:cx+x*c-y*s,y:cy+x*s+y*c}));});
  if(!points.length)return null;const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));return {x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y};
}
function mobileScaleSelection(elements,b,factor){return elements.map(e=>{const patch={x:b.x+(e.x-b.x)*factor,y:b.y+(e.y-b.y)*factor,w:e.w*factor,h:e.h*factor};if(e.type==='text'){patch.fontSize=e.fontSize*factor;if(e.letterSpacing!=null)patch.letterSpacing=e.letterSpacing*factor;}for(const key of ['strokeWidth','radius'])if(Number.isFinite(e[key]))patch[key]=e[key]*factor;return {id:e.id,patch};});}
function mobileLayerDrop(front,ids,target,after){const moving=front.filter(id=>ids.includes(id)),rest=front.filter(id=>!ids.includes(id)),index=rest.indexOf(target);if(index<0)return front;return [...rest.slice(0,index+(after?1:0)),...moving,...rest.slice(index+(after?1:0))];}

function useMobileBatchEdit(){
  const {state,dispatch}=useStore(),latest=React.useRef(state),snapshot=React.useRef(null);latest.current=state;
  const done=()=>{if(snapshot.current){dispatch({type:'commit-transient',snapshot:snapshot.current});snapshot.current=null;}};
  React.useEffect(()=>()=>done(),[]);
  return {live:updates=>{if(!snapshot.current)snapshot.current=JSON.parse(JSON.stringify(activeProject(latest.current)));dispatch({type:'update-elements-batch',updates,transient:true});},done};
}

function MobileMultiOverlay({zoom}){
  const {state,dispatch}=useStore(),elements=mobileSelectionElements(state),bounds=mobileSelectionBounds(elements),cleanup=React.useRef(null);
  React.useEffect(()=>()=>cleanup.current?.(),[]);
  if(!bounds)return null;
  const gesture=(event,kind)=>{
    event.preventDefault();event.stopPropagation();cleanup.current?.();const x=event.clientX,y=event.clientY,pointer=event.pointerId,snapshot=JSON.parse(JSON.stringify(activeProject(state)));let moved=false;
    const move=e=>{if(e.pointerId!==pointer)return;e.preventDefault();const dx=(e.clientX-x)/zoom,dy=(e.clientY-y)/zoom;if(!moved&&Math.hypot(e.clientX-x,e.clientY-y)<3)return;moved=true;
      let updates;if(kind==='move')updates=elements.map(el=>({id:el.id,patch:{x:el.x+dx,y:el.y+dy}}));else{const min=Math.max(.01,...elements.map(el=>el.type==='text'?6/el.fontSize:10/Math.min(el.w,el.h))),max=Math.min(20,...elements.filter(el=>el.type==='text').map(el=>600/el.fontSize));const factor=clamp(1+(dx*bounds.w+dy*bounds.h)/Math.max(1,bounds.w*bounds.w+bounds.h*bounds.h),min,max);updates=mobileScaleSelection(elements,bounds,factor);}
      dispatch({type:'update-elements-batch',updates,transient:true});};
    const finish=e=>{if(e&&e.pointerId!==pointer)return;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);cleanup.current=null;if(moved)dispatch({type:'commit-transient',snapshot});};
    cleanup.current=()=>finish();window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
  };
  return <div className="mobile-multi-outline" data-multi-outline style={{left:bounds.x*zoom,top:bounds.y*zoom,width:bounds.w*zoom,height:bounds.h*zoom}}><button className="mobile-multi-move" aria-label="Move selected elements" onPointerDown={e=>gesture(e,'move')}><Icon name="move_element" size={18}/></button><button className="mobile-multi-resize" aria-label="Resize selected elements" onPointerDown={e=>gesture(e,'resize')}><Icon name="resize" size={17}/></button></div>;
}

function MobileMultiTools({onDone}){
  const {state,dispatch}=useStore(),elements=mobileSelectionElements(state),[tool,setTool]=React.useState(null),[error,setError]=React.useState(''),[sizeDraft,setSizeDraft]=React.useState(''),latest=React.useRef(null),request=React.useRef(0),batch=useMobileBatchEdit();latest.current=state;
  const ids=elements.map(e=>e.id),signature=ids.join('|'),text=elements.length>0&&elements.every(e=>e.type==='text'),images=elements.length>0&&elements.every(e=>e.type==='image'||e.type==='icon');
  React.useEffect(()=>{setTool(null);request.current++;},[signature]);React.useEffect(()=>()=>{request.current++;latest.current=null;},[]);
  React.useEffect(()=>setSizeDraft(String(Math.round(elements[0]?.fontSize||0))),[signature,elements[0]?.fontSize]);
  const apply=patch=>dispatch({type:'update-elements-batch',updates:elements.map(e=>({id:e.id,patch:typeof patch==='function'?patch(e):patch})).filter(u=>Object.entries(u.patch).some(([key,value])=>elements.find(e=>e.id===u.id)[key]!==value))});
  const font=async family=>{const seq=++request.current;setError('');try{await Promise.all(elements.map(e=>fontChangePatch(e,family)));if(seq!==request.current||!latest.current)return;const current=mobileSelectionElements(latest.current);if(current.map(e=>e.id).join('|')!==signature)return;dispatch({type:'update-elements-batch',updates:current.map(e=>({id:e.id,patch:{fontFamily:family,fontWeight:nearestWeight(family,e.fontWeight)}}))});}catch(e){if(latest.current&&seq===request.current){setError('Could not load that font. Try again.');throw e;}}};
  const align=position=>{const b=mobileSelectionBounds(elements),c=activeCanvas(state);if(!b)return;const dx=position==='left'?-b.x:position==='hcenter'?(c.w-b.w)/2-b.x:position==='right'?c.w-b.x-b.w:0,dy=position==='top'?-b.y:position==='vmiddle'?(c.h-b.h)/2-b.y:position==='bottom'?c.h-b.y-b.h:0;apply(e=>({x:e.x+dx,y:e.y+dy}));};
  const choice=(label,key,icon)=> <button className="mobile-ribbon-tool" aria-label={label} aria-expanded={tool===key} disabled={!elements.length} onClick={()=>setTool(tool===key?null:key)}><Icon name={icon} size={14}/></button>;
  return <>
    {tool==='font'&&text&&<MobileFontLibrary el={elements[0]} onPick={font} onClose={()=>setTool(null)}/>}{tool==='colour'&&text&&<MobileColourLibrary el={elements[0]} onPick={color=>apply({color})} onClose={()=>setTool(null)}/>}
    {tool&&!['font','colour'].includes(tool)&&<section className="mobile-ribbon-panel" aria-label="Multiple selection controls"><header><strong>{tool}</strong><button className="mobile-ribbon-pin" aria-label="Close selection controls" onClick={()=>setTool(null)}>Done</button></header><div className="mobile-ribbon-panel-body">
      {tool==='font'&&text&&<div className="mobile-library-scroll">{ALL_FONT_OPTIONS.map(f=><button className="mobile-font-choice" key={f.family} style={{fontFamily:f.family}} onClick={()=>font(f.family)}>{f.label}</button>)}</div>}
      {tool==='colour'&&text&&<ColorPicker value={elements[0].color} onChange={color=>apply({color})}/>}
      {tool==='size'&&text&&<><LiveSlider label="Selected text size" min={6} max={600} value={Math.round(elements[0].fontSize)} onLive={fontSize=>batch.live(elements.map(e=>({id:e.id,patch:{fontSize}})))} onDone={batch.done}/><input aria-label="Set selected font size" type="number" min="6" max="600" value={sizeDraft} onChange={e=>setSizeDraft(e.target.value)} onBlur={()=>{const n=Number(sizeDraft);if(n>=6&&n<=600)apply({fontSize:n});}}/></>}
      {tool==='position'&&<div className="mobile-ribbon-icon-group">{[['left','align_l'],['hcenter','align_c'],['right','align_r'],['top','align_top'],['vmiddle','align_middle'],['bottom','align_bottom']].map(([position,icon])=><MobileIconAction key={position} label={'Align selection '+position} icon={icon} onClick={()=>align(position)}/>)}</div>}
      {tool==='spacing'&&text&&<div>{[['lineHeight','Line spacing',.8,3],['letterSpacing','Letter spacing',-10,50]].map(([key,label,min,max])=><label key={key}>{label}<input type="number" aria-label={'Selected '+label} min={min} max={max} step={key==='lineHeight'?.1:1} defaultValue={elements[0][key]??(key==='lineHeight'?1.2:0)} onBlur={e=>{const value=Number(e.target.value);if(value>=min&&value<=max)apply({[key]:value});}}/></label>)}</div>}
      {tool==='move'&&<div className="mobile-ribbon-icon-group">{[['left',-10,0],['right',10,0],['up',0,-10],['down',0,10]].map(([name,x,y])=><button className="mobile-ribbon-tool" key={name} aria-label={'Move selection '+name} onClick={()=>apply(e=>({x:e.x+x,y:e.y+y}))}>{name}</button>)}</div>}
      {tool==='opacity'&&<label>Opacity<LiveSlider label="Selected opacity" min={0} max={100} value={Math.round((elements[0]?.opacity??1)*100)} onLive={value=>batch.live(elements.map(e=>({id:e.id,patch:{opacity:value/100}})))} onDone={batch.done}/></label>}
      {error&&<p role="alert">{error}</p>}
    </div></section>}
    <MobileRibbon label="Selected element tools" end={<div className="mobile-ribbon-fixed-actions" role="group" aria-label="Selected element actions"><MobileIconAction label="Delete selected elements" icon="trash" disabled={!ids.length} onClick={()=>dispatch({type:'delete-elements',ids})}/><button className="mobile-ribbon-pin mobile-ribbon-done" aria-label="Done selecting" onClick={onDone}><Icon name="check" size={16}/></button></div>}>
      <span className="mobile-selection-count" role="status">{ids.length} selected</span><MobileIconAction label="Duplicate selected elements" icon="duplicate" disabled={!ids.length} onClick={()=>dispatch({type:'duplicate-elements',ids})}/>
      {choice('Move selection','move','move_element')}{choice('Align selection','position','align_c')}{choice('Selection opacity','opacity','opacity')}
      {text&&<>{choice('Selection font','font','text')}{choice('Selection colour','colour','bg')}{choice('Selection font size','size','resize')}{choice('Selection spacing','spacing','sliders')}{[['Bold','bold'],['Italic','italic'],['Underline','underline']].map(([label,key])=>{const all=elements.every(e=>key==='bold'?Number(e.fontWeight)>=600:!!e[key]);return <button key={key} className="mobile-ribbon-tool mobile-ribbon-icon" aria-label={'Selection '+label} aria-pressed={all?true:elements.some(e=>key==='bold'?Number(e.fontWeight)>=600:!!e[key])?'mixed':false} onClick={()=>apply(key==='bold'?{fontWeight:all?400:700}:{[key]:!all})}><Icon name={key} size={14}/></button>;})}<MobileIconAction label="Selection text alignment" icon="align_c" onClick={()=>apply({align:elements.every(e=>e.align==='left')?'center':elements.every(e=>e.align==='center')?'right':'left'})}/></>}
      {images&&<><MobileIconAction label="Flip selected horizontally" icon="flip_horizontal" onClick={()=>apply(e=>({flipX:!e.flipX}))}/><MobileIconAction label="Flip selected vertically" icon="flip_vertical" onClick={()=>apply(e=>({flipY:!e.flipY}))}/></>}
    </MobileRibbon>
  </>;
}

function MobileLayersPanel({multiSelecting,onSelectMode,onToggle,onClose}){
  const {state,dispatch}=useStore(),canvas=activeCanvas(state),front=[...canvas.elements].reverse(),[line,setLine]=React.useState(null),drag=React.useRef(null),scroll=React.useRef(null),cleanup=React.useRef(null);
  React.useEffect(()=>()=>cleanup.current?.(),[]);
  const reorder=(ids,target,after)=>dispatch({type:'reorder-elements',ids:mobileLayerDrop(front.map(e=>e.id),ids,target,after).slice().reverse()});
  const start=(event,el)=>{event.preventDefault();if(el.locked)return;cleanup.current?.();const selected=state.selection.includes(el.id)?front.filter(e=>state.selection.includes(e.id)&&!e.locked).map(e=>e.id):[el.id];drag.current={x:event.clientX,y:event.clientY,pointer:event.pointerId,ids:selected,order:null};
    const move=e=>{const d=drag.current;if(!d||e.pointerId!==d.pointer)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;e.preventDefault();const box=scroll.current?.getBoundingClientRect();if(box){if(e.clientY<box.top+28)scroll.current.scrollTop-=12;else if(e.clientY>box.bottom-28)scroll.current.scrollTop+=12;}const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-mobile-layer]');if(!row||selected.includes(row.dataset.mobileLayer))return;const r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;d.order=mobileLayerDrop(front.map(e=>e.id),selected,row.dataset.mobileLayer,after);setLine({id:row.dataset.mobileLayer,after});};
    const finish=e=>{if(e&&e.pointerId!==drag.current?.pointer)return;const order=drag.current?.order;drag.current=null;setLine(null);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);cleanup.current=null;if(order)dispatch({type:'reorder-elements',ids:order.slice().reverse()});};
    const cancel=()=>{drag.current=null;finish();};cleanup.current=cancel;window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',cancel);
  };
  return <div><div className="mobile-layer-heading"><button className="btn btn-tonal" aria-pressed={multiSelecting} onClick={onSelectMode}>Select</button><span>{state.selection.length} selected · Front to back</span></div><div ref={scroll} className="mobile-layer-list">{front.map((el,index)=><div key={el.id} data-mobile-layer={el.id} className={'mobile-layer-row'+(line?.id===el.id?(line.after?' drop-after':' drop-before'):'')} aria-selected={state.selection.includes(el.id)}>
    <button className="mobile-layer-drag" aria-label={'Drag layer '+(index+1)} disabled={el.locked} onPointerDown={e=>start(e,el)} onKeyDown={e=>{if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;e.preventDefault();const target=front[index+(e.key==='ArrowUp'?-1:1)];if(target)reorder([el.id],target.id,e.key==='ArrowDown');}}><Icon name="drag_handle" size={18}/></button>
    {multiSelecting&&<input type="checkbox" aria-label={'Select layer '+(index+1)} disabled={el.locked||el.hidden} checked={state.selection.includes(el.id)} onChange={()=>onToggle(el.id)}/>}
    <button className="mobile-layer-name" onClick={()=>{if(multiSelecting)onToggle(el.id);else{dispatch({type:'set-selection',ids:[el.id]});onClose();}}}><span className="mobile-layer-preview">{el.type==='image'?<img src={el.src} alt=""/>:<Icon name={el.type==='text'?'text':'shapes'} size={18}/>}</span><span>{layerName(el)}</span></button>
    <button className="mobile-layer-utility" aria-label={(el.hidden?'Show':'Hide')+' layer '+(index+1)} onClick={()=>{dispatch({type:'update-element',id:el.id,patch:{hidden:!el.hidden}});if(!el.hidden)dispatch({type:'set-selection',ids:state.selection.filter(id=>id!==el.id)});}}><Icon name={el.hidden?'eye_off':'eye'} size={16}/></button><button className="mobile-layer-utility" aria-label={(el.locked?'Unlock':'Lock')+' layer '+(index+1)} onClick={()=>{dispatch({type:'update-element',id:el.id,patch:{locked:!el.locked}});if(!el.locked)dispatch({type:'set-selection',ids:state.selection.filter(id=>id!==el.id)});}}><Icon name={el.locked?'lock':'unlock'} size={16}/></button>
  </div>)}</div></div>;
}
