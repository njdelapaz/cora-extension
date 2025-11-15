# Cora Extension

A Chrome extension built for the Claude Hackathon 2025.

## Project Structure

```
cora-extension/
├── manifest.json          # Extension configuration
├── src/
│   ├── contentScript.js  # Runs in the context of web pages
│   └── background.js     # Background service worker
├── popup/
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Popup logic
└── README.md
```

## Getting Started

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `cora-extension` directory

### Development

The extension consists of three main components:

- **Content Script** (`src/contentScript.js`): Runs in the context of web pages and can interact with the DOM
- **Background Script** (`src/background.js`): Service worker that runs in the background and handles events
- **Popup** (`popup/popup.html` & `popup/popup.js`): The UI that appears when clicking the extension icon

### Features

- ✅ Manifest V3 compliant
- ✅ Content script injection
- ✅ Background service worker
- ✅ Popup interface with modern UI
- ✅ Message passing between components
- ✅ Chrome storage API integration

### Customization

- Edit `manifest.json` to add permissions, update the name, or configure content scripts
- Modify `popup/popup.html` and `popup/popup.js` to customize the popup UI
- Update `src/contentScript.js` to interact with web pages
- Enhance `src/background.js` to handle background tasks and events

### Debugging

- **Popup**: Right-click the extension icon → Inspect popup
- **Background Script**: Go to `chrome://extensions/` → Click "service worker" under your extension
- **Content Script**: Open DevTools on any webpage → Check the Console tab

## Notes

- The extension currently requires placeholder icons. You'll need to add icon images to an `icons/` folder:
  - `icons/icon16.png` (16x16)
  - `icons/icon48.png` (48x48)
  - `icons/icon128.png` (128x128)
- Alternatively, remove the icon references from `manifest.json` temporarily

## License

MIT

