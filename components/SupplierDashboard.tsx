import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import UploadBox from './UploadBox';
import { WalletIcon } from './icons/WalletIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CoinIcon } from './icons/CoinIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import type { SupplierEarning, Product } from '../types';
import { getCustomSchema, generatePromptFromSchema } from '../constants';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { MicrosoftIcon } from './icons/MicrosoftIcon';

const FEE_PER_DOCUMENT = 0.15; // € 0.15 per ogni documento caricato

const generateUniqueId = (): string => `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');


interface SupplierDashboardProps {
    availableSuppliers: string[];
    availableCustomers: string[];
    selectedSupplier: string;
    setSelectedSupplier: (name: string) => void;
    selectedCustomer: string;
    setSelectedCustomer: (name: string) => void;
}

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ 
    availableSuppliers, 
    availableCustomers, 
    selectedSupplier, 
    setSelectedSupplier, 
    selectedCustomer, 
    setSelectedCustomer 
}) => {
    const [balance, setBalance] = useState<number>(0);
    const [earnings, setEarnings] = useState<SupplierEarning[]>([]);
    
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const supplierSlug = useMemo(() => slugify(selectedSupplier), [selectedSupplier]);
    const balanceKey = `celerya_supplier_balance_${supplierSlug}`;
    const earningsKey = `celerya_supplier_earnings_${supplierSlug}`;

    // Load data from localStorage when supplier changes
    useEffect(() => {
        try {
            const storedBalance = localStorage.getItem(balanceKey);
            const storedEarnings = localStorage.getItem(earningsKey);
            setBalance(storedBalance ? parseFloat(storedBalance) : 0);
            setEarnings(storedEarnings ? JSON.parse(storedEarnings) : []);
        } catch (e) {
            console.error("Failed to load supplier data from localStorage", e);
            setBalance(0);
            setEarnings([]);
        }
    }, [selectedSupplier, balanceKey, earningsKey]);

    // Save data to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem(balanceKey, balance.toString());
            localStorage.setItem(earningsKey, JSON.stringify(earnings));
        } catch (e) {
            console.error("Failed to save supplier data to localStorage", e);
        }
    }, [balance, earnings, balanceKey, earningsKey]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleFileChange = useCallback((selectedFile: File | null) => {
        setFile(selectedFile);
        setError(null);
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        console.log('🚀 Iniziando analisi documento:', file.name, 'Tipo:', file.type, 'Dimensione:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

        try {
            // Fix: Usa la chiave API corretta configurata in vite.config.ts
            const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
            console.log('🔑 API Key configurata:', apiKey ? 'SI' : 'NO', apiKey ? `(${apiKey.substring(0, 10)}...)` : '');

            if (!apiKey) {
                console.error('❌ API Key non trovata. Environment variables:', {
                    API_KEY: process.env.API_KEY,
                    GEMINI_API_KEY: process.env.GEMINI_API_KEY
                });
                throw new Error("API Key Google AI non configurata. Verifica il file .env.local");
            }

            console.log('🔧 Inizializzazione GoogleGenAI...');
            const ai = new GoogleGenAI({ apiKey });  // Fix: passa oggetto con apiKey
            console.log('✅ GoogleGenAI inizializzato correttamente');
            const customSchema = getCustomSchema();
            const dynamicPrompt = generatePromptFromSchema(customSchema);
            const imagePart = { inlineData: { mimeType: file.type, data: await fileToBase64(file) } };
            const textPart = { text: dynamicPrompt };

            // Fix: Modello corretto per Gemini
            console.log('📡 Invio richiesta a Gemini con modello gemini-2.5-flash...');
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [imagePart, textPart] }],
                config: { responseMimeType: "application/json" },
            });

            console.log('✅ Risposta ricevuta da Gemini:', response.text ? 'SI' : 'NO');
            let jsonStr = response.text.trim();
            console.log('📝 Lunghezza risposta JSON:', jsonStr.length);

            const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
            if (match && match[2]) {
                console.log('🧹 Rimosso wrapper markdown dalla risposta');
                jsonStr = match[2].trim();
            }

            console.log('🔍 Tentativo parsing JSON...');
            const parsedData = JSON.parse(jsonStr) as Product;
            console.log('✅ JSON parsato con successo:', parsedData);

            // Validazione più robusta della struttura
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error("Analisi fallita: risposta non valida da Gemini API");
            }

            if (!parsedData.identificazione || !parsedData.identificazione.produttore) {
                console.warn('⚠️ Struttura JSON ricevuta:', JSON.stringify(parsedData, null, 2));
                throw new Error("Analisi fallita: il documento non sembra una scheda tecnica valida. Produttore non trovato.");
            }

            console.log('✅ Validazione completata. Produttore trovato:', parsedData.identificazione.produttore);

            const newEarning: SupplierEarning = {
                id: generateUniqueId(),
                documentName: file.name,
                documentType: file.type.startsWith('image/') ? 'Immagine' : file.type.includes('pdf') ? 'PDF' : 'Documento',
                fee: FEE_PER_DOCUMENT,
                date: new Date().toISOString(),
                status: 'approved',
            };

            setBalance(prev => prev + FEE_PER_DOCUMENT);
            setEarnings(prev => [newEarning, ...prev]);

            // SALVA ANCHE IN celerya_suppliers_data PER LISTA DOCUMENTI
            const customerSlug = slugify(selectedCustomer);
            const supplierSlug = slugify(selectedSupplier);
            console.log('💾 Preparazione salvataggio dati:', { customerSlug, supplierSlug });

            const allSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
            console.log('📚 Dati esistenti localStorage:', Object.keys(allSuppliersData));

            if (!allSuppliersData[customerSlug]) {
                console.log('🆕 Creazione nuovo cliente:', customerSlug);
                allSuppliersData[customerSlug] = { suppliers: {} };
            }
            if (!allSuppliersData[customerSlug].suppliers[supplierSlug]) {
                console.log('🆕 Creazione nuovo fornitore:', supplierSlug);
                allSuppliersData[customerSlug].suppliers[supplierSlug] = {
                    name: selectedSupplier,
                    lastUpdate: new Date().toISOString(),
                    pdfs: {}
                };
            }

            // Aggiungi il documento processato
            const docId = generateUniqueId();
            console.log('📄 Salvataggio documento con ID:', docId);

            allSuppliersData[customerSlug].suppliers[supplierSlug].pdfs[docId] = {
                ...parsedData,
                id: docId,
                savedAt: new Date().toISOString(),
                fileName: file.name
            };

            // Aggiorna lastUpdate del fornitore
            allSuppliersData[customerSlug].suppliers[supplierSlug].lastUpdate = new Date().toISOString();

            console.log('💾 Salvataggio in localStorage...');
            localStorage.setItem('celerya_suppliers_data', JSON.stringify(allSuppliersData));

            // Verifica che il salvataggio sia andato a buon fine
            const savedData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
            const docCount = Object.keys(savedData[customerSlug]?.suppliers?.[supplierSlug]?.pdfs || {}).length;
            console.log('✅ Documenti salvati per questo fornitore:', docCount);

            setToast({ message: `+${FEE_PER_DOCUMENT.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} per l'analisi!`, type: 'success' });
            setFile(null);

        } catch (e: any) {
            console.error("Extraction failed:", e);

            // Gestione errori più specifica
            let errorMessage = "L'analisi del documento è fallita. Riprova.";

            if (e.message?.includes("API Key")) {
                errorMessage = "Errore di configurazione: API Key Google AI non valida o mancante.";
            } else if (e.message?.includes("quota")) {
                errorMessage = "Quota API Google AI esaurita. Riprova più tardi.";
            } else if (e.message?.includes("network") || e.message?.includes("fetch")) {
                errorMessage = "Errore di connessione. Verifica la tua connessione internet.";
            } else if (e.message?.includes("produttore non trovato")) {
                errorMessage = e.message; // Mantieni il messaggio specifico di validazione
            } else if (e.name === "SyntaxError") {
                errorMessage = "Errore di parsing: risposta API non valida. Il documento potrebbe non essere leggibile.";
            } else if (e.message) {
                errorMessage = e.message;
            }

            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const sortedEarnings = useMemo(() => {
        return [...earnings].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [earnings]);

    return (
        <div className="bg-black dark:bg-slate-900 min-h-screen font-sans">
            <header className="bg-gray-900/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-gray-800 dark:border-slate-700 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
                        <div className="lg:col-span-1">
                            <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100">Dashboard Fornitore</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Simulazione di caricamento dati</p>
                        </div>
                        
                        <div className="lg:col-start-2">
                            <label htmlFor="supplier-selector" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Io sono il fornitore:
                            </label>
                            <select
                                id="supplier-selector"
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-900 border-gray-700 text-gray-200 focus:outline-none focus:ring-lime-500 focus:border-lime-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {availableSuppliers.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="customer-selector" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Carico per il cliente:
                            </label>
                            <select
                                id="customer-selector"
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-900 border-gray-700 text-gray-200 focus:outline-none focus:ring-lime-500 focus:border-lime-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {availableCustomers.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upload Area & Automation */}
                    <div className="lg:col-span-2 space-y-8">
                        <UploadBox 
                            title={`Carica un documento per ${selectedCustomer}`}
                            description="Trascina qualsiasi documento per ricevere la tua fee istantanea. Guadagna € 0.15 per ogni documento caricato!"
                            actionButtonText={file ? "Carica e Guadagna" : "Analizza e Guadagna"}
                            file={file}
                            isProcessing={isProcessing}
                            onFileChange={handleFileChange}
                            onAction={handleAnalyze}
                            error={error}
                            acceptedFileTypes="*"
                            idPrefix="supplier-upload"
                        />

                         {/* Automation Section */}
                        <div className="text-center p-8 bg-gray-900/50 rounded-xl border border-gray-800">
                            <h3 className="text-2xl font-bold text-white mb-2">Oppure, automatizza il processo</h3>
                            <p className="text-sm text-gray-400">Collega una cartella cloud e lascia che Celerya processi i file per te.</p>
                            <p className="text-sm font-semibold text-lime-400 mt-2">Ideale e più conveniente per caricamenti frequenti.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Google Drive Card */}
                            <div className="bg-gray-900/80 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center text-center hover:bg-gray-900 transition-colors">
                                <GoogleDriveIcon className="w-12 h-12" />
                                <h4 className="mt-4 font-bold text-white">Google Drive</h4>
                                <p className="mt-2 text-sm text-gray-400 flex-grow">Imposta una cartella condivisa per l'upload automatico.</p>
                                <button className="mt-4 w-full px-4 py-2.5 border border-gray-600 text-sm font-semibold rounded-lg text-white bg-gray-800/80 hover:bg-gray-700 transition-all hover:border-gray-500">
                                    Collega (coming soon)
                                </button>
                            </div>
                            {/* Microsoft OneDrive Card */}
                            <div className="bg-gray-900/80 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center text-center hover:bg-gray-900 transition-colors">
                                <MicrosoftIcon className="w-12 h-12" />
                                <h4 className="mt-4 font-bold text-white">OneDrive</h4>
                                <p className="mt-2 text-sm text-gray-400 flex-grow">Sincronizza i tuoi documenti da Microsoft 365.</p>
                                <button className="mt-4 w-full px-4 py-2.5 border border-gray-600 text-sm font-semibold rounded-lg text-white bg-gray-800/80 hover:bg-gray-700 transition-all hover:border-gray-500">
                                    Collega (coming soon)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Balance & History */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Balance Card */}
                        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lime-900/30 rounded-full">
                                    <WalletIcon className="w-6 h-6 text-lime-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Saldo Disponibile</p>
                                    <p className="text-2xl font-bold text-gray-100">
                                        {balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                            </div>
                            <button className="mt-4 w-full px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                                Ritira Fondi
                            </button>
                        </div>

                        {/* History Card */}
                        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">Cronologia Guadagni</h3>
                            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-4">
                                {sortedEarnings.length > 0 ? sortedEarnings.map(earning => (
                                    <li key={earning.id} className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-800 rounded-full">
                                            {earning.status === 'approved' ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <ClockIcon className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium text-gray-200 truncate">{earning.documentName}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(earning.date).toLocaleString('it-IT')} &middot; {earning.documentType}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-green-400">
                                            +{earning.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                    </li>
                                )) : (
                                    <p className="text-sm text-center text-gray-400 py-6">Nessun guadagno registrato.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
            {toast && (
                <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <CoinIcon className="w-6 h-6"/>
                    <span className="font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};
