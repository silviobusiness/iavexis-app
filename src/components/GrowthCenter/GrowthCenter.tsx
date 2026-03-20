import React, { useState, useMemo, useEffect } from 'react';
import { useGrowth, Lead, LeadStatus, LeadType, SocialMetric, ContentSuggestion, PostPerformance } from '../../contexts/GrowthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight, 
  Activity, 
  Users, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Flame, 
  AlertTriangle, 
  XCircle, 
  BarChart3, 
  PieChart as PieChartIcon, 
  MousePointer2, 
  Target, 
  ArrowUpRight, 
  LayoutDashboard, 
  Database,
  Calendar,
  MessageSquare,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Eye,
  Share2,
  MessageCircle,
  Heart,
  Bookmark,
  FileText,
  Calculator
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { LeadModal } from './LeadModal';
import { LeadDetails } from './LeadDetails';
import { ProfileHeader } from '../ProfileHeader';
import { Tooltip as UITooltip } from '../Tooltip';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';

// --- Sub-components ---

const CountUp = ({ value, duration = 1 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end);

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const STAGES: LeadStatus[] = ["novo_lead", "contato_iniciado", "proposta_enviada", "negociacao", "aguardando_resposta", "fechado"];

const STAGE_LABELS: Record<LeadStatus, string> = {
  novo_lead: "Novo Lead",
  contato_iniciado: "Contato Iniciado",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  aguardando_resposta: "Aguardando Resposta",
  fechado: "Fechado"
};

const STAGE_COLORS: Record<LeadStatus, string> = {
  novo_lead: "#3b82f6", // blue
  contato_iniciado: "#8b5cf6", // violet
  proposta_enviada: "#f59e0b", // amber
  negociacao: "#f97316", // orange
  aguardando_resposta: "#ef4444", // red
  fechado: "#10b981" // emerald
};

export function GrowthCenter() {
  const { 
    leads, 
    socialMetrics, 
    suggestions, 
    postPerformance, 
    loading, 
    updateLead, 
    createLead,
    updateSocialMetrics 
  } = useGrowth();
  const { submitFeedback } = useFeedback();
  const [activeTab, setActiveTab] = useState<'crm' | 'social' | 'proposals' | 'calculator'>('crm');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LeadType | 'todos'>('todos');
  const [showCharts, setShowCharts] = useState(true);
  const [hoveredStage, setHoveredStage] = useState<LeadStatus | null>(null);
  const [activeFilterStage, setActiveFilterStage] = useState<LeadStatus | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'hot' | 'waiting'>('all');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Calculator State
  const [hours, setHours] = useState<number | ''>('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  const [extraCosts, setExtraCosts] = useState<number | ''>('');
  const [profitMargin, setProfitMargin] = useState<number | ''>('');

  // Proposal State
  const [proposalData, setProposalData] = useState({
    clientName: '',
    projectName: '',
    description: '',
    deliverables: '',
    timeline: '',
    investment: ''
  });

  const calculateTotal = () => {
    const h = Number(hours) || 0;
    const r = Number(hourlyRate) || 0;
    const c = Number(extraCosts) || 0;
    const m = Number(profitMargin) || 0;
    
    const base = (h * r) + c;
    const total = base + (base * (m / 100));
    return total;
  };

  // Dashboard Metrics
  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => l.status === 'fechado').length;
  const activeLeads = totalLeads - closedLeads;
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // Trend Logic (Mocked for demo, should be calculated from history)
  const leadsTrend = { value: "+2 hoje", color: "text-emerald-400", bg: "bg-emerald-400/10" };
  const conversionTrend = { value: "acima da média", color: "text-emerald-400", bg: "bg-emerald-400/10" };
  const closedTrend = { value: "melhor da semana", color: "text-emerald-400", bg: "bg-emerald-400/10" };

  // Foco do Dia Metrics
  const hotLeadsCount = leads.filter(l => l.score === 'Alta' && l.status !== 'fechado').length;
  const waitingResponseCount = leads.filter(l => l.status === 'aguardando_resposta').length;
  const dailyGoal = 5; // Mocked goal
  const dailyProgress = leads.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.updatedAt?.startsWith(today) && l.status === 'fechado';
  }).length;

  // Intelligent Insights
  const insights = useMemo(() => {
    const list = [];
    const stalledLeads = leads.filter(l => {
      const days = differenceInDays(new Date(), new Date(l.createdAt));
      return days > 7 && l.status !== 'fechado';
    });
    
    if (stalledLeads.length > 0) {
      list.push({
        text: `Você tem ${stalledLeads.length} leads sem movimentação há mais de uma semana.`,
        icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
        action: "Revisar agora"
      });
    }

    if (hotLeadsCount > 0) {
      list.push({
        text: `Alta chance de conversão: ${hotLeadsCount} leads quentes aguardam sua ação.`,
        icon: <Flame className="w-4 h-4 text-orange-500" />,
        action: "Ver leads"
      });
    }

    const needsFollowUp = leads.filter(l => {
      const days = l.lastContactAt ? differenceInDays(new Date(), new Date(l.lastContactAt)) : 0;
      return days > 2 && l.status !== 'fechado' && l.status !== 'novo_lead';
    });

    if (needsFollowUp.length > 0) {
      list.push({
        text: `${needsFollowUp.length} leads precisam de follow-up hoje.`,
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        action: "Iniciar contatos"
      });
    }

    return list;
  }, [leads, hotLeadsCount]);

  // Chart Data
  const funnelData = useMemo(() => {
    return STAGES.map(stage => ({
      stage,
      name: STAGE_LABELS[stage],
      value: leads.filter(l => l.status === stage).length,
      fill: STAGE_COLORS[stage]
    }));
  }, [leads]);

  const typeData = useMemo(() => {
    const types: LeadType[] = ["cliente", "influenciador", "parceiro"];
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: leads.filter(l => l.type === type).length
    }));
  }, [leads]);

  // Filter Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || lead.type === filterType;
    const matchesStage = !activeFilterStage || lead.status === activeFilterStage;
    
    let matchesMode = true;
    if (filterMode === 'hot') matchesMode = lead.score === 'Alta';
    if (filterMode === 'waiting') matchesMode = lead.status === 'aguardando_resposta';
    
    return matchesSearch && matchesType && matchesStage && matchesMode;
  });

  const handleQuickAdd = async (stage: LeadStatus) => {
    setLeadToEdit({
      status: stage,
    } as any);
    setIsModalOpen(true);
  };

  const seedSampleData = async () => {
    const samples = [
      { name: "Ana Silva", type: "influenciador" as LeadType, serviceType: "Campanha Verão", status: "novo_lead" as LeadStatus, score: "Alta" as any, socialMedia: "@anasilva", followers: 45000, niche: "Moda" },
      { name: "Tech Solutions", type: "cliente" as LeadType, serviceType: "Gestão de Tráfego", status: "negociacao" as LeadStatus, score: "Alta" as any, socialMedia: "techsolutions.com" },
      { name: "Marcos Oliveira", type: "parceiro" as LeadType, serviceType: "Co-branding", status: "contato_iniciado" as LeadStatus, score: "Baixa" as any, socialMedia: "@marcos_mkt" },
      { name: "Julia Costa", type: "influenciador" as LeadType, serviceType: "Unboxing", status: "fechado" as LeadStatus, score: "Alta" as any, socialMedia: "@juliacosta", followers: 120000, niche: "Beleza" },
    ];

    for (const sample of samples) {
      await createLead(sample as any);
    }

    // Seed Social Metrics
    await updateSocialMetrics({
      followers: 12500,
      engagement: 4.8,
      reach: 85000,
      impressions: 120000,
      platform: 'instagram',
      change: 5.2,
      value: 12500,
      name: 'Followers'
    });

    // Seed Suggestions (Manually via Firestore if needed, but I'll just add a few here if I had a createSuggestion function)
    // For now, I'll just assume the user will see empty states or I can add a seed function for them too.
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-400 font-medium">Carregando CRM...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-zinc-950 p-4 md:p-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 dashboard-grid z-0 opacity-40" />
      
      <div className="relative z-10 pr-2">
        <ProfileHeader />
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-500 text-glow-emerald" />
                </div>
                Central de Crescimento
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Gestão visual de alta performance para seus negócios.</p>
            </div>

            <div className="hidden md:flex items-center gap-3 border-l border-zinc-800 pl-8">
              <span className="text-xs text-zinc-500 font-medium">O CRM está sendo útil?</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => submitFeedback({ type: 'positive', associatedFunction: 'growth_center', content: 'CRM útil' })}
                  className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => submitFeedback({ type: 'negative', associatedFunction: 'growth_center', content: 'CRM não está sendo útil' })}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalLeads === 0 && (
              <button 
                onClick={seedSampleData}
                className="bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all text-xs border border-zinc-800 uppercase tracking-widest"
              >
                <Database className="w-4 h-4" />
                Gerar Amostras
              </button>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-sm uppercase tracking-wider"
              >
                <Plus className="w-5 h-5" />
                Ações Rápidas
                <ChevronDown className={clsx("w-4 h-4 transition-transform", isQuickActionsOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isQuickActionsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 premium-glass rounded-2xl p-2 z-50 border border-zinc-800/50"
                  >
                    <button 
                      onClick={() => {
                        setLeadToEdit(null);
                        setIsModalOpen(true);
                        setIsQuickActionsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                    >
                      <Users className="w-4 h-4 group-hover:text-emerald-400" />
                      Novo Lead
                    </button>
                    <button 
                      onClick={() => setIsQuickActionsOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                    >
                      <Calendar className="w-4 h-4 group-hover:text-emerald-400" />
                      Agendar Contato
                    </button>
                    <button 
                      onClick={() => setIsQuickActionsOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all group"
                    >
                      <CheckCircle2 className="w-4 h-4 group-hover:text-emerald-400" />
                      Nova Tarefa
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 w-fit mb-8">
          <button 
            onClick={() => setActiveTab('crm')}
            className={clsx(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'crm' ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Users className="w-4 h-4" />
            CRM & Leads
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={clsx(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'social' ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Activity className="w-4 h-4" />
            Social & Growth
          </button>
          <button 
            onClick={() => setActiveTab('proposals')}
            className={clsx(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'proposals' ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <FileText className="w-4 h-4" />
            Propostas
          </button>
          <button 
            onClick={() => setActiveTab('calculator')}
            className={clsx(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'calculator' ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Calculator className="w-4 h-4" />
            Calculadora
          </button>
        </div>

        {activeTab === 'crm' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Foco do Dia & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Foco do Dia */}
              <div className="lg:col-span-8 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-all duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Target className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">Foco do Dia</h2>
                        <p className="text-xs text-zinc-500 font-medium">Prioridades estratégicas para hoje.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Meta: {dailyGoal} fechados</span>
                      <div className="w-24 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div className="h-full bg-emerald-500" style={{ width: `${(dailyProgress / dailyGoal) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group/card">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-orange-500/10 rounded-lg">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Leads Quentes</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-white">{hotLeadsCount}</span>
                        <button 
                          onClick={() => setFilterMode('hot')}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
                        >
                          Ver <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group/card">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aguardando</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-white">{waitingResponseCount}</span>
                        <button 
                          onClick={() => setFilterMode('waiting')}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
                        >
                          Ver <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 hover:border-emerald-500/30 transition-all group/card">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fechados Hoje</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-white">{dailyProgress}</span>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                          {dailyProgress >= dailyGoal ? 'Meta Batida!' : `${dailyGoal - dailyProgress} faltam`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Inteligentes */}
              <div className="lg:col-span-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Insights</h2>
                    <p className="text-xs text-zinc-500 font-medium">IA analisando seus leads.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-start gap-3 group hover:border-purple-500/30 transition-all">
                      <div className="mt-0.5">{insight.icon}</div>
                      <div className="flex-1">
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{insight.text}</p>
                        {insight.action && (
                          <button className="text-[9px] font-black text-purple-500 uppercase tracking-widest mt-2 hover:text-purple-400 transition-colors">
                            {insight.action}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Tudo em dia!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {STAGES.map(stage => (
                <motion.div 
                  key={stage}
                  layout
                  className="flex flex-col bg-zinc-900/30 rounded-2xl border border-zinc-800/50 min-h-[500px] relative overflow-hidden group"
                  onMouseEnter={() => setHoveredStage(stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  <div className="p-4 flex flex-col h-full relative z-10">
                    {/* Header da Coluna */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{STAGE_LABELS[stage]}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                        {filteredLeads.filter(l => l.status === stage).length}
                      </span>
                    </div>

                    {(hoveredStage === stage || activeFilterStage === stage) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"
                      />
                    )}
                    {/* Column Progress Bar */}
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden mb-4 border border-zinc-900">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(filteredLeads.filter(l => l.status === stage).length / (totalLeads || 1)) * 100}%` }}
                        className="h-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: STAGE_COLORS[stage], color: STAGE_COLORS[stage] }}
                      />
                    </div>

                    <AnimatePresence>
                      {filteredLeads.filter(l => l.status === stage).map(lead => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                      ))}
                    </AnimatePresence>
                    
                    {filteredLeads.filter(l => l.status === stage).length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-950/50 flex items-center justify-center mb-4 border border-zinc-800">
                          <MousePointer2 className="w-6 h-6 text-zinc-700" />
                        </div>
                        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-4">Vazio</p>
                        <button 
                          onClick={() => handleQuickAdd(stage)}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-all py-2 px-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10"
                        >
                          + Novo Lead
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <SocialMediaView 
            metrics={socialMetrics} 
            suggestions={suggestions} 
            performance={postPerformance} 
          />
        )}

        {activeTab === 'proposals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <FileText className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Sistema de Propostas</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Gerador de Orçamentos Inteligentes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Cliente</label>
                  <input 
                    type="text" 
                    value={proposalData.clientName}
                    onChange={(e) => setProposalData({...proposalData, clientName: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: Clube Atlético Mineiro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Projeto</label>
                  <input 
                    type="text" 
                    value={proposalData.projectName}
                    onChange={(e) => setProposalData({...proposalData, projectName: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: Identidade Visual Temporada 2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Entregáveis</label>
                  <textarea 
                    value={proposalData.deliverables}
                    onChange={(e) => setProposalData({...proposalData, deliverables: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all min-h-[100px]"
                    placeholder="Ex: 1 Logo, 3 Variações, Manual da Marca..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Prazo Estimado</label>
                  <input 
                    type="text" 
                    value={proposalData.timeline}
                    onChange={(e) => setProposalData({...proposalData, timeline: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: 15 dias úteis"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Investimento (R$)</label>
                  <input 
                    type="text" 
                    value={proposalData.investment}
                    onChange={(e) => setProposalData({...proposalData, investment: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: 2.500,00"
                  />
                </div>
                <div className="pt-4">
                  <button className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" />
                    Gerar Proposta PDF
                  </button>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-4">
                    A proposta será gerada com sua identidade visual esportiva.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'calculator' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Calculator className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Calculadora de Preços</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Precificação Inteligente para Designers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horas Estimadas</label>
                <input 
                  type="number" 
                  value={hours} 
                  onChange={(e) => setHours(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valor da Hora (R$)</label>
                <input 
                  type="number" 
                  value={hourlyRate} 
                  onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Custos Extras (R$)</label>
                <input 
                  type="number" 
                  value={extraCosts} 
                  onChange={(e) => setExtraCosts(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Margem de Lucro (%)</label>
                <input 
                  type="number" 
                  value={profitMargin} 
                  onChange={(e) => setProfitMargin(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="p-8 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Total Sugerido para o Projeto</span>
                  <span className="text-5xl font-black text-white tracking-tighter">
                    R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setProposalData({
                      ...proposalData,
                      investment: calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    });
                    setActiveTab('proposals');
                  }}
                  className="px-8 py-4 bg-emerald-500 text-zinc-950 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  Usar na Proposta
                </button>
              </div>
            </div>
          </motion.div>
        )}

      {isModalOpen && (
        <LeadModal 
          onClose={() => {
            setIsModalOpen(false);
            setLeadToEdit(null);
          }} 
          leadToEdit={leadToEdit} 
        />
      )}
      {selectedLead && (
        <LeadDetails 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onEdit={() => {
            setLeadToEdit(selectedLead);
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  </div>
);
}

function LeadCard({ lead, onClick }: { lead: Lead, onClick: () => void }) {
  const daysSinceContact = lead.lastContactAt ? differenceInDays(new Date(), new Date(lead.lastContactAt)) : 0;
  const daysSinceCreation = lead.createdAt ? differenceInDays(new Date(), new Date(lead.createdAt)) : 0;
  
  // Alerts & Urgency
  const isStalled = daysSinceCreation > 7 && lead.status !== 'fechado';
  const needsFollowUp = daysSinceContact > 2 && lead.status !== 'fechado' && lead.status !== 'novo_lead';
  const isHot = lead.score === 'Alta';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={(e: any) => e.dataTransfer.setData('leadId', lead.id)}
      onClick={onClick}
      className={clsx(
        "p-4 rounded-2xl border cursor-pointer transition-all group relative premium-glass",
        isHot ? "border-orange-500/30 shadow-lg shadow-orange-500/10 bg-orange-500/5" : "border-zinc-800/50 hover:border-emerald-500/30",
        isStalled && !isHot && "border-red-500/20 bg-red-500/5",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
      )}
    >
      {/* Priority Sensor Glow */}
      {isHot && (
        <div className="absolute inset-0 rounded-2xl bg-orange-500/5 animate-pulse pointer-events-none" />
      )}
      {/* Priority Indicator Border */}
      <div className={clsx(
        "absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all z-20",
        lead.score === 'Alta' ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" :
        lead.score === 'Baixa' ? "bg-red-500" :
        "bg-zinc-700"
      )} />

      {/* Urgency Indicators */}
      <div className="absolute -top-2 -right-2 flex gap-1 z-10">
        {isHot && (
          <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl flex items-center gap-1 animate-pulse uppercase tracking-wider" title="Oportunidade Quente">
            <Flame className="w-3 h-3" /> Quente
          </div>
        )}
        {needsFollowUp && (
          <div className="bg-yellow-500 text-zinc-950 text-[9px] font-black px-2 py-1 rounded-lg shadow-xl flex items-center gap-1 uppercase tracking-wider" title="Precisa de Follow-up">
            <AlertTriangle className="w-3 h-3" /> {daysSinceContact}d
          </div>
        )}
        {isStalled && !isHot && (
          <div className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl flex items-center gap-1 uppercase tracking-wider animate-pulse" title="Lead Parado">
            <AlertCircle className="w-3 h-3" /> Parado
          </div>
        )}
      </div>

      <div className="pl-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors truncate tracking-tight">{lead.name}</h4>
              {isHot && <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-pulse" />}
            </div>
            {lead.socialMedia && (
              <p className="text-[10px] font-bold text-zinc-500 truncate uppercase tracking-widest">
                {lead.socialMedia.startsWith('@') ? lead.socialMedia : `@${lead.socialMedia.replace('https://instagram.com/', '')}`}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-medium text-zinc-400 line-clamp-1 leading-snug flex-1">{lead.serviceType}</p>
          {lead.niche && (
            <span className="text-[9px] font-black text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800 shrink-0 uppercase tracking-tighter">
              {lead.niche}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className={clsx(
              "px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5",
              lead.type === 'cliente' ? "bg-blue-500/10 text-blue-400" :
              lead.type === 'influenciador' ? "bg-purple-500/10 text-purple-400" :
              "bg-orange-500/10 text-orange-400"
            )}>
              {lead.type === 'cliente' && <Users className="w-3 h-3" />}
              {lead.type === 'influenciador' && <Zap className="w-3 h-3" />}
              {lead.type === 'parceiro' && <Activity className="w-3 h-3" />}
              {lead.type}
            </span>
          </div>

          <div className={clsx(
            "text-[9px] flex items-center gap-1.5 font-black uppercase tracking-widest transition-colors",
            daysSinceContact > 5 ? "text-red-400" : 
            daysSinceContact > 2 ? "text-yellow-400" : 
            "text-zinc-400 group-hover:text-emerald-400"
          )} title="Último contato">
            <Clock className="w-3 h-3" />
            <span>{daysSinceContact === 0 ? 'Hoje' : `há ${daysSinceContact}d`}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Social Media View ---

function SocialMediaView({ 
  metrics, 
  suggestions, 
  performance 
}: { 
  metrics: SocialMetric[], 
  suggestions: ContentSuggestion[], 
  performance: PostPerformance[] 
}) {
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-700/10' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  const filteredMetrics = metrics.filter(m => m.platform === selectedPlatform);
  const filteredSuggestions = suggestions.filter(s => s.platform === selectedPlatform);
  const filteredPerformance = performance.filter(p => p.platform === selectedPlatform);

  return (
    <div className="space-y-8 pb-20">
      {/* Platform Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar relative z-10">
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlatform(p.id)}
            className={clsx(
              "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shrink-0 group",
              selectedPlatform === p.id 
                ? "bg-zinc-900 border-zinc-700 shadow-xl shadow-black/20" 
                : "bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700"
            )}
          >
            <div className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              p.bg, p.color
            )}>
              <p.icon className="w-4 h-4" />
            </div>
            <span className={clsx(
              "text-xs font-black uppercase tracking-widest",
              selectedPlatform === p.id ? "text-white" : "text-zinc-500"
            )}>
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {filteredMetrics.map(metric => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Content Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Sugestões de Conteúdo</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Ideias validadas para sua audiência</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuggestions.map(suggestion => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>

        {/* Post Performance */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Performance Recente</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Análise dos últimos posts</p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPerformance.map(post => (
              <PerformanceCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: SocialMetric }) {
  const isPositive = metric.change >= 0;
  
  // Fake data for the sparkline
  const data = Array.from({ length: 10 }, (_, i) => ({
    value: metric.value * (0.8 + Math.random() * 0.4)
  }));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-5 rounded-3xl group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{metric.name}</span>
        <div className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter",
          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        )}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingUp className="rotate-180 w-3 h-3" />}
          {Math.abs(metric.change)}%
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-black text-white tracking-tighter">
          {metric.value.toLocaleString()}
        </div>
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={isPositive ? "#10b981" : "#ef4444"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#gradient-${metric.id})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ContentSuggestion }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-5 rounded-3xl group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 rounded-lg bg-zinc-950 text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800">
          {suggestion.type}
        </span>
        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-[9px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/10">
          {suggestion.potential} Potencial
        </span>
      </div>

      <h4 className="text-sm font-black text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">
        {suggestion.title}
      </h4>
      <p className="text-xs text-zinc-500 leading-relaxed mb-4">
        {suggestion.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Sugestão para {suggestion.platform}</span>
        </div>
        <button className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function PerformanceCard({ post }: { post: PostPerformance }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-4 rounded-2xl group flex gap-4"
    >
      <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 relative">
        <img 
          src={post.thumbnail} 
          alt={post.title}
          className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Eye className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[11px] font-black text-white truncate mb-2 uppercase tracking-tight">
          {post.title}
        </h4>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Likes</span>
            <div className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 text-pink-500" />
              <span className="text-[10px] font-black text-zinc-300">{post.engagement.likes}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Comentários</span>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-2.5 h-2.5 text-blue-400" />
              <span className="text-[10px] font-black text-zinc-300">{post.engagement.comments}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Salvos</span>
            <div className="flex items-center gap-1">
              <Bookmark className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] font-black text-zinc-300">{post.engagement.saves}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
