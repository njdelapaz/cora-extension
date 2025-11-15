// Setup Script to Create .env File
// Run this once to create your .env file with API keys

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up your .env file...\n');

const envContent = `# Private API Keys - DO NOT COMMIT THIS FILE
# Add your actual API keys here

# OpenAI API Key (for GPT-5-mini)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Google Custom Search API Key
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_SEARCH_API_KEY=

# Google Custom Search Engine ID
# Get from: https://programmablesearchengine.google.com/
GOOGLE_SEARCH_ENGINE_ID=
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   Delete it first if you want to recreate it.\n');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file successfully!');
  console.log('📝 Next steps:');
  console.log('   1. Open the .env file');
  console.log('   2. Add your API keys');
  console.log('   3. The file is gitignored and safe from being committed\n');
}

console.log('📋 Get your API keys from:');
console.log('   - OpenAI: https://platform.openai.com/api-keys');
console.log('   - Google: https://console.cloud.google.com/');
console.log('   - Search Engine: https://programmablesearchengine.google.com/\n');

