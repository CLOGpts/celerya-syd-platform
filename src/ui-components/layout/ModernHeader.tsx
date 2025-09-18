import React from 'react';

interface ModernHeaderProps {
  user: string;
  onLogout: () => void;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="h-16 bg-gradient-to-r from-sky-900 to-blue-900 dark:from-slate-900 dark:to-blue-950 text-white shadow-2xl backdrop-blur-sm border-b border-blue-800/30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900/10 backdrop-blur rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">S</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">SYD Platform</h1>
            <p className="text-xs text-blue-200">Risk & Compliance</p>
          </div>
        </div>

        {/* Right side - User info & actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/10 backdrop-blur rounded-lg">
            <span className="text-sm">👤</span>
            <span className="text-sm font-medium">{user}</span>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-900/10 hover:bg-gray-900/20 backdrop-blur rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <span className="text-sm">🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;