import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONTEXTO RAG SIMULADO PARA O AGENTE DE SUPORTE ---
const MINDSHIFT_KNOWLEDGE_BASE = `
VOCÊ É O "AGENTE DE SUPORTE MINDSHIFT". 
Sua função é atuar como um especialista técnico do app "MindShift - Mente Abundante".
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
   - **Solução:** O MindShift é um Web App Progressivo (PWA). 
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
   - **Solução:** Isso é um direito seu. Solicite via e-mail para privacy@mindshift.app ou abra um ticket aqui solicitando a exclusão completa.

=== DIRETRIZES DE ATENDIMENTO ===
- Se a resposta estiver acima, explique passo a passo, de forma amigável.
- Se o usuário relatar um "Bug Crítico" (tela branca, app fechando sozinho), peça detalhes do modelo do celular e responda com [ESCALATE].
- Se o usuário estiver muito irritado ou pedir humano, responda com [ESCALATE].
- Sempre pergunte no final: "Isso resolveu seu problema ou deseja finalizar este atendimento?"
`;

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

export const chatWithSupportAgent = async (history: string[], message: string): Promise<string> => {
  if (!process.env.API_KEY) return "Erro: Sistema offline.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Histórico Recente:
      ${history.join('\n')}
      
      Cliente: ${message}`,
      config: {
        systemInstruction: MINDSHIFT_KNOWLEDGE_BASE,
        temperature: 0.3, // Baixa temperatura para respostas mais precisas/técnicas
      }
    });
    return response.text || "Desculpe, não consegui processar sua solicitação.";
  } catch (e) {
    return "Estamos enfrentando instabilidade técnica. Por favor, tente novamente em instantes.";
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

export const generateGratitudeAffirmation = async (gratitudeText: string): Promise<string> => {
  if (!process.env.API_KEY) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O usuário escreveu o seguinte no diário de gratidão: "${gratitudeText}".
      
      Sua missão:
      Atue como um coach de Mentalidade Abundante. Escreva uma Afirmação Poderosa Curta (máximo 1 frase) que conecte esse motivo de gratidão com a atração de mais prosperidade ou felicidade.
      
      Exemplo:
      Entrada: "Sou grato pela saúde da minha família"
      Saída: "Minha gratidão pela saúde atrai vitalidade e alegria infinitas para o meu lar."`,
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
export const generateActionPlan = async (goal: string, timeframe: string): Promise<any[]> => {
  if (!process.env.API_KEY) throw new Error("API Key ausente");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O usuário tem o objetivo: "${goal}".
      O prazo desejado é: "${timeframe}".

      Sua missão:
      Crie um plano de ação prático no formato de Checklist, dividido cronologicamente para caber nesse prazo.
      
      Regras:
      1. Seja específico nas tarefas (ex: "Criar conta no Instagram" em vez de "Começar marketing").
      2. Divida o tempo de forma lógica (ex: "Dia 1", "Semana 1", "Mês 2").
      3. Gere entre 5 a 15 passos, dependendo da complexidade.
      4. Retorne APENAS um JSON array válido. Sem markdown, sem texto extra.

      Formato esperado do JSON:
      [
        { "text": "Pesquisar concorrentes", "timing": "Dia 1" },
        { "text": "Definir identidade visual", "timing": "Semana 1" }
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

// --- NOVO: GERADOR DE MEDITAÇÃO SOS OTIMIZADO (5 MINUTOS) ---
export const generateMeditationScript = async (): Promise<{ title: string, steps: { label: string, text: string, pauseSeconds: number }[] } | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Atue como um terapeuta especialista em ansiedade e mindfulness.
      Crie um roteiro de meditação guiada INÉDITO para alívio de ansiedade.
      
      CONTEXTO: Data atual ${new Date().toISOString()} (Use isso para variar o conteúdo).
      REQUISITO FUNDAMENTAL: A sessão deve durar NO MÍNIMO 5 MINUTOS.
      Para isso, gere textos longos nas etapas intermediárias e pausas estratégicas.

      ESTRUTURA OBRIGATÓRIA (5 Etapas):
      
      1. INTRODUÇÃO RÁPIDA (Máx 40 palavras): Foco apenas na respiração inicial. (Esta etapa deve ser curta para o áudio carregar instantaneamente). PauseSeconds: 5.
      
      2. RELAXAMENTO PROFUNDO (Aprox 130-150 palavras): Escaneamento corporal detalhado, soltando tensões dos pés à cabeça. Use ritmo lento. PauseSeconds: 20.
      
      3. APROFUNDAMENTO (Aprox 130-150 palavras): Técnica de visualização (lugar seguro, luz, natureza) ou mindfulness. PauseSeconds: 25.
      
      4. REPROGRAMAÇÃO E ANCORAGEM (Aprox 120 palavras): Afirmações de segurança, controle e paz. PauseSeconds: 20.
      
      5. RETORNO SUAVE (Aprox 80 palavras): Volta gradual à consciência, mantendo a calma. PauseSeconds: 5.

      IMPORTANTE:
      - O conteúdo deve ser SEMPRE NOVO e ÚNICO. Use metáforas diferentes a cada geração.
      - Texto em primeira pessoa ("Eu guio você") ou direta ("Você sente").
      - Tom de voz: Lento, calmo, hipnótico, acolhedor.

      Retorne APENAS um JSON válido:
      {
        "title": "Título Criativo da Sessão",
        "steps": [
          { "label": "Respiração", "text": "...", "pauseSeconds": 5 },
          ...
        ]
      }`,
      config: {
        responseMimeType: "application/json",
        temperature: 1.0 // Alta temperatura para garantir que seja sempre diferente
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro script meditação:", error);
    return null;
  }
};