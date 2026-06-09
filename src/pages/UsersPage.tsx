import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { UserCog, Plus, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { User, Role } from '../types';

export function UsersPage() {
  const { db, updateData, logAction } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Consulta',
    active: true
  });

  const availableRoles = ['Administrador', 'Editor', 'Consulta', 'Head de Medios Digitales'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateData('users', db.users.map(u => u.id === editingId ? { ...u, ...formData as User } : u));
      logAction('Edición', `Editó usuario: ${formData.email}`, 'Gestión de Accesos');
    } else {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        ...(formData as Omit<User, 'id'>)
      };
      updateData('users', [...db.users, newUser]);
      logAction('Creación', `Añadió usuario: ${formData.email}`, 'Gestión de Accesos');
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Consulta', active: true });
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setFormData({ ...u });
    setIsModalOpen(true);
  };

  const deleteUser = (id: string, email: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el acceso a ${email}?`)) {
      updateData('users', db.users.filter(u => u.id !== id));
      logAction('Eliminación', `Eliminó usuario: ${email}`, 'Gestión de Accesos');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Accesos</h1>
          <p className="text-gray-500 mt-1">Administra los usuarios y roles que tienen acceso a este portal.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Usuario
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center">
            <UserCog className="w-5 h-5 text-slate-500 mr-2" />
            <h3 className="font-semibold text-slate-800">Usuarios Registrados ({db.users.length})</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {db.users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.email}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${u.role === 'Administrador' ? 'bg-red-50 text-red-700 border-red-200' : 
                      u.role === 'Head de Medios Digitales' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.role === 'Editor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {u.active ? (
                    <span className="inline-flex items-center text-sm font-medium text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-sm font-medium text-gray-400">
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => startEdit(u)} className="text-blue-600 hover:text-blue-900">Editar</button>
                  <button onClick={() => deleteUser(u.id, u.email)} className="text-red-600 hover:text-red-900">Revocar</button>
                </td>
              </tr>
            ))}
            {db.users.length === 0 && (
              <tr>
                 <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 italic">No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Usuario' : 'Añadir Acceso'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ej. Ana Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" placeholder="ana@agencia.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={formData.role as string} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white">
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center mt-4">
                <input type="checkbox" id="user-active" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900" />
                <label htmlFor="user-active" className="ml-2 block text-sm text-gray-900">
                  Usuario Activo (Puede iniciar sesión)
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border text-sm border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-sm text-white rounded-lg font-medium hover:bg-slate-800">{editingId ? 'Guardar Cambios' : 'Conceder Acceso'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
