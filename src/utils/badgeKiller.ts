/**
 * BADGE KILLER - Elimina COMPLETAMENTE ogni badge dal DOM
 * Sistema ultra-aggressivo che previene qualsiasi creazione badge
 */

class BadgeKiller {
  private isActive = false;
  private observer: MutationObserver | null = null;

  /**
   * Attiva il sistema di eliminazione badge
   */
  activate() {
    if (this.isActive) return;
    this.isActive = true;

    console.log('🔥 BADGE KILLER ATTIVATO - Zero badge policy');

    // 1. CLEANUP IMMEDIATO
    this.nukeAllBadges();

    // 2. OBSERVER PER PREVENIRE NUOVE CREAZIONI
    this.startMutationObserver();

    // 3. CLEANUP RICORRENTE
    this.startRecurringCleanup();

    // 4. OVERRIDE METODI DI CREAZIONE
    this.overrideCreationMethods();
  }

  /**
   * Eliminazione totale di tutti i badge esistenti
   */
  private nukeAllBadges() {
    const badgeSelectors = [
      // IDs specifici
      '#error-interceptor-badge',
      '#live-stream-indicator',
      '#log-count',
      '#stream-status',
      '#error-count',

      // Pattern generici
      '[id*="badge"]',
      '[id*="indicator"]',
      '[id*="stream"]',
      '[id*="error"]',
      '[id*="log"]',
      '[class*="badge"]',
      '[class*="indicator"]',
      '[class*="stream"]',
      '[class*="error"]',

      // Stili specifici (elementi con position fixed)
      '[style*="position: fixed"]',
      '[style*="z-index: 999999"]',
      '[style*="z-index: 99999"]'
    ];

    let removed = 0;
    badgeSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          // Verifica che sia veramente un badge
          const style = window.getComputedStyle(el);
          const isFixedPosition = style.position === 'fixed';
          const hasHighZIndex = parseInt(style.zIndex) > 9999;
          const hasBadgeText = el.textContent?.toLowerCase().includes('log') ||
                              el.textContent?.toLowerCase().includes('error') ||
                              el.textContent?.toLowerCase().includes('stream');

          if (isFixedPosition || hasHighZIndex || hasBadgeText) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              removed++;
            }
          }
        });
      } catch (e) {
        // Silent fail
      }
    });

    if (removed > 0) {
      console.log(`🗑️ Badge Killer: Rimossi ${removed} badge`);
    }
  }

  /**
   * Observer per prevenire nuove creazioni
   */
  private startMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Controlla se è un badge
            if (this.isBadgeElement(element)) {
              console.log('🚫 Badge Killer: Prevenuta creazione badge', element);
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }

            // Controlla elementi figli
            element.querySelectorAll('*').forEach(child => {
              if (this.isBadgeElement(child)) {
                console.log('🚫 Badge Killer: Prevenuta creazione badge figlio', child);
                if (child.parentNode) {
                  child.parentNode.removeChild(child);
                }
              }
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Controlla se un elemento è un badge
   */
  private isBadgeElement(element: Element): boolean {
    const id = element.id?.toLowerCase() || '';
    // Fix: gestisce sia HTMLElement.className (string) che SVGElement.className (SVGAnimatedString)
    const className = typeof element.className === 'string'
      ? element.className.toLowerCase()
      : (element.className?.baseVal?.toLowerCase() || '');
    const textContent = element.textContent?.toLowerCase() || '';

    // Check ID patterns
    const badgeIdPatterns = ['badge', 'indicator', 'stream', 'error-count', 'log'];
    if (badgeIdPatterns.some(pattern => id.includes(pattern))) {
      return true;
    }

    // Check class patterns
    if (badgeIdPatterns.some(pattern => className.includes(pattern))) {
      return true;
    }

    // Check content patterns
    const badgeContentPatterns = ['streaming', 'logging', 'errori', 'active'];
    if (badgeContentPatterns.some(pattern => textContent.includes(pattern))) {
      return true;
    }

    // Check style patterns
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 9999) {
      return true;
    }

    return false;
  }

  /**
   * Cleanup ricorrente
   */
  private startRecurringCleanup() {
    setInterval(() => {
      this.nukeAllBadges();
    }, 2000); // Ogni 2 secondi
  }

  /**
   * Override metodi di creazione DOM
   */
  private overrideCreationMethods() {
    // Override createElement per prevenire badge
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string, options?: ElementCreationOptions) {
      const element = originalCreateElement.call(this, tagName, options);

      // Monitora quando viene settato l'ID
      Object.defineProperty(element, 'id', {
        set: function(value: string) {
          if (value && (value.includes('badge') || value.includes('indicator'))) {
            console.log('🚫 Badge Killer: Prevenuta creazione elemento con ID badge:', value);
            return; // Non settare l'ID
          }
          this.setAttribute('id', value);
        },
        get: function() {
          return this.getAttribute('id');
        }
      });

      return element;
    };

    // Override appendChild per badge prevention
    const self = this; // Cattura il riferimento alla BadgeKiller instance
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function<T extends Node>(newChild: T): T {
      if (newChild.nodeType === Node.ELEMENT_NODE) {
        const element = newChild as Element;
        if (self.isBadgeElement(element)) {
          console.log('🚫 Badge Killer: Prevenuto appendChild di badge');
          return newChild; // Fai finta di aver aggiunto ma non farlo
        }
      }
      return originalAppendChild.call(this, newChild);
    };
  }

  /**
   * Disattiva il sistema
   */
  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log('Badge Killer disattivato');
  }

  /**
   * Force cleanup manuale
   */
  forceCleanup() {
    this.nukeAllBadges();
  }
}

// Singleton instance
export const badgeKiller = new BadgeKiller();

// Auto-attiva in development
if (import.meta.env.DEV) {
  badgeKiller.activate();
}

// Esponi globalmente
(window as any).badgeKiller = badgeKiller;