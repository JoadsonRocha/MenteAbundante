import React from 'react';
import { Target, Brain, Trophy, ChevronRight, MessageSquareText } from 'lucide-react';
import { QUOTES } from '../constants';

interface DashboardProps {
  onChangeTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeTab }) => {
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 md:p-12 rounded-3xl overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F87A14] rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Mente Abundante <br/> <span className="text-[#F87A14]">& Vitoriosa</span>
          </h1>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            A verdadeira vitória começa antes da ação. Reprograme seus pensamentos e conquiste resultados extraordinários.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onChangeTab('reprogram')}
              className="bg-[#F87A14] text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              Destravar Mente <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => onChangeTab('plan')}
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Plano de 7 Dias
            </button>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="text-4xl text-amber-300 mb-4 font-serif">"</div>
        <p className="text-xl md:text-2xl font-medium text-slate-800 italic">
          {randomQuote}
        </p>
        <div className="mt-4 w-12 h-1 bg-[#F87A14] mx-auto rounded-full"></div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => onChangeTab('reprogram')}
          className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Reprogramação</h3>
          <p className="text-slate-600 text-sm">Transforme crenças limitantes em pensamentos de poder.</p>
        </div>

        <div 
          onClick={() => onChangeTab('visualization')}
          className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Visualização</h3>
          <p className="text-slate-600 text-sm">Exercício guiado de 2 minutos para ancorar o sucesso.</p>
        </div>

        <div 
          onClick={() => onChangeTab('checklist')}
          className="bg-amber-50 p-6 rounded-2xl border border-amber-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Disciplina Diária</h3>
          <p className="text-slate-600 text-sm">Checklist de hábitos para construir consistência.</p>
        </div>

        <div 
          onClick={() => onChangeTab('coach')}
          className="bg-blue-50 p-6 rounded-2xl border border-blue-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageSquareText size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">AI Coach</h3>
          <p className="text-slate-600 text-sm">Mentoria personalizada para tirar dúvidas e manter o foco.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;