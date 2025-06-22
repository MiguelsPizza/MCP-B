# Chrome API Implementation Plan (MV3)

## Overview

This document outlines the implementation plan for adding support for all remaining Chrome Extension APIs (Manifest V3 compatible) to the MCP extension tool system.

## Currently Implemented APIs

- ✅ Tabs
- ✅ Windows
- ✅ Bookmarks
- ✅ Storage
- ✅ History
- ✅ Notifications
- ✅ Scripting
- ✅ Cookies

## APIs to Implement

### Priority 1: Core Browser Functionality ✅ COMPLETED

#### 1. **Alarms API** ✅

- **Status**: IMPLEMENTED
- **Purpose**: Schedule code to run periodically or at specified times
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/alarms
- **Key Features**:
  - Create alarms (one-time or periodic)
  - Get existing alarms
  - Clear alarms
  - Listen to alarm events
- **Implementation Notes**: Essential for background tasks and scheduling

#### 2. **Downloads API** ✅

- **Status**: IMPLEMENTED
- **Purpose**: Programmatically initiate, monitor, manipulate, and search downloads
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/downloads
- **Key Features**:
  - Start downloads
  - Pause/resume/cancel downloads
  - Search download history
  - Monitor download progress
- **Implementation Notes**: Requires "downloads" permission

#### 3. **Runtime API** ✅

- **Status**: IMPLEMENTED
- **Purpose**: Core extension lifecycle and messaging
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/runtime
- **Key Features**:
  - Get extension info
  - Send messages between extension parts
  - Handle installation/update events
  - Open options page
- **Implementation Notes**: Already partially used, needs full implementation

#### 4. **Commands API** ✅

- **Status**: IMPLEMENTED
- **Purpose**: Add keyboard shortcuts
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/commands
- **Key Features**:
  - Register keyboard shortcuts
  - Get all commands
  - Handle command events
- **Implementation Notes**: Requires manifest configuration

### Priority 2: User Interface & Interaction

#### 5. **Action API** (MV3+)

- **Purpose**: Control extension icon in toolbar
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/action
- **Key Features**:
  - Set badge text/color
  - Set icon
  - Set popup
  - Handle click events
- **Implementation Notes**: Replaces browserAction from MV2

#### 6. **ContextMenus API**

- **Purpose**: Add items to context menus
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/contextMenus
- **Key Features**:
  - Create menu items
  - Update/remove items
  - Handle click events
- **Implementation Notes**: Requires "contextMenus" permission

#### 7. **Omnibox API**

- **Purpose**: Register keyword with address bar
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/omnibox
- **Key Features**:
  - Set default suggestion
  - Handle input changes
  - Handle selection
- **Implementation Notes**: Requires manifest configuration

#### 8. **SidePanel API** (Chrome 114+)

- **Purpose**: Host content in browser's side panel
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- **Key Features**:
  - Set panel behavior
  - Open/close panel
  - Set panel options
- **Implementation Notes**: New API, requires "sidePanel" permission

### Priority 3: Content & Privacy

#### 9. **BrowsingData API**

- **Purpose**: Remove browsing data
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/browsingData
- **Key Features**:
  - Remove history, cookies, cache, etc.
  - Specify time ranges
  - Select data types
- **Implementation Notes**: Requires "browsingData" permission

#### 10. **ContentSettings API**

- **Purpose**: Control per-site settings
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/contentSettings
- **Key Features**:
  - Manage cookies, JavaScript, plugins per site
  - Get/set content settings
  - Clear settings
- **Implementation Notes**: Requires "contentSettings" permission

#### 11. **Privacy API**

- **Purpose**: Control privacy features
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/privacy
- **Key Features**:
  - Network settings
  - Services settings
  - Websites settings
- **Implementation Notes**: Requires "privacy" permission

### Priority 4: Navigation & Web Requests

#### 12. **WebNavigation API**

- **Purpose**: Monitor navigation events
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/webNavigation
- **Key Features**:
  - Track page loads
  - Monitor frame navigation
  - Get frame details
- **Implementation Notes**: Requires "webNavigation" permission

#### 13. **WebRequest API**

- **Purpose**: Observe and modify network requests
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/webRequest
- **Key Features**:
  - Intercept requests
  - Modify headers
  - Block requests
- **Implementation Notes**: Limited in MV3, requires "webRequest" permission

#### 14. **DeclarativeNetRequest API** (MV3+)

- **Purpose**: Block/modify network requests declaratively
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest
- **Key Features**:
  - Define rules
  - Update dynamic rules
  - Get matched rules
- **Implementation Notes**: MV3 replacement for blocking webRequest

### Priority 5: Data & Sync

#### 15. **Sessions API**

- **Purpose**: Query and restore tabs/windows
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/sessions
- **Key Features**:
  - Get recently closed tabs/windows
  - Restore sessions
  - Get devices
- **Implementation Notes**: Requires "sessions" permission

#### 16. **TopSites API**

- **Purpose**: Access most visited sites
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/topSites
- **Key Features**:
  - Get top sites list
- **Implementation Notes**: Requires "topSites" permission

#### 17. **ReadingList API** (Chrome 120+)

- **Purpose**: Manage reading list items
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/readingList
- **Key Features**:
  - Add/remove items
  - Query items
  - Update read status
- **Implementation Notes**: New API, requires "readingList" permission

### Priority 6: System & Device

#### 18. **Power API**

- **Purpose**: Override power management
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/power
- **Key Features**:
  - Keep system/display awake
  - Release keep-awake
- **Implementation Notes**: Requires "power" permission

#### 19. **Idle API**

- **Purpose**: Detect idle state changes
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/idle
- **Key Features**:
  - Query idle state
  - Set detection interval
  - Monitor state changes
- **Implementation Notes**: Requires "idle" permission

#### 20. **System APIs**

- **system.cpu**: Query CPU metadata
- **system.memory**: Query memory info
- **system.storage**: Query storage devices
- **system.display**: Query display info
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/system.cpu
- **Implementation Notes**: Each requires specific permission

### Priority 7: Advanced Features

#### 21. **Management API**

- **Purpose**: Manage other extensions
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/management
- **Key Features**:
  - Get installed extensions
  - Enable/disable extensions
  - Uninstall extensions
- **Implementation Notes**: Requires "management" permission

#### 22. **Permissions API**

- **Purpose**: Request optional permissions at runtime
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/permissions
- **Key Features**:
  - Request permissions
  - Check permissions
  - Remove permissions
- **Implementation Notes**: For dynamic permission management

#### 23. **Identity API**

- **Purpose**: OAuth2 authentication
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/identity
- **Key Features**:
  - Get auth tokens
  - Remove cached tokens
  - Get profile info
- **Implementation Notes**: Requires "identity" permission

### Priority 8: Media & Capture

#### 24. **DesktopCapture API**

- **Purpose**: Capture screen/window/tab content
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/desktopCapture
- **Key Features**:
  - Choose desktop media
  - Get stream ID
- **Implementation Notes**: Requires "desktopCapture" permission

#### 25. **TabCapture API**

- **Purpose**: Capture tab media streams
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/tabCapture
- **Key Features**:
  - Capture tab audio/video
  - Get capture info
- **Implementation Notes**: Requires "tabCapture" permission

#### 26. **PageCapture API**

- **Purpose**: Save tabs as MHTML
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/pageCapture
- **Key Features**:
  - Save tab as MHTML
- **Implementation Notes**: Requires "pageCapture" permission

### Priority 9: Specialized Features

#### 27. **TTS API**

- **Purpose**: Text-to-speech synthesis
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/tts
- **Key Features**:
  - Speak text
  - Stop speaking
  - Get voices
- **Implementation Notes**: Requires "tts" permission

#### 28. **I18n API**

- **Purpose**: Internationalization
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/i18n
- **Key Features**:
  - Get messages
  - Get UI language
  - Detect language
- **Implementation Notes**: Core API, always available

#### 29. **FontSettings API**

- **Purpose**: Manage font settings
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/fontSettings
- **Key Features**:
  - Get/set font preferences
  - Clear font settings
- **Implementation Notes**: Requires "fontSettings" permission

#### 30. **Search API** (Chrome 87+)

- **Purpose**: Search via default provider
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/search
- **Key Features**:
  - Query search
- **Implementation Notes**: Requires "search" permission

### Priority 10: New MV3 Features

#### 31. **UserScripts API** (Chrome 120+)

- **Purpose**: Execute user scripts
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/userScripts
- **Key Features**:
  - Register/unregister scripts
  - Configure world
- **Implementation Notes**: Already partially implemented

#### 32. **Offscreen API** (Chrome 109+)

- **Purpose**: Create offscreen documents
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/offscreen
- **Key Features**:
  - Create offscreen document
  - Close document
- **Implementation Notes**: MV3 specific

#### 33. **TabGroups API** (Chrome 89+)

- **Purpose**: Manage tab groups
- **Documentation**: https://developer.chrome.com/docs/extensions/reference/api/tabGroups
- **Key Features**:
  - Create/update groups
  - Move tabs between groups
  - Query groups
- **Implementation Notes**: Works with tabs API

## Implementation Progress

### ✅ Phase 1: Core APIs (COMPLETED)

- **Implemented**: Alarms, Downloads, Runtime, Commands
- **Integration**: All APIs added to index.ts and ExtensionToolsService.ts
- **Testing**: TypeScript compilation verified

## Implementation Strategy for Remaining APIs

### Phase 2: UI APIs (Week 3-4)

1. Implement: Action, ContextMenus, Omnibox, SidePanel
2. Create example uses

### Phase 3: Content/Privacy APIs (Week 5-6)

1. Implement: BrowsingData, ContentSettings, Privacy
2. Add permission checks

### Phase 4: Navigation/Requests (Week 7-8)

1. Implement: WebNavigation, WebRequest, DeclarativeNetRequest
2. Handle MV3 limitations

### Phase 5: Data/System APIs (Week 9-10)

1. Implement: Sessions, TopSites, ReadingList, Power, Idle, System.\*
2. Add proper error handling

### Phase 6: Advanced Features (Week 11-12)

1. Implement: Management, Permissions, Identity
2. Add OAuth flow support

### Phase 7: Media/Capture APIs (Week 13-14)

1. Implement: DesktopCapture, TabCapture, PageCapture
2. Handle stream management

### Phase 8: Specialized APIs (Week 15-16)

1. Implement: TTS, I18n, FontSettings, Search
2. Add localization support

### Phase 9: MV3 Features (Week 17-18)

1. Complete: UserScripts, Offscreen, TabGroups
2. Final testing

## Testing Requirements

1. **Unit Tests**: For each API tool class
2. **Integration Tests**: API interaction testing
3. **Permission Tests**: Verify permission handling
4. **Error Tests**: Test unavailable API scenarios
5. **Documentation**: Update SOP with learnings

## Success Criteria

- All MV3-compatible APIs implemented
- Consistent error handling across all APIs
- Comprehensive documentation
- Type-safe implementations
- Permission-aware tools
- Follows established patterns

## Notes

- Skip Chrome OS only APIs
- Skip deprecated/legacy APIs
- Focus on MV3 compatibility
- Prioritize commonly used APIs
- Consider Chrome version requirements

## Lessons Learned from Phase 1 Implementation

### 1. TypeScript Compilation

- Use `pnpm compile` in the extension directory, not `pnpm typecheck`
- Fix type issues immediately to avoid accumulation

### 2. Common Type Issues

- Chrome APIs may have sync methods that don't return promises
- Use type casting for specific enum values (e.g., `as 16 | 32`) or add a zod enum
- Check for method existence before using (version compatibility)

### 3. Integration Process

1. Create the API tools file
2. Export from index.ts
3. Update ExtensionToolsService.ts (imports, interface, initialization)
4. Run `pnpm compile` to verify

### 4. API-Specific Considerations

- Some methods require additional permissions beyond the base API
- Not all methods are available in all Chrome versions
- Handle both callback and promise-based APIs appropriately

### 5. Documentation

- Always check the official Chrome documentation
- Note any MV3-specific changes or limitations
- Document workarounds for type issues
