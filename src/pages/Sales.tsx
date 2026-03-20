import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  DollarSign, 
  Users, 
  FileText, 
  Calculator, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Briefcase,
  Zap,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const initialColumns = {
  'lead': {
    id: 'lead',
    title: 'Leads',
    items: [
      { id: '1', name: 'Nike Concept', client: 'Nike', value: 'R$ 4.500', status: 'new', avatar: 'https://picsum.photos/seed/user1/100/100' },
      { id: '2', name: 'Red Bull Branding', client: 'Red Bull', value: 'R$ 8.000', status: 'new', avatar: 'https://picsum.photos/seed/user2/100/100' },
    ]
  },
  'qualification': {
    id: 'qualification',
    title: 'Qualificação',
    items: [
      { id: '3', name: 'NBA Social Kit', client: 'NBA', value: 'R$ 3.200', status: 'active', avatar: 'https://picsum.photos/seed/user3/100/100' },
    ]
  },
  'proposal': {
    id: 'proposal',
    title: 'Proposta',
    items: [
      { id: '4', name: 'F1 Poster Series', client: 'Formula 1', value: 'R$ 12.000', status: 'active', avatar: 'https://picsum.photos/seed/user4/100/100' },
    ]
  },
  'negotiation': {
    id: 'negotiation',
    title: 'Negociação',
    items: [
      { id: '5', name: 'Esports Jersey', client: 'LOUD', value: 'R$ 5.500', status: 'urgent', avatar: 'https://picsum.photos/seed/user5/100/100' },
    ]
  },
  'closed': {
    id: 'closed',
    title: 'Fechado',
    items: [
      { id: '6', name: 'Adidas Campaign', client: 'Adidas', value: 'R$ 15.000', status: 'completed', avatar: 'https://picsum.photos/seed/user6/100/100' },
    ]
  }
};

export const Sales: React.FC = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId as keyof typeof columns];
      const destColumn = columns[destination.droppableId as keyof typeof columns];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
    } else {
      const column = columns[source.droppableId as keyof typeof columns];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems },
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">Sales System</h1>
          <p className="text-gray-400 font-medium">Manage leads, proposals, and scale your revenue.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Price Calculator
          </button>
          <button className="px-6 py-3 bg-green-neon text-black rounded-xl text-sm font-bold hover:bg-green-neon/90 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Lead
          </button>
        </div>
      </header>

      {/* Metrics Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-1 border border-white/5 p-6 rounded-xl space-y-2">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Pipeline Value</p>
          <h3 className="text-2xl font-bold text-white">R$ 33.200,00</h3>
          <div className="flex items-center gap-1 text-green-neon text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            +15% this month
          </div>
        </div>
        <div className="bg-surface-1 border border-white/5 p-6 rounded-xl space-y-2">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Conversion Rate</p>
          <h3 className="text-2xl font-bold text-white">24.5%</h3>
          <div className="flex items-center gap-1 text-purple-neon text-xs font-bold">
            <Zap className="w-3 h-3" />
            Optimized
          </div>
        </div>
        <div className="bg-surface-1 border border-white/5 p-6 rounded-xl space-y-2">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Active Leads</p>
          <h3 className="text-2xl font-bold text-white">12</h3>
          <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
            <Users className="w-3 h-3" />
            High potential
          </div>
        </div>
      </section>

      {/* Pipeline View */}
      <div className="bg-surface-1 border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold tracking-tight text-white uppercase italic">Sales Pipeline</h3>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'pipeline' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              List
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="w-72 shrink-0 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{column.title}</h4>
                    <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                      {column.items.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "space-y-3 min-h-[400px] p-2 rounded-xl transition-all",
                        snapshot.isDraggingOver ? "bg-white/[0.03]" : "bg-transparent"
                      )}
                    >
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-surface-2 border border-white/5 p-4 rounded-xl space-y-3 hover:border-white/10 transition-all group",
                                snapshot.isDragging ? "shadow-2xl border-green-neon/50 scale-105" : ""
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <h5 className="text-sm font-bold text-white group-hover:text-green-neon transition-all">{item.name}</h5>
                                <button className="text-gray-600 hover:text-white transition-all">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <img src={item.avatar} alt={item.client} className="w-5 h-5 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.client}</span>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-xs font-bold text-white">{item.value}</span>
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  item.status === 'urgent' ? "bg-red-500 animate-pulse" : 
                                  item.status === 'new' ? "bg-purple-neon" : 
                                  item.status === 'completed' ? "bg-green-neon" : "bg-gray-500"
                                )} />
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
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Stalled Leads Alert */}
      <section className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase italic">Stalled Leads Detected</h3>
            <p className="text-sm text-gray-400">3 proposals haven't been opened in the last 48 hours. Take action now.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
          View Stalled Leads
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
