import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, MoreHorizontal } from 'lucide-react';
import { chatWithCoach } from '../services/geminiService';
import { db } from '../services/database';
import { ChatMessage } from '../types';

const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carregar histórico ao iniciar
  useEffect(() => {
    const loadHistory = async () => {
      const history = await db.getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Mensagem de boas-vindas padrão se não houver histórico
        setMessages([{ 
          role: 'model', 
          text: 'Olá! Sou seu Mentor MindShift. Em que posso te ajudar hoje? Podemos falar sobre disciplina, medos ou estratégias para vencer.' 
        }]);
      }
    };
    loadHistory();
  }, []);

  // Auto-scroll sempre que mensagens mudarem ou loading iniciar
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    const userMsg: ChatMessage = { role: 'user', text: userText };
    
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    // Salva msg do usuário no banco (sem await para não travar UI)
    db.saveChatMessage(userMsg);

    // Contexto das últimas 10 mensagens
    const contextHistory = messages.slice(-10).map(m => `${m.role === 'user' ? 'Usuário' : 'Mentor'}: ${m.text}`);

    const responseText = await chatWithCoach(contextHistory, userText);
    const modelMsg: ChatMessage = { role: 'model', text: responseText };

    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
    
    // Salva msg do modelo no banco
    db.saveChatMessage(modelMsg);
  };

  const handleClearHistory = async () => {
    if (confirm("Deseja apagar todo o histórico de conversa?")) {
      await db.clearChat();
      setMessages([{ role: 'model', text: 'Memória limpa. Vamos recomeçar! Qual é o seu foco hoje?' }]);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
      
      {/* Header com visual glass/moderno */}
      <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between shadow-md z-10 relative overflow-hidden">
        {/* Efeito de fundo decorativo no header */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#F87A14] rounded-full blur-[60px] opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F87A14] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/50">
              <Bot size={28} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
              Mentor Virtual <Sparkles size={14} className="text-amber-400" />
            </h3>
          </div>
        </div>
        
        <button 
          onClick={handleClearHistory}
          className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
          title="Limpar Histórico"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Área de Mensagens com Gradiente Sutil e Animações */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/40 via-slate-50 to-slate-100">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar Icon */}
                <div className="shrink-0 mt-auto hidden md:flex">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-[#F87A14]/10 text-[#F87A14]'
                  }`}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>
                </div>

                {/* Message Bubble - FONTE AUMENTADA AQUI (text-lg md:text-xl) */}
                <div className={`relative px-5 py-4 shadow-sm text-lg md:text-xl leading-relaxed ${
                  isUser 
                    ? 'bg-gradient-to-br from-[#F87A14] to-orange-600 text-white rounded-2xl rounded-tr-none shadow-orange-200' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none shadow-slate-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator Sutil (Bouncing Dots) */}
        {loading && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[75%] gap-3">
               <div className="shrink-0 mt-auto hidden md:flex">
                  <div className="w-8 h-8 rounded-full bg-[#F87A14]/10 text-[#F87A14] flex items-center justify-center">
                    <Bot size={14} />
                  </div>
               </div>
               <div className="bg-white border border-slate-100 px-4 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-[54px]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
               </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Área de Input Flutuante */}
      <div className="p-4 md:p-5 bg-white border-t border-slate-100 relative z-20">
        <div className="flex gap-3 items-end bg-slate-50 p-2 rounded-3xl border border-slate-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all shadow-inner">
          <div className="pl-2 pb-3 text-slate-400 hidden sm:block">
            <MoreHorizontal size={20} />
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite sua dúvida ou desabafo..."
            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 resize-none py-3 px-2 max-h-32 min-h-[50px] custom-scrollbar text-lg"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`p-3 rounded-2xl transition-all duration-300 transform mb-1 mr-1 ${
              loading || !input.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#F87A14] to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={20} className={loading || !input.trim() ? "" : "ml-0.5"} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          O Mentor IA pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
};

export default AICoach;