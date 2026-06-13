import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { usePermissions } from '../hooks/usePermissions';
import { Wrench, Eye, EyeOff, Plus, Search, HelpCircle, Edit2, Trash2, KeyRound } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { SharedTool } from '../types';
import { supabase } from '../lib/supabase';
import { TOTPBlock } from '../components/TOTPBlock';

export function ToolsPage() {
  const { db, updateData, logAction } = useDatabase();
  const { isFullAccess, canManageTools, canRevealCredentials } = usePermissions();
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [viewedTool, setViewedTool] = useState<SharedTool | null>(null);
  
  const [formData, setFormData] = useState<Partial<SharedTool>>({
    name: '',
    utilidad: '',
    loginType: 'Correo y Contraseña',
    user: '',
    password: '',
    emailLinked: '',
    mfaMethod: 'Ninguno',
    smsPhone: '',
    smsResponsible: '',
    authAppResponsible: '',
    authAppEmail: '',
    emailReceiver: '',
    notes: '',
  });

  const handleRevealPassword = (toolId: string) => {
    setShowPasswordFor(toolId);
    logAction('Visualización contraseña', `ID plataforma / herramienta: ${toolId}`, 'Herramientas');
    setTimeout(() => {
      setShowPasswordFor(curr => curr === toolId ? null : curr);
    }, 10000);
  };

  const handleEdit = (tool: SharedTool, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(tool);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (tool: SharedTool, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar la herramienta ${tool.name}?`)) {
      try {
        const { error } = await supabase.from('tools_agency').delete().eq('id', tool.id);
        if (error && error.code !== 'PGRST116') {
          await supabase.from('tools').delete().eq('id', tool.id);
        }
      } catch (err) {}
      updateData('sharedTools', db.sharedTools.filter(t => t.id !== tool.id));
      logAction('Eliminación', `Herramienta eliminada: ${tool.name}`, 'Herramientas');
      if (viewedTool?.id === tool.id) setViewedTool(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.user) return;
    
    const isEditing = !!formData.id;
    const newTool: SharedTool = {
      ...(formData as SharedTool),
      id: formData.id || `tool-${Date.now()}`,
      passwordDate: formData.id ? (formData.password !== db.sharedTools.find(t=>t.id === formData.id)?.password ? new Date().toISOString() : (formData.passwordDate || new Date().toISOString())) : new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('tools_agency').upsert([{
        id: newTool.id,
        name: newTool.name,
        utilidad: newTool.utilidad,
        login_type: newTool.loginType,
        user_id_email: newTool.user,
        password: newTool.password,
        email_linked: newTool.emailLinked,
        mfa_method: newTool.mfaMethod,
        sms_phone: newTool.smsPhone,
        sms_responsible: newTool.smsResponsible,
        auth_app_responsible: newTool.authAppResponsible,
        auth_app_email: newTool.authAppEmail,
        email_receiver: newTool.emailReceiver,
        notes: newTool.notes,
        password_date: newTool.passwordDate,
        totp_secret: newTool.totpSecret
      }]);
    } catch(err) { console.error(err); }

    if (isEditing) {
      updateData('sharedTools', db.sharedTools.map(t => t.id === newTool.id ? newTool : t));
      logAction('Edición', `Herramienta editada: ${newTool.name}`, 'Herramientas');
      if (viewedTool?.id === newTool.id) setViewedTool(newTool);
    } else {
      updateData('sharedTools', [...db.sharedTools, newTool]);
      logAction('Creación', `Nueva herramienta: ${newTool.name}`, 'Herramientas');
    }
    
    setIsFormModalOpen(false);
  };

  const filteredTools = db.sharedTools.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Herramientas Compartidas</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de accesos y software compartido de la agencia.</p>
        </div>
        {(isFullAccess || canManageTools) && (
          <button 
            onClick={() => {
              setFormData({
                name: '', utilidad: '', loginType: 'Correo y Contraseña', user: '', 
                password: '', emailLinked: '', mfaMethod: 'Ninguno', smsPhone: '',
                smsResponsible: '', authAppResponsible: '', authAppEmail: '', emailReceiver: '', notes: ''
              });
              setIsFormModalOpen(true);
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Herramienta
          </button>
        )}
      </div>

      <div className="bg-white border rounded-xl border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar herramienta por nombre o correo..." 
              className="w-full text-sm pl-9 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herramienta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario / Correo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MFA</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTools.map((tool) => (
              <tr 
                key={tool.id} 
                onClick={() => setViewedTool(tool)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={tool.utilidad || tool.notes}>{tool.utilidad || tool.notes}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{tool.user}</div>
                  <div className="text-xs text-gray-500">Vinculado a: {tool.emailLinked || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center py-0.5 px-2.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    <HelpCircle className="w-3 h-3 mr-1 text-gray-500" />
                    {tool.mfaMethod || 'Ninguno'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {(isFullAccess || canManageTools) ? (
                      <>
                        <button onClick={(e) => handleEdit(tool, e)} className="text-gray-500 hover:text-slate-900 bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded p-1.5 transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(tool, e)} className="text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 border border-transparent hover:border-red-200 rounded p-1.5 transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button className="text-gray-500 hover:text-slate-900 bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded p-1.5 transition-colors" title="Ver Detalles">
                        Ver
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTools.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron herramientas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Visor de Herramienta */}
      {viewedTool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Detalles de {viewedTool.name}</h3>
              <button onClick={() => setViewedTool(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-2">Información General</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-gray-500 mb-1">Utilidad</span>
                    <p className="text-sm text-gray-900 font-medium">{viewedTool.utilidad || 'No especificada'}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-gray-500 mb-1">Tipo de Ingreso</span>
                    <p className="text-sm text-gray-900 font-medium">{viewedTool.loginType || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-2">Credenciales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-gray-500 mb-1">Usuario / ID de acceso</span>
                    <p className="text-sm text-gray-900 font-medium">{viewedTool.user}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="block text-xs text-gray-500 mb-1">Correo Vinculado</span>
                    <p className="text-sm text-gray-900 font-medium">{viewedTool.emailLinked || 'N/A'}</p>
                  </div>
                  {viewedTool.loginType !== 'Asignación' && (
                    <div className="col-span-2">
                       <span className="block text-xs text-gray-500 mb-1">Contraseña</span>
                       <div className="flex items-center">
                         <div className="font-mono text-sm bg-gray-100 border border-gray-200 px-3 py-1.5 rounded text-gray-800 select-all min-w-[200px]">
                           {showPasswordFor === viewedTool.id && canRevealCredentials ? viewedTool.password : '••••••••••••••••'}
                         </div>
                         <button 
                           onClick={() => {
                             if (!canRevealCredentials) return;
                             showPasswordFor === viewedTool.id ? setShowPasswordFor(null) : handleRevealPassword(viewedTool.id);
                           }}
                           disabled={!canRevealCredentials}
                           title={canRevealCredentials ? 'Revelar contraseña' : 'Sin permiso para revelar contraseña'}
                           className="ml-2 p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded transition-colors"
                         >
                           {showPasswordFor === viewedTool.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                         {viewedTool.passwordDate && (
                           <span className="ml-3 text-xs text-gray-400">Actualizada: {formatDate(viewedTool.passwordDate)}</span>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-2">Autenticación Multifactor (MFA)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <span className="block text-xs text-gray-500 mb-1">Método Principal</span>
                    <span className="inline-flex items-center py-0.5 px-2.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      {viewedTool.mfaMethod || 'Ninguno'}
                    </span>
                  </div>
                  
                  {viewedTool.mfaMethod === 'SMS' && (
                    <>
                      <div className="col-span-2 md:col-span-1">
                        <span className="block text-xs text-gray-500 mb-1">Teléfono destino</span>
                        <p className="text-sm text-gray-900 font-medium">{viewedTool.smsPhone || 'No registrado'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="block text-xs text-gray-500 mb-1">Responsable del teléfono</span>
                        <p className="text-sm text-gray-900 font-medium">{viewedTool.smsResponsible || 'No registrado'}</p>
                      </div>
                    </>
                  )}

                  {viewedTool.mfaMethod === 'App Autenticadora' && (
                    <>
                      <div className="col-span-2 md:col-span-1">
                        <span className="block text-xs text-gray-500 mb-1">App Auth Responsable</span>
                        <p className="text-sm text-gray-900 font-medium">{viewedTool.authAppResponsible || 'No registrado'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="block text-xs text-gray-500 mb-1">Correo de acceso Auth App</span>
                        <p className="text-sm text-gray-900 font-medium">{viewedTool.authAppEmail || 'No registrado'}</p>
                      </div>
                    </>
                  )}

                  {(viewedTool.mfaMethod === 'Correo' || viewedTool.mfaMethod === 'Correo electrónico') && (
                    <div className="col-span-2">
                      <span className="block text-xs text-gray-500 mb-1">Correo receptor de códigos</span>
                      <p className="text-sm text-gray-900 font-medium">{viewedTool.emailReceiver || 'No registrado'}</p>
                    </div>
                  )}
                </div>

                {(viewedTool.mfaMethod === 'App Autenticadora' || viewedTool.totpSecret) ? (
                  <TOTPBlock 
                    initialSecret={viewedTool.totpSecret} 
                    itemId={viewedTool.id} 
                    table="tools_agency" 
                    onSecretSaved={(secret) => {
                      const updatedTool = { ...viewedTool, totpSecret: secret };
                      setViewedTool(updatedTool);
                      updateData('sharedTools', db.sharedTools.map(t => t.id === updatedTool.id ? updatedTool : t));
                    }} 
                  />
                ) : ((isFullAccess || canManageTools) && (
                  <div className="mt-4 flex items-center bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 border-dashed">
                    <KeyRound className="w-4 h-4 text-indigo-500 mr-2" />
                    <span className="text-sm text-gray-600 flex-1">¿Quieres integrar la generación de códigos aquí?</span>
                    <button 
                      onClick={async () => {
                        const updatedTool: SharedTool = { ...viewedTool, mfaMethod: 'App Autenticadora' };
                        setViewedTool(updatedTool);
                        updateData('sharedTools', db.sharedTools.map(t => t.id === updatedTool.id ? updatedTool : t));
                        try {
                           await supabase.from('tools_agency').update({ mfa_method: 'App Autenticadora' }).eq('id', viewedTool.id);
                        } catch(e) {}
                      }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded shadow-sm hover:shadow transition-all"
                    >
                      Añadir App Autenticadora
                    </button>
                  </div>
                ))}
              </div>

              {viewedTool.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 border-b pb-2">Notas adicionales</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewedTool.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
               <button onClick={() => setViewedTool(null)} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cerrar
               </button>
               {(isFullAccess || canManageTools) && (
                 <button 
                  onClick={() => {
                    setViewedTool(null);
                    setFormData(viewedTool);
                    setIsFormModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center"
                 >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Herramienta
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Formulario Modal (Crear/Editar) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full flex flex-col my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{formData.id ? 'Editar Herramienta' : 'Nueva Herramienta'}</h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6">
              <form id="tool-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Información General */}
                <div>
                   <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">
                     <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">1</span>
                     Información General
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la Herramienta *</label>
                       <input 
                         type="text" required
                         value={formData.name || ''}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                         placeholder="Ej: Semrush, Canva, ChatGPT..."
                       />
                     </div>
                     <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-medium text-gray-700 mb-1">Utilidad (Para qué sirve)</label>
                       <input 
                         type="text"
                         value={formData.utilidad || ''}
                         onChange={(e) => setFormData({...formData, utilidad: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                         placeholder="Ej: Investigación de palabras clave..."
                       />
                     </div>
                   </div>
                </div>

                {/* 2. Tipo de acceso y credenciales */}
                <div>
                   <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">
                     <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">2</span>
                     Acceso y Credenciales
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Ingreso</label>
                        <select 
                          value={formData.loginType || 'Correo y Contraseña'}
                          onChange={(e) => setFormData({...formData, loginType: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none max-w-sm"
                        >
                          <option value="Correo y Contraseña">Correo y Contraseña</option>
                          <option value="Asignación">Asignación por invitación directa (OAuth / SSO / Directo al email)</option>
                        </select>
                     </div>
                     <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-medium text-gray-700 mb-1">Usuario / ID Empleado / Correo Principal *</label>
                       <input 
                         type="text" required
                         value={formData.user || ''}
                         onChange={(e) => setFormData({...formData, user: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                       />
                     </div>
                     <div className="col-span-2 md:col-span-1">
                       <label className="block text-xs font-medium text-gray-700 mb-1">Correo Vinculado / Recuperación</label>
                       <input 
                         type="email"
                         value={formData.emailLinked || ''}
                         onChange={(e) => setFormData({...formData, emailLinked: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                       />
                     </div>
                     
                     {formData.loginType !== 'Asignación' && (
                       <div className="col-span-2 md:col-span-1">
                         <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
                         <input 
                           type="text"
                           value={formData.password || ''}
                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                         />
                       </div>
                     )}
                   </div>
                </div>

                {/* 3. Autenticación Multifactor */}
                <div>
                   <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">
                     <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">3</span>
                     Autenticación Multifactor (MFA)
                   </h4>
                   <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="col-span-2">
                         <label className="block text-xs font-medium text-gray-700 mb-1">Método MFA Principal</label>
                         <select 
                           value={formData.mfaMethod || 'Ninguno'}
                           onChange={(e) => setFormData({...formData, mfaMethod: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none max-w-sm"
                         >
                           <option value="Ninguno">Ninguno</option>
                           <option value="SMS">SMS (Mensaje de texto)</option>
                           <option value="App Autenticadora">App Autenticadora (Google Auth / Authy / Microsoft Auth)</option>
                           <option value="Correo">Correo electrónico</option>
                         </select>
                       </div>

                       {formData.mfaMethod === 'SMS' && (
                         <>
                           <div className="col-span-2 md:col-span-1">
                             <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono destino</label>
                             <input type="text" value={formData.smsPhone || ''} onChange={e => setFormData({...formData, smsPhone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="+52 55..." />
                           </div>
                           <div className="col-span-2 md:col-span-1">
                             <label className="block text-xs font-medium text-gray-700 mb-1">Responsable del teléfono</label>
                             <input type="text" value={formData.smsResponsible || ''} onChange={e => setFormData({...formData, smsResponsible: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="Nombre de persona..." />
                           </div>
                         </>
                       )}

                       {formData.mfaMethod === 'App Autenticadora' && (
                         <>
                           <div className="col-span-2 md:col-span-1">
                             <label className="block text-xs font-medium text-gray-700 mb-1">Responsable App Auth</label>
                             <input type="text" value={formData.authAppResponsible || ''} onChange={e => setFormData({...formData, authAppResponsible: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="Nombre de persona..." />
                           </div>
                           <div className="col-span-2 md:col-span-1">
                             <label className="block text-xs font-medium text-gray-700 mb-1">Correo de acceso a la App</label>
                             <input type="email" value={formData.authAppEmail || ''} onChange={e => setFormData({...formData, authAppEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900" />
                           </div>
                         </>
                       )}

                       {(formData.mfaMethod === 'Correo' || formData.mfaMethod === 'Correo electrónico') && (
                         <div className="col-span-2 md:col-span-1">
                           <label className="block text-xs font-medium text-gray-700 mb-1">Correo de recepción de código</label>
                           <input type="email" value={formData.emailReceiver || ''} onChange={e => setFormData({...formData, emailReceiver: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900" />
                         </div>
                       )}
                     </div>
                   </div>
                </div>

                {/* 4. Notas */}
                <div>
                   <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">
                     <span className="bg-gray-100 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">4</span>
                     Notas
                   </h4>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Notas u observaciones adicionales</label>
                   <textarea 
                     value={formData.notes || ''}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px] resize-y"
                     placeholder="Detalles sobre licenciamiento, fecha de renovación, límites de cuentas, etc."
                   />
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl sticky bottom-0">
              <button 
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="tool-form"
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                {formData.id ? 'Guardar Cambios' : 'Crear Herramienta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
