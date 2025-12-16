import React, { useState, useRef, useEffect } from 'react';
import { Headset, Send, MessageSquare, AlertCircle, Phone, Mail, CheckCircle2, Bot, User, FileText, Loader2, Clock, XCircle, LogOut, Trash2 } from 'lucide-react';
import { chatWithSupportAgent } from '../services/geminiService';
import { db, generateUUID } from '../services/database';
import { ChatMessage, SupportTicket } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const SupportAgent: React.FC = () => {
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para Tickets
  const [ticketMode, setTicketMode] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketChannel, setTicketChannel] = useState<'whatsapp' | 'email' | 'in_app'>('email');
  const [ticketSent, setTicketSent] = useState(false);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega histórico de tickets e inicia chat
  useEffect(() => {
    // Chat inicial
    resetChat();

    loadTickets();
  }, [language]); // Reinicia se mudar idioma
  
  const resetChat = () => {
    const welcome = language === 'pt' 
      ? 'Olá! Sou o Assistente Técnico Rise Mindr. Posso ajudar com dúvidas sobre sua conta, funcionalidades do app ou problemas técnicos. Como posso ajudar hoje?'
      : language === 'es'
      ? '¡Hola! Soy el Asistente Técnico Rise Mindr. Puedo ayudar con dudas sobre tu cuenta, funcionalidades de la app o problemas técnicos. ¿Cómo puedo ayudarte hoy?'
      : 'Hello! I am the Rise Mindr Tech Assistant. I can help with account questions, app features, or technical issues. How can I help today?';

    setMessages([{
      role: 'model',
      text: welcome
    }]);
  };

  const loadTickets = async () => {
    const tickets = await db.getSupportHistory();
    setRecentTickets(tickets);
  };

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

    // Contexto das últimas mensagens
    const contextHistory = messages.slice(-6).map(m => `${m.role === 'user' ? 'Cliente' : 'Agente'}: ${m.text}`);

    const responseText = await chatWithSupportAgent(contextHistory, userText, language);
    
    // Verifica se a IA sugeriu escalonamento
    if (responseText.includes('[ESCALATE]')) {
       const cleanText = responseText.replace('[ESCALATE]', '').trim();
       const defaultEscalateMsg = language === 'pt' 
         ? "Entendi sua frustração. Para resolver isso da melhor forma, vou precisar abrir um chamado para nossa equipe humana."
         : language === 'es'
         ? "Entiendo tu frustración. Para resolver esto de la mejor manera, necesitaré abrir un ticket para nuestro equipo humano."
         : "I understand your frustration. To resolve this properly, I'll need to open a ticket for our human team.";

       setMessages(prev => [...prev, { role: 'model', text: cleanText || defaultEscalateMsg }]);
       setTicketMode(true);
       setTicketSubject(userText); // Sugere o último input como assunto
    } else {
       setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    }
    
    setLoading(false);
  };

  const createTicket = async () => {
    const newTicket: SupportTicket = {
      id: generateUUID(),
      status: 'open',
      subject: ticketSubject,
      channel_preference: ticketChannel,
      created_at: new Date().toISOString(),
      messages: messages
    };

    await db.createSupportTicket(newTicket);
    setRecentTickets(prev => [newTicket, ...prev]); 
    
    setTicketSent(true);
    setTicketMode(false);
  };

  // Finalizar e SALVAR o atendimento atual no banco
  const handleFinishSession = async () => {
    // Só salva se houver interação do usuário além do "Olá"
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      if (confirm(t('support.subtitle'))) resetChat(); // Usando uma string qualquer traduzida apenas para confirmar
      return;
    }

    if (confirm("Deseja finalizar e arquivar este atendimento como Resolvido?")) {
      setLoading(true);
      try {
        // Define o assunto baseado na primeira mensagem do usuário
        const subject = userMessages[0].text.length > 30 
          ? userMessages[0].text.substring(0, 30) + '...' 
          : userMessages[0].text;

        const resolvedTicket: SupportTicket = {
          id: generateUUID(),
          status: 'resolved',
          subject: `(IA) ${subject}`,
          channel_preference: 'in_app', // Atendimento automático
          created_at: new Date().toISOString(),
          messages: messages
        };

        // Salva no banco de dados
        await db.createSupportTicket(resolvedTicket);
        
        // Atualiza a lista lateral
        await loadTickets();

        // Reinicia o chat
        const savedMsg = language === 'pt' ? 'Atendimento salvo no histórico.' : language === 'es' ? 'Atención guardada en el historial.' : 'Support session saved to history.';
        setMessages([{ role: 'model', text: savedMsg }]);
      } catch (error) {
        console.error("Erro ao salvar atendimento", error);
        alert("Erro ao salvar. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Resolver Ticket Existente na Lista
  const handleResolveTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita cliques indesejados no card
    if (confirm("Marcar este problema como resolvido no sistema?")) {
      try {
        // Atualiza UI Otimista
        setRecentTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
        
        // Atualiza Banco
        await db.updateSupportTicketStatus(ticketId, 'resolved');
      } catch (error) {
        console.error("Erro ao atualizar ticket", error);
      }
    }
  };

  if (ticketSent) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ticket Criado com Sucesso!</h2>
          <p className="text-slate-500 mb-6">
            Nossa equipe humana analisará seu caso e entrará em contato via <strong>{ticketChannel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</strong> em até 24 horas úteis.
          </p>
          <button
            onClick={() => {
              setTicketSent(false);
              setMessages([{ role: 'model', text: 'Posso ajudar em algo mais enquanto você aguarda?' }]);
            }}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Voltar ao Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Sidebar Info Panel (Desktop) */}
      <div className="hidden md:block w-1/3 space-y-4">
         <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Headset size={24} className="text-[#F87A14]" /> {t('support.title')}
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              Nosso agente inteligente resolve 80% dos problemas instantaneamente. Se precisar, escalonamos para um humano.
            </p>
            
            <div className="space-y-3 text-sm">
               <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <Bot size={18} className="text-emerald-400" />
                  <span>Disponível 24/7</span>
               </div>
               <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <FileText size={18} className="text-blue-400" />
                  <span>Base de Conhecimento</span>
               </div>
            </div>
         </div>

         {/* Ticket Status Mini */}
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Histórico de Problemas</h3>
            
            {recentTickets.length === 0 ? (
               <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                 Nenhum registro encontrado.
               </p>
            ) : (
               <div className="space-y-3">
                 {recentTickets.map(ticket => (
                    <div key={ticket.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 relative group hover:border-slate-300 transition-colors">
                       <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                             ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {ticket.status === 'open' ? 'Aberto' : 'Resolvido'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                             {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                       </div>
                       <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-tight pr-6">
                          {ticket.subject || 'Sem assunto'}
                       </p>
                       <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                          {ticket.channel_preference === 'whatsapp' ? <Phone size={10} /> : ticket.channel_preference === 'email' ? <Mail size={10} /> : <Bot size={10} />}
                          via {ticket.channel_preference}
                       </div>
                       
                       {/* Botão de Finalizar Ticket na Lista */}
                       {ticket.status === 'open' && (
                         <button 
                           onClick={(e) => handleResolveTicket(ticket.id, e)}
                           className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-emerald-500 rounded-lg transition-all"
                           title="Marcar como Resolvido"
                         >
                           <CheckCircle2 size={16} />
                         </button>
                       )}
                    </div>
                 ))}
               </div>
            )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* Mobile/Desktop Header Combo */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-10">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-lg">
               <Headset size={20} className="text-[#F87A14]" />
             </div>
             <div>
                <span className="font-bold block leading-tight">{t('support.title')}</span>
                <span className="text-[10px] text-slate-400 block">{t('support.subtitle')}</span>
             </div>
           </div>
           
           <button 
             onClick={handleFinishSession}
             disabled={loading}
             className="text-xs font-bold bg-white/10 hover:bg-emerald-500 hover:text-white text-slate-200 px-3 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/10"
             title="Salvar conversa e finalizar"
           >
             <CheckCircle2 size={14} /> 
             <span className="hidden sm:inline">Finalizar & Salvar</span>
             <span className="sm:hidden">Salvar</span>
           </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50 custom-scrollbar">
          {messages.map((msg, idx) => {
             const isUser = msg.role === 'user';
             return (
               <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                 <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                       {isUser ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-sm ${
                       isUser 
                         ? 'bg-indigo-600 text-white rounded-tr-none' 
                         : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                       {msg.text}
                    </div>
                 </div>
               </div>
             );
          })}
          {loading && (
             <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-slate-400" />
                   <span className="text-xs text-slate-400">Processando e salvando...</span>
                </div>
             </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Ticket Modal Overlay or Inline Form */}
        {ticketMode ? (
           <div className="bg-slate-100 p-6 border-t border-slate-200 animate-slide-up">
              <div className="flex items-center gap-2 text-amber-600 mb-4 font-bold text-sm">
                 <AlertCircle size={16} /> Escalonamento Necessário
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Abrir Chamado Humano</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto</label>
                    <input 
                      type="text" 
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#F87A14] outline-none"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preferência de Contato</label>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setTicketChannel('email')}
                         className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all ${
                            ticketChannel === 'email' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'
                         }`}
                       >
                          <Mail size={16} /> E-mail
                       </button>
                       <button 
                         onClick={() => setTicketChannel('whatsapp')}
                         className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-all ${
                            ticketChannel === 'whatsapp' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'
                         }`}
                       >
                          <Phone size={16} /> WhatsApp
                       </button>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setTicketMode(false)}
                      className="flex-1 py-3 text-slate-500 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                      onClick={createTicket}
                      className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                       Confirmar Abertura
                    </button>
                 </div>
              </div>
           </div>
        ) : (
           /* Input Area */
           <div className="p-4 bg-white border-t border-slate-100">
             <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-slate-400 transition-colors">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                 }}
                 placeholder={t('support.placeholder')}
                 className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-slate-700 placeholder:text-slate-400"
                 rows={1}
               />
               <button 
                 onClick={handleSend}
                 disabled={loading || !input.trim()}
                 className={`p-3 rounded-xl transition-all ${
                    loading || !input.trim() 
                    ? 'bg-slate-200 text-slate-400' 
                    : 'bg-[#F87A14] text-white hover:bg-orange-600 shadow-md'
                 }`}
               >
                 <Send size={20} />
               </button>
             </div>
           </div>
        )}
      </div>

    </div>
  );
};

export default SupportAgent;