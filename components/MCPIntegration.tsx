import React, { useState, useEffect } from 'react';
import { Upload, FolderOpen, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface WatchedFolder {
  path: string;
  type: 'DDT' | 'Listini' | 'Cataloghi' | 'SchedeTecniche';
  status: 'active' | 'inactive';
  lastSync: string;
  fileCount: number;
}

const MCPIntegration: React.FC = () => {
  const [watchedFolders, setWatchedFolders] = useState<WatchedFolder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [folderType, setFolderType] = useState<WatchedFolder['type']>('DDT');

  // Simula connessione MCP
  useEffect(() => {
    // In produzione questo si connetterebbe al vero MCP
    const savedFolders = localStorage.getItem('mcp_watched_folders');
    if (savedFolders) {
      setWatchedFolders(JSON.parse(savedFolders));
      setIsConnected(true);
    }
  }, []);

  const addFolder = () => {
    if (!newFolderPath) return;

    const newFolder: WatchedFolder = {
      path: newFolderPath,
      type: folderType,
      status: 'active',
      lastSync: new Date().toISOString(),
      fileCount: 0
    };

    const updatedFolders = [...watchedFolders, newFolder];
    setWatchedFolders(updatedFolders);
    localStorage.setItem('mcp_watched_folders', JSON.stringify(updatedFolders));
    setNewFolderPath('');
    setIsConnected(true);

    // Simula il monitoraggio
    console.log(`📁 Ora monitoro: ${newFolderPath}`);
  };

  const removeFolder = (path: string) => {
    const updated = watchedFolders.filter(f => f.path !== path);
    setWatchedFolders(updated);
    localStorage.setItem('mcp_watched_folders', JSON.stringify(updated));
  };

  const simulateFileUpload = (folder: WatchedFolder) => {
    // Simula che un file è stato trovato e caricato
    const fileName = `Documento_${Date.now()}.pdf`;

    // Salva in localStorage come se fosse stato caricato
    const existingData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
    const customerKey = 'test-customer';
    const supplierKey = 'mcp-auto-upload';

    if (!existingData[customerKey]) {
      existingData[customerKey] = { suppliers: {} };
    }

    if (!existingData[customerKey].suppliers[supplierKey]) {
      existingData[customerKey].suppliers[supplierKey] = {
        name: 'MCP Auto Upload',
        lastUpdate: new Date().toISOString(),
        pdfs: {}
      };
    }

    const docId = `mcp_${Date.now()}`;
    existingData[customerKey].suppliers[supplierKey].pdfs[docId] = {
      id: docId,
      fileName: fileName,
      type: folder.type,
      uploadedAt: new Date().toISOString(),
      source: 'MCP_FOLDER_WATCH',
      path: folder.path
    };

    localStorage.setItem('celerya_suppliers_data', JSON.stringify(existingData));

    // Aggiorna contatore
    const updated = watchedFolders.map(f =>
      f.path === folder.path
        ? { ...f, fileCount: f.fileCount + 1, lastSync: new Date().toISOString() }
        : f
    );
    setWatchedFolders(updated);
    localStorage.setItem('mcp_watched_folders', JSON.stringify(updated));

    alert(`✅ File caricato automaticamente da ${folder.path}`);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          🔌 MCP - Connessione Cartelle Locali
        </h2>
        <p className="text-gray-400">
          Connetti le tue cartelle locali per sincronizzare automaticamente i documenti
        </p>
      </div>

      {/* Status Connessione */}
      <div className={`mb-6 p-4 rounded-lg ${isConnected ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'}`}>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-400">MCP Connesso - Monitoraggio Attivo</span>
            </>
          ) : (
            <>
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-400">MCP Non Connesso - Aggiungi una cartella</span>
            </>
          )}
        </div>
      </div>

      {/* Aggiungi Nuova Cartella */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Aggiungi Cartella da Monitorare</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newFolderPath}
            onChange={(e) => setNewFolderPath(e.target.value)}
            placeholder="C:\Documenti\DDT"
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={folderType}
            onChange={(e) => setFolderType(e.target.value as WatchedFolder['type'])}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DDT">DDT</option>
            <option value="Listini">Listini</option>
            <option value="Cataloghi">Cataloghi</option>
            <option value="SchedeTecniche">Schede Tecniche</option>
          </select>

          <button
            onClick={addFolder}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FolderOpen size={18} />
            <span>Connetti</span>
          </button>
        </div>
      </div>

      {/* Cartelle Monitorate */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Cartelle Monitorate</h3>

        {watchedFolders.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <FolderOpen className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">Nessuna cartella monitorata</p>
            <p className="text-gray-500 text-sm mt-1">Aggiungi una cartella per iniziare la sincronizzazione</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchedFolders.map((folder, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FolderOpen className="text-blue-400" size={20} />
                      <div>
                        <p className="text-white font-medium">{folder.path}</p>
                        <p className="text-gray-400 text-sm">
                          Tipo: {folder.type} • Files: {folder.fileCount} •
                          Ultimo sync: {new Date(folder.lastSync).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => simulateFileUpload(folder)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                      title="Simula caricamento file"
                    >
                      <Upload size={14} />
                      <span>Test Upload</span>
                    </button>

                    <button
                      onClick={() => removeFolder(folder.path)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>

                {folder.status === 'active' && (
                  <div className="mt-2 flex items-center text-green-400 text-sm">
                    <RefreshCw className="animate-spin mr-1" size={14} />
                    Monitoraggio attivo...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Istruzioni */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-2">📌 Come Funziona:</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Aggiungi il percorso della tua cartella locale (es. C:\Documenti\DDT)</li>
          <li>Seleziona il tipo di documenti in quella cartella</li>
          <li>Clicca "Connetti" per iniziare il monitoraggio</li>
          <li>Ogni nuovo file PDF/Excel nella cartella sarà caricato automaticamente</li>
          <li>I tuoi clienti vedranno i documenti in tempo reale nella dashboard</li>
        </ol>
      </div>
    </div>
  );
};

export default MCPIntegration;