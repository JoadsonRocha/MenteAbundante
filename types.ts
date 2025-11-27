export type Tab = 'dashboard' | 'reprogram' | 'plan' | 'checklist' | 'visualization' | 'coach' | 'about';

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface BeliefEntry {
  id: string;
  limiting: string;
  empowering: string;
  date: string;
}

export enum MindsetMode {
  FIXED = 'Fixa',
  GROWTH = 'Crescimento',
  ABUNDANT = 'Abundante'
}