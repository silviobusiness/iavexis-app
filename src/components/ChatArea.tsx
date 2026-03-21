import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreUtils';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Image as ImageIcon, Mic, Wand2, Library, Paperclip, X, MessageSquare, Search, ChevronUp, ChevronDown, WholeWord, CaseSensitive, Zap, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { MessageBubble } from './MessageBubble';
import { PremiumChatInput } from './PremiumChatInput';
import { PromptExtractorModal } from './PromptExtractorModal';
import { ThinkingIndicator } from './ThinkingIndicator';
import { StreamingMessage } from './StreamingMessage';
import { motion, AnimatePresence } from 'framer-motion';
import { generateChatResponse, improvePrompt, autoCorrectText } from '../services/geminiService';
import Mark from 'mark.js';
import { CommandCenter } from './CommandCenter';
import { ShortcutHelpOverlay } from './ShortcutHelpOverlay';
import { useShortcuts } from '../contexts/ShortcutContext';
import { copyToClipboard } from '../utils/clipboard';
import { useLibrary } from '../contexts/LibraryContext';
import { useGrowth } from '../contexts/GrowthContext';

export function ChatArea({ onToggleLibrary, isLibraryOpen }: { onToggleLibrary: () => void, isLibraryOpen: boolean }) {
  const { activeChatId, chats } = useChat();
  const { user, profile } = useAuth();
  const userId = user?.uid || 'guest-user';
  const { shortcuts, setIsHelpOpen } = useShortcuts();
  const { createItem } = useLibrary();
  const { createSuggestion } = useGrowth();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [imageFiles, setImageFiles] = useState<{ url: string, base64: string, mimeType: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isPromptExtractorOpen, setIsPromptExtractorOpen] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [isInstantMode, setIsInstantMode] = useState(() => localStorage.getItem('isInstantMode') === 'true');
  const [currentGroundingMetadata, setCurrentGroundingMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const markInstance = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = async (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setInterimText(interimTranscript);

        if (finalTranscript) {
          // Auto-correct the final transcript before appending
          const correctedTranscript = await autoCorrectText(finalTranscript);
          setInput(prev => prev + (prev ? ' ' : '') + correctedTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error', event.error);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // Exception for Ctrl + / (Help)
        if (e.ctrlKey && e.key === '/') {
          e.preventDefault();
          setIsHelpOpen(true);
        }
        return;
      }

      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === e.key.toLowerCase() && 
        s.ctrlKey === e.ctrlKey && 
        s.shiftKey === e.shiftKey && 
        s.altKey === e.altKey
      );

      if (shortcut) {
        e.preventDefault();
        handleAction(shortcut.id);
      }

      // Help overlay shortcut
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [shortcuts, messages, activeChatId, input]);

  const handleAction = async (actionId: string) => {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    
    switch (actionId) {
      case 'copy':
        if (lastAI) {
          const success = await copyToClipboard(lastAI.content);
          if (success) {
            setError('Conteúdo copiado!');
            setTimeout(() => setError(null), 2000);
          }
        }
        break;
      case 'save':
        if (lastAI) {
          await createItem({
            title: `Resposta IA - ${new Date().toLocaleDateString()}`,
            category: 'Referência',
            description: lastAI.content.substring(0, 100) + '...',
            imageUrl: lastAI.imageUrls?.[0] || 'https://picsum.photos/seed/ai/400/300',
            tags: ['IA', 'Chat'],
            itemType: 'reference'
          });
          setError('Salvo na biblioteca!');
          setTimeout(() => setError(null), 2000);
        }
        break;
      case 'explain':
        setInput('Pode me explicar isso com mais detalhes?');
        break;
      case 'example':
        setInput('Pode me dar um exemplo prático disso?');
        break;
      case 'deepen':
        setInput('Gostaria de aprofundar mais nesse assunto. Pode continuar?');
        break;
      case 'extract':
        if (lastAI) {
          setLastAIResponse(lastAI.content);
          setIsPromptExtractorOpen(true);
        }
        break;
      case 'improve':
        if (input.trim()) {
          setIsImproving(true);
          try {
            const improved = await improvePrompt(input);
            setInput(improved);
          } catch (err) {
            console.error(err);
          } finally {
            setIsImproving(false);
          }
        }
        break;
    }
  };

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChatId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid composite index requirement
      msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, streamingContent]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 800 * 1024; // 800KB limit for Firestore documents

    if (files.length > 0) {
      files.forEach(file => {
        if (file.size > maxSize) {
          setError(`A imagem "${file.name}" é muito grande. O limite é 800KB.`);
          setTimeout(() => setError(null), 5000);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setImageFiles(prev => [...prev, {
            url: base64String,
            mimeType: file.type,
            base64: base64String.split(',')[1] // Keep raw base64 for Gemini API
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    localStorage.setItem('isInstantMode', String(isInstantMode));
  }, [isInstantMode]);

  const handleSend = async () => {
    if ((!input.trim() && imageFiles.length === 0) || !activeChatId) return;
    if (isGenerating || isThinking || streamingContent) return;

    const rawUserMessage = input.trim();
    const currentImages = [...imageFiles];
    
    // Check total size of images to prevent Firestore 1MB limit (approx 1M characters in base64)
    const totalImageSize = currentImages.reduce((acc, img) => acc + img.url.length, 0);
    if (totalImageSize > 1000000) {
      setError('O total de imagens é muito grande. Tente enviar menos imagens por vez.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setInput('');
    setImageFiles([]);
    setIsGenerating(true);
    setIsThinking(true);

    try {
      // Capture history BEFORE adding the new user message
      const historyBefore = [...messages];

      // Save user message immediately so user sees it
      const userMessageData: any = {
        chatId: activeChatId,
        userId: userId,
        role: 'user',
        content: rawUserMessage,
        feedback: 'none',
        createdAt: new Date().toISOString(),
      };
      
      if (currentImages.length > 0) {
        userMessageData.imageUrls = currentImages.map(img => img.url);
      }

      await addDoc(collection(db, 'messages'), userMessageData);

      // Artificial delay for "thinking" feel
      if (!isInstantMode) {
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
      }

      // Generate AI response
      const imagePayload = currentImages.map(img => ({
        base64: img.base64,
        mimeType: img.mimeType
      }));

      const { text: aiText, groundingMetadata } = await generateChatResponse(rawUserMessage, historyBefore, profile, imagePayload, activeChat?.isProject);
      
      setIsThinking(false);
      setCurrentGroundingMetadata(groundingMetadata);

      if (isInstantMode) {
        await saveAIMessage(aiText, groundingMetadata);
      } else {
        setStreamingContent(aiText);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsThinking(false);
      await saveAIMessage(`❌ Erro: ${error.message || 'Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAIMessage = async (content: string, groundingMetadata?: any) => {
    if (!content) return;
    
    // Detect and extract suggestions
    const suggestionMatch = content.match(/\[CREATE_SUGGESTION:\s*({.*?})\]/s);
    if (suggestionMatch) {
      try {
        const suggestionData = JSON.parse(suggestionMatch[1]);
        await createSuggestion(suggestionData);
        // Clean the content for display
        content = content.replace(/\[CREATE_SUGGESTION:\s*({.*?})\]/s, '').trim();
      } catch (e) {
        console.error('Error parsing suggestion:', e);
      }
    }

    // Capture metadata and content locally
    const metadata = groundingMetadata || currentGroundingMetadata;
    
    // Clear streaming states immediately to prevent UI duplication
    setStreamingContent(null);
    setCurrentGroundingMetadata(null);
    
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: activeChatId,
        userId: userId,
        role: 'assistant',
        content: content,
        feedback: 'none',
        createdAt: new Date().toISOString(),
        groundingMetadata: metadata || null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const handleImprovePrompt = async () => {
    if (!input.trim() || isImproving) return;
    setIsImproving(true);
    try {
      const improved = await improvePrompt(input);
      setInput(improved);
    } catch (error) {
      console.error('Error improving prompt:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const handleExtractPrompt = () => {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) {
      alert('Nenhuma resposta disponível para extrair');
      return;
    }
    setLastAIResponse(lastAI.content);
    setIsPromptExtractorOpen(true);
  };

  const handleSearchInChat = (text: string) => {
    setIsSearchOpen(true);
    setSearchQuery(text);
  };

  const handleInsertText = (text: string) => {
    setInput(text);
    // Focus the textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (!markInstance.current) {
      markInstance.current = new Mark(chatContainerRef.current);
    }

    const highlight = () => {
      markInstance.current.unmark({
        className: 'search-highlight',
        done: () => {
          if (searchQuery.trim() && isSearchOpen) {
            markInstance.current.mark(searchQuery, {
              element: 'span',
              className: 'search-highlight bg-emerald-500/40 text-emerald-100 rounded-sm px-0.5',
              accuracy: isExactMatch ? 'exactly' : 'partially',
              caseSensitive: isCaseSensitive,
              done: (count: number) => {
                setMatchCount(count);
                setCurrentMatchIndex(count > 0 ? 1 : 0);
                if (count > 0) {
                  scrollToMatch(0);
                }
              }
            });
          } else {
            setMatchCount(0);
            setCurrentMatchIndex(0);
          }
        }
      });
    };

    const timeoutId = setTimeout(highlight, 100);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSearchOpen, messages, isExactMatch, isCaseSensitive]);

  const scrollToMatch = (index: number) => {
    if (!chatContainerRef.current) return;
    const marks = chatContainerRef.current.querySelectorAll('.search-highlight');
    if (marks[index]) {
      marks.forEach(m => m.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-500/60'));
      marks[index].classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-500/60');
      marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNextMatch = () => {
    if (matchCount === 0) return;
    const nextIndex = currentMatchIndex >= matchCount ? 1 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex - 1);
  };

  const handlePrevMatch = () => {
    if (matchCount === 0) return;
    const prevIndex = currentMatchIndex <= 1 ? matchCount : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex - 1);
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0B0B] text-zinc-500 bg-grid-subtle">
        <div className="w-16 h-16 premium-card flex items-center justify-center mb-4 shadow-xl">
          <Wand2 className="w-8 h-8 text-[#00FF00]" />
        </div>
        <h2 className="text-xl font-semibold text-[#EAEAEA] mb-2">Bem-vindo</h2>
        <p className="text-[#888888]">Selecione um chat ou crie um novo para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B0B] relative bg-grid-subtle">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0B0B0B]/80 backdrop-blur-md z-10">
        <h2 className="text-lg font-semibold text-[#EAEAEA]">{activeChat?.title}</h2>
        
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center premium-card px-2 py-1">
              <Search className="w-4 h-4 text-zinc-500 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar na conversa..."
                className="bg-transparent border-none text-sm text-[#EAEAEA] px-2 py-1 focus:outline-none w-48 placeholder:text-zinc-600"
                autoFocus
              />
              {matchCount > 0 && (
                <span className="text-xs text-zinc-500 mr-2 font-mono">
                  {currentMatchIndex} / {matchCount}
                </span>
              )}
              <div className="flex items-center gap-1 mr-2 border-l border-white/10 pl-2">
                <button 
                  onClick={() => setIsExactMatch(!isExactMatch)} 
                  className={clsx("p-1 rounded-[6px] transition-all interactive-hover interactive-click", isExactMatch ? "bg-[#00FF00]/20 text-[#00FF00]" : "text-zinc-500 hover:text-[#EAEAEA] hover:bg-white/5")}
                  title="Palavra inteira"
                >
                  <WholeWord className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)} 
                  className={clsx("p-1 rounded-[6px] transition-all interactive-hover interactive-click", isCaseSensitive ? "bg-[#00FF00]/20 text-[#00FF00]" : "text-zinc-500 hover:text-[#EAEAEA] hover:bg-white/5")}
                  title="Diferenciar maiúsculas e minúsculas"
                >
                  <CaseSensitive className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center border-l border-white/10 pl-1">
                <button onClick={handlePrevMatch} disabled={matchCount === 0} className="p-1 text-zinc-500 hover:text-[#EAEAEA] disabled:opacity-50 transition-all interactive-hover interactive-click">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={handleNextMatch} disabled={matchCount === 0} className="p-1 text-zinc-500 hover:text-[#EAEAEA] disabled:opacity-50 transition-all interactive-hover interactive-click">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={closeSearch} className="p-1 text-zinc-500 hover:text-[#EAEAEA] ml-1 transition-all interactive-hover interactive-click">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-[6px] transition-all flex items-center gap-2 text-sm font-medium bg-[#111111] text-zinc-500 hover:text-[#EAEAEA] hover:bg-[#161616] border border-white/5 interactive-hover interactive-click"
              title="Buscar na conversa"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={onToggleLibrary}
            className={clsx(
              "p-2 rounded-[6px] transition-all flex items-center gap-2 text-sm font-medium border interactive-hover interactive-click",
              isLibraryOpen ? "bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00]" : "premium-card text-zinc-500 hover:text-[#EAEAEA] hover:bg-[#161616]"
            )}
          >
            <Library className="w-4 h-4" />
            Biblioteca
          </button>

          <div className="h-6 w-px bg-white/5 mx-1" />

          <CommandCenter onAction={handleAction} />

          <div className="h-6 w-px bg-white/5 mx-1" />

          <button
            onClick={() => setIsInstantMode(!isInstantMode)}
            className={clsx(
              "px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-widest transition-all flex items-center gap-2 border interactive-hover interactive-click",
              isInstantMode 
                ? "premium-card text-zinc-600" 
                : "bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.1)]"
            )}
            title={isInstantMode ? "Modo Instantâneo Ativo" : "Modo Streaming Ativo"}
          >
            <Zap className={clsx("w-3 h-3", !isInstantMode && "fill-current")} />
            {isInstantMode ? "INSTANTÂNEO" : "STREAMING"}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" ref={chatContainerRef}>
        <div className="max-w-[720px] mx-auto w-full space-y-6 flex flex-col min-h-full">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={clsx("flex w-full", i % 2 === 0 ? "justify-end" : "justify-start")}>
                  <div className={clsx(
                    "w-2/3 h-24 rounded-[6px] animate-shimmer",
                    i % 2 === 0 ? "bg-neon-gradient opacity-20" : "premium-card"
                  )} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="w-12 h-12 premium-card flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-[#00FF00]" />
              </div>
              <p className="text-[#888888]">Como posso ajudar no seu design hoje, {profile?.name?.split(' ')[0]}?</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onInsertText={handleInsertText}
                  onExtractPrompt={(text) => {
                    setLastAIResponse(text);
                    setIsPromptExtractorOpen(text !== '');
                  }}
                />
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <ThinkingIndicator />
                </div>
              )}

              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-4 premium-card shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#00FF00]/10 flex items-center justify-center border border-[#00FF00]/20">
                        <Zap className="w-3 h-3 text-[#00FF00]" />
                      </div>
                    </div>
                    <StreamingMessage 
                      content={streamingContent} 
                      onComplete={(finalContent) => saveAIMessage(finalContent, currentGroundingMetadata)}
                      onStop={() => saveAIMessage(streamingContent, currentGroundingMetadata)}
                      isDone={!isGenerating}
                    />
                  </div>
                </div>
              )}

              {isGenerating && !isThinking && !streamingContent && (
                <div className="flex items-center gap-3 text-zinc-600 animate-pulse">
                  <div className="w-8 h-8 premium-card flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-[#00FF00]" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider">IA está digitando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0B0B0B] border-t border-white/5">
        <div className="max-w-[720px] mx-auto relative">
          <div className="absolute -top-12 right-0 flex gap-2">
            <button 
              onClick={handleExtractPrompt}
              className="bg-[#141416]/70 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-zinc-800 text-emerald-500 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-[6px] flex items-center gap-1.5 transition-all shadow-lg interactive-hover interactive-click"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Extrair Prompt
            </button>
            <button 
              onClick={handleImprovePrompt}
              disabled={!input.trim() || isImproving}
              className="bg-[#141416]/70 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-zinc-800 text-emerald-500 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-[6px] flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg interactive-hover interactive-click"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isImproving ? 'Melhorando...' : 'Melhorar Prompt'}
            </button>
          </div>
          
          <PremiumChatInput
            value={input}
            onChange={setInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onAction={handleAction}
            placeholder="Digite sua mensagem ou use / para comandos..."
            disabled={isGenerating}
            topContent={
              <>
                {interimText && (
                  <div className="px-3 pt-2 text-sm text-zinc-500 italic flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    {interimText}
                  </div>
                )}
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-2 mt-2">
                    {imageFiles.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16">
                        <img src={img.url} alt="Upload preview" className="w-full h-full object-cover rounded-[6px] border border-white/10" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 premium-card text-zinc-500 hover:text-[#EAEAEA] p-1 shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            }
            leftContent={
              <div className="flex gap-1 pb-1 pl-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-500 hover:text-[#EAEAEA] hover:bg-white/5 rounded-[6px] transition-all interactive-hover interactive-click"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            }
            rightContent={
              <div className="flex gap-1 pb-1 pr-1">
                {input.trim() && (
                  <button 
                    onClick={handleImprovePrompt}
                    disabled={isImproving}
                    className="p-2 text-zinc-500 hover:text-[#00FF00] hover:bg-white/5 rounded-[6px] transition-all interactive-hover interactive-click"
                    title="Melhorar Prompt"
                  >
                    {isImproving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                <button 
                  onClick={toggleRecording}
                  className={clsx(
                    "p-2 rounded-[6px] transition-all interactive-hover interactive-click",
                    isRecording ? "bg-red-500/10 text-red-500 animate-pulse border border-red-500/30" : "text-zinc-500 hover:text-[#EAEAEA] hover:bg-white/5"
                  )}
                  title={isRecording ? "Parar gravação" : "Gravar áudio"}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={(!input.trim() && imageFiles.length === 0) || isGenerating}
                  className="p-2 bg-[#00FF00] text-[#0B0B0B] rounded-[6px] transition-all hover:brightness-110 shadow-[0_0_15px_rgba(0,255,0,0.4)] disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none disabled:cursor-not-allowed interactive-hover interactive-click"
                >
                  <Send className="w-5 h-5 text-[#0B0B0B] disabled:text-zinc-500" />
                </button>
              </div>
            }
          />
        </div>
      </div>
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-500 text-white rounded-[6px] shadow-2xl font-bold flex items-center gap-3"
          >
            <div className="p-1 bg-white/20 rounded-[6px]">
              <X className="w-4 h-4" />
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Extractor Modal */}
      <PromptExtractorModal 
        isOpen={isPromptExtractorOpen}
        onClose={() => setIsPromptExtractorOpen(false)}
        aiResponse={lastAIResponse}
      />

      <ShortcutHelpOverlay />
    </div>
  );
}
