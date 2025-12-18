// ESTE ARQUIVO AGORA É UM MOCK/STUB.
// O OneSignal foi removido da versão Web/PWA conforme solicitado.

export const initOneSignal = async (userId?: string) => {
  // No-op
  console.log("OneSignal disabled for Web.");
};

export const logoutOneSignal = async () => {
  // No-op
};

export const syncOneSignalIdToSupabase = async () => {
  // No-op
};

export const getOneSignalPlayerId = async (): Promise<string | null> => {
  return null;
};

export const requestNotificationPermission = async () => {
  // No-op
  console.log("Notification permission requested but OneSignal is disabled.");
};

export const isPushEnabled = async (): Promise<boolean> => {
  return false;
};