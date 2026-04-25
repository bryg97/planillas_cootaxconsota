"use client";

import { useEffect, useState } from "react";

export default function ValidarPinModal({
  email,
  rol,
  onValidated,
}: {
  email: string;
  rol: string;
  onValidated: () => void;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendingDynamicPin, setSendingDynamicPin] = useState(false);
  const [dynamicPinSent, setDynamicPinSent] = useState(false);

  const esAdministrador = rol === 'administrador';

  async function solicitarPinDinamico() {
    if (!esAdministrador) {
      return;
    }

    setSendingDynamicPin(true);
    setError('');

    try {
      const response = await fetch('/api/admin-pin-dinamico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setError(data?.error || 'No se pudo enviar el PIN dinamico.');
        setSendingDynamicPin(false);
        return;
      }

      setDynamicPinSent(true);
    } catch {
      setError('Error de conexion enviando PIN dinamico.');
    } finally {
      setSendingDynamicPin(false);
    }
  }

  useEffect(() => {
    if (!esAdministrador) {
      return;
    }

    void solicitarPinDinamico();
  }, [esAdministrador]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (esAdministrador && !/^\d{6}$/.test(pin)) {
      setError('Ingrese el PIN dinamico de 6 digitos.');
      return;
    }

    if (!esAdministrador && !/^\d{4,8}$/.test(pin)) {
      setError('Ingrese un PIN numerico de 4 a 8 digitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/validar-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setError(data?.error || 'No fue posible validar el PIN.');
        setLoading(false);
        return;
      }

      onValidated();
    } catch {
      setError('Error de conexion al validar PIN.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/95 p-7 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <div className="pointer-events-none absolute -left-14 top-[-5rem] h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="pointer-events-none absolute right-[-4rem] top-12 h-36 w-36 rounded-full bg-emerald-200/50 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Seguridad
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Validación por PIN</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {esAdministrador
              ? 'Ingresa el PIN dinamico enviado a tu correo y al canal de Telegram.'
              : 'Ingresa tu PIN de acceso para continuar al panel de control.'}
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Cuenta: <span className="font-semibold text-slate-700">{email}</span>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {esAdministrador && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                {dynamicPinSent ? 'PIN dinamico enviado. Revisa correo y Telegram.' : 'Enviando PIN dinamico...'}
              </div>
            )}
            <div>
              <label htmlFor="pin" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {esAdministrador ? 'PIN dinamico' : 'PIN de acceso'}
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                autoFocus
                maxLength={esAdministrador ? 6 : 8}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg tracking-[0.35em] text-slate-900 outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
                placeholder={esAdministrador ? 'PIN de 6 digitos' : 'PIN de 4 a 8 digitos'}
              />
            </div>
            {esAdministrador && (
              <button
                type="button"
                onClick={() => {
                  void solicitarPinDinamico();
                }}
                disabled={sendingDynamicPin}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingDynamicPin ? 'Reenviando PIN...' : 'Reenviar PIN dinamico'}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-950/30 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Validando...
                </>
              ) : (
                'Continuar al dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
