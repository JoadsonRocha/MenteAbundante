import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyTask, DayPlan, BeliefEntry, ChatMessage, ActivityLog, UserProfile } from '../types';
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

// --- FUNÇÃO DE SINCRONIZAÇÃO (Sync Engine) ---
export const syncLocalDataToSupabase = async () => {
  if (!supabase || !navigator.onLine) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  console.log("🔄 Iniciando sincronização em background...");

  try {
    // 1. Sync Tasks
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    if (localTasks.length > 0) {
      const tasksWithUser = localTasks.map((t: any) => ({ ...t, user_id: userId }));
      const { error } = await supabase.from('tasks').upsert(tasksWithUser);
      if (error) console.log("Sync info tasks:", error.message);
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
        user_id: userId 
      }));
      const { error } = await supabase.from('plans').upsert(plansWithUser);
      if (error) console.log("Sync info plan:", error.message);
    }

    // 3. Sync Activity Logs
    const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
    if (localLogs.length > 0) {
       for (const log of localLogs) {
         const { data } = await supabase.from('activity_logs').select('*').eq('user_id', userId).eq('date', log.date).single();
         if (data) {
           // Se a contagem local for diferente, atualiza (prefere a maior ou a mais recente? Vamos assumir sync da local)
           await supabase.from('activity_logs').update({ count: log.count }).eq('id', data.id);
         } else {
           await supabase.from('activity_logs').insert({ user_id: userId, date: log.date, count: log.count });
         }
       }
    }
    
    console.log("✅ Sincronização concluída.");
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
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) return JSON.parse(saved);

    if (supabase && navigator.onLine) {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          
          if (error) {
            console.log("Info perfil:", error.message);
            // Se erro for de coluna, retorna null mas não quebra
            return null;
          }
          
          if (data) {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {}
    }
    return null;
  },

  async updateProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    
    // Dispara evento para atualizar UI (Sidebar) instantaneamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-updated'));
    }

    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            const payload = {
              id: userId,
              full_name: profile.full_name,
              mantra: profile.mantra,
              imagem: profile.imagem, // Agora usa a coluna 'imagem'
              updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('profiles').upsert(payload);
            
            if (error) {
              console.log("Erro inicial ao salvar perfil:", error.message);
              // Fallback: Se falhar por causa da coluna imagem inexistente
              if (error.message?.includes('imagem') || error.code === '42703' || error.message?.includes('schema')) {
                console.log("Tentando salvar perfil sem imagem (coluna ausente)...");
                const { imagem, ...fallbackPayload } = payload;
                const { error: fallbackError } = await supabase.from('profiles').upsert(fallbackPayload);
                if (fallbackError) console.log("Erro no fallback de perfil:", fallbackError.message);
              }
            }
          }
        } catch (e) { console.error(e); }
      })();
    }
  },

  // --- CHECKLIST ---
  async getTasks(): Promise<DailyTask[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        if (navigator.onLine) syncLocalDataToSupabase(); 
        return JSON.parse(saved);
      }
    } catch (e) {}

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
          const { error } = await supabase.from('tasks').upsert(tasksToSave);
          if (error) console.log("Save tasks info:", error.message);
        } catch (e) { console.error("Error saving tasks:", e); }
      })();
    }
  },

  // Helper para verificar data do último checklist
  getLastChecklistDate(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_CHECKLIST_DATE);
  },

  // --- ATIVIDADES / ESTATÍSTICAS ---
  // Substitui logActivity para definir o valor exato (melhor para checkboxes que podem ser marcados/desmarcados)
  async setActivityCount(count: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Atualiza LocalStorage
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

    // 2. Atualiza Supabase
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

  // Mantém para compatibilidade (adiciona ao valor atual)
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
          const supabasePayload = plan.map(({ day, title, description, completed, answer }) => ({
            day, title, description, completed, answer,
            user_id: userId
          }));
          const { error } = await supabase.from('plans').upsert(supabasePayload);
          if (error) console.log("Save plan info:", error.message);
        } catch (e) { console.error("Error saving plan:", e); }
      })();
    }
  },

  // --- CRENÇAS ---
  async getBeliefs(): Promise<BeliefEntry[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.BELIEFS);
    if (saved) {
      return JSON.parse(saved);
    }
    
    if (supabase && navigator.onLine) {
       try {
         const userId = await getCurrentUserId();
         let query = supabase.from('beliefs').select('*');
         
         if (userId) {
           try {
             // Tenta filtrar. Se falhar por schema, cai no catch.
             const { data, error } = await query.eq('user_id', userId);
             if (error) throw error;
             if (data) {
                const reversed = data.reverse();
                localStorage.setItem(STORAGE_KEYS.BELIEFS, JSON.stringify(reversed));
                return reversed;
             }
           } catch (filterError: any) {
             if (filterError.message?.includes('user_id') || filterError.code === '42703') {
               console.log("Aviso: Tabela 'beliefs' sem user_id. Carregando dados públicos.");
               const { data } = await supabase.from('beliefs').select('*');
               if (data) return data.reverse();
             }
             console.log("Info: Erro ao buscar crenças:", filterError.message);
           }
         } else {
           const { data } = await query;
           if (data) return data.reverse();
         }
       } catch (e) {}
    }
    return [];
  },

  async addBelief(entry: BeliefEntry): Promise<void> {
    // 1. Local Update
    const current = await db.getBeliefs();
    const updated = [entry, ...current];
    localStorage.setItem(STORAGE_KEYS.BELIEFS, JSON.stringify(updated));

    // 2. Remote
    if (supabase && navigator.onLine) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          // Tenta salvar COM usuário primeiro
          const entryWithUser = userId ? { ...entry, user_id: userId } : entry;
          
          const { error } = await supabase.from('beliefs').insert(entryWithUser);
          
          if (error) {
            // Se falhar porque não tem a coluna, tenta SEM usuário
            if (error.message?.includes('user_id') || error.code === '42703') {
               console.log("Schema: Salvando sem user_id (coluna ausente).");
               const { user_id, ...entryWithoutUser } = entryWithUser;
               const { error: fallbackError } = await supabase.from('beliefs').insert(entryWithoutUser);
               if (fallbackError) console.log("Info: Falha ao salvar backup remoto de crença.");
            } else {
               console.log("Info: Erro ao salvar crença:", error.message);
            }
          }
        } catch (e) {
          console.error("Erro interno ao salvar crença:", e);
        }
      })();
    }
  },

  // --- CHAT ---
  async getChatHistory(): Promise<ChatMessage[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    if(saved) return JSON.parse(saved);
    
    if (supabase && navigator.onLine) {
      try {
        const userId = await getCurrentUserId();
        const { data } = await supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        if (data) {
          localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(data));
          return data;
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
          const { error } = await supabase.from('chat_history').insert({
            role: message.role,
            text: message.text,
            created_at: new Date().toISOString(),
            user_id: userId
          });
          if (error) console.log("Chat sync info:", error.message);
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