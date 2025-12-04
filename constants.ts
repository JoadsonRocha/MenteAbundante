
import { DailyTask, DayPlan, Language } from "./types";

export const INITIAL_TASKS_BY_LANG: Record<Language, DailyTask[]> = {
  pt: [
    { id: '1', text: 'Pensei como vencedor hoje', completed: false },
    { id: '2', text: 'Tomei decisão alinhada com meu objetivo', completed: false },
    { id: '3', text: 'Fiz algo que meu eu futuro faria', completed: false },
    { id: '4', text: 'Agradeci por algo hoje', completed: false },
    { id: '5', text: 'Fiz 1 ação mesmo sem vontade (Disciplina)', completed: false },
  ],
  en: [
    { id: '1', text: 'Thought like a winner today', completed: false },
    { id: '2', text: 'Made a decision aligned with my goal', completed: false },
    { id: '3', text: 'Did something my future self would do', completed: false },
    { id: '4', text: 'Was grateful for something today', completed: false },
    { id: '5', text: 'Took 1 action even without motivation (Discipline)', completed: false },
  ],
  es: [
    { id: '1', text: 'Pensé como ganador hoy', completed: false },
    { id: '2', text: 'Tomé una decisión alineada con mi objetivo', completed: false },
    { id: '3', text: 'Hice algo que mi yo futuro haría', completed: false },
    { id: '4', text: 'Agradecí por algo hoy', completed: false },
    { id: '5', text: 'Hice 1 acción incluso sin ganas (Disciplina)', completed: false },
  ]
};

export const INITIAL_TASKS = INITIAL_TASKS_BY_LANG.pt; // Fallback

export const SEVEN_DAY_PLAN_BY_LANG: Record<Language, DayPlan[]> = {
  pt: [
    { day: 1, title: 'Identificar Crenças', description: 'Liste 3 frases que te limitam e questione: "Isso é verdade absoluta?". Escreva abaixo as crenças que você identificou.', completed: false, answer: '' },
    { day: 2, title: 'Reprogramar Pensamentos', description: 'Reescreva as crenças de ontem usando a linguagem da Abundância. Como você pode dizer isso de forma fortalecedora?', completed: false, answer: '' },
    { day: 3, title: 'Técnica de Visualização', description: 'Dedique 2 minutos para visualizar seu objetivo. Descreva como você se sentiu e o que viu.', completed: false, answer: '' },
    { day: 4, title: 'Mudança de Hábitos', description: 'Identifique um hábito ruim e substitua por um micro-hábito positivo. Qual será sua troca?', completed: false, answer: '' },
    { day: 5, title: 'Ancoragem Diária', description: 'Crie um gesto físico que ative sua sensação de poder. Qual gesto você escolheu e em que momento usará?', completed: false, answer: '' },
    { day: 6, title: 'Ação com Coragem', description: 'Faça algo que você estava procrastinando por medo. O que você fez e qual foi o resultado?', completed: false, answer: '' },
    { day: 7, title: 'Revisão e Celebração', description: 'Analise sua semana. Quais foram suas maiores vitórias e mudanças de mentalidade?', completed: false, answer: '' },
  ],
  en: [
    { day: 1, title: 'Identify Beliefs', description: 'List 3 phrases that limit you and ask: "Is this absolute truth?". Write down the beliefs you identified.', completed: false, answer: '' },
    { day: 2, title: 'Reprogram Thoughts', description: 'Rewrite yesterday\'s beliefs using Abundance language. How can you say this in an empowering way?', completed: false, answer: '' },
    { day: 3, title: 'Visualization Technique', description: 'Dedicate 2 minutes to visualize your goal. Describe how you felt and what you saw.', completed: false, answer: '' },
    { day: 4, title: 'Habit Change', description: 'Identify a bad habit and replace it with a positive micro-habit. What will be your trade?', completed: false, answer: '' },
    { day: 5, title: 'Daily Anchoring', description: 'Create a physical gesture that activates your sense of power. What gesture did you choose and when will you use it?', completed: false, answer: '' },
    { day: 6, title: 'Action with Courage', description: 'Do something you were procrastinating out of fear. What did you do and what was the result?', completed: false, answer: '' },
    { day: 7, title: 'Review and Celebration', description: 'Analyze your week. What were your biggest victories and mindset shifts?', completed: false, answer: '' },
  ],
  es: [
    { day: 1, title: 'Identificar Creencias', description: 'Enumera 3 frases que te limitan y pregunta: "¿Es esto verdad absoluta?". Escribe abajo las creencias que identificaste.', completed: false, answer: '' },
    { day: 2, title: 'Reprogramar Pensamientos', description: 'Reescribe las creencias de ayer usando el lenguaje de la Abundancia. ¿Cómo puedes decir esto de forma fortalecedora?', completed: false, answer: '' },
    { day: 3, title: 'Técnica de Visualización', description: 'Dedica 2 minutos para visualizar tu objetivo. Describe cómo te sentiste y qué viste.', completed: false, answer: '' },
    { day: 4, title: 'Cambio de Hábitos', description: 'Identifica un mal hábito y sustitúyelo por un micro-hábito positivo. ¿Cuál será tu cambio?', completed: false, answer: '' },
    { day: 5, title: 'Anclaje Diario', description: 'Crea un gesto físico que active tu sensación de poder. ¿Qué gesto elegiste y en qué momento lo usarás?', completed: false, answer: '' },
    { day: 6, title: 'Acción con Coraje', description: 'Haz algo que estabas procrastinando por miedo. ¿Qué hiciste y cuál fue el resultado?', completed: false, answer: '' },
    { day: 7, title: 'Revisión y Celebración', description: 'Analiza tu semana. ¿Cuáles fueron tus mayores victorias y cambios de mentalidad?', completed: false, answer: '' },
  ]
};

export const SEVEN_DAY_PLAN = SEVEN_DAY_PLAN_BY_LANG.pt; // Fallback

export const QUOTES_BY_LANG: Record<Language, string[]> = {
  pt: [
    "Você nunca vencerá por fora sem antes vencer por dentro.",
    "Se sua mente acredita que você pode, seu corpo encontra o caminho.",
    "A mente abundante não compete, ela cria oportunidades.",
    "Vencedores fazem o que precisa ser feito, mesmo quando não têm vontade.",
    "O mundo externo muda quando o mundo interno se transforma."
  ],
  en: [
    "You will never win on the outside without first winning on the inside.",
    "If your mind believes you can, your body finds the way.",
    "The abundant mind does not compete, it creates opportunities.",
    "Winners do what needs to be done, even when they don't feel like it.",
    "The external world changes when the internal world transforms."
  ],
  es: [
    "Nunca ganarás por fuera sin antes ganar por dentro.",
    "Si tu mente cree que puedes, tu cuerpo encuentra el camino.",
    "La mente abundante no compite, crea oportunidades.",
    "Los ganadores hacen lo que hay que hacer, incluso cuando no tienen ganas.",
    "El mundo externo cambia cuando el mundo interno se transforma."
  ]
};

export const QUOTES = QUOTES_BY_LANG.pt;
