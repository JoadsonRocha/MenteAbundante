import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Eye, Anchor, Volume2, VolumeX, Loader2, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { generateGuidedAudio } from '../services/geminiService';

// --- UTILS INDEXEDDB ---
// Simples wrapper para armazenar Blobs/ArrayBuffers persistentemente no navegador
const DB_NAME = 'MenteAbundanteAudioDB';
const STORE_NAME = 'audio_chunks';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveAudioToDB = async (id: number, buffer: ArrayBuffer) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(buffer, id);
    return tx.oncomplete;
  } catch (e) {
    console.warn("IndexedDB save error", e);
  }
};

const getAudioFromDB = async (id: number): Promise<ArrayBuffer | undefined> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
  } catch (e) {
    return undefined;
  }
};
// -----------------------

const VisualizationTool: React.FC = () => {
  const DURATION = 120; // 2 minutes
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalStepsToDownload, setTotalStepsToDownload] = useState(5);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Cache RAM (para playback imediato na sessão atual)
  const audioBufferCache = useRef<{[key: number]: AudioBuffer}>({});
  // Controle para não baixar o mesmo passo duas vezes na mesma sessão
  const preloadingRef = useRef<{[key: number]: boolean}>({});

  const steps = [
    { time: 120, text: "Feche os olhos. Respire fundo três vezes e relaxe os ombros. Deixe o ar sair devagar.", color: "text-slate-700" },
    { time: 100, text: "Agora, imagine seu objetivo principal já realizado. Veja os detalhes, as cores, onde você está.", color: "text-emerald-600" },
    { time: 60, text: "Sinta a emoção da vitória. Quem está com você? Sinta a gratidão preenchendo todo o seu peito.", color: "text-emerald-600" },
    { time: 30, text: "Faça sua âncora física agora. Toque o ponto no corpo e diga mentalmente: 'Eu nasci para vencer'.", color: "text-amber-600" },
    { time: 0, text: "Pode abrir os olhos. Leve essa energia de confiança absoluta para o seu dia.", color: "text-slate-700" }
  ];

  // --- WAV Header Helpers ---
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
    const headerLength = 44;
    const dataLength = pcmData.length;
    const buffer = new ArrayBuffer(headerLength + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    const pcmView = new Uint8Array(buffer, headerLength);
    pcmView.set(pcmData);

    return buffer;
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // --- LOGICA DE PRELOAD OTIMIZADA COM PERSISTENCIA ---
  const downloadAndProcessAudio = async (index: number) => {
    // 1. Verifica se já está na RAM
    if (audioBufferCache.current[index]) {
       setDownloadProgress(prev => Math.min(prev + 1, steps.length));
       return;
    }
    
    // 2. Evita duplicação de requests em voo
    if (preloadingRef.current[index]) return;
    preloadingRef.current[index] = true;

    try {
      // 3. Tenta carregar do IndexedDB (Cache Persistente)
      const cachedArrayBuffer = await getAudioFromDB(index);
      
      if (cachedArrayBuffer) {
        console.log(`📦 Cache hit (DB) for step ${index}`);
        if (!audioContextRef.current) initAudioContext();
        if (audioContextRef.current) {
           try {
             const decoded = await audioContextRef.current.decodeAudioData(cachedArrayBuffer.slice(0));
             audioBufferCache.current[index] = decoded;
             setDownloadProgress(prev => Math.min(prev + 1, steps.length));
           } catch(e) { console.warn("Decode error from DB", e); }
        }
        return; // Sai se achou no DB
      }

      // 4. Se não achou, baixa da API (Gemini)
      console.log(`⬇️ Downloading step ${index} from API...`);
      const textToSpeak = steps[index].text;
      const base64Audio = await generateGuidedAudio(textToSpeak);

      if (base64Audio) {
        // Conversão Base64 -> ArrayBuffer com Header WAV
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const pcmBytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          pcmBytes[i] = binaryString.charCodeAt(i);
        }
        const wavBuffer = addWavHeader(pcmBytes, 24000, 1);
        
        // 5. Salva no IndexedDB para o futuro
        await saveAudioToDB(index, wavBuffer);

        // 6. Decodifica para tocar agora
        if (!audioContextRef.current) initAudioContext();
        if (audioContextRef.current) {
           const bufferToDecode = wavBuffer.slice(0);
           const decoded = await audioContextRef.current.decodeAudioData(bufferToDecode);
           audioBufferCache.current[index] = decoded;
           setDownloadProgress(prev => Math.min(prev + 1, steps.length));
        }
      }
    } catch (e) {
      console.error("Erro no preload:", e);
    } finally {
      preloadingRef.current[index] = false;
    }
  };

  // Efeito: Dispara o preload de TODOS os passos
  useEffect(() => {
    const preloadAll = async () => {
      // Inicia todos "quase" ao mesmo tempo, mas com um micro delay para não travar a UI
      steps.forEach((_, idx) => {
        setTimeout(() => downloadAndProcessAudio(idx), idx * 200);
      });
    };
    initAudioContext(); // Prepara contexto
    preloadAll();
    
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
  };

  const playAudioForStep = async (stepIndex: number) => {
    if (!soundEnabled) return;

    initAudioContext();
    if (!audioContextRef.current) return;
    
    stopAudio();

    // 1. Se já temos na RAM, toca
    if (audioBufferCache.current[stepIndex]) {
      playBuffer(audioBufferCache.current[stepIndex]);
      return;
    }

    setLoadingStep(stepIndex);

    // 2. Se não tem (caso raro onde user clicou play antes do preload terminar), tenta forçar o load
    try {
      // Tenta buscar novamente (DB ou API)
      await downloadAndProcessAudio(stepIndex);
      
      // Verifica se carregou
      if (audioBufferCache.current[stepIndex]) {
          playBuffer(audioBufferCache.current[stepIndex]);
      }
    } catch (error) {
      console.error("Erro crítico ao tocar áudio:", error);
    } finally {
      setLoadingStep(null);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      currentSourceRef.current = source;
    } catch (e) {
      console.error("Erro playback", e);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    // Determine current step logic
    let currentStepIndex = 0;
    if (timeLeft > 100) currentStepIndex = 0;
    else if (timeLeft > 60) currentStepIndex = 1;
    else if (timeLeft > 30) currentStepIndex = 2;
    else if (timeLeft > 0) currentStepIndex = 3;
    else currentStepIndex = 4;

    if (currentStepIndex !== step) {
      setStep(currentStepIndex);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, step]);

  // Trigger Audio when step changes
  useEffect(() => {
    if (isActive && soundEnabled) {
      playAudioForStep(step);
    } else {
      stopAudio();
    }
  }, [step, isActive]); 

  // Toggle Sound behavior
  useEffect(() => {
    if (soundEnabled && isActive) {
      playAudioForStep(step);
    } else if (!soundEnabled) {
      stopAudio();
    }
  }, [soundEnabled]);

  const toggleTimer = () => {
    initAudioContext();
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    stopAudio();
    setIsActive(false);
    setTimeLeft(DURATION);
    setStep(0);
  };

  const toggleSound = () => {
    initAudioContext();
    setSoundEnabled(!soundEnabled);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const allDownloaded = downloadProgress >= steps.length;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-900 rounded-3xl relative overflow-hidden text-white p-8 shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 text-center max-w-lg w-full">
        <div className="mb-8 flex justify-between items-center w-full">
          <div className="w-10"></div> 
          <span className="bg-white/10 px-4 py-1 rounded-full text-sm font-medium tracking-wider uppercase text-emerald-300 border border-white/5">
            Visualização Guiada
          </span>
          <button 
            onClick={toggleSound}
            className={`p-2 rounded-full transition-colors flex items-center justify-center relative ${soundEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400 hover:text-white'}`}
            title={soundEnabled ? "Desativar Voz Humana" : "Ativar Voz Guia (IA)"}
          >
            {loadingStep !== null && soundEnabled ? (
              <Loader2 size={20} className="animate-spin text-amber-400" />
            ) : soundEnabled ? (
              <Volume2 size={20} />
            ) : (
              <VolumeX size={20} />
            )}
          </button>
        </div>

        <div className="text-7xl font-light font-mono mb-8 tracking-tighter tabular-nums text-slate-100">
          {formatTime(timeLeft)}
        </div>

        <div className="h-40 flex items-center justify-center mb-8 px-4">
          <p className={`text-xl md:text-2xl font-medium transition-all duration-700 leading-relaxed text-center ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
            {steps[step].text}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 justify-center">
            <button 
              onClick={toggleTimer}
              // Bloqueia play se áudio estiver ativado mas ainda não baixou o passo atual
              disabled={soundEnabled && !audioBufferCache.current[step] && isActive === false}
              className={`w-20 h-20 text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-white/10 ${
                isActive ? 'bg-amber-400 hover:bg-amber-300' : 
                (soundEnabled && !audioBufferCache.current[step]) ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-100'
              }`}
            >
              {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            
            <button 
              onClick={resetTimer}
              className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
              title="Reiniciar"
            >
              <RotateCcw size={22} />
            </button>
          </div>
          
          {/* Status Text for Button */}
          {soundEnabled && !audioBufferCache.current[step] && !isActive && (
             <span className="text-xs text-amber-300 animate-pulse">Baixando áudio inicial...</span>
          )}
        </div>
      </div>

      {/* Info footer with Download Progress */}
      <div className="absolute bottom-6 flex gap-6 text-xs text-slate-400/80 w-full justify-center px-4">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-emerald-400" /> <span>Visualize</span>
        </div>
        <div className="flex items-center gap-2">
          <Anchor size={16} className="text-amber-400" /> <span>Ancore</span>
        </div>
        
        {/* Indicador de Download */}
        {!allDownloaded && (
           <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700">
             <DownloadCloud size={12} className="text-blue-400 animate-bounce" /> 
             <span>Baixando: {downloadProgress}/{steps.length}</span>
           </div>
        )}
        {allDownloaded && (
           <div className="flex items-center gap-2 text-emerald-500/50">
             <CheckCircle2 size={12} /> <span>Áudio Pronto</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationTool;