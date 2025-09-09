import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { TableIcon } from './icons/TableIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ChangelogIcon } from './icons/ChangelogIcon';
import { FactoryIcon } from './icons/FactoryIcon';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { UsaFlagIcon } from './icons/UsaFlagIcon';
import { ItalyFlagIcon } from './icons/ItalyFlagIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { authService } from '../src/services/authService';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <li
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-lime-500 text-slate-900 font-semibold'
          : 'text-gray-300 hover:bg-slate-700 dark:hover:bg-slate-600'
      }`}
      onClick={onClick}
    >
      <span className="mr-4">{icon}</span>
      {label}
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { id: 'Dashboard', label: t('sidebar.dashboard'), icon: <DashboardIcon /> },
    { id: 'SYD AGENT', label: t('sidebar.syd_agent'), icon: <TableIcon /> },
    { id: 'Lista Fornitori', label: t('sidebar.suppliers_list'), icon: <FactoryIcon /> },
    { id: 'Excel Upload', label: 'Excel Upload', icon: <ExcelIcon className="w-5 h-5" /> },
    { id: 'Impostazioni', label: t('sidebar.settings'), icon: <SettingsIcon /> },
    { id: 'Changelog', label: t('sidebar.changelog'), icon: <ChangelogIcon /> },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col p-4 dark:bg-slate-900 border-r border-slate-700 dark:border-slate-800">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Celerya</h1>
          <p className="text-lg font-medium text-lime-400 -mt-1 tracking-tight">Syd Platform</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-300 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              aria-label={t(theme === 'light' ? 'sidebar.enable_dark_mode' : 'sidebar.enable_light_mode')}
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={toggleLanguage} 
              className="p-2 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              aria-label={t('sidebar.switch_language')}
            >
              {language === 'it' ? <UsaFlagIcon className="w-5 h-5 rounded-full" /> : <ItalyFlagIcon className="w-5 h-5 rounded-full" />}
            </button>
        </div>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => setActivePage(item.id)}
            />
          ))}
        </ul>
      </nav>
      {/* Logout Button */}
      <div className="mt-auto p-4 border-t border-slate-700">
        <button
          onClick={async () => {
            await authService.logout();
            window.location.reload();
          }}
          className="w-full flex items-center justify-center p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('sidebar.logout') || 'Logout'}
        </button>
        <div className="mt-3 text-center text-xs text-gray-400">
          {authService.getCurrentUser()?.email}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;