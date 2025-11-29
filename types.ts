
export type Tab = 'dashboard' | 'reprogram' | 'plan' | 'checklist' | 'visualization' | 'coach' | 'gratitude' | 'about' | 'stats' | 'profile' | 'feedback' | 'smart_planner' | 'support';

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

export interface GratitudeEntry {
  id: string;
  user_id?: string;
  text: string;
  ai_response?: string; // Reforço positivo da IA
  date: string; // ISO String
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

export interface FeedbackEntry {
  id: string;
  user_id?: string;
  rating: number; // 1 a 5
  category: string; // 'sugestao', 'elogio', 'problema', 'outro'
  comment: string;
  created_at: string;
}

// --- NOVOS TIPOS PARA O PLANEJADOR ---
export interface GoalStep {
  id: string;
  text: string;
  completed: boolean;
  timing: string; // Ex: "Dia 1", "Semana 2"
}

export interface GoalPlan {
  id: string;
  user_id?: string;
  title: string; // O Objetivo
  timeframe: string; // O Tempo (ex: 30 dias)
  steps: GoalStep[];
  is_completed: boolean;
  created_at: string;
}

export enum MindsetMode {
  FIXED = 'Fixa',
  GROWTH = 'Crescimento',
  ABUNDANT = 'Abundante'
}

// --- NOVOS TIPOS PARA SUPORTE OMNICHANNEL ---
export interface SupportTicket {
  id: string;
  user_id?: string;
  status: 'open' | 'resolved' | 'escalated';
  subject: string;
  channel_preference: 'whatsapp' | 'email' | 'in_app';
  created_at: string;
  messages: ChatMessage[];
}
