import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowDown, RefreshCw, Save, Trash2, Quote, BrainCircuit, ShieldAlert, ShieldCheck } from 'lucide-react';
import { reframeBelief } from '../services/geminiService';
import { BeliefEntry } from '../types';
import { db } from '../services/database';
import { useLanguage } from '../contexts/LanguageContext';

const BeliefReprogrammer: React.FC = () => {
  const { t, language } = useLanguage();
  const [belief, setBelief] = useState('');
  const [result, setResult] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [savedEntries, setSavedEntries] = useState<BeliefEntry[]>([]);

  // Carregar histórico do banco com tratamento de erro
  useEffect(() => {
    db.getBeliefs()
      .then(setSavedEntries)
      .catch(err => console.error("Falha ao carregar crenças", err));
  }, []);

  const handleReprogram = async () => {
    if (!belief.trim()) return;
    setLoadingAI(true);
    try {
      const response = await reframeBelief(belief, language);
      setResult(response);
    } catch (e) {
      setResult("Erro ao conectar. Tente novamente.");
    } finally {
      setLoadingAI(false);
    }
  };

  const saveEntry = async () => {
    if (!belief || !result) return;
    
    // Gera UUID seguro se disponível, senão fallback simples
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `belief-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: BeliefEntry = {
      id: newId,
      limiting: belief,
      empowering: result,
      date: new Date().toLocaleDateString()
    };
    
    // Atualiza UI
    setSavedEntries(prev => [newEntry, ...prev]);
    // Salva no Banco
    await db.addBelief(newEntry);
    
    setBelief('');
    setResult('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja remover esta reprogramação?')) {
        // Implementação visual, idealmente adicionaria db.deleteBelief(id) no futuro
        setSavedEntries(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Header Section - Mobile Optimized (24px Title) */}
      <div className="text-center space-y-3 px-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14] flex items-center justify-center gap-2">
          <BrainCircuit className="text-[#F87A14]" size={28} />
          {t('reprogram.title')}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          {t('reprogram.subtitle')}
        </p>
      </div>

      {/* Input / Transformer Area */}
      <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="bg-slate-900 p-6 text-white">
          <label className="text-xs md:text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 block">
            {t('reprogram.label_block')}
          </label>
          <div className="relative">
            <Quote className="absolute top-3 left-3 text-slate-600 w-5 h-5 rotate-180" />
            <textarea
              value={belief}
              onChange={(e) => setBelief(e.target.value)}
              placeholder={t('reprogram.placeholder_block')}
              // Text-base (16px) evita zoom no iPhone
              className="w-full bg-slate-800/50 text-white text-base leading-relaxed p-4 pl-10 rounded-xl border border-slate-700 focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none h-36 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="p-6 bg-white">
           {/* Se tiver resultado, mostra prévia para salvar */}
           {result ? (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <Sparkles size={18} />
                <span>{t('reprogram.result_label')}</span>
              </div>
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setResult('')}
                  className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium"
                >
                  {t('reprogram.btn_cancel')}
                </button>
                <button 
                  onClick={saveEntry}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Save size={20} /> {t('reprogram.btn_save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleReprogram}
              disabled={loadingAI || !belief.trim()}
              className={`w-full py-4 rounded-xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all ${
                loadingAI || !belief.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#F87A14] to-orange-500 text-white shadow-xl shadow-orange-200 hover:-translate-y-1 hover:shadow-2xl'
              }`}
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="animate-spin" /> Processando com IA...
                </>
              ) : (
                <>
                  <RefreshCw /> {t('reprogram.btn_analyze')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      {savedEntries.length > 0 && (
        <div className="relative pt-6">
           <h3 className="text-xl font-bold text-slate-800 mb-6 pl-4 border-l-4 border-[#F87A14]">
             {t('reprogram.history_title')}
           </h3>
           
           {/* Timeline Line */}
           <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-slate-200"></div>

           <div className="space-y-10">
             {savedEntries.map((entry, index) => (
               <div key={entry.id} className="relative pl-14">
                 
                 {/* Timeline Dot */}
                 <div className="absolute left-5 top-6 w-8 h-8 -ml-4 rounded-full bg-white border-4 border-emerald-100 flex items-center justify-center z-10 shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
                    {/* Header Card */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {entry.date}
                      </span>
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors p-1"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="p-5 grid gap-5">
                      {/* Old Belief */}
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldAlert size={14} className="text-red-400" />
                           <span className="text-[10px] md:text-xs font-bold text-red-400 uppercase">Crença Limitante</span>
                        </div>
                        <p className="text-slate-500 italic text-base leading-relaxed relative z-10">
                          "{entry.limiting}"
                        </p>
                      </div>

                      {/* Connector Arrow */}
                      <div className="flex justify-center">
                        <div className="bg-slate-50 rounded-full p-1.5 text-slate-300">
                          <ArrowDown size={18} />
                        </div>
                      </div>

                      {/* New Belief */}
                      <div className="relative bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <div className="flex items-center gap-2 mb-2">
                           <ShieldCheck size={14} className="text-emerald-600" />
                           <span className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase">Nova Verdade</span>
                        </div>
                        <p className="text-slate-800 font-medium text-base leading-relaxed whitespace-pre-wrap">
                          {entry.empowering}
                        </p>
                      </div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {savedEntries.length === 0 && !loadingAI && !result && (
        <div className="text-center py-12 opacity-50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <RefreshCw size={24} />
          </div>
          <p className="text-slate-400 text-base whitespace-pre-line">{t('reprogram.empty_state')}</p>
        </div>
      )}

    </div>
  );
};

export default BeliefReprogrammer;