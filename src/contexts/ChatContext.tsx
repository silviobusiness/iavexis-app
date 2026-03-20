import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreUtils';

export interface Chat {
  id: string;
  userId: string;
  title: string;
  folderId?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isProject: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  duration?: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  parentId?: string | null;
  deleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  color?: string;
  icon?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  typography?: { weight?: string; transform?: string };
  order?: number;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  feedback: 'positive' | 'negative' | 'none';
  createdAt: string;
  isPinnedContext?: boolean;
  groundingMetadata?: any;
}

interface ChatContextType {
  chats: Chat[];
  folders: Folder[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  createChat: (title?: string, isProject?: boolean) => Promise<string>;
  updateChat: (id: string, data: Partial<Chat>) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  restoreFolder: (id: string) => Promise<void>;
  hardDeleteFolder: (id: string) => Promise<void>;
  duplicateFolder: (id: string, parentId?: string | null) => Promise<void>;
  sendMessage: (text: string, imageUrl?: string, base64Data?: string, mimeType?: string) => Promise<void>;
  toggleMessagePin: (messageId: string, isPinned: boolean) => Promise<void>;
  remixMessage: (messageId: string, option: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const chatsQuery = query(
      collection(db, 'chats')
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      const newChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // Sort client-side by updatedAt desc
      newChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setChats(newChats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    const foldersQuery = query(
      collection(db, 'folders')
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const newFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
      // Sort client-side by createdAt desc
      newFolders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFolders(newFolders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'folders');
    });

    return () => {
      unsubscribeChats();
      unsubscribeFolders();
    };
  }, []);

  const createChat = async (title = 'Novo Chat', isProject = false) => {
    const now = new Date().toISOString();
    const chatData = {
      userId: 'guest-user',
      title,
      isPinned: false,
      isFavorite: false,
      isProject,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      setActiveChatId(docRef.id);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
      throw error;
    }
  };

  const updateChat = async (id: string, data: Partial<Chat>) => {
    const chatRef = doc(db, 'chats', id);
    try {
      await updateDoc(chatRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${id}`);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'chats', id));
      if (activeChatId === id) setActiveChatId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${id}`);
    }
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    try {
      await addDoc(collection(db, 'folders'), {
        userId: 'guest-user',
        name,
        parentId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'folders');
    }
  };

  const updateFolder = async (id: string, data: Partial<Folder>) => {
    const folderRef = doc(db, 'folders', id);
    try {
      await updateDoc(folderRef, { ...data });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${id}`);
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await updateDoc(doc(db, 'folders', id), {
        deleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: 'guest-user',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${id}`);
    }
  };

  const restoreFolder = async (id: string) => {
    try {
      await updateDoc(doc(db, 'folders', id), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `folders/${id}`);
    }
  };

  const hardDeleteFolder = async (id: string) => {
    try {
      // Recursively delete subfolders and chats
      const subfolders = folders.filter(f => f.parentId === id);
      for (const folder of subfolders) {
        await hardDeleteFolder(folder.id);
      }
      const chatsInFolder = chats.filter(c => c.folderId === id);
      for (const chat of chatsInFolder) {
        await updateDoc(doc(db, 'chats', chat.id), { folderId: null });
      }
      await deleteDoc(doc(db, 'folders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `folders/${id}`);
    }
  };

  const duplicateFolder = async (id: string, parentId: string | null = null) => {
    try {
      const folderToDuplicate = folders.find(f => f.id === id);
      if (!folderToDuplicate) return;

      const newFolderData = {
        userId: 'guest-user',
        name: `${folderToDuplicate.name} (Cópia)`,
        parentId: parentId !== null ? parentId : folderToDuplicate.parentId,
        color: folderToDuplicate.color || null,
        icon: folderToDuplicate.icon || null,
        typography: folderToDuplicate.typography || null,
        createdAt: new Date().toISOString(),
      };

      const newFolderRef = await addDoc(collection(db, 'folders'), newFolderData);
      
      // Duplicate chats in this folder
      const chatsInFolder = chats.filter(c => c.folderId === id);
      for (const chat of chatsInFolder) {
        const newChatData = {
          userId: 'guest-user',
          title: `${chat.title} (Cópia)`,
          folderId: newFolderRef.id,
          isPinned: false,
          isFavorite: false,
          isProject: chat.isProject || false,
          tags: chat.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'chats'), newChatData);
      }

      // Recursively duplicate subfolders
      const subfolders = folders.filter(f => f.parentId === id);
      for (const subfolder of subfolders) {
        await duplicateFolder(subfolder.id, newFolderRef.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'folders');
    }
  };

  const sendMessage = async (text: string, imageUrl?: string, base64Data?: string, mimeType?: string) => {
    
    let targetChatId = activeChatId;
    if (!targetChatId) {
      targetChatId = await createChat('Nova Conversa', false);
    }

    const activeChat = chats.find(c => c.id === targetChatId);

    try {
      const userMessageData: any = {
        chatId: targetChatId,
        userId: 'guest-user',
        role: 'user',
        content: text,
        feedback: 'none',
        createdAt: new Date().toISOString(),
      };
      
      if (imageUrl) {
        userMessageData.imageUrls = [imageUrl];
      }

      try {
        await addDoc(collection(db, 'messages'), userMessageData);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
        throw error;
      }

      // Fetch previous messages for context
      // We also need to fetch PINNED messages from this chat
      const { getDocs } = await import('firebase/firestore');
      
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', targetChatId),
        orderBy('createdAt', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const allMessages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      // Filter for context: last 10 messages + any pinned messages
      const pinnedMessages = allMessages.filter(m => m.isPinnedContext && m.id !== allMessages[allMessages.length-1].id);
      const lastMessages = allMessages.slice(-11, -1); // Exclude the one we just added
      
      // Combine and remove duplicates
      const contextMessages = Array.from(new Set([...pinnedMessages, ...lastMessages]))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const imagePayload = base64Data && mimeType ? [{ base64: base64Data, mimeType }] : [];

      // Import generateChatResponse dynamically
      const { generateChatResponse } = await import('../services/geminiService');
      const { text: aiText, groundingMetadata } = await generateChatResponse(text, contextMessages, null, imagePayload, activeChat?.isProject);

      try {
        await addDoc(collection(db, 'messages'), {
          chatId: targetChatId,
          userId: 'guest-user',
          role: 'assistant',
          content: aiText,
          feedback: 'none',
          createdAt: new Date().toISOString(),
          groundingMetadata: groundingMetadata || null
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'messages');
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      await addDoc(collection(db, 'messages'), {
        chatId: targetChatId,
        userId: 'guest-user',
        role: 'assistant',
        content: `❌ Erro: ${error.message || 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'}`,
        feedback: 'none',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const toggleMessagePin = async (messageId: string, isPinned: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { isPinnedContext: isPinned });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${messageId}`);
    }
  };

  const remixMessage = async (messageId: string, option: string) => {
    if (!activeChatId) return;
    
    try {
      // Find the message to remix
      // We don't have messages state here, but we can fetch it or pass it
      // For simplicity, let's assume we fetch the message content
      // But actually, it's better to just trigger a new message with a specific prompt
      
      // We'll implement this by sending a hidden message to the AI
      const remixPrompts: Record<string, string> = {
        'Mais criativo': 'Reescreva sua última resposta de forma mais criativa, explorando conceitos inovadores e metáforas visuais impactantes.',
        'Mais direto': 'Reescreva sua última resposta de forma mais direta, concisa e objetiva, focando apenas no essencial.',
        'Mais detalhado': 'Reescreva sua última resposta com muito mais detalhes, explicando cada etapa técnica e fornecendo mais exemplos práticos.',
        'Versão premium': 'Reescreva sua última resposta com uma abordagem de design de alto nível (premium), focando em sofisticação, tipografia avançada e acabamento profissional.'
      };

      const prompt = remixPrompts[option] || `Reescreva sua última resposta com o estilo: ${option}`;
      await sendMessage(`[REMIX: ${option}] ${prompt}`);
    } catch (error) {
      console.error('Error remixing message:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      chats, folders, activeChatId, setActiveChatId,
      createChat, updateChat, deleteChat, createFolder, updateFolder, deleteFolder, restoreFolder, hardDeleteFolder, duplicateFolder, sendMessage,
      toggleMessagePin, remixMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
