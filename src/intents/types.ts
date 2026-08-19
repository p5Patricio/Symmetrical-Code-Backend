export type IntentType =
  | 'GENERAL_INFORMATION'
  | 'SERVICES'
  | 'PROJECTS'
  | 'QUOTE'
  | 'HUMAN_HANDOFF'
  | 'CONTACT'
  | 'OUT_OF_SCOPE';

export interface IntentDetectionResult {
  intent: IntentType;
  confidence: number;
  extractedDetails?: {
    name?: string;
    projectType?: string;
    description?: string;
    timeline?: string;
    budget?: string;
    company?: string;
  };
  reason?: string;
}
