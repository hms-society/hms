import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { BROWSER_ENV } from '@/constants'

function createSupabaseClient(): SupabaseClient {
  return createClient(BROWSER_ENV.supabaseUrl, BROWSER_ENV.supabaseKey, {
    auth: {
      flowType: 'implicit',
    },
  })
}

const hotSupabaseClient = import.meta.hot?.data.supabaseClient as
  | SupabaseClient
  | undefined

export const supabaseClient = hotSupabaseClient ?? createSupabaseClient()

if (import.meta.hot) {
  import.meta.hot.data.supabaseClient = supabaseClient
}
