import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { todoService } from '@/services/todoService';
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
          description: 'Creates a new todo item',
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

          try {
            const newTodo = await todoService.create(args.todoText);

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
            toast.error('Failed to create todo');
            return {
              content: [{ type: 'text', text: 'Error: Failed to create todo' }],
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
              toast.error('Todo not found');
              return {
                content: [{ type: 'text', text: 'Error: Todo not found' }],
              };
            }

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
            toast.error('Failed to update todo');
            return {
              content: [{ type: 'text', text: 'Error: Failed to update todo' }],
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
        },
        async (args) => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

          try {
            const success = await todoService.delete(args.id);

            if (!success) {
              toast.error('Todo not found');
              return {
                content: [{ type: 'text', text: 'Error: Todo not found' }],
              };
            }

            toast.success('Todo deleted');
            return {
              content: [{ type: 'text', text: 'Todo deleted successfully' }],
            };
          } catch (error) {
            console.error('MCP Tool Error:', error);
            toast.error('Failed to delete todo');
            return {
              content: [{ type: 'text', text: 'Error: Failed to delete todo' }],
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
          description: 'Permanently deletes all todo items',
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

          try {
            await todoService.deleteAll();
            toast.success('All todos deleted', {
              description: 'Your todo list has been cleared',
            });
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
            toast.error('Failed to delete all todos');
            return {
              content: [{ type: 'text', text: 'Error: Failed to delete all todos' }],
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
          description: 'Retrieves a list of all todos',
          inputSchema: {},
          annotations: {
            title: 'Get Todos',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
            cache: cache,
          },
        },
        async () => {
          navigate({ to: '/assistant', search: { activeView: 'todos' } });

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
            toast.error('Failed to retrieve todos');
            return {
              content: [{ type: 'text', text: 'Error: Failed to retrieve todos' }],
            };
          }
        }
      );
      registerTool('getTodos', getTodosTool);
    } catch (error) {
      console.warn('Tool getTodos registration failed:', error);
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
