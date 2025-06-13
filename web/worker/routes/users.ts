import { and, asc, desc, like } from 'drizzle-orm';
import { Hono } from 'hono';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { createUserSchema, userQuerySchema } from '../db/schema';
import { createDatabase } from '../lib/database';
import { handleDatabaseError } from '../lib/error-handler';
import { zValidator } from '../zValidator';

/**
 * Users route handler
 * Handles all user-related API endpoints including:
 * - GET /users - List users with filtering and pagination
 * - POST /users - Create a new user
 */
const users = new Hono<{ Bindings: Env }>()

  /**
   * GET /users
   * Enhanced endpoint with filtering, sorting, and pagination
   * Query parameters:
   * - username: Filter by username (partial match)
   * - sortBy: Sort field (id, username)
   * - sortOrder: Sort direction (asc, desc)
   * - limit: Number of results per page
   * - offset: Number of results to skip
   */
  .get('/', zValidator('query', userQuerySchema), async (c) => {
    const client = postgres(c.env.DATABASE_URL, { prepare: false });
    const db = createDatabase(c.env.DATABASE_URL);
    const query = c.req.valid('query');

    try {
      let queryBuilder: any = db.select().from(schema.users);

      // Apply filters
      const conditions = [];
      if (query.username) {
        conditions.push(like(schema.users.username, `%${query.username}%`));
      }

      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions));
      }

      // Apply sorting
      const orderBy = query.sortOrder === 'desc' ? desc : asc;
      if (query.sortBy === 'username') {
        queryBuilder = queryBuilder.orderBy(orderBy(schema.users.username));
      } else {
        queryBuilder = queryBuilder.orderBy(orderBy(schema.users.id));
      }

      // Apply pagination
      queryBuilder = queryBuilder.limit(query.limit).offset(query.offset);

      const users = await queryBuilder;
      return c.json(users);
    } catch (error: unknown) {
      handleDatabaseError(error, 'Failed to fetch users');
    } finally {
      await client.end();
    }
  })

  /**
   * POST /users
   * Create a new user (manual creation endpoint)
   * Body parameters:
   * - id: Optional user ID (auto-generated if not provided)
   * - username: Optional username (defaults to ID if not provided)
   */
  .post(
    '/',
    zValidator('json', createUserSchema.pick({ id: true, username: true }).partial()),
    async (c) => {
      const client = postgres(c.env.DATABASE_URL, { prepare: false });
      const db = createDatabase(c.env.DATABASE_URL);
      const userData = c.req.valid('json');

      try {
        const id = userData.id || crypto.randomUUID();
        const username = userData.username || id;

        const newUser = await db.insert(schema.users).values({ id, username }).returning();
        return c.json(newUser[0], 201);
      } catch (error: unknown) {
        handleDatabaseError(error, 'Failed to create user');
      } finally {
        await client.end();
      }
    }
  );

export default users;
