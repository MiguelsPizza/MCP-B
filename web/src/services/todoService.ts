import { z } from 'zod';

// Simple Todo type
export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

// Simple Zod schema for validation
const todoSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  completed: z.boolean(),
  created_at: z.string(),
});

const TODOS_KEY = 'todos';

// Basic localStorage operations
const getTodos = (): Todo[] => {
  try {
    const stored = localStorage.getItem(TODOS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveTodos = (todos: Todo[]) => {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('todos-updated'));
};

// Helper function for artificial delay
const delay = () => new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));

// Simple API
export const todoService = {
  getAll(): Todo[] {
    return getTodos();
  },

  async create(text: string): Promise<Todo> {
    await delay();

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      created_at: new Date().toISOString(),
    };

    const todos = getTodos();
    todos.push(newTodo);
    saveTodos(todos);

    return newTodo;
  },

  async update(
    id: string,
    updates: Partial<Pick<Todo, 'text' | 'completed'>>
  ): Promise<Todo | null> {
    await delay();

    const todos = getTodos();
    const index = todos.findIndex((t) => t.id === id);

    if (index === -1) return null;

    todos[index] = { ...todos[index], ...updates };
    saveTodos(todos);

    return todos[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay();

    const todos = getTodos();
    const index = todos.findIndex((t) => t.id === id);

    if (index === -1) return false;

    todos.splice(index, 1);
    saveTodos(todos);

    return true;
  },

  async deleteAll(): Promise<void> {
    await delay();
    saveTodos([]);
  },
};
