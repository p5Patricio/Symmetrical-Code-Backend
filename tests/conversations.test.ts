import { describe, it, expect } from 'vitest';
import {
  isBotResponseAllowed,
  getNextStateOnUserMessage,
} from '../src/conversations/state';

describe('Conversation State Machine', () => {
  it('allows bot response when BOT_ACTIVE or CLOSED', () => {
    expect(isBotResponseAllowed('BOT_ACTIVE', true)).toBe(true);
    expect(isBotResponseAllowed('CLOSED', true)).toBe(true);
  });

  it('disallows bot response when bot_active is false or in HUMAN state', () => {
    expect(isBotResponseAllowed('BOT_ACTIVE', false)).toBe(false);
    expect(isBotResponseAllowed('HUMAN_REQUESTED', true)).toBe(false);
    expect(isBotResponseAllowed('HUMAN_ACTIVE', true)).toBe(false);
    expect(isBotResponseAllowed('HUMAN_ACTIVE', false)).toBe(false);
  });

  it('transitions to HUMAN_REQUESTED on handoff trigger', () => {
    const nextState = getNextStateOnUserMessage('BOT_ACTIVE', true);
    expect(nextState.nextStatus).toBe('HUMAN_REQUESTED');
    expect(nextState.botActive).toBe(false);
    expect(nextState.humanRequested).toBe(true);
  });

  it('remains in HUMAN_REQUESTED or HUMAN_ACTIVE on regular user message', () => {
    const state1 = getNextStateOnUserMessage('HUMAN_REQUESTED', false);
    expect(state1.nextStatus).toBe('HUMAN_REQUESTED');
    expect(state1.botActive).toBe(false);

    const state2 = getNextStateOnUserMessage('HUMAN_ACTIVE', false);
    expect(state2.nextStatus).toBe('HUMAN_ACTIVE');
    expect(state2.botActive).toBe(false);
  });
});
