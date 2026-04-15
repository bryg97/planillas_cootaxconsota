"use client";

import { useState } from "react";

export default function ValidarPinModal({
  email,
  onValidated,
}: {
  email: string;
  onValidated: () => void;
}) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!/^\d{4,8}$/.test(pin)) {
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-2">Validacion de seguridad</h2>
        <p className="mb-4 text-gray-600">Ingrese su PIN de acceso para continuar.</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoFocus
            maxLength={8}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="PIN de 4 a 8 digitos"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Validando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
