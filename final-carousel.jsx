// One creation screen; the saved canvas is the only editing source of truth.
// "# " starts a slide, "## " is a subheading inside it. Phones sometimes turn "#" lines oddly, so only "# " / "## " followed by a space count.
const SLIDE_MARK=/^\s*#(?!#)\s+\S/, SUB_MARK=/^\s*##\s+\S/;
function hasSlideMarks(text){return String(text||'').split('\n').some(l=>SLIDE_MARK.test(l));}
function markedChunks(text){
  const chunks=[];let cur=null;
  for(const line of String(text||'').replace(/\r/g,'').split('\n')){
    if(SLIDE_MARK.test(line)){if(cur!==null&&cur.trim())chunks.push(cur);cur=line.replace(/^\s*#\s+/,'');}
    else cur=cur===null?(line.trim()?line:null):cur+'\n'+line;
  }
  if(cur!==null&&cur.trim())chunks.push(cur);
  return chunks.map(c=>c.replace(/\s+$/,''));
}
function distributeCarouselText(text, count, keepCover=false) {
  const chunks=text.trim().split(/\n\s*---+\s*\n/).filter(s=>s.trim()); // blank lines no longer split slides; use # marks
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
  {id:'gentle',name:'Soft & gentle',description:'Softer type for personal stories and reassuring tips.',bg:'#F1CFEA',ink:'#2A1F2A',size:108,italic:true},
  {id:'informative',name:'Neat & informative',description:'A colour-block heading with room for helpful details.',bg:'#F1CFEA',ink:'#2A1F2A',size:100,split:true},
  {id:'colourful',name:'Bold & colourful',description:'Rich plum and contrasting type for announcements.',bg:'#7d2960',ink:'#FDFBFC',size:112},
  // Occasion styles: colours plus ready-made cover and closing words. Your own words become the slides in between.
  {id:'order',name:'Custom order',description:'Cover and closing words are filled in for a custom order. Add the details in between.',bg:'#E8B8DC',ink:'#2A1F2A',size:104,kit:{label:'CUSTOM ORDER',cover:{title:"This week's custom order",body:'Made by hand for one special person.'},cta:'order'}},
  {id:'newhome',name:'Off to a new home',description:'Cover and closing words are filled in for a pad going to its new owner.',bg:'#D98BC6',ink:'#2A1F2A',size:108,kit:{label:'NEW HOME',cover:{title:'Off to its new home',body:'Another handmade set is on its way.'},cta:'thanks'}},
  {id:'popup',name:'Pop-up & events',description:'A deep sage green that stands out. Cover and closing words are filled in for an event.',bg:'#4F6B53',ink:'#FDFBFC',size:108,kit:{label:'POP-UP',cover:{title:'Come say hello',body:'Wonder Pads is popping up near you.'},cta:'visit'}},
];
const CAROUSEL_CTA_CHOICES = {
  save:{title:'Save this for later',body:'Keep these tips handy for when you need them.',icon:'bookmark',label:'Save'},
  share:{title:'Share this with a friend',body:'Pass this on to someone who would find it helpful.',icon:'share',label:'Share'},
  follow:{title:'Follow for cloth pad tips',body:'Practical tips and handmade updates for your flow.',icon:'user_plus',label:'Follow'},
  shop:{title:'Explore the shop',body:'Find handmade cloth pads at wonder-pads.com.',icon:'shop',label:'Shop'},
  message:{title:'Send me a message',body:'Have a question? Message @ecoclothpad on Instagram.',icon:'chat',label:'Message'},
  order:{title:'Want something made just for you?',body:'Message @ecoclothpad about a custom order.',icon:'chat',label:'Custom order'},
  thanks:{title:'Thank you for choosing handmade',body:'Every pad is made by hand. Message @ecoclothpad any time.',icon:'chat',label:'Thank you'},
  visit:{title:'See you there!',body:'Questions before then? Message @ecoclothpad.',icon:'chat',label:'Visit us'},
};
function endpointSlide(kind,heading,body,label,s,brand,W,H){
  const pair=CAROUSEL_STYLE_PAIRS.find(p=>p.id===s.pair)||CAROUSEL_STYLE_PAIRS[0];
  const c={id:uid(),name:kind==='hook'?'Cover':'Closing slide',slideKind:kind,stylePair:pair.id,w:W,h:H,bg:{type:'color',value:pair.bg},elements:[]};
  const els=c.elements,m=86;
  const addText=(role,text,y,size,w=W-2*m,align='left',x=m,extra={})=>{
    if(!text)return null;
    const style=role==='heading'?'h1':role==='label'?'label':'body';
    const el=newElement('text',{...SLIDE_TEXT_STYLES[style],textStyle:style,__role:role,text,x,y,w,fontSize:Math.round(size*(s.textScale||1)),align,color:pair.ink,...extra});
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
    if(s.logo)els.push(...brandBackgroundElements('hook',c,brand));
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
  const kit=(CAROUSEL_STYLE_PAIRS.find(p=>p.id===s.pair)||{}).kit,kitCover=!!(kit&&s.cover);
  const marked=hasSlideMarks(text);
  const chunks=marked?markedChunks(text):distributeCarouselText(text,s.count?Math.max(1,Number(s.count)-(s.outro?1:0)-(kitCover?1:0)):0,kitCover?false:s.cover);
  const result=chunks.map((chunk,i)=>{
    const cover=s.cover&&!kitCover&&i===0,els=[];
    if(cover){
      const lines=chunk.trim().replace(/^\s*##\s+/gm,'').split('\n'),tag=lines[0].match(/^([^:\n]{1,32}):\s*(.+)$/);
      return endpointSlide('hook',tag?tag[2]:lines[0],lines.slice(1).join('\n').trim(),tag?tag[1]:(s.hookLabel||''),s,brand,W,H);
    }
    const add=(role,words,y,align='left',extra={})=>{
      if(!words)return null;
      const textStyle=role==='heading'?(cover?'h1':'h2'):role==='number'?'label':role==='sub'?'h2':'body';
      const el=newElement('text',{text:words,x:86,y,w:908,...SLIDE_TEXT_STYLES[textStyle],textStyle,align,color:'#2A1F2A',__role:role,...extra});
      delete el.label;el.h=textLayout(el).height;els.push(el);return el;
    };
    const lines=chunk.trim().split('\n'),heading=lines[0].replace(/^[A-Z][A-Z0-9 ·-]{2,20}:\s+/,''),body=lines.slice(1).join('\n').trim();
    if(s.numbers&&!cover)add('number',String(i+1).padStart(2,'0'),65);
    const title=add('heading',heading,cover?Math.round(H*.25):160);
    if(marked&&/^\s*##\s+/m.test(body)){
      let y=title?title.y+title.h+42:160,buf=[];
      const flush=()=>{const t=buf.join('\n').trim();buf=[];if(t){const e=add('body',t,y);if(e)y=e.y+e.h+34;}};
      for(const line of body.split('\n')){
        if(SUB_MARK.test(line)){flush();const e=add('sub',line.replace(/^\s*##\s+/,''),y,'left',{fontSize:58});if(e)y=e.y+e.h+18;}
        else buf.push(line);
      }
      flush();
    }else add('body',body,title?title.y+title.h+42:160);
    const canvas={id:uid(),name:cover?'Cover':`Slide ${i+1+(kitCover?1:0)}`,slideKind:cover?'hook':'content',w:W,h:H,bg:{type:'color',value:cover?accent:(i%2?'#FDFBFC':'#FBF0F7')},elements:els};
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
  if(kitCover)result.unshift(endpointSlide('hook',kit.cover.title,kit.cover.body,s.hookLabel||'',s,brand,W,H));
  if(s.outro){
    const choice=CAROUSEL_CTA_CHOICES[s.cta]||CAROUSEL_CTA_CHOICES.save;
    result.push(endpointSlide('cta',choice.title,choice.body,'YOUR NEXT STEP',s,brand,W,H));
  }
  return result;
}
function CarouselPairPicker({settings,onChange,brand}){
  const [ready,setReady]=React.useState(false);
  React.useEffect(()=>{let live=true;Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('italic 400 108px "Cormorant Garamond"'),document.fonts.load('400 42px "Montserrat"')]).then(()=>{if(live)setReady(true);});return()=>{live=false;};},[]);
  return <section className="sc-panel"><h2>Choose your first &amp; last slide style</h2><p className="simple-muted">A matching opening + closing pair. Middle slides stay soft pink and white. Custom order, new home and pop-up styles fill in the cover and closing words for you, so your text becomes the slides in between.</p><div className="pair-options" role="group" aria-label="Opening and closing slide style">{CAROUSEL_STYLE_PAIRS.map(pair=>{
    const p={...settings,pair:pair.id,cover:true,outro:true,count:'',swipe:false,hookLabel:pair.kit?pair.kit.label:'YOUR STORY'};
    const hook=endpointSlide('hook',pair.kit?pair.kit.cover.title:'A little comfort, made for you.',pair.kit?pair.kit.cover.body:'Handmade cloth pads for your everyday rhythm.',p.hookLabel,p,brand,1080,settings.size==='portrait'?1350:1080);
    const action=CAROUSEL_CTA_CHOICES[pair.kit?pair.kit.cta:settings.cta]||CAROUSEL_CTA_CHOICES.save;
    const close=endpointSlide('cta',action.title,action.body,'YOUR NEXT STEP',p,brand,1080,hook.h);
    return <button type="button" key={pair.id} className="pair-option" aria-pressed={(settings.pair||'clear')===pair.id} onClick={()=>{onChange('pair',pair.id);if(pair.kit){onChange('hookLabel',pair.kit.label);onChange('cta',pair.kit.cta);}}}><strong>{pair.name}</strong><span>{pair.description}</span><div className="pair-samples" aria-hidden="true"><div><MiniPreview canvas={hook} maxW={100} maxH={120}/><small>Opening</small></div><div><MiniPreview canvas={close} maxW={100} maxH={120}/><small>Closing</small></div></div></button>;
  })}</div><label className="final-count">What should readers do next?<select aria-label="What should readers do next?" value={settings.cta||'save'} onChange={e=>onChange('cta',e.target.value)}>{Object.entries(CAROUSEL_CTA_CHOICES).map(([id,c])=><option key={id} value={id}>{c.label}</option>)}</select></label><label className="final-count">Small hook label (optional)<input aria-label="Small hook label" type="text" maxLength="32" value={settings.hookLabel||''} onChange={e=>onChange('hookLabel',e.target.value)} placeholder="e.g. CLOTH PAD TIPS"/></label>{(!settings.cover||!settings.outro)&&<p className="simple-muted">The pair applies to the opening and closing slides you enable above.</p>}</section>;
}

// Turns the carousel draft (state.carousel.slides) into a saved project and opens it.
// If the draft already has a saved project, opens that instead. Falls back to the Create form only if there is nothing to build.
function makeCarouselProject(carousel,brand){
  const canvases=buildCarouselCanvases(carousel,brand);
  if(!canvases.length)return null;
  const slides=carousel.slides||[];
  return {id:uid(),name:(slides.find(s=>s.kind!=='outro')?.heading||'My carousel').slice(0,50),createdAt:now(),updatedAt:now(),thumbnail:null,projectType:'carousel',canvases,activeCanvasId:canvases[0].id};
}
function openCarouselDraft(state,dispatch,carouselOverride){
  const c=carouselOverride||state.carousel;
  const existing=state.projects.find(p=>p.id===c.simpleProjectId);
  if(existing){dispatch({type:'open-project',id:existing.id});return true;}
  const project=makeCarouselProject(c,state.brand);
  if(!project){dispatch({type:'set-view',view:'carousel'});return false;}
  dispatch({type:'create-project',project});
  dispatch({type:'update-carousel',patch:{simpleProjectId:project.id}});
  return true;
}

function FinalCarouselFlow(){
  const {state,dispatch}=useStore();
  const [draft]=React.useState(()=>{try{return JSON.parse(sessionStorage.getItem('wpr-social-create-draft')||'{}');}catch{return {};}});
  const [input,setInput]=React.useState(draft.input||''),[reuse,setReuse]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
  React.useEffect(()=>{try{sessionStorage.setItem('wpr-social-create-draft',JSON.stringify({input}));}catch{}},[input]);
  const srcRef=React.useRef(null);
  const markLine=prefix=>{
    const ta=srcRef.current;if(!ta)return;
    const pos=ta.selectionStart??input.length,start=input.lastIndexOf('\n',pos-1)+1;
    let end=input.indexOf('\n',pos);if(end<0)end=input.length;
    const line=input.slice(start,end),clean=line.replace(/^\s*#{1,2}\s*/,'');
    const next=line.startsWith(prefix)?clean:prefix+clean;
    const out=input.slice(0,start)+next+input.slice(end);setInput(out);
    const caret=start+next.length;
    requestAnimationFrame(()=>{try{ta.focus();ta.setSelectionRange(caret,caret);}catch{}});
  };
  const clearMarks=()=>setInput(input.replace(/^[ \t]*#{1,2}[ \t]+/gm,''));
  const slideCount=hasSlideMarks(input)?markedChunks(input).length:0;
  const [format,setFormat]=React.useState('carousel'),[layout,setLayout]=React.useState(0);
  const postLayouts=STARTER_TEMPLATES.filter(t=>t.name.startsWith('Big text'));
  const [connection,setConnection]=React.useState(''),[checking,setChecking]=React.useState(false);
  const checkConnection=async()=>{setChecking(true);setConnection('');try{const r=await fetch('/api/gemini?test=1');const p=await r.json();if(!p.configured)setConnection(p.error||'Gemini is not connected.');else if(p.tests)setConnection(p.tests.map(t=>`${t.model}: ${t.ok?'works':`error ${t.status} — ${t.message}`}`).join(' | '));else setConnection('Key found. Generation will check access.');}catch{setConnection('The AI server is unavailable here. Use the deployed app.');}finally{setChecking(false);}};
  const [s,setSettings]=React.useState({size:'portrait',count:'',cover:true,outro:true,numbers:false,logo:true,handles:true,swipe:true,cta:'save',pair:'clear'});
  const set=(key,value)=>setSettings(prev=>({...prev,[key]:value}));
  const create=async()=>{
    if(!input.trim()){setError('Add your words first.');return;}
    setBusy(true);setError('');
    try{
      await Promise.all([document.fonts.load('600 112px "Cormorant Garamond"'),document.fonts.load('italic 400 108px "Cormorant Garamond"'),document.fonts.load('400 46px "Montserrat"'),document.fonts.load('500 30px "Montserrat"')]);let text=input;
      if(format==='post'){
        const t=postLayouts[layout]||postLayouts[0];
        let words=input.trim();
        if(reuse){try{words=(await aiComplete({provider:'gemini',messages:[{role:'system',content:buildBrandContext(state.brand,state.vocab)},{role:'user',content:'Turn this into ONE single Instagram post slide. Return a short punchy headline (max 8 words) on the first line, then a blank line, then one or two short supporting lines. No hashtags, no bullets.\n\n'+input}]})).trim()||words;}catch(e){setError('AI could not finish: '+e.message+'. Used your original words.');}}
        let head,rest;
        if(hasSlideMarks(words)){const ch=markedChunks(words)[0]||words,ls=ch.replace(/^\s*##\s+/gm,'').split('\n');head=ls[0].trim();rest=ls.slice(1).join('\n').trim();}
        else{const parts=words.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);head=parts[0]||words;rest=parts.slice(1).join('\n');}
        const p=newProject(head.split('\n')[0].slice(0,50),t.preset,t.els.map(e=>({type:e.type,patch:e.patch})));
        const c=p.canvases[0];c.bg={type:'color',value:t.bg};
        const texts=c.elements.filter(e=>e.type==='text').sort((a,b)=>b.fontSize-a.fontSize);
        if(texts[0])texts[0].text=head;
        const small=c.elements.filter(e=>e.type==='text'&&e!==texts[0]).pop();
        if(small&&rest)small.text=rest;
        p.activeCanvasId=c.id;p.sourceText=input;
        dispatch({type:'create-project',project:p});
        try{sessionStorage.removeItem('wpr-social-create-draft');}catch{}
        return;
      }
      let aiError='';
      if(reuse){
        try{
          const r=await aiRepurposeAll({brand:state.brand,vocab:state.vocab,input,platforms:['instagram-carousel'],counts:{'instagram-carousel':s.count?+s.count-(s.outro?1:0):7},provider:'gemini'});
          if(!r['instagram-carousel']?.trim())throw new Error('Gemini returned no carousel text.');
          text=r['instagram-carousel'];if(!hasSlideMarks(text))text=text.split(/\n\s*\n/).filter(b=>b.trim()).map(b=>'# '+b.trim()).join('\n\n');
        }catch(e){text=input;aiError=`AI could not finish: ${e.message}. Your carousel was created from your original words instead.`;}
      }
      if(!text.trim())throw new Error('No text was returned. Try without AI.');
      const canvases=createSimpleCanvases(text,s,state.brand);
      dispatch({type:'create-project',project:{id:uid(),name:text.trim().split('\n')[0].replace(/^#{1,2}\s+/,'').slice(0,50),createdAt:now(),updatedAt:now(),thumbnail:null,projectType:'carousel',canvases,activeCanvasId:canvases[0].id,carouselSettings:s,sourceText:input,aiError}});
      try{sessionStorage.removeItem('wpr-social-create-draft');}catch{}
    }catch(e){setError(e.message||'Could not create slides.');}finally{setBusy(false);}
  };
  const aiCheck=<div style={{marginTop:12}}><button className="sc-link" disabled={checking} onClick={checkConnection}>{checking?'Checking…':'Check Gemini connection'}</button>{connection&&<p role="status">{connection}</p>}</div>;
  return <div className="sc-shell"><SimpleStudioStyles/><SimpleCarouselStyles/><style>{`.final-options{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.final-options label{display:flex;gap:8px;align-items:center}.final-options input{width:20px;height:20px}.final-count{display:flex;gap:12px;align-items:center;margin-top:18px}.final-count select{font-size:16px;padding:10px;max-width:70%} .pair-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.pair-option{border:1px solid #dfcbd9;border-radius:12px;background:#fff;padding:16px;text-align:left;color:#2A1F2A;min-width:0}.pair-option[aria-pressed=true]{border:2px solid #963d80;background:#fcf1f8}.pair-option strong{display:block;font-size:17px}.pair-option>span{display:block;font-size:13px;line-height:1.5;margin:8px 0}.pair-samples{display:flex;gap:12px;justify-content:center;align-items:flex-start}.pair-samples small{display:block;margin-top:6px;text-align:center}.final-count input{min-width:0;padding:10px;font-size:16px;max-width:60%}@media(max-width:500px){.pair-options{grid-template-columns:1fr}.final-count{flex-wrap:wrap}.final-count select,.final-count input{max-width:100%}}`}</style>
    <header className="sc-header"><button className="sc-back" onClick={()=>dispatch({type:'set-view',view:'home'})}>← Home</button><div><strong>Create</strong><small>Text → Canvas → Download</small></div></header>
    <main className="sc-main"><div className="sc-inner"><section className="sc-panel"><h2>Your words</h2><div className="mark-ribbon" role="toolbar" aria-label="Mark slides"><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>markLine('# ')}>+ Slide</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>markLine('## ')}>+ Subheading</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={clearMarks}>Clear marks</button><span>{slideCount?`${slideCount} slide${slideCount===1?'':'s'} marked`:'Tap a line, then + Slide'}</span></div><textarea ref={srcRef} aria-label="Your carousel text" className="sc-source" value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste your words. Tap a line and press + Slide to start a slide there. Blank lines stay inside the slide. Text with no marks becomes one slide."/><div className="sc-row"><button className="sc-link" onClick={()=>setInput(getExampleText())}>Try example</button><button className="sc-link" onClick={()=>setInput('')}>Clear</button></div><label><input type="checkbox" checked={reuse} onChange={e=>setReuse(e.target.checked)}/> Reuse / improve with AI (optional)</label>{aiCheck}</section>
    <section className="sc-panel"><h2>What do you want to make?</h2><div className="sc-aspects">{[['carousel','Carousel','Several slides'],['post','Single post','One slide']].map(([id,label,sub])=><button key={id} aria-current={format===id} onClick={()=>setFormat(id)}>{label}<small>{sub}</small></button>)}</div>{format==='post'&&<><p className="simple-muted">First paragraph becomes the big headline. A second paragraph becomes the smaller line. Pick a look:</p><div className="tile-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))'}}>{postLayouts.map((t,i)=><button key={t.name} className="tile" aria-current={layout===i} onClick={()=>setLayout(i)}><div className="frame"><MiniPreview canvas={{...defaultCanvas(t.name,t.preset),bg:{type:'color',value:t.bg},elements:t.els.map(e=>newElement(e.type,e.patch))}} maxW={150} maxH={188}/></div><h3>{t.name.replace('Big text · ','')}</h3></button>)}</div></>}</section>
    {format==='carousel'&&<details className="sc-panel"><summary><strong>Carousel options</strong> (size, slides, extras — optional)</summary><section className="sc-panel"><h2>Carousel settings</h2><div className="sc-aspects">{[['post','Square · 1:1','1080 × 1080'],['portrait','Portrait · 4:5','1080 × 1350']].map(([id,label,size])=><button key={id} aria-current={s.size===id} onClick={()=>set('size',id)}>{label}<small>{size}</small></button>)}</div><label className="final-count">Total slides<select aria-label="Total slides" value={s.count} onChange={e=>set('count',e.target.value)}><option value="">Auto — my text breaks</option>{Array.from({length:19},(_,i)=>i+2).map(n=><option key={n} value={n}>{n} slides</option>)}</select></label><p className="simple-muted">{slideCount?"You marked slides with #, so the slide count follows your marks. ":""}Includes cover and closing slides. A chosen count divides all your words without removing any.</p><div className="final-options">{[['cover','First slide / hook'],['outro','Closing slide'],['numbers','Slide numbers'],['logo','Brand logo'],['handles','Social / website'],['swipe','Swipe hint']].map(([key,label])=><label key={key}><input type="checkbox" checked={s[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}</div><p className="simple-muted">Hook and closing slides share one colour. Middle slides use white and soft pink. The closing slide always includes your contact details.</p></section><CarouselPairPicker settings={s} onChange={set} brand={state.brand}/></details>}{error&&<p role="alert">{error}</p>}
    </div></main>
    <footer className="sc-footer"><span>Create slides only when you’re ready.</span><button className="simple-action" disabled={busy} onClick={create}>{busy?'Creating…':(format==='post'?'Create post →':'Create carousel →')}</button></footer>
  </div>;
}
// Sample text for the "Try example" button, and the shared styles for the carousel screen.
function getExampleText() {
  return "# Why choose cloth pads?\nSofter on your skin and kinder to the planet.\n\n# Day 3 is different\nYou will not want the same absorbency every day, so we make light, medium and heavy.\n\n## Less waste\nOne set replaces hundreds of disposables.\n\n# Try one this cycle\nMessage us on WhatsApp and we will help you pick." ||
    `THE GUIDE: Your first reusable pad, without the overwhelm

Getting started with reusable pads

Everything you need to know before your first cycle with reusables. Simple, gentle, effective.

---

TIP 01: Start with your usual flow

Track a single cycle with the pads you already own.

TIP 02: Build a rotation of three

Two absorbencies, one liner. Wash, rotate, repeat.

TIP 03: Rinse cold, then wash warm

Cold water first to protect the fibers.

TIP 04: Air-dry, always

Skip the dryer to keep the wings crisp.`;
}
function SimpleCarouselStyles() { return <style>{`
  .mark-ribbon{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0;margin:-4px 0 8px;background:#fff}.mark-ribbon button{border:0;border-radius:999px;padding:10px 14px;background:#f3dced;color:#893773;font:600 14px inherit;font-family:inherit;min-height:40px}.mark-ribbon span{font-size:12px;color:#826d7e;margin-left:auto}.sc-source{min-height:220px}
  .sc-shell{height:var(--studio-viewport-height,100dvh);display:flex;flex-direction:column;background:#fcf3fa;color:#2a1f2a;overflow:hidden}.sc-header{height:68px;padding:0 24px;background:#fff;border-bottom:1px solid #eadbe6;display:flex;align-items:center;gap:18px;flex-shrink:0}.sc-header>div{flex:1}.sc-header strong{display:block;font:22px 'DM Serif Display',serif}.sc-header small{color:#846f7f}.sc-back,.sc-link{border:0;background:transparent;color:#8f3d7b;padding:8px;font:inherit}.sc-main{flex:1;overflow:auto;padding:24px}.sc-inner{max-width:880px;margin:auto;display:grid;gap:16px}.sc-panel{background:#fff;border:1px solid #eadbe6;border-radius:18px;padding:22px}.sc-stage{display:flex;gap:12px;align-items:flex-start}.sc-stage>span{width:28px;height:28px;border-radius:50%;background:#f2d8ea;color:#913e7d;display:grid;place-items:center;font-weight:700;flex-shrink:0}.sc-stage h1,.sc-stage h2{font:24px 'DM Serif Display',serif;margin:0}.sc-stage p{margin:3px 0 14px;color:#7b6675;font-size:13px}.sc-source-tabs{display:flex;gap:6px;margin:4px 0 10px}.sc-source-tabs button{border:0;padding:10px 14px;border-radius:10px;background:#f8edf5;color:#6d5968}.sc-source-tabs button[aria-current=true]{background:#efd1e7;color:#883672}.sc-source{width:100%;min-height:140px;box-sizing:border-box;border:1px solid #decbd9;border-radius:12px;padding:14px;font:15px/1.55 inherit;resize:vertical}.sc-row{display:flex;align-items:center;gap:8px;margin-top:10px}.sc-wrap{flex-wrap:wrap}.sc-aspects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sc-aspects button{padding:14px;border-radius:12px;border:1px solid #eadbe6;background:#fdf8fb;color:#493a45;text-align:left}.sc-aspects button[aria-current=true]{border:2px solid #b54b98;background:#f4dced;color:#84336f}.sc-aspects small{display:block;margin-top:3px;color:#846f7f}.sc-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.sc-slides{display:grid;gap:14px;margin-top:8px}.sc-slide{position:relative;border:1px solid #e4d5df;border-radius:16px;padding:18px;background:#fff}.sc-slide-head{display:flex;align-items:center;gap:8px;margin-bottom:15px}.sc-grip{color:#cbb6c5;cursor:grab}.sc-kind{font-size:10px;font-weight:700;background:#4e7f53;color:#fff;border-radius:5px;padding:2px 7px}.sc-dots{margin-left:auto;border:0;background:transparent;font-size:24px;line-height:1;padding:3px 8px}.sc-menu{position:absolute;right:18px;top:48px;z-index:5;background:#fff;border:1px solid #decbd9;border-radius:12px;padding:6px;box-shadow:0 12px 28px rgba(50,25,44,.16);width:205px}.sc-menu button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:10px;border-radius:8px;color:#493a45}.sc-menu button:hover{background:#faedf6}.sc-menu button:disabled{opacity:.35}.sc-menu .danger{color:#c52852;border-top:1px solid #eadbe6}.sc-slide label{display:block;text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:#8b7685;margin:12px 0 5px}.sc-slide input,.sc-slide textarea{display:block;width:100%;box-sizing:border-box;border:1px solid #decbd9;border-radius:12px;padding:12px 14px;color:#2a1f2a;background:#fff;font:16px/1.45 inherit;text-transform:none;letter-spacing:normal}.sc-slide input{font-size:18px;font-weight:650}.sc-slide textarea{min-height:105px;resize:vertical}.sc-outro,.sc-empty{padding:18px;border-radius:12px;background:#fbf3f9;color:#806a79}.sc-message,.sc-busy{color:#8e3979;font-size:13px}.sc-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 24px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #eadbe6;flex-shrink:0;color:#7b6675;font-size:13px}
  @media(max-width:640px){.sc-header{height:auto;padding:10px 12px;gap:8px}.sc-header strong{font-size:17px}.sc-header small,.sc-header>.simple-action{display:none}.sc-back{font-size:12px;padding:5px}.sc-main{padding:12px}.sc-panel{padding:15px;border-radius:14px}.sc-stage h1,.sc-stage h2{font-size:20px}.sc-source-tabs{display:grid;grid-template-columns:1fr 1fr}.sc-source-tabs button{padding:9px 6px;font-size:12px}.sc-aspects{grid-template-columns:1fr 1fr}.sc-section-head{display:block}.sc-slide{padding:14px}.sc-slide input{font-size:16px}.sc-slide textarea{min-height:92px}.sc-footer{padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px))}.sc-footer span{display:none}.sc-footer .simple-action{width:100%}}
`}</style>; }
Object.assign(window,{FinalCarouselFlow,createSimpleCanvases,distributeCarouselText,makeCarouselProject,openCarouselDraft,getExampleText,SimpleCarouselStyles});
