'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const refreshAuthActivity = (userEmail: string) => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(`lastActivity:${userEmail}`, String(Date.now()))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Email o contraseña inválidos')
        return
      }

      refreshAuthActivity(email)
      router.replace('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white font-[family-name:var(--font-geist-sans)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.28),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.18),_transparent_24%),linear-gradient(135deg,_#08111f_0%,_#0d1730_45%,_#101c38_100%)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute right-[-5rem] top-[22rem] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
              Sistema de Planillas
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-white xl:text-6xl">
              Accede a tu panel con una experiencia más limpia y rápida.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Gestiona planillas, viajes, vehículos y reportes desde un acceso más claro, con sesión protegida y cierre automático por inactividad.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              {[
                { label: 'Seguridad', value: '1 sesión' },
                { label: 'Inactividad', value: '10 min aviso' },
                { label: 'Acceso', value: 'Rápido' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 -z-10 translate-y-6 scale-[0.98] rounded-[2rem] bg-black/20 blur-2xl" />
          <div className="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700">Bienvenido</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Iniciar sesión</h2>
              </div>
              <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/15">
                PVO
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
                <p className="font-semibold">No fue posible iniciar sesión</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Correo electrónico
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-cyan-600">
                    @
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <span className="text-xs font-medium text-slate-400">Segura y privada</span>
                </div>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-cyan-600">
                    •
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Entrar al sistema'
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-amber-900">
              <p className="font-semibold uppercase tracking-[0.18em] text-amber-700">Aviso legal</p>
              <p className="mt-2">Copyright © {new Date().getFullYear()} Brayan Arroyave. Todos los derechos reservados.</p>
              <p className="mt-2">Este software ha sido desarrollado por Brayan Arroyave, quien se reconoce como su autor. Todos los derechos sobre el mismo se entienden reservados en la medida permitida por la ley.</p>
              <p className="mt-2">Este aviso no constituye por si mismo una cesion de derechos ni modifica las condiciones contractuales que puedan existir entre las partes.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
