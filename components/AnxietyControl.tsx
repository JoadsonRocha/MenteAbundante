import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Rocket, CheckCircle2, Loader2, Volume2, Wind, Sparkles, Lock, Headphones, Brain, Anchor, Heart } from 'lucide-react';
import { generateGuidedAudio } from '../services/geminiService';

interface AnxietyControlProps {
  onClose: () => void;
  onNavigateToPlanner: () => void;
}

// --- CONFIGURAÇÃO INDEXEDDB PARA CACHE ---
const DB_NAME = 'MindRiseAnxietyDB';
const STORE_NAME = 'audio_cache';
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

const saveAudioToDB = async (key: string, buffer: ArrayBuffer) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(buffer, key);
  } catch (e) { console.warn("Cache save failed", e); }
};

const getAudioFromDB = async (key: string): Promise<ArrayBuffer | undefined> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
  } catch (e) { return undefined; }
};

// --- WAV HEADER HELPER ---
const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
  const headerLength = 44;
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

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

// --- ROTEIROS ESTÁTICOS OTIMIZADOS ---
const MEDITATIONS = [
  {
    id: 'control',
    title: 'Retomar o Controle',
    icon: <Wind size={32} />,
    color: 'bg-teal-50 text-teal-600',
    chunks: [
      "Feche os olhos por um instante. Respire fundo pelo nariz… bem devagar… e solte pela boca. Perceba que você está seguro agora. Nada precisa ser resolvido nesse exato momento.",
      "Inspire lentamente contando mentalmente até 4… Segure por 2 segundos… E expire em 6 tempo… mais devagar do que respirou.",
      "Repita silenciosamente: “Eu estou aqui. Eu estou no controle. Sou mais forte que o momento.” Continue respirando devagar…",
      "Se sua mente ainda estiver agitada, apenas observe os pensamentos como nuvens passando. Você não é seus pensamentos. Eles passam. Assim como a ansiedade também vai passar.",
      "Mais uma respiração profunda… Agora abra os olhos com calma. Você retomou o controle. Continue leve."
    ]
  },
  {
    id: 'anchor',
    title: 'Âncora de Presença',
    icon: <Anchor size={32} />,
    color: 'bg-blue-50 text-blue-600',
    chunks: [
      "Pare o que estiver fazendo por um instante. Coloque a mão no peito… e sinta os batimentos do seu coração. Respire fundo… como se estivesse enchendo os pulmões de calma.",
      "Agora observe mentalmente três coisas que você consegue ver… Três que consegue ouvir… E três que consegue sentir fisicamente. Isso traz sua mente para o agora.",
      "Repita para si mesmo: “Neste momento eu estou presente. Sou capaz. Estou seguro.”",
      "Enquanto respira devagar, imagine uma luz calma envolta em você. Essa luz representa equilíbrio e segurança.",
      "Mais uma respiração profunda… Permita-se sentir paz, mesmo que por alguns segundos. Quando abrir os olhos, faça apenas a próxima ação com calma. Uma coisa de cada vez."
    ]
  },
  {
    id: 'courage',
    title: 'A Coragem já está em mim',
    icon: <Heart size={32} />,
    color: 'bg-rose-50 text-rose-600',
    chunks: [
      "Respire fundo, enchendo o peito de ar… e solte lentamente. Feche os olhos e pense: “A ansiedade é apenas energia mal direcionada. Eu posso convertê-la em ação.”",
      "Agora imagine um cenário onde você venceu esse momento. Se veja superando com confiança.",
      "Repita mentalmente com convicção: “Eu já passei por desafios antes e superei. Eu posso passar por este também. Eu sou mais forte do que sinto agora.”",
      "Mais uma respiração lenta… Nesse momento, escolha uma micro ação que você pode fazer em seguida – algo pequeno que te leve adiante.",
      "Abra os olhos com calma. Continue. Você está avançando."
    ]
  }
];

const AnxietyControl: React.FC<AnxietyControlProps> = ({ onClose, onNavigateToPlanner }) => {
  const [selectedMeditation, setSelectedMeditation] = useState<typeof MEDITATIONS[0] | null>(null);
  
  // Audio Logic
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);

  // Inicia o Audio Context
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playChunk = async (meditationId: string, chunkIndex: number, chunks: string[]) => {
    if (chunkIndex >= chunks.length) {
      // Fim da meditação
      setIsPlaying(false);
      setCurrentChunk(0);
      return;
    }

    setCurrentChunk(chunkIndex);
    setLoadingAudio(true);
    initAudio();

    try {
      const cacheKey = `meditation_${meditationId}_chunk_${chunkIndex}`;
      let audioBuffer: AudioBuffer | null = null;

      // 1. Tenta Cache
      const cached = await getAudioFromDB(cacheKey);
      
      if (cached && audioContextRef.current) {
         audioBuffer = await audioContextRef.current.decodeAudioData(cached.slice(0));
      } else {
         // 2. Tenta API
         const base64 = await generateGuidedAudio(chunks[chunkIndex]);
         if (base64 && audioContextRef.current) {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
               bytes[i] = binaryString.charCodeAt(i);
            }
            const wavBuffer = addWavHeader(bytes);
            
            // Salva no cache para a próxima
            await saveAudioToDB(cacheKey, wavBuffer);
            
            audioBuffer = await audioContextRef.current.decodeAudioData(wavBuffer.slice(0));
         }
      }

      if (audioBuffer && audioContextRef.current) {
         setLoadingAudio(false);
         const source = audioContextRef.current.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(audioContextRef.current.destination);
         
         source.onended = () => {
           // Toca próximo
           if (isPlaying) { // Só avança se o usuário não pausou
              playChunk(meditationId, chunkIndex + 1, chunks);
           }
         };
         
         audioSourceRef.current = source;
         source.start();
         setIsPlaying(true);
      } else {
        throw new Error("Falha ao carregar áudio");
      }

    } catch (e) {
      console.error(e);
      setLoadingAudio(false);
      setIsPlaying(false);
      alert("Erro ao carregar áudio. Verifique sua conexão.");
    }
  };

  const handlePlayPause = () => {
    if (!selectedMeditation) return;

    if (isPlaying) {
      stopAudio();
      setIsPlaying(false); // Pausa efetiva
    } else {
      setIsPlaying(true); // Reativa estado
      playChunk(selectedMeditation.id, currentChunk, selectedMeditation.chunks);
    }
  };

  const handleRestart = () => {
    stopAudio();
    setCurrentChunk(0);
    if (selectedMeditation) {
       // Pequeno delay para resetar UI
       setTimeout(() => playChunk(selectedMeditation.id, 0, selectedMeditation.chunks), 200);
    }
  };

  const handleSelect = (meditation: typeof MEDITATIONS[0]) => {
     stopAudio();
     setCurrentChunk(0);
     setSelectedMeditation(meditation);
  };

  useEffect(() => {
     return () => stopAudio();
  }, []);

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
        
        {!selectedMeditation ? (
           <div className="max-w-md mx-auto space-y-4">
              <p className="text-center text-slate-500 mb-6">Como você está se sentindo? Escolha uma guia:</p>
              
              {MEDITATIONS.map(med => (
                 <button 
                   key={med.id}
                   onClick={() => handleSelect(med)}
                   className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-4 group"
                 >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${med.color} group-hover:scale-110 transition-transform`}>
                       {med.icon}
                    </div>
                    <div className="text-left flex-1">
                       <h4 className="font-bold text-slate-700 text-lg">{med.title}</h4>
                       <p className="text-xs text-slate-400 mt-1">Duração: ~1min 30s • Áudio Guiado</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:bg-[#F87A14] group-hover:text-white transition-colors">
                       <Play size={20} fill="currentColor" />
                    </div>
                 </button>
              ))}
           </div>
        ) : (
           <div className="max-w-md mx-auto flex flex-col h-full justify-center">
              {/* Player UI */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative p-8 text-center space-y-8">
                 
                 <div className="absolute top-4 left-4">
                    <button onClick={() => { stopAudio(); setSelectedMeditation(null); }} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider">
                       ← Voltar
                    </button>
                 </div>

                 <div className="flex justify-center pt-4">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${selectedMeditation.color} relative`}>
                       <div className={`absolute inset-0 rounded-full border-4 border-current opacity-20 ${isPlaying ? 'animate-ping' : ''}`}></div>
                       {selectedMeditation.icon}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-2xl font-bold text-slate-800">{selectedMeditation.title}</h3>
                    <p className="text-slate-400 mt-2 text-sm">
                       Parte {currentChunk + 1} de {selectedMeditation.chunks.length}
                    </p>
                 </div>

                 {/* Text Display */}
                 <div className="h-32 flex items-center justify-center">
                    <p className="text-lg text-slate-600 font-medium leading-relaxed transition-all duration-500">
                       "{selectedMeditation.chunks[currentChunk]}"
                    </p>
                 </div>

                 {/* Controls */}
                 <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={handleRestart}
                      className="p-4 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                       <RotateCcw size={24} />
                    </button>

                    <button 
                      onClick={handlePlayPause}
                      className="w-20 h-20 rounded-full bg-[#F87A14] text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:scale-105 transition-transform"
                    >
                       {loadingAudio ? (
                          <Loader2 size={32} className="animate-spin" />
                       ) : isPlaying ? (
                          <Pause size={32} fill="currentColor" />
                       ) : (
                          <Play size={32} fill="currentColor" className="ml-1" />
                       )}
                    </button>
                 </div>

              </div>

              {currentChunk === selectedMeditation.chunks.length - 1 && !isPlaying && !loadingAudio && (
                 <div className="mt-8 text-center animate-fade-in">
                    <p className="text-slate-500 mb-4">Você completou este ciclo. Como se sente?</p>
                    <div className="flex gap-3 justify-center">
                       <button onClick={onClose} className="px-6 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300">
                          Estou melhor
                       </button>
                       <button onClick={() => { onClose(); onNavigateToPlanner(); }} className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 flex items-center gap-2">
                          <Rocket size={16} /> Ir para Ação
                       </button>
                    </div>
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
};

export default AnxietyControl;