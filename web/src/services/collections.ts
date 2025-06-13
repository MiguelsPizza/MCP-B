import { createElectricCollection } from '@tanstack/db-collections';
import type { Todo } from '../../worker/db/schema';
import { selectTodoSchema } from '../../worker/db/schema';
import { userId } from '../lib/utils';

export const userTodoCollection = createElectricCollection<Todo>({
  id: `todos-${userId}`,
  streamOptions: {
    url: `${location.origin}/v1/shape`,
    params: {
      table: 'todos',
      where: `user_id = '${userId}'`,
    },
    parser: {
      timestamptz: (date: string) => new Date(date) as any,
    },
  },
  primaryKey: ['id'],
  schema: selectTodoSchema,
});
