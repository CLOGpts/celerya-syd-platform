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
    </div>
  );
};

export default Sidebar;