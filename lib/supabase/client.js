import { createClient as _createClient } from '@supabase/supabase-js'

let client

export function createClient() {
  if (client) return client
  client = _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return client
}
