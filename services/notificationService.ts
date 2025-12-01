import OneSignal from 'react-onesignal';
import { supabase } from './database';

// App ID configurado
const ONESIGNAL_APP_ID = "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

export const initOneSignal = async (userId?: string) => {
  // Executa apenas no cliente
  if (typeof window === 'undefined') return;

  try {
    // Inicialização básica
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: "sw.js", // Caminho para o Service Worker na raiz
      
      // Desativa UI automática para controle manual pelo nosso app
      notifyButton: { enable: false },
      welcomeNotification: { disable: true }, // Já desativamos via código anterior
    });

    console.log("[OneSignal] Inicializado");

    // Identificação do Usuário (CRUCIAL para aparecer no Dashboard)
    if (userId) {
      // O método login vincula este dispositivo ao External User ID (userId do Supabase)
      await OneSignal.login(userId);
      console.log(`[OneSignal] Usuário identificado: ${userId}`);
      
      // Tenta sincronizar ID imediatamente caso já tenha permissão
      await syncOneSignalIdToSupabase(userId);
    }

    // Listener para detectar quando o usuário aceita a permissão no navegador
    // Isso garante que salvamos o ID no banco assim que ele clica em "Permitir"
    OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
      console.log("[OneSignal] Mudança de subscrição:", event);
      if (event.current.optedIn && userId) {
        await syncOneSignalIdToSupabase(userId);
      }
    });

  } catch (error) {
    console.error("[OneSignal] Falha na inicialização:", error);
  }
};

export const requestNotificationPermission = async () => {
  try {
    console.log("[OneSignal] Solicitando permissão...");
    // Solicita permissão nativa do navegador (Popup do Chrome/Safari)
    await OneSignal.Notifications.requestPermission();
    
    // Verifica se foi concedido
    const isEnabled = await isPushEnabled();
    console.log("[OneSignal] Permissão concedida?", isEnabled);
    return isEnabled;
  } catch (error) {
    console.error("[OneSignal] Erro ao solicitar permissão:", error);
    // Fallback: Tenta API nativa do navegador se o SDK falhar
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
    // Obtém o Subscription ID (Player ID) atual e status
    const subscriptionId = OneSignal.User.PushSubscription.id;
    const isOptedIn = OneSignal.User.PushSubscription.optedIn;
    
    console.log(`[OneSignal] Sync - ID: ${subscriptionId}, OptedIn: ${isOptedIn}`);

    // Só salvamos se tivermos um ID e o usuário tiver aceitado notificações
    if (subscriptionId && isOptedIn) {
      const { error } = await supabase
        .from('profiles')
        .update({ onesignal_id: subscriptionId })
        .eq('id', userId);

      if (error) console.error("[Supabase] Erro ao salvar OneSignal ID:", error);
      else console.log("[Supabase] OneSignal ID salvo com sucesso.");
    }
  } catch (error) {
    console.error("[Sync] Erro ao sincronizar:", error);
  }
};

export const isPushEnabled = async (): Promise<boolean> => {
    try {
        // Verifica se o usuário está inscrito (optedIn)
        return OneSignal.User.PushSubscription.optedIn || false;
    } catch (e) {
        return false;
    }
}