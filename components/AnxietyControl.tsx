import React from 'react';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';

interface AnxietyControlProps {
  onClose: () => void;
  onNavigateToPlanner: () => void;
}

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-fade-in">
      
      {/* Header Personalizado - Responsivo (Padding e Gap reduzidos no mobile) */}
      <div className="p-4 md:p-6 bg-white flex items-center gap-3 md:gap-4 border-b border-slate-50">
        {/* Botão Voltar (Tamanho reduzido no mobile) */}
        <button 
          onClick={onClose} 
          className="p-1 -ml-1 text-slate-400 hover:text-[#F87A14] transition-colors group"
          title="Voltar"
        >
          {/* Responsivo via Tailwind: w-6 h-6 (24px) no mobile, w-8 h-8 (32px) no desktop */}
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Título MindRise & Vitória */}
        <div className="flex flex-col justify-center">
          <h1 className="font-extrabold text-[#F87A14] text-xl md:text-2xl tracking-tight leading-none">MindRise</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-wide">& Vitoriosa</p>
        </div>
      </div>

      {/* Content Em Breve */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 mt-[-40px]">
        
        <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-8 shadow-inner relative">
            <div className="absolute inset-0 rounded-full border border-white/50"></div>
            <Clock size={48} className="text-slate-400" />
            <div className="absolute top-0 right-0 bg-[#F87A14] p-2 rounded-full border-4 border-white">
                <Sparkles size={16} className="text-white" />
            </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-4">Novidade a Caminho!</h2>
        
        <p className="text-slate-500 max-w-md leading-relaxed mb-8 text-sm md:text-base">
          Estamos preparando uma experiência de áudio imersiva e instantânea para ajudar você a controlar a ansiedade em segundos.
          <br /><br />
          <span className="text-xs md:text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium border border-amber-100">
            Em breve com áudios de alta qualidade
          </span>
        </p>

      </div>
    </div>
  );
};

export default AnxietyControl;