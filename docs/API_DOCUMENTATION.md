# 📡 API Documentation - Celerya SYD Platform

## 📋 Indice
1. [Authentication API](#authentication-api)
2. [Customer Management API](#customer-management-api)
3. [Supplier Management API](#supplier-management-api)
4. [Document Management API](#document-management-api)
5. [SYD Intelligence API](#syd-intelligence-api)
6. [Search API](#search-api)
7. [Excel Processing API](#excel-processing-api)

---

## 🔐 Authentication API

### Base Service: `src/services/authService.ts`

#### Login
```typescript
async login(email: string, password: string): Promise<AuthResult>

// Request
{
  email: "user@example.com",
  password: "securePassword123"
}

// Response Success
{
  success: true,
  user: {
    uid: "user123",
    email: "user@example.com",
    displayName: "Mario Rossi"
  }
}

// Response Error
{
  success: false,
  error: "Invalid credentials"
}
```

#### Register
```typescript
async register(email: string, password: string, displayName: string): Promise<AuthResult>

// Request
{
  email: "newuser@example.com",
  password: "securePassword123",
  displayName: "Giuseppe Verdi"
}

// Response
{
  success: true,
  user: { /* User object */ }
}
```

#### Logout
```typescript
async logout(): Promise<void>
// No parameters required
// Clears session and redirects to login
```

#### Password Reset
```typescript
async resetPassword(email: string): Promise<{success: boolean, error?: string}>

// Request
{
  email: "user@example.com"
}

// Response
{
  success: true,
  message: "Password reset email sent"
}
```

---

## 👥 Customer Management API

### Base Service: `src/services/firebaseService.ts`

#### Create/Update Customer
```typescript
async customerService.save(customer: Customer): Promise<string>

// Request
{
  id: "cust_001",
  name: "Ristorante La Brace",
  vatNumber: "IT12345678901",
  address: "Via Roma 1, Milano",
  email: "info@labrace.it",
  phone: "+39 02 1234567",
  category: "restaurant",
  tags: ["premium", "weekly_delivery"],
  notes: "Consegna lunedì e giovedì"
}

// Response
"cust_001" // Customer ID
```

#### Get All Customers
```typescript
async customerService.getAll(): Promise<Customer[]>

// Response
[
  {
    id: "cust_001",
    name: "Ristorante La Brace",
    vatNumber: "IT12345678901",
    // ... other fields
    lastOrderDate: "2025-01-15",
    totalOrders: 45,
    averageOrderValue: 1250.50
  },
  // ... more customers
]
```

#### Get Single Customer
```typescript
async customerService.getById(customerId: string): Promise<Customer | null>

// Request
"cust_001"

// Response
{
  id: "cust_001",
  name: "Ristorante La Brace",
  // ... full customer object
}
```

#### Delete Customer
```typescript
async customerService.delete(customerId: string): Promise<void>

// Request
"cust_001"

// Response
// No response body, check HTTP status
```

---

## 🏭 Supplier Management API

### Base Service: `src/services/firebaseService.ts`

#### Save Supplier Data
```typescript
async supplierService.save(
  customerId: string,
  supplierSlug: string,
  supplierData: SupplierData
): Promise<string>

// Request
{
  customerId: "cust_001",
  supplierSlug: "pasta_fresca_srl",
  supplierData: {
    name: "Pasta Fresca S.r.l.",
    vatNumber: "IT98765432109",
    address: "Via Milano 10, Bologna",
    email: "ordini@pastafresca.it",
    phone: "+39 051 9876543",
    website: "www.pastafresca.it",
    products: [
      {
        code: "PF001",
        name: "Tagliatelle all'uovo",
        unit: "KG",
        price: 8.50,
        category: "pasta_fresca"
      }
    ],
    paymentTerms: "30gg FM",
    deliveryDays: ["lunedì", "mercoledì", "venerdì"],
    minimumOrder: 100.00
  }
}

// Response
"cust_001_pasta_fresca_srl" // Supplier ID
```

#### Get Suppliers by Customer
```typescript
async supplierService.getByCustomer(customerId: string): Promise<Record<string, SupplierData>>

// Request
"cust_001"

// Response
{
  "pasta_fresca_srl": {
    name: "Pasta Fresca S.r.l.",
    // ... supplier data
  },
  "ortofrutta_bio": {
    name: "Ortofrutta Bio Verdi",
    // ... supplier data
  }
}
```

---

## 📄 Document Management API

### Base Service: `src/services/firebaseService.ts`

#### Save Document
```typescript
async documentService.save(
  customerId: string,
  supplierSlug: string,
  documentType: DocumentType,
  documentId: string,
  documentData: any,
  file?: File
): Promise<string>

// Document Types
enum DocumentType {
  PDF = 'pdf',
  DDT = 'ddt',
  CATALOG = 'catalog',
  PRICE_LIST = 'priceList'
}

// Request Example (DDT)
{
  customerId: "cust_001",
  supplierSlug: "pasta_fresca_srl",
  documentType: "ddt",
  documentId: "ddt_20250115_001",
  documentData: {
    documentNumber: "2025/001",
    date: "2025-01-15",
    items: [
      {
        code: "PF001",
        description: "Tagliatelle all'uovo",
        quantity: 10,
        unit: "KG",
        price: 8.50,
        total: 85.00
      }
    ],
    totalAmount: 85.00,
    vatAmount: 8.50,
    grandTotal: 93.50
  },
  file: File // Optional PDF/image file
}

// Response
"ddt_20250115_001" // Document ID
```

#### Get Documents by Type
```typescript
async documentService.getByType(
  customerId: string,
  supplierSlug: string,
  documentType: DocumentType
): Promise<Document[]>

// Request
{
  customerId: "cust_001",
  supplierSlug: "pasta_fresca_srl",
  documentType: "ddt"
}

// Response
[
  {
    id: "ddt_20250115_001",
    documentNumber: "2025/001",
    date: "2025-01-15",
    totalAmount: 85.00,
    fileUrl: "https://storage.firebase.com/...",
    savedAt: "2025-01-15T10:30:00Z"
  }
]
```

---

## 🤖 SYD Intelligence API

### Base Service: `src/services/sydService.ts`

#### Save Conversation
```typescript
async sydService.saveConversation(
  message: string,
  response: string,
  context: any
): Promise<string | null>

// Request
{
  message: "Quali sono i prodotti più venduti questo mese?",
  response: "I prodotti più venduti sono: 1. Tagliatelle (150kg)...",
  context: {
    dataFiles: ["vendite_gennaio.xlsx"],
    simulatedDate: "2025-01-15",
    attachedFiles: []
  }
}

// Response
"conv_abc123" // Conversation ID
```

#### Get Recent Conversations
```typescript
async sydService.getRecentConversations(limit: number): Promise<SydConversation[]>

// Request
5 // Get last 5 conversations

// Response
[
  {
    id: "conv_abc123",
    message: "Quali sono i prodotti più venduti?",
    response: "I prodotti più venduti sono...",
    timestamp: "2025-01-15T14:30:00Z",
    useful: true,
    insights: ["Tagliatelle +30% vs mese scorso"]
  }
]
```

#### Save Insight
```typescript
async sydService.saveInsight(insight: SydInsight): Promise<string | null>

// Request
{
  type: "recommendation",
  title: "Opportunità riordino urgente",
  description: "Scorte Tagliatelle sotto soglia minima",
  data: {
    product: "Tagliatelle",
    currentStock: 5,
    minimumStock: 20,
    suggestedOrder: 50
  },
  priority: "high"
}

// Response
"insight_xyz789" // Insight ID
```

#### Build Context from History
```typescript
async sydService.buildContextFromHistory(): Promise<string>

// No parameters

// Response
"L'utente preferisce analisi summary. Focus principale su: marginalità, scorte.
Conversazioni recenti:
1. Analisi vendite gennaio (+15% vs dicembre)
2. Alert scorte pasta sotto minimo

Alert attivi:
- Scadenza prodotti lattiero-caseari entro 7gg
- Cliente Ristorante Roma in ritardo pagamenti"
```

---

## 🔍 Search API

### Base Service: `src/services/semanticSearchService.ts`

#### Semantic Search
```typescript
async searchDocuments(
  query: string,
  filters?: SearchFilters
): Promise<SearchResult[]>

// Request
{
  query: "fatture pasta gennaio 2025",
  filters: {
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    documentType: ["invoice", "ddt"],
    supplier: "pasta_fresca_srl"
  }
}

// Response
[
  {
    id: "doc_001",
    title: "Fattura 2025/001 - Pasta Fresca S.r.l.",
    snippet: "...fattura per fornitura pasta del 15/01/2025...",
    relevanceScore: 0.95,
    documentType: "invoice",
    date: "2025-01-15",
    metadata: {
      amount: 850.00,
      supplier: "Pasta Fresca S.r.l."
    }
  }
]
```

#### Analyze Query
```typescript
async analyzeQuery(query: string): Promise<QueryAnalysis>

// Request
"mostrami ordini pasta ultimi 30 giorni"

// Response
{
  intent: "search_orders",
  entities: {
    product: "pasta",
    timeframe: "30_days"
  },
  filters: {
    productCategory: "pasta",
    dateFrom: "2024-12-16",
    dateTo: "2025-01-15"
  },
  suggestedQueries: [
    "ordini pasta fresca ultimi 30 giorni",
    "fatture pasta ultimo mese"
  ]
}
```

---

## 📊 Excel Processing API

### Base Service: `src/services/llmForExcel.ts`

#### Process Excel with AI
```typescript
async processExcelWithAI(
  file: File,
  analysisType: string
): Promise<ExcelAnalysisResult>

// Request
{
  file: File, // Excel file
  analysisType: "sales_analysis" // or "inventory", "pricing", etc.
}

// Response
{
  summary: {
    totalRows: 1500,
    dateRange: "2025-01-01 to 2025-01-15",
    totalValue: 45000.00,
    uniqueProducts: 75,
    uniqueCustomers: 23
  },
  insights: [
    {
      type: "trend",
      description: "Vendite in crescita +15% vs periodo precedente",
      confidence: 0.92
    },
    {
      type: "anomaly",
      description: "Picco anomalo vendite il 10/01",
      confidence: 0.87
    }
  ],
  recommendations: [
    "Aumentare scorte per prodotti top 5",
    "Contattare clienti inattivi da 30+ giorni"
  ],
  charts: {
    salesTrend: [...], // Data for chart
    topProducts: [...],
    customerDistribution: [...]
  }
}
```

#### Export to Firebase
```typescript
async exportToFirebase(
  excelData: any[],
  collectionName: string,
  mapping: FieldMapping
): Promise<ImportResult>

// Request
{
  excelData: [
    {
      "Codice": "PROD001",
      "Descrizione": "Pasta di semola",
      "Prezzo": 2.50
    }
  ],
  collectionName: "products",
  mapping: {
    "Codice": "productCode",
    "Descrizione": "description",
    "Prezzo": "price"
  }
}

// Response
{
  success: true,
  imported: 150,
  failed: 2,
  errors: [
    {
      row: 45,
      error: "Missing required field: productCode"
    }
  ]
}
```

---

## 🔧 Utility Functions

### Error Handling
Tutte le API seguono questo pattern di error handling:

```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message,
    code: error.code
  };
}
```

### Authentication Headers
Tutte le chiamate API richiedono autenticazione Firebase:

```typescript
// Automaticamente gestito da Firebase SDK
const user = auth.currentUser;
if (!user) {
  throw new Error('User not authenticated');
}
// Token automaticamente incluso nelle chiamate Firestore
```

### Rate Limiting
```typescript
// Limiti API
- Firestore: 1 write/second per document
- Storage: 1GB/day upload
- Gemini AI: 60 requests/minute
- Search: 100 queries/minute
```

### Pagination
```typescript
// Pattern per paginazione
async getPaginated(
  startAfter?: DocumentSnapshot,
  limit: number = 20
): Promise<PaginatedResult> {
  const query = collection(db, 'items')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (startAfter) {
    query.startAfter(startAfter);
  }

  const snapshot = await query.get();

  return {
    items: snapshot.docs.map(doc => doc.data()),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === limit
  };
}
```

---

## 📝 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Error |

---

## 🚀 WebSocket Events (Real-time)

### Connection
```javascript
// Firebase Real-time listeners
const unsubscribe = onSnapshot(
  collection(db, 'orders'),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New order:', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified order:', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed order:', change.doc.id);
      }
    });
  }
);
```

### Events Available
- `order.created`
- `order.updated`
- `order.deleted`
- `document.uploaded`
- `alert.triggered`
- `insight.generated`

---

## 🔗 External Integrations

### MCP (Model Context Protocol)
```typescript
// Endpoint
const MCP_SSE_ENDPOINT = 'https://cloud.activepieces.com/api/v1/mcp/.../sse';

// Usage
const eventSource = new EventSource(MCP_SSE_ENDPOINT);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Process external data
};
```

### Google Gemini AI
```typescript
// Configuration
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Usage
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: { parts: promptParts },
  config: { systemInstruction: systemPrompt }
});
```

---

*API Documentation v1.2.0 - Gennaio 2025*
*Per supporto tecnico: dev@celerya.com*