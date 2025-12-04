import React, { useState, useEffect, useRef } from 'react';
import { Menu, Loader2, LogOut, WifiOff, ArrowLeft } from 'lucide-react';
import OneSignal from 'react-onesignal';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BeliefReprogrammer from './components/BeliefReprogrammer';
import SevenDayPlan from './components/SevenDayPlan';
import DailyChecklist from './components/DailyChecklist';
import VisualizationTool from './components/VisualizationTool';
import AICoach from './components/AICoach';
import About from './components/About';
import AuthScreen from './components/AuthScreen';
import ProgressStats from './components/ProgressStats';
import InstallBanner from './components/InstallBanner';
import UserProfileComponent from './components/UserProfile';
import OnboardingTour from './components/OnboardingTour';
import DesireModal from './components/DesireModal'; 
import GratitudeJournal from './components/GratitudeJournal';
import FeedbackForm from './components/FeedbackForm';
import SmartPlanner from './components/SmartPlanner';
import SupportAgent from './components/SupportAgent';
import AnxietyControl from './components/AnxietyControl'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';

// Fix TypeScript error for window.OneSignal
declare global {
  interface Window {
    OneSignal: any;
  }
}

// Componente interno para gerenciar o estado da aplicação pós-login
const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('mente_active_tab');
      return (savedTab as Tab) || 'dashboard';
    }
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [desireStatement, setDesireStatement] = useState<string | null>(null);
  const [showDesireModal, setShowDesireModal] = useState(false);

  // Ref para garantir que o OneSignal inicialize apenas uma vez
  const oneSignalInitRef = useRef(false);
  // Estado para controlar se o OneSignal foi carregado com sucesso
  const [oneSignalInitialized, setOneSignalInitialized] = useState(false);

  // --- INICIALIZAÇÃO ONESIGNAL ---
  useEffect(() => {
    if (oneSignalInitRef.current) return;
    oneSignalInitRef.current = true;

    const initOneSignal = async () => {
      // Substitua este ID pelo seu App ID do OneSignal configurado para este domínio
      const ONESIGNAL_APP_ID = "f0d535c5-1b47-48be-89df-7bca30bf2b38"; 

      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID, 
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: 'sw.js',
        });
        setOneSignalInitialized(true); 
        console.log("OneSignal Status: Ativo e Pronto");
      } catch (e) {
        // Silencia erro se o App ID for inválido para o domínio atual
        console.warn("OneSignal Info: Notificações desativadas (Verifique App ID/Domínio).");
      }
    };

    initOneSignal();
  }, []);

  // --- LOGIN NO ONESIGNAL (CORREÇÃO DE USUÁRIOS) ---
  useEffect(() => {
    if (user?.id && oneSignalInitialized) {
        // Delay para garantir que o SDK carregou completamente
        const timer = setTimeout(() => {
          try {
             // 1. Identificar o usuário com o ID do Supabase
             OneSignal.login(user.id);
             
             // 2. Adicionar Email como tag para facilitar busca no painel
             if (user.email) {
                OneSignal.User.addTag("email", user.email);
             }

             console.log("OneSignal: Usuário identificado ->", user.id);
          } catch (e) {
             console.warn("OneSignal: Falha ao logar usuário.", e);
          }
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [user?.id, oneSignalInitialized]);

  useEffect(() => {
    localStorage.setItem('mente_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      syncLocalDataToSupabase();
      db.getTasks();
      db.getPlan();
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncLocalDataToSupabase();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (user) {
      const initAppData = async () => {
        const profile = await db.getProfile();
        const hasShownDesire = sessionStorage.getItem('mente_desire_shown');
        
        if (profile?.statement && !hasShownDesire) {
          setDesireStatement(profile.statement);
          setShowDesireModal(true);
          sessionStorage.setItem('mente_desire_shown', 'true');
        }

        const hasSeenOnboarding = localStorage.getItem('mente_onboarding_completed');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      };
      
      initAppData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('mente_onboarding_completed', 'true');
  };

  const handleOpenOnboarding = () => {
    setShowOnboarding(true);
  };
  
  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleLogout = async () => {
    setActiveTab('dashboard');
    try {
      if (oneSignalInitialized) {
         OneSignal.logout();
      }
    } catch(e) {
      // Ignora erro silenciosamente
    }
    await signOut();
  };

  const handleNavigateToPlanner = () => {
    setActiveTab('smart_planner');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <InstallBanner installAction={installApp} deferredPrompt={deferredPrompt} />
      </>
    );
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onChangeTab={setActiveTab} onOpenAnxiety={() => setActiveTab('anxiety')} />;
      case 'stats':
        return <ProgressStats />;
      case 'reprogram':
        return <BeliefReprogrammer />;
      case 'plan':
        return <SevenDayPlan />;
      case 'smart_planner': 
        return <SmartPlanner />;
      case 'checklist':
        return <DailyChecklist />;
      case 'visualization':
        return <VisualizationTool />;
      case 'coach':
        return <AICoach />;
      case 'support':
        return <SupportAgent />;
      case 'gratitude':
        return <GratitudeJournal />;
      case 'profile':
        return <UserProfileComponent />;
      case 'feedback':
        return <FeedbackForm />;
      case 'anxiety':
        return <AnxietyControl onClose={() => setActiveTab('dashboard')} onNavigateToPlanner={handleNavigateToPlanner} />;
      case 'about':
        return <About navigateTo={setActiveTab} />;
      default:
        return <Dashboard onChangeTab={setActiveTab} onOpenAnxiety={() => setActiveTab('anxiety')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onOpenTour={handleOpenOnboarding}
        installApp={deferredPrompt ? installApp : undefined} 
      />

      <main className="flex-1 min-w-0 relative">
        {isOffline && (
          <div className="bg-slate-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2 pt-[calc(0.25rem+env(safe-area-inset-top))] lg:pt-1">
            <WifiOff size={12} />
            <span>Modo Offline: Alterações salvas no dispositivo.</span>
          </div>
        )}

        <div className="lg:hidden bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-extrabold text-[#F87A14] text-xl tracking-tight leading-none">MindRise</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">& Vitoriosa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 p-2 rounded-lg transition-colors active:scale-95"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
            
            <button 
              onClick={toggleSidebar} 
              className="text-slate-600 hover:text-[#F87A14] bg-slate-50 p-2 rounded-lg transition-colors active:scale-95"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)] lg:min-h-screen pb-24 md:pb-20">
          {activeTab !== 'dashboard' && activeTab !== 'anxiety' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 mb-6 mt-2 lg:mt-6 text-slate-400 hover:text-[#F87A14] transition-colors group w-fit"
            >
              <div className="p-2 rounded-full bg-white border border-slate-200 group-hover:border-orange-200 shadow-sm transition-all group-hover:-translate-x-1">
                <ArrowLeft size={16} />
              </div>
              <span className="text-sm font-medium">Voltar ao Início</span>
            </button>
          )}

          {renderContent()}
        </div>

        <InstallBanner installAction={installApp} deferredPrompt={deferredPrompt} />

        <OnboardingTour isOpen={showOnboarding} onClose={handleCloseOnboarding} />
        
        {desireStatement && (
          <DesireModal 
            isOpen={showDesireModal} 
            onClose={() => setShowDesireModal(false)} 
            statement={desireStatement} 
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;