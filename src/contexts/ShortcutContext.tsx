import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Shortcut {
  id: string;
  label: string;
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  category: 'Ações rápidas' | 'IA' | 'Avançado';
  description: string;
}

interface ShortcutContextType {
  shortcuts: Shortcut[];
  updateShortcut: (id: string, newKey: string, ctrl: boolean, shift: boolean, alt: boolean) => void;
  resetShortcuts: () => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'copy', label: 'Copiar', key: 'c', ctrlKey: true, shiftKey: false, altKey: false, category: 'Ações rápidas', description: 'Copia a última resposta da IA' },
  { id: 'save', label: 'Salvar', key: 's', ctrlKey: true, shiftKey: false, altKey: false, category: 'Ações rápidas', description: 'Salva a última resposta na biblioteca' },
  { id: 'explain', label: 'Explicar', key: 'e', ctrlKey: true, shiftKey: false, altKey: false, category: 'IA', description: 'Pede uma explicação detalhada' },
  { id: 'example', label: 'Exemplo', key: 'x', ctrlKey: true, shiftKey: false, altKey: false, category: 'IA', description: 'Pede um exemplo prático' },
  { id: 'deepen', label: 'Aprofundar', key: 'a', ctrlKey: true, shiftKey: false, altKey: false, category: 'IA', description: 'Pede para aprofundar no assunto' },
  { id: 'extract', label: 'Extrair Prompt', key: 'e', ctrlKey: true, shiftKey: true, altKey: false, category: 'Avançado', description: 'Extrai o prompt da última resposta' },
  { id: 'improve', label: 'Melhorar Prompt', key: 'm', ctrlKey: true, shiftKey: true, altKey: false, category: 'Avançado', description: 'Melhora o prompt atual' },
];

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('iavexis_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('iavexis_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const updateShortcut = (id: string, newKey: string, ctrl: boolean, shift: boolean, alt: boolean) => {
    setShortcuts(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, key: newKey.toLowerCase(), ctrlKey: ctrl, shiftKey: shift, altKey: alt };
      }
      return s;
    }));
  };

  const resetShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
  };

  return (
    <ShortcutContext.Provider value={{ shortcuts, updateShortcut, resetShortcuts, isHelpOpen, setIsHelpOpen }}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcuts() {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
}
