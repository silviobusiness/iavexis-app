import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const phrases = [
  "Analisando dados...",
  "Gerando resposta...",
  "Processando informações...",
  "Otimizando resposta...",
  "Consultando biblioteca...",
  "Preparando insights..."
];

export const ThinkingIndicator: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 w-full max-w-[300px]">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <span className="text-sm font-medium text-zinc-400">Pensando...</span>
      </div>
      
      <div className="h-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-xs text-zinc-500 italic truncate"
          >
            {phrases[phraseIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
