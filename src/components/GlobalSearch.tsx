import React, { useState, useEffect } from 'react';
import { Search, X, Briefcase, Users, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter } from '../context/RouterContext';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { db } = useDatabase();
  const { navigate } = useRouter();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-search', handleOpen);
    return () => window.removeEventListener('open-search', handleOpen);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const searchQuery = query.toLowerCase();

  const clientResults = db.clients.filter(c => c.name.toLowerCase().includes(searchQuery));
  const brandResults = db.brands.filter(b => b.name.toLowerCase().includes(searchQuery));
  const toolsResults = db.sharedTools.filter(t => t.name.toLowerCase().includes(searchQuery));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              autoFocus
              className="w-full bg-transparent px-4 py-4 outline-none text-base text-gray-900 placeholder:text-gray-400"
              placeholder="Buscar marcas, clientes, herramientas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Escribe para buscar...
              </div>
            ) : (
              <div className="space-y-4">
                {brandResults.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Marcas</h3>
                    {brandResults.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate({ name: 'brand', id: brand.id });
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md text-left"
                      >
                        <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
                        {brand.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {clientResults.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Clientes</h3>
                    {clientResults.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate({ name: 'client', id: client.id });
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md text-left"
                      >
                        <Users className="w-4 h-4 mr-3 text-gray-400" />
                        {client.name}
                      </button>
                    ))}
                  </div>
                )}

                {toolsResults.length > 0 && (
                  <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Herramientas</h3>
                    {toolsResults.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setIsOpen(false);
                          navigate({ name: 'tools' });
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md text-left"
                      >
                        <Wrench className="w-4 h-4 mr-3 text-gray-400" />
                        {tool.name}
                      </button>
                    ))}
                  </div>
                )}

                {clientResults.length === 0 && brandResults.length === 0 && toolsResults.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No se encontraron resultados para "{query}"
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
            <span>Navegación rápida de accesos y recursos</span>
            <span>Esc para cerrar</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
