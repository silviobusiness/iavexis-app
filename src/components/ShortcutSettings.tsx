import React, { useState } from 'react';
import { useShortcuts, Shortcut } from '../contexts/ShortcutContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, RotateCcw, Save, AlertCircle, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';

export function ShortcutSettings() {
  const { shortcuts, updateShortcut, resetShortcuts } = useShortcuts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    
    // Ignore modifier keys alone
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const key = e.key.toUpperCase();
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Check for conflicts
    const conflict = shortcuts.find(s => 
      s.id !== editingId &&
      s.key.toUpperCase() === key &&
      s.ctrlKey === ctrl &&
      s.shiftKey === shift &&
      s.altKey === alt
    );

    if (conflict) {
      setError(`Conflito com: ${conflict.label}`);
      return;
    }

    setError(null);
    
    const shortcutStr = [
      ctrl ? 'Ctrl' : '',
      shift ? 'Shift' : '',
      alt ? 'Alt' : '',
      key
    ].filter(Boolean).join(' + ');

    setNewKey(shortcutStr);

    if (editingId) {
      updateShortcut(editingId, key, ctrl, shift, alt);
      setSuccess('Atalho atualizado!');
      setTimeout(() => setSuccess(null), 2000);
      setEditingId(null);
    }
  };

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-400" />
            Atalhos de Teclado
          </h3>
          <p className="text-sm text-zinc-500">Personalize os atalhos para suas ações favoritas.</p>
        </div>
        <button
          onClick={() => {
            resetShortcuts();
            setSuccess('Atalhos resetados!');
            setTimeout(() => setSuccess(null), 2000);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Resetar Padrões
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-widest px-1">{category}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.filter(s => s.category === category).map(shortcut => (
                <div
                  key={shortcut.id}
                  className={clsx(
                    "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group",
                    editingId === shortcut.id 
                      ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20" 
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "p-2 rounded-lg transition-colors",
                      editingId === shortcut.id ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                    )}>
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{shortcut.label}</p>
                      <p className="text-[10px] text-zinc-500">{shortcut.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === shortcut.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          onKeyDown={handleKeyDown}
                          placeholder="Pressione as teclas..."
                          className="bg-zinc-950 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-xs text-emerald-400 w-40 focus:outline-none placeholder:text-emerald-500/30"
                        />
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(shortcut.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all"
                      >
                        {[
                          shortcut.ctrlKey ? 'Ctrl' : '',
                          shortcut.shiftKey ? 'Shift' : '',
                          shortcut.altKey ? 'Alt' : '',
                          shortcut.key.toUpperCase()
                        ].filter(Boolean).join(' + ')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
