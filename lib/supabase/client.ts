// lib/supabase/client.ts
// Cliente para usar dentro de Client Components ('use client').
// Ejemplo: const supabase = createClient(); await supabase.auth.signInWithPassword(...)

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
