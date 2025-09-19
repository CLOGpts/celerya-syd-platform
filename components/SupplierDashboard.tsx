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
            
            const parsedData = JSON.parse(jsonStr) as Product;
            if(!parsedData.identificazione?.produttore) {
                throw new Error("Analisi fallita: il documento non sembra una scheda tecnica valida. Produttore non trovato.");
            }

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
            setToast({ message: `+${FEE_PER_DOCUMENT.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} per l'analisi!`, type: 'success' });
            setFile(null);

        } catch (e: any) {
            console.error("Extraction failed:", e);
            const errorMessage = e.message || "L'analisi del documento è fallita. Riprova.";
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
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 focus:outline-none focus:ring-lime-500 focus:border-lime-500 sm:text-sm rounded-md shadow-sm"
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
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 focus:outline-none focus:ring-lime-500 focus:border-lime-500 sm:text-sm rounded-md shadow-sm"
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
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-gray-200 dark:text-gray-100">Oppure, automatizza il processo</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Collega una cartella cloud e lascia che Celerya processi i file per te. <span className="font-semibold text-lime-600 dark:text-lime-400">Ideale e più conveniente per caricamenti frequenti.</span></p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Google Drive Card */}
                            <div className="bg-gray-900 dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-800 dark:border-slate-700 flex flex-col items-center text-center">
                                <GoogleDriveIcon className="w-12 h-12" />
                                <h4 className="mt-4 font-semibold text-gray-200 dark:text-gray-200">Google Drive</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex-grow">Imposta una cartella condivisa per l'upload automatico.</p>
                                <button className="mt-4 w-full px-4 py-2 border border-gray-700 dark:border-slate-600 text-sm font-medium rounded-lg text-gray-300 dark:text-gray-200 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600">
                                    Collega (coming soon)
                                </button>
                            </div>
                            {/* Microsoft OneDrive Card */}
                            <div className="bg-gray-900 dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-800 dark:border-slate-700 flex flex-col items-center text-center">
                                <MicrosoftIcon className="w-12 h-12" />
                                <h4 className="mt-4 font-semibold text-gray-200 dark:text-gray-200">OneDrive</h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex-grow">Sincronizza i tuoi documenti da Microsoft 365.</p>
                                <button className="mt-4 w-full px-4 py-2 border border-gray-700 dark:border-slate-600 text-sm font-medium rounded-lg text-gray-300 dark:text-gray-200 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600">
                                    Collega (coming soon)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Balance & History */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Balance Card */}
                        <div className="bg-gray-900 dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-800 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lime-100 dark:bg-lime-900/50 rounded-full">
                                    <WalletIcon className="w-6 h-6 text-lime-600 dark:text-lime-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Disponibile</p>
                                    <p className="text-2xl font-bold text-gray-100 dark:text-gray-200">
                                        {balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                </div>
                            </div>
                            <button className="mt-4 w-full px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition-colors">
                                Ritira Fondi
                            </button>
                        </div>

                        {/* History Card */}
                        <div className="bg-gray-900 dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-800 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-100 mb-4">Cronologia Guadagni</h3>
                            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-4">
                                {sortedEarnings.length > 0 ? sortedEarnings.map(earning => (
                                    <li key={earning.id} className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-900 dark:bg-slate-700 rounded-full">
                                            {earning.status === 'approved' ? (
                                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <ClockIcon className="w-5 h-5 text-yellow-500" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium text-gray-200 dark:text-gray-200 truncate">{earning.documentName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(earning.date).toLocaleString('it-IT')} &middot; {earning.documentType}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                            +{earning.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                    </li>
                                )) : (
                                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">Nessun guadagno registrato.</p>
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
