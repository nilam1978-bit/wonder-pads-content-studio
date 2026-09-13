import { onRequestPost as handleGeminiPost, onRequest as handleGeminiOther } from './functions/api/gemini.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/gemini') {
      if (request.method === 'POST') {
        return handleGeminiPost({ request, env });
      }
      return handleGeminiOther();
    }

    return env.ASSETS.fetch(request);
  },
};
