import { LeadRepository, DbLead } from './repository';
import { logger } from '../utils/logger';

export interface LeadExtractionData {
  name?: string;
  phone: string;
  company?: string;
  projectType?: string;
  description?: string;
  timeline?: string;
  budget?: string;
}

export class LeadService {
  constructor(private repo: LeadRepository) {}

  /**
   * Checks if extracted details contain sufficient information to qualify as a commercial lead
   */
  isLeadComplete(data: LeadExtractionData): boolean {
    const hasContact = Boolean(data.name || data.phone);
    const hasProjectInfo = Boolean(data.description || data.projectType);
    return hasContact && hasProjectInfo;
  }

  /**
   * Persists or updates lead details
   */
  async processLeadDetails(
    conversationId: string,
    data: LeadExtractionData
  ): Promise<{ lead: DbLead; isComplete: boolean }> {
    logger.info('Processing lead details', { phone: data.phone, hasName: !!data.name, hasDesc: !!data.description });

    const lead = await this.repo.saveOrUpdateLead({
      conversationId,
      phone: data.phone,
      name: data.name,
      company: data.company,
      projectType: data.projectType,
      description: data.description,
      timeline: data.timeline,
      budget: data.budget,
    });

    const isComplete = this.isLeadComplete(data);
    return { lead, isComplete };
  }
}
