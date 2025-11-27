import { createClient } from '@supabase/supabase-js';
import { DailyTask, DayPlan, BeliefEntry } from '../types';
import { INITIAL_TASKS, SEVEN_DAY_PLAN } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Insira suas chaves do Supabase aqui ou via variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Verifica se as credenciais existem para decidir qual banco usar
const hasSupabase = SUPABASE_URL && SUPABASE_KEY;

const supabase = hasSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const STORAGE_KEYS = {
  TASKS: 'mente_tasks',
  PLAN: 'mente_plan',
  BELIEFS: 'mente_beliefs'
};

export const db = {
  // --- CHECKLIST ---
  async getTasks(): Promise<DailyTask[]> {
    // 1. Tenta buscar do Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id'); // Ordena para manter consistência visual
      
      if (!error && data && data.length > 0) {
        return data;
      }
      
      // Se não houver dados no banco (primeiro acesso), insere os iniciais
      if (data && data.length === 0) {
        await supabase.from('tasks').upsert(INITIAL_TASKS);
        return INITIAL_TASKS;
      }
    }

    // 2. Fallback para LocalStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch (error) {
      return INITIAL_TASKS;
    }
  },

  async saveTasks(tasks: DailyTask[]): Promise<void> {
    // Salva no Supabase
    if (supabase) {
      await supabase.from('tasks').upsert(tasks);
    }
    
    // Sempre mantém backup no LocalStorage para redundância/rapidez
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Erro local:', error);
    }
  },

  // --- PLANO 7 DIAS ---
  async getPlan(): Promise<DayPlan[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('day');
        
      if (!error && data && data.length > 0) return data;
      
      if (data && data.length === 0) {
        await supabase.from('plans').upsert(SEVEN_DAY_PLAN);
        return SEVEN_DAY_PLAN;
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAN);
      return saved ? JSON.parse(saved) : SEVEN_DAY_PLAN;
    } catch (error) {
      return SEVEN_DAY_PLAN;
    }
  },

  async savePlan(plan: DayPlan[]): Promise<void> {
    if (supabase) {
      await supabase.from('plans').upsert(plan);
    }
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
  },

  // --- CRENÇAS ---
  async getBeliefs(): Promise<BeliefEntry[]> {
    if (supabase) {
      // Ordena por data decrescente (mais recentes primeiro)
      // Nota: Sua tabela precisa ter a coluna 'date' ou criar um created_at
      const { data, error } = await supabase
        .from('beliefs')
        .select('*');
      
      if (!error && data) {
         // Ordenação simples via JS caso o formato da data seja string simples
         return data.reverse(); 
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BELIEFS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  },

  async addBelief(entry: BeliefEntry): Promise<void> {
    if (supabase) {
      await supabase.from('beliefs').insert(entry);
    }

    // Atualiza local storage
    try {
      const current = await db.getBeliefs();
      // Se usamos supabase, o getBeliefs já buscou de lá. 
      // Se não, buscou do local.
      // Filtramos para evitar duplicação visual se o array vier misturado
      const updated = [entry, ...current.filter(c => c.id !== entry.id)];
      localStorage.setItem(STORAGE_KEYS.BELIEFS, JSON.stringify(updated));
    } catch (error) {
      console.error(error);
    }
  }
};