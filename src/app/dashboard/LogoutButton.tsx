'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    // Limpiar operador seleccionado al cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('operadorSeleccionado');
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('pinValidado:')) {
          sessionStorage.removeItem(key);
        }
      }
    }
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      Cerrar Sesión
    </button>
  )
}
