import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Eye, Anchor } from 'lucide-react';

const VisualizationTool: React.FC = () => {
  const DURATION = 120; // 2 minutes
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    { time: 120, text: "Feche os olhos. Respire fundo três vezes.", color: "text-slate-700" },
    { time: 100, text: "Imagine seu objetivo principal já realizado em detalhes.", color: "text-emerald-600" },
    { time: 60, text: "Sinta a emoção da vitória. Onde você está? Quem está com você?", color: "text-emerald-600" },
    { time: 30, text: "Faça sua âncora física (toque o ponto no corpo) e diga: 'Eu nasci para vencer'.", color: "text-amber-600" },
    { time: 0, text: "Abra os olhos. Leve essa energia para o seu dia.", color: "text-slate-700" }
  ];

  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    // Determine current step text
    const currentStepIndex = steps.findIndex(s => timeLeft >= s.time);
    // Logic is a bit reverse because time counts down. 
    // We want the text that corresponds to the time range.
    // Let's keep it simple:
    if (timeLeft > 100) setStep(0);
    else if (timeLeft > 60) setStep(1);
    else if (timeLeft > 30) setStep(2);
    else if (timeLeft > 0) setStep(3);
    else setStep(4);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DURATION);
    setStep(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-900 rounded-3xl relative overflow-hidden text-white p-8 shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 text-center max-w-lg">
        <div className="mb-8">
          <span className="bg-white/10 px-4 py-1 rounded-full text-sm font-medium tracking-wider uppercase text-emerald-300">
            Visualização Criativa
          </span>
        </div>

        <div className="text-7xl font-light font-mono mb-8 tracking-tighter">
          {formatTime(timeLeft)}
        </div>

        <div className="h-32 flex items-center justify-center mb-8">
          <p className={`text-2xl font-medium transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
            {steps[step].text}
          </p>
        </div>

        <div className="flex items-center gap-6 justify-center">
          <button 
            onClick={toggleTimer}
            className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/20"
          >
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={resetTimer}
            className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Info footer */}
      <div className="absolute bottom-6 flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Eye size={14} /> <span>Visualizar</span>
        </div>
        <div className="flex items-center gap-1">
          <Anchor size={14} /> <span>Ancorar</span>
        </div>
      </div>
    </div>
  );
};

export default VisualizationTool;