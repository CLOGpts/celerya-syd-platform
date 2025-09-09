

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field: string;
  deadline?: string; // ISO date string
}

export interface Product {
  id: string;
  qrCodeUrl?: string;
  identificazione: {
    produttore: string;
    logo?: string;
    denominazioneScheda: string;
    codiceProdotto: string;
    dataRedazione: string; // ISO date string
    numeroRevisione: number;
  };
  descrizione: {
    denominazioneLegale: string;
    ingredienti: string;
    allergeni: string;
    contaminazioneCrociata?: string;
    alcol?: string;
    descrizioneProdotto: string;
    proprietaSensoriali: string;
  };
  nutrizionale: {
    energia: string;
    grassi: string;
    acidiGrassiSaturi: string;
    carboidrati: string;
    zuccheri: string;
    fibre?: string;
    proteine: string;
    sale: string;
  };
  sicurezza: {
    listeria: string;
    salmonella: string;
    eColi: string;
    enterobacteriaceae: string;
    stafilococchi: string;
    limitiContaminanti: string;
    ph?: number;
    aw?: number;
    umidita?: number;
  };
  conservazione: {
    tmcScadenza: string; // ISO date string
    condizioniStoccaggio: string;
    shelfLifePostApertura: string; // e.g., "7 giorni"
    modalitaUso: string;
  };
  packaging: {
    tipoImballaggio: string;
    materiali: string;
    dimensioni: string;
    pesoNetto: string; // e.g., "0.400 kg"
    pesoSgocciolato?: string;
    composizionePallet: string;
  };
  conformita: {
    normative: string;
    certificazioni: {
      tipo: string;
      scadenza: string; // ISO date string
    }[];
    origineIngredienti: string;
  };
}

export interface Field {
  name: string;
  mandatory: boolean;
  critical: boolean;
  active: boolean;
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
}

export interface TransportProduct {
  descrizione: string;
  quantita: string;
  lotto: string;
  scadenza: string; // ISO Date string
}

export interface TransportInfo {
  mittente: string;
  numeroDDT: string;
  dataDDT: string; // ISO Date string
  vettore: string;
  destinatario: string;
}

export interface AnalyzedTransportDocument {
    id: string;
    qrCodeUrl?: string;
    info: TransportInfo;
    prodotti: TransportProduct[];
}

export interface CommercialProductInfo {
  codiceArticolo: string;
  descrizione: string;
  prezzo: number;
  unitaMisura: string;
}

export interface AnalyzedCatalog {
  id: string;
  nomeFornitore: string;
  nomeCatalogo: string;
  prodotti: CommercialProductInfo[];
  savedAt: string;
}

export interface PriceListItem {
  codiceArticolo: string;
  descrizione: string;
  prezzoNetto: number;
  valuta: string;
}

export interface AnalyzedPriceList {
  id:string;
  nomeFornitore: string;
  nomeListino: string;
  dataValidita: string; // ISO Date
  items: PriceListItem[];
  savedAt: string;
}

export interface OfferItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface CommercialOffer {
    id: string;
    offerNumber: string;
    date: string; // ISO date
    customerName: string;
    supplierName: string;
    items: OfferItem[];
    subtotal: number;
    tax: number; // Can be a value or a rate depending on implementation
    grandTotal: number;
    notes?: string;
}


export interface Customer {
  id: string;
  name: string;
  slug: string;
}

export interface SupplierData {
    name: string;
    pdfs: Record<string, Product & { savedAt: string }>;
    ddts?: Record<string, AnalyzedTransportDocument & { savedAt: string }>;
    catalogs?: Record<string, AnalyzedCatalog & { savedAt: string }>;
    priceLists?: Record<string, AnalyzedPriceList & { savedAt: string }>;
    celeryaId?: string;
    lastUpdate: string;
}

export interface CustomerSuppliersData {
    suppliers: Record<string, SupplierData>;
}

export type AllSuppliersData = Record<string, CustomerSuppliersData>;

export interface SupplierEarning {
    id: string;
    documentName: string;
    documentType: string;
    fee: number;
    date: string;
    status: 'approved' | 'rejected';
}


// --- Web Speech API Types ---
export interface SpeechRecognitionAlternative {
    transcript: string;
}

export interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

export interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onstart: (this: SpeechRecognition, ev: Event) => any;
    onend: (this: SpeechRecognition, ev: Event) => any;
    onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
    onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
}

export interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

// Augment the global Window interface
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionStatic;
        webkitSpeechRecognition?: SpeechRecognitionStatic;
        gapi: any; // Google API Client
        google: any; // Google Identity Services
    }
}