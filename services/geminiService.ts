import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: string) => {
  switch (lang) {
    case 'pt': return 'Portuguese';
    case 'en': return 'English';
    case 'es': return 'Spanish';
    default: return 'Portuguese';
  }
};

// --- CONTEXTO RAG SIMULADO PARA O AGENTE DE SUPORTE ---
const MINDRISE_KNOWLEDGE_BASE = `
VOCÊ É O "AGENTE DE SUPORTE RISE MINDR". 
Sua função é atuar como um especialista técnico do app "Rise Mindr - Mente Abundante".
Analise o problema do usuário e forneça a solução exata baseada na lista abaixo.

=== BASE DE CONHECIMENTO TÉCNICO E SOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING) ===

1. **PROBLEMAS DE ÁUDIO E VISUALIZAÇÃO**
   - **Sintoma:** "O áudio não toca", "Sem som na visualização".
   - **Solução:** 
     1. Verifique se o celular não está no modo silencioso (especialmente iPhone, a chave lateral deve estar ativada).
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
   - **Solução:** O Rise Mindr é um Web App Progressivo (PWA). 
     - No Android (Chrome): Clique nos 3 pontinhos -> "Instalar aplicativo" ou "Adicionar à tela inicial".
     - No iOS (Safari): Clique no botão Compartilhar (quadrado com seta) -> Role para baixo -> "Adicionar à Tela de Início".

5. **PLANO DE 7 DIAS**
   - **Sintoma:** "Dia bloqueado", "Não consigo avançar".
   - **Solução:** O sistema propositalmente bloqueia dias futuros. Você deve concluir o dia atual e aguardar até a meia-noite para liberar o próximo. Isso garante a absorção do aprendizado (Neuroplasticidade).
   - **Sintoma:** "Quero reiniciar".
   - **Solução:** Ao completar o dia 7, aparecerá um botão "Iniciar Novo Ciclo".

6. **PROBLEMAS COM A IA (COACH/REPROGRAMAÇÃO)**
   - **Sintoma:** "IA não responde", "Erro ao gerar".
   - **Solução:** A IA requer conexão ativa com a internet. Verifique seu Wi-Fi/4G. Se persistir, aguarde 1 minuto e tente novamente (pode ser sobrecarga momentânea do servidor).

7. **PLANEJADOR INTELIGENTE**
   - **Sintoma:** "Não gera o plano".
   - **Solução:** Seja específico no objetivo e no prazo (ex: "30 dias"). Se for muito vago, a IA pode falhar.

8. **PRIVACIDADE E EXCLUSÃO**
   - **Sintoma:** "Quero apagar meus dados".
   - **Solução:** Isso é um direito seu. Solicite via e-mail para privacy@risemindr.app ou abra um ticket aqui solicitando a exclusão completa.

=== DIRETRIZES DE ATENDIMENTO ===
- Se a resposta estiver acima, explique passo a passo, de forma amigável.
- Se o usuário relatar um "Bug Crítico" (tela branca, app fechando sozinho), peça detalhes do modelo do celular e responda com [ESCALATE].
- Se o usuário estiver muito irritado ou pedir humano, responda com [ESCALATE].
- Sempre pergunte no final: "Isso resolveu seu problema ou deseja finalizar este atendimento?"
`;

export const reframeBelief = async (limitingBelief: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada. Por favor, configure a API_KEY no ambiente.";
  }

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User's limiting belief: "${limitingBelief}".
        
        Task:
        1. Identify the mental block behind this statement.
        2. Rewrite this belief into a powerful Abundant Mindset affirmation.
        3. Briefly explain (1 sentence) why this shift matters.
        
        IMPORTANT: Respond strictly in ${langName}.
        
        Output format:
        New Belief: [Powerful Phrase]
        Explanation: [Short Explanation]`,
      config: {
        systemInstruction: "You are an expert in NLP (Neuro-Linguistic Programming) and high-performance mindset.",
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar uma resposta no momento.";
  } catch (error) {
    console.error("Error connecting to Gemini:", error);
    return "Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.";
  }
};

export const chatWithCoach = async (history: string[], message: string, userContext?: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "API Key ausente.";

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Conversation History:
        ${history.join('\n')}
        
        ${userContext ? `USER CONTEXT (App Data): \n${userContext}\nUse this to personalize the answer, but act naturally.` : ''}

        User: ${message}`,
      config: {
        systemInstruction: `You are the "Abundant Mind Mentor" (Rise Mindr), a virtual coach specializing in High Performance Mindset.
        Your principles are: Self-responsibility, Growth Mindset, Discipline, and Abundance.
        
        IMPORTANT: Respond strictly in ${langName}.
        
        Respond in a motivating, direct, and practical way. Use emojis moderately.
        NEVER use bold with double asterisks (**text**). If you need emphasis, use UPPERCASE or quotes.`
      }
    });
    return response.text || "";
  } catch (e) {
    return "Erro de conexão.";
  }
};

export const chatWithSupportAgent = async (history: string[], message: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "Erro: Sistema offline.";

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Recent History:
      ${history.join('\n')}
      
      Customer: ${message}`,
      config: {
        systemInstruction: `${MINDRISE_KNOWLEDGE_BASE}
        
        IMPORTANT: You must translate your reasoning and final response to ${langName}. The user speaks ${langName}.`,
        temperature: 0.3, 
      }
    });
    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (e) {
    return "Estamos enfrentando instabilidade técnica. Por favor, tente novamente em instantes.";
  }
};

export const generateGuidedAudio = async (text: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;

  const makeRequest = async (retries = 2): Promise<string | null> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
           role: 'user',
           parts: [{ text: text }]
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e: any) {
      if (retries > 0 && (e.status === 500 || e.code === 500 || e.message?.includes('Internal error'))) {
         console.warn(`Retry TTS... (${retries})`);
         await new Promise(r => setTimeout(r, 1500));
         return makeRequest(retries - 1);
      }
      console.error("Erro ao gerar áudio:", e);
      return null;
    }
  };

  return makeRequest();
};

export const analyzePlanAction = async (dayTitle: string, userAnswer: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "Ótimo trabalho! Continue firme no seu propósito.";

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: The user is doing a "7-Day Abundant Mindset Plan".
      
      Day Task: "${dayTitle}"
      User Answer/Action: "${userAnswer}"
      
      Your Mission:
      Analyze the user's answer. Act as an experienced mentor and give short feedback (max 2 sentences) reinforcing their action or suggesting a fine-tuning to boost results. End with a word of encouragement.
      
      IMPORTANT: Respond strictly in ${langName}.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Excelente progresso! Sua dedicação é a chave para a mudança.";
  } catch (e) {
    return "Parabéns pela ação! Continue avançando.";
  }
};

export const analyzeDailyHabit = async (taskName: string, userReflection: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "";

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: Daily Mindset Checklist.
      Habit: "${taskName}"
      User Reflection: "${userReflection}"
      
      Your Mission:
      Give a "Lightning Insight" (max 15 words). Be deep, philosophical, or motivating, validating the user's effort.
      
      IMPORTANT: Respond strictly in ${langName}.`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "";
  } catch (e) {
    return "";
  }
};

export const generateGratitudeAffirmation = async (gratitudeText: string, language: string = 'pt'): Promise<string> => {
  if (!process.env.API_KEY) return "";

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The user wrote the following in their gratitude journal: "${gratitudeText}".
      
      Your Mission:
      Act as an Abundant Mindset coach. Write a Short Powerful Affirmation (max 1 sentence) connecting this reason for gratitude with attracting more prosperity or happiness.
      
      IMPORTANT: Respond strictly in ${langName}.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "A gratidão é a chave que abre todas as portas da abundância.";
  } catch (e) {
    return "Obrigado por agradecer. A abundância começa aqui.";
  }
};

// --- NOVO: GERADOR DE PLANO DE AÇÃO ---
export const generateActionPlan = async (goal: string, timeframe: string, language: string = 'pt'): Promise<any[]> => {
  if (!process.env.API_KEY) throw new Error("API Key ausente");

  const langName = getLanguageName(language);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Goal: "${goal}".
      Timeframe: "${timeframe}".

      Your Mission:
      Create a practical action plan in Checklist format, chronologically divided to fit this timeframe.
      
      Rules:
      1. Be specific in tasks (e.g., "Create Instagram account" instead of "Start marketing").
      2. Divide time logically (e.g., "Day 1", "Week 1", "Month 2").
      3. Generate between 5 to 15 steps, depending on complexity.
      4. Return ONLY a valid JSON array. No markdown, no extra text.
      5. The content of the JSON must be in ${langName}.

      Expected JSON Format:
      [
        { "text": "Task description in ${langName}", "timing": "Timeframe in ${langName}" },
        { "text": "Another task in ${langName}", "timing": "Timeframe in ${langName}" }
      ]`,
      config: {
        temperature: 0.4, // Mais determinístico para seguir instruções JSON
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Resposta vazia da IA");
    
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Erro ao gerar plano:", e);
    throw new Error("Não foi possível criar o plano. Tente ser mais específico.");
  }
};