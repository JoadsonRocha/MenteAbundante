import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Previne o mini-infobar padrão no mobile
      e.preventDefault();
      // Salva o evento para disparar depois
      setDeferredPrompt(e);
      // Mostra nosso banner UI
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se já foi instalado
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('App instalado com sucesso');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt nativo
    deferredPrompt.prompt();

    // Espera a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalação');
    } else {
      console.log('Usuário recusou instalação');
    }
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-bold text-lg">M</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">Instalar MindShift</h4>
            <p className="text-xs text-slate-400">Acesse offline e mais rápido</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <button
            onClick={handleInstallClick}
            className="bg-white text-slate-900 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors"
          >
            <Download size={14} /> Instalar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;