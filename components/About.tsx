import React from 'react';
import { BookOpen, Star, BrainCircuit, ArrowRight, Rocket, MessageSquareText, Wind, Heart, Brain, Calendar, Target, CheckSquare } from 'lucide-react';
import { Tab } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutProps {
  navigateTo: (tab: Tab) => void;
}

const About: React.FC<AboutProps> = ({ navigateTo }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="text-center mb-6 md:mb-10 px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#F87A14] mb-3 md:mb-4">{t('about.title')}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mx-2 md:mx-0">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="text-amber-400 shrink-0" size={24} />
            {t('about.inspiration_title')}
          </h3>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            {t('about.inspiration_desc')}
          </p>
        </div>
        
        <div className="p-5 md:p-8 space-y-6 md:space-y-8">
          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
              <BrainCircuit className="text-emerald-500 shrink-0" size={24} />
              {t('about.mindset_title')}
            </h4>
            <p className="text-slate-600 leading-relaxed mb-4 text-sm md:text-base text-justify md:text-left">
              {t('about.mindset_desc')}
            </p>
            <blockquote className="border-l-4 border-amber-400 pl-4 italic text-slate-700 my-4 md:my-6 bg-amber-50 p-4 rounded-r-lg text-sm md:text-base">
              {t('about.quote')}
            </blockquote>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{t('about.fixed_title')}</h5>
              <p className="text-xs md:text-sm text-slate-500">{t('about.fixed_desc')}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{t('about.growth_title')}</h5>
              <p className="text-xs md:text-sm text-slate-500">{t('about.growth_desc')}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-1 text-sm md:text-base">
                 {t('about.abundant_title')} <Star size={14} fill="currentColor" />
              </h5>
              <p className="text-xs md:text-sm text-amber-900">{t('about.abundant_desc')}</p>
            </div>
          </section>

          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4">{t('about.purpose_title')}</h4>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {t('about.purpose_desc')}
            </p>
          </section>

          <section className="pt-6 border-t border-slate-100">
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">{t('about.tools_title')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
              
              {/* Novas Funcionalidades (Destaque) */}
              <button 
                onClick={() => navigateTo('smart_planner')}
                className="group p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                      <Rocket size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-rose-700 text-sm md:text-base">{t('menu.planner')}</span>
                      <span className="text-xs text-slate-500">Metas em ação</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-rose-500" />
              </button>

              <button 
                onClick={() => navigateTo('coach')}
                className="group p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                      <MessageSquareText size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-blue-700 text-sm md:text-base">{t('menu.coach')}</span>
                      <span className="text-xs text-slate-500">Mentoria 24/7</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500" />
              </button>

              <button 
                onClick={() => navigateTo('anxiety')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                      <Wind size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-slate-700 text-sm md:text-base">{t('menu.anxiety')}</span>
                      <span className="text-xs text-slate-500">Equilíbrio imediato</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-500" />
              </button>

              {/* Funcionalidades Clássicas */}
              <button 
                onClick={() => navigateTo('gratitude')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center shrink-0">
                      <Heart size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-pink-700 text-sm md:text-base">{t('menu.gratitude')}</span>
                      <span className="text-xs text-slate-500">Atraia abundância</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-pink-500" />
              </button>

              <button 
                onClick={() => navigateTo('reprogram')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <Brain size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-emerald-700 text-sm md:text-base">{t('menu.reprogram')}</span>
                      <span className="text-xs text-slate-500">Transforme crenças</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
              </button>

              <button 
                onClick={() => navigateTo('plan')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                      <Calendar size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-purple-700 text-sm md:text-base">{t('menu.plan7')}</span>
                      <span className="text-xs text-slate-500">Roteiro prático</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-purple-500" />
              </button>

              <button 
                onClick={() => navigateTo('visualization')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                      <Target size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-indigo-700 text-sm md:text-base">{t('menu.visualization')}</span>
                      <span className="text-xs text-slate-500">Ensaio mental</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
              </button>

               <button 
                onClick={() => navigateTo('checklist')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                      <CheckSquare size={20} />
                   </div>
                   <div>
                      <span className="block font-bold text-slate-800 group-hover:text-amber-700 text-sm md:text-base">{t('menu.checklist')}</span>
                      <span className="text-xs text-slate-500">Hábitos de sucesso</span>
                   </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500" />
              </button>
            </div>
          </section>
        </div>
      </div>
      
      <div className="text-center text-slate-400 text-xs md:text-sm pb-8">
        <p>{t('about.footer')}</p>
      </div>
    </div>
  );
};

export default About;