import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, like } from 'drizzle-orm';
import { Hono } from 'hono';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { todoQuerySchema } from '../db/schema';
import { createDatabase, ensureUserExists } from '../lib/database';
import { handleDatabaseError } from '../lib/error-handler';

/**
 * User-specific todos route handler
 * Handles todo endpoints scoped to specific users:
 * - GET /users/:userId/todos - List todos for a specific user
 */
const userTodos = new Hono<{ Bindings: Env }>()

  /**
   * GET /users/:userId/todos
   * Enhanced endpoint with filtering, sorting, pagination, and auto-user creation
   * Path parameters:
   * - userId: The user ID to fetch todos for
   * Query parameters:
   * - completed: Filter by completion status
   * - search: Search in todo text
   * - sortBy: Sort field (text, completed, created_at, updated_at)
   * - sortOrder: Sort direction (asc, desc)
   * - limit: Number of results per page
   * - offset: Number of results to skip
   */
  .get('/:userId/todos', zValidator('query', todoQuerySchema), async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const userId = c.req.param('userId');
    const query = c.req.valid('query');

    try {
      // Auto-create user if doesn't exist
      await ensureUserExists(db, userId);

      let queryBuilder: any = db.select().from(schema.todos);

      // Apply filters
      const conditions = [eq(schema.todos.userId, userId)];

      if (query.completed !== undefined) {
        conditions.push(eq(schema.todos.completed, query.completed));
      }

      if (query.search) {
        conditions.push(like(schema.todos.text, `%${query.search}%`));
      }

      queryBuilder = queryBuilder.where(and(...conditions));

      // Apply sorting
      const orderBy = query.sortOrder === 'desc' ? desc : asc;
      switch (query.sortBy) {
        case 'completed':
          queryBuilder = queryBuilder.orderBy(orderBy(schema.todos.completed));
          break;
        case 'created_at':
          queryBuilder = queryBuilder.orderBy(orderBy(schema.todos.created_at));
          break;
        case 'updated_at':
          queryBuilder = queryBuilder.orderBy(orderBy(schema.todos.updated_at));
          break;
        case 'text':
        default:
          queryBuilder = queryBuilder.orderBy(orderBy(schema.todos.text));
          break;
      }

      // Apply pagination
      queryBuilder = queryBuilder.limit(query.limit).offset(query.offset);

      const userTodos = await queryBuilder;
      return c.json(userTodos);
    } catch (error: unknown) {
      handleDatabaseError(error, 'Failed to fetch user todos');
    } finally {
      await client.end();
    }
  })

  /**
   * DELETE /users/:userId/todos
   * Delete all todos for a specific user
   * Path parameters:
   * - userId: The user ID whose todos should be deleted
   */
  .delete('/:userId/todos', async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const userId = c.req.param('userId');

    try {
      // Delete all todos for the user
      const result = await db
        .delete(schema.todos)
        .where(eq(schema.todos.userId, userId))
        .returning();

      return c.json({
        message: `Successfully deleted ${result.length} todos for user ${userId}`,
        deletedCount: result.length,
      });
    } catch (error: unknown) {
      handleDatabaseError(error, 'Failed to delete user todos');
    } finally {
      await client.end();
    }
  });

export default userTodos;
