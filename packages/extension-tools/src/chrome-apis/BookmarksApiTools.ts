import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface BookmarksApiToolsOptions {
  // Gate specific actions (default to enabled)
  create?: boolean;
  get?: boolean;
  getChildren?: boolean;
  getRecent?: boolean;
  getSubTree?: boolean;
  getTree?: boolean;
  move?: boolean;
  remove?: boolean;
  removeTree?: boolean;
  search?: boolean;
  update?: boolean;
}

export const BOOKMARK_ACTIONS = [
  'create',
  'get',
  'getChildren',
  'getRecent',
  'getSubTree',
  'getTree',
  'move',
  'remove',
  'removeTree',
  'search',
  'update',
] as const;

type BookmarkAction = (typeof BOOKMARK_ACTIONS)[number];

const bookmarkActionSchema = z.enum(BOOKMARK_ACTIONS);

export class BookmarksApiTools extends BaseApiTools {
  protected apiName = 'Bookmarks';

  constructor(server: McpServer, options: BookmarksApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      if (!chrome.bookmarks) {
        return {
          available: false,
          message: 'chrome.bookmarks API is not defined',
          details: 'This extension needs the "bookmarks" permission in its manifest.json',
        };
      }

      if (typeof chrome.bookmarks.getTree !== 'function') {
        return {
          available: false,
          message: 'chrome.bookmarks.getTree is not available',
          details:
            'The bookmarks API appears to be partially available. Check manifest permissions.',
        };
      }

      chrome.bookmarks.getTree((_bookmarks) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Bookmarks API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.bookmarks API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    // Unified tool: action-based multiplexer
    this.server.registerTool(
      'extension_tool_bookmark_operations',
      {
        description:
          'Perform bookmark operations. Choose an action and supply the corresponding parameters.',
        // Keep top-level schema simple and validate per-action in handler for robust errors
        inputSchema: {
          action: bookmarkActionSchema,
          // Parameters vary by action; validated in handler using specific schemas
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          // Gate action by options
          if (!this.isActionEnabled(action)) {
            return this.formatError(`Action '${action}' is disabled by configuration`);
          }

          switch (action as BookmarkAction) {
            case 'create':
              return await this.handleCreate(params);
            case 'get':
              return await this.handleGet(params);
            case 'getChildren':
              return await this.handleGetChildren(params);
            case 'getRecent':
              return await this.handleGetRecent(params);
            case 'getSubTree':
              return await this.handleGetSubTree(params);
            case 'getTree':
              return await this.handleGetTree();
            case 'move':
              return await this.handleMove(params);
            case 'remove':
              return await this.handleRemove(params);
            case 'removeTree':
              return await this.handleRemoveTree(params);
            case 'search':
              return await this.handleSearch(params);
            case 'update':
              return await this.handleUpdate(params);
            default:
              return this.formatError(`Unknown action: ${String(action)}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_bookmark_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_bookmark_operations tool and the description for the associated action, this tool should be used first before extension_tool_bookmark_operations',
        inputSchema: {
          action: bookmarkActionSchema,
        },
      },
      async ({ action }) => {
        try {
          // Gate action by options
          if (!this.isActionEnabled(action)) {
            return this.formatError(`Action '${action}' is disabled by configuration`);
          }

          // Build JSON Schema for the params of the requested action so an LLM can construct a valid call
          const toJson = (schema: z.ZodTypeAny, name: string) =>
            zodToJsonSchema(schema, { name, $refStrategy: 'none' });

          const payloadBase = {
            tool: 'extension_tool_bookmark_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as BookmarkAction) {
            case 'create': {
              const paramsJsonSchema = toJson(this.createSchema, 'BookmarksCreateParams');
              const example = { title: 'My Site', url: 'https://example.com', parentId: '1' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description:
                  'Create a bookmark or folder under the specified parent. A folder must have a title and no url',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'get': {
              const paramsJsonSchema = toJson(this.getSchema, 'BookmarksGetParams');
              const example = { idOrIdList: '123' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Retrieve the specified bookmark(s) by ID',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'getChildren': {
              const paramsJsonSchema = toJson(this.getChildrenSchema, 'BookmarksGetChildrenParams');
              const example = { id: '1' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Retrieve the children of the specified bookmark folder',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'getRecent': {
              const paramsJsonSchema = toJson(this.getRecentSchema, 'BookmarksGetRecentParams');
              const example = { numberOfItems: 10 };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Retrieve the recently added bookmarks',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'getSubTree': {
              const paramsJsonSchema = toJson(this.getSubTreeSchema, 'BookmarksGetSubTreeParams');
              const example = { id: '1' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description:
                  'Retrieve part of the bookmarks hierarchy, starting at the specified node',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'getTree': {
              // No params required
              const paramsJsonSchema = {
                type: 'object',
                properties: {},
                additionalProperties: false,
              } as const;
              const example = {};
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Retrieve the entire bookmarks hierarchy',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'move': {
              const paramsJsonSchema = toJson(this.moveSchema, 'BookmarksMoveParams');
              const example = { id: '123', parentId: '1', index: 0 };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Move the specified bookmark or folder to a new location',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'remove': {
              const paramsJsonSchema = toJson(this.removeSchema, 'BookmarksRemoveParams');
              const example = { id: '123' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Remove the specified bookmark or empty folder',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'removeTree': {
              const paramsJsonSchema = toJson(this.removeTreeSchema, 'BookmarksRemoveTreeParams');
              const example = { id: '1' };
              const paramAndDescription = {
                params: paramsJsonSchema,
                description: 'Recursively remove a bookmark folder and all its contents',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription, example });
            }
            case 'search': {
              const paramsJsonSchema = toJson(this.searchSchema, 'BookmarksSearchParams');
              const example = { query: 'recipes' };
              const paramsAndDescription = {
                params: paramsJsonSchema,
                description: 'Search for bookmarks matching the given query',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription, example });
            }
            case 'update': {
              const paramsJsonSchema = toJson(this.updateSchema, 'BookmarksUpdateParams');
              const example = { id: '123', title: 'New title' };
              const paramsAndDescription = {
                params: paramsJsonSchema,
                description:
                  'Update the properties of a bookmark or folder. Only title and url can be changed',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription, example });
            }
            default:
              return this.formatError(`Unknown action: ${String(action)}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  // ===== Validation Schemas per action =====
  private createSchema = z.object({
    parentId: z
      .string()
      .optional()
      .describe('Parent folder ID. Defaults to the Other Bookmarks folder'),
    title: z.string().optional().describe('The title of the bookmark or folder'),
    url: z.string().optional().describe('The URL for the bookmark. Omit for folders'),
    index: z.number().optional().describe('The position within the parent folder'),
  });

  private getSchema = z.object({
    idOrIdList: z
      .union([z.string(), z.array(z.string())])
      .describe('A single bookmark ID or array of bookmark IDs'),
  });

  private getChildrenSchema = z.object({
    id: z.string().describe('The ID of the folder to get children from'),
  });

  private getRecentSchema = z.object({
    numberOfItems: z.number().min(1).describe('The maximum number of items to return'),
  });

  private getSubTreeSchema = z.object({
    id: z.string().describe('The ID of the root of the subtree to retrieve'),
  });

  private moveSchema = z.object({
    id: z.string().describe('The ID of the bookmark or folder to move'),
    parentId: z.string().optional().describe('The new parent folder ID'),
    index: z.number().optional().describe('The new position within the parent folder'),
  });

  private removeSchema = z.object({
    id: z.string().describe('The ID of the bookmark or empty folder to remove'),
  });

  private removeTreeSchema = z.object({
    id: z.string().describe('The ID of the folder to remove recursively'),
  });

  private searchSchema = z.object({
    query: z.union([
      z.string(),
      z.object({
        query: z.string().optional().describe('Words and phrases to match against URLs and titles'),
        url: z.string().optional().describe('URL to match exactly'),
        title: z.string().optional().describe('Title to match exactly'),
      }),
    ]),
  });

  private updateSchema = z.object({
    id: z.string().describe('The ID of the bookmark or folder to update'),
    title: z.string().optional().describe('The new title'),
    url: z.string().optional().describe('The new URL (bookmarks only)'),
  });

  // ===== Action handlers =====
  private async handleCreate(raw: unknown) {
    const { parentId, title, url, index } = this.createSchema.parse(raw);
    if (title === undefined && url === undefined) {
      throw new Error('Either title or url must be provided');
    }
    if (title?.length === 0 && url?.length === 0) {
      throw new Error('Either title or url must be provided');
    }
    const createDetails: chrome.bookmarks.CreateDetails = {};
    if (parentId !== undefined) createDetails.parentId = parentId;
    if (title !== undefined) createDetails.title = title;
    if (url !== undefined) createDetails.url = url;
    if (index !== undefined) createDetails.index = index;

    const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
      chrome.bookmarks.create(createDetails, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatJson({
      id: result.id,
      title: result.title,
      url: result.url,
      parentId: result.parentId,
      index: result.index,
      dateAdded: result.dateAdded,
      type: result.url ? 'bookmark' : 'folder',
    });
  }

  private async handleGet(raw: unknown) {
    const { idOrIdList } = this.getSchema.parse(raw);
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.get(idOrIdList as any, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatJson({
      count: results.length,
      bookmarks: results.map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        index: bookmark.index,
        dateAdded: bookmark.dateAdded,
        dateAddedFormatted: bookmark.dateAdded
          ? new Date(bookmark.dateAdded).toISOString()
          : undefined,
        type: bookmark.url ? 'bookmark' : 'folder',
      })),
    });
  }

  private async handleGetChildren(raw: unknown) {
    const { id } = this.getChildrenSchema.parse(raw);
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.getChildren(id, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatJson({
      parentId: id,
      count: results.length,
      children: results.map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        index: bookmark.index,
        dateAdded: bookmark.dateAdded,
        dateAddedFormatted: bookmark.dateAdded
          ? new Date(bookmark.dateAdded).toISOString()
          : undefined,
        type: bookmark.url ? 'bookmark' : 'folder',
      })),
    });
  }

  private async handleGetRecent(raw: unknown) {
    const { numberOfItems } = this.getRecentSchema.parse(raw);
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.getRecent(numberOfItems, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatJson({
      count: results.length,
      recentBookmarks: results.map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        index: bookmark.index,
        dateAdded: bookmark.dateAdded,
        dateAddedFormatted: bookmark.dateAdded
          ? new Date(bookmark.dateAdded).toISOString()
          : undefined,
      })),
    });
  }

  private async handleGetSubTree(raw: unknown) {
    const { id } = this.getSubTreeSchema.parse(raw);
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.getSubTree(id, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    const formatNode = (node: chrome.bookmarks.BookmarkTreeNode): any => ({
      id: node.id,
      title: node.title,
      url: node.url,
      parentId: node.parentId,
      index: node.index,
      dateAdded: node.dateAdded,
      dateAddedFormatted: node.dateAdded ? new Date(node.dateAdded).toISOString() : undefined,
      type: node.url ? 'bookmark' : 'folder',
      children: node.children ? node.children.map(formatNode) : undefined,
    });

    return this.formatJson({
      rootId: id,
      subtree: results.map(formatNode),
    });
  }

  private async handleGetTree() {
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.getTree((res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    const formatNode = (node: chrome.bookmarks.BookmarkTreeNode): any => ({
      id: node.id,
      title: node.title,
      url: node.url,
      parentId: node.parentId,
      index: node.index,
      dateAdded: node.dateAdded,
      dateAddedFormatted: node.dateAdded ? new Date(node.dateAdded).toISOString() : undefined,
      type: node.url ? 'bookmark' : 'folder',
      children: node.children ? node.children.map(formatNode) : undefined,
    });

    return this.formatJson({
      tree: results.map(formatNode),
    });
  }

  private async handleMove(raw: unknown) {
    const { id, parentId, index } = this.moveSchema.parse(raw);
    const destination: { parentId?: string; index?: number } = {};
    if (parentId !== undefined) destination.parentId = parentId;
    if (index !== undefined) destination.index = index;

    const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
      chrome.bookmarks.move(id, destination, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatSuccess('Bookmark moved successfully', {
      id: result.id,
      title: result.title,
      url: result.url,
      parentId: result.parentId,
      index: result.index,
      type: result.url ? 'bookmark' : 'folder',
    });
  }

  private async handleRemove(raw: unknown) {
    const { id } = this.removeSchema.parse(raw);
    await new Promise<void>((resolve, reject) => {
      chrome.bookmarks.remove(id, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
    return this.formatSuccess('Bookmark removed successfully', { id });
  }

  private async handleRemoveTree(raw: unknown) {
    const { id } = this.removeTreeSchema.parse(raw);
    await new Promise<void>((resolve, reject) => {
      chrome.bookmarks.removeTree(id, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
    return this.formatSuccess('Bookmark folder and all contents removed successfully', { id });
  }

  private async handleSearch(raw: unknown) {
    const { query } = this.searchSchema.parse(raw);
    const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
      chrome.bookmarks.search(query as any, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatJson({
      query: typeof query === 'string' ? query : JSON.stringify(query),
      count: results.length,
      results: results.map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        parentId: bookmark.parentId,
        index: bookmark.index,
        dateAdded: bookmark.dateAdded,
        dateAddedFormatted: bookmark.dateAdded
          ? new Date(bookmark.dateAdded).toISOString()
          : undefined,
        type: bookmark.url ? 'bookmark' : 'folder',
      })),
    });
  }

  private async handleUpdate(raw: unknown) {
    const { id, title, url } = this.updateSchema.parse(raw);
    const changes: { title?: string; url?: string } = {};
    if (title !== undefined) changes.title = title;
    if (url !== undefined) changes.url = url;

    if (Object.keys(changes).length === 0) {
      return this.formatError('At least one property (title or url) must be specified to update');
    }

    const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
      chrome.bookmarks.update(id, changes, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });

    return this.formatSuccess('Bookmark updated successfully', {
      id: result.id,
      title: result.title,
      url: result.url,
      parentId: result.parentId,
      index: result.index,
      type: result.url ? 'bookmark' : 'folder',
      changes,
    });
  }

  // ===== Helpers =====
  private isActionEnabled(action: BookmarkAction): boolean {
    // By default, all actions are enabled unless explicitly set to false in options
    const map: Record<BookmarkAction, keyof BookmarksApiToolsOptions> = {
      create: 'create',
      get: 'get',
      getChildren: 'getChildren',
      getRecent: 'getRecent',
      getSubTree: 'getSubTree',
      getTree: 'getTree',
      move: 'move',
      remove: 'remove',
      removeTree: 'removeTree',
      search: 'search',
      update: 'update',
    };
    const key = map[action];
    const optVal = (this.options as BookmarksApiToolsOptions)[key];
    return optVal !== false;
  }
}
