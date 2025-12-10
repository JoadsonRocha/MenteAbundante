import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bell, BellOff, TrendingUp, Brain, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { db } from '../services/database';
import { ActivityLog, BeliefEntry } from '../types';
import { requestNotificationPermission, isPushEnabled } from '../services/notificationService';

const ProgressStats: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [beliefCount, setBeliefCount] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);

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
      
      // Checar status do OneSignal
      const enabled = await isPushEnabled();
      setRemindersEnabled(enabled);
    };
    loadData();
  }, []);

  const toggleReminders = async () => {
    setLoadingToggle(true);
    try {
      if (remindersEnabled) {
        // Desativar (Opt-out)
        if (window.OneSignal) {
           await window.OneSignal.User.PushSubscription.optOut();
        }
        setRemindersEnabled(false);
      } else {
        // Ativar (Opt-in via Slidedown ou Nativo)
        await requestNotificationPermission();
        
        // Verifica novamente após um breve delay para atualizar UI
        // (O usuário precisa aceitar o prompt do navegador)
        setTimeout(async () => {
           const enabled = await isPushEnabled();
           setRemindersEnabled(enabled);
           setLoadingToggle(false);
        }, 1000); // Check rápido
        
        // Listener global no service worker cuidará do resto
        return; 
      }
    } catch (e) {
      console.error("Erro ao alterar notificações", e);
    } finally {
      // Se for desativar, remove o loading logo. Se for ativar, o timeout cuida (ou o listener)
      if (remindersEnabled) setLoadingToggle(false); 
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
          disabled={loadingToggle}
          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
            remindersEnabled 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200'
          }`}
        >
          {loadingToggle ? (
             <Loader2 size={18} className="animate-spin" />
          ) : remindersEnabled ? (
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