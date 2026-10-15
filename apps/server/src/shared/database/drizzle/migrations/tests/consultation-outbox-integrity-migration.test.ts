import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Consultation outbox and appointment history migration 0066', () => {
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
      CREATE TABLE consultations (id uuid PRIMARY KEY);
      CREATE TABLE schedules (id uuid PRIMARY KEY);
      CREATE TABLE appointments (
        id uuid PRIMARY KEY,
        schedule_id uuid NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL
      );
      CREATE TABLE blocked_periods (
        id uuid PRIMARY KEY,
        schedule_id uuid NOT NULL,
        start_date timestamptz NOT NULL,
        end_date timestamptz NOT NULL
      );
    `)
    migrationSql = await readFile(
      new URL('../0066_even_captain_america.sql', import.meta.url),
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

  it('uses the Spec names, occurrence index and object payload check', async () => {
    const indexes = await database<{ indexname: string }[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'consultation_outbox_events'
      ORDER BY indexname
    `
    expect(indexes.map(({ indexname }) => indexname)).toEqual([
      'consultation_outbox_consultation_occurrence_idx',
      'consultation_outbox_events_pkey',
      'consultation_outbox_pending_idx',
    ])

    const constraints = await database<{ conname: string; definition: string }[]>`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'consultation_outbox_events'::regclass
      ORDER BY conname
    `
    expect(constraints.map(({ conname }) => conname)).toEqual([
      'consultation_outbox_consultation_fk',
      'consultation_outbox_events_pkey',
      'consultation_outbox_name_check',
      'consultation_outbox_payload_check',
    ])
    expect(constraints).toContainEqual(
      expect.objectContaining({
        conname: 'consultation_outbox_payload_check',
        definition: "CHECK ((jsonb_typeof(payload) = 'object'::text))",
      }),
    )
  })

  it('rejects non-object payloads and accepts an object envelope', async () => {
    const consultationId = '00000000-0000-0000-0000-000000000001'
    await database`INSERT INTO consultations (id) VALUES (${consultationId})`

    await expect(
      database`
        INSERT INTO consultation_outbox_events
          (id, consultation_id, name, payload, occurred_at)
        VALUES
          ('00000000-0000-0000-0000-000000000002', ${consultationId}, 'consultation/consultation.completed', '[]'::jsonb, now())
      `,
    ).rejects.toThrow()

    await database`
      INSERT INTO consultation_outbox_events
        (id, consultation_id, name, payload, occurred_at)
      VALUES
        ('00000000-0000-0000-0000-000000000003', ${consultationId}, 'consultation/consultation.completed', '{}'::jsonb, now())
    `
  })
})
