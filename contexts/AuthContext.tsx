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
        // Isso garante que se o usuário foi banido, deletado ou a senha mudou, o token local será rejeitado.
        const { data: { user: currentUser }, error } = await authClient.auth.getUser();
        
        if (error) throw error;

        if (mounted.current && currentUser) {
          // Se o usuário é válido, recuperamos a sessão completa (tokens) do armazenamento local
          const { data: { session: currentSession } } = await authClient.auth.getSession();
          setSession(currentSession);
          setUser(currentUser);
        }
      } catch (error) {
        // Se houver erro na validação do token (ex: expirado/revogado), limpamos o estado
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
           // Caso onde não há sessão inicial e o initSession também falhou/não achou nada
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
    
    // Limpeza completa de dados locais para garantir segurança ao sair (Data Leakage Prevention)
    // Usamos as chaves exportadas do database.ts para garantir que nada seja esquecido
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    
    // Chaves extras que não estão no STORAGE_KEYS (controle de UI)
    localStorage.removeItem('mente_active_tab');
    
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