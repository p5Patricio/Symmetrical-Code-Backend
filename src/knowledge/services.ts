export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  features: string;
}

export const VERIFIED_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    slug: 'fullstack-web',
    title: 'Desarrollo Web Fullstack',
    description: 'Aplicaciones web modernas y escalables con frontend interactivo y backend robusto.',
    features: 'Arquitectura limpia, APIs REST/GraphQL, bases de datos optimizadas',
  },
  {
    id: 'srv-2',
    slug: 'saas-platforms',
    title: 'Plataformas SaaS & B2B',
    description: 'Sistemas cloud para modelos de negocio recurrentes y plataformas multi-tenant.',
    features: 'Autenticación, roles, pasarelas de pago, paneles administrativos',
  },
  {
    id: 'srv-3',
    slug: 'dashboards-analytics',
    title: 'Dashboards & Paneles de Analítica',
    description: 'Visualización de datos de negocio y métricas clave en tiempo real.',
    features: 'Gráficos interactivos, reportes exportables, alta performance',
  },
  {
    id: 'srv-4',
    slug: 'ecommerce',
    title: 'E-commerce a Medida',
    description: 'Tiendas online personalizadas con control de inventario y pagos seguros.',
    features: 'Stripe, PayPal, pasarelas locales, gestión de pedidos',
  },
  {
    id: 'srv-5',
    slug: 'landing-pages',
    title: 'Landing Pages de Alto Rendimiento',
    description: 'Sitios corporativos y páginas de conversión con máxima velocidad y optimización SEO.',
    features: 'Diseño responsivo premium, Web Vitals optimizados, copywriting persuasivo',
  },
];

export async function getServicesFromDb(db: D1Database): Promise<ServiceItem[]> {
  try {
    const { results } = await db
      .prepare('SELECT id, slug, title, description, features FROM services WHERE active = 1')
      .all<ServiceItem>();
    return results && results.length > 0 ? results : VERIFIED_SERVICES;
  } catch {
    return VERIFIED_SERVICES;
  }
}
