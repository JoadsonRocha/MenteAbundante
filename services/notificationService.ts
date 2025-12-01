import { supabase } from './database';

// Extendendo window para TypeScript aceitar OneSignalDeferred
declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

// App ID configurado
const ONESIGNAL_APP_ID = "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

export const initOneSignal = async (userId?: string) => {
  // Executa apenas no cliente
  if (typeof window === 'undefined') return;

  // A inicialização agora ocorre via <script> no index.html.
  // Aqui gerenciamos apenas a identificação do usuário (Login).

  if (userId) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
            // Verifica estado atual
            const currentId = OneSignal.User.externalId;
            
            if (currentId === userId) {
                // Já logado, apenas garante sync
                syncOneSignalIdToSupabase(userId);
            } else {
                // Realiza login
                console.log(`[OneSignal] Logando usuário: ${userId}`);
                await OneSignal.login(userId);
                
                // Delay para garantir propagação
                setTimeout(() => syncOneSignalIdToSupabase(userId), 2000);
            }

            // Listener para mudanças de permissão (ex: usuário aceita o prompt)
             if (OneSignal.User && OneSignal.User.PushSubscription) {
                OneSignal.User.PushSubscription.addEventListener("change", (event: any) => {
                  if (event.current.optedIn && userId) {
                    console.log("[OneSignal] Usuário aceitou notificações!");
                    syncOneSignalIdToSupabase(userId);
                  }
                });
            }

        } catch (e) {
            console.error("[OneSignal] Erro no fluxo de login:", e);
        }
    });
  }
};

export const requestNotificationPermission = async () => {
  console.log("[OneSignal] Iniciando solicitação de permissão...");
  
  return new Promise((resolve) => {
     if (typeof window === 'undefined') { resolve(false); return; }

     window.OneSignalDeferred = window.OneSignalDeferred || [];
     window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
           // V16: requestPermission retorna boolean (true se aceitou)
           const accepted = await OneSignal.Notifications.requestPermission();
           console.log("[OneSignal] Resultado permissão:", accepted);
           
           // Fallback: verifica propriedade optedIn
           const isOptedIn = OneSignal.User.PushSubscription.optedIn;
           resolve(accepted || isOptedIn);
        } catch(e) {
           console.error("[OneSignal] Erro ao pedir permissão:", e);
           // Fallback nativo
           if ('Notification' in window) {
               Notification.requestPermission().then(p => resolve(p === 'granted'));
           } else {
               resolve(false);
           }
        }
     });
  });
};

export const syncOneSignalIdToSupabase = async (userId: string) => {
  if (!supabase) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
        // Aguarda um pouco para garantir que o ID foi gerado
        if (!OneSignal.User || !OneSignal.User.PushSubscription) return;

        const subscriptionId = OneSignal.User.PushSubscription.id;
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        
        if (subscriptionId && optedIn) {
          const { error } = await supabase
            .from('profiles')
            .update({ onesignal_id: subscriptionId })
            .eq('id', userId);

          if (error) console.error("[Supabase] Erro update ID:", error);
          else console.log("[Supabase] OneSignal ID salvo com sucesso.");
        }
    } catch (error) {
        console.warn("[Sync] Erro ao sincronizar ID:", error);
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