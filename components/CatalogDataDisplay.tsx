
import React from 'react';
import type { AnalyzedCatalog } from '../types';
import * as XLSX from 'xlsx';
import { ExcelIcon } from './icons/ExcelIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface CatalogDataDisplayProps {
  data: AnalyzedCatalog;
  onAnalyzeAnother: () => void;
  customerName: string;
  onBack: () => void;
}

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-semibold">{value || 'N/D'}</dd>
    </div>
);

const CatalogDataDisplay: React.FC<CatalogDataDisplayProps> = ({ data, onAnalyzeAnother, customerName, onBack }) => {
    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws_name = 'Catalogo Prodotti';
        const productsData = data.prodotti.map(p => ({
            'Codice Articolo': p.codiceArticolo,
            'Descrizione': p.descrizione,
            'Prezzo': p.prezzo,
            'Unità di Misura': p.unitaMisura,
        }));
        const ws = XLSX.utils.json_to_sheet(productsData, { header: ['Codice Articolo', 'Descrizione', 'Prezzo', 'Unità di Misura'] });
        ws['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        const filename = `Catalogo - ${data.nomeCatalogo.replace(/[\/\\]/g, '_')} - ${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm h-full flex flex-col col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 transition-colors" aria-label="Torna alla dashboard del cliente"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Risultati Analisi Catalogo</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Documento per <span className="font-semibold">{customerName}</span> analizzato.</p>
                    </div>
                </div>
                <button onClick={onAnalyzeAnother} className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">Analizza un altro</button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
                <InfoItem label="Nome Fornitore" value={data.nomeFornitore} />
                <InfoItem label="Nome Catalogo" value={data.nomeCatalogo} />
            </dl>

            <div className="flex justify-end mb-4">
                <button
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 transition-all whitespace-nowrap"
                >
                    <ExcelIcon className="w-4 h-4 text-green-700 dark:text-green-500" />
                    <span>Esporta Excel</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto -mx-6 px-6">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Codice Articolo</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Descrizione</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Prezzo</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Unità</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {data.prodotti.map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">{product.codiceArticolo}</td>
                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{product.descrizione}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.prezzo?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.unitaMisura}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CatalogDataDisplay;
