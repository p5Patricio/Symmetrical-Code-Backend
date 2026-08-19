export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  techStack?: string;
  url?: string;
}

export const VERIFIED_PROJECTS: ProjectItem[] = [
  {
    id: 'prj-1',
    slug: 'symmetrical-code-studio',
    title: 'Symmetrical Code Studio Web',
    description: 'Sitio corporativo y plataforma digital con diseño Cyberpunk Glassmorphic y experiencia interactiva moderna.',
    techStack: 'React, TypeScript, Vite, Tailwind CSS',
    url: 'https://www.symmetricalcode.com/',
  },
  // Additional verified projects can be added here or dynamically retrieved from D1
];

export async function getProjectsFromDb(db: D1Database): Promise<ProjectItem[]> {
  try {
    const { results } = await db
      .prepare('SELECT id, slug, title, description, tech_stack as techStack, url FROM projects WHERE active = 1')
      .all<ProjectItem>();
    return results && results.length > 0 ? results : VERIFIED_PROJECTS;
  } catch {
    return VERIFIED_PROJECTS;
  }
}
