import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Brain, Calendar, CheckSquare, Eye, MessageSquareText, Menu, X, Info, LogOut, TrendingUp, Settings, Heart, Download, MessageSquarePlus, Rocket, Headset, Wind } from 'lucide-react';
import { Tab } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/database';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onOpenTour?: () => void;
  installApp?: () => void; // Prop para instalar PWA
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, toggleSidebar, onOpenTour, installApp }) => {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mantra, setMantra] = useState<string | null>(null);

  const loadProfileData = async () => {
    try {
      const profile = await db.getProfile();
      if (profile) {
        if (profile.full_name) setProfileName(profile.full_name);
        if (profile.imagem) setAvatarUrl(profile.imagem);
        if (profile.mantra) setMantra(profile.mantra);
      }
    } catch (e) {
      // Silencioso se falhar, usa dados padrões
    }
  };

  useEffect(() => {
    if (user) loadProfileData();

    const handleProfileUpdate = () => {
       loadProfileData();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [user, activeTab]); 

  const menuItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('menu.dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'smart_planner', label: t('menu.planner'), icon: <Rocket size={20} /> },
    { id: 'coach', label: t('menu.coach'), icon: <MessageSquareText size={20} /> },
    { id: 'reprogram', label: t('menu.reprogram'), icon: <Brain size={20} /> },
    { id: 'anxiety', label: t('menu.anxiety'), icon: <Wind size={20} /> },
    { id: 'plan', label: t('menu.plan7'), icon: <Calendar size={20} /> },
    { id: 'checklist', label: t('menu.checklist'), icon: <CheckSquare size={20} /> },
    { id: 'gratitude', label: t('menu.gratitude'), icon: <Heart size={20} /> },
    { id: 'visualization', label: t('menu.visualization'), icon: <Eye size={20} /> },
    { id: 'stats', label: t('menu.stats'), icon: <TrendingUp size={20} /> },
    { id: 'feedback', label: t('menu.feedback'), icon: <MessageSquarePlus size={20} /> },
    { id: 'support', label: t('menu.support'), icon: <Headset size={20} /> },
    { id: 'about', label: t('menu.about'), icon: <Info size={20} /> },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const displayName = profileName || user?.email?.split('@')[0];
  const displayInitial = profileName ? profileName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase();
  
  const hasMantra = !!mantra;
  const displayMantra = mantra || "Sua Frase de Poder";

  const handleProfileClick = () => {
    setActiveTab('profile');
    if (window.innerWidth < 1024) toggleSidebar();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`fixed lg:sticky top-0 h-screen bg-white w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col 
        right-0 lg:right-auto lg:left-0 
        border-l lg:border-l-0 lg:border-r border-slate-200
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-6 flex items-center justify-center shrink-0 relative">
          {/* Logo Nova */}
          <Logo size={56} />
          
          <button onClick={toggleSidebar} className="absolute left-6 lg:hidden text-slate-400 hover:text-[#F87A14] transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-2 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-300 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-[#F87A14] to-orange-500 text-white shadow-lg shadow-orange-200 scale-[1.02]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:pl-5'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Botão de Instalação PWA (Visível apenas se disponível) */}
          {installApp && (
            <button
              onClick={installApp}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-300 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:pl-5 mt-4 border border-dashed border-emerald-200"
            >
              <Download size={20} className="text-emerald-500" />
              <span>{t('menu.install')}</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-3">
          
          {/* Language Switcher */}
          <div className="flex justify-center pb-2">
             <LanguageSwitcher />
          </div>

          <button 
            onClick={handleProfileClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group border ${activeTab === 'profile' ? 'bg-white border-orange-200 ring-2 ring-orange-100 shadow-md' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
          >
             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-slate-600">{displayInitial}</span>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Settings size={14} className="text-white" />
                </div>
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-700 truncate group-hover:text-[#F87A14] transition-colors" title={displayName || ''}>
                  {displayName}
                </p>
                <p className={`text-[10px] truncate ${hasMantra ? 'text-[#F87A14] font-medium italic' : 'text-slate-400'}`} title={displayMantra}>
                  {hasMantra ? `"${displayMantra}"` : displayMantra}
                </p>
             </div>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs font-medium justify-center"
          >
            <LogOut size={14} />
            <span>{t('menu.logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;