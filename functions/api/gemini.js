const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: 'Gemini is not connected yet. Add GEMINI_API_KEY in Cloudflare.' }, 503);
  }

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

export function onRequest() {
  return json({ error: 'Method not allowed.' }, 405);
}
