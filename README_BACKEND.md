# Course Analyzer Backend - Setup Guide

This document describes the AI-powered backend for analyzing courses using web scraping and OpenAI.

## Architecture Overview

```
Button Click (Content Script/Popup)
          ↓
    Background.js (Service Worker)
          ↓
    CourseAnalyzer (Orchestrator)
          ↓
    ┌─────────┴─────────┐
    ↓                   ↓
SearchService      OpenAIService
(Google API)         (GPT-5-mini)
    ↓
ScraperService
    ↓
OpenAIService (per-page summaries)
    ↓
OpenAIService (final rating)
```

## Workflow Steps

1. **Search Phase**: Query Google Custom Search API for:
   - thecourseforum.com results
   - reddit.com results

2. **Scraping Phase**: Fetch and extract content from each search result URL

3. **Individual Summary Phase**: Feed each page's content to GPT-4o-mini to generate a focused summary

4. **Final Rating Phase**: Combine all summaries and generate:
   - Overall rating (1-10)
   - Professor rating (1-10)
   - Course rating (1-10)
   - Comprehensive analysis
   - Key strengths and concerns
   - Recommendation

## File Structure

```
src/
├── background.js              # Service worker, main entry point
├── config.js                  # Configuration management
├── services/
│   ├── courseAnalyzer.js     # Main orchestrator
│   ├── searchService.js      # Google Custom Search API
│   ├── scraperService.js     # Web scraping
│   └── openaiService.js      # OpenAI API integration
└── testAnalyzer.js           # Standalone test script
```

## Setup Instructions

### 1. Install API Keys

You need two API keys:

#### Google Custom Search API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Custom Search API"
4. Create credentials (API Key)
5. Create a Custom Search Engine at [Google Programmable Search](https://programmablesearchengine.google.com/)
6. Get your Search Engine ID

#### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Note: GPT-5-mini is the latest efficient model for this use case

### 2. Configure API Keys

Edit the `.env` file:

```env
# OpenAI API Key (for GPT-5-mini)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Google Custom Search API
GOOGLE_SEARCH_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 3. Store API Keys in Extension

Since Chrome extensions can't directly read .env files, you need to:

**Option A: Hardcode temporarily in config.js**
```javascript
const config = {
  openai: {
    apiKey: 'sk-proj-xxxxx', // Your actual key
    model: 'gpt-5-mini',
    // ...
  },
  google: {
    apiKey: 'AIzaSyxxxxx', // Your actual key
    searchEngineId: 'your_engine_id',
    // ...
  }
};
```

**Option B: Use Chrome Storage (Recommended for production)**
Create a settings page in your popup to store keys:
```javascript
chrome.storage.local.set({
  apiKeys: {
    openai: 'sk-proj-xxxxx',
    googleSearch: 'AIzaSyxxxxx',
    googleSearchEngineId: 'your_engine_id'
  }
});
```

## Usage

### From Content Script or Popup

Send a message to the background script:

```javascript
const courseInfo = {
  courseName: 'Introduction to Computer Science',
  courseNumber: 'CS 1110',
  section: '001',
  professor: 'John Smith',
  term: 'Fall 2024'
};

chrome.runtime.sendMessage(
  { action: 'analyzeCourse', courseInfo },
  (response) => {
    if (response.success) {
      console.log('Analysis Result:', response.result);
      console.log('Overall Rating:', response.result.finalResult.overallRating);
      console.log('Full Analysis:', response.result.finalResult.fullAnalysis);
    } else {
      console.error('Error:', response.error);
    }
  }
);
```

### Testing with Stubs

The current implementation uses stub services that return mock data. This allows you to test the workflow without API keys:

```javascript
// In background.js, the analyzer is created with stubs enabled:
courseAnalyzer = new CourseAnalyzer(config, true); // true = use stubs
```

To use real APIs:
```javascript
courseAnalyzer = new CourseAnalyzer(config, false); // false = use real APIs
```

### Standalone Testing

Run the test script (requires Node.js with ES modules support):

```bash
node src/testAnalyzer.js
```

## API Cost Estimates

For each course analysis:

### Google Custom Search API
- **Cost**: $5 per 1,000 queries
- **Usage**: 2 queries per analysis (thecourseforum + reddit)
- **Free tier**: 100 queries/day
- **Cost per analysis**: ~$0.01

### OpenAI API (GPT-5-mini)
- **Cost**: Pricing varies (check OpenAI pricing page for latest rates)
- **Features**: 400,000 token context window, 90% chat history cache discount
- **Usage per analysis**:
  - ~5 page summaries: ~25,000 input tokens, ~1,500 output tokens
  - 1 final rating: ~1,500 input tokens, ~500 output tokens
- **Cost per analysis**: Cost-effective with caching features

**Total cost per analysis**: ~$0.015 (1.5 cents)

## Current Status

✅ **Completed (Stubbed)**:
- Configuration management
- Google Custom Search API service
- Web scraping service
- OpenAI API service
- Course analyzer orchestrator
- Background script integration
- Chrome extension messaging

🚧 **To Do**:
1. Add real API keys
2. Switch from stub to real services
3. Add error handling UI
4. Add loading states in popup
5. Add caching for repeated queries
6. Add rate limiting
7. Implement settings page for API keys

## Error Handling

The system includes comprehensive error handling:

```javascript
{
  status: 'error',
  error: 'Error message here',
  courseInfo: { /* original course info */ },
  steps: { /* partial results from completed steps */ }
}
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit API keys** to version control
2. `.env` file is gitignored
3. For production, use Chrome storage with encryption
4. Consider using a backend server for API calls instead of client-side
5. Implement rate limiting to prevent abuse
6. Validate and sanitize all input data

## Next Steps

1. Add your API keys to `.env` or `config.js`
2. Test with stub services first
3. Switch to real services when ready
4. Integrate with your content script button
5. Add UI for displaying results
6. Implement caching for efficiency

## Support

For issues or questions:
- Check console logs in Chrome DevTools
- Review the test script output
- Verify API keys are valid
- Check API quota limits

