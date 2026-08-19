export const TEMPLATES = {
  HUMAN_HANDOFF_ACK:
    '¡Perfecto! Ya le avisé a nuestro equipo de desarrollo 👨‍💻. Un miembro del equipo continuará la conversación contigo por este mismo chat a la brevedad.',

  OUT_OF_SCOPE:
    'En Symmetrical Code nos especializamos exclusivamente en desarrollo de software, aplicaciones web, plataformas SaaS y dashboards a medida. No realizamos marketing digital ni servicios ajenos a la ingeniería de software. ¿Hay algún proyecto de software en el que podamos ayudarte?',

  GENERIC_ERROR_FALLBACK:
    'En este momento experimentamos una intermitencia técnica con nuestro asistente automatizado. Si deseas, escribe *humano* para que un miembro del equipo te atienda directamente.',

  QUOTE_COMPLETED_ACK: (name?: string) =>
    `¡Excelente${name ? ' ' + name : ''}! Hemos recopilado la información preliminar de tu proyecto 🚀. Nuestro equipo revisará los detalles y te enviará una propuesta personalizada.`,
};
