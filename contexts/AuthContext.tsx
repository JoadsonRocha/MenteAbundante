import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, STORAGE_KEYS } from '../services/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  // Função auxiliar para limpar dados locais (Data Leakage Prevention)
  const clearLocalData = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('mente_active_tab');
  };

  useEffect(() => {
    mounted.current = true;

    if (!supabase) {
      if (mounted.current) setLoading(false);
      return;
    }

    const authClient = supabase;

    // 1. Check Sessão Inicial com Segurança Reforçada (getUser vs getSession)
    const initSession = async () => {
      try {
        // SECURITY UPDATE: Usamos getUser() em vez de getSession() para a verificação inicial.
        // getUser() valida o token JWT diretamente com os servidores do Supabase.
        const { data: { user: currentUser }, error } = await authClient.auth.getUser();
        
        if (error) throw error;

        if (mounted.current && currentUser) {
          const { data: { session: currentSession } } = await authClient.auth.getSession();
          setSession(currentSession);
          setUser(currentUser);
        } else if (mounted.current) {
          // Se não houver usuário, garante que não há lixo no storage
          // clearLocalData(); // Opcional: limpar ao iniciar se não tiver user? Melhor não, para manter dados offline de 'visitante' se for o caso.
          // Mas se tinha token e falhou, cairá no catch.
        }
      } catch (error) {
        // SECURITY CRITICAL: Se o token for inválido, revogado ou expirado,
        // devemos limpar IMEDIATAMENTE os dados locais para evitar vazamento de informações
        // de um usuário anterior numa máquina compartilhada.
        console.warn("Sessão inválida detectada. Limpando dados locais de segurança.");
        clearLocalData();
        
        if (mounted.current) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    initSession();

    // 2. Escutar mudanças de estado (Login, Logout, Refresh Token)
    const { data: { subscription } } = authClient.auth.onAuthStateChange((event, newSession) => {
      if (mounted.current) {
        if (event === 'SIGNED_OUT') {
           setSession(null);
           setUser(null);
           setLoading(false);
           // Nota: O signOut() manual já chama clearLocalData, mas o evento pode vir de outras abas.
           // Por segurança, poderíamos limpar aqui também, mas vamos deixar o signOut gerenciar para evitar limpar dados durante refresh.
        } else if (newSession) {
           setSession(newSession);
           setUser(newSession.user);
           setLoading(false);
        } else if (event === 'INITIAL_SESSION' && !newSession) {
           setLoading(false);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    // Limpeza completa de dados locais para garantir segurança ao sair
    clearLocalData();
    
    if (mounted.current) {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};