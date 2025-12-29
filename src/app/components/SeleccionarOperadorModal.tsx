"use client";
import { useState } from "react";

export default function SeleccionarOperadorModal({ operadores, onSelect }: { operadores: any[]; onSelect: (op: any) => void }) {
  const [selectedId, setSelectedId] = useState<number|null>(null);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Seleccione su identidad</h2>
        <p className="mb-4 text-gray-600">Este correo está vinculado a varios operadores. Seleccione su nombre para continuar:</p>
        <ul className="mb-6 space-y-2">
          {operadores.map((op: any) => (
            <li key={op.id}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="operador"
                  value={op.id}
                  checked={selectedId === op.id}
                  onChange={() => setSelectedId(op.id)}
                  className="accent-blue-600"
                />
                <span className="font-medium text-gray-900">{op.nombre}</span>
              </label>
            </li>
          ))}
        </ul>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
          disabled={selectedId === null}
          onClick={() => {
            const op = operadores.find((o: any) => o.id === selectedId);
            if (op) onSelect(op);
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
