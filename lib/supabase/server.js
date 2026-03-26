import { createClient as _createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          // Forward the auth cookie so RLS and getUser() work server-side
          cookie: cookieStore.getAll()
            .map(({ name, value }) => `${name}=${value}`)
            .join('; '),
        },
      },
    }
  )
}
