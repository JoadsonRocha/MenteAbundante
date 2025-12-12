import React from 'react';
import { BookOpen, Star, BrainCircuit, Mail, Globe, Users } from 'lucide-react';
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
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-3 relative z-10">
            <BookOpen className="text-amber-400 shrink-0" size={24} />
            {t('about.inspiration_title')}
          </h3>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base relative z-10">
            {t('about.inspiration_desc')}
          </p>
        </div>
        
        <div className="p-5 md:p-8 space-y-8 md:space-y-10">
          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BrainCircuit className="text-emerald-500 shrink-0" size={24} />
              {t('about.mindset_title')}
            </h4>
            <p className="text-slate-600 leading-relaxed mb-6 text-sm md:text-base text-justify md:text-left">
              {t('about.mindset_desc')}
            </p>
            <blockquote className="relative border-l-4 border-amber-400 pl-6 py-2 italic text-slate-700 bg-amber-50/50 rounded-r-xl text-base md:text-lg font-medium">
              {t('about.quote')}
            </blockquote>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{t('about.fixed_title')}</h5>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{t('about.fixed_desc')}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{t('about.growth_title')}</h5>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{t('about.growth_desc')}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 hover:shadow-md transition-all">
              <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                 {t('about.abundant_title')} <Star size={16} className="text-amber-500" fill="currentColor" />
              </h5>
              <p className="text-xs md:text-sm text-amber-900/80 leading-relaxed">{t('about.abundant_desc')}</p>
            </div>
          </section>

          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Globe className="text-blue-500" size={20} /> {t('about.purpose_title')}
            </h4>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {t('about.purpose_desc')}
            </p>
          </section>

          <section className="pt-8 border-t border-slate-100">
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-slate-600" size={20} /> Fale Conosco
            </h4>
            
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 text-center border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-[#F87A14]">
                    <Mail size={24} />
                </div>
                <h5 className="text-slate-800 font-bold mb-2">Entre em contato</h5>
                <p className="text-slate-500 text-sm mb-4 max-w-sm mx-auto">
                    Tem alguma dúvida, sugestão ou quer compartilhar sua história de transformação conosco?
                </p>
                <a 
                    href="mailto:contato@risemindr.com" 
                    className="inline-flex items-center gap-2 text-[#F87A14] font-bold text-lg hover:text-orange-600 transition-colors border-b-2 border-transparent hover:border-orange-200 pb-0.5"
                >
                    contato@risemindr.com
                </a>
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