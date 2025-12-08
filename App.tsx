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
import SmartPlanner from './components/SmartPlanner';
import SupportAgent from './components/SupportAgent';
import AnxietyControl from './components/AnxietyControl'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';
import { initOneSignal } from './services/notificationService'; // Importação adicionada

// Componente interno para gerenciar o estado da aplicação pós-login
const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  
  // INICIALIZAÇÃO DA ABA: Tenta ler do localStorage, senão usa 'dashboard'
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('mente_active_tab');
      return (savedTab as Tab) || 'dashboard';
    }
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Estado para o PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Estado para o Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Estado para a Declaração de Desejo
  const [desireStatement, setDesireStatement] = useState<string | null>(null);
  const [showDesireModal, setShowDesireModal] = useState(false);

  // Efeito: Salva a aba atual e ROLA PARA O TOPO sempre que ela mudar
  useEffect(() => {
    localStorage.setItem('mente_active_tab', activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Efeito: Inicialização de Dados do Usuário
  useEffect(() => {
    if (user) {
      // 1. Forçar sincronização imediata dos dados locais
      syncLocalDataToSupabase();
      
      // 2. Inicializar OneSignal e vincular ao usuário
      initOneSignal(user.id);

      // 3. Carregar dados cruciais em background para cache
      db.getTasks();
      db.getPlan();
    }
  }, [user?.id]); // Executa apenas quando o ID do usuário muda

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

  const handleLogout = async () => {
    setActiveTab('dashboard'); // Garante visualmente antes de sair
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
      <AuthScreen />
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
        return <SevenDayPlan onNavigate={setActiveTab} />;
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

        {/* Content Area */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-64px)] lg:min-h-screen pb-20">
          {/* Botão Voltar Universal (Mobile e Desktop) - Estilo Minimalista Responsivo */}
          {activeTab !== 'dashboard' && activeTab !== 'anxiety' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mb-6 mt-2 lg:mt-6 p-0 text-slate-400 hover:text-[#F87A14] transition-colors group block"
              title="Voltar ao Início"
            >
              {/* Tamanho 24px no mobile (w-6 h-6) e 32px no desktop (w-8 h-8) */}
              <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          {renderContent()}
        </div>

        {/* PWA Install Banner (Rodapé) */}
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
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;