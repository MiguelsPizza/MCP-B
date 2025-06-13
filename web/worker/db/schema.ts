import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Foreign key to users table
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertTodoSchema = createInsertSchema(todos);
export const selectTodoSchema = createSelectSchema(todos);

// Custom validation schemas with additional constraints
export const createUserSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(1).max(255),
});

export const createTodoSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1).max(1000),
  completed: z.boolean().optional(),
  userId: z.string().uuid(),
});

export const updateTodoSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  completed: z.boolean().optional(),
});

// Query schemas for filtering and sorting
export const todoQuerySchema = z.object({
  completed: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined))
    .pipe(z.boolean().optional())
    .describe('Filter todos by completion status'),
  sortBy: z
    .enum(['text', 'completed', 'created_at', 'updated_at'])
    .optional()
    .default('text')
    .describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc').describe('Sort order'),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .describe('Maximum number of todos to return'),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .describe('Number of todos to skip'),
  search: z.string().optional().describe('Search text within todo text'),
});

export const userQuerySchema = z.object({
  username: z.string().optional().describe('Filter users by username'),
  sortBy: z
    .enum(['username', 'id', 'created_at', 'updated_at'])
    .optional()
    .default('username')
    .describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc').describe('Sort order'),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .describe('Maximum number of users to return'),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .describe('Number of users to skip'),
});

// Auto user creation schema
export const autoCreateUserSchema = z.object({
  userId: z.string().uuid().describe("The user ID to auto-create if it doesn't exist"),
  username: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe('Optional username, will default to user ID if not provided'),
});

// Standardized error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

// Success response schemas
export const successMessageSchema = z.object({
  message: z.string(),
});

// Export types
export type User = z.infer<typeof selectUserSchema>;
export type Todo = z.infer<typeof selectTodoSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type NewTodo = z.infer<typeof insertTodoSchema>;
export type TodoQuery = z.infer<typeof todoQuerySchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type AutoCreateUser = z.infer<typeof autoCreateUserSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessMessage = z.infer<typeof successMessageSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

// Database schema type for Drizzle
export const dbSchema = {
  users,
  todos,
  usersRelations,
  todosRelations,
} as const;

export type DbSchema = typeof dbSchema;
