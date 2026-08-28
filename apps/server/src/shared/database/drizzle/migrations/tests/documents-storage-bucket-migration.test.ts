import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Documents storage bucket migration 0024', () => {
  let container: StartedPostgreSqlContainer
  let database: Sql
  let migrationSql: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('hms_migration_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()
    database = postgres(container.getConnectionUri())

    await database.unsafe(`
      CREATE SCHEMA storage;
      CREATE ROLE authenticated;
      CREATE TABLE storage.buckets (
        id text PRIMARY KEY,
        name text NOT NULL,
        public boolean NOT NULL
      );
      CREATE TABLE storage.objects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id text NOT NULL
      );
    `)

    migrationSql = await readFile(
      new URL('../0024_documents_storage_bucket.sql', `file://${__filename}`),
      'utf8',
    )
  }, 120_000)

  afterAll(async () => {
    await database?.end()
    await container?.stop()
  })

  it('creates the private documents bucket and authenticated select policy idempotently', async () => {
    await database.unsafe(migrationSql)
    await database.unsafe(migrationSql)

    const [bucket] = await database<{ id: string; name: string; public: boolean }[]>`
      SELECT id, name, public
      FROM storage.buckets
      WHERE id = 'documents'
    `
    const [policy] = await database<
      { policyname: string; roles: string[]; cmd: string; qual: string }[]
    >`
      SELECT policyname, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'documents_authenticated_select'
    `

    expect(bucket).toEqual({
      id: 'documents',
      name: 'documents',
      public: false,
    })
    expect(policy).toEqual({
      policyname: 'documents_authenticated_select',
      roles: ['authenticated'],
      cmd: 'SELECT',
      qual: "(bucket_id = 'documents'::text)",
    })
  })
})
