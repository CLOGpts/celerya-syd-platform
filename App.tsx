import React from 'react';
import { useState, useEffect } from 'react';
import { SettingsPage } from './components/SettingsPage';
import DataViewPage from './components/DataViewPage';
import DashboardPage from './components/DashboardPage';
import SuppliersListPage from './components/SuppliersListPage';
import DocumentViewer from './components/DocumentViewer';
import { ResourceViewerPage } from './components/ResourceViewerPage';
import DDTViewerPage from './components/DDTViewerPage';
import LoginPage from './components/LoginPage';
import ExcelUploaderPage from './components/experimental/ExcelUploaderPage';
import SemanticSearchPage from './components/experimental/SemanticSearchPage';
import LLMExcelPage from './components/experimental/LLMExcelPage';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import type { Product, Alert, Section, AnalyzedTransportDocument, Customer, AllSuppliersData } from './types';
import { getCustomSchema, generateAlertsFromSchema } from './constants';
import { SupplierDashboard } from './components/SupplierDashboard';
import { UserCogIcon } from './components/icons/UserCogIcon';
import { FactoryIcon } from './components/icons/FactoryIcon';
import { useTranslation } from './contexts/LanguageContext';
import { authService } from './src/services/authService';
import type { User } from 'firebase/auth';
import { SydDesign } from './src/styles/SydDesignSystem';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('Dashboard');
  const [viewerDoc, setViewerDoc] = useState<{product: Product, alerts: Alert[], schema: Section[]} | null>(null);
  const [resourceToView, setResourceToView] = useState<Product | null>(null);
  const [ddtToView, setDdtToView] = useState<AnalyzedTransportDocument | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'supplier'>('client');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { t } = useTranslation();

  // Funzione logout
  const handleLogout = async () => {
    await authService.logout();
    window.location.reload();
  };

  // Stati per sidebar ridimensionabile
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const MIN_SIDEBAR_WIDTH = 240;
  const MAX_SIDEBAR_WIDTH = 480;

  // --- Demo data for Supplier Dashboard selectors ---
  const demoSuppliers = ['Pasta Fresca S.r.l.', 'Salumificio Rossi', 'Ortofrutta Bio Verdi'];
  const demoCustomers = ['Ristorante La Brace', 'Hotel Splendido', 'Mensa Aziendale TechCorp'];
  const [selectedDemoSupplier, setSelectedDemoSupplier] = useState(demoSuppliers[0]);
  const [selectedDemoCustomer, setSelectedDemoCustomer] = useState(demoCustomers[0]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dark mode preference check
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load saved sidebar width
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingSidebar) {
        setIsResizingSidebar(false);
        localStorage.setItem('sidebarWidth', sidebarWidth.toString());
      }
    };

    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    // --- Data Migration for existing users ---
    const customersData = localStorage.getItem('celerya_customers');
    if (customersData) {
      try {
        const customers = JSON.parse(customersData);
        const hasSuppliersData = customers.some((customer: Customer) =>
          customer.allSuppliers || customer.lastSupplierData
        );

        if (hasSuppliersData) {
          console.log('[Migration] Found existing supplier data in localStorage');
        }
      } catch (error) {
        console.error('[Migration] Error parsing customers data:', error);
      }
    }

    setIsInitializing(false);
  }, []);

  const toggleRole = () => {
    setUserRole(prev => prev === 'client' ? 'supplier' : 'client');
  };

  // Show spinner while initializing
  if (isInitializing || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900">
        <div className="text-center">
          <SpinnerIcon className="mx-auto mb-4 animate-spin text-cyan-400 w-16 h-16" />
          <p className="text-cyan-400 text-lg font-mono animate-pulse">
            {t('app.initializing')}
          </p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  if (resourceToView) {
    return <ResourceViewerPage product={resourceToView} />;
  }

  if (ddtToView) {
    return <DDTViewerPage ddt={ddtToView} />;
  }

  if (viewerDoc) {
    return <DocumentViewer product={viewerDoc.product} alerts={viewerDoc.alerts} schema={viewerDoc.schema} />;
  }

  return (
    <>
      {userRole === 'supplier' ? (
        <SupplierDashboard
          availableSuppliers={demoSuppliers}
          availableCustomers={demoCustomers}
          selectedSupplier={selectedDemoSupplier}
          setSelectedSupplier={setSelectedDemoSupplier}
          selectedCustomer={selectedDemoCustomer}
          setSelectedCustomer={setSelectedDemoCustomer}
        />
      ) : (
        <div className="min-h-screen bg-[#0f172a]">  {/* Blu navy scuro come SYD */}
          {/* Header ULTRA CONTRASTATO come SYD Cyber */}
          <header className="h-16 bg-[#0c1425] text-white border-b border-blue-900/30">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo e titolo come SYD Cyber */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  <h1 className="text-xl font-semibold">SYD_Prototipo</h1>
                </div>
              </div>

              {/* User info sulla destra */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm">👤</span>
                  <span className="text-sm font-medium">{user?.email || 'Guest'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Layout IDENTICO con sidebar scura */}
          <div className="flex h-[calc(100vh-4rem)] relative">
            {/* Sidebar con CONTRASTO PERFETTO - RIDIMENSIONABILE */}
            <aside
              style={{
                width: sidebarCollapsed ? '60px' : `${sidebarWidth}px`,
                transition: 'width 200ms ease'
              }}
              className="bg-[#0a0f1f] border-r border-gray-800/50 flex flex-col flex-shrink-0 relative">
              {/* Titolo Pannello Controllo con bottone collapse */}
              <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    📊 Pannello Controllo
                  </h2>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                  title={sidebarCollapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sidebarCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Menu items */}
              <nav className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {[
                    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
                    { id: 'SYD AGENT', label: 'SYD Agent', icon: '🤖' },
                    { id: 'Lista Documenti', label: 'Lista Documenti', icon: '📄' },
                    { id: 'divider1', label: 'divider', icon: '' },
                    { id: 'Excel Upload', label: 'Excel Upload [BETA]', icon: '🧪', beta: true },
                    { id: 'Ricerca Semantica', label: 'Ricerca Semantica [BETA]', icon: '🔬', beta: true },
                    { id: 'LLM Excel', label: 'LLM Excel [BETA]', icon: '⚗️', beta: true },
                    { id: 'divider2', label: 'divider', icon: '' },
                    { id: 'Impostazioni', label: 'Impostazioni', icon: '⚙️' }
                  ].map((item) => {
                    // Render divider
                    if (item.label === 'divider') {
                      return (
                        <div key={item.id} className="my-2">
                          <hr className="border-gray-700/50" />
                          {!sidebarCollapsed && (
                            <div className="text-xs text-gray-500 uppercase tracking-wider mt-2 mb-1 px-2">
                              {item.id === 'divider1' ? 'Sperimentale' : ''}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Render menu button
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`
                          w-full px-4 py-3 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} transition-all duration-200
                          ${activePage === item.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 transform scale-105'
                            : item.beta
                              ? 'text-amber-400 hover:bg-amber-900/20 hover:text-amber-300'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }
                        `}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <span className="font-medium flex items-center gap-2">
                            {item.label}
                            {item.beta && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                                BETA
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Bottone Logout in fondo alla sidebar */}
              <div className="p-4 border-t border-gray-800/50">
                <button
                  onClick={handleLogout}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}
                    bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                    text-white font-medium shadow-lg hover:shadow-xl
                    transform hover:scale-105 transition-all duration-200
                  `}
                  title={sidebarCollapsed ? 'Logout' : undefined}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {!sidebarCollapsed && <span>Logout</span>}
                </button>
              </div>
            </aside>

            {/* Resize handle verticale - solo se sidebar non è collapsed */}
            {!sidebarCollapsed && (
              <div
                className={`w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize hover:w-2 transition-all duration-150 ${
                  isResizingSidebar ? 'bg-blue-500 w-2' : ''
                }`}
                onMouseDown={handleResizeStart}
              />
            )}

            {/* Content area con SFONDO CORRETTO */}
            <main className="flex-1 overflow-y-auto bg-[#1e293b] p-6">  {/* Blu scuro ESATTO come SYD Cyber */}
              {activePage === 'Dashboard' && <DashboardPage />}
              {activePage === 'SYD AGENT' && <DataViewPage />}
              {activePage === 'Lista Documenti' && <SuppliersListPage />}
              {activePage === 'Excel Upload' && <ExcelUploaderPage />}
              {activePage === 'Ricerca Semantica' && <SemanticSearchPage />}
              {activePage === 'LLM Excel' && <LLMExcelPage />}
              {activePage === 'Impostazioni' && <SettingsPage />}
            </main>
          </div>
        </div>
      )}

      {/* --- Role Switcher for Dev --- */}
      <button
          onClick={toggleRole}
          className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-transform hover:scale-110 z-50 dark:bg-lime-500 dark:text-slate-100 dark:hover:bg-lime-400"
          title={t(userRole === 'client' ? 'app.switchToSupplier' : 'app.switchToClient')}
          aria-label={t(userRole === 'client' ? 'app.switchToSupplier' : 'app.switchToClient')}
      >
          {userRole === 'client' ? <UserCogIcon className="w-6 h-6" /> : <FactoryIcon />}
      </button>
    </>
  );
};

export default App;