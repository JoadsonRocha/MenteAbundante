import React, { useState, useEffect } from 'react';
import { Rocket, Clock, Loader2, Plus, CheckCircle2, Circle, Trash2, Calendar, Target, ChevronDown, ChevronUp, Cloud, Edit2, Check, X, ArrowRightCircle } from 'lucide-react';
import { db, generateUUID } from '../services/database';
import { generateActionPlan } from '../services/geminiService';
import { GoalPlan, GoalStep } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const SmartPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Estados para edição
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [tempStepText, setTempStepText] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      const data = await db.getGoalPlans();
      setPlans(data);
      if (data.length > 0) {
        setExpandedPlanId(data[0].id); // Expande o mais recente
      }
      setLoading(false);
    };
    loadPlans();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || !timeInput.trim()) return;

    setCreating(true);
    try {
      const generatedSteps = await generateActionPlan(goalInput, timeInput, language);
      
      const newPlan: GoalPlan = {
        id: generateUUID(),
        title: goalInput,
        timeframe: timeInput,
        steps: generatedSteps.map((s, idx) => ({
          id: generateUUID() + idx,
          text: s.text,
          timing: s.timing,
          completed: false
        })),
        is_completed: false,
        created_at: new Date().toISOString()
      };

      await db.saveGoalPlan(newPlan);
      setPlans([newPlan, ...plans]);
      setExpandedPlanId(newPlan.id);
      
      setGoalInput('');
      setTimeInput('');
      
    } catch (error) {
      alert("Houve um erro ao criar seu plano. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStep = async (planId: string, stepId: string) => {
    // Evita toggle se estiver editando este passo
    if (editingStepId === stepId) return;

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updatedSteps = plan.steps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const allCompleted = updatedSteps.every(s => s.completed);
    
    const updatedPlan = { ...plan, steps: updatedSteps, is_completed: allCompleted };
    
    // UI Update
    setPlans(plans.map(p => p.id === planId ? updatedPlan : p));
    
    // DB Update
    await db.saveGoalPlan(updatedPlan);

    // Se completou passo, loga atividade
    const step = plan.steps.find(s => s.id === stepId);
    if (step && !step.completed) {
       await db.logActivity(1); 
    }
  };

  // Funções de Edição
  const startEditingStep = (step: GoalStep) => {
    setEditingStepId(step.id);
    setTempStepText(step.text);
  };

  const cancelEditingStep = () => {
    setEditingStepId(null);
    setTempStepText('');
  };

  const saveStepEdit = async (planId: string, stepId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!tempStepText.trim()) return;

    const updatedSteps = plan.steps.map(s => 
      s.id === stepId ? { ...s, text: tempStepText } : s
    );
    
    const updatedPlan = { ...plan, steps: updatedSteps };
    
    // Optimistic Update
    setPlans(plans.map(p => p.id === planId ? updatedPlan : p));
    setEditingStepId(null);
    setTempStepText('');
    
    // DB Update
    await db.saveGoalPlan(updatedPlan);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar este plano?")) {
      // Optimistic Update: Remove da interface imediatamente
      const previousPlans = [...plans];
      setPlans(plans.filter(p => p.id !== id));
      if (expandedPlanId === id) setExpandedPlanId(null);

      try {
        await db.deleteGoalPlan(id);
      } catch (error) {
        console.error("Erro ao excluir", error);
        // Reverte se der erro fatal (raro, pois db.deleteGoalPlan engole erros de rede)
        setPlans(previousPlans); 
        alert("Ocorreu um erro ao excluir o plano. Tente novamente.");
      }
    }
  };

  // --- INTEGRAÇÃO: Adicionar ao Checklist ---
  const addToChecklist = async (text: string) => {
     try {
       const currentTasks = await db.getTasks();
       // Limita tarefas para não poluir
       if(currentTasks.length >= 20) {
         alert("Seu checklist já está cheio. Complete algumas tarefas antes.");
         return;
       }
       
       const newTask = {
          id: generateUUID(),
          text: `[PLANO] ${text}`,
          completed: false
       };
       
       await db.saveTasks([...currentTasks, newTask]);
       alert("Tarefa adicionada ao seu Checklist Diário com sucesso!");
     } catch(e) {
       console.error("Erro ao adicionar task", e);
     }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#F87A14]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Header Padronizado */}
      <div className="text-center space-y-3 px-2 mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14] flex items-center justify-center gap-2">
           <Rocket size={28} className="text-[#F87A14]" /> {t('planner.title')}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          {t('planner.subtitle')}
        </p>
      </div>

      {/* Input Creator */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('planner.label_goal')}</label>
                <div className="relative">
                   <Target className="absolute left-4 top-3.5 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={goalInput}
                     onChange={(e) => setGoalInput(e.target.value)}
                     placeholder={t('planner.placeholder_goal')}
                     className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all"
                   />
                </div>
             </div>
             
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('planner.label_time')}</label>
                <div className="relative">
                   <Clock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={timeInput}
                     onChange={(e) => setTimeInput(e.target.value)}
                     placeholder={t('planner.placeholder_time')}
                     className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all"
                   />
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={creating || !goalInput || !timeInput}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
               creating || !goalInput || !timeInput
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#F87A14] to-orange-500 text-white shadow-lg shadow-orange-200 hover:-translate-y-0.5'
            }`}
          >
            {creating ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> {t('planner.btn_generate')}</>}
          </button>
        </form>
      </div>

      {/* Plans List */}
      <div className="space-y-6">
         {plans.length === 0 && !creating && (
           <div className="text-center py-12 opacity-50">
              <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 whitespace-pre-line">{t('planner.empty_state')}</p>
           </div>
         )}

         {plans.map((plan) => {
           const isExpanded = expandedPlanId === plan.id;
           const completedSteps = plan.steps.filter(s => s.completed).length;
           const progress = Math.round((completedSteps / plan.steps.length) * 100);

           return (
             <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                {/* Plan Header */}
                <div 
                   onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                   className="p-5 cursor-pointer bg-slate-50/50 flex items-center justify-between"
                >
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${plan.is_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-[#F87A14]'}`}>
                         {plan.is_completed ? <CheckCircle2 size={24} /> : <Target size={24} />}
                      </div>
                      <div className="min-w-0">
                         <h3 className="font-bold text-slate-800 truncate text-lg">{plan.title}</h3>
                         <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock size={12} /> {plan.timeframe}
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1" title="Sincronizado com o Banco de Dados">
                              <Cloud size={12} className="text-emerald-500" /> Salvo na nuvem
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="hidden md:block w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                   </div>
                </div>

                {/* Steps List */}
                {isExpanded && (
                   <div className="border-t border-slate-100 animate-fade-in">
                      <div className="p-2 space-y-1">
                         {plan.steps.map((step) => (
                            <div 
                              key={step.id}
                              onClick={() => { if(editingStepId !== step.id) toggleStep(plan.id, step.id); }}
                              className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors group ${step.completed ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                            >
                               <div className={`mt-0.5 shrink-0 ${step.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                                  {step.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                               </div>

                               <div className="flex-1 min-w-0">
                                  {editingStepId === step.id ? (
                                      <div className="flex items-center gap-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                                          <input
                                             type="text"
                                             value={tempStepText}
                                             onChange={(e) => setTempStepText(e.target.value)}
                                             className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-200 bg-white w-full"
                                             autoFocus
                                             onKeyDown={(e) => {
                                               if(e.key === 'Enter') saveStepEdit(plan.id, step.id);
                                               if(e.key === 'Escape') cancelEditingStep();
                                             }}
                                          />
                                          <button 
                                            onClick={() => saveStepEdit(plan.id, step.id)}
                                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                          >
                                            <Check size={16} />
                                          </button>
                                          <button 
                                            onClick={cancelEditingStep}
                                            className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                          >
                                            <X size={16} />
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex justify-between items-start gap-2">
                                         <div className="flex-1">
                                            <p className={`text-sm font-medium ${step.completed ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-700'}`}>
                                              {step.text}
                                            </p>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                               {step.timing}
                                            </span>
                                         </div>
                                         
                                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                               onClick={(e) => { e.stopPropagation(); addToChecklist(step.text); }}
                                               className="p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                               title="Adicionar ao Checklist Diário"
                                            >
                                               <ArrowRightCircle size={16} />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); startEditingStep(step); }}
                                              className="p-1.5 text-slate-300 hover:text-[#F87A14] hover:bg-orange-50 rounded-lg transition-all"
                                              title="Editar Tarefa"
                                            >
                                              <Edit2 size={16} />
                                            </button>
                                         </div>
                                      </div>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                      
                      <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                           className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 size={14} /> Excluir Plano
                         </button>
                      </div>
                   </div>
                )}
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default SmartPlanner;