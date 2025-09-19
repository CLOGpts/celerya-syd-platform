import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Product, Alert, AnalyzedTransportDocument, Section, Customer, AllSuppliersData, AnalyzedCatalog, AnalyzedPriceList } from '../types';
import PdfContent from './PdfContent';
import { getCustomSchema, generateAlertsFromSchema, generatePromptFromSchema } from '../constants';
import { AlertIcon } from './icons/AlertIcon';
import UploadBox from './UploadBox';
import TransportDataDisplay from './TransportDataDisplay';
import CatalogDataDisplay from './CatalogDataDisplay';
import PriceListDataDisplay from './PriceListDataDisplay';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useTranslation } from '../contexts/LanguageContext';
import CatalogCreator from './CatalogCreator';
import { CatalogIcon } from './icons/CatalogIcon';
import { SydDesign } from '../src/styles/SydDesignSystem';


const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
    </svg>
);

const transportDocSchemaForPrompt = `
interface TransportProduct {
  descrizione: string;
  quantita: string;
  lotto: string;
  scadenza: string; // ISO Date string
}

interface TransportInfo {
  mittente: string;
  numeroDDT: string;
  dataDDT: string; // ISO Date string
  vettore: string;
  destinatario: string;
}

interface AnalyzedTransportDocument {
    info: TransportInfo;
    prodotti: TransportProduct[];
}
`;
const transportPrompt = `Analizza il documento di trasporto (DDT) fornito. Estrai le informazioni generali del documento, inclusi mittente e destinatario, e un elenco di tutti i prodotti trasportati. Il mittente è l'azienda che ha emesso il documento. Restituisci un singolo oggetto JSON che aderisca strettamente alla seguente interfaccia TypeScript. Non includere testo, spiegazioni o markdown (come \`\`\`json) al di fuori dell'oggetto JSON. Tutte le date devono essere in formato stringa ISO 8601. Se un'informazione non è presente, utilizza una stringa vuota.

${transportDocSchemaForPrompt}
`;

const catalogSchemaForPrompt = `
interface CommercialProductInfo {
  codiceArticolo: string;
  descrizione: string;
  prezzo: number;
  unitaMisura: string;
}

interface AnalyzedCatalog {
  nomeFornitore: string;
  nomeCatalogo: string;
  prodotti: CommercialProductInfo[];
}
`;
const catalogPrompt = `Sei un assistente AI specializzato nell'analisi di documenti commerciali. Analizza il catalogo prodotti fornito. Estrai il nome del fornitore che ha emesso il catalogo, il nome o titolo del catalogo stesso (es. "Catalogo Primavera 2024"), e un elenco di tutti i prodotti presenti con il loro codice, descrizione, prezzo e unità di misura. Restituisci un singolo oggetto JSON che aderisca strettamente alla seguente interfaccia TypeScript, senza alcun testo o spiegazione esterna.

${catalogSchemaForPrompt}
`;

const priceListSchemaForPrompt = `
interface PriceListItem {
  codiceArticolo: string;
  descrizione: string;
  prezzoNetto: number;
  valuta: string;
}

interface AnalyzedPriceList {
  nomeFornitore: string;
  nomeListino: string;
  dataValidita: string; // ISO Date
  items: PriceListItem[];
}
`;
const priceListPrompt = `Sei un assistente AI specializzato nell'analisi di documenti finanziari. Analizza il listino prezzi fornito. Estrai il nome del fornitore, il titolo del listino, la sua data di validità e un elenco di tutti gli articoli con codice, descrizione, prezzo netto e valuta. Restituisci un singolo oggetto JSON che aderisca strettamente alla seguente interfaccia TypeScript, senza alcun testo o spiegazione esterna.

${priceListSchemaForPrompt}
`;


type Status = {
  severity: 'critical' | 'warning' | 'ok';
  text: string;
};

const getOverallStatus = (alerts: Alert[], t: (key: string) => string): Status => {
    const hasCritical = alerts.some(a => a.severity === 'critical');
    const hasWarning = alerts.some(a => a.severity === 'warning');

    if (hasCritical) {
        return { severity: 'critical', text: t('alerts.status_critical') };
    }
    if (hasWarning) {
        return { severity: 'warning', text: t('alerts.status_warning') };
    }
    return { severity: 'ok', text: t('alerts.status_ok') };
};


const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
    const baseClasses = "inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full";
    const statusClasses = {
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        ok: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    };
    return <span className={`${baseClasses} ${statusClasses[status.severity]}`}>{status.text}</span>;
};


const AlertsPanel: React.FC<{ alerts: Alert[], status: Status, t: (key: string, params?: any) => string }> = ({ alerts, status, t }) => {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');

    return (
        <div className="sticky top-8 bg-[#1e293b]/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700/30">
            <h3 className="text-xl font-semibold text-slate-200 dark:text-slate-100 mb-2">{t('alerts.panel_title')}</h3>
            <div className="mb-6">
                <StatusBadge status={status} />
            </div>

            {alerts.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 font-semibold text-slate-300 dark:text-slate-200">{t('alerts.no_alerts_title')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('alerts.no_alerts_subtitle')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {criticalAlerts.length > 0 && (
                        <div>
                            <h4 className="text-red-600 dark:text-red-400 font-semibold mb-3 text-sm uppercase tracking-wider">{t('alerts.critical_alerts_title', {count: criticalAlerts.length})}</h4>
                            <ul className="space-y-3">
                                {criticalAlerts.map((alert, index) => (
                                    <li key={`crit-${index}`} className="flex items-start gap-3 text-sm">
                                        <AlertIcon className="text-red-500 mt-0.5 flex-shrink-0 w-4 h-4" />
                                        <span className="text-slate-300 dark:text-slate-300">{alert.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {warningAlerts.length > 0 && (
                         <div>
                            <h4 className="text-yellow-600 dark:text-yellow-500 font-semibold mb-3 text-sm uppercase tracking-wider">{t('alerts.warning_alerts_title', {count: warningAlerts.length})}</h4>
                            <ul className="space-y-3">
                                {warningAlerts.map((alert, index) => (
                                    <li key={`warn-${index}`} className="flex items-start gap-3 text-sm">
                                        <AlertIcon className="text-yellow-500 mt-0.5 flex-shrink-0 w-4 h-4" />
                                        <span className="text-slate-300 dark:text-slate-300">{alert.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.substring(result.indexOf(',') + 1);
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

const generateCeleryaId = (): string => `C-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

interface ContextMenuItem {
    label: string;
    onClick: () => void;
    className?: string;
}

const ContextMenu: React.FC<{
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} style={{ top: y, left: x }} className="absolute z-50 bg-[#1e293b]/95 backdrop-blur-sm rounded-md shadow-lg border border-slate-700/50 py-1 w-48">
            <ul>
                {items.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={() => { item.onClick(); onClose(); }}
                            className={`w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#2a3447]/80 hover:text-slate-100 transition-colors ${item.className || ''}`}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const DashboardPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [renamingCustomerId, setRenamingCustomerId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; customerId?: string } | null>(null);
    const { t } = useTranslation();
    const [isCatalogCreatorOpen, setIsCatalogCreatorOpen] = useState(false);

    // Schede Tecniche State
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<Product | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activeSchema, setActiveSchema] = useState<Section[] | null>(null);
    
    // DDT State
    const [transportFile, setTransportFile] = useState<File | null>(null);
    const [isAnalyzingTransport, setIsAnalyzingTransport] = useState(false);
    const [transportError, setTransportError] = useState<string | null>(null);
    const [transportData, setTransportData] = useState<AnalyzedTransportDocument | null>(null);

    // Catalog State
    const [catalogFile, setCatalogFile] = useState<File | null>(null);
    const [isAnalyzingCatalog, setIsAnalyzingCatalog] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [catalogData, setCatalogData] = useState<AnalyzedCatalog | null>(null);

    // Price List State
    const [priceListFile, setPriceListFile] = useState<File | null>(null);
    const [isAnalyzingPriceList, setIsAnalyzingPriceList] = useState(false);
    const [priceListError, setPriceListError] = useState<string | null>(null);
    const [priceListData, setPriceListData] = useState<AnalyzedPriceList | null>(null);


    const pdfContentRef = useRef<HTMLDivElement>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const loadCustomers = useCallback(() => {
        try {
            const storedCustomers = localStorage.getItem('celerya_customers');
            if (storedCustomers) {
                setCustomers(JSON.parse(storedCustomers));
            } else {
                const defaultCustomer: Customer[] = [{ id: 'default-customer', name: 'Clienti', slug: 'clienti' }];
                localStorage.setItem('celerya_customers', JSON.stringify(defaultCustomer));
                setCustomers(defaultCustomer);
            }
        } catch (e) { console.error("Failed to load customers:", e); }
    }, []);

    useEffect(() => { loadCustomers(); }, [loadCustomers]);
    
    useEffect(() => {
        if (renamingCustomerId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingCustomerId]);

    const handleCreateCustomer = () => {
        const newCustomer: Customer = { id: `customer-${Date.now()}`, name: t('dashboard.new_folder_name'), slug: `nuova-cartella-${Date.now()}` };
        const updatedCustomers = [...customers, newCustomer];
        setCustomers(updatedCustomers);
        localStorage.setItem('celerya_customers', JSON.stringify(updatedCustomers));
        setRenamingCustomerId(newCustomer.id);
    };

    const handleRenameCustomer = (customerId: string, newName: string) => {
        const oldCustomer = customers.find(c => c.id === customerId);
        if (!oldCustomer || !newName.trim()) { setRenamingCustomerId(null); return; }

        const newSlug = slugify(newName);
        if (customers.some(c => c.id !== customerId && c.slug === newSlug)) {
            alert(t('dashboard.error_folder_exists'));
            if(renameInputRef.current) renameInputRef.current.focus();
            return;
        }

        const updatedCustomers = customers.map(c => c.id === customerId ? { ...c, name: newName.trim(), slug: newSlug } : c);
        setCustomers(updatedCustomers);
        localStorage.setItem('celerya_customers', JSON.stringify(updatedCustomers));

        const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
        if (oldCustomer.slug !== newSlug && allData[oldCustomer.slug]) {
            allData[newSlug] = allData[oldCustomer.slug];
            delete allData[oldCustomer.slug];
            localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
        }
        setRenamingCustomerId(null);
    };
    
    const handleDeleteCustomer = (customerId: string) => {
       const customerToDelete = customers.find(c => c.id === customerId);
       if (!customerToDelete) return;

       if (window.confirm(t('dashboard.delete_folder_confirm', {folderName: customerToDelete.name}))) {
           const updatedCustomers = customers.filter(c => c.id !== customerId);
           setCustomers(updatedCustomers);
           localStorage.setItem('celerya_customers', JSON.stringify(updatedCustomers));

           const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
           if (allData[customerToDelete.slug]) {
               delete allData[customerToDelete.slug];
               localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
           }
       }
    };

    const handleFileChange = useCallback((selectedFile: File | null) => { setFile(selectedFile); setError(null); }, []);
    const handleTransportFileChange = useCallback((selectedFile: File | null) => { setTransportFile(selectedFile); setTransportError(null); }, []);
    const handleCatalogFileChange = useCallback((selectedFile: File | null) => { setCatalogFile(selectedFile); setCatalogError(null); }, []);
    const handlePriceListFileChange = useCallback((selectedFile: File | null) => { setPriceListFile(selectedFile); setPriceListError(null); }, []);


    const handleExtract = async () => {
        if (!file || !selectedCustomer) return;
        setIsExtracting(true); setError(null); setExtractedData(null); setAlerts([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const customSchema = getCustomSchema();
            const dynamicPrompt = generatePromptFromSchema(customSchema);
            const imagePart = { inlineData: { mimeType: file.type, data: await fileToBase64(file) } };
            const textPart = { text: dynamicPrompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: { responseMimeType: "application/json" },
            });
            
            let jsonStr = response.text.trim();
            const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
            if (match && match[2]) jsonStr = match[2].trim();
            
            const parsedData = JSON.parse(jsonStr);
            if (!parsedData?.identificazione?.produttore) {
                throw new Error("Analisi fallita: il documento non sembra una scheda tecnica valida. Produttore non trovato.");
            }
            const newProduct: Product = { id: generateCeleryaId(), ...parsedData };
            setAlerts(generateAlertsFromSchema(newProduct, customSchema));
            setExtractedData(newProduct);
            setActiveSchema(customSchema);
            setFile(null);

            const producer = newProduct.identificazione.produttore;
            if (producer) {
                 const producerSlug = slugify(producer);
                const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
                if (!allData[selectedCustomer.slug]) allData[selectedCustomer.slug] = { suppliers: {} };
                const customerData = allData[selectedCustomer.slug];
                if (!customerData.suppliers[producerSlug]) {
                    customerData.suppliers[producerSlug] = { name: producer, pdfs: {}, ddts: {}, catalogs: {}, priceLists: {}, celeryaId: generateCeleryaId(), lastUpdate: '' };
                }
                customerData.suppliers[producerSlug].pdfs[newProduct.id] = { ...newProduct, savedAt: new Date().toISOString() };
                customerData.suppliers[producerSlug].lastUpdate = new Date().toISOString();
                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            }

        } catch (e: any) {
            console.error("Extraction failed:", e);
            setError(e.message || "L'estrazione dei dati è fallita. Controlla il file e riprova.");
        } finally { setIsExtracting(false); }
    };
    
    const handleAnalyzeTransport = async () => {
        if (!transportFile || !selectedCustomer) return;
        setIsAnalyzingTransport(true); setTransportError(null); setTransportData(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = { inlineData: { mimeType: transportFile.type, data: await fileToBase64(transportFile) } };
            const textPart = { text: transportPrompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: { responseMimeType: "application/json" },
            });
            
            let jsonStr = response.text.trim();
            const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
            if (match && match[2]) jsonStr = match[2].trim();
            
            const parsedData = JSON.parse(jsonStr);
            if (!parsedData?.info || !Array.isArray(parsedData.prodotti)) throw new Error("Invalid DDT data structure from AI.");
            const ddtWithId: AnalyzedTransportDocument = { ...parsedData, id: generateCeleryaId() };
            setTransportData(ddtWithId);
            setTransportFile(null);
            
            const mittente = ddtWithId.info.mittente;
            if (mittente) {
                const mittenteSlug = slugify(mittente);
                const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
                if (!allData[selectedCustomer.slug]) allData[selectedCustomer.slug] = { suppliers: {} };
                const customerData = allData[selectedCustomer.slug];
                if (!customerData.suppliers[mittenteSlug]) customerData.suppliers[mittenteSlug] = { name: mittente, pdfs: {}, ddts: {}, catalogs: {}, priceLists: {}, celeryaId: generateCeleryaId(), lastUpdate: '' };
                if (!customerData.suppliers[mittenteSlug].ddts) customerData.suppliers[mittenteSlug].ddts = {};
                customerData.suppliers[mittenteSlug].ddts![ddtWithId.id] = { ...ddtWithId, savedAt: new Date().toISOString() };
                customerData.suppliers[mittenteSlug].lastUpdate = new Date().toISOString();
                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            }
        } catch (e: any) {
            console.error("Transport analysis failed:", e);
            setTransportError(e.message || "L'analisi del documento di trasporto è fallita.");
        } finally { setIsAnalyzingTransport(false); }
    };

    const handleAnalyzeCatalog = async () => {
        if (!catalogFile || !selectedCustomer) return;
        setIsAnalyzingCatalog(true); setCatalogError(null); setCatalogData(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = { inlineData: { mimeType: catalogFile.type, data: await fileToBase64(catalogFile) } };
            const textPart = { text: catalogPrompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: { responseMimeType: "application/json" },
            });

            let jsonStr = response.text.trim();
            const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
            if (match && match[2]) jsonStr = match[2].trim();

            const parsedData = JSON.parse(jsonStr);
            if (!parsedData?.nomeFornitore || !Array.isArray(parsedData.prodotti)) {
                throw new Error("Analisi fallita: il documento non sembra un catalogo valido.");
            }
            const catalogWithId: AnalyzedCatalog = { ...parsedData, id: generateCeleryaId() };
            setCatalogData(catalogWithId);
            setCatalogFile(null);

            const supplierName = catalogWithId.nomeFornitore;
            if (supplierName) {
                const supplierSlug = slugify(supplierName);
                const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
                if (!allData[selectedCustomer.slug]) allData[selectedCustomer.slug] = { suppliers: {} };
                const customerData = allData[selectedCustomer.slug];
                if (!customerData.suppliers[supplierSlug]) customerData.suppliers[supplierSlug] = { name: supplierName, pdfs: {}, ddts: {}, catalogs: {}, priceLists: {}, celeryaId: generateCeleryaId(), lastUpdate: '' };
                if (!customerData.suppliers[supplierSlug].catalogs) customerData.suppliers[supplierSlug].catalogs = {};
                customerData.suppliers[supplierSlug].catalogs![catalogWithId.id] = { ...catalogWithId, savedAt: new Date().toISOString() };
                customerData.suppliers[supplierSlug].lastUpdate = new Date().toISOString();
                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            }
        } catch (e: any) {
            console.error("Catalog analysis failed:", e);
            setCatalogError(e.message || "L'analisi del catalogo è fallita.");
        } finally {
            setIsAnalyzingCatalog(false);
        }
    };
    
    const handleAnalyzePriceList = async () => {
        if (!priceListFile || !selectedCustomer) return;
        setIsAnalyzingPriceList(true); setPriceListError(null); setPriceListData(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = { inlineData: { mimeType: priceListFile.type, data: await fileToBase64(priceListFile) } };
            const textPart = { text: priceListPrompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: { responseMimeType: "application/json" },
            });

            let jsonStr = response.text.trim();
            const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
            if (match && match[2]) jsonStr = match[2].trim();

            const parsedData = JSON.parse(jsonStr);
             if (!parsedData?.nomeFornitore || !Array.isArray(parsedData.items)) {
                throw new Error("Analisi fallita: il documento non sembra un listino prezzi valido.");
            }
            const priceListWithId: AnalyzedPriceList = { ...parsedData, id: generateCeleryaId() };
            setPriceListData(priceListWithId);
            setPriceListFile(null);
            
            const supplierName = priceListWithId.nomeFornitore;
            if (supplierName) {
                const supplierSlug = slugify(supplierName);
                const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
                if (!allData[selectedCustomer.slug]) allData[selectedCustomer.slug] = { suppliers: {} };
                const customerData = allData[selectedCustomer.slug];
                if (!customerData.suppliers[supplierSlug]) customerData.suppliers[supplierSlug] = { name: supplierName, pdfs: {}, ddts: {}, catalogs: {}, priceLists: {}, celeryaId: generateCeleryaId(), lastUpdate: '' };
                if (!customerData.suppliers[supplierSlug].priceLists) customerData.suppliers[supplierSlug].priceLists = {};
                customerData.suppliers[supplierSlug].priceLists![priceListWithId.id] = { ...priceListWithId, savedAt: new Date().toISOString() };
                customerData.suppliers[supplierSlug].lastUpdate = new Date().toISOString();
                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            }
        } catch (e: any) {
            console.error("Price list analysis failed:", e);
            setPriceListError(e.message || "L'analisi del listino prezzi è fallita.");
        } finally {
            setIsAnalyzingPriceList(false);
        }
    };

    
    const handleContextMenu = (e: React.MouseEvent, customerId?: string) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, customerId }); };
    const status = extractedData ? getOverallStatus(alerts, t) : null;
    
    const resetState = () => {
        setFile(null); setExtractedData(null); setAlerts([]); setError(null); setActiveSchema(null);
        setTransportFile(null); setTransportData(null); setTransportError(null);
        setCatalogFile(null); setCatalogData(null); setCatalogError(null);
        setPriceListFile(null); setPriceListData(null); setPriceListError(null);
    };

    const handleGoToCustomerSelection = () => { setSelectedCustomer(null); resetState(); };
    const handleGoToCustomerDashboard = () => resetState();

    const renderContent = () => {
        if (!selectedCustomer) {
            return (
                 <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.title')}</h1>
                    <p className="text-slate-400 mb-8">{t('dashboard.select_customer')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {customers.map(customer => (
                            <div
                                key={customer.id}
                                onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, customer.id); }}
                                onClick={() => renamingCustomerId !== customer.id && setSelectedCustomer(customer)}
                                className="group flex flex-col items-center justify-center p-6 bg-[#1e293b]/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/30 cursor-pointer hover:bg-[#2d3748] hover:shadow-xl hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-200"
                            >
                                <FolderIcon className="w-20 h-20 text-yellow-400 group-hover:text-yellow-500 transition-colors" />
                                {renamingCustomerId === customer.id ? (
                                    <input
                                        ref={renameInputRef} type="text" defaultValue={customer.name}
                                        onBlur={(e) => handleRenameCustomer(customer.id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameCustomer(customer.id, e.currentTarget.value);
                                            if (e.key === 'Escape') setRenamingCustomerId(null);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-4 text-center font-semibold text-white bg-slate-700 border border-blue-500 rounded-md w-full"
                                    />
                                ) : (
                                    <span className="mt-4 text-center font-semibold text-slate-300 dark:text-slate-300 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors break-all">{customer.name}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        if (extractedData && status && activeSchema) {
            return (
                <div>
                    <div className="flex justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={handleGoToCustomerDashboard} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110" aria-label={t('dashboard.back_to_customer_dashboard')}><ArrowLeftIcon className="w-6 h-6 text-slate-300" /></button>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-200 dark:text-slate-100">{t('dashboard.results_title')}</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.results_subtitle', {customerName: selectedCustomer.name})}</p>
                            </div>
                        </div>
                        <button onClick={handleGoToCustomerDashboard} className="px-4 py-2.5 bg-[#2a3447]/80 hover:bg-[#334155] text-slate-200 font-medium rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all duration-200">{t('dashboard.analyze_another')}</button>
                    </div>
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8"><div ref={pdfContentRef}><PdfContent data={extractedData} alerts={alerts} schema={activeSchema} /></div></div>
                        <div className="col-span-12 lg:col-span-4"><AlertsPanel alerts={alerts} status={status} t={t} /></div>
                    </div>
                </div>
            )
        }

        if (transportData) {
            return <TransportDataDisplay data={transportData} onAnalyzeAnother={handleGoToCustomerDashboard} customerName={selectedCustomer.name} onBack={handleGoToCustomerDashboard} />;
        }
        if (catalogData) {
            return <CatalogDataDisplay data={catalogData} onAnalyzeAnother={handleGoToCustomerDashboard} customerName={selectedCustomer.name} onBack={handleGoToCustomerDashboard} />;
        }
        if (priceListData) {
            return <PriceListDataDisplay data={priceListData} onAnalyzeAnother={handleGoToCustomerDashboard} customerName={selectedCustomer.name} onBack={handleGoToCustomerDashboard} />;
        }

        // Default view: Upload boxes
        return (
             <div>
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleGoToCustomerSelection} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-110" aria-label={t('dashboard.back_to_customer_selection')}><ArrowLeftIcon className="w-6 h-6 text-slate-300" /></button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-200 dark:text-slate-100">{t('dashboard.customer_dashboard_title')}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.customer_dashboard_subtitle', {customerName: selectedCustomer.name})}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <UploadBox title={t('dashboard.upload_spec_sheet_title')} description={t('dashboard.upload_spec_sheet_desc')} actionButtonText={t('dashboard.upload_spec_sheet_action')} file={file} isProcessing={isExtracting} onFileChange={handleFileChange} onAction={handleExtract} error={error} acceptedFileTypes="*" idPrefix="spec-sheet" />
                    <UploadBox title={t('dashboard.upload_transport_doc_title')} description={t('dashboard.upload_transport_doc_desc')} actionButtonText={t('dashboard.upload_transport_doc_action')} file={transportFile} isProcessing={isAnalyzingTransport} onFileChange={handleTransportFileChange} onAction={handleAnalyzeTransport} error={transportError} acceptedFileTypes="*" idPrefix="transport-doc" />
                    <UploadBox title={t('dashboard.upload_catalog_title')} description={t('dashboard.upload_catalog_desc')} actionButtonText={t('dashboard.upload_catalog_action')} file={catalogFile} isProcessing={isAnalyzingCatalog} onFileChange={handleCatalogFileChange} onAction={handleAnalyzeCatalog} error={catalogError} acceptedFileTypes="*" idPrefix="catalog-doc" />
                    <UploadBox title={t('dashboard.upload_pricelist_title')} description={t('dashboard.upload_pricelist_desc')} actionButtonText={t('dashboard.upload_pricelist_action')} file={priceListFile} isProcessing={isAnalyzingPriceList} onFileChange={handlePriceListFileChange} onAction={handleAnalyzePriceList} error={priceListError} acceptedFileTypes="*" idPrefix="pricelist-doc" />
                </div>
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-200 dark:text-slate-100 mb-4">{t('dashboard.creation_tools_title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-[#1e293b]/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700/30 h-full flex flex-col items-start text-left">
                            <div className="p-3 bg-lime-100 dark:bg-lime-900/50 rounded-full mb-4">
                                <CatalogIcon className="w-6 h-6 text-lime-600 dark:text-lime-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-200 dark:text-slate-100">{t('dashboard.catalog_generator_title')}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex-grow">
                                {t('dashboard.catalog_generator_desc')}
                            </p>
                            <button
                                onClick={() => setIsCatalogCreatorOpen(true)}
                                className="w-full mt-6 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                {t('dashboard.catalog_generator_action')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )

    }


    return (
        <div className="p-8 bg-transparent min-h-full" onContextMenu={(e) => !contextMenu && handleContextMenu(e)}>
            {renderContent()}
            {isCatalogCreatorOpen && selectedCustomer && <CatalogCreator customer={selectedCustomer} onClose={() => setIsCatalogCreatorOpen(false)} />}
            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
                    items={
                        contextMenu.customerId
                            ? [
                                { label: t('dashboard.context_menu_rename'), onClick: () => setRenamingCustomerId(contextMenu.customerId!) },
                                { label: t('dashboard.context_menu_delete'), onClick: () => handleDeleteCustomer(contextMenu.customerId!), className: 'text-red-600 hover:bg-black dark:hover:bg-red-900/50' }
                              ]
                            : [{ label: t('dashboard.context_menu_new_folder'), onClick: handleCreateCustomer }]
                    }
                />
            )}
        </div>
    );
};

export default DashboardPage;