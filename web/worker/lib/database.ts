import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { DbSchema } from '../db/schema';
import * as schema from '../db/schema';

export type Database = PostgresJsDatabase<DbSchema>;

/**
 * Creates a database connection using the provided connection string
 * @param connectionString - PostgreSQL connection string
 * @returns Configured Drizzle database instance
 */
export const createDatabase = (connectionString: string): Database => {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema, casing: 'snake_case' });
};

/**
 * Auto-creates a user if they don't exist in the database
 * This is useful for ensuring users exist before creating related resources
 * @param db - Database instance
 * @param userId - User ID to ensure exists
 * @param username - Optional username, defaults to userId if not provided
 * @returns The existing or newly created user
 */
export const ensureUserExists = async (db: Database, userId: string, username?: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!existingUser) {
    try {
      const newUser = await db
        .insert(schema.users)
        .values({
          id: userId,
          username: username || userId,
        })
        .returning();
      return newUser[0];
    } catch (error: unknown) {
      const hasMessage = (err: unknown): err is { message: string } =>
        typeof err === 'object' && err !== null && 'message' in err;

      if (hasMessage(error) && error.message.includes('UNIQUE constraint failed')) {
        // Username might be taken, try with userId
        const newUser = await db
          .insert(schema.users)
          .values({
            id: userId,
            username: userId,
          })
          .returning();
        return newUser[0];
      }
      throw error;
    }
  }

  return existingUser;
};
