import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreUtils';

export interface LibraryItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  folderId?: string;
  imageUrl?: string;
  description?: string;
  isFavorite?: boolean;
  tags?: string[];
  canvaUrl?: string;
  itemType?: 'asset' | 'reference' | 'template';
  sport?: string;
  style?: string;
  referenceType?: string;
  analysis?: {
    typography?: string;
    colors?: string;
    style?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface LibraryContextType {
  items: LibraryItem[];
  createItem: (itemData: Partial<LibraryItem>) => Promise<string>;
  updateItem: (id: string, data: Partial<LibraryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string, currentStatus: boolean) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'libraryItems')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryItem));
      // Sort by newest first
      fetchedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(fetchedItems);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'libraryItems');
    });

    return () => unsubscribe();
  }, []);

  const createItem = async (itemData: Partial<LibraryItem>) => {
    const now = new Date().toISOString();
    const newItem: any = {
      userId: 'guest-user',
      title: itemData.title || 'Untitled Asset',
      category: itemData.category || 'Uncategorized',
      folderId: itemData.folderId || null,
      imageUrl: itemData.imageUrl || '',
      description: itemData.description || '',
      isFavorite: itemData.isFavorite || false,
      tags: itemData.tags || [],
      canvaUrl: itemData.canvaUrl || '',
      itemType: itemData.itemType || 'asset',
      createdAt: now,
      updatedAt: now,
    };

    if (itemData.itemType === 'reference') {
      newItem.sport = itemData.sport || '';
      newItem.style = itemData.style || '';
      newItem.referenceType = itemData.referenceType || '';
      if (itemData.analysis) {
        newItem.analysis = itemData.analysis;
      }
    }

    try {
      const docRef = await addDoc(collection(db, 'libraryItems'), newItem);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'libraryItems');
      throw error;
    }
  };

  const updateItem = async (id: string, data: Partial<LibraryItem>) => {
    const itemRef = doc(db, 'libraryItems', id);
    try {
      await updateDoc(itemRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `libraryItems/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'libraryItems', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `libraryItems/${id}`);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    await updateItem(id, { isFavorite: !currentStatus });
  };

  return (
    <LibraryContext.Provider value={{ items, createItem, updateItem, deleteItem, toggleFavorite }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
