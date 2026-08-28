import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Document specification migration 0014', () => {
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
      CREATE TABLE document_specifications (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL,
        content text NOT NULL,
        variables jsonb NOT NULL,
        moment text NOT NULL,
        scope text NOT NULL,
        is_required boolean NOT NULL,
        status text NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )
    `)
    await database`
      INSERT INTO document_specifications
        (id, name, description, content, variables, moment, scope, is_required, status, created_at, updated_at)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'Legado', 'Descrição', 'Texto legado', '[{"label":"Número do processo","technicalName":"numero_processo"}]', 'consultation', 'global', false, 'available', now(), now()),
        ('00000000-0000-0000-0000-000000000002', 'Vazio', 'Descrição', '', '[]', 'consultation', 'global', false, 'available', now(), now())
    `

    migrationSql = await readFile(
      new URL('../0014_noisy_true_believers.sql', `file://${__filename}`),
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

  it('backfills legacy text, marks empty templates unavailable, and preserves variables', async () => {
    const records = await database<
      {
        id: string
        content: unknown
        variables: unknown
        status: string
      }[]
    >`
      SELECT id, content, variables, status
      FROM document_specifications
      ORDER BY id
    `

    expect(records).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000001',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Texto legado' }],
            },
          ],
        },
        variables: [{ label: 'Número do processo', technicalName: 'numero_processo' }],
        status: 'available',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        variables: [],
        status: 'unavailable',
      },
    ])
  })

  it.each([
    ['invalid_shape', '[{"label":"Campo","technicalName":123}]'],
    [
      'duplicate_name',
      '[{"label":"Um","technicalName":"campo"},{"label":"Dois","technicalName":"campo"}]',
    ],
    ['system_conflict', '[{"label":"Nome","technicalName":"cliente_nome"}]'],
  ])(
    'aborts before changing legacy data for %s variables',
    async (suffix, variables) => {
      const table = `document_specifications_${suffix}`
      await database.unsafe(`
        CREATE TABLE "${table}" (
          id uuid PRIMARY KEY,
          name text NOT NULL,
          description text NOT NULL,
          content text NOT NULL,
          variables jsonb NOT NULL,
          moment text NOT NULL,
          scope text NOT NULL,
          is_required boolean NOT NULL,
          status text NOT NULL,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `)
      await database.unsafe(`
        INSERT INTO "${table}"
          (id, name, description, content, variables, moment, scope, is_required, status, created_at, updated_at)
        VALUES
          ('00000000-0000-0000-0000-000000000010', 'Inválido', 'Descrição', 'Texto legado', '${variables}', 'consultation', 'global', false, 'available', now(), now())
      `)

      const migration = migrationSql.replaceAll('"document_specifications"', `"${table}"`)
      await expect(
        database.begin(async (transaction) => {
          for (const statement of migration.split('--> statement-breakpoint')) {
            await transaction.unsafe(statement)
          }
        }),
      ).rejects.toThrow(/Cannot migrate document specification variables/)

      const [record] = await database.unsafe<{ content: string; variables: unknown }[]>(
        `SELECT content, variables FROM "${table}"`,
      )
      expect(record).toMatchObject({
        content: 'Texto legado',
        variables: JSON.parse(variables),
      })
    },
    120_000,
  )
})
