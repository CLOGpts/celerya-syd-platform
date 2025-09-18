/**
 * UIBridge - Ponte tra UI moderna e logica esistente
 * QUESTO FILE LO TOCCO SOLO IO - AGENT PROTOTIPO
 */

import React from 'react';

// Importo i componenti UI creati dagli agent
import ModernHeader from '../ui-components/layout/ModernHeader';
import ModernSidebar from '../ui-components/layout/ModernSidebar';

// Importo la logica esistente (già funzionante)
import { useState } from 'react';
import { authService } from '../services/authService';

interface UIBridgeProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  user?: any;
}

/**
 * Questo componente farà da wrapper:
 * - Usa i componenti UI moderni per layout/grafica
 * - Mantiene tutta la logica esistente nei children
 */
export const UIBridge: React.FC<UIBridgeProps> = ({ children, activePage, onPageChange, user }) => {
  const handleLogout = async () => {
    await authService.logout();
    window.location.reload();
  };

  const userName = user?.email || 'Guest';

  return (
    <div className="min-h-screen bg-black dark:bg-slate-950">
      {/* Header con stili moderni */}
      <ModernHeader user={userName} onLogout={handleLogout} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar moderna 320px */}
        <ModernSidebar activePage={activePage} onNavigate={onPageChange} />

        {/* Content area con logica esistente */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UIBridge;