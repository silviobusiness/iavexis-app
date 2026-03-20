import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { Zap, Sparkles, Copy, BookmarkPlus, Search, Wand2, HelpCircle } from 'lucide-react';

interface PremiumChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  topContent?: React.ReactNode;
  onAction?: (actionId: string) => void;
}

const autoCorrectDict: Record<string, string> = {
  "vc": "você",
  "tb": "também",
  "tbm": "também",
  "pq": "por que",
  "nao": "não",
  "sao": "são",
  "ja": "já",
  "q": "que",
  "oq": "o que",
  "comg": "comigo",
  "nd": "nada",
  "vcs": "vocês",
  "pra": "para",
};

const doubtfulWords: Record<string, string[]> = {
  "concerteza": ["com certeza"],
  "derrepente": ["de repente"],
  "nadaver": ["nada a ver"],
  "porisso": ["por isso"],
  "agente": ["a gente", "agente"],
};

const SLASH_COMMANDS = [
  { id: 'extract', label: 'Extrair Prompt', icon: <Search className="w-4 h-4" />, description: 'Extrai o prompt da última resposta', cmd: '/extrair' },
  { id: 'improve', label: 'Melhorar Prompt', icon: <Wand2 className="w-4 h-4" />, description: 'Melhora o prompt atual', cmd: '/melhorar' },
  { id: 'explain', label: 'Explicar', icon: <HelpCircle className="w-4 h-4" />, description: 'Pede uma explicação detalhada', cmd: '/explicar' },
  { id: 'example', label: 'Exemplo', icon: <Sparkles className="w-4 h-4" />, description: 'Pede um exemplo prático', cmd: '/exemplo' },
  { id: 'deepen', label: 'Aprofundar', icon: <Zap className="w-4 h-4" />, description: 'Pede para aprofundar no assunto', cmd: '/aprofundar' },
  { id: 'copy', label: 'Copiar', icon: <Copy className="w-4 h-4" />, description: 'Copia a última resposta', cmd: '/copiar' },
  { id: 'save', label: 'Salvar', icon: <BookmarkPlus className="w-4 h-4" />, description: 'Salva na biblioteca', cmd: '/salvar' },
];

export function PremiumChatInput({ value, onChange, onKeyDown, placeholder, disabled, leftContent, rightContent, topContent, onAction }: PremiumChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [caretPos, setCaretPos] = useState({ x: 0, y: 0 });
  const [selectionStart, setSelectionStart] = useState(0);
  const [suggestions, setSuggestions] = useState<{ word: string, index: number, options: string[] } | null>(null);
  const [lastCorrection, setLastCorrection] = useState<{ original: string, corrected: string, index: number } | null>(null);
  const [slashMenu, setSlashMenu] = useState<{ isOpen: boolean, filter: string, selectedIndex: number }>({
    isOpen: false,
    filter: '',
    selectedIndex: 0
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caretTrackerRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRenderRef = useRef<HTMLDivElement>(null);

  // Update caret position
  useEffect(() => {
    if (caretTrackerRef.current && containerRef.current) {
      const trackerRect = caretTrackerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setCaretPos({
        x: trackerRect.left - containerRect.left,
        y: trackerRect.top - containerRect.top,
      });
    }
  }, [value, selectionStart, isFocused]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setSelectionStart(e.currentTarget.selectionStart);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    const currentCursor = e.target.selectionStart;
    
    // Slash command detection
    const lastSlashIndex = newValue.lastIndexOf('/', currentCursor - 1);
    if (lastSlashIndex !== -1) {
      const textAfterSlash = newValue.substring(lastSlashIndex + 1, currentCursor);
      if (!textAfterSlash.includes(' ')) {
        setSlashMenu({
          isOpen: true,
          filter: textAfterSlash.toLowerCase(),
          selectedIndex: 0
        });
      } else {
        setSlashMenu(prev => ({ ...prev, isOpen: false }));
      }
    } else {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }

    // Auto-correction logic
    if (currentCursor > 0) {
      const lastChar = newValue[currentCursor - 1];
      if (/[ \.,!\?]/.test(lastChar)) {
        const textBeforeCursor = newValue.substring(0, currentCursor - 1);
        const words = textBeforeCursor.split(/[ \.,!\?]+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord && lastWord.length > 0) {
          const lowerWord = lastWord.toLowerCase();
          if (autoCorrectDict[lowerWord]) {
            const correctedWord = autoCorrectDict[lowerWord];
            const isCapitalized = lastWord[0] === lastWord[0].toUpperCase();
            const finalCorrected = isCapitalized ? correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1) : correctedWord;
            
            const wordStart = currentCursor - 1 - lastWord.length;
            newValue = newValue.substring(0, wordStart) + finalCorrected + newValue.substring(currentCursor - 1);
            
            setLastCorrection({ original: lastWord, corrected: finalCorrected, index: wordStart });
            
            setTimeout(() => {
              if (textareaRef.current) {
                const newCursorPos = wordStart + finalCorrected.length + 1;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                setSelectionStart(newCursorPos);
              }
            }, 0);
          }
        }
      }
    }

    onChange(newValue);
    setSelectionStart(currentCursor);
  };

  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.cmd.toLowerCase().includes('/' + slashMenu.filter)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenu.isOpen && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenu(prev => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % filteredCommands.length
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenu(prev => ({
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + filteredCommands.length) % filteredCommands.length
        }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedCmd = filteredCommands[slashMenu.selectedIndex];
        executeCommand(selectedCmd.id);
        return;
      }
      if (e.key === 'Escape') {
        setSlashMenu(prev => ({ ...prev, isOpen: false }));
        return;
      }
    }

    if (e.ctrlKey && e.key === 'z' && lastCorrection) {
      e.preventDefault();
      const newValue = value.substring(0, lastCorrection.index) + lastCorrection.original + value.substring(lastCorrection.index + lastCorrection.corrected.length);
      onChange(newValue);
      setLastCorrection(null);
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastCorrection.index + lastCorrection.original.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    onKeyDown(e);
  };

  const executeCommand = (actionId: string) => {
    // Remove the slash command from text
    const lastSlashIndex = value.lastIndexOf('/', selectionStart - 1);
    const newValue = value.substring(0, lastSlashIndex) + value.substring(selectionStart);
    onChange(newValue);
    setSlashMenu({ isOpen: false, filter: '', selectedIndex: 0 });
    
    if (onAction) {
      onAction(actionId);
    }
  };

  const renderText = () => {
    const textBeforeCaret = value.substring(0, selectionStart);
    const textAfterCaret = value.substring(selectionStart);
    
    const highlightDoubtful = (text: string, isBefore: boolean) => {
      let result: React.ReactNode[] = [];
      let currentIndex = 0;
      
      const words = text.split(/([ \.,!\?]+)/);
      
      words.forEach((word, i) => {
        const lowerWord = word.toLowerCase();
        if (doubtfulWords[lowerWord]) {
          const wordIndex = isBefore ? currentIndex : selectionStart + currentIndex;
          result.push(
            <span 
              key={i} 
              className="underline decoration-emerald-500/50 decoration-dashed cursor-pointer hover:bg-emerald-500/20 rounded transition-colors"
              onClick={() => setSuggestions({ word, index: wordIndex, options: doubtfulWords[lowerWord] })}
            >
              {word}
            </span>
          );
        } else {
          result.push(<span key={i}>{word}</span>);
        }
        currentIndex += word.length;
      });
      
      return result;
    };

    return (
      <>
        {highlightDoubtful(textBeforeCaret, true)}
        <span ref={caretTrackerRef} className="inline-block w-0 h-full">&#8203;</span>
        {highlightDoubtful(textAfterCaret, false)}
      </>
    );
  };

  const applySuggestion = (suggestion: string) => {
    if (!suggestions) return;
    const newValue = value.substring(0, suggestions.index) + suggestion + value.substring(suggestions.index + suggestions.word.length);
    onChange(newValue);
    setSuggestions(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = suggestions.index + suggestion.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative w-full font-sans">
      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 premium-card rounded-[6px] shadow-xl p-2 flex gap-2 z-50"
          >
            {suggestions.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(opt)}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-emerald-500/20 hover:text-emerald-400 text-sm text-zinc-200 rounded-[6px] transition-colors"
              >
                {opt}
              </button>
            ))}
            <button 
              onClick={() => setSuggestions(null)}
              className="px-2 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Ignorar
            </button>
          </motion.div>
        )}

        {/* Slash Command Menu */}
        {slashMenu.isOpen && filteredCommands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 w-72 premium-card rounded-[6px] shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 border-b border-zinc-800 bg-zinc-950/50">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 px-2">Comandos</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd.id)}
                  onMouseEnter={() => setSlashMenu(prev => ({ ...prev, selectedIndex: index }))}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all text-left group",
                    index === slashMenu.selectedIndex ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  <div className={clsx(
                    "p-1.5 rounded-[6px] transition-colors",
                    index === slashMenu.selectedIndex ? "bg-emerald-500/20 text-emerald-400" : "premium-card text-zinc-500 group-hover:text-zinc-300"
                  )}>
                    {cmd.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{cmd.label}</span>
                      <span className="text-[10px] font-mono opacity-50">{cmd.cmd}</span>
                    </div>
                    <p className="text-[10px] opacity-60 truncate">{cmd.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={containerRef}
        className={clsx(
          "relative w-full premium-card rounded-[6px] transition-all duration-300 flex flex-col",
          isFocused ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50" : "shadow-sm"
        )}
      >
        {topContent && (
          <div className="px-2 pt-2 z-30 relative">
            {topContent}
          </div>
        )}

        <div className="relative flex items-end w-full overflow-hidden rounded-b-[6px]">
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute pointer-events-none z-0"
                style={{
                  left: caretPos.x,
                  top: caretPos.y,
                  width: '120px',
                  height: '120px',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 70%)',
                  filter: 'blur(12px)',
                }}
              />
            )}
          </AnimatePresence>

          {leftContent && (
            <div className="pb-2 pl-2 z-30 relative">
              {leftContent}
            </div>
          )}

          <div className="relative flex-1">
            <div 
              ref={textRenderRef}
              className="absolute inset-0 py-3 px-2 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-zinc-200/90 z-10"
              style={{ 
                fontFamily: 'inherit',
                fontSize: '1rem',
                lineHeight: '1.5',
                textShadow: isFocused ? '0 0 8px rgba(16,185,129,0.2)' : 'none',
                transition: 'text-shadow 0.3s ease'
              }}
            >
              {!value && (
                <span className={clsx("text-zinc-500 transition-opacity duration-300", isFocused ? "opacity-50" : "opacity-100")}>
                  {placeholder}
                </span>
              )}
              {value && renderText()}
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              onScroll={(e) => {
                if (textRenderRef.current) {
                  textRenderRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setSuggestions(null), 200);
              }}
              disabled={disabled}
              className="relative w-full bg-transparent py-3 px-2 resize-none outline-none z-20 min-h-[44px] max-h-32"
              style={{
                color: 'transparent',
                caretColor: '#10b981',
                fontFamily: 'inherit',
                fontSize: '1rem',
                lineHeight: '1.5',
              }}
              rows={1}
            />
          </div>

          {rightContent && (
            <div className="pb-2 pr-2 z-30 relative">
              {rightContent}
            </div>
          )}
        </div>
        
        <style>{`
          textarea {
            scrollbar-width: thin;
            scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
          }
          textarea::-webkit-scrollbar {
            width: 6px;
          }
          textarea::-webkit-scrollbar-track {
            background: transparent;
          }
          textarea::-webkit-scrollbar-thumb {
            background-color: rgba(16, 185, 129, 0.3);
            border-radius: 6px;
          }
        `}</style>
      </div>
    </div>
  );
}
