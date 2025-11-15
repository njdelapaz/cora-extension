// Popup Script - Handles the extension popup UI
console.log('CoRA Popup script loaded');

const versionDiv = document.getElementById('version');
const statusBadge = document.getElementById('status');
const cacheStatsDiv = document.getElementById('cache-stats');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const downloadLogsBtn = document.getElementById('download-logs-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const logMessage = document.getElementById('log-message');

// Display version from manifest
const manifestData = chrome.runtime.getManifest();
versionDiv.textContent = `v${manifestData.version}`;
console.log(`CoRA Extension Popup v${manifestData.version}`);

// Check if we're on the SIS page to update status
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url && tabs[0].url.includes('sisuva.admin.virginia.edu')) {
    statusBadge.textContent = '● Active on SIS';
    statusBadge.style.background = '#28a745';
  } else {
    statusBadge.textContent = '○ Navigate to SIS';
    statusBadge.style.background = '#6c757d';
  }
});

// Load cache stats
async function loadCacheStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCacheStats' });
    
    if (response.success) {
      const stats = response.stats;
      if (stats.totalEntries === 0) {
        cacheStatsDiv.textContent = 'No cached courses yet';
      } else {
        cacheStatsDiv.innerHTML = `
          <strong>${stats.activeEntries}</strong> courses cached (${stats.totalSize})<br>
          Hit rate: ${stats.hitRate} | Oldest: ${stats.oldestEntry}
        `;
      }
    } else {
      cacheStatsDiv.textContent = 'Failed to load cache stats';
    }
  } catch (error) {
    console.error('[CoRA][Popup] Error loading cache stats:', error);
    cacheStatsDiv.textContent = 'Error loading stats';
  }
}

// Load stats on popup open
loadCacheStats();

// Show message function
function showMessage(text, type) {
  logMessage.textContent = text;
  logMessage.style.display = 'block';
  
  if (type === 'success') {
    logMessage.style.background = '#d4edda';
    logMessage.style.color = '#155724';
    logMessage.style.border = '1px solid #c3e6cb';
  } else if (type === 'error') {
    logMessage.style.background = '#f8d7da';
    logMessage.style.color = '#721c24';
    logMessage.style.border = '1px solid #f5c6cb';
  }
  
  setTimeout(() => {
    logMessage.style.display = 'none';
  }, 3000);
}

// Download logs button
downloadLogsBtn.addEventListener('click', async () => {
  console.log('[CoRA][Popup] Downloading logs...');
  const originalText = downloadLogsBtn.textContent;
  downloadLogsBtn.textContent = 'Downloading...';
  downloadLogsBtn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'downloadLogs' });
    
    if (response.success) {
      console.log('[CoRA][Popup] Logs downloaded successfully');
      showMessage('✓ Logs downloaded!', 'success');
    } else {
      console.error('[CoRA][Popup] Failed to download logs:', response.error);
      showMessage('Error: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('[CoRA][Popup] Error downloading logs:', error);
    showMessage('Error: ' + error.message, 'error');
  } finally {
    downloadLogsBtn.textContent = originalText;
    downloadLogsBtn.disabled = false;
  }
});

// Clear cache button
clearCacheBtn.addEventListener('click', async () => {
  console.log('[CoRA][Popup] Clearing cache...');
  
  if (!confirm('Are you sure you want to clear all cached course results? This action cannot be undone.')) {
    return;
  }
  
  const originalText = clearCacheBtn.textContent;
  clearCacheBtn.textContent = 'Clearing...';
  clearCacheBtn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearCache' });
    
    if (response.success) {
      console.log('[CoRA][Popup] Cache cleared successfully');
      showMessage('✓ Cache cleared!', 'success');
      loadCacheStats(); // Reload stats
    } else {
      console.error('[CoRA][Popup] Failed to clear cache:', response.error);
      showMessage('Error: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('[CoRA][Popup] Error clearing cache:', error);
    showMessage('Error: ' + error.message, 'error');
  } finally {
    clearCacheBtn.textContent = originalText;
    clearCacheBtn.disabled = false;
  }
});

// Clear logs button
clearLogsBtn.addEventListener('click', async () => {
  console.log('[CoRA][Popup] Clearing logs...');
  
  if (!confirm('Are you sure you want to clear all AI request logs? This action cannot be undone.')) {
    return;
  }
  
  const originalText = clearLogsBtn.textContent;
  clearLogsBtn.textContent = 'Clearing...';
  clearLogsBtn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearLogs' });
    
    if (response.success) {
      console.log('[CoRA][Popup] Logs cleared successfully');
      showMessage('✓ Logs cleared!', 'success');
    } else {
      console.error('[CoRA][Popup] Failed to clear logs:', response.error);
      showMessage('Error: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('[CoRA][Popup] Error clearing logs:', error);
    showMessage('Error: ' + error.message, 'error');
  } finally {
    clearLogsBtn.textContent = originalText;
    clearLogsBtn.disabled = false;
  }
});

