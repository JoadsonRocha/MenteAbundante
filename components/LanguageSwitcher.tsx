import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const handleCycle = () => {
    if (language === 'pt') setLanguage('en');
    else if (language === 'en') setLanguage('es');
    else setLanguage('pt');
  };

  return (
    <button 
      onClick={handleCycle}
      className={`flex items-center gap-2 text-slate-400 hover:text-[#F87A14] transition-colors rounded-lg ${compact ? 'justify-center p-2' : 'px-4 py-2 hover:bg-slate-50'}`}
      title="Mudar Idioma / Change Language / Cambiar Idioma"
    >
      <Globe size={18} />
      {!compact && (
        <span className="text-xs font-bold uppercase tracking-wider">
          {language === 'pt' ? 'Português' : language === 'en' ? 'English' : 'Español'}
        </span>
      )}
      {compact && (
        <span className="text-[10px] font-bold uppercase">
            {language.toUpperCase()}
        </span>
      )}
    </button>
  );
};

export default LanguageSwitcher;