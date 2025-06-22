import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import { chromium } from 'playwright'; // <-- Add this import at the top of your file
import { CHROME_API_REGISTRY, ChromeApi } from '../chromeApiRegistry';

// Parse command line arguments
const args = process.argv.slice(2);
const forceRefetch = args.includes('--force-refetch') || args.includes('-f');

// Store the current batch ID for cleanup
let currentBatchId: string | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Output directory for generated API classes
const OUTPUT_DIR = path.join(__dirname, '../chrome-apis');

// Documentation cache directory
const DOCS_CACHE_DIR = path.join(__dirname, 'docs-cache');

// Cleanup function to cancel batch if needed
async function cancelBatch(batchId: string): Promise<void> {
  try {
    console.log(`\nCancelling batch ${batchId}...`);
    const canceledBatch = await anthropic.messages.batches.cancel(batchId);
    console.log(
      `Batch ${batchId} cancellation initiated. Status: ${canceledBatch.processing_status}`
    );
  } catch (error) {
    console.error(`Failed to cancel batch ${batchId}:`, error);
  }
}

// Setup signal handlers for graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, cleaning up...');
  if (currentBatchId) {
    await cancelBatch(currentBatchId);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, cleaning up...');
  if (currentBatchId) {
    await cancelBatch(currentBatchId);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  if (currentBatchId) {
    await cancelBatch(currentBatchId);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  if (currentBatchId) {
    await cancelBatch(currentBatchId);
  }
  process.exit(1);
});

// Get Chrome documentation URL for an API
function getChromeDocUrl(api: ChromeApi): string {
  const metadata = CHROME_API_REGISTRY[api];
  const namespace = metadata.namespace;
  return `https://developer.chrome.com/docs/extensions/reference/api/${namespace}`;
}

// Get cache file path for an API documentation
function getDocsCacheFilePath(api: ChromeApi): string {
  // Replace dots with underscores for valid filenames
  const safeApiName = api.replace(/\./g, '_');
  return path.join(DOCS_CACHE_DIR, `${safeApiName}.md`);
}

async function fetchApiDocumentation(api: ChromeApi): Promise<string> {
  const cacheFilePath = getDocsCacheFilePath(api);

  if (!forceRefetch) {
    try {
      await fs.access(cacheFilePath);
      const cachedDocs = await fs.readFile(cacheFilePath, 'utf-8');
      console.log(`Using cached documentation for ${api}`);
      return cachedDocs;
    } catch {
      // Not cached, proceed to fetch
    }
  }

  const url = getChromeDocUrl(api);
  console.log(`Fetching documentation for ${api} from ${url}...`);

  let browser;
  try {
    // Launch a headless Chromium browser
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the documentation page
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the main article container to be visible and stable
    const articleSelector = 'article.devsite-article';
    await page.waitForSelector(articleSelector, { state: 'visible' });

    // Extract the text content directly from the rendered page
    const documentationText = await page.locator(articleSelector).innerText();

    // Clean up the text (same logic as before)
    const cleanedText = documentationText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    // Ensure cache directory exists and save the fresh documentation
    await fs.mkdir(DOCS_CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFilePath, cleanedText, 'utf-8');
    console.log(`Cached documentation for ${api}`);

    return cleanedText;
  } catch (error) {
    console.warn(`Error fetching documentation for ${api} with Playwright:`, error);
    return '';
  } finally {
    // Ensure the browser is always closed
    if (browser) {
      await browser.close();
    }
  }
}

// Convert API enum to filename
function getApiFileName(api: ChromeApi): string {
  const metadata = CHROME_API_REGISTRY[api];
  const namespace = metadata.namespace;

  // Convert namespace to PascalCase for filename
  const parts = namespace.split('.');
  const pascalCase = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

  return `${pascalCase}ApiTools.ts`;
}

// Convert API enum to class name
function getApiClassName(api: ChromeApi): string {
  const metadata = CHROME_API_REGISTRY[api];
  const namespace = metadata.namespace;

  // Convert namespace to PascalCase for class name
  const parts = namespace.split('.');
  const pascalCase = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

  return `${pascalCase}ApiTools`;
}

// Create the prompt for each API
async function createPrompt(api: ChromeApi): Promise<string> {
  const metadata = CHROME_API_REGISTRY[api];
  const className = getApiClassName(api);

  // Fetch the API documentation
  const apiDocumentation = await fetchApiDocumentation(api);

  // Read the reference implementation
  const referenceImplPath = path.join(__dirname, '../chrome-apis/AlarmsApiTools.ts');
  let referenceImplementation = '';
  try {
    referenceImplementation = await fs.readFile(referenceImplPath, 'utf-8');
  } catch (error) {
    console.warn('Could not read reference implementation:', error);
  }

  return `Generate a TypeScript class implementation for the Chrome ${metadata.namespace} API.

## REFERENCE IMPLEMENTATION

Here is the complete AlarmsApiTools.ts implementation to use as your exact pattern:

\`\`\`typescript
${referenceImplementation}
\`\`\`

## CHROME ${metadata.namespace.toUpperCase()} API DOCUMENTATION

${apiDocumentation || 'No documentation available - please implement based on your knowledge of the Chrome Extension API.'}

## IMPLEMENTATION REQUIREMENTS

### Class Structure
- Class name: ${className}
- Must extend BaseApiTools
- Protected apiName property: '${metadata.namespace.charAt(0).toUpperCase() + metadata.namespace.slice(1)}'
- Constructor with McpServer and options parameters
- Options interface should be named ${className}Options

### Required Methods
1. **checkAvailability()**: Returns ApiAvailability
   - Check if chrome.${metadata.namespace} exists
   - Test a basic method for functionality
   - Return detailed error messages with manifest permission hints
   - Use try-catch for error handling

2. **registerTools()**: Register all tool methods
   - Use this.shouldRegisterTool() to check if each tool should be registered
   - Call private register methods for each tool

3. **Individual Tool Methods**: Create private methods for each Chrome API method
   - Method name pattern: register{ToolName}()
   - Tool name pattern: {action}_{resource} (e.g., get_downloads, create_bookmark)
   - Use this.server.registerTool() with description and zod inputSchema
   - Use async handlers with proper error handling
   - Return formatted responses using this.formatJson() or this.formatSuccess()

### Best Practices
- **Error Handling**: Always use try-catch blocks and this.formatError()
- **Parameter Validation**: Use Zod schemas with clear descriptions
- **Type Safety**: Use Chrome API TypeScript types where available
- **Tool Descriptions**: Write clear, actionable descriptions
- **Optional Parameters**: Handle undefined values properly

### Common Patterns

**For Promise-based Chrome APIs:**
\`\`\`typescript
const result = await new Promise<Type>((resolve, reject) => {
  chrome.apiName.method(params, (result) => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
    } else {
      resolve(result);
    }
  });
});
\`\`\`

**For Optional Parameters:**
\`\`\`typescript
const options: chrome.apiName.Options = {};
if (param1 !== undefined) options.param1 = param1;
if (param2 !== undefined) options.param2 = param2;
\`\`\`

**For Formatting Responses:**
\`\`\`typescript
return this.formatJson({
  count: results.length,
  items: results.map((item) => ({
    id: item.id,
    // ... other properties
  })),
});
\`\`\`

## API SPECIFIC DETAILS
- Namespace: chrome.${metadata.namespace}
- Manifest Versions: ${metadata.manifestVersions.join(', ')}
- Platform: ${metadata.platform}
- Contexts: ${metadata.contexts.join(', ')}

## OUTPUT REQUIREMENTS
Generate ONLY the complete TypeScript file content. Do not include any explanations, comments outside the code, or markdown formatting. The output should be the exact TypeScript code that can be saved directly to a .ts file.

Follow the EXACT patterns, naming conventions, and structure shown in the AlarmsApiTools.ts reference implementation.`;
}

// Create batch requests
async function createBatchRequests() {
  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = [];

  for (const api of Object.values(ChromeApi)) {
    const prompt = await createPrompt(api);
    // Replace dots with underscores to create valid custom_id
    const customId = api.replace(/\./g, '_');
    requests.push({
      custom_id: customId,
      params: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      },
    });
  }

  return requests;
}

// Poll for batch completion
async function pollBatchStatus(batchId: string): Promise<void> {
  console.log(`Polling batch ${batchId}...`);

  while (true) {
    const batch = await anthropic.messages.batches.retrieve(batchId);

    console.log(`Batch status: ${batch.processing_status}`);
    console.log(`Request counts:`, batch.request_counts);

    if (batch.processing_status === 'ended' || batch.processing_status === 'canceling') {
      // Clear the batch ID if it's already ended or canceling
      if (currentBatchId === batchId) {
        currentBatchId = null;
      }

      if (batch.processing_status === 'canceling') {
        console.log('Batch is being cancelled...');
        break;
      }

      if (batch.request_counts.errored > 0) {
        console.warn(`${batch.request_counts.errored} requests errored`);
      }
      break;
    }

    // Wait 30 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

// Process batch results
async function processBatchResults(batchId: string) {
  console.log('Processing batch results...');

  const results = [];
  for await (const result of await anthropic.messages.batches.results(batchId)) {
    results.push(result);
  }

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const successfulApis: { api: ChromeApi; className: string; fileName: string }[] = [];

  for (const result of results) {
    // Convert custom_id back to original API name (replace underscores with dots)
    const customId = result.custom_id;
    // Find the matching API by checking which one matches when dots are replaced with underscores
    const api = Object.values(ChromeApi).find(
      (apiValue) => apiValue.replace(/\./g, '_') === customId
    ) as ChromeApi;

    if (!api) {
      console.error(`Failed to find API for custom_id: ${customId}`);
      continue;
    }

    const fileName = getApiFileName(api);
    const className = getApiClassName(api);
    const filePath = path.join(OUTPUT_DIR, fileName);

    if (result.result.type === 'succeeded') {
      const message = result.result.message;
      const content = message.content[0];

      if (content.type === 'text') {
        // Extract the TypeScript code from the response
        let code = content.text;

        // Strip markdown code block markers
        const codeBlockRegex = /```(?:typescript|ts)?\n([\s\S]*?)```/;
        const match = code.match(codeBlockRegex);
        if (match) {
          code = match[1].trim();
        }

        // Write the file
        await fs.writeFile(filePath, code, 'utf-8');
        console.log(`✅ Generated ${fileName}`);

        successfulApis.push({ api, className, fileName });
      }
    } else {
      console.error(`❌ Failed to generate ${fileName}:`, result.result);
    }
  }

  // Generate index file
  await generateIndexFile(successfulApis);
}

// Generate index.ts file
async function generateIndexFile(apis: { api: ChromeApi; className: string; fileName: string }[]) {
  const indexPath = path.join(OUTPUT_DIR, 'index.ts');

  const imports = apis
    .map(
      ({ className, fileName }) =>
        `export { ${className} } from './${fileName.replace('.ts', '')}';`
    )
    .join('\n');

  const apiImports = `import { ChromeApi } from '../chromeApiRegistry';\nimport { BaseApiTools } from '../BaseApiTools';\n\n`;

  const apiRegistry = `
// Registry of all Chrome API tool implementations
export const CHROME_API_TOOLS: Record<ChromeApi, typeof BaseApiTools> = {
${apis.map(({ api, className }) => `  [ChromeApi.${api}]: ${className},`).join('\n')}
};

// Helper to get API tools by enum
export function getApiTools(api: ChromeApi): typeof BaseApiTools | undefined {
  return CHROME_API_TOOLS[api];
}
`;

  const indexContent = `${apiImports}${imports}\n${apiRegistry}`;

  await fs.writeFile(indexPath, indexContent, 'utf-8');
  console.log('✅ Generated index.ts');
}

// Main execution
async function main() {
  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Chrome API Tools Generator

Usage: pnpm generate-chrome-api-tools [options]

Options:
  --force-refetch, -f    Force refetch documentation from web (ignores cache)
  --help, -h             Show this help message

By default, documentation is cached locally and reused on subsequent runs.
Use --force-refetch to update the documentation from the Chrome docs website.
`);
      process.exit(0);
    }

    if (forceRefetch) {
      console.log('Force refetch enabled - will download fresh documentation');
    } else {
      console.log('Using cached documentation where available (use --force-refetch to update)');
    }

    console.log('Creating batch requests...');
    const requests = await createBatchRequests();

    console.log(`Creating batch with ${requests.length} requests...`);
    const batch = await anthropic.messages.batches.create({ requests: requests });

    // Store the batch ID for cleanup
    currentBatchId = batch.id;

    console.log(`Batch created with ID: ${batch.id}`);

    // Poll for completion
    await pollBatchStatus(batch.id);

    // Process results
    await processBatchResults(batch.id);

    // Clear the batch ID since it's complete
    currentBatchId = null;

    console.log('✅ Generation complete!');
  } catch (error) {
    console.error('Error:', error);

    // Cancel the batch if it's still running
    if (currentBatchId) {
      await cancelBatch(currentBatchId);
    }

    process.exit(1);
  }
}

// Run the script
main();
