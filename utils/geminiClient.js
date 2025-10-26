const API_VERSION_PRIMARY = 'v1';
const DEFAULT_MODEL = 'gemini-1.5-flash';
// Ordered by preference if the default model is unavailable on the project/region
const FALLBACK_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.0-pro',
  'gemini-pro',
];
// NOTE: Users cannot input their own API key; the app uses a built-in key.
// This is a placeholder key - you'll need to replace it with a valid API key from Google AI Studio
const DEFAULT_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

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

const buildImageRequest = (prompt, systemPrompt, imageBase64) => {
  const combined = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  return {
    contents: [
      { 
        role: 'user', 
        parts: [
          { text: combined },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ] 
      },
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
  console.log('Gemini: Trying models:', modelsToTry);
  
  for (const model of modelsToTry) {
    console.log(`Gemini: Attempting to use model: ${model}`);
    const res = await fetch(buildUrl(model, API_VERSION_PRIMARY, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      console.log(`Gemini: Successfully used model: ${model}`);
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
    console.log(`Gemini: Model ${model} failed:`, lastErrorText);

    const retryable = res.status === 404 || /not\s+found|not\s+supported|ListModels/i.test(errText);
    const apiKeyError = res.status === 403 || /forbidden|permission|api.*key/i.test(errText);
    
    if (apiKeyError) {
      throw new Error('Gemini API key is invalid or has insufficient permissions. Please check your API key configuration.');
    }
    
    if (!retryable) {
      throw new Error(lastErrorText);
    }
  }

  throw new Error(lastErrorText || 'Gemini: all models unavailable');
};

// Call Gemini Generative Language API with image analysis
export const generateGeminiImageAnalysis = async (prompt, systemPrompt, imageBase64) => {
  const apiKey = DEFAULT_API_KEY;
  const request = buildImageRequest(prompt, systemPrompt, imageBase64);

  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastErrorText = '';
  console.log('Gemini Image Analysis: Trying models:', modelsToTry);
  
  for (const model of modelsToTry) {
    console.log(`Gemini Image Analysis: Attempting to use model: ${model}`);
    const res = await fetch(buildUrl(model, API_VERSION_PRIMARY, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      console.log(`Gemini Image Analysis: Successfully used model: ${model}`);
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
    console.log(`Gemini Image Analysis: Model ${model} failed:`, lastErrorText);

    const retryable = res.status === 404 || /not\s+found|not\s+supported|ListModels/i.test(errText);
    const apiKeyError = res.status === 403 || /forbidden|permission|api.*key/i.test(errText);
    
    if (apiKeyError) {
      throw new Error('Gemini API key is invalid or has insufficient permissions. Please check your API key configuration.');
    }
    
    if (!retryable) {
      throw new Error(lastErrorText);
    }
  }

  throw new Error(lastErrorText || 'Gemini: all models unavailable');
};

export default {
  getEffectiveGeminiApiKey,
  generateGeminiSuggestion,
  generateGeminiImageAnalysis,
};


