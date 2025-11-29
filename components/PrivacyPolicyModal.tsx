import React from 'react';
import { X, Shield, Lock, Server, BrainCircuit } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={18} className="text-emerald-500" />
            Políticas de Privacidade e Termos
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-slate-600 custom-scrollbar leading-relaxed">
          <p className="font-medium text-slate-800">Última atualização: {new Date().toLocaleDateString()}</p>
          
          <p>
            O <strong>MindShift - Mente Abundante</strong> valoriza sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações ao utilizar nosso aplicativo de reprogramação mental e produtividade.
          </p>

          <section>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Server size={16} className="text-[#F87A14]" /> 1. Coleta e Armazenamento de Dados
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Conta:</strong> Para utilizar a sincronização em nuvem, coletamos seu endereço de e-mail para autenticação segura via Supabase.</li>
              <li><strong>Dados Locais (Offline First):</strong> A maioria dos seus dados (tarefas diárias, planos de 7 dias, histórico de chat) é armazenada primeiramente no <em>LocalStorage</em> do seu dispositivo para garantir funcionamento offline e rapidez.</li>
              <li><strong>Sincronização:</strong> Quando conectado à internet, seus dados são sincronizados com nosso banco de dados criptografado para permitir o acesso em múltiplos dispositivos.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <BrainCircuit size={16} className="text-indigo-500" /> 2. Uso de Inteligência Artificial
            </h4>
            <p>
              Utilizamos a tecnologia Google Gemini API para funcionalidades como o "AI Coach", "Reprogramação Mental" e "Geração de Áudio".
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>As mensagens enviadas ao Coach são processadas pela IA para gerar respostas.</li>
              <li>Recomendamos <strong>não compartilhar informações sensíveis</strong> (como senhas, documentos financeiros ou dados de saúde críticos) nas conversas com a IA.</li>
              <li>Os dados processados pela API são utilizados apenas para fornecer a resposta solicitada e não são usados para treinar modelos públicos de forma identificável.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-emerald-500" /> 3. Segurança
            </h4>
            <p>
              Implementamos medidas de segurança robustas. Suas senhas são hash (criptografadas) e nunca armazenadas em texto simples. A comunicação com o servidor é feita via protocolo HTTPS seguro.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 mb-2">4. Seus Direitos</h4>
            <p>
              Você tem o direito de solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento através das configurações do perfil ou entrando em contato com o suporte.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 mb-2">5. Termos de Uso</h4>
            <p>
              Este aplicativo é uma ferramenta de autoajuda e desenvolvimento pessoal. Ele <strong>não substitui acompanhamento psicológico ou psiquiátrico profissional</strong>. Ao usar o app, você concorda que é responsável por suas próprias decisões e resultados.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Entendi
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyModal;