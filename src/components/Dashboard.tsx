import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  RotateCw, 
  TrendingUp,
  Bell, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Zap,
  Target,
  Activity as ActivityIcon,
  Search,
  MoreHorizontal,
  Star,
  Trash,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, parseISO, isThisMonth, isSameMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip } from './Tooltip';
import { Task, DashboardEvent, Activity, Goal, CreativeTask } from '../types';
import { ProfileHeader } from './ProfileHeader';
import { useDashboard } from '../contexts/DashboardContext';
import clsx from 'clsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Sub-components ---

const Greeting = ({ name }: { name?: string }) => {
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1"
    >
      <h1 className="text-3xl font-bold text-zinc-200 tracking-tight flex items-center gap-3">
        {greeting}, <span className="text-emerald-500 text-glow-neon">{name || 'Designer'}</span>
        <motion.span 
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ⚡
        </motion.span>
      </h1>
      <p className="text-zinc-500 font-medium">
        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
      </p>
    </motion.div>
  );
};

const IntelligentCalendar = () => {
  const { creativeTasks, addCreativeTask, updateCreativeTask, removeCreativeTask } = useDashboard();
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  
  // Modal state
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  
  // Quick create state
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null);
  const [quickCreateTitle, setQuickCreateTitle] = useState('');
  
  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateCreativeTask(taskId, { date: date.toISOString() });
    }
    setDraggedTaskId(null);
  };

  const handleQuickCreate = (e: React.KeyboardEvent, date: Date) => {
    if (e.key === 'Enter' && quickCreateTitle.trim()) {
      addCreativeTask({
        title: quickCreateTitle.trim(),
        type: 'post',
        status: 'ideia',
        priority: 'media',
        origin: 'manual',
        date: date.toISOString(),
        tags: []
      });
      setQuickCreateTitle('');
      setQuickCreateDate(null);
    } else if (e.key === 'Escape') {
      setQuickCreateTitle('');
      setQuickCreateDate(null);
    }
  };

  const openDayDetails = (date: Date) => {
    setSelectedDate(date);
    setIsDayModalOpen(true);
  };

  // Stats calculation
  const completedTasks = creativeTasks.filter(t => t.status === 'finalizado').length;
  let streak = 0;
  let checkDate = today;
  while (true) {
    const hasCompletedTask = creativeTasks.some(t => t.status === 'finalizado' && isSameDay(parseISO(t.date), checkDate));
    if (hasCompletedTask) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      if (isSameDay(checkDate, today)) {
        checkDate = subDays(checkDate, 1);
        const hasCompletedYesterday = creativeTasks.some(t => t.status === 'finalizado' && isSameDay(parseISO(t.date), checkDate));
        if (hasCompletedYesterday) {
          streak++;
          checkDate = subDays(checkDate, 1);
          continue;
        }
      }
      break;
    }
  }

  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
  const tasksThisWeek = creativeTasks.filter(t => {
    const d = parseISO(t.date);
    return d >= startOfCurrentWeek && d <= endOfCurrentWeek && t.status === 'finalizado';
  });
  const weeklyGoal = 5;
  const weeklyProgress = Math.min((tasksThisWeek.length / weeklyGoal) * 100, 100);

  const getSuggestion = () => {
    if (streak === 0) return "Você não postou recentemente. Que tal gerar uma ideia com IA para hoje?";
    if (tasksThisWeek.length < weeklyGoal) return `Faltam ${weeklyGoal - tasksThisWeek.length} artes para bater sua meta semanal!`;
    return "Meta semanal atingida! Excelente consistência.";
  };

  const selectedDateTasks = creativeTasks.filter(t => isSameDay(parseISO(t.date), selectedDate));

  return (
    <div className="premium-card p-5 flex flex-col justify-start w-full min-h-[400px] h-auto relative group/calendar overflow-visible">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Header Compacto */}
      <div className="flex items-center justify-between h-10 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-zinc-100 leading-none">Calendário Criativo</h3>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">Planejamento e Execução</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-emerald-400 transition-all interactive-hover interactive-click"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-black text-zinc-300 min-w-[85px] text-center uppercase tracking-tighter">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-emerald-400 transition-all interactive-hover interactive-click"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Sequência Criativa</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-zinc-100">{streak}</span>
            <span className="text-sm text-amber-500">🔥 dias</span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Meta Semanal</span>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-black text-zinc-100">{tasksThisWeek.length}</span>
            <span className="text-sm text-zinc-500">/ {weeklyGoal}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${weeklyProgress}%` }} />
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Finalizado</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-zinc-100">{completedTasks}</span>
            <span className="text-sm text-emerald-500">✓ artes</span>
          </div>
        </div>
      </div>

      {/* Intelligent Suggestion */}
      <div className="mb-6 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-start gap-3 relative z-10">
        <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-300 leading-relaxed">
          <strong className="text-emerald-400">Dica Inteligente:</strong> {getSuggestion()}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-[5px] items-stretch justify-items-stretch mb-5 relative z-10">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] pb-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayTasks = creativeTasks.filter(t => isSameDay(parseISO(t.date), day));
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentToday = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toString()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => openDayDetails(day)}
              className={clsx(
                "min-h-[80px] w-full rounded-md flex flex-col p-1.5 relative cursor-pointer transition-all duration-300 group/day",
                !isCurrentMonth && "opacity-30",
                isCurrentToday ? "bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : 
                isSelected ? "bg-zinc-800/80 border border-emerald-500/60 shadow-lg" :
                "bg-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/30 hover:bg-zinc-800/40"
              )}
            >
              <div className="flex justify-between items-start w-full mb-1">
                <span className={clsx(
                  "text-[10px] font-black leading-none transition-colors",
                  isCurrentToday ? "text-emerald-400" : isSelected ? "text-emerald-400" : "text-zinc-500 group-hover/day:text-zinc-200"
                )}>
                  {format(day, 'd')}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setQuickCreateDate(day.toISOString()); setQuickCreateTitle(''); }}
                  className="opacity-0 group-hover/day:opacity-100 text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 w-full no-scrollbar">
                {quickCreateDate === day.toISOString() && (
                  <input
                    autoFocus
                    type="text"
                    value={quickCreateTitle}
                    onChange={(e) => setQuickCreateTitle(e.target.value)}
                    onKeyDown={(e) => handleQuickCreate(e, day)}
                    onBlur={() => setQuickCreateDate(null)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-zinc-950 border border-emerald-500/50 rounded text-[9px] px-1 py-0.5 text-zinc-200 focus:outline-none"
                    placeholder="Nova tarefa..."
                  />
                )}
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={(e) => { e.stopPropagation(); openDayDetails(day); }}
                    className={clsx(
                      "text-[9px] truncate px-1 py-0.5 rounded border border-transparent hover:border-zinc-700 transition-colors cursor-grab active:cursor-grabbing",
                      task.status === 'ideia' ? "bg-amber-500/10 text-amber-400" :
                      task.status === 'em_producao' ? "bg-blue-500/10 text-blue-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    )}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Day Details Modal */}
      <AnimatePresence>
        {isDayModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setIsDayModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{selectedDateTasks.length} tarefas planejadas</p>
                </div>
                <button onClick={() => setIsDayModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto space-y-3">
                {selectedDateTasks.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 text-sm">Nenhuma tarefa para este dia.</p>
                  </div>
                ) : (
                  selectedDateTasks.map(task => (
                    <div key={task.id} className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-lg flex items-center justify-between group">
                      <div className="flex items-center gap-3 w-full">
                        {task.preview && (
                          <img src={task.preview} alt={task.title} className="w-10 h-10 rounded-md object-cover border border-zinc-800" />
                        )}
                        <select 
                          value={task.status}
                          onChange={(e) => updateCreativeTask(task.id, { status: e.target.value as CreativeTask['status'] })}
                          className={clsx(
                            "text-xs font-bold px-2 py-1 rounded-md border-none outline-none cursor-pointer appearance-none",
                            task.status === 'ideia' ? "bg-amber-500/10 text-amber-400" :
                            task.status === 'em_producao' ? "bg-blue-500/10 text-blue-400" :
                            "bg-emerald-500/10 text-emerald-400"
                          )}
                        >
                          <option value="ideia" className="bg-zinc-900 text-amber-400">Ideia</option>
                          <option value="em_producao" className="bg-zinc-900 text-blue-400">Em Produção</option>
                          <option value="finalizado" className="bg-zinc-900 text-emerald-400">Finalizado</option>
                        </select>
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={task.title}
                            onChange={(e) => updateCreativeTask(task.id, { title: e.target.value })}
                            className="bg-transparent text-sm font-bold text-zinc-200 outline-none border-b border-transparent focus:border-emerald-500/50 transition-colors w-full"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={task.type}
                              onChange={(e) => updateCreativeTask(task.id, { type: e.target.value as CreativeTask['type'] })}
                              className="bg-transparent text-[10px] text-zinc-500 uppercase tracking-wider outline-none cursor-pointer"
                            >
                              <option value="post" className="bg-zinc-900">Post</option>
                              <option value="story" className="bg-zinc-900">Story</option>
                              <option value="reel" className="bg-zinc-900">Reel</option>
                              <option value="banner" className="bg-zinc-900">Banner</option>
                              <option value="other" className="bg-zinc-900">Outro</option>
                            </select>
                            <span className="text-zinc-700">•</span>
                            <select
                              value={task.priority}
                              onChange={(e) => updateCreativeTask(task.id, { priority: e.target.value as CreativeTask['priority'] })}
                              className={clsx(
                                "bg-transparent text-[10px] uppercase tracking-wider outline-none cursor-pointer",
                                task.priority === 'alta' ? "text-red-400" :
                                task.priority === 'media' ? "text-yellow-400" : "text-zinc-500"
                              )}
                            >
                              <option value="baixa" className="bg-zinc-900 text-zinc-400">Baixa</option>
                              <option value="media" className="bg-zinc-900 text-yellow-400">Média</option>
                              <option value="alta" className="bg-zinc-900 text-red-400">Alta</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeCreativeTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-md hover:bg-zinc-900 ml-2"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-5 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                <button 
                  onClick={() => {
                    addCreativeTask({
                      title: 'Nova Tarefa',
                      type: 'post',
                      status: 'ideia',
                      priority: 'media',
                      origin: 'manual',
                      date: selectedDate.toISOString(),
                      tags: []
                    });
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Adicionar Tarefa
                </button>
                <button 
                  onClick={() => {
                    addCreativeTask({
                      title: 'Ideia Gerada por IA ✨',
                      type: 'post',
                      status: 'ideia',
                      priority: 'media',
                      origin: 'chat_criativo',
                      date: selectedDate.toISOString(),
                      tags: ['ia', 'sugestão']
                    });
                  }}
                  className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Gerar Ideia com IA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const { addTask, toggleTask, removeTask } = useDashboard();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, newTaskPriority);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <div className="premium-card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-[6px]">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-200">Tarefas do Dia</h3>
        </div>
        <Tooltip text="Adicionar tarefa">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={clsx(
              "p-2 rounded-[6px] transition-all interactive-hover interactive-click",
              isAdding ? "bg-emerald-500 text-zinc-950" : "hover:bg-zinc-800 text-zinc-400"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddTask}
            className="p-4 bg-zinc-900 border border-emerald-500/20 rounded-[6px] space-y-4"
          >
            <input 
              autoFocus
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-[6px] px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] transition-all",
                      newTaskPriority === p 
                        ? (p === 'high' ? "bg-red-500 text-white" : p === 'medium' ? "bg-amber-500 text-zinc-950" : "bg-emerald-500 text-zinc-950")
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                type="submit"
                className="bg-neon-gradient text-zinc-950 text-xs font-bold px-4 py-2 rounded-[6px] hover:opacity-90 transition-all"
              >
                Adicionar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800/50 rounded-[6px] hover:border-emerald-500/20 transition-all group"
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className={clsx(
                  "w-6 h-6 rounded-[4px] border-2 flex items-center justify-center transition-all duration-300 interactive-hover interactive-click",
                  task.completed ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 group-hover:border-emerald-500/50"
                )}
              >
                {task.completed && <CheckSquare className="w-4 h-4 text-zinc-950" />}
              </button>
              <div className="flex-1">
                <p className={clsx(
                  "text-sm font-medium transition-all duration-300",
                  task.completed ? "text-zinc-600 line-through" : "text-zinc-200"
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                    task.priority === 'high' ? "bg-red-500/10 text-red-400" :
                    task.priority === 'medium' ? "bg-amber-500/10 text-amber-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{task.dueDate}</span>
                </div>
              </div>
              <button 
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-all interactive-hover interactive-click"
              >
                <Trash className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-zinc-900 rounded-[6px] flex items-center justify-center mb-3">
              <CheckSquare className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">Nenhuma tarefa pendente.</p>
            <p className="text-xs text-zinc-600 mt-1">Adicione uma nova tarefa para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityFeed = () => {
  const { activities } = useDashboard();

  return (
    <div className="premium-card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-[6px]">
          <ActivityIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-zinc-200">Atividades Recentes</h3>
      </div>

      <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
        {activities.length > 0 ? (
          activities.map(activity => (
            <motion.div 
              key={activity.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 relative group"
            >
              <div className="w-10 h-10 rounded-[6px] bg-zinc-900 border border-zinc-800 flex items-center justify-center z-10 group-hover:border-emerald-500/30 transition-colors">
                <Clock className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-zinc-200 font-medium">{activity.item}</p>
                <p className="text-xs text-zinc-500 mt-1">{activity.timestamp}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-xs text-zinc-600 italic pl-10">Nenhuma atividade registrada.</p>
        )}
      </div>
    </div>
  );
};

const GoalsSection = () => {
  const { goals } = useDashboard();

  return (
    <div className="premium-card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-[6px]">
          <Target className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-zinc-200">Metas de Performance</h3>
      </div>

      <div className="space-y-6">
        {goals.map(goal => {
          const current = goal.currentAmount || goal.progress || 0;
          const target = goal.targetAmount || goal.target || 100;
          const unit = goal.unit || '';
          const color = goal.color || 'emerald';
          const progress = (current / target) * 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-zinc-300">{goal.title}</p>
                <p className="text-xs font-bold text-zinc-500">
                  <span className="text-zinc-200">{current}</span>/{target}{unit}
                </p>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={clsx(
                    "h-full rounded-full progress-sport",
                    color === 'emerald' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                    color === 'purple' ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" :
                    "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressCircle = () => {
  const { overallProgress } = useDashboard();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="premium-card p-6 flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-zinc-900"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-emerald-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-zinc-200">{overallProgress}%</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Evolução</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-zinc-200">Performance Elite</p>
        <p className="text-xs text-zinc-500 mt-1">
          {overallProgress >= 80 ? "Você está no top 5% esta semana" : 
           overallProgress >= 50 ? "Ótimo ritmo! Continue assim." : 
           "Foque nas tarefas para subir de nível."}
        </p>
      </div>
    </div>
  );
};

const FinancialOverview = () => {
  const { projects, leads } = useDashboard();
  
  const totalRevenue = projects
    .filter(p => p.status === 'paid' || p.status === 'completed')
    .reduce((acc, p) => acc + p.value, 0);
  
  const pendingRevenue = projects
    .filter(p => p.status !== 'paid' && p.status !== 'completed')
    .reduce((acc, p) => acc + p.value, 0);

  const pipelineValue = leads
    .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
    .reduce((acc, l) => acc + l.value, 0);

  const data = [
    { name: 'Jan', revenue: 4500, expenses: 2100 },
    { name: 'Fev', revenue: 5200, expenses: 2400 },
    { name: 'Mar', revenue: totalRevenue || 6100, expenses: 2800 },
  ];

  return (
    <div className="premium-card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-[6px]">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-200">Visão Financeira</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Receita Total</p>
            <p className="text-lg font-black text-emerald-500">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-[6px] border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pendente</p>
          <p className="text-xl font-black text-zinc-200">R$ {pendingRevenue.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-[6px] border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pipeline</p>
          <p className="text-xl font-black text-zinc-200">R$ {pipelineValue.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="h-48 w-full mt-4 min-h-[192px] relative">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/20 rounded-lg border border-dashed border-zinc-800">
            <p className="text-xs text-zinc-600">Dados insuficientes para o gráfico</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GrowthPerformance = () => {
  const { growthMetrics, leads } = useDashboard();

  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => l.status === 'fechado').length;
  const leadConversion = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  return (
    <div className="premium-card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-[6px]">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-zinc-200">Crescimento</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-[6px] border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Seguidores</p>
          <p className="text-xl font-black text-zinc-200">{growthMetrics.followers.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-[6px] border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Engajamento</p>
          <p className="text-xl font-black text-purple-500">{growthMetrics.engagement}%</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-[6px] border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Conversão</p>
          <p className="text-xl font-black text-zinc-200">{leadConversion}%</p>
        </div>
      </div>

      <div className="h-48 w-full mt-4 min-h-[192px] relative">
        {growthMetrics.history && growthMetrics.history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthMetrics.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Bar dataKey="followers" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900/20 rounded-lg border border-dashed border-zinc-800">
            <p className="text-xs text-zinc-600">Dados de crescimento não disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

export function Dashboard() {
  const { streak, tasks, syncData } = useDashboard();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncData();
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-auto bg-[#0B0B0B] relative overflow-visible">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 dashboard-grid z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-breathe z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-breathe z-0" />

      <div className="relative z-10 p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Header */}
        <header className="flex items-center justify-between">
          <Greeting />
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Pesquisar tarefas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-[6px] pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 w-64 transition-all"
              />
            </div>
            
            <div className="relative">
              <Tooltip text="Notificações">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-[6px] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all relative interactive-hover interactive-click"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                </button>
              </Tooltip>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-4 w-80 premium-card p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-zinc-200">Notificações</h4>
                      <button className="text-xs text-emerald-400 hover:underline">Limpar tudo</button>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-3 bg-zinc-900 border border-zinc-800/50 hover:border-emerald-500/20 transition-all cursor-pointer rounded-[6px]">
                          <p className="text-sm text-zinc-200 font-medium">Novo feedback recebido</p>
                          <p className="text-xs text-zinc-500 mt-1">Sua última criação foi elogiada.</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Tooltip text={isSyncing ? "Sincronizando..." : "Sincronizar dados"}>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={clsx(
                  "p-2.5 bg-zinc-900 border border-zinc-800 rounded-[6px] transition-all interactive-hover interactive-click",
                  isSyncing ? "text-emerald-400 border-emerald-500/30" : "text-zinc-400 hover:text-emerald-400 hover:border-zinc-700"
                )}
              >
                <RotateCw className={clsx("w-5 h-5", isSyncing && "animate-spin")} />
              </button>
            </Tooltip>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Top Row: Financial & Growth */}
          <div className="col-span-12 lg:col-span-7">
            <FinancialOverview />
          </div>
          <div className="col-span-12 lg:col-span-5">
            <GrowthPerformance />
          </div>

          {/* Left Column: Calendar & Activities */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <IntelligentCalendar />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActivityFeed />
              <GoalsSection />
            </div>
          </div>

          {/* Right Column: Progress */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ProgressCircle />
            
            {/* Streak Card */}
            <div className="premium-glass rounded-[6px] p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Performance Streak</p>
                  <h4 className="text-2xl font-black text-white">{streak} DIAS</h4>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-[6px] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <Zap className="w-6 h-6 text-zinc-950" />
                </div>
              </div>
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className={clsx("h-1 flex-1 rounded-full", i <= (streak % 7 || (streak > 0 ? 7 : 0)) ? "bg-emerald-500" : "bg-zinc-800")} />
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold">Mantenha o ritmo para desbloquear novas recompensas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
