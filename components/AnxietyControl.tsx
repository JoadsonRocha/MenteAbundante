import React from 'react';
import { X, Wind, Clock, Sparkles } from 'lucide-react';

interface AnxietyControlProps {
  onClose: () => void;
  onNavigateToPlanner: () => void;
}

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-fade-in">
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-xl">
             <Wind size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">SOS Ansiedade</h3>
            <p className="text-xs text-slate-400">Retome o equilíbrio agora</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={24} className="text-slate-400" />
        </button>
      </div>

      {/* Content Em Breve */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
        
        <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-8 shadow-inner relative">
            <div className="absolute inset-0 rounded-full border border-white/50"></div>
            <Clock size={48} className="text-slate-400" />
            <div className="absolute top-0 right-0 bg-[#F87A14] p-2 rounded-full border-4 border-white">
                <Sparkles size={16} className="text-white" />
            </div>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Novidade a Caminho!</h2>
        
        <p className="text-slate-500 max-w-md leading-relaxed mb-8">
          Estamos preparando uma experiência de áudio imersiva e instantânea para ajudar você a controlar a ansiedade em segundos.
          <br /><br />
          <span className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium border border-amber-100">
            Em breve com áudios de alta qualidade
          </span>
        </p>

        <button 
          onClick={onClose}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Voltar ao Início
        </button>

      </div>
    </div>
  );
};

export default AnxietyControl;