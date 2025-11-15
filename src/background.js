// Background Service Worker - Runs in the background
console.log('Cora Extension: Background service worker initialized');

// Static imports (required for Service Workers in Manifest V3)
import { config, loadConfig, isConfigured } from './config.js';
import { CourseAnalyzer } from './services/courseAnalyzer.js';
import { aiLogger } from './services/logger.js';
import { cacheService } from './services/cacheService.js';

let courseAnalyzer = null;

// Initialize the course analyzer
async function initializeCourseAnalyzer() {
  if (courseAnalyzer) return courseAnalyzer;
  
  try {
    console.log('[Cora][Background] Initializing course analyzer...');
    
    // Load configuration from storage
    await loadConfig();
    
    // Create analyzer (use real APIs if configured, otherwise use stubs)
    const useRealAPIs = isConfigured();
    console.log('[Cora][Background] Using real APIs:', useRealAPIs);
    
    courseAnalyzer = new CourseAnalyzer(config, !useRealAPIs);
    
    console.log('[Cora][Background] Course analyzer initialized successfully');
    return courseAnalyzer;
  } catch (error) {
    console.error('[Cora][Background][Error] Failed to initialize course analyzer:', error);
    throw error;
  }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    console.log('First time installation');
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  // Handle legacy getData action
  if (request.action === 'getData') {
    chrome.storage.local.get(['data'], (result) => {
      sendResponse({ data: result.data || 'No data found' });
    });
    return true;
  }
  
  // Handle course analysis request
  if (request.action === 'analyzeCourse') {
    console.log('[Cora][Background] Received analyzeCourse request from tab:', sender.tab?.id);
    handleCourseAnalysis(request.courseInfo, sender.tab?.id)
      .then(result => {
        console.log('[Cora][Background] Sending success response');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('[Cora][Background][Error] Course analysis error:', error);
        sendResponse({ success: false, error: error.message, stack: error.stack });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Handle OpenAI API key save
  if (request.action === 'saveOpenAIKey') {
    console.log('[Cora][Background] Received saveOpenAIKey request');
    const apiKey = request.apiKey;
    
    if (!apiKey || apiKey.trim() === '') {
      sendResponse({ success: false, error: 'API key cannot be empty' });
      return true;
    }
    
    chrome.storage.local.set({ openaiApiKey: apiKey.trim() }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Cora][Background] Error saving API key:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[Cora][Background] OpenAI API key saved successfully');
        // Reset the analyzer so it picks up the new key
        courseAnalyzer = null;
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  // Handle OpenAI API key get
  if (request.action === 'getOpenAIKey') {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      sendResponse({ success: true, apiKey: result.openaiApiKey || '' });
    });
    return true;
  }
  
  if (request.action === 'downloadLogs') {
    aiLogger.downloadLogs()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Cora][Background] Failed to download logs:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === 'clearLogs') {
    aiLogger.clearLogs()
      .then(() => {
        console.log('[Cora][Background] Logs cleared successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Cora][Background] Failed to clear logs:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Handle cache stats request
  if (request.action === 'getCacheStats') {
    cacheService.getStats()
      .then((stats) => {
        sendResponse({ success: true, stats });
      })
      .catch((error) => {
        console.error('[Cora][Background] Failed to get cache stats:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Handle clear cache request
  if (request.action === 'clearCache') {
    cacheService.clear()
      .then(() => {
        console.log('[Cora][Background] Cache cleared successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Cora][Background] Failed to clear cache:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Handle clear expired cache request
  if (request.action === 'clearExpiredCache') {
    cacheService.clearExpired()
      .then((count) => {
        console.log('[Cora][Background] Cleared expired cache entries');
        sendResponse({ success: true, count });
      })
      .catch((error) => {
        console.error('[Cora][Background] Failed to clear expired cache:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  return false;
});

/**
 * Handle course analysis workflow
 * @param {object} courseInfo - Course information
 * @param {number} tabId - Tab ID for sending progress updates
 */
async function handleCourseAnalysis(courseInfo, tabId) {
  console.log('[Cora][Background] ' + '='.repeat(60));
  console.log('[Cora][Background] STARTING COURSE ANALYSIS');
  console.log('[Cora][Background] ' + '='.repeat(60));
  console.log('[Cora][Background] Course Info:', courseInfo);
  console.log('[Cora][Background] Tab ID:', tabId);
  
  try {
    // Check cache first
    const cacheKey = cacheService.generateKey(courseInfo);
    console.log(`[Cora][Background] Cache key: ${cacheKey}`);
    
    const cached = await cacheService.get(courseInfo);
    if (cached) {
      console.log('[Cora][Background] ⚡ Cache HIT - Returning cached result');
      
      // Send progress update
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'analysisProgress',
          progress: { message: 'Loaded from cache ⚡', step: 'cache' }
        }).catch(err => {
          console.warn('[Cora][Background] Could not send cache message:', err.message);
        });
      }
      
      return cached;
    }
    
    console.log('[Cora][Background] Cache MISS - Running fresh analysis');
    
    // Initialize analyzer if needed
    const analyzer = await initializeCourseAnalyzer();
    
    // Progress callback to send updates to content script
    const progressCallback = (progressData) => {
      console.log('[Cora][Background] Progress update:', progressData);
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'analysisProgress',
          progress: progressData
        }).catch(err => {
          console.warn('[Cora][Background] Could not send progress to tab:', err.message);
        });
      }
    };
    
    // Run the complete analysis with progress updates
    const result = await analyzer.analyzeCourse(courseInfo, progressCallback);
    
    console.log('[Cora][Background] ' + '='.repeat(60));
    console.log('[Cora][Background] COURSE ANALYSIS COMPLETED');
    console.log('[Cora][Background] ' + '='.repeat(60));
    console.log('[Cora][Background] Status:', result.status);
    console.log('[Cora][Background] Using stubs:', result.usingStubs);
    if (result.finalResult) {
      console.log('[Cora][Background] Overall Rating:', result.finalResult.overallRating);
      console.log('[Cora][Background] Difficulty Rating:', result.finalResult.difficultyRating);
    }
    
    // Store in cache
    await cacheService.set(courseInfo, result);
    console.log('[Cora][Background] Result cached for future use');
    
    // Store result in storage for later retrieval
    await storeAnalysisResult(courseInfo, result);
    
    return result;
  } catch (error) {
    console.error('[Cora][Background][Error] Error in course analysis:', error);
    console.error('[Cora][Background][Error] Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Store analysis result in chrome storage
 */
async function storeAnalysisResult(courseInfo, result) {
  const key = `analysis_${courseInfo.courseNumber}_${courseInfo.professor}`.replace(/\s+/g, '_');
  
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [key]: {
        ...result,
        savedAt: new Date().toISOString()
      }
    }, () => {
      console.log('Analysis result stored with key:', key);
      resolve();
    });
  });
}

// Example: Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
  }
});

