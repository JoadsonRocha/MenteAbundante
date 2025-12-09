import { supabase } from './database';

// Serviço simplificado apenas para permissão nativa, se necessário no futuro
// OneSignal removido completamente conforme solicitado.

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
  }
  
  try {
     const permission = await Notification.requestPermission();
     return permission === 'granted';
  } catch(e) {
     console.error("Erro ao pedir permissão de notificação:", e);
     return false;
  }
};

// Funções dummy para manter compatibilidade caso algum componente ainda tente importar, 
// embora os usos tenham sido removidos dos componentes principais.
export const initOneSignal = async (userId?: string) => {
    // No-op
};

export const isPushEnabled = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
};

export const getOneSignalId = async (): Promise<string | null | undefined> => {
    return null;
};

export const syncOneSignalIdToSupabase = async (userId: string) => {
    // No-op
};