import React, { useState, useEffect } from 'react';
import { Menu, Loader2, LogOut, WifiOff } from 'lucide-react';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';

// Componente interno para gerenciar o estado da aplicação pós-login
const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Estado para o Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Listeners de rede
    const handleOnline = () => {
      setIsOffline(false);
      // Sincroniza dados quando volta a internet
      syncLocalDataToSupabase();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação de lembrete diário
    if (user) {
      const checkDailyReminder = async () => {
        const remindersEnabled = localStorage.getItem('mente_reminders') === 'true';
        if (!remindersEnabled || Notification.permission !== 'granted') return;

        const logs = await db.getActivityLogs();
        const today = new Date().toISOString().split('T')[0];
        const hasActivityToday = logs.some(l => l.date === today && l.count > 0);

        if (!hasActivityToday) {
          new Notification("Mente Abundante", {
            body: "Você ainda não completou suas tarefas de hoje. Mantenha o foco!",
            icon: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
          });
        }
      };
      checkDailyReminder();

      // Verifica se deve mostrar o Onboarding (se nunca viu)
      const hasSeenOnboarding = localStorage.getItem('mente_onboarding_completed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('mente_onboarding_completed', 'true');
  };

  const handleOpenOnboarding = () => {
    setShowOnboarding(true);
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
        <InstallBanner />
      </>
    );
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    await signOut();
  };

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
      case 'profile':
        return <UserProfileComponent />;
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
          <div>
            <h1 className="font-extrabold text-[#F87A14] text-xl tracking-tight leading-none">Mente Abundante</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">& Vitoriosa</p>
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
          {renderContent()}
        </div>

        {/* PWA Install Banner */}
        <InstallBanner />

        {/* Onboarding Tour Overlay */}
        <OnboardingTour isOpen={showOnboarding} onClose={handleCloseOnboarding} />
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