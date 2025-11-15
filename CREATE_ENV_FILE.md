# 📝 How to Create Your .env File

Since `.env` files are protected by the system, you need to create it manually. Here's how:

## Method 1: Manual Creation (Easiest)

### Step 1: Create the file
1. In your project root folder, create a new file
2. Name it exactly: `.env` (with the dot at the beginning)

### Step 2: Copy this content into the file:

```env
# Private API Keys - DO NOT COMMIT THIS FILE
# Add your actual API keys here

# OpenAI API Key (for GPT-5-mini)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Google Custom Search API Key
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_SEARCH_API_KEY=

# Google Custom Search Engine ID
# Get from: https://programmablesearchengine.google.com/
GOOGLE_SEARCH_ENGINE_ID=
```

### Step 3: Add your API keys
Replace the empty values with your actual keys:

```env
OPENAI_API_KEY=sk-proj-abc123xyz...
GOOGLE_SEARCH_API_KEY=AIzaSy123abc...
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5
```

### Step 4: Verify it's gitignored
- The `.gitignore` file has been created with `.env` in it
- This means your `.env` file will NOT be pushed to GitHub ✅

---

## Method 2: Copy from Template

```bash
# On Windows (PowerShell)
Copy-Item env.template .env

# On macOS/Linux
cp env.template .env
```

Then edit `.env` and add your API keys.

---

## Method 3: Use Node.js Script

If you have Node.js installed:

```bash
node setup-env.js
```

Then edit the created `.env` file and add your keys.

---

## ⚠️ Important Notes

1. **Never commit `.env` to GitHub** - It's already in `.gitignore` ✅
2. **Use `env.template`** for reference (this one IS committed)
3. **The `.env` file stays local** on your machine only

---

## 📋 Where to Get API Keys

### OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy it (starts with `sk-proj-` or `sk-`)

### Google Custom Search API Key
1. Go to: https://console.cloud.google.com/
2. Enable "Custom Search API"
3. Create credentials → API Key
4. Copy it (starts with `AIzaSy`)

### Google Search Engine ID
1. Go to: https://programmablesearchengine.google.com/
2. Create a new search engine
3. Copy the Search Engine ID

---

## ✅ Verification

After creating your `.env` file:

1. Check it exists in your project root
2. Verify it's not tracked by git:
   ```bash
   git status
   ```
   The `.env` file should NOT appear in the list
3. Make sure `env.template` IS tracked (this is normal)

---

## For Chrome Extension Usage

**Note:** Chrome extensions can't directly read `.env` files. You have two options:

### Option A: Manual Config (Current Setup)
Add your keys directly in `src/config.js` (lines 9, 18, 20)

### Option B: Chrome Storage (Recommended)
Store keys in Chrome's local storage - see `API_KEYS_SETUP.md` for details

The `.env` file serves as a secure reference that won't be committed to Git, and you can copy the values into your config.

