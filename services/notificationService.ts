import { supabase } from './database';

// Tipagem global para o OneSignal evitar erros de TypeScript
declare global {
  interface Window {
    OneSignal: any;
  }
}

// Flag para rastrear inicialização localmente
let isInitialized = false;

/**
 * Inicializa o OneSignal e configura o ouvinte de subscrição.
 * @param userId O ID do usuário autenticado no Supabase (opcional, para vincular ao OneSignal)
 */
export const initOneSignal = async (userId?: string) => {
  if (typeof window === 'undefined') return;

  window.OneSignal = window.OneSignal || [];
  
  try {
    // Usamos push para garantir que o SDK esteja carregado antes de executar
    window.OneSignal.push(async function() {
      try {
          // Tenta pegar o ID do ambiente, se não houver, usa o ID fixo fornecido
          const appId = process.env.ONESIGNAL_APP_ID || "e57c6fb0-c748-49f0-a513-9248d5d1b39b";

          // Só tenta inicializar se ainda não foi feito e se o SDK não reportar estar inicializado
          if (!isInitialized && !window.OneSignal.initialized) {
            try {
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
              isInitialized = true;
            } catch (initErr: any) {
              // Se o erro for "already initialized", ignoramos e marcamos como true
              const errMsg = initErr?.message || initErr?.toString() || '';
              if (errMsg.includes('already initialized')) {
                 console.log("OneSignal já estava inicializado.");
                 isInitialized = true;
              } else {
                 // Outros erros de init devem ser logados mas não devem quebrar o app
                 console.warn("Aviso na inicialização do OneSignal:", initErr);
              }
            }
          }

          // Se tivermos um userId (usuário logado), fazemos o Login no OneSignal
          if (userId) {
            try {
                // Isso vincula o dispositivo atual ao usuário do Supabase no painel do OneSignal
                await window.OneSignal.login(userId);
                
                // Após logar, tentamos sincronizar o Player ID com o Supabase
                await syncOneSignalIdToSupabase();
            } catch (loginErr) {
                console.warn("Erro ao logar no OneSignal:", loginErr);
            }
          }

          // Adiciona um listener para quando a inscrição mudar
          try {
              if (window.OneSignal.User && window.OneSignal.User.PushSubscription && typeof window.OneSignal.User.PushSubscription.addEventListener === 'function') {
                window.OneSignal.User.PushSubscription.addEventListener("change", async (event: any) => {
                    if (event.current.optedIn) {
                        await syncOneSignalIdToSupabase();
                    }
                });
              }
          } catch (listenerErr) {
              console.warn("Erro ao adicionar listener OneSignal:", listenerErr);
          }
      } catch (innerErr: any) {
          // Captura erros internos do SDK (como o erro 'reading tt')
          console.warn("Erro interno na execução do OneSignal:", innerErr);
      }
    });
  } catch (error: any) {
    // Erros gerais de chamada
    const errorMsg = error?.message || error?.toString() || '';
    if (errorMsg.includes('already initialized')) {
       return;
    }
    console.error("Erro geral no OneSignal:", error);
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
        window.OneSignal.push(async () => {
            try {
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
            } catch (syncErr) {
                console.warn("Erro durante sync OneSignal:", syncErr);
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
        await new Promise<void>((resolve) => {
             window.OneSignal.push(() => {
                 try {
                     if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
                        id = window.OneSignal.User.PushSubscription.id;
                     }
                 } catch (e) {}
                 resolve();
             });
        });
        return id;
    } catch (e) {
        return null;
    }
};

export const requestNotificationPermission = async () => {
    // Função helper caso queira pedir permissão manualmente via botão
    if (typeof window !== 'undefined' && window.OneSignal) {
        try {
            await window.OneSignal.Slidedown.promptPush();
        } catch(e) {
            console.warn("Erro ao pedir permissão:", e);
        }
    }
};

export const isPushEnabled = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.OneSignal) return false;
    try {
       // Verificação segura
       // Como o push é assíncrono, não podemos garantir retorno imediato aqui sem Promisify,
       // mas se OneSignal já carregou, o objeto User deve estar disponível.
       if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
           return window.OneSignal.User.PushSubscription.optedIn || false;
       }
       return false;
    } catch(e) {
       return false;
    }
};