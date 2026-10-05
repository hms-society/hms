import { createClient } from '@supabase/supabase-js'

async function checkSeedAuth() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || !process.env.HMS_USER_SEED_PASSWORD) {
    console.error(
      'Seed preflight failed: Supabase URL, admin key and seed password are required.',
    )
    process.exitCode = 1
    return
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) =>
          fetch(url, { ...options, signal: AbortSignal.timeout(15_000) }),
      },
    })
    let page = 1
    while (true) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      if (typeof data.nextPage !== 'number') break
      page = data.nextPage
    }
    console.log('Seed preflight passed: Auth admin user listing is available.')
  } catch (error) {
    const message = String(error?.message ?? 'Unknown Auth error')
      .split(serviceRoleKey)
      .join('[REDACTED]')
      .replace(
        /Bearer\s+\S+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]+/gi,
        '[REDACTED]',
      )
    console.error(
      'Seed preflight failed:',
      JSON.stringify({
        status: typeof error?.status === 'number' ? error.status : undefined,
        code: typeof error?.code === 'string' ? error.code : undefined,
        message,
      }),
    )
    process.exitCode = 1
  }
}

await checkSeedAuth()
