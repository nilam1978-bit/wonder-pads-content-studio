// Simple carousel workflow: words -> slide cards -> design.
const { useState: scS, useMemo: scM } = React;

function mergeCarouselCanvasEdits(existing, freshCanvases) {
  return freshCanvases.map((fresh, canvasIndex) => {
    const old = existing.canvases.find(c => c.__slideId === fresh.__slideId)
      || existing.canvases[canvasIndex];
    if (!old || old.w !== fresh.w || old.h !== fresh.h) return fresh;

    const freshText = fresh.elements.filter(el => el.type === 'text');
    const usedFresh = new Set();
    const byRole = new Map(freshText.filter(el => el.__role).map(el => [el.__role, el]));
    const nextText = (oldEl) => {
      if (oldEl.__role && byRole.has(oldEl.__role)) {
        const match = byRole.get(oldEl.__role);
        usedFresh.add(match.id);
        return match;
      }
      const match = freshText.find(el => !usedFresh.has(el.id));
      if (match) usedFresh.add(match.id);
      return match;
    };
    const elements = old.elements.map(el => {
      if (el.type !== 'text') return el;
      const freshEl = nextText(el);
      return freshEl ? { ...el, text: freshEl.text } : el;
    });

    // If the template gained a generated text role, add only that missing role.
    freshText.forEach(el => {
      if (!usedFresh.has(el.id) && el.__role) elements.push(el);
    });

    return {
      ...old,
      name: fresh.name,
      __slideId: fresh.__slideId,
      elements,
    };
  });
}

function SimpleCarouselFlow() {
  const { state, dispatch } = useStore();
  const carousel = state.carousel;
  const slides = carousel.slides || [];
  const [source, setSource] = scS('new');
  const [input, setInput] = scS('');
  const [busy, setBusy] = scS('');
  const [message, setMessage] = scS('');
  const [dragIndex, setDragIndex] = scS(null);
  const canvases = scM(() => buildCarouselCanvases(carousel, state.brand), [carousel, state.brand]);
  const update = patch => dispatch({ type: 'update-carousel', patch });

  const makeSlides = text => {
    const parsed = parseCarouselText(text || '');
    if (!parsed.length) { setMessage('Add some words first.'); return; }
    const decorated = decorateSlides(parsed, carousel);
    update({ slides: decorated });
    setMessage(`${decorated.length} slides are ready to review.`);
  };

  const repurpose = async () => {
    if (!input.trim()) { setMessage('Paste the old content you want to reuse.'); return; }
    setBusy('repurpose'); setMessage('');
    try {
      const result = await aiRepurposeAll({
        brand: state.brand, vocab: state.vocab, input: input.trim(),
        platforms: ['instagram-carousel'], counts: { 'instagram-carousel': 7 }, provider: 'gemini',
      });
      const text = result['instagram-carousel'] || '';
      makeSlides(text);
    } catch (error) {
      setMessage(error.message || 'Gemini could not repurpose this just now.');
    } finally { setBusy(''); }
  };

  const improveAll = async () => {
    if (!slides.length) return;
    setBusy('all'); setMessage('');
    try {
      const text = await aiGenerate({
        brand: state.brand, vocab: state.vocab, provider: 'gemini',
        task: 'Improve this Instagram carousel. Keep the same meaning and roughly the same number of slides. Make each slide warm, clear and concise. Separate slides with a blank line. Put each slide title on its first line and supporting copy after it.',
        input: slides.filter(s => s.kind !== 'outro').map(s => [s.heading, s.body].filter(Boolean).join('\n')).join('\n\n'),
        platform: 'Instagram carousel',
      });
      makeSlides(text);
    } catch (error) { setMessage(error.message || 'Gemini could not improve the slides just now.'); }
    finally { setBusy(''); }
  };

  const rewriteSlide = async slide => {
    setBusy(slide.id); setMessage('');
    try {
      const text = await aiGenerate({
        brand: state.brand, vocab: state.vocab, provider: 'gemini',
        task: 'Rewrite this one Instagram carousel slide. Keep the meaning, make it clearer and more engaging. Return a short title on the first line, a blank line, then concise body copy.',
        input: [slide.heading, slide.body].filter(Boolean).join('\n\n'), platform: 'Instagram carousel slide',
      });
      const parsed = parseCarouselText(text)[0];
      if (parsed) updateSlide(slide.id, { heading: parsed.heading, body: parsed.body });
    } catch (error) { setMessage(error.message || 'Gemini could not rewrite this slide just now.'); }
    finally { setBusy(''); }
  };

  const updateSlide = (id, patch) => update({ slides: slides.map(s => s.id === id ? { ...s, ...patch } : s) });
  const duplicateSlide = id => {
    const index = slides.findIndex(s => s.id === id); if (index < 0) return;
    const copy = { ...JSON.parse(JSON.stringify(slides[index])), id: uid(), kind: 'content' };
    update({ slides: [...slides.slice(0, index + 1), copy, ...slides.slice(index + 1)] });
  };
  const deleteSlide = id => {
    if (confirm('Delete this slide?')) update({ slides: slides.filter(s => s.id !== id) });
  };
  const addSlide = () => {
    const slide = { id: uid(), kind: 'content', label: null, heading: 'New slide', body: '' };
    const outro = slides.findIndex(s => s.kind === 'outro');
    update({ slides: outro < 0 ? [...slides, slide] : [...slides.slice(0, outro), slide, ...slides.slice(outro)] });
  };
  const splitSlide = id => {
    const index = slides.findIndex(s => s.id === id); const slide = slides[index];
    if (!slide?.body?.trim()) { setMessage('Add body text before splitting this slide.'); return; }
    const words = slide.body.trim().split(/\s+/); const middle = Math.ceil(words.length / 2);
    if (words.length < 4) { setMessage('This slide is too short to split.'); return; }
    const first = { ...slide, body: words.slice(0, middle).join(' ') };
    const second = { ...slide, id: uid(), kind: 'content', heading: '', body: words.slice(middle).join(' ') };
    update({ slides: [...slides.slice(0, index), first, second, ...slides.slice(index + 1)] });
  };
  const mergeSlide = (id, direction) => {
    const index = slides.findIndex(s => s.id === id); const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= slides.length || slides[targetIndex].kind === 'outro') return;
    const a = direction < 0 ? slides[targetIndex] : slides[index];
    const b = direction < 0 ? slides[index] : slides[targetIndex];
    const merged = { ...a, heading: a.heading || b.heading, body: [a.body, b.heading, b.body].filter(Boolean).join('\n\n') };
    const next = slides.filter((_, i) => i !== index && i !== targetIndex);
    next.splice(Math.min(index, targetIndex), 0, merged); update({ slides: next });
  };
  const reorder = (from, to) => {
    if (from == null || from === to) return;
    const next = [...slides]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); update({ slides: next });
  };

  const continueToDesign = () => {
    if (!canvases.length) { setMessage('Create at least one slide first.'); return; }
    const existing = state.projects.find(p => p.id === carousel.simpleProjectId);
    if (existing) {
      const mergedCanvases = mergeCarouselCanvasEdits(existing, canvases);
      dispatch({ type: 'update-project', id: existing.id, patch: {
        name: (slides.find(s => s.kind !== 'outro')?.heading || existing.name).slice(0, 50),
        canvases: mergedCanvases,
        projectType: 'carousel',
        activeCanvasId: mergedCanvases.some(c => c.id === existing.activeCanvasId)
          ? existing.activeCanvasId : mergedCanvases[0]?.id,
      } });
      dispatch({ type: 'open-project', id: existing.id });
      return;
    }
    const project = { id: uid(), name: (slides.find(s => s.kind !== 'outro')?.heading || 'My carousel').slice(0, 50), createdAt: now(), updatedAt: now(), thumbnail: null, projectType: 'carousel', canvases, activeCanvasId: canvases[0].id };
    dispatch({ type: 'create-project', project });
    dispatch({ type: 'update-carousel', patch: { simpleProjectId: project.id } });
  };

  return <div className="sc-shell"><SimpleStudioStyles/><SimpleCarouselStyles/>
    <header className="sc-header">
      <button className="sc-back" onClick={() => dispatch({ type: 'set-view', view: 'home' })}>← Create</button>
      <div><strong>Create a carousel</strong><small>Words first, then design</small></div>
      <button className="simple-action" disabled={!slides.length} onClick={continueToDesign}>Continue to Design →</button>
    </header>
    <main className="sc-main"><div className="sc-inner">
      <section className="sc-panel">
        <div className="sc-stage"><span>1</span><div><h1>Add your words</h1><p>Start fresh or reuse something you have already written.</p></div></div>
        <div className="sc-source-tabs">
          <button aria-current={source === 'new'} onClick={() => setSource('new')}>New text</button>
          <button aria-current={source === 'reuse'} onClick={() => setSource('reuse')}>Reuse old content with AI</button>
        </div>
        <textarea className="sc-source" value={input} onChange={e => setInput(e.target.value)} placeholder={source === 'new' ? 'Paste or type your carousel text. Leave a blank line between slides.' : 'Paste an old caption, article, email or product story here.'}/>
        <div className="sc-row sc-wrap">
          {source === 'new' ? <button className="simple-action" onClick={() => makeSlides(input)}>Create slides</button> : <button className="simple-action" disabled={!!busy} onClick={repurpose}>{busy === 'repurpose' ? 'Gemini is writing…' : 'Repurpose with Gemini'}</button>}
          <button className="simple-action simple-secondary" onClick={() => { setInput(getExampleText()); setMessage('Example added.'); }}>Try example</button>
          <button className="sc-link" onClick={() => { setInput(''); setMessage(''); }}>Clear</button>
        </div>
      </section>

      <section className="sc-panel">
        <div className="sc-stage"><span>2</span><div><h2>Choose the carousel size</h2><p>You can change this before entering Design.</p></div></div>
        <div className="sc-aspects">{CAROUSEL_SIZES.map(size => <button key={size.id} aria-current={carousel.size === size.id} onClick={() => update({ size: size.id })}><b>{size.label}</b><small>{size.w} × {size.h}</small></button>)}</div>
      </section>

      <section className="sc-panel">
        <div className="sc-section-head"><div className="sc-stage"><span>3</span><div><h2>Review your slides</h2><p>Edit the words here. Colours, fonts and layouts come next.</p></div></div><div className="sc-row sc-wrap"><button className="simple-action simple-secondary" disabled={!slides.length || !!busy} onClick={improveAll}>{busy === 'all' ? 'Improving…' : '✦ Improve all with Gemini'}</button><button className="sc-link" onClick={addSlide}>+ Add slide</button></div></div>
        {!slides.length && <div className="sc-empty">Your slide cards will appear here.</div>}
        <div className="sc-slides">{slides.map((slide, index) => <SimpleSlideCard key={slide.id} slide={slide} index={index} count={slides.length} busy={busy === slide.id} onUpdate={patch => updateSlide(slide.id, patch)} onRewrite={() => rewriteSlide(slide)} onDuplicate={() => duplicateSlide(slide.id)} onSplit={() => splitSlide(slide.id)} onMergePrev={() => mergeSlide(slide.id, -1)} onMergeNext={() => mergeSlide(slide.id, 1)} onDelete={() => deleteSlide(slide.id)} onDragStart={() => setDragIndex(index)} onDrop={() => { reorder(dragIndex, index); setDragIndex(null); }}/>)}</div>
        {message && <p className="sc-message" role="status">{message}</p>}
      </section>
    </div></main>
    <footer className="sc-footer"><span>{slides.length} slide{slides.length === 1 ? '' : 's'} ready</span><button className="simple-action" disabled={!slides.length} onClick={continueToDesign}>Continue to Design →</button></footer>
  </div>;
}

function SimpleSlideCard({ slide, index, count, busy, onUpdate, onRewrite, onDuplicate, onSplit, onMergePrev, onMergeNext, onDelete, onDragStart, onDrop }) {
  const [open, setOpen] = scS(false);
  const label = slide.kind === 'cover' ? 'HOOK' : slide.kind === 'outro' ? 'FINAL' : `SLIDE ${index + 1}`;
  return <article className="sc-slide" draggable={slide.kind !== 'outro'} onDragStart={onDragStart} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
    <div className="sc-slide-head"><span className="sc-grip">⠿</span><strong>Slide {index + 1}</strong><span className="sc-kind">{label}</span><button className="sc-dots" aria-label="Slide actions" onClick={() => setOpen(!open)}>⋮</button>
      {open && <div className="sc-menu"><button onClick={() => { setOpen(false); onRewrite(); }}>✦ Rewrite with Gemini</button><button onClick={() => { setOpen(false); onDuplicate(); }}>Duplicate slide</button><button onClick={() => { setOpen(false); onSplit(); }}>Split slide</button><button disabled={index === 0} onClick={() => { setOpen(false); onMergePrev(); }}>Merge with previous</button><button disabled={index >= count - 1} onClick={() => { setOpen(false); onMergeNext(); }}>Merge with next</button><button className="danger" onClick={() => { setOpen(false); onDelete(); }}>Delete slide</button></div>}
    </div>
    {slide.kind === 'outro' ? <p className="sc-outro">Your saved brand logo and contact details will be used on the final slide.</p> : <><label>Title<input value={slide.heading || ''} onChange={e => onUpdate({ heading: e.target.value })}/></label><label>Body<textarea value={slide.body || ''} onChange={e => onUpdate({ body: e.target.value })}/></label></>}
    {busy && <div className="sc-busy">Gemini is rewriting this slide…</div>}
  </article>;
}

function SimpleCarouselStyles() { return <style>{`
  .sc-shell{height:var(--studio-viewport-height,100dvh);display:flex;flex-direction:column;background:#fcf3fa;color:#2a1f2a;overflow:hidden}.sc-header{height:68px;padding:0 24px;background:#fff;border-bottom:1px solid #eadbe6;display:flex;align-items:center;gap:18px;flex-shrink:0}.sc-header>div{flex:1}.sc-header strong{display:block;font:22px 'DM Serif Display',serif}.sc-header small{color:#846f7f}.sc-back,.sc-link{border:0;background:transparent;color:#8f3d7b;padding:8px;font:inherit}.sc-main{flex:1;overflow:auto;padding:24px}.sc-inner{max-width:880px;margin:auto;display:grid;gap:16px}.sc-panel{background:#fff;border:1px solid #eadbe6;border-radius:18px;padding:22px}.sc-stage{display:flex;gap:12px;align-items:flex-start}.sc-stage>span{width:28px;height:28px;border-radius:50%;background:#f2d8ea;color:#913e7d;display:grid;place-items:center;font-weight:700;flex-shrink:0}.sc-stage h1,.sc-stage h2{font:24px 'DM Serif Display',serif;margin:0}.sc-stage p{margin:3px 0 14px;color:#7b6675;font-size:13px}.sc-source-tabs{display:flex;gap:6px;margin:4px 0 10px}.sc-source-tabs button{border:0;padding:10px 14px;border-radius:10px;background:#f8edf5;color:#6d5968}.sc-source-tabs button[aria-current=true]{background:#efd1e7;color:#883672}.sc-source{width:100%;min-height:140px;box-sizing:border-box;border:1px solid #decbd9;border-radius:12px;padding:14px;font:15px/1.55 inherit;resize:vertical}.sc-row{display:flex;align-items:center;gap:8px;margin-top:10px}.sc-wrap{flex-wrap:wrap}.sc-aspects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sc-aspects button{padding:14px;border-radius:12px;border:1px solid #eadbe6;background:#fdf8fb;color:#493a45;text-align:left}.sc-aspects button[aria-current=true]{border:2px solid #b54b98;background:#f4dced;color:#84336f}.sc-aspects small{display:block;margin-top:3px;color:#846f7f}.sc-section-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.sc-slides{display:grid;gap:14px;margin-top:8px}.sc-slide{position:relative;border:1px solid #e4d5df;border-radius:16px;padding:18px;background:#fff}.sc-slide-head{display:flex;align-items:center;gap:8px;margin-bottom:15px}.sc-grip{color:#cbb6c5;cursor:grab}.sc-kind{font-size:10px;font-weight:700;background:#4e7f53;color:#fff;border-radius:5px;padding:2px 7px}.sc-dots{margin-left:auto;border:0;background:transparent;font-size:24px;line-height:1;padding:3px 8px}.sc-menu{position:absolute;right:18px;top:48px;z-index:5;background:#fff;border:1px solid #decbd9;border-radius:12px;padding:6px;box-shadow:0 12px 28px rgba(50,25,44,.16);width:205px}.sc-menu button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:10px;border-radius:8px;color:#493a45}.sc-menu button:hover{background:#faedf6}.sc-menu button:disabled{opacity:.35}.sc-menu .danger{color:#c52852;border-top:1px solid #eadbe6}.sc-slide label{display:block;text-transform:uppercase;letter-spacing:.06em;font-size:11px;color:#8b7685;margin:12px 0 5px}.sc-slide input,.sc-slide textarea{display:block;width:100%;box-sizing:border-box;border:1px solid #decbd9;border-radius:12px;padding:12px 14px;color:#2a1f2a;background:#fff;font:16px/1.45 inherit;text-transform:none;letter-spacing:normal}.sc-slide input{font-size:18px;font-weight:650}.sc-slide textarea{min-height:105px;resize:vertical}.sc-outro,.sc-empty{padding:18px;border-radius:12px;background:#fbf3f9;color:#806a79}.sc-message,.sc-busy{color:#8e3979;font-size:13px}.sc-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 24px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #eadbe6;flex-shrink:0;color:#7b6675;font-size:13px}
  @media(max-width:640px){.sc-header{height:auto;padding:10px 12px;gap:8px}.sc-header strong{font-size:17px}.sc-header small,.sc-header>.simple-action{display:none}.sc-back{font-size:12px;padding:5px}.sc-main{padding:12px}.sc-panel{padding:15px;border-radius:14px}.sc-stage h1,.sc-stage h2{font-size:20px}.sc-source-tabs{display:grid;grid-template-columns:1fr 1fr}.sc-source-tabs button{padding:9px 6px;font-size:12px}.sc-aspects{grid-template-columns:1fr 1fr}.sc-section-head{display:block}.sc-slide{padding:14px}.sc-slide input{font-size:16px}.sc-slide textarea{min-height:92px}.sc-footer{padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px))}.sc-footer span{display:none}.sc-footer .simple-action{width:100%}}
`}</style>; }

Object.assign(window, { SimpleCarouselFlow, SimpleSlideCard, SimpleCarouselStyles });
