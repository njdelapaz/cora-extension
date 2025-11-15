# Workflow Improvements - Implementation Complete

All requested workflow changes have been implemented! Here's what's new:

---

## ✅ 1. Reddit Searches Limited to r/UVA

**File**: `src/config.js`

**Change**: Reddit searches now only look in the UVA subreddit
```javascript
reddit: {
  name: 'Reddit',
  siteSearch: 'reddit.com/r/uva'  // Changed from 'reddit.com'
}
```

**Impact**: More relevant, UVA-specific results from Reddit instead of general Reddit

---

## ✅ 2. Progressive Search Strategy with Fallbacks

**File**: `src/services/searchService.js`

**New Approach**: Three-tier search strategy for both Reddit and theCourseForum

### Strategy 1: Professor-Required Match
- Query: `+"Professor Name" COURSE#### Course Name`
- Uses Google's `+` operator to require exact professor match
- If results found → return immediately
- If 0 results → proceed to Strategy 2

### Strategy 2: Course-Required Match
- Query: `+"COURSE####" Professor Name Course Name`
- Requires exact course number match
- Professor name in query but not required
- If results found → return immediately
- If 0 results → proceed to Strategy 3

### Strategy 3: Normal Search
- Query: All terms without requirements
- Broadest search, returns whatever Google finds

**Logging Example**:
```
[Cora][Search] Starting progressive search for reddit.com/r/uva
[Cora][Search] Strategy 1: Required professor "David Evans"
[Cora][Search] Executing professor-required search: +"David Evans" CS 1110
[Cora][Search] Strategy 1 succeeded with 5 results
```

---

## ✅ 3. Content Filtering Before Summarization

**File**: `src/services/openaiService.js` + `src/services/courseAnalyzer.js`

**New Step**: Before summarizing, AI filters content to extract only relevant info

### Filter Query (Step 3a):
- **System Prompt**: Defines role as content filter, requires verbatim output
- **User Prompt**: Asks for exact text relevant to course/professor
- **Output**: Only relevant excerpts (word-for-word) or "NO RELEVANT INFORMATION"

### Summary Query (Step 3b):
- Only runs if filtering found relevant content
- **System Prompt**: Defines analysis constraints and focus areas
- **User Prompt**: Provides filtered content and requests structured summary

**Benefits**:
- Reduces noise in summaries
- Saves tokens by not summarizing irrelevant content
- Better quality summaries from focused content

---

## ✅ 4. System + User Prompts Properly Separated

**File**: `src/services/openaiService.js`

**Changed**: All OpenAI queries now use separate system and user prompts

### Old Approach (Combined):
```javascript
const prompt = "You are an expert... [entire prompt]";
messages: [{ role: 'user', content: prompt }]
```

### New Approach (Separated):
```javascript
const systemPrompt = "You are an expert at analyzing student feedback...";
const userPrompt = "Analyze this student feedback for...";
messages: [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt }
]
```

**Benefits**:
- Better instruction following (system prompts are meta-constraints)
- More consistent output formats
- Cleaner separation of role vs. task

---

## ✅ 5. Comprehensive AI Query Logging

**File**: `src/services/openaiService.js`

**Added**: Detailed logging for every AI request and response

### What's Logged (Per Request):

**Request Details**:
```
[Cora][OpenAI][Request #1701234567890] Making API call
[Cora][OpenAI][Request #1701234567890] Model: gpt-4o-mini
[Cora][OpenAI][Request #1701234567890] Max tokens: 1000
[Cora][OpenAI][Request #1701234567890] Temperature: 0.7
[Cora][OpenAI][Request #1701234567890] System prompt (250 chars): You are a content filter...
[Cora][OpenAI][Request #1701234567890] User prompt (1500 chars): Extract ONLY the text...
```

**Response Details**:
```
[Cora][OpenAI][Request #1701234567890][Response] Success in 2341ms
[Cora][OpenAI][Request #1701234567890][Response] Content (450 chars): [actual response]
[Cora][OpenAI][Request #1701234567890][Response] Usage: {prompt_tokens: 500, completion_tokens: 150, total_tokens: 650}
```

**Error Details** (if applicable):
```
[Cora][OpenAI][Request #1701234567890][Error] API returned 401: Invalid API key
```

**Benefits**:
- Easy debugging of AI behavior
- Track token usage per request
- Trace entire conversation flow
- Unique request IDs for correlation

---

## Complete AI Query Flow

Here's what happens now for each scraped page:

1. **Filter Query** (New!)
   - System: "You are a content filter..."
   - User: "Extract ONLY text relevant to COURSE + Professor"
   - Output: Verbatim relevant excerpts

2. **Summary Query**
   - System: "You are an expert at analyzing student feedback..."
   - User: "Analyze this filtered feedback for COURSE + Professor"
   - Output: 2-3 paragraph summary

3. **Final Rating Query**
   - System: "You are a course evaluation expert..."
   - User: "Analyze aggregated feedback and provide ratings"
   - Output: Structured ratings + summaries

**Total AI Queries**: 1 filter + 1 summary per page + 1 final = ~21 queries for 10 pages

---

## Search Flow Example

For a course like "CS 1110 with David Evans":

### Reddit Search:
1. Try: `+"David Evans" CS 1110` on `reddit.com/r/uva`
2. If 0 results: `+"CS 1110" David Evans` on `reddit.com/r/uva`
3. If 0 results: `David Evans CS 1110` on `reddit.com/r/uva`

### theCourseForum Search:
1. Try: `+"David Evans" CS 1110` on `thecourseforum.com`
2. If 0 results: `+"CS 1110" David Evans` on `thecourseforum.com`
3. If 0 results: `David Evans CS 1110` on `thecourseforum.com`

---

## Performance Impact

### Before:
- 10 pages × 1 summary query = 10 AI calls
- 1 final rating query = 1 AI call
- **Total: 11 AI calls**

### After:
- 10 pages × (1 filter + 1 summary) = 20 AI calls
- 1 final rating query = 1 AI call
- **Total: 21 AI calls**

**Trade-off**: More queries but better quality summaries and comprehensive logging

**Time Impact**: ~10-15 seconds longer (filtering queries are fast)

---

## Logs You'll See Now

**Search Logs**:
```
[Cora][Search] Starting progressive search for reddit.com/r/uva
[Cora][Search] Strategy 1: Required professor "Rich Lahijani"
[Cora][Search] Executing professor-required search: +"Rich Lahijani" ACCT 3020
[Cora][Search] Found 5 results on reddit.com/r/uva in 234ms (professor-required)
[Cora][Search] Strategy 1 succeeded with 5 results
```

**AI Logs** (per page):
```
[Cora][OpenAI][Request #1701234567890] Making API call
[Cora][OpenAI][Request #1701234567890] Model: gpt-4o-mini
[Cora][OpenAI][Request #1701234567890] System prompt (150 chars): You are a content filter...
[Cora][OpenAI][Request #1701234567890] User prompt (5200 chars): Extract ONLY the text...
[Cora][OpenAI][Request #1701234567890][Response] Success in 1523ms
[Cora][OpenAI][Request #1701234567890][Response] Content (750 chars): [filtered content]
[Cora][OpenAI][Request #1701234567890][Response] Usage: {prompt_tokens: 1300, completion_tokens: 200, total_tokens: 1500}
```

---

## Testing

To see all the improvements in action:

1. Reload the extension
2. Refresh the SIS page
3. Click the Cora button on any course
4. Open DevTools Console (F12)
5. Watch the detailed logs flow through:
   - Progressive search strategies
   - AI filtering queries
   - AI summarization queries
   - Complete request/response details

You'll see exactly which strategy worked for each site and every AI interaction!

---

## Summary

✅ **Reddit limited to r/UVA** - More relevant results
✅ **3-tier search strategy** - Professor → Course → Normal
✅ **Content filtering** - Extract relevant info before summarizing
✅ **System + User prompts** - Better AI instruction following
✅ **Comprehensive logging** - Full request/response details for every AI call

All improvements working together for higher quality analysis with complete visibility! 🎉

