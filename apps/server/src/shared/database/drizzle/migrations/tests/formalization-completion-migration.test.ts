import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Formalization completion migration 0043', () => {
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
      CREATE TABLE documents (id uuid PRIMARY KEY);
      CREATE TABLE document_versions (id uuid PRIMARY KEY);
      CREATE TABLE document_specifications (id uuid PRIMARY KEY);
      CREATE TABLE intakes (
        id uuid PRIMARY KEY,
        status text NOT NULL,
        closure_reason text,
        closure_notes text,
        closed_at timestamptz
      );
      CREATE TABLE formalizations (
        id uuid PRIMARY KEY,
        status text NOT NULL,
        intake_id uuid
      );
      CREATE TABLE formalization_signature_cancellation_attempts (
        id uuid PRIMARY KEY
      );
    `)
    await database`
      INSERT INTO formalization_signature_cancellation_attempts (id)
      VALUES ('00000000-0000-0000-0000-000000000001')
    `

    migrationSql = await readFile(
      new URL('../0043_formalization_completion.sql', import.meta.url),
      'utf8',
    )
    for (const statement of migrationSql.split('--> statement-breakpoint')) {
      await database.unsafe(statement)
    }
  }, 120_000)

  afterAll(async () => {
    await database?.end()
    await container?.stop()
  })

  it('creates the completion columns, frozen PDF table, indexes and constraints', async () => {
    const columns = await database<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'intakes' AND column_name = 'contracted_at')
          OR (table_name = 'formalizations' AND column_name IN (
            'completed_at', 'completed_by_collaborator_id', 'contracting_confirmation_key'
          ))
          OR (table_name = 'formalization_signature_cancellation_attempts' AND column_name = 'reason')
        )
      ORDER BY table_name, column_name
    `

    expect(columns).toEqual([
      {
        table_name: 'formalization_signature_cancellation_attempts',
        column_name: 'reason',
      },
      { table_name: 'formalizations', column_name: 'completed_at' },
      { table_name: 'formalizations', column_name: 'completed_by_collaborator_id' },
      { table_name: 'formalizations', column_name: 'contracting_confirmation_key' },
      { table_name: 'intakes', column_name: 'contracted_at' },
    ])

    const [frozenTable] = await database<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'frozen_document_pdfs'
    `
    expect(frozenTable).toEqual({ table_name: 'frozen_document_pdfs' })

    const indexes = await database<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'frozen_document_pdfs_document_version_uq',
          'frozen_document_pdfs_document_idx',
          'frozen_document_pdfs_specification_idx',
          'formalizations_contracting_confirmation_key_uq'
        )
      ORDER BY indexname
    `
    expect(indexes.map(({ indexname }) => indexname)).toEqual([
      'formalizations_contracting_confirmation_key_uq',
      'frozen_document_pdfs_document_idx',
      'frozen_document_pdfs_document_version_uq',
      'frozen_document_pdfs_specification_idx',
    ])

    const [legacyAttempt] = await database<{ reason: string }[]>`
      SELECT reason
      FROM formalization_signature_cancellation_attempts
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `
    expect(legacyAttempt.reason).toBe(
      'Motivo indisponível: solicitação anterior à obrigatoriedade.',
    )
  })

  it('enforces contracting state, completion, cancellation reason and PDF invariants', async () => {
    const intakeId = '00000000-0000-4000-8000-000000000401'
    await expect(
      database`
        INSERT INTO intakes (id, status)
        VALUES (${intakeId}, 'contracted')
      `,
    ).rejects.toThrow()

    await expect(
      database`
        INSERT INTO intakes (id, status, contracted_at)
        VALUES (${intakeId}, 'in_formalization', now())
      `,
    ).rejects.toThrow()

    const formalizationId = '00000000-0000-0000-0000-000000000402'
    await database`
      INSERT INTO formalizations (id, status)
      VALUES (${formalizationId}, 'in_progress')
    `
    await expect(
      database`
        UPDATE formalizations
        SET status = 'completed'
        WHERE id = ${formalizationId}
      `,
    ).rejects.toThrow()

    const completedAt = new Date('2026-09-08T12:00:00.000Z')
    const collaboratorId = '00000000-0000-0000-0000-000000000403'
    const confirmationKey = '00000000-0000-0000-0000-000000000404'
    await database`
      UPDATE formalizations
      SET status = 'completed',
          completed_at = ${completedAt},
          completed_by_collaborator_id = ${collaboratorId},
          contracting_confirmation_key = ${confirmationKey}
      WHERE id = ${formalizationId}
    `

    const attemptId = '00000000-0000-0000-0000-000000000405'
    await expect(
      database`
        INSERT INTO formalization_signature_cancellation_attempts (id, reason)
        VALUES (${attemptId}, '   ')
      `,
    ).rejects.toThrow()

    await database`
      INSERT INTO documents (id) VALUES ('00000000-0000-0000-0000-000000000406')
    `
    await database`
      INSERT INTO document_versions (id) VALUES ('00000000-0000-0000-0000-000000000407')
    `
    await database`
      INSERT INTO document_specifications (id) VALUES ('00000000-0000-0000-0000-000000000408')
    `
    await expect(
      database`
        INSERT INTO frozen_document_pdfs (
          id, document_id, document_version_id, document_version_number,
          document_specification_id, source, source_file_id, pdf_file_id,
          source_sha256, pdf_sha256, converter_version, page_count, pages,
          byte_size, approved_by_collaborator_id, approved_at, frozen_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000409',
          '00000000-0000-0000-0000-000000000406',
          '00000000-0000-0000-0000-000000000407',
          1,
          '00000000-0000-0000-0000-000000000408',
          'consultation',
          '00000000-0000-0000-0000-000000000410',
          '00000000-0000-0000-0000-000000000411',
          'invalid',
          repeat('a', 64),
          'fixture-converter',
          1,
          '[]'::jsonb,
          1,
          ${collaboratorId},
          now(),
          now()
        )
      `,
    ).rejects.toThrow()
  })
})
