/**
 * ERROR INTERCEPTOR - Sistema di cattura errori real-time
 * Intercetta TUTTI gli errori del browser e li logga
 */

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'console' | 'network' | 'firebase';
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  context?: any;
}

class ErrorInterceptor {
  private logs: ErrorLog[] = [];
  private isActive = false;
  private originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log
  };

  /**
   * Attiva il sistema di intercettazione
   */
  activate() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. INTERCETTA ERRORI GLOBALI
    window.addEventListener('error', (event) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno
      });
    });

    // 2. INTERCETTA PROMISE REJECTIONS
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Unhandled Promise: ${event.reason}`,
        stack: event.reason?.stack,
        context: event.reason
      });
    });

    // 3. INTERCETTA CONSOLE.ERROR
    console.error = (...args) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'console',
        message: args.map(a => String(a)).join(' '),
        context: args
      });
      this.originalConsole.error.apply(console, args);
    };

    // 4. INTERCETTA CONSOLE.WARN
    console.warn = (...args) => {
      this.logError({
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: args.map(a => String(a)).join(' '),
        context: args
      });
      this.originalConsole.warn.apply(console, args);
    };

    // 5. INTERCETTA FETCH PER ERRORI NETWORK
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.logError({
            timestamp: new Date().toISOString(),
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: String(args[0]),
            context: { status: response.status, url: args[0] }
          });
        }
        return response;
      } catch (error) {
        this.logError({
          timestamp: new Date().toISOString(),
          type: 'network',
          message: `Network error: ${error}`,
          url: String(args[0]),
          context: error
        });
        throw error;
      }
    };

    // 6. INTERCETTA ERRORI FIREBASE SPECIFICI
    this.interceptFirebaseErrors();

    console.log('🛡️ Error Interceptor ATTIVO - Tutti gli errori vengono catturati');
    this.showStatusBadge();
  }

  /**
   * Intercetta errori Firebase specifici
   */
  private interceptFirebaseErrors() {
    // Pattern per riconoscere errori Firebase
    const firebasePatterns = [
      'requires an index',
      'FirebaseError',
      'permission-denied',
      'PERMISSION_DENIED',
      'Failed to get document',
      'Firebase Storage'
    ];

    // Override console.error per catturare errori Firebase
    const originalError = this.originalConsole.error;
    console.error = (...args) => {
      const message = args.map(a => String(a)).join(' ');
      const isFirebaseError = firebasePatterns.some(pattern =>
        message.includes(pattern)
      );

      if (isFirebaseError) {
        this.logError({
          timestamp: new Date().toISOString(),
          type: 'firebase',
          message: message,
          context: args,
          stack: new Error().stack
        });
      }

      originalError.apply(console, args);
    };
  }

  /**
   * Logga un errore
   */
  private logError(error: ErrorLog) {
    this.logs.push(error);

    // Mantieni solo ultimi 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Salva in localStorage per persistenza
    this.saveToLocalStorage();

    // Invia al backend se configurato
    this.sendToBackend(error);

    // Aggiorna badge visuale
    this.updateStatusBadge();
  }

  /**
   * Salva logs in localStorage
   */
  private saveToLocalStorage() {
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.logs));
    } catch (e) {
      // localStorage pieno, pulisci vecchi logs
      this.logs = this.logs.slice(-50);
      localStorage.setItem('error_logs', JSON.stringify(this.logs));
    }
  }

  /**
   * Invia errore al backend (se configurato)
   */
  private async sendToBackend(error: ErrorLog) {
    // Se c'è un endpoint configurato, invia l'errore
    const endpoint = localStorage.getItem('error_endpoint');
    if (!endpoint) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silently fail, non vogliamo generare altri errori
    }
  }

  /**
   * Mostra badge di status
   */
  private showStatusBadge() {
    const badge = document.createElement('div');
    badge.id = 'error-interceptor-badge';
    badge.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-family: monospace;
        z-index: 999999;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        ✅ Logging: <span id="error-count">0</span> errori
      </div>
    `;

    document.body.appendChild(badge);

    // Click per vedere logs
    badge.addEventListener('click', () => {
      this.showLogs();
    });
  }

  /**
   * Aggiorna badge con conteggio errori
   */
  private updateStatusBadge() {
    const errorCount = document.getElementById('error-count');
    const badge = document.getElementById('error-interceptor-badge');

    if (errorCount) {
      const errors = this.logs.filter(l => l.type === 'error' || l.type === 'firebase').length;
      errorCount.textContent = String(errors);

      // Cambia colore se ci sono errori
      if (badge && errors > 0) {
        badge.firstElementChild!.setAttribute('style',
          badge.firstElementChild!.getAttribute('style')!.replace('#22c55e', '#ef4444')
        );
      }
    }
  }

  /**
   * Mostra tutti i logs in console
   */
  showLogs() {
    console.group('📊 ERROR INTERCEPTOR LOGS');
    this.logs.forEach((log, i) => {
      const emoji = {
        error: '❌',
        warning: '⚠️',
        console: '📝',
        network: '🌐',
        firebase: '🔥'
      }[log.type];

      console.group(`${emoji} [${i}] ${log.timestamp}`);
      console.log('Message:', log.message);
      if (log.stack) console.log('Stack:', log.stack);
      if (log.context) console.log('Context:', log.context);
      console.groupEnd();
    });
    console.groupEnd();

    // Mostra anche un summary
    this.showSummary();
  }

  /**
   * Mostra summary degli errori
   */
  showSummary() {
    const summary = {
      total: this.logs.length,
      errors: this.logs.filter(l => l.type === 'error').length,
      warnings: this.logs.filter(l => l.type === 'warning').length,
      firebase: this.logs.filter(l => l.type === 'firebase').length,
      network: this.logs.filter(l => l.type === 'network').length,
    };

    console.table(summary);

    // Errori Firebase specifici
    const firebaseErrors = this.logs.filter(l => l.type === 'firebase');
    if (firebaseErrors.length > 0) {
      console.group('🔥 FIREBASE ERRORS DETECTED:');
      firebaseErrors.forEach(err => {
        console.error(err.message);
        if (err.message.includes('requires an index')) {
          console.warn('⚡ FIX: Rimuovi orderBy dalla query o crea indice in Firebase Console');
        }
      });
      console.groupEnd();
    }
  }

  /**
   * Ottieni tutti i logs
   */
  getLogs(): ErrorLog[] {
    return this.logs;
  }

  /**
   * Pulisci tutti i logs
   */
  clearLogs() {
    this.logs = [];
    this.saveToLocalStorage();
    this.updateStatusBadge();
  }

  /**
   * Esporta logs come JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Configura endpoint per invio errori
   */
  setEndpoint(url: string) {
    localStorage.setItem('error_endpoint', url);
  }
}

// Singleton instance
export const errorInterceptor = new ErrorInterceptor();

// Auto-attiva in development
if (import.meta.env.DEV) {
  // Attiva dopo che il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      errorInterceptor.activate();
    });
  } else {
    errorInterceptor.activate();
  }
}

// Esponi globalmente per debug
(window as any).errorInterceptor = errorInterceptor;