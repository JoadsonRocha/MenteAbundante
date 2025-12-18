import React, { useState, useEffect } from 'react';
import { Menu, Loader2, WifiOff, LayoutDashboard, MessageSquareText, CheckSquare, MoreHorizontal, User, Brain, Heart, LogOut, X } from 'lucide-react';
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
import { LanguageProvider } from './contexts/LanguageContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Inicializa o estado a partir do hash atual da URL
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs: Tab[] = [
      'dashboard', 'reprogram', 'plan', 'checklist', 'visualization', 
      'coach', 'gratitude', 'about', 'stats', 'profile', 'feedback', 
      'smart_planner', 'support', 'anxiety'
    ];
    return (validTabs.includes(hash as Tab) ? hash : 'dashboard') as Tab;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [desireStatement, setDesireStatement] = useState<string | null>(null);
  const [showDesireModal, setShowDesireModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const protectedTabs: Tab[] = [
    'coach', 'reprogram', 'plan', 'checklist', 'visualization', 
    'gratitude', 'smart_planner', 'stats', 'profile', 'feedback', 
    'support', 'anxiety'
  ];

  // Helper para atualizações seguras de histórico (evita erros em sandboxes cross-origin)
  const safeNavigate = (hash: string, replace: boolean = false) => {
    const hashValue = hash.startsWith('#') ? hash : `#${hash}`;
    try {
      if (replace) {
        window.history.replaceState(null, '', hashValue);
      } else {
        window.location.hash = hashValue;
      }
    } catch (e) {
      // Fallback se pushState/replaceState falhar por questões de origin
      window.location.hash = hashValue;
    }
  };

  // Efeito principal de Sincronização de Navegação (Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash as Tab);
      } else if (!hash && activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Se não houver hash na URL, coloca o dashboard para iniciar o histórico
    if (!window.location.hash) {
      safeNavigate('dashboard', true);
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (!user && protectedTabs.includes(tab)) {
      setShowLoginModal(true);
      return;
    }
    
    // Alterar o hash é o que garante que o botão "Voltar" funcione
    // Pois window.location.hash = 'xxx' cria uma nova entrada no histórico (push)
    if (window.location.hash.replace('#', '') !== tab) {
      safeNavigate(tab, false);
    }
    
    setSidebarOpen(false);
  };

  // Persistência da aba atual no LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('mente_active_tab', activeTab);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Proteção de rotas autenticadas
  useEffect(() => {
    if (!loading && !user && protectedTabs.includes(activeTab)) {
       safeNavigate('dashboard', true); // Replace para não poluir o histórico com tentativas negadas
       setActiveTab('dashboard');
       setShowLoginModal(true);
    }
  }, [user, loading, activeTab]);

  useEffect(() => {
    if (user) {
      syncLocalDataToSupabase();
      db.getTasks();
      db.getPlan();
      setShowLoginModal(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if(user) syncLocalDataToSupabase();
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
        try {
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
        } catch (e) {}
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
    try {
      localStorage.setItem('mente_onboarding_completed', 'true');
    } catch (e) {}
  };

  const handleOpenOnboarding = () => {
    setShowOnboarding(true);
  };
  
  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
    } catch (e) {}
    setDeferredPrompt(null);
  };

  const handleNavigateToPlanner = () => {
    handleTabChange('smart_planner');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="initial-loader"></div>
      </div>
    );
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onChangeTab={handleTabChange} onOpenAnxiety={() => handleTabChange('anxiety')} />;
      case 'stats':
        return <ProgressStats />;
      case 'reprogram':
        return <BeliefReprogrammer />;
      case 'plan':
        return <SevenDayPlan onNavigate={handleTabChange} />;
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
        return <AnxietyControl onNavigateToPlanner={handleNavigateToPlanner} />;
      case 'about':
        return <About navigateTo={handleTabChange} />;
      default:
        return <Dashboard onChangeTab={handleTabChange} onOpenAnxiety={() => handleTabChange('anxiety')} />;
    }
  };

  const isActive = (tab: Tab) => activeTab === tab;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onOpenTour={handleOpenOnboarding}
        installApp={deferredPrompt ? installApp : undefined} 
      />

      <main className="flex-1 min-w-0 relative flex flex-col h-screen overflow-hidden">
        {isOffline && (
          <div className="bg-slate-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2 shrink-0 z-50">
            <WifiOff size={12} />
            <span>Modo Offline: Alterações salvas no dispositivo.</span>
          </div>
        )}

        <div className="lg:hidden bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <button onClick={() => handleTabChange('dashboard')} className="flex items-center gap-2">
            <h1 className="font-extrabold text-[#F87A14] text-lg tracking-tight leading-none">Rise Mindr</h1>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 lg:pb-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 px-6 py-2 pb-safe flex justify-between items-center h-[80px]">
           <button 
             onClick={() => handleTabChange('dashboard')}
             className={`flex flex-col items-center gap-1 w-12 transition-colors ${isActive('dashboard') ? 'text-[#F87A14]' : 'text-slate-400'}`}
           >
             <LayoutDashboard size={24} strokeWidth={isActive('dashboard') ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Início</span>
           </button>

           <button 
             onClick={() => handleTabChange('reprogram')}
             className={`flex flex-col items-center gap-1 w-12 transition-colors ${isActive('reprogram') ? 'text-[#F87A14]' : 'text-slate-400'}`}
           >
             <Brain size={24} strokeWidth={isActive('reprogram') ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Reprog.</span>
           </button>

           <div className="relative -top-6">
             <button 
               onClick={() => handleTabChange('coach')}
               className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-4 border-[#F8FAFC] ${
                 isActive('coach') 
                   ? 'bg-gradient-to-br from-[#F87A14] to-orange-600 text-white shadow-orange-300' 
                   : 'bg-slate-800 text-white shadow-slate-300'
               }`}
             >
               <MessageSquareText size={28} />
             </button>
           </div>

           <button 
             onClick={() => handleTabChange('gratitude')}
             className={`flex flex-col items-center gap-1 w-12 transition-colors ${isActive('gratitude') ? 'text-[#F87A14]' : 'text-slate-400'}`}
           >
             <Heart size={24} strokeWidth={isActive('gratitude') ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Gratidão</span>
           </button>

           <button 
             onClick={toggleSidebar}
             className={`flex flex-col items-center gap-1 w-12 transition-colors ${sidebarOpen ? 'text-[#F87A14]' : 'text-slate-400'}`}
           >
             <MoreHorizontal size={24} strokeWidth={2} />
             <span className="text-[10px] font-medium">Menu</span>
           </button>
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

        {showLoginModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
             <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setShowLoginModal(false)} 
                  className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                >
                  <X size={20} />
                </button>
                <AuthScreen onClose={() => setShowLoginModal(false)} />
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;