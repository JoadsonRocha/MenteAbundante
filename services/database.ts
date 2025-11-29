import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyTask, DayPlan, BeliefEntry, ChatMessage, ActivityLog, UserProfile, GratitudeEntry } from '../types';
import { INITIAL_TASKS, SEVEN_DAY_PLAN } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
const DEFAULT_URL = "https://qyjlkxjnpohqxvaiqcmx.supabase.co";
const DEFAULT_KEY = "sb_publishable_9i0XVchnkLqgtps3kB0w8w_66RldWiQ";

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || DEFAULT_KEY;

const hasSupabase = SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.length > 5;

// Exportamos para usar no AuthContext
export const supabase: SupabaseClient | null = hasSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

const STORAGE_KEYS = {
  TASKS: 'mente_tasks',
  PLAN: 'mente_plan',
  BELIEFS: 'mente_beliefs',
  GRATITUDE: 'mente_gratitude',
  CHAT: 'mente_chat',
  ACTIVITY: 'mente_activity',
  PROFILE: 'mente_profile',
  LAST_CHECKLIST_DATE: 'mente_last_checklist_date'
};

// Helper para pegar ID do usuário atual
const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
};

// Helper para gerar UUID v4 compatível com Postgres
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- FUNÇÃO DE SINCRONIZAÇÃO (Sync Engine) ---
export const syncLocalDataToSupabase = async () => {
  if (!supabase || !navigator.onLine) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    // 1. Sync Tasks
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    if (localTasks.length > 0) {
      const tasksWithUser = localTasks.map((t: any) => ({ ...t, user_id: userId }));
      await supabase.from('tasks').upsert(tasksWithUser);
    }

    // 2. Sync Plan
    const localPlan = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAN) || '[]');
    const modifiedDays = localPlan.filter((p: any) => p.completed || p.answer);
    if (modifiedDays.length > 0) {
      const plansWithUser = modifiedDays.map((p: any) => ({ 
        day: p.day, 
        title: p.title,
        description: p.description,
        completed: p.completed,
        answer: p.answer,
        completed_at: p.completed_at, 
        user_id: userId 
      }));
      await supabase.from('plans').upsert(plansWithUser);
    }

    // 3. Sync Activity Logs
    const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
    if (localLogs.length > 0) {
       for (const log of localLogs) {
         const { data } = await supabase.from('activity_logs').select('*').eq('user_id', userId).eq('date', log.date).single();
         if (data) {
           await supabase.from('activity_logs').update({ count: log.count }).eq('id', data.id);
         } else {
           await supabase.from('activity_logs').insert({ user_id: userId, date: log.date, count: log.count });
         }
       }
    }
    
    // 4. Sync Profile
    const localProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || 'null');
    if (localProfile && localProfile.id === userId) {
      const payload = {
         id: userId,
         full_name: localProfile.full_name,
         mantra: localProfile.mantra,
         imagem: localProfile.imagem,
         statement: localProfile.statement,
         updated_at: new Date().toISOString()
      };
      // Tenta upsert, com fallback se colunas novas não existirem
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error && error.message?.includes('imagem')) {
         const { imagem, ...basicPayload } = payload;
         await supabase.from('profiles').upsert(basicPayload);
      }
    }

    // 5. Sync Gratitude (Upload)
    const localGratitude = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRATITUDE) || '[]');
    if (localGratitude.length > 0) {
      // Filtra apenas entradas que tenham UUID válido para evitar erros de tipo no Postgres
      const validEntries = localGratitude.filter((g: any) => g.id && g.id.length > 10);
      const entriesWithUser = validEntries.map((g: any) => ({ ...g, user_id: userId }));
      
      if (entriesWithUser.length > 0) {
        await supabase.from('gratitude_entries').upsert(entriesWithUser);
      }
    }

  } catch (e) {
    console.error("Erro na sincronização:", e);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncLocalDataToSupabase();
  });
}

export const db = {
  // --- PERFIL ---
  async getProfile(): Promise<UserProfile | null> {
    const userId = await getCurrentUserId();
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (userId && parsed.id === userId) return parsed;
      if (userId && parsed.id && parsed.id !== userId) localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }

    if (supabase && navigator.onLine && userId) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (!error && data) {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data));
          return data;
        }
      } catch (e) {}
    }
    return null;
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    const userId = await getCurrentUserId();
    const profileToSave = { ...profile, id: userId || undefined };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileToSave));
    
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('profile-updated'));

    if (supabase && navigator.onLine && userId) {
        const payload = {
          id: userId,
          full_name: profile.full_name,
          mantra: profile.mantra,
          imagem: profile.imagem,
          statement: profile.statement,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) {
          if (error.message?.includes('statement')) throw new Error("Erro de Banco de Dados: Coluna 'statement' ausente.");
          if (error.message?.includes('imagem')) {
                const { imagem, ...basicPayload } = payload;
                await supabase.from('profiles').upsert(basicPayload);
          } else {
            throw error;
          }
        }
    }
  },

  // --- CHECKLIST ---
  async getTasks(): Promise<DailyTask[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    // Estratégia Cache-First para Tasks (performance)
    if (saved) {
      if (navigator.onLine) syncLocalDataToSupabase(); 
      return JSON.parse(saved);
    }

    if (supabase && navigator.onLine) {
      try {
        const userId = await getCurrentUserId();
        let query = supabase.from('tasks').select('*').order('id');
        if (userId) query = query.eq('user_id', userId);
        const { data } = await query;
        if (data && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data));
          return data;
        }
      } catch(e) {}
    }
    return INITIAL_TASKS;
  },

  async saveTasks(tasks: DailyTask[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.LAST_CHECKLIST_DATE, new Date().toISOString().split('T')[0]);
    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const tasksToSave = userId ? tasks.map(t => ({ ...t, user_id: userId })) : tasks;
          await supabase.from('tasks').upsert(tasksToSave);
        } catch (e) { }
      })();
    }
  },

  getLastChecklistDate(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_CHECKLIST_DATE);
  },

  // --- ATIVIDADES / ESTATÍSTICAS ---
  async setActivityCount(count: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      let logs: ActivityLog[] = saved ? JSON.parse(saved) : [];
      const existingIndex = logs.findIndex(l => l.date === today);
      if (existingIndex >= 0) {
        logs[existingIndex].count = count;
      } else {
        logs.push({ date: today, count: count });
      }
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs));
    } catch (e) { console.error(e); }

    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            const { data } = await supabase.from('activity_logs').select('*').eq('user_id', userId).eq('date', today).single();
            if (data) {
              await supabase.from('activity_logs').update({ count: count }).eq('id', data.id);
            } else {
              await supabase.from('activity_logs').insert({ user_id: userId, date: today, count: count });
            }
          }
        } catch (e) {}
      })();
    }
  },

  async logActivity(increment: number = 1): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let currentCount = 0;
    if (saved) {
      const logs = JSON.parse(saved);
      const todayLog = logs.find((l: any) => l.date === today);
      if (todayLog) currentCount = todayLog.count;
    }
    return this.setActivityCount(currentCount + increment);
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (saved) return JSON.parse(saved);

    if (supabase && navigator.onLine) {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const { data } = await supabase.from('activity_logs').select('date, count').eq('user_id', userId).order('date', { ascending: true }).limit(30);
          if (data) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {}
    }
    return [];
  },

  // --- PLANO 7 DIAS ---
  async getPlan(): Promise<DayPlan[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAN);
    let localData = saved ? JSON.parse(saved) : null;
    if (localData) {
       if(navigator.onLine) syncLocalDataToSupabase();
       return localData;
    }

    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      if (userId) {
         const { data } = await supabase.from('plans').select('*').eq('user_id', userId).order('day');
         if (data && data.length > 0) {
           localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(data));
           return data as DayPlan[];
         }
      }
    }
    return SEVEN_DAY_PLAN;
  },

  async savePlan(plan: DayPlan[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const supabasePayload = plan.map(({ day, title, description, completed, answer, completed_at }) => ({
            day, title, description, completed, answer, completed_at,
            user_id: userId
          }));
          await supabase.from('plans').upsert(supabasePayload);
        } catch (e) { }
      })();
    }
  },

  // --- CRENÇAS ---
  async getBeliefs(): Promise<BeliefEntry[]> {
    const userId = await getCurrentUserId();
    const saved = localStorage.getItem(STORAGE_KEYS.BELIEFS);
    
    if (saved) return JSON.parse(saved);
    
    if (supabase && navigator.onLine && userId) {
       try {
           const { data } = await supabase.from('beliefs').select('*').eq('user_id', userId);
           if (data) {
              const reversed = data.reverse();
              localStorage.setItem(STORAGE_KEYS.BELIEFS, JSON.stringify(reversed));
              return reversed;
           }
       } catch (e) {}
    }
    return [];
  },

  async addBelief(entry: BeliefEntry): Promise<void> {
    const current = await db.getBeliefs();
    const updated = [entry, ...current];
    localStorage.setItem(STORAGE_KEYS.BELIEFS, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const entryWithUser = userId ? { ...entry, user_id: userId } : entry;
          await supabase.from('beliefs').insert(entryWithUser);
        } catch (e) {}
      })();
    }
  },

  // --- GRATIDÃO (MODIFICADO PARA NETWORK FIRST) ---
  async getGratitudeHistory(): Promise<GratitudeEntry[]> {
    const userId = await getCurrentUserId();

    // 1. Tentar Banco de Dados Primeiro (Network First) para garantir que temos dados de todos os dispositivos
    if (supabase && navigator.onLine && userId) {
      try {
        const { data } = await supabase
          .from('gratitude_entries')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (data) {
          // Atualiza o cache local com a verdade do servidor
          localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn("Erro ao buscar gratidão online, usando fallback local:", e);
      }
    }

    // 2. Fallback para LocalStorage se offline ou erro
    const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDE);
    if (saved) {
      const parsed = JSON.parse(saved) as GratitudeEntry[];
      // Limpeza de segurança de sessão
      if (userId && parsed.length > 0 && parsed[0].user_id && parsed[0].user_id !== userId) {
        localStorage.removeItem(STORAGE_KEYS.GRATITUDE);
        return [];
      }
      return parsed;
    }

    return [];
  },

  async addGratitudeEntry(entry: GratitudeEntry): Promise<void> {
    const userId = await getCurrentUserId();
    const entryWithUser = userId ? { ...entry, user_id: userId } : entry;

    // Salva Local
    // Não usamos getGratitudeHistory aqui para evitar loop infinito de requests, lemos direto do storage ou memory
    const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDE);
    const current = saved ? JSON.parse(saved) : [];
    const updated = [entryWithUser, ...current];
    localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(updated));

    // Salva Remoto
    if (supabase && navigator.onLine) {
      // Sem IIFE e sem try/catch silencioso total, para permitir debug se necessário
      try {
        const { error } = await supabase.from('gratitude_entries').insert(entryWithUser);
        if (error) {
           console.error("Erro Supabase Gratidão:", error);
           // Se a tabela não existir, o usuário verá no console
        }
      } catch (e) {
        console.error("Erro de conexão Gratidão:", e);
      }
    }
  },

  // --- CHAT ---
  async getChatHistory(): Promise<ChatMessage[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    if(saved) return JSON.parse(saved);
    
    if (supabase && navigator.onLine) {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const { data } = await supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
          if (data) {
            localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {}
    }
    return [];
  },

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT) || '[]');
    const updated = [...current, message];
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          await supabase.from('chat_history').insert({
            role: message.role,
            text: message.text,
            created_at: new Date().toISOString(),
            user_id: userId
          });
        } catch (e) {}
      })();
    }
  },

  async clearChat(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if(userId) await supabase.from('chat_history').delete().eq('user_id', userId);
        } catch (e) {}
      })();
    }
  }
};