import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Users, FileText, Calculator, Plus, MoreVertical, Download, X, Edit2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useDashboard } from '../contexts/DashboardContext';
import { Lead, LeadStatus } from '../types';
import { generateAIProposal } from '../services/geminiService';

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'contato', title: 'Contato Inicial', color: 'bg-zinc-500' },
  { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-500' },
  { id: 'proposta', title: 'Proposta Enviada', color: 'bg-amber-500' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-purple-500' },
  { id: 'fechado', title: 'Fechado (Ganho)', color: 'bg-emerald-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500' },
];

const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'João Silva', project: 'Identidade Visual', value: 1500, status: 'contato' },
  { id: '2', name: 'Maria Souza', project: 'Social Media', value: 800, status: 'qualificacao' },
  { id: '3', name: 'Carlos Santos', project: 'Banner YouTube', value: 300, status: 'proposta' },
];

export function SalesSystem() {
  const { addProject, leads, addLead, updateLeadStatus, updateLead, deleteLead } = useDashboard();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'proposals' | 'calculator'>('pipeline');

  const [hours, setHours] = useState<number | ''>('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [extraCosts, setExtraCosts] = useState<number | ''>('');
  const [profitMargin, setProfitMargin] = useState<number | ''>('');

  // New Lead Modal State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    project: '',
    value: ''
  });

  // Edit Lead Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Proposal State
  const [proposalData, setProposalData] = useState({
    clientName: '',
    projectName: '',
    description: '',
    deliverables: '',
    timeline: '',
    investment: ''
  });

  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  const calculateTotal = () => {
    const h = Number(hours) || 0;
    const r = Number(hourlyRate) || 0;
    const c = Number(extraCosts) || 0;
    const m = Number(profitMargin) || 0;
    
    const base = (h * r) + c;
    const total = base + (base * (m / 100));
    return total;
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLead.name && newLead.project && newLead.value) {
      addLead({
        name: newLead.name,
        project: newLead.project,
        value: Number(newLead.value),
        status: 'contato'
      });
      setIsLeadModalOpen(false);
      setNewLead({ name: '', project: '', value: '' });
    }
  };

  const handleEditLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(editingLead.id, {
        name: editingLead.name,
        project: editingLead.project,
        value: Number(editingLead.value),
        notes: editingLead.notes,
        followUpDate: editingLead.followUpDate
      });
      setIsEditModalOpen(false);
      setEditingLead(null);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead(id);
    }
  };

  const handleGenerateAIProposal = async () => {
    if (!proposalData.clientName || !proposalData.projectName || !proposalData.description) {
      alert('Por favor, preencha o nome do cliente, projeto e descrição para gerar a proposta com IA.');
      return;
    }

    setIsGeneratingProposal(true);
    try {
      const result = await generateAIProposal(
        proposalData.clientName,
        proposalData.projectName,
        proposalData.description
      );

      if (result) {
        setProposalData(prev => ({
          ...prev,
          description: result.description || prev.description,
          deliverables: result.deliverables || prev.deliverables,
          timeline: result.timeline || prev.timeline,
          investment: result.investment || prev.investment
        }));
      }
    } catch (error) {
      console.error('Error generating AI proposal:', error);
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const lead = leads.find(l => l.id === draggableId);
    
    updateLeadStatus(draggableId, destination.droppableId as LeadStatus);

    // If moved to "fechado", automatically create a project
    if (destination.droppableId === 'fechado' && lead && source.droppableId !== 'fechado') {
      addProject({
        title: lead.project,
        clientName: lead.name,
        value: lead.value,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 15 days
        status: 'briefing'
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0B0B] p-8 overflow-hidden relative">
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#EAEAEA] tracking-tight">Sistema de Vendas</h1>
            <p className="text-[#888888] mt-1">Gerencie seus leads, propostas e precificação.</p>
          </div>
          <button 
            onClick={() => setIsLeadModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-br from-[#00FF00] to-[#008000] text-black font-bold rounded-[6px] hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,0,0.2)] interactive-hover interactive-click"
          >
            <Plus className="w-5 h-5" />
            Novo Lead
          </button>
        </div>

      <AnimatePresence>
        {isLeadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="premium-card p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#EAEAEA]">Novo Lead</h3>
                <button onClick={() => setIsLeadModalOpen(false)} className="text-[#888888] hover:text-[#EAEAEA] transition-all interactive-hover interactive-click p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Nome do Lead / Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={newLead.name}
                    onChange={e => setNewLead({...newLead, name: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Projeto / Serviço</label>
                  <input 
                    type="text" 
                    required
                    value={newLead.project}
                    onChange={e => setNewLead({...newLead, project: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                    placeholder="Ex: Identidade Visual"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Valor Estimado (R$)</label>
                  <input 
                    type="number" 
                    required
                    value={newLead.value}
                    onChange={e => setNewLead({...newLead, value: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                    placeholder="Ex: 1500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-br from-[#00FF00] to-[#008000] text-black font-bold rounded-[6px] hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,255,0,0.1)]"
                >
                  Adicionar Lead
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="premium-card p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#EAEAEA]">Editar Lead</h3>
                <button onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }} className="text-[#888888] hover:text-[#EAEAEA] transition-all interactive-hover interactive-click p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditLead} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Nome do Lead / Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={editingLead.name}
                    onChange={e => setEditingLead({...editingLead, name: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Projeto / Serviço</label>
                  <input 
                    type="text" 
                    required
                    value={editingLead.project}
                    onChange={e => setEditingLead({...editingLead, project: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Valor Estimado (R$)</label>
                  <input 
                    type="number" 
                    required
                    value={editingLead.value}
                    onChange={e => setEditingLead({...editingLead, value: Number(e.target.value)})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Data de Retorno</label>
                  <input 
                    type="date" 
                    value={editingLead.followUpDate || ''}
                    onChange={e => setEditingLead({...editingLead, followUpDate: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#888888]">Anotações</label>
                  <textarea 
                    value={editingLead.notes || ''}
                    onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors h-24 resize-none" 
                    placeholder="Adicione notas sobre a negociação..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-br from-[#00FF00] to-[#008000] text-black font-bold rounded-[6px] hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,255,0,0.1)]"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-[6px] font-bold transition-all interactive-hover interactive-click",
            activeTab === 'pipeline' ? "bg-gradient-to-br from-[#00FF00]/20 to-[#008000]/20 text-[#00FF00] border border-[#00FF00]/30" : "text-[#888888] hover:text-[#EAEAEA] hover:bg-[#111111]"
          )}
        >
          <Users className="w-5 h-5" />
          Pipeline (CRM)
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-[6px] font-bold transition-all interactive-hover interactive-click",
            activeTab === 'proposals' ? "bg-gradient-to-br from-[#00FF00]/20 to-[#008000]/20 text-[#00FF00] border border-[#00FF00]/30" : "text-[#888888] hover:text-[#EAEAEA] hover:bg-[#111111]"
          )}
        >
          <FileText className="w-5 h-5" />
          Gerador de Propostas
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-[6px] font-bold transition-all interactive-hover interactive-click",
            activeTab === 'calculator' ? "bg-gradient-to-br from-[#00FF00]/20 to-[#008000]/20 text-[#00FF00] border border-[#00FF00]/30" : "text-[#888888] hover:text-[#EAEAEA] hover:bg-[#111111]"
          )}
        >
          <Calculator className="w-5 h-5" />
          Calculadora de Preço
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'pipeline' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full overflow-x-auto pb-4">
              {COLUMNS.map((column) => {
                const columnLeads = leads.filter((l) => l.status === column.id);

                return (
                  <div key={column.id} className="flex-1 min-w-[280px] bg-[#111111]/60 rounded-[6px] p-4 border border-zinc-800/50 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full", column.color)} />
                        <h4 className="font-bold text-[#EAEAEA] text-sm uppercase tracking-wider">{column.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-[#888888] bg-black/40 px-2 py-1 rounded-[6px] border border-zinc-800">
                        {columnLeads.length}
                      </span>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={clsx(
                            "flex-1 flex flex-col gap-3 transition-colors rounded-[6px] overflow-y-auto",
                            snapshot.isDraggingOver ? "bg-white/5" : ""
                          )}
                        >
                          {columnLeads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={clsx(
                                    "bg-[#161616] p-4 rounded-[6px] border border-zinc-800 shadow-sm group hover:border-[#00FF00]/30 transition-all",
                                    snapshot.isDragging ? "shadow-xl shadow-[#00FF00]/10 border-[#00FF00]/50 rotate-1 scale-102" : ""
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-sm text-[#EAEAEA] line-clamp-1">{lead.name}</h5>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingLead(lead);
                                          setIsEditModalOpen(true);
                                        }}
                                        className="text-[#888888] hover:text-[#EAEAEA] p-1 transition-all interactive-hover interactive-click"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteLead(lead.id)}
                                        className="text-[#888888] hover:text-red-400 p-1 transition-all interactive-hover interactive-click"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="text-xs text-[#888888] truncate">{lead.project}</div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs font-bold text-[#00FF00]">
                                        <DollarSign className="w-3 h-3" />
                                        <span>R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                      {lead.followUpDate && (
                                        <div className="text-[10px] text-[#888888] font-medium">
                                          Retorno: {new Date(lead.followUpDate).toLocaleDateString('pt-BR')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {activeTab === 'proposals' && (
          <div className="h-full overflow-y-auto p-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
              <div className="premium-card p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#EAEAEA]">Dados da Proposta</h3>
                  <button
                    onClick={handleGenerateAIProposal}
                    disabled={isGeneratingProposal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30 rounded-[6px] text-xs font-bold hover:bg-[#00FF00]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingProposal ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Gerar com IA
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Nome do Cliente</label>
                    <input 
                      type="text" 
                      value={proposalData.clientName}
                      onChange={e => setProposalData({...proposalData, clientName: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                      placeholder="Ex: Nike Brasil"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Nome do Projeto</label>
                    <input 
                      type="text" 
                      value={proposalData.projectName}
                      onChange={e => setProposalData({...proposalData, projectName: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                      placeholder="Ex: Identidade Visual 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Descrição do Projeto</label>
                    <textarea 
                      value={proposalData.description}
                      onChange={e => setProposalData({...proposalData, description: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors h-24 resize-none" 
                      placeholder="Descreva o escopo do projeto..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Entregáveis (um por linha)</label>
                    <textarea 
                      value={proposalData.deliverables}
                      onChange={e => setProposalData({...proposalData, deliverables: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors h-24 resize-none" 
                      placeholder="- Logotipo principal&#10;- Paleta de cores&#10;- Manual da marca"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#888888]">Prazo (Dias)</label>
                      <input 
                        type="text" 
                        value={proposalData.timeline}
                        onChange={e => setProposalData({...proposalData, timeline: e.target.value})}
                        className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                        placeholder="Ex: 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#888888]">Investimento (R$)</label>
                      <input 
                        type="text" 
                        value={proposalData.investment}
                        onChange={e => setProposalData({...proposalData, investment: e.target.value})}
                        className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" 
                        placeholder="Ex: 5000,00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 flex flex-col h-full min-h-[600px] shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#EAEAEA]">Preview da Proposta</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#00FF00] to-[#008000] text-black font-bold rounded-[6px] hover:brightness-110 transition-all text-sm shadow-[0_0_10px_rgba(0,255,0,0.1)] interactive-hover interactive-click">
                    <Download className="w-4 h-4" />
                    Exportar PDF
                  </button>
                </div>
                
                <div className="flex-1 bg-[#EAEAEA] rounded-[6px] p-8 text-black overflow-y-auto">
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center border-b border-zinc-300 pb-8">
                      <h1 className="text-3xl font-bold text-black mb-2">Proposta Comercial</h1>
                      <p className="text-zinc-600">Para: {proposalData.clientName || '[Nome do Cliente]'}</p>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-black mb-4">1. O Projeto</h2>
                      <p className="text-zinc-700 whitespace-pre-wrap">
                        {proposalData.description || 'Descrição detalhada do projeto aparecerá aqui...'}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-black mb-4">2. Entregáveis</h2>
                      <ul className="list-disc list-inside text-zinc-700 space-y-2">
                        {proposalData.deliverables ? (
                          proposalData.deliverables.split('\n').map((item, i) => (
                            <li key={i}>{item.replace(/^- /, '')}</li>
                          ))
                        ) : (
                          <>
                            <li>Item 1</li>
                            <li>Item 2</li>
                            <li>Item 3</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t border-zinc-300 pt-8">
                      <div>
                        <h2 className="text-xl font-bold text-black mb-2">Cronograma</h2>
                        <p className="text-zinc-700">{proposalData.timeline ? `${proposalData.timeline} dias úteis` : '[Prazo]'}</p>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-black mb-2">Investimento</h2>
                        <p className="text-2xl font-bold text-[#008000]">
                          R$ {proposalData.investment || '0,00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto relative z-10">
            <div className="w-full max-w-2xl premium-card p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#00FF00]/10 rounded-[6px] flex items-center justify-center border border-[#00FF00]/20">
                  <Calculator className="w-6 h-6 text-[#00FF00]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#EAEAEA]">Calculadora Inteligente</h3>
                  <p className="text-[#888888]">Calcule o valor ideal para o seu projeto.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Horas Estimadas</label>
                    <input type="number" value={hours} onChange={e => setHours(Number(e.target.value) || '')} placeholder="Ex: 10" className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Valor da Hora (R$)</label>
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || '')} placeholder="Ex: 80" className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Custos Extras (R$)</label>
                    <input type="number" value={extraCosts} onChange={e => setExtraCosts(Number(e.target.value) || '')} placeholder="Ex: 50" className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#888888]">Margem de Lucro (%)</label>
                    <input type="number" value={profitMargin} onChange={e => setProfitMargin(Number(e.target.value) || '')} placeholder="Ex: 20" className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-[#EAEAEA] focus:outline-none focus:border-[#00FF00] transition-colors" />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#888888] font-bold">Valor Sugerido:</span>
                    <span className="text-3xl font-black text-[#00FF00]">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setProposalData(prev => ({
                        ...prev,
                        investment: calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }));
                      setActiveTab('proposals');
                    }}
                    className="w-full py-4 bg-gradient-to-br from-[#00FF00] to-[#008000] text-black font-black rounded-[6px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,255,0,0.2)] interactive-hover interactive-click"
                  >
                    Gerar Proposta com este Valor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
