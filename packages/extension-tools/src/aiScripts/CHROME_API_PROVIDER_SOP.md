# Standard Operating Procedure: Creating a New Chrome API Provider

## Overview

This document outlines the standard process for creating a new Chrome API provider class that integrates with the MCP (Model Context Protocol) extension tool system.

## Prerequisites

- Understanding of the Chrome Extension API you want to implement
- TypeScript knowledge
- Familiarity with the MCP SDK

## Step-by-Step Process

### 1. Create the API Tools Class File

Create a new file in `/extension/entrypoints/background/src/services/chrome-apis/` named `{ApiName}ApiTools.ts`.

Example: `DownloadsApiTools.ts` for the Chrome Downloads API.

### 2. Import Required Dependencies

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';
```

### 3. Define the Class Structure

```typescript
export class {ApiName}ApiTools extends BaseApiTools {
  protected apiName = '{ApiName}';

  constructor(
    server: McpServer,
    options: {
      // Define tool-specific options
      getTool?: boolean;
      createTool?: boolean;
      updateTool?: boolean;
      deleteTool?: boolean;
    } = {}
  ) {
    super(server, options);
  }
```

### 4. Implement Availability Check

Create a `checkAvailability()` method that:

- Checks if the Chrome API exists
- Tests basic API functionality
- Returns detailed error messages

```typescript
checkAvailability(): ApiAvailability {
  try {
    // Check if API exists
    if (!chrome.{apiName}) {
      return {
        available: false,
        message: 'chrome.{apiName} API is not defined',
        details: 'This extension needs the "{apiName}" permission in its manifest.json',
      };
    }

    // Test a basic method
    if (typeof chrome.{apiName}.{basicMethod} !== 'function') {
      return {
        available: false,
        message: 'chrome.{apiName}.{basicMethod} is not available',
        details: 'The {apiName} API appears to be partially available. Check manifest permissions.',
      };
    }

    // Try to actually use the API
    chrome.{apiName}.{testMethod}({}, () => {
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
    });

    return {
      available: true,
      message: '{ApiName} API is fully available',
    };
  } catch (error) {
    return {
      available: false,
      message: 'Failed to access chrome.{apiName} API',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
```

### 5. Register Tools in `registerTools()`

```typescript
registerTools(): void {
  if (this.shouldRegisterTool('getTool')) {
    this.registerGetTool();
  }

  if (this.shouldRegisterTool('createTool')) {
    this.registerCreateTool();
  }

  // Add more tool registrations...
}
```

### 6. Implement Individual Tool Methods

For each tool, create a private method:

```typescript
private registerGetTool(): void {
  this.server.registerTool(
    'get_{resource}',
    {
      description: 'Clear description of what this tool does',
      inputSchema: {
        // Define parameters using Zod
        id: z.string().describe('Resource ID'),
        filter: z.object({
          // Define filter properties
        }).optional().describe('Optional filters'),
      },
    },
    async (params) => {
      try {
        // Implement the Chrome API call
        const result = await chrome.{apiName}.{method}(params);

        // Format and return the result
        return this.formatJson(result);
      } catch (error) {
        return this.formatError(error);
      }
    }
  );
}
```

### 7. Export from Index File

Add your new API tools class to `/extension/entrypoints/background/src/services/chrome-apis/index.ts`:

```typescript
export { {ApiName}ApiTools } from './{ApiName}ApiTools';
```

### 8. Add to ExtensionToolsService

Update `ExtensionToolsService.ts`:

1. Add to imports:

```typescript
import { {ApiName}ApiTools } from './chrome-apis';
```

2. Add to `ExtensionToolsOptions` interface:

```typescript
{apiName}?: {
  getTool?: boolean;
  createTool?: boolean;
  // ... other tools
};
```

3. Add to `initializeApiTools()`:

```typescript
new {ApiName}ApiTools(this.server, this.options.{apiName}),
```

## Best Practices

### 1. Error Handling

- Always use try-catch blocks
- Provide meaningful error messages
- Use `formatError()` for consistent error formatting

### 2. Parameter Validation

- Use Zod schemas for all parameters
- Provide clear descriptions for each parameter
- Mark optional parameters appropriately

### 3. API Availability

- Check for API existence before using
- Test for specific permissions
- Provide guidance on missing permissions

### 4. Type Safety

- Use TypeScript types from Chrome API definitions
- Cast to `any` only when necessary for compatibility
- Document any type workarounds

### 5. Tool Naming

- Use consistent naming: `{action}_{resource}`
- Examples: `get_downloads`, `create_bookmark`, `update_tab`

### 6. Documentation

- Write clear tool descriptions
- Document all parameters
- Include examples in complex cases

## Common Patterns

### Filtering Results

```typescript
if (query) {
  results = await chrome.{apiName}.search(query);
} else {
  results = await chrome.{apiName}.getAll();
}
```

### Handling Optional Parameters

```typescript
const options: chrome.{apiName}.Options = {};
if (param1 !== undefined) options.param1 = param1;
if (param2 !== undefined) options.param2 = param2;
```

### Formatting Responses

```typescript
return this.formatJson({
  count: results.length,
  items: results.map((item) => ({
    // Format item properties
  })),
});
```

## Testing Checklist

- [ ] API availability check works correctly
- [ ] Tools only register when API is available
- [ ] All parameters are validated
- [ ] Error messages are helpful
- [ ] TypeScript compilation succeeds
- [ ] Tools appear in MCP server listing
- [ ] Tools execute successfully
- [ ] Results are properly formatted

## Common Implementation Issues & Solutions

### 1. TypeScript Type Issues

- **Problem**: Chrome API methods might return void but TypeScript expects Promise
- **Solution**: Remove `await` for synchronous methods like `chrome.runtime.setUninstallURL()`
- **Example**:
  ```typescript
  // Wrong: await chrome.runtime.setUninstallURL(url);
  // Right: chrome.runtime.setUninstallURL(url);
  ```

### 2. Type Casting for Enums

- **Problem**: Zod number types might not match Chrome's specific enum types
- **Solution**: Use type casting when needed
- **Example**:
  ```typescript
  if (size !== undefined) options.size = size as 16 | 32;
  ```

### 3. API Method Availability

- **Problem**: Some methods might not be available in all Chrome versions
- **Solution**: Check method existence before registering tools
- **Example**:
  ```typescript
  if (typeof chrome.runtime.getContexts === 'function') {
    // Register tool that uses getContexts
  }
  ```

### 4. Permission-Dependent Methods

- **Problem**: Some methods require additional permissions beyond the base API
- **Solution**: Handle permission errors gracefully and inform users
- **Example**:
  ```typescript
  if (error.message?.includes('permission')) {
    return this.formatError('This operation requires additional permissions');
  }
  ```

### 5. Async vs Sync Chrome APIs

- **Problem**: Not all Chrome APIs are async, but tool handlers are
- **Solution**: Wrap sync calls appropriately or use callback-to-promise conversion
- **Example**:
  ```typescript
  return new Promise((resolve) => {
    chrome.downloads.getFileIcon(id, options, (iconUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(iconUrl);
      }
    });
  });
  ```

## Integration Steps Summary

1. **Create the API Tools file**: `/extension/entrypoints/background/src/services/chrome-apis/{ApiName}ApiTools.ts`
2. **Export from index**: Add to `/extension/entrypoints/background/src/services/chrome-apis/index.ts`
3. **Update ExtensionToolsService**:
   - Import the new class
   - Add to `ExtensionToolsOptions` interface
   - Add to `initializeApiTools()` array

## TypeScript Compilation

After implementing:

```bash
cd extension
pnpm compile  # Not 'pnpm typecheck' - that's for the monorepo
```

## Example Implementation

See existing implementations for reference:

- `TabsApiTools.ts` - Complex API with multiple tools
