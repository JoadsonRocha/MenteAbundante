
export type Tab = 'dashboard' | 'reprogram' | 'plan' | 'checklist' | 'visualization' | 'coach' | 'about' | 'stats' | 'profile';

export interface UserProfile {
  id?: string;
  full_name: string;
  mantra: string;
  statement?: string; // Declaração de Desejo (Napoleon Hill)
  imagem?: string;
  email?: string;
}

export interface DailyTask {
  id: string;
  user_id?: string;
  text: string;
  completed: boolean;
  note?: string; // Reflexão do dia sobre a tarefa
  ai_advice?: string; // Conselho/Insight da IA sobre a nota
}

export interface DayPlan {
  day: number;
  user_id?: string;
  title: string;
  description: string;
  completed: boolean;
  answer?: string;
  ai_feedback?: string; // Feedback da IA sobre a resposta do dia
  completed_at?: string; // Data ISO de quando foi concluído para travar o próximo dia
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