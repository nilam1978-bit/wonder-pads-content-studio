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

  const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
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
    if (!upstream.ok) {
      const detail = data?.error?.message || 'Gemini could not complete this request.';
      return json({ error: detail }, upstream.status);
    }
    const text = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || '')
      .join('')
      .trim();
    if (!text) return json({ error: 'Gemini returned an empty response.' }, 502);
    return json({ text, model });
  } catch {
    return json({ error: 'Could not reach Gemini. Try again shortly.' }, 502);
  }
}

export function onRequest() {
  return json({ error: 'Method not allowed.' }, 405);
}
