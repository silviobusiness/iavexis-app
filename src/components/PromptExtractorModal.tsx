import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Copy, Edit2, Save, Check, ChevronRight, 
  Zap, Folder, Star, Loader2, AlertCircle, ArrowRight,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import clsx from 'clsx';
import { useLibrary } from '../contexts/LibraryContext';
import { useChat } from '../contexts/ChatContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { copyToClipboard } from '../utils/clipboard';

interface PromptVariation {
  level: 'Básico' | 'Avançado' | 'Expert';
  content: string;
  label: string;
}

interface PromptData {
  extracted: string;
  improved: string;
  variations: PromptVariation[];
  ultraExpert: string;
}

interface PromptExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiResponse: string;
}

export function PromptExtractorModal({ isOpen, onClose, aiResponse }: PromptExtractorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PromptData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showExpert, setShowExpert] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { createItem } = useLibrary();
  const { folders } = useChat();
  const { submitFeedback } = useFeedback();

  useEffect(() => {
    if (isOpen && aiResponse) {
      handleExtract();
    } else {
      setData(null);
      setError(null);
      setShowExpert(false);
    }
  }, [isOpen, aiResponse]);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    try {
      const { extractAndImprovePrompt } = await import('../services/geminiService');
      const result = await extractAndImprovePrompt(aiResponse);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao extrair prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSave = async (id: string, content: string, level?: string) => {
    try {
      await createItem({
        title: `Prompt Extraído ${level ? `(${level})` : ''} - ${new Date().toLocaleDateString()}`,
        description: content,
        category: 'Prompt',
        itemType: 'asset',
        folderId: selectedFolderId || undefined,
        tags: ['prompt', 'extraído', level?.toLowerCase() || 'geral'],
      });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error('Error saving prompt:', err);
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditedContent(content);
  };

  const saveEdit = (id: string) => {
    if (!data) return;
    
    const newData = { ...data };
    if (id === 'extracted') newData.extracted = editedContent;
    else if (id === 'improved') newData.improved = editedContent;
    else if (id === 'ultraExpert') newData.ultraExpert = editedContent;
    else {
      const idx = newData.variations.findIndex(v => v.level === id);
      if (idx !== -1) newData.variations[idx].content = editedContent;
    }
    
    setData(newData);
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-[6px] premium-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Extração Inteligente</h2>
              <p className="text-xs text-zinc-400">Transformando respostas em prompts de alta performance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-[6px] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Analisando resposta...</p>
                <p className="text-xs text-zinc-500">Extraindo objetivos e otimizando estrutura</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-[6px] flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium">{error}</p>
                <button 
                  onClick={handleExtract}
                  className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-2 mx-auto"
                >
                  Tentar novamente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Section 1: Extracted & Improved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PromptCard 
                  title="Prompt Extraído"
                  subtitle="Conteúdo bruto refinado"
                  content={data.extracted}
                  id="extracted"
                  isEditing={editingId === 'extracted'}
                  editedValue={editedContent}
                  onEditChange={setEditedContent}
                  onEdit={() => handleEdit('extracted', data.extracted)}
                  onSaveEdit={() => saveEdit('extracted')}
                  onCancelEdit={() => setEditingId(null)}
                  onCopy={() => handleCopy('extracted', data.extracted)}
                  onSave={() => handleSave('extracted', data.extracted)}
                  isCopied={copiedId === 'extracted'}
                  isSaved={savedId === 'extracted'}
                />
                <PromptCard 
                  title="Prompt Melhorado"
                  subtitle="Otimização automática IA"
                  content={data.improved}
                  id="improved"
                  highlight
                  isEditing={editingId === 'improved'}
                  editedValue={editedContent}
                  onEditChange={setEditedContent}
                  onEdit={() => handleEdit('improved', data.improved)}
                  onSaveEdit={() => saveEdit('improved')}
                  onCancelEdit={() => setEditingId(null)}
                  onCopy={() => handleCopy('improved', data.improved)}
                  onSave={() => handleSave('improved', data.improved)}
                  isCopied={copiedId === 'improved'}
                  isSaved={savedId === 'improved'}
                />
              </div>

              {/* Section 2: Variations */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Variações de Performance</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.variations.map((v) => (
                    <PromptCard 
                      key={v.level}
                      title={v.level}
                      label={v.label}
                      content={v.content}
                      id={v.level}
                      compact
                      isEditing={editingId === v.level}
                      editedValue={editedContent}
                      onEditChange={setEditedContent}
                      onEdit={() => handleEdit(v.level, v.content)}
                      onSaveEdit={() => saveEdit(v.level)}
                      onCancelEdit={() => setEditingId(null)}
                      onCopy={() => handleCopy(v.level, v.content)}
                      onSave={() => handleSave(v.level, v.content, v.level)}
                      isCopied={copiedId === v.level}
                      isSaved={savedId === v.level}
                    />
                  ))}
                </div>
              </div>

              {/* Section 3: Ultra Expert */}
              <div className="pt-4 border-t border-zinc-800">
                {!showExpert ? (
                  <button 
                    onClick={() => setShowExpert(true)}
                    className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-[6px] text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3 group"
                  >
                    <Zap className="w-5 h-5 group-hover:fill-current" />
                    <span className="font-bold">Gerar versão ainda melhor (Nível Expert+)</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <PromptCard 
                      title="Versão Ultra Expert"
                      subtitle="Engenharia de prompt avançada"
                      content={data.ultraExpert}
                      id="ultraExpert"
                      level="Expert"
                      highlight
                      isEditing={editingId === 'ultraExpert'}
                      editedValue={editedContent}
                      onEditChange={setEditedContent}
                      onEdit={() => handleEdit('ultraExpert', data.ultraExpert)}
                      onSaveEdit={() => saveEdit('ultraExpert')}
                      onCancelEdit={() => setEditingId(null)}
                      onCopy={() => handleCopy('ultraExpert', data.ultraExpert)}
                      onSave={() => handleSave('ultraExpert', data.ultraExpert, 'Expert+')}
                      isCopied={copiedId === 'ultraExpert'}
                      isSaved={savedId === 'ultraExpert'}
                    />
                  </motion.div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-[6px] border border-zinc-700">
              <Folder className="w-3.5 h-3.5 text-zinc-400" />
              <select 
                value={selectedFolderId || ''} 
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="bg-transparent text-xs text-zinc-300 outline-none border-none cursor-pointer"
              >
                <option value="">Biblioteca Geral</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
              <span className="text-xs text-zinc-500 font-medium">Isso foi útil?</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => submitFeedback({ type: 'positive', associatedFunction: 'prompt_extractor', content: 'Extração útil' })}
                  className="p-1.5 hover:bg-emerald-500/10 rounded-[6px] text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => submitFeedback({ type: 'negative', associatedFunction: 'prompt_extractor', content: 'Extração não foi útil' })}
                  className="p-1.5 hover:bg-red-500/10 rounded-[6px] text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[6px] font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            Concluir
          </button>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}

interface PromptCardProps {
  title: string;
  subtitle?: string;
  label?: string;
  content: string;
  id: string;
  highlight?: boolean;
  compact?: boolean;
  level?: string;
  isEditing: boolean;
  editedValue: string;
  onEditChange: (val: string) => void;
  onEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onCopy: () => void;
  onSave: () => void;
  isCopied: boolean;
  isSaved: boolean;
}

function PromptCard({ 
  title, subtitle, label, content, highlight, compact, level,
  isEditing, editedValue, onEditChange, onEdit, onSaveEdit, onCancelEdit,
  onCopy, onSave, isCopied, isSaved
}: PromptCardProps) {
  const currentLevel = level || label;
  
  const getLevelColor = (lvl?: string) => {
    switch (lvl) {
      case 'Básico': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'Avançado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Expert': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className={clsx(
      "group relative flex flex-col bg-zinc-900 border rounded-[6px] premium-card transition-all duration-300",
      highlight ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-zinc-800 hover:border-zinc-700",
      compact ? "p-4" : "p-5"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className={clsx("font-bold text-white", compact ? "text-sm" : "text-base")}>{title}</h4>
            {label && (
              <span className={clsx("text-[10px] px-2 py-0.5 rounded-[4px] border font-bold uppercase tracking-tighter", getLevelColor(label))}>
                {label}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-1.5 hover:bg-zinc-800 rounded-[4px] text-zinc-400 hover:text-white transition-colors"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onCopy}
            className={clsx(
              "p-1.5 rounded-[4px] transition-colors",
              isCopied ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
            )}
            title="Copiar"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={onSave}
            className={clsx(
              "p-1.5 rounded-[4px] transition-colors",
              isSaved ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
            )}
            title="Salvar na Biblioteca"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {isEditing ? (
          <div className="space-y-2">
            <textarea 
              value={editedValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="w-full h-32 bg-zinc-950 border border-emerald-500/50 rounded-[6px] p-3 text-sm text-white outline-none resize-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={onCancelEdit}
                className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancelar
              </button>
              <button 
                onClick={onSaveEdit}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-[6px] transition-colors"
              >
                Salvar Alteração
              </button>
            </div>
          </div>
        ) : (
          <div className={clsx(
            "bg-zinc-950/50 rounded-[6px] border border-zinc-800/50 p-3 text-zinc-300 font-mono leading-relaxed overflow-hidden",
            compact ? "text-[11px] line-clamp-4" : "text-xs"
          )}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
