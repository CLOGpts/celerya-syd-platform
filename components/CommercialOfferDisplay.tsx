
import React, { useRef } from 'react';
import type { CommercialOffer } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CopyIcon } from './icons/CopyIcon';
import { PdfIcon } from './icons/PdfIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

const CommercialOfferDisplay: React.FC<{ offer: CommercialOffer }> = ({ offer }) => {
    const offerRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isCopied, setIsCopied] = React.useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const handleDownloadPdf = async () => {
        if (!offerRef.current) return;
        setIsDownloading(true);

        const canvas = await html2canvas(offerRef.current, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        // Use A4 dimensions in points (px is approx 0.75 of a point)
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;

        let finalWidth = pdfWidth - 20; // with margin
        let finalHeight = finalWidth / ratio;
        
        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight - 20;
            finalWidth = finalHeight * ratio;
        }

        const x = (pdfWidth - finalWidth) / 2;
        const y = 10;
        
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(`Offerta-${offer.offerNumber}.pdf`);

        setIsDownloading(false);
    };

    const handleCopyText = () => {
        const textLines = [
            `Offerta Commerciale`,
            `Numero Offerta: ${offer.offerNumber}`,
            `Data: ${formatDate(offer.date)}`,
            `Cliente: ${offer.customerName}`,
            `Da: ${offer.supplierName}`,
            `\n--- DETTAGLI ---`,
            ...offer.items.map(item => 
                `- ${item.description} | Q.tà: ${item.quantity} | Prezzo Unit.: ${formatCurrency(item.unitPrice)} | Totale: ${formatCurrency(item.total)}`
            ),
            `\n--- RIEPILOGO ---`,
            `Subtotale: ${formatCurrency(offer.subtotal)}`,
            `IVA (22%): ${formatCurrency(offer.tax)}`,
            `TOTALE: ${formatCurrency(offer.grandTotal)}`,
            offer.notes ? `\nNote: ${offer.notes}` : ''
        ];
        
        navigator.clipboard.writeText(textLines.join('\n'));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="max-w-2xl w-full mt-2">
            <div ref={offerRef} className="bg-white dark:bg-slate-800 p-6 rounded-t-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                <header className="flex justify-between items-start pb-4 border-b dark:border-slate-600">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Offerta Commerciale</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Da: {offer.supplierName}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Offerta #: {offer.offerNumber}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Data: {formatDate(offer.date)}</p>
                    </div>
                </header>
                <div className="mt-4">
                    <p className="font-semibold text-gray-700 dark:text-gray-200">Cliente:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{offer.customerName}</p>
                </div>
                <div className="mt-6 flow-root">
                    <div className="-mx-6">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr className="text-left text-gray-600 dark:text-gray-300 font-semibold">
                                    <th className="py-2 px-6">Descrizione</th>
                                    <th className="py-2 px-6 text-center">Q.tà</th>
                                    <th className="py-2 px-6 text-right">Prezzo Unit.</th>
                                    <th className="py-2 px-6 text-right">Totale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                {offer.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-3 px-6 text-gray-800 dark:text-gray-200">{item.description}</td>
                                        <td className="py-3 px-6 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                        <td className="py-3 px-6 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-3 px-6 text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Subtotale:</span>
                            <span>{formatCurrency(offer.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>IVA (22%):</span>
                            <span>{formatCurrency(offer.tax)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 text-base pt-2 border-t dark:border-slate-600">
                            <span>Totale:</span>
                            <span>{formatCurrency(offer.grandTotal)}</span>
                        </div>
                    </div>
                </div>
                 {offer.notes && (
                    <div className="mt-6 border-t dark:border-slate-600 pt-4">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Note:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{offer.notes}</p>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-700/50 rounded-b-lg border-x border-b border-gray-200 dark:border-slate-700">
                <button onClick={handleCopyText} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors w-full justify-center">
                    <CopyIcon className="w-3.5 h-3.5" /> {isCopied ? 'Copiato!' : 'Copia Testo'}
                </button>
                <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors w-full justify-center disabled:opacity-70">
                    {isDownloading ? <SpinnerIcon className="w-3.5 h-3.5" /> : <PdfIcon className="w-3.5 h-3.5" />}
                    {isDownloading ? 'Download...' : 'Scarica PDF'}
                </button>
            </div>
        </div>
    );
};

export default CommercialOfferDisplay;
