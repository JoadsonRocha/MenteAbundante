import { DailyTask, DayPlan } from "./types";

export const INITIAL_TASKS: DailyTask[] = [
  { id: '1', text: 'Pensei como vencedor hoje', completed: false },
  { id: '2', text: 'Tomei decisão alinhada com meu objetivo', completed: false },
  { id: '3', text: 'Fiz algo que meu eu futuro faria', completed: false },
  { id: '4', text: 'Agradeci por algo hoje', completed: false },
  { id: '5', text: 'Fiz 1 ação mesmo sem vontade (Disciplina)', completed: false },
];

export const SEVEN_DAY_PLAN: DayPlan[] = [
  { day: 1, title: 'Identificar Crenças', description: 'Liste 3 frases que te limitam e questione: "Isso é verdade absoluta?".', completed: false },
  { day: 2, title: 'Reprogramar Pensamentos', description: 'Reescreva as crenças de ontem usando a linguagem da Abundância.', completed: false },
  { day: 3, title: 'Técnica de Visualização', description: 'Dedique 2 minutos para visualizar seu objetivo já alcançado.', completed: false },
  { day: 4, title: 'Mudança de Hábitos', description: 'Identifique um hábito ruim e substitua por um micro-hábito positivo.', completed: false },
  { day: 5, title: 'Ancoragem Diária', description: 'Crie um gesto físico que ative sua sensação de poder e confiança.', completed: false },
  { day: 6, title: 'Ação com Coragem', description: 'Faça algo que você estava procrastinando por medo.', completed: false },
  { day: 7, title: 'Revisão e Celebração', description: 'Analise sua semana e celebre sua nova mentalidade.', completed: false },
];

export const QUOTES = [
  "Você nunca vencerá por fora sem antes vencer por dentro.",
  "Se sua mente acredita que você pode, seu corpo encontra o caminho.",
  "A mente abundante não compete, ela cria oportunidades.",
  "Vencedores fazem o que precisa ser feito, mesmo quando não têm vontade.",
  "O mundo externo muda quando o mundo interno se transforma."
];