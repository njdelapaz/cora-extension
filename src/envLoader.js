// Environment Variable Loader for Chrome Extension
// Since Chrome extensions can't directly read .env files, we need a different approach

/**
 * Load environment variables from a config file
 * For development, you can manually create a .env file and parse it
 * Or use Chrome storage to store API keys
 */

class EnvLoader {
  constructor() {
    this.env = {};
  }

  /**
   * Parse .env file content
   * @param {string} content - Content of the .env file
   */
  parse(content) {
    const lines = content.split('\n');
    const env = {};

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    }

    this.env = env;
    return env;
  }

  /**
   * Get an environment variable
   * @param {string} key - Environment variable key
   * @param {string} defaultValue - Default value if not found
   */
  get(key, defaultValue = '') {
    return this.env[key] || defaultValue;
  }

  /**
   * Load from Chrome storage
   * This is the recommended approach for Chrome extensions
   */
  async loadFromChromeStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['env'], (result) => {
        if (result.env) {
          this.env = result.env;
        }
        resolve(this.env);
      });
    });
  }

  /**
   * Save to Chrome storage
   */
  async saveToChromeStorage(envVars) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ env: envVars }, () => {
        this.env = envVars;
        resolve();
      });
    });
  }

  /**
   * Load from an external .env file (for development)
   * Note: This requires the file to be fetched via HTTP or loaded manually
   */
  async loadFromFile(filePath) {
    try {
      const response = await fetch(filePath);
      const content = await response.text();
      return this.parse(content);
    } catch (error) {
      console.error('Error loading .env file:', error);
      return {};
    }
  }
}

// For Chrome extensions, the best approach is to:
// 1. Create a setup page in your popup where users can input their API keys
// 2. Store them in Chrome storage
// 3. Load them when needed

export { EnvLoader };

