import type { TestProject } from 'vitest/node'

import { DatabaseFixture } from '@/shared/database/fixtures/database-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

declare module 'vitest' {
  export interface ProvidedContext {
    hmsTestServices: {
      databaseTemplateUrl: string
      auth: { url: string; key: string; mailpitUrl: string }
    }
  }
}

export default async function setup(project: TestProject) {
  const originalDatabaseUrl = process.env.DATABASE_URL
  const originalAuthUrl = process.env.SUPABASE_URL
  const originalAuthKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const database = await DatabaseFixture.register({ dedicated: true })
  let auth: SupabaseAuthFixture
  try {
    auth = await SupabaseAuthFixture.register({ dedicated: true })
    project.provide('hmsTestServices', {
      databaseTemplateUrl: database.getConnectionUri(),
      auth: auth.getServiceConfiguration(),
    })
  } catch (error) {
    await auth?.close()
    await database.close()
    throw error
  } finally {
    for (const [name, value] of [
      ['DATABASE_URL', originalDatabaseUrl],
      ['SUPABASE_URL', originalAuthUrl],
      ['SUPABASE_SERVICE_ROLE_KEY', originalAuthKey],
    ]) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
  return async () => {
    try {
      await auth.close()
    } finally {
      await database.close()
    }
  }
}
