import React, { useMemo } from 'react';
import { Brain, Trophy, MessageSquareText, Calendar, Heart, Rocket, Wind, Sparkles, ChevronRight } from 'lucide-react';
import { QUOTES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

interface DashboardProps {
  onChangeTab: (tab: any) => void;
  onOpenAnxiety: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeTab, onOpenAnxiety }) => {
  const { t } = useLanguage();
  
  const randomQuote = useMemo(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);

  const features = [
    { id: 'coach', title: t('menu.coach'), desc: t('dash.card_coach_desc'), icon: MessageSquareText, color: 'blue' },
    { id: 'reprogram', title: t('menu.reprogram'), desc: t('dash.card_reprogram_desc'), icon: Brain, color: 'emerald' },
    { id: 'smart_planner', title: t('menu.planner'), desc: t('dash.card_planner_desc'), icon: Rocket, color: 'rose' },
    { id: 'anxiety', title: t('menu.anxiety'), desc: t('dash.card_anxiety_desc'), icon: Wind, color: 'slate', tag: t('dash.new_tag') },
    { id: 'plan', title: t('menu.plan7'), desc: t('dash.card_plan7_desc'), icon: Calendar, color: 'purple' },
    { id: 'checklist', title: t('menu.checklist'), desc: t('dash.card_checklist_desc'), icon: Trophy, color: 'amber' },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50/50 text-blue-600 border-blue-100';
      case 'emerald': return 'bg-emerald-50/50 text-emerald-600 border-emerald-100';
      case 'rose': return 'bg-rose-50/50 text-rose-600 border-rose-100';
      case 'slate': return 'bg-slate-100/50 text-slate-600 border-slate-200';
      case 'purple': return 'bg-purple-50/50 text-purple-600 border-purple-100';
      case 'amber': return 'bg-amber-50/50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Hero Section Nativa */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-300">
        {/* Mesh Gradient Effect */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#F87A14] rounded-full blur-[80px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-600 rounded-full blur-[80px]"></div>
        </div>
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-6">
            <Logo size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Rise Mindr Elite</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4">
            {t('dash.hero_title')} <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              {t('dash.hero_title_span')}
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg max-w-sm leading-relaxed font-medium">
            {t('dash.hero_desc')}
          </p>
        </div>
      </div>

      {/* Grid de Ferramentas - Visual de Apps Natividade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((item) => (
          <button 
            key={item.id}
            onClick={() => item.id === 'anxiety' ? onOpenAnxiety() : onChangeTab(item.id)}
            className="group relative flex items-center gap-4 bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm active:scale-95 transition-all duration-200 text-left overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${getColorClasses(item.color)}`}>
              <item.icon size={28} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-slate-800 text-base md:text-lg truncate">{item.title}</h3>
                {item.tag && (
                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                    {item.tag}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs line-clamp-2 leading-tight font-medium">
                {item.desc}
              </p>
            </div>
            
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      {/* Quote Card Nativo */}
      <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#F87A14]"></div>
        <div className="text-4xl text-slate-100 mb-2 font-serif absolute top-4 left-6 opacity-50">"</div>
        <p className="text-lg font-bold text-slate-700 italic leading-relaxed relative z-10 px-4">
          {randomQuote}
        </p>
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-8 h-1.5 bg-[#F87A14] rounded-full"></div>
          <div className="w-2 h-1.5 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;