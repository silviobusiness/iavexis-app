import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import clsx from 'clsx';

interface StreamingMessageProps {
  content: string;
  onComplete: (finalContent: string) => void;
  isInstant?: boolean;
  onStop?: () => void;
  isDone?: boolean;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  onComplete, 
  isInstant = false,
  onStop,
  isDone = true
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(!isInstant);
  const words = content.split(/(\s+)/);
  const wordIndex = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasCompleted = useRef(false);

  useEffect(() => {
    const cleanContent = content.replace(/\[CREATE_SUGGESTION:\s*({.*?})\]/s, '').trim();
    
    if (isInstant) {
      setDisplayedContent(cleanContent);
      if (isDone && !hasCompleted.current) {
        hasCompleted.current = true;
        onComplete(content);
      }
      return;
    }

    const words = cleanContent.split(/(\s+)/);
    const typeNextWord = () => {
      if (wordIndex.current >= words.length) {
        setIsTyping(false);
        if (isDone && !hasCompleted.current) {
          hasCompleted.current = true;
          onComplete(content);
        }
        return;
      }

      const word = words[wordIndex.current];
      setDisplayedContent(prev => prev + word);
      wordIndex.current++;

      // Calculate delay based on word length and punctuation
      let delay = 30; // base speed

      if (word.length > 8) delay += 40; // long words slower
      if (word.length < 3) delay -= 10; // short words faster

      if (word.includes('\n')) delay += 200; // line break pause
      else if (word.includes('.')) delay += 150; // period pause
      else if (word.includes(',')) delay += 80; // comma pause
      else if (word.includes(':') || word.includes(';')) delay += 100; // list/colon pause

      // Random variation
      delay += Math.random() * 20 - 10;

      timeoutRef.current = setTimeout(typeNextWord, Math.max(10, delay));
    };

    typeNextWord();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, isInstant, onComplete, isDone]);

  return (
    <div className="relative group">
      <div className="markdown-body prose prose-invert max-w-none">
        <Markdown>{displayedContent}</Markdown>
        {isTyping && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] align-middle"
          />
        )}
      </div>
      
      {isTyping && onStop && (
        <div className="mt-4 flex justify-start">
          <button
            onClick={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setIsTyping(false);
              onStop();
            }}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-red-500 rounded-sm" />
            Parar resposta
          </button>
        </div>
      )}
    </div>
  );
};
