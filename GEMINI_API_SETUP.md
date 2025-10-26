# Gemini API Setup Instructions

## Getting a Gemini API Key

1. **Go to Google AI Studio**: Visit [https://aistudio.google.com/](https://aistudio.google.com/)

2. **Sign in** with your Google account

3. **Create a new API key**:
   - Click on "Get API Key" in the left sidebar
   - Click "Create API Key"
   - Choose "Create API key in new project" or select an existing project
   - Copy the generated API key

4. **Update the API key in the app**:
   - Open `utils/geminiClient.js`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
   - Save the file

## Example:
```javascript
const DEFAULT_API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

## Free Tier Limits
- **Free tier**: 15 requests per minute, 1 million tokens per day
- **Paid tier**: Higher limits available

## Troubleshooting
- **403 Forbidden**: API key is invalid or doesn't have permissions
- **404 Not Found**: Model name is incorrect or not available
- **429 Too Many Requests**: Rate limit exceeded

## Current Status
The app will show a mock analysis when the API key is not configured, allowing you to test the UI without a valid API key.
