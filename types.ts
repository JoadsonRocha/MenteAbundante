
export type Tab = 'dashboard' | 'reprogram' | 'plan' | 'checklist' | 'visualization' | 'coach' | 'about' | 'stats' | 'profile';

export interface UserProfile {
  id?: string;
  full_name: string;
  mantra: string;
  imagem?: string; // Atualizado para corresponder à coluna do banco de dados
  email?: string;
}

export interface DailyTask {
  id: string;
  user_id?: string;
  text: string;
  completed: boolean;
}

export interface DayPlan {
  day: number;
  user_id?: string;
  title: string;
  description: string;
  completed: boolean;
  answer?: string;
}

export interface BeliefEntry {
  id: string;
  user_id?: string;
  limiting: string;
  empowering: string;
  date: string;
}

export interface ChatMessage {
  id?: string;
  user_id?: string;
  role: 'user' | 'model';
  text: string;
  created_at?: string;
}

export interface ActivityLog {
  date: string; // Format YYYY-MM-DD
  count: number;
}

export enum MindsetMode {
  FIXED = 'Fixa',
  GROWTH = 'Crescimento',
  ABUNDANT = 'Abundante'
}