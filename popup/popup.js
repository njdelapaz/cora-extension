// Popup Script - Handles the extension popup UI
console.log('Popup script loaded');

const statusDiv = document.getElementById('status');
const actionBtn = document.getElementById('actionBtn');
const pingBtn = document.getElementById('pingBtn');

// Update status message
function updateStatus(message) {
  statusDiv.textContent = message;
}

// Action button click handler
actionBtn.addEventListener('click', async () => {
  updateStatus('Button clicked!');
  
  // Example: Send message to background script
  chrome.runtime.sendMessage(
    { action: 'getData' },
    (response) => {
      console.log('Response from background:', response);
      updateStatus(`Data: ${response.data}`);
    }
  );
});

// Ping content script button click handler
pingBtn.addEventListener('click', async () => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'ping' },
      (response) => {
        if (chrome.runtime.lastError) {
          updateStatus('Error: ' + chrome.runtime.lastError.message);
        } else {
          updateStatus(response.status);
        }
      }
    );
  } catch (error) {
    updateStatus('Error: ' + error.message);
  }
});

// Initialize popup
updateStatus('Ready');

