import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Rocket, CheckCircle2, Loader2, Volume2, Wind, Sparkles, Lock } from 'lucide-react';
import { generateGuidedAudio, generateMeditationScript } from '../services/geminiService';

interface AnxietyControlProps {
  onClose: () => void;
  onNavigateToPlanner: () => void;
}

// Passo de início imediato (enquanto a IA gera o resto)
const QUICK_START_STEP = {
  label: "Conexão Imediata",
  text: "Respire fundo agora. Segure o ar... e solte. Estou aqui. Feche os olhos e apenas ouça minha voz enquanto nos conectamos.",
  pauseSeconds: 3
};

// Fallback robusto caso a API falhe totalmente
const FALLBACK_STEPS = [
  {
    label: "Aterramento",
    text: "Sinta seus pés no chão. Sinta o peso do seu corpo na cadeira. Você está seguro. Nada pode te atingir agora. Foque apenas na sensação de apoio e estabilidade.",
    pauseSeconds: 15
  },
  {
    label: "Visualização",
    text: "Imagine uma luz azul suave descendo sobre sua cabeça, relaxando sua testa, seus olhos e seu maxilar. Essa luz dissolve toda a tensão, descendo pelos ombros até as mãos.",
    pauseSeconds: 20
  },
  {
    label: "Afirmação",
    text: "Repita mentalmente: Eu estou no controle. Minha paz é inegociável. Eu resolvo uma coisa de cada vez.",
    pauseSeconds: 10
  },
  {
    label: "Retorno",
    text: "Respire fundo mais uma vez. Quando estiver pronto, abra os olhos, sentindo-se mais leve e capaz.",
    pauseSeconds: 5
  }
];

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onClose, onNavigateToPlanner }) => {
  // Estados de Sessão
  // Começamos JÁ com o passo rápido na lista para tocar instantaneamente
  const [sessionSteps, setSessionSteps] = useState<any[]>([QUICK_START_STEP]);
  const [sessionTitle, setSessionTitle] = useState("Iniciando...");
  const [isGeneratingRest, setIsGeneratingRest] = useState(true); // Controla o carregamento dos passos seguintes
  
  // Estados de Playback
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Audio Queue
  const [audioBuffers, setAudioBuffers] = useState<{[key: number]: AudioBuffer}>({});
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);

  // Estados de Pausa
  const [isInPause, setIsInPause] = useState(false);
  const [pauseTimeLeft, setPauseTimeLeft] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMounted = useRef(true);
  const stepsRef = useRef<any[]>([QUICK_START_STEP]);
  const wakeLockRef = useRef<any>(null);

  // --- WAKE LOCK (Manter tela ligada) ---
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Tela mantida ativa (WakeLock)');
        }
      } catch (err) {
        console.log('WakeLock não suportado ou negado', err);
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // --- INICIALIZAÇÃO HÍBRIDA ---
  useEffect(() => {
    isMounted.current = true;
    
    // 1. Inicia áudio do passo 0 (Quick Start) IMEDIATAMENTE
    initAudioContext();
    preloadAudio(0); // Baixa e toca o passo 0 assim que possível

    // 2. Dispara geração da IA em paralelo para os próximos passos
    loadFullScript();

    return () => {
      isMounted.current = false;
      stopAudio();
    };
  }, []);

  // Monitora buffer inicial para AUTO-PLAY IMEDIATO
  useEffect(() => {
    if (currentStepIndex === 0 && !isPlaying && !isFinished && !isInPause) {
       if (audioBuffers[0]) {
         playStep(0);
       }
    }
  }, [audioBuffers, currentStepIndex, isPlaying, isFinished, isInPause]);

  // Pre-load inteligente (buffer ahead)
  useEffect(() => {
    // Tenta baixar o próximo áudio assim que disponível
    if (sessionSteps.length > 1) {
      const nextIdx = currentStepIndex + 1;
      if (nextIdx < sessionSteps.length && !audioBuffers[nextIdx]) {
        preloadAudio(nextIdx);
      }
    }
  }, [currentStepIndex, sessionSteps, audioBuffers]);

  // Timer de Pausa
  useEffect(() => {
    let interval: any;
    if (isInPause && pauseTimeLeft > 0) {
      interval = setInterval(() => {
        setPauseTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isInPause && pauseTimeLeft === 0) {
      setIsInPause(false);
      advanceStep();
    }
    return () => clearInterval(interval);
  }, [isInPause, pauseTimeLeft]);

  const loadFullScript = async () => {
    setIsGeneratingRest(true);
    
    // Gera o roteiro completo da IA
    const script = await generateMeditationScript();
    
    if (isMounted.current) {
      if (script && script.steps.length > 0) {
        setSessionTitle(script.title);
        // Mantém o passo 0 (Quick Start) e adiciona os novos
        const newSteps = [QUICK_START_STEP, ...script.steps];
        setSessionSteps(newSteps);
        stepsRef.current = newSteps;
      } else {
        // Fallback se IA falhar
        setSessionTitle("Sessão de Emergência");
        const newSteps = [QUICK_START_STEP, ...FALLBACK_STEPS];
        setSessionSteps(newSteps);
        stepsRef.current = newSteps;
      }
      setIsGeneratingRest(false);
      // O preload do passo 1 (agora o primeiro da IA) será acionado pelo useEffect
    }
  };

  const advanceStep = () => {
    const nextIndex = currentStepIndex + 1;
    
    // Se chegou ao fim ou se o próximo passo ainda não existe (IA demorando muito)
    if (nextIndex >= stepsRef.current.length) {
      if (isGeneratingRest) {
        // Se ainda está gerando, mostra loading e espera (não finaliza)
        setLoadingAudioIndex(nextIndex); // UI de loading
        return; 
      }
      setIsFinished(true);
      setIsPlaying(false);
    } else {
      setCurrentStepIndex(nextIndex);
      playStep(nextIndex);
    }
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const addWavHeader = (pcmData: Uint8Array, sampleRate: number, numChannels: number): ArrayBuffer => {
    const headerLength = 44;
    const buffer = new ArrayBuffer(headerLength + pcmData.length);
    const view = new DataView(buffer);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);
    new Uint8Array(buffer, 44).set(pcmData);
    return buffer;
  };

  const preloadAudio = async (index: number) => {
    if (index >= stepsRef.current.length) return;
    if (audioBuffers[index]) return; // Já tem
    
    try {
      const stepText = stepsRef.current[index].text;
      const base64 = await generateGuidedAudio(stepText);
      
      if (base64 && isMounted.current) {
         const binaryString = atob(base64);
         const len = binaryString.length;
         const bytes = new Uint8Array(len);
         for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
         
         const wavBuffer = addWavHeader(bytes, 24000, 1);
         
         if (!audioContextRef.current) initAudioContext();
         if (audioContextRef.current) {
            const decoded = await audioContextRef.current.decodeAudioData(wavBuffer);
            setAudioBuffers(prev => ({ ...prev, [index]: decoded }));
            
            // Se estava travado esperando este áudio, toca agora
            if (index === currentStepIndex && isPlaying) {
               playStep(index);
            }
         }
      }
    } catch (e) {
      console.error("Erro preload audio", index, e);
    }
  };

  const playStep = async (index: number) => {
    stopAudio();
    initAudioContext();
    
    const buffer = audioBuffers[index];
    
    if (!buffer) {
       setLoadingAudioIndex(index);
       await preloadAudio(index);
       // O preloadAudio vai chamar playStep novamente se for o index atual
       return; 
    }

    setLoadingAudioIndex(null);
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (isMounted.current) {
        const pauseSecs = stepsRef.current[index]?.pauseSeconds || 0;
        if (pauseSecs > 0) {
           setIsInPause(true);
           setPauseTimeLeft(pauseSecs);
        } else {
           advanceStep();
        }
      }
    };

    sourceRef.current = source;
    source.start(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioContextRef.current) audioContextRef.current.suspend();
      setIsPlaying(false);
    } else {
      if (audioContextRef.current) audioContextRef.current.resume();
      setIsPlaying(true);
    }
  };

  const handleCloseSafe = () => {
    if (!isFinished && isPlaying) {
      if (confirm("Deseja interromper a sessão de alívio?")) {
        stopAudio();
        onClose();
      }
    } else {
      stopAudio();
      onClose();
    }
  };

  const restart = () => {
    setSessionSteps([QUICK_START_STEP]); // Reset para rápido
    setAudioBuffers({});
    setCurrentStepIndex(0);
    setIsFinished(false);
    setIsInPause(false);
    setIsGeneratingRest(true);
    
    // Reinicia lógica híbrida
    preloadAudio(0);
    loadFullScript();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl animate-fade-in select-none">
      
      {/* Botão Fechar Protegido */}
      <button 
        onClick={handleCloseSafe}
        className="absolute top-6 right-6 text-slate-400 hover:text-white p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-50"
      >
        <X size={28} />
      </button>

      <div className="w-full max-w-md p-8 flex flex-col items-center justify-center relative z-10">
        
        {/* Visual Central */}
        {!isFinished && (
          <div className="relative mb-12 flex items-center justify-center h-64 w-64">
             {/* Círculo Guia Animado */}
             <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-3xl transition-all duration-[4000ms] ease-in-out ${isPlaying && !isInPause ? 'scale-150 opacity-60' : 'scale-100 opacity-30'}`}></div>
             
             <div className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full shadow-[0_0_60px_rgba(56,189,248,0.4)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${isPlaying && !isInPause ? 'scale-125' : 'scale-100'} ${isInPause ? 'opacity-50' : 'opacity-100'}`}>
                {loadingAudioIndex !== null ? (
                  <Loader2 className="animate-spin text-white" size={32} />
                ) : (
                  <Wind className="text-white opacity-80" size={40} />
                )}
             </div>
             
             {/* Texto de Status */}
             <div className="absolute -bottom-20 text-center w-full min-h-[60px]">
                {loadingAudioIndex !== null ? (
                   <p className="text-blue-200 font-medium animate-pulse">Carregando voz...</p>
                ) : isInPause ? (
                   <div className="flex flex-col items-center animate-in fade-in">
                      <p className="text-blue-100 font-bold text-lg mb-1">{pauseTimeLeft}s</p>
                      <p className="text-blue-300 text-xs uppercase tracking-widest">Respire & Absorva</p>
                   </div>
                ) : (
                   <div className="animate-in fade-in">
                      <h3 className="text-white font-bold text-lg mb-1">{isGeneratingRest ? "Conexão Inicial" : sessionTitle}</h3>
                      <p className="text-blue-200 text-sm tracking-wide uppercase px-4 leading-tight">
                         {sessionSteps[currentStepIndex]?.label || "Preparando..."}
                      </p>
                   </div>
                )}
                
                {/* Indicador de IA em background */}
                {isGeneratingRest && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-blue-400/60">
                    <Sparkles size={10} />
                    <span>Criando sessão personalizada...</span>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Conteúdo Pós-Sessão */}
        {isFinished && (
          <div className="text-center animate-in zoom-in-95 duration-500 mb-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Você está no controle.</h3>
            <p className="text-slate-300 max-w-xs mx-auto">
              Sua mente está mais calma agora. Leve essa sensação para o próximo desafio.
            </p>
          </div>
        )}

        {/* Controles */}
        <div className="w-full space-y-4">
          
          {!isFinished && audioBuffers[currentStepIndex] && (
            <div className="flex justify-center mb-8">
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-xl animate-in fade-in zoom-in"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          )}

          {isFinished && (
            <div className="space-y-3 w-full animate-in slide-in-from-bottom-4">
              <button
                onClick={onNavigateToPlanner}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
              >
                <Rocket size={20} />
                Agir Agora
              </button>
              
              <button
                onClick={restart}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={18} />
                Repetir Sessão
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-500 hover:text-white text-sm transition-colors"
              >
                Voltar
              </button>
            </div>
          )}
          
          {/* Indicador de Progresso (Visualização Discreta) */}
          {!isFinished && (
            <div className="flex justify-center gap-1.5 mt-4 opacity-50">
              {sessionSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${idx === currentStepIndex ? 'w-4 bg-white' : 'w-1 bg-slate-600'}`} 
                />
              ))}
              {isGeneratingRest && <div className="w-1 h-1 rounded-full bg-slate-700 animate-pulse ml-1" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyControl;