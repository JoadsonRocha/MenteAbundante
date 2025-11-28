import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Brain, Calendar, CheckSquare, Eye, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Bem-vindo(a) Vencedor(a)!",
    description: "Você acaba de dar o primeiro passo para transformar sua mentalidade. Este app é sua ferramenta diária para construir uma vida abundante.",
    icon: <Sparkles size={48} className="text-[#F87A14]" />,
    color: "bg-orange-50",
    borderColor: "border-orange-100"
  },
  {
    title: "Reprogramação Mental",
    description: "Identifique crenças limitantes e use nossa IA para ressignificá-las. Troque o 'eu não consigo' pelo 'eu vou aprender'.",
    icon: <Brain size={48} className="text-emerald-500" />,
    color: "bg-emerald-50",
    borderColor: "border-emerald-100"
  },
  {
    title: "Plano de 7 Dias",
    description: "Um roteiro prático e guiado para destravar seu potencial. Uma missão específica para cada dia da sua primeira semana.",
    icon: <Calendar size={48} className="text-blue-500" />,
    color: "bg-blue-50",
    borderColor: "border-blue-100"
  },
  {
    title: "Checklist de Disciplina",
    description: "A consistência vence o talento. Marque suas vitórias diárias e acompanhe sua evolução através da barra de progresso.",
    icon: <CheckSquare size={48} className="text-indigo-500" />,
    color: "bg-indigo-50",
    borderColor: "border-indigo-100"
  },
  {
    title: "Visualização Guiada",
    description: "Apenas 2 minutos por dia para ensaiar seu sucesso mentalmente. Feche os olhos e siga as instruções.",
    icon: <Eye size={48} className="text-purple-500" />,
    color: "bg-purple-50",
    borderColor: "border-purple-100"
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-fade-in scale-100 transition-transform">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Conteúdo do Card */}
        <div className="flex flex-col h-[450px]">
          
          {/* Área Visual Superior */}
          <div className={`h-[45%] flex flex-col items-center justify-center ${step.color} border-b ${step.borderColor} transition-colors duration-500`}>
            <div className="bg-white p-6 rounded-full shadow-sm mb-4 transform transition-transform duration-500 hover:scale-110">
              {step.icon}
            </div>
          </div>

          {/* Área de Texto */}
          <div className="flex-1 p-8 text-center flex flex-col items-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 transition-all duration-300">
              {step.title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-auto">
              {step.description}
            </p>

            {/* Indicadores de Slide */}
            <div className="flex gap-2 mb-6 mt-4">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-6 bg-[#F87A14]' : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Controles */}
            <div className="flex w-full gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#F87A14] to-orange-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {currentStep === steps.length - 1 ? "Começar Jornada" : "Próximo"}
                {currentStep < steps.length - 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;