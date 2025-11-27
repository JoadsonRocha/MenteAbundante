import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Save } from 'lucide-react';
import { reframeBelief } from '../services/geminiService';
import { BeliefEntry } from '../types';
import { db } from '../services/database';

const BeliefReprogrammer: React.FC = () => {
  const [belief, setBelief] = useState('');
  const [result, setResult] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [savedEntries, setSavedEntries] = useState<BeliefEntry[]>([]);

  // Carregar histórico do banco
  useEffect(() => {
    db.getBeliefs().then(setSavedEntries);
  }, []);

  const handleReprogram = async () => {
    if (!belief.trim()) return;
    setLoadingAI(true);
    try {
      const response = await reframeBelief(belief);
      setResult(response);
    } catch (e) {
      setResult("Erro ao conectar. Tente novamente.");
    } finally {
      setLoadingAI(false);
    }
  };

  const saveEntry = async () => {
    if (!belief || !result) return;
    const newEntry: BeliefEntry = {
      id: Date.now().toString(),
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <RefreshCw className="text-amber-500" />
            Reprogramação Mental
          </h2>
          <p className="text-slate-600 mb-4 text-sm">
            Identifique uma crença limitante e deixe a IA ajudar você a aplicar o método "Pensar, Sentir, Ressignificar".
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pensamento Limitante (Crença Fixa)</label>
              <textarea
                value={belief}
                onChange={(e) => setBelief(e.target.value)}
                placeholder="Ex: Eu não nasci para ser rico..."
                className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all resize-none h-32"
              />
            </div>

            <button
              onClick={handleReprogram}
              disabled={loadingAI || !belief}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                loadingAI || !belief 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Transformar Crença
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 animate-fade-in">
            <h3 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
              <Sparkles size={18} /> Nova Realidade
            </h3>
            <div className="prose prose-emerald text-slate-700 mb-6 whitespace-pre-wrap">
              {result}
            </div>
            <button 
              onClick={saveEntry}
              className="w-full py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save size={18} /> Salvar no Diário
            </button>
          </div>
        )}
      </div>

      {/* History/Log */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full overflow-y-auto max-h-[600px]">
        <h3 className="text-lg font-bold text-slate-700 mb-4 sticky top-0 bg-slate-50 pb-2">Seu Diário de Transformação</h3>
        {savedEntries.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">
            <p>Nenhuma reprogramação salva ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedEntries.map((entry) => (
              <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>{entry.date}</span>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">Antiga</span>
                  <p className="text-slate-600 mt-1 text-sm italic">"{entry.limiting}"</p>
                </div>
                <div className="flex items-center justify-center py-2 text-slate-300">
                  <ArrowRight size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Nova</span>
                  <p className="text-slate-800 mt-1 text-sm font-medium whitespace-pre-wrap">{entry.empowering}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeliefReprogrammer;