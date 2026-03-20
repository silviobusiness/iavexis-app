import React, { useState } from 'react';
import { X, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useFeedback } from '../../contexts/FeedbackContext';

interface NegativeFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
  messageId?: string;
  associatedFunction?: string;
}

export function NegativeFeedbackModal({ isOpen, onClose, chatId, messageId, associatedFunction }: NegativeFeedbackModalProps) {
  const [reason, setReason] = useState('Confuso');
  const [details, setDetails] = useState('');
  const { submitFeedback, isSubmitting } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitFeedback({
        type: 'negative',
        content: details || reason,
        category: reason,
        chatId,
        messageId,
        associatedFunction,
      });
      onClose();
      setDetails('');
    } catch (error) {
      console.error('Failed to submit negative feedback', error);
    }
  };

  const reasons = [
    'Confuso',
    'Não resolveu',
    'Genérico',
    'Incorreto',
    'Outro'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <h3 className="font-bold text-sm">O que deu errado?</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {reasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      reason === r 
                        ? "bg-red-500/10 border-red-500/50 text-red-400" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Conte-nos mais (opcional)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all h-24 resize-none"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Enviar
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
