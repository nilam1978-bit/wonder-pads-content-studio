const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

// Basic protection so only this app can spend your Gemini quota.
const recentHits = new Map();
async function guard(request, env, kind, limit) {
  const origin = request.headers.get('Origin');
  const site = request.headers.get('Sec-Fetch-Site');
  const host = new URL(request.url).host;
  let sameOrigin = false;
  if (origin) { try { sameOrigin = new URL(origin).host === host; } catch { sameOrigin = false; } }
  else if (site === 'same-origin' || (request.method === 'GET' && site === 'none')) sameOrigin = true;
  if (!sameOrigin) return json({ error: 'This request is not allowed.' }, 403);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.GEMINI_LIMITER) {
    try { const { success } = await env.GEMINI_LIMITER.limit({ key: ip }); if (!success) return json({ error: 'Too many AI requests. Please wait a minute and try again.' }, 429); } catch {}
  }
  const now = Date.now(), windowMs = 10 * 60 * 1000, key = kind + ':' + ip;
  const list = (recentHits.get(key) || []).filter(t => now - t < windowMs);
  if (list.length >= limit) return json({ error: 'Too many AI requests in a short time. Please wait a few minutes and try again.' }, 429);
  list.push(now); recentHits.set(key, list);
  if (recentHits.size > 500) for (const [k, v] of recentHits) if (!v.some(t => now - t < windowMs)) recentHits.delete(k);
  return null;
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Gemini is not connected yet. Add GEMINI_API_KEY in Cloudflare.' }, 503);
  }

  const blocked = await guard(request, env, 'post', 40);
  if (blocked) return blocked;

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = messages
    .filter(message => message && typeof message.content === 'string')
    .map(message => `${message.role === 'system' ? 'INSTRUCTIONS' : 'REQUEST'}:\n${message.content}`)
    .join('\n\n');

  if (!prompt.trim()) return json({ error: 'Nothing to write.' }, 400);
  if (prompt.length > 50000) return json({ error: 'This request is too long.' }, 413);

  const primaryModel = env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModel = env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
  const attempts = [primaryModel, primaryModel, fallbackModel];
  let lastStatus = 502;
  let lastDetail = 'Gemini could not complete this request.';

  for (let attempt = 0; attempt < attempts.length; attempt++) {
    const model = attempts[attempt];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    try {
      const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.72, maxOutputTokens: 8192 },
      }),
    });
      const data = await upstream.json();
      if (upstream.ok) {
        const text = (data.candidates?.[0]?.content?.parts || [])
          .map(part => part.text || '')
          .join('')
          .trim();
        if (text) return json({ text, model, usedFallback: model === fallbackModel });
        lastDetail = 'Gemini returned an empty response.';
        lastStatus = 502;
      } else {
        lastDetail = data?.error?.message || 'Gemini could not complete this request.';
        lastStatus = upstream.status;
        const retryable = [429, 500, 502, 503, 504].includes(upstream.status)
          || /high demand|overload|unavailable|try again/i.test(lastDetail);
        if (upstream.status === 404 && model !== fallbackModel) continue;
        if (!retryable) return json({ error: lastDetail }, upstream.status);
      }
    } catch {
      lastDetail = 'Could not reach Gemini. Try again shortly.';
      lastStatus = 502;
    }
    if (attempt < attempts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 350 : 650));
    }
  }
  return json({ error: `${lastDetail} Both Gemini models are temporarily unavailable.` }, lastStatus);
}

export async function onRequest({ request, env } = {}) {
  if (request?.method === 'GET' && env?.GEMINI_API_KEY && new URL(request.url).searchParams.get('test')) {
    const blocked = await guard(request, env, 'test', 8);
    if (blocked) return blocked;
    const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
    const fallback = env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash-lite';
    const out = { configured: true, tests: [] };
    for (const m of [model, fallback]) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }], generationConfig: { maxOutputTokens: 16 } }),
        });
        const d = await r.json().catch(() => ({}));
        out.tests.push({ model: m, ok: r.ok, status: r.status, message: r.ok ? 'Works' : (d?.error?.message || 'Failed') });
      } catch (e) { out.tests.push({ model: m, ok: false, status: 0, message: 'Could not reach Google' }); }
    }
    return json(out);
  }
  if (request?.method === 'GET') return json({ configured: !!env?.GEMINI_API_KEY, ...(!env?.GEMINI_API_KEY ? { error: 'Gemini is not connected. Add the GEMINI_API_KEY secret to the app server.' } : {}) });
  return json({ error: 'Method not allowed.' }, 405);
}
