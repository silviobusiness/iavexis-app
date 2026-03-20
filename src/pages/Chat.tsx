import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Zap, 
  Sparkles, 
  Save, 
  Library, 
  FileText, 
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  ChevronDown,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Você é o assistente inteligente, um ecossistema premium para designers esportivos.
Seu objetivo é guiar o usuário no fluxo: IDEIA → EXECUÇÃO → CONTEÚDO → AUTORIDADE → VENDA → CRESCIMENTO.

Regras de Resposta:
1. Seja técnico, profissional e inspirador.
2. Use terminologia de design esportivo (composição, tipografia, efeitos, texturas, iluminação).
3. Sempre sugira termos de busca para o Canva em Português e Inglês.
4. Quando detectar potencial de conteúdo, sugira posts, reels ou carrosséis.
5. Divida projetos complexos em etapas: Conceito, Composição, Efeitos, Elementos Canva, Variações.
6. Mantenha um tom de parceiro estratégico.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá, Designer. Como posso elevar seu projeto esportivo hoje? Estou pronto para transformar suas ideias em autoridade e vendas.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('concept');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.concat(userMessage).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'Desculpe, tive um problema ao processar sua solicitação.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro ao conectar com a inteligência artificial. Verifique sua conexão.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const improvePrompt = () => {
    if (!input.trim()) return;
    setInput(`Melhore este prompt para design esportivo de alto nível: ${input}`);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)] space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-neon/10 border border-green-neon/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-neon" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">IA Assistant</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-neon rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-neon uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-surface-1 border border-white/5 rounded-xl p-1">
          {['concept', 'composition', 'effects', 'canva', 'growth'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === m ? "bg-green-neon text-black" : "text-gray-400 hover:text-white"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 bg-surface-1 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                msg.role === 'user' ? "bg-white/5 border-white/10" : "bg-green-neon/10 border-green-neon/20"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-400" /> : <Bot className="w-5 h-5 text-green-neon" />}
              </div>
              
              <div className={cn(
                "max-w-[80%] space-y-4",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-white/5 text-white border border-white/10 rounded-tr-none" 
                    : "bg-surface-2 text-gray-200 border border-white/5 rounded-tl-none"
                )}>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-green-neon hover:border-green-neon/50 transition-all group">
                      <Save className="w-4 h-4" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">Save to Project</span>
                    </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-purple-neon hover:border-purple-neon/50 transition-all group">
                      <Library className="w-4 h-4" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">Add to Library</span>
                    </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/50 transition-all group">
                      <FileText className="w-4 h-4" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">Convert to Proposal</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-neon/10 border border-green-neon/20 rounded-xl flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-green-neon animate-pulse" />
              </div>
              <div className="bg-surface-2 border border-white/5 p-5 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-green-neon rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-surface-2 border-t border-white/5 space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={improvePrompt}
              className="px-3 py-1.5 bg-purple-neon/10 border border-purple-neon/20 rounded-lg text-[10px] font-bold text-purple-neon uppercase tracking-widest hover:bg-purple-neon/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" />
              Melhorar Prompt
            </button>
            <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <ImageIcon className="w-3 h-3" />
              Attach Image
            </button>
          </div>
          
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Descreva sua ideia esportiva..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-16 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-green-neon focus:ring-1 focus:ring-green-neon/20 transition-all resize-none min-h-[100px]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-4 right-4 p-3 bg-green-neon text-black rounded-lg hover:bg-green-neon/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
