import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/database';

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

    // 1. Check Sessão Inicial Imediata
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await authClient.auth.getSession();
        if (mounted.current && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
        }
      } catch (error) {
        console.error("Erro ao verificar sessão inicial:", error);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    initSession();

    // 2. Escutar mudanças de estado
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
    const keysToRemove = [
      'mente_tasks',
      'mente_plan',
      'mente_beliefs',
      'mente_chat',
      'mente_profile',
      'mente_activity',
      'mente_last_checklist_date',
      'mente_gratitude',
      'mente_active_tab',
      'mente_goal_plans',
      'mente_support_tickets'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
    
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