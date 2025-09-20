import React, { useState, useRef } from 'react';
import { SydDesign } from '../src/styles/SydDesignSystem';
import { StyledCard } from './ui/StyledCard';
import { SettingsIcon } from './icons/SettingsIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertIcon } from './icons/AlertIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ZapierIcon } from './icons/ZapierIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { FactoryIcon } from './icons/FactoryIcon';

interface ConnectionStatus {
  id: string;
  name: string;
  type: 'excel' | 'sap' | 'folder' | 'database';
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastSync?: string;
  error?: string;
}

const MCPSetup: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    { id: '1', name: 'Excel Uploads', type: 'excel', status: 'connected', lastSync: '2 minuti fa' },
    { id: '2', name: 'SAP Integration', type: 'sap', status: 'disconnected' },
    { id: '3', name: 'Shared Folders', type: 'folder', status: 'testing' }
  ]);

  const [showWizard, setShowWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'testing': return <SpinnerIcon className="w-5 h-5 text-blue-500" />;
      case 'error': return <AlertIcon className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 bg-gray-600 rounded-full" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excel': return <ExcelIcon className="w-6 h-6 text-green-600" />;
      case 'sap': return <FactoryIcon className="w-6 h-6 text-blue-600" />;
      case 'folder': return <ZapierIcon className="w-6 h-6 text-purple-600" />;
      default: return <SettingsIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className={`min-h-screen ${SydDesign.backgrounds.main} p-6`}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className={SydDesign.text.title}>Configurazione MCP</h1>
          <p className={SydDesign.text.normal}>
            Gestisci le connessioni alle tue sorgenti dati con un click
          </p>
        </div>

        {/* Quick Setup Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StyledCard hover className="cursor-pointer" onClick={() => setShowWizard(true)}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className={SydDesign.text.subtitle}>Setup Automatico</h3>
                <p className={SydDesign.text.small}>Rileva e configura in 30 secondi</p>
              </div>
            </div>
          </StyledCard>

          <StyledCard hover className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ExcelIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className={SydDesign.text.subtitle}>Importa Excel</h3>
                <p className={SydDesign.text.small}>Trascina file o clicca qui</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => console.log('Files:', e.target.files)}
            />
          </StyledCard>

          <StyledCard hover className="cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <ZapierIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className={SydDesign.text.subtitle}>Connetti API</h3>
                <p className={SydDesign.text.small}>SAP, database, cloud</p>
              </div>
            </div>
          </StyledCard>
        </div>

        {/* Active Connections */}
        <StyledCard>
          <h2 className={`${SydDesign.text.subtitle} mb-4`}>Connessioni Attive</h2>
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  {getTypeIcon(conn.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={SydDesign.text.normal}>{conn.name}</span>
                      {getStatusIcon(conn.status)}
                    </div>
                    {conn.lastSync && (
                      <p className={SydDesign.text.small}>Ultimo sync: {conn.lastSync}</p>
                    )}
                    {conn.error && (
                      <p className="text-red-400 text-xs">{conn.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1 text-xs rounded-md ${
                    conn.status === 'connected'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {conn.status === 'connected' ? 'Attivo' : 'Disconnesso'}
                  </button>

                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Connection */}
          <button
            onClick={() => setShowWizard(true)}
            className={`w-full mt-4 p-4 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors`}
          >
            + Aggiungi nuova connessione
          </button>
        </StyledCard>
      </div>
    </div>
  );
};

export default MCPSetup;