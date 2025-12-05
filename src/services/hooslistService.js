// HoosList API Service
// Handles API calls to the HoosList API with retry logic and backoff

class HooslistService {
  constructor() {
    this.baseUrl = 'https://hooslist.virginia.edu';
    this.maxRetries = 3;
    this.initialBackoffMs = 1000;
    this.maxBackoffMs = 10000;
    console.log('[Cora][HoosList] Initialized');
  }

  /**
   * Sleep for a specified duration
   * @private
   * @param {number} ms - Milliseconds to sleep
   */
  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   * @private
   * @param {number} attempt - Current attempt number (0-indexed)
   * @returns {number} - Delay in milliseconds
   */
  _calculateBackoff(attempt) {
    const delay = Math.min(
      this.initialBackoffMs * Math.pow(2, attempt),
      this.maxBackoffMs
    );
    // Add jitter (random 0-20%)
    const jitter = delay * 0.2 * Math.random();
    return Math.floor(delay + jitter);
  }

  /**
   * Make an API request with retry and backoff
   * @private
   * @param {string} url - Full URL to fetch
   * @param {number} attempt - Current attempt number
   * @returns {Promise<object>} - Parsed JSON response
   */
  async _fetchWithRetry(url, attempt = 0) {
    try {
      console.log(`[Cora][HoosList] Fetching: ${url} (attempt ${attempt + 1}/${this.maxRetries + 1})`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        // Check if we should retry based on status code
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP ${response.status}: Server error or rate limit`);
        } else if (response.status >= 400) {
          // Client errors shouldn't be retried
          throw new Error(`HTTP ${response.status}: Client error - ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log(`[Cora][HoosList] Successfully fetched data from ${url}`);
      return {
        success: true,
        data,
        fetchedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[Cora][HoosList][Error] Attempt ${attempt + 1} failed:`, error.message);

      // Retry logic
      if (attempt < this.maxRetries) {
        const backoffMs = this._calculateBackoff(attempt);
        console.log(`[Cora][HoosList] Retrying after ${backoffMs}ms...`);
        await this._sleep(backoffMs);
        return this._fetchWithRetry(url, attempt + 1);
      }

      // All retries exhausted
      console.error(`[Cora][HoosList][Error] All retry attempts exhausted for ${url}`);
      return {
        success: false,
        error: error.message,
        fetchedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get enrollment history for a specific class
   * @param {string} termCode - 4-digit term code (e.g., "1258" for Spring 2025)
   * @param {string} classNumber - 5-digit class number
   * @returns {Promise<object>} - Enrollment data
   */
  async getClassEnrollments(termCode, classNumber) {
    console.log(`[Cora][HoosList] Getting enrollments for class ${classNumber} in term ${termCode}`);

    // Validate inputs
    if (!termCode || termCode.length !== 4 || !/^\d{4}$/.test(termCode)) {
      console.error(`[Cora][HoosList][Error] Invalid termCode: ${termCode}`);
      return {
        success: false,
        error: 'Invalid termCode - must be 4 digits',
        data: null
      };
    }

    if (!classNumber || classNumber.length !== 5 || !/^\d{5}$/.test(classNumber)) {
      console.error(`[Cora][HoosList][Error] Invalid classNumber: ${classNumber}`);
      return {
        success: false,
        error: 'Invalid classNumber - must be 5 digits',
        data: null
      };
    }

    const url = `${this.baseUrl}/ClassSchedule/_GetLatestClassEnrollments?termCode=${termCode}&classNumber=${classNumber}`;
    const result = await this._fetchWithRetry(url);

    if (!result.success) {
      return result;
    }

    // Validate and parse the enrollment data
    try {
      const enrollments = result.data;

      if (!Array.isArray(enrollments)) {
        throw new Error('Expected array of enrollment data');
      }

      // Parse and validate each enrollment entry
      const parsedEnrollments = enrollments.map(entry => ({
        enrolled: parseInt(entry.enrolled, 10) || 0,
        waitlist: parseInt(entry.waitlist, 10) || 0,
        timestamp: entry.t,
        date: new Date(entry.t)
      }));

      console.log(`[Cora][HoosList] Successfully parsed ${parsedEnrollments.length} enrollment entries`);

      return {
        success: true,
        data: parsedEnrollments,
        rawData: enrollments,
        termCode,
        classNumber,
        fetchedAt: result.fetchedAt
      };

    } catch (error) {
      console.error(`[Cora][HoosList][Error] Failed to parse enrollment data:`, error);
      return {
        success: false,
        error: `Failed to parse enrollment data: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Search for subjects (placeholder for future use)
   * @param {string} query - Subject acronym to search for
   * @returns {Promise<object>} - Subject search results
   */
  async searchSubjects(query) {
    console.log(`[Cora][HoosList] Searching subjects for: ${query}`);
    const url = `${this.baseUrl}/Search/_SubjectSearch?s=${encodeURIComponent(query)}`;
    return this._fetchWithRetry(url);
  }
}

export { HooslistService };
