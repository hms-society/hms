import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run Drizzle migrations')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/drizzle/schema.ts',
  out: './src/shared/database/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
