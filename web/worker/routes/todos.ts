import { and, asc, desc, eq, like } from 'drizzle-orm';
import { Hono } from 'hono';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { createTodoSchema, todoQuerySchema, updateTodoSchema } from '../db/schema';
import { createDatabase, ensureUserExists } from '../lib/database';
import { handleDatabaseError, NotFoundError } from '../lib/error-handler';
import { zValidator } from '../zValidator';

/**
 * Todos route handler
 * Handles all todo-related API endpoints including:
 * - GET /todos - List all todos with filtering and pagination
 * - POST /todos - Create a new todo
 * - GET /todos/:id - Get a specific todo
 * - PUT /todos/:id - Update a specific todo
 * - DELETE /todos/:id - Delete a specific todo
 */
const todos = new Hono<{ Bindings: Env }>()

  /**
   * GET /todos
   * Enhanced endpoint with filtering, sorting, and pagination
   * Query parameters:
   * - completed: Filter by completion status
   * - search: Search in todo text
   * - sortBy: Sort field (text, completed, created_at, updated_at)
   * - sortOrder: Sort direction (asc, desc)
   * - limit: Number of results per page
   * - offset: Number of results to skip
   */
  .get('/', zValidator('query', todoQuerySchema), async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const query = c.req.valid('query');

    try {
      // Start with proper typing for the query builder
      let queryBuilder: any = db.select().from(schema.todos);

      // Apply filters with proper type safety
      const conditions = [];

      if (query.completed !== undefined) {
        conditions.push(eq(schema.todos.completed, query.completed));
      }

      if (query.search) {
        conditions.push(like(schema.todos.text, `%${query.search}%`));
      }

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions));
      }

      // Apply sorting with type safety
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

      const allTodos = await queryBuilder;
      return c.json(allTodos);
    } catch (error: unknown) {
      handleDatabaseError(error, 'Failed to fetch todos');
    } finally {
      await client.end();
    }
  })

  /**
   * POST /todos
   * Create a new todo with auto-user creation
   * Body parameters:
   * - text: Todo text content
   * - userId: User ID (user will be auto-created if doesn't exist)
   * - id: Optional todo ID
   */
  .post(
    '/',
    zValidator('json', createTodoSchema.pick({ text: true, userId: true, id: true })),
    async (c) => {
      const client = postgres(c.env.DATABASE_URL, { prepare: false });
      const db = createDatabase(c.env.DATABASE_URL);
      const todoData = c.req.valid('json');

      try {
        // Auto-create user if doesn't exist
        await ensureUserExists(db, todoData.userId);

        const newTodo = await db
          .insert(schema.todos)
          .values({
            text: todoData.text,
            userId: todoData.userId,
            id: todoData.id,
          })
          .returning();
        return c.json(newTodo[0], 201);
      } catch (error: unknown) {
        handleDatabaseError(error, 'Failed to create todo');
      } finally {
        await client.end();
      }
    }
  )

  /**
   * GET /todos/:id
   * Get a specific todo by ID
   */
  .get('/:id', async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const id = c.req.param('id');

    try {
      const todo = await db.query.todos.findFirst({
        where: eq(schema.todos.id, id),
      });

      if (!todo) {
        throw new NotFoundError('Todo not found');
      }

      return c.json(todo);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      handleDatabaseError(error, 'Failed to fetch todo');
    } finally {
      await client.end();
    }
  })

  /**
   * PUT /todos/:id
   * Update a specific todo
   * Body parameters:
   * - text: Optional new todo text
   * - completed: Optional completion status
   */
  .put(
    '/:id',
    zValidator('json', updateTodoSchema.pick({ text: true, completed: true }).partial()),
    async (c) => {
      const client = postgres(c.env.DATABASE_URL, { prepare: false });
      const db = createDatabase(c.env.DATABASE_URL);
      const id = c.req.param('id');
      const todoData = c.req.valid('json');

      try {
        // Ensure todo exists
        const existingTodo = await db.query.todos.findFirst({
          where: eq(schema.todos.id, id),
        });
        if (!existingTodo) {
          throw new NotFoundError('Todo not found');
        }

        const updatedTodo = await db
          .update(schema.todos)
          .set({
            ...todoData,
            updated_at: new Date(),
          })
          .where(eq(schema.todos.id, id))
          .returning();
        return c.json(updatedTodo[0]);
      } catch (error: unknown) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        handleDatabaseError(error, 'Failed to update todo');
      } finally {
        await client.end();
      }
    }
  )

  /**
   * DELETE /todos/:id
   * Delete a specific todo
   */
  .delete('/:id', async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const id = c.req.param('id');

    try {
      // Ensure todo exists
      const existingTodo = await db.query.todos.findFirst({
        where: eq(schema.todos.id, id),
      });
      if (!existingTodo) {
        throw new NotFoundError('Todo not found');
      }

      await db.delete(schema.todos).where(eq(schema.todos.id, id));
      return c.json({ message: 'Todo deleted successfully' });
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      handleDatabaseError(error, 'Failed to delete todo');
    } finally {
      await client.end();
    }
  });

export default todos;
