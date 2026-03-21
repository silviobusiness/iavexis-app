import React, { createContext, useContext, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreUtils';

export type FeedbackType = 'positive' | 'negative' | 'text';

export interface FeedbackData {
  type: FeedbackType;
  content?: string;
  category?: string;
  associatedFunction?: string;
  chatId?: string;
  messageId?: string;
}

interface FeedbackContextType {
  submitFeedback: (data: FeedbackData) => Promise<void>;
  isSubmitting: boolean;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (data: FeedbackData) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...data,
        userId: user?.uid || 'guest-user',
        userEmail: profile?.email || 'convidado@iavexis.com',
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FeedbackContext.Provider value={{ submitFeedback, isSubmitting }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
