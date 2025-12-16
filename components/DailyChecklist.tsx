import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, Calendar, Edit3, X, MessageSquareQuote, Check, Sparkles } from 'lucide-react';
import { DailyTask } from '../types';
import { db } from '../services/database';
import { analyzeDailyHabit } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const DailyChecklist: React.FC = () => {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para o Modal de Reflexão
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  
  // Estado para identificar qual item está carregando o conselho da IA
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Formata a data atual
  const today = new Date();
  const dateString = today.toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.getTasks();
        const lastDate = db.getLastChecklistDate();
        const currentDate = new Date().toISOString().split('T')[0];

        // Reset diário: Se a data salva for diferente da atual, limpa tudo
        if (lastDate && lastDate !== currentDate) {
          console.log("Novo dia detectado. Resetando checklist...");
          const resetTasks = data.map(t => ({ ...t, completed: false, note: '', ai_advice: '' }));
          setTasks(resetTasks);
          await db.saveTasks(resetTasks);
          await db.setActivityCount(0);
        } else {
          setTasks(data);
        }
      } catch (error) {
        console.error("Erro ao carregar tarefas", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleTaskClick = async (task: DailyTask) => {
    // Se já está completo, apenas desmarca (sem modal)
    if (task.completed) {
      const newTasks = tasks.map(t => t.id === task.id ? { ...t, completed: false, note: '', ai_advice: '' } : t);
      setTasks(newTasks);
      await db.saveTasks(newTasks);
      
      const completedCount = newTasks.filter(t => t.completed).length;
      await db.setActivityCount(completedCount);
      return;
    }

    // Se não está completo, abre modal para reflexão
    setReflectionNote('');
    setSelectedTask(task);
  };

  const confirmReflection = async (hasNote: boolean) => {
    if (!selectedTask) return;

    const finalNote = hasNote ? reflectionNote : '';
    
    // 1. Atualiza UI imediatamente (Optimistic update) para marcar como feito
    let updatedTasks = tasks.map(t => 
      t.id === selectedTask.id 
        ? { ...t, completed: true, note: finalNote } 
        : t
    );
    
    setTasks(updatedTasks);
    await db.saveTasks(updatedTasks);

    // Integração com Evolução
    const completedCount = updatedTasks.filter(t => t.completed).length;
    await db.setActivityCount(completedCount);

    // Fecha modal
    setSelectedTask(null);
    setReflectionNote('');

    // 2. Se houver nota, chama a IA para dar um conselho
    if (hasNote && finalNote.trim().length > 3) {
      setAnalyzingId(selectedTask.id);
      try {
        const advice = await analyzeDailyHabit(selectedTask.text, finalNote, language);
        
        if (advice) {
          updatedTasks = updatedTasks.map(t => 
            t.id === selectedTask.id 
              ? { ...t, ai_advice: advice } 
              : t
          );
          setTasks(updatedTasks);
          await db.saveTasks(updatedTasks);
        }
      } catch (e) {
        console.error("Erro na análise IA", e);
      } finally {
        setAnalyzingId(null);
      }
    }
  };

  const completedTasks = tasks.filter(t => t.completed);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Header Padronizado */}
      <div className="text-center space-y-3 px-2 mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14]">{t('checklist.title')}</h2>
        <div className="flex items-center justify-center gap-2 text-slate-500">
           <Calendar size={16} className="text-[#F87A14]" />
           <span className="text-sm capitalize font-medium">{dateString}</span>
        </div>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          {t('checklist.subtitle')}
        </p>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className={`w-full text-left group relative overflow-hidden transition-all duration-300 rounded-2xl border px-6 py-5 flex items-start gap-4 ${
              task.completed 
                ? 'bg-emerald-50/30 border-emerald-100' 
                : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-md'
            }`}
          >
            {/* Ícone Check */}
            <div className={`mt-0.5 transition-all duration-300 transform ${
              task.completed ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-orange-300'
            }`}>
              {task.completed ? <CheckCircle2 size={24} fill="currentColor" className="text-emerald-50" /> : <Circle size={24} strokeWidth={1.5} />}
            </div>

            {/* Texto e Conteúdo */}
            <div className="flex-1 space-y-3">
              <span className={`text-lg font-medium transition-colors block ${
                task.completed ? 'text-emerald-900' : 'text-slate-700'
              }`}>
                {task.text}
              </span>
              
              {/* Nota do Usuário */}
              {task.completed && task.note && (
                <div className="text-sm text-slate-500 italic flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-slate-100">
                  <MessageSquareQuote size={14} className="shrink-0 mt-1 text-slate-400" />
                  <span>"{task.note}"</span>
                </div>
              )}

              {/* Skeleton Loader IA (Visual Load State) */}
              {analyzingId === task.id && (
                <div className="mt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 animate-pulse">
                   <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-indigo-300 shrink-0" />
                      <div className="h-2.5 bg-indigo-200/70 rounded w-32"></div>
                   </div>
                   <div className="space-y-1.5 pl-6">
                      <div className="h-2 bg-indigo-200/50 rounded w-full"></div>
                      <div className="h-2 bg-indigo-200/50 rounded w-3/4"></div>
                   </div>
                </div>
              )}

              {/* Conselho da IA */}
              {task.completed && task.ai_advice && (
                <div className="text-sm text-indigo-800 font-medium flex items-start gap-2 bg-indigo-50/80 p-3 rounded-lg border border-indigo-100 animate-in slide-in-from-top-2">
                  <Sparkles size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                  <span>{task.ai_advice}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Resumo Final (Aparece quando há tarefas concluídas) */}
      {completedTasks.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Edit3 size={18} className="text-[#F87A14]" />
             {t('checklist.summary_title')}
           </h3>
           
           <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
             {completedTasks.map(t => (
               <div key={t.id} className="relative pl-4 border-l-2 border-slate-200">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sobre: {t.text}</p>
                 <p className="text-slate-700 leading-relaxed italic mb-2">
                   {t.note ? `"${t.note}"` : <span className="text-slate-400 not-italic text-xs">— Sem nota registrada</span>}
                 </p>
                 {t.ai_advice && (
                   <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                     <Sparkles size={10} /> Insight: {t.ai_advice}
                   </p>
                 )}
               </div>
             ))}

             <div className="pt-4 mt-4 border-t border-slate-50 text-center">
               <p className="text-sm font-medium text-slate-500">
                 {language === 'pt' ? 'Reflexão concluída. Pequenas atitudes diárias constroem grandes transformações.' :
                  language === 'es' ? 'Reflexión completada. Pequeñas actitudes diarias construyen grandes transformaciones.' :
                  'Reflection complete. Small daily actions build great transformations.'}
               </p>
             </div>
           </div>
        </div>
      )}

      {/* Modal de Reflexão */}
      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <p className="text-xs font-bold text-[#F87A14] uppercase tracking-wider mb-2">Momento de Consciência</p>
              <h3 className="text-xl font-bold text-slate-800 leading-tight">
                "{selectedTask.text}"
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
               <label className="block text-sm font-medium text-slate-600 mb-2">
                 Como você vivenciou isso hoje?
               </label>
               <textarea
                 value={reflectionNote}
                 onChange={(e) => setReflectionNote(e.target.value)}
                 placeholder="Ex: Foi quando respirei fundo antes de responder..."
                 className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none resize-none h-24 transition-all"
                 autoFocus
               />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => confirmReflection(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Apenas Marcar
              </button>
              <button
                onClick={() => confirmReflection(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F87A14] hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} /> Confirmar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DailyChecklist;