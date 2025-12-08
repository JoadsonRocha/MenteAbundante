import { supabase } from './database';

// Tipagem global para o OneSignal evitar erros de TypeScript
declare global {
  interface Window {
    OneSignal: any;
  }
}

/**
 * Inicializa o OneSignal e configura o ouvinte de subscrição.
 * @param userId O ID do usuário autenticado no Supabase (opcional, para vincular ao OneSignal)
 */
export const initOneSignal = async (userId?: string) => {
  if (typeof window === 'undefined') return;

  window.OneSignal = window.OneSignal || [];
  
  try {
    await window.OneSignal.push(async function() {
      // Tenta pegar o ID do ambiente, se não houver, usa o ID fixo fornecido
      const appId = process.env.ONESIGNAL_APP_ID || "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

      await window.OneSignal.init({
        appId: appId, 
        
        // Configurações para PWA e Localhost
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
            enable: true, // Botão de sino flutuante (opcional)
        },
        promptOptions: {
            slidedown: {
                prompts: [
                    {
                        type: "push",
                        autoPrompt: true,
                        text: {
                            actionMessage: "Receba lembretes diários para manter sua mente abundante.",
                            acceptButton: "Ativar",
                            cancelButton: "Agora não"
                        }
                    }
                ]
            }
        }
      });

      // Se tivermos um userId (usuário logado), fazemos o Login no OneSignal
      if (userId) {
        // Isso vincula o dispositivo atual ao usuário do Supabase no painel do OneSignal
        await window.OneSignal.login(userId);
        
        // Após logar, tentamos sincronizar o Player ID com o Supabase
        await syncOneSignalIdToSupabase();
      }

      // Adiciona um listener para quando a inscrição mudar (ex: usuário aceitar notificação depois)
      window.OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
        if (event.current.optedIn) {
            await syncOneSignalIdToSupabase();
        }
      });
    });
  } catch (error: any) {
    // Filtra erros de domínio para evitar poluição no console em ambientes de desenvolvimento ou preview
    // O erro "Can only be used on" ocorre quando a URL atual não bate com a configurada no OneSignal
    const errorMsg = error?.message || error?.toString() || '';
    if (errorMsg.includes('Can only be used on') || errorMsg.includes('origin')) {
        console.warn("ℹ️ OneSignal: Notificações desativadas. Domínio atual não autorizado nas configurações do OneSignal (Normal em localhost/preview).");
        return;
    }
    console.error("Erro ao inicializar OneSignal:", error);
  }
};

/**
 * Pega o Player ID (Subscription ID) atual e envia para a tabela do Supabase
 * usando a função RPC 'sync_onesignal_id'.
 */
export const syncOneSignalIdToSupabase = async () => {
    if (!supabase) return;
    const dbClient = supabase; // Captura a instância não-nula para uso no callback

    try {
        // Aguarda o SDK estar pronto
        await window.OneSignal.push(async () => {
            // Verifica se o User module está disponível antes de acessar (evita erro se init falhar)
            if (!window.OneSignal.User || !window.OneSignal.User.PushSubscription) {
                return; 
            }

            // Pega o ID de inscrição (Player ID)
            const subscriptionId = window.OneSignal.User.PushSubscription.id;
            
            // Só envia se tivermos um ID válido e o usuário tiver permitido notificações
            if (subscriptionId && window.OneSignal.User.PushSubscription.optedIn) {
                console.log("Sincronizando OneSignal ID:", subscriptionId);
                
                // Chama a função RPC que criamos no SQL
                const { error } = await dbClient.rpc('sync_onesignal_id', { 
                    p_player_id: subscriptionId 
                });

                if (error) {
                    // Ignora erros de função não encontrada caso o backend ainda não tenha sido atualizado
                    if (!error.message?.includes('function not found')) {
                       console.error("Erro ao salvar ID no Supabase:", error);
                    }
                } else {
                    console.log("OneSignal ID sincronizado com sucesso.");
                }
            }
        });
    } catch (e) {
        // Silencia erros de sincronização para não atrapalhar a UX
        console.warn("Falha na sincronização do OneSignal (Background):", e);
    }
};

/**
 * Retorna o Player ID atual (se disponível) para exibição ou debug
 */
export const getOneSignalPlayerId = async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !window.OneSignal) return null;
    try {
        let id = null;
        await window.OneSignal.push(() => {
             if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
                id = window.OneSignal.User.PushSubscription.id;
             }
        });
        return id;
    } catch (e) {
        return null;
    }
};

export const requestNotificationPermission = async () => {
    // Função helper caso queira pedir permissão manualmente via botão
    if (typeof window !== 'undefined' && window.OneSignal) {
        await window.OneSignal.Slidedown.promptPush();
    }
};

export const isPushEnabled = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.OneSignal) return false;
    try {
       return window.OneSignal.User?.PushSubscription?.optedIn || false;
    } catch(e) {
       return false;
    }
};