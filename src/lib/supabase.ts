import { createClient } from '@supabase/supabase-js'

declare const process: { env: Record<string, string | undefined> }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing environment variable NEXT_PUBLIC_SUPABASE_URL (Supabase client cannot be created).'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase client cannot be created).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

