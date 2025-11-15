// Course Analyzer - Main orchestrator for course analysis
// Coordinates search, scraping, and AI analysis

import { SearchService, SearchServiceStub } from './searchService.js';
import { ScraperService, ScraperServiceStub } from './scraperService.js';
import { OpenAIService, OpenAIServiceStub } from './openaiService.js';

class CourseAnalyzer {
  constructor(config, useStubs = false) {
    this.config = config;
    console.log('[Cora][Analyzer] Initializing CourseAnalyzer, useStubs:', useStubs);
    
    // Check if API keys are available
    const hasOpenAI = config.openai.apiKey && config.openai.apiKey.trim() !== '';
    const hasGoogle = config.google.apiKey && config.google.apiKey.trim() !== '' && 
                      config.google.searchEngineId && config.google.searchEngineId.trim() !== '';
    
    console.log('[Cora][Analyzer] API keys available - OpenAI:', hasOpenAI, 'Google:', hasGoogle);
    
    // Use stubs if requested OR if API keys are missing
    if (useStubs || !hasGoogle || !hasOpenAI) {
      console.log('[Cora][Analyzer] Using stub implementations for services');
      this.searchService = new SearchServiceStub();
      this.scraperService = new ScraperServiceStub();
      this.openaiService = new OpenAIServiceStub();
      this.usingStubs = true;
    } else {
      console.log('[Cora][Analyzer] Using real API services');
      this.searchService = new SearchService(config.google.apiKey, config.google.searchEngineId);
      this.scraperService = new ScraperService();
      this.openaiService = new OpenAIService(config.openai.apiKey, config.openai.model);
      this.usingStubs = false;
    }
  }

  /**
   * Main method to analyze a course
   * @param {object} courseInfo - Course information
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<object>} - Complete analysis result
   */
  async analyzeCourse(courseInfo, progressCallback = null) {
    console.log('[Cora][Analyzer] Starting course analysis for:', courseInfo);
    const overallStartTime = Date.now();
    
    const result = {
      courseInfo,
      startTime: new Date().toISOString(),
      status: 'processing',
      steps: {},
      usingStubs: this.usingStubs
    };

    const updateProgress = (message, data = {}) => {
      console.log(`[Cora][Analyzer] Progress: ${message}`, data);
      if (progressCallback) {
        progressCallback({ message, ...data });
      }
    };

    try {
      // Step 1: Search for course on both sources
      updateProgress('Searching web sources...', { step: 1, total: 4 });
      result.steps.search = await this._searchSources(courseInfo);
      updateProgress('Search completed', { step: 1, total: 4, completed: true });
      
      // Step 2: Scrape the search results
      const totalResults = Object.values(result.steps.search)
        .filter(s => s.success)
        .reduce((sum, s) => sum + (s.results?.length || 0), 0);
      updateProgress(`Found ${totalResults} results, scraping content...`, { step: 2, total: 4 });
      result.steps.scraping = await this._scrapeResults(result.steps.search);
      updateProgress('Scraping completed', { step: 2, total: 4, completed: true });
      
      // Step 3: Generate AI summaries for each page
      const scrapedCount = result.steps.scraping.filter(s => s.success).length;
      updateProgress(`Analyzing ${scrapedCount} pages...`, { step: 3, total: 4 });
      result.steps.summaries = await this._generateSummaries(result.steps.scraping, courseInfo);
      updateProgress('Analysis completed', { step: 3, total: 4, completed: true });
      
      // Step 4: Generate final rating from all summaries
      updateProgress('Generating ratings...', { step: 4, total: 4 });
      result.steps.finalRating = await this._generateFinalRating(
        result.steps.summaries, 
        courseInfo, 
        result.steps.scraping // Pass scraped results to check for TCF ratings
      );
      updateProgress('Complete!', { step: 4, total: 4, completed: true });
      
      result.status = 'completed';
      result.endTime = new Date().toISOString();
      result.finalResult = result.steps.finalRating;
      
      const totalDuration = Date.now() - overallStartTime;
      console.log(`[Cora][Analyzer] Course analysis completed successfully in ${totalDuration}ms`);
      return result;
      
    } catch (error) {
      console.error('[Cora][Analyzer][Error] Error during course analysis:', error);
      updateProgress(`Error: ${error.message}`, { error: true });
      result.status = 'error';
      result.error = error.message;
      result.errorStack = error.stack;
      result.endTime = new Date().toISOString();
      return result;
    }
  }

  /**
   * Search for course on multiple sources
   * @private
   */
  async _searchSources(courseInfo) {
    console.log('[Cora][Analyzer] Step 1: Searching sources...');
    const startTime = Date.now();
    
    const sources = [
      this.config.sources.theCourseForum.siteSearch,
      this.config.sources.reddit.siteSearch
    ];
    
    const searchResults = await this.searchService.searchMultipleSources(courseInfo, sources);
    
    const duration = Date.now() - startTime;
    const successCount = Object.values(searchResults).filter(s => s.success).length;
    console.log(`[Cora][Analyzer] Search completed: ${successCount}/${sources.length} sources in ${duration}ms`);
    return searchResults;
  }

  /**
   * Scrape content from search results
   * @private
   */
  async _scrapeResults(searchResults) {
    console.log('[Cora][Analyzer] Step 2: Scraping content...');
    const startTime = Date.now();
    
    const scrapingTasks = [];
    
    for (const [site, siteResults] of Object.entries(searchResults)) {
      if (siteResults.success && siteResults.results) {
        for (const result of siteResults.results) {
          scrapingTasks.push({
            site,
            url: result.url,
            title: result.title,
            snippet: result.snippet
          });
        }
      }
    }
    
    console.log(`[Cora][Analyzer] Scraping ${scrapingTasks.length} URLs...`);
    
    const scrapedContent = await Promise.all(
      scrapingTasks.map(async (task) => {
        const content = await this.scraperService.scrapeUrl(task.url);
        return {
          ...task,
          ...content
        };
      })
    );
    
    const duration = Date.now() - startTime;
    const successful = scrapedContent.filter(c => c.success).length;
    console.log(`[Cora][Analyzer] Scraping completed: ${successful}/${scrapingTasks.length} successful in ${duration}ms`);
    
    return scrapedContent;
  }

  /**
   * Generate AI summaries for each scraped page
   * @private
   */
  async _generateSummaries(scrapedContent, courseInfo) {
    console.log('[Cora][Analyzer] Step 3: Filtering and summarizing content...');
    const startTime = Date.now();
    
    const validContent = scrapedContent.filter(c => c.success && c.content);
    
    console.log(`[Cora][Analyzer] Processing ${validContent.length} pages...`);
    
    const summaries = await Promise.all(
      validContent.map(async (content) => {
        try {
          // Step 3a: Filter content to extract only relevant information
          console.log(`[Cora][Analyzer] Filtering relevant content from ${content.url}`);
          const filteredContent = await this.openaiService.filterRelevantContent(
            content.content,
            courseInfo
          );
          
          // Skip summarization if no relevant content found
          if (!filteredContent || filteredContent.trim() === '') {
            console.log(`[Cora][Analyzer] No relevant content found in ${content.url}, skipping`);
            return {
              source: content.site,
              url: content.url,
              title: content.title,
              error: 'No relevant content found',
              success: false
            };
          }
          
          // Step 3b: Generate summary from filtered content
          console.log(`[Cora][Analyzer] Generating summary for ${content.url}`);
          const summary = await this.openaiService.generatePageSummary(
            filteredContent,
            courseInfo,
            content.url
          );
          
          return {
            source: content.site,
            url: content.url,
            title: content.title,
            summary,
            success: true
          };
        } catch (error) {
          console.error(`[Cora][Analyzer][Error] Failed to process ${content.url}:`, error);
          return {
            source: content.site,
            url: content.url,
            title: content.title,
            error: error.message,
            success: false
          };
        }
      })
    );
    
    const duration = Date.now() - startTime;
    const successful = summaries.filter(s => s.success).length;
    console.log(`[Cora][Analyzer] Content processed: ${successful}/${validContent.length} successful in ${duration}ms`);
    
    return summaries;
  }

  /**
   * Generate final rating from all summaries
   * @private
   */
  async _generateFinalRating(summaries, courseInfo, scrapedResults) {
    console.log('[Cora][Analyzer] Step 4: Generating final rating...');
    const startTime = Date.now();
    
    // Check if any scraped results have TCF ratings
    let tcfRating = null;
    if (scrapedResults && scrapedResults.length > 0) {
      for (const result of scrapedResults) {
        if (result.success && result.tcfRating) {
          console.log(`[Cora][Analyzer] Found theCourseForum rating from: ${result.url}`);
          tcfRating = result.tcfRating;
          break; // Use first TCF rating found
        }
      }
    }
    
    const validSummaries = summaries.filter(s => s.success);
    
    if (validSummaries.length === 0 && !tcfRating) {
      console.error('[Cora][Analyzer][Error] No valid summaries or TCF rating available');
      throw new Error('No valid summaries or TCF rating available for final rating');
    }
    
    let finalRating;
    
    // Use TCF rating if available (priority)
    if (tcfRating) {
      console.log(`[Cora][Analyzer] Using theCourseForum rating: Overall=${tcfRating.overall}, Difficulty=${tcfRating.difficulty}`);
      
      // Still generate AI summaries even when using TCF ratings
      const aiSummaries = await this.openaiService.generateFinalRating(
        validSummaries,
        courseInfo
      );
      
      finalRating = {
        overallRating: tcfRating.overall,
        difficultyRating: tcfRating.difficulty || null,
        courseSummary: aiSummaries.courseSummary,
        professorSummary: aiSummaries.professorSummary,
        ratingSource: 'TCF', // Indicate source
        ratingSourceUrl: tcfRating.sourceUrl,
        ratingSourceName: 'theCourseForum'
      };
    } else {
      // Generate AI rating with rigorous rubric
      console.log(`[Cora][Analyzer] Generating AI rating from ${validSummaries.length} summaries`);
      
      finalRating = await this.openaiService.generateFinalRating(
        validSummaries,
        courseInfo,
        true // Use rigorous rubric
      );
      
      finalRating.ratingSource = 'AI';
      finalRating.ratingSourceName = 'CoRA Rubric';
    }
    
    // Add source links to the final result
    finalRating.sources = summaries.map(s => ({
      title: s.title,
      url: s.url,
      source: s.source
    }));
    
    const duration = Date.now() - startTime;
    console.log(`[Cora][Analyzer] Final rating generated in ${duration}ms (source: ${finalRating.ratingSource})`);
    return finalRating;
  }

  /**
   * Get a quick status update on analysis progress
   * @param {object} result - Partial result object
   * @returns {string} - Status message
   */
  static getStatusMessage(result) {
    if (!result) return 'Not started';
    
    if (result.status === 'completed') {
      return 'Analysis complete!';
    } else if (result.status === 'error') {
      return `Error: ${result.error}`;
    }
    
    // Determine current step
    if (!result.steps.search) return 'Searching web sources...';
    if (!result.steps.scraping) return 'Scraping web pages...';
    if (!result.steps.summaries) return 'Generating AI summaries...';
    if (!result.steps.finalRating) return 'Generating final rating...';
    
    return 'Processing...';
  }
}

export { CourseAnalyzer };

