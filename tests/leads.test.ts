import { describe, it, expect } from 'vitest';
import { LeadService } from '../src/leads/service';

describe('Lead Qualification Suite', () => {
  const dummyRepo: any = {};
  const leadService = new LeadService(dummyRepo);

  it('qualifies a lead as complete when both contact (name/phone) and project description are present', () => {
    const completeLead = {
      name: 'Patricio García',
      phone: '+524771234567',
      description: 'Sistema web de inventarios con panel de administración y facturación',
      projectType: 'Web Fullstack',
    };

    expect(leadService.isLeadComplete(completeLead)).toBe(true);
  });

  it('marks a lead as incomplete if project description is missing', () => {
    const incompleteLead = {
      name: 'Patricio García',
      phone: '+524771234567',
    };

    expect(leadService.isLeadComplete(incompleteLead)).toBe(false);
  });
});
