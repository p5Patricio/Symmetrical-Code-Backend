export interface FaqItem {
  question: string;
  answer: string;
}

export const VERIFIED_FAQS: FaqItem[] = [
  {
    question: '¿Cómo se definen los precios y cotizaciones?',
    answer:
      'Cada cotización es personalizada según los requerimientos del cliente, el alcance funcional, tecnologías involucradas y plazos. El asistente recopila los detalles iniciales y el equipo de ingeniería elabora la propuesta.',
  },
  {
    question: '¿Qué servicios NO realizan?',
    answer:
      'Symmetrical Code no realiza campañas de marketing digital, compra de pauta/ads, administración de redes sociales ni diseño de logos aislado. Nos enfocamos 100% en ingeniería y desarrollo de software.',
  },
  {
    question: '¿Cómo es la modalidad de trabajo?',
    answer:
      'Trabajamos de forma 100% remota con clientes en todo el mundo, con comunicación fluida y entregas continuas.',
  },
];
