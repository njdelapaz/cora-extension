// OpenAI API Service
// Handles all interactions with OpenAI API

import { aiLogger } from './logger.js';

class OpenAIService {
  constructor(apiKey, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.openai.com/v1';
    console.log(`[Cora][OpenAI] Initialized with model: ${model}`);
  }

  /**
   * Filter scraped content to extract only relevant information
   * @param {string} content - The raw scraped content
   * @param {object} courseInfo - Information about the course
   * @returns {Promise<string>} - Filtered relevant content
   */
  async filterRelevantContent(content, courseInfo) {
    console.log(`[Cora][OpenAI] Filtering relevant content for ${courseInfo.courseNumber || courseInfo.courseName}`);
    
    const systemPrompt = `You are a content extraction assistant. Your ONLY job is to copy relevant text verbatim from the input. Do NOT summarize, paraphrase, or add any commentary. If no relevant information exists, output exactly: "NO RELEVANT INFORMATION"`;
    
    const userPrompt = `CRITICAL: You MUST focus ONLY on the EXACT course and professor specified below. Ignore all other courses and professors.

TARGET COURSE: ${courseInfo.courseNumber || ''} ${courseInfo.courseName || ''}
TARGET PROFESSOR: ${courseInfo.professor || 'N/A'}

Source content:
${content}

Instructions:
1. Copy ONLY sentences/paragraphs that mention THIS SPECIFIC course (${courseInfo.courseNumber || 'the course'}) OR THIS SPECIFIC professor (${courseInfo.professor || 'N/A'})
2. REJECT any content about different courses or different professors
3. Output the text VERBATIM (word-for-word, no changes)
4. If no relevant information about THIS specific course/professor exists, output exactly: "NO RELEVANT INFORMATION"
5. Do NOT add your own words, summaries, or explanations`;

    try {
      const response = await this._makeAPICall(systemPrompt, userPrompt, 150, 'gpt-5-mini', 'CONTENT_FILTERING');
      
      if (response.trim() === 'NO RELEVANT INFORMATION') {
        console.log(`[Cora][OpenAI] No relevant content found`);
        return '';
      }
      
      console.log(`[Cora][OpenAI] Filtered content: ${response.length} chars`);
      return response;
    } catch (error) {
      console.error('[Cora][OpenAI][Error] Failed to filter content:', error);
      // On error, return original content
      return content;
    }
  }
  
  /**
   * Generate a summary from filtered page content
   * @param {string} content - The filtered content to summarize
   * @param {object} courseInfo - Information about the course
   * @returns {Promise<string>} - The generated summary
   */
  async generatePageSummary(content, courseInfo, sourceUrl) {
    console.log(`[Cora][OpenAI] Generating page summary for ${courseInfo.courseNumber || courseInfo.courseName}`);
    
    const systemPrompt = `You are a course review summarizer. Write concise, conversational summaries with NO buzzwords or corporate speak. Use HTML: <strong> for emphasis on key adjectives only. Count your words carefully. ALWAYS focus on the EXACT course and professor specified.`;
    
    const userPrompt = `CRITICAL: This feedback is SPECIFICALLY about the following course and professor. Do NOT mix in information about other courses or professors.

TARGET COURSE: ${courseInfo.courseNumber || ''}
TARGET PROFESSOR: ${courseInfo.professor || 'N/A'}

Feedback content:
${content}

Output EXACTLY this format:
SUMMARY: [Write exactly 80 words in one paragraph about THIS SPECIFIC COURSE (${courseInfo.courseNumber || 'the course'}) with THIS SPECIFIC PROFESSOR (${courseInfo.professor || 'N/A'}). Cover: overall sentiment, teaching style, workload, grading, key strengths and concerns. Be direct and conversational.]
QUOTE: "[Copy one exact quote from the source that DIRECTLY mentions either ${courseInfo.courseNumber || 'the course'} OR ${courseInfo.professor || 'the professor'} by name. If no such quote exists, output: NO RELEVANT QUOTE]"

Requirements:
- SUMMARY must be exactly 80 words (count carefully!)
- Focus ONLY on ${courseInfo.courseNumber || 'the course'} with ${courseInfo.professor || 'N/A'}
- Be conversational and direct
- NO corporate buzzwords
- QUOTE must be verbatim from source AND must explicitly mention the course code or professor name
- If no quote directly mentions the course/professor, use: NO RELEVANT QUOTE`;

    try {
      const response = await this._makeAPICall(systemPrompt, userPrompt, 300, 'gpt-5-mini', 'PAGE_SUMMARIZATION');
      // Append source URL for later reference
      return response + `\nSOURCE_URL: ${sourceUrl}`;
    } catch (error) {
      console.error('[Cora][OpenAI][Error] Failed to generate page summary:', error);
      throw error;
    }
  }

  /**
   * Generate final rating from multiple summaries
   * @param {Array<object>} summaries - Array of {source, summary} objects
   * @param {object} courseInfo - Information about the course
   * @param {boolean} useRigorousRubric - Whether to use rigorous scoring rubric
   * @returns {Promise<object>} - Final rating and analysis
   */
  async generateFinalRating(summaries, courseInfo, useRigorousRubric = false) {
    console.log(`[Cora][OpenAI] Generating final rating from ${summaries.length} summaries (rigorous: ${useRigorousRubric})`);
    
    const summariesText = summaries
      .map((s, i) => `Source ${i + 1} (${s.source}):\n${s.summary}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a course evaluator writing final summaries. Be concise, direct, and conversational. NO buzzwords. Each summary MUST be exactly 80 words. Format using HTML: use <strong> ONLY for 2-3 key descriptive adjectives. NEVER bold names or codes. Use <a href="URL">text</a> for quotes. Count your words carefully. ALWAYS focus on the EXACT course and professor specified at the beginning.`;
    
    // Add rigorous rubric guidance if requested
    const ratingGuidance = useRigorousRubric ? `

RIGOROUS RATING RUBRIC (Apply carefully):

OVERALL RATING (1-5):
- 5.0: Exceptional - Overwhelmingly positive, transformative learning, highly recommended
- 4.0-4.9: Very Good - Mostly positive, some minor concerns, recommended 
- 3.0-3.9: Good - Mixed reviews, balanced pros/cons, depends on student
- 2.0-2.9: Fair - More concerns than positives, proceed with caution
- 1.0-1.9: Poor - Predominantly negative, major issues, not recommended

DIFFICULTY RATING (1-5):
- 5.0: Very Difficult - Extremely heavy workload, complex material, high failure risk
- 4.0-4.9: Difficult - Significant time investment, challenging concepts
- 3.0-3.9: Moderate - Manageable with effort, balanced difficulty
- 2.0-2.9: Easy - Light workload, straightforward material
- 1.0-1.9: Very Easy - Minimal effort required

Consider: Number of sources, sentiment consistency, specific complaints/praise, workload mentions, grading fairness, teaching quality` : '';
    
    const userPrompt = `CRITICAL - DEFINITIVE COURSE AND PROFESSOR (your analysis MUST focus on these exact values):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET COURSE: ${courseInfo.courseNumber || ''}
TARGET PROFESSOR: ${courseInfo.professor || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The summaries below may mention various courses or professors. You MUST filter and focus ONLY on feedback about the TARGET course and TARGET professor specified above. Ignore any information about other courses or professors.

Aggregated feedback from multiple sources:
${summariesText}

Output EXACTLY this format:

OVERALL RATING: [single number 1-5 with decimal for ${courseInfo.courseNumber || 'the course'} with ${courseInfo.professor || 'N/A'}, e.g., 4.2]

DIFFICULTY RATING: [single number 1-5 with decimal for ${courseInfo.courseNumber || 'the course'}, where 1=very easy, 5=very difficult]

COURSE CONTENT SUMMARY:
[Write exactly 80 words in one paragraph (count carefully!) about ${courseInfo.courseNumber || 'the course'}. Cover what THIS SPECIFIC COURSE teaches, structure, learning experience. Use "${courseInfo.courseNumber || 'the course'}" (short code only, NOT full title). Use <strong> ONLY for 2-3 key adjectives (e.g., <strong>challenging</strong>). DO NOT bold course code or professor name. ONLY include a quote as: <a href="URL">quoted text</a> IF the quote DIRECTLY mentions ${courseInfo.courseNumber || 'the course'} by name. Otherwise omit quotes entirely.]

PROFESSOR SUMMARY:
[Write exactly 80 words in one paragraph (count carefully!) about ${courseInfo.professor || 'the professor'}. Cover THIS SPECIFIC PROFESSOR's teaching style, grading fairness, student interaction. Refer to ${courseInfo.professor || 'professor'} by name (NO bold). Use <strong> ONLY for 2-3 key adjectives about teaching (e.g., <strong>engaging</strong>, <strong>demanding</strong>). ONLY include a quote as: <a href="URL">quoted text</a> IF the quote DIRECTLY mentions ${courseInfo.professor || 'the professor'} by name. Otherwise omit quotes entirely.]

Requirements:
- Each summary MUST be exactly 80 words
- ONLY analyze feedback about ${courseInfo.courseNumber || 'the specified course'} with ${courseInfo.professor || 'the specified professor'}
- Be conversational and direct
- Bold ONLY descriptive adjectives (2-3 max per summary)
- NEVER bold: course codes, professor names, or full phrases
- Use short course code (e.g., "CS 2130" not "CS 2130 (Computer Systems)")
- Quotes are OPTIONAL: only include if they DIRECTLY mention the course code or professor name
- If no relevant quotes exist, write the summary WITHOUT any quotes${ratingGuidance}`;

    try {
      const response = await this._makeAPICall(systemPrompt, userPrompt, 500, 'gpt-5-mini', 'FINAL_RATING');
      return this._parseRatingResponse(response);
    } catch (error) {
      console.error('[Cora][OpenAI][Error] Failed to generate final rating:', error);
      throw error;
    }
  }

  /**
   * Make API call to OpenAI with system and user prompts
   * @private
   */
  async _makeAPICall(systemPrompt, userPrompt, maxTokens = 1500, model = null, requestType = 'UNKNOWN') {
    const requestId = Date.now();
    const modelToUse = model || this.model;
    
    // Determine reasoning effort based on request type (GPT-5 Responses API)
    // All phases use gpt-5-mini with different reasoning levels
    let reasoningEffort = 'minimal'; // Default for summarization
    if (requestType === 'CONTENT_FILTERING') {
      reasoningEffort = 'low'; // Filtering needs more careful analysis
    } else if (requestType === 'FINAL_RATING') {
      reasoningEffort = 'low'; // Final rating needs reasoning for quality
    }
    
    console.log(`[Cora][OpenAI][Request #${requestId}] Making API call`);
    console.log(`[Cora][OpenAI][Request #${requestId}] Model: ${modelToUse}`);
    console.log(`[Cora][OpenAI][Request #${requestId}] Request type: ${requestType}`);
    console.log(`[Cora][OpenAI][Request #${requestId}] Reasoning effort: ${reasoningEffort}`);
    console.log(`[Cora][OpenAI][Request #${requestId}] Max output tokens: ${maxTokens}`);
    console.log(`[Cora][OpenAI][Request #${requestId}] System prompt (${systemPrompt.length} chars):`, systemPrompt);
    console.log(`[Cora][OpenAI][Request #${requestId}] User prompt (${userPrompt.length} chars):`, userPrompt);
    
    // Log request to file
    await aiLogger.logRequest({
      requestId,
      requestType,
      model: modelToUse,
      maxTokens,
      reasoningEffort,
      systemPrompt,
      userPrompt
    });
    
    // GPT-5 Responses API format
    const input = [
      {
        role: 'developer',
        content: [
          {
            type: 'input_text',
            text: systemPrompt
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: userPrompt
          }
        ]
      }
    ];
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          input: input,
          text: {
            format: {
              type: 'text'
            },
            verbosity: 'medium'
          },
          reasoning: {
            effort: reasoningEffort
          },
          tools: [],
          store: true,
          include: [
            'reasoning.encrypted_content',
            'web_search_call.action.sources'
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Cora][OpenAI][Request #${requestId}][Error] API returned ${response.status}: ${errorText}`);
        let errorMessage = `OpenAI API error (${response.status})`;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        const apiError = new Error(errorMessage);
        
        // Log error to file
        await aiLogger.logError(requestId, apiError);
        
        throw apiError;
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log(`[Cora][OpenAI][Request #${requestId}][Response] Raw response structure:`, JSON.stringify(data, null, 2));
      
      // Extract content from GPT-5 Responses API format
      let responseContent = '';
      
      try {
        if (data.output && data.output.length > 0) {
          // Find the assistant message in the output
          const assistantMessage = data.output.find(msg => msg.role === 'assistant');
          if (assistantMessage && assistantMessage.content && assistantMessage.content.length > 0) {
            // Get the text from the first content item
            const textContent = assistantMessage.content.find(c => c.type === 'output_text');
            if (textContent && textContent.text) {
              responseContent = textContent.text;
            } else {
              console.error(`[Cora][OpenAI][Request #${requestId}][Error] No output_text found in content:`, assistantMessage.content);
            }
          } else {
            console.error(`[Cora][OpenAI][Request #${requestId}][Error] No assistant message with content found in output`);
          }
        } else {
          console.error(`[Cora][OpenAI][Request #${requestId}][Error] No output array in response`);
        }
        
        if (!responseContent) {
          console.error(`[Cora][OpenAI][Request #${requestId}][Error] Failed to extract content from response. Full response:`, data);
          throw new Error('Failed to extract content from API response. Response structure may be incorrect.');
        }
      } catch (parseError) {
        console.error(`[Cora][OpenAI][Request #${requestId}][Error] Error parsing response:`, parseError);
        console.error(`[Cora][OpenAI][Request #${requestId}][Error] Full response data:`, data);
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }
      
      console.log(`[Cora][OpenAI][Request #${requestId}][Response] Success in ${duration}ms`);
      console.log(`[Cora][OpenAI][Request #${requestId}][Response] Content (${responseContent.length} chars):`, responseContent);
      console.log(`[Cora][OpenAI][Request #${requestId}][Response] Usage:`, data.usage);
      
      // Log response to file
      await aiLogger.logResponse(requestId, {
        duration,
        content: responseContent,
        usage: data.usage || {}
      });
      
      return responseContent;
    } catch (error) {
      if (!error.message.includes('API error')) {
        console.error(`[Cora][OpenAI][Request #${requestId}][Error] Network or parsing error:`, error);
        const networkError = new Error(`OpenAI API call failed: ${error.message}`);
        
        // Log error to file
        await aiLogger.logError(requestId, networkError);
        
        throw networkError;
      }
      throw error;
    }
  }

  /**
   * Parse the rating response into structured data
   * @private
   */
  _parseRatingResponse(response) {
    console.log('[Cora][OpenAI] Parsing rating response...');
    
    // Extract ratings using regex
    const overallMatch = response.match(/OVERALL RATING:\s*(\d+(?:\.\d+)?)/i);
    const difficultyMatch = response.match(/DIFFICULTY RATING:\s*(\d+(?:\.\d+)?)/i);
    
    // Extract course content summary (between COURSE CONTENT SUMMARY: and PROFESSOR SUMMARY:)
    const courseSummaryMatch = response.match(/COURSE CONTENT SUMMARY:\s*([\s\S]*?)(?=PROFESSOR SUMMARY:|KEY STRENGTHS:|$)/i);
    const courseSummary = courseSummaryMatch ? courseSummaryMatch[1].trim() : '';
    
    // Extract professor summary (between PROFESSOR SUMMARY: and KEY STRENGTHS:)
    const professorSummaryMatch = response.match(/PROFESSOR SUMMARY:\s*([\s\S]*?)(?=KEY STRENGTHS:|$)/i);
    const professorSummary = professorSummaryMatch ? professorSummaryMatch[1].trim() : '';

    const parsed = {
      overallRating: overallMatch ? parseFloat(overallMatch[1]) : null,
      difficultyRating: difficultyMatch ? parseFloat(difficultyMatch[1]) : null,
      courseSummary,
      professorSummary,
      fullAnalysis: response,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Cora][OpenAI] Parsed ratings:', {
      overall: parsed.overallRating,
      difficulty: parsed.difficultyRating,
      courseSummaryLength: courseSummary.length,
      professorSummaryLength: professorSummary.length
    });
    
    return parsed;
  }
}

// Stub implementation for testing without API key
class OpenAIServiceStub extends OpenAIService {
  constructor() {
    super('stub-key');
  }

  async _makeAPICall(prompt, maxTokens = 1000) {
    console.log('[STUB] OpenAI API call with prompt:', prompt.substring(0, 100) + '...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock response
    if (prompt.includes('OVERALL RATING')) {
      return `OVERALL RATING: 8.5

PROFESSOR RATING: 9.0

COURSE RATING: 8.0

SUMMARY:
Based on the aggregated feedback, this course and professor receive positive reviews overall. Students consistently praise the professor's teaching style and availability. The course material is challenging but rewarding, with well-structured lectures and fair assessments.

KEY STRENGTHS:
- Engaging and clear teaching style
- Professor is very accessible and helpful during office hours
- Well-organized course structure
- Fair grading and reasonable workload
- Interesting and relevant course content

KEY CONCERNS:
- Some students find the pace fast at times
- Workload can be heavy during midterm season
- Prerequisites are important to have
- Weekly assignments can be time-consuming

RECOMMENDATION:
This course is highly recommended for students with a strong interest in the subject matter and solid preparation in the prerequisites. Students who actively engage with the material and attend office hours tend to do very well.`;
    } else {
      return `[STUB SUMMARY] This is a mock summary of the content. In production, this would contain an AI-generated analysis of student feedback focusing on teaching quality, course difficulty, workload, and overall student satisfaction. The content appears to be generally positive with some constructive criticism about pacing and workload.`;
    }
  }
}

export { OpenAIService, OpenAIServiceStub };

