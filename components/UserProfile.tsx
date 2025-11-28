import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Save, Key, LogOut, CheckCircle, AlertCircle, Loader2, Sparkles, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, supabase } from '../services/database';
import { UserProfile } from '../types';

const UserProfileComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', mantra: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State para mudança de senha
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await db.getProfile();
        if (data) {
          setProfile(data);
        } else if (user?.email) {
          // Default se não tiver perfil
          setProfile({
            full_name: user.email.split('@')[0],
            mantra: 'Minha mente cria minha realidade.'
          });
        }
      } catch (e) {
        console.error("Erro ao carregar perfil", e);
      } finally {
        setLoading(false);
      }
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
          const MAX_WIDTH = 300; // Reduz para 300px para caber no banco como texto
          const scaleSize = MAX_WIDTH / img.width;
          const height = img.height * (scaleSize > 1 ? 1 : scaleSize);
          const width = img.width * (scaleSize > 1 ? 1 : scaleSize);

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Converte para JPEG com qualidade 0.7
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
        // Comprime a imagem antes de salvar no state
        const resizedImage = await resizeImage(file);
        setProfile(prev => ({ ...prev, imagem: resizedImage })); // Usa 'imagem'
        setMessage({ type: 'success', text: 'Foto processada! Clique em Salvar Alterações.' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao processar imagem.' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await db.updateProfile(profile);
      
      // Se houver senha nova para atualizar
      if (showPasswordSection && newPassword) {
        if (!supabase) throw new Error("Erro de conexão");
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword('');
        setShowPasswordSection(false);
      }

      setMessage({ type: 'success', text: '✅ Perfil e frase de poder salvos com sucesso!' });
      
      // Limpa mensagem após 3s
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // Mensagem amigável se o erro for a coluna faltando
      if (err.message?.includes('imagem') || err.message?.includes('column')) {
        setMessage({ 
          type: 'error', 
          text: 'Erro de Banco de Dados: A coluna "imagem" não existe. Verifique se o comando SQL foi rodado corretamente.' 
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
            {/* Overlay da Câmera */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <Camera className="text-white" size={32} />
            </div>
            {/* Ícone de edição pequeno */}
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

        <h2 className="text-4xl font-extrabold text-[#F87A14]">Seu Perfil</h2>
        <p className="text-slate-500">Clique na foto para alterar sua imagem.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Barra de mensagem de feedback no topo do card */}
        <div className={`transition-all duration-300 overflow-hidden ${message ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          {message && (
            <div className={`p-4 flex items-center justify-center gap-2 text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          
          {/* Email Read-only */}
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

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Como prefere ser chamado?</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full pl-11 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Seu nome"
              />
            </div>
          </div>

          {/* Mantra / Bio */}
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
               <Sparkles size={12} className="text-[#F87A14]" /> Sua Frase de Poder (Mantra)
             </label>
             <textarea
                value={profile.mantra}
                onChange={(e) => setProfile({ ...profile, mantra: e.target.value })}
                className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-[#F87A14] focus:ring-1 focus:ring-orange-500 transition-all resize-none h-28 text-slate-700 italic bg-amber-50/30 text-lg placeholder:text-slate-400/80"
                placeholder="Declare sua nova identidade. Ex: 'Sou disciplinado, conquisto meus objetivos e transformo desafios em força.'"
             />
             <p className="text-xs text-slate-400 text-right">Esta frase guiará sua mentalidade diária.</p>
          </div>

          {/* Alterar Senha Toggle */}
          <div className="pt-4 border-t border-slate-100">
             <button 
               type="button"
               onClick={() => setShowPasswordSection(!showPasswordSection)}
               className="text-sm font-bold text-slate-500 hover:text-[#F87A14] flex items-center gap-2 transition-colors"
             >
               <Key size={16} /> {showPasswordSection ? 'Cancelar alteração de senha' : 'Alterar Senha'}
             </button>

             {showPasswordSection && (
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
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
            </button>
          </div>

        </form>
      </div>

      <div className="text-center">
        <button
          onClick={signOut}
          className="text-red-400 hover:text-red-500 hover:bg-red-50 px-6 py-2 rounded-full transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>

    </div>
  );
};

export default UserProfileComponent;