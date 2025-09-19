import React, { useState, useEffect } from 'react';
import { excelUploader } from '../../src/services/excelToFirebase';
import { authService } from '../../src/services/authService';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ExcelIcon } from '../icons/ExcelIcon';
import PdfToExcel from './PdfToExcel';

const ExcelUploaderPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'convert'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('magazzino');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const user = authService.getCurrentUser();
    setIsAuthenticated(!!user);
    
    if (!user) {
      setResult({
        success: false,
        message: 'Devi essere autenticato per caricare file'
      });
    }
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    // Verifica autenticazione
    const user = authService.getCurrentUser();
    if (!user) {
      setResult({
        success: false,
        message: 'Devi essere autenticato per caricare file. Ricarica la pagina e accedi.'
      });
      return;
    }
    
    setUploading(true);
    setResult(null);
    
    try {
      console.log('🔐 Utente autenticato:', user.email);
      console.log('📁 Caricamento file:', file.name);
      console.log('📂 Collezione target:', collectionName);
      
      const uploadResult = await excelUploader.uploadExcel(
        file,
        collectionName,
        (progress) => setProgress(progress)
      );
      
      setResult(uploadResult);
      
      // Mostra statistiche
      if (uploadResult.success) {
        const stats = await excelUploader.getCollectionStats(collectionName);
        console.log('📊 Statistiche collezione:', stats);
      }
    } catch (error: any) {
      console.error('❌ Errore upload:', error);
      
      // Gestione errori specifici Firebase
      let errorMessage = `Errore: ${error}`;
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        errorMessage = 'Errore permessi Firebase. Contatta l\'amministratore per aggiornare le regole di sicurezza.';
      }
      
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 dark:text-white mb-8">
          📊 Gestione Excel & Conversioni
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-gray-900 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-100 dark:hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Carica su Firebase
          </button>
          <button
            onClick={() => setActiveTab('convert')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'convert'
                ? 'bg-gray-900 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-400 dark:text-slate-400 hover:text-slate-100 dark:hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            File to Excel
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <>
            {/* Info Box for Upload */}
            <div className="bg-black dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Sistema AI Chirurgica
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Carica i tuoi file Excel su Firebase per abilitare query intelligenti.
                Il sistema indicizzerà automaticamente i dati per ricerche veloci senza AI.
              </p>
            </div>
        
        {/* Upload Form */}
        <div className="bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg p-6">
          {/* Collection Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
              Nome Collezione Firebase
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-700 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="es. magazzino, prodotti, articoli"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Usa un nome semplice, senza spazi
            </p>
          </div>
          
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
              Seleziona File Excel
            </label>
            <div 
              className="relative"
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  setFile(droppedFile);
                  setResult(null);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                accept="*"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file"
                disabled={uploading}
              />
              <label
                htmlFor="excel-file"
                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-700 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                {file ? (
                  <div className="text-center">
                    <ExcelIcon className="w-12 h-12 mx-auto text-green-600 mb-2" />
                    <p className="text-sm font-medium text-slate-300 dark:text-slate-300">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ExcelIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-400">
                      Clicca per selezionare o trascina qualsiasi file
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {uploading ? (
              <>
                <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                Caricamento in corso...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Carica su Firebase
              </>
            )}
          </button>
          
          {/* Progress */}
          {progress && uploading && (
            <div className="mt-6 p-4 bg-black dark:bg-slate-700 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 dark:text-slate-400">
                  {progress.status}
                </span>
                <span className="font-medium text-slate-300 dark:text-slate-300">
                  {progress.processed}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                />
              </div>
              {progress.errors > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {progress.errors} errori
                </p>
              )}
            </div>
          )}
          
          {/* Result */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success 
                ? 'bg-black dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-black dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success 
                      ? 'text-green-900 dark:text-green-300' 
                      : 'text-red-900 dark:text-red-300'
                  }`}>
                    {result.message}
                  </p>
                  {result.recordsUploaded > 0 && (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      ✅ {result.recordsUploaded} record caricati nella collezione "{collectionName}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
            {/* Instructions for Upload */}
            <div className="mt-8 bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-slate-100 dark:text-white mb-4">
                📋 Istruzioni
              </h3>
              <ol className="space-y-2 text-sm text-slate-400 dark:text-slate-400">
                <li className="flex">
                  <span className="font-semibold mr-2">1.</span>
                  Scegli un nome per la collezione (es. "magazzino" per MagazzinoNAVISION.xlsx)
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">2.</span>
                  Seleziona il file Excel da caricare
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">3.</span>
                  Clicca "Carica su Firebase" e attendi il completamento
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">4.</span>
                  Il sistema indicizzerà automaticamente i dati per query veloci
                </li>
              </ol>

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Nota:</strong> File grandi (oltre 10.000 record) potrebbero richiedere alcuni minuti.
                  Il caricamento avviene in batch per ottimizzare le performance.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Info Box for Convert */}
            <div className="bg-black dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                🔄 Conversione File to Excel
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Estrai automaticamente tabelle da PDF, immagini e altri formati.
                Utilizza l'AI di Google Gemini per riconoscere e convertire le tabelle in Excel.
              </p>
            </div>

            {/* PDF to Excel Component */}
            <div className="bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <PdfToExcel />
            </div>

            {/* Instructions for Convert */}
            <div className="mt-8 bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-slate-100 dark:text-white mb-4">
                📋 Come Funziona
              </h3>
              <ol className="space-y-2 text-sm text-slate-400 dark:text-slate-400">
                <li className="flex">
                  <span className="font-semibold mr-2">1.</span>
                  Configura la tua API Key di Google Gemini (necessaria solo la prima volta)
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">2.</span>
                  Carica un file PDF, immagine, Excel o CSV
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">3.</span>
                  Il sistema utilizzerà l'AI per identificare ed estrarre le tabelle
                </li>
                <li className="flex">
                  <span className="font-semibold mr-2">4.</span>
                  Scarica il file Excel con tutte le tabelle estratte
                </li>
              </ol>

              <div className="mt-4 p-3 bg-black dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Formati supportati:</strong> PDF, PNG, JPG, JPEG, XLSX, XLS, CSV.
                  L'estrazione AI funziona meglio con documenti ben strutturati e tabelle chiare.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExcelUploaderPage;