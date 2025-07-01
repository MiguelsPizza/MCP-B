import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface BookmarksApiToolsOptions {
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

export class BookmarksApiTools extends BaseApiTools {
  protected apiName = 'Bookmarks';

  constructor(server: McpServer, options: BookmarksApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.bookmarks) {
        return {
          available: false,
          message: 'chrome.bookmarks API is not defined',
          details: 'This extension needs the "bookmarks" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.bookmarks.getTree !== 'function') {
        return {
          available: false,
          message: 'chrome.bookmarks.getTree is not available',
          details:
            'The bookmarks API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
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
    if (this.shouldRegisterTool('create')) {
      this.registerCreate();
    }

    if (this.shouldRegisterTool('get')) {
      this.registerGet();
    }

    if (this.shouldRegisterTool('getChildren')) {
      this.registerGetChildren();
    }

    if (this.shouldRegisterTool('getRecent')) {
      this.registerGetRecent();
    }

    if (this.shouldRegisterTool('getSubTree')) {
      this.registerGetSubTree();
    }

    if (this.shouldRegisterTool('getTree')) {
      this.registerGetTree();
    }

    if (this.shouldRegisterTool('move')) {
      this.registerMove();
    }

    if (this.shouldRegisterTool('remove')) {
      this.registerRemove();
    }

    if (this.shouldRegisterTool('removeTree')) {
      this.registerRemoveTree();
    }

    if (this.shouldRegisterTool('search')) {
      this.registerSearch();
    }

    if (this.shouldRegisterTool('update')) {
      this.registerUpdate();
    }
  }

  private registerCreate(): void {
    this.server.registerTool(
      'extension_tool_create_bookmark',
      {
        description:
          'Create a bookmark or folder under the specified parent. If url is not provided, it will be a folder',
        inputSchema: {
          parentId: z
            .string()
            .optional()
            .describe('Parent folder ID. Defaults to the Other Bookmarks folder'),
          title: z.string().optional().describe('The title of the bookmark or folder'),
          url: z.string().optional().describe('The URL for the bookmark. Omit for folders'),
          index: z.number().optional().describe('The position within the parent folder'),
        },
      },
      async ({ parentId, title, url, index }) => {
        try {
          const createDetails: chrome.bookmarks.CreateDetails = {};

          if (parentId !== undefined) createDetails.parentId = parentId;
          if (title !== undefined) createDetails.title = title;
          if (url !== undefined) createDetails.url = url;
          if (index !== undefined) createDetails.index = index;

          const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
            chrome.bookmarks.create(createDetails, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGet(): void {
    this.server.registerTool(
      'extension_tool_get_bookmark',
      {
        description: 'Retrieve the specified bookmark(s) by ID',
        inputSchema: {
          idOrIdList: z
            .union([z.string(), z.array(z.string())])
            .describe('A single bookmark ID or array of bookmark IDs'),
        },
      },
      async ({ idOrIdList }) => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.get(idOrIdList as any, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetChildren(): void {
    this.server.registerTool(
      'extension_tool_get_bookmark_children',
      {
        description: 'Retrieve the children of the specified bookmark folder',
        inputSchema: {
          id: z.string().describe('The ID of the folder to get children from'),
        },
      },
      async ({ id }) => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.getChildren(id, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetRecent(): void {
    this.server.registerTool(
      'extension_tool_get_recent_bookmarks',
      {
        description: 'Retrieve the recently added bookmarks',
        inputSchema: {
          numberOfItems: z.number().min(1).describe('The maximum number of items to return'),
        },
      },
      async ({ numberOfItems }) => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.getRecent(numberOfItems, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetSubTree(): void {
    this.server.registerTool(
      'extension_tool_get_bookmark_subtree',
      {
        description: 'Retrieve part of the bookmarks hierarchy, starting at the specified node',
        inputSchema: {
          id: z.string().describe('The ID of the root of the subtree to retrieve'),
        },
      },
      async ({ id }) => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.getSubTree(id, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetTree(): void {
    this.server.registerTool(
      'extension_tool_get_bookmark_tree',
      {
        description: 'Retrieve the entire bookmarks hierarchy',
        inputSchema: {},
      },
      async () => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.getTree((results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerMove(): void {
    this.server.registerTool(
      'extension_tool_move_bookmark',
      {
        description: 'Move the specified bookmark or folder to a new location',
        inputSchema: {
          id: z.string().describe('The ID of the bookmark or folder to move'),
          parentId: z.string().optional().describe('The new parent folder ID'),
          index: z.number().optional().describe('The new position within the parent folder'),
        },
      },
      async ({ id, parentId, index }) => {
        try {
          const destination: { parentId?: string; index?: number } = {};
          if (parentId !== undefined) destination.parentId = parentId;
          if (index !== undefined) destination.index = index;

          const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
            chrome.bookmarks.move(id, destination, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemove(): void {
    this.server.registerTool(
      'extension_tool_remove_bookmark',
      {
        description: 'Remove a bookmark or an empty bookmark folder',
        inputSchema: {
          id: z.string().describe('The ID of the bookmark or empty folder to remove'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.bookmarks.remove(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Bookmark removed successfully', { id });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveTree(): void {
    this.server.registerTool(
      'extension_tool_remove_bookmark_tree',
      {
        description: 'Recursively remove a bookmark folder and all its contents',
        inputSchema: {
          id: z.string().describe('The ID of the folder to remove recursively'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.bookmarks.removeTree(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Bookmark folder and all contents removed successfully', {
            id,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSearch(): void {
    this.server.registerTool(
      'extension_tool_search_bookmarks',
      {
        description: 'Search for bookmarks matching the given query',
        inputSchema: {
          query: z
            .union([
              z.string(),
              z.object({
                query: z
                  .string()
                  .optional()
                  .describe('Words and phrases to match against URLs and titles'),
                url: z.string().optional().describe('URL to match exactly'),
                title: z.string().optional().describe('Title to match exactly'),
              }),
            ])
            .describe('Search query string or object with specific search criteria'),
        },
      },
      async ({ query }) => {
        try {
          const results = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>(
            (resolve, reject) => {
              chrome.bookmarks.search(query, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdate(): void {
    this.server.registerTool(
      'extension_tool_update_bookmark',
      {
        description:
          'Update the properties of a bookmark or folder. Only title and url can be changed',
        inputSchema: {
          id: z.string().describe('The ID of the bookmark or folder to update'),
          title: z.string().optional().describe('The new title'),
          url: z.string().optional().describe('The new URL (bookmarks only)'),
        },
      },
      async ({ id, title, url }) => {
        try {
          const changes: { title?: string; url?: string } = {};
          if (title !== undefined) changes.title = title;
          if (url !== undefined) changes.url = url;

          if (Object.keys(changes).length === 0) {
            return this.formatError(
              'At least one property (title or url) must be specified to update'
            );
          }

          const result = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
            chrome.bookmarks.update(id, changes, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
