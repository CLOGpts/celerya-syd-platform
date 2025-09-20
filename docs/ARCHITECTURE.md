# 🏗️ Celerya SYD Platform - Documentazione Architetturale

## 📋 Indice
1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Architettura del Sistema](#architettura-del-sistema)
4. [Struttura del Progetto](#struttura-del-progetto)
5. [Componenti Principali](#componenti-principali)
6. [Servizi e Integrazioni](#servizi-e-integrazioni)
7. [Flussi di Dati](#flussi-di-dati)
8. [Sicurezza](#sicurezza)
9. [Deploy e Configurazione](#deploy-e-configurazione)

---

## 🎯 Panoramica del Sistema

**Celerya SYD Platform** è una piattaforma enterprise per la gestione intelligente della supply chain nel settore food & beverage, potenziata da AI.

### Obiettivi Principali
- **Gestione Documentale**: Centralizzazione documenti fornitori (DDT, cataloghi, listini)
- **Analisi Predittiva**: AI per previsioni vendite e ottimizzazione scorte
- **Automazione Commerciale**: SYD Agent - Direttore Commerciale virtuale
- **Insights Real-time**: Dashboard analitiche per decisioni data-driven

### Utenti Target
- **Imprenditori Food**: Ristoranti, hotel, catering
- **Gestori Supply Chain**: Responsabili acquisti e magazzino
- **Team Commerciali**: Venditori e account manager
- **Fornitori**: Accesso dedicato per gestione ordini

---

## 💻 Stack Tecnologico

### Frontend
```yaml
Framework: React 18.3 con TypeScript
Build Tool: Vite 6.3
Styling:
  - Tailwind CSS 3.4
  - Design System: SYD Cyber (custom dark theme)
State Management: React Hooks + Context API
Routing: React (single-page application)
```

### Backend & Services
```yaml
BaaS: Firebase (Google Cloud Platform)
  - Authentication: Firebase Auth
  - Database: Firestore NoSQL
  - Storage: Firebase Storage
  - Hosting: Firebase Hosting

AI Services:
  - Google Gemini 2.5 Flash (analisi dati)
  - Custom MCP Endpoints (integrazioni esterne)

APIs:
  - RESTful endpoints via Firebase Functions
  - WebSocket per real-time updates
```

### Linguaggi & Standards
```yaml
Linguaggi:
  - TypeScript (type safety)
  - JavaScript ES6+
  - JSX/TSX per componenti React

Standards:
  - ESLint per code quality
  - Prettier per formatting
  - Conventional Commits per versionamento
```

---

## 🏛️ Architettura del Sistema

### Architettura a 3 Livelli

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React SPA - Component-Based Architecture           │    │
│  │  ├── Pages (Dashboard, DataView, Settings)         │    │
│  │  ├── Components (Reusable UI Elements)             │    │
│  │  └── Contexts (Global State Management)            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Service Layer                                      │    │
│  │  ├── authService (Authentication)                  │    │
│  │  ├── firebaseService (CRUD Operations)            │    │
│  │  ├── sydService (AI Memory & Learning)            │    │
│  │  ├── semanticSearchService (Document Search)      │    │
│  │  └── llmForExcel (Excel AI Processing)            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               ↕️
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Firebase Services                                  │    │
│  │  ├── Firestore Collections                        │    │
│  │  │   ├── users/                                   │    │
│  │  │   ├── customers/                               │    │
│  │  │   ├── suppliers/                               │    │
│  │  │   ├── documents/                               │    │
│  │  │   ├── sydAnalysis/                             │    │
│  │  │   └── settings/                                │    │
│  │  ├── Firebase Storage (Files & Media)             │    │
│  │  └── Firebase Auth (User Management)              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Struttura del Progetto

```
Syd_Prototipo/
├── 📄 Configuration Files
│   ├── package.json          # Dependencies & scripts
│   ├── tsconfig.json         # TypeScript configuration
│   ├── vite.config.js        # Vite bundler config
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── .env.local            # Environment variables
│   └── .gitignore           # Git ignore rules
│
├── 🤖 .claude/              # Claude AI Agents (M³ Framework)
│   └── agents/
│       ├── il-guardiano.md  # Test & Debug Specialist
│       ├── il-chirurgo.md   # Frontend & UX Specialist
│       └── l-architetto.md  # Backend & Integration Master
│
├── 🎨 src/                  # Source code
│   ├── config/
│   │   └── firebase.ts      # Firebase initialization
│   │
│   ├── services/            # Business logic services
│   │   ├── authService.ts   # Authentication logic
│   │   ├── firebaseService.ts # Database operations
│   │   ├── sydService.ts    # AI agent memory (ANTIFRAGILE)
│   │   ├── semanticSearchService.ts # Search engine
│   │   ├── semanticAnalyzer.ts # Document analysis
│   │   ├── queryInterpreter.ts # Query processing
│   │   ├── llmForExcel.ts  # Excel AI integration
│   │   ├── excelToFirebase.ts # Excel data import
│   │   ├── errorInterceptor.ts # Error monitoring system
│   │   └── liveLogStream.ts # Live logging system
│   │
│   ├── styles/
│   │   ├── global.css       # Global styles
│   │   ├── SydDesignSystem.ts # Design tokens
│   │   ├── SydPlatformTheme.ts # Platform theme
│   │   └── SydTheme.ts      # Theme configuration
│   │
│   ├── integration/
│   │   └── UIBridge.tsx     # UI integration layer
│   │
│   ├── containers/          # Container components
│   │   ├── DashboardContainer.tsx
│   │   └── MainLayoutContainer.tsx
│   │
│   └── ui-components/       # Reusable UI components
│       ├── buttons/
│       ├── cards/
│       └── layout/
│
├── 🧩 components/           # React components
│   ├── Core Pages
│   │   ├── LoginPage.tsx    # Authentication
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── DataViewPage.tsx # SYD Agent interface (Firebase-ready)
│   │   ├── SettingsPage.tsx # User settings
│   │   └── SuppliersListPage.tsx # Supplier management
│   │
│   ├── experimental/ 🧪     # Beta features
│   │   ├── ExcelUploaderPage.tsx # Data import
│   │   ├── SemanticSearchPage.tsx # Document search
│   │   ├── LLMExcelPage.tsx # AI Excel analysis
│   │   └── PdfToExcel.tsx   # PDF conversion
│   │
│   ├── Feature Components
│   │   ├── SupplierDashboard.tsx # Supplier portal
│   │   ├── DDTViewerPage.tsx # Document viewer
│   │   ├── DocumentSplitView.tsx # Split view interface
│   │   ├── DocumentViewer.tsx # PDF/Document display
│   │   ├── CatalogCreator.tsx # Catalog management
│   │   └── MCPIntegration.tsx # MCP system integration
│   │
│   └── icons/               # Icon components (40+ icons)
│       ├── SpinnerIcon.tsx
│       ├── SendIcon.tsx
│       └── [38 other icons]
│
├── 🌐 contexts/             # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   ├── LanguageContext.tsx  # i18n support (IT/EN)
│   └── ThemeContext.tsx     # Theme management
│
├── 📊 data/                 # Static data files
│   └── products.ts          # Product data
│
├── 📚 docs/                 # Documentation (ORGANIZED)
│   ├── ARCHITECTURE.md      # This file
│   ├── API_DOCUMENTATION.md # API documentation
│   ├── M3_FRAMEWORK_COMPLETO.md # M³ Framework guide
│   ├── comunicazioni.txt    # Communication protocols
│   └── firebase-rules-CORRETTE.txt # Firebase security rules
│
├── 🖼️ immagini/            # Image assets
│   ├── dashboard.png
│   └── [other images]
│
├── 🔌 mcp/                  # MCP (Model Context Protocol)
│   ├── core/
│   ├── security/
│   ├── adapters/
│   └── MCPSecurityCore.ts
│
├── 📦 samples/              # Sample files (ORGANIZED)
│   └── MagazzinoNAVISION.xlsx # Sample warehouse data
│
├── 🔧 backup/               # Backup files
│   ├── emergency-server.cjs
│   └── main.js
│
├── 🧪 tests/                # Test files
│   └── mcp.test.ts
│
├── 📱 public/               # Public assets
│   └── assets/
│
├── 🏗️ dist/                # Build output (gitignored)
│
├── 📦 node_modules/         # Dependencies (gitignored)
│
└── 📄 Root Files
    ├── App.tsx              # Main app component
    ├── index.tsx            # Entry point (with interceptors)
    ├── index.html           # HTML template
    ├── index.css            # Base styles
    ├── constants.ts         # Global constants
    ├── types.ts             # Type definitions
    ├── translations.ts      # i18n translations
    └── README.md            # Project documentation
```

---

## 🔧 Componenti Principali

### 1. SYD Agent (DataViewPage.tsx)
**Descrizione**: Interfaccia conversazionale AI per analisi commerciali

**Caratteristiche**:
- Chat interface con Gemini AI
- Memoria persistente delle conversazioni
- Analisi multi-sorgente (Excel, PDF, immagini)
- Time Machine per analisi temporali
- Export automatico in Excel

**Tecnologie**: React, Gemini AI API, Firebase, XLSX.js

### 2. Dashboard (DashboardPage.tsx)
**Descrizione**: Centro di controllo con KPI e metriche

**Widgets**:
- Vendite in tempo reale
- Alert scorte
- Trend analysis
- Performance fornitori

### 3. Gestione Fornitori (SuppliersListPage.tsx)
**Descrizione**: CRM fornitori con documenti e storico

**Funzionalità**:
- CRUD fornitori
- Upload documenti (DDT, cataloghi)
- Tracking ordini
- Rating e feedback

### 4. Ricerca Semantica (SemanticSearchPage.tsx)
**Descrizione**: Motore di ricerca intelligente su documenti

**Features**:
- NLP query processing
- Fuzzy matching
- Relevance scoring
- Multi-format support

---

## 🔌 Servizi e Integrazioni

### Firebase Services

#### 1. Authentication Service
```typescript
// src/services/authService.ts
- login(email, password)
- register(email, password, displayName)
- logout()
- resetPassword(email)
- onAuthStateChange(callback)
```

#### 2. Database Service
```typescript
// src/services/firebaseService.ts
Services:
- customerService: CRUD clienti
- supplierService: CRUD fornitori
- documentService: Gestione documenti
- settingsService: Preferenze utente
- migrationService: Import da localStorage
```

#### 3. SYD Memory Service
```typescript
// src/services/sydService.ts
Features:
- saveConversation(): Salva chat history
- getRecentConversations(): Recupera contesto
- saveInsight(): Memorizza insights
- buildContextFromHistory(): Costruisce memoria
- getUserProfile(): Personalizzazione
```

### AI Integrations

#### Google Gemini 2.5
- **Modello**: gemini-2.5-flash
- **Use cases**:
  - Analisi documenti
  - Generazione report
  - Previsioni vendite
  - Raccomandazioni strategiche

#### MCP (Model Context Protocol)
- **Endpoint**: Active Pieces integration
- **Features**:
  - File selection
  - External data sources
  - Webhook triggers

---

## 🔄 Flussi di Dati

### 1. Flusso Autenticazione
```
User → LoginPage → authService → Firebase Auth → App State → Dashboard
```

### 2. Flusso Analisi SYD
```
User Input → DataViewPage → sydService → Gemini API
     ↓                           ↓
File Upload              Firebase (save)
     ↓                           ↓
Context Building         Historical Data
     ↓                           ↓
AI Response ← ← ← ← ← ← Analysis Result
```

### 3. Flusso Import Dati
```
Excel File → ExcelUploaderPage → excelToFirebase → Firestore
                    ↓
            Data Validation
                    ↓
            Semantic Indexing → Search Engine
```

---

## 🔐 Sicurezza

### Authentication & Authorization
- **Firebase Auth** con email/password
- **Session management** automatico
- **Role-based access** (client/supplier)
- **Secure token refresh**

### Data Protection
- **Firestore Security Rules** per accesso dati
- **Encryption at rest** (Firebase default)
- **HTTPS only** communication
- **API key protection** via environment variables

### AI Security
- **Prompt injection protection** in SYD Agent
- **Jailbreak prevention** con multiple safeguards
- **Data sanitization** prima di AI processing
- **No PII in AI requests**

---

## 🚀 Deploy e Configurazione

### Ambiente di Sviluppo
```bash
# Installazione
npm install

# Configurazione Firebase
cp .env.example .env
# Aggiungere credenziali Firebase e API keys

# Sviluppo locale
npm run dev -- --port 5174

# Build produzione
npm run build
```

### Deployment su Firebase
```bash
# Login Firebase
firebase login

# Inizializzazione
firebase init

# Deploy
firebase deploy --only hosting
```

### Environment Variables
```env
# Firebase Config
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx

# AI Services
VITE_GEMINI_API_KEY=xxx

# MCP Integration
VITE_MCP_ENDPOINT=xxx
```

---

## 📊 Performance & Scalability

### Ottimizzazioni Implementate
- **Code splitting** con Vite
- **Lazy loading** dei componenti
- **Memoization** con React.memo
- **Virtual scrolling** per liste lunghe
- **Image optimization** con lazy loading

### Scalabilità
- **Firestore** scala automaticamente
- **CDN** per asset statici
- **Edge functions** per logica distribuita
- **Horizontal scaling** ready

---

## 🔄 Versioning & Updates

### Git Strategy
- **Main branch**: Produzione stabile
- **Develop branch**: Sviluppo attivo
- **Feature branches**: feature/nome-feature
- **Hotfix branches**: hotfix/nome-fix

### Semantic Versioning
```
MAJOR.MINOR.PATCH
1.0.0 - Initial release
1.1.0 - SYD Agent with memory
1.2.0 - Firebase integration complete
```

---

## 📈 Monitoring & Analytics

### Strumenti
- **Firebase Analytics**: User behavior
- **Performance Monitoring**: Core Web Vitals
- **Crashlytics**: Error tracking
- **Custom events**: Business metrics

---

## 🤝 Team & Contributions

### Struttura Team
- **Product Owner**: Definizione requirements
- **Tech Lead**: Architettura e code review
- **Frontend Dev**: React components
- **AI Engineer**: SYD Agent development
- **DevOps**: Infrastructure & deployment

### Contributing Guidelines
1. Fork del repository
2. Create feature branch
3. Implement con test
4. Submit pull request
5. Code review process
6. Merge to develop

---

## 📚 Risorse Aggiuntive

- [React Documentation](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Google AI Studio](https://makersuite.google.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

*Documento aggiornato al: Gennaio 2025*
*Versione: 1.2.0*
*Autore: Team Celerya Development*