# 🔑 API Keys Setup Guide

## Quick Start: Where to Put Your API Keys

### ✅ **EASIEST METHOD: Edit `src/config.js` directly**

1. Open the file: **`src/config.js`**
2. Look for these lines (around line 8-20):

```javascript
const config = {
  openai: {
    // 🔑 PUT YOUR OPENAI API KEY HERE (between the quotes):
    apiKey: '', // <-- Put your key here
    model: 'gpt-5-mini',
    // ...
  },
  google: {
    // 🔑 PUT YOUR GOOGLE SEARCH API KEY HERE:
    apiKey: '', // <-- Put your key here
    // 🔑 PUT YOUR SEARCH ENGINE ID HERE:
    searchEngineId: '', // <-- Put your ID here
    // ...
  },
};
```

3. Replace the empty quotes with your actual keys:

```javascript
const config = {
  openai: {
    apiKey: 'sk-proj-abc123xyz...', // Your actual OpenAI key
    model: 'gpt-5-mini',
    // ...
  },
  google: {
    apiKey: 'AIzaSy123abc...', // Your actual Google API key
    searchEngineId: 'a1b2c3d4e5', // Your actual Search Engine ID
    // ...
  },
};
```

---

## 📋 How to Get Your API Keys

### 1. OpenAI API Key (GPT-5-mini)

1. Go to: **https://platform.openai.com/api-keys**
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-proj-...` or `sk-...`)
5. Paste it into `src/config.js` at line 9

**Note:** Make sure you have billing set up on OpenAI

---

### 2. Google Custom Search API

#### Step A: Get API Key

1. Go to: **https://console.cloud.google.com/**
2. Create a new project (or use existing)
3. Enable **"Custom Search API"**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key (starts with `AIzaSy...`)
5. Paste it into `src/config.js` at line 18

#### Step B: Create Custom Search Engine

1. Go to: **https://programmablesearchengine.google.com/**
2. Click **"Add"** to create a new search engine
3. Set up your search engine:
   - **Sites to search:** Either search the entire web or specific sites
   - For this project, you can select "Search the entire web"
4. Click **"Create"**
5. After creation, go to **"Setup"** → **"Basic"**
6. Find your **Search Engine ID** (looks like: `a1b2c3d4e5f6g7h8i`)
7. Paste it into `src/config.js` at line 20

---

## ⚙️ Settings Confirmed

### Search Configuration
- ✅ Takes **top 5 results** from thecourseforum.com
- ✅ Takes **top 5 results** from reddit.com
- ✅ Total: **10 pages** will be scraped per course
- ✅ Each page gets an AI summary
- ✅ All summaries are combined into a final rating

---

## 🧪 Testing Without API Keys

You can test the system **WITHOUT API keys** using stub implementations:

```javascript
// In src/background.js, line 22:
courseAnalyzer = new CourseAnalyzer(config, true); // true = use stubs
```

The stubs return realistic mock data so you can test the workflow before adding real API keys.

When ready to use real APIs:
```javascript
courseAnalyzer = new CourseAnalyzer(config, false); // false = use real APIs
```

---

## ⚠️ Security Warning

**DO NOT commit your API keys to GitHub!**

- The `src/config.js` file is **NOT** gitignored by default
- Consider adding your API keys to Chrome storage instead (see Option 2 below)
- Or add a `.gitignore` entry for your config file

---

## Option 2: Using Chrome Storage (More Secure)

Instead of hardcoding in `config.js`, you can store keys in Chrome storage:

### A. Save API Keys

Open your extension popup and run this in the browser console:

```javascript
chrome.runtime.sendMessage({
  action: 'saveApiKeys',
  apiKeys: {
    openai: 'sk-proj-your-key-here',
    googleSearch: 'AIzaSy-your-key-here',
    googleSearchEngineId: 'your-engine-id-here'
  }
}, (response) => {
  console.log('Keys saved:', response);
});
```

### B. Verify Keys Are Saved

```javascript
chrome.runtime.sendMessage({
  action: 'getApiKeys'
}, (response) => {
  console.log('Stored keys:', response.apiKeys);
});
```

The `loadConfig()` function will automatically load these keys from storage when the extension starts.

---

## 📞 Need Help?

If you run into issues:

1. Check the browser console for error messages
2. Verify your API keys are valid
3. Make sure billing is set up for OpenAI
4. Check Google API quotas (100 free searches/day)

---

## 💰 Cost Estimate

- **Google Search:** ~$0.01 per course analysis
- **GPT-5-mini:** Very cost-effective (check OpenAI pricing)
- **Total:** ~1-2 cents per course analysis

You can start with the free tiers:
- Google: 100 searches/day free
- OpenAI: Pay as you go

---

Happy analyzing! 🎓


