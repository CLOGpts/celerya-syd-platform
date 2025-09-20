import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UploadBox from './UploadBox';
import { WalletIcon } from './icons/WalletIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CoinIcon } from './icons/CoinIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import type { SupplierEarning, Product } from '../types';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { MicrosoftIcon } from './icons/MicrosoftIcon';
import { auth, db, storage } from '../src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { supplierDocumentService } from '../src/services/supplierDocumentService';
import sydService from '../src/services/sydService';

const generateUniqueId = (): string => `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    const [documents, setDocuments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'earnings' | 'documents'>('earnings');

    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

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

    // Load Firebase earnings and documents data - FIXED FOR DEMO
    useEffect(() => {
        const loadFirebaseData = async () => {
            try {
                console.log('📊 Caricamento documenti per supplier:', selectedSupplier);

                const userId = auth.currentUser?.uid;
                if (!userId || !selectedSupplier) {
                    console.log('Utente non autenticato o supplier non selezionato');
                    return;
                }

                // USA IL SERVIZIO CORRETTO per caricare documenti filtrati
                const supplierDocuments = await supplierDocumentService.getSupplierDocuments(selectedSupplier);
                const supplierEarnings = await supplierDocumentService.getSupplierEarnings(selectedSupplier);

                console.log(`✅ Caricati ${supplierDocuments.length} documenti per ${selectedSupplier}`);
                console.log(`✅ Caricati ${supplierEarnings.length} earnings per ${selectedSupplier}`);

                setDocuments(supplierDocuments);
                setEarnings(supplierEarnings);

                // Calcola balance totale PER QUESTO SUPPLIER
                const totalBalance = supplierEarnings
                    .filter(e => e.status === 'approved')
                    .reduce((sum, e) => sum + e.fee, 0);
                setBalance(totalBalance);
            } catch (error) {
                console.warn('⚠️ Errore caricamento da Firebase:', error);
            }
        };

        if (selectedSupplier) {
            loadFirebaseData();
        }
    }, [selectedSupplier]);

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
        setUploadProgress(0);

        console.log('🚀 WARFARE MODE: Analisi documento con service professionale:', file.name);

        try {
            setUploadProgress(10);

            // USA IL SERVICE COMPLETO - NO BYPASS
            const result = await supplierDocumentService.processCompleteWorkflow(
                file,
                selectedSupplier,
                selectedCustomer
            );

            setUploadProgress(60);

            console.log('✅ SERVICE RESULT:', result);

            // Update local state IMMEDIATAMENTE
            const newEarning: SupplierEarning = {
                id: generateUniqueId(),
                documentName: file.name,
                documentType: result.processedData?.identificazione?.tipo || 'Documento',
                fee: result.earnings.totalEarnings,
                date: new Date().toISOString(),
                status: 'approved',
            };

            // ATOMIC STATE UPDATES
            setBalance(prev => prev + result.earnings.totalEarnings);
            setEarnings(prev => [newEarning, ...prev]);

            setUploadProgress(80);

            // Crea docData per UI
            const docData = {
                id: result.documentId,
                fileName: file.name,
                fileType: result.processedData?.identificazione?.tipo || file.type,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                supplier: selectedSupplier,
                customer: selectedCustomer,
                earnings: result.earnings,
                status: 'completed'
            };

            // IMMEDIATE UI UPDATE
            setDocuments(prev => [docData, ...prev]);

            setUploadProgress(90);

            // Legacy localStorage per compatibilità
            try {
                const customerSlug = slugify(selectedCustomer);
                const supplierSlug = slugify(selectedSupplier);
                const allSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');

                if (!allSuppliersData[customerSlug]) {
                    allSuppliersData[customerSlug] = { suppliers: {} };
                }
                if (!allSuppliersData[customerSlug].suppliers[supplierSlug]) {
                    allSuppliersData[customerSlug].suppliers[supplierSlug] = {
                        name: selectedSupplier,
                        lastUpdate: new Date().toISOString(),
                        pdfs: {}
                    };
                }

                allSuppliersData[customerSlug].suppliers[supplierSlug].pdfs[result.documentId] = {
                    ...result.processedData,
                    id: result.documentId,
                    savedAt: new Date().toISOString(),
                    fileName: file.name,
                    earnings: result.earnings
                };

                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allSuppliersData));
                console.log('💾 Legacy localStorage aggiornato');
            } catch (legacyError) {
                console.warn('⚠️ Legacy save failed, core functionality maintained:', legacyError);
            }

            setUploadProgress(100);

            setToast({
                message: `+${result.earnings.totalEarnings.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} per l'analisi!`,
                type: 'success'
            });
            setFile(null);

            // SUCCESS - Reset progress dopo 1 secondo
            setTimeout(() => setUploadProgress(0), 1000);

        } catch (e: any) {
            console.error("❌ WARFARE FAILED:", e);

            let errorMessage = e.message || "Errore durante l'elaborazione del documento";

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
                            <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100">Dashboard Fornitore Enhanced</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Multi-formato + Firebase + Earnings calcolati</p>
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
                            title={`Carica documento multi-formato per ${selectedCustomer}`}
                            description="Supporto completo: PDF, Excel, CSV, Word, Immagini. Firebase Storage + Earnings automatici. Guadagna fee variabile per tipo documento!"
                            actionButtonText={file ? "Carica e Processa" : "Analizza Multi-Formato"}
                            file={file}
                            isProcessing={isProcessing}
                            onFileChange={handleFileChange}
                            onAction={handleAnalyze}
                            error={error}
                            acceptedFileTypes="*"
                            idPrefix="supplier-upload"
                        />

                        {/* Progress Bar */}
                        {isProcessing && uploadProgress > 0 && (
                            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Elaborazione documento...</span>
                                    <span className="text-sm text-lime-400">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div 
                                        className="bg-lime-500 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced File Support Info */}
                        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Formati Supportati Enhanced</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                                    <span className="text-gray-300">PDF (€0.15)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-gray-300">Excel (€0.20)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-gray-300">CSV (€0.10)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-gray-300">Word (€0.12)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    <span className="text-gray-300">Immagini (€0.15)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                    <span className="text-gray-300">+ Bonus validità</span>
                                </div>
                            </div>
                        </div>

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
                        {/* Enhanced Balance Card */}
                        <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-lime-900/30 rounded-full">
                                    <WalletIcon className="w-6 h-6 text-lime-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Saldo Enhanced</p>
                                    <p className="text-2xl font-bold text-gray-100">
                                        {balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                    <p className="text-xs text-lime-400">Firebase + localStorage sync</p>
                                </div>
                            </div>
                            <button className="mt-4 w-full px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                                Ritira Fondi
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <div className="flex border-b border-gray-800">
                                <button
                                    onClick={() => setActiveTab('earnings')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeTab === 'earnings'
                                            ? 'bg-gray-800 text-white border-b-2 border-lime-500'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    Cronologia ({sortedEarnings.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('documents')}
                                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeTab === 'documents'
                                            ? 'bg-gray-800 text-white border-b-2 border-lime-500'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    Documenti ({documents.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'earnings' ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Cronologia Enhanced</h3>
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
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Documenti Caricati</h3>
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-4">
                                            {documents.length > 0 ? documents.map(doc => (
                                                <div key={doc.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-grow">
                                                            <p className="text-sm font-medium text-gray-200 truncate">{doc.fileName}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {doc.fileType} &middot; {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(doc.uploadDate).toLocaleString('it-IT')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="text-sm font-semibold text-lime-400">
                                                                €{doc.earnings?.totalEarnings?.toFixed(2) || '0.00'}
                                                            </p>
                                                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                                                doc.status === 'completed'
                                                                    ? 'bg-green-900/30 text-green-400'
                                                                    : 'bg-yellow-900/30 text-yellow-400'
                                                            }`}>
                                                                {doc.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-center text-gray-400 py-6">Nessun documento caricato.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
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
