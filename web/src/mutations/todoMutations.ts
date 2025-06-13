import type { ElectricCollection } from '@tanstack/db-collections';
import type { Collection, MutationFn, PendingMutation } from '@tanstack/react-db';
import type { Todo, UpdateTodoInput } from '../../worker/db/schema';
import { todoApi } from '../services/todoService';

/**
 * Type guard to check if a collection is an Electric collection
 */
function isElectricCollection(collection: Collection<any>): collection is ElectricCollection<any> {
  return 'awaitTxId' in collection && typeof (collection as any).awaitTxId === 'function';
}

/**
 * Helper function to handle Electric collection synchronization after mutations
 *
 * @param mutation - The pending mutation object containing collection info
 * @param txid - Optional transaction ID from the server response for sync tracking
 *
 * For Electric collections, this waits for the transaction ID to sync back,
 * ensuring data consistency between local and remote state.
 */
async function collectionSync(mutation: PendingMutation<Record<string, unknown>>, txid?: string) {
  if (txid && isElectricCollection(mutation.collection)) {
    // For Electric collections, wait for the txid to sync back
    await mutation.collection.awaitTxId(parseInt(txid));
  } else {
    // Fallback: just wait a bit for sync or refetch the collection
    if ('refetch' in mutation.collection && typeof mutation.collection.refetch === 'function') {
      await mutation.collection.refetch();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Generic mutation function for all todo operations
 *
 * This function handles:
 * - Creating new todos (insert operations)
 * - Updating existing todos (update operations)
 * - Deleting todos (delete operations)
 * - Electric collection synchronization
 * - Error handling with automatic rollback
 *
 * The function automatically determines the operation type and routes to the
 * appropriate API endpoint, then waits for sync before discarding optimistic state.
 */
export const todoMutationFn: MutationFn = async ({ transaction }) => {
  const mutation = transaction.mutations[0] as PendingMutation<Todo>;

  if (!mutation) {
    throw new Error('No mutation found in transaction');
  }

  try {
    let response: any;

    // Determine the type of mutation and handle accordingly
    switch (mutation.type) {
      case 'insert': {
        const { modified } = mutation;

        // Create todo on the server
        response = await todoApi.create({
          id: modified.id as string,
          text: modified.text as string,
          userId: modified.userId as string,
        });
        break;
      }

      case 'update': {
        const { original, changes } = mutation;

        // Update todo on the server
        response = await todoApi.update(original.id as string, changes as UpdateTodoInput);
        break;
      }

      case 'delete': {
        const { original } = mutation;

        // Delete todo on the server
        response = await todoApi.delete(original.id as string);
        break;
      }

      default:
        throw new Error(`Unknown mutation type: ${mutation.type}`);
    }

    // Wait for sync with Electric collection or refetch for other collection types
    await collectionSync(
      mutation as unknown as PendingMutation<Record<string, unknown>>,
      (response as any)?.txid
    );
  } catch (error) {
    // Re-throw to trigger rollback of optimistic state
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to ${mutation.type} todo: ${errorMessage}`);
  }
};

/**
 * Legacy exports for backward compatibility
 * @deprecated Use todoMutationFn instead
 */
export const createTodoMutationFn = todoMutationFn;
export const updateTodoMutationFn = todoMutationFn;
export const deleteTodoMutationFn = todoMutationFn;
