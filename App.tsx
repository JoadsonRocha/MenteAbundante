import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquareText, MoreHorizontal, Brain, Heart, X, Sparkles, Bot } from 'lucide-react';
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
import Logo from './components/Logo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Tab } from './types';
import { db, syncLocalDataToSupabase } from './services/database';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Monitora visibilidade do teclado para esconder a Tab Bar em dispositivos móveis
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isVisible = (window.innerHeight - window.visualViewport.height) > 150;
        setIsKeyboardVisible(isVisible);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const protectedTabs: Tab[] = [
    'coach', 'reprogram', 'plan', 'checklist', 'visualization', 
    'gratitude', 'smart_planner', 'stats', 'profile', 'feedback', 
    'support', 'anxiety'
  ];

  const safeNavigate = (hash: string, replace: boolean = false) => {
    const hashValue = hash.startsWith('#') ? hash : `#${hash}`;
    try {
      if (replace) {
        window.history.replaceState(null, '', hashValue);
      } else {
        window.location.hash = hashValue;
      }
    } catch (e) {
      window.location.hash = hashValue;
    }
  };

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
    if (!window.location.hash) safeNavigate('dashboard', true);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (!user && protectedTabs.includes(tab)) {
      setShowLoginModal(true);
      return;
    }
    if (window.location.hash.replace('#', '') !== tab) safeNavigate(tab, false);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (user) syncLocalDataToSupabase();
  }, [user?.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onChangeTab={handleTabChange} onOpenAnxiety={() => handleTabChange('anxiety')} />;
      case 'stats': return <ProgressStats />;
      case 'reprogram': return <BeliefReprogrammer />;
      case 'plan': return <SevenDayPlan onNavigate={handleTabChange} />;
      case 'smart_planner': return <SmartPlanner />;
      case 'checklist': return <DailyChecklist />;
      case 'visualization': return <VisualizationTool />;
      case 'coach': return <AICoach />;
      case 'support': return <SupportAgent />;
      case 'gratitude': return <GratitudeJournal />;
      case 'profile': return <UserProfileComponent />;
      case 'feedback': return <FeedbackForm />;
      case 'anxiety': return <AnxietyControl onNavigateToPlanner={() => handleTabChange('smart_planner')} />;
      case 'about': return <About navigateTo={handleTabChange} />;
      default: return <Dashboard onChangeTab={handleTabChange} onOpenAnxiety={() => handleTabChange('anxiety')} />;
    }
  };

  const isActive = (tab: Tab) => activeTab === tab;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans select-none overflow-hidden h-full w-full">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-w-0 relative flex flex-col h-screen overflow-hidden">
        
        {/* Header Rise Mindr - Título Restaurado (text-2xl) e Posicionado com Recuo pt-24 */}
        <div className="bg-white/95 backdrop-blur-2xl border-b border-slate-100 px-6 pt-24 pb-6 flex items-center justify-center sticky top-0 z-30 shrink-0 md:hidden shadow-sm pt-safe">
          <h1 className="font-black text-[#F97516] text-2xl tracking-tighter leading-none text-center">Rise Mindr</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10 pb-48 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        {/* Tab Bar flutuante estilo nativo - elevada para bottom-14 */}
        {!isKeyboardVisible && (
          <div className="fixed bottom-14 left-6 right-6 z-40 lg:hidden h-20 animate-in slide-in-from-bottom-10 duration-500 ease-out pb-safe">
             <div className="bg-slate-900/98 backdrop-blur-3xl rounded-[2.8rem] shadow-[0_25px_50px_-12px_rgba(15,23,42,0.6)] border border-white/10 px-6 flex justify-between items-center h-full relative">
                
                {/* Início */}
                <button 
                  onClick={() => handleTabChange('dashboard')}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90 ${isActive('dashboard') ? 'text-[#F97516]' : 'text-slate-500'}`}
                >
                  <LayoutDashboard size={22} strokeWidth={isActive('dashboard') ? 2.5 : 1.8} />
                  <span className={`text-[8px] font-bold uppercase tracking-[0.12em] ${isActive('dashboard') ? 'text-[#F97516]' : 'text-slate-500/80'}`}>{t('menu.dashboard')}</span>
                </button>

                {/* Reprog. */}
                <button 
                  onClick={() => handleTabChange('reprogram')}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90 ${isActive('reprogram') ? 'text-[#F97516]' : 'text-slate-500'}`}
                >
                  <Brain size={22} strokeWidth={isActive('reprogram') ? 2.5 : 1.8} />
                  <span className={`text-[8px] font-bold uppercase tracking-[0.12em] ${isActive('reprogram') ? 'text-[#F97516]' : 'text-slate-500/80'}`}>{t('menu.reprogram').substring(0, 6)}</span>
                </button>

                {/* Central AI Coach - Botão Maior (w-20), ícone original (MessageSquareText) e borda fina */}
                <div className="relative -top-10">
                  <button 
                    onClick={() => handleTabChange('coach')}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-2 border-[#F8FAFC] relative z-10 ${
                      isActive('coach') 
                        ? 'bg-[#F97516] text-white shadow-[#F97516]/40' 
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <MessageSquareText size={32} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Gratidão */}
                <button 
                  onClick={() => handleTabChange('gratitude')}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90 ${isActive('gratitude') ? 'text-[#F97516]' : 'text-slate-500'}`}
                >
                  <Heart size={22} strokeWidth={isActive('gratitude') ? 2.5 : 1.8} />
                  <span className={`text-[8px] font-bold uppercase tracking-[0.12em] ${isActive('gratitude') ? 'text-[#F97516]' : 'text-slate-500/80'}`}>{t('menu.gratitude').substring(0, 8)}</span>
                </button>

                {/* Menu */}
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-90 text-slate-500`}
                >
                  <MoreHorizontal size={22} strokeWidth={1.8} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500/80">{t('menu.more')}</span>
                </button>
             </div>
          </div>
        )}

        {showLoginModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
             <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 z-50 p-2 bg-white/10 rounded-full text-white"><X size={20} /></button>
                <AuthScreen onClose={() => setShowLoginModal(false)} />
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </LanguageProvider>
);

export default App;