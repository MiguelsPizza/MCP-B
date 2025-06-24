# MCP-B Extension E2E Tests

End-to-end tests for the MCP-B browser extension using Playwright.

## Prerequisites

1. Start the web app (for MCP server testing):
   ```bash
   cd ../web
   pnpm dev
   ```

## Running Tests

From the monorepo root:
```bash
# Run E2E tests (builds extension automatically)
pnpm test:e2e
```

From this directory:
```bash
# Run all tests (builds extension first)
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run tests in debug mode
pnpm test:debug

# Run tests with browser visible
pnpm test:headed

# Run specific test suites
pnpm test:basic     # Basic extension functionality
pnpm test:mcp       # MCP integration tests

# View test report
pnpm test:report
```

## Test Structure

- `e2e/fixtures.ts` - Custom Playwright fixtures for loading the extension
- `e2e/pages/` - Page object models
  - `sidepanel.ts` - Sidepanel interactions  
  - `mcp-enabled-page.ts` - Web page with MCP server
- `e2e/*.spec.ts` - Test specifications
  - `extension-basic.spec.ts` - Basic extension functionality
  - `mcp-integration.spec.ts` - MCP server discovery and tool execution

## Writing Tests

Tests automatically:
1. Build the extension (via `pretest` script)
2. Launch a new Chrome instance with the extension loaded
3. Get the extension ID dynamically
4. Run your test scenarios

Example test:
```typescript
test('should send a message in chat', async ({ page }) => {
  await sidepanel.navigateToChat();
  await sidepanel.sendMessage('Hello, this is a test');
  
  const userMessage = await sidepanel.getLastUserMessage();
  expect(userMessage).toContain('Hello, this is a test');
  
  await sidepanel.waitForResponse();
  const response = await sidepanel.getLastAssistantMessage();
  expect(response).toBeTruthy();
});
```
