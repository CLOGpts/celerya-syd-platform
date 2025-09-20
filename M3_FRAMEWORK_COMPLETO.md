# 🧠 M³ FRAMEWORK - MANUALE OPERATIVO COMPLETO
*Il Sistema di Ragionamento al Cubo per Problem Solving Ottimale*

---

## 📖 INDICE
1. [Cos'è M³](#cosè-m³)
2. [Architettura del Ragionamento](#architettura-del-ragionamento)
3. [Il Team Virtuale](#il-team-virtuale)
4. [Le Formule Matematiche](#le-formule-matematiche)
5. [Workflow Pratico](#workflow-pratico)
6. [Esempi Concreti](#esempi-concreti)
7. [Quick Start per Claude](#quick-start-per-claude)

---

## 🎯 COS'È M³

M³ (Emme al Cubo) è un framework di problem-solving che **divide il ragionamento in 3×3×3 = 27 micro-prospettive** per garantire soluzioni ottimali.

### Principi Fondamentali:
- **Micro-passi**: Mai più di 20 righe di codice per volta
- **Specializzazione**: 3 agenti esperti in domini diversi
- **Misurabilità**: Formula Φ che garantisce convergenza
- **Reversibilità**: Ogni azione può essere annullata

---

## 🏗️ ARCHITETTURA DEL RAGIONAMENTO

### LIVELLO 1: L'ORCHESTRATORE
```
            🧠 CLAUDE (Tu)
                 |
         [Identifica Problema]
                 |
          [Attiva Framework M³]
```

### LIVELLO 2: LA TRIADE DI SPECIALISTI
```
               CLAUDE
              /   |   \
           /      |      \
    🛡️ GUARDIANO  🏛️ ARCHITETTO  🔪 CHIRURGO
    (Test/Debug)  (Backend/API)  (Frontend/UX)
```

### LIVELLO 3: DIVISIONE INTERNA (×3)
```
    Ogni Specialista internamente usa:
    ┌─────────────────────────┐
    │  1. BUILDER (propone)   │
    │  2. CHECKER (verifica)  │
    │  3. DECIDER (decide)    │
    └─────────────────────────┘
```

### LIVELLO 4: I BIAS (×3)
```
    Ogni sub-componente applica 3 bias:
    • Bias 1: es. Velocità
    • Bias 2: es. Sicurezza
    • Bias 3: es. Semplicità

    = 3×3×3 = 27 micro-decisioni → 1 output ottimale
```

---

## 👥 IL TEAM VIRTUALE

### 🛡️ IL GUARDIANO - Test & Debug Specialist
```yaml
Ruolo: Sentinella della qualità
Specialità:
  - Console monitoring
  - Error tracking
  - Memory leaks detection
  - Performance analysis
  - Test coverage

Strumenti preferiti:
  - Bash, Grep, Read
  - Console.log analysis
  - Network inspection

Oracoli:
  - Zero errori console
  - TypeScript clean
  - No memory leaks
  - API response < 100ms

Workflow:
  1. PATROL: Monitora sistema
  2. DETECT: Identifica anomalie
  3. ISOLATE: Riproduce bug
  4. ELIMINATE: Fix preciso
  5. FORTIFY: Previeni recidive
```

### 🏛️ L'ARCHITETTO - Backend & Integration Master
```yaml
Ruolo: Maestro delle fondamenta
Specialità:
  - Firebase/Firestore
  - API integration
  - Database optimization
  - Security patterns
  - Error handling

Strumenti preferiti:
  - MultiEdit, Write
  - Database queries
  - API endpoints

Oracoli:
  - Data integrity
  - Zero secrets exposed
  - Query < 100ms
  - Atomic transactions

Workflow:
  1. BLUEPRINT: Analizza struttura
  2. FOUNDATION: Patch servizi core
  3. INTEGRATION: Collega API/DB
  4. STRESS TEST: Verifica load
  5. DOCUMENTATION: Schema tracking
```

### 🔪 IL CHIRURGO - Frontend & UX Specialist
```yaml
Ruolo: Precisione nell'interfaccia
Specialità:
  - React components
  - UI/UX refinement
  - Dark mode consistency
  - Responsive design
  - Accessibility

Strumenti preferiti:
  - Edit, Read
  - Component inspection
  - CSS optimization

Oracoli:
  - Zero white elements (dark mode)
  - Responsive 3 breakpoints
  - Render < 16ms
  - TypeScript clean

Workflow:
  1. DIAGNOSIS: Analizza componente
  2. INCISION: Patch minima UI
  3. SUTURE: Visual consistency
  4. TEST: Verifica rendering
  5. REPORT: UX improvements
```

---

## 🔢 LE FORMULE MATEMATICHE

### Formula del Potenziale di Missione
```
Φ(s) = G(s) + Σⱼ μⱼ · ReLU(Cⱼ(s))

Dove:
- Φ(s) = Energia totale del problema
- G(s) = Distanza dall'obiettivo (KPI)
- Cⱼ = Vincoli (oracoli)
- μⱼ = Pesi dei vincoli
- ↓Φ significa avvicinamento alla soluzione
```

### Formula di Costo per Proposta
```
L(pᵢ) = [Φ(T(s_t, pᵢ)) − Φ(s_t)] + Σₖ wₖ·Rₖ(pᵢ) + λ·D(pᵢ, H)

Dove:
- L(pᵢ) = Costo della proposta i
- T(s,p) = Transizione stato dopo patch p
- Rₖ = Regolarizzatori (size, latency, risk)
- D = Distanza da tentativi falliti H
- λ = Peso penalità
```

### Selezione Robusta
```
p*_t = argmin_{pᵢ ammissibili} max(L(pᵢ), λ·D(pᵢ, H))

Sceglie la proposta che minimizza il worst case
```

### Passo Relativistico
```
ΔΦ_eff = ΔΦ / √(1 + (ΔΦ/c)²)

Dove c = 20 righe (limite micro-passo)
Previene patch troppo grandi
```

---

## 🔄 WORKFLOW PRATICO

### FORMATO OBBLIGATORIO PER OGNI CICLO

```markdown
### 1) TARGET STEP
[Una frase - ambito unico]

### 2) BIAS TRIADE
[3 parole es: Velocità · Sicurezza · Chiarezza]

### 3) BUILDER → ARTEFATTO MINIMO
[Codice/azione ≤20 righe]

### 4) CHECKER → VERIFICHE MISURABILI
- Check 1: [cosa verificare]
- Check 2: [metrica attesa]
- Check 3: [test da eseguire]
EXPECTED: [risultato atteso]

### 5) DECIDER
OK se [condizione]; NO → [correzione singola]

### 6) M³ LOG
- Φ(s_t)→Φ(s_{t+1}): [valore]→[valore]
- Oracoli: [✓/✗ per ogni vincolo]
- Prossima mossa: [1 riga]
```

---

## 💡 ESEMPI CONCRETI

### ESEMPIO 1: Fix Firebase Index Error

```markdown
DESIDERIO: Risolvere "Firebase query requires index"

### DECOMPOSIZIONE M³:

1) GUARDIANO trova errore:
   - Linea: sydService.ts:221
   - Query: where() + orderBy() needs index

2) ARCHITETTO propone fix:
   - Rimuovi orderBy dalla query
   - Implementa client-side sort
   - Patch: 15 righe

3) CHIRURGO verifica UI:
   - Nessun impatto visuale
   - Performance OK

RISULTATO: Φ: 10→0 in 3 micro-passi
```

### ESEMPIO 2: Gemini API Integration

```markdown
DESIDERIO: Integrare Gemini 2.5 Flash

### DECOMPOSIZIONE M³:

1) ARCHITETTO installa:
   npm install @google/generative-ai

2) CHIRURGO aggiorna imports:
   - SupplierDashboard.tsx
   - DataViewPage.tsx
   - DashboardPage.tsx

3) GUARDIANO verifica:
   - Console: zero errori
   - API calls: success
   - Response time: <2s

RISULTATO: Φ: 15→0 in 4 micro-passi
```

---

## 🚀 QUICK START PER CLAUDE

### ATTIVAZIONE IMMEDIATA

```markdown
Per attivare M³ su un problema, copia questo template:

==========================
DESIDERIO: [cosa vuoi ottenere in 1 riga]

APPLICA M³ con:
- Micro-passi ≤20 righe
- Team: Guardiano, Architetto, Chirurgo
- Formula Φ per misurare progresso
- Output nel formato standard

KPI: Zero errori, sistema funzionante
==========================
```

### COMANDO RAPIDO PER TEAM

```markdown
@agent-il-guardiano → Debug e test
@agent-l-architetto → Backend e structure
@agent-il-chirurgo → Frontend e UX

Con @comunicazioni.txt attivi il framework completo
```

---

## 📊 METRICHE DI SUCCESSO

### Come Misurare il Progresso

```python
# Φ decresce → ti avvicini alla soluzione
Φ_iniziale = 10  # Problema grande
Φ_step1 = 7      # Primo fix
Φ_step2 = 3      # Secondo fix
Φ_finale = 0     # RISOLTO!

# Se Φ non scende per 3 cicli → Piano B
if stuck_count >= 3:
    propose_simpler_alternative()
```

### KPI Universali
- **Correttezza**: Output coerente con requisiti
- **Sicurezza**: Zero secrets/vulnerabilità
- **Performance**: Tempo risposta < soglia
- **Robustezza**: Gestisce edge cases

---

## 🎓 CONCETTI AVANZATI

### Anti-Bias Parity
```
Per bias b, valuta anche -b
Scegli solo se ENTRAMBI rispettano oracoli
Esempio: Velocità vs Accuratezza
```

### Multi-Scale Reasoning
```
MACRO: Strategia generale
MESO: Tattiche per componenti
MICRO: Singole linee di codice
```

### Convergenza Garantita
```
La formula Φ con vincoli convessi
garantisce sempre un minimo globale
= soluzione trovata
```

---

## 🔧 TIPS & TRICKS

### DO ✅
- Sempre micro-passi ≤20 righe
- Un solo ambito per ciclo (FE o BE, mai entrambi)
- Misura tutto con metriche
- Documenta decisioni in M³ LOG
- Usa reversibilità per esperimenti

### DON'T ❌
- Mai patch > 20 righe
- Mai mixare frontend + backend stesso ciclo
- Mai procedere senza verifiche
- Mai ignorare oracoli/vincoli
- Mai più di 3 tentativi stesso approccio

---

## 📝 NOTE PER IMPLEMENTATORI

### Per Altri Claude/LLM

1. **Carica** questo file all'inizio sessione
2. **Identifica** il team virtuale nei file .claude/agents/
3. **Applica** il formato rigidamente
4. **Misura** sempre con Φ
5. **Documenta** decisioni in ADR finale

### Integrazione con Tool

```yaml
Guardiano usa: Bash, Grep, BashOutput, KillShell
Architetto usa: MultiEdit, Write, Task
Chirurgo usa: Edit, Read, WebFetch
```

---

## 🎯 CONCLUSIONE

M³ trasforma problemi complessi in sequenze di micro-problemi risolvibili.

**Formula del successo**:
```
Grande Problema → 3 Specialisti → 3 Sub-agenti → 3 Bias
= 27 prospettive → 1 soluzione ottimale
```

**Ricorda**: La potenza sta nella **decomposizione strutturata** e nella **misurabilità continua** del progresso.

---

*Documento creato da Claude usando M³ Framework*
*Versione: 1.0*
*Data: Gennaio 2025*
*Testato su: Celerya SYD Platform*

---

## 🔗 APPENDICE: COMUNICAZIONI.TXT ORIGINALE

[Il file comunicazioni.txt contiene il prompt originale con formule e vincoli]

Per attivazione rapida:
```
@comunicazioni.txt + @M3_FRAMEWORK_COMPLETO.md = Sistema Completo
```

---

**END OF DOCUMENT**