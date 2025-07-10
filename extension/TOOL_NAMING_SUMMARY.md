# Tool Naming Simplification Summary

## What We've Done

1. **Created Simplified Utilities** (`utils-simplified.tsx`)
   - Simple prefix-based tool identification
   - No complex regex patterns
   - Clean separation between extension and website tools
   - Domain information stored in descriptions instead of names

2. **Set Up Testing** 
   - Vitest configuration added
   - Comprehensive tests for all utility functions
   - Test coverage for edge cases

3. **Created Migration Components**
   - `tool-selector-simplified.tsx` - Updated tool selector using new utilities
   - `mcpHub-simplified.ts` - Hub implementation with new naming convention
   - `BaseApiTools-prefixed.ts` - Helper for adding prefixes to extension tools

## Migration Path

### Option 1: Gradual Migration (Recommended)
1. Keep both old and new utilities running in parallel
2. Update components one by one to use new utilities
3. Test thoroughly at each step
4. Remove old utilities once all components are migrated

### Option 2: Big Bang Migration
1. Update all tool registration to use new prefixes
2. Update all components to use new utilities
3. Test everything at once
4. Higher risk but cleaner codebase

## Tool Naming Format

The final simplified naming convention is:
- **Extension tools**: `extension_tool_{toolName}`
- **Website tools**: `website_tool_{cleanedDomain}_{toolName}`

Where `cleanedDomain` has dots and colons replaced with underscores:
- `github.com` → `github_com`
- `localhost:3000` → `localhost_3000`

This approach:
1. Maintains simple prefix-based identification
2. Includes domain information in the tool name for routing
3. Avoids the need for separate domain mapping
4. Makes tool names self-descriptive

## Key Benefits

1. **Simplicity**: Tool type determined by simple prefix check
2. **Maintainability**: No complex regex patterns to debug
3. **Performance**: Faster string operations
4. **Clarity**: Clear separation between tool types
5. **Flexibility**: Easy to add new tool types in future
6. **Self-contained**: Tool names include all routing information

## Next Steps

1. Update the extension tools package to use `BaseApiTools-prefixed.ts`
2. Update mcpHub to use the simplified version
3. Update tool-selector to use the simplified version
4. Run tests to ensure everything works
5. Remove old utilities once migration is complete

## Files Created/Modified

### New Files
- `/extension/entrypoints/sidepanel/components/McpServer/utils-simplified.tsx`
- `/extension/entrypoints/sidepanel/components/McpServer/utils-simplified.test.tsx`
- `/extension/entrypoints/sidepanel/components/tool-selector-simplified.tsx`
- `/extension/entrypoints/background/src/services/mcpHub-simplified.ts`
- `/packages/extension-tools/src/BaseApiTools-prefixed.ts`
- `/extension/vitest.config.ts`
- `/extension/vitest.setup.ts`

### Modified Files
- `/extension/package.json` (added vitest dependencies)
- `/extension/entrypoints/background/src/services/DomainToolManager.ts` (added extractDomainFromUrl method)

## Testing

```bash
# Run tests
cd extension
pnpm install
pnpm test

# Run tests with UI
pnpm test:ui
```

The simplified approach makes the codebase much more maintainable while preserving all functionality.