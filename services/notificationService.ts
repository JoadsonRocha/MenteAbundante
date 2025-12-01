import OneSignal from 'react-onesignal';
import { supabase } from './database';

// App ID configurado
const ONESIGNAL_APP_ID = "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

export const initOneSignal = async (userId?: string) => {
  // Evita erros em SSR ou navegadores sem suporte
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, 
      serviceWorkerPath: "sw.js", 
      serviceWorkerParam: { scope: "/" },
      notifyButton: {
        enable: false, // Usamos nossa própria UI
      },
      // Configuração para garantir que o prompt nativo não seja bloqueado automaticamente
      promptOptions: {
        slidedown: {
          prompts: [] // Desabilita slidedown automático para usarmos o botão manual
        }
      }
    });

    // Se temos o usuário logado, fazemos o login no OneSignal para vincular
    if (userId) {
      try {
        // Verifica se o OneSignal está pronto antes de logar
        if (OneSignal.User) {
           await OneSignal.login(userId);
           // Sincroniza ID se já tiver permissão
           await syncOneSignalIdToSupabase(userId);
           
           // Listener para mudanças de permissão (ex: aceitou depois)
           OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
             if (event.current.optedIn) {
                console.log("Notificações ativadas pelo usuário.");
                await syncOneSignalIdToSupabase(userId);
             }
           });
        }
      } catch (loginError) {
        console.warn("OneSignal: Login ignorado (bloqueador de anúncios ou falha de rede).", loginError);
      }
    }

    console.log("Sistema de Notificações Ativo");
  } catch (error) {
    console.warn("OneSignal não pôde ser inicializado (pode ser bloqueador de anúncios ou configuração).", error);
  }
};

export const requestNotificationPermission = async () => {
  try {
    // Tenta o prompt nativo ou slidedown do OneSignal
    await OneSignal.Slidedown.promptPush();
  } catch (error) {
    console.error("Erro ao solicitar permissão:", error);
    // Fallback: Tenta API nativa do navegador se o OneSignal falhar
    if ('Notification' in window) {
       await Notification.requestPermission();
    }
  }
};

export const syncOneSignalIdToSupabase = async (userId: string) => {
  if (!supabase || !OneSignal.User) return;

  try {
    const subscriptionId = OneSignal.User.PushSubscription.id;
    const isOptedIn = OneSignal.User.PushSubscription.optedIn;
    
    if (subscriptionId && isOptedIn) {
      const { error } = await supabase
        .from('profiles')
        .update({ onesignal_id: subscriptionId })
        .eq('id', userId);

      if (error) console.error("Erro sync OneSignal DB:", error);
    }
  } catch (error) {
    console.error("Erro ao sincronizar OneSignal ID:", error);
  }
};

export const isPushEnabled = async (): Promise<boolean> => {
    try {
        if (!OneSignal.User) return false;
        return OneSignal.User.PushSubscription.optedIn || false;
    } catch (e) {
        return false;
    }
}