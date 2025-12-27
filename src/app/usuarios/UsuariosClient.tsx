'use client';

import { useState } from 'react';
import FormUsuario from './FormUsuario';
import { deleteUsuario } from './actions';

export default function UsuariosClient({ usuarios }: { usuarios: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function handleDelete(id: number, usuario: string) {
    if (!confirm(`¿Está seguro de eliminar el usuario ${usuario}?`)) {
      return;
    }

    setDeleting(id);
    const result = await deleteUsuario(id);
    
    if (result.error) {
      alert('Error: ' + result.error);
      setDeleting(null);
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Volver al Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Nuevo Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios && usuarios.length > 0 ? (
                  usuarios.map((usuario: any) => (
                    <tr key={usuario.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {usuario.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          usuario.rol === 'administrador' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(usuario.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                        <button className="text-green-600 hover:text-green-900 mr-3">Editar</button>
                        <button
                          onClick={() => handleDelete(usuario.id, usuario.usuario)}
                          disabled={deleting === usuario.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === usuario.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && <FormUsuario onClose={() => setShowForm(false)} />}
    </div>
  );
}
