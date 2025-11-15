// Content Script - Runs in the context of web pages
console.log('Cora Extension: Content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'Content script is active' });
  }
  
  return true; // Keep the message channel open for async response
});

// Example: Detect page load
window.addEventListener('load', () => {
  console.log('Page loaded:', window.location.href);
});

