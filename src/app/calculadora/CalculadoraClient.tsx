'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalculadoraClientProps {
  nombreUsuario: string;
  valorHora: number;
  valorMinuto: number;
}

export default function CalculadoraClient({ nombreUsuario, valorHora, valorMinuto }: CalculadoraClientProps) {
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [resultado, setResultado] = useState<{ horas: number; minutos: number; valor: number } | null>(null);
  const [nombreOperador, setNombreOperador] = useState(nombreUsuario);

  // Obtener nombre del operador seleccionado desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('operadorSeleccionado');
    if (stored) {
      try {
        const op = JSON.parse(stored);
        if (op && op.nombre) {
          setNombreOperador(op.nombre);
        }
      } catch (e) {
        console.error('Error parsing operador:', e);
      }
    }
  }, []);

  // Calcular horas y valor del servicio
  const calcularHoras = () => {
    if (!horaInicio || !horaFin) {
      setResultado(null);
      return;
    }

    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);

    let inicioMin = h1 * 60 + m1;
    let finMin = h2 * 60 + m2;

    // Si la hora fin es menor que la de inicio, asumimos que pasó la medianoche
    if (finMin < inicioMin) finMin += 24 * 60;

    const totalMin = finMin - inicioMin;
    const horas = Math.floor(totalMin / 60);
    const minutos = totalMin % 60;

    let valorServicio = 0;

    if (horas === 0) {
      // Menos de 1 hora (0 a 60 minutos): cobrar hora completa
      valorServicio = Number(valorHora);
    } else {
      // 1 hora o más: aplicar fórmula
      // Calcular horas completas
      valorServicio = horas * Number(valorHora);
      
      // Calcular minutos adicionales
      if (minutos > 0 && minutos <= 40) {
        // De 1 a 40 minutos: cobrar por minuto
        valorServicio += minutos * Number(valorMinuto);
      } else if (minutos > 40) {
        // De 41 a 59 minutos: cobrar hora completa adicional
        valorServicio += Number(valorHora);
      }
    }

    setResultado({ horas, minutos, valor: valorServicio });
  };

  // Calcular automáticamente cuando cambian las horas
  useEffect(() => {
    if (horaInicio && horaFin) {
      calcularHoras();
    }
  }, [horaInicio, horaFin]);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-6 text-white shadow-2xl sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Módulo calculadora</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Calculadora de servicios</h1>
              <p className="mt-2 text-sm text-white/75">Operador activo: <span className="font-semibold text-white">{nombreOperador}</span></p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tarifa hora</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">${valorHora.toLocaleString('es-CO')}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tarifa minuto (1-40)</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">${valorMinuto.toLocaleString('es-CO')}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Regla adicional</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Minutos 41-59 suman hora completa</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Datos del servicio</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="horaInicio" className="mb-2 block text-sm font-medium text-slate-700">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  id="horaInicio"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="horaFin" className="mb-2 block text-sm font-medium text-slate-700">
                  Hora de fin
                </label>
                <input
                  type="time"
                  id="horaFin"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reglas de cálculo</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Menos de 1 hora (0-60 min): cobra hora completa.</li>
                <li>Desde 1 hora: cobra horas completas más minutos 1-40.</li>
                <li>Minutos 41-59: cobra hora adicional completa.</li>
                <li>Si la hora fin es menor, se asume cruce de medianoche.</li>
              </ul>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resultado</p>

              {!resultado && (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500 ring-1 ring-inset ring-slate-200">
                  Ingresa hora de inicio y fin para calcular el servicio.
                </div>
              )}

              {resultado && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Duración</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{resultado.horas}h {resultado.minutos}min</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-inset ring-emerald-200">
                    <p className="text-xs uppercase tracking-wide text-emerald-700">Valor total</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">${resultado.valor.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
