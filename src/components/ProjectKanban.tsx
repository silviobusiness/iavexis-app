import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useDashboard } from '../contexts/DashboardContext';
import { Project, ProjectStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, Calendar, DollarSign, User, X, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS: { id: ProjectStatus; title: string; color: string }[] = [
  { id: 'briefing', title: 'Briefing', color: 'bg-zinc-500' },
  { id: 'in_progress', title: 'Em Andamento', color: 'bg-blue-500' },
  { id: 'review', title: 'Revisão', color: 'bg-amber-500' },
  { id: 'completed', title: 'Finalizado', color: 'bg-emerald-500' },
  { id: 'paid', title: 'Pago', color: 'bg-purple-500' },
];

export const ProjectKanban = () => {
  const { projects, updateProjectStatus, addProject, updateProject, deleteProject } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    clientName: '',
    value: '',
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title && newProject.clientName && newProject.value) {
      addProject({
        title: newProject.title,
        clientName: newProject.clientName,
        value: Number(newProject.value),
        dueDate: newProject.dueDate,
        status: 'briefing'
      });
      setIsModalOpen(false);
      setNewProject({ title: '', clientName: '', value: '', dueDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateProject(editingProject.id, {
        title: editingProject.title,
        clientName: editingProject.clientName,
        value: Number(editingProject.value),
        dueDate: editingProject.dueDate
      });
      setIsEditModalOpen(false);
      setEditingProject(null);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      deleteProject(id);
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

    updateProjectStatus(draggableId, destination.droppableId as ProjectStatus);
  };

  return (
    <div className="premium-card p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Vestiário Criativo (Projetos)</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-neon-gradient text-zinc-950 font-bold rounded-[6px] hover:opacity-90 transition-all text-sm interactive-hover interactive-click"
        >
          + Novo Projeto
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[6px] p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Novo Projeto</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-all interactive-hover interactive-click p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Nome do Projeto</label>
                  <input 
                    type="text" 
                    required
                    value={newProject.title}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                    placeholder="Ex: Identidade Visual"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={newProject.clientName}
                    onChange={e => setNewProject({...newProject, clientName: e.target.value})}
                    className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                    placeholder="Ex: Nike"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Valor (R$)</label>
                    <input 
                      type="number" 
                      required
                      value={newProject.value}
                      onChange={e => setNewProject({...newProject, value: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                      placeholder="Ex: 1500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Prazo</label>
                    <input 
                      type="date" 
                      required
                      value={newProject.dueDate}
                      onChange={e => setNewProject({...newProject, dueDate: e.target.value})}
                      className="w-full bg-[#0B0B0B] border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-neon-gradient text-zinc-950 font-bold rounded-[6px] hover:opacity-90 transition-all interactive-hover interactive-click"
                >
                  Criar Projeto
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[6px] p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Editar Projeto</h3>
                <button onClick={() => { setIsEditModalOpen(false); setEditingProject(null); }} className="text-zinc-500 hover:text-white transition-all interactive-hover interactive-click p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditProject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Nome do Projeto</label>
                  <input 
                    type="text" 
                    required
                    value={editingProject.title}
                    onChange={e => setEditingProject({...editingProject, title: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={editingProject.clientName || ''}
                    onChange={e => setEditingProject({...editingProject, clientName: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Valor (R$)</label>
                    <input 
                      type="number" 
                      required
                      value={editingProject.value}
                      onChange={e => setEditingProject({...editingProject, value: Number(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400">Prazo</label>
                    <input 
                      type="date" 
                      required
                      value={editingProject.dueDate || ''}
                      onChange={e => setEditingProject({...editingProject, dueDate: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 mt-4 bg-neon-gradient text-zinc-950 font-bold rounded-[6px] hover:opacity-90 transition-all interactive-hover interactive-click"
                >
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
          {COLUMNS.map((column) => {
            const columnProjects = projects.filter((p) => p.status === column.id);

            return (
              <div key={column.id} className="flex-1 min-w-[280px] bg-zinc-900 rounded-[6px] p-4 border border-zinc-800/50 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", column.color)} />
                    <h4 className="font-bold text-zinc-200 text-sm">{column.title}</h4>
                  </div>
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-[6px]">
                    {columnProjects.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        "flex-1 flex flex-col gap-3 transition-colors rounded-[6px]",
                        snapshot.isDraggingOver ? "bg-zinc-800/20" : ""
                      )}
                    >
                      {columnProjects.map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={clsx(
                                "bg-[#0B0B0B] p-4 rounded-[6px] border border-zinc-800/80 shadow-sm group hover:border-emerald-500/30 transition-all",
                                snapshot.isDragging ? "shadow-xl shadow-emerald-500/10 border-emerald-500/50 rotate-2 scale-105" : ""
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-sm text-white line-clamp-1">{project.title}</h5>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingProject(project);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="text-zinc-500 hover:text-white p-1 transition-all interactive-hover interactive-click"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="text-zinc-500 hover:text-red-400 p-1 transition-all interactive-hover interactive-click"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">{project.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <DollarSign className="w-3 h-3" />
                                  <span>R$ {project.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {project.dueDate && (
                                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <Calendar className="w-3 h-3" />
                                    <span>{format(parseISO(project.dueDate), "dd 'de' MMM", { locale: ptBR })}</span>
                                  </div>
                                )}
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
    </div>
  );
};
