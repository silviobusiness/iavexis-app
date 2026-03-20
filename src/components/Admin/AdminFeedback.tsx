import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Filter, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  type: 'positive' | 'negative' | 'text';
  content?: string;
  category?: string;
  associatedFunction?: string;
  chatId?: string;
  messageId?: string;
  createdAt: string;
  timestamp: Timestamp;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbacks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const positive = feedbacks.filter(f => f.type === 'positive').length;
    const negative = feedbacks.filter(f => f.type === 'negative').length;
    const text = feedbacks.filter(f => f.type === 'text').length;

    const categories = feedbacks.reduce((acc: any, f) => {
      if (f.category) {
        acc[f.category] = (acc[f.category] || 0) + 1;
      }
      return acc;
    }, {});

    const functions = feedbacks.reduce((acc: any, f) => {
      if (f.associatedFunction) {
        acc[f.associatedFunction] = (acc[f.associatedFunction] || 0) + 1;
      }
      return acc;
    }, {});

    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));
    const functionData = Object.entries(functions).map(([name, value]) => ({ name, value }));

    const typeData = [
      { name: 'Positivo', value: positive },
      { name: 'Negativo', value: negative },
      { name: 'Texto', value: text },
    ];

    return {
      total,
      positive,
      negative,
      text,
      positiveRate: total > 0 ? Math.round((positive / (positive + negative)) * 100) : 0,
      categoryData,
      functionData,
      typeData
    };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchesType = filterType === 'all' || f.type === filterType;
      const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
      const matchesSearch = !searchTerm || 
        f.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.associatedFunction?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [feedbacks, filterType, filterCategory, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-emerald-400" />
            Feedback Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">Análise de satisfação e insights dos usuários.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-300">Últimos 30 dias</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total de Feedbacks" 
          value={stats.total} 
          icon={<MessageSquare className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard 
          title="Taxa de Aprovação" 
          value={`${stats.positiveRate}%`} 
          icon={<ThumbsUp className="w-5 h-5" />}
          color="emerald"
          trend={stats.positiveRate > 70 ? 'up' : 'down'}
        />
        <MetricCard 
          title="Feedbacks Positivos" 
          value={stats.positive} 
          icon={<ThumbsUp className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard 
          title="Feedbacks Negativos" 
          value={stats.negative} 
          icon={<ThumbsDown className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution by Type */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Distribuição por Tipo</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Feedback por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Insights Automáticos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-bold">Área Crítica</span>
            </div>
            <p className="text-zinc-400 text-sm">
              {stats.functionData.length > 0 
                ? `A função "${(stats.functionData.sort((a: any, b: any) => b.value - a.value)[0] as any).name}" recebeu o maior volume de feedback.`
                : "Aguardando mais dados para gerar insights."}
            </p>
          </div>
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-bold">Ponto Forte</span>
            </div>
            <p className="text-zinc-400 text-sm">
              {stats.positiveRate > 80 
                ? "A satisfação geral está excelente, com mais de 80% de feedbacks positivos."
                : "Continue monitorando os feedbacks para identificar pontos de melhoria."}
            </p>
          </div>
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-bold">Padrão de Uso</span>
            </div>
            <p className="text-zinc-400 text-sm">
              {stats.categoryData.length > 0
                ? `A categoria "${(stats.categoryData.sort((a: any, b: any) => b.value - a.value)[0] as any).name}" é a mais comentada pelos usuários.`
                : "Aguardando mais dados para identificar padrões."}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Lista de Feedbacks</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Buscar feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all w-64"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="all">Todos os Tipos</option>
              <option value="positive">Positivo</option>
              <option value="negative">Negativo</option>
              <option value="text">Texto</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Mensagem</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Função</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredFeedbacks.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {f.type === 'positive' && <ThumbsUp className="w-5 h-5 text-emerald-400" />}
                    {f.type === 'negative' && <ThumbsDown className="w-5 h-5 text-red-400" />}
                    {f.type === 'text' && <MessageSquare className="w-5 h-5 text-blue-400" />}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-300 max-w-xs truncate">{f.content || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-400">
                      {f.category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-500">{f.associatedFunction || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-400">{f.userEmail}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-zinc-500">
                      {format(new Date(f.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFeedbacks.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              Nenhum feedback encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }: { title: string, value: string | number, icon: React.ReactNode, color: string, trend?: 'up' | 'down' }) {
  const colorClasses: any = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={clsx("p-2 rounded-xl border", colorClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={clsx(
            "flex items-center gap-1 text-xs font-bold",
            trend === 'up' ? 'text-emerald-400' : 'text-red-400'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trend === 'up' ? '+12%' : '-5%'}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-zinc-500">{title}</h4>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
