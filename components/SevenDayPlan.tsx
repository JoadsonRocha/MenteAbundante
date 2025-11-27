import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, Loader2 } from 'lucide-react';
import { DayPlan } from '../types';
import { db } from '../services/database';

const SevenDayPlan: React.FC = () => {
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);

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

  const toggleDay = async (dayNum: number) => {
    const newPlan = plan.map(d => d.day === dayNum ? { ...d, completed: !d.completed } : d);
    setPlan(newPlan);
    await db.savePlan(newPlan);
  };

  if (loading) {
     return (
      <div className="max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Plano de Ação 7 Dias</h2>
        <p className="text-slate-500">Operação Destravar: Siga o roteiro para construir sua nova mentalidade.</p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 transform md:-translate-x-1/2"></div>

        <div className="space-y-12">
          {plan.map((day, index) => {
            const isLeft = index % 2 === 0;
            const isLocked = index > 0 && !plan[index - 1].completed;
            
            return (
              <div key={day.day} className={`relative flex items-center md:justify-between ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-slate-200 transform -translate-x-1/2 flex items-center justify-center z-10">
                  {day.completed ? (
                    <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <CheckCircle size={14} />
                    </div>
                  ) : (
                    <div className={`w-3 h-3 rounded-full ${isLocked ? 'bg-slate-300' : 'bg-amber-400'}`}></div>
                  )}
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${!isLeft && 'md:text-right'} ${isLeft && 'md:pr-12'} ${!isLeft && 'md:pl-12'}`}>
                  <div 
                    onClick={() => toggleDay(day.day)}
                    className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all cursor-pointer hover:-translate-y-1 ${
                      day.completed 
                        ? 'border-emerald-400 shadow-emerald-100' 
                        : isLocked 
                          ? 'border-slate-100 opacity-60' 
                          : 'border-white hover:border-amber-200 shadow-slate-200'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-2 ${!isLeft && 'md:flex-row-reverse'}`}>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        day.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Dia {day.day}
                      </span>
                      {isLocked ? <Lock size={14} className="text-slate-400" /> : <Unlock size={14} className="text-amber-500" />}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-2 ${day.completed ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {day.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {day.description}
                    </p>
                  </div>
                </div>

                {/* Empty spacer */}
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