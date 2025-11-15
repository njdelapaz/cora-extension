// Web Scraper Service
// Handles fetching and extracting content from web pages

class ScraperService {
  constructor() {
    this.maxContentLength = 5000; // Maximum characters to extract
    console.log('[Cora][Scraper] Initialized with max content length:', this.maxContentLength);
  }

  /**
   * Fetch and scrape content from a URL
   * @param {string} url - The URL to scrape
   * @returns {Promise<object>} - Object with url and content
   */
  async scrapeUrl(url) {
    console.log(`[Cora][Scraper] Scraping URL: ${url}`);
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const content = this._extractMainContent(html);
      const tcfRating = this._extractTheCourseForumRating(url, html);
      const duration = Date.now() - startTime;

      console.log(`[Cora][Scraper] Successfully scraped ${url} (${content.length} chars) in ${duration}ms`);
      if (tcfRating) {
        console.log(`[Cora][Scraper] Found theCourseForum rating: ${tcfRating.overall}/5.0 (difficulty: ${tcfRating.difficulty}/5.0)`);
      }

      return {
        url,
        content,
        success: true,
        scrapedAt: new Date().toISOString(),
        tcfRating: tcfRating // Include TCF rating if found
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Cora][Scraper][Error] Failed to scrape ${url} after ${duration}ms:`, error);
      return {
        url,
        content: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Scrape multiple URLs
   * @param {Array<string>} urls - Array of URLs to scrape
   * @returns {Promise<Array>} - Array of scrape results
   */
  async scrapeMultipleUrls(urls) {
    console.log(`[Cora][Scraper] Scraping ${urls.length} URLs...`);
    const startTime = Date.now();
    
    const scrapePromises = urls.map(url => this.scrapeUrl(url));
    const results = await Promise.all(scrapePromises);
    
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    console.log(`[Cora][Scraper] Completed ${successCount}/${urls.length} scrapes in ${duration}ms`);
    
    return results;
  }

  /**
   * Scrape search results
   * @param {Array<object>} searchResults - Array of search result objects with url property
   * @returns {Promise<Array>} - Array of scraped content
   */
  async scrapeSearchResults(searchResults) {
    const urls = searchResults.map(result => result.url);
    console.log(`[Cora][Scraper] Scraping search results from ${urls.length} URLs`);
    return this.scrapeMultipleUrls(urls);
  }

  /**
   * Extract main content from HTML
   * @private
   */
  _extractMainContent(html) {
    console.log(`[Cora][Scraper] Extracting content from ${html.length} char HTML`);
    
    // Remove script and style tags
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    content = this._decodeHtmlEntities(content);
    
    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit length
    const originalLength = content.length;
    if (content.length > this.maxContentLength) {
      content = content.substring(0, this.maxContentLength) + '...';
      console.log(`[Cora][Scraper] Truncated content from ${originalLength} to ${this.maxContentLength} chars`);
    }
    
    console.log(`[Cora][Scraper] Extracted ${content.length} chars of text content`);
    return content;
  }

  /**
   * Extract theCourseForum rating if URL is from TCF
   * @private
   */
  _extractTheCourseForumRating(url, html) {
    // Check if URL is from theCourseForum
    if (!url.includes('thecourseforum.com')) {
      return null;
    }
    
    console.log(`[Cora][Scraper] Attempting to extract theCourseForum rating from: ${url}`);
    
    try {
      // Look for rating patterns in the HTML
      // TCF typically shows ratings like "4.5 / 5" or "Rating: 4.5"
      
      // Try to find overall rating
      const overallPatterns = [
        /Overall\s*Rating[:\s]+(\d+(?:\.\d+)?)\s*\/\s*5/i,
        /Rating[:\s]+(\d+(?:\.\d+)?)\s*\/\s*5/i,
        /<span[^>]*class="[^"]*rating[^"]*"[^>]*>(\d+(?:\.\d+)?)<\/span>/i,
        /Overall[:\s]+(\d+(?:\.\d+)?)/i
      ];
      
      let overallRating = null;
      for (const pattern of overallPatterns) {
        const match = html.match(pattern);
        if (match) {
          overallRating = parseFloat(match[1]);
          console.log(`[Cora][Scraper] Found overall rating: ${overallRating}`);
          break;
        }
      }
      
      // Try to find difficulty rating
      const difficultyPatterns = [
        /Difficulty[:\s]+(\d+(?:\.\d+)?)\s*\/\s*5/i,
        /Difficulty\s*Rating[:\s]+(\d+(?:\.\d+)?)/i,
        /<span[^>]*class="[^"]*difficulty[^"]*"[^>]*>(\d+(?:\.\d+)?)<\/span>/i
      ];
      
      let difficultyRating = null;
      for (const pattern of difficultyPatterns) {
        const match = html.match(pattern);
        if (match) {
          difficultyRating = parseFloat(match[1]);
          console.log(`[Cora][Scraper] Found difficulty rating: ${difficultyRating}`);
          break;
        }
      }
      
      // Only return if we found at least the overall rating
      if (overallRating !== null) {
        return {
          overall: overallRating,
          difficulty: difficultyRating,
          source: 'theCourseForum',
          sourceUrl: url
        };
      }
      
      console.log(`[Cora][Scraper] No TCF ratings found in HTML`);
      return null;
    } catch (error) {
      console.error(`[Cora][Scraper][Error] Failed to extract TCF rating:`, error);
      return null;
    }
  }

  /**
   * Decode HTML entities
   * @private
   */
  _decodeHtmlEntities(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };
    
    return text.replace(/&[#\w]+;/g, entity => entities[entity] || entity);
  }
}

// Stub implementation for testing
class ScraperServiceStub extends ScraperService {
  async scrapeUrl(url) {
    console.log(`[STUB] Scraping URL: ${url}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return mock content
    const mockContent = `
      Student Reviews for Course - ${url}
      
      Overall Rating: 4.5/5 Stars
      
      Student Review 1:
      Professor is amazing! Very clear explanations and always willing to help during office hours. 
      The course material is challenging but fair. Assignments are reasonable and help reinforce the concepts.
      Would definitely recommend this course to anyone interested in the subject.
      
      Student Review 2:
      Great course overall. The professor is knowledgeable and passionate about the material. 
      Lectures are engaging and well-organized. The workload is manageable if you keep up with the readings.
      Exams are fair and reflect what's covered in class. Office hours are very helpful.
      
      Student Review 3:
      One of my favorite courses this semester. The professor makes difficult concepts easy to understand.
      The pace is good and there's plenty of practice material. Grading is fair and transparent.
      Some of the weekly assignments can be time-consuming but they're worth it for the learning.
      
      Pros: Engaging lectures, helpful professor, fair grading, good course structure
      Cons: Can be fast-paced at times, prerequisites are important
    `;
    
    return {
      url,
      content: mockContent.trim(),
      success: true,
      scrapedAt: new Date().toISOString()
    };
  }
}

export { ScraperService, ScraperServiceStub };

