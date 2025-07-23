import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { todoService } from './todoService.ts';

const generateServer = (): McpServer => {
  const server = new McpServer(
    {
      name: 'TODO-APP',
      version: '1.0.0',
    },
    {
      instructions: 'You are a helpful assistant that can create, update, and delete todos.',
    }
  );

  // Create Todo Tool
  server.tool(
    'createTodo',
    'Creates a new todo item',
    {
      todoText: z.string().describe('The content of the todo item.'),
    },
    async (args) => {
      try {
        const newTodo = await todoService.create(args.todoText);

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
        return { content: [{ type: 'text', text: 'Error: Failed to create todo' }] };
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
      try {
        const updates: { text?: string; completed?: boolean } = {};
        if (args.text !== undefined) updates.text = args.text;
        if (args.completed !== undefined) updates.completed = args.completed;

        if (Object.keys(updates).length === 0) {
          return {
            content: [{ type: 'text', text: 'No updates provided for the todo.' }],
          };
        }

        const updatedTodo = await todoService.update(args.id, updates);

        if (!updatedTodo) {
          return { content: [{ type: 'text', text: 'Error: Todo not found' }] };
        }

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
        return { content: [{ type: 'text', text: 'Error: Failed to update todo' }] };
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
      try {
        const success = await todoService.delete(args.id);

        if (!success) {
          return { content: [{ type: 'text', text: 'Error: Todo not found' }] };
        }

        return { content: [{ type: 'text', text: 'Todo deleted successfully' }] };
      } catch (error) {
        console.error('MCP Tool Error:', error);
        return { content: [{ type: 'text', text: 'Error: Failed to delete todo' }] };
      }
    }
  );

  // Delete All Todos Tool
  server.tool('deleteAllTodos', 'Permanently deletes all todo items', {}, async () => {
    try {
      await todoService.deleteAll();
      return {
        content: [
          {
            type: 'text',
            text: 'Successfully deleted all todos',
          },
        ],
      };
    } catch (error) {
      console.error('MCP Tool Error:', error);
      return { content: [{ type: 'text', text: 'Error: Failed to delete all todos' }] };
    }
  });

  // Get Todos Tool
  server.tool('getTodos', 'Retrieves a list of all todos', {}, async () => {
    try {
      const todos = todoService.getAll();

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
      return { content: [{ type: 'text', text: 'Error: Failed to retrieve todos' }] };
    }
  });

  return server;
};

const initializeInMemoryServer = () => {
  const server = generateServer();
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

export { AssistantClient, BlogPostClient, SidebarClient };
