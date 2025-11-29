import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Rocket, CheckCircle2, Loader2, Volume2, Wind, Sparkles } from 'lucide-react';
import { generateGuidedAudio, generateMeditationScript } from '../services/geminiService';

interface AnxietyControlProps {
  onClose: () => void;
  onNavigateToPlanner: () => void;
}

// Fallback robusto caso a API falhe (5 min aprox)
const FALLBACK_STEPS = [
  {
    label: "Conexão Inicial",
    text: "Olá. Estou aqui com você. Vamos começar respirando fundo. Inspire pelo nariz... e solte devagar pela boca. Sinta o ar entrando e saindo. Deixe o mundo lá fora por alguns instantes. Este é o seu momento de paz.",
    pauseSeconds: 5
  },
  {
    label: "Escaneamento Corporal",
    text: "Agora, traga sua atenção para o seu corpo. Comece pelos pés. Sinta se há alguma tensão e solte. Suba para as pernas, relaxe os joelhos. Solte o quadril, relaxe o abdômen. Sinta os ombros descendo, longe das orelhas. Destrave o maxilar. Sinta seu corpo ficando pesado e profundamente relaxado na cadeira ou onde estiver deitado. Você está seguro aqui.",
    pauseSeconds: 20
  },
  {
    label: "Lugar Seguro",
    text: "Imagine agora que você está em um lugar onde se sente completamente em paz. Pode ser uma praia deserta, uma floresta tranquila ou um campo aberto. Visualize as cores, sinta a temperatura agradável, ouça os sons suaves deste lugar. Deixe essa paisagem preencher sua mente, afastando qualquer pensamento intrusivo. Você é o observador calmo deste cenário perfeito.",
    pauseSeconds: 25
  },
  {
    label: "Afirmação de Controle",
    text: "Enquanto respira calmamente, repita mentalmente: 'Eu estou no controle. Minha mente é um lugar de paz. Eu sou maior que qualquer ansiedade'. Sinta a força dessas palavras ancorando no seu peito. Você tem a capacidade de gerar calma a qualquer momento.",
    pauseSeconds: 15
  },
  {
    label: "Retorno",
    text: "Lentamente, comece a trazer sua atenção de volta para o ambiente ao seu redor. Mexa suavemente os dedos das mãos e dos pés. Respire fundo uma última vez, cheio de gratidão por este momento. Quando estiver pronto, abra os olhos, sentindo-se renovado e presente.",
    pauseSeconds: 5
  }
];

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onClose, onNavigateToPlanner }) => {
  // Estados de Sessão
  const [sessionSteps, setSessionSteps] = useState<any[]>([]);
  const [sessionTitle, setSessionTitle] = useState("Sintonizando...");
  const [isGeneratingScript, setIsGeneratingScript] = useState(true);
  
  // Estados de Playback
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Audio Queue: Armazena buffers prontos. Indexado pela etapa.
  const [audioBuffers, setAudioBuffers] = useState<{[key: number]: AudioBuffer}>({});
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);

  // Estados de Pausa (Silêncio entre etapas)
  const [isInPause, setIsInPause] = useState(false);
  const [pauseTimeLeft, setPauseTimeLeft] = useState(0);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMounted = useRef(true);
  const stepsRef = useRef<any[]>([]); // Ref para acesso dentro de closures/timers

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    isMounted.current = true;
    startNewSession();

    return () => {
      isMounted.current = false;
      stopAudio();
    };
  }, []);

  // Monitora buffer inicial para AUTO-PLAY IMEDIATO
  useEffect(() => {
    if (currentStepIndex === 0 && !isPlaying && !isFinished && !isInPause) {
       // Se o buffer 0 já existe, toca imediatamente
       if (audioBuffers[0]) {
         playStep(0);
       }
    }
  }, [audioBuffers, currentStepIndex, isPlaying, isFinished, isInPause]);

  // Monitora progresso e faz pre-load do próximo áudio
  useEffect(() => {
    if (sessionSteps.length > 0 && !isGeneratingScript) {
      // Tenta baixar o áudio atual e os próximos 2 (buffer ahead)
      preloadAudio(currentStepIndex);
      preloadAudio(currentStepIndex + 1);
      preloadAudio(currentStepIndex + 2);
    }
  }, [currentStepIndex, sessionSteps, isGeneratingScript]);

  // Timer de Pausa
  useEffect(() => {
    let interval: any;
    if (isInPause && pauseTimeLeft > 0) {
      interval = setInterval(() => {
        setPauseTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isInPause && pauseTimeLeft === 0) {
      // Fim da pausa, vai para o próximo passo
      setIsInPause(false);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < sessionSteps.length) {
         setCurrentStepIndex(nextIndex);
         playStep(nextIndex);
      } else {
         setIsFinished(true);
         setIsPlaying(false);
      }
    }
    return () => clearInterval(interval);
  }, [isInPause, pauseTimeLeft, currentStepIndex, sessionSteps]);

  const startNewSession = async () => {
    setIsGeneratingScript(true);
    setSessionSteps([]);
    setAudioBuffers({});
    setCurrentStepIndex(0);
    setIsFinished(false);
    setIsInPause(false);
    setSessionTitle("Criando sessão...");
    
    // Inicializa contexto de áudio imediatamente no clique (user gesture)
    initAudioContext();
    
    // 1. Gera Roteiro Dinâmico
    const script = await generateMeditationScript();
    
    if (isMounted.current) {
      if (script && script.steps.length > 0) {
        setSessionTitle(script.title);
        setSessionSteps(script.steps);
        stepsRef.current = script.steps;
      } else {
        setSessionTitle("Sessão de Emergência (Offline)");
        setSessionSteps(FALLBACK_STEPS);
        stepsRef.current = FALLBACK_STEPS;
      }
      setIsGeneratingScript(false);
      
      // A lógica de useEffect acima cuidará do playStep(0) assim que o buffer chegar
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    // Sempre tenta resumir, pois pode estar suspenso por falta de interação prévia
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.log("Context resume pending user interaction", e));
    }
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
    // Validações
    if (index >= stepsRef.current.length) return;
    if (audioBuffers[index]) return; // Já carregado
    
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
            
            // Salva no state e isso disparará o useEffect de Auto-Play se for o step 0
            setAudioBuffers(prev => ({ ...prev, [index]: decoded }));
         }
      }
    } catch (e) {
      console.error("Erro preload audio", index, e);
    }
  };

  const playStep = async (index: number) => {
    // Se ainda está gerando script, aguarda (mas não deve acontecer devido à lógica)
    if (isGeneratingScript) return;
    
    // Se acabou
    if (index >= stepsRef.current.length) {
      setIsFinished(true);
      setIsPlaying(false);
      return;
    }

    stopAudio();
    initAudioContext();
    
    // Verifica se tem buffer
    const buffer = audioBuffers[index];
    
    if (!buffer) {
       setLoadingAudioIndex(index);
       await preloadAudio(index);
       return; 
    }

    setLoadingAudioIndex(null);

    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (isMounted.current) {
        // Áudio terminou. Verifica pausa.
        const pauseSecs = stepsRef.current[index].pauseSeconds || 0;
        
        if (pauseSecs > 0) {
           setIsInPause(true);
           setPauseTimeLeft(pauseSecs);
           setIsPlaying(true); // Mantém estado visual de 'ativo' durante pausa
        } else {
           const next = index + 1;
           setCurrentStepIndex(next);
           playStep(next);
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

  const handleClose = () => {
    stopAudio();
    onClose();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl animate-fade-in">
      
      {/* Botão Fechar */}
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="w-full max-w-md p-8 flex flex-col items-center justify-center relative z-10">
        
        {/* Visual Central */}
        {!isFinished && (
          <div className="relative mb-12 flex items-center justify-center h-64 w-64">
             {/* Círculo Guia */}
             <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-3xl transition-all duration-[4000ms] ease-in-out ${isPlaying && !isInPause ? 'scale-150 opacity-60' : 'scale-100 opacity-30'}`}></div>
             
             <div className={`w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full shadow-[0_0_60px_rgba(56,189,248,0.4)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${isPlaying && !isInPause ? 'scale-125' : 'scale-100'} ${isInPause ? 'opacity-50' : 'opacity-100'}`}>
                {/* Mostra Loader se estiver gerando script OU se não tiver buffer do Passo 0 ainda */}
                {(isGeneratingScript || (currentStepIndex === 0 && !audioBuffers[0])) ? (
                  <Loader2 className="animate-spin text-white" size={32} />
                ) : (
                  <Wind className="text-white opacity-80" size={40} />
                )}
             </div>
             
             {/* Texto de Status */}
             <div className="absolute -bottom-16 text-center w-full min-h-[60px]">
                {/* Estado 1: Gerando Script (IA Texto) */}
                {isGeneratingScript ? (
                   <p className="text-blue-200 font-medium animate-pulse flex flex-col items-center gap-1">
                     <Sparkles size={16} /> Preparando sessão (5min)...
                   </p>
                ) : 
                /* Estado 2: Baixando Áudio Inicial */
                (loadingAudioIndex !== null || (currentStepIndex === 0 && !audioBuffers[0])) ? (
                   <p className="text-blue-200 font-medium animate-pulse">Iniciando áudio...</p>
                ) : 
                /* Estado 3: Pausa Silenciosa */
                isInPause ? (
                   <div className="flex flex-col items-center animate-in fade-in">
                      <p className="text-blue-100 font-bold text-lg mb-1">{pauseTimeLeft}s</p>
                      <p className="text-blue-300 text-xs uppercase tracking-widest">Silêncio para Absorver</p>
                   </div>
                ) : 
                /* Estado 4: Tocando */
                (
                   <div className="animate-in fade-in">
                      <h3 className="text-white font-bold text-lg mb-1">{sessionTitle}</h3>
                      <p className="text-blue-200 text-sm tracking-wide uppercase">
                         {sessionSteps[currentStepIndex]?.label || "Carregando..."}
                      </p>
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
            <h3 className="text-2xl font-bold text-white mb-2">Sessão Concluída.</h3>
            <p className="text-slate-300 max-w-xs mx-auto">
              Você dedicou 5 minutos preciosos para sua mente. Leve essa calma para o seu dia.
            </p>
          </div>
        )}

        {/* Controles */}
        <div className="w-full space-y-4">
          
          {/* Botão Play/Pause (Só aparece se já carregou o primeiro buffer e não está gerando script) */}
          {!isFinished && !isGeneratingScript && audioBuffers[0] && (
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
                Transformar Ansiedade em Ação
              </button>
              
              <button
                onClick={startNewSession}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={18} />
                Nova Sessão (5 min)
              </button>
              
              <button
                onClick={handleClose}
                className="w-full py-3 text-slate-500 hover:text-white text-sm transition-colors"
              >
                Voltar à tela inicial
              </button>
            </div>
          )}
          
          {/* Indicador de Progresso (Dots) */}
          {!isFinished && !isGeneratingScript && (
            <div className="flex justify-center gap-2 mt-4">
              {sessionSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStepIndex ? 'w-6 bg-blue-400' : idx < currentStepIndex ? 'w-2 bg-blue-800' : 'w-2 bg-slate-800'}`} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnxietyControl;