# CoRA Extension

**Course Research Assistant** - A Chrome extension built for the Claude Hackathon 2025 that enhances the UVA SIS (Student Information System) course search experience with AI-powered course and professor insights.

## How It Works

When you're browsing courses on the UVA SIS website:

1. **Navigate** to any course search page on `sisuva.admin.virginia.edu`
2. **Expand** a course section by clicking on it to see the detailed information
3. **Click** the "✨ Cora" button that appears in the expanded section
4. **View** AI-generated summaries, ratings, and relevant links for the course and professor

The extension intelligently searches the web, scrapes relevant content, filters it using AI, and generates concise summaries to help you make informed course selection decisions.

## Getting Started

### Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `cora-extension` directory

### Configure API Keys

1. Click the CoRA extension icon in your browser toolbar
2. Click the settings gear icon
3. Paste your OpenAI API key
4. (Optional) Update Google Custom Search credentials in `src/config.js`

## Tech Stack

### Frontend Architecture
- **Chrome Extension Manifest V3**: Modern extension framework with service workers
- **Vanilla JavaScript**: No framework dependencies for optimal performance
- **CSS3**: Custom styling with Montserrat font and responsive design
- **DOM Manipulation**: Direct interaction with UVA SIS pages

### Backend Services
- **OpenAI GPT-5 Models**: 
  - `gpt-5-mini`: Fast filtering and page summarization with minimal reasoning
  - Final rating generation with low reasoning effort
  - Uses the `/v1/responses` API endpoint
- **Google Custom Search API**: Web searches for course-related content
  - Targeted searches on Reddit (r/uva) and theCourseForum
  - Progressive search strategy with fallbacks

### Data Pipeline
1. **Search**: Google Custom Search API finds relevant pages
2. **Scrape**: Fetch and extract main content from URLs
3. **Filter**: GPT-5-mini filters content for course/professor relevance
4. **Summarize**: GPT-5-mini generates concise 80-word summaries with quotes
5. **Rate**: GPT-5-mini produces final ratings and consolidated summaries
6. **Cache**: Results stored in `chrome.storage.local` for instant retrieval



- The extension is configured to only run on `sisuva.admin.virginia.edu` for security and performance
- All AI processing happens client-side using OpenAI's API
- Cache TTL is set to 30 days with a maximum of 100 entries

## License

MIT
