export interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  website: string;
  modalities: string;
  languages: string[];
}

export const COMPANY_INFO: CompanyInfo = {
  name: 'Symmetrical Code',
  tagline: 'Software Studio especializado en soluciones digitales a medida con altos estándares de arquitectura y diseño.',
  description:
    'Symmetrical Code desarrolla aplicaciones web fullstack, plataformas SaaS, dashboards y sistemas a medida diseñados para escalar y ofrecer máxima performance.',
  website: 'https://www.symmetricalcode.com/',
  modalities: '100% Remoto internacional',
  languages: ['Español', 'English'],
};
