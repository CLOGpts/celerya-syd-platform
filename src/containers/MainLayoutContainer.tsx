import React from 'react';

interface MainLayoutContainerProps {
  children: React.ReactNode;
  user?: string;
  onLogout?: () => void;
  activePage?: string;
  onNavigate?: (page: string) => void;
}

/**
 * Container che userà i componenti UI
 * Props per passare dati ai componenti UI
 * NON IMPLEMENTARE LOGICA, solo struttura
 */
export const MainLayoutContainer: React.FC<MainLayoutContainerProps> = ({
  children,
  user,
  onLogout,
  activePage,
  onNavigate
}) => {
  return (
    <div className="flex h-screen bg-black dark:bg-slate-950">
      {/* Header container */}
      <div id="header-container" data-user={user} data-onlogout={onLogout} />

      {/* Main layout container */}
      <div className="flex flex-1">
        {/* Sidebar container */}
        <div id="sidebar-container" data-activepage={activePage} data-onnavigate={onNavigate} />

        {/* Main content container */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayoutContainer;