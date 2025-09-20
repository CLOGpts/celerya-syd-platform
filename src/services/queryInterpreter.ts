/**
 * QUERY INTERPRETER - Capisce le domande in linguaggio naturale
 * Trasforma le richieste utente in query Firestore ottimizzate
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CollectionSchema, SemanticType } from './semanticAnalyzer';

// Intenti delle query
export enum QueryIntent {
  SEARCH = 'SEARCH',           // Ricerca generica
  FILTER_PRICE = 'FILTER_PRICE', // Filtra per prezzo
  FILTER_DATE = 'FILTER_DATE',   // Filtra per data
  FILTER_QUANTITY = 'FILTER_QUANTITY', // Filtra per quantità
  FIND_EXPIRED = 'FIND_EXPIRED', // Trova scaduti
  FIND_LOW_STOCK = 'FIND_LOW_STOCK', // Trova scorte basse
  COUNT = 'COUNT',             // Conta elementi
  AGGREGATE = 'AGGREGATE'      // Aggregazioni (somma, media)
}

// Risultato interpretazione
export interface InterpretedQuery {
  intent: QueryIntent;
  filters: FilterCondition[];
  searchTerms: string[];
  sorting?: SortingRule;
  limit?: number;
  aggregation?: AggregationType;
  confidence: number;
}

interface FilterCondition {
  field: string;
  operator: '<' | '<=' | '==' | '>=' | '>' | 'array-contains' | 'in';
  value: any;
}

interface SortingRule {
  field: string;
  direction: 'asc' | 'desc';
}

type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export class QueryInterpreter {
  private schema: CollectionSchema | null = null;
  
  // Dizionario sinonimi italiano
  private synonyms = {
    // Azioni
    'mostra': ['visualizza', 'dammi', 'trova', 'cerca', 'elenca'],
    'conta': ['quanti', 'numero', 'totale'],
    
    // Filtri prezzo
    'economico': ['basso', 'poco', 'meno'],
    'costoso': ['caro', 'alto', 'più'],
    'prezzo': ['costo', 'importo', 'valore', 'euro', '€'],
    
    // Filtri data
    'scade': ['scadenza', 'scaduto', 'expire'],
    'oggi': ['odierno', 'corrente'],
    'domani': ['prossimo'],
    'settimana': ['settimanale', '7 giorni'],
    'mese': ['mensile', '30 giorni'],
    
    // Filtri quantità
    'disponibile': ['stock', 'giacenza', 'magazzino'],
    'esaurito': ['finito', 'terminato', 'zero'],
    'poco': ['basso', 'scarso', 'minimo'],
    
    // Operatori
    'maggiore': ['più', 'sopra', 'oltre', '>'],
    'minore': ['meno', 'sotto', '<'],
    'uguale': ['esatto', 'preciso', '='],
    'tra': ['compreso', 'da'],
  };
  
  // Pattern numerici
  private numberPattern = /\d+([.,]\d+)?/g;
  
  /**
   * Imposta lo schema per l'interpretazione
   */
  setSchema(schema: CollectionSchema) {
    this.schema = schema;
    console.log(`📚 Schema caricato per ${schema.collectionName}: ${Object.keys(schema.fields).length} campi`);
  }
  
  /**
   * Interpreta una query in linguaggio naturale
   */
  interpret(userQuery: string): InterpretedQuery {
    if (!this.schema) {
      throw new Error('Schema non impostato. Chiama setSchema() prima.');
    }
    
    console.log(`🔍 Interpretazione: "${userQuery}"`);
    
    // Preprocessa la query
    const normalizedQuery = this.normalize(userQuery);
    const tokens = this.tokenize(normalizedQuery);
    
    // Identifica l'intento
    const intent = this.detectIntent(tokens);
    console.log(`  Intent: ${intent}`);
    
    // Estrai condizioni
    const filters = this.extractFilters(tokens, intent);
    const searchTerms = this.extractSearchTerms(tokens);
    const sorting = this.extractSorting(tokens);
    const limitValue = this.extractLimit(tokens);
    
    // Calcola confidenza
    const confidence = this.calculateConfidence(filters, searchTerms);
    
    const result: InterpretedQuery = {
      intent,
      filters,
      searchTerms,
      sorting,
      limit: limitValue,
      confidence
    };
    
    console.log(`  Filtri: ${filters.length}, Termini: ${searchTerms.length}, Confidenza: ${(confidence * 100).toFixed(0)}%`);
    
    return result;
  }
  
  /**
   * Costruisce una query Firestore dall'interpretazione
   * NOTA: orderBy con where multipli può richiedere index compound
   */
  buildFirestoreQuery(collectionName: string, interpretation: InterpretedQuery): Query<DocumentData> {
    let q = collection(db, collectionName) as Query<DocumentData>;

    // Applica filtri
    interpretation.filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value));
    });

    // Applica ordinamento solo se non ci sono filtri multipli
    // Per evitare index requirement con where + orderBy
    if (interpretation.sorting && interpretation.filters.length <= 1) {
      q = query(q, orderBy(interpretation.sorting.field, interpretation.sorting.direction));
    }

    // Applica limite
    if (interpretation.limit) {
      q = query(q, firestoreLimit(interpretation.limit));
    }

    return q;
  }
  
  /**
   * Normalizza la query
   */
  private normalize(query: string): string {
    return query
      .toLowerCase()
      .replace(/[.,;:!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Tokenizza la query
   */
  private tokenize(query: string): string[] {
    return query.split(' ').filter(t => t.length > 0);
  }
  
  /**
   * Rileva l'intento principale
   */
  private detectIntent(tokens: string[]): QueryIntent {
    // Check per conteggi
    if (tokens.some(t => this.matchSynonym(t, 'conta'))) {
      return QueryIntent.COUNT;
    }
    
    // Check per scadenze
    if (tokens.some(t => this.matchSynonym(t, 'scade'))) {
      return QueryIntent.FIND_EXPIRED;
    }
    
    // Check per prezzi
    if (tokens.some(t => this.matchSynonym(t, 'prezzo') || this.matchSynonym(t, 'economico') || this.matchSynonym(t, 'costoso'))) {
      return QueryIntent.FILTER_PRICE;
    }
    
    // Check per quantità/stock
    if (tokens.some(t => this.matchSynonym(t, 'disponibile') || this.matchSynonym(t, 'esaurito'))) {
      return QueryIntent.FILTER_QUANTITY;
    }
    
    // Default: ricerca generica
    return QueryIntent.SEARCH;
  }
  
  /**
   * Estrae filtri dalla query
   */
  private extractFilters(tokens: string[], intent: QueryIntent): FilterCondition[] {
    const filters: FilterCondition[] = [];
    
    switch (intent) {
      case QueryIntent.FILTER_PRICE:
        filters.push(...this.extractPriceFilters(tokens));
        break;
        
      case QueryIntent.FIND_EXPIRED:
        filters.push(...this.extractDateFilters(tokens));
        break;
        
      case QueryIntent.FILTER_QUANTITY:
        filters.push(...this.extractQuantityFilters(tokens));
        break;
    }
    
    return filters;
  }
  
  /**
   * Estrae filtri prezzo
   */
  private extractPriceFilters(tokens: string[]): FilterCondition[] {
    const filters: FilterCondition[] = [];
    const priceField = this.findFieldByType(SemanticType.PRICE);
    
    if (!priceField) return filters;
    
    // Cerca numeri nella query
    const numbers = tokens.join(' ').match(this.numberPattern);
    if (!numbers) return filters;
    
    const value = parseFloat(numbers[0].replace(',', '.'));
    
    // Determina operatore
    if (tokens.some(t => this.matchSynonym(t, 'minore') || t === 'sotto')) {
      filters.push({ field: priceField, operator: '<', value });
    } else if (tokens.some(t => this.matchSynonym(t, 'maggiore') || t === 'sopra')) {
      filters.push({ field: priceField, operator: '>', value });
    } else if (tokens.some(t => this.matchSynonym(t, 'economico'))) {
      // Economico = sotto la media
      const avgPrice = this.schema?.fields[priceField]?.stats.avgValue || 50;
      filters.push({ field: priceField, operator: '<', value: avgPrice });
    } else if (tokens.some(t => this.matchSynonym(t, 'costoso'))) {
      // Costoso = sopra la media
      const avgPrice = this.schema?.fields[priceField]?.stats.avgValue || 50;
      filters.push({ field: priceField, operator: '>', value: avgPrice });
    }
    
    return filters;
  }
  
  /**
   * Estrae filtri data
   */
  private extractDateFilters(tokens: string[]): FilterCondition[] {
    const filters: FilterCondition[] = [];
    const dateField = this.findFieldByType(SemanticType.DATE_IT) || this.findFieldByType(SemanticType.DATE_ISO);
    
    if (!dateField) return filters;
    
    const today = new Date();
    let targetDate: Date;
    
    if (tokens.some(t => this.matchSynonym(t, 'oggi'))) {
      targetDate = today;
    } else if (tokens.some(t => this.matchSynonym(t, 'domani'))) {
      targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    } else if (tokens.some(t => this.matchSynonym(t, 'settimana'))) {
      targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (tokens.some(t => this.matchSynonym(t, 'mese'))) {
      targetDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Default: prossimi 30 giorni
      targetDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Scadenze entro la data target
    filters.push({ field: dateField, operator: '<=', value: targetDate.toISOString() });
    filters.push({ field: dateField, operator: '>=', value: today.toISOString() });
    
    return filters;
  }
  
  /**
   * Estrae filtri quantità
   */
  private extractQuantityFilters(tokens: string[]): FilterCondition[] {
    const filters: FilterCondition[] = [];
    const qtyField = this.findFieldByType(SemanticType.QUANTITY);
    
    if (!qtyField) return filters;
    
    if (tokens.some(t => this.matchSynonym(t, 'esaurito'))) {
      filters.push({ field: qtyField, operator: '==', value: 0 });
    } else if (tokens.some(t => this.matchSynonym(t, 'poco'))) {
      filters.push({ field: qtyField, operator: '<', value: 10 });
    } else if (tokens.some(t => this.matchSynonym(t, 'disponibile'))) {
      filters.push({ field: qtyField, operator: '>', value: 0 });
    }
    
    return filters;
  }
  
  /**
   * Estrae termini di ricerca
   */
  private extractSearchTerms(tokens: string[]): string[] {
    // Rimuovi stopwords e parole comuni
    const stopwords = ['il', 'la', 'i', 'le', 'un', 'una', 'di', 'da', 'in', 'con', 'su', 'per', 'che', 'mi', 'tutti'];
    
    return tokens
      .filter(t => !stopwords.includes(t))
      .filter(t => t.length > 2)
      .filter(t => !this.isOperator(t));
  }
  
  /**
   * Estrae regole di ordinamento
   */
  private extractSorting(tokens: string[]): SortingRule | undefined {
    // Cerca indicazioni di ordinamento
    if (tokens.includes('crescente') || tokens.includes('ascendente')) {
      const field = this.guessFieldForSorting(tokens);
      if (field) return { field, direction: 'asc' };
    }
    
    if (tokens.includes('decrescente') || tokens.includes('discendente')) {
      const field = this.guessFieldForSorting(tokens);
      if (field) return { field, direction: 'desc' };
    }
    
    return undefined;
  }
  
  /**
   * Estrae limite risultati
   */
  private extractLimit(tokens: string[]): number | undefined {
    const numbers = tokens.join(' ').match(/\d+/g);
    
    if (tokens.includes('primi') && numbers) {
      return parseInt(numbers[0]);
    }
    
    if (tokens.includes('ultimi') && numbers) {
      return parseInt(numbers[0]);
    }
    
    return undefined;
  }
  
  /**
   * Trova campo per tipo semantico
   */
  private findFieldByType(type: SemanticType): string | undefined {
    if (!this.schema) return undefined;
    
    const field = Object.entries(this.schema.fields)
      .find(([_, schema]) => schema.semanticType === type);
    
    return field ? field[0] : undefined;
  }
  
  /**
   * Indovina campo per ordinamento
   */
  private guessFieldForSorting(tokens: string[]): string | undefined {
    if (tokens.some(t => this.matchSynonym(t, 'prezzo'))) {
      return this.findFieldByType(SemanticType.PRICE);
    }
    
    if (tokens.some(t => this.matchSynonym(t, 'scade'))) {
      return this.findFieldByType(SemanticType.DATE_IT) || this.findFieldByType(SemanticType.DATE_ISO);
    }
    
    return undefined;
  }
  
  /**
   * Verifica se un token è un operatore
   */
  private isOperator(token: string): boolean {
    const operators = ['maggiore', 'minore', 'uguale', 'tra', 'sopra', 'sotto', 'più', 'meno'];
    return operators.includes(token);
  }
  
  /**
   * Verifica match con sinonimi
   */
  private matchSynonym(word: string, concept: string): boolean {
    if (word === concept) return true;
    
    const synonymList = this.synonyms[concept as keyof typeof this.synonyms];
    if (!synonymList) return false;
    
    return synonymList.includes(word);
  }
  
  /**
   * Calcola confidenza nell'interpretazione
   */
  private calculateConfidence(filters: FilterCondition[], searchTerms: string[]): number {
    let confidence = 0.5; // Base
    
    // Più filtri = più confidenza
    confidence += filters.length * 0.1;
    
    // Termini di ricerca validi
    confidence += Math.min(searchTerms.length * 0.05, 0.2);
    
    return Math.min(confidence, 1);
  }
}

// Export singleton
export const queryInterpreter = new QueryInterpreter();