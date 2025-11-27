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