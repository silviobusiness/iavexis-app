import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Layers,
  FileText,
  Image as ImageIcon,
  Zap,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const stages = [
  { id: 'concept', label: 'Conceito', color: 'text-purple-neon', bg: 'bg-purple-neon/10' },
  { id: 'composition', label: 'Composição', color: 'text-white', bg: 'bg-white/10' },
  { id: 'effects', label: 'Efeitos', color: 'text-green-neon', bg: 'bg-green-neon/10' },
  { id: 'review', label: 'Revisão', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'completed', label: 'Concluído', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const projects = [
  { id: 1, title: 'Nike Concept 2024', client: 'Nike', stage: 'effects', progress: 65, deadline: '2024-06-15', image: 'https://picsum.photos/seed/proj1/400/300' },
  { id: 2, title: 'Red Bull Branding', client: 'Red Bull', stage: 'completed', progress: 100, deadline: '2024-05-20', image: 'https://picsum.photos/seed/proj2/400/300' },
  { id: 3, title: 'F1 Poster Series', client: 'Formula 1', stage: 'composition', progress: 30, deadline: '2024-07-01', image: 'https://picsum.photos/seed/proj3/400/300' },
  { id: 4, title: 'NBA Social Kit', client: 'NBA', stage: 'review', progress: 90, deadline: '2024-06-10', image: 'https://picsum.photos/seed/proj4/400/300' },
  { id: 5, title: 'Esports Jersey Design', client: 'LOUD', stage: 'concept', progress: 15, deadline: '2024-07-15', image: 'https://picsum.photos/seed/proj5/400/300' },
];

export const Projects: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">Creative Locker</h1>
          <p className="text-gray-400 font-medium">Manage your elite sports design projects and workflows.</p>
        </div>
        <button className="px-6 py-3 bg-green-neon text-black rounded-xl text-sm font-bold hover:bg-green-neon/90 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-surface-1 border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-neon transition-all"
            />
          </div>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", viewMode === 'kanban' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ y: -5 }}
              className="bg-surface-1 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden bg-surface-2">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                  {project.client}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                    Open Project
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white group-hover:text-green-neon transition-all">{project.title}</h4>
                  <button className="text-gray-500 hover:text-white transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest", stages.find(s => s.id === project.stage)?.bg, stages.find(s => s.id === project.stage)?.color)}>
                    {stages.find(s => s.id === project.stage)?.label}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {project.deadline}
                  </div>
                </div>

                <div className="space-y-1 mt-auto pt-4">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className="h-full bg-green-neon"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {stages.map((stage) => (
            <div key={stage.id} className="w-80 shrink-0 space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", stage.color.replace('text-', 'bg-'))} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">{stage.label}</h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {filteredProjects.filter(p => p.stage === stage.id).length}
                  </span>
                </div>
                <button className="p-1 text-gray-500 hover:text-white transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 min-h-[500px] bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                {filteredProjects.filter(p => p.stage === stage.id).map((project) => (
                  <motion.div
                    key={project.id}
                    layoutId={project.id.toString()}
                    className="bg-surface-1 border border-white/5 p-4 rounded-xl space-y-4 hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-white group-hover:text-green-neon transition-all">{project.title}</h4>
                      <button className="text-gray-500 hover:text-white transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Briefcase className="w-3 h-3" />
                        {project.client}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {project.deadline}
                      </div>
                    </div>

                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-neon" style={{ width: `${project.progress}%` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-gray-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">No projects found</h3>
            <p className="text-gray-500">Start a new project to see it here.</p>
          </div>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-green-neon font-bold hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
