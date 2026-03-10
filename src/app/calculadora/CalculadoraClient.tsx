'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [mensajeAgente, setMensajeAgente] = useState('¡Hola!');
  const [saludoInicial, setSaludoInicial] = useState(false);
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

  // Función para hablar texto (Text-to-Speech)
  const hablarTexto = useCallback((texto: string) => {
    setMensajeAgente(texto);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = 'es-CO';
      utter.rate = 1.15;
      utter.pitch = 1.0;
      utter.volume = 1;

      const seleccionarVoz = () => {
        const voces = synth.getVoices();
        const preferidas = [
          'Google español de Latinoamérica',
          'Google español',
          'Microsoft Raul Online (Natural)',
          'Microsoft Jorge Online (Natural)',
          'Microsoft Pablo Online (Natural)'
        ];
        const vozElegida = voces.find(v => preferidas.includes(v.name)) || voces.find(v => v.lang.startsWith('es'));
        if (vozElegida) utter.voice = vozElegida;
        synth.speak(utter);
      };

      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = seleccionarVoz;
      } else {
        seleccionarVoz();
      }
    }
  }, []);

  // Saludo inicial según hora del día
  useEffect(() => {
    if (saludoInicial) return;
    
    const hora = new Date().getHours();
    let saludo = `¡Hola ${nombreOperador}!`;

    if (hora < 12) saludo = `¡Buenos días, ${nombreOperador}!`;
    else if (hora < 18) saludo = `¡Buenas tardes, ${nombreOperador}!`;
    else saludo = `¡Buenas noches, ${nombreOperador}!`;

    const timer = setTimeout(() => {
      hablarTexto(saludo);
      setSaludoInicial(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [nombreOperador, hablarTexto, saludoInicial]);

  // Calcular horas y valor del servicio
  const calcularHoras = useCallback(() => {
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

    // Calcular horas completas
    valorServicio = horas * valorHora;
    
    // Calcular minutos adicionales
    if (minutos > 0 && minutos <= 40) {
      // De 1 a 40 minutos: cobrar por minuto
      valorServicio += minutos * valorMinuto;
    } else if (minutos > 40) {
      // De 41 a 59 minutos: cobrar hora completa adicional
      valorServicio += valorHora;
    }

    setResultado({ horas, minutos, valor: valorServicio });

    // Hablar el resultado
    const valorPesos = valorServicio.toLocaleString('es-CO');
    const mensaje = `${nombreOperador}, el tiempo total es ${horas} ${horas === 1 ? 'hora' : 'horas'} y ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}. El valor total del servicio es ${valorPesos} pesos.`;
    hablarTexto(mensaje);
  }, [horaInicio, horaFin, nombreOperador, hablarTexto, valorHora, valorMinuto]);

  // Calcular automáticamente cuando cambian las horas
  useEffect(() => {
    if (horaInicio && horaFin) {
      calcularHoras();
    }
  }, [horaInicio, horaFin, calcularHoras]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">🧮</span> Calculadora de Servicios
          </h1>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">⏱️</span> Calculadora de Horas
          </h2>

          <div className="space-y-6">
            {/* Hora de Inicio */}
            <div>
              <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 mb-2">
                Hora de inicio
              </label>
              <input
                type="time"
                id="horaInicio"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Hora de Fin */}
            <div>
              <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 mb-2">
                Hora de fin
              </label>
              <input
                type="time"
                id="horaFin"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center animate-fadeIn">
                <div className="text-gray-700 mb-2">
                  <span className="font-semibold">Duración:</span>{' '}
                  <span className="text-xl font-bold text-blue-700">
                    {resultado.horas}h {resultado.minutos}min
                  </span>
                </div>
                <div className="text-gray-700">
                  <span className="font-semibold">Valor total:</span>{' '}
                  <span className="text-3xl font-bold text-green-600">
                    ${resultado.valor.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}

            {/* Tabla de tarifas */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">📋 Tarifas</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hora completa: <strong>${valorHora.toLocaleString('es-CO')}</strong></li>
                <li>• Minuto adicional (1-40 min): <strong>${valorMinuto.toLocaleString('es-CO')}/min</strong></li>
                <li>• Más de 40 minutos: <strong>hora completa adicional</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Agente Virtual */}
      <div className="fixed bottom-5 right-5 text-center z-50">
        <div 
          className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-xl overflow-hidden cursor-pointer hover:scale-110 transition-transform animate-slideIn bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"
          onClick={() => hablarTexto(mensajeAgente)}
        >
          <span className="text-4xl">🤖</span>
        </div>
        <div className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-lg max-w-[200px] animate-fadeIn">
          {mensajeAgente}
        </div>
      </div>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes slideIn {
          0% { transform: translateY(100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideIn {
          animation: slideIn 1s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
