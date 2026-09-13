// AI wrappers + Content Repurposer seed data.
// The existing built-in writer remains the default. Gemini is an optional,
// server-side alternative exposed through /api/gemini (Cloudflare Pages Function).

// ==================== SEED DATA ====================
// User can override any of these in Brand Kit.
const CONTENT_SEED = {
  voiceTags: ['warm', 'friendly', 'chatty', 'affirming', 'body-positive', 'cozy', 'no-nonsense', 'handmade'],
  voiceDo: [
    "talk like you're texting a friend",
    "use lowercase sometimes for softness",
    "say 'your flow' 'your body' 'your rhythm'",
    "be reassuring about the switch to cloth",
    "celebrate periods, don't hide them",
    "keep sentences short & warm",
  ],
  voiceDont: [
    "avoid clinical / medical-sounding language",
    "no shame-y phrases like 'discreet' or 'hidden'",
    "no fake urgency or hype (\"LAST CHANCE!!!\")",
    "no jargon without explaining it",
    "avoid pink-tax pastels-only aesthetic clichés",
  ],
  aboutLine: 'handmade reusable cloth pads, made with love — cotton woven tops, bamboo hemp cores, soft fleece backing.',

  vocab: [
    { id: 'v1', term: 'cloth pad', def: 'reusable cotton menstrual pad' },
    { id: 'v2', term: 'reusable pad', def: "same thing, different name — often used by folks new to cloth" },
    { id: 'v3', term: 'topper', def: 'the top layer that touches your skin — ours is cotton woven' },
    { id: 'v4', term: 'core', def: 'the absorbent layers in the middle — ours is bamboo hemp fleece' },
    { id: 'v5', term: 'backing', def: 'the outside/back layer — ours is soft shell fleece with hidden PUL' },
    { id: 'v6', term: 'PUL', def: 'polyurethane laminate — thin waterproof layer inside the backing' },
    { id: 'v7', term: 'wing', def: 'the flaps that wrap under your undies with a snap' },
    { id: 'v8', term: 'snap width', def: 'distance from snap to snap when the wings are open' },
    { id: 'v9', term: 'length', def: 'from tip to tip along the pad' },
    { id: 'v10', term: 'absorbency', def: 'how much liquid the pad holds — liner / light / reg / heavy / overnight' },
    { id: 'v11', term: 'postpartum', def: 'the weeks after giving birth — needs heaviest absorbency' },
    { id: 'v12', term: 'made-to-order', def: 'each pad sewn after you buy it, not from a warehouse' },
  ],

  copyBlocks: [
    { id: 'wash-basic', title: 'how to wash your pads', category: 'care',
      content: "hi! so — rinse in cold water right after use (this is the trick that keeps stains away). then toss in with your regular wash on cold or warm, mild detergent, no fabric softener. line dry if you can, tumble low if you can't. that's it. no soaking, no stress. your pads will last for years." },
    { id: 'absorbency', title: 'which absorbency do i need?', category: 'education',
      content: "quick guide:\n• liner — spotting, discharge, backup\n• light — light days, teens, tweens\n• regular — most days for most bodies\n• heavy — heavy days, postpartum start of period\n• overnight — sleep, super heavy days, postpartum\n\nnot sure? most people love a set with 2 regulars + 1 heavy + 1 overnight to cover a whole cycle." },
    { id: 'day-vs-night', title: 'day pad vs night pad', category: 'education',
      content: "day pads are shorter (usually 8–10\") so they sit comfy while you're moving around. night pads are longer (12–14\") with extra core in the back — because gravity is real when you sleep! both have the same soft cotton top and leakproof backing. it's really just about length + how much you bleed." },
    { id: 'first-time', title: 'new to cloth pads?', category: 'education',
      content: "welcome!! okay so here's the honest truth: it's easier than you think. you snap it around your undies just like a disposable, wear it, rinse it after, wash it with your regular laundry. no special products. no soaking bin (unless you want one). the switch takes about one cycle to feel totally normal. and your body will thank you — no more that plastic-y feeling." },
    { id: 'shipping', title: 'shipping & turnaround', category: 'logistics',
      content: "each pad is made by me, one at a time, so orders ship in 2–3 weeks. i'll email you when yours ships. custom orders take a little longer (3–4 weeks) — worth the wait, promise." },
    { id: 'materials', title: 'what are these made of?', category: 'education',
      content: "top layer → 100% cotton woven (soft, breathable, gentle on skin)\ncore → bamboo hemp fleece (bamboo wicks moisture, hemp is antimicrobial, together they hold a LOT)\nbacking → soft shell fleece with a hidden PUL layer (waterproof but breathable)\n\nno plastic against your skin. ever." },
    { id: 'stains', title: 'what about stains?', category: 'care',
      content: "real talk — some staining is normal and totally fine. it doesn't affect how the pad works. but if you want them looking fresh: rinse in cold water immediately (never hot — hot sets blood stains), and lay them in the sun for a few hours after washing. sunshine bleaches stains like magic. no lie." },
  ],

  products: [
    { id: 'p1', name: 'everyday regular', absorbency: 'regular', length: "10\"", snapWidth: "2.75\"",
      fabric: 'cotton woven top, bamboo hemp core, soft shell fleece back', price: 18,
      notes: 'our bestseller — most people order 3–5 of these' },
    { id: 'p2', name: 'overnight long', absorbency: 'overnight', length: "14\"", snapWidth: "2.75\"",
      fabric: 'cotton woven top, double bamboo hemp core, soft shell fleece back', price: 26,
      notes: 'extra core in the back third for sleeping' },
    { id: 'p3', name: 'petite liner', absorbency: 'liner', length: "7\"", snapWidth: "2.25\"",
      fabric: 'cotton woven top, single bamboo layer, soft shell fleece back', price: 12,
      notes: 'for spotting, discharge, or backup with a cup' },
  ],

  launchAngles: [
    'brand new product launch',
    'restock of a favourite',
    'limited edition print / fabric',
    'seasonal drop (spring, autumn etc)',
    'customer favourite spotlight',
    'back in stock alert',
  ],

  repurposeTemplates: {
    'instagram-caption':  { label: 'Instagram caption',    hint: 'warm, chatty, 2–4 short paragraphs, ending with a soft CTA & question' },
    'instagram-carousel': { label: 'Instagram carousel',   hint: 'N punchy slides — first is the hook, last is a soft CTA, middle slides are the meat. Return one slide per double-newline.', bridge: 'carousel', variableCount: true, defaultCount: 6, minCount: 3, maxCount: 10 },
    'tiktok-hook':        { label: 'TikTok hook + script', hint: 'one killer hook line + a 30–45 sec spoken script' },
    'facebook-post':      { label: 'Facebook post',        hint: 'slightly longer, more storytelling, friendly-community tone' },
    'youtube-shorts':     { label: 'YouTube Shorts',       hint: 'punchy title (under 60 chars) + 2-line description' },
    'story-frames':       { label: 'Story frames',         hint: 'N tap-through frames — text-only, one sentence each, feels like texting. Return one frame per double-newline.', bridge: 'carousel', variableCount: true, defaultCount: 4, minCount: 3, maxCount: 8 },
    'website-blurb':      { label: 'Website blurb',        hint: 'a warm 3–4 sentence intro suitable for the shop page or blog' },
    'reel-hook':          { label: 'Reel hooks (5)',       hint: '5 different opening lines to grab attention in 3 seconds' },
  },
};

// ==================== AI WRAPPERS ====================
async function aiComplete({ messages, provider = 'built-in' }) {
  if (provider === 'gemini') {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      throw new Error(payload.error || 'Gemini is not connected yet.');
    }
    return payload.text || '';
  }
  if (!window.genspark?.complete) {
    throw new Error('The built-in writer is unavailable in this deployment.');
  }
  return window.genspark.complete({ messages });
}

function buildBrandContext(brand, vocab) {
  const voiceDo = (brand.voiceDo || []).map(x => `- ${x}`).join('\n');
  const voiceDont = (brand.voiceDont || []).map(x => `- ${x}`).join('\n');
  const vocabLines = (vocab || []).slice(0, 12).map(v => `- ${v.term}: ${v.def}`).join('\n');
  const tags = (brand.voiceTags || []).join(', ');
  const name = brand.shopName || 'the brand';
  const tagline = brand.tagline || '';
  const aboutLine = brand.aboutLine || '';
  const rules = brand.voiceRules || {};
  const examples = (brand.voiceExamples || []).filter(e => e.text && e.text.trim());

  // Style-rule lines — only add rules the user has enabled.
  const styleLines = [];
  if (rules.capitalizeSentences !== false) {
    styleLines.push("Capitalise the first letter of every sentence. Sentence case throughout — do NOT write in all-lowercase.");
  } else {
    styleLines.push("Use lowercase where it feels natural — soft, chatty, texting-a-friend energy.");
  }
  if (rules.avoidEmDashes !== false) {
    styleLines.push("Do NOT use em-dashes (—) or en-dashes (–). Use commas, periods, or 'and' instead.");
  }

  // Real examples are the strongest signal — model matches these better than any rule list.
  const examplesBlock = examples.length
    ? `\n\nREAL POSTS FROM THIS BRAND (match this voice exactly — cadence, rhythm, sentence length, quirks):\n${examples.slice(0, 6).map((e, i) => `Example ${i + 1}${e.note ? ` (${e.note})` : ''}:\n"""\n${e.text.trim()}\n"""`).join('\n\n')}`
    : '';

  return `You are writing social media copy for "${name}".

TAGLINE: ${tagline}
ABOUT: ${aboutLine}

VOICE (${tags}):
DO:
${voiceDo || '- warm, friendly, chatty'}

DON'T:
${voiceDont || '- no fake urgency, no jargon without explanation'}

PRODUCT VOCABULARY (use these terms correctly):
${vocabLines || '- (no custom vocabulary defined)'}

STYLE RULES (hard constraints):
${styleLines.map(l => '- ' + l).join('\n')}${examplesBlock}

Write in the brand voice. Be warm, chatty, human. Never use emoji unless explicitly asked. Never use hashtags unless asked. Never invent facts about products. If you don't have info, keep it general. Keep it short and punchy — no filler.`;
}

// Idea starters — surface 10 post ideas tailored to this brand.
async function aiGenerateIdeas({ brand, vocab, products = [], recentSubjects = [], provider = 'built-in' }) {
  const system = buildBrandContext(brand, vocab);
  const productList = products.slice(0, 8).map(p => `- ${p.name} (${p.absorbency || 'general'}${p.price ? `, $${p.price}` : ''})`).join('\n');
  const recentBlock = recentSubjects.length
    ? `\n\nAVOID (recently posted about — pick fresh angles):\n${recentSubjects.slice(0, 8).map(s => `- ${s}`).join('\n')}`
    : '';

  const userPrompt = `Give me 10 short, distinct post ideas for this brand's social media.

Mix these angles:
- product spotlight (using one specific product from the catalog)
- educational / behind-the-scenes (why we do things this way)
- customer FAQ answered warmly
- seasonal or timely (this month, this week)
- personal / founder voice
- practical tip / how-to

PRODUCT CATALOG:
${productList || '- (no products defined)'}${recentBlock}

Return format (strict JSON, no markdown fence, no commentary):
{ "ideas": [
  { "title": "short punchy label (5-8 words)", "seed": "the idea in one sentence the user can paste into a post writer", "angle": "spotlight | education | faq | seasonal | personal | tip" },
  ...10 total
]}`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: userPrompt },
  ];
  const text = await aiComplete({ messages, provider });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('no JSON in AI response');
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.ideas || [];
}

// Post-process AI output to enforce style rules. Belt-and-suspenders — the model may drift.
function applyVoiceRules(text, brand) {
  if (typeof text !== 'string') return text;
  const rules = (brand && brand.voiceRules) || {};
  let out = text;

  if (rules.avoidEmDashes !== false) {
    // Replace em/en dash surrounded by spaces with ", ".
    out = out.replace(/\s*[—–]\s*/g, ', ');
    // Tighten any accidental double punctuation from the swap.
    out = out.replace(/,\s*,/g, ',').replace(/\.\s*,/g, '.').replace(/,\s*\./g, '.');
  }

  if (rules.capitalizeSentences !== false) {
    // Capitalise first letter of every sentence AND the very first character.
    // Preserves everything else including intentional acronyms.
    out = out.replace(/(^|[.!?]\s+|\n+\s*)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
    // Capitalise the first character of every non-empty line too (bullets, list items).
    out = out.split('\n').map(line => {
      const m = line.match(/^(\s*(?:[-•*\d.)]+\s+)?)([a-z])(.*)/);
      return m ? m[1] + m[2].toUpperCase() + m[3] : line;
    }).join('\n');
    // "i " → "I "
    out = out.replace(/(^|[\s(,])i(\s|'|,|\.)/g, (_, a, b) => a + 'I' + b);
  }

  return out;
}

function productContextBlock(product) {
  if (!product) return '';
  const bits = [];
  if (product.absorbency) bits.push(`Absorbency: ${product.absorbency}`);
  if (product.length)     bits.push(`Length: ${product.length}`);
  if (product.snapWidth)  bits.push(`Snap width: ${product.snapWidth}`);
  if (product.fabric)     bits.push(`Fabric: ${product.fabric}`);
  if (product.price)      bits.push(`Price: $${product.price}`);
  if (product.notes)      bits.push(`Notes: ${product.notes}`);
  return `\n\nLINKED PRODUCT (talk about THIS specifically — use the real specs, don't invent):\nProduct: ${product.name}\n${bits.join('\n')}`;
}

async function aiGenerate({ brand, vocab, task, input, platform, extra = '', product = null, provider = 'built-in' }) {
  const system = buildBrandContext(brand, vocab);
  let userPrompt = `TASK: ${task}\n\n`;
  if (input) userPrompt += `INPUT (the idea/message):\n"""\n${input}\n"""\n\n`;
  if (product) userPrompt += `${productContextBlock(product).trim()}\n\n`;
  if (platform) userPrompt += `PLATFORM: ${platform}\n\n`;
  if (extra) userPrompt += `${extra}\n\n`;
  userPrompt += "Return ONLY the finished copy. No preamble. No labels like 'Caption:'. Just the copy itself.";

  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: userPrompt },
  ];

  const text = await aiComplete({ messages, provider });
  return applyVoiceRules((text || '').trim(), brand);
}

async function aiRepurposeAll({ brand, vocab, input, platforms, counts = {}, product = null, provider = 'built-in' }) {
  // `counts` is a per-platform override, e.g. { 'instagram-carousel': 8, 'story-frames': 5 }.
  const details = platforms.map(p => {
    const tmpl = CONTENT_SEED.repurposeTemplates[p];
    let hint = tmpl?.hint || '';
    if (tmpl?.variableCount) {
      const n = counts[p] || tmpl.defaultCount || 6;
      hint = hint.replace(/\bN\b/, String(n));
    }
    return `${p}: ${tmpl?.label || p} — ${hint}`;
  }).join('\n');

  const system = buildBrandContext(brand, vocab);
  const productBlock = product ? productContextBlock(product) : '';
  const userPrompt = `Take this ONE idea and turn it into the following pieces of copy, each in the brand voice. Return ONLY a valid JSON object mapping each key to its finished copy string.

IDEA:
"""
${input}
"""${productBlock}

PIECES TO WRITE:
${details}

Return format (strict JSON, no markdown fence, no commentary):
{ ${platforms.map(p => `"${p}": "..."`).join(', ')} }

Each string is the finished, ready-to-post copy. Use \\n for line breaks. No emoji unless natural. No hashtags.`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: userPrompt },
  ];

  const text = await aiComplete({ messages, provider });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('no JSON in AI response');
  const parsed = JSON.parse(jsonMatch[0]);
  // Apply voice rules to every string in the map.
  for (const k of Object.keys(parsed)) {
    if (typeof parsed[k] === 'string') parsed[k] = applyVoiceRules(parsed[k], brand);
  }
  return parsed;
}

async function aiLaunchPack({ brand, vocab, product, angle, heroFact, carouselCount = 6, storyCount = 4 }) {
  const system = buildBrandContext(brand, vocab);
  const productDesc = `Product: ${product.name}
Absorbency: ${product.absorbency || '—'}
Length: ${product.length || '—'}
Snap width: ${product.snapWidth || '—'}
Fabric: ${product.fabric || '—'}
Price: $${product.price || '—'}
Notes: ${product.notes || '—'}`;

  const userPrompt = `You're writing a full social launch pack for this ${angle}.

${productDesc}

${heroFact ? `Hero fact / thing to lead with: ${heroFact}\n` : ''}
Write ALL of the following pieces. Return ONLY a valid JSON object.

Pieces:
- "announcement": short punchy announcement (2-3 sentences) — the "it's happening" moment
- "instagram_caption": IG caption, warm & chatty, 2-4 short paragraphs, soft CTA at end
- "carousel": array of exactly ${carouselCount} short slide texts — first is the hook, last is a soft CTA, middle slides are the highlights
- "tiktok_hook": one killer opening line (under 12 words)
- "tiktok_script": 30-45 sec spoken script, natural + conversational
- "facebook_post": slightly longer, warmer, more storytelling (3-5 short paragraphs)
- "story_frames": array of exactly ${storyCount} short story frame texts (one sentence each, feels like texting)
- "website_blurb": 3-4 sentence intro suitable for the shop page

Format (strict JSON, no markdown fence):
{
  "announcement": "...",
  "instagram_caption": "...",
  "carousel": [${Array(carouselCount).fill('"..."').join(',')}],
  "tiktok_hook": "...",
  "tiktok_script": "...",
  "facebook_post": "...",
  "story_frames": [${Array(storyCount).fill('"..."').join(',')}],
  "website_blurb": "..."
}`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: userPrompt },
  ];

  const text = await window.genspark.complete({ messages });
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('no JSON in AI response');
  const parsed = JSON.parse(jsonMatch[0]);
  // Apply voice rules to every string / string-array in the pack.
  for (const k of Object.keys(parsed)) {
    if (typeof parsed[k] === 'string') parsed[k] = applyVoiceRules(parsed[k], brand);
    else if (Array.isArray(parsed[k])) parsed[k] = parsed[k].map(v => typeof v === 'string' ? applyVoiceRules(v, brand) : v);
  }
  return parsed;
}

// Copy text to clipboard, with a simple fallback
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: use a temporary textarea
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); return true; }
    catch { return false; }
    finally { document.body.removeChild(ta); }
  }
}

// Compact toggle strip that lets the user flip voice rules right where they use the AI.
// Reads brand.voiceRules from the store and dispatches partial updates.
function VoiceRulesBar() {
  const { state, dispatch } = useStore();
  const rules = state.brand.voiceRules || { capitalizeSentences: true, avoidEmDashes: true };

  const flip = (key) => {
    const next = { ...rules, [key]: !rules[key] };
    dispatch({ type: 'update-brand', patch: { voiceRules: next } });
  };

  const Chip = ({ label, active, onClick, title }) => (
    <button onClick={onClick} title={title}
      style={{
        background: active ? 'var(--pink-100)' : 'white',
        color: active ? 'var(--pink-600)' : 'var(--ink-3)',
        border: `1px solid ${active ? 'var(--pink-300)' : 'var(--line)'}`,
        padding: '5px 10px', borderRadius: 999, fontSize: 11,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'inherit', transition: 'all .12s',
      }}>
      <span style={{
        width: 12, height: 12, borderRadius: 3,
        background: active ? 'var(--pink-500)' : 'transparent',
        border: `1.5px solid ${active ? 'var(--pink-500)' : 'var(--line-2)'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
      }}>
        {active && <Icon name="check" size={9} />}
      </span>
      {label}
    </button>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      marginBottom: 16, padding: '10px 14px',
      background: 'var(--pink-50)', borderRadius: 12,
      border: '1px solid var(--line)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '.08em', textTransform: 'uppercase', marginRight: 4 }}>
        Style
      </span>
      <Chip label="Sentence case" active={rules.capitalizeSentences !== false}
        onClick={() => flip('capitalizeSentences')}
        title="Capitalise the first letter of every sentence" />
      <Chip label="No em-dashes" active={rules.avoidEmDashes !== false}
        onClick={() => flip('avoidEmDashes')}
        title="Use commas and periods instead of — or –" />
    </div>
  );
}

Object.assign(window, {
  CONTENT_SEED, buildBrandContext, applyVoiceRules, VoiceRulesBar, productContextBlock,
  aiGenerate, aiRepurposeAll, aiLaunchPack, aiGenerateIdeas,
  copyText,
});
