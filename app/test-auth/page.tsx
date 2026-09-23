// app/test-auth/page.tsx
// Página de prueba: confirma que el proyecto se conecta bien a Supabase Auth.
// Una vez que confirmes que funciona, puedes borrar esta ruta.

import { createClient } from '@/lib/supabase/server'

export default async function TestAuthPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Prueba de conexión con Supabase</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {user ? (
        <p>Sesión activa: {user.email}</p>
      ) : (
        <p>Conexión correcta. No has iniciado sesión (es lo esperado, todavía no hay pantalla de login).</p>
      )}
    </main>
  )
}
