import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bell, BellOff, TrendingUp, Brain, Calendar, CheckCircle } from 'lucide-react';
import { db } from '../services/database';
import { ActivityLog, BeliefEntry } from '../types';

const ProgressStats: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [beliefCount, setBeliefCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    // Carregar dados
    const loadData = async () => {
      // Logs de tarefas
      const history = await db.getActivityLogs();
      // Preencher dias vazios para o gráfico ficar bonito (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const chartData = last7Days.map(date => {
        const found = history.find(h => h.date === date);
        // Formatar data para DD/MM
        const [_, month, day] = date.split('-');
        return {
          date: `${day}/${month}`,
          count: found ? found.count : 0
        };
      });
      setLogs(chartData as any);

      // Contagem de Crenças
      const beliefs = await db.getBeliefs();
      setBeliefCount(beliefs.length);
      
      // Estado de notificação local
      const savedReminder = localStorage.getItem('mente_reminders') === 'true';
      setRemindersEnabled(savedReminder && Notification.permission === 'granted');
    };
    loadData();
  }, []);

  const requestNotification = async () => {
    if (!('Notification' in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      setRemindersEnabled(true);
      localStorage.setItem('mente_reminders', 'true');
      new Notification("MindShift", {
        body: "Notificações ativadas! Lembraremos você de manter o foco.",
        icon: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
      });
    } else {
      setRemindersEnabled(false);
      localStorage.setItem('mente_reminders', 'false');
    }
  };

  const toggleReminders = () => {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      localStorage.setItem('mente_reminders', 'false');
    } else {
      requestNotification();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-[#F87A14]">Sua Evolução</h2>
        <p className="text-slate-500">Acompanhe sua consistência e transformação.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Reprogramações</p>
            <p className="text-4xl font-bold text-slate-800 mt-1">{beliefCount}</p>
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <Brain size={12} /> Crenças transformadas
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-[#F87A14] rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Foco na Semana</p>
            <p className="text-4xl font-bold text-slate-800 mt-1">
              {logs.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
             <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
              <CheckCircle size={12} /> Tarefas concluídas
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Consistência Diária (Últimos 7 dias)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={logs}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {logs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#10b981' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Cada barra representa o número de tarefas concluídas no checklist diário.
        </p>
      </div>

      {/* Notifications Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
            <Bell size={20} className="text-amber-400" /> Notificações de Foco
          </h3>
          <p className="text-slate-300 text-sm max-w-md">
            Receba lembretes diários para manter sua disciplina. A consistência é a chave para a mentalidade abundante.
          </p>
        </div>
        
        <button
          onClick={toggleReminders}
          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
            remindersEnabled 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200'
          }`}
        >
          {remindersEnabled ? (
            <>
              <CheckCircle size={18} /> Ativado
            </>
          ) : (
            <>
              <BellOff size={18} /> Ativar Lembretes
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default ProgressStats;