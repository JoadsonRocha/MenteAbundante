import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, Loader2, Save, Edit2, Clock, ArrowRightCircle, Calendar } from 'lucide-react';
import { DayPlan, Tab } from '../types';
import { db } from '../services/database';
import { analyzePlanAction } from '../services/geminiService';
import { SEVEN_DAY_PLAN } from '../constants';

interface SevenDayPlanProps {
  onNavigate: (tab: Tab) => void;
}

const SevenDayPlan: React.FC<SevenDayPlanProps> = ({ onNavigate }) => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDay, setProcessingDay] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.getPlan();
        setPlan(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (dayNum: number, text: string) => {
    const newPlan = plan.map(d => d.day === dayNum ? { ...d, answer: text } : d);
    setPlan(newPlan);
  };

  const saveDay = async (dayNum: number) => {
    const day = plan.find(d => d.day === dayNum);
    if (!day || !day.answer?.trim()) return;

    setProcessingDay(dayNum);
    
    try {
      // 1. Gera feedback da IA
      const feedback = await analyzePlanAction(day.title, day.answer);

      // 2. Atualiza o estado local com feedback, completado e DATA DE CONCLUSÃO
      const newPlan = plan.map(d => d.day === dayNum ? { 
        ...d, 
        completed: true,
        ai_feedback: feedback,
        completed_at: new Date().toISOString() // Salva timestamp atual
      } : d);
      
      setPlan(newPlan);
      
      // 3. Salva no Banco
      await db.savePlan(newPlan);
      
      // 4. Integração com Evolução: Adiciona ponto no gráfico de atividades
      await db.logActivity(1);

      setEditingDay(null);
    } catch (error) {
      console.error("Erro ao salvar dia", error);
    } finally {
      setProcessingDay(null);
    }
  };

  const enableEdit = (dayNum: number) => {
    setEditingDay(dayNum);
  };

  if (loading) {
     return (
      <div className="max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const completedCount = plan.filter(d => d.completed).length;
  const progress = Math.round((completedCount / 7) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
      
      {/* Header Padronizado */}
      <div className="text-center space-y-3 px-2 mb-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#F87A14] flex items-center justify-center gap-2">
           <Calendar className="text-[#F87A14]" size={28} /> Plano de Ação 7 Dias
        </h2>
        <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto">
          Operação Destravar: Construa sua nova mentalidade passo a passo.
        </p>
        
        {/* Barra de Progresso Geral */}
        <div className="max-w-md mx-auto flex items-center gap-3 mt-4">
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" 
               style={{ width: `${progress}%` }}
             ></div>
          </div>
          <span className="text-sm font-bold text-slate-400">{progress}%</span>
        </div>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 transform md:-translate-x-1/2"></div>

        <div className="space-y-12">
          {plan.map((day, index) => {
            const isLeft = index % 2 === 0;
            
            // Lógica de Bloqueio (Lock Logic)
            let isLocked = false;
            let waitMode = false; // Indica se está bloqueado "esperando o dia seguinte"

            if (index > 0) {
              const prevDay = plan[index - 1];
              if (!prevDay.completed) {
                // Se o anterior não foi completado, bloqueia este
                isLocked = true;
              } else if (prevDay.completed_at) {
                 // Se o anterior foi completado, verifica se foi HOJE
                 const completedDate = new Date(prevDay.completed_at).setHours(0,0,0,0);
                 const today = new Date().setHours(0,0,0,0);
                 
                 // Se completou hoje (ou data futura/errada), trava o próximo
                 if (completedDate >= today) {
                    isLocked = true;
                    waitMode = true;
                 }
              } else {
                 isLocked = false; 
              }
            }

            const isEditing = editingDay === day.day;
            const showInput = (!day.completed || isEditing);
            const isProcessing = processingDay === day.day;
            
            return (
              <div key={day.day} className={`relative flex items-start md:justify-between ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-slate-200 transform -translate-x-1/2 flex items-center justify-center z-10 mt-6 transition-all duration-500">
                  {day.completed ? (
                    <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <CheckCircle size={14} />
                    </div>
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${isLocked ? 'bg-slate-300' : 'bg-[#F87A14]'}`}></div>
                  )}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${!isLeft && 'md:text-right'} ${isLeft && 'md:pr-12'} ${!isLeft && 'md:pl-12'}`}>
                  <div 
                    className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 ${
                      day.completed && !isEditing
                        ? 'border-emerald-400 shadow-emerald-100 bg-white' 
                        : isLocked 
                          ? 'border-slate-100 opacity-60' 
                          : 'border-white ring-1 ring-slate-100 shadow-lg shadow-slate-200/50'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className={`flex items-center gap-2 mb-3 ${!isLeft && 'md:flex-row-reverse'}`}>
                      <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        day.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Dia {day.day}
                      </span>
                      {isLocked ? (
                        waitMode ? (
                           <div className="flex items-center gap-1 text-amber-500" title="Disponível amanhã">
                             <Clock size={14} />
                             <span className="text-[10px] font-bold uppercase hidden sm:inline">Amanhã</span>
                           </div>
                        ) : (
                           <Lock size={14} className="text-slate-400" />
                        )
                      ) : <Unlock size={14} className="text-[#F87A14]" />}
                    </div>
                    
                    {/* Title with Mobile Font Size (18px = text-lg) */}
                    <h3 className={`text-lg md:text-xl font-bold mb-2 leading-tight ${day.completed ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {day.title}
                    </h3>
                    {/* Description with Mobile Font Size (16px = text-base) */}
                    <p className="text-slate-600 text-base leading-relaxed mb-4">
                      {day.description}
                    </p>
                    
                    {/* INTEGRAÇÃO: Atalho para Reprogramação no Dia 1 */}
                    {day.day === 1 && !day.completed && !isLocked && (
                      <button 
                        onClick={() => onNavigate('reprogram')}
                        className="mb-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 inline-flex"
                      >
                         <ArrowRightCircle size={14} /> Usar Ferramenta de Reprogramação
                      </button>
                    )}

                    {/* Aviso de Espera (Wait Mode) */}
                    {waitMode && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                        <Clock size={16} className="shrink-0" />
                        <span className="text-left">
                          Ótimo progresso! Para absorver o aprendizado, o próximo passo será liberado amanhã.
                        </span>
                      </div>
                    )}

                    {/* Área de Interação */}
                    {!isLocked && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {showInput ? (
                          <div className="space-y-4 animate-fade-in">
                            <textarea
                              value={day.answer || ''}
                              onChange={(e) => handleInputChange(day.day, e.target.value)}
                              disabled={isProcessing}
                              placeholder="Escreva sua resposta ou reflexão aqui..."
                              // text-base para evitar zoom
                              className={`w-full p-4 rounded-xl border text-base outline-none focus:ring-2 transition-all resize-none h-32 leading-relaxed ${
                                !isLeft ? 'md:text-right' : 'text-left'
                              } ${day.completed ? 'border-emerald-200 focus:ring-emerald-200' : 'border-slate-200 focus:border-[#F87A14] focus:ring-orange-200'}`}
                            />
                            <div className={`flex ${!isLeft ? 'md:justify-end' : 'justify-start'}`}>
                              <button
                                onClick={() => saveDay(day.day)}
                                disabled={!day.answer?.trim() || isProcessing}
                                className={`px-5 py-3 rounded-xl text-base font-bold flex items-center gap-2 transition-all ${
                                  !day.answer?.trim() || isProcessing
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                              >
                                {isProcessing ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" /> Analisando...
                                  </>
                                ) : (
                                  <>
                                    <Save size={18} />
                                    {day.completed ? 'Atualizar' : 'Concluir Dia'}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-fade-in">
                             {/* Resposta do Usuário */}
                             <div className="group relative">
                                <div className={`p-4 rounded-xl text-base italic border ${
                                   !isLeft ? 'md:text-right' : 'text-left'
                                } bg-slate-50 border-slate-200 text-slate-600 leading-relaxed`}>
                                  "{day.answer}"
                                </div>
                                <button
                                  onClick={() => enableEdit(day.day)}
                                  className={`absolute -top-3 ${isLeft ? 'right-2' : 'left-2 md:right-auto md:left-2'} bg-white border border-slate-200 text-slate-400 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-[#F87A14]`}
                                  title="Editar resposta"
                                >
                                  <Edit2 size={14} />
                                </button>
                             </div>

                             {/* Feedback da IA */}
                             {day.ai_feedback && (
                               <div className={`p-4 rounded-xl text-sm bg-indigo-50 border border-indigo-100 text-indigo-800 leading-relaxed ${
                                 !isLeft ? 'md:text-right' : 'text-left'
                               }`}>
                                 <span className="block text-xs font-bold text-indigo-500 uppercase mb-1">Feedback do Mentor</span>
                                 {day.ai_feedback}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SevenDayPlan;