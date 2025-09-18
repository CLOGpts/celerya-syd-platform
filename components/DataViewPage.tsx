

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import McpFileSelector from './McpFileSelector';
import CommercialOfferDisplay from './CommercialOfferDisplay';
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, CommercialOffer } from '../types';

// The user-provided MCP endpoint for Server-Sent Events
const MCP_SSE_ENDPOINT = 'https://cloud.activepieces.com/api/v1/mcp/mw52JQzyt7Yl34Rrebl7r/sse';

const SourceLink: React.FC<{uri: string, title: string}> = ({ uri, title }) => (
    <a href={uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-900 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        <span className="text-xs font-medium text-gray-300 dark:text-gray-300 truncate" title={title}>{title || uri}</span>
    </a>
);


const ParsedContent: React.FC<{ text: string }> = ({ text }) => {
    // Check for tables and wrap them
    if (text.includes('|') && text.includes('---')) {
        return <pre className="font-mono text-xs bg-black dark:bg-slate-800 p-3 my-2 rounded-md overflow-x-auto whitespace-pre-wrap">{text}</pre>;
    }

    const lines = text.split('\n');

    return (
        <div>
            {lines.map((line, i) => {
                if (line.trim() === '') return <div key={i} style={{height: '1em'}} />;
                
                // Titles
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2 text-gray-100 dark:text-gray-100">{line.substring(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-3 mb-1 text-gray-200 dark:text-gray-200">{line.substring(3)}</h2>;
                
                // Lists
                if (line.startsWith('- ')) return <li key={i} className="ml-5 list-disc">{line.substring(2)}</li>;
                
                // Bold and Italic text
                const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                const styledLine = parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={index}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <em key={index}>{part.slice(1, -1)}</em>;
                    }
                    return <span key={index}>{part}</span>;
                });


                return <p key={i} className="my-1">{styledLine}</p>;
            })}
        </div>
    );
};

const ChatMessage: React.FC<{ role: 'user' | 'model'; text: string; sources?: any[]; offer?: CommercialOffer }> = ({ role, text, sources, offer }) => {
    const isUser = role === 'user';
    const bubbleClasses = isUser
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
        : 'bg-gray-900/70 text-gray-100 border border-gray-800/30 backdrop-blur-sm';
    const alignmentClasses = isUser ? 'items-end' : 'items-start';
    const hasSources = sources && sources.length > 0;

    return (
        <div className={`flex flex-col gap-2 py-2 ${alignmentClasses}`}>
            <div className={`max-w-2xl w-full px-4 py-3 rounded-xl shadow-sm ${bubbleClasses}`}>
                 <div className="text-sm leading-relaxed"><ParsedContent text={text} /></div>
            </div>
            {offer && <CommercialOfferDisplay offer={offer} />}
            {hasSources && (
                 <div className="max-w-2xl w-full mt-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Fonti:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {sources.map((source, index) => (
                           source.web && <SourceLink key={index} uri={source.web.uri} title={source.web.title} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const fileToData = (file: File): Promise<{name: string, data: any[] | {mimeType: string, data: string}}> => {
    return new Promise((resolve, reject) => {
        if (file.name.endsWith('.xlsx')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    resolve({ name: file.name, data: json });
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        } else { // Handle as base64 for images/pdfs
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.substring(result.indexOf(',') + 1);
                resolve({ name: file.name, data: { mimeType: file.type, data: base64 }});
            };
            reader.onerror = error => reject(error);
        }
    });
};

const XIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const DataViewPage: React.FC = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; sources?: any[]; offer?: CommercialOffer }[]>([
        { role: 'model', text: 'Buongiorno. Sono SYD, il suo Direttore Sistematico dei Rendimenti. Come posso assisterla oggi? Può iniziare caricando i suoi file .xlsx o facendomi una domanda.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataFiles, setDataFiles] = useState<Array<{ name: string, data: any[] | {mimeType: string, data: string}}>>([]);
    const [simulatedDate, setSimulatedDate] = useState<string>('');
    
    const [selectableFiles, setSelectableFiles] = useState<string[] | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const mcpEventSourceRef = useRef<EventSource | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, selectableFiles]);
    
    useEffect(() => {
        return () => { mcpEventSourceRef.current?.close(); };
    }, []);

    useEffect(() => {
        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionApi) {
            setIsSpeechRecognitionSupported(true);
            const recognition: SpeechRecognition = new SpeechRecognitionApi();
            recognition.continuous = false;
            recognition.lang = 'it-IT';
            recognition.interimResults = false;
            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event: SpeechRecognitionEvent) => setInput(event.results[event.results.length - 1][0].transcript.trim());
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error', event.error);
                setError(event.error === 'not-allowed' ? "Accesso al microfono negato." : "Errore riconoscimento vocale.");
                setIsListening(false);
            };
            recognition.onend = () => setIsListening(false);
            speechRecognitionRef.current = recognition;
        } else {
            setIsSpeechRecognitionSupported(false);
        }
    }, []);

    const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        e.target.value = ''; 
        setError(null);
        try {
            const parsedFile = await fileToData(file);
            setDataFiles(prev => [...prev, parsedFile]);
        } catch (err) {
            console.error("File parsing error:", err);
            setError(`Errore nell'analisi del file ${file.name}.`);
        }
    };
    
    const removeDataFile = (indexToRemove: number) => {
        setDataFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleListen = () => {
        if (!speechRecognitionRef.current || isLoading) return;
        isListening ? speechRecognitionRef.current.stop() : speechRecognitionRef.current.start();
    };
    
    const handleSendMessage = async (messageOverride?: string) => {
        const userMessageText = messageOverride || input.trim();
        if ((!userMessageText && dataFiles.length === 0) || isLoading) return;

        let userMessageForDisplay = userMessageText;
        if (dataFiles.length > 0) {
            const allFileNames = dataFiles.map(f => f.name).join(', ');
            userMessageForDisplay += `\n\n*File allegati: ${allFileNames}*`;
        }

        const newUserMessage = { role: 'user' as const, text: userMessageForDisplay };
        setMessages(prev => [...prev, newUserMessage]);
        
        setInput('');
        setSelectableFiles(null);
        setIsLoading(true);
        setError(null);
        
        if (mcpEventSourceRef.current) {
            mcpEventSourceRef.current.close();
            mcpEventSourceRef.current = null;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const savedData = JSON.parse(localStorage.getItem('celerya_suppliers_data') || '{}');

            // Separate file data (PDF, images) from JSON data (XLSX)
            const xlsxFiles = dataFiles.filter(f => Array.isArray(f.data));
            const attachedFiles = dataFiles.filter(f => !Array.isArray(f.data) && typeof f.data === 'object' && 'mimeType' in f.data);

            const dataContextObject = {
                savedSupplierData: savedData,
                uploadedDataFiles: xlsxFiles, // Only include XLSX data in the JSON context
                simulatedDate: simulatedDate || `Oggi (nessuna data simulata, data odierna: ${new Date().toLocaleDateString('it-IT')})`
            };

            const systemInstruction = `
# IDENTITÀ E RUOLO
Tu sei SYD (Systematic Yield Director), un assistente AI avanzato e partner strategico per l'imprenditore che utilizza l'app Celerya.
- **Missione:** Il tuo scopo è portare felicità e semplicità nel business, gestendo la complessità in modo facile e intuitivo.
- **Personalità:** Ti rivolgi all'utente con professionalità, dandogli del "lei". Agisci come un suo fidato analista e direttore commerciale.
- **Lingua:** Rispondi sempre e solo in italiano.

# VALORI
- **Determinazione:** Analizza i dati con tenacia fino a trovare l'informazione utile e la causa dei problemi.
- **Umiltà:** Se l'utente ti corregge, riconosci l'errore. Scusati, spiega la logica errata che hai seguito, ringrazia per la correzione e impara dal feedback per le analisi future (es. "Ha ragione, mi scuso. Ho erroneamente sommato 'PZ' e 'CT' come se fossero la stessa unità di misura. Procedo subito a ricalcolare correttamente."). La tua precisione dipende dalla collaborazione con l'expertise umana.
- **Semplicità nella Complessità:** Trasforma dati complessi in insight semplici e immediatamente azionabili.

# CAPACITÀ E FLUSSO DI LAVORO

## 1. Analisi Dati Multi-sorgente
L'utente ti fornirà dati attraverso più parti. La tua analisi deve integrare TUTTE le fonti fornite.
- **Contesto JSON:** La prima parte del prompt conterrà un oggetto JSON con il seguente contesto:
    - \`savedSupplierData\`: Schede tecniche, DDT, cataloghi e listini prezzi salvati permanentemente nell'app.
    - \`uploadedDataFiles\`: Un array di file .xlsx caricati. Ogni elemento ha \`name\` e \`data\` (un array di oggetti JSON).
- **File Allegati:** Oltre al testo, l'utente può allegare file (come PDF o immagini di documenti). Questi file verranno forniti come parti separate nel prompt. Devi analizzare anche il contenuto di questi file per rispondere alla richiesta.
- Quando analizzi un file per la prima volta, fornisci un riepilogo esecutivo (es. numero di righe, periodo coperto) e tabelle con dati salienti (es. Top 5 clienti/prodotti).

## 2. Funzione "Time Machine"
L'utente può specificare una data nel campo \`simulatedDate\` nel contesto JSON.
- **REGOLA CRITICA:** Se \`simulatedDate\` è impostato, **TUTTA** la tua analisi deve essere eseguita come se ti trovassi in quella data. Filtra e interpreta i dati di conseguenza. Ad esempio, "oggi" per te è la \`simulatedDate\`.
- **Esempi di Analisi Incrociata:**
    - **Prodotti Sotto Scorta:** Confronta \`Ordini_clienti_plan.xlsx\` con \`MagazzinoSIGEP_0.xlsx\` per calcolare il fabbisogno e la mancanza alla \`simulatedDate\`.
    - **Copertura Ordini:** Verifica se un prodotto sotto scorta ha un ordine fornitore in arrivo analizzando \`Ordini_Fornitori.xlsx\`.
    - **Scadenze Imminenti:** Analizza le \`DATA_SCADENZA\` nel file di magazzino rispetto alla \`simulatedDate\` per creare allerte.

## 3. Gestione Incongruenze
- Identifica problemi nei dati, come la mancanza di standardizzazione (es. unità di misura 'UM' diverse: "PZ", "CT", "KG").
- Presta la massima attenzione alle unità di misura durante i calcoli. Non sommare mai quantità con UM diverse senza prima convertirle, se possibile. Se non è possibile, segnalalo.

# FORMATO DI OUTPUT E COMUNICAZIONE

## Risposte Standard (Testo)
Per le richieste di analisi, dati, e domande generali, struttura le tue risposte usando Markdown in modo chiaro e gerarchico.
- **Titoli:** Usa \`#\` per il titolo principale e \`##\` per i sottotitoli.
- **Tabelle:** Usa tabelle formattate per la visualizzazione in un ambiente a larghezza fissa (usa i caratteri | - + per disegnarle). Devono essere chiare e ben allineate.
- **Elenchi:** Usa \`-\` per elenchi puntati.
- **Evidenziazione:** Usa \`**testo**\` per evidenziare i dati o concetti più critici.
**Ogni analisi deve SEMPRE concludersi con:**
1.  **Spiegazione dei Dati:** Una breve nota che spiega cosa significano i dati presentati.
2.  **Raccomandazioni Operative:** Una sezione \`## Raccomandazioni Operative\` con 2-4 azioni concrete che l'imprenditore può intraprendere.

## Generazione di File Excel
- Se l'utente chiede esplicitamente di "creare un Excel", "esportare in Excel", "scaricare un excel" o frasi simili, la tua risposta **DEVE** essere un singolo oggetto JSON strutturato, senza alcun testo o markdown esterno.
- **Formato JSON per Excel:**
\`\`\`json
{
  "type": "excel_download",
  "filename": "nome_file_suggerito.xlsx",
  "sheets": [
    {
      "sheetName": "Nome Foglio 1",
      "data": [
        { "Colonna 1": "Valore A1", "Colonna 2": "Valore B1" },
        { "Colonna 1": "Valore A2", "Colonna 2": "Valore B2" }
      ]
    }
  ],
  "summary": "Ecco il file Excel che ha richiesto. Contiene un riepilogo dei dati analizzati."
}
\`\`\`
- **Regole per il JSON:**
    - \`type\`: deve essere sempre "excel_download".
    - \`filename\`: un nome file descrittivo che termina con \`.xlsx\`.
    - \`sheets\`: un array di oggetti, ognuno rappresenta un foglio di lavoro.
    - \`sheetName\`: il nome del foglio di lavoro.
    - \`data\`: un array di oggetti, dove ogni oggetto è una riga e le chiavi sono le intestazioni di colonna.
    - \`summary\`: un messaggio di testo da mostrare all'utente nella chat per accompagnare il download.
`;
            
            const promptParts: any[] = [];
            
            // Part 1: Main text prompt with JSON context and user query
            const mainPromptText = `Contesto Dati (JSON):\n\`\`\`json\n${JSON.stringify(dataContextObject, null, 2)}\n\`\`\`\n\nDomanda Utente:\n${userMessageText}`;
            promptParts.push({ text: mainPromptText });

            // Part 2...N: Add attached files (PDFs, images) as inlineData parts
            for (const file of attachedFiles) {
                const fileData = file.data as { mimeType: string; data: string };
                promptParts.push({
                    inlineData: {
                        mimeType: fileData.mimeType,
                        data: fileData.data
                    }
                });
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: promptParts },
                config: { systemInstruction: systemInstruction }
            });
            
            const responseText = response.text.trim();
            let isHandled = false;

            try {
                let jsonStr = responseText;
                const match = jsonStr.match(/^```(json)?\s*\n?(.*?)\n?\s*```$/s);
                if (match && match[2]) {
                    jsonStr = match[2].trim();
                }
                const jsonResponse = JSON.parse(jsonStr);

                if (jsonResponse.type === 'excel_download' && jsonResponse.filename && Array.isArray(jsonResponse.sheets)) {
                    isHandled = true;

                    const wb = XLSX.utils.book_new();
                    jsonResponse.sheets.forEach((sheet: { sheetName: string, data: any[] }) => {
                        if (sheet.data && sheet.sheetName) {
                            const ws = XLSX.utils.json_to_sheet(sheet.data);
                            XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
                        }
                    });
                    XLSX.writeFile(wb, jsonResponse.filename);

                    const summaryMessage = jsonResponse.summary || `Ho generato il file Excel "${jsonResponse.filename}". Il download dovrebbe iniziare a breve.`;
                    setMessages(prev => [...prev, { role: 'model', text: summaryMessage }]);
                    setDataFiles([]);
                }
            } catch (e) {
                // Not a JSON response or not our specific format, fall through to default handling.
            }

            if (!isHandled) {
                const modelResponse = { role: 'model' as const, text: responseText };
                setMessages(prev => [...prev, modelResponse]);
                setDataFiles([]); // Clear files after successful send
            }

        } catch (e) {
            console.error("SYD AGENT error:", e);
            const errorMessage = "Oops! Qualcosa è andato storto. Per favore riprova.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const quickReplies = [
        "Qual è la situazione del magazzino?",
        "Controlla gli ordini dei clienti",
        "Quali prodotti sono sotto scorta?",
        "Mostrami le scadenze imminenti",
    ];
    
    const handleQuickReply = (reply: string) => {
        setInput(reply);
        const textarea = document.querySelector('textarea');
        if(textarea) textarea.focus();
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="p-4 sm:p-6 lg:p-8 border-b border-gray-800/30 bg-[#1e293b]/80 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
                <h1 className="text-2xl font-bold text-white">SYD AGENT</h1>
                <p className="text-sm text-gray-400 mt-1">Il suo assistente intelligente per la direzione strategica.</p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} role={msg.role} text={msg.text} sources={msg.sources} offer={msg.offer} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-2xl px-4 py-3 rounded-xl shadow-lg bg-[#1e293b]/80 backdrop-blur-sm text-gray-300 border border-gray-700/30">
                                    <div className="flex items-center gap-3">
                                        <SpinnerIcon className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm italic">SYD sta analizzando...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            <footer className="p-4 sm:p-6 lg:p-8 border-t border-gray-800/30 bg-[#1e293b]/80 backdrop-blur-sm sticky bottom-0 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    {error && <p className="text-red-600 dark:text-red-400 text-sm text-center mb-2">{error}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="time-machine" className="block text-xs font-medium text-gray-400 dark:text-gray-300 mb-1">Time Machine (opzionale)</label>
                            <input 
                                type="date" 
                                id="time-machine"
                                value={simulatedDate}
                                onChange={e => setSimulatedDate(e.target.value)}
                                className="w-full p-2 border border-gray-700 rounded-lg shadow-sm text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:placeholder-gray-400"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <p className="block text-xs font-medium text-gray-400 dark:text-gray-300 mb-1">File dati caricati in sessione</p>
                            <div className="p-2 border border-gray-700 dark:border-slate-600 rounded-lg bg-gray-900 dark:bg-slate-700 min-h-[42px]">
                                {dataFiles.length === 0 
                                    ? <p className="text-xs text-gray-500 dark:text-gray-400 italic">Nessun file caricato. Usi l'icona 📎 per aggiungere file.</p>
                                    : <div className="flex flex-wrap gap-2">
                                        {dataFiles.map((file, index) => (
                                            <div key={index} className="flex items-center gap-1 bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300 text-xs font-medium px-2 py-1 rounded-full">
                                                <span>{file.name}</span>
                                                <button onClick={() => removeDataFile(index)} disabled={isLoading} className="text-lime-600 hover:text-lime-900 dark:text-lime-400 dark:hover:text-lime-200"><XIcon className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                      </div>
                                }
                            </div>
                        </div>
                    </div>
                    
                    {!isLoading && messages.length <= 1 && (
                         <div className="mb-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {quickReplies.map(reply => (
                                    <button 
                                        key={reply}
                                        onClick={() => handleQuickReply(reply)}
                                        className="px-3 py-1.5 bg-gray-900 dark:bg-slate-700 border border-gray-800 dark:border-slate-600 text-xs font-medium text-gray-300 dark:text-gray-300 rounded-full hover:bg-gray-900 dark:hover:bg-slate-600 hover:border-gray-700 dark:hover:border-slate-500 transition-all"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-end gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileAdd} className="hidden" accept=".xlsx,.xls,.csv,.png,.jpg,.jpeg,.pdf" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="p-3 rounded-lg border border-gray-700 dark:border-slate-600 bg-gray-900 dark:bg-slate-700 hover:bg-gray-900 dark:hover:bg-slate-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                            aria-label="Allega file"
                        >
                            <PaperclipIcon className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={handleListen}
                            disabled={isLoading || !isSpeechRecognitionSupported}
                            className={`p-3 rounded-lg border border-gray-700 dark:border-slate-600 transition-colors ${
                                isListening
                                ? 'bg-black0 text-white hover:bg-red-600 ring-2 ring-red-500 ring-offset-2'
                                : 'bg-gray-900 dark:bg-slate-700 text-gray-400 dark:text-gray-300 hover:bg-gray-900 dark:hover:bg-slate-600'
                            } disabled:bg-gray-200 disabled:cursor-not-allowed`}
                            aria-label={isListening ? "Ferma registrazione" : "Avvia registrazione"}
                        >
                            {isListening ? (
                                <span className="relative flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-900 opacity-75"></span>
                                    <MicrophoneIcon className="relative inline-flex h-5 w-5" />
                                </span>
                            ) : (
                                <MicrophoneIcon className="w-5 h-5" />
                            )}
                        </button>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Formuli la sua richiesta... (⌘+Enter per inviare)"
                            rows={3}
                            className="w-full flex-1 p-3 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-colors text-sm resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:ring-lime-500 dark:focus:border-lime-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || (!input.trim() && dataFiles.length === 0)}
                            className="p-3 rounded-lg bg-lime-600 text-white hover:bg-lime-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                            aria-label="Invia messaggio"
                        >
                           <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DataViewPage;