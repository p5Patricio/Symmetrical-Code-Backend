export type ConversationStatus =
  | 'BOT_ACTIVE'
  | 'HUMAN_REQUESTED'
  | 'HUMAN_ACTIVE'
  | 'CLOSED';

export interface ConversationStateData {
  id: string;
  phone: string;
  userId?: string;
  botActive: boolean;
  humanRequested: boolean;
  status: ConversationStatus;
  lastIntent?: string;
}

/**
 * Validates if the bot is allowed to automatically reply given current state.
 */
export function isBotResponseAllowed(status: ConversationStatus, botActive: boolean): boolean {
  if (!botActive) return false;
  return status === 'BOT_ACTIVE' || status === 'CLOSED';
}

/**
 * Transition state machine helper
 */
export function getNextStateOnUserMessage(
  currentState: ConversationStatus,
  isHandoffRequested: boolean
): { nextStatus: ConversationStatus; botActive: boolean; humanRequested: boolean } {
  if (isHandoffRequested) {
    return {
      nextStatus: 'HUMAN_REQUESTED',
      botActive: false,
      humanRequested: true,
    };
  }

  // If already in human interaction, do not re-enable bot automatically
  if (currentState === 'HUMAN_REQUESTED' || currentState === 'HUMAN_ACTIVE') {
    return {
      nextStatus: currentState,
      botActive: false,
      humanRequested: true,
    };
  }

  // Otherwise, bot stays active
  return {
    nextStatus: 'BOT_ACTIVE',
    botActive: true,
    humanRequested: false,
  };
}
