import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Save, Key, LogOut, CheckCircle2, AlertCircle, Loader2, Sparkles, Camera, ScrollText, PenTool } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, supabase } from '../services/database';
import { UserProfile } from '../types';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useLanguage } from '../contexts/LanguageContext';
// Import do OneSignal ID removido

const UserProfileComponent: React.FC = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', mantra: '', statement: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State para mudança de senha
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // State para seção de Declaração
  const [showStatementSection, setShowStatementSection] = useState(false);
  
  // State para modal de privacidade
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 1. Carrega dados vitais do banco (PERFIL)
        const data = await db.getProfile();
        if (data) {
          setProfile(data);
          if (data.statement) setShowStatementSection(true);
        } else if (user?.email) {
          // Default se não tiver perfil
          setProfile({
            full_name: user.email.split('@')[0],
            mantra: 'Minha mente cria minha realidade.',
            statement: ''
          });
        }
      } catch (e) {
        console.error("Erro ao carregar perfil", e);
      } finally {
        // 2. Libera a UI IMEDIATAMENTE após carregar dados do banco
        setLoading(false);
      }
      // OneSignal ID fetch removido
    };
    
    loadProfile();
  }, [user]);

  // Função para comprimir e redimensionar a imagem
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; 
          const scaleSize = MAX_WIDTH / img.width;
          const height = img.height * (scaleSize > 1 ? 1 : scaleSize);
          const width = img.width * (scaleSize > 1 ? 1 : scaleSize);

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setSaving(true);
        const resizedImage = await resizeImage(file);
        setProfile(prev => ({ ...prev, imagem: resizedImage }));
        setMessage({ type: 'success', text: 'Foto processada! Clique em Salvar Alterações.' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao processar imagem.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUseTemplate = () => {
    const template = `Eu, [SEU NOME], tenho o objetivo definitivo de acumular a quantia de [VALOR] até o dia [DATA].

Em troca desse dinheiro, darei o melhor de mim na posição de [SUA PROFISSÃO/SERVIÇO], entregando a maior quantidade e a melhor qualidade possível de serviço.

Acredito firmemente que terei esse dinheiro em minhas mãos. Minha fé é tão forte que já posso ver esse dinheiro diante dos meus olhos. Posso tocá-lo com as mãos. Ele está agora à espera de ser transferido para mim na proporção em que eu entregar o serviço que pretendo dar em troca.

Estou seguindo um plano para acumular esse dinheiro e começo agora mesmo a colocar esse plano em ação.`;
    
    setProfile(prev => ({ ...prev, statement: template }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await db.updateProfile(profile);
      
      if (showPasswordSection && newPassword) {
        if (!supabase) {
           throw new Error("Alteração de senha indisponível no modo offline.");
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
        setShowPasswordSection(false);
      }

      setMessage({ type: 'success', text: '✅ Perfil atualizado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      if (err.message?.includes('imagem') || err.message?.includes('column')) {
        setMessage({ 
          type: 'error', 
          text: 'Erro de Banco de Dados: Colunas novas ainda não criadas. As alterações básicas foram salvas.' 
        });
      } else {
        setMessage({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const initialLetter = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      
      <div className="text-center mb-6">
        <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-amber-200 shadow-xl shadow-amber-100 flex items-center justify-center bg-gradient-to-br from-[#F87A14] to-orange-500 relative bg-white">
               {profile.imagem ? (
                 <img src={profile.imagem} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-white text-5xl font-bold">{initialLetter}</span>
               )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <Camera className="text-white" size={32} />
            </div>
            <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-[#F87A14] border border-slate-100">
               <Camera size={16} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
        </div>

        <h2 className="text-4xl font-extrabold text-[#F87A14]">{t('profile.title')}</h2>
        <p className="text-slate-500">{t('profile.subtitle')}</p>
        
        {!supabase && (
            <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
               Modo Offline
            </span>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className={`transition-all duration-300 overflow-hidden ${message ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          {message && (
            <div className={`p-4 flex items-center justify-center gap-2 text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email (Login)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full pl-11 p-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('profile.label_name')}</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder={t('profile.placeholder_name')}
              />
            </div>
          </div>

          {/* Mantra */}
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
               <Sparkles size={12} className="text-[#F87A14]" /> {t('profile.label_mantra')}
             </label>
             <input
                value={profile.mantra}
                onChange={(e) => setProfile({ ...profile, mantra: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all bg-amber-50/30 placeholder:text-slate-400/80"
                placeholder={t('profile.placeholder_mantra')}
             />
          </div>

          {/* Declaração de Objetivo Principal */}
          <div className="pt-2">
            <button 
              type="button"
              onClick={() => setShowStatementSection(!showStatementSection)}
              className="w-full bg-slate-900 text-amber-400 px-4 py-3 rounded-xl font-bold flex items-center justify-between hover:bg-slate-800 transition-colors border border-amber-900/30 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ScrollText size={20} />
                Declaração de Objetivo Principal
              </div>
              <PenTool size={16} />
            </button>
            
            {showStatementSection && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in space-y-3">
                 <div className="flex justify-between items-start">
                   <p className="text-xs text-slate-500 leading-relaxed mb-2">
                     Defina seu objetivo principal de forma clara e objetiva. Esta declaração aparecerá toda vez que você abrir o app para reforçar seu subconsciente.
                   </p>
                   <button 
                     type="button"
                     onClick={handleUseTemplate}
                     className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold hover:bg-amber-200 transition-colors whitespace-nowrap"
                   >
                     Usar Modelo
                   </button>
                 </div>
                 
                 <textarea
                    value={profile.statement || ''}
                    onChange={(e) => setProfile({ ...profile, statement: e.target.value })}
                    className="w-full p-4 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none h-64 text-slate-800 bg-white font-serif leading-relaxed text-base shadow-inner"
                    placeholder="Escreva aqui seu objetivo definitivo principal..."
                 />
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-slate-100">
             <button 
               type="button"
               onClick={() => setShowPasswordSection(!showPasswordSection)}
               disabled={!supabase}
               className={`text-sm font-bold flex items-center gap-2 transition-colors ${!supabase ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-[#F87A14]'}`}
               title={!supabase ? "Indisponível offline" : ""}
             >
               <Key size={16} /> {showPasswordSection ? 'Cancelar' : t('profile.btn_password')}
             </button>

             {showPasswordSection && supabase && (
                <div className="mt-4 animate-fade-in">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 mt-1 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
             )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-[#F87A14] to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {t('profile.btn_save')}</>}
            </button>
          </div>

        </form>
      </div>

      <div className="text-center space-y-4">
        {/* OneSignal ID Display Removido */}

        <button
          onClick={signOut}
          className="text-red-400 hover:text-red-500 hover:bg-red-50 px-6 py-2 rounded-full transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <LogOut size={16} /> {t('profile.btn_logout')}
        </button>

        <div className="pt-4">
          <button 
             onClick={() => setShowPrivacy(true)}
             className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
             {t('auth.terms')}
          </button>
        </div>
      </div>
      
      {/* Modal de Privacidade */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

export default UserProfileComponent;