import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

export class DatabaseFixture {
  private container: StartedPostgreSqlContainer | undefined
  private connectionUri: string | undefined
  private sharedTemplateUri: string | undefined
  private readonly originalDatabaseUrl = process.env.DATABASE_URL

  static async register(options: { dedicated?: boolean } = {}) {
    const fixture = new DatabaseFixture()

    try {
      await fixture.start(options.dedicated)
      return fixture
    } catch (error) {
      await fixture.close()
      throw error
    }
  }

  async reset() {
    const databaseClient = postgres(this.getConnectionUri())

    try {
      const tables = await databaseClient<{ tableName: string }[]>`
        SELECT tablename AS "tableName"
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '__drizzle_migrations'
      `

      if (tables.length === 0) return

      const tableNames = tables
        .map(({ tableName }) => `"public"."${tableName.replaceAll('"', '""')}"`)
        .join(', ')

      await databaseClient.unsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
    } finally {
      await databaseClient.end()
    }
  }

  async close() {
    try {
      if (this.sharedTemplateUri && this.connectionUri) {
        const databaseClient = postgres(this.sharedTemplateUri)
        try {
          const databaseName = new URL(this.connectionUri).pathname.slice(1)
          await databaseClient.unsafe(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
        } finally {
          await databaseClient.end()
        }
      }
      await this.container?.stop()
    } finally {
      this.container = undefined
      this.connectionUri = undefined
      if (this.originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL
      } else {
        process.env.DATABASE_URL = this.originalDatabaseUrl
      }
    }
  }

  private async start(dedicated = false) {
    const templateUri = process.env.HMS_TEST_DATABASE_TEMPLATE_URL
    if (!dedicated && templateUri) {
      this.sharedTemplateUri = templateUri
      const databaseClient = postgres(templateUri)
      const databaseName = `hms_test_${randomUUID().replaceAll('-', '')}`
      const templateName = new URL(templateUri).pathname.slice(1).replaceAll('"', '""')
      try {
        await databaseClient.unsafe(
          `CREATE DATABASE "${databaseName}" TEMPLATE "${templateName}"`,
        )
        const uri = new URL(templateUri)
        uri.pathname = `/${databaseName}`
        this.connectionUri = uri.toString()
        process.env.DATABASE_URL = this.connectionUri
      } finally {
        await databaseClient.end()
      }
      return
    }
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('hms_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()

    this.connectionUri = this.container.getConnectionUri()
    process.env.DATABASE_URL = this.getConnectionUri()

    const migrationClient = postgres(this.getConnectionUri())

    try {
      await migrate(drizzle(migrationClient), {
        migrationsFolder: resolve(
          process.cwd(),
          'src/shared/database/drizzle/migrations',
        ),
      })
    } finally {
      await migrationClient.end()
    }
  }

  getConnectionUri() {
    if (!this.connectionUri) {
      throw new Error('Database fixture is not running')
    }

    return this.connectionUri
  }
}
