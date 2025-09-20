/**
 * SEMANTIC SEARCH SERVICE
 * Orchestratore dell'algoritmo semantico geniale
 */

import { getDocs } from 'firebase/firestore';
import { semanticAnalyzer, CollectionSchema } from './semanticAnalyzer';
import { queryInterpreter } from './queryInterpreter';

export interface SearchResult {
  success: boolean;
  data: any[];
  count: number;
  executionTime: number;
  interpretation: {
    intent: string;
    filters: number;
    confidence: number;
  };
  fallbackToAI: boolean;
  error?: string;
}

export class SemanticSearchService {
  private schemas: Map<string, CollectionSchema> = new Map();
  private lastAnalysis: Map<string, Date> = new Map();
  private SCHEMA_CACHE_HOURS = 24; // Rianalizza dopo 24 ore
  
  /**
   * Inizializza o aggiorna lo schema per una collezione
   */
  async initializeCollection(collectionName: string, forceRefresh = false): Promise<void> {
    const lastUpdate = this.lastAnalysis.get(collectionName);
    const needsUpdate = !lastUpdate || 
      forceRefresh || 
      (Date.now() - lastUpdate.getTime()) > this.SCHEMA_CACHE_HOURS * 60 * 60 * 1000;
    
    if (needsUpdate) {
      console.log(`🔄 Analisi semantica di "${collectionName}"...`);
      const schema = await semanticAnalyzer.analyzeCollection(collectionName);
      this.schemas.set(collectionName, schema);
      this.lastAnalysis.set(collectionName, new Date());
      
      // Salva schema in localStorage per persistenza
      this.saveSchemaToCache(collectionName, schema);
    } else {
      // Carica da cache se disponibile
      const cached = this.loadSchemaFromCache(collectionName);
      if (cached) {
        this.schemas.set(collectionName, cached);
        console.log(`✅ Schema caricato da cache per "${collectionName}"`);
      }
    }
  }
  
  /**
   * Esegue una ricerca semantica
   */
  async search(collectionName: string, userQuery: string): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Assicurati che lo schema sia caricato
      if (!this.schemas.has(collectionName)) {
        await this.initializeCollection(collectionName);
      }
      
      const schema = this.schemas.get(collectionName);
      if (!schema) {
        throw new Error(`Schema non disponibile per ${collectionName}`);
      }
      
      // Interpreta la query
      queryInterpreter.setSchema(schema);
      const interpretation = queryInterpreter.interpret(userQuery);
      
      // Se confidenza troppo bassa, suggerisci AI
      if (interpretation.confidence < 0.3) {
        return {
          success: false,
          data: [],
          count: 0,
          executionTime: Date.now() - startTime,
          interpretation: {
            intent: interpretation.intent,
            filters: interpretation.filters.length,
            confidence: interpretation.confidence
          },
          fallbackToAI: true,
          error: 'Query troppo complessa per l\'algoritmo semantico'
        };
      }
      
      // Costruisci ed esegui query Firestore
      const firestoreQuery = queryInterpreter.buildFirestoreQuery(collectionName, interpretation);
      const snapshot = await getDocs(firestoreQuery);
      
      // Processa risultati
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Se abbiamo termini di ricerca, filtra ulteriormente
      let filteredResults = results;
      if (interpretation.searchTerms.length > 0) {
        filteredResults = this.filterBySearchTerms(results, interpretation.searchTerms, schema);
      }

      // Client-side sorting quando Firebase ha skippato l'orderBy (filtri multipli)
      if (interpretation.sorting && interpretation.filters.length > 1) {
        const { field, direction } = interpretation.sorting;
        filteredResults.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal === bVal) return 0;
          const comparison = aVal < bVal ? -1 : 1;
          return direction === 'desc' ? -comparison : comparison;
        });
      }

      return {
        success: true,
        data: filteredResults,
        count: filteredResults.length,
        executionTime: Date.now() - startTime,
        interpretation: {
          intent: interpretation.intent,
          filters: interpretation.filters.length,
          confidence: interpretation.confidence
        },
        fallbackToAI: false
      };
      
    } catch (error) {
      console.error('❌ Errore ricerca semantica:', error);
      
      return {
        success: false,
        data: [],
        count: 0,
        executionTime: Date.now() - startTime,
        interpretation: {
          intent: 'ERROR',
          filters: 0,
          confidence: 0
        },
        fallbackToAI: true,
        error: String(error)
      };
    }
  }
  
  /**
   * Filtra risultati per termini di ricerca
   */
  private filterBySearchTerms(results: any[], searchTerms: string[], schema: CollectionSchema): any[] {
    if (searchTerms.length === 0) return results;
    
    // Identifica campi testuali dove cercare
    const textFields = Object.entries(schema.fields)
      .filter(([_, field]) => 
        field.semanticType === 'DESCRIPTION' || 
        field.semanticType === 'ENTITY' ||
        field.semanticType === 'CODE'
      )
      .map(([name]) => name);
    
    return results.filter(record => {
      // Per ogni termine di ricerca
      return searchTerms.every(term => {
        // Cerca in tutti i campi testuali
        return textFields.some(field => {
          const value = String(record[field] || '').toLowerCase();
          return value.includes(term.toLowerCase());
        });
      });
    });
  }
  
  /**
   * Ottieni info sullo schema
   */
  getSchemaInfo(collectionName: string): CollectionSchema | undefined {
    return this.schemas.get(collectionName);
  }
  
  /**
   * Suggerimenti di ricerca basati sullo schema
   */
  getSuggestions(collectionName: string): string[] {
    const schema = this.schemas.get(collectionName);
    if (!schema) return [];
    
    const suggestions: string[] = [];
    
    // Suggerimenti basati sui tipi di campo
    if (Object.values(schema.fields).some(f => f.semanticType === 'PRICE')) {
      suggestions.push('articoli sotto i 10 euro');
      suggestions.push('prodotti più costosi');
    }
    
    if (Object.values(schema.fields).some(f => f.semanticType === 'DATE_IT' || f.semanticType === 'DATE_ISO')) {
      suggestions.push('prodotti che scadono questo mese');
      suggestions.push('articoli scaduti');
    }
    
    if (Object.values(schema.fields).some(f => f.semanticType === 'QUANTITY')) {
      suggestions.push('prodotti con scorte basse');
      suggestions.push('articoli disponibili');
    }
    
    // Suggerimenti basati su keywords frequenti
    Object.values(schema.fields).forEach(field => {
      if (field.keywords && field.keywords.length > 0) {
        const keyword = field.keywords[0];
        suggestions.push(`cerca ${keyword}`);
      }
    });
    
    return suggestions.slice(0, 5);
  }
  
  /**
   * Salva schema in cache
   */
  private saveSchemaToCache(collectionName: string, schema: CollectionSchema): void {
    try {
      const key = `semantic_schema_${collectionName}`;
      localStorage.setItem(key, JSON.stringify(schema));
    } catch (error) {
      console.warn('Impossibile salvare schema in cache:', error);
    }
  }
  
  /**
   * Carica schema da cache
   */
  private loadSchemaFromCache(collectionName: string): CollectionSchema | null {
    try {
      const key = `semantic_schema_${collectionName}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Impossibile caricare schema da cache:', error);
    }
    return null;
  }
  
  /**
   * Statistiche di utilizzo
   */
  getStats(): {
    collectionsAnalyzed: number;
    schemasInMemory: number;
    cacheSize: number;
  } {
    let cacheSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('semantic_schema_')) {
        cacheSize += localStorage.getItem(key)?.length || 0;
      }
    }
    
    return {
      collectionsAnalyzed: this.schemas.size,
      schemasInMemory: this.schemas.size,
      cacheSize: Math.round(cacheSize / 1024) // KB
    };
  }
}

// Export singleton
export const semanticSearchService = new SemanticSearchService();