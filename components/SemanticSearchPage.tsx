import React, { useState, useEffect } from 'react';
import { semanticSearchService } from '../src/services/semanticSearchService';
import { SpinnerIcon } from './icons/SpinnerIcon';

const SemanticSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('magazzino');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Query di esempio
  const exampleQueries = [
    'articoli sotto 10 euro',
    'prodotti che scadono questo mese',
    'viti disponibili',
    'codici che iniziano con ART',
    'prodotti più costosi',
    'articoli con scorte basse'
  ];

  // Analizza collezione
  const analyzeCollection = async () => {
    setAnalyzing(true);
    try {
      await semanticSearchService.initializeCollection(collection, true);
      const schema = semanticSearchService.getSchemaInfo(collection);
      setSchemaInfo(schema);
      
      // Ottieni suggerimenti
      const sugg = semanticSearchService.getSuggestions(collection);
      setSuggestions(sugg);
      
      console.log('Schema analizzato:', schema);
    } catch (error) {
      console.error('Errore analisi:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Esegui ricerca
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    setResults(null);
    
    try {
      const result = await semanticSearchService.search(collection, query);
      setResults(result);
      console.log('Risultati ricerca:', result);
    } catch (error) {
      console.error('Errore ricerca:', error);
      setResults({
        success: false,
        error: String(error),
        data: [],
        count: 0
      });
    } finally {
      setSearching(false);
    }
  };

  // Usa query di esempio
  const useExampleQuery = (q: string) => {
    setQuery(q);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          🧠 Ricerca Semantica Intelligente
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Algoritmo semantico geniale - Zero AI, 100% intelligenza del codice
        </p>

        {/* Selezione collezione e analisi */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Collezione Firebase
              </label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                placeholder="es. magazzino"
              />
            </div>
            <button
              onClick={analyzeCollection}
              disabled={analyzing || !collection}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg flex items-center"
            >
              {analyzing ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                  Analisi...
                </>
              ) : (
                <>
                  🔍 Analizza Schema
                </>
              )}
            </button>
          </div>

          {/* Info Schema */}
          {schemaInfo && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                Schema Analizzato
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-purple-700 dark:text-purple-400">Record totali:</span>{' '}
                  <span className="font-mono">{schemaInfo.recordCount}</span>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-400">Campi identificati:</span>{' '}
                  <span className="font-mono">{Object.keys(schemaInfo.fields).length}</span>
                </div>
              </div>
              
              {/* Tipi di campo rilevati */}
              <div className="mt-3">
                <span className="text-purple-700 dark:text-purple-400 text-sm">Tipi rilevati:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(schemaInfo.fields).map(([name, field]: [string, any]) => (
                    <span
                      key={name}
                      className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs"
                      title={`${name}: ${field.semanticType}`}
                    >
                      {name}: <span className="font-semibold">{field.semanticType}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra di ricerca */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-lg dark:bg-slate-700 dark:text-white"
              placeholder="Scrivi in italiano: 'articoli sotto 10 euro', 'prodotti che scadono'..."
              disabled={!schemaInfo}
            />
            <button
              onClick={handleSearch}
              disabled={searching || !query || !schemaInfo}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-semibold flex items-center"
            >
              {searching ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
                  Ricerca...
                </>
              ) : (
                <>
                  🔍 Cerca
                </>
              )}
            </button>
          </div>

          {/* Query di esempio */}
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Query di esempio (clicca per usare):
            </p>
            <div className="flex flex-wrap gap-2">
              {(suggestions.length > 0 ? suggestions : exampleQueries).map((q, i) => (
                <button
                  key={i}
                  onClick={() => useExampleQuery(q)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full text-sm"
                  disabled={!schemaInfo}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risultati */}
        {results && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            {/* Header risultati */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Risultati: {results.count} record trovati
              </h2>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  ⏱️ {results.executionTime}ms
                </span>
                {results.interpretation && (
                  <>
                    <span className="text-slate-600 dark:text-slate-400">
                      Intent: <span className="font-semibold">{results.interpretation.intent}</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Confidenza: <span className="font-semibold">{(results.interpretation.confidence * 100).toFixed(0)}%</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Warning se fallback AI */}
            {results.fallbackToAI && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Query troppo complessa per l'algoritmo semantico. Suggeriamo di usare l'AI per questa ricerca.
                </p>
              </div>
            )}

            {/* Errore */}
            {results.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ❌ Errore: {results.error}
                </p>
              </div>
            )}

            {/* Tabella risultati */}
            {results.data && results.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      {Object.keys(results.data[0])
                        .filter(k => !k.startsWith('_'))
                        .slice(0, 6)
                        .map(key => (
                          <th key={key} className="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {key}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.slice(0, 20).map((row: any, i: number) => (
                      <tr key={i} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        {Object.keys(row)
                          .filter(k => !k.startsWith('_'))
                          .slice(0, 6)
                          .map(key => (
                            <td key={key} className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {String(row[key] || '-').substring(0, 50)}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {results.data.length > 20 && (
                  <p className="mt-3 text-sm text-slate-500 text-center">
                    Mostrati primi 20 di {results.count} risultati
                  </p>
                )}
              </div>
            )}

            {/* Nessun risultato */}
            {results.data && results.data.length === 0 && !results.error && (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                Nessun risultato trovato per questa query.
              </p>
            )}
          </div>
        )}

        {/* Info algoritmo */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            🧠 Come Funziona l'Algoritmo Semantico
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-1">1. Auto-Apprendimento</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Analizza i dati e capisce automaticamente i tipi: codici, prezzi, date, descrizioni
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">2. Interpretazione</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Capisce l'italiano usando sinonimi e pattern matching intelligente
              </p>
            </div>
            <div>
              <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">3. Query Ottimizzate</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Genera query Firestore native velocissime, senza AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemanticSearchPage;