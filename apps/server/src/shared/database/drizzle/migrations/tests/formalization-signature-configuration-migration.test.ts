import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Formalization signature configuration migrations 0040 and 0041', () => {
  let container: StartedPostgreSqlContainer
  let database: Sql
  let configurationMigrationSql: string
  let channelsMigrationSql: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('hms_migration_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()
    database = postgres(container.getConnectionUri())

    await database.unsafe(`
      CREATE TYPE communication_channel AS ENUM ('email', 'whatsapp');
      CREATE TABLE formalizations (
        id uuid PRIMARY KEY
      );
    `)
    configurationMigrationSql = await readFile(
      new URL('../0040_formalization_signature_configuration.sql', import.meta.url),
      'utf8',
    )
    channelsMigrationSql = await readFile(
      new URL('../0041_worried_texas_twister.sql', import.meta.url),
      'utf8',
    )
  }, 120_000)

  afterAll(async () => {
    await database?.end()
    await container?.stop()
  })

  it('creates the durable storage, configuration tables, constraints and indexes', async () => {
    for (const statement of configurationMigrationSql.split('--> statement-breakpoint')) {
      await database.unsafe(statement)
    }
    for (const statement of channelsMigrationSql.split('--> statement-breakpoint')) {
      await database.unsafe(statement)
    }

    const tables = await database<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'stored_files',
          'formalization_signatories',
          'formalization_signatory_documents',
          'formalization_signature_previews',
          'formalization_signature_fields'
        )
      ORDER BY table_name
    `
    expect(tables.map(({ table_name }) => table_name)).toEqual([
      'formalization_signatories',
      'formalization_signatory_documents',
      'formalization_signature_fields',
      'formalization_signature_previews',
      'stored_files',
    ])

    const indexes = await database<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'stored_files_file_path_uq',
          'formalization_signatories_owner_position_uq',
          'formalization_signatories_owner_person_uq',
          'formalization_signature_previews_current_key_uq',
          'formalization_signature_fields_assignment_idx'
        )
      ORDER BY indexname
    `
    expect(indexes.map(({ indexname }) => indexname)).toEqual([
      'formalization_signatories_owner_person_uq',
      'formalization_signatories_owner_position_uq',
      'formalization_signature_fields_assignment_idx',
      'formalization_signature_previews_current_key_uq',
      'stored_files_file_path_uq',
    ])

    const [compositeForeignKey] = await database<{ constraint_name: string }[]>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND table_name = 'formalization_signatory_documents'
        AND constraint_name = 'formalization_signatory_documents_owner_signatory_fk'
    `
    expect(compositeForeignKey).toEqual({
      constraint_name: 'formalization_signatory_documents_owner_signatory_fk',
    })

    const signatoryColumns = await database<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'formalization_signatories'
        AND column_name IN ('selected_channel', 'selected_channels')
      ORDER BY column_name
    `
    expect(signatoryColumns).toEqual([{ column_name: 'selected_channels' }])
  })

  it('enforces preview lifecycle metadata at the database boundary', async () => {
    const formalizationId = '00000000-0000-0000-0000-000000000001'
    await database`
      INSERT INTO formalizations (id) VALUES (${formalizationId})
    `

    await expect(
      database`
        INSERT INTO formalization_signature_previews
          (formalization_id, document_id, document_version_id, state)
        VALUES
          (${formalizationId}, ${formalizationId}, ${formalizationId}, 'pending')
      `,
    ).rejects.toThrow()

    const readyFormalizationId = '00000000-0000-0000-0000-000000000002'
    const fileId = '00000000-0000-0000-0000-000000000003'
    await database`
      INSERT INTO formalizations (id) VALUES (${readyFormalizationId})
    `
    await database`
      INSERT INTO stored_files (id, file_path, file_name, content_type, size_in_bytes)
      VALUES (${fileId}, 'migration-test/preview.pdf', 'preview.pdf', 'application/pdf', 1)
    `

    await expect(
      database`
        INSERT INTO formalization_signature_previews
          (formalization_id, document_id, document_version_id, file_id,
           converter_version, page_count, byte_size, state)
        VALUES
          (${readyFormalizationId}, ${readyFormalizationId}, ${readyFormalizationId}, ${fileId},
           'test-converter', 1, 1, 'ready')
      `,
    ).rejects.toThrow()
  })
})
