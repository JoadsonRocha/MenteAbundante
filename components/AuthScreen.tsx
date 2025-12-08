import React, { useState } from 'react';
import { supabase } from '../services/database';
import { Loader2, Mail, Lock, ArrowRight, UserPlus, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const AuthScreen: React.FC = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!supabase) {
       setError(t('auth.error_generic'));
       setLoading(false);
       return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
           setSuccessMessage(t('auth.success_created'));
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSuccessMessage(t('auth.success_created')); // Reutilizando msg de sucesso genérica ou criar uma specifica
      setIsLogin(true);
      setIsRecovery(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setIsRecovery(false);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 animate-fade-in relative z-10">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F87A14] rounded-full blur-[60px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Language Switcher posicionado dentro do card (Header) */}
          <div className="absolute top-6 right-6 z-20">
             <LanguageSwitcher compact />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 bg-white/10 p-3 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
              <Logo size={48} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('auth.header_title')}</h1>
            <p className="text-slate-400 text-sm">{t('auth.header_subtitle')}</p>
          </div>
        </div>

        {/* Tabs */}
        {!isRecovery && (
          <div className="flex p-2 bg-slate-50 border-b border-slate-100">
            <button
              onClick={() => toggleTab(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                isLogin 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('auth.tab_login')}
            </button>
            <button
              onClick={() => toggleTab(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                !isLogin 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('auth.tab_register')}
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-8">
          {isRecovery ? (
            // Recovery Form
            <form onSubmit={handleRecovery} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{t('auth.recover_title')}</h3>
                <p className="text-sm text-slate-500">{t('auth.recover_desc')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('auth.email_label')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 z-10" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:border-[#F87A14] focus:ring-1 focus:ring-orange-200 outline-none transition-all placeholder:text-slate-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} /> {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>{t('auth.btn_send_link')} <KeyRound size={18} /></>}
              </button>

              <button
                type="button"
                onClick={() => setIsRecovery(false)}
                className="w-full py-2 text-slate-400 font-medium text-sm hover:text-slate-600 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> {t('auth.back_login')}
              </button>
            </form>
          ) : (
            // Auth Form (Login/Register)
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('auth.email_label')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 z-10" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:border-[#F87A14] focus:ring-1 focus:ring-orange-200 outline-none transition-all placeholder:text-slate-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('auth.password_label')}</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => setIsRecovery(true)}
                      className="text-xs font-bold text-[#F87A14] hover:underline"
                    >
                      {t('auth.forgot_password')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400 z-10" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:border-[#F87A14] focus:ring-1 focus:ring-orange-200 outline-none transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0" /> 
                  <span className="leading-tight">{error}</span>
                </div>
              )}
              
              {successMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="leading-tight">{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#F87A14] to-orange-500 text-white rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-orange-200 shadow-md"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : isLogin ? (
                  <>{t('auth.btn_login')} <ArrowRight size={20} /></>
                ) : (
                  <>{t('auth.btn_register')} <UserPlus size={20} /></>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
             <button 
               onClick={() => setShowPrivacy(true)}
               className="text-xs text-slate-300 hover:text-slate-500 transition-colors"
             >
               {t('auth.terms')}
             </button>
          </div>
        </div>
      </div>
      
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default AuthScreen;