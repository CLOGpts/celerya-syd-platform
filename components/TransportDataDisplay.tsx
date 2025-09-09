
import React from 'react';
import type { AnalyzedTransportDocument } from '../types';
import * as XLSX from 'xlsx';
import { ExcelIcon } from './icons/ExcelIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';


interface TransportDataDisplayProps {
  data: AnalyzedTransportDocument;
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

const MissingValue: React.FC = () => (
    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-bold rounded-full">MANCANTE</span>
);

const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleDateString('it-IT');
}

const TransportDataDisplay: React.FC<TransportDataDisplayProps> = ({ data, onAnalyzeAnother, customerName, onBack }) => {
    const handleDownloadExcel = () => {
        // 1. Prepare Info Sheet
        const infoData = [
            { Campo: 'Mittente', Valore: data.info.mittente || 'N/D' },
            { Campo: 'Destinatario', Valore: data.info.destinatario || 'N/D' },
            { Campo: 'Numero DDT', Valore: data.info.numeroDDT || 'N/D' },
            { Campo: 'Data DDT', Valore: formatDate(data.info.dataDDT) ?? data.info.dataDDT ?? 'N/D' },
            { Campo: 'Vettore', Valore: data.info.vettore || 'N/D' },
        ];
        const infoSheet = XLSX.utils.json_to_sheet(infoData);
        infoSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];

        // 2. Prepare Products Sheet
        const productsData = data.prodotti.map(product => ({
            'Prodotto': product.descrizione || 'MANCANTE',
            'Quantità': product.quantita || 'MANCANTE',
            'Lotto': product.lotto || 'MANCANTE',
            'Scadenza': formatDate(product.scadenza) || 'MANCANTE'
        }));
        const productsSheet = XLSX.utils.json_to_sheet(productsData);
        productsSheet['!cols'] = [{ wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];

        // 3. Create and download workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, infoSheet, 'Informazioni DDT');
        XLSX.utils.book_append_sheet(wb, productsSheet, 'Elenco Prodotti');
        
        const ddtNumber = data.info.numeroDDT || 'DDT';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Standard Celerya - ${ddtNumber.replace(/[\/\\]/g, '_')} - ${timestamp}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm h-full flex flex-col col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 transition-colors" aria-label="Torna alla dashboard del cliente"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Risultati Analisi DDT</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Documento per <span className="font-semibold">{customerName}</span> analizzato.</p>
                    </div>
                </div>
                 <button onClick={onAnalyzeAnother} className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">Analizza un altro</button>
            </div>


            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
                <InfoItem label="Mittente" value={data.info.mittente} />
                <InfoItem label="Destinatario" value={data.info.destinatario} />
                <InfoItem label="Numero DDT" value={data.info.numeroDDT} />
                <InfoItem label="Data DDT" value={formatDate(data.info.dataDDT) ?? data.info.dataDDT} />
                <div className="col-span-2">
                 <InfoItem label="Vettore" value={data.info.vettore} />
                </div>
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
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Prodotto</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Quantità</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Lotto</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Scadenza</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {data.prodotti.map((product, index) => {
                            const formattedDate = formatDate(product.scadenza);
                            const isLottoMissing = !product.lotto || product.lotto.trim() === '';
                            const isScadenzaMissing = !formattedDate;

                            return (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{product.descrizione || <MissingValue />}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.quantita || <MissingValue />}</td>
                                    <td className={`px-4 py-3 text-gray-600 dark:text-gray-400 ${isLottoMissing ? 'bg-red-50/75 dark:bg-red-900/20' : ''}`}>
                                        {isLottoMissing ? <MissingValue /> : product.lotto}
                                    </td>
                                    <td className={`px-4 py-3 text-gray-600 dark:text-gray-400 ${isScadenzaMissing ? 'bg-red-50/75 dark:bg-red-900/20' : ''}`}>
                                        {isScadenzaMissing ? <MissingValue /> : formattedDate}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransportDataDisplay;
