import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyTask, DayPlan, BeliefEntry, ChatMessage, ActivityLog, UserProfile, GratitudeEntry, FeedbackEntry, GoalPlan, SupportTicket, Language } from '../types';
import { INITIAL_TASKS_BY_LANG, SEVEN_DAY_PLAN_BY_LANG } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
const DEFAULT_URL = "https://qyjlkxjnpohqxvaiqcmx.supabase.co";
const DEFAULT_KEY = "sb_publishable_9i0XVchnkLqgtps3kB0w8w_66RldWiQ";

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || DEFAULT_KEY;

const hasSupabase = SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.length > 5;

// Exportamos para usar no AuthContext
export const supabase: SupabaseClient | null = hasSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }) 
  : null;

const STORAGE_KEYS = {
  TASKS: 'mente_tasks',
  PLAN: 'mente_plan',
  BELIEFS: 'mente_beliefs',
  GRATITUDE: 'mente_gratitude',
  CHAT: 'mente_chat',
  ACTIVITY: 'mente_activity',
  PROFILE: 'mente_profile',
  LAST_CHECKLIST_DATE: 'mente_last_checklist_date',
  GOAL_PLANS: 'mente_goal_plans',
  SUPPORT_TICKETS: 'mente_support_tickets'
};

let schemaMismatchDetected = false;

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
// Persiste activity_logs sem depender de chaves �nicas ausentes no banco
const persistActivityLog = async (userId: string, log: ActivityLog) => {
  if (!supabase) return { error: null };

  const { data, error: selectError } = await supabase
    .from('activity_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('date', log.date)
    .maybeSingle();

  if (selectError) return { error: selectError };

  if (data) {
    const { error } = await supabase
      .from('activity_logs')
      .update({ count: log.count })
      .eq('user_id', userId)
      .eq('date', log.date);
    return { error };
  }

  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    date: log.date,
    count: log.count
  });
  return { error };
};

export const syncLocalDataToSupabase = async () => {
  if (!supabase || !navigator.onLine || schemaMismatchDetected) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  const handleSyncError = (table: string, error: any) => {
    // 400 ou PGRST204 geralmente indicam que a coluna não existe no banco ou tipo errado.
    // Ignoramos para não travar o app, mas logamos para debug.
    if (error.code === 'PGRST204' || error.code === '400' || error.status === 400) {
      console.warn(`[Sync Warning] Schema mismatch in table '${table}'. Database might need migration. Working offline.`);
    } else {
      console.error(`[Sync Error] Failed to sync ${table}:`, error.message);
    }
  };

  try {
    // 1. Sync Tasks
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    if (localTasks.length > 0) {
      const tasksWithUser = localTasks.map((t: any) => ({ 
        id: t.id,
        text: t.text,
        completed: !!t.completed,
        user_id: userId 
      }));
      const { error } = await supabase.from('tasks').upsert(tasksWithUser);
      if (error) handleSyncError('tasks', error);
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
        answer: p.answer || null,
        ai_feedback: p.ai_feedback || null,
        completed_at: p.completed_at || null, 
        user_id: userId 
      }));
      const { error } = await supabase.from('plans').upsert(plansWithUser);
      if (error) handleSyncError('plans', error);
    }

    // 3. Sync Activity Logs
    const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
    if (localLogs.length > 0) {
       for (const log of localLogs) {
         const { error } = await persistActivityLog(userId, log);
         if (error) { 
           handleSyncError('activity_logs', error);
           break; // Stop loop on error
         }
       }
    }
    
    // 4. Sync Profile
    const localProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || 'null');
    if (localProfile && localProfile.id === userId) {
      const payload = {
         id: userId,
         full_name: localProfile.full_name || null,
         mantra: localProfile.mantra || null,
         imagem: localProfile.imagem || null,
         statement: localProfile.statement || null,
         updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) handleSyncError('profiles', error);
    }

    // 5. Sync Gratitude
    const localGratitude = JSON.parse(localStorage.getItem(STORAGE_KEYS.GRATITUDE) || '[]');
    if (localGratitude.length > 0) {
      const validEntries = localGratitude.filter((g: any) => g.id && g.id.length > 10);
      const entriesWithUser = validEntries.map((g: any) => ({ 
        id: g.id,
        text: g.text,
        ai_response: g.ai_response || null,
        date: g.date,
        user_id: userId 
      }));
      
      if (entriesWithUser.length > 0) {
        const { error } = await supabase.from('gratitude_entries').upsert(entriesWithUser);
        if (error) handleSyncError('gratitude_entries', error);
      }
    }

  } catch (e: any) {
    if (e?.message?.includes('JWT') || e?.code === '400') {
      console.warn("Autenticação/Rede: Continuando em modo Offline.");
    } else {
      console.error("Erro genérico na sincronização:", e);
    }
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

    if (supabase && navigator.onLine && !schemaMismatchDetected && userId) {
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

    if (supabase && navigator.onLine && !schemaMismatchDetected && userId) {
        const payload = {
          id: userId,
          full_name: profile.full_name || null,
          mantra: profile.mantra || null,
          imagem: profile.imagem || null,
          statement: profile.statement || null,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) {
           console.warn("Erro ao salvar perfil na nuvem (DB mismatch?):", error.message);
        }
    }
  },

  // --- CHECKLIST ---
  async getTasks(language: Language = 'pt'): Promise<DailyTask[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      if (navigator.onLine) syncLocalDataToSupabase(); 
      return JSON.parse(saved);
    }

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
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
    // Return language specific initial tasks
    return INITIAL_TASKS_BY_LANG[language] || INITIAL_TASKS_BY_LANG.pt;
  },

  async saveTasks(tasks: DailyTask[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.LAST_CHECKLIST_DATE, new Date().toISOString().split('T')[0]);
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const tasksToSave = tasks.map(t => ({
             id: t.id,
             text: t.text,
             completed: !!t.completed,
             user_id: userId || null
          }));
          
          if(userId) await supabase.from('tasks').upsert(tasksToSave);
        } catch (e) { }
      })();
    }
  },

  getLastChecklistDate(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_CHECKLIST_DATE);
  },

  // --- ATIVIDADES ---
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

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            await persistActivityLog(userId, { date: today, count: count });
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

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
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
  async getPlan(language: Language = 'pt'): Promise<DayPlan[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.PLAN);
    let localData = saved ? JSON.parse(saved) : null;
    if (localData) {
       if(navigator.onLine) syncLocalDataToSupabase();
       return localData;
    }

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      const userId = await getCurrentUserId();
      if (userId) {
         const { data } = await supabase.from('plans').select('*').eq('user_id', userId).order('day');
         if (data && data.length > 0) {
           localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(data));
           return data as DayPlan[];
         }
      }
    }
    return SEVEN_DAY_PLAN_BY_LANG[language] || SEVEN_DAY_PLAN_BY_LANG.pt;
  },

  async savePlan(plan: DayPlan[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if(!userId) return;

          const supabasePayload = plan.map((p) => ({
            day: p.day, 
            title: p.title, 
            description: p.description, 
            completed: p.completed, 
            answer: p.answer || null, 
            completed_at: p.completed_at || null,
            ai_feedback: p.ai_feedback || null,
            user_id: userId
          }));

          await supabase.from('plans').upsert(supabasePayload);
        } catch (e) { 
           console.error("Erro ao salvar plano Supabase:", e);
        }
      })();
    }
  },

  // --- CRENÇAS ---
  async getBeliefs(): Promise<BeliefEntry[]> {
    const userId = await getCurrentUserId();
    const saved = localStorage.getItem(STORAGE_KEYS.BELIEFS);
    
    if (saved) return JSON.parse(saved);
    
    if (supabase && navigator.onLine && !schemaMismatchDetected && userId) {
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

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const entryWithUser = userId ? { ...entry, user_id: userId } : entry;
          await supabase.from('beliefs').insert(entryWithUser);
        } catch (e) {}
      })();
    }
  },

  // --- GRATIDÃO ---
  async getGratitudeHistory(): Promise<GratitudeEntry[]> {
    const userId = await getCurrentUserId();
    if (supabase && navigator.onLine && !schemaMismatchDetected && userId) {
      try {
        const { data } = await supabase.from('gratitude_entries').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (data) {
          localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(data));
          return data;
        }
      } catch (e) { }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDE);
    return saved ? JSON.parse(saved) : [];
  },

  async addGratitudeEntry(entry: GratitudeEntry): Promise<void> {
    const userId = await getCurrentUserId();
    const entryWithUser = userId ? { ...entry, user_id: userId } : entry;
    const saved = localStorage.getItem(STORAGE_KEYS.GRATITUDE);
    const current = saved ? JSON.parse(saved) : [];
    const updated = [entryWithUser, ...current];
    localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(updated));

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      try {
        await supabase.from('gratitude_entries').insert(
           { ...entryWithUser, ai_response: entryWithUser.ai_response || null }
        );
      } catch (e) { }
    }
  },

  // --- CHAT ---
  async getChatHistory(): Promise<ChatMessage[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    if(saved) return JSON.parse(saved);
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
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

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
             await supabase.from('chat_history').insert({
                role: message.role,
                text: message.text,
                created_at: new Date().toISOString(),
                user_id: userId
             });
          }
        } catch (e) {}
      })();
    }
  },

  async clearChat(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          if(userId) await supabase.from('chat_history').delete().eq('user_id', userId);
        } catch (e) {}
      })();
    }
  },

  // --- FEEDBACK ---
  async saveFeedback(feedback: FeedbackEntry): Promise<void> {
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Usuário não autenticado");

      const payload = {
        ...feedback,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feedbacks').insert(payload);
      if (error) {
        console.error("Erro Supabase Feedback:", error);
        throw new Error("Não foi possível enviar o feedback. Tente novamente.");
      }
    } else {
      throw new Error("Você precisa estar online para enviar feedback.");
    }
  },

  // --- SMART PLANNER (NOVO) ---
  async getGoalPlans(): Promise<GoalPlan[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.GOAL_PLANS);
    if (saved) return JSON.parse(saved);

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
       const userId = await getCurrentUserId();
       if (userId) {
          const { data } = await supabase.from('goal_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          if (data) {
            localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(data));
            return data as GoalPlan[];
          }
       }
    }
    return [];
  },

  async saveGoalPlan(plan: GoalPlan): Promise<void> {
    // Local
    const current = await db.getGoalPlans();
    const exists = current.find(p => p.id === plan.id);
    let updated = [];
    if (exists) {
       updated = current.map(p => p.id === plan.id ? plan : p);
    } else {
       updated = [plan, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(updated));

    // Supabase
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      const userId = await getCurrentUserId();
      const payload = { ...plan, user_id: userId };
      
      try {
        await supabase.from('goal_plans').upsert(payload);
      } catch (e) {
        console.error("Erro ao salvar plano no DB", e);
      }
    }
  },

  async deleteGoalPlan(id: string): Promise<void> {
    const current = await db.getGoalPlans();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(updated));

    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      const userId = await getCurrentUserId();
      if(userId) await supabase.from('goal_plans').delete().eq('id', id).eq('user_id', userId);
    }
  },

  // --- SUPPORT SYSTEM (TICKETS) ---
  async createSupportTicket(ticket: SupportTicket): Promise<void> {
    // 1. Salva Local
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS) || '[]');
    const updated = [ticket, ...current];
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(updated));
    
    // 2. Salva Supabase
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
      const userId = await getCurrentUserId();
      if (userId) {
         try {
           const payload = { ...ticket, user_id: userId };
           const { error } = await supabase.from('support_tickets').insert(payload);
           if (error) console.error("Erro Supabase Support Create:", error);
         } catch (e) {
           console.error("Erro ao enviar ticket para nuvem", e);
         }
      }
    }
  },
  
  async updateSupportTicketStatus(id: string, status: 'resolved'): Promise<void> {
    // 1. Atualiza Local
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS) || '[]');
    const updated = current.map((t: SupportTicket) => t.id === id ? { ...t, status } : t);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(updated));

    // 2. Atualiza Supabase
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
       const userId = await getCurrentUserId();
       if (userId) {
          try {
             await supabase.from('support_tickets')
               .update({ status: status })
               .eq('id', id)
               .eq('user_id', userId);
          } catch(e) { }
       }
    }
  },

  async getSupportHistory(): Promise<SupportTicket[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    
    if (supabase && navigator.onLine && !schemaMismatchDetected) {
       const userId = await getCurrentUserId();
       if (userId) {
          try {
             const { data } = await supabase
               .from('support_tickets')
               .select('*')
               .eq('user_id', userId)
               .order('created_at', { ascending: false });
             
             if (data && data.length > 0) {
               localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(data));
               return data as SupportTicket[];
             }
          } catch (e) { }
       }
    }

    return saved ? JSON.parse(saved) : [];
  }
};












