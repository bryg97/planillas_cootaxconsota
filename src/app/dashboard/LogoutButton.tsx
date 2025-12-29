'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    // Limpiar operador seleccionado al cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('operadorSeleccionado');
    }
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Cerrar Sesión
    </button>
  )
}
