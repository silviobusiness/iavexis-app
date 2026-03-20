import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Copy, BookmarkPlus, Zap, Image as ImageIcon, Search, MessageSquare, ExternalLink, ArrowRight, RefreshCw, Pin, Sparkles, ChevronDown, ChevronUp, Check, Download, Share2, Plus, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useLibrary } from '../contexts/LibraryContext';
import { useDashboard } from '../contexts/DashboardContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'framer-motion';
import { copyToClipboard } from '../utils/clipboard';

const ImageGrid = ({ images, onSave, onUseInCanva }: { 
  images: string[], 
  onSave: (url: string) => void,
  onUseInCanva: (url: string) => void
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {images.map((url, idx) => (
        <div key={idx} className="group relative aspect-square rounded-[6px] overflow-hidden bg-[#141416]/70 border border-white/5 shadow-lg">
          <img 
            src={url} 
            alt={`Visual support ${idx + 1}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              onClick={() => onUseInCanva(url)}
              className="px-3 py-1.5 bg-[#EAEAEA] text-[#0B0B0B] text-[10px] font-bold uppercase tracking-wider rounded-[6px] flex items-center gap-1.5 hover:bg-[#00FF00] transition-all interactive-hover interactive-click"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Usar no Canva
            </button>
            <button 
              onClick={() => onSave(url)}
              className="p-2 bg-[#141416]/70 backdrop-blur-md border border-white/5 text-[#EAEAEA] hover:bg-[#262626] rounded-[6px] transition-all interactive-hover interactive-click"
              title="Salvar na Biblioteca"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const LinkPreview = ({ url, onSave }: { url: string, onSave: (url: string, title: string) => void }) => {
  const domain = new URL(url).hostname.replace('www.', '');
  const title = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

  return (
    <div className="mt-3 group premium-card rounded-[6px] p-3 flex items-center gap-4 hover:border-white/10 transition-all shadow-sm">
      <div className="w-12 h-12 rounded-[6px] premium-card flex items-center justify-center text-zinc-500 group-hover:text-[#00FF00] transition-colors">
        <ExternalLink className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-[#EAEAEA] truncate">{title}</h4>
        <p className="text-xs text-zinc-500 truncate">{url}</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onSave(url, title)}
          className="p-2 text-zinc-500 hover:text-[#00FF00] transition-all interactive-hover interactive-click"
          title="Salvar Link"
        >
          <BookmarkPlus className="w-4 h-4" />
        </button>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 text-zinc-500 hover:text-[#EAEAEA] transition-all interactive-hover interactive-click"
        >
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

const PromptBlock = ({ content, onSave }: { content: string, onSave: (title: string, content: string) => Promise<void> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Auto-suggest title: first line or first 30 chars
    const firstLine = content.split('\n')[0].replace(/^[#*-\s]+/, '').trim();
    setEditedTitle(firstLine.substring(0, 40) || 'Novo Prompt');
  }, [content]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(editedContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsEditing(true);
      setIsOpen(true);
      return;
    }
    await onSave(editedTitle, editedContent);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAdjust = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { improvePrompt } = await import('../services/geminiService');
      const improved = await improvePrompt(editedContent);
      setEditedContent(improved);
    } catch (error) {
      console.error('Error adjusting prompt:', error);
    }
  };

  return (
    <div className="mt-4 premium-card rounded-[6px] overflow-hidden shadow-sm transition-all hover:border-white/10 group/prompt">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-zinc-400 hover:bg-[#111111]/50 transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[6px] bg-[#00FF00]/10 flex items-center justify-center border border-[#00FF00]/20">
            <Zap className="w-3.5 h-3.5 text-[#00FF00]" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#EAEAEA]">Prompt pronto para uso</span>
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-medium">Clique para expandir</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-zinc-500 border border-white/5">
            v1.0
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-[#111111]/30">
              {!isEditing ? (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse" />
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Visualização do Prompt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141416]/70 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-[#262626] text-zinc-400 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all interactive-hover interactive-click"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141416]/70 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-[#262626] text-zinc-400 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all interactive-hover interactive-click"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF00]/10 hover:bg-[#00FF00]/20 text-[#00FF00] rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all border border-[#00FF00]/20 interactive-hover interactive-click"
                      >
                        {saved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                        {saved ? 'Salvo' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                  <div className="relative group/code">
                    <pre className="p-4 bg-[#0B0B0B] rounded-[6px] text-xs font-mono text-zinc-400 whitespace-pre-wrap border border-white/5 leading-relaxed">
                      {editedContent}
                    </pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                      <div className="px-2 py-1 rounded-[6px] premium-card text-[9px] font-mono text-zinc-600">
                        {editedContent.length} chars
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 p-4 premium-card rounded-[6px] animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                      <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>Modo de Edição</span>
                    </div>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-[10px] text-zinc-600 hover:text-[#EAEAEA] uppercase font-bold tracking-wider"
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#00FF00]/50" />
                      Nome do prompt
                    </label>
                    <input 
                      type="text" 
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-[#0B0B0B] border border-white/5 rounded-[6px] px-3 py-2.5 text-sm text-[#EAEAEA] focus:outline-none focus:border-[#00FF00]/50 transition-colors placeholder:text-zinc-700"
                      placeholder="Ex: Prompt de Design Esportivo"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#00FF00]/50" />
                      Conteúdo do prompt
                    </label>
                    <textarea 
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={6}
                      className="w-full bg-[#0B0B0B] border border-white/5 rounded-[6px] px-3 py-2.5 text-sm text-[#EAEAEA] font-mono focus:outline-none focus:border-[#00FF00]/50 transition-colors resize-none custom-scrollbar"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button 
                      onClick={handleAdjust}
                      className="flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-[#00FF00] text-[10px] font-bold uppercase tracking-wider transition-all group/adjust interactive-hover interactive-click"
                      title="Otimizar prompt com IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 group-hover/adjust:scale-110 transition-transform" />
                      <span>Otimizar com IA</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2 bg-neon-gradient text-[#0B0B0B] font-bold rounded-[6px] text-[10px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,0,0.15)] hover:shadow-[0_0_30px_rgba(0,255,0,0.25)] interactive-hover interactive-click"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        Finalizar e Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useFeedback } from '../contexts/FeedbackContext';
import { NegativeFeedbackModal } from './Feedback/NegativeFeedbackModal';

export const MessageBubble: React.FC<{ 
  message: any, 
  onInsertText?: (text: string) => void,
  onExtractPrompt?: (text: string) => void
}> = ({ message, onInsertText, onExtractPrompt }) => {
  const isUser = message.role === 'user';
  const { user } = useAuth();
  const { toggleMessagePin, remixMessage, sendMessage } = useChat();
  const { createItem } = useLibrary();
  const { addCreativeTask } = useDashboard();
  const { submitFeedback } = useFeedback();
  const [feedback, setFeedback] = useState(message.feedback);
  const [isPinned, setIsPinned] = useState(message.isPinnedContext || false);
  const [showRemixPopover, setShowRemixPopover] = useState(false);
  const [isNegativeModalOpen, setIsNegativeModalOpen] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const remixRef = useRef<HTMLDivElement>(null);

  const { displayContent, detectedPrompt, imagePrompt, detectedLinks, referenceImages } = !isUser ? (() => {
    let content = message.content;
    
    // Detect prompts
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];
    let prompt = null;
    if (matches.length > 0) {
      prompt = matches[0][1].trim();
      content = content.replace(matches[0][0], '').trim();
    } else {
      const promptRegex = /(?:Prompt|Comando|Instrução):\s*([\s\S]+)/i;
      const promptMatch = content.match(promptRegex);
      if (promptMatch) {
        prompt = promptMatch[1].trim();
        content = content.replace(promptMatch[0], '').trim();
      }
    }

    // Detect image generation
    const generateImageRegex = /\[GENERATE_IMAGE:\s*([\s\S]+?)\]/i;
    const generateImageMatch = content.match(generateImageRegex);
    let imgPrompt = null;
    if (generateImageMatch) {
      imgPrompt = generateImageMatch[1].trim();
      content = content.replace(generateImageMatch[0], '').trim();
    }

    // Detect links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = Array.from(new Set(content.match(urlRegex) || []));

    // Extract reference images from groundingMetadata
    const refImages = message.groundingMetadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web?.uri && (chunk.web.uri.match(/\.(jpeg|jpg|gif|png|webp)$/i) || chunk.web.title?.toLowerCase().includes('imagem')))
      ?.map((chunk: any) => chunk.web.uri) || [];
    
    return { 
      displayContent: content as string, 
      detectedPrompt: prompt as string | null, 
      imagePrompt: imgPrompt as string | null,
      detectedLinks: links as string[],
      referenceImages: refImages as string[]
    };
  })() : { 
    displayContent: message.content as string, 
    detectedPrompt: null, 
    imagePrompt: null, 
    detectedLinks: [] as string[], 
    referenceImages: [] as string[]
  };

  useEffect(() => {
    if (imagePrompt && !isGeneratingImage && generatedImages.length === 0) {
      handleGenerateImage(imagePrompt);
    }
  }, [imagePrompt]);

  const handleGenerateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const { generateImage } = await import('../services/geminiService');
      const imageUrl = await generateImage(prompt);
      setGeneratedImages([imageUrl]);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveImage = async (url: string) => {
    if (!user) return;
    try {
      await createItem({
        category: 'Imagens',
        title: `Referência Visual - ${new Date().toLocaleDateString()}`,
        imageUrl: url,
        itemType: 'reference',
        tags: ['IA', 'Referência']
      });
      alert('Imagem salva na biblioteca!');
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleSaveLink = async (url: string, title: string) => {
    if (!user) return;
    try {
      await createItem({
        category: 'Links',
        title: title || 'Recurso Útil',
        description: url,
        itemType: 'asset',
        tags: ['Link', 'IA']
      });
      alert('Link salvo na biblioteca!');
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  const handleUseInCanva = (url: string) => {
    const canvaUrl = `https://www.canva.com/design?create&media=${encodeURIComponent(url)}`;
    window.open(canvaUrl, '_blank');
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (feedback === type) return;
    setFeedback(type);
    
    try {
      if (type === 'positive') {
        await submitFeedback({
          type: 'positive',
          chatId: message.chatId,
          messageId: message.id,
          associatedFunction: 'chat_response',
          content: 'Resposta útil'
        });
      } else {
        setIsNegativeModalOpen(true);
      }
      await updateDoc(doc(db, 'messages', message.id), { feedback: type });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleTogglePin = async () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    await toggleMessagePin(message.id, newPinned);
  };

  const handleSavePrompt = async (title: string, content: string) => {
    if (!user) return;
    try {
      await createItem({
        title,
        description: content,
        category: 'Prompt',
        itemType: 'asset',
        tags: ['prompt', 'iavexis']
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  };

  const handleSelection = () => {
    if (isUser) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0 && bubbleRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      
      // Calculate x and y relative to the bubble
      const relativeX = rect.left - bubbleRect.left + (rect.width / 2);
      const relativeY = rect.top - bubbleRect.top;

      // Clamp X so it doesn't overflow the bubble
      // The menu is approximately 350px wide, so we need about 175px on each side
      const clampedX = Math.max(175, Math.min(relativeX, bubbleRect.width - 175));

      setSelectionMenu({
        x: clampedX,
        y: relativeY,
        text: selection.toString().trim()
      });
    } else {
      setSelectionMenu(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectionMenu && bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setSelectionMenu(null);
      }
      if (showRemixPopover && remixRef.current && !remixRef.current.contains(e.target as Node)) {
        setShowRemixPopover(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectionMenu(null);
      }
    };

    const handleScroll = () => {
      if (selectionMenu) {
        setSelectionMenu(null);
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setSelectionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selectionMenu]);

  const saveToLibrary = async () => {
    if (!selectionMenu || !user) return;
    try {
      await createItem({
        category: 'Ideia Salva',
        title: selectionMenu.text.substring(0, 30) + '...',
        description: selectionMenu.text,
        itemType: 'asset',
        tags: ['Ideia', 'IA']
      });
      setSelectionMenu(null);
      alert('Salvo na biblioteca!');
    } catch (error) {
      console.error('Error saving to library:', error);
    }
  };

  const copyToClipboardAction = async () => {
    if (selectionMenu) {
      await copyToClipboard(selectionMenu.text);
      setSelectionMenu(null);
    }
  };

  const handleAction = (prefix: string) => {
    if (selectionMenu && onInsertText) {
      onInsertText(`${prefix}:\n\n"${selectionMenu.text}"`);
      setSelectionMenu(null);
    }
  };

  const extractPrompt = async () => {
    const text = selectionMenu?.text || message.content;
    setSelectionMenu(null);
    
    if (onExtractPrompt) {
      onExtractPrompt(text);
    }
  };

  return (
    <div className={clsx("flex w-full relative", isUser ? "justify-end" : "justify-start")}>
      <div 
        ref={bubbleRef}
        className={clsx(
          "relative group p-5",
          isUser 
            ? "max-w-[80%] bg-neon-gradient text-[#0B0B0B] rounded-[6px] rounded-br-sm shadow-[0_4px_15px_rgba(0,255,0,0.15)] font-medium" 
            : "w-full premium-card text-[#EAEAEA] rounded-[6px] shadow-2xl"
        )}
      >
        {/* Author Icon */}
        {!isUser && (
          <div className="absolute -left-12 top-0 w-8 h-8 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-[6px] flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-[#00FF00]" />
          </div>
        )}

        {/* Content */}
        <div 
          className={clsx(
            "text-base leading-relaxed tracking-wide",
            isUser ? "text-[#0B0B0B]" : "text-[#EAEAEA]"
          )}
          onMouseUp={handleSelection}
        >
          {message.imageUrls && message.imageUrls.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {message.imageUrls.map((url: string, i: number) => (
                <img key={i} src={url} alt={`User upload ${i + 1}`} className="max-w-full h-auto rounded-[6px] border border-white/10 max-h-64 object-contain shadow-lg" />
              ))}
            </div>
          ) : message.imageUrl ? (
            <div className="mb-4">
              <img src={message.imageUrl} alt="User upload" className="max-w-full h-auto rounded-[6px] border border-white/10 max-h-64 object-contain shadow-lg" />
            </div>
          ) : null}
          <div className={clsx(
            "markdown-body prose-p:whitespace-pre-wrap prose-li:whitespace-pre-wrap",
            "prose max-w-none",
            "prose-p:my-4 prose-ul:my-5 prose-ol:my-5 prose-li:my-2",
            "prose-headings:mt-6 prose-headings:mb-4 prose-pre:my-5",
            "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            isUser 
              ? "prose-p:text-[#0B0B0B] prose-headings:text-[#0B0B0B] prose-strong:text-[#0B0B0B] prose-a:text-[#111111]" 
              : "prose-invert prose-p:text-[#EAEAEA] prose-headings:text-white prose-strong:text-white prose-a:text-[#00FF00] prose-li:text-[#EAEAEA]"
          )}>
            {displayContent && <ReactMarkdown rehypePlugins={[rehypeRaw]}>{displayContent as string}</ReactMarkdown>}
          </div>

          {isGeneratingImage && (
            <div className="mt-4 p-6 premium-card rounded-[6px] flex flex-col items-center justify-center gap-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#00FF00] animate-spin" />
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">IA está gerando sua imagem...</p>
            </div>
          )}

          {generatedImages.length > 0 && (
            <ImageGrid 
              images={generatedImages} 
              onSave={handleSaveImage} 
              onUseInCanva={handleUseInCanva} 
            />
          )}

          {referenceImages.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-zinc-600">
                <Search className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Referências Encontradas</span>
              </div>
              <ImageGrid 
                images={referenceImages} 
                onSave={handleSaveImage} 
                onUseInCanva={handleUseInCanva} 
              />
            </div>
          )}

          {detectedLinks.length > 0 && (
            <div className="mt-4 space-y-2">
              {detectedLinks.map((url, idx) => (
                <LinkPreview key={idx} url={url} onSave={handleSaveLink} />
              ))}
            </div>
          )}

          {detectedPrompt && (
            <PromptBlock content={detectedPrompt} onSave={handleSavePrompt} />
          )}
        </div>

        {/* Selection Menu */}
        {selectionMenu && !isUser && (
          <div 
            className="absolute z-50 bg-[#141416]/90 rounded-[6px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-center p-1 gap-1 -translate-x-1/2 -translate-y-[calc(100%+8px)] animate-in fade-in zoom-in duration-200 backdrop-blur-xl border border-white/10 w-max max-w-[90vw] sm:max-w-max"
            style={{ left: selectionMenu.x, top: selectionMenu.y }}
          >
            <div className="flex items-center gap-1 px-1 border-r border-white/5 mr-1">
              <button onClick={copyToClipboardAction} className="p-2 hover:bg-zinc-800 rounded-[6px] text-zinc-400 hover:text-zinc-200 transition-all group/btn interactive-hover interactive-click" title="Copiar">
                <Copy className="w-3.5 h-3.5 group-hover/btn:scale-110" />
              </button>
              <button onClick={saveToLibrary} className="p-2 hover:bg-zinc-800 rounded-[6px] text-zinc-400 hover:text-zinc-200 transition-all group/btn interactive-hover interactive-click" title="Salvar na Biblioteca">
                <BookmarkPlus className="w-3.5 h-3.5 group-hover/btn:scale-110" />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button onClick={() => handleAction('Explique melhor isso')} className="px-3 py-1.5 hover:bg-zinc-800 rounded-[6px] text-zinc-400 hover:text-zinc-200 transition-all text-[10px] font-bold uppercase tracking-wider interactive-hover interactive-click">
                Explicar
              </button>
              <button onClick={() => handleAction('Me dê um exemplo prático de')} className="px-3 py-1.5 hover:bg-zinc-800 rounded-[6px] text-zinc-400 hover:text-zinc-200 transition-all text-[10px] font-bold uppercase tracking-wider interactive-hover interactive-click">
                Exemplo
              </button>
            </div>

            <div className="hidden sm:block w-px h-4 bg-white/10 mx-1"></div>
            
            <button onClick={extractPrompt} className="px-3 py-1.5 hover:bg-emerald-500/10 rounded-[6px] text-emerald-500 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/extract interactive-hover interactive-click">
              <Sparkles className="w-3.5 h-3.5 group-hover/extract:animate-pulse" />
              Extrair prompt
            </button>
          </div>
        )}

        {/* Actions (Only for AI) */}
        {!isUser && (
          <div className="absolute -bottom-10 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <div className="flex items-center gap-1 premium-card backdrop-blur-md p-1 rounded-[6px] border border-zinc-800/50 shadow-sm">
              <button 
                onClick={() => handleFeedback('positive')}
                className={clsx("p-1.5 rounded-[6px] transition-all interactive-hover interactive-click", feedback === 'positive' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800")}
                title="Gostei"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleFeedback('negative')}
                className={clsx("p-1.5 rounded-[6px] transition-all interactive-hover interactive-click", feedback === 'negative' ? "bg-red-500/10 text-red-500" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800")}
                title="Não gostei"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
              
              <div className="w-px h-4 bg-white/10 mx-1"></div>

              <div className="relative" ref={remixRef}>
                <button 
                  onClick={() => setShowRemixPopover(!showRemixPopover)}
                  className={clsx(
                    "p-1.5 rounded-[6px] transition-all flex items-center gap-2 interactive-hover interactive-click",
                    showRemixPopover ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                  )}
                  title="Remixar resposta"
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", showRemixPopover && "animate-spin-slow")} />
                  {showRemixPopover && <span className="text-[10px] font-bold uppercase tracking-widest pr-1">Remixar</span>}
                </button>

                {showRemixPopover && (
                  <div className="absolute bottom-full left-0 mb-3 w-56 premium-card rounded-[6px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl border border-zinc-800/50">
                    <div className="px-3 py-2 mb-1 border-b border-white/5">
                      <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-[0.2em]">Opções de Remix</span>
                    </div>
                    {['Mais criativo', 'Mais direto', 'Mais detalhado', 'Versão premium'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          remixMessage(message.id, opt);
                          setShowRemixPopover(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 rounded-[6px] text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-between group interactive-hover interactive-click"
                      >
                        {opt}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleTogglePin}
                className={clsx(
                  "p-1.5 rounded-[6px] transition-all flex items-center gap-2 interactive-hover interactive-click",
                  isPinned ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                )}
                title={isPinned ? "Desafixar contexto" : "Fixar contexto"}
              >
                <Pin className={clsx("w-3.5 h-3.5", isPinned && "fill-current")} />
                {isPinned && <span className="text-[10px] font-bold uppercase tracking-widest pr-1">Fixado</span>}
              </button>

              <button 
                onClick={() => onExtractPrompt?.(message.content)}
                className="p-1.5 rounded-[6px] text-zinc-500 hover:text-emerald-500 hover:bg-zinc-800 transition-all group/extract-btn interactive-hover interactive-click"
                title="Extrair prompt desta resposta"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover/extract-btn:scale-110" />
              </button>

              <button 
                onClick={() => {
                  addCreativeTask({
                    title: 'Ideia do Chat Criativo',
                    type: 'post',
                    status: 'ideia',
                    priority: 'media',
                    origin: 'chat_criativo',
                    date: new Date().toISOString(),
                    tags: ['ia', 'chat']
                  });
                }}
                className="p-1.5 rounded-[6px] text-zinc-500 hover:text-emerald-500 hover:bg-zinc-800 transition-all group/cal-btn interactive-hover interactive-click"
                title="Adicionar ao Calendário"
              >
                <Calendar className="w-3.5 h-3.5 group-hover/cal-btn:scale-110" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <NegativeFeedbackModal 
        isOpen={isNegativeModalOpen}
        onClose={() => setIsNegativeModalOpen(false)}
        chatId={message.chatId}
        messageId={message.id}
        associatedFunction="chat_response"
      />
    </div>
  );
}
