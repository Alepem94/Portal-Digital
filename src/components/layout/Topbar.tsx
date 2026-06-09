import React, { useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

export function Topbar() {
  const { setSidebarOpen, isSidebarOpen } = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Trigger global search modal
        window.dispatchEvent(new CustomEvent('open-search'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30 relative">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="mr-4 lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-800">
          Portal Operativo Digtal
        </span>
      </div>

      <div className="flex items-center">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
          className="flex items-center text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar...
          <span className="ml-4 text-xs bg-white px-1.5 py-0.5 rounded border border-gray-300 text-gray-400">
            ⌘K
          </span>
        </button>
      </div>
    </header>
  );
}
