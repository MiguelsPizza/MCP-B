import { useCallback } from 'react';
import type { Collection } from '@tanstack/react-db';
import { useOptimisticMutation } from '@tanstack/react-db';
import { toast } from 'sonner';
import { v7 as uuidv7 } from 'uuid';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../../worker/db/schema';
import { todoMutationFn } from '../mutations/todoMutations';
import { TodoApiError } from '../services/todoService';

/**
 * Custom hook that provides optimistic mutation functions for todos
 *
 * @param todoCollection - The todo collection to operate on
 * @param userId - The current user ID (optional, used as default for new todos)
 * @returns Object containing mutation functions for create, update, and delete operations
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on server errors
 * - Electric collection sync support
 * - Type-safe operations with full TypeScript support
 *
 * This hook uses the generic todoMutationFn from ../mutations/todoMutations.ts
 * which automatically handles all types of todo operations (create, update, delete)
 */
export const useTodoMutations = (todoCollection: Collection<Todo>, userId?: string) => {
  /**
   * Generic mutation that handles all todo operations
   * Uses the todoMutationFn which automatically determines operation type
   */
  const todoMutation = useOptimisticMutation({
    mutationFn: todoMutationFn,
  });

  /**
   * Create a new todo with optimistic update
   *
   * @param input - Todo creation data
   * @returns Transaction object for tracking mutation status
   */
  const createTodo = useCallback(
    async (input: CreateTodoInput) => {
      const optimisticTodo: Todo = {
        id: input.id || uuidv7(),
        text: input.text,
        completed: input.completed || false,
        userId: input.userId || userId!,
        created_at: new Date(),
        updated_at: new Date(),
      };

      try {
        const result = todoMutation.mutate(() => {
          todoCollection.insert(optimisticTodo);
        });

        // Show success toast
        toast.success('Todo created successfully');

        return result;
      } catch (error) {
        // Show error toast with specific message
        let errorMessage = 'Failed to create todo';

        if (error instanceof TodoApiError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        throw error;
      }
    },
    [todoMutation, todoCollection, userId]
  );

  /**
   * Update an existing todo with optimistic update
   *
   * @param input - Todo update data including the ID
   * @returns Transaction object for tracking mutation status
   * @throws Error if todo is not found
   */
  const updateTodo = useCallback(
    async (input: UpdateTodoInput & { id: string }) => {
      const existingTodo = Array.from(todoCollection.state.values()).find(
        (t: Todo) => t.id === input.id
      );
      if (!existingTodo) {
        toast.error('Todo not found');
        throw new Error('Todo not found');
      }

      try {
        const result = todoMutation.mutate(() => {
          todoCollection.update(existingTodo, (draft: Todo) => {
            if (input.text !== undefined) draft.text = input.text;
            if (input.completed !== undefined) draft.completed = input.completed;
            draft.updated_at = new Date();
          });
        });

        // Show success toast
        const action =
          input.completed !== undefined
            ? input.completed
              ? 'completed'
              : 'uncompleted'
            : 'updated';
        toast.success(`Todo ${action} successfully`);

        return result;
      } catch (error) {
        // Show error toast with specific message
        let errorMessage = 'Failed to update todo';

        if (error instanceof TodoApiError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        throw error;
      }
    },
    [todoMutation, todoCollection]
  );

  /**
   * Delete a todo with optimistic update
   *
   * @param id - The ID of the todo to delete
   * @returns Transaction object for tracking mutation status
   * @throws Error if todo is not found
   */
  const deleteTodo = useCallback(
    async (id: string) => {
      const existingTodo = Array.from(todoCollection.state.values()).find((t: Todo) => t.id === id);
      if (!existingTodo) {
        toast.error('Todo not found');
        throw new Error('Todo not found');
      }

      try {
        const result = todoMutation.mutate(() => {
          todoCollection.delete(existingTodo);
        });

        // Show success toast
        toast.success('Todo deleted successfully');

        return result;
      } catch (error) {
        // Show error toast with specific message
        let errorMessage = 'Failed to delete todo';

        if (error instanceof TodoApiError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        throw error;
      }
    },
    [todoMutation, todoCollection]
  );

  return {
    createTodo,
    updateTodo,
    deleteTodo,
    // Expose the raw mutation for advanced use cases
    mutation: todoMutation,
  };
};
