import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import Logo from './Logo';

interface InstallBannerProps {
  installAction: () => void;
  deferredPrompt: any;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ installAction, deferredPrompt }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Se temos um prompt de instalação disponível, mostramos o banner
    if (deferredPrompt) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-slide-up pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Logo size={40} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Instalar MindRise</h4>
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
            onClick={installAction}
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