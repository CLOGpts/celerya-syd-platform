import React from 'react';

interface ModernSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ activePage, onNavigate }) => {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'SYD AGENT', label: 'SYD Agent', icon: '🤖' },
    { id: 'Lista Fornitori', label: 'Lista Fornitori', icon: '👥' },
    { id: 'Excel Upload', label: 'Excel Upload', icon: '📤' },
    { id: 'Ricerca Semantica', label: 'Ricerca Semantica', icon: '🔍' },
    { id: 'LLM Excel', label: 'LLM Excel', icon: '📑' },
    { id: 'Impostazioni', label: 'Impostazioni', icon: '⚙️' }
  ];

  return (
    <aside className="w-80 bg-gray-900 dark:bg-slate-900 border-r border-slate-800 dark:border-slate-700 flex flex-col h-full">
      {/* Top Section - Title */}
      <div className="p-4 border-b border-slate-800 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100 dark:text-white">📊 Pannello Controllo</h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200
                ${activePage === item.id
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                  : 'hover:bg-gray-900 dark:hover:bg-slate-800 text-slate-300 dark:text-slate-300'
                }
              `}
            >
              <span className={`text-xl ${activePage === item.id ? 'text-white' : ''}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section - Status */}
      <div className="p-4 border-t border-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-black0 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Sistema Operativo</span>
        </div>
      </div>
    </aside>
  );
};

export default ModernSidebar;