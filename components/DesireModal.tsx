import React from 'react';
import { X, CheckCircle2, Quote } from 'lucide-react';

interface DesireModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: string;
}

const DesireModal: React.FC<DesireModalProps> = ({ isOpen, onClose, statement }) => {
  if (!isOpen || !statement) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header Dourado */}
        <div className="bg-gradient-to-r from-amber-500 to-[#F87A14] p-6 text-white text-center relative shrink-0">
           <Quote size={40} className="absolute top-4 left-4 text-white/20 rotate-180" />
           <Quote size={40} className="absolute bottom-4 right-4 text-white/20" />
           <h3 className="text-2xl font-extrabold tracking-tight mb-1 uppercase">Seu Desejo Ardente</h3>
           <p className="text-amber-100 text-sm font-medium">Leia em voz alta com fé e emoção.</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-amber-50">
           <div className="text-lg md:text-xl text-slate-800 font-serif leading-relaxed whitespace-pre-wrap text-center italic">
             "{statement}"
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
           >
             <CheckCircle2 size={24} className="text-emerald-400" />
             Eu Acredito e Recebo
           </button>
        </div>
        
      </div>
    </div>
  );
};

export default DesireModal;