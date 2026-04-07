'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    // Limpiar operador seleccionado al cerrar sesión
    if (typeof window !== 'undefined') {
      localStorage.removeItem('operadorSeleccionado');
    }
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Cerrar Sesión
    </button>
  )
}
