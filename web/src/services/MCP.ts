import { TabClientTransport, TabServerTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Todo } from '../../worker/db/schema.ts';
import { userId } from '../lib/utils.ts';
import {
  getErrorMessage,
  getSortParamsFromStorage,
  isApiError,
  resetSortParams,
  todoApi,
  updateSortParams,
} from './todoService.ts';

const server = new McpServer(
  {
    name: 'TODO-APP',
    version: '1.0.0',
  },
  {
    instructions:
      'You are a helpful assistant that can create, update, and delete todos for the current user.',
  }
);

// Create Todo Tool
server.tool(
  'createTodo',
  'Creates a new todo item for the current user',
  {
    todoText: z.string().describe('The content of the todo item.') as any,
  },
  async (args) => {
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: User ID not found.' }] };
    }

    try {
      const newTodo = (await todoApi.create({
        text: args.todoText,
        userId,
      })) as Todo;

      return {
        content: [
          {
            type: 'text',
            text: `Todo created: "${args.todoText}" with ID: ${newTodo.id}`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error) ? getErrorMessage(error) : 'Failed to create todo';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Update Todo Tool
server.tool(
  'updateTodo',
  "Updates an existing todo item's text or completion status",
  {
    id: z.string().uuid().describe('The ID of the todo to update.') as any,
    text: z.string().min(1).max(1000).optional().describe('The new text for the todo.') as any,
    completed: z.boolean().optional().describe('The new completion status.') as any,
  },
  async (args) => {
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: User ID not found.' }] };
    }

    try {
      const updates: { text?: string; completed?: boolean } = {};
      if (args.text !== undefined) updates.text = args.text;
      if (args.completed !== undefined) updates.completed = args.completed;

      if (Object.keys(updates).length === 0) {
        return {
          content: [{ type: 'text', text: 'No updates provided for the todo.' }],
        };
      }

      const updatedTodo = (await todoApi.update(args.id, updates)) as Todo;

      return {
        content: [
          {
            type: 'text',
            text: `Todo updated successfully: "${updatedTodo.text}" (completed: ${updatedTodo.completed})`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error) ? getErrorMessage(error) : 'Failed to update todo';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Delete Todo Tool
server.tool(
  'deleteTodo',
  'Permanently deletes a todo item by its ID',
  {
    id: z.string().uuid().describe('The ID of the todo to delete.') as any,
  },
  async (args) => {
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: User ID not found.' }] };
    }

    try {
      await todoApi.delete(args.id);
      return { content: [{ type: 'text', text: 'Todo deleted successfully' }] };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error) ? getErrorMessage(error) : 'Failed to delete todo';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Delete All Todos Tool
server.tool(
  'deleteAllTodos',
  'Permanently deletes all todo items for the current user',
  {},
  async () => {
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: User ID not found.' }] };
    }

    try {
      await todoApi.deleteAllForUser(userId);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted all todos`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error)
        ? getErrorMessage(error)
        : 'Failed to delete all todos';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Get User's Todos Tool
server.tool(
  'getTodos',
  'Retrieves a list of todos for the current user with filtering, sorting, and pagination options',
  {
    completed: z
      .boolean()
      .optional()
      .default(false)
      .describe('Filter todos by completion status') as any,
    sortBy: z
      .enum(['text', 'completed', 'created_at', 'updated_at'])
      .optional()
      .default('text')
      .describe('Field to sort by') as any,
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc').describe('Sort order') as any,
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .default(50)
      .describe('Maximum number of todos to return') as any,
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe('Number of todos to skip') as any,
    search: z.string().optional().default('').describe('Search text within todo text') as any,
  },
  async (args) => {
    if (!userId) {
      return { content: [{ type: 'text', text: 'Error: User ID not found.' }] };
    }

    try {
      const queryParams = {
        completed: args.completed,
        sortBy: args.sortBy,
        sortOrder: args.sortOrder,
        limit: args.limit,
        offset: args.offset,
        search: args.search,
      };

      const todos = (await todoApi.getForUser(userId, queryParams)) as Todo[];

      return {
        content: [
          {
            type: 'text',
            text: `Found ${todos.length} todos:\n${JSON.stringify(todos, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error) ? getErrorMessage(error) : 'Failed to retrieve todos';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Get Single Todo Tool
server.tool(
  'getTodo',
  'Retrieves a specific todo item by its ID',
  {
    id: z.string().uuid().describe('The ID of the todo to retrieve.') as any,
  },
  async (args) => {
    try {
      const todo = await todoApi.getById(args.id);
      return {
        content: [
          {
            type: 'text',
            text: `Todo details:\n${JSON.stringify(todo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error) ? getErrorMessage(error) : 'Failed to retrieve todo';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

// Sort Management Tools
server.tool(
  'setSortCriteria',
  'Updates the default sorting and filtering criteria for todo queries',
  {
    sortBy: z
      .enum(['text', 'completed', 'created_at', 'updated_at'])
      .optional()
      .describe('Field to sort todos by') as any,
    sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order') as any,
    completed: z.boolean().optional().describe('Filter by completion status') as any,
    search: z.string().optional().describe('Search text filter') as any,
  },
  async (args) => {
    try {
      const updates = Object.fromEntries(
        Object.entries(args).filter(([_, value]) => value !== undefined)
      );

      updateSortParams(updates);

      const descriptions: string[] = [];
      if (updates.sortBy) descriptions.push(`sorting by ${updates.sortBy}`);
      if (updates.sortOrder) descriptions.push(`in ${updates.sortOrder}ending order`);
      if (updates.completed !== undefined)
        descriptions.push(`showing ${updates.completed ? 'completed' : 'incomplete'} todos only`);
      if (updates.search) descriptions.push(`filtering by search: "${updates.search}"`);

      const message =
        descriptions.length > 0
          ? `Sort criteria updated: ${descriptions.join(', ')}`
          : 'No sort criteria specified.';

      return { content: [{ type: 'text', text: message as string }] };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error)
        ? getErrorMessage(error)
        : 'Failed to update sort criteria';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

server.tool(
  'getSortCriteria',
  'Retrieves the current default sorting and filtering criteria',
  {},
  async () => {
    try {
      const params = getSortParamsFromStorage();
      const details = [
        `Sort by: ${params.sortBy}`,
        `Sort order: ${params.sortOrder}`,
        `Completed filter: ${params.completed === undefined ? 'all todos' : params.completed ? 'completed only' : 'incomplete only'}`,
        `Search filter: ${params.search || 'none'}`,
      ];

      return {
        content: [
          {
            type: 'text',
            text: `Current sort criteria:\n${details.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error)
        ? getErrorMessage(error)
        : 'Failed to get sort criteria';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

server.tool(
  'resetSortCriteria',
  'Resets all sorting and filtering criteria to their default values',
  {},
  async () => {
    try {
      resetSortParams();
      return {
        content: [{ type: 'text', text: 'Sort criteria reset to defaults' }],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      const errorMessage = isApiError(error)
        ? getErrorMessage(error)
        : 'Failed to reset sort criteria';
      return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
    }
  }
);

export const initializeMcpServer = async () => {
  try {
    const transport = new TabServerTransport();
    await server.connect(transport);
    console.log(server);
    console.log('MCP Server connected successfully');
  } catch (error) {
    console.error('Failed to connect MCP Server:', error);
  }
};

const SidebarClient = new Client({ name: 'Sidebar', version: '1.0.0' });
const SidebarTransport = new TabClientTransport({
  clientInstanceId: 'sidebar',
  connectionTimeout: 10000,
  globalNamespace: 'mcp',
  reconnectionOptions: {
    maxReconnectionDelay: 10000,
    initialReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.5,
    maxRetries: 3,
  },
});

const AssistantClient = new Client({ name: 'Assistant', version: '1.0.0' });
const AssistantTransport = new TabClientTransport({
  clientInstanceId: 'assistant',
  connectionTimeout: 10000,
  globalNamespace: 'mcp',
  reconnectionOptions: {
    maxReconnectionDelay: 10000,
    initialReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.5,
    maxRetries: 3,
  },
});

const BlogPostClient = new Client({ name: 'BlogPost', version: '1.0.0' });
const BlogPostTransport = new TabClientTransport({
  clientInstanceId: 'blogpost',
  connectionTimeout: 10000,
  globalNamespace: 'mcp',
  reconnectionOptions: {
    maxReconnectionDelay: 10000,
    initialReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.5,
    maxRetries: 3,
  },
});

export {
  SidebarClient,
  AssistantClient,
  SidebarTransport,
  AssistantTransport,
  BlogPostClient,
  BlogPostTransport,
};
