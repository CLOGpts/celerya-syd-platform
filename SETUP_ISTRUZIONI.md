# Celerya Syd Platform - Istruzioni Setup

## Stato del Progetto
Prototipo funzionante proveniente da Google AI Studio. Applicazione React/TypeScript per gestione fornitori, cataloghi e documenti di trasporto.

## Problemi Risolti
✅ Errori TypeScript corretti in:
- `components/CatalogCreator.tsx`
- `components/SuppliersListPage.tsx`

✅ Dipendenze installate correttamente

✅ Server di sviluppo avviato su http://localhost:5174/

## Setup Necessario

### 1. Configurazione API Gemini (OBBLIGATORIO)
Per far funzionare l'integrazione AI:

1. Ottieni una API key da: https://makersuite.google.com/app/apikey
2. Modifica il file `.env.local`:
```
GEMINI_API_KEY=tua_chiave_api_qui
```

### 2. Avvio dell'applicazione
```bash
npm run dev
```
L'app sarà disponibile su http://localhost:5174/

### 3. Warning Node.js
L'app richiede Node.js v20+. Attualmente hai v18.20.8.
Per aggiornare:
```bash
# Con nvm
nvm install 20
nvm use 20

# Oppure scarica da
https://nodejs.org/
```

## Funzionalità Principali
- **Dashboard Cliente/Fornitore**: Switch tramite bottone in basso a destra
- **Gestione Documenti**: Upload e analisi PDF, DDT
- **Cataloghi**: Creazione e gestione cataloghi prodotti
- **AI Integration**: Analisi documenti con Gemini API

## Struttura Componenti
- `/components` - Tutti i componenti React
- `/contexts` - Context per gestione stato globale
- `/data` - Dati di esempio
- `types.ts` - Definizioni TypeScript
- `translations.ts` - Sistema multilingua

## Note Sviluppo
- Usa TypeScript strict mode
- TailwindCSS per styling
- Vite come bundler
- LocalStorage per persistenza dati

## Prossimi Passi Consigliati
1. Configurare API Gemini con chiave valida
2. Testare upload documenti
3. Verificare funzionalità AI
4. Considerare migrazione a database reale (attualmente usa localStorage)