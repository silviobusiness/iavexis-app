export type ProjectStatus = 'briefing' | 'in_progress' | 'review' | 'completed' | 'paid';
export type LeadStatus = 'contato' | 'qualificacao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';

export interface Lead {
  id: string;
  name: string;
  project: string;
  value: number;
  status: LeadStatus;
  notes?: string;
  followUpDate?: string;
}

export interface Project {
  id: string;
  title: string;
  value: number;
  status: ProjectStatus;
  createdAt: string;
  dueDate?: string;
  clientName?: string;
}

export interface GrowthMetrics {
  followers: number;
  engagement: number;
  reach: number;
  history: { date: string; followers: number; engagement: number; reach: number }[];
}

export interface UserProfile {
  name: string;
  description: string;
  photoURL?: string;
  coverURL?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  source: 'manual' | 'client' | 'sale' | 'growth';
  description: string;
  date: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  // Old fields for compatibility
  progress?: number;
  target?: number;
  unit?: string;
  color?: string;
}

export interface Growth {
  id: string;
  userId: string;
  type: 'lead' | 'client' | 'opportunity';
  value: number;
  status: 'open' | 'closed' | 'lost';
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  value: number;
  status: 'active' | 'inactive';
}

export interface BannerArt {
  id: string;
  url: string;
  title?: string;
}

export interface BannerSettings {
  speed: 'slow' | 'medium' | 'fast';
  autoPlay: boolean;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  showCount: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'design' | 'review' | 'other';
  priority: 'low' | 'medium' | 'high';
}

export type CreativeTaskStatus = 'ideia' | 'em_producao' | 'finalizado';
export type CreativeTaskType = 'post' | 'story' | 'reel' | 'banner' | 'other';
export type CreativeTaskPriority = 'baixa' | 'media' | 'alta';
export type CreativeTaskOrigin = 'chat_criativo' | 'manual' | 'biblioteca';

export interface CreativeTask {
  id: string;
  title: string;
  type: CreativeTaskType;
  status: CreativeTaskStatus;
  priority: CreativeTaskPriority;
  origin: CreativeTaskOrigin;
  date: string; // ISO string
  time?: string; // HH:mm
  preview?: string; // URL
  tags?: string[];
}

export interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'complete';
  item: string;
  timestamp: string;
  icon: string;
}
