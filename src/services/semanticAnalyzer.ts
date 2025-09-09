/**
 * SEMANTIC ANALYZER - Il Cuore dell'Algoritmo Geniale
 * Auto-apprende la struttura e il significato dei dati
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';

// Tipi di dato semantici
export enum SemanticType {
  CODE = 'CODE',           // ART001, PRD-123
  DESCRIPTION = 'DESCRIPTION', // Testi lunghi descrittivi
  PRICE = 'PRICE',         // Numeri con decimali (prezzi)
  QUANTITY = 'QUANTITY',   // Numeri interi (quantità)
  DATE_IT = 'DATE_IT',     // Date formato italiano
  DATE_ISO = 'DATE_ISO',   // Date formato ISO
  ENTITY = 'ENTITY',       // Nomi propri (fornitori, clienti)
  BOOLEAN = 'BOOLEAN',     // Si/No, True/False
  EMAIL = 'EMAIL',         // Indirizzi email
  PHONE = 'PHONE',         // Numeri telefono
  PERCENTAGE = 'PERCENTAGE', // Percentuali
  UNKNOWN = 'UNKNOWN'      // Non identificato
}

// Schema di un campo
export interface FieldSchema {
  fieldName: string;
  semanticType: SemanticType;
  patterns: string[];      // Pattern trovati
  keywords: string[];      // Parole chiave frequenti
  stats: {
    uniqueValues?: number;
    minValue?: number;
    maxValue?: number;
    avgValue?: number;
    minLength?: number;
    maxLength?: number;
    nullCount: number;
    sampleValues: any[];
  };
  confidence: number;      // Confidenza nell'identificazione (0-1)
}

// Schema completo di una collezione
export interface CollectionSchema {
  collectionName: string;
  recordCount: number;
  fields: Record<string, FieldSchema>;
  analyzedAt: string;
  keyField?: string;       // Campo identificatore principale
}

export class SemanticAnalyzer {
  
  /**
   * Analizza una collezione e genera lo schema semantico
   */
  async analyzeCollection(collectionName: string, sampleSize: number = 100): Promise<CollectionSchema> {
    console.log(`🧠 Analisi semantica di "${collectionName}"...`);
    
    // Prendi un campione di documenti
    const q = query(collection(db, collectionName), limit(sampleSize));
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => doc.data());
    
    if (records.length === 0) {
      throw new Error(`Collezione ${collectionName} vuota`);
    }
    
    // Analizza ogni campo
    const fields: Record<string, FieldSchema> = {};
    const fieldNames = this.extractFieldNames(records);
    
    for (const fieldName of fieldNames) {
      if (fieldName.startsWith('_')) continue; // Salta metadati
      
      fields[fieldName] = await this.analyzeField(fieldName, records);
      console.log(`  ✓ Campo "${fieldName}" → ${fields[fieldName].semanticType} (confidenza: ${(fields[fieldName].confidence * 100).toFixed(0)}%)`);
    }
    
    // Identifica il campo chiave
    const keyField = this.identifyKeyField(fields);
    
    // Conta record totali
    const allDocs = await getDocs(collection(db, collectionName));
    
    const schema: CollectionSchema = {
      collectionName,
      recordCount: allDocs.size,
      fields,
      analyzedAt: new Date().toISOString(),
      keyField
    };
    
    console.log(`✅ Analisi completata: ${Object.keys(fields).length} campi identificati`);
    if (keyField) {
      console.log(`🔑 Campo chiave: ${keyField}`);
    }
    
    return schema;
  }
  
  /**
   * Analizza un singolo campo
   */
  private async analyzeField(fieldName: string, records: any[]): Promise<FieldSchema> {
    const values = records.map(r => r[fieldName]).filter(v => v != null);
    
    if (values.length === 0) {
      return {
        fieldName,
        semanticType: SemanticType.UNKNOWN,
        patterns: [],
        keywords: [],
        stats: { nullCount: records.length, sampleValues: [] },
        confidence: 0
      };
    }
    
    // Identifica il tipo semantico
    const typeAnalysis = this.detectSemanticType(values);
    
    // Estrai pattern
    const patterns = this.extractPatterns(values, typeAnalysis.type);
    
    // Estrai keywords (solo per testi)
    const keywords = typeAnalysis.type === SemanticType.DESCRIPTION 
      ? this.extractKeywords(values) 
      : [];
    
    // Calcola statistiche
    const stats = this.calculateStats(values, typeAnalysis.type);
    
    return {
      fieldName,
      semanticType: typeAnalysis.type,
      patterns,
      keywords,
      stats,
      confidence: typeAnalysis.confidence
    };
  }
  
  /**
   * Rileva il tipo semantico di un campo
   */
  private detectSemanticType(values: any[]): { type: SemanticType; confidence: number } {
    const samples = values.slice(0, 50); // Analizza primi 50 valori
    const typeScores: Record<SemanticType, number> = {} as any;
    
    // Test per ogni tipo
    const tests = [
      { type: SemanticType.CODE, test: (v: any) => /^[A-Z]{2,5}[\-\_]?\d{2,6}$/.test(String(v)) },
      { type: SemanticType.EMAIL, test: (v: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) },
      { type: SemanticType.DATE_IT, test: (v: any) => /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(String(v)) },
      { type: SemanticType.DATE_ISO, test: (v: any) => /^\d{4}-\d{2}-\d{2}/.test(String(v)) },
      { type: SemanticType.PHONE, test: (v: any) => /^[\+]?[\d\s\-\(\)]+$/.test(String(v)) && String(v).replace(/\D/g, '').length >= 8 },
      { type: SemanticType.PRICE, test: (v: any) => /^\d+([.,]\d{1,2})?$/.test(String(v).replace(/[€$£¥]/g, '').trim()) },
      { type: SemanticType.QUANTITY, test: (v: any) => /^\d+$/.test(String(v)) },
      { type: SemanticType.PERCENTAGE, test: (v: any) => /^\d+([.,]\d+)?%?$/.test(String(v)) && parseFloat(String(v).replace('%', '')) <= 100 },
      { type: SemanticType.BOOLEAN, test: (v: any) => /^(true|false|si|no|sì|yes|0|1)$/i.test(String(v)) },
    ];
    
    // Calcola score per ogni tipo
    for (const { type, test } of tests) {
      const matches = samples.filter(test).length;
      typeScores[type] = matches / samples.length;
    }
    
    // Trova il tipo con score più alto
    let bestType = SemanticType.UNKNOWN;
    let bestScore = 0;
    
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as SemanticType;
      }
    }
    
    // Se nessun pattern specifico, analizza per descrizione o entità
    if (bestScore < 0.5) {
      const avgLength = values.reduce((acc, v) => acc + String(v).length, 0) / values.length;
      const uniqueRatio = new Set(values).size / values.length;
      
      if (avgLength > 30) {
        bestType = SemanticType.DESCRIPTION;
        bestScore = 0.7;
      } else if (uniqueRatio > 0.5) {
        bestType = SemanticType.ENTITY;
        bestScore = 0.6;
      }
    }
    
    return { type: bestType, confidence: bestScore };
  }
  
  /**
   * Estrae pattern comuni dai valori
   */
  private extractPatterns(values: any[], type: SemanticType): string[] {
    const patterns = new Set<string>();
    
    if (type === SemanticType.CODE || type === SemanticType.ENTITY) {
      // Estrai prefissi comuni
      const strings = values.map(v => String(v));
      const prefixes = strings.map(s => s.substring(0, 3));
      const commonPrefixes = this.findCommonValues(prefixes, 0.1);
      commonPrefixes.forEach(p => patterns.add(`${p}*`));
    }
    
    return Array.from(patterns);
  }
  
  /**
   * Estrae keywords da campi testuali
   */
  private extractKeywords(values: any[]): string[] {
    const wordFreq = new Map<string, number>();
    
    values.forEach(value => {
      const words = String(value)
        .toLowerCase()
        .split(/[\s,;.\-\/()]+/)
        .filter(w => w.length > 3); // Solo parole > 3 caratteri
      
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });
    
    // Prendi le 10 parole più frequenti
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Calcola statistiche per un campo
   */
  private calculateStats(values: any[], type: SemanticType): FieldSchema['stats'] {
    const stats: FieldSchema['stats'] = {
      nullCount: 0,
      sampleValues: values.slice(0, 5)
    };
    
    stats.uniqueValues = new Set(values).size;
    
    if (type === SemanticType.PRICE || type === SemanticType.QUANTITY || type === SemanticType.PERCENTAGE) {
      const numbers = values.map(v => parseFloat(String(v).replace(/[^0-9.-]/g, ''))).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        stats.minValue = Math.min(...numbers);
        stats.maxValue = Math.max(...numbers);
        stats.avgValue = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      }
    }
    
    if (type === SemanticType.DESCRIPTION || type === SemanticType.ENTITY) {
      const lengths = values.map(v => String(v).length);
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
    }
    
    return stats;
  }
  
  /**
   * Estrae tutti i nomi dei campi
   */
  private extractFieldNames(records: any[]): string[] {
    const fieldSet = new Set<string>();
    records.forEach(record => {
      Object.keys(record).forEach(field => fieldSet.add(field));
    });
    return Array.from(fieldSet);
  }
  
  /**
   * Identifica il campo chiave (ID principale)
   */
  private identifyKeyField(fields: Record<string, FieldSchema>): string | undefined {
    // Cerca campi con nome suggestivo
    const candidateNames = ['id', 'codice', 'code', 'key', 'numero', 'ref'];
    
    for (const candidate of candidateNames) {
      const field = Object.keys(fields).find(f => f.toLowerCase().includes(candidate));
      if (field && fields[field].stats.uniqueValues === fields[field].stats.sampleValues.length) {
        return field;
      }
    }
    
    // Cerca campo CODE con alta unicità
    const codeFields = Object.entries(fields)
      .filter(([_, schema]) => schema.semanticType === SemanticType.CODE)
      .sort((a, b) => (b[1].stats.uniqueValues || 0) - (a[1].stats.uniqueValues || 0));
    
    if (codeFields.length > 0) {
      return codeFields[0][0];
    }
    
    return undefined;
  }
  
  /**
   * Trova valori comuni in un array
   */
  private findCommonValues(values: string[], threshold: number): string[] {
    const freq = new Map<string, number>();
    values.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
    
    return Array.from(freq.entries())
      .filter(([_, count]) => count / values.length >= threshold)
      .map(([value]) => value);
  }
}

// Export singleton
export const semanticAnalyzer = new SemanticAnalyzer();