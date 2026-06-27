import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schema/index.ts',
  out: './src/shared/database/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/postgres',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
