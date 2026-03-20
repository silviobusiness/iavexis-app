import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Zap, Sparkles, Command } from 'lucide-react';
import { useShortcuts, Shortcut } from '../contexts/ShortcutContext';

export function ShortcutHelpOverlay() {
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useShortcuts();

  if (!isHelpOpen) return null;

  const categories = ['Ações rápidas', 'IA', 'Avançado'];

  const getShortcutDisplay = (shortcut: Shortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Keyboard className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Atalhos de Teclado</h2>
                <p className="text-sm text-zinc-500">Aumente sua produtividade com comandos rápidos</p>
              </div>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {cat === 'Ações rápidas' ? <Zap className="w-3 h-3 text-amber-400" /> : 
                   cat === 'IA' ? <Sparkles className="w-3 h-3 text-emerald-400" /> : 
                   <Command className="w-3 h-3 text-purple-400" />}
                  {cat}
                </div>
                <div className="space-y-3">
                  {shortcuts
                    .filter(s => s.category === cat)
                    .map(shortcut => (
                      <div key={shortcut.id} className="flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                            {shortcut.label}
                          </span>
                          <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                            {shortcut.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getShortcutDisplay(shortcut).split(' + ').map((part, i) => (
                            <React.Fragment key={i}>
                              <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-mono text-zinc-400 min-w-[24px] text-center shadow-sm">
                                {part}
                              </kbd>
                              {i < getShortcutDisplay(shortcut).split(' + ').length - 1 && (
                                <span className="text-zinc-700 text-[10px]">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <Keyboard className="w-3 h-3 text-blue-400" />
                Sistema
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                      Ajuda de Atalhos
                    </span>
                    <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                      Abre este painel de ajuda
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-mono text-zinc-400 min-w-[24px] text-center shadow-sm">Ctrl</kbd>
                    <span className="text-zinc-700 text-[10px]">+</span>
                    <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-mono text-zinc-400 min-w-[24px] text-center shadow-sm">/</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-center gap-4">
            <p className="text-xs text-zinc-500 italic">
              Dica: Você pode personalizar estes atalhos nas configurações do seu perfil.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
