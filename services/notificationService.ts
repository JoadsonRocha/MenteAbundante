import { supabase } from './database';

// Extendendo window para TypeScript aceitar OneSignalDeferred
declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

// App ID configurado (apenas referência, init é no HTML agora)
const ONESIGNAL_APP_ID = "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

export const initOneSignal = async (userId?: string) => {
  // Executa apenas no cliente
  if (typeof window === 'undefined') return;

  // A inicialização agora ocorre via <script> no index.html usando OneSignalDeferred.
  // Aqui apenas gerenciamos o Login e Sync de dados quando o usuário estiver disponível.

  if (userId) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
            const currentId = OneSignal.User.externalId;
            if (currentId === userId) {
                console.log(`[OneSignal] Usuário já identificado (Cache): ${userId}`);
                syncOneSignalIdToSupabase(userId);
            } else {
                console.log(`[OneSignal] Solicitando login para: ${userId}`);
                await OneSignal.login(userId);
                console.log(`[OneSignal] Login realizado com sucesso.`);
                
                // Sincroniza
                setTimeout(() => syncOneSignalIdToSupabase(userId), 1000);
            }

            // Listener para mudanças de permissão
             if (OneSignal.User && OneSignal.User.PushSubscription) {
                OneSignal.User.PushSubscription.addEventListener("change", (event: any) => {
                  console.log("[OneSignal] Mudança de subscrição:", event);
                  if (event.current.optedIn && userId) {
                    syncOneSignalIdToSupabase(userId);
                  }
                });
            }

        } catch (e) {
            console.error("[OneSignal] Erro no login (Deferred):", e);
        }
    });
  }
};

export const requestNotificationPermission = async () => {
  try {
    console.log("[OneSignal] Solicitando permissão...");
    
    return new Promise((resolve) => {
       window.OneSignalDeferred = window.OneSignalDeferred || [];
       window.OneSignalDeferred.push(async function(OneSignal: any) {
          try {
             await OneSignal.Notifications.requestPermission();
             const isEnabled = OneSignal.User.PushSubscription.optedIn;
             resolve(isEnabled);
          } catch(e) {
             console.error(e);
             resolve(false);
          }
       });
    });

  } catch (error) {
    console.error("[OneSignal] Erro ao solicitar permissão:", error);
    if ('Notification' in window) {
       const permission = await Notification.requestPermission();
       return permission === 'granted';
    }
    return false;
  }
};

export const syncOneSignalIdToSupabase = async (userId: string) => {
  if (!supabase) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
        if (!OneSignal.User || !OneSignal.User.PushSubscription) return;

        const subscriptionId = OneSignal.User.PushSubscription.id;
        
        if (subscriptionId) {
          const { error } = await supabase
            .from('profiles')
            .update({ onesignal_id: subscriptionId })
            .eq('id', userId);

          if (error) console.error("[Supabase] Erro ao salvar OneSignal ID:", error);
        }
    } catch (error) {
        // console.warn("[Sync] Erro silencioso:", error);
    }
  });
};

export const isPushEnabled = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') { resolve(false); return; }

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(function(OneSignal: any) {
             try {
                 resolve(OneSignal.User.PushSubscription.optedIn || false);
             } catch {
                 resolve(false);
             }
        });
    });
};

export const getOneSignalId = async (): Promise<string | null | undefined> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') { resolve(null); return; }

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(function(OneSignal: any) {
             try {
                 resolve(OneSignal.User.PushSubscription.id);
             } catch {
                 resolve(null);
             }
        });
    });
};