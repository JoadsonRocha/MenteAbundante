import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  pt: {
    // Auth
    "auth.header_title": "Mente Abundante",
    "auth.header_subtitle": "Sua jornada de reprogramação começa agora.",
    "auth.tab_login": "Entrar",
    "auth.tab_register": "Criar Conta",
    "auth.recover_title": "Recuperar Senha",
    "auth.recover_desc": "Digite seu email para receber o link de redefinição.",
    "auth.email_label": "EMAIL",
    "auth.password_label": "SENHA",
    "auth.forgot_password": "Esqueceu?",
    "auth.btn_login": "Entrar",
    "auth.btn_register": "Criar Conta Grátis",
    "auth.btn_send_link": "Enviar Link",
    "auth.back_login": "Voltar para Login",
    "auth.terms": "Termos de Uso e Privacidade",
    "auth.error_generic": "Erro de conexão. Tente novamente.",
    "auth.success_created": "Conta criada! Verifique seu email.",
    
    // Sidebar
    "menu.dashboard": "Início",
    "menu.planner": "Planejador IA",
    "menu.coach": "AI Coach",
    "menu.reprogram": "Reprogramar",
    "menu.anxiety": "Ansiedade SOS",
    "menu.plan7": "Plano 7 Dias",
    "menu.checklist": "Checklist",
    "menu.gratitude": "Gratidão",
    "menu.visualization": "Visualização",
    "menu.stats": "Evolução",
    "menu.feedback": "Feedback",
    "menu.support": "Suporte",
    "menu.about": "Sobre",
    "menu.logout": "Sair da conta",
    "menu.install": "Instalar App",

    // Dashboard
    "dash.hero_title": "Mente Abundante",
    "dash.hero_title_span": "& Vitoriosa",
    "dash.hero_desc": "A verdadeira vitória começa antes da ação. Reprograme seus pensamentos e conquiste resultados extraordinários.",
    "dash.card_coach_desc": "Mentoria personalizada para tirar dúvidas e manter o foco.",
    "dash.card_reprogram_desc": "Transforme crenças limitantes em pensamentos de poder.",
    "dash.card_planner_desc": "Defina metas e receba um plano de ação passo a passo.",
    "dash.card_anxiety_desc": "Áudio guiado imediato para recuperar seu equilíbrio.",
    "dash.card_plan7_desc": "Roteiro prático para destravar sua mente em uma semana.",
    "dash.card_checklist_desc": "Hábitos de sucesso para construir consistência diária.",
    "dash.card_visual_desc": "Exercício guiado de 2 minutos para ancorar o sucesso.",
    "dash.card_gratitude_desc": "Eleve sua vibração agradecendo pelo que você já tem.",
    "dash.new_tag": "Novo",

    // Planner
    "planner.title": "Planejador IA",
    "planner.subtitle": "Defina um objetivo e um prazo. Nossa IA criará um roteiro passo a passo para você chegar lá.",
    "planner.label_goal": "Seu Objetivo",
    "planner.placeholder_goal": "Ex: Aprender inglês básico, Lançar um e-book...",
    "planner.label_time": "Prazo",
    "planner.placeholder_time": "Ex: 30 dias, 3 meses...",
    "planner.btn_generate": "Gerar Plano de Ação",
    "planner.empty_state": "Nenhum plano criado ainda.\nComece agora e transforme metas em realidade.",

    // Reprogrammer
    "reprogram.title": "Reprogramação Mental",
    "reprogram.subtitle": "Identifique bloqueios e use a IA para aplicar o método 'Pensar, Sentir, Ressignificar'.",
    "reprogram.label_block": "Identificar Bloqueio",
    "reprogram.placeholder_block": "O que sua mente diz que você não consegue fazer? Ex: 'Não nasci para ser rico'...",
    "reprogram.btn_analyze": "Ressignificar Agora",
    "reprogram.result_label": "Nova Programação Sugerida:",
    "reprogram.history_title": "Seu Histórico de Transformação",
    "reprogram.empty_state": "Nenhuma reprogramação registrada ainda.\nComece acima.",
    "reprogram.btn_save": "Confirmar e Salvar no Diário",
    "reprogram.btn_cancel": "Cancelar",

    // Gratitude
    "gratitude.title": "Diário da Gratidão",
    "gratitude.subtitle": "Agradecer pelo que você já tem é a maneira mais rápida de atrair o que você deseja.",
    "gratitude.label_input": "Pelo que você é grato hoje?",
    "gratitude.placeholder_input": "Ex: Sou grato pela conversa inspiradora que tive hoje, pelo café quente...",
    "gratitude.btn_submit": "Agradecer",
    "gratitude.history_title": "Seu Histórico de Bênçãos",
    "gratitude.empty_state": "Nenhum agradecimento registrado ainda.\nComece hoje e veja a mágica acontecer.",

    // Checklist
    "checklist.title": "Ritual Diário",
    "checklist.subtitle": "Não apenas marque tarefas. Sinta cada pequena vitória e receba insights.",
    "checklist.summary_title": "Diário de Bordo",
    
    // Profile
    "profile.title": "Seu Perfil",
    "profile.subtitle": "Clique na foto para alterar sua imagem.",
    "profile.label_name": "Como prefere ser chamado?",
    "profile.label_mantra": "Sua Frase de Poder (Mantra Curto)",
    "profile.placeholder_name": "Seu nome",
    "profile.placeholder_mantra": "Ex: Sou disciplinado e venço meus desafios.",
    "profile.btn_save": "Salvar Alterações",
    "profile.btn_logout": "Sair da conta",
    "profile.btn_password": "Alterar Senha",

    // Coach
    "coach.title": "Mentor Virtual",
    "coach.placeholder": "Digite sua dúvida ou desabafo...",
    "coach.disclaimer": "O Mentor IA pode cometer erros. Verifique informações importantes.",

    // Support
    "support.title": "Suporte Técnico",
    "support.subtitle": "Assistente Inteligente",
    "support.placeholder": "Descreva seu problema...",

    // About Page (New)
    "about.title": "Sobre o MindRise",
    "about.subtitle": "Uma ferramenta digital para despertar seu potencial, reprogramar crenças e construir uma mentalidade vencedora.",
    "about.inspiration_title": "Inspiração",
    "about.inspiration_desc": "Este aplicativo é baseado nos princípios do guia \"Mente Abundante e Vencedora\". Acreditamos que a verdadeira vitória começa silenciosamente, dentro da mente, antes de se manifestar no mundo real.",
    "about.mindset_title": "O Poder da Transformação",
    "about.mindset_desc": "Muitos acreditam que vencer depende apenas de sorte ou talento, mas os campeões sabem que tudo começa com a mentalidade correta. Se sua mente acredita que você não pode, ela sabota seus esforços antes mesmo de começar.",
    "about.quote": "\"Você nunca vencerá por fora sem antes vencer por dentro.\"",
    "about.fixed_title": "Mentalidade Fixa",
    "about.fixed_desc": "Acredita que habilidades são imutáveis. Evita desafios por medo de falhar.",
    "about.growth_title": "Mentalidade de Crescimento",
    "about.growth_desc": "Entende que esforço gera evolução. Vê falhas como aprendizado.",
    "about.abundant_title": "Mentalidade Abundante",
    "about.abundant_desc": "Não compete, cria. Entende que há espaço para todos vencerem.",
    "about.purpose_title": "Nosso Propósito",
    "about.purpose_desc": "Criamos o MindRise para ser seu companheiro diário de evolução, unindo sabedoria ancestral com tecnologia de Inteligência Artificial.",
    "about.tools_title": "Explore as Ferramentas",
    "about.footer": "Feito com foco na sua evolução.",
  },
  en: {
    // Auth
    "auth.header_title": "Abundant Mind",
    "auth.header_subtitle": "Your reprogramming journey starts now.",
    "auth.tab_login": "Login",
    "auth.tab_register": "Sign Up",
    "auth.recover_title": "Recover Password",
    "auth.recover_desc": "Enter your email to receive the reset link.",
    "auth.email_label": "EMAIL",
    "auth.password_label": "PASSWORD",
    "auth.forgot_password": "Forgot?",
    "auth.btn_login": "Login",
    "auth.btn_register": "Create Free Account",
    "auth.btn_send_link": "Send Link",
    "auth.back_login": "Back to Login",
    "auth.terms": "Terms of Use and Privacy",
    "auth.error_generic": "Connection error. Please try again.",
    "auth.success_created": "Account created! Check your email.",

    // Sidebar
    "menu.dashboard": "Home",
    "menu.planner": "AI Planner",
    "menu.coach": "AI Coach",
    "menu.reprogram": "Reprogram",
    "menu.anxiety": "Anxiety SOS",
    "menu.plan7": "7-Day Plan",
    "menu.checklist": "Checklist",
    "menu.gratitude": "Gratitude",
    "menu.visualization": "Visualization",
    "menu.stats": "Evolution",
    "menu.feedback": "Feedback",
    "menu.support": "Support",
    "menu.about": "About",
    "menu.logout": "Logout",
    "menu.install": "Install App",

    // Dashboard
    "dash.hero_title": "Abundant Mind",
    "dash.hero_title_span": "& Victorious",
    "dash.hero_desc": "True victory begins before action. Reprogram your thoughts and achieve extraordinary results.",
    "dash.card_coach_desc": "Personalized mentorship to clear doubts and stay focused.",
    "dash.card_reprogram_desc": "Transform limiting beliefs into powerful thoughts.",
    "dash.card_planner_desc": "Set goals and receive a step-by-step action plan.",
    "dash.card_anxiety_desc": "Immediate guided audio to restore your balance.",
    "dash.card_plan7_desc": "Practical roadmap to unlock your mind in a week.",
    "dash.card_checklist_desc": "Success habits to build daily consistency.",
    "dash.card_visual_desc": "2-minute guided exercise to anchor success.",
    "dash.card_gratitude_desc": "Raise your vibration by appreciating what you already have.",
    "dash.new_tag": "New",

    // Planner
    "planner.title": "AI Planner",
    "planner.subtitle": "Set a goal and a deadline. Our AI will create a step-by-step roadmap for you to get there.",
    "planner.label_goal": "Your Goal",
    "planner.placeholder_goal": "Ex: Learn basic English, Launch an e-book...",
    "planner.label_time": "Deadline",
    "planner.placeholder_time": "Ex: 30 days, 3 months...",
    "planner.btn_generate": "Generate Action Plan",
    "planner.empty_state": "No plan created yet.\nStart now and turn goals into reality.",

    // Reprogrammer
    "reprogram.title": "Mental Reprogramming",
    "reprogram.subtitle": "Identify blocks and use AI to apply the 'Think, Feel, Reframe' method.",
    "reprogram.label_block": "Identify Block",
    "reprogram.placeholder_block": "What does your mind say you can't do? Ex: 'I wasn't born to be rich'...",
    "reprogram.btn_analyze": "Reframe Now",
    "reprogram.result_label": "Suggested New Program:",
    "reprogram.history_title": "Your Transformation History",
    "reprogram.empty_state": "No reprogramming recorded yet.\nStart above.",
    "reprogram.btn_save": "Confirm and Save to Journal",
    "reprogram.btn_cancel": "Cancel",

    // Gratitude
    "gratitude.title": "Gratitude Journal",
    "gratitude.subtitle": "Appreciating what you already have is the fastest way to attract what you desire.",
    "gratitude.label_input": "What are you grateful for today?",
    "gratitude.placeholder_input": "Ex: I am grateful for the inspiring conversation I had today...",
    "gratitude.btn_submit": "Give Thanks",
    "gratitude.history_title": "Your History of Blessings",
    "gratitude.empty_state": "No gratitude recorded yet.\nStart today and watch the magic happen.",

    // Checklist
    "checklist.title": "Daily Ritual",
    "checklist.subtitle": "Don't just check tasks. Feel every small victory and receive insights.",
    "checklist.summary_title": "Logbook",

    // Profile
    "profile.title": "Your Profile",
    "profile.subtitle": "Click photo to change your image.",
    "profile.label_name": "How do you prefer to be called?",
    "profile.label_mantra": "Your Power Phrase (Short Mantra)",
    "profile.placeholder_name": "Your name",
    "profile.placeholder_mantra": "Ex: I am disciplined and I overcome my challenges.",
    "profile.btn_save": "Save Changes",
    "profile.btn_logout": "Logout",
    "profile.btn_password": "Change Password",

    // Coach
    "coach.title": "Virtual Mentor",
    "coach.placeholder": "Type your question or vent...",
    "coach.disclaimer": "The AI Mentor can make mistakes. Check important information.",

    // Support
    "support.title": "Tech Support",
    "support.subtitle": "Smart Assistant",
    "support.placeholder": "Describe your issue...",

    // About Page (New)
    "about.title": "About MindRise",
    "about.subtitle": "A digital tool to awaken your potential, reprogram beliefs, and build a winning mindset.",
    "about.inspiration_title": "Inspiration",
    "about.inspiration_desc": "This app is based on the principles of the \"Abundant and Victorious Mind\" guide. We believe true victory begins silently, within the mind, before manifesting in the real world.",
    "about.mindset_title": "The Power of Transformation",
    "about.mindset_desc": "Many believe winning depends only on luck or talent, but champions know it all starts with the right mindset. If your mind believes you can't, it sabotages your efforts before you even begin.",
    "about.quote": "\"You will never win on the outside without first winning on the inside.\"",
    "about.fixed_title": "Fixed Mindset",
    "about.fixed_desc": "Believes abilities are unchangeable. Avoids challenges for fear of failure.",
    "about.growth_title": "Growth Mindset",
    "about.growth_desc": "Understands that effort generates evolution. Sees failure as learning.",
    "about.abundant_title": "Abundant Mindset",
    "about.abundant_desc": "Does not compete, creates. Understands there is room for everyone to win.",
    "about.purpose_title": "Our Purpose",
    "about.purpose_desc": "We created MindRise to be your daily evolution companion, uniting ancient wisdom with AI technology.",
    "about.tools_title": "Explore the Tools",
    "about.footer": "Made with focus on your evolution.",
  },
  es: {
    // Auth
    "auth.header_title": "Mente Abundante",
    "auth.header_subtitle": "Tu viaje de reprogramación comienza ahora.",
    "auth.tab_login": "Entrar",
    "auth.tab_register": "Crear Cuenta",
    "auth.recover_title": "Recuperar Contraseña",
    "auth.recover_desc": "Ingresa tu correo para recibir el enlace.",
    "auth.email_label": "CORREO",
    "auth.password_label": "CONTRASEÑA",
    "auth.forgot_password": "¿Olvidaste?",
    "auth.btn_login": "Entrar",
    "auth.btn_register": "Crear Cuenta Gratis",
    "auth.btn_send_link": "Enviar Enlace",
    "auth.back_login": "Volver al Login",
    "auth.terms": "Términos de Uso y Privacidad",
    "auth.error_generic": "Error de conexión. Inténtalo de nuevo.",
    "auth.success_created": "¡Cuenta creada! Verifica tu correo.",

    // Sidebar
    "menu.dashboard": "Inicio",
    "menu.planner": "Planificador IA",
    "menu.coach": "AI Coach",
    "menu.reprogram": "Reprogramar",
    "menu.anxiety": "Ansiedad SOS",
    "menu.plan7": "Plan de 7 Días",
    "menu.checklist": "Checklist",
    "menu.gratitude": "Gratitud",
    "menu.visualization": "Visualización",
    "menu.stats": "Evolución",
    "menu.feedback": "Feedback",
    "menu.support": "Soporte",
    "menu.about": "Sobre",
    "menu.logout": "Cerrar Sesión",
    "menu.install": "Instalar App",

    // Dashboard
    "dash.hero_title": "Mente Abundante",
    "dash.hero_title_span": "& Victoriosa",
    "dash.hero_desc": "La verdadera victoria comienza antes de la acción. Reprograma tus pensamientos y conquista resultados extraordinarios.",
    "dash.card_coach_desc": "Mentoría personalizada para aclarar dudas y mantener el enfoque.",
    "dash.card_reprogram_desc": "Transforma creencias limitantes en pensamientos de poder.",
    "dash.card_planner_desc": "Define metas y recibe un plan de acción paso a paso.",
    "dash.card_anxiety_desc": "Audio guiado inmediato para recuperar tu equilibrio.",
    "dash.card_plan7_desc": "Hoja de ruta práctica para desbloquear tu mente en una semana.",
    "dash.card_checklist_desc": "Hábitos de éxito para construir consistencia diaria.",
    "dash.card_visual_desc": "Ejercicio guiado de 2 minutos para anclar el éxito.",
    "dash.card_gratitude_desc": "Eleva tu vibración agradeciendo lo que ya tienes.",
    "dash.new_tag": "Nuevo",

    // Planner
    "planner.title": "Planificador IA",
    "planner.subtitle": "Define un objetivo y un plazo. Nuestra IA creará una hoja de ruta paso a paso para que llegues allí.",
    "planner.label_goal": "Tu Objetivo",
    "planner.placeholder_goal": "Ej: Aprender inglés básico, Lanzar un libro...",
    "planner.label_time": "Plazo",
    "planner.placeholder_time": "Ej: 30 días, 3 meses...",
    "planner.btn_generate": "Generar Plan de Acción",
    "planner.empty_state": "Ningún plan creado aún.\nComienza ahora y transforma metas en realidad.",

    // Reprogrammer
    "reprogram.title": "Reprogramación Mental",
    "reprogram.subtitle": "Identifica bloqueos y usa la IA para aplicar el método 'Pensar, Sentir, Resignificar'.",
    "reprogram.label_block": "Identificar Bloqueo",
    "reprogram.placeholder_block": "¿Qué dice tu mente que no puedes hacer? Ej: 'No nací para ser rico'...",
    "reprogram.btn_analyze": "Resignificar Ahora",
    "reprogram.result_label": "Nueva Programación Sugerida:",
    "reprogram.history_title": "Tu Historial de Transformación",
    "reprogram.empty_state": "Ninguna reprogramación registrada aún.\nComienza arriba.",
    "reprogram.btn_save": "Confirmar y Guardar en Diario",
    "reprogram.btn_cancel": "Cancelar",

    // Gratitude
    "gratitude.title": "Diario de Gratitud",
    "gratitude.subtitle": "Agradecer lo que ya tienes es la forma más rápida de atraer lo que deseas.",
    "gratitude.label_input": "¿De qué estás agradecido hoy?",
    "gratitude.placeholder_input": "Ej: Estoy agradecido por la conversación inspiradora de hoy...",
    "gratitude.btn_submit": "Agradecer",
    "gratitude.history_title": "Tu Historial de Bendiciones",
    "gratitude.empty_state": "Ningún agradecimiento registrado aún.\nComienza hoy y mira la magia suceder.",

    // Checklist
    "checklist.title": "Ritual Diario",
    "checklist.subtitle": "No solo marques tareas. Siente cada pequeña victoria y recibe insights.",
    "checklist.summary_title": "Diario de Bordo",

    // Profile
    "profile.title": "Tu Perfil",
    "profile.subtitle": "Haz clic en la foto para cambiar tu imagen.",
    "profile.label_name": "¿Cómo prefieres llamarte?",
    "profile.label_mantra": "Tu Frase de Poder (Mantra Corto)",
    "profile.placeholder_name": "Tu nombre",
    "profile.placeholder_mantra": "Ej: Soy disciplinado y venzo mis desafíos.",
    "profile.btn_save": "Guardar Cambios",
    "profile.btn_logout": "Cerrar Sesión",
    "profile.btn_password": "Cambiar Contraseña",

    // Coach
    "coach.title": "Mentor Virtual",
    "coach.placeholder": "Escribe tu duda o desahogo...",
    "coach.disclaimer": "El Mentor IA puede cometer errores. Verifica información importante.",

    // Support
    "support.title": "Soporte Técnico",
    "support.subtitle": "Asistente Inteligente",
    "support.placeholder": "Describe tu problema...",

    // About Page (New)
    "about.title": "Sobre MindRise",
    "about.subtitle": "Una herramienta digital para despertar tu potencial, reprogramar creencias y construir una mentalidad ganadora.",
    "about.inspiration_title": "Inspiración",
    "about.inspiration_desc": "Esta aplicación se basa en los principios de la guía \"Mente Abundante y Victoriosa\". Creemos que la verdadera victoria comienza silenciosamente, dentro de la mente, antes de manifestarse en el mundo real.",
    "about.mindset_title": "El Poder de la Transformación",
    "about.mindset_desc": "Muchos creen que ganar depende solo de la suerte o el talento, pero los campeones saben que todo comienza con la mentalidad correcta. Si tu mente cree que no puedes, sabotea tus esfuerzos antes de empezar.",
    "about.quote": "\"Nunca ganarás por fuera sin antes ganar por dentro.\"",
    "about.fixed_title": "Mentalidad Fija",
    "about.fixed_desc": "Cree que las habilidades son inmutables. Evita desafíos por miedo a fallar.",
    "about.growth_title": "Mentalidad de Crecimiento",
    "about.growth_desc": "Entiende que el esfuerzo genera evolución. Ve los fallos como aprendizaje.",
    "about.abundant_title": "Mentalidad Abundante",
    "about.abundant_desc": "No compite, crea. Entiende que hay espacio para que todos ganen.",
    "about.purpose_title": "Nuestro Propósito",
    "about.purpose_desc": "Creamos MindRise para ser tu compañero diario de evolución, uniendo sabiduría ancestral con tecnología de Inteligencia Artificial.",
    "about.tools_title": "Explora las Herramientas",
    "about.footer": "Hecho con enfoque en tu evolución.",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('mente_language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('mente_language', language);
  }, [language]);

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
