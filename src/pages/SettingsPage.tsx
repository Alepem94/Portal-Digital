import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';

export function SettingsPage() {
  const { db, updateData } = useDatabase();
  
  const [agencyName, setAgencyName] = useState('República Digital');
  const [logoChar, setLogoChar] = useState('★');
  const [primaryColor, setPrimaryColor] = useState('black');

  // Cargar info
  useEffect(() => {
    // Para simplificar, lo guardamos en localStorage aparte o en db.
    const savedName = localStorage.getItem('agency_name');
    if (savedName) setAgencyName(savedName);
    
    const savedLogo = localStorage.getItem('agency_logo');
    if (savedLogo) setLogoChar(savedLogo);
    
    const savedColor = localStorage.getItem('agency_color');
    if (savedColor) setPrimaryColor(savedColor);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('agency_name', agencyName);
    localStorage.setItem('agency_logo', logoChar);
    localStorage.setItem('agency_color', primaryColor);
    alert('Configuración guardada. Recarga la página para ver los cambios en toda la aplicación.');
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuración de la Agencia</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Agencia</label>
          <input 
            type="text" 
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Letra del Logo (1-2 caracteres)</label>
          <input 
            type="text" 
            maxLength={2}
            value={logoChar}
            onChange={(e) => setLogoChar(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">Color Principal</label>
          <select 
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
          >
            <option value="black">Negro Absoluto</option>
            <option value="slate">Gris Pizarra</option>
            <option value="blue">Azul (#0047b3)</option>
            <option value="red">Rojo (#e50000)</option>
            <option value="indigo">Índigo</option>
            <option value="purple">Morado</option>
          </select>
        </div>

        <button 
          type="submit"
          className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
