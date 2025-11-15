// Cache Service - Manages course analysis result caching
// Stores results in chrome.storage.local for fast retrieval

class CacheService {
  constructor() {
    this.storageKey = 'cora_course_cache';
    this.maxEntries = 50;
    this.ttlDays = 7;
    this.cleanupThreshold = 60;
    
    // Track hit/miss statistics
    this.stats = {
      hits: 0,
      misses: 0
    };
    
    console.log('[Cora][Cache] Cache service initialized');
  }

  /**
   * Generate cache key from course info
   */
  generateKey(courseInfo) {
    const course = this._normalizeCourseNumber(courseInfo.courseNumber || '');
    const prof = this._normalizeProfessor(courseInfo.professor || 'Unknown');
    return `${course}_${prof}`;
  }

  /**
   * Check if cache entry exists and is valid
   */
  async has(courseInfo) {
    const cacheKey = this.generateKey(courseInfo);
    const cache = await this._getCache();
    const entry = cache[cacheKey];
    
    if (!entry) {
      return false;
    }
    
    return !this._isExpired(entry);
  }

  /**
   * Get cached result for a course
   */
  async get(courseInfo) {
    const cacheKey = this.generateKey(courseInfo);
    console.log(`[Cora][Cache] Checking cache for: ${cacheKey}`);
    
    const cache = await this._getCache();
    const entry = cache[cacheKey];
    
    if (!entry) {
      console.log(`[Cora][Cache] MISS - No cached entry found`);
      this.stats.misses++;
      return null;
    }
    
    if (this._isExpired(entry)) {
      console.log(`[Cora][Cache] MISS - Entry expired (${this._getAge(entry)} days old)`);
      this.stats.misses++;
      // Clean up expired entry
      await this._deleteEntry(cacheKey);
      return null;
    }
    
    console.log(`[Cora][Cache] HIT - Entry found (${this._getAge(entry)} days old) ⚡`);
    this.stats.hits++;
    return entry.result;
  }

  /**
   * Store analysis result in cache
   */
  async set(courseInfo, result) {
    const cacheKey = this.generateKey(courseInfo);
    console.log(`[Cora][Cache] Storing result for: ${cacheKey}`);
    
    const cache = await this._getCache();
    const now = Date.now();
    
    cache[cacheKey] = {
      cacheKey,
      timestamp: now,
      expiresAt: now + (this.ttlDays * 24 * 60 * 60 * 1000),
      courseInfo: {
        courseNumber: courseInfo.courseNumber,
        courseName: courseInfo.courseName,
        professor: courseInfo.professor
      },
      result
    };
    
    await this._saveCache(cache);
    
    // Cleanup if needed
    const entryCount = Object.keys(cache).length;
    if (entryCount > this.cleanupThreshold) {
      console.log(`[Cora][Cache] Cleanup threshold reached (${entryCount} entries)`);
      await this.clearExpired();
      await this._enforceLimit();
    }
    
    console.log(`[Cora][Cache] Result stored successfully`);
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const cache = await this._getCache();
    const entries = Object.values(cache);
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        totalSize: 0,
        hitRate: 0
      };
    }
    
    const activeEntries = entries.filter(e => !this._isExpired(e));
    const expiredEntries = entries.length - activeEntries.length;
    
    const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
    const oldestTimestamp = timestamps[0];
    const newestTimestamp = timestamps[timestamps.length - 1];
    
    // Estimate size
    const cacheStr = JSON.stringify(cache);
    const sizeKB = (cacheStr.length / 1024).toFixed(1);
    
    // Calculate hit rate
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? Math.round((this.stats.hits / totalRequests) * 100)
      : 0;
    
    return {
      totalEntries: entries.length,
      activeEntries: activeEntries.length,
      expiredEntries,
      oldestEntry: this._formatAge(Date.now() - oldestTimestamp),
      newestEntry: this._formatAge(Date.now() - newestTimestamp),
      totalSize: `${sizeKB} KB`,
      hitRate: `${hitRate}%`,
      hits: this.stats.hits,
      misses: this.stats.misses
    };
  }

  /**
   * Clear all cached entries
   */
  async clear() {
    console.log('[Cora][Cache] Clearing all cache entries');
    await this._saveCache({});
    console.log('[Cora][Cache] Cache cleared');
  }

  /**
   * Clear only expired entries
   */
  async clearExpired() {
    console.log('[Cora][Cache] Clearing expired entries');
    const cache = await this._getCache();
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of Object.entries(cache)) {
      if (this._isExpired(entry)) {
        delete cache[key];
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      await this._saveCache(cache);
      console.log(`[Cora][Cache] Removed ${removedCount} expired entries`);
    } else {
      console.log('[Cora][Cache] No expired entries found');
    }
    
    return removedCount;
  }

  /**
   * Get raw cache object
   * @private
   */
  async _getCache() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        resolve(result[this.storageKey] || {});
      });
    });
  }

  /**
   * Save cache object
   * @private
   */
  async _saveCache(cache) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.storageKey]: cache }, resolve);
    });
  }

  /**
   * Delete specific cache entry
   * @private
   */
  async _deleteEntry(cacheKey) {
    const cache = await this._getCache();
    delete cache[cacheKey];
    await this._saveCache(cache);
  }

  /**
   * Check if cache entry is expired
   * @private
   */
  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Get age of entry in days
   * @private
   */
  _getAge(entry) {
    const ageMs = Date.now() - entry.timestamp;
    return (ageMs / (1000 * 60 * 60 * 24)).toFixed(1);
  }

  /**
   * Format age in human-readable format
   * @private
   */
  _formatAge(ageMs) {
    const minutes = Math.floor(ageMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Enforce maximum cache entry limit
   * @private
   */
  async _enforceLimit() {
    const cache = await this._getCache();
    const entries = Object.entries(cache);
    
    if (entries.length <= this.maxEntries) {
      return;
    }
    
    console.log(`[Cora][Cache] Enforcing limit: ${entries.length} > ${this.maxEntries}`);
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    const toRemove = entries.length - this.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
    
    await this._saveCache(cache);
    console.log(`[Cora][Cache] Removed ${toRemove} oldest entries`);
  }

  /**
   * Normalize course number for cache key
   * @private
   */
  _normalizeCourseNumber(courseNumber) {
    return courseNumber
      .toUpperCase()
      .replace(/\s+/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Normalize professor name for cache key
   * @private
   */
  _normalizeProfessor(name) {
    return name
      .replace(/^(Prof\.|Professor|Dr\.)\s+/i, '')  // Remove titles
      .replace(/\s+/g, '')                            // Remove spaces
      .replace(/[^A-Za-z]/g, '')                      // Remove non-letters
      .toUpperCase();
  }
}

// Create singleton instance
const cacheService = new CacheService();

export { cacheService };

