import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const setupPresence = async (userId: string, username: string) => {
  if (!supabase) {
    console.warn('Supabase is not configured. Presence features are disabled.')
    return
  }

  await supabase.from('players').upsert({
    id: userId,
    username,
    is_online: true,
    last_active: new Date().toISOString(),
  })

  window.addEventListener('beforeunload', async () => {
    await supabase.from('players').update({ is_online: false }).eq('id', userId)
  })
}