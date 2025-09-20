import React, { useState, useEffect } from 'react';
import { SydDesign } from '../src/styles/SydDesignSystem';
import { StyledCard } from './ui/StyledCard';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertIcon } from './icons/AlertIcon';
import { ClockIcon } from './icons/ClockIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ExcelIcon } from './icons/ExcelIcon';
import { FactoryIcon } from './icons/FactoryIcon';
import { ZapierIcon } from './icons/ZapierIcon';

interface MetricCard {
  title: string;
  value: string;
  trend: string;
  status: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
}

interface ConnectionHealth {
  id: string;
  name: string;
  type: 'excel' | 'sap' | 'folder';
  status: 'healthy' | 'warning' | 'error' | 'syncing';
  documentsProcessed: number;
  lastActivity: string;
  responseTime: string;
  errorCount: number;
  uptime: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
}

const MCPDashboard: React.FC = () => {
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth[]>([
    {
      id: '1',
      name: 'Excel Uploader',
      type: 'excel',
      status: 'healthy',
      documentsProcessed: 247,
      lastActivity: '2 min fa',
      responseTime: '0.8s',
      errorCount: 0,
      uptime: '99.8%'
    },
    {
      id: '2',
      name: 'SAP Integration',
      type: 'sap',
      status: 'warning',
      documentsProcessed: 1823,
      lastActivity: '15 min fa',
      responseTime: '2.1s',
      errorCount: 3,
      uptime: '97.2%'
    },
    {
      id: '3',
      name: 'Shared Folders',
      type: 'folder',
      status: 'syncing',
      documentsProcessed: 89,
      lastActivity: 'In corso...',
      responseTime: '1.2s',
      errorCount: 1,
      uptime: '98.5%'
    }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '14:32', level: 'info', source: 'Excel', message: 'Processati 15 nuovi file dalla cartella upload' },
    { id: '2', timestamp: '14:28', level: 'warning', source: 'SAP', message: 'Timeout su connessione - retry automatico in corso' },
    { id: '3', timestamp: '14:25', level: 'info', source: 'Folders', message: 'Sincronizzazione completata: 127 documenti aggiornati' },
    { id: '4', timestamp: '14:22', level: 'error', source: 'SAP', message: 'Credenziali scadute - richiesta autorizzazione utente' }
  ]);

  const metrics: MetricCard[] = [
    {
      title: 'Documenti Processati',
      value: '2,159',
      trend: '+12% oggi',
      status: 'success',
      icon: <ExcelIcon className="w-6 h-6" />
    },
    {
      title: 'Connessioni Attive',
      value: '3/4',
      trend: '1 in maintenance',
      status: 'warning',
      icon: <ZapierIcon className="w-6 h-6" />
    },
    {
      title: 'Tempo Risposta Medio',
      value: '1.4s',
      trend: '-0.3s vs ieri',
      status: 'success',
      icon: <ClockIcon className="w-6 h-6" />
    },
    {
      title: 'Errori Ultimi 7gg',
      value: '4',
      trend: '-50% vs settimana',
      status: 'success',
      icon: <CheckCircleIcon className="w-6 h-6" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'syncing': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="w-4 h-4" />;
      case 'warning': return <AlertIcon className="w-4 h-4" />;
      case 'error': return <AlertIcon className="w-4 h-4" />;
      case 'syncing': return <SpinnerIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excel': return <ExcelIcon className="w-5 h-5 text-green-400" />;
      case 'sap': return <FactoryIcon className="w-5 h-5 text-blue-400" />;
      case 'folder': return <ZapierIcon className="w-5 h-5 text-purple-400" />;
      default: return null;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Simula aggiornamenti real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionHealth(prev => prev.map(conn => ({
        ...conn,
        documentsProcessed: conn.documentsProcessed + Math.floor(Math.random() * 3),
        lastActivity: conn.status === 'syncing' ? 'In corso...' : `${Math.floor(Math.random() * 10) + 1} min fa`
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen ${SydDesign.backgrounds.main} p-6`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className={SydDesign.text.title}>Dashboard MCP</h1>
          <p className={SydDesign.text.normal}>
            Monitoraggio real-time delle connessioni e metriche di sistema
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <StyledCard key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={SydDesign.text.small}>{metric.title}</p>
                  <p className={`${SydDesign.text.title} text-lg`}>{metric.value}</p>
                  <p className={`text-xs ${
                    metric.status === 'success' ? 'text-green-400' :
                    metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {metric.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  metric.status === 'success' ? 'bg-green-500/20' :
                  metric.status === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  {metric.icon}
                </div>
              </div>
            </StyledCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Connection Health */}
          <StyledCard>
            <h2 className={`${SydDesign.text.subtitle} mb-4`}>Stato Connessioni</h2>
            <div className="space-y-4">
              {connectionHealth.map((conn) => (
                <div key={conn.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(conn.type)}
                      <span className={SydDesign.text.normal}>{conn.name}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(conn.status)}`}>
                      {getStatusIcon(conn.status)}
                      <span className="capitalize">{conn.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className={SydDesign.text.small}>Documenti: </span>
                      <span className={SydDesign.text.normal}>{conn.documentsProcessed.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className={SydDesign.text.small}>Ultima attività: </span>
                      <span className={SydDesign.text.normal}>{conn.lastActivity}</span>
                    </div>
                    <div>
                      <span className={SydDesign.text.small}>Tempo risposta: </span>
                      <span className={SydDesign.text.normal}>{conn.responseTime}</span>
                    </div>
                    <div>
                      <span className={SydDesign.text.small}>Uptime: </span>
                      <span className={SydDesign.text.normal}>{conn.uptime}</span>
                    </div>
                  </div>

                  {conn.errorCount > 0 && (
                    <div className="mt-2 text-xs text-red-400">
                      {conn.errorCount} errori nelle ultime 24h
                    </div>
                  )}
                </div>
              ))}
            </div>
          </StyledCard>

          {/* Activity Log */}
          <StyledCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className={SydDesign.text.subtitle}>Log Attività</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className={`${SydDesign.text.small} text-green-400`}>Live</span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className={`text-xs ${SydDesign.text.small}`}>{log.source}</span>
                        <span className={`text-xs ${SydDesign.text.small}`}>{log.timestamp}</span>
                      </div>
                      <p className={`${SydDesign.text.normal} text-xs`}>{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className={`w-full mt-4 py-2 text-xs border border-slate-600 rounded-lg ${SydDesign.text.normal} hover:bg-slate-800 transition-colors`}>
              Visualizza tutti i log
            </button>
          </StyledCard>

        </div>
      </div>
    </div>
  );
};

export default MCPDashboard;