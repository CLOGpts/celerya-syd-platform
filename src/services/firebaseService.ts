import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Product, AnalyzedTransportDocument, Customer, SupplierData } from '../../types';

// Firestore Collections
const COLLECTIONS = {
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  DOCUMENTS: 'documents',
  SETTINGS: 'settings',
  USERS: 'users'
};

// Document Types
export enum DocumentType {
  PDF = 'pdf',
  DDT = 'ddt',
  CATALOG = 'catalog',
  PRICE_LIST = 'priceList'
}

// ============= CUSTOMER OPERATIONS =============
export const customerService = {
  // Create or update customer
  async save(customer: Customer) {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    await setDoc(docRef, {
      ...customer,
      updatedAt: serverTimestamp()
    });
    return customer.id;
  },

  // Get all customers
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Customer));
  },

  // Get single customer
  async getById(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    }
    return null;
  },

  // Delete customer
  async delete(customerId: string) {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
  }
};

// ============= SUPPLIER OPERATIONS =============
export const supplierService = {
  // Save supplier data
  async save(customerId: string, supplierSlug: string, supplierData: SupplierData) {
    const docRef = doc(db, COLLECTIONS.SUPPLIERS, `${customerId}_${supplierSlug}`);
    await setDoc(docRef, {
      ...supplierData,
      customerId,
      slug: supplierSlug,
      updatedAt: serverTimestamp()
    });
    return `${customerId}_${supplierSlug}`;
  },

  // Get suppliers for a customer
  async getByCustomer(customerId: string): Promise<Record<string, SupplierData>> {
    const q = query(
      collection(db, COLLECTIONS.SUPPLIERS),
      where('customerId', '==', customerId)
    );
    
    const querySnapshot = await getDocs(q);
    const suppliers: Record<string, SupplierData> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      suppliers[data.slug] = data as SupplierData;
    });
    
    return suppliers;
  },

  // Get single supplier
  async getOne(customerId: string, supplierSlug: string): Promise<SupplierData | null> {
    const docRef = doc(db, COLLECTIONS.SUPPLIERS, `${customerId}_${supplierSlug}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SupplierData;
    }
    return null;
  }
};

// ============= DOCUMENT OPERATIONS =============
export const documentService = {
  // Save document (PDF, DDT, Catalog, etc.)
  async save(
    customerId: string,
    supplierSlug: string,
    documentType: DocumentType,
    documentId: string,
    documentData: any,
    file?: File
  ) {
    try {
      if (!customerId || !supplierSlug || !documentId) {
        throw new Error('Missing required parameters');
      }

      let fileUrl = null;

      // Upload file to Storage if provided
      if (file) {
        const storageRef = ref(
          storage,
          `documents/${customerId}/${supplierSlug}/${documentType}/${documentId}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      // Save metadata to Firestore
      const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
      await setDoc(docRef, {
        ...documentData,
        customerId,
        supplierSlug,
        documentType,
        fileUrl,
        savedAt: serverTimestamp()
      });

      console.log('Document saved successfully:', documentId);
      return documentId;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },

  // Get documents by type
  async getByType(
    customerId: string,
    supplierSlug: string,
    documentType: DocumentType
  ): Promise<any[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.DOCUMENTS),
        where('customerId', '==', customerId),
        where('supplierSlug', '==', supplierSlug),
        where('documentType', '==', documentType)
      );

      const querySnapshot = await getDocs(q);
      // Client-side sort per evitare compound index
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return documents.sort((a, b) => {
        const aTime = a.savedAt?.toMillis() || 0;
        const bTime = b.savedAt?.toMillis() || 0;
        return bTime - aTime; // desc order
      });
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      return [];
    }
  },

  // Get single document
  async getById(documentId: string): Promise<any | null> {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  // Delete document
  async delete(documentId: string, fileUrl?: string) {
    // Delete from Firestore
    await deleteDoc(doc(db, COLLECTIONS.DOCUMENTS, documentId));
    
    // Delete from Storage if file exists
    if (fileUrl) {
      try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
      } catch (error) {
        console.error('Error deleting file from storage:', error);
      }
    }
  }
};

// ============= SETTINGS OPERATIONS =============
export const settingsService = {
  // Save user settings
  async save(userId: string, settings: any) {
    const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  },

  // Get user settings
  async get(userId: string): Promise<any | null> {
    const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }
};

// ============= MIGRATION FROM LOCALSTORAGE =============
export const migrationService = {
  // Migrate all data from localStorage to Firebase
  async migrateFromLocalStorage(userId: string) {
    try {
      // Get data from localStorage
      const customersData = localStorage.getItem('celerya_customers');
      const suppliersData = localStorage.getItem('celerya_suppliers_data');
      const schemaSettings = localStorage.getItem('celerya_schema_settings');
      
      if (customersData) {
        const customers = JSON.parse(customersData);
        // Migrate customers
        for (const customer of customers) {
          await customerService.save(customer);
        }
      }
      
      if (suppliersData) {
        const allSuppliersData = JSON.parse(suppliersData);
        // Migrate suppliers and documents
        for (const [customerSlug, customerData] of Object.entries(allSuppliersData) as any) {
          for (const [supplierSlug, supplierData] of Object.entries(customerData.suppliers) as [string, any][]) {
            // Save supplier
            await supplierService.save(customerSlug, supplierSlug, supplierData as SupplierData);
            
            // Migrate PDFs
            if (supplierData.pdfs) {
              for (const [pdfId, pdfData] of Object.entries(supplierData.pdfs)) {
                await documentService.save(
                  customerSlug,
                  supplierSlug,
                  DocumentType.PDF,
                  pdfId,
                  pdfData
                );
              }
            }
            
            // Migrate DDTs
            if (supplierData.ddts) {
              for (const [ddtId, ddtData] of Object.entries(supplierData.ddts)) {
                await documentService.save(
                  customerSlug,
                  supplierSlug,
                  DocumentType.DDT,
                  ddtId,
                  ddtData
                );
              }
            }
            
            // Migrate Catalogs
            if (supplierData.catalogs) {
              for (const [catalogId, catalogData] of Object.entries(supplierData.catalogs)) {
                await documentService.save(
                  customerSlug,
                  supplierSlug,
                  DocumentType.CATALOG,
                  catalogId,
                  catalogData
                );
              }
            }
            
            // Migrate Price Lists
            if (supplierData.priceLists) {
              for (const [priceListId, priceListData] of Object.entries(supplierData.priceLists)) {
                await documentService.save(
                  customerSlug,
                  supplierSlug,
                  DocumentType.PRICE_LIST,
                  priceListId,
                  priceListData
                );
              }
            }
          }
        }
      }
      
      if (schemaSettings) {
        const settings = JSON.parse(schemaSettings);
        await settingsService.save(userId, { schema: settings });
      }
      
      console.log('Migration completed successfully!');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }
};