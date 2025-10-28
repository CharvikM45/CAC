const API_VERSION_PRIMARY = 'v1';
const DEFAULT_MODEL = 'gemini-1.5-flash-latest';
// Ordered by preference if the default model is unavailable on the project/region
const FALLBACK_MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];
// NOTE: Users cannot input their own API key; the app uses a built-in key.
const DEFAULT_API_KEY = 'AIzaSyBgWY8bdMj-Xl4U8En3BqZJVL2T7AK6-RQ';

export const getEffectiveGeminiApiKey = async () => DEFAULT_API_KEY;

const buildUrl = (model, version = API_VERSION_PRIMARY, apiKey = DEFAULT_API_KEY) =>
  `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

const buildRequest = (prompt, systemPrompt) => {
  const combined = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  return {
    contents: [
      { role: 'user', parts: [{ text: combined }] },
    ],
    generationConfig: { temperature: 0.6 },
  };
};

// Call Gemini Generative Language API (developers.generativeai.google) via fetch
export const generateGeminiSuggestion = async (prompt, systemPrompt) => {
  const apiKey = DEFAULT_API_KEY;
  const request = buildRequest(prompt, systemPrompt);

  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastErrorText = '';
  for (const model of modelsToTry) {
    const res = await fetch(buildUrl(model, API_VERSION_PRIMARY, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const json = await res.json();
      const candidates = json?.candidates || [];
      let text = '';
      for (const c of candidates) {
        const parts = c?.content?.parts || [];
        for (const p of parts) if (typeof p.text === 'string') text += p.text;
      }
      return text;
    }

    const errText = await res.text();
    lastErrorText = `Gemini error ${res.status} on ${model}: ${errText}`;

    const retryable = res.status === 404 || /not\s+found|not\s+supported|ListModels/i.test(errText);
    if (!retryable) {
      throw new Error(lastErrorText);
    }
  }

  throw new Error(lastErrorText || 'Gemini: all models unavailable');
};

export default {
  getEffectiveGeminiApiKey,
  generateGeminiSuggestion,
};


