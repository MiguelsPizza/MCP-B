import { useCallback } from 'react';
import { toast } from 'sonner';
import { todoService, type Todo } from '../services/todoService';

export const useTodos = () => {
  const createTodo = useCallback(async (text: string) => {
    try {
      const todo = await todoService.create(text);
      toast.success('Todo created');
      return todo;
    } catch (error) {
      toast.error('Failed to create todo');
      throw error;
    }
  }, []);

  const updateTodo = useCallback(
    async (id: string, updates: Partial<Pick<Todo, 'text' | 'completed'>>) => {
      try {
        const todo = await todoService.update(id, updates);
        if (!todo) {
          toast.error('Todo not found');
          return null;
        }
        toast.success('Todo updated');
        return todo;
      } catch (error) {
        toast.error('Failed to update todo');
        throw error;
      }
    },
    []
  );

  const deleteTodo = useCallback(async (id: string) => {
    try {
      const success = await todoService.delete(id);
      if (!success) {
        toast.error('Todo not found');
        return false;
      }
      toast.success('Todo deleted');
      return true;
    } catch (error) {
      toast.error('Failed to delete todo');
      throw error;
    }
  }, []);

  return {
    createTodo,
    updateTodo,
    deleteTodo,
  };
};
