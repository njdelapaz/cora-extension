# Cora Extension

A Chrome extension built for the Claude Hackathon 2025 that enhances the UVA SIS (Student Information System) course search experience.

## How It Works

When you're browsing courses on the UVA SIS website:

1. **Navigate** to any course search page on `sisuva.admin.virginia.edu`
2. **Expand** a course section by clicking on it to see the detailed information
3. **Look** for the purple "✨ Cora" button that appears next to the three-dot menu
4. **Click** the Cora button to see a popup with course information (more features coming soon!)

The extension intelligently detects when you expand or collapse course sections and automatically shows/hides the Cora button accordingly.

## Getting Started

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `cora-extension` directory

Go 

### Development

The extension consists of three main components:

- **Content Script** (`src/contentScript.js`): Runs in the context of web pages and can interact with the DOM
- **Background Script** (`src/background.js`): Service worker that runs in the background and handles events
- **Popup** (`popup/popup.html` & `popup/popup.js`): The UI that appears when clicking the extension icon

### Features

- ✅ **SIS Integration**: Works specifically on `sisuva.admin.virginia.edu`
- ✅ **Smart Button Injection**: Automatically adds a "Cora" button to expanded course sections
- ✅ **Dynamic Detection**: Uses MutationObserver to detect when courses are expanded/collapsed
- ✅ **Modern UI**: Beautiful gradient-styled buttons and modal popups
- ✅ **Course Information Display**: Shows course section, instructor, and status information
- ✅ Manifest V3 compliant
- ✅ Content script with CSS injection
- ✅ Background service worker ready for future features

### Customization

- Edit `manifest.json` to add permissions, update the name, or configure content scripts
- Modify `popup/popup.html` and `popup/popup.js` to customize the popup UI
- Update `src/contentScript.js` to interact with web pages
- Enhance `src/background.js` to handle background tasks and events

### Debugging

- **Popup**: Right-click the extension icon → Inspect popup
- **Background Script**: Go to `chrome://extensions/` → Click "service worker" under your extension
- **Content Script**: Open DevTools on any webpage → Check the Console tab

## Development Notes

- The extension is configured to only run on `sisuva.admin.virginia.edu` for security and performance
- Uses MutationObserver for efficient DOM monitoring without polling
- Styled to match the SIS interface with Material-UI-inspired components
- The modal popup is currently a placeholder - future versions will include enhanced features

## License

MIT
