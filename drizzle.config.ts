import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL || 'local.db';

export default defineConfig({
  schema: ['./src/lib/server/db/schema.ts', './src/lib/server/db/auth.schema.ts'],
  dialect: 'sqlite',
  dbCredentials: { url: dbUrl },
  verbose: true,
  strict: true,
});
