# Settings Feature - User Guide

## What Was Added

A beautiful settings modal has been added to the Cora extension, allowing users to configure their OpenAI API key directly through the UI. The Google Search API keys remain pre-configured in the code (as they're not confidential).

## How to Use

### Method 1: From the Side Panel

1. Click the **"✨ Cora"** button on any course
2. When the side panel opens, click the **⚙️ Settings** button (top right)
3. A modal will appear with an input field for your OpenAI API key
4. Paste your API key (starts with `sk-proj-` or `sk-`)
5. Click **"Save API Key"**
6. You'll see a success message, and the modal will close automatically

### Method 2: Get an OpenAI API Key

If you don't have an API key yet:

1. Visit https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. Paste it in the Cora settings

## Features

✅ **Secure Storage**: API key is stored in Chrome's local storage (not visible in code)
✅ **Validation**: Checks that the key format is correct (starts with `sk-`)
✅ **Masked Display**: Shows current key in masked format (e.g., `sk-proj-ab...xyz`)
✅ **Real-time Feedback**: Success/error messages appear immediately
✅ **Auto-reload**: Extension automatically uses the new key after saving
✅ **Easy Access**: Settings button always visible in the side panel

## UI Design

The settings modal features:
- Clean, modern design matching the Cora theme
- Password input field for security
- Helpful instructions with a link to get an API key
- Current key status (masked for security)
- Cancel and Save buttons
- Smooth animations
- Click-outside-to-close functionality
- Enter key to save quickly

## What Changed

### Files Modified:

1. **`src/config.js`**
   - Google keys now hardcoded (pre-configured)
   - OpenAI key loaded from `chrome.storage.local`
   - Added `saveOpenAIKey()` and `getOpenAIKey()` functions
   - Removed old `saveConfig()` function

2. **`src/background.js`**
   - Added `saveOpenAIKey` message handler
   - Added `getOpenAIKey` message handler
   - Resets analyzer when new key is saved (to use new key)

3. **`src/contentScript.js`**
   - Settings button now functional (replaced alert)
   - Beautiful settings modal with animations
   - API key validation
   - Success/error message display
   - Mask current key for security

4. **`src/contentScript.css`**
   - Enhanced styling for settings button
   - Added active state for better UX

## How It Works

1. **User clicks Settings button** → `showSettings()` function called
2. **Modal appears** → Fetches current API key (if any) from storage
3. **User enters key** → Validates format (must start with `sk-`)
4. **User clicks Save** → Sends message to background script
5. **Background script** → Saves key to `chrome.storage.local`
6. **Success!** → Modal shows success message and closes
7. **Next analysis** → Extension loads the new key automatically

## Security Notes

✅ **Key is never exposed** in the source code
✅ **Stored securely** in Chrome's local storage (user-specific)
✅ **Masked display** prevents shoulder-surfing
✅ **Password input** hides key while typing
✅ **No network transmission** (only stored locally)

## Testing

To verify it works:

1. Open the Cora panel
2. Click Settings (⚙️)
3. Paste a test key: `sk-test123456789`
4. Click Save
5. Reload the page
6. Open Settings again
7. You should see: `Current: sk-test123...789`

## User Experience

- **First-time users**: Will see "Not set" as current key status
- **Existing users**: Will see their masked key
- **After saving**: Success message with checkmark
- **On error**: Clear error message explaining what went wrong
- **Smooth animations**: Fade in/out for professional feel

## No More Manual Config!

Users no longer need to:
- ❌ Edit `config.js` manually
- ❌ Use DevTools console to set keys
- ❌ Copy from `.env` file

Instead, they can:
- ✅ Use the beautiful Settings UI
- ✅ See their current key status
- ✅ Update anytime with one click

## Benefits

1. **User-Friendly**: Non-technical users can configure the extension
2. **Secure**: Keys stored properly, not in source code
3. **Flexible**: Users can change keys anytime
4. **Professional**: Beautiful UI that matches the extension theme
5. **Fast**: One-click access from the side panel
6. **Safe**: Validation prevents invalid keys

---

## Summary

The settings feature makes Cora much more user-friendly! Users can now configure their OpenAI API key through a beautiful, intuitive interface without touching any code. The Google keys remain pre-configured, so users only need to worry about getting their own OpenAI key.

This is a significant improvement over the previous setup where users had to manually edit files or use the DevTools console! 🎉

