import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, MoreHorizontal } from 'lucide-react';
import { chatWithCoach } from '../services/geminiService';
import { db } from '../services/database';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const AICoach: React.FC = () => {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Novo estado para controlar a digitação
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carregar histórico ao iniciar
  useEffect(() => {
    const loadHistory = async () => {
      const history = await db.getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Mensagem de boas-vindas padrão se não houver histórico
        const welcomeMsg = language === 'pt' 
          ? 'Olá! Sou seu Mentor Rise Mindr. Em que posso te ajudar hoje? Podemos falar sobre disciplina, medos ou estratégias para vencer.'
          : language === 'es' 
          ? '¡Hola! Soy tu Mentor Rise Mindr. ¿En qué puedo ayudarte hoy? Podemos hablar de disciplina, miedos o estrategias para ganar.'
          : 'Hello! I am your Rise Mindr Mentor. How can I help you today? We can talk about discipline, fears, or winning strategies.';

        setMessages([{ 
          role: 'model', 
          text: welcomeMsg
        }]);
      }
    };
    loadHistory();
  }, [language]);

  // Auto-scroll sempre que mensagens mudarem ou loading iniciar
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || loading || isTyping) return;

    const userText = input;
    const userMsg: ChatMessage = { role: 'user', text: userText };
    
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    // Salva msg do usuário no banco (sem await para não travar UI)
    db.saveChatMessage(userMsg);

    // --- INTEGRAÇÃO: Coleta Contexto do Usuário ---
    let userContext = "";
    try {
      const [profile, beliefs] = await Promise.all([
        db.getProfile(),
        db.getBeliefs()
      ]);
      
      const goal = profile?.statement || profile?.mantra || "Não definido";
      const recentBeliefs = beliefs.slice(0, 3).map(b => b.limiting).join("; ");
      
      userContext = `Objetivo/Mantra Principal: "${goal}".\nCrenças Limitantes Recentes identificadas: ${recentBeliefs}.`;
    } catch (e) {
      console.log("Erro ao carregar contexto", e);
    }
    // ----------------------------------------------

    // Contexto das últimas 10 mensagens
    const contextHistory = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Mentor'}: ${m.text}`);

    // Passa o userContext e o idioma para a função de serviço
    const responseText = await chatWithCoach(contextHistory, userText, userContext, language);
    
    setLoading(false); // Para o indicador de "pensando"
    setIsTyping(true); // Inicia o bloqueio de digitação

    // Adiciona o balão vazio da IA para começar a preencher
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    // Lógica de Efeito de Digitação (Typewriter)
    let currentIndex = 0;
    const speed = 20; // milissegundos entre chunks (ajuste para mais rápido/lento)
    const chunkSize = 2; // caracteres por vez (para ficar fluido e rápido)

    const typingInterval = setInterval(() => {
        setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            
            // Segurança caso o array esteja vazio (raro)
            if (lastIndex < 0) return prev;

            // Pega o pedaço atual do texto
            const currentChunk = responseText.slice(0, currentIndex + chunkSize);
            
            // Atualiza apenas a última mensagem
            updatedMessages[lastIndex] = { 
                ...updatedMessages[lastIndex], 
                text: currentChunk 
            };
            return updatedMessages;
        });

        currentIndex += chunkSize;

        // Se terminou de digitar tudo
        if (currentIndex >= responseText.length) {
            clearInterval(typingInterval);
            setIsTyping(false);
            
            // Garante que o texto final esteja exato (corrige qualquer slice impreciso)
            setMessages(prev => {
                const finalMsgs = [...prev];
                const lastIdx = finalMsgs.length - 1;
                finalMsgs[lastIdx] = { ...finalMsgs[lastIdx], text: responseText };
                return finalMsgs;
            });
            
            // Salva msg completa do modelo no banco
            db.saveChatMessage({ role: 'model', text: responseText });
        }
    }, speed);
  };

  const handleClearHistory = async () => {
    if (confirm("Deseja apagar todo o histórico de conversa?")) {
      await db.clearChat();
      const resetMsg = language === 'pt' ? 'Memória limpa. Vamos recomeçar! Qual é o seu foco hoje?' 
        : language === 'es' ? 'Memoria borrada. ¡Empecemos de nuevo! ¿Cuál es tu enfoque hoy?' 
        : 'Memory cleared. Let\'s restart! What is your focus today?';
        
      setMessages([{ role: 'model', text: resetMsg }]);
    }
  };

  // Função auxiliar para renderizar Markdown simples (Negrito)
  const renderMessage = (text: string) => {
    // Primeiro divide por negrito (**texto**)
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    
    return boldParts.map((part, index) => {
      // Se for negrito
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      
      // Retorna o texto normal
      return <span key={index}>{part}</span>;
    });
  };

  return (
    // Altura dinâmica no mobile (calc) para ocupar a tela toda menos headers/nav, e fixa no desktop
    <div className="flex flex-col h-[calc(100vh-160px)] md:h-[650px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative transition-all">
      
      {/* Header com visual glass/moderno - Padding reduzido no mobile */}
      <div className="bg-slate-900 text-white p-3 px-4 md:p-4 md:px-6 flex items-center justify-between shadow-md z-10 relative overflow-hidden shrink-0">
        {/* Efeito de fundo decorativo no header */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#F87A14] rounded-full blur-[60px] opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex items-center gap-3 md:gap-4 relative z-10">
          <div className="relative">
            {/* Ícone reduzido no mobile */}
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#F87A14] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/50">
              <Bot className="text-white w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg leading-tight flex items-center gap-2">
              {t('coach.title')} <Sparkles size={14} className="text-amber-400" />
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400">Online • AI Coach</p>
          </div>
        </div>
        
        <button 
          onClick={handleClearHistory}
          disabled={loading || isTyping}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
          title="Limpar Histórico"
        >
          <Trash2 size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      {/* Área de Mensagens com Gradiente Sutil e Animações */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/40 via-slate-50 to-slate-100">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              <div className={`flex max-w-[92%] md:max-w-[85%] gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar Icon (Escondido em mobile muito pequeno para ganhar espaço) */}
                <div className="shrink-0 mt-auto hidden sm:flex">
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm ${
                    isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-[#F87A14]/10 text-[#F87A14]'
                  }`}>
                    {isUser ? <User size={12} className="md:w-3.5 md:h-3.5" /> : <Bot size={12} className="md:w-3.5 md:h-3.5" />}
                  </div>
                </div>

                {/* Message Bubble - FONTE OTIMIZADA (text-base md:text-lg) e PADDING REDUZIDO */}
                <div className={`relative px-4 py-3 md:px-5 md:py-4 shadow-sm text-base md:text-lg leading-relaxed ${
                  isUser 
                    ? 'bg-gradient-to-br from-[#F87A14] to-orange-600 text-white rounded-2xl rounded-tr-none shadow-orange-200' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none shadow-slate-200'
                }`}>
                  <p className="whitespace-pre-wrap">
                    {isUser ? msg.text : renderMessage(msg.text)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator Sutil (Bouncing Dots) - Só aparece enquanto carrega, some quando começa a digitar */}
        {loading && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[75%] gap-2 md:gap-3">
               <div className="shrink-0 mt-auto hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-[#F87A14]/10 text-[#F87A14] flex items-center justify-center">
                    <Bot size={14} />
                  </div>
               </div>
               <div className="bg-white border border-slate-100 px-4 py-3 md:px-4 md:py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-[46px] md:h-[54px]">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
               </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Área de Input Flutuante - Padding Reduzido */}
      <div className="p-3 md:p-5 bg-white border-t border-slate-100 relative z-20 shrink-0">
        <div className={`flex gap-2 md:gap-3 items-end bg-slate-50 p-2 rounded-[20px] md:rounded-3xl border border-slate-200 transition-all shadow-inner ${loading || isTyping ? 'opacity-70' : 'focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10'}`}>
          <div className="pl-2 pb-3 text-slate-400 hidden sm:block">
            <MoreHorizontal size={20} />
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || isTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={loading || isTyping ? "..." : t('coach.placeholder')}
            // text-base impede zoom no iPhone. max-h reduzido no mobile.
            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 resize-none py-2.5 px-2 md:py-3 max-h-24 md:max-h-32 min-h-[44px] custom-scrollbar text-base md:text-lg disabled:cursor-not-allowed"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={loading || isTyping || !input.trim()}
            className={`p-2.5 md:p-3 rounded-2xl transition-all duration-300 transform mb-1 mr-1 ${
              loading || isTyping || !input.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#F87A14] to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={18} className={`md:w-5 md:h-5 ${loading || !input.trim() ? "" : "ml-0.5"}`} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 hidden sm:block">
          {t('coach.disclaimer')}
        </p>
      </div>
    </div>
  );
};

export default AICoach;