import OneSignal from 'react-onesignal';
import { supabase } from './database';

// App ID configurado
const ONESIGNAL_APP_ID = "e57c6fb0-c748-49f0-a513-9248d5d1b39b";
let isInitialized = false;

export const initOneSignal = async (userId?: string) => {
  // Executa apenas no cliente
  if (typeof window === 'undefined') return;

  // Garante que o init só rode uma vez por sessão da página
  if (!isInitialized) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        });
        isInitialized = true;
        console.log("[OneSignal] Inicializado com sucesso.");
      } catch (error: any) {
        // Se der erro (ex: já inicializado), assumimos que está pronto ou falhou de forma recuperável
        console.warn("[OneSignal] Aviso na inicialização:", error);
        isInitialized = true;
      }
  }

  // Identificação do Usuário
  if (userId) {
    // Usamos um setTimeout para garantir que o SDK tenha tempo de hidratar o estado do usuário
    // O erro "reading 'tt'" é frequentemente causado por chamar login imediatamente após init
    setTimeout(async () => {
        try {
            // Verifica se o módulo User existe
            if (!OneSignal.User) {
                 console.log("[OneSignal] Módulo User não disponível. Tentando novamente em 2s...");
                 setTimeout(() => initOneSignal(userId), 2000);
                 return;
            }

            // Verifica se já estamos logados com este ID para evitar chamada desnecessária
            const currentId = OneSignal.User.externalId;
            if (currentId === userId) {
                console.log(`[OneSignal] Usuário já identificado (Cache): ${userId}`);
                syncOneSignalIdToSupabase(userId);
            } else {
                console.log(`[OneSignal] Solicitando login para: ${userId}`);
                await OneSignal.login(userId);
                console.log(`[OneSignal] Login realizado com sucesso.`);
                
                // Aguarda um pouco antes de sincronizar para garantir que o PushSubscription.id atualizou
                setTimeout(() => syncOneSignalIdToSupabase(userId), 1000);
            }
        } catch (e) {
            console.error("[OneSignal] Erro no login:", e);
        }
    }, 1500); // Delay de 1.5s
  }

  // Listener para mudanças de permissão
  try {
      if (OneSignal.User && OneSignal.User.PushSubscription) {
          OneSignal.User.PushSubscription.addEventListener("change", (event) => {
            console.log("[OneSignal] Mudança de subscrição:", event);
            if (event.current.optedIn && userId) {
              syncOneSignalIdToSupabase(userId);
            }
          });
      }
  } catch (e) {
      // Ignora erro de listener duplicado
  }
};

export const requestNotificationPermission = async () => {
  try {
    console.log("[OneSignal] Solicitando permissão...");
    await OneSignal.Notifications.requestPermission();
    const isEnabled = await isPushEnabled();
    return isEnabled;
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

  try {
    if (!OneSignal.User || !OneSignal.User.PushSubscription) {
        return;
    }

    const subscriptionId = OneSignal.User.PushSubscription.id;
    const isOptedIn = OneSignal.User.PushSubscription.optedIn;
    
    if (subscriptionId) {
      // console.log(`[Sync] ID: ${subscriptionId} | OptedIn: ${isOptedIn}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ onesignal_id: subscriptionId })
        .eq('id', userId);

      if (error) console.error("[Supabase] Erro ao salvar OneSignal ID:", error);
    }
  } catch (error) {
    // console.warn("[Sync] Erro silencioso:", error);
  }
};

export const isPushEnabled = async (): Promise<boolean> => {
    try {
        if (!OneSignal.User) return false;
        return OneSignal.User.PushSubscription.optedIn || false;
    } catch (e) {
        return false;
    }
};

export const getOneSignalId = async (): Promise<string | null | undefined> => {
    try {
        return OneSignal.User?.PushSubscription?.id;
    } catch (e) {
        return null;
    }
};