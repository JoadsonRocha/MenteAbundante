import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const reframeBelief = async (limitingBelief: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada. Por favor, configure a API_KEY no ambiente.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O usuário tem a seguinte crença limitante: "${limitingBelief}".
        
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

export const chatWithCoach = async (history: string[], message: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key ausente.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Histórico da conversa:
        ${history.join('\n')}
        
        Usuário: ${message}`,
      config: {
        systemInstruction: `Você é o "Mentor Mente Abundante", um coach virtual baseado no livro "Mente Abundante e Vencedora".
        Seus princípios são: Auto-responsabilidade, Mentalidade de Crescimento, Disciplina e Abundância.
        
        Responda de forma motivadora, direta e prática. Use emojis moderadamente.`
      }
    });
    return response.text || "";
  } catch (e) {
    return "Erro de conexão.";
  }
};

export const generateGuidedAudio = async (text: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;

  try {
    // Usando o modelo específico de TTS do Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // 'Kore' é uma voz geralmente calma e adequada para guias
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // Retorna a string base64 do áudio
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("Erro ao gerar áudio:", e);
    return null;
  }
};

export const analyzePlanAction = async (dayTitle: string, userAnswer: string): Promise<string> => {
  if (!process.env.API_KEY) return "Ótimo trabalho! Continue firme no seu propósito.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Contexto: O usuário está fazendo um "Plano de 7 Dias para Mentalidade Abundante".
      
      Tarefa do Dia: "${dayTitle}"
      Resposta/Ação do Usuário: "${userAnswer}"
      
      Sua missão:
      Analise a resposta do usuário. Aja como um mentor experiente e dê um feedback curto (máximo 2 frases) reforçando a ação dele ou sugerindo um ajuste fino para potencializar o resultado. Termine com uma palavra de incentivo.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Excelente progresso! Sua dedicação é a chave para a mudança.";
  } catch (e) {
    return "Parabéns pela ação! Continue avançando.";
  }
};

export const analyzeDailyHabit = async (taskName: string, userReflection: string): Promise<string> => {
  if (!process.env.API_KEY) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Contexto: Checklist Diário de Mentalidade Vencedora.
      Hábito: "${taskName}"
      Reflexão do Usuário: "${userReflection}"
      
      Sua missão:
      Dê um "Insight Relâmpago" (máximo 15 palavras). Seja profundo, filosófico ou motivador, validando o esforço do usuário.`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "";
  } catch (e) {
    return "";
  }
};