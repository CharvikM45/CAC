# OpenAI API Setup Instructions

## Getting an OpenAI API Key

1. **Go to OpenAI Platform**: Visit [https://platform.openai.com/](https://platform.openai.com/)

2. **Sign in** with your OpenAI account (or create one if you don't have it)

3. **Create a new API key**:
   - Click on your profile icon in the top right
   - Select "API Keys" from the dropdown
   - Click "Create new secret key"
   - Give it a name (e.g., "CAC App")
   - Copy the generated API key (you won't be able to see it again!)

4. **Update the API key in the app**:
   - Open `utils/openaiClient.js`
   - Replace `YOUR_OPENAI_API_KEY_HERE` with your actual API key
   - Save the file

## Example:
```javascript
const DEFAULT_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

## Pricing and Limits
- **GPT-4o**: $5.00 per 1M input tokens, $15.00 per 1M output tokens
- **GPT-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **GPT-4 Turbo**: $10.00 per 1M input tokens, $30.00 per 1M output tokens
- **GPT-3.5 Turbo**: $0.50 per 1M input tokens, $1.50 per 1M output tokens

## Features Supported
- **Text Generation**: Used in the chatbot for material recommendations
- **Image Analysis**: Used in the image detection screen for material identification
- **Vision Model**: GPT-4o with vision capabilities for analyzing uploaded images

## Troubleshooting
- **401 Unauthorized**: API key is invalid or expired
- **403 Forbidden**: API key doesn't have permissions for the requested model
- **429 Too Many Requests**: Rate limit exceeded or quota exceeded
- **500 Internal Server Error**: OpenAI service is temporarily unavailable

## Security Notes
- **Never commit your API key to version control**
- **Keep your API key secure and don't share it publicly**
- **Consider using environment variables for production deployments**
- **Monitor your usage in the OpenAI dashboard to avoid unexpected charges**

## Current Status
The app will show a mock analysis when the API key is not configured, allowing you to test the UI without a valid API key. Once you add your API key, you'll get real AI-powered material analysis and recommendations.
