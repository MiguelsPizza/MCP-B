import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';
import {
  extractChromeApiCategory,
  getCleanToolName,
  groupExtensionToolsByApi,
  groupToolsByType,
  groupWebsiteToolsByDomain,
  isExtensionTool,
  isWebsiteTool,
  parseToolInfo,
  sanitizeToolName,
} from './utils';

describe('Tool Name Utilities', () => {
  describe('sanitizeToolName', () => {
    it('should replace invalid characters with underscores', () => {
      expect(sanitizeToolName('hello-world.test')).toBe('hello_world_test');
      expect(sanitizeToolName('my@tool#name')).toBe('my_tool_name');
      expect(sanitizeToolName('valid_tool_123')).toBe('valid_tool_123');
    });

    it('should handle empty string', () => {
      expect(sanitizeToolName('')).toBe('');
    });
  });

  describe('isExtensionTool', () => {
    it('should identify extension tools', () => {
      expect(isExtensionTool('extension_tool_list_tabs')).toBe(true);
      expect(isExtensionTool('extension_tool_bookmarks')).toBe(true);
      expect(isExtensionTool('website_tool_create_todo')).toBe(false);
      expect(isExtensionTool('random_tool')).toBe(false);
    });
  });

  describe('isWebsiteTool', () => {
    it('should identify website tools', () => {
      expect(isWebsiteTool('website_tool_create_todo')).toBe(true);
      expect(isWebsiteTool('website_tool_github_create_issue')).toBe(true);
      expect(isWebsiteTool('extension_tool_list_tabs')).toBe(false);
      expect(isWebsiteTool('random_tool')).toBe(false);
    });
  });

  describe('getCleanToolName', () => {
    it('should remove extension prefix', () => {
      expect(getCleanToolName('extension_tool_list_tabs')).toBe('list_tabs');
      expect(getCleanToolName('extension_tool_create_bookmark')).toBe('create_bookmark');
    });

    it('should remove website prefix and domain', () => {
      expect(getCleanToolName('website_tool_github_com_create_todo')).toBe('create_todo');
      expect(getCleanToolName('website_tool_localhost_3000_update_todo')).toBe('update_todo');
    });

    it('should return unchanged name if no prefix', () => {
      expect(getCleanToolName('some_random_tool')).toBe('some_random_tool');
    });
  });

  describe('parseToolInfo', () => {
    it('should parse extension tool info', () => {
      const info = parseToolInfo('extension_tool_list_tabs');
      expect(info).toEqual({
        domain: 'extension',
        cleanName: 'list_tabs',
        tabId: null,
        isActive: false,
        tabIndex: null,
      });
    });

    it('should parse website tool info with domain from tool name', () => {
      const info = parseToolInfo(
        'website_tool_github_com_create_todo',
        '[github.com] Create a new todo item'
      );
      expect(info).toEqual({
        domain: 'github.com',
        cleanName: 'create_todo',
        tabId: null,
        isActive: false,
        tabIndex: null,
      });
    });

    it('should parse website tool info with localhost domain', () => {
      const info = parseToolInfo(
        'website_tool_localhost_3000_create_todo',
        '[localhost:3000] Create todo'
      );
      expect(info).toEqual({
        domain: 'localhost:3000',
        cleanName: 'create_todo',
        tabId: null,
        isActive: false,
        tabIndex: null,
      });
    });

    it('should parse website tool info with active tab', () => {
      const info = parseToolInfo(
        'website_tool_github_com_create_todo',
        '[github.com • Active] Create a new todo'
      );
      expect(info).toEqual({
        domain: 'github.com',
        cleanName: 'create_todo',
        tabId: null,
        isActive: true,
        tabIndex: null,
      });
    });

    it('should parse website tool info with tab index', () => {
      const info = parseToolInfo(
        'website_tool_github_com_create_todo',
        '[github.com - 3 tabs • Tab 2 Active] Create todo'
      );
      expect(info).toEqual({
        domain: 'github.com',
        cleanName: 'create_todo',
        tabId: null,
        isActive: true,
        tabIndex: 2,
      });
    });

    it('should handle unknown tools', () => {
      const info = parseToolInfo('unknown_tool');
      expect(info).toEqual({
        domain: 'unknown',
        cleanName: 'unknown_tool',
        tabId: null,
        isActive: false,
        tabIndex: null,
      });
    });
  });

  describe('groupToolsByType', () => {
    const mockTools: McpTool[] = [
      { name: 'extension_tool_list_tabs', description: 'List all tabs' },
      { name: 'website_tool_create_todo', description: '[github.com] Create todo' },
      { name: 'extension_tool_bookmarks', description: 'Manage bookmarks' },
      { name: 'website_tool_update_todo', description: '[localhost:3000] Update todo' },
    ];

    it('should group tools by type', () => {
      const { extensionTools, websiteTools } = groupToolsByType(mockTools);

      expect(extensionTools).toHaveLength(2);
      expect(extensionTools[0].name).toBe('extension_tool_list_tabs');
      expect(extensionTools[1].name).toBe('extension_tool_bookmarks');

      expect(websiteTools).toHaveLength(2);
      expect(websiteTools[0].name).toBe('website_tool_create_todo');
      expect(websiteTools[1].name).toBe('website_tool_update_todo');
    });
  });

  describe('groupWebsiteToolsByDomain', () => {
    const mockTools: McpTool[] = [
      { name: 'website_tool_create_todo', description: '[github.com] Create todo' },
      { name: 'website_tool_update_todo', description: '[github.com] Update todo' },
      { name: 'website_tool_create_issue', description: '[gitlab.com] Create issue' },
      { name: 'website_tool_local_todo', description: '[localhost:3000] Local todo' },
    ];

    it('should group website tools by domain', () => {
      const grouped = groupWebsiteToolsByDomain(mockTools);

      expect(grouped.size).toBe(3);
      expect(grouped.get('github.com')).toHaveLength(2);
      expect(grouped.get('gitlab.com')).toHaveLength(1);
      expect(grouped.get('localhost:3000')).toHaveLength(1);

      // Check sorting
      const domains = Array.from(grouped.keys());
      expect(domains).toEqual(['github.com', 'gitlab.com', 'localhost:3000']);
    });
  });

  describe('extractChromeApiCategory', () => {
    it('should extract Chrome API categories', () => {
      expect(extractChromeApiCategory('extension_tool_list_active_tabs')).toBe('tabs');
      expect(extractChromeApiCategory('extension_tool_create_bookmark')).toBe('bookmarks');
      expect(extractChromeApiCategory('extension_tool_get_storage')).toBe('storage');
      expect(extractChromeApiCategory('extension_tool_search_history')).toBe('history');
      expect(extractChromeApiCategory('extension_tool_create_alarm')).toBe('alarms');
      expect(extractChromeApiCategory('extension_tool_get_cookies')).toBe('cookies');
      expect(extractChromeApiCategory('extension_tool_download_file')).toBe('downloads');
      expect(extractChromeApiCategory('extension_tool_execute_script')).toBe('scripting');
      expect(extractChromeApiCategory('extension_tool_unknown_api')).toBe('other');
    });
  });

  describe('groupExtensionToolsByApi', () => {
    const mockTools: McpTool[] = [
      { name: 'extension_tool_list_active_tabs', description: 'List tabs' },
      { name: 'extension_tool_create_tab', description: 'Create tab' },
      { name: 'extension_tool_create_bookmark', description: 'Create bookmark' },
      { name: 'extension_tool_get_storage', description: 'Get storage' },
    ];

    it('should group extension tools by API', () => {
      const grouped = groupExtensionToolsByApi(mockTools);

      expect(grouped.size).toBe(3);
      expect(grouped.get('tabs')).toHaveLength(2);
      expect(grouped.get('bookmarks')).toHaveLength(1);
      expect(grouped.get('storage')).toHaveLength(1);

      // Check sorting
      const apis = Array.from(grouped.keys());
      expect(apis).toEqual(['bookmarks', 'storage', 'tabs']);
    });
  });
});
