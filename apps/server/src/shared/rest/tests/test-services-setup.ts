import { createClient } from '@supabase/supabase-js'
import { beforeAll, inject } from 'vitest'

const services = inject('hmsTestServices')
process.env.HMS_TEST_DATABASE_TEMPLATE_URL = services.databaseTemplateUrl
process.env.HMS_TEST_AUTH_URL = services.auth.url
process.env.HMS_TEST_AUTH_KEY = services.auth.key

// Files run sequentially. Clear the run-owned Auth service before any file
// starts its fixtures, including users created by invitation controllers.
beforeAll(async () => {
  const client = createClient(services.auth.url, services.auth.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 100 })
    if (error) throw error
    if (data.users.length === 0) break
    for (const user of data.users) {
      const deleted = await client.auth.admin.deleteUser(user.id)
      if (deleted.error) throw deleted.error
    }
  }
  const cleared = await fetch(`${services.auth.mailpitUrl}/api/v1/messages`, {
    method: 'DELETE',
  })
  if (!cleared.ok) throw new Error(`Mailpit reset failed: ${cleared.status}`)
})
