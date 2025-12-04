import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONTEXTO RAG SIMULADO PARA O AGENTE DE SUPORTE ---
const MINDRISE_KNOWLEDGE_BASE = `
VOCÊ É O "AGENTE DE SUPORTE MINDRISE". 
Sua função é atuar como um especialista técnico do app "MindRise".
Analise o problema do usuário e forneça a solução exata baseada na lista abaixo.

=== BASE DE CONHECIMENTO TÉCNICO E SOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING) ===

1. **PROBLEMAS DE ÁUDIO E VISUALIZAÇÃO**
   - **Sintoma:** "O áudio não toca", "Sem som na visualização".
   - **Solução:** 
     1. Verifique se o celular não está no modo silencioso.
     2. Aumente o volume de mídia do aparelho.
     3. Na primeira vez, é necessária internet para baixar o áudio.
     4. Tente trocar entre o modo "Guiada" e "Declaração" para forçar o recarregamento.

2. **LOGIN E CONTA**
   - **Sintoma:** "Não consigo entrar", "Esqueci a senha".
   - **Solução:** Na tela de login, use o botão "Esqueci minha senha". Um link será enviado ao seu e-mail. Verifique a caixa de Spam.
   - **Sintoma:** "Trocar foto ou nome".
   - **Solução:** Acesse o menu lateral -> Clique em "Perfil". Lá você pode editar nome, frase de poder e clicar na foto para alterar.

3. **SINCRONIZAÇÃO E DADOS**
   - **Sintoma:** "Meus dados sumiram", "Troquei de celular".
   - **Solução:** O app é "Offline-First". Se você usou sem internet, os dados estão no aparelho antigo. Para recuperar em outro celular, você precisava ter feito login online anteriormente para sincronizar com a nuvem.
   - **Sintoma:** "App não salva minhas tarefas".
   - **Solução:** Verifique se há espaço no armazenamento do celular. Tente sair da conta (Logout) e entrar novamente para forçar um resync.

4. **INSTALAÇÃO (PWA)**
   - **Sintoma:** "Como baixar o app?", "Não acho na loja".
   - **Solução:** O MindRise é um Web App Progressivo (PWA). 
     - No Android (Chrome): Clique nos 3 pontinhos -> "Instalar aplicativo" ou "Adicionar à tela inicial".
     - No iOS (Safari): Clique no botão Compartilhar (quadrado com seta) -> Role para baixo -> "Adicionar à Tela de Início".

=== DIRETRIZES DE ATENDIMENTO ===
- Responda SEMPRE no idioma que o usuário usar ou no idioma solicitado.
- Se o usuário relatar um "Bug Crítico" (tela branca, app fechando sozinho), peça detalhes e responda com [ESCALATE].
- Se o usuário estiver muito irritado ou pedir humano, responda com [ESCALATE].
`;

export const reframeBelief = async (limitingBelief: string, language: Language = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O usuário tem a seguinte crença limitante: "${limitingBelief}".
        
        Idioma de resposta: ${language === 'pt' ? 'Português' : language === 'en' ? 'Inglês' : 'Espanhol'}.

        Sua tarefa:
        1. Identifique o bloqueio por trás dessa frase.
        2. Reescreva essa frase transformando-a em uma afirmação de Mentalidade Abundante e Vencedora.
        3. Explique brevemente (1 frase) o porquê da mudança.
        
        Retorne no seguinte formato:
        Nova Crença: [Frase Poderosa]
        Explicação: [Explicação Curta]`,
      config: {
        systemInstruction: "Atue como um especialista em PNL (Programação Neurolinguística) e mentalidade de alta performance.",
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar uma resposta no momento.";
  } catch (error) {
    console.error("Error connecting to Gemini:", error);
    return "Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const chatWithCoach = async (history: string[], message: string, language: Language = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "API Key ausente.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Histórico da conversa:
        ${history.join('\n')}
        
        Usuário: ${message}`,
      config: {
        systemInstruction: `Você é o "Mentor MindRise".
        Idioma obrigatório: ${language === 'pt' ? 'Português' : language === 'en' ? 'Inglês' : 'Espanhol'}.
        
        Seus princípios são: Auto-responsabilidade, Mentalidade de Crescimento, Disciplina e Abundância.
        Responda de forma motivadora, direta e prática. Use emojis moderadamente.`
      }
    });
    return response.text || "";
  } catch (e) {
    return "Erro de conexão.";
  }
};

export const chatWithSupportAgent = async (history: string[], message: string): Promise<string> => {
  if (!process.env.API_KEY) return "Erro: Sistema offline.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Histórico Recente:
      ${history.join('\n')}
      
      Cliente: ${message}`,
      config: {
        systemInstruction: MINDRISE_KNOWLEDGE_BASE,
        temperature: 0.3,
      }
    });
    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (e) {
    return "Estamos enfrentando instabilidade técnica.";
  }
};

export const generateGuidedAudio = async (text: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("Erro ao gerar áudio:", e);
    return null;
  }
};

export const analyzePlanAction = async (dayTitle: string, userAnswer: string, language: Language = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "Ótimo trabalho!";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Contexto: Plano de 7 Dias para Mentalidade Abundante.
      
      Tarefa: "${dayTitle}"
      Resposta: "${userAnswer}"
      Idioma: ${language}
      
      Dê um feedback curto (máximo 2 frases) reforçando a ação ou sugerindo ajuste.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Excelente progresso!";
  } catch (e) {
    return "Parabéns pela ação!";
  }
};

export const analyzeDailyHabit = async (taskName: string, userReflection: string, language: Language = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Hábito: "${taskName}"
      Reflexão: "${userReflection}"
      Idioma: ${language}
      
      Dê um "Insight Relâmpago" (máximo 15 palavras).`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "";
  } catch (e) {
    return "";
  }
};

export const generateGratitudeAffirmation = async (gratitudeText: string, language: Language = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gratidão do usuário: "${gratitudeText}".
      Idioma: ${language}
      
      Escreva uma Afirmação Poderosa Curta (máximo 1 frase) que conecte essa gratidão com a atração de mais prosperidade.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "";
  } catch (e) {
    return "";
  }
};

export const generateActionPlan = async (goal: string, timeframe: string, language: Language = 'pt'): Promise<any[]> => {
  if (!process.env.API_KEY) throw new Error("API Key ausente");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Objetivo: "${goal}".
      Prazo: "${timeframe}".
      Idioma de resposta dos textos: ${language}

      Crie um plano de ação (Checklist) com 5 a 10 passos.
      Retorne APENAS um JSON array válido.
      Exemplo: [ { "text": "...", "timing": "Dia 1" } ]`,
      config: {
        temperature: 0.4, 
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Resposta vazia da IA");
    
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Erro ao gerar plano:", e);
    throw new Error("Não foi possível criar o plano.");
  }
};
