/**
 * TEST SUITE FIREBASE PERSISTENCE
 * Verifica salvataggio documenti e conversazioni SYD
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { sydService } from '../src/services/sydService';
import { firebaseService } from '../src/services/firebaseService';

// Config Firebase (usa le tue credenziali da .env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

// Test Suite
class FirebasePersistenceTest {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 AVVIO TEST SUITE FIREBASE PERSISTENCE');
    console.log('=' .repeat(50));

    await this.testAuth();
    await this.testSydConversationSave();
    await this.testDocumentSave();
    await this.testSupplierDataSave();
    await this.testQueryPerformance();

    this.printResults();
  }

  async testAuth() {
    try {
      // Test con credenziali demo (sostituisci con le tue)
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        'test@example.com',
        'password123'
      );

      this.testResults.push({
        test: 'Firebase Auth',
        status: '✅ PASS',
        details: `User: ${userCredential.user.uid}`
      });
    } catch (error) {
      this.testResults.push({
        test: 'Firebase Auth',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }

  async testSydConversationSave() {
    try {
      const testData = {
        userMessage: 'Test persistenza SYD',
        response: 'Risposta AI test',
        context: { test: true, timestamp: new Date() }
      };

      const result = await sydService.saveConversation(
        testData.userMessage,
        testData.response,
        testData.context
      );

      this.testResults.push({
        test: 'SYD Conversation Save',
        status: result ? '✅ PASS' : '❌ FAIL',
        details: result ? 'Saved to sydAnalysis' : 'Save failed'
      });
    } catch (error) {
      this.testResults.push({
        test: 'SYD Conversation Save',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }

  async testDocumentSave() {
    try {
      const testDocument = {
        name: 'test-document.pdf',
        type: 'DDT',
        supplier: 'Test Supplier',
        uploadDate: new Date(),
        size: 1024,
        content: 'Test content for document'
      };

      const docRef = await firebaseService.documentService.save(testDocument);

      this.testResults.push({
        test: 'Document Save',
        status: docRef ? '✅ PASS' : '❌ FAIL',
        details: docRef ? `Doc ID: ${docRef.id}` : 'Save failed'
      });
    } catch (error) {
      this.testResults.push({
        test: 'Document Save',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }

  async testSupplierDataSave() {
    try {
      const testSupplier = {
        name: 'Test Fornitore',
        email: 'fornitore@test.com',
        catalogo: [],
        analysisResults: {
          summary: 'Test analysis',
          timestamp: new Date()
        }
      };

      const supplierRef = await firebaseService.supplierService.create(testSupplier);

      this.testResults.push({
        test: 'Supplier Data Save',
        status: supplierRef ? '✅ PASS' : '❌ FAIL',
        details: supplierRef ? `Supplier ID: ${supplierRef.id}` : 'Save failed'
      });
    } catch (error) {
      this.testResults.push({
        test: 'Supplier Data Save',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }

  async testQueryPerformance() {
    try {
      const startTime = Date.now();

      // Test query senza index (client-side sort)
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('No auth user');

      const q = query(
        collection(this.db, 'sydAnalysis', userId, 'insights'),
        where('actionTaken', '==', false)
      );

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side sort
      docs.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return bTime - aTime;
      });

      const queryTime = Date.now() - startTime;

      this.testResults.push({
        test: 'Query Performance (No Index)',
        status: queryTime < 1000 ? '✅ PASS' : '⚠️ SLOW',
        details: `${queryTime}ms - ${docs.length} docs`
      });
    } catch (error) {
      this.testResults.push({
        test: 'Query Performance',
        status: '❌ FAIL',
        details: error.message
      });
    }
  }

  printResults() {
    console.log('\n📊 RISULTATI TEST');
    console.log('=' .repeat(50));

    this.testResults.forEach(result => {
      console.log(`\n${result.test}`);
      console.log(`Status: ${result.status}`);
      console.log(`Details: ${result.details}`);
    });

    const passed = this.testResults.filter(r => r.status.includes('✅')).length;
    const failed = this.testResults.filter(r => r.status.includes('❌')).length;

    console.log('\n' + '=' .repeat(50));
    console.log(`TOTALE: ${passed} PASSED, ${failed} FAILED`);

    if (failed === 0) {
      console.log('🎉 TUTTI I TEST PASSATI!');
    } else {
      console.log('⚠️ ALCUNI TEST FALLITI - VERIFICA I DETTAGLI');
    }
  }
}

// Esegui test
const tester = new FirebasePersistenceTest();
tester.runAllTests().catch(console.error);

export default FirebasePersistenceTest;