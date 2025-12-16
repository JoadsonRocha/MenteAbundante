import React, { useState, useEffect } from 'react';
import { Heart, Send, Sparkles, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { db, generateUUID } from '../services/database';
import { generateGratitudeAffirmation } from '../services/geminiService';
import { GratitudeEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const GratitudeJournal: React.FC = () => {
  const { t, language } = useLanguage();
  const [entryText, setEntryText] = useState('');
  const [history, setHistory] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await db.getGratitudeHistory();
        setHistory(data);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleSave = async () => {
    if (!entryText.trim()) return;

    setAnalyzing(true);
    let affirmation = '';
    
    // Gera afirmação com IA passando o idioma
    try {
      affirmation = await generateGratitudeAffirmation(entryText, language);
    } catch (e) {
      affirmation = "Sua gratidão transforma sua realidade.";
    }

    const newEntry: GratitudeEntry = {
      // IMPORTANTE: Usa o helper UUID para compatibilidade com o banco de dados Supabase
      id: generateUUID(), 
      user_id: '', // Será preenchido no serviço do banco
      text: entryText,
      ai_response: affirmation,
      date: new Date().toISOString()
    };

    // Salva no banco (e local storage)
    await db.addGratitudeEntry(newEntry);
    
    // Atualiza estado visual
    setHistory([newEntry, ...history]);
    setEntryText('');
    setAnalyzing(false);

    // Registra atividade para o gráfico de progresso
    await db.logActivity(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#F87A14]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Header Padronizado */}
      <div className="text-center space-y-3 px-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14] flex items-center justify-center gap-2">
          <Heart className="text-[#F87A14] fill-[#F87A14]" size={28} />
          {t('gratitude.title')}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          {t('gratitude.subtitle')}
        </p>
      </div>

      {/* Input Area - Tons de Ouro/Laranja Suave e Slate */}
      <div className="bg-gradient-to-br from-orange-50 to-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-xl shadow-orange-100/50">
        <label className="block text-sm font-bold text-orange-700 uppercase tracking-wider mb-4">
          {t('gratitude.label_input')}
        </label>
        
        <div className="relative">
          <textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            disabled={analyzing}
            placeholder={t('gratitude.placeholder_input')}
            className="w-full h-32 p-4 rounded-2xl border border-orange-200 focus:border-[#F87A14] focus:ring-4 focus:ring-orange-100 transition-all resize-none text-slate-700 placeholder:text-orange-300/70 bg-white outline-none text-lg"
          />
          
          <div className="absolute bottom-4 right-4">
             <button
               onClick={handleSave}
               disabled={!entryText.trim() || analyzing}
               className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${
                 !entryText.trim() || analyzing
                   ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                   : 'bg-gradient-to-r from-[#F87A14] to-orange-500 text-white hover:scale-105 shadow-orange-300'
               }`}
             >
               {analyzing ? (
                 <><Loader2 size={18} className="animate-spin" /> ...</>
               ) : (
                 <><Send size={18} /> {t('gratitude.btn_submit')}</>
               )}
             </button>
          </div>
        </div>
        
        {analyzing && (
           <p className="text-center text-xs text-orange-400 mt-3 animate-pulse">
             A IA está conectando sua gratidão à abundância...
           </p>
        )}
      </div>

      {/* Timeline */}
      {history.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 pl-2">
            <BookOpen size={20} className="text-slate-400" />
            {t('gratitude.history_title')}
          </h3>

          <div className="grid gap-6">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                {/* Data */}
                <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 rounded-bl-xl border-b border-l border-slate-100 text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(item.date).toLocaleDateString()}
                </div>

                <p className="text-lg text-slate-700 italic mb-4 font-medium leading-relaxed">
                  "{item.text}"
                </p>

                {/* AI Response Box - Tons de Ouro */}
                {item.ai_response && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-bottom-1">
                     <div className="shrink-0 pt-1">
                       <Sparkles size={18} className="text-amber-500" />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                         Ressonância de Abundância
                       </p>
                       <p className="text-sm text-slate-700 font-medium">
                         {item.ai_response}
                       </p>
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && !loading && (
        <div className="text-center py-12 opacity-50">
           <Heart size={48} className="mx-auto text-slate-200 mb-4" />
           <p className="text-slate-400 whitespace-pre-line">{t('gratitude.empty_state')}</p>
        </div>
      )}

    </div>
  );
};

export default GratitudeJournal;