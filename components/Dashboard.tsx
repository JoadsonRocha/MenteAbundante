import React from 'react';
import { Target, Brain, Trophy, ChevronRight, MessageSquareText, Calendar, Heart, Rocket } from 'lucide-react';
import { QUOTES } from '../constants';

interface DashboardProps {
  onChangeTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeTab }) => {
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 md:p-12 rounded-3xl overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F87A14] rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight leading-tight">
            Mente Abundante <br/> <span className="text-[#F87A14]">& Vitoriosa</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed max-w-lg md:max-w-none">
            A verdadeira vitória começa antes da ação. Reprograme seus pensamentos e conquiste resultados extraordinários.
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <button 
              onClick={() => onChangeTab('reprogram')}
              className="bg-[#F87A14] text-white px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              Destravar Mente <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => onChangeTab('plan')}
              className="bg-white/10 text-white px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Plano de 7 Dias
            </button>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="text-3xl md:text-4xl text-amber-300 mb-3 md:mb-4 font-serif">"</div>
        <p className="text-lg md:text-2xl font-medium text-slate-800 italic leading-relaxed">
          {randomQuote}
        </p>
        <div className="mt-4 w-10 md:w-12 h-1 bg-[#F87A14] mx-auto rounded-full"></div>
      </div>

      {/* Features Grid - Layout Ajustado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* 1. AI Coach */}
        <div 
          onClick={() => onChangeTab('coach')}
          className="bg-blue-50 p-5 md:p-6 rounded-2xl border border-blue-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <MessageSquareText size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">AI Coach</h3>
          <p className="text-slate-600 text-xs md:text-sm">Mentoria personalizada para tirar dúvidas e manter o foco.</p>
        </div>

        {/* 2. Reprogramação */}
        <div 
          onClick={() => onChangeTab('reprogram')}
          className="bg-emerald-50 p-5 md:p-6 rounded-2xl border border-emerald-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Brain size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Reprogramação</h3>
          <p className="text-slate-600 text-xs md:text-sm">Transforme crenças limitantes em pensamentos de poder.</p>
        </div>

        {/* 3. Planejador IA (NOVO) */}
        <div 
          onClick={() => onChangeTab('smart_planner')}
          className="bg-rose-50 p-5 md:p-6 rounded-2xl border border-rose-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Rocket size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Planejador IA</h3>
          <p className="text-slate-600 text-xs md:text-sm">Defina metas e receba um plano de ação passo a passo.</p>
        </div>

        {/* 4. Plano 7 Dias */}
        <div 
          onClick={() => onChangeTab('plan')}
          className="bg-purple-50 p-5 md:p-6 rounded-2xl border border-purple-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Calendar size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Plano 7 Dias</h3>
          <p className="text-slate-600 text-xs md:text-sm">Roteiro prático para destravar sua mente em uma semana.</p>
        </div>

        {/* 5. Checklist Diário */}
        <div 
          onClick={() => onChangeTab('checklist')}
          className="bg-amber-50 p-5 md:p-6 rounded-2xl border border-amber-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Checklist Diário</h3>
          <p className="text-slate-600 text-xs md:text-sm">Hábitos de sucesso para construir consistência diária.</p>
        </div>

        {/* 6. Visualização */}
        <div 
          onClick={() => onChangeTab('visualization')}
          className="bg-indigo-50 p-5 md:p-6 rounded-2xl border border-indigo-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Target size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Visualização</h3>
          <p className="text-slate-600 text-xs md:text-sm">Exercício guiado de 2 minutos para ancorar o sucesso.</p>
        </div>

        {/* 7. Gratidão */}
        <div 
          onClick={() => onChangeTab('gratitude')}
          className="bg-sky-50 p-5 md:p-6 rounded-2xl border border-sky-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Heart size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Diário de Gratidão</h3>
          <p className="text-slate-600 text-xs md:text-sm">Eleve sua vibração agradecendo pelo que você já tem.</p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;