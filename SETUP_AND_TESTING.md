# Cora Extension - Setup and Testing Guide

## Overview

The Cora extension is now fully connected! Here's what's been implemented:

✅ **Backend Services**
- OpenAI API integration (using `gpt-4o-mini` model)
- Google Custom Search API integration
- Web scraping service
- Complete course analysis pipeline with 4 steps

✅ **Frontend Features**
- Dynamic loading states with progress messages
- Real-time analysis with proper message passing
- Beautiful results display with course/professor summaries
- Ratings display (Overall & Difficulty)
- Relevant links section (top 5 from Reddit + top 5 from theCourseForum)
- Comprehensive error handling

✅ **Integration**
- Button click triggers real API analysis
- Progress updates flow from background to content script
- Results properly parsed and displayed

---

## Setup Instructions

### Step 1: Configure API Keys

You have two options for setting up your API keys:

#### Option A: Using config.js (Quick Testing)

1. Open `src/config.js`
2. Find lines 9, 18, and 20
3. Paste your API keys directly:

```javascript
const config = {
  openai: {
    apiKey: 'sk-proj-YOUR_OPENAI_KEY_HERE', // ← Line 9
    // ...
  },
  google: {
    apiKey: 'YOUR_GOOGLE_API_KEY_HERE', // ← Line 18
    searchEngineId: 'YOUR_SEARCH_ENGINE_ID_HERE', // ← Line 20
    // ...
  }
};
```

⚠️ **Important**: This is for testing only. Don't commit these changes to Git!

#### Option B: Using Chrome Storage (Recommended for Long-Term)

1. Load the extension in Chrome
2. Click the extension icon to open the popup
3. Right-click in the popup → "Inspect"
4. In the console, run:

```javascript
chrome.storage.local.set({
  apiKeys: {
    openai: 'sk-proj-YOUR_OPENAI_KEY_HERE',
    googleSearch: 'YOUR_GOOGLE_API_KEY_HERE',
    googleSearchEngineId: 'YOUR_SEARCH_ENGINE_ID_HERE'
  }
}, () => {
  console.log('API keys saved successfully!');
});
```

5. Reload the extension: `chrome://extensions/` → Click reload button

### Step 2: Verify API Keys Are Working

Check the API keys were loaded:

1. Go to the SIS website
2. Open DevTools Console
3. Look for these log messages:
   ```
   [Cora][Config] Loading configuration...
   [Cora][Config] Found API keys in storage
   [Cora][Config] Configuration validated successfully
   ```

If you see validation errors, the API keys aren't configured correctly.

---

## Testing Guide

### Test 1: Extension Loads Correctly

1. Navigate to: https://sisuva.admin.virginia.edu/
2. Search for any course
3. Expand a course row
4. Look for the "✨ Cora" button next to the Share button
5. ✅ **Expected**: Button appears on expanded rows

### Test 2: Loading State

1. Click the "✨ Cora" button
2. ✅ **Expected**: 
   - Side panel slides in from the right
   - Spinner animation appears
   - Progress message: "Initializing analysis..."
   - Messages update as analysis progresses:
     - "Searching web sources..."
     - "Found X results, scraping content..."
     - "Analyzing X pages..."
     - "Generating ratings..."
     - "Complete!"

### Test 3: API Testing

#### Test OpenAI API

1. After clicking the Cora button, open DevTools Console
2. Look for:
   ```
   [Cora][OpenAI] Initialized with model: gpt-4o-mini
   [Cora][OpenAI] Making API call...
   [Cora][OpenAI] API call successful, received X chars
   ```

**Possible Issues:**

- **401 Unauthorized**: API key is invalid or missing
  - Solution: Double-check your OpenAI API key
  
- **429 Rate Limit**: You've exceeded your API quota
  - Solution: Check your OpenAI account billing/usage
  
- **Model not found**: The model name is incorrect
  - Solution: Update `src/config.js` line 10 to use `gpt-3.5-turbo` instead

#### Test Google Search API

Look for:
```
[Cora][Search] Searching reddit.com for: "CS 1110 David Evans"
[Cora][Search] Found 5 results on reddit.com in Xms
```

**Possible Issues:**

- **403 Forbidden**: API key doesn't have Custom Search enabled
  - Solution: Enable Custom Search API in Google Cloud Console

- **400 Bad Request**: Search Engine ID is invalid
  - Solution: Verify your Search Engine ID at https://programmablesearchengine.google.com/

- **No results found**: Search returned empty
  - Solution: This is normal for some courses, check console for details

#### Test Web Scraping

Look for:
```
[Cora][Scraper] Successfully scraped URL (5000 chars) in Xms
```

**Possible Issues:**

- **CORS errors**: This shouldn't happen in extensions, but if it does:
  - Solution: Verify `manifest.json` has `host_permissions` set correctly

- **Scraping failures**: Some websites block scraping
  - Solution: This is expected, the extension handles it gracefully

### Test 4: Results Display

After analysis completes:

✅ **Expected Results:**
- Panel shows three sections:
  1. **COURSE CONTENT**: 2-3 paragraphs about what the course teaches
  2. **PROFESSOR & TEACHING STYLE**: 2-3 paragraphs about the professor
  3. **RATINGS**: Two boxes with numeric ratings (X/10)
     - Overall Rating
     - Difficulty Rating
  4. **RELEVANT LINKS**: Clickable links to sources (Reddit + theCourseForum)

### Test 5: Error Handling

Try these scenarios:

1. **No API Keys**: Don't set API keys
   - ✅ Expected: Uses stub implementations, shows mock data
   - Console shows: `[Cora][Analyzer] Using stub implementations for services`

2. **Invalid Course**: Click Cora on a course with no professor
   - ✅ Expected: Still works, searches using course number only

3. **Network Error**: Disable internet mid-analysis
   - ✅ Expected: Error message appears in panel

---

## Console Logging Reference

All logs follow the format: `[Cora][Service][Action] Message`

### Key Log Sequences

**Successful Flow:**
```
[Cora][Button] Button clicked!
[Cora][Extract] Extracting course information from row...
[Cora][Extract] Parsed course: CS 1110 - Intro to Programming
[Cora][Analysis] Starting analysis for: {...}
[Cora][Background] Received analyzeCourse request from tab: 12345
[Cora][Config] Configuration validated successfully
[Cora][Analyzer] Initializing CourseAnalyzer, useStubs: false
[Cora][Analyzer] API keys available - OpenAI: true Google: true
[Cora][Analyzer] Using real API services
[Cora][Analyzer] Starting course analysis for: {...}
[Cora][Search] Searching 2 sources: reddit.com, thecourseforum.com
[Cora][Search] Found 5 results on reddit.com in 234ms
[Cora][Search] Found 5 results on thecourseforum.com in 198ms
[Cora][Scraper] Scraping 10 URLs...
[Cora][Scraper] Completed 10/10 scrapes in 3421ms
[Cora][OpenAI] Generating page summary for CS 1110
[Cora][OpenAI] Page summary generated in 2134ms
[Cora][OpenAI] Generating final rating from 10 summaries
[Cora][OpenAI] Final rating generated in 3210ms
[Cora][Background] COURSE ANALYSIS COMPLETED
[Cora][Background] Overall Rating: 8.5
[Cora][Background] Difficulty Rating: 6.2
[Cora][Display] Displaying results
```

---

## Known Issues & Solutions

### Issue 1: API Keys Not Persisting

**Problem**: API keys reset after browser restart

**Solution**: Use Option B (Chrome Storage) instead of Option A (config.js)

### Issue 2: "gpt-5-mini" Model Not Found

**Problem**: Model name doesn't exist

**Solution**: Already fixed! Using `gpt-4o-mini` now (line 10 in `config.js`)

### Issue 3: Search Returns No Results

**Problem**: Google Search Engine not configured for correct sites

**Solution**: 
1. Go to https://programmablesearchengine.google.com/
2. Edit your search engine
3. Under "Sites to search", add:
   - `*.reddit.com/*`
   - `*.thecourseforum.com/*`
4. Save changes

### Issue 4: Slow Performance

**Problem**: Analysis takes 10-30 seconds

**This is normal!** The process involves:
- 2 Google API searches (~400ms each)
- 10 web page scrapes (~3-5 seconds total)
- 10 OpenAI summaries (~20-30 seconds total)
- 1 final OpenAI rating (~3-5 seconds)

**Total expected time: 30-40 seconds**

---

## Debugging Checklist

If something isn't working:

- [ ] API keys are set correctly (check console for validation)
- [ ] Extension is loaded in Chrome (`chrome://extensions/`)
- [ ] You're on the correct website (`sisuva.admin.virginia.edu`)
- [ ] Course row is expanded (button only appears when expanded)
- [ ] DevTools Console is open (F12) to see logs
- [ ] Network connection is active
- [ ] OpenAI API key has available credits
- [ ] Google Search API is within daily quota (100 free queries/day)

---

## Next Steps for Production

Before deploying to production, consider:

1. **Backend Proxy**: Move API calls to a backend server instead of client-side
   - Keeps API keys secure
   - Avoids exposing keys in browser
   - Better rate limiting control

2. **Caching**: Store analysis results to avoid repeated API calls
   - Cache by `courseNumber + professor + semester`
   - Invalidate after 30 days

3. **Rate Limiting**: Prevent users from spamming the button
   - Disable button during analysis
   - Add cooldown period between requests

4. **User Settings**: Build a proper settings page
   - Let users input API keys via UI
   - Allow users to toggle features

5. **Error Reporting**: Add anonymous error reporting
   - Track API failures
   - Monitor success rates

---

## Cost Estimates

Based on typical usage:

**Per Course Analysis:**
- Google Search: 2 queries × $0.005 = **$0.01**
- OpenAI (gpt-4o-mini): 
  - Input: ~20,000 tokens × $0.15/1M = **$0.003**
  - Output: ~2,000 tokens × $0.60/1M = **$0.0012**
- **Total per course: ~$0.015 (1.5 cents)**

**For 100 courses**: ~$1.50
**For 1,000 courses**: ~$15.00

Note: OpenAI offers significant caching discounts (90% off) for repeated context, which could reduce costs further.

---

## Support

If you encounter issues:

1. Check the console logs (format: `[Cora][Service][Action]`)
2. Verify API keys are valid and have credits
3. Check API quotas haven't been exceeded
4. Review the error message in the side panel (if shown)

For development help:
- All logs use the `[Cora]` prefix for easy filtering
- Error logs include stack traces
- Progress callbacks show real-time status

---

## Summary

The extension is **fully functional** and ready for testing! All components are connected:

- ✅ Frontend button → Content script → Background script
- ✅ Background script → API services → OpenAI & Google
- ✅ Results → Background script → Content script → Display panel
- ✅ Progress updates → Real-time UI feedback
- ✅ Error handling → User-friendly messages

**Just add your API keys and test!**

