import React, { useState, useEffect } from 'react';

interface ExtractedTableData {
    pageNumber: number;
    pageName?: string;
    tables: string[][][];
}

declare global {
    interface Window {
        pdfjsLib: any;
        XLSX: any;
        mammoth: any;
        GoogleGenAI?: any;
    }
}

const PdfToExcel: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [statusType, setStatusType] = useState<'info' | 'error' | 'warning' | 'success'>('info');
    const [extractedTables, setExtractedTables] = useState<ExtractedTableData[]>([]);
    const [globalFilterInfo, setGlobalFilterInfo] = useState<{
        pageNumber: number;
        tableIndex: number;
        columnCount: number;
        selections: boolean[];
    } | null>(null);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);

    const API_KEY = apiKey || process.env.REACT_APP_GOOGLE_API_KEY || '';
    const MAX_AI_REQUESTS_PER_MINUTE = 60;
    const AI_REQUEST_WINDOW_MS = 60 * 1000;
    let apiCallTimestamps: number[] = [];

    useEffect(() => {
        loadExternalScripts();
        loadGoogleGenAI();
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        } else {
            setShowApiKeyInput(true);
        }
    }, []);

    const loadGoogleGenAI = async () => {
        try {
            const module = await import('@google/genai');
            window.GoogleGenAI = module.GoogleGenAI;
        } catch (error) {
            console.error('Errore caricamento Google GenAI:', error);
        }
    };

    const loadExternalScripts = () => {
        const scripts = [
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', global: 'pdfjsLib' },
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', global: 'XLSX' },
            { src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', global: 'mammoth' }
        ];

        let loadedCount = 0;
        scripts.forEach(({ src, global }) => {
            if ((window as any)[global]) {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    setScriptsLoaded(true);
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }
                }
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                loadedCount++;
                if (loadedCount === scripts.length) {
                    setScriptsLoaded(true);
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }
                }
            };
            document.head.appendChild(script);
        });
    };

    const updateStatus = (message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') => {
        setStatus(message);
        setStatusType(type);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setExtractedTables([]);
            setGlobalFilterInfo(null);
            updateStatus(`File selezionato: ${selectedFile.name}`, 'info');
        }
    };

    const handleApiKeySave = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setShowApiKeyInput(false);
            updateStatus('API Key salvata con successo', 'success');
        }
    };

    const ensureApiRateLimit = async () => {
        let now = Date.now();
        apiCallTimestamps = apiCallTimestamps.filter(timestamp => now - timestamp < AI_REQUEST_WINDOW_MS);

        if (apiCallTimestamps.length >= MAX_AI_REQUESTS_PER_MINUTE) {
            const oldestCallInWindowTimestamp = apiCallTimestamps[0];
            const timeToWait = (oldestCallInWindowTimestamp + AI_REQUEST_WINDOW_MS) - now;

            if (timeToWait > 0) {
                const waitSeconds = (timeToWait / 1000).toFixed(1);
                updateStatus(`Rate limiting: attendo ${waitSeconds}s...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, timeToWait));
                now = Date.now();
                apiCallTimestamps = apiCallTimestamps.filter(timestamp => now - timestamp < AI_REQUEST_WINDOW_MS);
            }
        }
        apiCallTimestamps.push(now);
        apiCallTimestamps.sort((a, b) => a - b);
    };

    const extractTablesFromImage = async (base64ImageData: string, pageNum: number): Promise<string[][][]> => {
        if (!API_KEY) {
            throw new Error('API Key non configurata');
        }

        if (!window.GoogleGenAI) {
            throw new Error('Google GenAI non caricato');
        }

        const ai = new window.GoogleGenAI({ apiKey: API_KEY });
        await ensureApiRateLimit();

        const imagePart = { inlineData: { mimeType: 'image/png', data: base64ImageData } };
        const textPart = {
            text: `You are an expert table extraction system. Analyze the provided image of a document page.
Identify all distinct tables present. For each table found, extract its data.
Return the result as a JSON object. This JSON object MUST have a key 'tables_on_page'.
The value of 'tables_on_page' should be an array, where each element represents one table.
Each table itself should be an array of arrays, with inner arrays representing rows and their cell values (strings).
Example: {"tables_on_page": [ [ ["Header1", "Header2"], ["Row1Cell1", "Row1Cell2"] ] ]}
If no tables are found, return {"tables_on_page": []}.
IMPORTANT: The response should consist ONLY of this single JSON object.`
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: { parts: [textPart, imagePart] },
                config: { responseMimeType: "application/json" }
            });

            const responseText = response.text.trim();
            const parsedData = JSON.parse(responseText);

            if (parsedData?.tables_on_page && Array.isArray(parsedData.tables_on_page)) {
                return parsedData.tables_on_page;
            }
            return [];
        } catch (error) {
            console.error(`Errore estrazione tabelle da pagina ${pageNum}:`, error);
            updateStatus(`Errore AI pagina ${pageNum}: ${error}`, 'error');
            return [];
        }
    };

    const processPdfFile = async (file: File) => {
        updateStatus('Caricamento PDF...', 'info');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDocument = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdfDocument.numPages;

        updateStatus(`PDF caricato: ${numPages} pagine. Elaborazione...`, 'info');
        const results: ExtractedTableData[] = [];

        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
            updateStatus(`Elaborazione pagina ${pageNumber}/${numPages}...`, 'info');

            try {
                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) {
                    console.warn(`Pagina ${pageNumber} saltata: no canvas context`);
                    continue;
                }

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                const imageDataUrl = canvas.toDataURL('image/png');
                const base64ImageData = imageDataUrl.split(',')[1];

                const tablesOnPage = await extractTablesFromImage(base64ImageData, pageNumber);
                if (tablesOnPage && tablesOnPage.length > 0) {
                    results.push({ pageNumber, tables: tablesOnPage });
                }
            } catch (error) {
                console.error(`Errore pagina ${pageNumber}:`, error);
            }
        }

        return results;
    };

    const processImageFile = async (file: File): Promise<ExtractedTableData[]> => {
        updateStatus('Elaborazione immagine...', 'info');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imageDataUrl = e.target?.result as string;
                    const base64ImageData = imageDataUrl.split(',')[1];
                    const tables = await extractTablesFromImage(base64ImageData, 1);
                    resolve(tables.length > 0 ? [{ pageNumber: 1, tables, pageName: 'Immagine' }] : []);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processExcelFile = async (file: File): Promise<ExtractedTableData[]> => {
        updateStatus('Elaborazione Excel...', 'info');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const results: ExtractedTableData[] = [];

                    workbook.SheetNames.forEach((sheetName: string, index: number) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                        const stringTableData: string[][] = jsonData.map((row: any[]) =>
                            row.map((cell: any) => String(cell === null || cell === undefined ? "" : cell))
                        );

                        if (stringTableData.length > 0) {
                            results.push({
                                pageNumber: index + 1,
                                pageName: sheetName,
                                tables: [stringTableData]
                            });
                        }
                    });
                    resolve(results);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const processCsvFile = async (file: File): Promise<ExtractedTableData[]> => {
        updateStatus('Elaborazione CSV...', 'info');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const workbook = window.XLSX.read(text, { type: 'string', raw: true });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                    const stringTableData: string[][] = jsonData.map((row: any[]) =>
                        row.map((cell: any) => String(cell === null || cell === undefined ? "" : cell))
                    );

                    resolve(stringTableData.length > 0 ?
                        [{ pageNumber: 1, tables: [stringTableData], pageName: 'CSV Data' }] : []);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const handleProcessFile = async () => {
        if (!file || !scriptsLoaded) return;

        if (!API_KEY) {
            updateStatus('Configura prima la API Key di Google Gemini', 'error');
            setShowApiKeyInput(true);
            return;
        }

        setLoading(true);
        setExtractedTables([]);
        const startTime = performance.now();

        try {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            let results: ExtractedTableData[] = [];

            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                results = await processPdfFile(file);
            } else if (fileType.startsWith('image/')) {
                results = await processImageFile(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                results = await processExcelFile(file);
            } else if (fileName.endsWith('.csv')) {
                results = await processCsvFile(file);
            } else {
                throw new Error('Formato file non supportato');
            }

            setExtractedTables(results);
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);

            if (results.some(page => page.tables.length > 0)) {
                updateStatus(`Elaborazione completata in ${duration}s. ${results.length} pagine con tabelle trovate.`, 'success');
            } else {
                updateStatus(`Elaborazione completata in ${duration}s. Nessuna tabella trovata.`, 'warning');
            }
        } catch (error) {
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            console.error('Errore elaborazione:', error);
            updateStatus(`Errore dopo ${duration}s: ${error}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = () => {
        if (extractedTables.length === 0) {
            updateStatus('Nessuna tabella da scaricare', 'warning');
            return;
        }

        updateStatus('Generazione file Excel...', 'info');
        try {
            const workbook = window.XLSX.utils.book_new();

            extractedTables.forEach(pageData => {
                if (pageData.tables.length === 0) return;

                let sheetData: string[][] = [];

                pageData.tables.forEach((table, tableIdx) => {
                    if (tableIdx > 0 && sheetData.length > 0) {
                        sheetData.push([]);
                    }
                    sheetData.push([`Tabella ${tableIdx + 1}`]);
                    sheetData.push(...table);
                });

                if (sheetData.length > 0) {
                    const worksheet = window.XLSX.utils.aoa_to_sheet(sheetData);
                    const sheetName = pageData.pageName || `Pagina_${pageData.pageNumber}`;
                    window.XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
                }
            });

            window.XLSX.writeFile(workbook, `tabelle_estratte_${Date.now()}.xlsx`);
            updateStatus('Excel generato e scaricato con successo', 'success');
        } catch (error) {
            console.error('Errore generazione Excel:', error);
            updateStatus(`Errore generazione Excel: ${error}`, 'error');
        }
    };

    return (
        <div className="w-full">
            {showApiKeyInput && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        🔑 Configurazione API Key Google Gemini
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                        Per utilizzare l'estrazione AI delle tabelle, inserisci la tua API Key di Google Gemini.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Inserisci API Key..."
                            className="flex-1 px-3 py-2 border border-amber-300 dark:border-amber-700 rounded bg-gray-900 dark:bg-slate-800 text-slate-100 dark:text-white"
                        />
                        <button
                            onClick={handleApiKeySave}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
                        >
                            Salva
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 dark:text-slate-300 mb-2">
                        Seleziona File (PDF, Immagini, Excel, CSV)
                    </label>
                    <div
                        className="relative"
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) {
                                setFile(droppedFile);
                                setExtractedTables([]);
                                updateStatus(`File selezionato: ${droppedFile.name}`, 'info');
                            }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <input
                            type="file"
                            accept="*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-to-excel"
                            disabled={loading}
                        />
                        <label
                            htmlFor="file-to-excel"
                            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-700 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                        >
                            {file ? (
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-sm font-medium text-slate-300 dark:text-slate-300">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-slate-400 dark:text-slate-400">
                                        Clicca o trascina qualsiasi file
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Supporta TUTTI i formati di documenti
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleProcessFile}
                        disabled={!file || loading || !scriptsLoaded}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Elaborazione in corso...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Estrai Tabelle
                            </>
                        )}
                    </button>

                    {extractedTables.length > 0 && (
                        <button
                            onClick={downloadExcel}
                            className="px-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Scarica Excel
                        </button>
                    )}
                </div>

                {status && (
                    <div className={`p-4 rounded-lg ${
                        statusType === 'error' ? 'bg-black dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                        statusType === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                        statusType === 'success' ? 'bg-black dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                        'bg-black dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                        <p className={`text-sm ${
                            statusType === 'error' ? 'text-red-700 dark:text-red-400' :
                            statusType === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                            statusType === 'success' ? 'text-green-700 dark:text-green-400' :
                            'text-blue-700 dark:text-blue-400'
                        }`}>
                            {status}
                        </p>
                    </div>
                )}

                {extractedTables.length > 0 && (
                    <div className="bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg p-6">
                        <h3 className="font-semibold text-slate-100 dark:text-white mb-4">
                            📊 Tabelle Estratte
                        </h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {extractedTables.map((page, pageIdx) => (
                                <div key={pageIdx} className="border-l-4 border-blue-500 pl-4">
                                    <h4 className="font-medium text-slate-300 dark:text-slate-300 mb-2">
                                        {page.pageName || `Pagina ${page.pageNumber}`}
                                    </h4>
                                    {page.tables.map((table, tableIdx) => (
                                        <div key={tableIdx} className="mb-3">
                                            <p className="text-sm text-slate-400 dark:text-slate-400 mb-1">
                                                Tabella {tableIdx + 1}: {table.length} righe × {table[0]?.length || 0} colonne
                                            </p>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs border border-slate-800 dark:border-slate-700">
                                                    <tbody>
                                                        {table.slice(0, 5).map((row, rowIdx) => (
                                                            <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gray-900 dark:bg-slate-700' : ''}>
                                                                {row.map((cell, cellIdx) => (
                                                                    <td key={cellIdx} className="border border-slate-800 dark:border-slate-700 px-2 py-1">
                                                                        {cell || '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {table.length > 5 && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        ... e altre {table.length - 5} righe
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToExcel;