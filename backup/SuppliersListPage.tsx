
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import * as QRCode from 'qrcode';
import { Product, Alert, AnalyzedTransportDocument, Section, AllSuppliersData, Customer, AnalyzedCatalog, AnalyzedPriceList } from '../types';
import PdfContent from './PdfContent';
import { DownloadIcon } from './icons/DownloadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { getCustomSchema, generateAlertsFromSchema, CELERYA_STANDARD } from '../constants';
import { ExcelIcon } from './icons/ExcelIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CatalogIcon } from './icons/CatalogIcon';
import { PriceListIcon } from './icons/PriceListIcon';

type EnhancedProduct = Product & { savedAt:string };
type EnhancedDDT = AnalyzedTransportDocument & { savedAt:string };
type EnhancedCatalog = AnalyzedCatalog & { savedAt: string };
type EnhancedPriceList = AnalyzedPriceList & { savedAt: string };


interface Supplier {
    slug: string;
    name: string;
    docCount: number;
    lastUpdate: string;
    celeryaId?: string;
    pdfs: Record<string, EnhancedProduct>;
    ddts?: Record<string, EnhancedDDT>;
    catalogs?: Record<string, EnhancedCatalog>;
    priceLists?: Record<string, EnhancedPriceList>;
    customerName: string;
    customerSlug: string;
}

const XIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    return date.toLocaleDateString('it-IT');
}

const generateDDTExcel = (data: AnalyzedTransportDocument) => {
    const infoData = [
        { Campo: 'Mittente', Valore: data.info.mittente || 'N/D' },
        { Campo: 'Destinatario', Valore: data.info.destinatario || 'N/D' },
        { Campo: 'Numero DDT', Valore: data.info.numeroDDT || 'N/D' },
        { Campo: 'Data DDT', Valore: formatDate(data.info.dataDDT) ?? 'N/D' },
        { Campo: 'Vettore', Valore: data.info.vettore || 'N/D' },
    ];
    const infoSheet = XLSX.utils.json_to_sheet(infoData);
    infoSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];

    const productsData = data.prodotti.map(product => ({
        'Prodotto': product.descrizione || 'MANCANTE',
        'Quantità': product.quantita || 'MANCANTE',
        'Lotto': product.lotto || 'MANCANTE',
        'Scadenza': formatDate(product.scadenza) || 'MANCANTE'
    }));
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    productsSheet['!cols'] = [{ wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, infoSheet, 'Informazioni DDT');
    XLSX.utils.book_append_sheet(wb, productsSheet, 'Elenco Prodotti');
    
    const ddtNumber = data.info.numeroDDT || 'DDT';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Standard Celerya DDT - ${ddtNumber.replace(/[\/\\]/g, '_')} - ${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);
};

const ResourceCreationModal: React.FC<{
    pdf: EnhancedProduct;
    supplier: Supplier;
    onClose: () => void;
    onSave: (customerSlug: string, supplierSlug: string, pdfId: string, qrCodeUrl: string) => void;
}> = ({ pdf, supplier, onClose, onSave }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [qrLink, setQrLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const pdfPreviewRef = useRef<HTMLDivElement>(null);

    const fullSchema = useMemo(() => getCustomSchema(), []);
    const alerts = useMemo(() => generateAlertsFromSchema(pdf, fullSchema), [pdf, fullSchema]);

    useEffect(() => {
        const url = `${window.location.origin}${window.location.pathname}?resource_id=${pdf.id}`;
        setQrLink(url);
        QRCode.toDataURL(url, { width: 256, margin: 1 })
            .then(dataUrl => setQrCodeDataUrl(dataUrl))
            .catch(err => console.error("Failed to generate QR code", err));
    }, [pdf.id]);

    const handleSave = () => {
        setIsSaving(true);
        onSave(supplier.customerSlug, supplier.slug, pdf.id, qrLink);
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-800 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 dark:text-gray-100">Crea Risorsa QR (Scheda Tecnica)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Anteprima per: {pdf.identificazione.denominazioneScheda}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-200 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 bg-black dark:bg-slate-900">
                    <PdfContent ref={pdfPreviewRef} data={pdf} alerts={alerts} schema={fullSchema} qrCodeDataUrl={qrCodeDataUrl ?? undefined} />
                </main>
                <footer className="p-4 border-t border-gray-800 dark:border-slate-700 flex justify-end items-center gap-3 flex-shrink-0 bg-gray-900 dark:bg-slate-800">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-700 dark:border-slate-600 text-sm font-medium rounded-lg text-gray-300 dark:text-gray-200 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving || !qrCodeDataUrl} className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-lime-600 hover:bg-lime-700 disabled:bg-lime-400 flex items-center gap-2">
                        {isSaving ? <SpinnerIcon /> : <QrCodeIcon />}
                        Salva e Associa QR Code
                    </button>
                </footer>
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-100 dark:text-gray-200 font-semibold">{value || 'N/D'}</dd>
    </div>
);

const MissingValue: React.FC = () => (
    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-bold rounded-full">MANCANTE</span>
);


const DDTResourceCreationModal: React.FC<{
    ddt: EnhancedDDT;
    supplier: Supplier;
    onClose: () => void;
    onSave: (customerSlug: string, supplierSlug: string, ddtId: string, qrCodeUrl: string) => void;
}> = ({ ddt, supplier, onClose, onSave }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [qrLink, setQrLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // The URL needs the supplier slug, which is unique across customers in this context
        const url = `${window.location.origin}${window.location.pathname}?supplier_slug=${supplier.slug}&ddt_id=${ddt.id}`;
        setQrLink(url);
        QRCode.toDataURL(url, { width: 256, margin: 1 })
            .then(dataUrl => setQrCodeDataUrl(dataUrl))
            .catch(err => console.error("Failed to generate QR code", err));
    }, [ddt.id, supplier.slug]);
    
    const handleSave = () => {
        setIsSaving(true);
        onSave(supplier.customerSlug, supplier.slug, ddt.id, qrLink);
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-800 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 dark:text-gray-100">Crea Risorsa QR (DDT)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Anteprima per DDT N. {ddt.info.numeroDDT}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-200 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black dark:bg-slate-900 relative">
                     <header className="mb-8 text-center border-b border-gray-700 dark:border-slate-600 pb-6">
                        <h2 className="text-2xl font-bold text-slate-100 dark:text-slate-100">Documento di Trasporto</h2>
                        <p className="text-lg text-slate-300 dark:text-slate-300 mt-1">Mittente: {ddt.info.mittente}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">DDT N. {ddt.info.numeroDDT} &middot; Data: {formatDate(ddt.info.dataDDT)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">ID Risorsa: {ddt.id}</p>
                        {qrCodeDataUrl && (
                        <div className="absolute top-4 right-4 p-1 bg-gray-900 rounded-md shadow-md">
                            <img src={qrCodeDataUrl} alt="QR Code" className="w-24 h-24" />
                        </div>
                        )}
                    </header>
                     <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 bg-gray-900 dark:bg-slate-800/50 rounded-lg border border-gray-800 dark:border-slate-700 mb-6">
                        <InfoItem label="Destinatario" value={ddt.info.destinatario} />
                        <InfoItem label="Vettore" value={ddt.info.vettore} />
                    </dl>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-900 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-400 dark:text-gray-300">Prodotto</th>
                                    <th className="px-4 py-3 font-semibold text-gray-400 dark:text-gray-300">Quantità</th>
                                    <th className="px-4 py-3 font-semibold text-gray-400 dark:text-gray-300">Lotto</th>
                                    <th className="px-4 py-3 font-semibold text-gray-400 dark:text-gray-300">Scadenza</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-gray-900 dark:bg-slate-800">
                                {ddt.prodotti.map((product, index) => {
                                    const formattedDate = formatDate(product.scadenza);
                                    const isLottoMissing = !product.lotto || product.lotto.trim() === '';
                                    const isScadenzaMissing = !formattedDate;

                                    return (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-gray-200 dark:text-gray-200 font-medium">{product.descrizione || <MissingValue />}</td>
                                            <td className="px-4 py-3 text-gray-400 dark:text-gray-400">{product.quantita || <MissingValue />}</td>
                                            <td className={`px-4 py-3 text-gray-400 dark:text-gray-400 ${isLottoMissing ? 'bg-black/75 dark:bg-red-900/20' : ''}`}>{isLottoMissing ? <MissingValue /> : product.lotto}</td>
                                            <td className={`px-4 py-3 text-gray-400 dark:text-gray-400 ${isScadenzaMissing ? 'bg-black/75 dark:bg-red-900/20' : ''}`}>{isScadenzaMissing ? <MissingValue /> : formattedDate}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-800 dark:border-slate-700 flex justify-end items-center gap-3 flex-shrink-0 bg-gray-900 dark:bg-slate-800">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-700 dark:border-slate-600 text-sm font-medium rounded-lg text-gray-300 dark:text-gray-200 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving || !qrCodeDataUrl} className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-lime-600 hover:bg-lime-700 disabled:bg-lime-400 flex items-center gap-2">
                        {isSaving ? <SpinnerIcon /> : <QrCodeIcon />}
                        Salva e Associa QR Code
                    </button>
                </footer>
            </div>
        </div>
    );
};



const SuppliersListPage: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [pdfToGenerate, setPdfToGenerate] = useState<{ product: EnhancedProduct, qrCodeDataUrl?: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const pdfGenRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'pdfs' | 'ddts' | 'catalogs' | 'priceLists'>('pdfs');
    const [resourceModal, setResourceModal] = useState<{ open: boolean; pdf: EnhancedProduct | null; supplier: Supplier | null }>({ open: false, pdf: null, supplier: null });
    const [ddtResourceModal, setDdtResourceModal] = useState<{ open: boolean; ddt: EnhancedDDT | null; supplier: Supplier | null }>({ open: false, ddt: null, supplier: null });


    const loadSuppliers = useCallback(() => {
        try {
            const suppliersData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
            const customers: Customer[] = JSON.parse(localStorage.getItem('celerya_customers') || '[]');
            const customerMap = new Map(customers.map(c => [c.slug, c.name]));

            const supplierList: Supplier[] = [];
            
            for(const customerSlug in suppliersData) {
                const customerName = customerMap.get(customerSlug) || customerSlug;
                const customerSuppliers = suppliersData[customerSlug].suppliers;

                for (const supplierSlug in customerSuppliers) {
                    const sData = customerSuppliers[supplierSlug];
                    supplierList.push({
                        slug: supplierSlug,
                        name: sData.name,
                        docCount: Object.keys(sData.pdfs || {}).length + Object.keys(sData.ddts || {}).length + Object.keys(sData.catalogs || {}).length + Object.keys(sData.priceLists || {}).length,
                        lastUpdate: sData.lastUpdate,
                        celeryaId: sData.celeryaId,
                        pdfs: sData.pdfs,
                        ddts: sData.ddts,
                        catalogs: sData.catalogs,
                        priceLists: sData.priceLists,
                        customerName: customerName,
                        customerSlug: customerSlug
                    });
                }
            }
            
            supplierList.sort((a,b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
            setSuppliers(supplierList);
        } catch (e) {
            console.error("Failed to load suppliers from localStorage", e);
        }
    }, []);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const pdfRenderData = useMemo(() => {
        if (!pdfToGenerate?.product) return null;
        const schema = getCustomSchema();
        const alerts = generateAlertsFromSchema(pdfToGenerate.product, schema);
        return { schema, alerts };
    }, [pdfToGenerate]);
    
    useEffect(() => {
        const generate = async () => {
            if (pdfToGenerate && pdfGenRef.current && pdfRenderData) {
                setIsGenerating(true);
                await new Promise(resolve => setTimeout(resolve, 500)); 
    
                const productCode = pdfToGenerate.product.identificazione.codiceProdotto;
                const issueDate = new Date(pdfToGenerate.product.identificazione.dataRedazione).toISOString().split('T')[0];
                const filename = `Standard Celerya - ${productCode} - ${issueDate}.pdf`;
    
                const canvas = await html2canvas(pdfGenRef.current, { scale: 2, useCORS: true, backgroundColor: '#f1f5f9' });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(filename);
    
                setPdfToGenerate(null);
                setIsGenerating(false);
            }
        }
        generate();
    }, [pdfToGenerate, pdfRenderData]);

    const handleSupplierClick = useCallback((supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setActiveTab('pdfs');
        setDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerOpen(false);
    }, []);
    
    const handleDownloadPdfClick = useCallback(async (pdfData: EnhancedProduct) => {
        let qrCodeDataUrlForPdf: string | undefined = undefined;
        if (pdfData.qrCodeUrl) {
            try {
                qrCodeDataUrlForPdf = await QRCode.toDataURL(pdfData.qrCodeUrl, { width: 96, margin: 1 });
            } catch (err) {
                console.error("Failed to generate QR for PDF download", err);
            }
        }
        setPdfToGenerate({ product: pdfData, qrCodeDataUrl: qrCodeDataUrlForPdf });
    }, []);
    
    const handleDownloadExcelClick = useCallback((product: Product) => {
        const wb = XLSX.utils.book_new();
        const ws_name = 'Scheda Tecnica';

        const data_aoa: any[][] = [];
        const merges: XLSX.Range[] = [];
        let currentRow = 0;

        const addRow = (rowData: any[] = []) => {
            data_aoa.push(rowData);
            currentRow++;
        };

        // --- Title ---
        addRow([`Scheda Tecnica Prodotto - Standard Celerya`]);
        merges.push({ s: { r: currentRow - 1, c: 0 }, e: { r: currentRow - 1, c: 1 } });
        addRow([product.descrizione?.denominazioneLegale || 'Prodotto non specificato']);
        merges.push({ s: { r: currentRow - 1, c: 0 }, e: { r: currentRow - 1, c: 1 } });
        addRow();

        const formatValueForExcel = (value: any, key: string): string => {
            if (value === undefined || value === null || value === '') {
                return 'N/D';
            }
            if (typeof value === 'boolean') {
                 return value ? 'Sì' : 'No';
            }
            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('scadenza')) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                }
            }
            if (Array.isArray(value)) {
                if (value.length === 0) return 'Nessuno';
                if (value.length > 0 && typeof value[0] === 'object' && value[0].hasOwnProperty('tipo') && value[0].hasOwnProperty('scadenza')) {
                    return value.map(cert => `${cert.tipo} (Scadenza: ${formatDate(cert.scadenza) ?? 'N/D'})`).join('\n');
                }
                return value.join(', ');
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return String(value);
        };

        // --- Loop through sections ---
        Object.entries(CELERYA_STANDARD).forEach(([sectionKey, sectionDef]) => {
            const sectionData = (product as any)[sectionKey];
            if (!sectionData) return;

            // Section Title
            addRow([sectionDef.title]);
            merges.push({ s: { r: currentRow - 1, c: 0 }, e: { r: currentRow - 1, c: 1 } });

            // Fields
            Object.entries(sectionDef.fields).forEach(([fieldKey, fieldDef]) => {
                if (sectionData.hasOwnProperty(fieldKey)) {
                    let label = fieldDef.label;
                    if (label.toLowerCase().startsWith('di cui')) {
                        label = `  ${label}`;
                    }
                    const value = formatValueForExcel(sectionData[fieldKey], fieldKey);
                    addRow([label, value]);
                }
            });

            addRow(); // Spacer
        });

        const ws = XLSX.utils.aoa_to_sheet(data_aoa);
        ws['!merges'] = merges;
        ws['!cols'] = [{ wch: 35 }, { wch: 65 }];
        
        const ws_merges = ws['!merges'] || [];
        data_aoa.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellRef = XLSX.utils.encode_cell({r:r, c:c});
                 if (!ws[cellRef]) return; // Skip if cell doesn't exist
                 
                 ws[cellRef].s = ws[cellRef].s || {};
                 ws[cellRef].t = 's'; // Set cell type to string
                 ws[cellRef].v = String(cell); // Ensure value is string

                 // Style Section Headers
                const isSectionHeader = ws_merges.some(m => m.s.r === r && m.s.c === c);
                if (isSectionHeader && row.length === 1) {
                    ws[cellRef].s.font = { bold: true, sz: 14 };
                    ws[cellRef].s.fill = { fgColor: { rgb: "FFD9EAD3" } }; // Light green
                }
            });
        });

        XLSX.utils.book_append_sheet(wb, ws, ws_name);

        const productCode = product.identificazione?.codiceProdotto || 'Prodotto';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Standard Celerya ST - ${productCode.replace(/[\/\\]/g, '_')} - ${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
    }, []);

    const handleDownloadDDTExcel = useCallback((ddtData: AnalyzedTransportDocument) => {
        generateDDTExcel(ddtData);
    }, []);

    const handleDownloadCatalogExcel = useCallback((catalog: AnalyzedCatalog) => {
        const wb = XLSX.utils.book_new();
        const ws_name = 'Catalogo Prodotti';
        const productsData = catalog.prodotti.map(p => ({
            'Codice Articolo': p.codiceArticolo,
            'Descrizione': p.descrizione,
            'Prezzo': p.prezzo,
            'Unità di Misura': p.unitaMisura,
        }));
        const ws = XLSX.utils.json_to_sheet(productsData, { header: ['Codice Articolo', 'Descrizione', 'Prezzo', 'Unità di Misura'] });
        ws['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        const filename = `Catalogo - ${catalog.nomeCatalogo.replace(/[\/\\]/g, '_')} - ${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    }, []);

    const handleDownloadPriceListExcel = useCallback((priceList: AnalyzedPriceList) => {
        const wb = XLSX.utils.book_new();
        const ws_name = 'Listino Prezzi';
        const itemsData = priceList.items.map(i => ({
            'Codice Articolo': i.codiceArticolo,
            'Descrizione': i.descrizione,
            'Prezzo Netto': i.prezzoNetto,
            'Valuta': i.valuta,
        }));
        const ws = XLSX.utils.json_to_sheet(itemsData, { header: ['Codice Articolo', 'Descrizione', 'Prezzo Netto', 'Valuta'] });
        ws['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        const filename = `Listino - ${priceList.nomeListino.replace(/[\/\\]/g, '_')} - ${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    }, []);

    const handleCreateResourceClick = (pdf: EnhancedProduct, supplier: Supplier) => {
        setResourceModal({ open: true, pdf, supplier });
    };

    const handleCreateDDTResourceClick = (ddt: EnhancedDDT, supplier: Supplier) => {
        setDdtResourceModal({ open: true, ddt, supplier });
    };

    const handleSaveResource = (customerSlug: string, supplierSlug: string, pdfId: string, qrCodeUrl: string) => {
        const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
        if (allData[customerSlug]?.suppliers?.[supplierSlug]?.pdfs?.[pdfId]) {
            allData[customerSlug].suppliers[supplierSlug].pdfs[pdfId].qrCodeUrl = qrCodeUrl;
            localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            loadSuppliers();
            
            const updatedSupplierData = allData[customerSlug].suppliers[supplierSlug];
            setSelectedSupplier(s => s ? {
                ...s, 
                ...updatedSupplierData
            } : null);
        }
        setResourceModal({ open: false, pdf: null, supplier: null });
    };

    const handleSaveDDTResource = (customerSlug: string, supplierSlug: string, ddtId: string, qrCodeUrl: string) => {
        const allData: AllSuppliersData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');
        if (allData[customerSlug]?.suppliers?.[supplierSlug]?.ddts?.[ddtId]) {
            allData[customerSlug].suppliers[supplierSlug].ddts![ddtId].qrCodeUrl = qrCodeUrl;
            localStorage.setItem('celerya_suppliers_data', JSON.stringify(allData));
            loadSuppliers();
            
            const updatedSupplierData = allData[customerSlug].suppliers[supplierSlug];
             setSelectedSupplier(s => s ? {
                ...s, 
                ...updatedSupplierData
            } : null);
        }
        setDdtResourceModal({ open: false, ddt: null, supplier: null });
    };

    const sortedPdfs = useMemo(() => {
        if (!selectedSupplier || !selectedSupplier.pdfs) return [];
        return Object.values(selectedSupplier.pdfs).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }, [selectedSupplier]);

    const sortedDdts = useMemo(() => {
        if (!selectedSupplier || !selectedSupplier.ddts) return [];
        return Object.values(selectedSupplier.ddts).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }, [selectedSupplier]);

    const sortedCatalogs = useMemo(() => {
        if (!selectedSupplier || !selectedSupplier.catalogs) return [];
        return Object.values(selectedSupplier.catalogs).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }, [selectedSupplier]);

    const sortedPriceLists = useMemo(() => {
        if (!selectedSupplier || !selectedSupplier.priceLists) return [];
        return Object.values(selectedSupplier.priceLists).sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    }, [selectedSupplier]);

    const pdfsCount = sortedPdfs.length;
    const ddtsCount = sortedDdts.length;
    const catalogsCount = sortedCatalogs.length;
    const priceListsCount = sortedPriceLists.length;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-200 dark:text-gray-100 mb-6">Lista Fornitori</h1>

            <div className="bg-gray-900 dark:bg-slate-800 rounded-lg shadow-sm border border-gray-800 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-black dark:bg-slate-700/50 border-b border-gray-800 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produttore</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documenti</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ultimo Aggiornamento</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {suppliers.length > 0 ? suppliers.map(supplier => (
                            <tr key={`${supplier.customerSlug}-${supplier.slug}`} className="hover:bg-black dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleSupplierClick(supplier)} className="text-gray-200 dark:text-gray-200 font-medium hover:text-lime-600 dark:hover:text-lime-400 hover:underline text-left">
                                        {supplier.name}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-400 dark:text-gray-300 font-medium">{supplier.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-400 dark:text-gray-300">{supplier.docCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-400 dark:text-gray-300">{new Date(supplier.lastUpdate).toLocaleString('it-IT')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={() => handleSupplierClick(supplier)}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-700 dark:border-slate-600 text-xs font-medium rounded-md text-gray-300 dark:text-gray-200 bg-gray-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 transition-colors"
                                    >
                                        Gestisci Documenti
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">Nessun fornitore trovato. Inizia estraendo una scheda tecnica.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer Overlay */}
            <div className={`fixed inset-0 bg-black/40 dark:bg-black/60 z-30 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleCloseDrawer}/>

            {/* Drawer Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-gray-900 dark:bg-slate-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedSupplier && (
                    <div className="flex flex-col h-full">
                        <header className="p-4 border-b border-gray-800 dark:border-slate-700 flex justify-between items-start bg-black dark:bg-slate-800">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-200 dark:text-gray-100">Documenti per {selectedSupplier.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cliente: {selectedSupplier.customerName} &middot; {selectedSupplier.docCount} documenti</p>
                            </div>
                            <button onClick={handleCloseDrawer} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-gray-200 transition-colors"><XIcon className="w-6 h-6" /></button>
                        </header>
                        
                        <div className="border-b border-gray-800 dark:border-slate-700">
                            <nav className="-mb-px flex space-x-4 px-4 overflow-x-auto">
                                <button onClick={() => setActiveTab('pdfs')} className={`flex-shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'pdfs' ? 'border-lime-500 text-lime-600 dark:text-lime-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-200 hover:border-gray-700 dark:hover:border-slate-600' }`}>Schede Tecniche ({pdfsCount})</button>
                                <button onClick={() => setActiveTab('ddts')} className={`flex-shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'ddts' ? 'border-lime-500 text-lime-600 dark:text-lime-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-200 hover:border-gray-700 dark:hover:border-slate-600' }`}>Doc. Trasporto ({ddtsCount})</button>
                                <button onClick={() => setActiveTab('catalogs')} className={`flex-shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'catalogs' ? 'border-lime-500 text-lime-600 dark:text-lime-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-200 hover:border-gray-700 dark:hover:border-slate-600' }`}>Cataloghi ({catalogsCount})</button>
                                <button onClick={() => setActiveTab('priceLists')} className={`flex-shrink-0 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${ activeTab === 'priceLists' ? 'border-lime-500 text-lime-600 dark:text-lime-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-200 hover:border-gray-700 dark:hover:border-slate-600' }`}>Listini ({priceListsCount})</button>
                            </nav>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-black dark:bg-slate-900">
                            {activeTab === 'pdfs' && (
                                <ul className="space-y-3">
                                    {sortedPdfs.length > 0 ? sortedPdfs.map(pdf => {
                                        const issueDate = new Date(pdf.identificazione.dataRedazione).toLocaleDateString('it-IT');
                                        return (
                                            <li key={pdf.id} className="p-3 bg-gray-900 dark:bg-slate-800 border border-gray-800 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-gray-200 dark:text-gray-200">{pdf.identificazione.denominazioneScheda}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Codice: {pdf.identificazione.codiceProdotto} &middot; Redazione: {issueDate}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID Risorsa: <span className="font-mono bg-gray-900 dark:bg-slate-700 px-1 py-0.5 rounded">{pdf.id}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                    {pdf.qrCodeUrl ? (
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold bg-black dark:bg-black0/10 py-1 px-2 rounded-full">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            <span>Risorsa Creata</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCreateResourceClick(pdf, selectedSupplier)} 
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                                                            title="Crea Risorsa QR"
                                                        >
                                                            <QrCodeIcon className="w-4 h-4" /> Crea Risorsa
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDownloadExcelClick(pdf)} className="flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-200/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" title="Scarica Excel"><ExcelIcon /></button>
                                                    <button onClick={() => handleDownloadPdfClick(pdf)} disabled={isGenerating && pdfToGenerate?.product.id === pdf.id} className="flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-slate-400 bg-gray-900 dark:bg-slate-200/20 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:bg-slate-400 disabled:cursor-wait" title="Scarica PDF">
                                                        {isGenerating && pdfToGenerate?.product.id === pdf.id ? <SpinnerIcon className="text-white"/> : <DownloadIcon />}
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    }) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nessuna scheda tecnica trovata.</p>}
                                </ul>
                            )}
                             {activeTab === 'ddts' && (
                                <ul className="space-y-3">
                                    {sortedDdts.length > 0 ? sortedDdts.map(ddt => {
                                        const ddtDate = formatDate(ddt.info.dataDDT);
                                        return (
                                            <li key={ddt.id} className="p-3 bg-gray-900 dark:bg-slate-800 border border-gray-800 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-gray-200 dark:text-gray-200">DDT: {ddt.info.numeroDDT || 'N/D'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Data: {ddtDate} &middot; Dest: {ddt.info.destinatario}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID Risorsa: <span className="font-mono bg-gray-900 dark:bg-slate-700 px-1 py-0.5 rounded">{ddt.id}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                    {ddt.qrCodeUrl ? (
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold bg-black dark:bg-black0/10 py-1 px-2 rounded-full">
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                            <span>Risorsa Creata</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCreateDDTResourceClick(ddt, selectedSupplier)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                                                            title="Crea Risorsa QR per DDT"
                                                        >
                                                            <QrCodeIcon className="w-4 h-4" /> Crea Risorsa
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDownloadDDTExcel(ddt)} className="flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-200/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" title="Scarica Excel"><ExcelIcon /></button>
                                                </div>
                                            </li>
                                        );
                                    }) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nessun documento di trasporto trovato.</p>}
                                </ul>
                            )}
                            {activeTab === 'catalogs' && (
                                <ul className="space-y-3">
                                    {sortedCatalogs.length > 0 ? sortedCatalogs.map(catalog => (
                                        <li key={catalog.id} className="p-3 bg-gray-900 dark:bg-slate-800 border border-gray-800 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
                                            <div className="flex-grow flex items-center gap-3">
                                                <CatalogIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-200 dark:text-gray-200">{catalog.nomeCatalogo}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analizzato il: {new Date(catalog.savedAt).toLocaleDateString('it-IT')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                <button onClick={() => handleDownloadCatalogExcel(catalog)} className="flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-200/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" title="Scarica Excel"><ExcelIcon /></button>
                                            </div>
                                        </li>
                                    )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nessun catalogo trovato.</p>}
                                </ul>
                            )}
                            {activeTab === 'priceLists' && (
                                <ul className="space-y-3">
                                    {sortedPriceLists.length > 0 ? sortedPriceLists.map(priceList => (
                                        <li key={priceList.id} className="p-3 bg-gray-900 dark:bg-slate-800 border border-gray-800 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3">
                                            <div className="flex-grow flex items-center gap-3">
                                                <PriceListIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-200 dark:text-gray-200">{priceList.nomeListino}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Valido dal: {formatDate(priceList.dataValidita) || 'N/D'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                                <button onClick={() => handleDownloadPriceListExcel(priceList)} className="flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-200/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-200/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" title="Scarica Excel"><ExcelIcon /></button>
                                            </div>
                                        </li>
                                    )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nessun listino prezzi trovato.</p>}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {resourceModal.open && resourceModal.pdf && resourceModal.supplier && (
                <ResourceCreationModal 
                    pdf={resourceModal.pdf}
                    supplier={resourceModal.supplier}
                    onClose={() => setResourceModal({ open: false, pdf: null, supplier: null })}
                    onSave={handleSaveResource}
                />
            )}

            {ddtResourceModal.open && ddtResourceModal.ddt && ddtResourceModal.supplier && (
                <DDTResourceCreationModal 
                    ddt={ddtResourceModal.ddt}
                    supplier={ddtResourceModal.supplier}
                    onClose={() => setDdtResourceModal({ open: false, ddt: null, supplier: null })}
                    onSave={handleSaveDDTResource}
                />
            )}

            {pdfToGenerate && pdfRenderData && (
                 <div className="fixed left-[-9999px] top-0 p-4 w-[8.5in]">
                    <PdfContent 
                        data={pdfToGenerate.product} 
                        alerts={pdfRenderData.alerts}
                        schema={pdfRenderData.schema} 
                        ref={pdfGenRef} 
                        qrCodeDataUrl={pdfToGenerate.qrCodeDataUrl}
                    />
                </div>
            )}
        </div>
    );
};

export default SuppliersListPage;
