# Hono API Server

A well-structured Hono application following best practices for building scalable APIs.

## Project Structure

```
worker/
├── index.ts              # Main application entry point
├── zValidator.ts         # Custom Zod validator middleware
├── lib/                  # Shared utilities and helpers
│   ├── database.ts       # Database connection and utilities
│   └── error-handler.ts  # Error handling utilities
├── routes/               # Route modules organized by feature
│   ├── users.ts          # User management endpoints
│   ├── todos.ts          # Todo CRUD endpoints
│   ├── user-todos.ts     # User-specific todo endpoints
│   ├── electric.ts       # Electric SQL proxy endpoints
│   └── chat.ts           # AI chat endpoints
└── db/                   # Database schema and migrations
    ├── schema.ts         # Drizzle ORM schema definitions
    └── migrations/       # Database migration files
```

## Architecture

This application follows Hono best practices by:

1. **Modular Route Organization**: Each feature has its own route module
2. **Shared Utilities**: Common functionality is extracted into the `lib/` directory
3. **Type Safety**: Full TypeScript support with proper type exports for RPC
4. **Validation**: Zod schemas for request validation
5. **Error Handling**: Centralized error handling with proper HTTP status codes

## Route Modules

### Users (`/api/users`)

- `GET /api/users` - List users with filtering and pagination
- `POST /api/users` - Create a new user

### Todos (`/api/todos`)

- `GET /api/todos` - List all todos with filtering and pagination
- `POST /api/todos` - Create a new todo
- `GET /api/todos/:id` - Get a specific todo
- `PUT /api/todos/:id` - Update a specific todo
- `DELETE /api/todos/:id` - Delete a specific todo

### User Todos (`/api/users/:userId/todos`)

- `GET /api/users/:userId/todos` - List todos for a specific user

### Electric SQL Proxy (`/v1/shape`)

- `GET /v1/shape` - Proxy requests to Electric Cloud API
- `OPTIONS /v1/shape` - CORS preflight handling

### Chat (`/api/chat`)

- `POST /api/chat` - AI chat endpoint with streaming responses

## Shared Utilities

### Database (`lib/database.ts`)

- `createDatabase()` - Creates a configured Drizzle database instance
- `ensureUserExists()` - Auto-creates users if they don't exist

### Error Handler (`lib/error-handler.ts`)

- `AppError` - Base custom error class extending HTTPException
- `UniqueConstraintError` - Database unique constraint violations (409)
- `ForeignKeyConstraintError` - Database foreign key violations (400)
- `NotFoundError` - Resource not found errors (404)
- `ValidationError` - Request validation errors (400)
- `DatabaseError` - General database errors (500)
- `handleDatabaseError()` - Analyzes and throws appropriate database errors
- `globalErrorHandler()` - Global error handler for consistent error responses

## Features

- **Auto-User Creation**: Users are automatically created when referenced
- **Advanced Filtering**: Support for search, completion status, and other filters
- **Pagination**: Configurable limit and offset for all list endpoints
- **Sorting**: Flexible sorting by multiple fields and directions
- **Type Safety**: Full TypeScript support with exported types for RPC
- **Standardized Error Handling**: Uses Hono's HTTPException with consistent error schema
- **Validation**: Request validation using Zod schemas
- **Global Error Handler**: Centralized error handling with `app.onError`

## Error Handling

The application uses a standardized error handling approach based on Hono's `HTTPException`:

### Custom Error Classes

- All errors extend `AppError` which extends `HTTPException`
- Consistent error response format with `error`, `message`, and `code` fields
- Automatic HTTP status code assignment based on error type

### Error Flow

1. Route handlers throw specific error types (e.g., `NotFoundError`, `UniqueConstraintError`)
2. Database errors are analyzed by `handleDatabaseError()` and converted to appropriate custom errors
3. Global error handler (`app.onError`) catches all errors and returns consistent JSON responses
4. Error responses follow the `ErrorResponse` schema defined in the database schema

### Example Error Response

```json
{
  "error": "Resource not found",
  "message": "Todo not found",
  "code": "NOT_FOUND"
}
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for chat functionality
- `ELECTRIC_SOURCE_ID` - Electric SQL source ID
- `ELECTRIC_SOURCE_SECRET` - Electric SQL source secret

## Usage

The main application is exported as `AppType` for RPC usage:

```typescript
import type { AppType } from './worker';

// Use with hono/client for type-safe API calls
const client = hc<AppType>('http://localhost:8787');
```

## Development

Each route module is independently testable and maintainable. The modular structure makes it easy to:

- Add new features by creating new route modules
- Modify existing functionality without affecting other modules
- Share common utilities across different routes
- Maintain type safety throughout the application
