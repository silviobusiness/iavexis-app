import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, DashboardEvent, Activity, Goal, BannerArt, BannerSettings, Project, ProjectStatus, GrowthMetrics, Lead, LeadStatus, CreativeTask } from '../types';
import { format, isToday, isYesterday, parseISO, startOfToday } from 'date-fns';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreUtils';
import { useAuth } from './AuthContext';

interface DashboardContextType {
  tasks: Task[];
  events: DashboardEvent[];
  activities: Activity[];
  goals: Goal[];
  bannerArts: BannerArt[];
  bannerSettings: BannerSettings;
  streak: number;
  projects: Project[];
  leads: Lead[];
  growthMetrics: GrowthMetrics;
  creativeTasks: CreativeTask[];
  addCreativeTask: (task: Omit<CreativeTask, 'id'>) => void;
  updateCreativeTask: (id: string, updates: Partial<CreativeTask>) => void;
  removeCreativeTask: (id: string) => void;
  addTask: (title: string, priority: Task['priority']) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addEvent: (event: Omit<DashboardEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  addActivity: (item: string, type: Activity['type'], icon: string) => void;
  updateGoal: (id: string, progress: number) => void;
  setBannerArts: (arts: BannerArt[]) => void;
  setBannerSettings: (settings: BannerSettings) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateGrowthMetrics: (metrics: Partial<GrowthMetrics>) => void;
  syncData: () => Promise<void>;
  overallProgress: number;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [creativeTasks, setCreativeTasks] = useState<CreativeTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bannerArts, setBannerArtsState] = useState<BannerArt[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop' },
    { id: '2', url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1920&auto=format&fit=crop' },
    { id: '3', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1920&auto=format&fit=crop' },
  ]);
  const [bannerSettings, setBannerSettingsState] = useState<BannerSettings>({
    speed: 'slow',
    autoPlay: true,
    direction: 'left',
    pauseOnHover: true,
    showCount: 5
  });
  const [streak, setStreak] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>({
    followers: 12500,
    engagement: 4.8,
    reach: 45000,
    history: [
      { date: 'Jan', followers: 10000, engagement: 4.2, reach: 30000 },
      { date: 'Fev', followers: 11000, engagement: 4.5, reach: 35000 },
      { date: 'Mar', followers: 12500, engagement: 4.8, reach: 45000 }
    ]
  });

  // Load data from localStorage
  useEffect(() => {
    const savedCreativeTasks = localStorage.getItem('dashboard_creative_tasks');
    const savedTasks = localStorage.getItem('dashboard_tasks');
    const savedEvents = localStorage.getItem('dashboard_events');
    const savedActivities = localStorage.getItem('dashboard_activities');
    const savedGoals = localStorage.getItem('dashboard_goals');
    const savedStreak = localStorage.getItem('dashboard_streak');
    const savedLastDate = localStorage.getItem('dashboard_last_activity_date');
    const savedProjects = localStorage.getItem('dashboard_projects');
    const savedLeads = localStorage.getItem('dashboard_leads');
    const savedGrowthMetrics = localStorage.getItem('dashboard_growth_metrics');

    if (savedCreativeTasks) setCreativeTasks(JSON.parse(savedCreativeTasks));
    else {
      setCreativeTasks([
        { id: '1', title: 'Carrossel Dicas de Treino', type: 'post', status: 'em_producao', priority: 'alta', origin: 'manual', date: new Date().toISOString() },
        { id: '2', title: 'Story Engajamento', type: 'story', status: 'ideia', priority: 'media', origin: 'chat_criativo', date: new Date().toISOString() },
      ]);
    }

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    else {
      setTasks([
        { id: '1', title: 'Finalizar Landing Page', completed: false, priority: 'high', dueDate: 'Hoje' },
        { id: '2', title: 'Reunião de Alinhamento', completed: true, priority: 'medium', dueDate: 'Hoje' },
        { id: '3', title: 'Ajustes no Canva Lab', completed: false, priority: 'low', dueDate: 'Amanhã' },
      ]);
    }

    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    else {
      setActivities([
        { id: '1', type: 'create', item: 'Novo Chat: Estratégia 2024', timestamp: format(new Date(), 'HH:mm'), icon: 'MessageSquare' },
      ]);
    }

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    else {
      setGoals([
        { id: '1', title: 'Produtividade Semanal', progress: 85, target: 100, unit: '%', color: 'emerald', userId: '1', targetAmount: 100, currentAmount: 85, deadline: new Date().toISOString() },
        { id: '2', title: 'Projetos Concluídos', progress: 12, target: 15, unit: '', color: 'purple', userId: '1', targetAmount: 15, currentAmount: 12, deadline: new Date().toISOString() },
        { id: '3', title: 'Foco Diário', progress: 4, target: 6, unit: 'h', color: 'amber', userId: '1', targetAmount: 6, currentAmount: 4, deadline: new Date().toISOString() },
      ]);
    }

    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedLastDate) setLastActivityDate(savedLastDate);
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    else {
      setProjects([
        { id: '1', title: 'Identidade Visual - Time X', value: 1500, status: 'in_progress', createdAt: new Date().toISOString(), clientName: 'Time X' },
        { id: '2', title: 'Artes Redes Sociais - Atleta Y', value: 800, status: 'paid', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), clientName: 'Atleta Y' }
      ]);
    }
    
    if (savedLeads) setLeads(JSON.parse(savedLeads));
    else {
      setLeads([
        { id: '1', name: 'João Silva', project: 'Identidade Visual', value: 1500, status: 'contato' },
        { id: '2', name: 'Maria Souza', project: 'Social Media', value: 800, status: 'qualificacao' },
        { id: '3', name: 'Carlos Santos', project: 'Banner YouTube', value: 300, status: 'proposta' },
      ]);
    }
    
    if (savedGrowthMetrics) setGrowthMetrics(JSON.parse(savedGrowthMetrics));
  }, []);

  // Firestore Sync for Banner
  useEffect(() => {
    // No longer syncing with Firebase Auth
    return () => {};
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const saveItem = (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`Failed to save ${key} to localStorage:`, e);
      }
    };

    saveItem('dashboard_creative_tasks', JSON.stringify(creativeTasks));
    saveItem('dashboard_tasks', JSON.stringify(tasks));
    saveItem('dashboard_events', JSON.stringify(events));
    saveItem('dashboard_activities', JSON.stringify(activities));
    saveItem('dashboard_goals', JSON.stringify(goals));
    saveItem('dashboard_streak', streak.toString());
    if (lastActivityDate) saveItem('dashboard_last_activity_date', lastActivityDate);
    saveItem('dashboard_projects', JSON.stringify(projects));
    saveItem('dashboard_leads', JSON.stringify(leads));
    saveItem('dashboard_growth_metrics', JSON.stringify(growthMetrics));
  }, [creativeTasks, tasks, events, activities, goals, streak, lastActivityDate, projects, leads, growthMetrics]);

  // Streak Logic
  useEffect(() => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    if (lastActivityDate && lastActivityDate !== today) {
      const lastDate = parseISO(lastActivityDate);
      if (!isYesterday(lastDate) && !isToday(lastDate)) {
        setStreak(0);
      }
    }
  }, [lastActivityDate]);

  const updateStreak = () => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    if (lastActivityDate !== today) {
      setStreak(prev => prev + 1);
      setLastActivityDate(today);
    }
  };

  const addCreativeTask = (task: Omit<CreativeTask, 'id'>) => {
    const newTask: CreativeTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9)
    };
    setCreativeTasks(prev => [...prev, newTask]);
    addActivity(`Nova tarefa criativa: ${task.title}`, 'create', 'Palette');
  };

  const updateCreativeTask = (id: string, updates: Partial<CreativeTask>) => {
    setCreativeTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeCreativeTask = (id: string) => {
    setCreativeTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = (title: string, priority: Task['priority']) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      priority,
      dueDate: 'Hoje'
    };
    setTasks(prev => [newTask, ...prev]);
    addActivity(`Tarefa criada: ${title}`, 'create', 'Plus');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newState = !t.completed;
        if (newState) {
          addActivity(`Tarefa concluída: ${t.title}`, 'complete', 'CheckCircle');
          updateStreak();
          // Update goals automatically
          setGoals(gPrev => gPrev.map(g => 
            g.id === '1' ? { 
              ...g, 
              currentAmount: Math.min(g.targetAmount, (g.currentAmount || 0) + 5),
              progress: Math.min(g.target || 100, (g.progress || 0) + 5)
            } : g
          ));
        }
        return { ...t, completed: newState };
      }
      return t;
    }));
  };

  const removeTask = (id: string) => {
    const taskToRemove = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (taskToRemove) {
      addActivity(`Tarefa removida: ${taskToRemove.title}`, 'delete', 'Trash');
    }
  };

  const addEvent = (event: Omit<DashboardEvent, 'id'>) => {
    const newEvent: DashboardEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9)
    };
    setEvents(prev => [...prev, newEvent]);
    addActivity(`Evento criado: ${event.title}`, 'create', 'Calendar');
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addActivity = (item: string, type: Activity['type'], icon: string) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      item,
      type,
      timestamp: format(new Date(), 'HH:mm'),
      icon
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep last 10
  };

  const updateGoal = (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g));
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [newProject, ...prev]);
    addActivity(`Novo projeto: ${project.title}`, 'create', 'Briefcase');
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        if (status === 'paid' && p.status !== 'paid') {
          addActivity(`Pagamento recebido: ${p.title}`, 'complete', 'DollarSign');
        }
        return { ...p, status };
      }
      return p;
    }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const addLead = (lead: Omit<Lead, 'id'>) => {
    const newLead: Lead = {
      ...lead,
      id: Math.random().toString(36).substr(2, 9)
    };
    setLeads(prev => [...prev, newLead]);
    addActivity(`Novo lead: ${lead.name}`, 'create', 'Users');
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const updateGrowthMetrics = (metrics: Partial<GrowthMetrics>) => {
    setGrowthMetrics(prev => ({ ...prev, ...metrics }));
  };

  const setBannerArts = async (arts: BannerArt[]) => {
    setBannerArtsState(arts);
  };

  const setBannerSettings = async (settings: BannerSettings) => {
    setBannerSettingsState(settings);
  };

  const syncData = async () => {
    // Simulate network delay for sync
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Re-read from localStorage to ensure consistency across tabs
    const savedCreativeTasks = localStorage.getItem('dashboard_creative_tasks');
    const savedTasks = localStorage.getItem('dashboard_tasks');
    const savedEvents = localStorage.getItem('dashboard_events');
    const savedActivities = localStorage.getItem('dashboard_activities');
    const savedGoals = localStorage.getItem('dashboard_goals');
    const savedStreak = localStorage.getItem('dashboard_streak');
    const savedProjects = localStorage.getItem('dashboard_projects');
    const savedLeads = localStorage.getItem('dashboard_leads');
    const savedGrowthMetrics = localStorage.getItem('dashboard_growth_metrics');

    if (savedCreativeTasks) setCreativeTasks(JSON.parse(savedCreativeTasks));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedLeads) setLeads(JSON.parse(savedLeads));
    if (savedGrowthMetrics) setGrowthMetrics(JSON.parse(savedGrowthMetrics));
  };

  const overallProgress = Math.round(
    (tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100
  );

  return (
    <DashboardContext.Provider value={{
      creativeTasks,
      tasks,
      events,
      activities,
      goals,
      bannerArts,
      bannerSettings,
      streak,
      projects,
      leads,
      growthMetrics,
      addCreativeTask,
      updateCreativeTask,
      removeCreativeTask,
      addTask,
      toggleTask,
      removeTask,
      addEvent,
      removeEvent,
      addActivity,
      updateGoal,
      setBannerArts,
      setBannerSettings,
      addProject,
      updateProjectStatus,
      updateProject,
      deleteProject,
      addLead,
      updateLeadStatus,
      updateLead,
      deleteLead,
      updateGrowthMetrics,
      syncData,
      overallProgress
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
