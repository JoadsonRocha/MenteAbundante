import OneSignal from 'react-onesignal';

// Solicita permissão usando a UI nativa do OneSignal ou do Browser
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // No OneSignal, podemos chamar o Slidedown de permissão
    await OneSignal.Slidedown.promptPush();
    // Ou usar a API nativa
    await OneSignal.User.PushSubscription.optIn();
    
    // Retorna o status atual da inscrição (converte para booleano para garantir tipo correto)
    return Boolean(OneSignal.User.PushSubscription.optedIn);
  } catch (error) {
    console.error("Erro ao solicitar permissão OneSignal:", error);
    return false;
  }
};

export const isPushEnabled = async (): Promise<boolean> => {
    try {
        // Verifica se o usuário está optado
        return OneSignal.User.PushSubscription.optedIn || false;
    } catch (e) {
        return false;
    }
};

// Envia tags para o OneSignal (útil para segmentação, ex: 'nivel: iniciante')
export const sendTags = (key: string, value: string) => {
    try {
        OneSignal.User.addTag(key, value);
    } catch (e) {
        console.error("Erro ao enviar tag OneSignal", e);
    }
};