import React from 'react';
import { LayoutDashboard, Brain, Calendar, CheckSquare, Eye, MessageSquareText, Menu, X, Info } from 'lucide-react';
import { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, toggleSidebar }) => {
  const menuItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { id: 'reprogram', label: 'Reprogramar', icon: <Brain size={20} /> },
    { id: 'plan', label: 'Plano 7 Dias', icon: <Calendar size={20} /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={20} /> },
    { id: 'visualization', label: 'Visualização', icon: <Eye size={20} /> },
    { id: 'coach', label: 'AI Coach', icon: <MessageSquareText size={20} /> },
    { id: 'about', label: 'Sobre', icon: <Info size={20} /> },
  ];

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
      <div className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 w-64 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
              M
            </div>
            <span>Mente<span className="text-amber-500">App</span></span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            "A mente abundante cria oportunidades."
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;