import React, { useState } from 'react';
import { UserCog, Plus, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import { AppRole, User, UserPermissions } from '../types';
import { PERMISSION_KEYS, PERMISSION_LABELS, ADMIN_PERMISSIONS, createPermissions, normalizeAppRole } from '../lib/permissions';

type UserFormData = {
  id?: string;
  name: string;
  email: string;
  appRole: AppRole;
  permissions: UserPermissions;
  active: boolean;
};

const emptyForm: UserFormData = {
  name: '',
  email: '',
  appRole: 'member',
  permissions: createPermissions(),
  active: true,
};

function mapApiUser(row: any): User {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    role: row.role || (row.app_role === 'admin' ? 'Administrador' : 'Miembro'),
    appRole: normalizeAppRole(row.role, row.app_role),
    permissions: row.permissions || {},
    active: Boolean(row.active),
    canEdit: Boolean(row.can_edit),
  };
}

export function UsersPage() {
  const { db, refreshData, logAction } = useDatabase();
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const startCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const startEdit = (user: User) => {
    const appRole = normalizeAppRole(user.role, user.appRole);
    setEditingId(user.id);
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      appRole,
      permissions: appRole === 'admin' ? ADMIN_PERMISSIONS : createPermissions(user.permissions),
      active: user.active,
    });
    setIsModalOpen(true);
  };

  const callAdminUsersApi = async (method: 'POST' | 'DELETE', payload: Record<string, unknown>) => {
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesion activa.');

    const response = await fetch('/api/admin-users', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar el usuario.');
    return mapApiUser(result.user);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.email || !formData.name) return;

    setLoading(true);
    try {
      const savedUser = await callAdminUsersApi('POST', {
        id: editingId || undefined,
        name: formData.name,
        email: formData.email,
        appRole: formData.appRole,
        permissions: formData.appRole === 'admin' ? ADMIN_PERMISSIONS : formData.permissions,
        active: formData.active,
      });

      await refreshData();
      await logAction(editingId ? 'Edicion' as any : 'Creacion' as any, `Usuario: ${savedUser.email}`, 'Gestion de Accesos');
      closeModal();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Hubo un error al guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const revokeUser = async (user: User) => {
    if (!window.confirm(`Revocar acceso para ${user.email}?`)) return;

    setLoading(true);
    try {
      await callAdminUsersApi('DELETE', { email: user.email });
      await refreshData();
      await logAction('Eliminacion' as any, `Revoco usuario: ${user.email}`, 'Gestion de Accesos');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'No se pudo revocar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: keyof UserPermissions) => {
    setFormData((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permission]: !current.permissions[permission],
      },
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestion de Accesos</h1>
          <p className="text-gray-500 mt-1">Administra usuarios, whitelist y permisos del portal.</p>
        </div>
        <button
          onClick={startCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
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
            {db.users.map((item) => {
              const appRole = normalizeAppRole(item.role, item.appRole);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                        {(item.name || item.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${appRole === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {appRole === 'admin' ? 'Admin' : 'Miembro'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {item.active ? (
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
                    <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-900">Editar</button>
                    <button onClick={() => revokeUser(item)} disabled={loading} className="text-red-600 hover:text-red-900 disabled:opacity-50">Revocar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Usuario' : 'Agregar Usuario'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">x</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol base</label>
                <select
                  value={formData.appRole}
                  onChange={(event) => {
                    const nextRole = event.target.value as AppRole;
                    setFormData({
                      ...formData,
                      appRole: nextRole,
                      permissions: nextRole === 'admin' ? ADMIN_PERMISSIONS : createPermissions(formData.permissions),
                    });
                  }}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.appRole === 'member' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Permisos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSION_KEYS.map((permission) => (
                      <label key={permission} className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.permissions[permission] === true}
                          onChange={() => togglePermission(permission)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span>{PERMISSION_LABELS[permission]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(event) => setFormData({ ...formData, active: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="ml-2">Usuario activo</span>
              </label>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 border text-sm border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-sm text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
