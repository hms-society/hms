import { readFile } from 'node:fs/promises'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres, { type Sql } from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const CASE_ID = '00000000-0000-4000-8000-000000000001'
const INTAKE_ID = '00000000-0000-4000-8000-000000000002'
const MANAGER_ID = '00000000-0000-4000-8000-000000000003'
const COLLABORATOR_ID = '00000000-0000-4000-8000-000000000004'
const INELIGIBLE_ID = '00000000-0000-4000-8000-000000000005'
const USER_MANAGER_ID = '00000000-0000-4000-8000-000000000006'
const USER_COLLABORATOR_ID = '00000000-0000-4000-8000-000000000007'
const USER_INELIGIBLE_ID = '00000000-0000-4000-8000-000000000008'

const legacySchema = `
  CREATE TYPE case_member_role AS ENUM ('lead_lawyer', 'lawyer', 'paralegal', 'supervisor');
  CREATE TYPE user_status AS ENUM ('invited', 'active', 'disabled');
  CREATE TYPE collaborator_profile AS ENUM ('admin', 'attendant', 'lawyer', 'paralegal', 'supervisor', 'client', 'intern');
  CREATE TABLE cases (id uuid PRIMARY KEY, intake_id uuid UNIQUE NOT NULL);
  CREATE TABLE users (id uuid PRIMARY KEY, status user_status NOT NULL);
  CREATE TABLE collaborators (id uuid PRIMARY KEY, user_id uuid NOT NULL, profile collaborator_profile NOT NULL);
  CREATE TABLE case_members (
    id uuid PRIMARY KEY,
    case_id uuid NOT NULL REFERENCES cases(id),
    collaborator_id uuid NOT NULL,
    role case_member_role NOT NULL,
    permission varchar(50) NOT NULL,
    is_primary boolean NOT NULL,
    assigned_at timestamptz NOT NULL,
    assigned_by uuid NOT NULL,
    created_at timestamptz NOT NULL,
    UNIQUE (case_id, collaborator_id)
  );
  CREATE UNIQUE INDEX case_members_one_primary_per_case_uidx
    ON case_members(case_id) WHERE is_primary = true;
`

describe('case team migration 0061', () => {
  let container: StartedPostgreSqlContainer
  let database: Sql
  let migrationSql: string

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('hms_case_team_migration_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()
    database = postgres(container.getConnectionUri())
    migrationSql = await readFile(
      new URL(
        '../../../../shared/database/drizzle/migrations/0061_condemned_doomsday.sql',
        import.meta.url,
      ),
      'utf8',
    )
  }, 120_000)

  afterAll(async () => {
    await database?.end()
    await container?.stop()
  })

  beforeEach(async () => {
    await database.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  })

  it('converts eligible managers and preserves every legacy membership snapshot', async () => {
    await database.unsafe(legacySchema)
    await database.unsafe(`
      INSERT INTO cases (id, intake_id) VALUES ('${CASE_ID}', '${INTAKE_ID}');
      INSERT INTO users (id, status) VALUES
        ('${USER_MANAGER_ID}', 'active'),
        ('${USER_COLLABORATOR_ID}', 'active'),
        ('${USER_INELIGIBLE_ID}', 'active');
      INSERT INTO collaborators (id, user_id, profile) VALUES
        ('${MANAGER_ID}', '${USER_MANAGER_ID}', 'lawyer'),
        ('${COLLABORATOR_ID}', '${USER_COLLABORATOR_ID}', 'paralegal'),
        ('${INELIGIBLE_ID}', '${USER_INELIGIBLE_ID}', 'intern');
      INSERT INTO case_members (id, case_id, collaborator_id, role, permission, is_primary, assigned_at, assigned_by, created_at) VALUES
        ('00000000-0000-4000-8000-000000000011', '${CASE_ID}', '${MANAGER_ID}', 'lead_lawyer', 'edit', true, '2024-01-02T03:04:05Z', '${USER_MANAGER_ID}', '2024-01-01T00:00:00Z'),
        ('00000000-0000-4000-8000-000000000012', '${CASE_ID}', '${COLLABORATOR_ID}', 'lawyer', 'view', false, '2024-02-03T04:05:06Z', '${USER_MANAGER_ID}', '2024-02-01T00:00:00Z'),
        ('00000000-0000-4000-8000-000000000013', '${CASE_ID}', '${INELIGIBLE_ID}', 'supervisor', 'admin', false, '2024-03-04T05:06:07Z', '${USER_MANAGER_ID}', '2024-03-01T00:00:00Z');
    `)

    await applyMigration(database, migrationSql)

    const memberships = await database<
      {
        collaborator_id: string
        role: string
        archived_legacy: boolean
      }[]
    >`SELECT collaborator_id, role, archived_legacy FROM case_members ORDER BY collaborator_id`
    expect(memberships).toEqual([
      { collaborator_id: MANAGER_ID, role: 'manager', archived_legacy: false },
      { collaborator_id: COLLABORATOR_ID, role: 'collaborator', archived_legacy: false },
      { collaborator_id: INELIGIBLE_ID, role: 'collaborator', archived_legacy: true },
    ])

    const history = await database<
      {
        collaborator_id: string
        actor_id: string | null
        kind: string
        occurred_at: Date
        legacy: Record<string, unknown>
      }[]
    >`SELECT collaborator_id, actor_id, kind, occurred_at, legacy FROM case_team_history ORDER BY collaborator_id`
    expect(history).toHaveLength(3)
    expect(
      history.find((record) => record.collaborator_id === COLLABORATOR_ID),
    ).toMatchObject({
      collaborator_id: COLLABORATOR_ID,
      actor_id: null,
      kind: 'legacy_imported',
      legacy: {
        role: 'lawyer',
        permission: 'view',
        isPrimary: false,
        assignedBy: USER_MANAGER_ID,
      },
    })
    expect(
      history
        .find((record) => record.collaborator_id === COLLABORATOR_ID)
        ?.occurred_at.toISOString(),
    ).toBe('2024-02-03T04:05:06.000Z')
    expect(
      history.find((record) => record.collaborator_id === INELIGIBLE_ID)?.legacy.role,
    ).toBe('supervisor')
  }, 120_000)

  it('reports every case without an eligible manager before changing legacy schema', async () => {
    await database.unsafe(legacySchema)
    await database.unsafe(`
      INSERT INTO cases (id, intake_id) VALUES ('${CASE_ID}', '${INTAKE_ID}');
      INSERT INTO users (id, status) VALUES ('${USER_INELIGIBLE_ID}', 'active');
      INSERT INTO collaborators (id, user_id, profile) VALUES ('${INELIGIBLE_ID}', '${USER_INELIGIBLE_ID}', 'intern');
      INSERT INTO case_members (id, case_id, collaborator_id, role, permission, is_primary, assigned_at, assigned_by, created_at)
      VALUES ('00000000-0000-4000-8000-000000000013', '${CASE_ID}', '${INELIGIBLE_ID}', 'lead_lawyer', 'admin', true, now(), '${USER_INELIGIBLE_ID}', now());
    `)

    await expect(applyMigration(database, migrationSql)).rejects.toThrow(CASE_ID)
    const [member] = await database<
      { role: string; permission: string; is_primary: boolean }[]
    >`
      SELECT role::text, permission, is_primary FROM case_members
    `
    expect(member).toEqual({ role: 'lead_lawyer', permission: 'admin', is_primary: true })
    const tables = await database<{ exists: boolean }[]>`
      SELECT to_regclass('public.case_team_history') IS NOT NULL AS exists
    `
    expect(tables[0].exists).toBe(false)
  }, 120_000)
})

async function applyMigration(database: Sql, migrationSql: string) {
  await database.begin(async (transaction) => {
    for (const statement of migrationSql.split('--> statement-breakpoint')) {
      if (statement.trim()) await transaction.unsafe(statement)
    }
  })
}
