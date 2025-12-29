'use client';


import { useState } from 'react';
import { createUsuario, editarUsuario } from './actions';

type Usuario = {
  id?: number;
  usuario: string;
  rol: string;
};

type FormUsuarioProps = {
  onClose: () => void;
  usuarioData?: Usuario | null;
  modo?: 'ver' | 'editar' | 'crear';
};

export default function FormUsuario({ onClose, usuarioData = null, modo = 'crear' }: FormUsuarioProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (modo === 'ver') return;
    const formData = new FormData(e.currentTarget);
    let result;
    if (modo === 'crear') {
      result = await createUsuario(formData);
    } else if (modo === 'editar') {
      result = await editarUsuario(usuarioData?.id, formData);
    }
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      window.location.reload();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">
          {modo === 'ver' ? 'Ver Usuario' : modo === 'editar' ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario (Email) *
            </label>
            <input
              type="email"
              name="usuario"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="usuario@example.com"
              defaultValue={usuarioData?.usuario || ''}
              disabled={modo !== 'crear'}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña{modo === 'crear' ? ' *' : ' (dejar en blanco para no cambiar)'}
            </label>
            <input
              type="password"
              name="clave"
              minLength={modo === 'crear' ? 6 : undefined}
              required={modo === 'crear'}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={modo === 'crear' ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiar'}
              autoComplete="new-password"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol *
            </label>
            <select
              name="rol"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={usuarioData?.rol || ''}
              disabled={modo === 'ver'}
            >
              <option value="">Seleccione un rol</option>
              <option value="operador">Operador</option>
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            {modo === 'crear' && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            )}
            {modo === 'editar' && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
