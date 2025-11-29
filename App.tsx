import React, { useState, useEffect } from 'react';
import { Menu, Loader2, LogOut, WifiOff, ArrowLeft } from 'lucide-react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';

// Componente interno para gerenciar o estado da aplicação pós-login
const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Estado para o PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Estado para o Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Estado para a Declaração de Desejo
  const [desireStatement, setDesireStatement] = useState<string | null>(null);
  const [showDesireModal, setShowDesireModal] = useState(false);

  // Efeito para Resetar Tab ao Logar e Forçar Sync
  useEffect(() => {
    if (user) {
      // 1. Sempre redirecionar para o Dashboard ao logar/recarregar logado
      setActiveTab('dashboard');
      
      // 2. Forçar sincronização imediata
      syncLocalDataToSupabase();
      
      // 3. Carregar dados cruciais em background para cache
      db.getTasks();
      db.getPlan();
    }
  }, [user]);

  useEffect(() => {
    // Listeners de rede
    const handleOnline = () => {
      setIsOffline(false);
      syncLocalDataToSupabase();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Captura evento de instalação PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Inicialização de dados do usuário
    if (user) {
      const initAppData = async () => {
        // Check Profile for Statement
        const profile = await db.getProfile();
        
        // Verifica se já mostrou nesta sessão
        const hasShownDesire = sessionStorage.getItem('mente_desire_shown');
        
        if (profile?.statement && !hasShownDesire) {
          setDesireStatement(profile.statement);
          setShowDesireModal(true);
          sessionStorage.setItem('mente_desire_shown', 'true');
        }

        // Check Onboarding
        const hasSeenOnboarding = localStorage.getItem('mente_onboarding_completed');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }

        // Check Notification Logic
        const remindersEnabled = localStorage.getItem('mente_reminders') === 'true';
        if (remindersEnabled && Notification.permission === 'granted') {
          const logs = await db.getActivityLogs();
          const today = new Date().toISOString().split('T')[0];
          const hasActivityToday = logs.some(l => l.date === today && l.count > 0);

          if (!hasActivityToday) {
            new Notification("Mente Abundante", {
              body: "Você ainda não completou suas tarefas de hoje. Mantenha o foco!",
              icon: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
            });
          }
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
  
  // Função de Instalação passada para Sidebar e Banner
  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
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
        return <Dashboard onChangeTab={setActiveTab} />;
      case 'stats':
        return <ProgressStats />;
      case 'reprogram':
        return <BeliefReprogrammer />;
      case 'plan':
        return <SevenDayPlan />;
      case 'checklist':
        return <DailyChecklist />;
      case 'visualization':
        return <VisualizationTool />;
      case 'coach':
        return <AICoach />;
      case 'gratitude':
        return <GratitudeJournal />;
      case 'profile':
        return <UserProfileComponent />;
      case 'feedback':
        return <FeedbackForm />;
      case 'about':
        return <About navigateTo={setActiveTab} />;
      default:
        return <Dashboard onChangeTab={setActiveTab} />;
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
        installApp={deferredPrompt ? installApp : undefined} // Passa função apenas se disponível
      />

      <main className="flex-1 min-w-0 relative">
        {/* Offline Warning */}
        {isOffline && (
          <div className="bg-slate-800 text-white text-xs py-1 px-4 text-center flex items-center justify-center gap-2">
            <WifiOff size={12} />
            <span>Modo Offline: Alterações salvas no dispositivo e sincronizadas ao reconectar.</span>
          </div>
        )}

        {/* Mobile Header Modernizado */}
        <div className="lg:hidden bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-extrabold text-[#F87A14] text-xl tracking-tight leading-none">Mente Abundante</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">& Vitoriosa</p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="text-slate-600 hover:text-[#F87A14] bg-slate-50 p-2 rounded-lg transition-colors active:scale-95"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)] lg:min-h-screen pb-20">
          {/* Botão Voltar Universal (Mobile e Desktop) */}
          {activeTab !== 'dashboard' && (
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

        {/* PWA Install Banner (Rodapé) - Opcional se já tem no menu, mas bom manter */}
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