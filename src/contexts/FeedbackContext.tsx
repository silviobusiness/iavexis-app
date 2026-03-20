import React, { createContext, useContext, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (data: FeedbackData) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...data,
        userId: 'guest-user',
        userEmail: 'convidado@iavexis.com',
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
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
