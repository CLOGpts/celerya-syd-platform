/**
 * EXCEL TO FIREBASE UPLOADER
 * Sistema per caricare file Excel su Firestore con indicizzazione intelligente
 */

import * as XLSX from 'xlsx';
import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UploadProgress {
  total: number;
  processed: number;
  errors: number;
  status: string;
}

export class ExcelToFirebase {
  private batchSize = 500; // Firestore batch limit
  
  /**
   * Carica un file Excel su Firestore
   */
  async uploadExcel(
    file: File,
    collectionName: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; message: string; recordsUploaded: number }> {
    try {
      console.log(`📊 Inizio caricamento ${file.name} su collezione ${collectionName}`);
      
      // 1. Leggi il file Excel
      const data = await this.readExcelFile(file);
      console.log(`✅ Letto file: ${data.length} record trovati`);
      
      // 2. Pulisci collezione esistente (opzionale)
      // await this.clearCollection(collectionName);
      
      // 3. Prepara i dati per Firestore
      const processedData = this.preprocessData(data);
      
      // 4. Carica su Firestore in batch
      const result = await this.batchUpload(
        processedData, 
        collectionName,
        onProgress
      );
      
      return {
        success: true,
        message: `Caricati ${result.uploaded} record su ${collectionName}`,
        recordsUploaded: result.uploaded
      };
      
    } catch (error) {
      console.error('❌ Errore upload:', error);
      return {
        success: false,
        message: `Errore: ${error}`,
        recordsUploaded: 0
      };
    }
  }
  
  /**
   * Legge file Excel e converte in JSON
   */
  private readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Prendi il primo foglio
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Converti in JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Mantieni formattazione date
            dateNF: 'yyyy-mm-dd'
          });
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }
  
  /**
   * Preprocessa i dati per ottimizzare le query
   */
  private preprocessData(data: any[]): any[] {
    return data.map((record, index) => {
      // Genera ID unico
      const id = record.codice || record.id || `record_${index}`;
      
      // Normalizza i campi
      const processed: any = {
        _id: id.toString().toUpperCase(),
        _searchTerms: [], // Per ricerca full-text
        _timestamp: new Date().toISOString()
      };
      
      // Processa ogni campo
      Object.keys(record).forEach(key => {
        const value = record[key];
        const normalizedKey = this.normalizeFieldName(key);
        
        // Gestisci diversi tipi di dati
        if (value !== null && value !== undefined && value !== '') {
          // Numeri
          if (this.isNumeric(value)) {
            processed[normalizedKey] = parseFloat(value);
            
            // Aggiungi campi speciali per range queries
            if (normalizedKey === 'prezzo' || normalizedKey === 'price') {
              processed._priceRange = this.getPriceRange(parseFloat(value));
            }
          }
          // Date
          else if (this.isDate(value)) {
            processed[normalizedKey] = value;
            processed[normalizedKey + '_timestamp'] = new Date(value).getTime();
            
            // Per scadenze
            if (normalizedKey.includes('scad') || normalizedKey.includes('expir')) {
              const daysUntil = this.daysUntilDate(value);
              processed._daysUntilExpiry = daysUntil;
              processed._expiryStatus = this.getExpiryStatus(daysUntil);
            }
          }
          // Testo
          else {
            processed[normalizedKey] = value.toString();
            
            // Aggiungi ai termini di ricerca
            const terms = this.extractSearchTerms(value.toString());
            processed._searchTerms.push(...terms);
          }
        }
      });
      
      // Rimuovi duplicati dai termini di ricerca
      processed._searchTerms = [...new Set(processed._searchTerms)];
      
      return processed;
    });
  }
  
  /**
   * Carica dati su Firestore in batch
   */
  private async batchUpload(
    data: any[], 
    collectionName: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ uploaded: number; errors: number }> {
    let uploaded = 0;
    let errors = 0;
    const total = data.length;
    
    // Dividi in batch
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = writeBatch(db);
      const batchData = data.slice(i, Math.min(i + this.batchSize, data.length));
      
      try {
        // Aggiungi ogni record al batch
        batchData.forEach(record => {
          const docRef = doc(collection(db, collectionName), record._id);
          batch.set(docRef, record);
        });
        
        // Esegui il batch
        await batch.commit();
        uploaded += batchData.length;
        
        // Aggiorna progress
        if (onProgress) {
          onProgress({
            total,
            processed: uploaded + errors,
            errors,
            status: `Caricati ${uploaded}/${total} record...`
          });
        }
        
        console.log(`📤 Batch caricato: ${uploaded}/${total}`);
        
        // Piccola pausa per non sovraccaricare
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Errore batch ${i}:`, error);
        errors += batchData.length;
      }
    }
    
    return { uploaded, errors };
  }
  
  /**
   * Utility functions
   */
  private normalizeFieldName(field: string): string {
    return field
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .replace(/^_+|_+$/g, '');
  }
  
  private isNumeric(value: any): boolean {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      // Rimuovi simboli valuta e spazi
      const cleaned = value.replace(/[€$£¥,.\s]/g, '').replace(',', '.');
      return !isNaN(parseFloat(cleaned));
    }
    return false;
  }
  
  private isDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
  
  private getPriceRange(price: number): string {
    if (price < 10) return 'under_10';
    if (price < 50) return '10_50';
    if (price < 100) return '50_100';
    if (price < 500) return '100_500';
    if (price < 1000) return '500_1000';
    return 'over_1000';
  }
  
  private daysUntilDate(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private getExpiryStatus(days: number): string {
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    if (days <= 90) return 'attention';
    return 'ok';
  }
  
  private extractSearchTerms(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,;.\/\-()]+/)
      .filter(term => term.length > 2)
      .slice(0, 10); // Max 10 termini per non appesantire
  }
  
  /**
   * Pulisce una collezione (attenzione!)
   */
  async clearCollection(collectionName: string): Promise<void> {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`🗑️ Collezione ${collectionName} svuotata`);
  }
  
  /**
   * Ottieni statistiche collezione
   */
  async getCollectionStats(collectionName: string): Promise<any> {
    const q = query(collection(db, collectionName));
    const snapshot = await getDocs(q);
    
    return {
      totalRecords: snapshot.size,
      sampleData: snapshot.docs.slice(0, 3).map(doc => doc.data()),
      collections: collectionName
    };
  }
}

// Esporta istanza singleton
export const excelUploader = new ExcelToFirebase();