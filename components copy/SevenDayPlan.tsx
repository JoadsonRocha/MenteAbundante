import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, Loader2, Save, Edit2, ChevronDown } from 'lucide-react';
import { DayPlan } from '../types';
import { db } from '../services/database';

const SevenDayPlan: React.FC = () => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
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

    const newPlan = plan.map(d => d.day === dayNum ? { ...d, completed: true } : d);
    setPlan(newPlan);
    await db.savePlan(newPlan);
    setEditingDay(null);
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

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-[#F87A14] mb-2">Plano de Ação 7 Dias</h2>
        <p className="text-slate-500">Operação Destravar: Escreva suas ações para construir sua nova mentalidade.</p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 transform md:-translate-x-1/2"></div>

        <div className="space-y-12">
          {plan.map((day, index) => {
            const isLeft = index % 2 === 0;
            const isLocked = index > 0 && !plan[index - 1].completed;
            const isEditing = editingDay === day.day;
            const showInput = !day.completed || isEditing;
            
            return (
              <div key={day.day} className={`relative flex items-start md:justify-between ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-slate-200 transform -translate-x-1/2 flex items-center justify-center z-10 mt-6">
                  {day.completed ? (
                    <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle size={14} />
                    </div>
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${isLocked ? 'bg-slate-300' : 'bg-[#F87A14]'}`}></div>
                  )}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${!isLeft && 'md:text-right'} ${isLeft && 'md:pr-12'} ${!isLeft && 'md:pl-12'}`}>
                  <div 
                    className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all ${
                      day.completed && !isEditing
                        ? 'border-emerald-400 shadow-emerald-100 bg-emerald-50/30' 
                        : isLocked 
                          ? 'border-slate-100 opacity-60' 
                          : 'border-white ring-1 ring-slate-100 shadow-lg shadow-slate-200/50'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className={`flex items-center gap-2 mb-3 ${!isLeft && 'md:flex-row-reverse'}`}>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        day.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Dia {day.day}
                      </span>
                      {isLocked ? <Lock size={14} className="text-slate-400" /> : <Unlock size={14} className="text-[#F87A14]" />}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-2 ${day.completed ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {day.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {day.description}
                    </p>

                    {/* Área de Interação */}
                    {!isLocked && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {showInput ? (
                          <div className="space-y-3 animate-fade-in">
                            <textarea
                              value={day.answer || ''}
                              onChange={(e) => handleInputChange(day.day, e.target.value)}
                              placeholder="Escreva sua resposta ou reflexão aqui..."
                              className={`w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all resize-none h-24 ${
                                !isLeft ? 'md:text-right' : 'text-left'
                              } ${day.completed ? 'border-emerald-200 focus:ring-emerald-200' : 'border-slate-200 focus:border-[#F87A14] focus:ring-orange-200'}`}
                            />
                            <div className={`flex ${!isLeft ? 'md:justify-end' : 'justify-start'}`}>
                              <button
                                onClick={() => saveDay(day.day)}
                                disabled={!day.answer?.trim()}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                                  !day.answer?.trim()
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                              >
                                <Save size={16} />
                                {day.completed ? 'Atualizar' : 'Concluir Dia'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative animate-fade-in">
                            <div className={`p-4 rounded-xl text-sm italic border ${
                               !isLeft ? 'md:text-right' : 'text-left'
                            } bg-white border-emerald-100 text-slate-600`}>
                              "{day.answer}"
                            </div>
                            <button
                              onClick={() => enableEdit(day.day)}
                              className={`absolute -top-3 ${isLeft ? 'right-2' : 'left-2 md:right-auto md:left-2'} bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-[#F87A14] hover:border-orange-300 shadow-sm transition-all opacity-0 group-hover:opacity-100`}
                              title="Editar resposta"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Empty spacer for alignment */}
                <div className="hidden md:block w-[45%]"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SevenDayPlan;