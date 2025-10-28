const DEFAULT_MODEL = 'gpt-3.5-turbo';
const FALLBACK_MODELS = ['gpt-4o-mini'];

// NOTE: Users cannot input their own API key; the app uses a built-in key.
const DEFAULT_API_KEY = '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';

const API_URL = 'https://api.openai.com/v1/chat/completions';

const getEffectiveOpenAIKey = async () => DEFAULT_API_KEY;

// Fallback response generator when API is unavailable
const generateFallbackResponse = (prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract key sustainability-related terms
  const sustainabilityTerms = [];
  if (lowerPrompt.includes('sustainable') || lowerPrompt.includes('sustainability')) sustainabilityTerms.push('sustainable');
  if (lowerPrompt.includes('biodegradable')) sustainabilityTerms.push('biodegradable');
  if (lowerPrompt.includes('recyclable')) sustainabilityTerms.push('recyclable');
  if (lowerPrompt.includes('durable')) sustainabilityTerms.push('durable');
  if (lowerPrompt.includes('moisture')) sustainabilityTerms.push('moisture resistance');
  
  // Generate a helpful fallback message
  const termText = sustainabilityTerms.length > 0 
    ? ` focusing on ${sustainabilityTerms.join(', ')}` 
    : '';
    
  return `Based on your request${termText}, I recommend considering sustainable materials from our database below. When selecting materials, prioritize factors like biodegradability, renewability, and environmental impact.`;
};

const buildRequest = (prompt, systemPrompt) => {
  const messages = [];
  
  // Add system prompt if provided
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  
  // Add user prompt
  messages.push({
    role: 'user',
    content: prompt
  });
  
  return {
    model: DEFAULT_MODEL,
    messages: messages,
    temperature: 0.6,
  };
};

// Call OpenAI Chat Completions API via fetch
const generateOpenAISuggestion = async (prompt, systemPrompt) => {
  const apiKey = DEFAULT_API_KEY;
  const request = buildRequest(prompt, systemPrompt);

  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastErrorText = '';
  
  for (const model of modelsToTry) {
    const requestWithModel = { ...request, model };
    
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestWithModel),
      });

      if (res.ok) {
        const json = await res.json();
        const choices = json?.choices || [];
        
        if (choices.length > 0 && choices[0].message) {
          return choices[0].message.content;
        }
        
        return '';
      }

      const errText = await res.text();
      console.log(`OpenAI API returned error ${res.status} on ${model}`);
      
      // Check for quota exceeded error
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.code === 'insufficient_quota') {
          console.log('API quota exceeded. Using fallback response.');
          return generateFallbackResponse(prompt);
        }
      } catch (e) {
        // If error text is not JSON, continue
      }
      
      lastErrorText = `OpenAI error ${res.status} on ${model}: ${errText}`;

      // Only retry for 404 or 429 errors
      const retryable = res.status === 404 || res.status === 429;
      if (!retryable) {
        // For other errors, use fallback instead of throwing
        console.log('API request failed. Using fallback response.');
        return generateFallbackResponse(prompt);
      }
    } catch (error) {
      lastErrorText = `OpenAI error on ${model}: ${error.message}`;
      if (model === modelsToTry[modelsToTry.length - 1]) {
        console.log('All models failed. Using fallback response.');
        return generateFallbackResponse(prompt);
      }
    }
  }

  // If we get here, all models failed, return fallback
  console.log('All API attempts failed. Using fallback response.');
  return generateFallbackResponse(prompt);
};

module.exports = {
  getEffectiveGeminiApiKey: getEffectiveOpenAIKey,
  generateGeminiSuggestion: generateOpenAISuggestion,
};
