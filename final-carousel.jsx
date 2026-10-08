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
function createSimpleCanvases(text,s,brand){
  const W=1080,H=s.size==='portrait'?1350:1080;
  const accent=brand.colors?.[0]||'#F1CFEA';
  const chunks=distributeCarouselText(text,s.count?Number(s.count)-(s.outro?1:0):0,s.cover);
  const result=chunks.map((chunk,i)=>{
    const cover=s.cover&&i===0,els=[];
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
    const c={id:uid(),name:'Closing slide',slideKind:'cta',w:W,h:H,bg:{type:'color',value:accent},elements:[]};
    const choices={save:'Save this for later',follow:'Follow for cloth pad tips',shop:'Explore the shop',message:'Send me a message'};
    const el=newElement('text',{text:choices[s.cta]||choices.save,x:100,y:Math.round(H*.3),w:880,...SLIDE_TEXT_STYLES.h1,textStyle:'h1',__role:'heading',align:'center',color:'#2A1F2A'});
    delete el.label;el.h=textLayout(el).height;c.elements=[el,...brandBackgroundElements('signature',c,{...brand,logo:s.logo?brand.logo:''})];
    result.push(c);
  }
  return result;
}
function FinalCarouselFlow(){
  const {state,dispatch}=useStore();
  const [input,setInput]=React.useState(''),[reuse,setReuse]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  const [s,setSettings]=React.useState({size:'portrait',count:'',cover:true,outro:true,numbers:false,logo:true,handles:true,swipe:true,cta:'save'});
  const set=(key,value)=>setSettings(prev=>({...prev,[key]:value}));
  const create=async()=>{
    if(!input.trim()){setError('Add your words first.');return;}
    setBusy(true);setError('');
    try{
      await Promise.all([document.fonts.load('600 76px "Cormorant Garamond"'),document.fonts.load('400 46px "Montserrat"'),document.fonts.load('500 30px "Montserrat"')]);let text=input;
      if(reuse){const r=await aiRepurposeAll({brand:state.brand,vocab:state.vocab,input,platforms:['instagram-carousel'],counts:{'instagram-carousel':s.count?+s.count-(s.outro?1:0):7},provider:'gemini'});text=r['instagram-carousel']||'';}
      if(!text.trim())throw new Error('No text was returned. Try without AI.');
      const canvases=createSimpleCanvases(text,s,state.brand);
      dispatch({type:'create-project',project:{id:uid(),name:text.trim().split('\n')[0].slice(0,50),createdAt:now(),updatedAt:now(),thumbnail:null,projectType:'carousel',canvases,activeCanvasId:canvases[0].id,carouselSettings:s,sourceText:input}});
    }catch(e){setError(e.message||'Could not create slides.');}finally{setBusy(false);}
  };
  return <div className="sc-shell"><SimpleStudioStyles/><SimpleCarouselStyles/><style>{`.final-options{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.final-options label{display:flex;gap:8px;align-items:center}.final-options input{width:20px;height:20px}.final-count{display:flex;gap:12px;align-items:center;margin-top:18px}.final-count select{font-size:16px;padding:10px;max-width:70%}`}</style>
    <header className="sc-header"><button className="sc-back" onClick={()=>dispatch({type:'set-view',view:'home'})}>← Home</button><div><strong>Create a carousel</strong><small>Text → Canvas → Download</small></div></header>
    <main className="sc-main"><div className="sc-inner"><section className="sc-panel"><h2>Your words</h2><textarea aria-label="Your carousel text" className="sc-source" value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste your words. Blank lines separate slides when count is Auto."/><div className="sc-row"><button className="sc-link" onClick={()=>setInput(getExampleText())}>Try example</button><button className="sc-link" onClick={()=>setInput('')}>Clear</button></div><label><input type="checkbox" checked={reuse} onChange={e=>setReuse(e.target.checked)}/> Reuse / improve with AI (optional)</label></section>
    <section className="sc-panel"><h2>Carousel settings</h2><div className="sc-aspects">{[['post','Square · 1:1','1080 × 1080'],['portrait','Portrait · 4:5','1080 × 1350']].map(([id,label,size])=><button key={id} aria-current={s.size===id} onClick={()=>set('size',id)}>{label}<small>{size}</small></button>)}</div><label className="final-count">Total slides<select aria-label="Total slides" value={s.count} onChange={e=>set('count',e.target.value)}><option value="">Auto — my text breaks</option>{Array.from({length:19},(_,i)=>i+2).map(n=><option key={n} value={n}>{n} slides</option>)}</select></label><p className="simple-muted">Includes cover and closing slides. A chosen count divides all your words without removing any.</p><div className="final-options">{[['cover','Cover styling'],['outro','Closing slide'],['numbers','Slide numbers'],['logo','Brand logo'],['handles','Social / website'],['swipe','Swipe hint']].map(([key,label])=><label key={key}><input type="checkbox" checked={s[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}</div>{s.outro&&<label className="final-count">Closing call to action<select aria-label="Closing call to action" value={s.cta||"save"} onChange={e=>set("cta",e.target.value)}><option value="save">Save this for later</option><option value="follow">Follow for cloth pad tips</option><option value="shop">Explore the shop</option><option value="message">Send me a message</option></select></label>}<p className="simple-muted">Hook and closing slides share one colour. Middle slides use white and soft pink. The closing slide always includes your contact details.</p></section>{error&&<p role="alert">{error}</p>}</div></main>
    <footer className="sc-footer"><span>Next: edit your actual slides on the canvas.</span><button className="simple-action" disabled={busy} onClick={create}>{busy?'Creating…':'Create carousel →'}</button></footer>
  </div>;
}
Object.assign(window,{FinalCarouselFlow,createSimpleCanvases,distributeCarouselText});
