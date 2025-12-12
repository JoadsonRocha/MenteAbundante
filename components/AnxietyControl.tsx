import React, { useState, useEffect } from 'react';
import { Play, Pause, Zap, Activity, ChevronRight, Music, Wind, Lock } from 'lucide-react';

interface AnxietyControlProps {
  onNavigateToPlanner: () => void;
}

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onNavigateToPlanner }) => {
  // Breathing Logic (4-7-8)
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (breathingActive) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      setBreathPhase('idle');
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  // Logic for phases
  useEffect(() => {
    if (!breathingActive) return;

    // 4s Inhale, 7s Hold, 8s Exhale = 19s cycle
    const cycleTime = timer % 19;
    
    if (cycleTime < 4) setBreathPhase('inhale');
    else if (cycleTime < 11) setBreathPhase('hold');
    else setBreathPhase('exhale');

  }, [timer, breathingActive]);

  const toggleBreathing = () => {
    setBreathingActive(!breathingActive);
  };

  const getPhaseText = () => {
    switch(breathPhase) {
      case 'inhale': return 'Inspire (Nariz)...';
      case 'hold': return 'Segure...';
      case 'exhale': return 'Expire (Boca)...';
      default: return 'Pronto?';
    }
  };

  const getCircleScale = () => {
    switch(breathPhase) {
      case 'inhale': return 'scale-125';
      case 'hold': return 'scale-125';
      case 'exhale': return 'scale-100';
      default: return 'scale-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Header Padronizado */}
      <div className="text-center space-y-3 px-2 mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14] flex items-center justify-center gap-2">
          <Wind className="text-[#F87A14]" size={28} />
          Ansiedade SOS
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          Ferramentas imediatas para retomar o controle e o equilíbrio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Breathing Circle Widget */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-xl md:col-span-2">
           {/* Background Pulse */}
           <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 transition-opacity duration-1000 ${breathPhase === 'hold' ? 'opacity-40' : 'opacity-20'}`}></div>
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6">
                 <h2 className="text-2xl font-bold">Respiração 4-7-8</h2>
                 <p className="text-slate-400 text-sm">Acalme seu sistema nervoso.</p>
              </div>

              {/* The Breathing Orb */}
              <div className={`w-48 h-48 rounded-full border-4 border-white/10 flex items-center justify-center relative transition-all duration-[4000ms] ease-in-out mb-8 ${getCircleScale()} ${breathingActive ? 'bg-white/5' : 'bg-transparent'}`}>
                  {/* Inner text */}
                  <span className="text-xl font-bold tracking-widest uppercase text-white/90 transition-none">
                     {getPhaseText()}
                  </span>
              </div>

              <button
                onClick={toggleBreathing}
                className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                   breathingActive 
                   ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                   : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400'
                }`}
              >
                 {breathingActive ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Iniciar</>}
              </button>
           </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
           <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4 h-full">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shrink-0">
                 <Zap size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-lg">Técnica A.C.A.L.M.E.S.E.</h3>
                 <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                   Aceite a ansiedade. Contemple as coisas em volta. Aja com ela. Libere o ar dos pulmões. Mantenha os passos anteriores. Examine seus pensamentos. Sorria, você conseguiu.
                 </p>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           <button 
             onClick={onNavigateToPlanner}
             className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all h-full"
           >
              <div className="flex items-center gap-4">
                 <div className="bg-slate-100 p-3 rounded-xl text-slate-600 group-hover:bg-slate-200 transition-colors">
                    <Activity size={24} />
                 </div>
                 <div className="text-left">
                    <h3 className="font-bold text-slate-800">Canalizar Energia</h3>
                    <p className="text-slate-500 text-xs">Transforme essa energia em ação no Planejador.</p>
                 </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-slate-500" />
           </button>
        </div>
      </div>

      {/* Audio Player (EM BREVE) */}
      <div className="relative mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Music size={20} className="text-[#F87A14]" /> Áudios Binaurais
        </h3>
        
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 opacity-70 blur-[1px] select-none pointer-events-none">
           <div className="flex items-center gap-4 mb-4">
             <div className="bg-white p-3 rounded-full shadow-sm">
                <Play size={20} className="text-slate-300" />
             </div>
             <div className="flex-1">
                <div className="h-2 bg-slate-200 rounded-full w-full mb-1"></div>
                <p className="text-[10px] text-slate-400">Frequência 432Hz - Cura e Paz</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="bg-white p-3 rounded-full shadow-sm">
                <Play size={20} className="text-slate-300" />
             </div>
             <div className="flex-1">
                <div className="h-2 bg-slate-200 rounded-full w-full mb-1"></div>
                <p className="text-[10px] text-slate-400">Frequência 528Hz - Reparação de DNA</p>
             </div>
           </div>
        </div>

        {/* Overlay "Em Breve" */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-sm border border-white/10">
                <Lock size={16} className="text-amber-400" />
                <span className="font-bold text-sm">Áudios em Breve</span>
            </div>
        </div>
      </div>

    </div>
  );
};

export default AnxietyControl;