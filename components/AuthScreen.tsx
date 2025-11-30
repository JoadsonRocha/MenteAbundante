import React, { useState } from 'react';
import { supabase } from '../services/database';
import { Loader2, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false); // Novo estado para tela de recuperação
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        setEmail('');
        setPassword('');
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        setEmail('');
        setPassword('');
        
        if (data.session) {
           // Login automático
        } else {
           setSuccessMessage("Conta criada com sucesso! Verifique seu email para confirmar ou faça login.");
           setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Redireciona para a própria página, onde o usuário logado poderá trocar a senha no perfil
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      
      if (error) throw error;

      setSuccessMessage("Instruções de recuperação enviadas para seu email!");
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setIsRecovery(false);
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200 rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200 rounded-full blur-[120px] opacity-30"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10">
        
        {/* Header Visual */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F87A14] rounded-full blur-[60px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 shadow-lg shadow-orange-500/20 rounded-3xl">
              <Logo size={72} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">MindRise</h1>
            <p className="text-slate-400 text-sm">Mentalidade Abundante & Vitoriosa</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8">
          
          {/* Mensagens de Feedback */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-600 text-sm animate-fade-in">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRecovery ? (
            /* --- TELA DE RECUPERAÇÃO --- */
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                  <KeyRound className="text-[#F87A14]" size={20} /> Recuperar Conta
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Digite seu email para receber o link de redefinição de senha.
                </p>
              </div>

              <form onSubmit={handleRecovery} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#F87A14] to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Enviar Link de Recuperação"}
                </button>
              </form>

              <button
                onClick={() => setIsRecovery(false)}
                className="w-full mt-4 py-3 text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </button>
            </div>
          ) : (
            /* --- TELA DE LOGIN / CADASTRO --- */
            <div className="animate-fade-in">
              {/* Toggle Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                <button
                  onClick={() => toggleTab(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => toggleTab(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                      className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all bg-slate-50 focus:bg-white"
                      required
                      minLength={6}
                    />
                  </div>
                  {/* Link Esqueci Minha Senha */}
                  {isLogin && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecovery(true);
                          setSuccessMessage(null);
                          setError(null);
                        }}
                        className="text-xs font-semibold text-[#F87A14] hover:text-orange-700 transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-[#F87A14] to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : isLogin ? (
                    <>
                      Entrar <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Criar Conta Grátis
                    </>
                  )}
                </button>
              </form>

              {!isLogin && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-400">
                    Ao criar conta, você aceita nossa{' '}
                    <button 
                      onClick={() => setShowPrivacy(true)}
                      className="text-slate-500 font-bold hover:text-[#F87A14] hover:underline transition-colors"
                    >
                      Política de Privacidade
                    </button>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Privacidade */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default AuthScreen;