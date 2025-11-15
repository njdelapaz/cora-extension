# 🔧 USER ACTION REQUIRED - OpenAI API Key Setup

## ⚠️ IMPORTANT: Extension Needs Your OpenAI API Key!

The Cora extension is fully implemented and ready to use! The Google Search API keys are already pre-configured. You just need to add your **OpenAI API key** through the Settings UI.

---

## What You Need To Do (2 minutes)

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (it starts with `sk-proj-` or `sk-`)

### Step 2: Configure the Extension

**Easy! Use the Settings UI (No coding required!)**

1. Load the extension in Chrome (`chrome://extensions/` → Load unpacked → select `cora-extension` folder)
2. Navigate to the UVA SIS website: https://sisuva.admin.virginia.edu/
3. Search for any course and expand it
4. Click the **"✨ Cora"** button
5. When the side panel opens, click the **⚙️ Settings** button (top right)
6. A modal will appear - paste your OpenAI API key
7. Click **"Save API Key"**
8. Done! ✅

The extension is now ready to use!

---

## How to Test If It's Working

### Quick Test:

1. After saving your API key, close the settings modal
2. Click the **"✨ Cora"** button again
3. **Expected**: 
   - Loading panel with spinner appears
   - Progress messages update ("Searching web sources...", etc.)
   - After 30-45 seconds: Full analysis with course/professor summaries and ratings

### Verify API Key Saved:

1. Open the Cora panel
2. Click Settings (⚙️)
3. Look at "Current:" - you should see your masked key (e.g., `sk-proj-ab...xyz`)

### Console Check (Optional):

Open DevTools (F12) and look for:
```
[Cora][Config] Found OpenAI API key in storage
[Cora][Config] Configuration validated successfully
[Cora][Analyzer] API keys available - OpenAI: true Google: true
[Cora][Analyzer] Using real API services
```

---

## Common Issues

### ❌ Settings button doesn't appear
**Problem**: Not on the SIS website or course isn't expanded
**Fix**: 
1. Go to https://sisuva.admin.virginia.edu/
2. Search for a course
3. Click to expand the course row
4. The "✨ Cora" button should appear

### ❌ "Invalid API key format"
**Problem**: Key doesn't start with `sk-`
**Fix**: Make sure you copied the entire key from OpenAI (includes `sk-proj-` or `sk-`)

### ❌ "Configuration validation failed"
**Problem**: API key wasn't saved properly
**Fix**: 
1. Open Settings again
2. Re-paste your API key
3. Click Save
4. Check the success message appears

### ❌ "Using stub implementations"
**Problem**: API key not found in storage
**Fix**: Open Settings and save your API key again

### ❌ OpenAI returns 401 Unauthorized
**Problem**: API key is invalid or expired
**Fix**: 
1. Go to https://platform.openai.com/api-keys
2. Generate a new key
3. Open Cora Settings and paste the new key

### ❌ Analysis is very slow (> 2 minutes)
**Problem**: This is actually normal! 
**Explanation**: The extension searches 2 sites, scrapes 10 pages, and generates 11 AI summaries. This takes 30-45 seconds normally.
**Fix**: Just wait and watch the progress messages update

---

## That's It!

The extension is **fully functional** and much easier to set up now! Just use the Settings UI - no coding required! 🎉

For more information, see:
- **`SETTINGS_FEATURE.md`** - Detailed guide to the Settings UI
- **`SETUP_AND_TESTING.md`** - Complete testing guide
- **`IMPLEMENTATION_SUMMARY.md`** - What was implemented

---

## Quick Reference

**What was implemented**: Everything from the plan + Settings UI ✅
**What you need to do**: Get OpenAI API key and paste it in Settings ⚙️
**Estimated time**: 2 minutes ⏱️
**Difficulty**: Super Easy 🟢
**Coding required**: None! 🎯

**Google Search**: Already configured ✅
**OpenAI API**: Use the Settings button in the panel to configure

Much simpler than before - no manual config files, no DevTools console, just a beautiful UI! 🚀

