import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Copy, BookmarkPlus, Search, Sparkles, HelpCircle, X, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useShortcuts, Shortcut } from '../contexts/ShortcutContext';

interface CommandCenterProps {
  onAction: (actionId: string) => void;
}

export function CommandCenter({ onAction }: CommandCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts, setIsHelpOpen } = useShortcuts();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { name: 'Ações rápidas', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { name: 'IA', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { name: 'Avançado', icon: <Zap className="w-4 h-4 text-purple-400" /> },
  ];

  const getShortcutDisplay = (shortcut: Shortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-[6px] transition-all duration-200 font-medium text-sm interactive-hover interactive-click",
          isOpen 
            ? "bg-[#00FF00] text-black shadow-[0_0_20px_rgba(0,255,0,0.4)]" 
            : "bg-[#111111] text-[#888888] hover:text-[#EAEAEA] hover:bg-[#161616] border border-zinc-800"
        )}
      >
        <Zap className={clsx("w-4 h-4", isOpen ? "fill-current" : "text-[#00FF00]")} />
        <span>Ações</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 bg-[#0B0B0B] border border-zinc-800 rounded-[8px] shadow-2xl z-50 overflow-hidden backdrop-blur-xl bg-[#0B0B0B]/90"
          >
            <div className="p-2 space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="px-3 py-1 flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {cat.icon}
                    {cat.name}
                  </div>
                  <div className="space-y-0.5">
                    {shortcuts
                      .filter(s => s.category === cat.name)
                      .map(shortcut => (
                        <button
                          key={shortcut.id}
                          onClick={() => {
                            onAction(shortcut.id);
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-[#111111] group transition-all text-left interactive-hover interactive-click"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#EAEAEA] group-hover:text-[#00FF00] transition-colors">
                              {shortcut.label}
                            </span>
                            <span className="text-[10px] text-[#888888] line-clamp-1">
                              {shortcut.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#888888] bg-[#0B0B0B] px-1.5 py-0.5 rounded-[4px] border border-zinc-800 group-hover:border-[#00FF00]/30 group-hover:text-[#00FF00]/70 transition-colors">
                              {getShortcutDisplay(shortcut)}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 p-2 bg-zinc-900/30">
              <button
                onClick={() => {
                  setIsHelpOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] hover:bg-[#161616] text-[#888888] hover:text-[#EAEAEA] transition-all text-xs font-medium interactive-hover interactive-click"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Todos os atalhos</span>
                <div className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#888888]">
                  <span>Ctrl</span>
                  <span>+</span>
                  <span>/</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
