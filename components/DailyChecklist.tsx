import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, Calendar } from 'lucide-react';
import { DailyTask } from '../types';
import { db } from '../services/database';

const DailyChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Formata a data atual: "Segunda-feira, 25 de Outubro"
  const today = new Date();
  const dateString = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Carrega dados e gerencia o reset diário
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.getTasks();
        const lastDate = db.getLastChecklistDate();
        const currentDate = new Date().toISOString().split('T')[0];

        // Se a data salva for diferente da data atual, reseta o checklist
        if (lastDate && lastDate !== currentDate) {
          console.log("Novo dia detectado. Resetando checklist...");
          const resetTasks = data.map(t => ({ ...t, completed: false }));
          setTasks(resetTasks);
          await db.saveTasks(resetTasks);
          // Reinicia contagem de evolução para hoje
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

  const toggleTask = async (id: string) => {
    // Atualiza estado local
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    
    // Salva no banco (background)
    await db.saveTasks(newTasks);

    // Calcula o total de tarefas completas AGORA e define a evolução
    // Isso evita o erro de "ganhar pontos" apenas clicando e desclicando
    const completedCount = newTasks.filter(t => t.completed).length;
    await db.setActivityCount(completedCount);
  };

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F87A14]">Checklist Diário</h2>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
             <Calendar size={16} className="text-[#F87A14]" />
             <span className="text-sm capitalize font-medium">{dateString}</span>
          </div>
        </div>
        
        <span className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors self-start md:self-auto ${progress === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          {progress}% Completo
        </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`w-full flex items-center p-4 rounded-xl border transition-all duration-200 group ${
              task.completed 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div className={`mr-4 transition-all duration-300 transform ${task.completed ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-emerald-400'}`}>
              {task.completed ? <CheckCircle2 size={26} fill="currentColor" className="text-emerald-50" stroke="currentColor" /> : <Circle size={26} />}
            </div>
            <span className={`text-left text-lg font-medium transition-all ${task.completed ? 'text-emerald-800 line-through decoration-emerald-300 decoration-2 opacity-70' : 'text-slate-700'}`}>
              {task.text}
            </span>
          </button>
        ))}
      </div>
      
      <p className="mt-8 text-sm text-slate-400 text-center italic border-t border-slate-50 pt-4">
        "A disciplina diária é a ponte entre metas e conquistas."
      </p>
    </div>
  );
};

export default DailyChecklist;