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
        }
      } catch (error) {
        // Se o token for inválido, revogado ou expirado, limpamos silenciosamente.
        // Aviso de console removido conforme solicitado.
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