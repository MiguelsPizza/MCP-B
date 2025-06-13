import dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config({ path: '.dev.vars' });

// Assuming environment variables from .dev.vars are loaded by the runtime or tool (e.g., Node 20+ --env-file or drizzle-kit --env-file)
export default {
  schema: './worker/db/schema.ts',
  out: './worker/db/migrations',
  dialect: 'postgresql', // or 'postgresql' | 'mysql' based on your D1 setup, assuming sqlite for now
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: './worker/db/schema.ts',
  },
  verbose: true,
} satisfies Config;
