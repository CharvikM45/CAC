/*
// OpenAI GPT Client for text and image analysis
const DEFAULT_MODEL = 'gpt-4o';
const FALLBACK_MODELS = [
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

// NOTE: Replace this with your OpenAI API key
// const DEFAULT_API_KEY = 'REPLACE KEY CHARVIK';

// export const getEffectiveOpenAIApiKey = async () => DEFAULT_API_KEY;

const buildRequest = (prompt, systemPrompt, messages = null) => {
  if (messages) {
    // For chat completion with conversation history
    return {
      model: DEFAULT_MODEL,
      messages: [
        ...messages,
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 2000,
    };
  } else {
    // For simple completion
    const messages_array = [];
    if (systemPrompt) {
      messages_array.push({ role: 'system', content: systemPrompt });
    }
    messages_array.push({ role: 'user', content: prompt });
    
    return {
      model: DEFAULT_MODEL,
      messages: messages_array,
      temperature: 0.6,
      max_tokens: 2000,
    };
  }
};

const buildImageRequest = (prompt, systemPrompt, base64Image) => {
  return {
    model: 'gpt-4o-mini', // Use cheaper model for image analysis
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    temperature: 0.6,
    max_tokens: 2000,
  };
};

// Call OpenAI API for text generation
export const generateOpenAISuggestion = async (prompt, systemPrompt, messages = null) => {
  // const apiKey = DEFAULT_API_KEY;
  
  if (apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('OpenAI API key not configured. Please add your API key to utils/openaiClient.js');
  }

  const request = buildRequest(prompt, systemPrompt, messages);

  const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastErrorText = '';
  
  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...request,
          model: model
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
        throw new Error('No content in OpenAI response');
      }

      const errorData = await res.json().catch(async () => ({ error: { message: await res.text() } }));
      lastErrorText = `OpenAI error ${res.status} on ${model}: ${errorData.error?.message || 'Unknown error'}`;

      const retryable = res.status === 404 || res.status === 429 || /not\s+found|rate\s+limit/i.test(lastErrorText);
      if (!retryable) {
        throw new Error(lastErrorText);
      }
    } catch (error) {
      lastErrorText = `OpenAI error on ${model}: ${error.message}`;
      // Continue to next model
    }
  }

  throw new Error(lastErrorText || 'OpenAI: all models unavailable');
};

// Call OpenAI API for image analysis
export const generateOpenAIImageAnalysis = async (prompt, systemPrompt, base64Image) => {
  // const apiKey = DEFAULT_API_KEY;
  
  if (apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('OpenAI API key not configured. Please add your API key to utils/openaiClient.js');
  }

  // Try with original image first
  let request = buildImageRequest(prompt, systemPrompt, base64Image);
  console.log('Image analysis request:', {
    model: request.model,
    promptLength: prompt.length,
    systemPromptLength: systemPrompt.length,
    imageSize: base64Image.length
  });

  try {
    return await makeImageAnalysisRequest(request);
  } catch (error) {
    console.log('First attempt failed, trying with reduced image quality...');
    
    // If network request fails, try with a smaller image
    if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
      try {
        // Create a smaller version of the image by reducing quality
        const compressedImage = await compressImage(base64Image);
        request = buildImageRequest(prompt, systemPrompt, compressedImage);
        console.log('Retrying with compressed image, size:', compressedImage.length);
        return await makeImageAnalysisRequest(request);
      } catch (retryError) {
        console.error('Retry with compressed image also failed:', retryError.message);
        
        // Final fallback: try text-only analysis
        console.log('Trying text-only analysis as final fallback...');
        const textPrompt = `${prompt}\n\nNote: Image analysis failed due to network issues. Please provide general material analysis and sustainable alternatives based on common materials that might be photographed for analysis.`;
        return await generateOpenAISuggestion(textPrompt, systemPrompt);
      }
    }
    throw error;
  }
};

// Helper function to compress image for better network performance
const compressImage = async (base64Image) => {
  // For now, just return the original image
  // In a real implementation, you could use a library like react-native-image-resizer
  // to reduce image quality/size before sending to API
  return base64Image;
};

// Helper function to make the actual API request
const makeImageAnalysisRequest = async (request) => {
  // const apiKey = DEFAULT_API_KEY;
  
  try {
    console.log('Making OpenAI API request...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
      timeout: 30000, // 30 second timeout
    });
    console.log('OpenAI API response received:', res.status, res.statusText);

    if (res.ok) {
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
      throw new Error('No content in OpenAI response');
    }

    const errorData = await res.json().catch(async () => ({ error: { message: await res.text() } }));
    console.error('OpenAI API Error Details:', {
      status: res.status,
      statusText: res.statusText,
      error: errorData.error,
      headers: Object.fromEntries(res.headers.entries())
    });
    throw new Error(`OpenAI image analysis error ${res.status}: ${errorData.error?.message || 'Unknown error'}`);
  } catch (error) {
    throw new Error(`OpenAI image analysis error: ${error.message}`);
  }
};

// Legacy function names for backward compatibility
export const generateGeminiSuggestion = generateOpenAISuggestion;
export const generateGeminiImageAnalysis = generateOpenAIImageAnalysis;

export default {
  getEffectiveOpenAIApiKey,
  generateOpenAISuggestion,
  generateOpenAIImageAnalysis,
  // Legacy exports
  generateGeminiSuggestion,
  generateGeminiImageAnalysis,
};
*/