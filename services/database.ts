import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyTask, DayPlan, BeliefEntry, ChatMessage, ActivityLog, UserProfile, GratitudeEntry, FeedbackEntry, GoalPlan, SupportTicket } from '../types';
import { INITIAL_TASKS, SEVEN_DAY_PLAN } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
const DEFAULT_URL = "https://qyjlkxjnpohqxvaiqcmx.supabase.co";
const DEFAULT_KEY = "sb_publishable_9i0XVchnkLqgtps3kB0w8w_66RldWiQ";

const SUPABASE_URL = process.env.SUPABASE_URL || DEFAULT_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || DEFAULT_KEY;

const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

export const supabase: SupabaseClient | null = hasSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }) 
  : null;

export const STORAGE_KEYS = {
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

// HELPER SEGURO PARA JSON PARSE
// Evita que o app trave com "Uncaught SyntaxError" se o localStorage for corrompido
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Erro ao ler ${key} do storage, resetando para fallback.`, e);
    // Opcional: limpar o item corrompido para evitar erros futuros
    // localStorage.removeItem(key); 
    return fallback;
  }
};

const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
};

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const syncLocalDataToSupabase = async () => {
  if (!supabase || !navigator.onLine) return;

  try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      // 1. Sync Tasks
      const localTasks = safeParse<DailyTask[]>(STORAGE_KEYS.TASKS, []);
      if (localTasks.length > 0) {
        const tasksWithUser = localTasks.map((t) => ({ ...t, user_id: userId }));
        await supabase.from('tasks').upsert(tasksWithUser);
      }

      // 2. Sync Plan
      const localPlan = safeParse<DayPlan[]>(STORAGE_KEYS.PLAN, []);
      const modifiedDays = localPlan.filter((p) => p.completed || p.answer);
      if (modifiedDays.length > 0) {
        const plansWithUser = modifiedDays.map((p) => ({ 
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
      const localLogs = safeParse<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, []);
      if (localLogs.length > 0) {
        for (const log of localLogs) {
          const { data } = await supabase.from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', log.date)
            .maybeSingle();

          if (data) {
            await supabase.from('activity_logs').update({ count: log.count }).eq('id', data.id);
          } else {
            await supabase.from('activity_logs').insert({ user_id: userId, date: log.date, count: log.count });
          }
        }
      }
      
      // 4. Sync Profile
      const localProfile = safeParse(STORAGE_KEYS.PROFILE, null) as any;
      if (localProfile && localProfile.id === userId) {
        const payload = {
          id: userId,
          full_name: localProfile.full_name,
          mantra: localProfile.mantra,
          imagem: localProfile.imagem,
          statement: localProfile.statement,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error && error.message?.includes('imagem')) {
          const { imagem, ...basicPayload } = payload;
          await supabase.from('profiles').upsert(basicPayload);
        }
      }

      // 5. Sync Gratitude (Upload)
      const localGratitude = safeParse<GratitudeEntry[]>(STORAGE_KEYS.GRATITUDE, []);
      if (localGratitude.length > 0) {
        const validEntries = localGratitude.filter((g) => g.id && g.id.length > 10);
        const entriesWithUser = validEntries.map((g) => ({ ...g, user_id: userId }));
        
        if (entriesWithUser.length > 0) {
          await supabase.from('gratitude_entries').upsert(entriesWithUser);
        }
      }
      
      // 6. Sync Goal Plans
      const localGoals = safeParse<GoalPlan[]>(STORAGE_KEYS.GOAL_PLANS, []);
      if (localGoals.length > 0) {
        const goalsWithUser = localGoals.map((g) => ({ ...g, user_id: userId }));
        await supabase.from('goal_plans').upsert(goalsWithUser);
      }

      // 7. Sync Support Tickets
      const localTickets = safeParse<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, []);
      if (localTickets.length > 0) {
        const ticketsWithUser = localTickets.map((t) => ({ ...t, user_id: userId }));
        await supabase.from('support_tickets').upsert(ticketsWithUser);
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
    const parsed = safeParse<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
    
    if (parsed) {
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
    if (saved) {
      if (navigator.onLine) syncLocalDataToSupabase(); 
      // Safe parse aqui garante que não retorne erro se o JSON for inválido
      return safeParse(STORAGE_KEYS.TASKS, INITIAL_TASKS);
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

  // --- ATIVIDADES ---
  async setActivityCount(count: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      let logs: ActivityLog[] = safeParse(STORAGE_KEYS.ACTIVITY, []);
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
            const { data } = await supabase.from('activity_logs')
              .select('*')
              .eq('user_id', userId)
              .eq('date', today)
              .maybeSingle();

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
    let currentCount = 0;
    const logs = safeParse<any[]>(STORAGE_KEYS.ACTIVITY, []);
    const todayLog = logs.find((l: any) => l.date === today);
    if (todayLog) currentCount = todayLog.count;
    
    return this.setActivityCount(currentCount + increment);
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (saved) return safeParse(STORAGE_KEYS.ACTIVITY, []);

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
    // Safe parse para evitar crash
    let localData = saved ? safeParse(STORAGE_KEYS.PLAN, null) : null;
    
    if (localData) {
       if(navigator.onLine) syncLocalDataToSupabase();
       return localData as DayPlan[];
    }

    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      if (userId) {
         try {
           const { data } = await supabase.from('plans').select('*').eq('user_id', userId).order('day');
           if (data && data.length > 0) {
             localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(data));
             return data as DayPlan[];
           }
         } catch (e) {}
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
    
    if (saved) return safeParse(STORAGE_KEYS.BELIEFS, []);
    
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

  // --- GRATIDÃO ---
  async getGratitudeHistory(): Promise<GratitudeEntry[]> {
    const userId = await getCurrentUserId();
    if (supabase && navigator.onLine && userId) {
      try {
        const { data } = await supabase.from('gratitude_entries').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (data) {
          localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(data));
          return data;
        }
      } catch (e) { }
    }
    
    const parsed = safeParse<GratitudeEntry[]>(STORAGE_KEYS.GRATITUDE, []);
    if (userId && parsed.length > 0 && parsed[0].user_id && parsed[0].user_id !== userId) {
        localStorage.removeItem(STORAGE_KEYS.GRATITUDE);
        return [];
    }
    return parsed;
  },

  async addGratitudeEntry(entry: GratitudeEntry): Promise<void> {
    const userId = await getCurrentUserId();
    const entryWithUser = userId ? { ...entry, user_id: userId } : entry;
    const current = await db.getGratitudeHistory();
    const updated = [entryWithUser, ...current];
    localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
      try {
        await supabase.from('gratitude_entries').insert(entryWithUser);
      } catch (e) { }
    }
  },

  // --- CHAT ---
  async getChatHistory(): Promise<ChatMessage[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
    if(saved) return safeParse(STORAGE_KEYS.CHAT, []);
    
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
    const current = safeParse<ChatMessage[]>(STORAGE_KEYS.CHAT, []);
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
  },

  // --- FEEDBACK ---
  async saveFeedback(feedback: FeedbackEntry): Promise<void> {
    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Usuário não autenticado");

      const payload = {
        ...feedback,
        user_id: userId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feedbacks').insert(payload);
      if (error) {
        throw new Error("Não foi possível enviar o feedback. Tente novamente.");
      }
    } else {
      throw new Error("Você precisa estar online para enviar feedback.");
    }
  },

  // --- SMART PLANNER ---
  async getGoalPlans(): Promise<GoalPlan[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.GOAL_PLANS);
    if (saved) return safeParse(STORAGE_KEYS.GOAL_PLANS, []);

    if (supabase && navigator.onLine) {
       const userId = await getCurrentUserId();
       if (userId) {
          try {
             const { data } = await supabase.from('goal_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
             if (data) {
               localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(data));
               return data as GoalPlan[];
             }
          } catch (e) {}
       }
    }
    return [];
  },

  async saveGoalPlan(plan: GoalPlan): Promise<void> {
    const current = await db.getGoalPlans();
    const exists = current.find(p => p.id === plan.id);
    let updated = [];
    if (exists) {
       updated = current.map(p => p.id === plan.id ? plan : p);
    } else {
       updated = [plan, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      const payload = { ...plan, user_id: userId };
      try {
        await supabase.from('goal_plans').upsert(payload);
      } catch (e) {}
    }
  },

  async deleteGoalPlan(id: string): Promise<void> {
    const current = await db.getGoalPlans();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.GOAL_PLANS, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      if (userId) {
         try {
           await supabase.from('goal_plans').delete().eq('id', id).eq('user_id', userId);
         } catch(e) {}
      }
    }
  },

  // --- SUPPORT SYSTEM ---
  async createSupportTicket(ticket: SupportTicket): Promise<void> {
    const current = safeParse<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, []);
    const updated = [ticket, ...current];
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(updated));
    
    if (supabase && navigator.onLine) {
      const userId = await getCurrentUserId();
      if (userId) {
         try {
           const payload = { ...ticket, user_id: userId };
           await supabase.from('support_tickets').insert(payload);
         } catch (e) {}
      }
    }
  },
  
  async updateSupportTicketStatus(id: string, status: 'resolved'): Promise<void> {
    const current = safeParse<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, []);
    const updated = current.map((t: SupportTicket) => t.id === id ? { ...t, status } : t);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(updated));

    if (supabase && navigator.onLine) {
       const userId = await getCurrentUserId();
       if (userId) {
          try {
             await supabase.from('support_tickets')
               .update({ status: status })
               .eq('id', id)
               .eq('user_id', userId);
          } catch(e) {}
       }
    }
  },

  async getSupportHistory(): Promise<SupportTicket[]> {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    
    if (supabase && navigator.onLine) {
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
          } catch (e) {}
       }
    }

    return saved ? safeParse(STORAGE_KEYS.SUPPORT_TICKETS, []) : [];
  }
};