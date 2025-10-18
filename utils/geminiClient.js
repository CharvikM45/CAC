const API_VERSION_PRIMARY = 'v1';
const DEFAULT_MODEL = 'gemini-1.5-flash-latest';
const FALLBACK_MODEL = 'gemini-1.0-pro-latest';
// NOTE: Users cannot input their own API key; the app uses a built-in key.
const DEFAULT_API_KEY = 'AIzaSyBgWY8bdMj-Xl4U8En3BqZJVL2T7AK6-RQ';

export const getEffectiveGeminiApiKey = async () => DEFAULT_API_KEY;

const buildUrl = (model, version = API_VERSION_PRIMARY, apiKey = DEFAULT_API_KEY) =>
  `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

const buildRequest = (prompt, systemPrompt) => ({
  contents: [
    { role: 'user', parts: [{ text: prompt }] },
  ],
  ...(systemPrompt
    ? { system_instruction: { parts: [{ text: systemPrompt }] } }
    : {}),
  generationConfig: { temperature: 0.6 },
});

// Call Gemini Generative Language API (developers.generativeai.google) via fetch
export const generateGeminiSuggestion = async (prompt, systemPrompt) => {
  const apiKey = DEFAULT_API_KEY;
  const request = buildRequest(prompt, systemPrompt);

  // Try primary model on v1
  let res = await fetch(buildUrl(DEFAULT_MODEL, 'v1', apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  // If model unsupported/not found, retry once with fallback model
  if (!res.ok) {
    const errText = await res.text();
    const shouldRetry = res.status === 404 || /not\s+found|not\s+supported|ListModels/i.test(errText);
    if (shouldRetry) {
      res = await fetch(buildUrl(FALLBACK_MODEL, 'v1', apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } else {
      throw new Error(`Gemini error ${res.status}: ${errText}`);
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const candidates = json?.candidates || [];
  let text = '';
  for (const c of candidates) {
    const parts = c?.content?.parts || [];
    for (const p of parts) if (typeof p.text === 'string') text += p.text;
  }
  return text;
};

export default {
  getEffectiveGeminiApiKey,
  generateGeminiSuggestion,
};


