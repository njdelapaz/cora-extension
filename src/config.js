// Configuration Manager
// Note: In Chrome extensions, we'll need to manually set these or use chrome.storage
// For development, you can hardcode them here temporarily

const config = {
  // OpenAI Configuration
  openai: {
    // OpenAI API key is configured by users through Settings UI
    apiKey: '', // Will be loaded from chrome.storage
    model: 'gpt-4o-mini', // Updated to correct model name
    maxTokens: 1500,
    temperature: 0.7
  },
  
  // Google Custom Search Configuration (pre-configured)
  google: {
    apiKey: 'AIzaSyD8hEIrG6ISm7G1YBEuVG34Frq7I6XysVE',
    searchEngineId: '6641afaaa84b34665',
    maxResults: 5
  },
  
  // Search Sources
  sources: {
    theCourseForum: {
      name: 'theCourseForum',
      siteSearch: 'thecourseforum.com'
    },
    reddit: {
      name: 'Reddit',
      siteSearch: 'reddit.com/r/uva'
    }
  }
};

// Function to load config from chrome storage
async function loadConfig() {
  console.log('[Cora][Config] Loading configuration...');
  return new Promise((resolve) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        console.log('[Cora][Config] Found OpenAI API key in storage');
        config.openai.apiKey = result.openaiApiKey;
      } else {
        console.log('[Cora][Config] No OpenAI API key found in storage');
      }
      
      // Validate configuration
      const validation = validateConfig();
      if (!validation.valid) {
        console.warn('[Cora][Config] Configuration validation failed:', validation.errors);
      } else {
        console.log('[Cora][Config] Configuration validated successfully');
      }
      
      resolve(config);
    });
  });
}

// Function to save OpenAI API key to chrome storage
async function saveOpenAIKey(apiKey) {
  console.log('[Cora][Config] Saving OpenAI API key to storage...');
  return new Promise((resolve, reject) => {
    if (!apiKey || apiKey.trim() === '') {
      reject(new Error('API key cannot be empty'));
      return;
    }
    
    chrome.storage.local.set({ openaiApiKey: apiKey.trim() }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Cora][Config] Error saving API key:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log('[Cora][Config] OpenAI API key saved successfully');
        config.openai.apiKey = apiKey.trim();
        resolve();
      }
    });
  });
}

// Function to get the current OpenAI API key
async function getOpenAIKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      resolve(result.openaiApiKey || '');
    });
  });
}

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (!config.openai.apiKey || config.openai.apiKey.trim() === '') {
    errors.push('OpenAI API key is missing');
  }
  
  if (!config.google.apiKey || config.google.apiKey.trim() === '') {
    errors.push('Google Search API key is missing');
  }
  
  if (!config.google.searchEngineId || config.google.searchEngineId.trim() === '') {
    errors.push('Google Search Engine ID is missing');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Check if APIs are configured
function isConfigured() {
  const validation = validateConfig();
  return validation.valid;
}

export { config, loadConfig, saveOpenAIKey, getOpenAIKey, validateConfig, isConfigured };

