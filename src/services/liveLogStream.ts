/**
 * LIVE LOG STREAMING - Invia TUTTI i log a un file locale per debug real-time
 * Permette a Claude di vedere TUTTO quello che succede nel browser
 */

import { errorInterceptor } from './errorInterceptor';

interface LogEntry {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'firebase' | 'network' | 'auth';
  message: string;
  data?: any;
  stack?: string;
  location?: string;
}

class LiveLogStream {
  private logs: LogEntry[] = [];
  private isStreaming = false;
  private streamEndpoint = ''; // DISABILITATO: Server locale per ricevere logs
  private fileOutput = true;
  private maxLogs = 500;

  // Salva console originali
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  /**
   * Attiva streaming completo
   */
  startStreaming() {
    if (this.isStreaming) return;
    this.isStreaming = true;

      // PULIZIA DOM AGGRESSIVA - Rimuovi TUTTI i badge esistenti
    this.cleanupAllBadges();

    // 1. INTERCETTA TUTTI I CONSOLE
    this.interceptConsole();

    // 2. INTERCETTA FIREBASE SPECIFICAMENTE
    this.interceptFirebase();

    // 3. INTERCETTA AUTH STATE
    this.interceptAuth();

    // 4. INTERCETTA NETWORK
    this.interceptNetwork();

    // 5. CREA FILE OUTPUT
    this.createFileOutput();

    // 6. INDICATORE VISUALE COMPLETAMENTE DISABILITATO
    // Badge permanentemente disabilitato

    console.log('🚀 LIVE LOG STREAMING ATTIVO - Tutti i log vengono catturati');
  }

  /**
   * Intercetta tutti i console.*
   */
  private interceptConsole() {
    // Console.log
    console.log = (...args) => {
      this.addLog({
        timestamp: new Date().toISOString(),
        type: 'log',
        message: args.map(a => this.stringify(a)).join(' '),
        data: args,
        location: this.getCallLocation()
      });
      this.originalConsole.log.apply(console, args);
    };

    // Console.error
    console.error = (...args) => {
      this.addLog({
        timestamp: new Date().toISOString(),
        type: 'error',
        message: args.map(a => this.stringify(a)).join(' '),
        data: args,
        stack: new Error().stack,
        location: this.getCallLocation()
      });
      this.originalConsole.error.apply(console, args);
    };

    // Console.warn
    console.warn = (...args) => {
      this.addLog({
        timestamp: new Date().toISOString(),
        type: 'warn',
        message: args.map(a => this.stringify(a)).join(' '),
        data: args,
        location: this.getCallLocation()
      });
      this.originalConsole.warn.apply(console, args);
    };

    // Console.info
    console.info = (...args) => {
      this.addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: args.map(a => this.stringify(a)).join(' '),
        data: args,
        location: this.getCallLocation()
      });
      this.originalConsole.info.apply(console, args);
    };
  }

  /**
   * Intercetta chiamate Firebase
   */
  private interceptFirebase() {
    // Pattern per identificare operazioni Firebase
    const firebasePatterns = [
      'Firebase',
      'Firestore',
      'collection',
      'doc',
      'setDoc',
      'getDoc',
      'getDocs',
      'onSnapshot',
      'auth',
      'signIn',
      'signOut',
      'requires an index',
      'permission-denied'
    ];

    // Monitora console per pattern Firebase
    const originalError = this.originalConsole.error;
    console.error = (...args) => {
      const message = args.map(a => this.stringify(a)).join(' ');
      const isFirebase = firebasePatterns.some(p => message.includes(p));

      if (isFirebase) {
        this.addLog({
          timestamp: new Date().toISOString(),
          type: 'firebase',
          message: `🔥 FIREBASE: ${message}`,
          data: args,
          stack: new Error().stack
        });
      }

      originalError.apply(console, args);
    };
  }

  /**
   * Intercetta Auth State Changes
   */
  private interceptAuth() {
    // Monitora auth state changes
    if (typeof window !== 'undefined' && (window as any).firebase) {
      const auth = (window as any).firebase.auth;
      if (auth && auth.onAuthStateChanged) {
        const original = auth.onAuthStateChanged.bind(auth);
        auth.onAuthStateChanged = (callback: any) => {
          const wrappedCallback = (user: any) => {
            this.addLog({
              timestamp: new Date().toISOString(),
              type: 'auth',
              message: `🔐 AUTH STATE: ${user ? `User ${user.uid} logged in` : 'User logged out'}`,
              data: user ? { uid: user.uid, email: user.email } : null
            });
            callback(user);
          };
          return original(wrappedCallback);
        };
      }
    }
  }

  /**
   * Intercetta Network Requests
   */
  private interceptNetwork() {
    // Intercetta fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = String(args[0]);
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        this.addLog({
          timestamp: new Date().toISOString(),
          type: 'network',
          message: `🌐 ${response.ok ? '✅' : '❌'} ${response.status} ${url} (${duration}ms)`,
          data: {
            url,
            status: response.status,
            duration,
            ok: response.ok
          }
        });

        return response;
      } catch (error) {
        this.addLog({
          timestamp: new Date().toISOString(),
          type: 'network',
          message: `🌐 ❌ FAILED: ${url} - ${error}`,
          data: { url, error: String(error) }
        });
        throw error;
      }
    };
  }

  /**
   * Crea output su file - SENZA INTERVAL BADGE
   */
  private createFileOutput() {
    // Salva logs in localStorage per persistenza - NO setInterval che potrebbe creare badge
    // setInterval completamente disabilitato per evitare interferenze badge

    // Salvataggio sincrono invece di interval
    if (this.logs.length > 0) {
      try {
        const logsJson = JSON.stringify(this.logs, null, 2);
        localStorage.setItem('live_logs', logsJson);

        // Crea anche un blob downloadable
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        (window as any).LIVE_LOGS_URL = url;
      } catch (e) {
        // Silent fail
      }
    }
  }

  /**
   * FUNZIONE COMPLETAMENTE DISABILITATA - Nessun badge verrà mai creato
   */
  // private showStreamIndicator() {
  //   // COMPLETAMENTE DISABILITATO - Badge rimosso permanentemente
  // }

  /**
   * Aggiungi log - Con cleanup automatico badge
   */
  private addLog(log: LogEntry) {
    this.logs.push(log);

    // Mantieni solo ultimi N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // CLEANUP BADGE AUTOMATICO ad ogni log
    this.cleanupAllBadges();

    // Stream to endpoint COMPLETAMENTE DISABILITATO per evitare errori console
    // NESSUNA connessione network sarà mai tentata
    // if (this.streamEndpoint) {
    //   this.streamToEndpoint(log);
    // }
  }

  /**
   * Stream to endpoint - COMPLETAMENTE DISABILITATO
   */
  private async streamToEndpoint(log: LogEntry) {
    // METODO COMPLETAMENTE DISABILITATO - Nessuna connessione network
    return;
  }

  /**
   * Download logs come file
   */
  downloadLogs() {
    const logsJson = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`📥 Downloaded ${this.logs.length} logs`);
  }

  /**
   * Get call location
   */
  private getCallLocation(): string {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        const relevantLine = lines[3] || lines[2]; // Skip this function and wrapper
        const match = relevantLine.match(/\((.*?)\)/);
        if (match) {
          return match[1];
        }
      }
    } catch (e) {
      // Silent
    }
    return 'unknown';
  }

  /**
   * Stringify safely
   */
  private stringify(obj: any): string {
    try {
      if (typeof obj === 'string') return obj;
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (obj instanceof Error) return obj.toString();
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Cleanup aggressivo di TUTTI i badge
   */
  private cleanupAllBadges() {
    // Rimuovi tutti i badge possibili
    const badgeSelectors = [
      '#live-stream-indicator',
      '#error-interceptor-badge',
      '[id*="badge"]',
      '[id*="indicator"]',
      '[id*="stream"]',
      '[class*="badge"]',
      '[class*="indicator"]'
    ];

    badgeSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    });
  }

  /**
   * Show summary in console
   */
  showSummary() {
    console.group('📊 LIVE STREAM SUMMARY');

    const summary = {
      total: this.logs.length,
      errors: this.logs.filter(l => l.type === 'error').length,
      warnings: this.logs.filter(l => l.type === 'warn').length,
      firebase: this.logs.filter(l => l.type === 'firebase').length,
      network: this.logs.filter(l => l.type === 'network').length,
      auth: this.logs.filter(l => l.type === 'auth').length
    };

    console.table(summary);

    // Mostra ultimi errori
    const errors = this.logs.filter(l => l.type === 'error').slice(-5);
    if (errors.length > 0) {
      console.group('❌ ULTIMI ERRORI:');
      errors.forEach(e => console.error(e.message));
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Singleton instance
export const liveLogStream = new LiveLogStream();

// Auto-start in development
if (import.meta.env.DEV) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      liveLogStream.startStreaming();
    });
  } else {
    liveLogStream.startStreaming();
  }
}

// Esponi globalmente
(window as any).liveLogStream = liveLogStream;