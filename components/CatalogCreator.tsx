import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Customer, AllSuppliersData, SupplierData, Product, AnalyzedCatalog, CommercialProductInfo } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SearchIcon } from './icons/SearchIcon';

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const generateCeleryaId = (): string => `C-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

type CommercialInfo = {
    price: string;
    unit: string;
    selected: boolean;
};

interface CatalogCreatorProps {
    customer: Customer;
    onClose: () => void;
}

const CatalogCreator: React.FC<CatalogCreatorProps> = ({ customer, onClose }) => {
    const { t } = useTranslation();
    const [suppliers, setSuppliers] = useState<Array<SupplierData & { slug: string }>>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [catalogName, setCatalogName] = useState('');
    const [commercialInfo, setCommercialInfo] = useState<Map<string, CommercialInfo>>(new Map());
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
        const customerSuppliers = allData[customer.slug]?.suppliers || {};
        const suppliersWithPdfs = Object.entries(customerSuppliers)
            .filter(([, data]) => Object.keys(data.pdfs || {}).length > 0)
            .map(([slug, data]) => ({ ...data, slug }));
        setSuppliers(suppliersWithPdfs);
    }, [customer]);

    const parseUnit = (pesoNetto: string): string => {
        if (!pesoNetto) return '';
        const match = pesoNetto.match(/[a-zA-Z]+$/);
        return match ? match[0] : '';
    };

    useEffect(() => {
        if (selectedSupplier) {
            const supplierData = suppliers.find(s => s.slug === selectedSupplier);
            if (supplierData) {
                const supplierProducts = Object.values(supplierData.pdfs || {});
                setProducts(supplierProducts);
                const newInfo = new Map<string, CommercialInfo>();
                supplierProducts.forEach((p: any) => {
                    newInfo.set(p.id, {
                        price: '',
                        unit: p.packaging?.pesoNetto ? parseUnit(p.packaging.pesoNetto) : '',
                        selected: true,
                    });
                });
                setCommercialInfo(newInfo);
            }
        } else {
            setProducts([]);
            setCommercialInfo(new Map());
        }
    }, [selectedSupplier, suppliers]);
    
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleInfoChange = (productId: string, field: keyof Omit<CommercialInfo, 'selected'>, value: string) => {
        setCommercialInfo(prev => {
            const newInfo = new Map(prev);
            const current = newInfo.get(productId);
            if (current) {
                const updated = Object.assign({}, current, { [field]: value });
                newInfo.set(productId, updated);
            }
            return newInfo;
        });
    };

    const handleSelectionChange = (productId: string, isSelected: boolean) => {
        setCommercialInfo(prev => {
            const newInfo = new Map(prev);
            const current = newInfo.get(productId);
            if (current) {
                const updated = Object.assign({}, current, { selected: isSelected });
                newInfo.set(productId, updated);
            }
            return newInfo;
        });
    };

    const handleSelectAll = (isSelected: boolean) => {
        setCommercialInfo(prev => {
            const newInfo = new Map(prev);
            filteredProducts.forEach(p => {
                const current = newInfo.get(p.id);
                if (current) {
                    const updated = Object.assign({}, current, { selected: isSelected });
                    newInfo.set(p.id, updated);
                }
            });
            return newInfo;
        });
    };

    const handleGenerateCatalog = () => {
        if (!catalogName.trim() || !selectedSupplier) return;
        setIsSaving(true);
        try {
            const supplierData = suppliers.find(s => s.slug === selectedSupplier);
            if (!supplierData) throw new Error("Supplier not found");

            const productItems: CommercialProductInfo[] = [];
            products.forEach(p => {
                const info = commercialInfo.get(p.id);
                if (info?.selected) {
                    productItems.push({
                        codiceArticolo: p.identificazione.codiceProdotto,
                        descrizione: p.descrizione.denominazioneLegale,
                        prezzo: parseFloat(info.price) || 0,
                        unitaMisura: info.unit,
                    });
                }
            });

            if (productItems.length === 0) {
                throw new Error("No products selected");
            }

            const newCatalog: AnalyzedCatalog = {
                id: generateCeleryaId(),
                nomeFornitore: supplierData.name,
                nomeCatalogo: catalogName.trim(),
                prodotti: productItems,
                savedAt: new Date().toISOString(),
            };

            const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
            const customerSuppliers = allData[customer.slug]?.suppliers?.[selectedSupplier];
            if (customerSuppliers) {
                if (!customerSuppliers.catalogs) {
                    customerSuppliers.catalogs = {};
                }
                customerSuppliers.catalogs[newCatalog.id] = newCatalog;
                customerSuppliers.lastUpdate = new Date().toISOString();
                localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
                
                setToast({ message: t('catalog_creator.success_toast', { catalogName: newCatalog.nomeCatalogo }), type: 'success' });
                setTimeout(onClose, 2000);
            }
        } catch (e) {
            console.error("Failed to generate catalog:", e);
            setToast({ message: t('catalog_creator.error_toast'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.descrizione.denominazioneLegale.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.identificazione.codiceProdotto.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const isAllSelected = useMemo(() => {
        if (filteredProducts.length === 0) return false;
        return filteredProducts.every(p => commercialInfo.get(p.id)?.selected);
    }, [filteredProducts, commercialInfo]);

    const canGenerate = useMemo(() => {
        return catalogName.trim() && selectedSupplier && Array.from(commercialInfo.values()).some((info: CommercialInfo) => info.selected);
    }, [catalogName, selectedSupplier, commercialInfo]);

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('catalog_creator.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="catalogName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('catalog_creator.catalog_name')}</label>
                            <input type="text" id="catalogName" value={catalogName} onChange={e => setCatalogName(e.target.value)} placeholder={t('catalog_creator.catalog_name_placeholder')} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:ring-lime-500 focus:border-lime-500 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('catalog_creator.select_supplier')}</label>
                            <select id="supplier" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:ring-lime-500 focus:border-lime-500 text-sm">
                                <option value="">-- {t('catalog_creator.select_supplier')} --</option>
                                {suppliers.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {selectedSupplier && (
                        <div>
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('catalog_creator.products_table_title')}</h3>
                             <div className="relative mb-2">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SearchIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input type="text" placeholder={t('catalog_creator.search_products')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 rounded-lg shadow-sm focus:ring-lime-500 focus:border-lime-500 text-sm" />
                            </div>
                            <div className="overflow-auto border border-gray-200 dark:border-slate-700 rounded-lg max-h-[45vh]">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                                        <tr>
                                            <th className="p-2 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={e => handleSelectAll(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:bg-slate-900 dark:border-slate-600 text-lime-600 focus:ring-lime-500 cursor-pointer" title={t('catalog_creator.select_all')} /></th>
                                            <th className="p-2 font-semibold text-gray-600 dark:text-gray-300">{t('catalog_creator.product')}</th>
                                            <th className="p-2 font-semibold text-gray-600 dark:text-gray-300 w-28">{t('catalog_creator.price')}</th>
                                            <th className="p-2 font-semibold text-gray-600 dark:text-gray-300 w-28">{t('catalog_creator.unit')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                        {filteredProducts.map(product => {
                                            const info = commercialInfo.get(product.id);
                                            return (
                                                <tr key={product.id} className={info?.selected ? '' : 'bg-gray-50 dark:bg-slate-800/50 opacity-60'}>
                                                    <td className="p-2 text-center"><input type="checkbox" checked={info?.selected || false} onChange={e => handleSelectionChange(product.id, e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:bg-slate-900 dark:border-slate-600 text-lime-600 focus:ring-lime-500 cursor-pointer" /></td>
                                                    <td className="p-2">
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{product.descrizione.denominazioneLegale}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product.identificazione.codiceProdotto}</p>
                                                    </td>
                                                    <td className="p-2"><input type="number" value={info?.price || ''} onChange={e => handleInfoChange(product.id, 'price', e.target.value)} className="w-full text-sm p-1 rounded border-gray-300 dark:bg-slate-700 dark:border-slate-600 focus:ring-lime-500 focus:border-lime-500" /></td>
                                                    <td className="p-2"><input type="text" value={info?.unit || ''} onChange={e => handleInfoChange(product.id, 'unit', e.target.value)} className="w-full text-sm p-1 rounded border-gray-300 dark:bg-slate-700 dark:border-slate-600 focus:ring-lime-500 focus:border-lime-500" /></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end items-center gap-3 flex-shrink-0 bg-white dark:bg-slate-800">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">{t('catalog_creator.close')}</button>
                    <button onClick={handleGenerateCatalog} disabled={!canGenerate || isSaving} className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-lime-600 hover:bg-lime-700 disabled:bg-lime-400 flex items-center gap-2">
                        {isSaving && <SpinnerIcon />}
                        {t('catalog_creator.generate_and_save')}
                    </button>
                </footer>
            </div>
            {toast && (
                <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <CheckCircleIcon className="w-6 h-6"/>
                    <span className="font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default CatalogCreator;
