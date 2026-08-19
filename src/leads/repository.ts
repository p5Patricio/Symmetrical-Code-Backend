export interface DbLead {
  id: string;
  conversation_id: string | null;
  name: string | null;
  phone: string;
  company: string | null;
  project_type: string | null;
  description: string | null;
  timeline: string | null;
  budget: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED';
  created_at: string;
  updated_at: string;
}

export class LeadRepository {
  constructor(private db: D1Database) {}

  /**
   * Find existing lead by phone
   */
  async findByPhone(phone: string): Promise<DbLead | null> {
    return await this.db
      .prepare('SELECT * FROM leads WHERE phone = ? ORDER BY created_at DESC LIMIT 1')
      .bind(phone)
      .first<DbLead>();
  }

  /**
   * Create or update lead
   */
  async saveOrUpdateLead(lead: {
    conversationId?: string;
    phone: string;
    name?: string;
    company?: string;
    projectType?: string;
    description?: string;
    timeline?: string;
    budget?: string;
  }): Promise<DbLead> {
    const existing = await this.findByPhone(lead.phone);

    if (existing) {
      const updatedName = lead.name || existing.name;
      const updatedCompany = lead.company || existing.company;
      const updatedProjectType = lead.projectType || existing.project_type;
      const updatedDescription = lead.description || existing.description;
      const updatedTimeline = lead.timeline || existing.timeline;
      const updatedBudget = lead.budget || existing.budget;

      await this.db
        .prepare(
          `UPDATE leads SET
            name = ?, company = ?, project_type = ?, description = ?, timeline = ?, budget = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(
          updatedName,
          updatedCompany,
          updatedProjectType,
          updatedDescription,
          updatedTimeline,
          updatedBudget,
          existing.id
        )
        .run();

      return {
        ...existing,
        name: updatedName,
        company: updatedCompany,
        project_type: updatedProjectType,
        description: updatedDescription,
        timeline: updatedTimeline,
        budget: updatedBudget,
        updated_at: new Date().toISOString(),
      };
    }

    const newId = crypto.randomUUID();
    await this.db
      .prepare(
        `INSERT INTO leads (id, conversation_id, name, phone, company, project_type, description, timeline, budget, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`
      )
      .bind(
        newId,
        lead.conversationId || null,
        lead.name || null,
        lead.phone,
        lead.company || null,
        lead.projectType || null,
        lead.description || null,
        lead.timeline || null,
        lead.budget || null
      )
      .run();

    return {
      id: newId,
      conversation_id: lead.conversationId || null,
      name: lead.name || null,
      phone: lead.phone,
      company: lead.company || null,
      project_type: lead.projectType || null,
      description: lead.description || null,
      timeline: lead.timeline || null,
      budget: lead.budget || null,
      status: 'NEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
