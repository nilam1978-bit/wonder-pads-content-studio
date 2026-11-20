// Content is prepared once. Designs only arrange these blocks; no AI or splitting in rendering.
const CONTENT_LOOKS = [
  {id:'gentle',name:'Soft blush',family:'Floral',bg:'#F1CFEA',ink:'#78265F',accent:'#849879',layout:'center'},
  {id:'informative',name:'Cream editorial',family:'Editorial',bg:'#FFF9FC',ink:'#78265F',accent:'#D489C3',layout:'editorial'},
  {id:'clear',name:'Plum statement',family:'Bold',bg:'#78265F',ink:'#FFF9FC',accent:'#F1CFEA',layout:'bold'},
  {id:'handmade',name:'Berry frame',family:'Floral',bg:'#2A1F2A',ink:'#F1CFEA',accent:'#D489C3',layout:'frame'},
  {id:'playful',name:'Leafy cream',family:'Floral',bg:'#EEF3EA',ink:'#354C38',accent:'#849879',layout:'center'},
  {id:'colourful',name:'Orchid question',family:'Bold',bg:'#BC5AA6',ink:'#2A1F2A',accent:'#F1CFEA',layout:'bold'},
];
const contentLook = id => CONTENT_LOOKS.find(l=>l.id===id)||CONTENT_LOOKS[0];
const contentBlock = (role,text) => ({id:uid(),role,text:String(text??'')});
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
  if(settings.format==='post')chunks=[source.replace(/^\s*#{1,2}\s+/gm,'')];
  else if(hasSlideMarks(source))chunks=markedChunks(source);
  else if(settings.split==='paragraphs')chunks=source.replace(/\r/g,'').split(/\n\s*\n/).filter(s=>s.trim());
  else if(settings.split==='balanced')chunks=distributeCarouselText(source,Number(settings.count)||4);
  else chunks=[source];
  return chunks.map((text,i)=>contentSlideFromChunk(text,chunks.length===1?'post':i===0&&settings.cover?'hook':i===chunks.length-1&&settings.closing?'cta':'content'));
}
function contentDraftNew(source='') {
  return {id:uid(),source,slides:[],settings:{size:'portrait',format:'carousel',split:'markers',count:4,cover:true,closing:true},index:0,caption:'',returnView:'home',updatedAt:now()};
}
function contentDraftFromPost(post) {
  let slides=readyPostSlides(post);
  if(!slides.length){
    const raw=post.layout==='poster'||post.layout==='bigtext'||post.includeFullText===false?post.imageText||post.title:post.caption||post.imageText||post.title;
    const lines=String(raw||'').replace(/ \/ /g,'\n').split('\n');
    slides=[{title:lines.shift()||post.title,body:lines.join('\n')}];
  }
  const draft=contentDraftNew();
  return {...draft,name:post.title,contentEntryId:post.id,caption:[post.caption,post.hashtags].filter(Boolean).join('\n\n'),footerLine:post.footerLine||'',returnView:'ready-content',
    settings:{...draft.settings,size:post.defaultSize||'portrait',format:slides.length===1?'post':'carousel'},
    slides:slides.map((s,i)=>{const slide=contentSlideFromChunk(s.title+'\n'+(s.body||''),slides.length===1?'post':i===0?'hook':i===slides.length-1?'cta':'content');if(i===0&&post.footerLine)slide.blocks.push(contentBlock('body',post.footerLine));return {...slide,look:contentLook(post.stylePair).id,photo:!!s.photo};}),
    source:slides.map(s=>'# '+s.title+'\n'+(s.body||'')).join('\n\n')};
}
function isContentText(e) {
  return e.type==='text'&&!e.fromBrand&&!e.brandSlot&&!e.engagementAction&&!['swipe','number','counter','brandName','shopName','handles','logo','engagementLabel'].includes(e.__role)&&!e.endpointDecoration;
}
function contentDraftFromProject(project) {
  const draft=contentDraftNew(project.sourceText||'');
  return {...draft,projectId:project.id,name:project.name,caption:project.caption||'',returnView:'editor',
    index:Math.max(0,project.canvases.findIndex(c=>c.id===project.activeCanvasId)),
    settings:{...draft.settings,size:project.canvases[0]?.h===1080?'post':'portrait',format:project.canvases.length===1?'post':'carousel'},
    slides:project.canvases.map(c=>({id:c.id,kind:c.slideKind||'content',look:c.contentLook||'gentle',originalCanvas:c,
      blocks:c.elements.filter(isContentText).slice().sort((a,b)=>a.y-b.y||a.x-b.x).map(e=>({id:e.contentBlockId||e.id,role:e.__role==='heading'?'heading':e.__role==='sub'?'sub':'body',text:e.text,hidden:!!e.hidden})),
      // Keep user-added photos, shapes and illustrations when restyling a saved canvas.
      assets:c.elements.filter(e=>e.type!=='text'&&!e.fromBrand&&!e.endpointDecoration&&!e.contentDecoration&&!e.engagementAction&&!e.brandSlot)
    }))};
}
function renderContentSlide(slide,settings,brand,options={}) {
  if(slide.originalCanvas&&!options.force)return slide.originalCanvas;
  const look=contentLook(options.look||slide.look),W=1080,H=settings.size==='post'?1080:1350;
  const c={id:slide.id,name:slide.kind==='hook'?'Cover':slide.kind==='cta'?'Closing slide':'Slide',slideKind:slide.kind,contentLook:look.id,w:W,h:H,bg:{type:'color',value:look.bg},elements:[]};
  const els=c.elements,m=86,top=slide.kind==='content'?130:180,bottom=H-210;
  const shape=(type,patch)=>els.push(newElement(type,{...patch,contentDecoration:true}));
  if(look.layout==='frame')shape('rect',{x:30,y:30,w:W-60,h:H-60,fill:'transparent',stroke:look.accent,strokeWidth:3,radius:0});
  if(look.layout==='editorial')shape('rect',{x:0,y:H-175,w:W,h:175,fill:look.accent,radius:0});
  if(look.family==='Floral')shape('circle',{x:W-190,y:65,w:90,h:90,fill:look.accent});
  const blocks=slide.blocks.map(b=>newElement('text',{...SLIDE_TEXT_STYLES[b.role==='heading'?'h1':b.role==='sub'?'h2':'body'],__role:b.role,contentBlockId:b.id,text:b.text,hidden:!!b.hidden,x:m,y:top,w:W-m*2,fontSize:b.role==='heading'?(slide.kind==='content'?76:124):b.role==='sub'?58:44,
    fontFamily:look.layout==='bold'?'Montserrat':b.role==='body'?'Montserrat':'DM Serif Display',fontWeight:look.layout==='bold'&&b.role==='heading'?800:400,
    color:look.ink,align:look.layout==='center'?'center':'left',lineHeight:b.role==='body'?1.4:1.15}));
  let photoY=top;
  const measure=()=>{let y=top,placedPhoto=false;for(const e of blocks){if(e.hidden)continue;if(slide.photo&&!placedPhoto&&e.__role!=='heading'){photoY=y;y+=Math.round(H*.22)+30;placedPhoto=true;}e.y=y;e.h=textLayout(e).height;y+=e.h+(e.__role==='heading'?40:26);}if(slide.photo&&!placedPhoto){photoY=y;y+=Math.round(H*.22)+30;}return y-26;};
  let end=measure();
  if(slide.fit||options.fit){for(let pass=0;pass<60&&end>bottom;pass++){let changed=false;for(const e of blocks){const next=Math.max(e.__role==='heading'?40:28,Math.floor(e.fontSize*.95));if(next<e.fontSize){e.fontSize=next;changed=true;}}end=measure();if(!changed)break;}}
  if(look.layout==='center'&&!slide.photo&&end<=bottom){const dy=(bottom-end)/2;blocks.forEach(e=>e.y+=dy);}
  els.push(...blocks);
  if(slide.photo)shape('rect',{x:m,y:photoY,w:W-m*2,h:Math.round(H*.22),fill:'#E8D8E3',radius:16});
  els.push(...(slide.assets||[]));
  const branding=brandBackgroundElements(slide.kind==='hook'?'hook':'signature',c,brand);
  branding.forEach(e=>{if(e.type==='text')e.color=look.ink;});els.push(...branding);
  if(slide.footerLine)els.push(newElement('text',{text:slide.footerLine,__role:'body',contentBlockId:slide.footerId,x:m,y:H-290,w:W-m*2,fontSize:30,fontFamily:'Montserrat',color:look.ink}));
  return c;
}
function contentOverflow(canvas) {
  return canvas.elements.some(e=>isContentText(e)&&!e.hidden&&(e.y+textLayout(e).height>canvas.h-180||e.x<0||e.x+e.w>canvas.w||e.y<0));
}
function contentSplitSlide(slide) {
  // Split only at an explicit review action, keeping every character in content blocks.
  const blocks=slide.blocks.map(b=>({...b})),bodyIndex=blocks.findIndex(b=>b.role!=='heading'&&b.text.trim());
  const target=bodyIndex<0?0:bodyIndex,b=blocks[target];if(!b||b.text.length<2)throw new Error('Add more text before splitting this slide.');
  const middle=Math.floor(b.text.length/2),spaces=Array.from(b.text.matchAll(/\s+/g)).map(m=>m.index).filter(i=>i>0);
  const cut=spaces.length?spaces.reduce((best,n)=>Math.abs(n-middle)<Math.abs(best-middle)?n:best,spaces[0]):middle;
  const left=blocks.slice(0,target).concat({...b,text:b.text.slice(0,cut)}),right=[{...b,id:uid(),text:b.text.slice(cut)}].concat(blocks.slice(target+1));
  return [{...slide,originalCanvas:null,blocks:left},{id:uid(),kind:slide.kind==='cta'?'cta':'content',look:slide.look,blocks:right,fit:slide.fit}].map((s,i)=>({...s,kind:slide.kind==='cta'&&i===0?'content':s.kind}));
}
function contentWithLook(draft,look,scope) {
  return {...draft,slides:draft.slides.map((s,i)=>scope==='all'||i===draft.index?{...s,look,originalCanvas:null}:s)};
}
function openContentWords(state,dispatch,source) {
  if(state.contentDraft&&(state.contentDraft.source||state.contentDraft.slides?.length)&&!confirm('Keep your current text workspace and open these words as a new draft? The current draft will be saved in My Work.'))return;
  dispatch({type:'start-content-draft',draft:contentDraftNew(source)});
}

function ContentWorkspace() {
  const {state,dispatch}=useStore(),mobile=useIsMobile();
  const draft=state.contentDraft;
  const [tab,setTab]=React.useState(draft?.slides?.length?'design':'text'),[family,setFamily]=React.useState('All'),[scope,setScope]=React.useState('all'),[fonts,setFonts]=React.useState(false),[error,setError]=React.useState(''),[review,setReview]=React.useState(null),[busy,setBusy]=React.useState(false);
  const undo=React.useRef([]),redo=React.useRef([]),touch=React.useRef(null);
  React.useEffect(()=>{if(!draft){let input='';try{input=JSON.parse(sessionStorage.getItem('wpr-social-create-draft')||'{}').input||'';}catch{}dispatch({type:'set-content-draft',draft:contentDraftNew(input)});}},[]);
  React.useEffect(()=>{let live=true;loadCarouselFonts().then(()=>{if(live)setFonts(true);}).catch(()=>{if(live)setFonts(true);});return()=>{live=false;};},[]);
  const patch=(changes,history=false)=>{if(history){undo.current.push(draft);undo.current=undo.current.slice(-40);redo.current=[];}dispatch({type:'set-content-draft',draft:{...draft,...changes,updatedAt:now()}});setError('');};
  const travel=(from,to)=>{const next=from.current.pop();if(next){to.current.push(draft);dispatch({type:'set-content-draft',draft:next});}};
  const canvases=React.useMemo(()=>draft?.slides?.map(s=>renderContentSlide(s,draft.settings,state.brand))||[],[draft?.slides,draft?.settings,state.brand,fonts]);
  if(!draft)return <p role="status">Opening your text workspace…</p>;
  const index=Math.min(draft.index||0,Math.max(0,draft.slides.length-1)),slide=draft.slides[index],canvas=canvases[index],overflow=canvases.map((c,i)=>contentOverflow(c)?i:-1).filter(i=>i>=0);
  const settings=draft.settings,changeSetting=(key,value)=>patch({settings:{...settings,[key]:value},...(key==='size'?{slides:draft.slides.map(s=>({...s,originalCanvas:null}))}:{})},true);
  const updateBlock=(id,text)=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,blocks:s.blocks.map(b=>b.id===id?{...b,text}:b)}:s)});
  const prepare=()=>{try{const slides=prepareContentSlides(draft.source,settings).map(s=>({...s,look:'gentle'}));if(draft.slides.length)setReview({slides,label:'Review new split'});else{patch({slides,index:0},true);setTab('design');}}catch(e){setError(e.message);}};
  const previewSplit=()=>{try{const next=contentSplitSlide(slide);setReview({slides:[...draft.slides.slice(0,index),...next,...draft.slides.slice(index+1)],label:'Review split into two slides'});}catch(e){setError(e.message);}};
  const back=()=>{if(draft.projectId)dispatch({type:'open-project',id:draft.projectId});else dispatch({type:'set-view',view:draft.returnView||'home'});};
  const proceed=async()=>{setBusy(true);try{await loadCarouselFonts();const pages=draft.slides.map(s=>renderContentSlide(s,settings,state.brand));const original=state.projects.find(p=>p.id===draft.projectId);const project={...(original||{}),id:original?.id||uid(),name:draft.name||draft.slides[0]?.blocks[0]?.text?.slice(0,65)||'My design',createdAt:original?.createdAt||now(),updatedAt:now(),canvases:pages,activeCanvasId:pages[index].id,projectType:pages.length===1?'post':'carousel',caption:draft.caption,captionDetached:true,sourceText:original?.sourceText??draft.source,sourceDraft:draft.source,contentEntryId:draft.contentEntryId||original?.contentEntryId,thumbnail:null};dispatch({type:'finish-content-draft',project});try{sessionStorage.removeItem('wpr-social-create-draft');}catch{}}catch(e){setError(e.message);}finally{setBusy(false);}};
  const textPanel=<section className="cw-words"><h2>{slide?'Your slide text':'Your words'}</h2>{!slide?<><label htmlFor="cw-source">Paste your text</label><textarea id="cw-source" className="cw-source" value={draft.source} onChange={e=>patch({source:e.target.value})} placeholder="Paste your story, article or notes. Use # for a new slide and ## for a subheading."/><button onClick={()=>patch({source:getExampleText()})}>Try example</button></>:<><label>Slide role<select value={slide.kind} onChange={e=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,kind:e.target.value,originalCanvas:null}:s)},true)}><option value="hook">Cover</option><option value="content">Content</option><option value="cta">Closing</option><option value="post">Single post</option></select></label>{slide.blocks.map((b,i)=><label key={b.id}>{b.role==='heading'?'Heading':b.role==='sub'?'Subheading':'Body text'}<textarea aria-label={`Slide ${index+1} ${b.role} ${i+1}`} value={b.text} onChange={e=>updateBlock(b.id,e.target.value)}/></label>)}<button onClick={()=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,blocks:[...s.blocks,contentBlock('sub','')]}:s)},true)}>Add subheading</button></>}
    <label>Slide ratio · whole carousel<select value={settings.size} onChange={e=>changeSetting('size',e.target.value)}><option value="portrait">Portrait · 4:5</option><option value="post">Square · 1:1</option></select></label>
    {slide?<details><summary>Source & splitting</summary><label>Original text<textarea value={draft.source} onChange={e=>patch({source:e.target.value})}/></label><ContentSplitOptions settings={settings} source={draft.source} onChange={changeSetting}/><button onClick={prepare}>Preview new split</button><p>Review before applying. This replaces slide edits only when you apply the new split.</p></details>:<><ContentSplitOptions settings={settings} source={draft.source} onChange={changeSetting}/><button className="cw-primary" onClick={prepare} disabled={!draft.source.trim()}>Prepare slides</button><details><summary>Improve with AI · optional</summary><p>This changes your words only when you choose it. Template switching never uses AI.</p><button disabled={busy||!draft.source.trim()} onClick={async()=>{setBusy(true);try{const r=await aiRepurposeAll({brand:state.brand,vocab:state.vocab,input:draft.source,platforms:['instagram-carousel'],counts:{'instagram-carousel':Number(settings.count)||4},provider:'gemini'});const text=r['instagram-carousel'];if(!text?.trim())throw new Error('AI returned no words. Your original text is kept.');setReview({source:text,slides:prepareContentSlides(text,settings).map(s=>({...s,look:'gentle'})),label:'Review AI wording'});}catch(e){setError(e.message);}finally{setBusy(false);}}}>{busy?'Preparing…':'Preview AI version'}</button></details></>}
    <details><summary>Caption & hashtags</summary><textarea aria-label="Caption and hashtags" value={draft.caption} onChange={e=>patch({caption:e.target.value})}/></details>
  </section>;
  return <div className="cw-shell"><SimpleStudioStyles/><header className="cw-header"><button onClick={back}>Back</button><div><small>WONDER PADS · CONTENT STUDIO</small><h1>Find your look</h1></div><SaveIndicator/></header><nav className="cw-mobile-tabs" aria-label="Text workspace sections">{['text','design'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t==='text'?'Text':'Design'}</button>)}</nav>
    <div className="cw-body"><div className="cw-columns"><div hidden={mobile&&tab!=='text'}>{textPanel}</div><main className="cw-design" hidden={mobile&&tab!=='design'}>{canvas?<><div className="cw-preview-heading"><span>Slide {index+1} of {canvases.length} · {slide.kind==='hook'?'Cover':slide.kind==='cta'?'Closing':slide.kind==='post'?'Single post':'Content'}</span><div><button aria-label="Previous slide" disabled={!index} onClick={()=>patch({index:index-1})}>‹</button><button aria-label="Next slide" disabled={index===canvases.length-1} onClick={()=>patch({index:index+1})}>›</button></div></div>
      {overflow.includes(index)&&<div className="cw-warning" role="status">Text needs more room. All words are kept.<div><button onClick={()=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,fit:true}:s)},true)}>Fit text</button><button onClick={()=>patch({slides:draft.slides.map((s,i)=>i===index?{...s,originalCanvas:null,look:'informative',fit:true}:s)},true)}>Roomier layout</button><button onClick={previewSplit}>Preview split</button></div></div>}
      <div className="cw-large-preview" onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;touch.current=null;if(Math.abs(dx)>45)patch({index:Math.max(0,Math.min(canvases.length-1,index+(dx<0?1:-1)))});}}><MiniPreview canvas={canvas} maxW={mobile?290:430} maxH={mobile?365:525} fluid/></div>
      <nav className="cw-thumbnails" aria-label="Carousel slides">{canvases.map((c,i)=><button key={c.id} aria-label={`Slide ${i+1}${overflow.includes(i)?' needs fitting':''}`} aria-pressed={i===index} onClick={()=>patch({index:i})}><MiniPreview canvas={c} maxW={48} maxH={53}/><span>{i+1}{overflow.includes(i)?' ⚠':''}</span></button>)}</nav>
      <div className="cw-strip-heading"><h2>Try a different look</h2><label>Apply to<select aria-label="Apply template to" value={scope} onChange={e=>setScope(e.target.value)}><option value="all">Whole carousel</option><option value="current">Current slide only</option></select></label></div><nav className="cw-families" aria-label="Template families">{['All','Floral','Editorial','Bold'].map(f=><button key={f} aria-pressed={family===f} onClick={()=>setFamily(f)}>{f}</button>)}</nav>
      <div className="cw-template-strip" aria-label="Template preview strip">{CONTENT_LOOKS.filter(l=>family==='All'||l.family===family).map(l=><button key={l.id} className="cw-look" aria-pressed={slide.look===l.id} onClick={()=>patch(contentWithLook(draft,l.id,scope),true)}><MiniPreview canvas={renderContentSlide(slide,settings,state.brand,{look:l.id,force:true})} maxW={95} maxH={119}/><span>{l.name}</span></button>)}</div><div className="cw-history"><button disabled={!undo.current.length} onClick={()=>travel(undo,redo)}>Undo</button><button disabled={!redo.current.length} onClick={()=>travel(redo,undo)}>Redo</button><span>Words and slide order stay the same.</span></div>
    </>:<div className="cw-empty"><h2>Your words, your look.</h2><p>Prepare your slides once. Then tap the template strip to compare designs using your own text.</p>{mobile&&<button onClick={()=>setTab('text')}>Enter your text</button>}</div>}</main></div></div>
    {error&&<p className="cw-error" role="alert">{error}</p>}<SaveErrorBanner/><footer className="cw-footer"><span>{canvases.length?`${canvases.length} slides${overflow.length?` · check ${overflow.length} for overflow`:''}`:'Start with your words'}</span><button className="cw-primary" disabled={busy||!canvas} onClick={proceed}>{busy?'Preparing…':'Continue editing'}</button></footer>
    {review&&<ContentReview review={review} original={draft.source} onCancel={()=>setReview(null)} onApply={()=>{patch({slides:review.slides,index:Math.min(index,review.slides.length-1),...(review.source?{source:review.source}:{})},true);setReview(null);setTab('design');}}/>}
  </div>;
}
function ContentSplitOptions({settings,source,onChange}) {
  return <div className="cw-split-options"><label>Make a<select value={settings.format} onChange={e=>onChange('format',e.target.value)}><option value="carousel">Carousel</option><option value="post">Single post</option></select></label>{settings.format!=='post'&&<><label>Split by<select value={settings.split} onChange={e=>onChange('split',e.target.value)}><option value="markers">My slide markers (#)</option><option value="paragraphs">Paragraphs</option><option value="balanced">Balanced length</option></select></label><label>Total slides<input type="number" min="2" max="30" value={settings.count} disabled={hasSlideMarks(source)||settings.split!=='balanced'} onChange={e=>onChange('count',Math.min(30,Math.max(2,Number(e.target.value)||2)))}/></label><p>{hasSlideMarks(source)?'Your # markers set the slide count. ## stays inside its slide.':'Count applies to balanced splitting; paragraphs and markers keep your own breaks.'} Cover and closing are included, with your own wording.</p><label className="cw-check"><input type="checkbox" checked={settings.cover} onChange={e=>onChange('cover',e.target.checked)}/>First slide is a cover</label><label className="cw-check"><input type="checkbox" checked={settings.closing} onChange={e=>onChange('closing',e.target.checked)}/>Last slide is a closing slide</label></>}</div>;
}
function ContentReview({review,original,onCancel,onApply}) {
  const ref=React.useRef(null);React.useEffect(()=>{ref.current.showModal();},[]);
  return <dialog className="cw-review" ref={ref} onCancel={onCancel}><h2>{review.label}</h2>{review.source&&<details><summary>Original wording</summary><pre>{original}</pre></details>}<p>{review.slides.length} slides. Apply only when you are happy with the wording and breaks.</p>{review.slides.map((s,i)=><section key={s.id}><strong>Slide {i+1}</strong>{s.blocks.map(b=><p key={b.id} style={{whiteSpace:'pre-wrap'}}>{b.text}</p>)}</section>)}<div><button onClick={onCancel}>Keep current slides</button><button onClick={onApply}>Apply this version</button></div></dialog>;
}

function SavedWritingGallery() {
  const {state,dispatch}=useStore();const [search,setSearch]=React.useState('');
  const entries=[...(state.savedRepurpose||[]),...(state.savedLaunches||[])].sort((a,b)=>(b.ts||0)-(a.ts||0));
  const writing=entries.flatMap(entry=>{const preferred=entry.outputs?.['instagram-carousel']||entry.outputs?.carousel||entry.sourceText;const text=Array.isArray(preferred)?preferred.join('\n\n'):preferred;return text?[{id:entry.id,text,title:text.split('\n')[0].replace(/^#+\s*/,''),ts:entry.ts}]:[];}).filter(e=>(e.title+' '+e.text).toLowerCase().includes(search.toLowerCase()));
  return <><label className="studio-work-search">Find writing<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="simple-grid">{writing.map(e=><div className="simple-card" key={e.id}><h3>{e.title.slice(0,90)}</h3><p className="cw-writing-excerpt">{e.text}</p><button className="simple-action" onClick={()=>openContentWords(state,dispatch,e.text)}>Use these words</button></div>)}</div>{!writing.length&&<p>No saved writing matches here.</p>}<button className="simple-action simple-secondary" onClick={()=>dispatch({type:'set-view',view:'history'})}>Open all saved writing and versions</button></>;
}
Object.assign(window,{CONTENT_LOOKS,contentLook,contentDraftNew,contentDraftFromPost,contentDraftFromProject,renderContentSlide,contentOverflow,prepareContentSlides,contentWithLook,contentSplitSlide,ContentWorkspace,SavedWritingGallery});
