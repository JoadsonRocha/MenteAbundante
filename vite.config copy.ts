import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // URL do seu projeto
  const SUPABASE_URL = "https://qyjlkxjnpohqxvaiqcmx.supabase.co";
  
  // Chave pública fornecida
  const SUPABASE_KEY = env.SUPABASE_KEY || "sb_publishable_9i0XVchnkLqgtps3kB0w8w_66RldWiQ"; 

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(SUPABASE_KEY),
    },
  };
});