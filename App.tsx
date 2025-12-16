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
import { initOneSignal } from './services/notificationService';

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('mente_active_tab');
      if (savedTab === 'profile') return 'dashboard';
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

  // --- NOVOS ESTADOS PARA GUEST MODE ---
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lista de abas que exigem login para acessar
  // ADICIONADO: 'anxiety' agora é protegida
  const protectedTabs: Tab[] = [
    'coach', 
    'reprogram', 
    'plan', 
    'checklist', 
    'visualization', 
    'gratitude', 
    'smart_planner', 
    'stats', 
    'profile', 
    'feedback', 
    'support',
    'anxiety'
  ];

  // Função intermediária para navegação protegida
  const handleTabChange = (tab: Tab) => {
    // Se não tiver usuário E a aba for protegida
    if (!user && protectedTabs.includes(tab)) {
      setShowLoginModal(true);
      return;
    }
    
    // Navegação normal
    setActiveTab(tab);
    setSidebarOpen(false); // Fecha sidebar no mobile ao navegar
  };

  useEffect(() => {
    localStorage.setItem('mente_active_tab', activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Efeito para Logout: Se o usuário ficar nulo (clicou em sair), volta pra dashboard e abre login
  useEffect(() => {
    if (!loading && !user && protectedTabs.includes(activeTab)) {
       setActiveTab('dashboard');
       setShowLoginModal(true);
    }
  }, [user, loading]);

  // Efeito para inicialização de dados (User Dependent)
  useEffect(() => {
    if (user) {
      syncLocalDataToSupabase();
      initOneSignal(user.id);
      db.getTasks();
      db.getPlan();
      setShowLoginModal(false); // Fecha modal se logar
    } else {
      // Inicializa OneSignal mesmo sem usuário (para notificações genéricas)
      initOneSignal(undefined);
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
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleNavigateToPlanner = () => {
    handleTabChange('smart_planner');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-500" size={40} />
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
        // Ansiedade agora é protegida e renderiza normal no layout (removemos o onClose pois usa o layout padrão)
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
        {/* Offline Warning */}
        {isOffline && (
          <div className="bg-slate-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2 shrink-0 z-50">
            <WifiOff size={12} />
            <span>Modo Offline: Alterações salvas no dispositivo.</span>
          </div>
        )}

        {/* Mobile Header Minimalista */}
        <div className="lg:hidden bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <button onClick={() => handleTabChange('dashboard')} className="flex items-center gap-2">
            <div className="flex flex-col items-start">
              <h1 className="font-extrabold text-[#F87A14] text-lg tracking-tight leading-none">Rise Mindr</h1>
            </div>
          </button>
          
          <div className="flex items-center gap-1">
             {/* Header Actions Placeholder */}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 lg:pb-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        {/* --- BOTTOM NAVIGATION BAR (MOBILE ONLY) --- */}
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

        {/* PWA Install Banner */}
        <InstallBanner installAction={installApp} deferredPrompt={deferredPrompt} />

        {/* Modals */}
        <OnboardingTour isOpen={showOnboarding} onClose={handleCloseOnboarding} />
        
        {desireStatement && (
          <DesireModal 
            isOpen={showDesireModal} 
            onClose={() => setShowDesireModal(false)} 
            statement={desireStatement} 
          />
        )}

        {/* Login Modal Overlay */}
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