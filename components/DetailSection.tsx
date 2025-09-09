
import React from 'react';
import { AlertIcon } from './icons/AlertIcon';
import type { Alert } from '../types';

interface DetailSectionProps {
    title: string;
    data: { key: string; label: string; value: any; }[];
    alerts: Alert[];
    sectionKey: string;
}

const parseMarkdownBold = (text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <strong key={index}>{part}</strong>;
        }
        return part;
    });
};

const DetailSection: React.FC<DetailSectionProps> = ({ title, data, alerts, sectionKey }) => {
    if (!data) return null;

    const importantLabels = new Set(['Ingredienti', 'Allergeni', 'Contaminazione crociata']);

    return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200/80 dark:border-slate-700/80 shadow-sm break-inside-avoid">
        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">{title}</h4>
        <dl className="space-y-4">
            {data.map(({ key, label, value }) => {
                const displayKey = label;
                const isIndented = displayKey.toLowerCase().startsWith('di cui');
                const isImportant = importantLabels.has(label);
                let displayValue: React.ReactNode = value;
                
                const fieldAlert = alerts.find(a => a.field === `${sectionKey}.${key}`);

                if (value === null || value === undefined || value === '') {
                    displayValue = <span className="text-gray-400 dark:text-gray-500 italic">N/D</span>;
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        displayValue = <span className="text-gray-500 italic">Nessuno</span>;
                    } else {
                        displayValue = (
                            <ul className="list-disc list-inside space-y-1">
                                {value.map((item, index) => 
                                    <li key={index}>
                                        {(typeof item === 'object' && item.tipo && item.scadenza) 
                                            ? `${item.tipo} (scade il: ${new Date(item.scadenza).toLocaleDateString('it-IT')})` 
                                            : String(item)}
                                    </li>
                                )}
                            </ul>
                        );
                    }
                } else if (typeof value === 'boolean') {
                    displayValue = value ? 'Sì' : 'No';
                } else if (typeof value === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('scadenza'))) {
                     try {
                        const date = new Date(value);
                        if(!isNaN(date.getTime())) {
                            displayValue = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                        } else {
                            displayValue = String(value);
                        }
                     } catch(e) {
                        displayValue = String(value);
                     }
                } else if (isImportant && typeof value === 'string') {
                    displayValue = parseMarkdownBold(value);
                } else {
                    displayValue = String(value);
                }
                
                return (
                    <div key={key} className={isIndented ? 'ml-6' : ''}>
                        <dt className={`text-sm flex items-center gap-2 ${isImportant ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
                            {fieldAlert && (
                                <span title={fieldAlert.message}>
                                    <AlertIcon className={`w-4 h-4 ${fieldAlert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                                </span>
                            )}
                            {displayKey}
                        </dt>
                        <dd className="text-sm text-gray-800 dark:text-gray-300 mt-1 ml-1 whitespace-pre-wrap">{displayValue}</dd>
                    </div>
                );
            })}
        </dl>
    </div>
)};

export default DetailSection;
