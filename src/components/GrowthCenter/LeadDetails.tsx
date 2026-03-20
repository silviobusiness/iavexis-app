import React, { useState, useMemo } from 'react';
import { Lead, useGrowth } from '../../contexts/GrowthContext';
import { X, MessageSquare, Plus, Zap, Send, FileText, Clock, ExternalLink, Activity, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { GoogleGenAI } from '@google/genai';

interface LeadDetailsProps {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
}

export function LeadDetails({ lead, onClose, onEdit }: LeadDetailsProps) {
  const { updateLead, addInteraction, deleteLead } = useGrowth();
  const [activeTab, setActiveTab] = useState<'detalhes' | 'historico' | 'proposta'>('detalhes');
  const [newInteraction, setNewInteraction] = useState('');
  const [interactionType, setInteractionType] = useState<'note' | 'message'>('note');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ action: string, message: string, timing: string, score?: string } | null>(null);
  
  // Pricing state
  const [hours, setHours] = useState(lead.projectHours || 0);
  const [valuePerHour, setValuePerHour] = useState(lead.valuePerHour || 0);
  const [extraCosts, setExtraCosts] = useState(lead.extraCosts || 0);
  const [margin, setMargin] = useState(lead.margin || 20);
  const [proposalText, setProposalText] = useState('');

  const totalPrice = useMemo(() => {
    const subtotal = (hours * valuePerHour) + extraCosts;
    return subtotal * (1 + margin / 100);
  }, [hours, valuePerHour, extraCosts, margin]);

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteraction.trim()) return;

    await addInteraction(lead.id, {
      type: interactionType,
      content: newInteraction.trim()
    });
    setNewInteraction('');
  };

  const generateNextAction = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
      Você é um assistente de vendas e crescimento para um designer esportivo. Analise este lead:
      Nome: ${lead.name}
      Tipo: ${lead.type}
      Serviço/Interesse: ${lead.serviceType}
      Status Atual: ${lead.status}
      Notas: ${lead.notes || 'Nenhuma'}
      Histórico de Interações: ${JSON.stringify(lead.history || [])}
      
      Sugira a próxima ação ideal para fechar negócio ou avançar a parceria.
      Retorne APENAS um objeto JSON válido com a seguinte estrutura:
      {
        "action": "Ação recomendada curta (ex: Enviar follow-up)",
        "message": "Mensagem pronta para enviar ao lead",
        "timing": "Quando enviar (ex: Hoje à tarde, Amanhã de manhã)",
        "score": "Alta" // ou "Baixa", avaliando a chance de fechamento
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAiSuggestion(result);
      
      if (result.score && ['Alta', 'Baixa'].includes(result.score) && result.score !== lead.score) {
        await updateLead(lead.id, { score: result.score as Lead['score'] });
      }

      // Save suggestion to history
      await addInteraction(lead.id, {
        type: 'system',
        content: `IA Sugeriu: ${result.action} (Score: ${result.score || 'N/A'})`
      });

    } catch (error) {
      console.error("Error generating action:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProposal = async () => {
    setIsGeneratingProposal(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
      Você é um designer esportivo profissional. Crie um rascunho de proposta comercial persuasiva para este lead.
      
      Dados do Lead:
      - Nome: ${lead.name}
      - Serviço: ${lead.serviceType}
      - Notas: ${lead.notes || 'Nenhuma'}
      - Valor Total: R$ ${totalPrice.toFixed(2)}
      
      Escreva um texto profissional, direto e focado em valor, oferecendo seus serviços de design esportivo.
      Estruture a proposta com:
      1. Saudação e Contexto
      2. O Problema/Oportunidade
      3. A Solução (Seus serviços)
      4. Investimento: R$ ${totalPrice.toFixed(2)}
      5. Próximos Passos
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const proposalText = response.text || '';
      setProposalText(proposalText);
      
      await addInteraction(lead.id, {
        type: 'note',
        content: `Proposta Gerada pela IA:\n\n${proposalText}`
      });

      setActiveTab('proposta');
    } catch (error) {
      console.error("Erro ao gerar proposta:", error);
      alert("Erro ao gerar proposta. Verifique sua chave de API.");
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) {
      await deleteLead(lead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/50">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-emerald-500 border border-zinc-700">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                {lead.name}
                <span className={clsx(
                  "text-xs px-2 py-1 rounded-full font-medium border",
                  lead.type === 'cliente' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  lead.type === 'influenciador' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  "bg-orange-500/10 text-orange-400 border-orange-500/20"
                )}>
                  {lead.type}
                </span>
              </h2>
              <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                <span className="flex items-center gap-1"><ExternalLink className="w-4 h-4" /> {lead.socialMedia || 'Sem rede social'}</span>
                {lead.followers && <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {lead.followers.toLocaleString()} seg.</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={lead.status}
              onChange={(e) => updateLead(lead.id, { status: e.target.value as any })}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="novo_lead">Novo Lead</option>
              <option value="contato_iniciado">Contato Iniciado</option>
              <option value="proposta_enviada">Proposta Enviada</option>
              <option value="negociacao">Negociação</option>
              <option value="aguardando_resposta">Aguardando Resposta</option>
              <option value="fechado">Fechado</option>
            </select>
            <button onClick={onEdit} className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors" title="Editar Lead">
              <Edit2 className="w-5 h-5" />
            </button>
            <button onClick={handleDelete} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors" title="Excluir Lead">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors" title="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Actions & Info */}
          <div className="w-1/3 border-r border-zinc-800 bg-zinc-950/30 p-6 overflow-y-auto flex flex-col gap-6">
            
            {/* AI Assistant Button */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" /> Assistente de Crescimento
              </h3>
              
              {aiSuggestion ? (
                <div className="space-y-3">
                  <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                    <span className="text-xs text-zinc-500 block mb-1">Ação Recomendada ({aiSuggestion.timing})</span>
                    <p className="text-sm text-zinc-200 font-medium">{aiSuggestion.action}</p>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 relative group">
                    <span className="text-xs text-zinc-500 block mb-1">Mensagem Sugerida</span>
                    <p className="text-sm text-zinc-300 italic">"{aiSuggestion.message}"</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(aiSuggestion.message)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 text-xs px-2 py-1 rounded transition-all"
                    >
                      Copiar
                    </button>
                  </div>
                  <button 
                    onClick={generateNextAction}
                    disabled={isGenerating}
                    className="w-full text-xs text-emerald-500 hover:text-emerald-400 mt-2"
                  >
                    {isGenerating ? 'Analisando...' : 'Gerar nova sugestão'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={generateNextAction}
                  disabled={isGenerating}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? 'Analisando histórico...' : 'Gerar Próxima Ação'}
                </button>
              )}
            </div>

            {/* Quick Info */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-zinc-500 block text-xs">Serviço/Interesse</span>
                  <span className="text-zinc-200">{lead.serviceType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs">Score de Oportunidade</span>
                  <select 
                    value={lead.score || 'Não avaliado'}
                    onChange={(e) => updateLead(lead.id, { score: e.target.value as any })}
                    className={clsx(
                      "mt-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none",
                      lead.score === 'Alta' ? "text-emerald-400 border-emerald-500/30" :
                      lead.score === 'Baixa' ? "text-red-400 border-red-500/30" : "text-zinc-400"
                    )}
                  >
                    <option value="Alta">Alta Chance</option>
                    <option value="Baixa">Baixa Chance</option>
                    <option value="Não avaliado">Não avaliado</option>
                  </select>
                </div>
                {lead.type === 'influenciador' && (
                  <>
                    <div>
                      <span className="text-zinc-500 block text-xs">Nicho</span>
                      <span className="text-zinc-200">{lead.niche || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-xs">Engajamento</span>
                      <span className="text-zinc-200">{lead.engagement ? `${lead.engagement}%` : '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Integração com o App</h3>
              <div className="space-y-2">
                <button 
                  onClick={generateProposal}
                  disabled={isGeneratingProposal}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm py-2 px-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  {isGeneratingProposal ? 'Gerando...' : 'Criar Proposta (IA)'}
                </button>
                <button 
                  onClick={() => window.open('https://www.canva.com', '_blank')}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm py-2 px-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span className="font-bold text-purple-500 italic text-base">Canva</span>
                  Criar arte para esse cliente
                </button>
                <button 
                  onClick={() => window.open('https://www.canva.com/templates/?query=sports', '_blank')}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm py-2 px-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span className="font-bold text-purple-500 italic text-base">Canva</span>
                  Usar template esportivo
                </button>
              </div>
            </div>

          </div>

          {/* Right Content - Tabs */}
          <div className="flex-1 flex flex-col bg-zinc-950">
            <div className="flex border-b border-zinc-800 px-6">
              <button 
                onClick={() => setActiveTab('detalhes')}
                className={clsx(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'detalhes' ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                Anotações
              </button>
              <button 
                onClick={() => setActiveTab('historico')}
                className={clsx(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'historico' ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                Histórico
              </button>
              <button 
                onClick={() => setActiveTab('proposta')}
                className={clsx(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'proposta' ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                Proposta
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'detalhes' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Anotações Gerais</label>
                    <textarea 
                      value={lead.notes || ''}
                      onChange={(e) => updateLead(lead.id, { notes: e.target.value })}
                      className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Adicione informações importantes sobre este lead..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Horas Estimadas</label>
                      <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Valor/Hora (R$)</label>
                      <input type="number" value={valuePerHour} onChange={(e) => setValuePerHour(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Custos Extras (R$)</label>
                      <input type="number" value={extraCosts} onChange={(e) => setExtraCosts(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Margem (%)</label>
                      <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100" />
                    </div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                    <span className="text-sm text-zinc-400">Preço Total Estimado:</span>
                    <span className="text-2xl font-bold text-emerald-400 ml-2">R$ {totalPrice.toFixed(2)}</span>
                    <button 
                      onClick={() => updateLead(lead.id, { projectHours: hours, valuePerHour, extraCosts, margin })}
                      className="ml-4 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-1 px-3 rounded-lg text-sm"
                    >
                      Salvar Preço
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'historico' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2">
                    {(!lead.history || lead.history.length === 0) ? (
                      <div className="text-center text-zinc-500 py-8">Nenhum histórico registrado.</div>
                    ) : (
                      lead.history.map((interaction) => (
                        <div key={interaction.id} className="flex gap-3">
                          <div className="mt-1">
                            {interaction.type === 'system' ? <Zap className="w-4 h-4 text-emerald-500" /> :
                             interaction.type === 'message' ? <MessageSquare className="w-4 h-4 text-blue-500" /> :
                             <FileText className="w-4 h-4 text-zinc-400" />}
                          </div>
                          <div className={clsx(
                            "flex-1 rounded-xl p-3 text-sm",
                            interaction.type === 'system' ? "bg-emerald-500/5 border border-emerald-500/10 text-emerald-100" :
                            "bg-zinc-900 border border-zinc-800 text-zinc-200"
                          )}>
                            <p>{interaction.content}</p>
                            <span className="text-[10px] text-zinc-500 mt-2 block flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(interaction.date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <form onSubmit={handleAddInteraction} className="relative mt-auto flex gap-2">
                    <select 
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value as 'note' | 'message')}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="note">Nota</option>
                      <option value="message">Mensagem</option>
                    </select>
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={newInteraction}
                        onChange={(e) => setNewInteraction(e.target.value)}
                        placeholder="Registrar nova interação ou nota..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        type="submit"
                        disabled={!newInteraction.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'proposta' && (
                <div className="space-y-4">
                  <textarea 
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    className="w-full h-96 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                      Exportar PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
