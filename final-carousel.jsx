// One creation screen; the saved canvas is the only editing source of truth.
function distributeCarouselText(text, count, keepCover=false) {
  const chunks=text.trim().split(/\n\s*\n|\n\s*---+\s*\n/).filter(s=>s.trim());
  if(!count)return chunks;
  if(keepCover && count>1 && chunks.length>1 && chunks[0].length<180)
    return [chunks[0],...distributeCarouselText(chunks.slice(1).join('\n\n'),count-1)];
  const words=text.trim().replace(/\n\s*---+\s*\n/g,'\n').split(/\s+/);
  if(words.length<count)throw new Error('Choose fewer slides, or add more words.');
  const boundaries=[0];
  for(let i=1;i<count;i++){
    const target=Math.round(i*words.length/count),min=boundaries[i-1]+1,max=words.length-(count-i);
    const sentences=[];for(let j=min;j<=max;j++)if(/[.!?][”"']?$/.test(words[j-1]))sentences.push(j);
    boundaries.push(sentences.length?sentences.reduce((best,n)=>Math.abs(n-target)<Math.abs(best-target)?n:best,sentences[0]):Math.max(min,Math.min(max,target)));
  }
  boundaries.push(words.length);
  return Array.from({length:count},(_,i)=>words.slice(boundaries[i],boundaries[i+1]).join(' '));
}
const CAROUSEL_STYLE_PAIRS = [
  {id:'clear',name:'Big & clear',description:'A bold hook and a strong, simple CTA.',bg:'#F1CFEA',ink:'#2A1F2A',size:112},
  {id:'gentle',name:'Soft & gentle',description:'Softer type for personal stories and reassuring tips.',bg:'#FBF0F7',ink:'#2A1F2A',size:108,italic:true},
  {id:'informative',name:'Neat & informative',description:'A colour-block heading with room for helpful details.',bg:'#F1CFEA',ink:'#2A1F2A',size:100,split:true},
  {id:'colourful',name:'Bold & colourful',description:'Rich plum and contrasting type for announcements.',bg:'#7d2960',ink:'#FDFBFC',size:112},
];
const CAROUSEL_CTA_CHOICES = {
  save:{title:'Save this for later',body:'Keep these tips handy for when you need them.',icon:'bookmark',label:'Save'},
  share:{title:'Share this with a friend',body:'Pass this on to someone who would find it helpful.',icon:'share',label:'Share'},
  follow:{title:'Follow for cloth pad tips',body:'Practical tips and handmade updates for your flow.',icon:'user_plus',label:'Follow'},
  shop:{title:'Explore the shop',body:'Find handmade cloth pads at wonder-pads.com.',icon:'shop',label:'Shop'},
  message:{title:'Send me a message',body:'Have a question? Message @ecoclothpad on Instagram.',icon:'chat',label:'Message'},
};
function endpointSlide(kind,heading,body,label,s,brand,W,H){
  const pair=CAROUSEL_STYLE_PAIRS.find(p=>p.id===s.pair)||CAROUSEL_STYLE_PAIRS[0];
  const c={id:uid(),name:kind==='hook'?'Cover':'Closing slide',slideKind:kind,stylePair:pair.id,w:W,h:H,bg:{type:'color',value:pair.bg},elements:[]};
  const els=c.elements,m=86;
  const addText=(role,text,y,size,w=W-2*m,align='left',x=m,extra={})=>{
    if(!text)return null;
    const style=role==='heading'?'h1':role==='label'?'label':'body';
    const el=newElement('text',{...SLIDE_TEXT_STYLES[style],textStyle:style,__role:role,text,x,y,w,fontSize:size,align,color:pair.ink,...extra});
    delete el.label;el.h=textLayout(el).height;els.push(el);return el;
  };
  const top=pair.split?112:Math.round(H*.18);
  const tag=addText('label',label,top,30,W-2*m,'left',m,{letterSpacing:3});
  const title=addText('heading',heading,tag?tag.y+tag.h+40:top,pair.size,W-2*m,'left',m,{italic:!!pair.italic,fontWeight:pair.italic?400:600});
  let y=title.y+title.h+40;
  if(pair.split){
    const split=Math.max(H*.43,y+12);
    els.unshift(newElement('rect',{x:0,y:split,w:W,h:Math.max(0,H-split),fill:'#FDFBFC',radius:0,endpointDecoration:true}));
    y=split+58;
  }else{
    els.push(newElement('rect',{x:m,y,w:100,h:3,fill:pair.ink,radius:0,endpointDecoration:true}));
    y+=40;
  }
  const supporting=addText('body',body,y,42);
  if(pair.split&&supporting)supporting.color='#2A1F2A';
  if(kind==='hook'){
    if(s.logo&&brand.logo)els.push(newElement('image',{src:brand.logo,x:W-150,y:50,w:64,h:64,radius:9999,fromBrand:true,role:'logo',brandLayout:'hook',brandSlot:'logo'}));
    if(s.swipe)els.push(newElement('text',{text:'Swipe →',x:W-280,y:H-100,w:194,h:40,...SLIDE_TEXT_STYLES.label,__role:'swipe',textStyle:'label',color:pair.split?'#2A1F2A':pair.ink}));
    c.elements=cleanSlideSwipe(els,c);
  }else{
    els.push(...ctaEngagementElements(c,pair.split?'#2A1F2A':pair.ink));
    const branding=brandBackgroundElements('signature',c,{...brand,logo:s.logo?brand.logo:''});
    for(const el of branding)if(el.type==='text')el.color=pair.split?'#2A1F2A':pair.ink;
    els.push(...branding);
  }
  return c;
}

function createSimpleCanvases(text,s,brand){
  const W=1080,H=s.size==='portrait'?1350:1080;
  const accent=brand.colors?.[0]||'#F1CFEA';
  const chunks=distributeCarouselText(text,s.count?Number(s.count)-(s.outro?1:0):0,s.cover);
  const result=chunks.map((chunk,i)=>{
    const cover=s.cover&&i===0,els=[];
    if(cover){
      const lines=chunk.trim().split('\n'),tag=lines[0].match(/^([^:\n]{1,32}):\s*(.+)$/);
      return endpointSlide('hook',tag?tag[2]:lines[0],lines.slice(1).join('\n').trim(),tag?tag[1]:(s.hookLabel||''),s,brand,W,H);
    }
    const add=(role,words,y,align='left')=>{
      if(!words)return null;
      const textStyle=role==='heading'?(cover?'h1':'h2'):role==='number'?'label':'body';
      const el=newElement('text',{text:words,x:86,y,w:908,...SLIDE_TEXT_STYLES[textStyle],textStyle,align,color:'#2A1F2A',__role:role});
      delete el.label;el.h=textLayout(el).height;els.push(el);return el;
    };
    const lines=chunk.trim().split('\n'),heading=lines[0].replace(/^[A-Z][A-Z0-9 ·-]{2,20}:\s+/,''),body=lines.slice(1).join('\n').trim();
    if(s.numbers&&!cover)add('number',String(i+1).padStart(2,'0'),65);
    const title=add('heading',heading,cover?Math.round(H*.25):160);
    add('body',body,title?title.y+title.h+42:160);
    const canvas={id:uid(),name:cover?'Cover':`Slide ${i+1}`,slideKind:cover?'hook':'content',w:W,h:H,bg:{type:'color',value:cover?accent:(i%2?'#FDFBFC':'#FBF0F7')},elements:els};
    if(cover){
      if(s.logo)els.push(...brandBackgroundElements('hook',canvas,brand));
    }else if(s.handles){
      els.push(...brandBackgroundElements('signature',canvas,{...brand,logo:s.logo?brand.logo:''}));
    }else if(s.logo&&brand.logo){
      els.push(newElement('image',{src:brand.logo,x:86,y:H-125,w:76,h:76,radius:9999,role:'logo',fromBrand:true}));
    }
    if(s.swipe&&(i<chunks.length-1||s.outro))els.push(newElement('text',{text:'Swipe →',__role:'swipe',textStyle:'label',x:800,y:H-140,w:194,h:40,fontFamily:'Montserrat',fontSize:30,fontWeight:500,color:'#963d80'}));
    canvas.elements=cleanSlideSwipe(els,canvas);return canvas;
  });
  if(s.outro){
    const choice=CAROUSEL_CTA_CHOICES[s.cta]||CAROUSEL_CTA_CHOICES.save;
    result.push(endpointSlide('cta',choice.title,choice.body,'YOUR NEXT STEP',s,brand,W,H));
  }
  return result;
}
function CarouselPairPicker({settings,onChange,brand}){
  const [ready,setReady]=React.useState(false);
  React.useEffect(()=>{let live=true;Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('italic 400 108px "Cormorant Garamond"'),document.fonts.load('400 42px "Montserrat"')]).then(()=>{if(live)setReady(true);});return()=>{live=false;};},[]);
  return <section className="sc-panel"><h2>Choose your first &amp; last slide style</h2><p className="simple-muted">A matching opening + closing pair. Middle slides stay soft pink and white.</p><div className="pair-options" role="group" aria-label="Opening and closing slide style">{CAROUSEL_STYLE_PAIRS.map(pair=>{
    const p={...settings,pair:pair.id,cover:true,outro:true,count:'',swipe:false,hookLabel:'YOUR STORY'};
    const hook=endpointSlide('hook','A little comfort, made for you.','Handmade cloth pads for your everyday rhythm.',p.hookLabel,p,brand,1080,settings.size==='portrait'?1350:1080);
    const action=CAROUSEL_CTA_CHOICES[settings.cta]||CAROUSEL_CTA_CHOICES.save;
    const close=endpointSlide('cta',action.title,action.body,'YOUR NEXT STEP',p,brand,1080,hook.h);
    return <button type="button" key={pair.id} className="pair-option" aria-pressed={(settings.pair||'clear')===pair.id} onClick={()=>onChange('pair',pair.id)}><strong>{pair.name}</strong><span>{pair.description}</span><div className="pair-samples" aria-hidden="true"><div><MiniPreview canvas={hook} maxW={100} maxH={120}/><small>Opening</small></div><div><MiniPreview canvas={close} maxW={100} maxH={120}/><small>Closing</small></div></div></button>;
  })}</div><label className="final-count">What should readers do next?<select aria-label="What should readers do next?" value={settings.cta||'save'} onChange={e=>onChange('cta',e.target.value)}>{Object.entries(CAROUSEL_CTA_CHOICES).map(([id,c])=><option key={id} value={id}>{c.label}</option>)}</select></label><label className="final-count">Small hook label (optional)<input aria-label="Small hook label" type="text" maxLength="32" value={settings.hookLabel||''} onChange={e=>onChange('hookLabel',e.target.value)} placeholder="e.g. CLOTH PAD TIPS"/></label>{(!settings.cover||!settings.outro)&&<p className="simple-muted">The pair applies to the opening and closing slides you enable above.</p>}</section>;
}

function FinalCarouselFlow(){
  const {state,dispatch}=useStore();
  const [input,setInput]=React.useState(''),[reuse,setReuse]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  const [s,setSettings]=React.useState({size:'portrait',count:'',cover:true,outro:true,numbers:false,logo:true,handles:true,swipe:true,cta:'save',pair:'clear'});
  const set=(key,value)=>setSettings(prev=>({...prev,[key]:value}));
  const create=async()=>{
    if(!input.trim()){setError('Add your words first.');return;}
    setBusy(true);setError('');
    try{
      await Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('italic 400 108px "Cormorant Garamond"'),document.fonts.load('400 46px "Montserrat"'),document.fonts.load('500 30px "Montserrat"')]);let text=input;
      if(reuse){const r=await aiRepurposeAll({brand:state.brand,vocab:state.vocab,input,platforms:['instagram-carousel'],counts:{'instagram-carousel':s.count?+s.count-(s.outro?1:0):7},provider:'gemini'});text=r['instagram-carousel']||'';}
      if(!text.trim())throw new Error('No text was returned. Try without AI.');
      const canvases=createSimpleCanvases(text,s,state.brand);
      dispatch({type:'create-project',project:{id:uid(),name:text.trim().split('\n')[0].slice(0,50),createdAt:now(),updatedAt:now(),thumbnail:null,projectType:'carousel',canvases,activeCanvasId:canvases[0].id,carouselSettings:s,sourceText:input}});
    }catch(e){setError(e.message||'Could not create slides.');}finally{setBusy(false);}
  };
  return <div className="sc-shell"><SimpleStudioStyles/><SimpleCarouselStyles/><style>{`.final-options{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.final-options label{display:flex;gap:8px;align-items:center}.final-options input{width:20px;height:20px}.final-count{display:flex;gap:12px;align-items:center;margin-top:18px}.final-count select{font-size:16px;padding:10px;max-width:70%} .pair-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pair-option{border:1px solid #dfcbd9;border-radius:12px;background:#fff;padding:16px;text-align:left;color:#2A1F2A;min-width:0}.pair-option[aria-pressed=true]{border:2px solid #963d80;background:#fcf1f8}.pair-option strong{display:block;font-size:17px}.pair-option>span{display:block;font-size:13px;line-height:1.5;margin:8px 0}.pair-samples{display:flex;gap:12px;justify-content:center;align-items:flex-start}.pair-samples small{display:block;margin-top:6px;text-align:center}.final-count input{min-width:0;padding:10px;font-size:16px;max-width:60%}@media(max-width:500px){.pair-options{grid-template-columns:1fr}.final-count{flex-wrap:wrap}.final-count select,.final-count input{max-width:100%}}`}</style>
    <header className="sc-header"><button className="sc-back" onClick={()=>dispatch({type:'set-view',view:'home'})}>← Home</button><div><strong>Create a carousel</strong><small>Text → Canvas → Download</small></div></header>
    <main className="sc-main"><div className="sc-inner"><section className="sc-panel"><h2>Your words</h2><textarea aria-label="Your carousel text" className="sc-source" value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste your words. Blank lines separate slides when count is Auto."/><div className="sc-row"><button className="sc-link" onClick={()=>setInput(getExampleText())}>Try example</button><button className="sc-link" onClick={()=>setInput('')}>Clear</button></div><label><input type="checkbox" checked={reuse} onChange={e=>setReuse(e.target.checked)}/> Reuse / improve with AI (optional)</label></section>
    <section className="sc-panel"><h2>Carousel settings</h2><div className="sc-aspects">{[['post','Square · 1:1','1080 × 1080'],['portrait','Portrait · 4:5','1080 × 1350']].map(([id,label,size])=><button key={id} aria-current={s.size===id} onClick={()=>set('size',id)}>{label}<small>{size}</small></button>)}</div><label className="final-count">Total slides<select aria-label="Total slides" value={s.count} onChange={e=>set('count',e.target.value)}><option value="">Auto — my text breaks</option>{Array.from({length:19},(_,i)=>i+2).map(n=><option key={n} value={n}>{n} slides</option>)}</select></label><p className="simple-muted">Includes cover and closing slides. A chosen count divides all your words without removing any.</p><div className="final-options">{[['cover','First slide / hook'],['outro','Closing slide'],['numbers','Slide numbers'],['logo','Brand logo'],['handles','Social / website'],['swipe','Swipe hint']].map(([key,label])=><label key={key}><input type="checkbox" checked={s[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}</div><p className="simple-muted">Hook and closing slides share one colour. Middle slides use white and soft pink. The closing slide always includes your contact details.</p></section><CarouselPairPicker settings={s} onChange={set} brand={state.brand}/>{error&&<p role="alert">{error}</p>}</div></main>
    <footer className="sc-footer"><span>Next: edit your actual slides on the canvas.</span><button className="simple-action" disabled={busy} onClick={create}>{busy?'Creating…':'Create carousel →'}</button></footer>
  </div>;
}
Object.assign(window,{FinalCarouselFlow,createSimpleCanvases,distributeCarouselText});
