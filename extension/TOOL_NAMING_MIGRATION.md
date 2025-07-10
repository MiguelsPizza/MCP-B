# Tool Naming Migration Guide

## Overview

This guide documents the migration from the complex tool naming system to the simplified standardized approach using `extension_tool_` and `website_tool_` prefixes.

## Key Changes

### 1. Tool Name Prefixes

**Old System:**
- Extension tools: No prefix
- Domain tools: `{sanitized_domain}_{tool_name}` (e.g., `github_com_createIssue`)
- Localhost tools: `localhost_{port}_{tool_name}` (e.g., `localhost_3000_createTodo`)
- Legacy format: `tab{id}_{tool_name}`

**New System:**
- Extension tools: `extension_tool_{tool_name}` (e.g., `extension_tool_list_tabs`)
- Website tools: `website_tool_{tool_name}` (e.g., `website_tool_createIssue`)

### 2. Domain Information

Domain information is now stored in the tool description instead of the tool name:
- Format: `[domain.com] Original description`
- Active tab: `[domain.com • Active] Original description`
- Multi-tab: `[domain.com - 3 tabs • Tab 2 Active] Original description`

### 3. Simplified Utilities

**Old utilities (`utils.tsx`):**
```tsx
isExtensionTool(toolName) // Complex regex patterns
parseToolInfo(toolName, description) // Multiple format handling
groupToolsByDomain(tools) // Domain extraction from names
sanitizeDomainForToolName(domain) // Replace dots/colons
```

**New utilities (`utils-simplified.tsx`):**
```tsx
isExtensionTool(toolName) // Simple prefix check
isWebsiteTool(toolName) // Simple prefix check
getCleanToolName(toolName) // Remove prefix
parseToolInfo(toolName, description) // Extract domain from description
groupToolsByType(tools) // Simple type grouping
groupWebsiteToolsByDomain(tools) // Group by domain in description
```

## Migration Steps

### 1. Update Tool Registration in mcpHub.ts

**Old:**
```typescript
const sanitizedDomain = sanitizeDomainForToolName(domain);
const prefixedName = `${sanitizedDomain}_${tool.name}`;
```

**New:**
```typescript
const prefixedName = `website_tool_${tool.name}`;
```

### 2. Update Extension Tools Registration

Extension tools should be prefixed when registered:

```typescript
// In ExtensionToolsService or similar
this.server.registerTool(
  `extension_tool_${toolName}`,
  // ... rest of registration
);
```

### 3. Update Tool Selection Storage

The tool preferences are stored by clean name (without prefix), so existing preferences will continue to work.

### 4. Update Components

Replace imports:
```typescript
// Old
import { parseToolInfo, groupToolsByDomain } from './McpServer/utils';

// New
import { parseToolInfo, groupWebsiteToolsByDomain } from './McpServer/utils-simplified';
```

## Benefits

1. **Simplicity**: No complex regex patterns or domain sanitization
2. **Consistency**: All tools follow the same naming pattern
3. **Maintainability**: Easier to understand and modify
4. **Testing**: Simpler to test with predictable patterns
5. **Performance**: Faster string operations without regex

## Testing

Run the new tests to ensure the migration works correctly:

```bash
cd extension
pnpm test
```

## Rollback Plan

If issues arise, the old utilities are preserved in `utils.tsx` and can be restored by updating imports.