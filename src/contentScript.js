// Content Script - Runs on SIS pages
const CORA_VERSION = '1.0.8';
const isInIframe = window !== window.top;
const frameContext = isInIframe ? 'IFRAME' : 'MAIN PAGE';

console.log(`%c🌟 Cora Extension v${CORA_VERSION} 🌟`, 'font-size: 16px; font-weight: bold; color: #667eea;');
console.log(`%c[${frameContext}] Content script loaded`, 'font-weight: bold; color: ' + (isInIframe ? '#e67700' : '#0066cc'));
console.log(`Location: ${window.location.href}`);

// Create a side panel that appears on the right
function createPanel(courseInfo, state = 'loading') {
  console.log('[Cora][Panel] Creating panel with state:', state);
  
  // Check if panel already exists, remove it
  const existingPanel = document.getElementById('cora-panel');
  if (existingPanel) {
    existingPanel.remove();
  }

  // Create panel container
  const panel = document.createElement('div');
  panel.id = 'cora-panel';
  panel.className = 'cora-panel';
  
  // Loading state content
  const loadingContent = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
      <div class="cora-spinner" style="width: 60px; height: 60px; border: 4px solid #e5ddc3; border-top: 4px solid #FF8C42; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 24px;"></div>
      <h3 style="font-size: 18px; color: #003d52; margin: 0 0 12px 0; font-weight: 600;">Analyzing Course...</h3>
      <p class="cora-progress-text" style="font-size: 14px; color: #666; margin: 0;">Initializing analysis...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  panel.innerHTML = `
    <div class="cora-panel-header">
      <div class="cora-panel-title">
        <img src="${chrome.runtime.getURL('assets/cora_logo_white.png')}" alt="CoRA" class="cora-logo" />
      </div>
      <div class="cora-panel-actions">
        <button class="cora-panel-about" title="About CoRA">
          <img src="${chrome.runtime.getURL('assets/question-mark.svg')}" alt="?" class="cora-icon" />
        </button>
        <button class="cora-panel-settings" title="Settings">
          <img src="${chrome.runtime.getURL('assets/settings-gear.svg')}" alt="Settings" class="cora-icon" />
        </button>
        <button class="cora-panel-close" title="Close">
          <img src="${chrome.runtime.getURL('assets/x-icon.svg')}" alt="Close" class="cora-icon" />
        </button>
      </div>
    </div>
    
    <div class="cora-panel-course-title">
      ${courseInfo.courseTitle || courseInfo.courseName || 'Course Information'}
    </div>
    
    <div class="cora-panel-content">
      ${state === 'loading' ? loadingContent : ''}
    </div>
    
    <div class="cora-panel-footer">
      <span class="cora-version">v${CORA_VERSION}</span>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add animation class after a brief delay
  setTimeout(() => {
    panel.classList.add('cora-panel-visible');
  }, 10);
  
  // About button
  const aboutBtn = panel.querySelector('.cora-panel-about');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      showAbout();
    });
  }
  
  // Settings button
  const settingsBtn = panel.querySelector('.cora-panel-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showSettings();
    });
  }
  
  // Close panel when clicking X
  panel.querySelector('.cora-panel-close').addEventListener('click', () => {
    console.log('[Cora][Panel] Closing panel');
    panel.classList.remove('cora-panel-visible');
    setTimeout(() => {
      panel.remove();
      currentPanel = null;
      currentAnalysisResult = null;
    }, 300);
  });
  
  console.log('[Cora][Panel] Panel created successfully');
  return panel;
}

// Global reference to current panel
let currentPanel = null;
let currentAnalysisResult = null;
let settingsModal = null;

// Show settings modal
async function showSettings() {
  console.log('[Cora][Settings] Opening settings modal...');
  
  // Check if extension context is valid
  if (!chrome.runtime?.id) {
    alert('Extension was reloaded. Please refresh this page (F5) to use Cora.');
    return;
  }
  
  // Get current API key (if any)
  const currentKey = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getOpenAIKey' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Cora][Settings] Error getting key:', chrome.runtime.lastError);
        resolve('');
      } else {
        resolve(response.apiKey || '');
      }
    });
  });
  
  const maskedKey = currentKey ? currentKey.substring(0, 10) + '...' + currentKey.substring(currentKey.length - 4) : 'Not set';
  
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'cora-settings-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    animation: fadeIn 0.2s ease-out;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 30px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    ">
      <h2 style="margin: 0 0 10px 0; color: #003d52; font-size: 24px; font-weight: 700;">Settings</h2>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Configure your OpenAI API key to enable course analysis</p>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #003d52; font-weight: 600; font-size: 14px;">
          OpenAI API Key
        </label>
        <input type="password" id="cora-api-key-input" placeholder="sk-proj-..." style="
          width: 100%;
          padding: 12px;
          border: 2px solid #e5ddc3;
          border-radius: 6px;
          font-size: 14px;
          font-family: monospace;
          box-sizing: border-box;
          transition: border-color 0.2s;
        " />
        <div style="margin-top: 8px; font-size: 12px; color: #666;">
          Current: <span style="font-family: monospace; color: #003d52;">${maskedKey}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 20px; padding: 12px; background: #f0f8ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <p style="margin: 0; font-size: 13px; color: #333;">
          <strong>ℹ️ How to get your API key:</strong><br>
          1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #0066cc;">platform.openai.com/api-keys</a><br>
          2. Create a new secret key<br>
          3. Copy and paste it above
        </p>
      </div>
      
      <div style="margin-bottom: 20px; padding: 12px; background: #f9f9f9; border-radius: 6px; border: 1px solid #e5ddc3;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: #003d52; margin-bottom: 4px;">📊 AI Request Logs</div>
            <div style="font-size: 12px; color: #666;">Download or clear detailed logs of all AI API calls</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="cora-clear-logs-btn" style="
              padding: 8px 16px;
              border: 2px solid #dc3545;
              background: white;
              color: #dc3545;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              white-space: nowrap;
            ">Clear Logs</button>
            <button id="cora-download-logs-btn" style="
              padding: 8px 16px;
              border: 2px solid #e5ddc3;
              background: white;
              color: #003d52;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              white-space: nowrap;
            ">Download Logs</button>
          </div>
        </div>
      </div>
      
      <div id="cora-settings-message" style="margin-bottom: 15px; padding: 10px; border-radius: 6px; font-size: 13px; display: none;"></div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cora-settings-cancel" style="
          padding: 10px 20px;
          border: 2px solid #e5ddc3;
          background: white;
          color: #666;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Cancel</button>
        <button id="cora-settings-save" style="
          padding: 10px 20px;
          border: none;
          background: #FF8C42;
          color: white;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Save API Key</button>
      </div>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #cora-api-key-input:focus {
        outline: none;
        border-color: #FF8C42;
      }
      #cora-settings-save:hover {
        background: #e67700;
        transform: translateY(-1px);
      }
      #cora-settings-cancel:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  settingsModal = modal;
  
  // Focus input
  const input = modal.querySelector('#cora-api-key-input');
  input.focus();
  
  // Cancel button
  modal.querySelector('#cora-settings-cancel').addEventListener('click', () => {
    closeSettings();
  });
  
  // Save button
  modal.querySelector('#cora-settings-save').addEventListener('click', async () => {
    await saveAPIKey();
  });
  
  // Enter key to save
  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      await saveAPIKey();
    }
  });
  
  // Download logs button
  modal.querySelector('#cora-download-logs-btn').addEventListener('click', async () => {
    await downloadLogs();
  });
  
  // Clear logs button
  modal.querySelector('#cora-clear-logs-btn').addEventListener('click', async () => {
    await clearLogs();
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettings();
    }
  });
}

// Save API key
async function saveAPIKey() {
  const input = document.querySelector('#cora-api-key-input');
  const messageDiv = document.querySelector('#cora-settings-message');
  const saveBtn = document.querySelector('#cora-settings-save');
  
  const apiKey = input.value.trim();
  
  if (!apiKey) {
    showSettingsMessage('Please enter an API key', 'error');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    showSettingsMessage('Invalid API key format. OpenAI keys start with "sk-"', 'error');
    return;
  }
  
  console.log('[Cora][Settings] Saving API key...');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'saveOpenAIKey', apiKey },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        }
      );
    });
    
    if (response.success) {
      console.log('[Cora][Settings] API key saved successfully');
      showSettingsMessage('✓ API key saved successfully!', 'success');
      setTimeout(() => {
        closeSettings();
      }, 1500);
    } else {
      console.error('[Cora][Settings] Failed to save:', response.error);
      showSettingsMessage('Error: ' + response.error, 'error');
      saveBtn.textContent = 'Save API Key';
      saveBtn.disabled = false;
    }
  } catch (error) {
    console.error('[Cora][Settings] Exception:', error);
    showSettingsMessage('Error: ' + error.message, 'error');
    saveBtn.textContent = 'Save API Key';
    saveBtn.disabled = false;
  }
}

// Show message in settings modal
function showSettingsMessage(message, type) {
  const messageDiv = document.querySelector('#cora-settings-message');
  if (!messageDiv) return;
  
  messageDiv.style.display = 'block';
  messageDiv.textContent = message;
  
  if (type === 'success') {
    messageDiv.style.background = '#d4edda';
    messageDiv.style.borderLeft = '4px solid #28a745';
    messageDiv.style.color = '#155724';
  } else if (type === 'error') {
    messageDiv.style.background = '#f8d7da';
    messageDiv.style.borderLeft = '4px solid #dc3545';
    messageDiv.style.color = '#721c24';
  }
}

// Close settings modal
function closeSettings() {
  console.log('[Cora][Settings] Closing settings modal');
  if (settingsModal) {
    settingsModal.style.animation = 'fadeOut 0.2s ease-out';
    setTimeout(() => {
      settingsModal.remove();
      settingsModal = null;
    }, 200);
  }
}

// Show about screen
function showAbout() {
  console.log('[Cora][About] Opening About screen...');
  
  if (!currentPanel) return;
  
  // Hide main content, show about content
  const content = currentPanel.querySelector('.cora-panel-content');
  const courseTitle = currentPanel.querySelector('.cora-panel-course-title');
  
  if (content && courseTitle) {
    // Update course title bar to show "About Us" with back button
    courseTitle.style.textAlign = 'left';
    courseTitle.innerHTML = `
      <button class="cora-about-back" style="
        background: none;
        border: none;
        color: #2d3748;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-right: 12px;
        display: inline-flex;
        align-items: center;
      ">◄</button>
      <span>About Us</span>
    `;
    
    // Add back button functionality
    courseTitle.querySelector('.cora-about-back').addEventListener('click', () => {
      closeAbout();
    });
    
    // Show about content
    content.innerHTML = `
      <div class="cora-about-screen">
        <div class="cora-about-section">
          <button class="cora-about-section-btn" data-section="1">
            <span>What is CoRA?</span>
            <span class="cora-about-toggle">+</span>
          </button>
          <div class="cora-about-section-content" data-content="1">
            <div class="cora-about-text">
              Short for Course Research Assistant, CoRA empowers UVA students to find the best fit 
              schedule through AI course summaries and statistics. The chrome extension simplifies the 
              once grueling search for courses that satisfied certain requirements, personal or academic.
            </div>
          </div>
        </div>
        
        <div class="cora-about-section">
          <button class="cora-about-section-btn" data-section="2">
            <span>AI Implementation</span>
            <span class="cora-about-toggle">+</span>
          </button>
          <div class="cora-about-section-content" data-content="2">
            <div class="cora-about-text">
              The agent Claude by Anthropic implemented a program that completes the AI summaries. The 
              program web scrapes from UVA course related pages, performs very specific web searches on 
              results, then provides the appropriate AI summaries based on crowd consensus.
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add accordion functionality
    const buttons = content.querySelectorAll('.cora-about-section-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionNum = btn.dataset.section;
        const contentDiv = content.querySelector(`[data-content="${sectionNum}"]`);
        const toggle = btn.querySelector('.cora-about-toggle');
        
        if (contentDiv.style.maxHeight && contentDiv.style.maxHeight !== '0px') {
          contentDiv.style.maxHeight = '0px';
          toggle.textContent = '+';
        } else {
          contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
          toggle.textContent = '−';
        }
      });
    });
    
    // Store original content to restore later
    currentPanel.dataset.aboutActive = 'true';
  }
  
  console.log('[Cora][About] About screen displayed');
}

// Close about screen and restore main content
function closeAbout() {
  if (!currentPanel) return;
  
  const courseTitle = currentPanel.querySelector('.cora-panel-course-title');
  
  if (courseTitle && currentPanel.dataset.aboutActive === 'true') {
    // Restore original course title
    const courseInfo = currentAnalysisResult?.courseInfo || {};
    courseTitle.style.textAlign = 'center';
    courseTitle.innerHTML = courseInfo.courseTitle || courseInfo.courseName || 'Course Information';
    
    // Restore main content
    if (currentAnalysisResult) {
      displayResults(currentAnalysisResult);
    }
    
    delete currentPanel.dataset.aboutActive;
    console.log('[Cora][About] About screen closed');
  }
}

// Download AI logs
async function downloadLogs() {
  console.log('[Cora][Settings] Downloading AI logs...');
  const downloadBtn = document.querySelector('#cora-download-logs-btn');
  const originalText = downloadBtn.textContent;
  
  downloadBtn.textContent = 'Downloading...';
  downloadBtn.disabled = true;
  
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      showSettingsMessage('Extension was reloaded. Please refresh this page.', 'error');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'downloadLogs' });
    
    if (response.success) {
      console.log('[Cora][Settings] Logs downloaded successfully');
      showSettingsMessage('✓ Logs downloaded successfully!', 'success');
    } else {
      console.error('[Cora][Settings] Failed to download logs:', response.error);
      showSettingsMessage('Error: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('[Cora][Settings] Error downloading logs:', error);
    showSettingsMessage('Error downloading logs: ' + error.message, 'error');
  } finally {
    downloadBtn.textContent = originalText;
    downloadBtn.disabled = false;
  }
}

// Clear AI logs
async function clearLogs() {
  console.log('[Cora][Settings] Clearing AI logs...');
  
  // Confirm with user
  if (!confirm('Are you sure you want to clear all AI request logs? This action cannot be undone.')) {
    return;
  }
  
  const clearBtn = document.querySelector('#cora-clear-logs-btn');
  const originalText = clearBtn.textContent;
  
  clearBtn.textContent = 'Clearing...';
  clearBtn.disabled = true;
  
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      showSettingsMessage('Extension was reloaded. Please refresh this page.', 'error');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'clearLogs' });
    
    if (response.success) {
      console.log('[Cora][Settings] Logs cleared successfully');
      showSettingsMessage('✓ All logs cleared successfully!', 'success');
    } else {
      console.error('[Cora][Settings] Failed to clear logs:', response.error);
      showSettingsMessage('Error: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('[Cora][Settings] Error clearing logs:', error);
    showSettingsMessage('Error clearing logs: ' + error.message, 'error');
  } finally {
    clearBtn.textContent = originalText;
    clearBtn.disabled = false;
  }
}

// Start course analysis
async function startCourseAnalysis(courseInfo) {
  console.log('[Cora][Analysis] Starting analysis for:', courseInfo);
  
  // Create panel with loading state
  currentPanel = createPanel(courseInfo, 'loading');
  
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      console.error('[Cora][Analysis][Error] Extension context is invalid');
      showError('Extension was reloaded. Please refresh this page to use Cora.');
      return;
    }
    
    // Send message to background script to start analysis
    console.log('[Cora][Analysis] Sending analyzeCourse request to background...');
    chrome.runtime.sendMessage(
      { action: 'analyzeCourse', courseInfo },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Cora][Analysis][Error] Runtime error:', chrome.runtime.lastError);
          
          // Check if it's an extension context error
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            showError('Extension was reloaded. Please refresh this page (F5) to use Cora.');
          } else {
            showError('Failed to communicate with background script: ' + chrome.runtime.lastError.message);
          }
          return;
        }
        
        console.log('[Cora][Analysis] Received response from background:', response);
        
        if (response.success) {
          currentAnalysisResult = response.result;
          displayResults(response.result);
        } else {
          showError(response.error || 'Analysis failed');
        }
      }
    );
  } catch (error) {
    console.error('[Cora][Analysis][Error] Exception during analysis:', error);
    
    // Check if it's an extension context error
    if (error.message.includes('Extension context invalidated')) {
      showError('Extension was reloaded. Please refresh this page (F5) to use Cora.');
    } else {
      showError('An error occurred: ' + error.message);
    }
  }
}

// Update progress message in panel
function updateProgress(message) {
  if (!currentPanel) return;
  
  console.log('[Cora][Progress] Updating: ' + message);
  const progressText = currentPanel.querySelector('.cora-progress-text');
  if (progressText) {
    progressText.textContent = message;
  }
}

// Show error in panel
function showError(errorMessage) {
  if (!currentPanel) return;
  
  console.error('[Cora][Error] Showing error:', errorMessage);
  const content = currentPanel.querySelector('.cora-panel-content');
  if (content) {
    content.innerHTML = `
      <div class="cora-section" style="margin-top: 20px;">
        <h3 class="cora-section-title">ERROR</h3>
        <div class="cora-section-content" style="background: #ffe6e6; border-color: #ff4444; color: #cc0000;">
          <p style="margin: 0;"><strong>Analysis failed:</strong></p>
          <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 12px;">${errorMessage}</p>
          <p style="margin: 15px 0 0 0; font-size: 13px;">Please check the console for more details, or ensure your API keys are configured correctly.</p>
        </div>
      </div>
    `;
  }
}

// Display results in panel
function displayResults(result) {
  if (!currentPanel) return;
  
  console.log('[Cora][Display] Displaying results:', result);
  
  const finalResult = result.finalResult || {};
  const courseInfo = result.courseInfo || {};
  
  // Get ratings (with fallback values)
  const overallRating = finalResult.overallRating != null ? finalResult.overallRating.toFixed(1) : 'N/A';
  const difficultyRating = finalResult.difficultyRating != null ? finalResult.difficultyRating.toFixed(1) : 'N/A';
  
  // Get rating source info
  const ratingSource = finalResult.ratingSource || null; // 'TCF' or 'AI'
  const ratingSourceName = finalResult.ratingSourceName || '';
  
  // Determine color based on rating value (gentler colors)
  const getColorForRating = (rating) => {
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) return '#e5ddc3'; // Default beige
    if (numRating <= 2.0) return '#f5a3a3'; // Gentle red
    if (numRating <= 3.4) return '#ffe796'; // Gentle yellow
    return '#a3d9a5'; // Gentle green
  };
  
  // Difficulty: reversed colors (high difficulty = red, low difficulty = green)
  const getDifficultyColor = (rating) => {
    const numRating = parseFloat(rating);
    if (isNaN(numRating)) return '#e5ddc3'; // Default beige
    if (numRating >= 3.5) return '#f5a3a3'; // Gentle red (high difficulty)
    if (numRating >= 2.1) return '#ffe796'; // Gentle yellow (medium)
    return '#a3d9a5'; // Gentle green (low difficulty)
  };
  
  const overallColor = getColorForRating(overallRating);
  const difficultyColor = getDifficultyColor(difficultyRating);
  
  // Create info icon HTML if rating exists
  let ratingSourceHTML = '';
  if (overallRating !== 'N/A' && ratingSource) {
    const sourceLabel = ratingSource === 'TCF' ? 'TCF' : 'AI';
    const sourceTooltip = ratingSource === 'TCF' 
      ? 'Rating sourced from theCourseForum' 
      : 'Rating calculated using CoRA\'s grading rubric based on aggregated student feedback';
    
    ratingSourceHTML = `
      <span class="cora-rating-source-badge" data-tooltip="${sourceTooltip}">
        ${sourceLabel}
      </span>
    `;
  }
  
  // Get summaries
  const courseSummary = finalResult.courseSummary || 'No course summary available.';
  const professorSummary = finalResult.professorSummary || 'No professor information available.';
  
  // Get source links
  const sources = finalResult.sources || [];
  
  // Build links HTML
  let linksHTML = '';
  if (sources.length > 0) {
    linksHTML = sources.map(source => `
      <a href="${source.url}" target="_blank" class="cora-link">
        ${source.source === 'reddit.com' ? '🔍' : '📚'} ${source.title}
      </a>
    `).join('');
  } else {
    linksHTML = '<p style="color: #999; font-style: italic;">No sources found.</p>';
  }
  
  // Update panel content
  const content = currentPanel.querySelector('.cora-panel-content');
  if (content) {
    content.innerHTML = `
      <div class="cora-tab-content cora-tab-content-active" id="summary-content">
        <div class="cora-section">
          <h3 class="cora-section-title">
            RATINGS & DIFFICULTY 
            <img src="${chrome.runtime.getURL('assets/info-mini-icon.svg')}" alt="Info" class="cora-info-icon" title="Ratings are sourced from theCourseForum when available, otherwise calculated using CoRA's AI rubric" />
            ${ratingSourceHTML}
          </h3>
          <div class="cora-ratings-grid">
            <div class="cora-rating-box" style="background-color: ${overallColor};">
              <div class="cora-rating-value">${overallRating}</div>
              <div class="cora-rating-label">OVERALL RATING</div>
            </div>
            <div class="cora-rating-box" style="background-color: ${difficultyColor};">
              <div class="cora-rating-value">${difficultyRating}</div>
              <div class="cora-rating-label">DIFFICULTY</div>
            </div>
          </div>
        </div>
        
        <div class="cora-section">
          <h3 class="cora-section-title">AI COURSE SUMMARY</h3>
          <div class="cora-section-content cora-summary-box">
            ${courseSummary}
          </div>
        </div>
        
        <div class="cora-section">
          <h3 class="cora-section-title">AI PROFESSOR SUMMARY</h3>
          <div class="cora-section-content cora-summary-box">
            ${professorSummary}
          </div>
        </div>
        
        <div class="cora-section">
          <h3 class="cora-section-title">RELEVANT LINKS</h3>
          <div class="cora-links">
            ${linksHTML}
          </div>
        </div>
      </div>
    `;
  }
  
  console.log('[Cora][Display] Results displayed successfully');
}

// Extract course information from a row
function getCourseInfo(row) {
  console.log('[Cora][Extract] Extracting course information from row...');
  
  const section = row.querySelector('[id$="_CLASS_SECTION"]')?.textContent.trim() || 'N/A';
  const instructor = row.querySelector('[id$="_INSTRUCTOR"]')?.textContent.trim() || 'N/A';
  const status = row.querySelector('[id$="_STATUS"]')?.textContent.trim() || 'N/A';
  
  // PRIORITY 1: Get the full page heading which contains the actual course code
  // Try h2 with MuiTypography class first (most reliable structure)
  const h2Header = document.querySelector('h2.cx-MuiTypography-h2');
  let courseNumber = '';
  let courseName = '';
  let courseTitle = '';
  
  if (h2Header) {
    // Get the first text node (course name)
    const textNode = Array.from(h2Header.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      courseName = textNode.textContent.trim();
      courseTitle = courseName;
      console.log(`[Cora][Extract] Found course name from h2 text node: ${courseName}`);
    }
    
    // Get the course code from the span
    const codeSpan = h2Header.querySelector('span.cx-MuiTypography-colorSecondary');
    if (codeSpan) {
      const codeText = codeSpan.textContent.trim().replace(/^\|\s*/, '');
      courseNumber = codeText;
      console.log(`[Cora][Extract] Found course code from span: ${courseNumber}`);
    }
  }
  
  // FALLBACK 1: Try h1 or h2 with pipe format
  if (!courseName) {
    const mainHeading = document.querySelector('h1, h2')?.textContent.trim() || '';
    const pipePattern = /^(.+?)\s*\|\s*([A-Z]{2,4})\s+(\d{4})\s*$/i;
    const pipeMatch = mainHeading.match(pipePattern);
    
    if (pipeMatch) {
      courseName = pipeMatch[1].trim();
      courseNumber = `${pipeMatch[2].toUpperCase()} ${pipeMatch[3]}`;
      courseTitle = courseName;
      console.log(`[Cora][Extract] Parsed from H1/H2 pipe: ${courseNumber} - ${courseName}`);
    }
  }
  
  // FALLBACK 2: Try aria-label
  if (!courseName) {
    const table = row.closest('table');
    const ariaLabel = table?.getAttribute('aria-label') || '';
    
    // Look for department code at word boundaries (to avoid "TING" from "accounTING")
    const wordBoundaryPattern = /\b([A-Z]{2,4})\s+(\d{4})\b/gi;
    const allMatches = [...ariaLabel.matchAll(wordBoundaryPattern)];
    
    if (allMatches.length > 0) {
      // Use the last match (most likely to be the actual course code)
      const lastMatch = allMatches[allMatches.length - 1];
      courseNumber = `${lastMatch[1].toUpperCase()} ${lastMatch[2]}`;
      
      // Get the course name (everything before the course code)
      const codePosition = lastMatch.index;
      courseName = ariaLabel.substring(0, codePosition).trim();
      
      // Clean up trailing punctuation and "Classes" text
      courseName = courseName.replace(/[,\-–—]\s*$/, '').replace(/\s+Classes\s*$/, '').trim();
      courseTitle = courseName;
      
      console.log(`[Cora][Extract] Parsed from aria-label: ${courseNumber} - ${courseName}`);
    } else {
      // Last resort: use the aria-label
      courseName = ariaLabel;
      courseTitle = ariaLabel || 'Course Information';
      console.log(`[Cora][Extract] Could not parse course number from aria-label: ${ariaLabel}`);
    }
  }
  
  // Final fallback for courseTitle display
  if (!courseTitle) {
    courseTitle = courseName || 'Course Information';
  }
  
  // Clean up instructor name (remove "Staff" or empty values and duplicates)
  let cleanInstructor = instructor;
  if (instructor && instructor !== 'N/A') {
    // Remove duplicates (e.g., "Rich LahijaniRich Lahijani" -> "Rich Lahijani")
    const instructorParts = instructor.split(/(?=[A-Z][a-z])/);
    const uniqueParts = [...new Set(instructorParts)];
    cleanInstructor = uniqueParts.join('');
  }
  const professor = (cleanInstructor && cleanInstructor !== 'N/A' && cleanInstructor !== 'Staff') ? cleanInstructor : '';
  
  const extractedInfo = {
    courseTitle,
    courseNumber,
    courseName,
    section,
    instructor: cleanInstructor,
    professor, // Cleaned version for searching
    status
  };
  
  console.log('[Cora][Extract] Extracted info:', extractedInfo);
  
  return extractedInfo;
}

// Add Cora button to an expanded course row
function addCoraButton(row) {
  const rowId = row.id || 'unknown';
  
  console.log(`[Cora Debug] addCoraButton called for row ${rowId}`);
  console.log(`[Cora Debug] Row tagName: ${row.tagName}, classList:`, row.classList);
  
  // Find the next sibling row which contains the expanded details
  let detailsRow = row.nextElementSibling;
  
  // Check if button already exists in the details area
  if (detailsRow && detailsRow.querySelector('.cora-action-button')) {
    console.log(`[Cora Debug] Button already exists in details for row ${rowId}`);
    return;
  }
  
  if (!detailsRow || !detailsRow.querySelector('td[id$="-details"]')) {
    console.warn(`[Cora Debug] No details row found for ${rowId}, will retry later`);
    return;
  }
  
  console.log(`[Cora Debug] Found details row for ${rowId}`);
  
  // Find the Share button container
  const shareButton = detailsRow.querySelector('.cta-share');
  if (!shareButton) {
    console.warn(`[Cora Debug] No Share button found in details for row ${rowId}`);
    return;
  }
  
  // Get the button container (parent of Share button)
  const buttonContainer = shareButton.parentElement;
  console.log(`[Cora Debug] Found button container for row ${rowId}`);
  
  insertCoraButtonInContainer(buttonContainer, shareButton, row, rowId);
}

// Helper function to insert the button into the button container
function insertCoraButtonInContainer(container, shareButton, row, rowId) {
  // Create the Cora button
  const coraButton = document.createElement('button');
  coraButton.className = 'cora-action-button cx-MuiButtonBase-root cx-MuiButton-root cx-MuiButton-outlined';
  coraButton.tabIndex = 0;
  coraButton.type = 'button';
  coraButton.innerHTML = `
    <span class="cx-MuiButton-label">
      ✨ Cora
    </span>
  `;
  
  // Add click handler
  coraButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[Cora][Button] Button clicked!');
    const courseInfo = getCourseInfo(row);
    startCourseAnalysis(courseInfo);
  });
  
  // Insert button before the Share button
  try {
    container.insertBefore(coraButton, shareButton);
    console.log(`[Cora Debug] ✅ Cora button successfully added to row ${rowId}`);
  } catch (error) {
    console.error(`[Cora Debug] Error inserting button:`, error);
    // Fallback: just prepend
    container.insertBefore(coraButton, container.firstChild);
    console.log(`[Cora Debug] ✅ Cora button added (fallback) to row ${rowId}`);
  }
}

// Remove Cora button from a row
function removeCoraButton(row) {
  // Look in the details row (next sibling)
  const detailsRow = row.nextElementSibling;
  if (detailsRow) {
    const button = detailsRow.querySelector('.cora-action-button');
    if (button) {
      button.remove();
      console.log('Cora button removed from row:', row.id);
    }
  }
}

// Process all course rows and add/remove buttons based on expansion state
function processAllRows() {
  // Find all course rows (aria-level="1" rows that aren't detail rows)
  const courseRows = document.querySelectorAll('tr[aria-level="1"]');
  
  console.log(`[Cora Debug] Found ${courseRows.length} course rows`);
  
  courseRows.forEach((row, index) => {
    const isExpanded = row.getAttribute('aria-expanded') === 'true';
    const rowId = row.id || `row-${index}`;
    
    console.log(`[Cora Debug] Row ${rowId}: aria-expanded="${isExpanded}"`);
    
    if (isExpanded) {
      addCoraButton(row);
    } else {
      removeCoraButton(row);
    }
  });
  
  if (courseRows.length === 0) {
    console.warn('[Cora Debug] No course rows found! The page structure might be different.');
  }
}

// Listen for messages from background script (progress updates)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Cora][Message] Received message:', request);
  
  if (request.action === 'analysisProgress') {
    updateProgress(request.progress.message);
  }
  
  sendResponse({ received: true });
  return false;
});

// Initialize the extension
function initialize() {
  console.log(`[${frameContext}] Initializing Cora Extension...`);
  
  // Process existing rows
  processAllRows();
  
  // Find the app container (React root)
  const appContainer = document.getElementById('app');
  if (appContainer) {
    console.log('[Cora Debug] Found #app container, adding listeners to it');
    
    // Add click listener to the app container specifically
    appContainer.addEventListener('click', (e) => {
      console.log('[Cora Debug] Click detected in app container on:', e.target);
      
      // Check immediately and once after 300ms
      processAllRows();
      
      setTimeout(() => {
        processAllRows();
      }, 300);
    }, true); // Use capture phase to catch it early
    
    console.log('[Cora Debug] Click listener added to app container');
  } else {
    console.warn('[Cora Debug] Could not find #app container, adding global listener');
    
    // Fallback: Add global click listener
    document.addEventListener('click', (e) => {
      console.log('[Cora Debug] Click detected globally on:', e.target);
      
      // Check immediately and once after 300ms
      processAllRows();
      
      setTimeout(() => {
        processAllRows();
      }, 300);
    }, true);
    
    console.log('[Cora Debug] Global click listener added');
  }
  
  // Set up MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    mutations.forEach((mutation) => {
      // Check if aria-expanded attribute changed
      if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
        const row = mutation.target;
        const isExpanded = row.getAttribute('aria-expanded') === 'true';
        const rowId = row.id || 'unknown';
        
        console.log(`[Cora Debug] MutationObserver: Row ${rowId} expanded state changed to ${isExpanded}`);
        console.log('[Cora Debug] Row element:', row);
        
        if (isExpanded) {
          // Add button immediately and retry at 300ms, 1s, and 2s
          addCoraButton(row);
          
          setTimeout(() => {
            console.log(`[Cora Debug] Retry adding button after 300ms`);
            addCoraButton(row);
          }, 300);
          
          setTimeout(() => {
            console.log(`[Cora Debug] Retry adding button after 1s`);
            addCoraButton(row);
          }, 1000);
          
          setTimeout(() => {
            console.log(`[Cora Debug] Retry adding button after 2s`);
            addCoraButton(row);
          }, 2000);
        } else {
          removeCoraButton(row);
        }
        shouldProcess = true;
      }
      
      // Check for new nodes added (like search results appearing)
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if it's an element and contains table or course-related content
          if (node.nodeType === Node.ELEMENT_NODE) {
            const hasTable = node.querySelector('table[role="treegrid"]') || node.tagName === 'TABLE';
            const hasCourseRows = node.querySelector('tr[aria-level="1"]') || (node.tagName === 'TR' && node.getAttribute('aria-level') === '1');
            
            if (hasTable || hasCourseRows) {
              console.log('[Cora Debug] MutationObserver: Course table/rows detected!');
              shouldProcess = true;
            }
          }
        });
      }
    });
    
    // Process all rows if we detected relevant changes
    if (shouldProcess) {
      console.log('[Cora Debug] MutationObserver: Processing rows due to changes...');
      setTimeout(processAllRows, 300);
    }
  });
  
  // Observe the app container or entire document for changes
  const observeTarget = appContainer || document.body;
  observer.observe(observeTarget, {
    attributes: true,
    attributeFilter: ['aria-expanded'],
    childList: true,
    subtree: true
  });
  
  console.log(`[Cora Debug] MutationObserver active - watching ${appContainer ? '#app' : 'document.body'} for course row changes`);
}

// Wait for the page to load before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded
  initialize();
}

// Also re-process when the page content changes significantly
window.addEventListener('load', () => {
  console.log('[Cora Debug] Page load event - processing rows...');
  setTimeout(processAllRows, 1000);
  setTimeout(processAllRows, 3000);
});

// Debug helper - expose to console for manual testing
window.coraDebug = {
  processAllRows,
  findRows: () => {
    const rows = document.querySelectorAll('tr[aria-level="1"]');
    console.log(`[${frameContext}] Found ${rows.length} rows with aria-level="1":`, rows);
    return rows;
  },
  findExpandedRows: () => {
    const rows = document.querySelectorAll('tr[aria-expanded="true"]');
    console.log(`[${frameContext}] Found ${rows.length} rows with aria-expanded="true":`, rows);
    return rows;
  },
  findAllTables: () => {
    const tables = document.querySelectorAll('table');
    console.log(`[${frameContext}] Found ${tables.length} tables:`, tables);
    const treegrids = document.querySelectorAll('table[role="treegrid"]');
    console.log(`[${frameContext}] Found ${treegrids.length} treegrid tables:`, treegrids);
    return { tables, treegrids };
  },
  findAllTRs: () => {
    const allRows = document.querySelectorAll('tr');
    console.log(`[${frameContext}] Found ${allRows.length} total TR elements`);
    const withAriaLevel = document.querySelectorAll('tr[aria-level]');
    console.log(`[${frameContext}] Found ${withAriaLevel.length} TR elements with aria-level:`, withAriaLevel);
    return { allRows, withAriaLevel };
  },
  addButtonToFirst: () => {
    const row = document.querySelector('tr[aria-level="1"][aria-expanded="true"]');
    if (row) {
      console.log(`[${frameContext}] Adding button to first expanded row:`, row);
      addCoraButton(row);
    } else {
      console.log(`[${frameContext}] No expanded rows found!`);
      console.log(`[${frameContext}] Trying to find any expanded row...`);
      const anyExpanded = document.querySelector('tr[aria-expanded="true"]');
      if (anyExpanded) {
        console.log(`[${frameContext}] Found this expanded row:`, anyExpanded);
        addCoraButton(anyExpanded);
      }
    }
  },
  frameContext: frameContext,
  isInIframe: isInIframe,
  version: CORA_VERSION
};

console.log(`[${frameContext}] Debug helper available: window.coraDebug (v${CORA_VERSION})`);
console.log(`[${frameContext}] Frame info: isInIframe=${isInIframe}, frameContext="${frameContext}"`);
console.log(`[${frameContext}] Available commands:`);
console.log('  - coraDebug.findRows()         // Find course rows');
console.log('  - coraDebug.findExpandedRows() // Find expanded rows');
console.log('  - coraDebug.findAllTables()    // Find all tables');
console.log('  - coraDebug.findAllTRs()       // Find all TR elements');
console.log('  - coraDebug.processAllRows()   // Manually trigger button placement');
console.log('  - coraDebug.addButtonToFirst() // Add button to first expanded row');
console.log('  - coraDebug.frameContext       // Show frame context');
console.log('  - coraDebug.isInIframe         // Check if in iframe');
