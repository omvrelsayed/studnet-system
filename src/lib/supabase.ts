import { createClient } from '@supabase/supabase-js'

// Same Supabase project as the management system (Pro-Rest-Auth). The publishable
// key is safe to ship to the client; Row-Level Security scopes every table to the
// signed-in teacher (owner_id = auth.uid()).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://rbyidxyjvmbynioilovt.supabase.co'
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NYhJYFel5pfMFXyE5cH6xg_23VCVyrY'

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
})
