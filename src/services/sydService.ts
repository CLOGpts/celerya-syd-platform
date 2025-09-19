import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Types
export interface SydConversation {
  id?: string;
  message: string;
  response: string;
  context: {
    dataFiles?: any[];
    simulatedDate?: string;
    attachedFiles?: any[];
  };
  timestamp: Timestamp;
  useful: boolean | null;
  insights?: string[];
}

export interface SydInsight {
  id?: string;
  type: 'pattern' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: Timestamp;
  actionTaken?: boolean;
}

export interface SydLearning {
  id?: string;
  pattern: string;
  frequency: number;
  lastSeen: Timestamp;
  userPreference?: string;
}

export interface UserProfile {
  preferredAnalysisStyle?: 'detailed' | 'summary' | 'visual';
  focusAreas?: string[];
  businessType?: string;
  commonQueries?: string[];
  lastActive?: Timestamp;
}

export const sydService = {
  // ============= CLEAR ALL CONVERSATIONS =============
  async clearAllConversations(): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No authenticated user');
        return false;
      }

      // Recupera tutte le conversazioni
      const q = query(
        collection(db, 'sydAnalysis', userId, 'conversations')
      );

      const snapshot = await getDocs(q);

      // Elimina ogni conversazione
      const deletePromises = snapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      console.log(`Eliminated ${snapshot.size} conversations`);
      return true;
    } catch (error) {
      console.error('Error clearing conversations:', error);
      return false;
    }
  },


  // ============= CONVERSATIONS =============

  // Salva una nuova conversazione
  async saveConversation(
    message: string,
    response: string,
    context: any
  ): Promise<string | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No authenticated user');
        return null;
      }

      const docRef = await addDoc(
        collection(db, 'sydAnalysis', userId, 'conversations'),
        {
          message,
          response,
          context,
          timestamp: serverTimestamp(),
          useful: null, // Per feedback futuro
          insights: [] // Insights estratti dalla conversazione
        }
      );

      console.log('Conversazione salvata:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Errore nel salvare conversazione:', error);
      return null;
    }
  },

  // Recupera conversazioni recenti per dare contesto
  async getRecentConversations(limitCount: number = 5): Promise<SydConversation[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const q = query(
        collection(db, 'sydAnalysis', userId, 'conversations'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SydConversation));
    } catch (error) {
      console.error('Errore nel recuperare conversazioni:', error);
      return [];
    }
  },

  // Aggiorna feedback su una conversazione
  async updateConversationFeedback(conversationId: string, useful: boolean): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await updateDoc(
        doc(db, 'sydAnalysis', userId, 'conversations', conversationId),
        {
          useful,
          feedbackTimestamp: serverTimestamp()
        }
      );

      console.log('Feedback aggiornato');
    } catch (error) {
      console.error('Errore nell\'aggiornare feedback:', error);
    }
  },

  // ============= INSIGHTS =============

  // Salva un insight importante identificato da SYD
  async saveInsight(insight: Omit<SydInsight, 'id' | 'timestamp'>): Promise<string | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const docRef = await addDoc(
        collection(db, 'sydAnalysis', userId, 'insights'),
        {
          ...insight,
          timestamp: serverTimestamp(),
          actionTaken: false
        }
      );

      console.log('Insight salvato:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Errore nel salvare insight:', error);
      return null;
    }
  },

  // Recupera insights non ancora actionati
  async getPendingInsights(): Promise<SydInsight[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const q = query(
        collection(db, 'sydAnalysis', userId, 'insights'),
        where('actionTaken', '==', false),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SydInsight));
    } catch (error) {
      console.error('Errore nel recuperare insights:', error);
      return [];
    }
  },

  // ============= LEARNING & PERSONALIZATION =============

  // Salva pattern di utilizzo per personalizzazione
  async updateLearningPattern(pattern: string, userPreference?: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const patternId = pattern.toLowerCase().replace(/\s+/g, '_');
      const docRef = doc(db, 'sydAnalysis', userId, 'learning', patternId);

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Incrementa frequenza se pattern già esiste
        const data = docSnap.data();
        await updateDoc(docRef, {
          frequency: (data.frequency || 0) + 1,
          lastSeen: serverTimestamp(),
          ...(userPreference && { userPreference })
        });
      } else {
        // Crea nuovo pattern
        await setDoc(docRef, {
          pattern,
          frequency: 1,
          lastSeen: serverTimestamp(),
          userPreference
        });
      }
    } catch (error) {
      console.error('Errore nell\'aggiornare learning pattern:', error);
    }
  },

  // Recupera profilo utente personalizzato
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const docRef = doc(db, 'sydAnalysis', userId, 'profile', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Errore nel recuperare profilo utente:', error);
      return null;
    }
  },

  // Aggiorna profilo utente
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const docRef = doc(db, 'sydAnalysis', userId, 'profile', 'main');

      await setDoc(docRef, {
        ...updates,
        lastActive: serverTimestamp()
      }, { merge: true });

      console.log('Profilo utente aggiornato');
    } catch (error) {
      console.error('Errore nell\'aggiornare profilo utente:', error);
    }
  },

  // ============= CONTEXTUAL MEMORY =============

  // Costruisce contesto da conversazioni precedenti
  async buildContextFromHistory(): Promise<string> {
    try {
      const recentConversations = await this.getRecentConversations(3);
      const userProfile = await this.getUserProfile();
      const pendingInsights = await this.getPendingInsights();

      let context = '';

      // Aggiungi preferenze utente
      if (userProfile) {
        if (userProfile.preferredAnalysisStyle) {
          context += `L'utente preferisce analisi ${userProfile.preferredAnalysisStyle}. `;
        }
        if (userProfile.focusAreas && userProfile.focusAreas.length > 0) {
          context += `Focus principale su: ${userProfile.focusAreas.join(', ')}. `;
        }
      }

      // Aggiungi conversazioni recenti rilevanti
      if (recentConversations.length > 0) {
        context += '\nConversazioni recenti rilevanti: ';
        recentConversations.forEach((conv, idx) => {
          if (conv.insights && conv.insights.length > 0) {
            context += `\n${idx + 1}. ${conv.insights.join(', ')}`;
          }
        });
      }

      // Aggiungi insights pendenti
      if (pendingInsights.length > 0) {
        context += '\n\nAlert e raccomandazioni attive: ';
        pendingInsights
          .filter(i => i.priority === 'high')
          .forEach(insight => {
            context += `\n- ${insight.title}: ${insight.description}`;
          });
      }

      return context;
    } catch (error) {
      console.error('Errore nel costruire contesto:', error);
      return '';
    }
  },

  // ============= ANALYTICS =============

  // Calcola statistiche di utilizzo
  async getUsageStats(): Promise<any> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      // Recupera tutte le conversazioni
      const q = query(
        collection(db, 'sydAnalysis', userId, 'conversations'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const conversations = snapshot.docs.map(doc => doc.data());

      // Calcola statistiche
      const stats = {
        totalConversations: conversations.length,
        usefulConversations: conversations.filter(c => c.useful === true).length,
        notUsefulConversations: conversations.filter(c => c.useful === false).length,
        pendingFeedback: conversations.filter(c => c.useful === null).length,
        averageResponseLength: conversations.reduce((acc, c) => acc + (c.response?.length || 0), 0) / conversations.length,
        mostCommonTopics: this.extractCommonTopics(conversations)
      };

      return stats;
    } catch (error) {
      console.error('Errore nel calcolare statistiche:', error);
      return null;
    }
  },

  // Estrae topic comuni dalle conversazioni
  extractCommonTopics(conversations: any[]): string[] {
    const topics = new Map<string, number>();
    const keywords = ['vendite', 'clienti', 'prodotti', 'margini', 'prezzi', 'ordini', 'fatturato', 'crescita'];

    conversations.forEach(conv => {
      const text = (conv.message + ' ' + conv.response).toLowerCase();
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          topics.set(keyword, (topics.get(keyword) || 0) + 1);
        }
      });
    });

    // Ordina per frequenza e ritorna top 5
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }
};

export default sydService;