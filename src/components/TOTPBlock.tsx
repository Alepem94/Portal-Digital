import React, { useState, useEffect } from 'react';
import { TOTP } from 'totp-generator';
import { Copy, RefreshCw, KeyRound, Check } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../lib/supabase';

interface TOTPBlockProps {
  initialSecret?: string;
  itemId: string;
  table: 'tools_agency' | 'instagram' | 'tiktok' | 'facebook_pages';
  onSecretSaved?: (secret: string) => void;
}

export function TOTPBlock({ initialSecret, itemId, table, onSecretSaved }: TOTPBlockProps) {
  const [secret, setSecret] = useState(initialSecret || '');
  const [isEditing, setIsEditing] = useState(!initialSecret);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied, setCopied] = useState(false);
  const { logAction } = useDatabase();

  useEffect(() => {
    if (!initialSecret && !isEditing) {
      setIsEditing(true);
    }
    if (initialSecret) {
      setSecret(initialSecret);
      setIsEditing(false);
    }
  }, [initialSecret]);

  useEffect(() => {
    if (!secret || isEditing) return;

    let mounted = true;

    const generateCode = async () => {
      try {
        const { otp } = await TOTP.generate(secret.replace(/\s+/g, '').toUpperCase());
        if (mounted) {
          setCode(otp);
          
          // Calculate remaining seconds
          const epoch = Math.floor(Date.now() / 1000);
          setTimeLeft(30 - (epoch % 30));
        }
      } catch (e) {
        console.error("Invalid TOTP Secret", e);
        if (mounted) setCode('Error');
      }
    };

    generateCode();
    const interval = setInterval(generateCode, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    }
  }, [secret, isEditing]);

  const handleSave = async () => {
    if (!secret) return;
    
    // Guardar en Supabase y localmente
    try {
      const { error } = await supabase.from(table).update({ totp_secret: secret }).eq('id', itemId);
      if (error && error.code !== 'PGRST116') {
        console.error('Error saving totp secret:', error);
      }
    } catch (err) {
      console.error(err);
    }
    
    setIsEditing(false);
    if (onSecretSaved) onSecretSaved(secret);
    logAction('Edición', `Agregada/Modificada llave 2FA a ${itemId}`, table === 'tools_agency' ? 'Herramientas' : 'Redes Sociales');
  };

  const handleCopy = () => {
    if (code && code !== 'Error') {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logAction('Uso código MFA', `Código copiado de ${itemId}`, table === 'tools_agency' ? 'Herramientas' : 'Redes Sociales');
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mt-4">
      <div className="flex items-center mb-3">
        <KeyRound className="w-5 h-5 text-indigo-600 mr-2" />
        <h4 className="text-sm font-semibold text-slate-800">Autenticador 2FA Integrado</h4>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Ingresa la llave secreta (Secret Key) proporcionada al configurar la autenticación de dos factores. 
            Suele ser una cadena de texto larga.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Ej: JBSWY3DPEHPK3PXP..."
              className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleSave}
              disabled={!secret}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              Guardar Llave
            </button>
            {initialSecret && (
              <button 
                onClick={() => {
                  setSecret(initialSecret);
                  setIsEditing(false);
                }}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                 Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono tracking-[0.2em] font-bold text-slate-900">
                {code ? `${code.slice(0,3)} ${code.slice(3)}` : '------'}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative"
                title="Copiar código"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center mt-2 text-xs text-slate-500">
              <RefreshCw className={`w-3 h-3 mr-1.5 ${timeLeft < 5 ? 'text-red-500 animate-spin' : ''}`} />
              <span className={timeLeft < 5 ? 'text-red-500 font-medium' : ''}>
                Se actualiza en {timeLeft}s
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Cambiar llave secreta
          </button>
        </div>
      )}
    </div>
  );
}
