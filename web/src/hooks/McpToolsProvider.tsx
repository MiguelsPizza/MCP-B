import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Todo } from 'worker/db/schema';
import { z } from 'zod';
import { getErrorMessage, isApiError, todoApi } from '@/services/todoService';
import { userId } from '../lib/utils';
import { server } from '../TabServer';
// Component to handle MCP tool registration
export function McpToolsProvider({
  children,
  cache = false,
}: {
  children: React.ReactNode;
  cache?: boolean;
}) {
  const navigate = useNavigate({ from: '/assistant' });
  const registeredToolsRef = useRef<Map<string, RegisteredTool>>(new Map());

  useEffect(() => {
    // Helper function to register a tool
    const registerTool = (name: string, tool: RegisteredTool) => {
      if (registeredToolsRef.current.has(name)) {
        return;
      }
      registeredToolsRef.current.set(name, tool);
    };

    // Create Todo Tool
    try {
      const createTodoTool = server.registerTool(
        'createTodo',
        {
          title: 'Create Todo',
          description: 'Creates a new todo item for the current user',
          inputSchema: {
            todoText: z.string().describe('The content of the todo item.') as any,
          },
          annotations: {
            title: 'Create Todo',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
            cache,
          },
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          if (!userId) {
            toast.error('User ID not found');
            return {
              content: [{ type: 'text', text: 'Error: User ID not found.' }],
            };
          }

          try {
            const newTodo = (await todoApi.create({
              text: args.todoText,
              userId,
            })) as Todo;

            toast.success('Todo created', {
              description: `"${args.todoText}" has been added to your list`,
            });

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
            const errorMessage = isApiError(error)
              ? getErrorMessage(error)
              : 'Failed to create todo';
            toast.error('Failed to create todo', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('createTodo', createTodoTool);
    } catch (error) {
      console.warn('Tool createTodo registration failed:', error);
    }

    // Update Todo Tool
    try {
      const updateTodoTool = server.registerTool(
        'updateTodo',
        {
          title: 'Update Todo',
          description: "Updates an existing todo item's text or completion status",
          inputSchema: {
            id: z.string().uuid().describe('The ID of the todo to update.'),
            text: z.string().min(1).max(1000).optional().describe('The new text for the todo.'),
            completed: z.boolean().optional().describe('The new completion status.'),
          },
          annotations: {
            title: 'Update Todo',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          if (!userId) {
            toast.error('User ID not found');
            return {
              content: [{ type: 'text', text: 'Error: User ID not found.' }],
            };
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

            toast.success('Todo updated', {
              description:
                args.completed !== undefined
                  ? args.completed
                    ? 'Todo marked as completed'
                    : 'Todo marked as incomplete'
                  : 'Todo text updated',
            });

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
            const errorMessage = isApiError(error)
              ? getErrorMessage(error)
              : 'Failed to update todo';
            toast.error('Failed to update todo', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('updateTodo', updateTodoTool);
    } catch (error) {
      console.warn('Tool updateTodo registration failed:', error);
    }

    // Delete Todo Tool
    try {
      const deleteTodoTool = server.registerTool(
        'deleteTodo',
        {
          title: 'Delete Todo',
          description: 'Permanently deletes a todo item by its ID',
          inputSchema: {
            id: z.string().uuid().describe('The ID of the todo to delete.'),
          },
          annotations: {
            title: 'Delete Todo',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
          // ...(cache && { _meta: { cache: true } }),
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          if (!userId) {
            toast.error('User ID not found');
            return {
              content: [{ type: 'text', text: 'Error: User ID not found.' }],
            };
          }

          try {
            await todoApi.delete(args.id);
            toast.success('Todo deleted');
            return {
              content: [{ type: 'text', text: 'Todo deleted successfully' }],
            };
          } catch (error) {
            console.error('MCP Tool Error:', error);
            const errorMessage = isApiError(error)
              ? getErrorMessage(error)
              : 'Failed to delete todo';
            toast.error('Failed to delete todo', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('deleteTodo', deleteTodoTool);
    } catch (error) {
      console.warn('Tool deleteTodo registration failed:', error);
    }

    // Delete All Todos Tool
    try {
      const deleteAllTodosTool = server.registerTool(
        'deleteAllTodos',
        {
          title: 'Delete All Todos',
          description: 'Permanently deletes all todo items for the current user',
          inputSchema: {},
          annotations: {
            title: 'Delete All Todos',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
        },
        async () => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          if (!userId) {
            toast.error('User ID not found');
            return {
              content: [{ type: 'text', text: 'Error: User ID not found.' }],
            };
          }

          try {
            await todoApi.deleteAllForUser(userId);
            toast.success('All todos deleted', {
              description: 'Your todo list has been cleared',
            });
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
            toast.error('Failed to delete all todos', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('deleteAllTodos', deleteAllTodosTool);
    } catch (error) {
      console.warn('Tool deleteAllTodos registration failed:', error);
    }

    // Get Todos Tool
    try {
      const getTodosTool = server.registerTool(
        'getTodos',
        {
          title: 'Get Todos',
          description:
            'Retrieves a list of todos for the current user with filtering, sorting, and pagination options',
          inputSchema: {
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
            offset: z
              .number()
              .int()
              .min(0)
              .optional()
              .default(0)
              .describe('Number of todos to skip'),
            search: z.string().optional().default('').describe('Search text within todo text'),
          },
          annotations: {
            title: 'Get Todos',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          if (!userId) {
            toast.error('User ID not found');
            return {
              content: [{ type: 'text', text: 'Error: User ID not found.' }],
            };
          }

          try {
            const queryParams = {
              completed: args.completed?.toString(),
              sortBy: args.sortBy,
              sortOrder: args.sortOrder,
              limit: args.limit?.toString(),
              offset: args.offset?.toString(),
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
            const errorMessage = isApiError(error)
              ? getErrorMessage(error)
              : 'Failed to retrieve todos';
            toast.error('Failed to retrieve todos', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('getTodos', getTodosTool);
    } catch (error) {
      console.warn('Tool getTodos registration failed:', error);
    }

    // Get Single Todo Tool
    try {
      const getTodoTool = server.registerTool(
        'getTodo',
        {
          title: 'Get Todo',
          description: 'Retrieves a specific todo item by its ID',
          inputSchema: {
            id: z.string().uuid().describe('The ID of the todo to retrieve.'),
          },
          annotations: {
            title: 'Get Todo',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          try {
            const todo = (await todoApi.getById(args.id)) as Todo;
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
            const errorMessage = isApiError(error)
              ? getErrorMessage(error)
              : 'Failed to retrieve todo';
            toast.error('Failed to retrieve todo', {
              description: errorMessage,
            });
            return {
              content: [{ type: 'text', text: `Error: ${errorMessage}` }],
            };
          }
        }
      );
      registerTool('getTodo', getTodoTool);
    } catch (error) {
      console.warn('Tool getTodo registration failed:', error);
    }

    return () => {
      // Clean up all registered tools
      registeredToolsRef.current.forEach((tool) => {
        tool.remove();
      });
      registeredToolsRef.current.clear();
    };
  }, [navigate, cache]);

  return <>{children}</>;
}
