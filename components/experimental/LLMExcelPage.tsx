import React, { useState, useEffect } from 'react';
import { llmForExcel } from '../../src/services/llmForExcel';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

const LLMExcelPage: React.FC = () => {
  // Prova con entrambi i possibili nomi
  const [collectionName, setCollectionName] = useState('magazzino_sigeo');
  const [query, setQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'anomaly' | 'forecast'>('query');
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Query predefinite avanzate
  const advancedQueries = [
    'trova anomalie nei prezzi',
    'prevedi trend vendite prossimi 6 mesi',
    'identifica pattern ricorrenti',
    'calcola correlazione prezzo-quantità',
    'trova outlier multivariati',
    'analizza periodicità temporale',
    'raggruppa prodotti simili',
    'confronta performance ultimo trimestre'
  ];

  // Cerca collezioni disponibili
  const findAvailableCollections = async () => {
    setLoadingCollections(true);
    const foundCollections: string[] = [];
    
    // Lista di possibili nomi di collezione
    const possibleNames = [
      'magazzino_sigeo',
      'magazzino sigeo',
      'MagazzinoNAVISION',
      'magazzino',
      'warehouse',
      'inventory'
    ];
    
    for (const name of possibleNames) {
      try {
        const snap = await getDocs(collection(db, name));
        if (!snap.empty) {
          foundCollections.push(`${name} (${snap.size} documenti)`);
          if (foundCollections.length === 1) {
            // Usa automaticamente la prima collezione trovata
            setCollectionName(name);
          }
        }
      } catch (err) {
        // Ignora errori per collezioni non esistenti
      }
    }
    
    setAvailableCollections(foundCollections);
    setLoadingCollections(false);
    
    if (foundCollections.length === 0) {
      alert('Nessuna collezione trovata in Firebase. Carica prima un file Excel.');
    }
  };

  // Carica collezioni all'avvio
  useEffect(() => {
    findAvailableCollections();
  }, []);

  // Analizza collezione
  const analyzeCollection = async () => {
    setAnalyzing(true);
    try {
      const analysis = await llmForExcel.analyzeData(collectionName);
      setSchema(analysis.schema);
      setInsights(analysis.insights);
      console.log('Analisi LLM completata:', analysis);
    } catch (error: any) {
      console.error('Errore analisi:', error);
      alert('Errore: ' + (error.message || error));
    } finally {
      setAnalyzing(false);
    }
  };

  // Esegui query
  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setQuerying(true);
    setResults(null);
    
    try {
      const result = await llmForExcel.query(query, collectionName);
      setResults(result);
      console.log('Query LLM risultati:', result);
    } catch (error: any) {
      console.error('Errore query:', error);
      setResults({
        results: [],
        explanation: 'Errore: ' + (error.message || error),
        confidence: 0
      });
    } finally {
      setQuerying(false);
    }
  };

  // Visualizza embedding come heatmap
  const renderEmbedding = (embedding: number[]) => {
    if (!embedding) return null;
    
    return (
      <div className="flex gap-1">
        {embedding.slice(0, 20).map((val, i) => {
          const intensity = Math.abs(val);
          const color = val > 0 ? 'bg-black0' : 'bg-black0';
          return (
            <div
              key={i}
              className={`w-2 h-8 ${color}`}
              style={{ opacity: intensity }}
              title={`Dim ${i}: ${val.toFixed(3)}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🧠 LLM per Excel
          </h1>
          <p className="text-lg text-slate-400 dark:text-slate-400">
            Algoritmi da Large Language Model applicati ai tuoi dati
          </p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            {loadingCollections ? (
              <span className="text-slate-500">Cercando collezioni...</span>
            ) : availableCollections.length > 0 ? (
              <span className="text-green-600 dark:text-green-400">
                ✅ Collezioni trovate: {availableCollections.join(', ')}
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                ⚠️ Nessuna collezione trovata
              </span>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-sm">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              Attention Mechanism
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              Neural Embeddings
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              BM25 Ranking
            </span>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              Anomaly Detection
            </span>
          </div>
        </div>

        {/* Configurazione */}
        <div className="bg-gray-900 dark:bg-slate-800 rounded-xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-100 dark:text-white">
            📊 Analisi Collezione
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-700 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="Nome collezione Firebase"
            />
            <button
              onClick={analyzeCollection}
              disabled={analyzing || !collectionName}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  Analisi LLM...
                </>
              ) : (
                <>
                  🔬 Analizza con LLM
                </>
              )}
            </button>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-300 dark:text-slate-300 mb-3">
                💡 Insights Automatici
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {insight.type === 'ANOMALY' ? '⚠️' : '📊'}
                      </span>
                      <div>
                        <div className="font-medium text-amber-900 dark:text-amber-300">
                          {insight.type === 'ANOMALY' 
                            ? `${insight.count} anomalie in ${insight.field}`
                            : insight.type
                          }
                        </div>
                        <div className="text-sm text-amber-700 dark:text-amber-400">
                          {insight.percentage}% dei dati
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schema con Embeddings */}
          {schema && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-300 dark:text-slate-300 mb-3">
                🔮 Schema & Embeddings Neurali
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="text-left py-2">Campo</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Cardinalità</th>
                      <th className="text-left py-2">Null Rate</th>
                      <th className="text-left py-2">Embedding (prime 20 dim)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(schema).slice(0, 10).map(([field, info]: [string, any]) => (
                      <tr key={field} className="border-b dark:border-slate-700">
                        <td className="py-2 font-mono text-xs">{field}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 bg-gray-900 dark:bg-slate-700 rounded text-xs">
                            {info.type}
                          </span>
                        </td>
                        <td className="py-2">{info.cardinality}</td>
                        <td className="py-2">{(info.nullRate * 100).toFixed(1)}%</td>
                        <td className="py-2">{renderEmbedding(info.embedding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Query Interface */}
        {schema && (
          <div className="bg-gray-900 dark:bg-slate-800 rounded-xl shadow-xl p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('query')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'query' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-900 dark:bg-slate-700 text-slate-300 dark:text-slate-300'
                }`}
              >
                🔍 Query Neurale
              </button>
              <button
                onClick={() => setActiveTab('anomaly')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'anomaly' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-900 dark:bg-slate-700 text-slate-300 dark:text-slate-300'
                }`}
              >
                ⚠️ Anomalie
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'forecast' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-900 dark:bg-slate-700 text-slate-300 dark:text-slate-300'
                }`}
              >
                📈 Forecast
              </button>
            </div>

            {/* Query Input */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && executeQuery()}
                className="flex-1 px-4 py-3 border border-slate-700 dark:border-slate-600 rounded-lg text-lg dark:bg-slate-700 dark:text-white"
                placeholder="Fai una domanda usando linguaggio naturale..."
              />
              <button
                onClick={executeQuery}
                disabled={querying || !query}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {querying ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    ⚡ Esegui
                  </>
                )}
              </button>
            </div>

            {/* Query Suggestions */}
            <div className="flex flex-wrap gap-2 mb-6">
              {advancedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full text-sm hover:scale-105 transition-transform"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Results */}
            {results && (
              <div className="mt-6">
                {/* Confidence & Explanation */}
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-purple-900 dark:text-purple-300">
                        {results.explanation}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                        Algoritmi utilizzati: Attention + BM25 + Neural Embeddings
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {(results.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-purple-600">Confidence</div>
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                {results.results && results.results.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-slate-700 bg-black dark:bg-slate-700/50">
                          {Object.keys(results.results[0])
                            .filter(k => !k.startsWith('_'))
                            .slice(0, 6)
                            .map(key => (
                              <th key={key} className="text-left py-2 px-3 font-medium">
                                {key}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.slice(0, 20).map((row: any, i: number) => (
                          <tr key={i} className="border-b dark:border-slate-700 hover:bg-black dark:hover:bg-slate-700/30">
                            {Object.keys(row)
                              .filter(k => !k.startsWith('_'))
                              .slice(0, 6)
                              .map(key => (
                                <td key={key} className="py-2 px-3">
                                  {row._anomalyField === key && (
                                    <span className="text-red-500 font-semibold">⚠️ </span>
                                  )}
                                  {String(row[key] || '-').substring(0, 50)}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Special Visualizations */}
                {results.results && results.results[0]?.trend && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {results.results.map((item: any, i: number) => (
                      <div key={i} className="p-4 bg-black dark:bg-slate-700/50 rounded-lg">
                        <div className="font-semibold text-slate-300 dark:text-slate-300">
                          {item.field}
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <div>
                            <div className="text-sm text-slate-500">Attuale</div>
                            <div className="text-xl font-bold">{item.currentValue?.toFixed(2)}</div>
                          </div>
                          <div className="text-3xl">
                            {item.trend === 'UP' ? '📈' : '📉'}
                          </div>
                          <div>
                            <div className="text-sm text-slate-500">Previsione</div>
                            <div className="text-xl font-bold text-purple-600">
                              {item.forecast?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          Periodicità: {item.periodicity} periodi
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Algorithm Explanation */}
        <div className="mt-8 bg-gray-900 dark:bg-slate-800 rounded-xl shadow-xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-100 dark:text-white">
            🎓 Come Funziona
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                1. Neural Embeddings
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Ogni campo diventa un vettore 128-dimensionale che cattura semantica, distribuzione, pattern
              </p>
              <div className="mt-2 font-mono text-xs opacity-70">
                embedding = [tipo, entropia, skewness, kurtosis, ...]
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                2. Attention Mechanism
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Self-attention calcola relazioni tra campi come nei Transformer
              </p>
              <div className="mt-2 font-mono text-xs opacity-70">
                attention = softmax(QK^T/√d) * V
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                3. BM25 + Anomaly
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                Ranking con BM25, anomalie con Z-score modificato e Isolation Forest
              </p>
              <div className="mt-2 font-mono text-xs opacity-70">
                z* = 0.6745(x-median)/MAD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMExcelPage;