# 🧪 Features Sperimentali

Questa cartella contiene componenti e features in fase di sviluppo e testing.

## ⚗️ Componenti Beta

### 1. ExcelUploaderPage
**Status:** 🟡 Beta Testing
**Descrizione:** Sistema di upload e importazione dati da file Excel verso Firebase.
**Features:**
- Upload multiplo file Excel
- Parsing automatico colonne
- Mapping campi personalizzabile
- Import batch in Firestore

**Known Issues:**
- Performance con file > 10MB
- Validazione dati incompleta

---

### 2. SemanticSearchPage
**Status:** 🟡 Beta Testing
**Descrizione:** Motore di ricerca semantica avanzata su documenti.
**Features:**
- NLP query processing
- Fuzzy matching
- Ricerca multi-formato
- Relevance scoring

**Known Issues:**
- Indicizzazione lenta su grandi volumi
- Supporto lingue limitato (solo italiano)

---

### 3. LLMExcelPage
**Status:** 🟡 Beta Testing
**Descrizione:** Analisi Excel potenziata da AI con Gemini.
**Features:**
- Analisi automatica pattern
- Generazione insights
- Previsioni vendite
- Export report automatici

**Known Issues:**
- API rate limits
- Costi elevati per analisi grandi

---

## ⚠️ Avvertenze

- **Non utilizzare in produzione** senza approvazione
- **Backup dati** prima di utilizzare import features
- **Monitorare costi API** per features AI
- **Segnalare bug** tramite issue tracker

## 🚀 Roadmap

### Q1 2025
- [ ] Stabilizzazione ExcelUploader
- [ ] Miglioramento performance search
- [ ] Ottimizzazione costi LLM

### Q2 2025
- [ ] Promozione a features stabili
- [ ] Integrazione completa nel core
- [ ] Documentazione utente finale

## 📧 Contatti

Per feedback e segnalazioni: dev@celerya.com