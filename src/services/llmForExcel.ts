/**
 * LLM FOR EXCEL - Algoritmi completi da Large Language Model
 * Implementazione degli stessi algoritmi che usano i LLM, ma per Excel
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== MATEMATICA CORE ====================

/**
 * ATTENTION MECHANISM (Transformer-style)
 * Come nei LLM, calcola l'attenzione tra elementi
 */
export class AttentionMechanism {
  static softmax(arr: number[]): number[] {
    const max = Math.max(...arr);
    const exp = arr.map(x => Math.exp(x - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(x => x / sum);
  }

  static attention(Q: number[][], K: number[][], V: number[][]): number[][] {
    const d_k = K[0].length;
    const scores: number[][] = [];
    
    // QK^T / sqrt(d_k)
    for (let i = 0; i < Q.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < K.length; j++) {
        let dot = 0;
        for (let k = 0; k < d_k; k++) {
          dot += Q[i][k] * K[j][k];
        }
        row.push(dot / Math.sqrt(d_k));
      }
      scores.push(row);
    }
    
    // Softmax per ogni riga
    const weights = scores.map(row => this.softmax(row));
    
    // Moltiplica per V
    const output: number[][] = [];
    for (let i = 0; i < weights.length; i++) {
      const row: number[] = new Array(V[0].length).fill(0);
      for (let j = 0; j < V.length; j++) {
        for (let k = 0; k < V[0].length; k++) {
          row[k] += weights[i][j] * V[j][k];
        }
      }
      output.push(row);
    }
    
    return output;
  }
}

/**
 * EMBEDDING ENGINE
 * Crea vettori semantici multi-dimensionali per ogni campo
 */
export class EmbeddingEngine {
  static async createFieldEmbedding(
    fieldName: string, 
    values: any[], 
    dimension: number = 128
  ): Promise<number[]> {
    const embedding = new Array(dimension).fill(0);
    
    // Componenti dell'embedding
    const features = {
      // Tipo di dato (one-hot encoding espanso)
      isNumeric: values.every(v => !isNaN(Number(v))) ? 1 : 0,
      isDate: values.some(v => this.isDate(v)) ? 1 : 0,
      isCode: values.some(v => /^[A-Z]{2,5}[\d]+/.test(String(v))) ? 1 : 0,
      isText: values.some(v => String(v).length > 20) ? 1 : 0,
      
      // Statistiche
      uniqueness: new Set(values).size / values.length,
      nullRate: values.filter(v => v == null).length / values.length,
      avgLength: values.reduce((acc, v) => acc + String(v).length, 0) / values.length,
      
      // Distribuzione
      entropy: this.calculateEntropy(values),
      skewness: this.calculateSkewness(values),
      kurtosis: this.calculateKurtosis(values),
      
      // Pattern
      hasPattern: this.detectPattern(values),
      periodicity: this.detectPeriodicity(values)
    };
    
    // Mappa features in embedding vector
    let idx = 0;
    for (const [key, value] of Object.entries(features)) {
      embedding[idx % dimension] += value as number;
      idx++;
    }
    
    // Normalizza
    const norm = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
    return embedding.map(x => x / (norm || 1));
  }
  
  static calculateEntropy(values: any[]): number {
    const freq = new Map<any, number>();
    values.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
    
    let entropy = 0;
    const n = values.length;
    freq.forEach(count => {
      const p = count / n;
      if (p > 0) entropy -= p * Math.log2(p);
    });
    
    return entropy;
  }
  
  static calculateSkewness(values: any[]): number {
    const nums = values.filter(v => !isNaN(Number(v))).map(Number);
    if (nums.length < 3) return 0;
    
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const m3 = nums.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / nums.length;
    const m2 = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
    
    return m3 / Math.pow(m2, 1.5);
  }
  
  static calculateKurtosis(values: any[]): number {
    const nums = values.filter(v => !isNaN(Number(v))).map(Number);
    if (nums.length < 4) return 0;
    
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const m4 = nums.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / nums.length;
    const m2 = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
    
    return m4 / Math.pow(m2, 2) - 3;
  }
  
  static detectPattern(values: any[]): number {
    // Cerca pattern ripetitivi
    const patterns = new Set<string>();
    for (let i = 0; i < values.length - 1; i++) {
      patterns.add(`${values[i]}->${values[i+1]}`);
    }
    return 1 - (patterns.size / (values.length - 1));
  }
  
  static detectPeriodicity(values: any[]): number {
    // Autocorrelazione semplificata
    const nums = values.filter(v => !isNaN(Number(v))).map(Number);
    if (nums.length < 10) return 0;
    
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    let maxCorr = 0;
    
    for (let lag = 1; lag < Math.min(10, nums.length / 2); lag++) {
      let corr = 0;
      for (let i = 0; i < nums.length - lag; i++) {
        corr += (nums[i] - mean) * (nums[i + lag] - mean);
      }
      maxCorr = Math.max(maxCorr, Math.abs(corr));
    }
    
    return maxCorr / nums.length;
  }
  
  static isDate(value: any): boolean {
    return !isNaN(Date.parse(String(value)));
  }
}

/**
 * BM25 RANKING (Information Retrieval)
 * Algoritmo di ranking usato da motori di ricerca
 */
export class BM25 {
  private k1 = 1.2;
  private b = 0.75;
  private avgDocLength: number;
  private docFreq: Map<string, number>;
  private N: number;
  
  constructor(documents: string[]) {
    this.N = documents.length;
    this.avgDocLength = documents.reduce((a, d) => a + d.length, 0) / this.N;
    this.docFreq = new Map();
    
    // Calcola document frequency
    documents.forEach(doc => {
      const terms = new Set(doc.toLowerCase().split(/\s+/));
      terms.forEach(term => {
        this.docFreq.set(term, (this.docFreq.get(term) || 0) + 1);
      });
    });
  }
  
  score(query: string, document: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const docTerms = document.toLowerCase().split(/\s+/);
    const docLength = docTerms.length;
    
    let score = 0;
    
    queryTerms.forEach(term => {
      const tf = docTerms.filter(t => t === term).length;
      const df = this.docFreq.get(term) || 0;
      const idf = Math.log((this.N - df + 0.5) / (df + 0.5));
      
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
      
      score += idf * (numerator / denominator);
    });
    
    return score;
  }
}

/**
 * NEURAL QUERY UNDERSTANDING
 * Comprensione query stile BERT/GPT
 */
export class NeuralQueryParser {
  private static readonly INTENTS = {
    AGGREGATE: /(?:somma|media|conteggio|totale|count|sum|avg)/i,
    FILTER: /(?:dove|con|che ha|filtro|solo)/i,
    SORT: /(?:ordina|più alto|più basso|top|migliore|peggiore)/i,
    COMPARE: /(?:confronta|versus|vs|differenza|meglio di)/i,
    TREND: /(?:trend|andamento|crescita|calo|variazione)/i,
    ANOMALY: /(?:anomalia|strano|outlier|insolito)/i,
    FORECAST: /(?:previsione|futuro|prossimo|stimare)/i,
    CORRELATION: /(?:correlazione|relazione|dipende|influenza)/i
  };
  
  static parseQuery(query: string): {
    intent: string;
    entities: any[];
    confidence: number;
  } {
    const tokens = this.tokenize(query);
    const embeddings = this.createTokenEmbeddings(tokens);
    const intent = this.classifyIntent(query);
    const entities = this.extractEntities(tokens);
    
    // Calcola confidence usando attention mechanism
    const Q = embeddings;
    const K = embeddings;
    const V = embeddings;
    const attention = AttentionMechanism.attention(Q, K, V);
    
    // Confidence basata su attention weights
    const confidence = attention.flat().reduce((a, b) => a + Math.abs(b), 0) / attention.flat().length;
    
    return {
      intent,
      entities,
      confidence: Math.min(confidence, 1)
    };
  }
  
  private static tokenize(text: string): string[] {
    // Tokenizzazione avanzata stile BERT
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }
  
  private static createTokenEmbeddings(tokens: string[]): number[][] {
    // Crea embedding per ogni token (semplificato)
    return tokens.map(token => {
      const embedding = new Array(64).fill(0);
      
      // Hash del token per embedding deterministico
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = ((hash << 5) - hash) + token.charCodeAt(i);
        hash = hash & hash;
      }
      
      // Distribuisci hash nell'embedding
      for (let i = 0; i < 64; i++) {
        embedding[i] = Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1));
      }
      
      return embedding;
    });
  }
  
  private static classifyIntent(query: string): string {
    for (const [intent, pattern] of Object.entries(this.INTENTS)) {
      if (pattern.test(query)) {
        return intent;
      }
    }
    return 'SEARCH';
  }
  
  private static extractEntities(tokens: string[]): any[] {
    const entities: any[] = [];
    
    tokens.forEach((token, i) => {
      // Numeri
      if (!isNaN(Number(token))) {
        entities.push({ type: 'NUMBER', value: Number(token), position: i });
      }
      
      // Date
      if (this.isDateToken(token)) {
        entities.push({ type: 'DATE', value: token, position: i });
      }
      
      // Operatori
      if (['maggiore', 'minore', 'uguale', 'tra'].includes(token)) {
        entities.push({ type: 'OPERATOR', value: token, position: i });
      }
      
      // Aggregazioni
      if (['somma', 'media', 'conteggio', 'max', 'min'].includes(token)) {
        entities.push({ type: 'AGGREGATION', value: token, position: i });
      }
    });
    
    return entities;
  }
  
  private static isDateToken(token: string): boolean {
    return /(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|\d{1,2}\/\d{1,2}\/\d{2,4})/i.test(token);
  }
}

/**
 * STATISTICAL ANOMALY DETECTION
 * Algoritmi di anomaly detection come nei LLM
 */
export class AnomalyDetector {
  // Z-Score modificato con MAD (Median Absolute Deviation)
  static modifiedZScore(values: number[]): { value: number; zScore: number; isAnomaly: boolean }[] {
    const median = this.median(values);
    const mad = this.mad(values, median);
    const threshold = 3.5;
    
    return values.map(value => {
      const zScore = 0.6745 * (value - median) / (mad || 1);
      return {
        value,
        zScore,
        isAnomaly: Math.abs(zScore) > threshold
      };
    });
  }
  
  // Isolation Forest semplificato
  static isolationScore(point: number[], data: number[][]): number {
    const trees = 100;
    const sampleSize = Math.min(256, data.length);
    let totalPathLength = 0;
    
    for (let t = 0; t < trees; t++) {
      // Campiona subset random
      const sample = this.randomSample(data, sampleSize);
      // Calcola path length
      totalPathLength += this.pathLength(point, sample, 0, Math.ceil(Math.log2(sampleSize)));
    }
    
    const avgPathLength = totalPathLength / trees;
    const c = this.averagePathLength(sampleSize);
    
    return Math.pow(2, -avgPathLength / c);
  }
  
  private static median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  private static mad(values: number[], median: number): number {
    const deviations = values.map(v => Math.abs(v - median));
    return this.median(deviations);
  }
  
  private static randomSample<T>(arr: T[], size: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
  
  private static pathLength(point: number[], data: number[][], depth: number, maxDepth: number): number {
    if (depth >= maxDepth || data.length <= 1) {
      return depth + this.averagePathLength(data.length);
    }
    
    // Split random
    const feature = Math.floor(Math.random() * point.length);
    const splitValue = data[Math.floor(Math.random() * data.length)][feature];
    
    const left = data.filter(d => d[feature] < splitValue);
    const right = data.filter(d => d[feature] >= splitValue);
    
    if (point[feature] < splitValue) {
      return this.pathLength(point, left, depth + 1, maxDepth);
    } else {
      return this.pathLength(point, right, depth + 1, maxDepth);
    }
  }
  
  private static averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
  }
}

/**
 * TIME SERIES FORECASTING
 * Previsioni come fanno i LLM
 */
export class TimeSeriesForecaster {
  // Holt-Winters (Exponential Smoothing)
  static holtWinters(
    data: number[], 
    alpha: number = 0.3, 
    beta: number = 0.1, 
    gamma: number = 0.1,
    seasonLength: number = 12,
    periods: number = 6
  ): number[] {
    const n = data.length;
    
    // Inizializzazione
    let level = data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
    let trend = (data.slice(seasonLength, 2 * seasonLength).reduce((a, b) => a + b, 0) - 
                 data.slice(0, seasonLength).reduce((a, b) => a + b, 0)) / (seasonLength * seasonLength);
    
    const seasonal = data.slice(0, seasonLength).map(v => v / level);
    const forecast: number[] = [];
    
    for (let i = 0; i < n + periods; i++) {
      if (i < n) {
        const prevLevel = level;
        level = alpha * (data[i] / seasonal[i % seasonLength]) + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
        seasonal[i % seasonLength] = gamma * (data[i] / level) + (1 - gamma) * seasonal[i % seasonLength];
      }
      
      if (i >= n) {
        forecast.push((level + trend * (i - n + 1)) * seasonal[i % seasonLength]);
      }
    }
    
    return forecast;
  }
  
  // Autocorrelazione per periodicità
  static findPeriodicity(data: number[]): number {
    const maxLag = Math.min(data.length / 2, 50);
    let maxCorr = 0;
    let bestLag = 1;
    
    for (let lag = 1; lag < maxLag; lag++) {
      const corr = this.autocorrelation(data, lag);
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
    
    return bestLag;
  }
  
  private static autocorrelation(data: number[], lag: number): number {
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    
    let num = 0;
    let den = 0;
    
    for (let i = 0; i < n - lag; i++) {
      num += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      den += Math.pow(data[i] - mean, 2);
    }
    
    return num / den;
  }
}

/**
 * MAIN LLM FOR EXCEL ENGINE
 * Orchestratore principale che usa tutti gli algoritmi
 */
export class LLMForExcel {
  private embeddings: Map<string, number[]> = new Map();
  private bm25: BM25 | null = null;
  
  async analyzeData(collectionName: string): Promise<{
    schema: any;
    embeddings: Map<string, number[]>;
    insights: any[];
  }> {
    try {
      console.log(`🔍 Analyzing collection: ${collectionName}`);
      
      // Try multiple possible collection names
      const possibleNames = [
        collectionName,
        collectionName.replace(' ', '_'),
        collectionName.replace('_', ' '),
        'magazzino_sigeo',
        'magazzino sigeo',
        'MagazzinoNAVISION'
      ];
      
      let snapshot: any = null;
      let actualCollectionName = '';
      
      for (const name of possibleNames) {
        try {
          console.log(`  Trying collection name: "${name}"`);
          const collectionRef = collection(db, name);
          const tempSnapshot = await getDocs(collectionRef);
          if (!tempSnapshot.empty) {
            snapshot = tempSnapshot;
            actualCollectionName = name;
            console.log(`✅ Found collection: "${name}" with ${tempSnapshot.size} documents`);
            break;
          }
        } catch (err) {
          console.log(`  Collection "${name}" not found or error accessing it`);
        }
      }
      
      if (!snapshot || snapshot.empty) {
        throw new Error(`Nessuna collezione trovata. Ho provato: ${possibleNames.join(', ')}. Assicurati che il file Excel sia stato caricato su Firebase.`);
      }
      
      const data = snapshot.docs.map((doc: any) => doc.data());
      
      if (data.length === 0 || !data[0]) {
        throw new Error(`Nessun dato trovato nella collezione "${actualCollectionName}"`);
      }
    
    // Analizza schema e crea embeddings
    const schema: any = {};
    const insights: any[] = [];
    
    for (const field of Object.keys(data[0])) {
      if (field.startsWith('_')) continue;
      
      const values = data.map(d => d[field]);
      
      // Crea embedding multi-dimensionale
      const embedding = await EmbeddingEngine.createFieldEmbedding(field, values);
      this.embeddings.set(field, embedding);
      
      // Analizza anomalie se numerico
      const nums = values.filter(v => !isNaN(Number(v))).map(Number);
      if (nums.length > 0) {
        const anomalies = AnomalyDetector.modifiedZScore(nums);
        const anomalyCount = anomalies.filter(a => a.isAnomaly).length;
        
        if (anomalyCount > 0) {
          insights.push({
            type: 'ANOMALY',
            field,
            count: anomalyCount,
            percentage: (anomalyCount / nums.length * 100).toFixed(2)
          });
        }
      }
      
      schema[field] = {
        type: this.detectType(values),
        cardinality: new Set(values).size,
        nullRate: values.filter(v => v == null).length / values.length,
        embedding: embedding.slice(0, 10) // Prime 10 dimensioni per debug
      };
    }
    
    // Inizializza BM25 per ranking
    const documents = data.map(d => Object.values(d).join(' '));
    this.bm25 = new BM25(documents);
    
    return { schema, embeddings: this.embeddings, insights };
    } catch (error) {
      console.error('❌ Error in analyzeData:', error);
      throw error;
    }
  }
  
  async query(userQuery: string, collectionName: string): Promise<{
    results: any[];
    explanation: string;
    confidence: number;
  }> {
    // Parse query con neural parser
    const parsed = NeuralQueryParser.parseQuery(userQuery);
    
    // Try multiple possible collection names
    const possibleNames = [
      collectionName,
      collectionName.replace(' ', '_'),
      collectionName.replace('_', ' '),
      'magazzino_sigeo',
      'magazzino sigeo',
      'MagazzinoNAVISION'
    ];
    
    let snapshot: any = null;
    
    for (const name of possibleNames) {
      try {
        const tempSnapshot = await getDocs(collection(db, name));
        if (!tempSnapshot.empty) {
          snapshot = tempSnapshot;
          console.log(`✅ Using collection: "${name}"`);
          break;
        }
      } catch (err) {
        // Try next name
      }
    }
    
    if (!snapshot || snapshot.empty) {
      throw new Error('Nessuna collezione trovata in Firebase');
    }
    
    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Rank documents con BM25
    if (this.bm25) {
      data.forEach(doc => {
        const docText = Object.values(doc).join(' ');
        doc._score = this.bm25!.score(userQuery, docText);
      });
      
      data.sort((a, b) => (b._score || 0) - (a._score || 0));
    }
    
    // Applica intent
    let results = data;
    let explanation = '';
    
    switch (parsed.intent) {
      case 'AGGREGATE':
        results = this.aggregate(data, parsed.entities);
        explanation = 'Aggregazione dati eseguita';
        break;
        
      case 'ANOMALY':
        results = this.findAnomalies(data);
        explanation = 'Anomalie identificate usando Z-score modificato';
        break;
        
      case 'TREND':
        results = this.analyzeTrend(data);
        explanation = 'Trend analizzato con Holt-Winters';
        break;
        
      default:
        results = data.slice(0, 20);
        explanation = `Top 20 risultati ranked con BM25`;
    }
    
    return {
      results,
      explanation,
      confidence: parsed.confidence
    };
  }
  
  private detectType(values: any[]): string {
    if (values.every(v => !isNaN(Number(v)))) return 'NUMBER';
    if (values.some(v => !isNaN(Date.parse(String(v))))) return 'DATE';
    if (values.some(v => /^[A-Z]{2,5}[\d]+/.test(String(v)))) return 'CODE';
    return 'TEXT';
  }
  
  private aggregate(data: any[], entities: any[]): any[] {
    const aggType = entities.find(e => e.type === 'AGGREGATION')?.value || 'sum';
    const result: any = {};
    
    // Aggrega per tipo
    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'number') {
          if (!result[key]) result[key] = { sum: 0, count: 0, values: [] };
          result[key].sum += value;
          result[key].count++;
          result[key].values.push(value);
        }
      });
    });
    
    // Calcola aggregazioni
    return Object.entries(result).map(([key, stats]: [string, any]) => ({
      field: key,
      sum: stats.sum,
      avg: stats.sum / stats.count,
      min: Math.min(...stats.values),
      max: Math.max(...stats.values),
      count: stats.count
    }));
  }
  
  private findAnomalies(data: any[]): any[] {
    const anomalies: any[] = [];
    
    // Per ogni campo numerico
    const fields = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    
    fields.forEach(field => {
      const values = data.map(d => d[field]).filter(v => !isNaN(Number(v))).map(Number);
      if (values.length === 0) return;
      
      const results = AnomalyDetector.modifiedZScore(values);
      
      results.forEach((r, i) => {
        if (r.isAnomaly) {
          anomalies.push({
            ...data[i],
            _anomalyField: field,
            _anomalyScore: r.zScore
          });
        }
      });
    });
    
    return anomalies;
  }
  
  private analyzeTrend(data: any[]): any[] {
    // Trova campi temporali e numerici
    const dateField = Object.keys(data[0]).find(k => 
      data.some(d => !isNaN(Date.parse(String(d[k]))))
    );
    
    if (!dateField) return [];
    
    // Ordina per data
    const sorted = [...data].sort((a, b) => 
      new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime()
    );
    
    // Analizza trend per ogni campo numerico
    const trends: any[] = [];
    const numericFields = Object.keys(data[0]).filter(k => 
      !isNaN(Number(data[0][k])) && k !== dateField
    );
    
    numericFields.forEach(field => {
      const values = sorted.map(d => Number(d[field]));
      const forecast = TimeSeriesForecaster.holtWinters(values);
      const periodicity = TimeSeriesForecaster.findPeriodicity(values);
      
      trends.push({
        field,
        currentValue: values[values.length - 1],
        forecast: forecast[0],
        periodicity,
        trend: forecast[0] > values[values.length - 1] ? 'UP' : 'DOWN'
      });
    });
    
    return trends;
  }
}

// Export singleton
export const llmForExcel = new LLMForExcel();