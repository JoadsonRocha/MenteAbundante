import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { DailyTask } from '../types';
import { db } from '../services/database';

const DailyChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega dados do "Banco" ao iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.getTasks();
        setTasks(data);
      } catch (error) {
        console.error("Erro ao carregar tarefas", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleTask = async (id: string) => {
    // Otimistic Update: Atualiza a UI antes do banco para parecer instantâneo
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    
    // Salva no banco (background)
    await db.saveTasks(newTasks);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Checklist Diário</h2>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
          {progress}% Completo
        </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-emerald-500 h-full transition-all duration-500 ease-out"
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
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className={`mr-4 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-400'}`}>
              {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </div>
            <span className={`text-left text-lg ${task.completed ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-700'}`}>
              {task.text}
            </span>
          </button>
        ))}
      </div>
      
      <p className="mt-6 text-sm text-slate-400 text-center italic">
        "A disciplina te leva a terminar."
      </p>
    </div>
  );
};

export default DailyChecklist;