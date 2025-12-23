import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, MoreHorizontal, Loader2 } from 'lucide-react';
import { chatWithCoach } from '../services/geminiService';
import { db } from '../services/database';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './Logo';

const AICoach: React.FC = () => {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await db.getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
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
    
    db.saveChatMessage(userMsg);

    let userContext = "";
    try {
      const [profile, beliefs] = await Promise.all([
        db.getProfile(),
        db.getBeliefs()
      ]);
      const goal = profile?.statement || profile?.mantra || "Não definido";
      const recentBeliefs = beliefs.slice(0, 3).map(b => b.limiting).join("; ");
      userContext = `Objetivo/Mantra Principal: "${goal}".\nCrenças Limitantes Recentes: ${recentBeliefs}.`;
    } catch (e) {}

    const contextHistory = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Mentor'}: ${m.text}`);
    const responseText = await chatWithCoach(contextHistory, userText, userContext, language);
    
    setLoading(false);
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    let currentIndex = 0;
    const speed = 15;
    const chunkSize = 3;

    const typingInterval = setInterval(() => {
        setMessages(prev => {
            const updatedMessages = [...prev];
            const lastIndex = updatedMessages.length - 1;
            if (lastIndex < 0) return prev;
            const currentChunk = responseText.slice(0, currentIndex + chunkSize);
            updatedMessages[lastIndex] = { ...updatedMessages[lastIndex], text: currentChunk };
            return updatedMessages;
        });

        currentIndex += chunkSize;

        if (currentIndex >= responseText.length) {
            clearInterval(typingInterval);
            setIsTyping(false);
            setMessages(prev => {
                const finalMsgs = [...prev];
                const lastIdx = finalMsgs.length - 1;
                finalMsgs[lastIdx] = { ...finalMsgs[lastIdx], text: responseText };
                return finalMsgs;
            });
            db.saveChatMessage({ role: 'model', text: responseText });
        }
    }, speed);
  };

  const handleClearHistory = async () => {
    if (confirm("Deseja apagar todo o histórico de conversa?")) {
      await db.clearChat();
      resetWelcome();
    }
  };

  const resetWelcome = () => {
    const resetMsg = language === 'pt' ? 'Memória limpa. Vamos recomeçar! Qual é o seu foco hoje?' 
        : language === 'es' ? 'Memoria borrada. ¡Empecemos de nuevo! ¿Cuál es tu enfoque hoy?' 
        : 'Memory cleared. Let\'s restart! What is your focus today?';
    setMessages([{ role: 'model', text: resetMsg }]);
  };

  const renderMessage = (text: string) => {
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      
      {/* Header Web Original */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#F87A14] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {t('coach.title')} <Logo size={14} />
            </h3>
            <p className="text-xs text-slate-400">Mentor de Mentalidade</p>
          </div>
        </div>
        
        <button 
          onClick={handleClearHistory}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${
                    isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-[#F87A14]'
                  }`}>
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`px-5 py-3 rounded-2xl text-base leading-relaxed ${
                  isUser 
                    ? 'bg-[#F87A14] text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                }`}>
                  {isUser ? msg.text : renderMessage(msg.text)}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-[#F87A14]" />
                <span className="text-sm text-slate-400">Ouvindo sua mente...</span>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area Original Web */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-3 items-end bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-orange-300 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('coach.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-slate-700 p-2.5 max-h-32 min-h-[44px] text-base resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || isTyping || !input.trim()}
            className="p-3 bg-[#F87A14] text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-1 mr-1"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;