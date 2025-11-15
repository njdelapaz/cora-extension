// Google Custom Search API Service
// Handles web searches for course and professor information

class SearchService {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
    console.log('[Cora][Search] Initialized with engine ID:', searchEngineId ? searchEngineId.substring(0, 10) + '...' : 'MISSING');
  }

  /**
   * Search for course and professor information with progressive fallback strategy
   * @param {object} courseInfo - Course information object
   * @param {string} site - Specific site to search (e.g., 'thecourseforum.com')
   * @returns {Promise<Array>} - Array of search results
   */
  async searchCourse(courseInfo, site) {
    console.log(`[Cora][Search] Starting progressive search for ${site}`);
    
    // Strategy 1: Professor name as required match
    if (courseInfo.professor) {
      console.log(`[Cora][Search] Strategy 1: Required professor "${courseInfo.professor}"`);
      const results = await this._executeSearch(courseInfo, site, 'professor-required');
      if (results.length > 0) {
        console.log(`[Cora][Search] Strategy 1 succeeded with ${results.length} results`);
        return results;
      }
      console.log(`[Cora][Search] Strategy 1 returned 0 results, trying Strategy 2`);
    }
    
    // Strategy 2: Professor in query, course acronym required
    if (courseInfo.courseNumber) {
      console.log(`[Cora][Search] Strategy 2: Required course "${courseInfo.courseNumber}"`);
      const results = await this._executeSearch(courseInfo, site, 'course-required');
      if (results.length > 0) {
        console.log(`[Cora][Search] Strategy 2 succeeded with ${results.length} results`);
        return results;
      }
      console.log(`[Cora][Search] Strategy 2 returned 0 results, trying Strategy 3`);
    }
    
    // Strategy 3: Normal search with all info
    console.log(`[Cora][Search] Strategy 3: Normal search with all info`);
    const results = await this._executeSearch(courseInfo, site, 'normal');
    console.log(`[Cora][Search] Strategy 3 returned ${results.length} results`);
    return results;
  }
  
  /**
   * Execute a search with specific strategy
   * @private
   */
  async _executeSearch(courseInfo, site, strategy) {
    let query = '';
    
    if (strategy === 'professor-required') {
      // Required professor match: +"Professor Name" courseNumber courseName
      query = `+"${courseInfo.professor}"`;
      if (courseInfo.courseNumber) query += ` ${courseInfo.courseNumber}`;
      if (courseInfo.courseName) query += ` ${courseInfo.courseName}`;
    } else if (strategy === 'course-required') {
      // Required course match: +"DEPT ####" Professor Name courseName
      query = `+"${courseInfo.courseNumber}"`;
      if (courseInfo.professor) query += ` ${courseInfo.professor}`;
      if (courseInfo.courseName) query += ` ${courseInfo.courseName}`;
    } else {
      // Normal search: all terms together
      query = this._buildSearchQuery(courseInfo);
    }
    
    console.log(`[Cora][Search] Executing ${strategy} search: "${query}"`);
    
    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query.trim(),
      siteSearch: site,
      num: 5
    });

    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}?${params}`);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Cora][Search][Error] API returned ${response.status} for ${site}: ${errorText}`);
        let errorMessage = `Search API error (${response.status})`;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const results = this._parseSearchResults(data);
      console.log(`[Cora][Search] Found ${results.length} results on ${site} in ${duration}ms (${strategy})`);
      return results;
    } catch (error) {
      console.error(`[Cora][Search][Error] Failed ${strategy} search on ${site}:`, error);
      throw error;
    }
  }

  /**
   * Search multiple sources
   * @param {object} courseInfo - Course information object
   * @param {Array<string>} sites - Array of sites to search
   * @returns {Promise<object>} - Object with results per site
   */
  async searchMultipleSources(courseInfo, sites) {
    console.log(`[Cora][Search] Searching ${sites.length} sources: ${sites.join(', ')}`);
    const startTime = Date.now();
    
    const searchPromises = sites.map(site => 
      this.searchCourse(courseInfo, site)
        .then(results => ({ site, results, success: true }))
        .catch(error => {
          console.warn(`[Cora][Search][Warning] Search failed for ${site}: ${error.message}`);
          return { site, error: error.message, success: false };
        })
    );

    const results = await Promise.all(searchPromises);
    const duration = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[Cora][Search] Completed ${successCount}/${sites.length} searches in ${duration}ms`);
    
    return results.reduce((acc, result) => {
      acc[result.site] = result;
      return acc;
    }, {});
  }

  /**
   * Build search query from course information
   * @private
   */
  _buildSearchQuery(courseInfo) {
    const parts = [];
    
    // Prioritize course number and professor for more specific results
    if (courseInfo.courseNumber) {
      parts.push(courseInfo.courseNumber);
    }
    if (courseInfo.professor && courseInfo.professor !== 'N/A') {
      parts.push(courseInfo.professor);
    }
    // Add course name if no professor or if we have very little info
    if (!courseInfo.professor && courseInfo.courseName) {
      parts.push(courseInfo.courseName);
    }
    
    const query = parts.join(' ');
    console.log(`[Cora][Search] Built query: "${query}" from`, courseInfo);
    return query;
  }

  /**
   * Parse Google Custom Search results
   * @private
   */
  _parseSearchResults(data) {
    if (!data.items || data.items.length === 0) {
      console.log('[Cora][Search] No results found in response');
      return [];
    }

    const parsed = data.items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink
    }));
    
    console.log(`[Cora][Search] Parsed ${parsed.length} results`);
    return parsed;
  }
}

// Stub implementation for testing without API key
class SearchServiceStub extends SearchService {
  constructor() {
    super('stub-key', 'stub-engine-id');
  }

  async searchCourse(courseInfo, site) {
    console.log(`[STUB] Searching ${site} for:`, courseInfo);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock results
    const mockResults = [
      {
        title: `${courseInfo.courseNumber} with Professor ${courseInfo.professor} - ${site}`,
        url: `https://${site}/course/${courseInfo.courseNumber}`,
        snippet: `Student reviews and ratings for ${courseInfo.courseName} taught by ${courseInfo.professor}. Overall rating: 4.5/5. Students praise the teaching style and course organization.`,
        displayUrl: site
      },
      {
        title: `Review: ${courseInfo.professor} - ${courseInfo.courseNumber}`,
        url: `https://${site}/professor/${courseInfo.professor}`,
        snippet: `Detailed review of Professor ${courseInfo.professor}'s ${courseInfo.courseNumber} course. Great lectures, fair grading, manageable workload. Highly recommended for students interested in the subject.`,
        displayUrl: site
      }
    ];
    
    return mockResults;
  }
}

export { SearchService, SearchServiceStub };

