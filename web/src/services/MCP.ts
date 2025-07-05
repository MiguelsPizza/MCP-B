import { TabClientTransport, TabServerTransport } from '@mcp-b/transports';
import { PromptApiTools } from '@mcp-b/web-tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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

const generateServer = (): McpServer => {
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
      todoText: z.string().describe('The content of the todo item.'),
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
      id: z.string().uuid().describe('The ID of the todo to update.'),
      text: z.string().min(1).max(1000).optional().describe('The new text for the todo.'),
      completed: z.boolean().optional().describe('The new completion status.'),
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
      id: z.string().uuid().describe('The ID of the todo to delete.'),
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
        .describe('Filter todos by completion status'),
      sortBy: z
        .enum(['text', 'completed', 'created_at', 'updated_at'])
        .optional()
        .default('text')
        .describe('Field to sort by'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc').describe('Sort order'),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .default(50)
        .describe('Maximum number of todos to return'),
      offset: z.number().int().min(0).optional().default(0).describe('Number of todos to skip'),
      search: z.string().optional().default('').describe('Search text within todo text'),
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

        const todos = await todoApi.getForUser(userId, queryParams);

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
        const errorMessage = isApiError(error)
          ? getErrorMessage(error)
          : 'Failed to retrieve todos';
        return { content: [{ type: 'text', text: `Error: ${errorMessage}` }] };
      }
    }
  );

  // Get Single Todo Tool
  server.tool(
    'getTodo',
    'Retrieves a specific todo item by its ID',
    {
      id: z.string().uuid().describe('The ID of the todo to retrieve.'),
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

  return server;
};

// export const initializeMcpServer = async () => {
//   try {
//     const server = generateServer();
//     const transport = new TabServerTransport({
//       allowedOrigins: ['*'],
//     });
//     await server.connect(transport);
//     console.log(server);
//     console.log('MCP Server connected successfully');
//   } catch (error) {
//     console.error('Failed to connect MCP Server:', error);
//   }
// };

const initializeInMemoryServer = () => {
  const server = generateServer();
  const promptApiTools = new PromptApiTools(server);
  promptApiTools.register();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  server.connect(serverTransport);
  return { clientTransport, serverTransport };
};

const SidebarClient = new Client({ name: 'Sidebar', version: '1.0.0' });
export const { clientTransport: SidebarTransport, serverTransport: SidebarServerTransport } =
  initializeInMemoryServer();

const AssistantClient = new Client({ name: 'Assistant', version: '1.0.0' });
export const { clientTransport: AssistantTransport, serverTransport: AssistantServerTransport } =
  initializeInMemoryServer();

const BlogPostClient = new Client({ name: 'BlogPost', version: '1.0.0' });
export const { clientTransport: BlogPostTransport, serverTransport: BlogPostServerTransport } =
  initializeInMemoryServer();

export { SidebarClient, AssistantClient, BlogPostClient };
