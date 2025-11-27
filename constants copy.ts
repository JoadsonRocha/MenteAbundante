
import { DailyTask, DayPlan } from "./types";

export const INITIAL_TASKS: DailyTask[] = [
  { id: '1', text: 'Pensei como vencedor hoje', completed: false },
  { id: '2', text: 'Tomei decisão alinhada com meu objetivo', completed: false },
  { id: '3', text: 'Fiz algo que meu eu futuro faria', completed: false },
  { id: '4', text: 'Agradeci por algo hoje', completed: false },
  { id: '5', text: 'Fiz 1 ação mesmo sem vontade (Disciplina)', completed: false },
];

export const SEVEN_DAY_PLAN: DayPlan[] = [
  { day: 1, title: 'Identificar Crenças', description: 'Liste 3 frases que te limitam e questione: "Isso é verdade absoluta?". Escreva abaixo as crenças que você identificou.', completed: false, answer: '' },
  { day: 2, title: 'Reprogramar Pensamentos', description: 'Reescreva as crenças de ontem usando a linguagem da Abundância. Como você pode dizer isso de forma fortalecedora?', completed: false, answer: '' },
  { day: 3, title: 'Técnica de Visualização', description: 'Dedique 2 minutos para visualizar seu objetivo. Descreva como você se sentiu e o que viu.', completed: false, answer: '' },
  { day: 4, title: 'Mudança de Hábitos', description: 'Identifique um hábito ruim e substitua por um micro-hábito positivo. Qual será sua troca?', completed: false, answer: '' },
  { day: 5, title: 'Ancoragem Diária', description: 'Crie um gesto físico que ative sua sensação de poder. Qual gesto você escolheu e em que momento usará?', completed: false, answer: '' },
  { day: 6, title: 'Ação com Coragem', description: 'Faça algo que você estava procrastinando por medo. O que você fez e qual foi o resultado?', completed: false, answer: '' },
  { day: 7, title: 'Revisão e Celebração', description: 'Analise sua semana. Quais foram suas maiores vitórias e mudanças de mentalidade?', completed: false, answer: '' },
];

export const QUOTES = [
  "Você nunca vencerá por fora sem antes vencer por dentro.",
  "Se sua mente acredita que você pode, seu corpo encontra o caminho.",
  "A mente abundante não compete, ela cria oportunidades.",
  "Vencedores fazem o que precisa ser feito, mesmo quando não têm vontade.",
  "O mundo externo muda quando o mundo interno se transforma."
];