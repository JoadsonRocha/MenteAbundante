import React from 'react';
import { BookOpen, Star, BrainCircuit, ArrowRight } from 'lucide-react';
import { Tab } from '../types';

interface AboutProps {
  navigateTo: (tab: Tab) => void;
}

const About: React.FC<AboutProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="text-center mb-6 md:mb-10 px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#F87A14] mb-3 md:mb-4">Sobre o MindShift</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
          Uma ferramenta digital para despertar seu potencial, reprogramar crenças e construir uma mentalidade vencedora.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mx-2 md:mx-0">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="text-amber-400 shrink-0" size={24} />
            Inspiração
          </h3>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            Este aplicativo é baseado nos princípios do guia "Mente Abundante e Vencedora". 
            Acreditamos que a verdadeira vitória começa silenciosamente, dentro da mente, antes de se manifestar no mundo real.
          </p>
        </div>
        
        <div className="p-5 md:p-8 space-y-6 md:space-y-8">
          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
              <BrainCircuit className="text-emerald-500 shrink-0" size={24} />
              O Poder da Transformação
            </h4>
            <p className="text-slate-600 leading-relaxed mb-4 text-sm md:text-base text-justify md:text-left">
              Muitos acreditam que vencer depende apenas de sorte ou talento, mas os campeões sabem que tudo começa com a mentalidade correta. 
              Se sua mente acredita que você não pode, ela sabota seus esforços antes mesmo de começar.
            </p>
            <blockquote className="border-l-4 border-amber-400 pl-4 italic text-slate-700 my-4 md:my-6 bg-amber-50 p-4 rounded-r-lg text-sm md:text-base">
              "Você nunca vencerá por fora sem antes vencer por dentro."
            </blockquote>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">Mentalidade Fixa</h5>
              <p className="text-xs md:text-sm text-slate-500">Acredita que habilidades são imutáveis. Evita desafios por medo de falhar.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="font-bold text-slate-800 mb-2 text-sm md:text-base">Mentalidade de Crescimento</h5>
              <p className="text-xs md:text-sm text-slate-500">Entende que esforço gera evolução. Vê falhas como aprendizado.</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-1 text-sm md:text-base">
                 Mentalidade Abundante <Star size={14} fill="currentColor" />
              </h5>
              <p className="text-xs md:text-sm text-amber-900">Não compete, cria. Entende que há espaço para todos vencerem.</p>
            </div>
          </section>

          <section>
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-3 md:mb-4">Nosso Propósito</h4>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              Criamos o MindShift para ser seu companheiro diário de evolução.
            </p>
          </section>

          <section className="pt-6 border-t border-slate-100">
            <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Explore as Ferramentas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <button 
                onClick={() => navigateTo('gratitude')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-800 group-hover:text-pink-700 text-sm md:text-base">Diário de Gratidão</span>
                  <span className="text-xs text-slate-500">Atraia abundância</span>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-pink-500" />
              </button>

              <button 
                onClick={() => navigateTo('reprogram')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-800 group-hover:text-amber-700 text-sm md:text-base">Reprogramar Crenças</span>
                  <span className="text-xs text-slate-500">Transforme pensamentos</span>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500" />
              </button>

              <button 
                onClick={() => navigateTo('plan')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-800 group-hover:text-emerald-700 text-sm md:text-base">Plano de 7 Dias</span>
                  <span className="text-xs text-slate-500">Roteiro prático</span>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-500" />
              </button>

              <button 
                onClick={() => navigateTo('visualization')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-800 group-hover:text-indigo-700 text-sm md:text-base">Visualização</span>
                  <span className="text-xs text-slate-500">Ensaio mental</span>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
              </button>

               <button 
                onClick={() => navigateTo('checklist')}
                className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-800 group-hover:text-blue-700 text-sm md:text-base">Checklist Diário</span>
                  <span className="text-xs text-slate-500">Hábitos de sucesso</span>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500" />
              </button>
            </div>
          </section>
        </div>
      </div>
      
      <div className="text-center text-slate-400 text-xs md:text-sm pb-8">
        <p>Versão 1.1.0 • Feito com foco na sua evolução.</p>
      </div>
    </div>
  );
};

export default About;