// Content is prepared once. Designs only arrange these blocks; no AI or splitting in rendering.
const CONTENT_LOOKS = [
  {id:'gentle',name:'Soft blush',family:'Floral',bg:'#F1CFEA',ink:'#78265F',accent:'#849879',layout:'center'},
  {id:'informative',name:'Cream editorial',family:'Editorial',bg:'#FFF9FC',ink:'#78265F',accent:'#D489C3',layout:'editorial'},
  {id:'clear',name:'Plum statement',family:'Bold',bg:'#78265F',ink:'#FFF9FC',accent:'#F1CFEA',layout:'bold'},
  {id:'handmade',name:'Berry frame',family:'Floral',bg:'#2A1F2A',ink:'#F1CFEA',accent:'#D489C3',layout:'frame'},
  {id:'playful',name:'Leafy cream',family:'Floral',bg:'#EEF3EA',ink:'#354C38',accent:'#849879',layout:'center'},
  {id:'colourful',name:'Orchid question',family:'Bold',bg:'#BC5AA6',ink:'#2A1F2A',accent:'#F1CFEA',layout:'bold'},
  {id:'floral-lavender',name:'Lavender',family:'Floral',bg:'#F4EEFA',ink:'#493560',accent:'#7652A3',layout:'center',background:'assets/templates/wonder-pads-poster-template-lavender.png'},
  {id:'floral-peach',name:'Peach',family:'Floral',bg:'#FFF3EC',ink:'#803D2C',accent:'#B2533A',layout:'center',background:'assets/templates/wonder-pads-poster-template-peach.png'},
  {id:'floral-sage',name:'Sage',family:'Floral',bg:'#F2F7F0',ink:'#31513C',accent:'#4B7359',layout:'center',background:'assets/templates/wonder-pads-poster-template-sage.png'},
  {id:'floral-slate-blue',name:'Slate blue',family:'Floral',bg:'#EEF3F8',ink:'#314A65',accent:'#4C6F96',layout:'center',background:'assets/templates/wonder-pads-poster-template-slate-blue.png'},
  {id:'floral-deep-plum',name:'Deep plum',family:'Floral',bg:'#54284A',ink:'#FFFFFF',accent:'#E8C6DF',layout:'center',background:'assets/templates/wonder-pads-poster-template-deep-plum.png'},
];
const contentLook = id => CONTENT_LOOKS.find(l=>l.id===id)||CONTENT_LOOKS[0];
const contentBlock = (role,text) => ({id:uid(),role,text:String(text??'')});
function contentCarouselSlides(slides,settings,selectedLook) {
  if(settings.format==='post'||!slides.length)return slides;
  const choice=CAROUSEL_CTA_CHOICES.generic;
  const isStandard=s=>s.standardCta||(s.blocks[0]?.text===choice.title&&s.blocks.some(b=>b.text===choice.body));
  const existing=slides.find(isStandard);
  const pages=slides.filter(s=>!isStandard(s)).map(s=>s.kind==='cta'?{...s,kind:'content',originalCanvas:s.originalCanvas?{...s.originalCanvas,slideKind:'content',name:'Slide'}:null}:s);
  const cover=pages.find(s=>s.kind==='hook')||pages[0];
  const look=selectedLook||cover?.look||'gentle';
  const cta=existing?{...existing,kind:'cta',standardCta:true,look,
    originalCanvas:existing.look===look&&existing.standardCta?existing.originalCanvas:null}
    :{...contentSlideFromChunk(choice.title+'\n'+choice.body,'cta'),standardCta:true,look,fit:true};
  return [...pages,cta];
}
function contentSlideFromChunk(chunk,kind='content') {
  const lines=chunk.replace(/\r/g,'').split('\n');
  const blocks=[contentBlock('heading',lines.shift()||'')];let body=[];
  const flush=()=>{if(body.length){blocks.push(contentBlock('body',body.join('\n')));body=[];}};
  for(const line of lines){if(SUB_MARK.test(line)){flush();blocks.push(contentBlock('sub',line.replace(/^\s*##\s+/,'')));}else body.push(line);}
  flush();return {id:uid(),kind,blocks};
}
function prepareContentSlides(source,settings) {
  if(!source.trim())throw new Error('Add your words first.');
  let chunks;
  if(settings.format==='post')chunks=[source.replace(/^\s*#\s+/gm,'')];
  else if(hasSlideMarks(source))chunks=markedChunks(source);
  else if(settings.split==='paragraphs')chunks=source.replace(/\r/g,'').split(/\n\s*\n/).filter(s=>s.trim());
  else if(settings.split==='balanced')chunks=distributeCarouselText(source,Number(settings.count)||4);
  else chunks=[source];
  return contentCarouselSlides(chunks.map((text,i)=>({...contentSlideFromChunk(text,settings.format==='post'?'post':i===0&&settings.cover?'hook':'content'),look:i===0?'gentle':'informative',sourceIndex:i,contentTone:Math.max(0,i-(settings.cover?1:0))%3})),settings);
}
function contentDraftNew(source='') {
  return {id:uid(),source,slides:[],settings:{size:'portrait',format:'carousel',split:'markers',count:4,cover:true,closing:true},index:0,caption:'',returnView:'home',updatedAt:now()};
}
function contentSlidesSource(slides,settings) {
  return slides.filter(s=>!s.standardCta).map(s=>{
    const words=s.blocks.map(b=>(b.role==='sub'?'## ':'')+b.text).join('\n');
    return (settings.format==='post'?'':'# ')+words;
  }).join('\n\n');
}
function contentDraftFromPost(post) {
  let slides=readyPostSlides(post);
  if(!slides.length){
    const raw=post.layout==='poster'||post.layout==='bigtext'||post.includeFullText===false?post.imageText||post.title:post.caption||post.imageText||post.title;
    const lines=String(raw||'').replace(/ \/ /g,'\n').split('\n');
    slides=[{title:lines.shift()||post.title,body:lines.join('\n')}];
  }
  const draft=contentDraftNew();
  const prepared={...draft,name:post.title,contentEntryId:post.id,caption:[post.caption,post.hashtags].filter(Boolean).join('\n\n'),footerLine:post.footerLine||'',returnView:'ready-content',
    settings:{...draft.settings,size:post.defaultSize||'portrait',format:slides.length===1?'post':'carousel'},
    slides:slides.map((s,i)=>{const slide=contentSlideFromChunk(s.title+'\n'+(s.body||''),slides.length===1?'post':i===0?'hook':'content');if(i===0&&post.footerLine)slide.blocks.push(contentBlock('body',post.footerLine));return {...slide,look:i===0?contentLook(post.stylePair).id:'informative',sourceIndex:i,contentTone:Math.max(0,i-1)%3,photo:!!s.photo};}),
    source:slides.map(s=>'# '+s.title+'\n'+(s.body||'')).join('\n\n')};
  return {...prepared,appliedSource:prepared.source,slides:contentCarouselSlides(prepared.slides,prepared.settings)};
}
function isContentText(e) {
  return e.type==='text'&&!e.fromBrand&&!e.brandSlot&&!e.engagementAction&&!['swipe','number','counter','brandName','shopName','handles','logo','engagementLabel'].includes(e.__role)&&!e.endpointDecoration;
}
function contentDraftFromProject(project) {
  const draft=contentDraftNew(project.sourceDraft??project.sourceText??'');
  const result={...draft,projectId:project.id,name:project.name,caption:project.caption||'',returnView:'editor',
    index:Math.max(0,project.canvases.findIndex(c=>c.id===project.activeCanvasId)),
    settings:{...draft.settings,size:project.canvases[0]?.h===1080?'post':'portrait',format:project.canvases.length===1?'post':'carousel',...(project.carouselSettings?{split:project.carouselSettings.count?'balanced':'markers',count:project.carouselSettings.count||4,cover:!!project.carouselSettings.cover,closing:!!project.carouselSettings.outro}:{}),...project.contentWorkspaceSettings},
    slides:project.canvases.map((c,i)=>({id:c.id,kind:c.slideKind||'content',standardCta:!!c.standardCta,look:c.contentLook||'gentle',sourceIndex:i,contentTone:c.contentTone||0,originalCanvas:c,
      blocks:c.elements.filter(isContentText).slice().sort((a,b)=>a.y-b.y||a.x-b.x).map(e=>({id:e.contentBlockId||e.id,role:e.__role==='heading'?'heading':e.__role==='sub'?'sub':'body',text:e.text,hidden:!!e.hidden})),
      // Keep user-added photos, shapes and illustrations when restyling a saved canvas.
      assets:c.elements.filter(e=>e.type!=='text'&&!e.fromBrand&&!e.endpointDecoration&&!e.contentDecoration&&!e.engagementAction&&!e.brandSlot)
    }))};
  const applied=project.generatedSourceText??project.sourceText??'';
  const saved=project.sourceDraft??applied,current=contentSlidesSource(result.slides,result.settings);
  let expected='';
  try{expected=contentSlidesSource(prepareContentSlides(applied,result.settings),result.settings);}catch{}
  const canvasChanged=current!==expected;
  // Preserve an unapplied source draft; otherwise reflect the latest canvas words.
  return {...result,source:saved!==applied?saved:canvasChanged?current:saved,appliedSource:canvasChanged?current:applied};
}
function renderContentSlide(slide,settings,brand,options={}) {
  if(slide.originalCanvas&&!options.force)return applyBrandSlideFonts(slide.originalCanvas,brand);
  const standard=!!slide.standardCta;
  const look=contentLook(options.look||slide.look),W=1080,H=settings.size==='post'?1080:1350;
  const middle=slide.kind==='content'&&!standard&&(options.slideNumber??((slide.sourceIndex??1)+1))>1,floralBackground=!!look.background&&!standard&&!middle;
  const background=middle&&look.id==='informative'?['#FFF9FC','#FCF8F2','#F5F8F3'][slide.contentTone||0]:look.bg;
  const c={id:slide.id,name:slide.kind==='hook'?'Cover':slide.kind==='cta'?'Closing slide':'Slide',slideKind:slide.kind,standardCta:standard,contentLook:look.id,contentTone:slide.contentTone||0,w:W,h:H,bg:{type:'color',value:background},elements:[]};
  const els=c.elements,m=86,top=standard?100:slide.kind==='content'?130:floralBackground?180:Math.max(180,102+Math.max(48,Math.min(180,Number(brand.coverLogoSize)||88))),bottom=floralBackground?H*1153/1350-34:H-(standard?380:210);
  if(floralBackground){
    // Fit the complete uploaded artwork, including its footer, in either ratio.
    const width=H*1080/1350;
    els.push(newElement('image',{src:look.background,x:(W-width)/2,y:0,w:width,h:H,locked:true,fromBrand:true,contentDecoration:true}));
  }
  const shape=(type,patch)=>els.push(newElement(type,{...patch,contentDecoration:true}));
  if(standard||(!middle&&look.layout==='frame'))shape('rect',{x:30,y:30,w:W-60,h:H-60,fill:'transparent',stroke:look.accent,strokeWidth:3,radius:0,contentFrame:true});
  if(!standard&&!middle&&look.layout==='editorial')shape('rect',{x:0,y:H-175,w:W,h:175,fill:look.accent,radius:0});
  const blocks=applyBrandSlideFonts({elements:slide.blocks.map(b=>newElement('text',{...SLIDE_TEXT_STYLES[b.role==='heading'?'h1':b.role==='sub'?'h2':'body'],__role:b.role,contentBlockId:b.id,text:b.text,hidden:!!b.hidden,x:m,y:top,w:W-m*2,fontSize:b.role==='heading'?(slide.kind==='content'?76:124):b.role==='sub'?58:44,
    ...(standard?{fontSize:b.role==='heading'?78:34}:{}),
    fontFamily:!standard&&look.layout==='bold'?'Montserrat':b.role==='body'?'Montserrat':'DM Serif Display',fontWeight:!standard&&look.layout==='bold'&&b.role==='heading'?800:400,
    color:look.ink,align:standard||look.layout==='center'?'center':'left',lineHeight:b.role==='body'?1.4:1.15}))},brand).elements;
  let photoY=top;
  const measure=()=>{let y=top,placedPhoto=false;for(const e of blocks){if(e.hidden)continue;if(slide.photo&&!placedPhoto&&e.__role!=='heading'){photoY=y;y+=Math.round(H*.22)+30;placedPhoto=true;}e.y=y;e.h=textLayout(e).height;y+=e.h+(e.__role==='heading'?40:26);}if(slide.photo&&!placedPhoto){photoY=y;y+=Math.round(H*.22)+30;}return y-26;};
  let end=measure();
  if(standard||floralBackground||slide.fit||options.fit){for(let pass=0;pass<60&&end>bottom;pass++){let changed=false;for(const e of blocks){const next=Math.max(e.__role==='heading'?40:28,Math.floor(e.fontSize*.95));if(next<e.fontSize){e.fontSize=next;changed=true;}}end=measure();if(!changed)break;}}
  if(!standard&&look.layout==='center'&&!slide.photo&&end<=bottom){const dy=(bottom-end)/2;blocks.forEach(e=>e.y+=dy);}
  els.push(...blocks);
  if(slide.photo)shape('rect',{x:m,y:photoY,w:W-m*2,h:Math.round(H*.22),fill:'#E8D8E3',radius:16});
  els.push(...(slide.assets||[]));
  if(standard)els.push(...ctaEngagementElements(c,look.ink));
  const branding=floralBackground?[]:brandBackgroundElements(standard?'content-closing':middle?'content-footer':slide.kind==='hook'?'content-cover':'content-closing',c,brand);
  branding.forEach(e=>{if(e.type==='text')e.color=look.ink;});els.push(...branding);
  if(slide.footerLine)els.push(newElement('text',{text:slide.footerLine,__role:'body',contentBlockId:slide.footerId,x:m,y:H-290,w:W-m*2,fontSize:30,fontFamily:'Montserrat',color:look.ink}));
  return c;
}
function contentOverflow(canvas) {
  return canvas.elements.some(e=>isContentText(e)&&!e.hidden&&(e.y+textLayout(e).height>canvas.h-180||e.x<0||e.x+e.w>canvas.w||e.y<0));
}
function contentSplitSlide(slide) {
  if(slide.standardCta)throw new Error('Keep the standard CTA together. Shorten its text or use Fit text.');
  // Split only at an explicit review action, keeping every character in content blocks.
  const blocks=slide.blocks.map(b=>({...b})),bodyIndex=blocks.findIndex(b=>b.role!=='heading'&&b.text.trim());
  const target=bodyIndex<0?0:bodyIndex,b=blocks[target];if(!b||b.text.length<2)throw new Error('Add more text before splitting this slide.');
  const middle=Math.floor(b.text.length/2),spaces=Array.from(b.text.matchAll(/\s+/g)).map(m=>m.index).filter(i=>i>0);
  const cut=spaces.length?spaces.reduce((best,n)=>Math.abs(n-middle)<Math.abs(best-middle)?n:best,spaces[0]):middle;
  const left=blocks.slice(0,target).concat({...b,text:b.text.slice(0,cut)}),right=[{...b,id:uid(),text:b.text.slice(cut)}].concat(blocks.slice(target+1));
  return [{...slide,originalCanvas:null,blocks:left},{id:uid(),kind:slide.kind==='cta'?'cta':'content',look:slide.look,blocks:right,fit:slide.fit}].map((s,i)=>({...s,kind:slide.kind==='cta'&&i===0?'content':s.kind}));
}
function contentWithLook(draft,look) {
  if(draft.settings.format==='post')return {...draft,slides:draft.slides.map((s,i)=>i===draft.index?{...s,look,originalCanvas:null}:s)};
  const pages=contentCarouselSlides(draft.slides,draft.settings,look);
  const coverIndex=Math.max(0,pages.findIndex(s=>s.kind==='hook'));
  return {...draft,index:coverIndex,slides:pages.map((s,i)=>i===coverIndex||s.standardCta?{...s,look,originalCanvas:null}:s)};
}
function prepareSourceUpdate(draft) {
  const previous=draft.slides.filter(s=>!s.standardCta),coverLook=draft.slides.find(s=>s.kind==='hook')?.look||draft.slides[0]?.look||'gentle';
  return prepareContentSlides(draft.source,draft.settings).map((slide,i)=>({...slide,look:slide.kind==='hook'||slide.standardCta?coverLook:'informative',fit:true,assets:slide.standardCta?[]:previous[i]?.assets||[],photo:!slide.standardCta&&!!previous[i]?.photo}));
}
function contentDraftForSource(project,source) {
  const draft={...contentDraftFromProject(project),source};
  return {...draft,sourceReview:{label:'Review updated slides',source,original:canvasSlideText(project.canvases),slides:prepareSourceUpdate(draft)}};
}
function openContentWords(state,dispatch,source) {
  if(state.contentDraft&&(state.contentDraft.source||state.contentDraft.slides?.length)&&!confirm('Keep your current text workspace and open these words as a new draft? The current draft will be saved in My Work.'))return;
  dispatch({type:'start-content-draft',draft:contentDraftNew(source)});
}

function contentMarkedLine(text,start,end,marker) {
  const lineStart=text.slice(0,start).lastIndexOf('\n')+1;
  const line=text.slice(lineStart),indent=line.match(/^[\t ]*/)[0];
  const previous=line.slice(indent.length).match(/^#{1,2}(?:[\t ]+|(?=\n|$))/)?.[0]||'';
  const prefix=indent+marker,removed=indent.length+previous.length;
  const offset=prefix.length-removed;
  return {text:text.slice(0,lineStart)+prefix+line.slice(removed),start:Math.max(lineStart+prefix.length,start+offset),end:Math.max(lineStart+prefix.length,end+offset)};
}
function ContentWorkspace() {
  const {state,dispatch}=useStore(),mobile=useIsMobile();
  const draft=state.contentDraft;
  const [tab,setTab]=React.useState(draft?.slides?.length?'design':'text'),[family,setFamily]=React.useState('All'),[fonts,setFonts]=React.useState(false),[error,setError]=React.useState(''),[review,setReview]=React.useState(draft?.sourceReview||null),[busy,setBusy]=React.useState(false);
  const undo=React.useRef([]),redo=React.useRef([]),touch=React.useRef(null),stageRef=React.useRef(null),styleStrip=React.useRef(null);
  const [zoom,setZoom]=React.useState('fit'),[stageSize,setStageSize]=React.useState({w:600,h:500});
  const [typingSource,setTypingSource]=React.useState(false);
  React.useLayoutEffect(()=>{
    const strip=styleStrip.current,selected=strip?.querySelector('[aria-pressed="true"]');
    if(!selected||!strip.clientWidth)return;
    const box=strip.getBoundingClientRect(),card=selected.getBoundingClientRect();
    if(card.left<box.left+3)strip.scrollLeft+=card.left-box.left-3;
    else if(card.right>box.right-3)strip.scrollLeft+=card.right-box.right+3;
  },[family,draft?.slides,draft?.index,tab]);
  React.useLayoutEffect(()=>{
    const stage=stageRef.current;if(!stage)return;
    const measure=()=>{const w=stage.clientWidth,h=stage.clientHeight;if(w&&h)setStageSize(previous=>previous.w===w&&previous.h===h?previous:{w,h});};
    measure();const observer=new ResizeObserver(measure);observer.observe(stage);return()=>observer.disconnect();
  },[draft?.slides?.length,mobile,tab]);
  React.useEffect(()=>{if(zoom==='fit'&&stageRef.current)stageRef.current.scrollTo(0,0);},[zoom]);
  React.useEffect(()=>{if(!draft){let input='';try{input=JSON.parse(sessionStorage.getItem('wpr-social-create-draft')||'{}').input||'';}catch{}dispatch({type:'set-content-draft',draft:contentDraftNew(input)});}},[]);
  React.useEffect(()=>{if(draft?.slides?.length&&draft.settings.format!=='post'&&!draft.slides.some(s=>s.standardCta))dispatch({type:'set-content-draft',draft:{...draft,slides:contentCarouselSlides(draft.slides,draft.settings)}});},[draft?.id,draft?.slides,draft?.settings]);
  React.useEffect(()=>{let live=true;setFonts(false);loadCarouselFonts(state.brand).then(()=>{if(live)setFonts(true);}).catch(()=>{if(live)setFonts(true);});return()=>{live=false;};},[state.brand.slideFontHeading,state.brand.slideFontSubheading]);
  const patch=(changes,history=false)=>{if(history){undo.current.push(draft);undo.current=undo.current.slice(-40);redo.current=[];}dispatch({type:'set-content-draft',draft:{...draft,...changes,updatedAt:now()}});setError('');};
  const travel=(from,to)=>{const next=from.current.pop();if(next){to.current.push(draft);dispatch({type:'set-content-draft',draft:next});}};
  const canvases=React.useMemo(()=>draft?.slides?.map((s,i)=>renderContentSlide(s,draft.settings,state.brand,{slideNumber:i+1,totalSlides:draft.slides.length}))||[],[draft?.slides,draft?.settings,state.brand,fonts]);
  if(!draft)return <p role="status">Opening your text workspace…</p>;
  const index=Math.min(draft.index||0,Math.max(0,draft.slides.length-1)),slide=draft.slides[index],canvas=canvases[index],overflow=canvases.map((c,i)=>contentOverflow(c)?i:-1).filter(i=>i>=0);
  const fitScale=canvas?Math.min((stageSize.w-24)/canvas.w,(stageSize.h-24)/canvas.h):1;
  const previewScale=zoom==='fit'?Math.max(.05,fitScale):zoom;
  const changeZoom=direction=>setZoom(Math.max(.1,Math.min(2,Math.round((previewScale+direction*.1)*100)/100)));
  const single=canvases.length===1;
  const coverSlide=draft.slides.find(s=>s.kind==='hook')||draft.slides[0];
  const settings=draft.settings;
  const sourceSettings=draft.sourceSettings||settings;
  const sourceChanged=draft.source!==(draft.appliedSource??contentSlidesSource(draft.slides,settings))||JSON.stringify(sourceSettings)!==JSON.stringify(settings);
  const prepare=()=>{try{const slides=prepareSourceUpdate({...draft,settings:sourceSettings});if(draft.slides.length)setReview({slides,source:draft.source,original:contentSlidesSource(draft.slides,settings),settings:sourceSettings,label:'Review updated slides'});else{patch({slides,index:0,appliedSource:draft.source},true);setTab('design');}}catch(e){setError(e.message);}};
  const previewSplit=()=>{try{const next=contentSplitSlide(slide),slides=[...draft.slides.slice(0,index),...next,...draft.slides.slice(index+1)],splitSettings={...settings,split:'markers'};setReview({slides,source:contentSlidesSource(slides,splitSettings),settings:splitSettings,original:draft.source,label:'Review split into two slides'});}catch(e){setError(e.message);}};
  const back=()=>{if(draft.projectId)dispatch({type:'open-project',id:draft.projectId});else dispatch({type:'set-view',view:draft.returnView||'home'});};
  const proceed=async()=>{setBusy(true);try{await loadCarouselFonts(state.brand);const pages=draft.slides.map((s,i)=>renderContentSlide(s,settings,state.brand,{slideNumber:i+1,totalSlides:draft.slides.length}));const original=state.projects.find(p=>p.id===draft.projectId);const project={...(original||{}),id:original?.id||uid(),name:draft.name||draft.slides[0]?.blocks[0]?.text?.slice(0,65)||'My design',createdAt:original?.createdAt||now(),updatedAt:now(),canvases:pages,activeCanvasId:pages[index].id,projectType:pages.length===1?'post':'carousel',caption:draft.caption,captionDetached:true,contentWorkspaceSettings:settings,generatedSourceText:draft.appliedSource??draft.source,sourceText:original?.sourceText??draft.source,sourceDraft:draft.source,contentEntryId:draft.contentEntryId||original?.contentEntryId,thumbnail:null};dispatch({type:'finish-content-draft',project});try{sessionStorage.removeItem('wpr-social-create-draft');}catch{}}catch(e){setError(e.message);}finally{setBusy(false);}};
  const previewAi=async()=>{
    setBusy(true);setError('');
    try{
      const result=await aiRepurposeAll({brand:state.brand,vocab:state.vocab,input:draft.source,platforms:['instagram-carousel'],counts:{'instagram-carousel':Number(sourceSettings.count)||4},provider:'gemini'});
      const text=result['instagram-carousel'];
      if(!text?.trim())throw new Error('AI returned no words. Your original text is kept.');
      setReview({source:text,settings:sourceSettings,slides:prepareContentSlides(text,sourceSettings).map(s=>({...s,look:'gentle'})),label:'Review AI wording'});
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const contentReview=review&&<ContentReview review={review} original={review.original??draft.source} onCancel={()=>{patch({sourceReview:null});setReview(null);}} onApply={()=>{patch({slides:review.slides,index:Math.min(index,review.slides.length-1),sourceReview:null,sourceSettings:null,settings:review.settings||settings,appliedSource:review.source??draft.source,...(review.source?{source:review.source}:{})},true);setReview(null);setTab('design');}}/>;
  const changeSourceDraft=(changes,history=false)=>{const sourceChanges={...changes};if(sourceChanges.settings){sourceChanges.sourceSettings=sourceChanges.settings;delete sourceChanges.settings;}patch(sourceChanges,history);};
  if(!slide)return <ContentEntryScreen key={draft.id} draft={draft} onChange={patch} onBack={back} onPrepare={prepare} onAi={previewAi} busy={busy} error={error}>{contentReview}</ContentEntryScreen>;
  return <div className={'cw-shell cw-workspace'+(typingSource?' cw-workspace-typing':'')}><SimpleStudioStyles/><header className="cw-header"><button onClick={back}>‹ Studio</button><div><small>WONDER PADS · CONTENT STUDIO</small><h1>Find your look</h1></div><SaveIndicator/></header><nav className="cw-mobile-tabs" aria-label="Text workspace sections">{['text','design'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t==='text'?'Text':'Design'}</button>)}</nav>
    <div className="cw-body"><div className="cw-columns"><div className="cw-source-column" hidden={mobile&&tab!=='text'}><ContentEntryScreen key={draft.id} embedded hasSlides draft={{...draft,settings:sourceSettings}} dirty={sourceChanged} onChange={changeSourceDraft} onPrepare={prepare} onTypingChange={setTypingSource} busy={busy}/></div><main className="cw-design" hidden={mobile&&tab!=='design'}>{canvas?<><div className="cw-preview-tools" aria-label="Preview controls"><div className="cw-history"><button aria-label="Undo" disabled={!undo.current.length} onClick={()=>travel(undo,redo)}><Icon name="undo" size={16}/><span className="cw-tool-label">Undo</span></button><button aria-label="Redo" disabled={!redo.current.length} onClick={()=>travel(redo,undo)}><Icon name="redo" size={16}/><span className="cw-tool-label">Redo</span></button></div>
      <div className="cw-zoom" role="group" aria-label="Preview zoom"><button aria-pressed={zoom==='fit'} onClick={()=>setZoom('fit')}>Fit</button><button aria-label="Preview at 100 percent" aria-pressed={zoom===1} onClick={()=>setZoom(1)}>100%</button><button aria-label="Zoom out" disabled={previewScale<=.1} onClick={()=>changeZoom(-1)}>−</button><output className="cw-zoom-value" aria-label="Preview zoom level">{Math.round(previewScale*100)}%</output><button aria-label="Zoom in" disabled={previewScale>=2} onClick={()=>changeZoom(1)}>+</button></div></div>
      <div className="cw-preview-heading"><span>{single?'Single post':`Slide ${index+1} of ${canvases.length} · ${slide.kind==='hook'?'Cover':slide.kind==='cta'?'Closing':'Content'}`}</span></div>
      {overflow.includes(index)&&<div className="cw-warning" role="status">Text needs more room. All words are kept.<div><button onClick={()=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,fit:true}:s)},true)}>Fit text</button><button onClick={()=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,look:'informative',fit:true}:s)},true)}>Roomier layout</button><button onClick={previewSplit}>Preview split</button></div></div>}
      <div className="cw-preview-stage" ref={stageRef} data-zoomed={zoom!=='fit'}><div className="cw-preview-surface"><div className="cw-large-preview" style={{width:canvas.w*previewScale,height:canvas.h*previewScale,touchAction:zoom==='fit'?'pan-y':'pan-x pan-y'}} onTouchStart={e=>{touch.current=zoom==='fit'?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)patch({index:Math.max(0,Math.min(canvases.length-1,index+(dx<0?1:-1)))});}} onTouchCancel={()=>{touch.current=null;}}><MiniPreview canvas={canvas} fluid/></div></div></div>
      <section className="cw-template-browser" aria-label="Choose a design">{!single&&<nav className="cw-thumbnails" aria-label="Carousel slides"><button className="cw-slide-arrow" aria-label="Previous slide" disabled={!index} onClick={()=>patch({index:index-1})}>‹</button>{canvases.map((c,i)=><button key={c.id} aria-label={`Slide ${i+1}${overflow.includes(i)?' needs fitting':''}`} aria-pressed={i===index} onClick={()=>patch({index:i})}><MiniPreview canvas={c} maxW={34} maxH={38}/><span>{i+1}{overflow.includes(i)?' ⚠':''}</span></button>)}<button className="cw-slide-arrow" aria-label="Next slide" disabled={index===canvases.length-1} onClick={()=>patch({index:index+1})}>›</button></nav>}
      <div className="cw-style-heading"><span>{single?'Post style':'Cover style'}</span><label className="cw-style-filter"><span className="cw-entry-sr">Style family</span><select value={family} onChange={e=>setFamily(e.target.value)}>{['All','Floral','Editorial','Bold'].map(f=><option key={f} value={f}>{f==='All'?'All styles':f}</option>)}</select></label><details className="cw-style-info"><summary aria-label="About cover styles">ⓘ</summary><p>{single?'Select a colour card to preview its style.':'Cover and closing slide share the selected colours. Content slides keep their layout.'}</p></details></div>
      <div ref={styleStrip} className="cw-template-strip cw-color-styles" aria-label="Cover styles">{CONTENT_LOOKS.filter(l=>family==='All'||l.family===family).map(l=><button key={l.id} className="cw-look" style={{background:l.bg,color:l.ink}} aria-pressed={(single?slide:coverSlide).look===l.id} onClick={()=>patch(contentWithLook(draft,l.id),true)}><span>{l.name}</span>{(single?slide:coverSlide).look===l.id&&<span aria-hidden="true">✓</span>}</button>)}</div></section>
    </>:<div className="cw-empty"><h2>Your words, your look.</h2><p>Prepare your slides once. Then tap the template strip to compare designs using your own text.</p>{mobile&&<button onClick={()=>setTab('text')}>Enter your text</button>}</div>}</main></div></div>
    {error&&<p className="cw-error" role="alert">{error}</p>}<SaveErrorBanner/><footer className={"cw-footer"+(sourceChanged?" cw-footer-pending":"")}><span>{canvases.length?`${single?'Single post':canvases.length+' slides'}${overflow.length?` · check ${overflow.length} for overflow`:''}`:'Start with your words'}</span>{sourceChanged?<div className="cw-update-choice"><p role="status">Text changes saved. Update slides to apply.</p><div className="cw-choice-actions" role="group" aria-label="Apply source changes"><button disabled={busy||!canvas} onClick={proceed} title="Continue with the current slides. Your text draft stays saved.">Keep current</button><button className="cw-primary" disabled={busy||!draft.source.trim()} onClick={()=>{document.activeElement?.blur();prepare();}}>Update slides</button></div></div>:<button className="cw-primary" disabled={busy||!canvas} onClick={proceed}>{busy?'Preparing…':'Continue editing'}</button>}</footer>
    {contentReview}
  </div>;
}
function ContentEntryScreen({draft,hasSlides=false,embedded=false,dirty=false,onChange,onBack,onPrepare,onAi,onTypingChange,busy,error,children}) {
  const {dispatch}=useStore();
  const field=React.useRef(null),selection=React.useRef({start:0,end:0}),pendingSelection=React.useRef(null),shell=React.useRef(null);
  const [focused,setFocused]=React.useState(false),[options,setOptions]=React.useState(false),[cleared,setCleared]=React.useState(null),[help,setHelp]=React.useState(false);
  const [shortViewport,setShortViewport]=React.useState(false);
  const source=draft.source,settings=draft.settings;
  React.useLayoutEffect(()=>{
    const node=shell.current;if(!node)return;
    const measure=()=>setShortViewport((window.innerWidth<640||window.matchMedia('(pointer:coarse)').matches)&&(window.visualViewport?.height||window.innerHeight)<560);
    measure();const observer=new ResizeObserver(measure);observer.observe(node);window.visualViewport?.addEventListener('resize',measure);window.addEventListener('resize',measure);
    return()=>{observer.disconnect();window.visualViewport?.removeEventListener('resize',measure);window.removeEventListener('resize',measure);};
  },[]);
  React.useLayoutEffect(()=>{onTypingChange?.(focused&&shortViewport);return()=>onTypingChange?.(false);},[focused,shortViewport,onTypingChange]);
  React.useLayoutEffect(()=>{
    const range=pendingSelection.current;
    if(!range||!field.current)return;
    pendingSelection.current=null;field.current.focus();field.current.setSelectionRange(range.start,range.end);
    if(range.scrollTop!==undefined)field.current.scrollTop=range.scrollTop;
  });
  const words=source.trim()?source.trim().split(/\s+/).length:0;
  const splitLabel=hasSlideMarks(source)?'My breaks':settings.split==='balanced'?`${settings.count} + closing`:settings.split==='paragraphs'?'Paragraphs':'My breaks';
  const changeSource=text=>{setCleared(null);onChange({source:text});};
  const rememberSelection=()=>{if(field.current)selection.current={start:field.current.selectionStart,end:field.current.selectionEnd};};
  const focusSource=(range=selection.current)=>{
    if(!field.current)return;
    field.current.focus();field.current.setSelectionRange(range.start,range.end);
  };
  const mark=marker=>{
    const next=contentMarkedLine(source,selection.current.start,selection.current.end,marker);
    selection.current={start:next.start,end:next.end};pendingSelection.current=selection.current;changeSource(next.text);
  };
  const clear=()=>{setCleared({source,...selection.current,scrollTop:field.current?.scrollTop||0});onChange({source:''});selection.current={start:0,end:0};};
  const restore=()=>{const saved=cleared;selection.current={start:saved.start,end:saved.end};pendingSelection.current={...selection.current,scrollTop:saved.scrollTop};onChange({source:saved.source});setCleared(null);};
  return <div ref={shell} className={(embedded?'cw-source-panel':'cw-shell')+' cw-entry-shell'+(focused&&shortViewport?' cw-entry-typing':'')}>{!embedded&&<SimpleStudioStyles/>}
    {!embedded&&<header className="cw-header"><button onClick={onBack} disabled={busy}>‹ Back</button><div><small>WONDER PADS · CONTENT STUDIO</small><h1>Your words</h1></div><SaveIndicator/></header>}
    <main className="cw-entry-main"><div className="cw-entry-paper">
      {embedded?<h2 className="cw-source-title">Your words</h2>:<nav className="cw-entry-tabs" aria-label="Writing sources"><button aria-pressed="true" disabled={busy}>Write / Paste</button><button aria-pressed="false" disabled={busy} onClick={()=>dispatch({type:'set-view',view:'ready-content'})}>Ready-made posts</button><button aria-pressed="false" disabled={busy} onClick={()=>dispatch({type:'set-view',view:'repurpose'})}>Reuse my words</button></nav>}
      <div className="cw-entry-writing">
        <div className="cw-entry-markers" role="toolbar" aria-label="Mark slides"><button onMouseDown={e=>e.preventDefault()} onClick={()=>mark('# ')} disabled={busy}>+ Slide</button><button onMouseDown={e=>e.preventDefault()} onClick={()=>mark('## ')} disabled={busy}>+ Subheading</button><button className="cw-entry-help" aria-label="Help with slide markers" aria-expanded={help} onClick={()=>setHelp(!help)}>?</button><button className="cw-entry-keyboard-done" onClick={()=>field.current?.blur()}>Done</button></div>
        {help&&<p className="cw-entry-marker-help">Tap a line, then + Slide to add # or + Subheading to add ##. Blank lines stay inside the slide.</p>}
        <div className="cw-entry-field"><label className="cw-entry-sr" htmlFor="cw-source">Your source text</label><textarea ref={field} id="cw-source" className="cw-source" value={source} readOnly={busy} onSelect={rememberSelection} onChange={e=>{selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};changeSource(e.target.value);}} onFocus={()=>setFocused(true)} onBlur={()=>{rememberSelection();setFocused(false);}} placeholder={focused?'Paste your story, article or notes here…':''}/>
          {!source&&!focused&&!embedded&&<div className="cw-entry-empty"><span className="cw-entry-empty-icon"><Icon name="text" size={24}/></span><h2>Every post starts with your words.</h2><p>Paste your text or start typing.<br/>We’ll help you turn it into slides.</p><button className="cw-primary" onClick={()=>focusSource()}>Start writing</button><button className="cw-entry-link" onClick={()=>dispatch({type:'set-view',view:'ready-content'})} disabled={busy}>Browse ready-made posts</button></div>}
        </div>
      </div>
      <div className="cw-entry-wordbar"><span>{words} words · {source.length} characters</span><div>{cleared&&<button className="cw-entry-link" onClick={restore}>Undo clear</button>}<button className="cw-entry-link" disabled={!source||busy} onClick={clear}>Clear</button></div></div>
      {cleared&&<p className="cw-entry-clear-notice" role="status">Text cleared. Your post options are kept.</p>}
    </div></main>
    {!embedded&&<>{error&&<p className="cw-error" role="alert">{error}</p>}<SaveErrorBanner/></>}
    {embedded?<footer className="cw-entry-footer cw-source-footer"><div className="cw-source-controls">{settings.format!=='post'&&settings.split!=='markers'&&!hasSlideMarks(source)&&<button className="cw-entry-link" onClick={()=>setOptions('split')}>Slide breaks: {settings.split==='balanced'?'Balanced':'Paragraphs'} · Change</button>}<button className="cw-entry-link" onClick={()=>setOptions('caption')}>Caption & hashtags</button></div></footer>:<footer className="cw-entry-footer"><div className="cw-entry-footer-inner"><button className="cw-entry-options" aria-haspopup="dialog" aria-expanded={!!options} onClick={()=>setOptions('post')} disabled={busy}><Icon name="menu" size={16}/><span>{settings.format==='post'?'Single post':'Carousel'} · {settings.size==='post'?'1:1':'4:5'}{settings.format!=='post'&&` · ${splitLabel}`}</span><span aria-hidden="true">⌄</span></button>
      <div className="cw-entry-actions"><button disabled={busy||!source.trim()} onClick={onPrepare}>{settings.format==='post'?'Prepare post':'Prepare slides'} <span aria-hidden="true">→</span></button><button className="cw-primary" disabled={busy||!source.trim()} onClick={onAi}><Icon name="sparkles" size={16}/>{busy?'Preparing…':'Improve with AI'}</button></div><p>Your words stay as written when you prepare {settings.format==='post'?'a post':'slides'}.</p>
    </div></footer>}
    {options&&(embedded?<ContentSourceOptions mode={options} settings={settings} caption={draft.caption} onClose={()=>setOptions(false)} onApply={changes=>{onChange(changes,true);setOptions(false);}}/>:<ContentEntryOptions settings={settings} caption={draft.caption} source={source} onClose={()=>setOptions(false)} onApply={(next,caption)=>{onChange({settings:next,caption},true);setOptions(false);}}/>)}{children}
  </div>;
}
function ContentSourceOptions({mode,settings,caption,onClose,onApply}) {
  const ref=React.useRef(null),[split,setSplit]=React.useState(settings.split),[count,setCount]=React.useState(settings.count),[text,setText]=React.useState(caption||'');
  React.useEffect(()=>{ref.current.showModal();},[]);
  return <dialog ref={ref} className="cw-entry-dialog" aria-labelledby="cw-source-options-title" onCancel={e=>{e.preventDefault();onClose();}}><form onSubmit={e=>{e.preventDefault();onApply(mode==='caption'?{caption:text}:{settings:{...settings,split,count}});}}><header><h2 id="cw-source-options-title">{mode==='caption'?'Caption & hashtags':'Slide breaks'}</h2><button type="button" aria-label="Cancel changes" onClick={onClose}>×</button></header><div className="cw-entry-dialog-content">{mode==='caption'?<><label htmlFor="cw-source-caption">Caption & hashtags</label><textarea id="cw-source-caption" value={text} onChange={e=>setText(e.target.value)}/></>:<><label htmlFor="cw-source-split">Split by</label><select id="cw-source-split" value={split} onChange={e=>setSplit(e.target.value)}><option value="markers">My slide markers (#)</option><option value="paragraphs">Paragraphs</option><option value="balanced">Balanced length</option></select>{split==='balanced'&&<><label htmlFor="cw-source-count">Source slides</label><input id="cw-source-count" type="number" min="2" max="30" value={count} onChange={e=>setCount(Math.min(30,Math.max(2,Number(e.target.value)||2)))}/></>}<p>Your current slides stay unchanged until you update, review and apply.</p></>}</div><footer><button type="button" onClick={onClose}>Cancel</button><button className="cw-primary" type="submit">Save changes</button></footer></form></dialog>;
}
function ContentEntryOptions({settings,caption,source,onClose,onApply}) {
  const ref=React.useRef(null),[next,setNext]=React.useState({...settings}),[nextCaption,setNextCaption]=React.useState(caption);
  React.useEffect(()=>{ref.current.showModal();},[]);
  const set=(key,value)=>setNext(previous=>({...previous,[key]:value}));
  let count=1;
  if(source.trim()&&next.format!=='post'){
    if(hasSlideMarks(source))count=markedChunks(source).length;
    else if(next.split==='paragraphs')count=source.trim().split(/\n\s*\n/).filter(s=>s.trim()).length;
    else if(next.split==='balanced')count=Number(next.count)||4;
  }
  const summary=next.format==='post'?'One single post.':source.trim()?`${count} source slide${count===1?'':'s'} + closing = ${count+1} total.`:'Your slide count will appear after you add your words.';
  return <dialog ref={ref} className="cw-entry-dialog" aria-labelledby="cw-entry-options-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target!==e.currentTarget)return;const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)onClose();}}>
    <form onSubmit={e=>{e.preventDefault();onApply(next,nextCaption);}}><header><h2 id="cw-entry-options-title">Post options</h2><button type="button" aria-label="Cancel options" onClick={onClose}>×</button></header>
      <div className="cw-entry-dialog-content"><fieldset><legend>Make a</legend><div className="cw-entry-choices">{[['carousel','Carousel','copy'],['post','Single post','templates']].map(([id,label,icon])=><button type="button" key={id} aria-pressed={next.format===id} onClick={()=>set('format',id)}><Icon name={icon} size={18}/>{label}</button>)}</div></fieldset>
      <fieldset><legend>Ratio</legend><div className="cw-entry-choices">{[['portrait','Portrait · 4:5'],['post','Square · 1:1']].map(([id,label])=><button type="button" key={id} aria-pressed={next.size===id} onClick={()=>set('size',id)}><span className={'cw-entry-ratio '+id} aria-hidden="true"/>{label}</button>)}</div></fieldset>
      <ContentSplitOptions settings={next} source={source} showFormat={false} onChange={set}/><p className="cw-entry-total" role="status">{summary}</p>
      <details><summary>Caption & hashtags</summary><label htmlFor="cw-entry-caption">Caption & hashtags</label><textarea id="cw-entry-caption" value={nextCaption} onChange={e=>setNextCaption(e.target.value)}/></details></div>
      <footer><button type="button" onClick={onClose}>Cancel</button><button className="cw-primary" type="submit">Apply options</button></footer>
    </form>
  </dialog>;
}
function ContentSplitOptions({settings,source,onChange,showFormat=true}) {
  const id=React.useId();
  return <div className="cw-split-options">
    {showFormat&&<><label htmlFor={id+'-format'}>Make a</label><select id={id+'-format'} value={settings.format} onChange={e=>onChange('format',e.target.value)}><option value="carousel">Carousel</option><option value="post">Single post</option></select></>}
    {settings.format!=='post'&&<>
      <label htmlFor={id+'-split'}>Split by</label><select id={id+'-split'} value={settings.split} onChange={e=>onChange('split',e.target.value)}><option value="markers">My slide markers (#)</option><option value="paragraphs">Paragraphs</option><option value="balanced">Balanced length</option></select>
      <label htmlFor={id+'-count'}>Source slides</label><input id={id+'-count'} type="number" min="2" max="30" value={settings.count} disabled={hasSlideMarks(source)||settings.split!=='balanced'} onChange={e=>onChange('count',Math.min(30,Math.max(2,Number(e.target.value)||2)))}/>
      <p>{hasSlideMarks(source)?'Your # markers set the source slide count. ## stays inside its slide.':'Count applies to balanced splitting; paragraphs and markers keep your own breaks.'} A standard CTA is added after your words and matches the cover colours.</p>
      <label className="cw-check"><input type="checkbox" checked={settings.cover} onChange={e=>onChange('cover',e.target.checked)}/>First slide is a cover</label>
    </>}
  </div>;
}
function ContentReview({review,original,onCancel,onApply}) {
  const ref=React.useRef(null);React.useEffect(()=>{ref.current.showModal();ref.current.querySelector('h2')?.focus();},[]);
  return <dialog className="cw-review" ref={ref} onCancel={onCancel} aria-labelledby="cw-review-title">
    <header className="cw-review-header"><h2 id="cw-review-title" tabIndex={-1}>{review.label}</h2><p>{review.slides.length} slides. Check the wording and breaks before applying.</p></header>
    <div className="cw-review-body">{review.source&&<details><summary>Original wording</summary><pre>{original}</pre></details>}{review.slides.map((s,i)=><section key={s.id}><strong>Slide {i+1}{s.standardCta?' · Closing':''}</strong>{s.blocks.map(b=><p key={b.id} style={{whiteSpace:'pre-wrap'}}>{b.text}</p>)}</section>)}</div>
    <footer className="cw-review-footer cw-choice-actions"><button onClick={onCancel}>Keep current</button><button className="cw-primary" onClick={onApply}>Apply update</button></footer>
  </dialog>;
}

function ProjectSourceEditor({project,caption}) {
  const {state,dispatch,retrySave}=useStore();
  const [notice,setNotice]=React.useState(''),[saveRequested,setSaveRequested]=React.useState(false);
  const source=project.sourceDraft??project.sourceText??'';
  React.useEffect(()=>{
    if(!saveRequested)return;
    if(state.saveStatus==='saved'){setNotice('Source draft saved. Use Preview updated slides to change your slides.');setSaveRequested(false);}
    if(state.saveStatus==='error'){setNotice('The source draft could not be saved. Your text is still here; try saving again.');setSaveRequested(false);}
  },[saveRequested,state.saveStatus]);
  const preview=()=>{try{document.activeElement?.blur?.();const draft=contentDraftForSource({...project,caption},source);dispatch({type:'start-content-draft',draft});}catch(e){setNotice(e.message||'Could not prepare the source text.');}};
  return <section className="posting-tools source-editor" style={{margin:'0 auto'}}><h2>Edit source text</h2><p>Your source draft saves automatically. To update the slides, preview the changes, apply them, then continue editing.</p>
    <label>Source text<textarea aria-label="Source text" value={source} onChange={e=>{dispatch({type:'update-project',id:project.id,patch:{sourceDraft:e.target.value}});setNotice('');}} style={{minHeight:280}}/></label>
    <p># starts a slide. ## keeps a subheading inside that slide. Your current design is kept while you review.</p>
    <div className="ready-actions"><button className="simple-action" disabled={!source.trim()} onClick={preview}>Preview updated slides</button><button className="simple-action simple-secondary" disabled={saveRequested&&state.saveStatus==='saving'} onClick={()=>{setSaveRequested(true);retrySave();}}>{saveRequested&&state.saveStatus==='saving'?'Saving draft…':'Save source draft'}</button></div>
    {notice&&<p role="status" aria-live="polite">{notice}</p>}
    <details><summary>All current slide text</summary><textarea aria-label="Current slide text" readOnly value={canvasSlideText(project.canvases.map(c=>({...c,elements:c.elements.map(e=>({...e,hidden:false}))})))}/></details>
    {typeof project.sourceText==='string'&&<details><summary>Original paste</summary><textarea aria-label="Original paste" value={project.sourceText} readOnly/><button className="simple-action simple-secondary" onClick={()=>{dispatch({type:'update-project',id:project.id,patch:{sourceDraft:project.sourceText}});setNotice('Original paste restored to the draft. Preview it before changing your slides.');}}>Restore to source draft</button></details>}
  </section>;
}
function SavedWritingGallery() {
  const {state,dispatch}=useStore();const [search,setSearch]=React.useState('');
  const entries=[...(state.savedRepurpose||[]),...(state.savedLaunches||[])].sort((a,b)=>(b.ts||0)-(a.ts||0));
  const writing=entries.flatMap(entry=>{const preferred=entry.outputs?.['instagram-carousel']||entry.outputs?.carousel||entry.sourceText;const text=Array.isArray(preferred)?preferred.join('\n\n'):preferred;return text?[{id:entry.id,text,title:text.split('\n')[0].replace(/^#+\s*/,''),ts:entry.ts}]:[];}).filter(e=>(e.title+' '+e.text).toLowerCase().includes(search.toLowerCase()));
  return <><label className="studio-work-search">Find writing<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="simple-grid">{writing.map(e=><div className="simple-card" key={e.id}><h3>{e.title.slice(0,90)}</h3><p className="cw-writing-excerpt">{e.text}</p><button className="simple-action" onClick={()=>openContentWords(state,dispatch,e.text)}>Use these words</button></div>)}</div>{!writing.length&&<p>No saved writing matches here.</p>}<button className="simple-action simple-secondary" onClick={()=>dispatch({type:'set-view',view:'history'})}>Open all saved writing and versions</button></>;
}
Object.assign(window,{CONTENT_LOOKS,contentLook,contentDraftNew,contentDraftFromPost,contentDraftFromProject,renderContentSlide,contentOverflow,prepareContentSlides,prepareSourceUpdate,contentDraftForSource,contentWithLook,contentSplitSlide,ContentWorkspace,ProjectSourceEditor,SavedWritingGallery});
