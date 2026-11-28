// Library imports store words first. Only explicitly structured posts have slides.
function contentImportTitle(title,text){return String(title||'').trim()||String(text||'').trim().split(/\r?\n/)[0].slice(0,80)||'Untitled draft';}
function parsePlainContent(text,title=''){
  if(!String(text).trim())return {posts:[],errors:[],entries:[]};
  const post={kind:'draft',title:contentImportTitle(title,text),text:String(text),caption:'',hashtags:''};
  return {posts:[post],errors:[],entries:[{title:post.title,post}]};
}
function parseContentUpload(input){
  const posts=[],errors=[],entries=[];let current=null,mode='body',lineStart=1,orphan=[];
  const start=title=>({title,headline:'',body:[],caption:[],hashtags:[]});
  const invalid=(title,error,line)=>{errors.push(error);entries.push({title,error,line});};
  const finish=()=>{
    if(!current)return;
    const title=current.title.trim()||current.headline.trim()||'Untitled post';
    if(!current.headline.trim())invalid(title,'Add a ## headline below this post’s # title.',lineStart);
    else {const post={title,headline:current.headline.trim(),body:current.body.join('\n').trim(),caption:current.caption.join('\n').trim(),hashtags:current.hashtags.join('\n').trim()};posts.push(post);entries.push({title,post,line:lineStart});}
  };
  const orphanEnd=()=>{if(orphan.length){invalid(orphan[0].text.slice(0,80),'Start this entry with # Library title or ## Image headline, or save it in Plain text.',orphan[0].line);orphan=[];}};
  for(const [index,line] of String(input||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()){
    const title=line.match(/^#\s+(.+)$/),heading=line.match(/^##\s+(.+)$/),label=line.match(/^\s*(Caption|Hashtags):\s*(.*)$/i);
    if(title){orphanEnd();finish();current=start(title[1]);lineStart=index+1;mode='body';continue;}
    if(heading){orphanEnd();if(!current){current=start('');lineStart=index+1;}else if(current.headline){finish();current=start('');lineStart=index+1;}current.headline=heading[1];mode='body';continue;}
    if(!current){if(line.trim())orphan.push({text:line,line:index+1});continue;}
    if(label){mode=label[1].toLowerCase();if(label[2])current[mode].push(label[2]);continue;}
    current[mode].push(line);
  }
  orphanEnd();finish();return {posts,errors,entries};
}
function parseContentJson(input){
  const posts=[],errors=[],entries=[];
  if(!String(input).trim())return {posts,errors,entries};
  let data;try{data=JSON.parse(input);}catch{const error='This JSON is not valid. Check commas, quotes and brackets, or start with the example.';return {posts,errors:[error],entries:[{title:'JSON input',error}]};}
  if(data&&typeof data==='object'&&!Array.isArray(data)&&Object.prototype.hasOwnProperty.call(data,'posts')){
    if(Object.keys(data).some(k=>k!=='posts'))return {posts,errors:['The wrapper should contain only a posts array.'],entries:[{title:'JSON input',error:'The wrapper should contain only a posts array.'}]};data=data.posts;
  }
  const items=Array.isArray(data)?data:[data];
  if(!items.length||items.length>200){const error='Include between 1 and 200 entries.';return {posts,errors:[error],entries:[{title:'JSON input',error}]};}
  items.forEach((item,index)=>{
    let title='Entry '+(index+1);
    try{
      if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Each entry must be an object.');
      const string=(value,label,required=false)=>{if(value==null&&!required)return '';if(typeof value!=='string'||required&&!value.trim())throw Error(label+' must be '+(required?'a non-empty':'a')+' text string.');return value;};
      const format=item.format||(Object.prototype.hasOwnProperty.call(item,'text')?'draft':Array.isArray(item.slides)?'carousel':'single');
      if(!['draft','single','carousel'].includes(format))throw Error('Format must be draft, single or carousel.');
      const allowed=['title','format','caption','hashtags',...(format==='draft'?['text']:format==='single'?['headline','body']:['slides'])],extra=Object.keys(item).filter(k=>!allowed.includes(k));
      if(extra.length)throw Error('Unknown field: '+extra.join(', ')+'. Check the example for this format.');
      const name=string(item.title,'Title');title=name.trim()||title;
      const caption=string(item.caption,'Caption');
      const hashtags=Array.isArray(item.hashtags)?item.hashtags.map((v,i)=>string(v,'Hashtag '+(i+1),true)).join(' '):string(item.hashtags,'Hashtags');
      let post;
      if(format==='draft'){const text=string(item.text,'Text',true);post={kind:'draft',title:contentImportTitle(name,text),text,caption,hashtags};}
      if(format==='single'){const headline=string(item.headline,'Headline',true);post={title:name.trim()||headline,headline,body:string(item.body,'Body'),caption,hashtags};}
      if(format==='carousel'){
        if(!Array.isArray(item.slides)||item.slides.length<2||item.slides.length>30)throw Error('A carousel needs 2 to 30 slides.');
        const slides=item.slides.map((slide,i)=>{
          if(!slide||typeof slide!=='object'||Array.isArray(slide)||Object.keys(slide).some(k=>!['heading','body'].includes(k)))throw Error('Slide '+(i+1)+' should contain heading and body fields only.');
          return {title:string(slide.heading,'Slide '+(i+1)+' heading',true),body:string(slide.body,'Slide '+(i+1)+' body')};
        });post={kind:'carousel',title:name.trim()||slides[0].title,slides,caption,hashtags};
      }
      posts.push(post);entries.push({title:post.title,post,index});
    }catch(e){errors.push(title+': '+e.message);entries.push({title,error:e.message,index});}
  });return {posts,errors,entries};
}
function contentUploadKey(post){
  if(post.kind==='draft')return JSON.stringify(['draft',post.title,post.text,post.caption||'',post.hashtags||'']);
  if(post.kind==='carousel')return JSON.stringify(['carousel',post.title,post.slides,post.caption||'',post.hashtags||'']);
  return JSON.stringify([post.title,post.headline,post.body,post.caption,post.hashtags].map(s=>String(s||'').trim()));
}
function contentLibraryEntries(items,batchId){
  return items.map(p=>({id:uid(),packId:'user-uploads',librarySection:'uploads',importBatchId:batchId,uploadKey:p.uploadKey||contentUploadKey(p),title:p.title,
    caption:p.caption||'',hashtags:p.hashtags||'',platform:'instagram-caption',status:p.kind==='draft'?'draft':'queued',defaultSize:'portrait',stylePair:'clear',confirmation:'',ts:now(),
    ...(p.kind==='draft'?{format:'Draft',layout:'source-draft',sourceText:p.text,notes:'Saved writing. Choose a format when you are ready.'}:
      {format:p.kind==='carousel'?'Carousel':'Static post',layout:p.kind==='carousel'?'uploaded-carousel':'uploaded-single',hook:p.headline||p.slides[0].title,imageText:p.headline||p.slides[0].title,slides:p.slides||[{title:p.headline,body:p.body}],includeFullText:false,exactSlides:p.kind==='carousel',notes:'Your headline and body go on the image. Caption and hashtags stay separate.'})}));
}
const CONTENT_JSON_EXAMPLE=[
  {format:'draft',title:'An idea for later',text:'Paste your complete writing here. Choose its format later.'},
  {format:'single',title:'A handmade story',headline:'Made with care',body:'Each piece starts with your choice of fabric.',caption:'A little look behind the scenes.',hashtags:['#WonderPads','#Handmade']},
  {format:'carousel',title:'Getting started',slides:[{heading:'Start here',body:'A small change for your next cycle.'},{heading:'Find your fit',body:'Choose the length and absorbency that work for you.'}],caption:'Save this guide for later.',hashtags:'#WonderPads'}
];
function ContentUpload({existing,onImport,onClose}){
  const [tab,setTab]=React.useState('plain'),[sources,setSources]=React.useState({plain:'',structured:'',json:''}),[title,setTitle]=React.useState(''),[error,setError]=React.useState(''),[excluded,setExcluded]=React.useState([]);
  const id=React.useId(),fileSeq=React.useRef(0),alive=React.useRef(true);React.useEffect(()=>()=>{alive.current=false;fileSeq.current++;},[]);
  const source=sources[tab],result=React.useMemo(()=>source.length>2000000?{posts:[],entries:[{title:'Input',error:'Please split this into smaller batches of under 2 MB.'}],errors:['Input too large.']}:tab==='plain'?parsePlainContent(source,title):tab==='json'?parseContentJson(source):parseContentUpload(source),[source,title,tab]);
  const prior=new Map(existing.map(p=>[p.uploadKey,p.id]).filter(([key])=>key)),seen=new Set();
  const rows=result.entries.map((entry,i)=>{if(!entry.post)return {...entry,i};const key=contentUploadKey(entry.post),duplicate=prior.has(key)||seen.has(key);seen.add(key);return {...entry,key,duplicate,i};}),chosen=rows.filter(r=>r.post&&!r.duplicate&&!excluded.includes(r.i));
  const change=text=>{fileSeq.current++;setSources(s=>({...s,[tab]:text}));setExcluded([]);setError('');};
  const switchTab=next=>{fileSeq.current++;setTab(next);setExcluded([]);setError('');};
  const tabKeys=e=>{const keys=['plain','structured','json'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?keys[0]:e.key==='End'?keys[2]:keys[(keys.indexOf(tab)+(e.key==='ArrowRight'?1:2))%3];switchTab(next);document.getElementById(id+'-'+next)?.focus();};
  const read=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;const seq=++fileSeq.current,mode=tab;try{if(!(mode==='json'?/\.json$/i:/\.(txt|md)$/i).test(file.name))throw Error(mode==='json'?'Choose a .json file.':'Choose a .txt or .md file.');if(file.size>2000000)throw Error('Choose a file smaller than 2 MB.');const text=await file.text();if(alive.current&&seq===fileSeq.current){setSources(s=>({...s,[mode]:text}));setExcluded([]);setError('');}}catch(e){if(alive.current&&seq===fileSeq.current)setError(e.message);}};
  const jsonExample=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(CONTENT_JSON_EXAMPLE,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='wonder-pads-content-example.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const preview=post=>post.kind==='draft'?<pre className="content-import-words">{post.text}</pre>:<>{(post.slides||[{title:post.headline,body:post.body}]).map((s,i)=><article key={i} className="content-import-slide">{post.slides&&<small>Slide {i+1}</small>}<strong>{s.title}</strong><p>{s.body||'No body text'}</p></article>)}<small>Caption, off the image</small><p>{post.caption||'No caption'}</p><small>Hashtags</small><p>{post.hashtags||'No hashtags'}</p></>;
  return <section className="simple-card ready-fields content-import" aria-label="Add library content">
    <header><h2>Add content</h2><button className="simple-action simple-secondary" onClick={onClose}>Close</button></header>
    <div role="tablist" aria-label="Content input format" className="content-import-tabs" onKeyDown={tabKeys}>{[['plain','Plain text'],['structured','Structured text'],['json','JSON']].map(([key,label])=><button key={key} id={id+'-'+key} role="tab" tabIndex={tab===key?0:-1} aria-selected={tab===key} aria-controls={id+'-panel'} onClick={()=>switchTab(key)}>{label}</button>)}</div>
    <div role="tabpanel" id={id+'-panel'} aria-labelledby={id+'-'+tab}>
      <p className="simple-muted">{tab==='plain'?'Save your writing now. Choose a format and design later. No markers needed.':tab==='structured'?'Import image headlines and body text. Here, # starts a library post and ## marks its headline. These are posts, not carousel slide breaks.':'Paste JSON or upload a file. Drafts, single posts and carousels are supported.'}</p>
      {tab==='structured'&&<p className="simple-muted">Use Caption: and Hashtags: for words that stay off the image. Valid entries can be added even if another entry needs fixing.</p>}
      <label htmlFor={id+'-source'}>{tab==='plain'?'Your writing':tab==='structured'?'Structured posts':'JSON content'}</label>
      <textarea id={id+'-source'} aria-label={tab==='plain'?'Your writing':tab==='structured'?'Structured posts':'JSON content'} value={source} spellCheck={tab!=='json'} onChange={e=>change(e.target.value)} placeholder={tab==='plain'?'Paste or write your story, article or idea…':tab==='structured'?'# Library title\n## Headline on the image\nSupporting words on the image.\n\nCaption:\nWords for your social caption.\nHashtags: #WonderPads':'[\n  { "format": "draft", "title": "My idea", "text": "Your writing" }\n]'} className={tab==='json'?'content-import-code':''}/>
      {tab==='plain'&&<label>Library title <small>(optional)</small><input aria-label="Library title" value={title} onChange={e=>{setTitle(e.target.value);setExcluded([]);}} placeholder="Uses your first line if left empty"/></label>}
      <div className="content-import-utilities"><label className="content-import-file">{tab==='json'?'Upload .json':'Upload .txt or .md'}<input aria-label={tab==='json'?'Upload JSON file':'Upload text file'} type="file" accept={tab==='json'?'.json,application/json':'.txt,.md,text/plain,text/markdown'} onChange={read}/></label>{tab==='json'&&<button className="simple-action simple-secondary" onClick={jsonExample}>Download example</button>}</div>
      {tab!=='plain'&&<details><summary>See an example</summary><pre className="content-import-words">{tab==='json'?JSON.stringify(CONTENT_JSON_EXAMPLE,null,2):'# My library post\n## Headline on the image\nSupporting words on the image.\n\nCaption:\nWords for Instagram.\nHashtags: #WonderPads'}</pre>{!source&&<button className="simple-action simple-secondary" onClick={()=>change(tab==='json'?JSON.stringify(CONTENT_JSON_EXAMPLE,null,2):'# My library post\n## Headline on the image\nSupporting words on the image.\n\nCaption:\nWords for Instagram.\nHashtags: #WonderPads')}>Use this example</button>}</details>}
      {error&&<p role="alert">{error}</p>}
      <p role="status" className="content-import-count">{chosen.length} {tab==='plain'?'draft':(tab==='json'?'item':'post')+(chosen.length===1?'':'s')} ready to add{rows.some(r=>r.duplicate)?' · '+rows.filter(r=>r.duplicate).length+' already added or repeated':''}{result.errors.length?' · '+result.errors.length+' '+(result.errors.length===1?'entry needs':'entries need')+' fixing':''}</p>
      {rows.map(r=>r.error?<article key={r.i} className="content-import-invalid" role="alert"><strong>{r.title}</strong><p>{r.line?'Line '+r.line+': ':''}{r.error}</p><small>This entry will stay out of this import.</small></article>:<details key={r.i}><summary>{r.post.kind==='draft'?'Draft: ':''}{r.title}{r.duplicate?' · already added or repeated':''}</summary><label className="content-import-check"><input type="checkbox" disabled={r.duplicate} checked={!r.duplicate&&!excluded.includes(r.i)} onChange={e=>setExcluded(xs=>e.target.checked?xs.filter(x=>x!==r.i):[...xs,r.i])}/>Add this {r.post.kind==='draft'?'draft':'post'}</label>{preview(r.post)}</details>)}
      <footer><button className="simple-action" disabled={!chosen.length} onClick={()=>onImport(chosen.map(r=>({...r.post,uploadKey:r.key})))}>{tab==='plain'?'Save draft':'Add '+chosen.length+(result.errors.length?' valid':'')+' '+(tab==='json'?(chosen.length===1?'item':'items'):(chosen.length===1?'post':'posts'))}</button><p className="simple-muted">Saved in this browser on this device. No automatic sync. Use an editable backup to move content to another device.</p></footer>
    </div>
  </section>;
}
Object.assign(window,{parseContentUpload,parsePlainContent,parseContentJson,contentUploadKey,contentLibraryEntries,ContentUpload});

function LibraryImportNotice({receipt,onOpen,onView,onUndo}){
  const {state,retrySave}=useStore(),[saved,setSaved]=React.useState(false),key=receipt.ids.join('|');
  React.useEffect(()=>{setSaved(false);},[key]);
  React.useEffect(()=>{let alive=true;studioStorage.read().then(snapshot=>{const ids=new Set((snapshot?.state?.calendar||[]).map(p=>p.id));if(alive&&receipt.ids.every(id=>ids.has(id)))setSaved(true);}).catch(()=>{});return()=>{alive=false;};},[key,state.savedAt]);
  const amount=receipt.ids.length,noun=receipt.drafts===amount?'draft':receipt.drafts===0?'post':'item',failed=state.saveStatus==='error';
  return <section className="content-import-notice" aria-label="Library save confirmation"><p role={failed?'alert':'status'}>{failed?'Your content is in the workspace, but this browser could not save it.':saved?'Added '+amount+' '+noun+(amount===1?'':'s')+' to your library.':'Saving '+amount+' '+noun+(amount===1?'':'s')+' to your library…'}</p><div className="ready-actions">{failed&&<button className="simple-action" onClick={retrySave}>Retry save</button>}<button className="simple-action" onClick={onOpen}>{amount>1?'Open first item':receipt.drafts?'Open draft':'Open post'}</button><button className="simple-action simple-secondary" onClick={onView}>View added items</button><button className="simple-action simple-secondary" onClick={onUndo}>Undo</button></div>{saved&&<small>Saved on this device. Use an editable backup to move it to another device.</small>}</section>;
}
function LibrarySourceDraft({post,onChange,onStart,onReuse,onOpenDesign}){
  return <section className="library-source-draft"><p className="simple-muted">Your writing is saved without a layout. Choose what to make when you are ready.</p><div className="ready-actions"><button className="simple-action" onClick={()=>onStart('carousel')}>Make a carousel</button><button className="simple-action simple-secondary" onClick={()=>onStart('post')}>Make a single post</button><button className="simple-action simple-secondary" onClick={onReuse}>Reuse my words</button>{onOpenDesign&&<button className="simple-action simple-secondary" onClick={onOpenDesign}>Open saved design</button>}</div><label>Library title<input aria-label="Draft library title" value={post.title} onChange={e=>onChange({title:e.target.value})}/></label><label>Your saved writing<textarea aria-label="Saved writing" value={post.sourceText} onChange={e=>onChange({sourceText:e.target.value})}/></label><p className="simple-muted">Edits save automatically in this browser. Your library draft stays available when you create a design.</p></section>;
}
