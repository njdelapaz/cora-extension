// AI Request Logger
// Logs all AI API requests and responses to chrome.storage.local
// and provides functionality to download logs as a file

class AILogger {
  constructor() {
    this.storageKey = 'cora_ai_logs';
    this.maxLogEntries = 100; // Keep last 100 requests
    console.log('[Cora][Logger] AI Logger initialized');
  }

  /**
   * Log an AI API request
   */
  async logRequest(requestData) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      ...requestData
    };

    console.log(`[Cora][Logger] Logging AI Request #${logEntry.id}`);
    console.log(`[Cora][Logger] Request Type: ${requestData.requestType}`);
    console.log(`[Cora][Logger] Model: ${requestData.model}`);
    console.log(`[Cora][Logger] System Prompt (${requestData.systemPrompt.length} chars):`, requestData.systemPrompt);
    console.log(`[Cora][Logger] User Prompt (${requestData.userPrompt.length} chars):`, requestData.userPrompt);

    await this._appendLog(logEntry);
  }

  /**
   * Log an AI API response
   */
  async logResponse(requestId, responseData) {
    const logEntry = {
      id: Date.now(),
      requestId: requestId,
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      ...responseData
    };

    console.log(`[Cora][Logger] Logging AI Response for Request #${requestId}`);
    console.log(`[Cora][Logger] Response Length: ${responseData.content.length} chars`);
    console.log(`[Cora][Logger] Duration: ${responseData.duration}ms`);
    console.log(`[Cora][Logger] Usage:`, responseData.usage);
    console.log(`[Cora][Logger] Content:`, responseData.content);

    await this._appendLog(logEntry);
  }

  /**
   * Log an error
   */
  async logError(requestId, error) {
    const logEntry = {
      id: Date.now(),
      requestId: requestId,
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      error: error.message,
      stack: error.stack
    };

    console.error(`[Cora][Logger] Logging AI Error for Request #${requestId}:`, error);

    await this._appendLog(logEntry);
  }

  /**
   * Append a log entry to storage
   * @private
   */
  async _appendLog(logEntry) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        let logs = result[this.storageKey] || [];
        
        // Add new log entry
        logs.push(logEntry);
        
        // Keep only the last maxLogEntries
        if (logs.length > this.maxLogEntries) {
          logs = logs.slice(-this.maxLogEntries);
        }
        
        chrome.storage.local.set({ [this.storageKey]: logs }, () => {
          console.log(`[Cora][Logger] Log entry saved (total: ${logs.length})`);
          resolve();
        });
      });
    });
  }

  /**
   * Get all logs
   */
  async getLogs() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        resolve(result[this.storageKey] || []);
      });
    });
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.storageKey], () => {
        console.log('[Cora][Logger] All logs cleared');
        resolve();
      });
    });
  }

  /**
   * Format logs as readable text
   */
  async getFormattedLogs() {
    const logs = await this.getLogs();
    let formatted = `CORA EXTENSION - AI API LOGS\n`;
    formatted += `Generated: ${new Date().toISOString()}\n`;
    formatted += `Total Entries: ${logs.length}\n`;
    formatted += `${'='.repeat(80)}\n\n`;

    logs.forEach((log, index) => {
      formatted += `Entry #${index + 1}\n`;
      formatted += `Timestamp: ${log.timestamp}\n`;
      formatted += `Type: ${log.type}\n`;

      if (log.type === 'REQUEST') {
        formatted += `Request ID: ${log.id}\n`;
        formatted += `Request Type: ${log.requestType}\n`;
        formatted += `Model: ${log.model}\n`;
        formatted += `Max Output Tokens: ${log.maxTokens}\n`;
        formatted += `Reasoning Effort: ${log.reasoningEffort || 'N/A'}\n`;
        formatted += `\nSYSTEM PROMPT:\n${'-'.repeat(40)}\n${log.systemPrompt}\n`;
        formatted += `\nUSER PROMPT:\n${'-'.repeat(40)}\n${log.userPrompt}\n`;
      } else if (log.type === 'RESPONSE') {
        formatted += `Request ID: ${log.requestId}\n`;
        formatted += `Duration: ${log.duration}ms\n`;
        formatted += `Usage: ${JSON.stringify(log.usage)}\n`;
        formatted += `\nRESPONSE CONTENT:\n${'-'.repeat(40)}\n${log.content}\n`;
      } else if (log.type === 'ERROR') {
        formatted += `Request ID: ${log.requestId}\n`;
        formatted += `Error: ${log.error}\n`;
        formatted += `Stack: ${log.stack}\n`;
      }

      formatted += `${'='.repeat(80)}\n\n`;
    });

    return formatted;
  }

  /**
   * Download logs as a text file
   * Works in service worker context by using data URL
   */
  async downloadLogs() {
    const formattedLogs = await this.getFormattedLogs();
    
    // Convert text to base64 data URL (works in service workers)
    const base64Data = btoa(unescape(encodeURIComponent(formattedLogs)));
    const dataUrl = `data:text/plain;base64,${base64Data}`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cora-ai-logs-${timestamp}.txt`;

    // Download using chrome.downloads API (works in background script)
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[Cora][Logger] Download failed:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log(`[Cora][Logger] Logs download initiated as ${filename} (ID: ${downloadId})`);
          resolve();
        }
      });
    });
  }
}

// Create singleton instance
const aiLogger = new AILogger();

export { aiLogger };

