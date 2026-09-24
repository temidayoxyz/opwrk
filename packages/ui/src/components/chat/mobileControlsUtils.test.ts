import { describe, expect, test } from 'bun:test';
import type { Agent } from '@opencode-ai/sdk/v2';

import { formatAgentDisplayName, getAgentDisplayName } from './mobileControlsUtils';

const labels = {
  work: 'Work',
  plan: 'Plan',
  selectAgent: 'Select agent',
};

const agent = (name: string, mode: Agent['mode'] = 'primary'): Agent => ({
  name,
  mode,
  permission: [],
  options: {},
});

describe('formatAgentDisplayName', () => {
  test('maps OpenCode built-in agent IDs to OpWrk mode labels', () => {
    expect(formatAgentDisplayName('build', labels)).toBe('Work');
    expect(formatAgentDisplayName('plan', labels)).toBe('Plan');
  });

  test('keeps custom agents readable without changing their IDs', () => {
    expect(formatAgentDisplayName('researcher', labels)).toBe('Researcher');
  });
});

describe('getAgentDisplayName', () => {
  test('uses Work as the default primary mode when OpenCode exposes build', () => {
    expect(getAgentDisplayName([agent('plan'), agent('build')], labels)).toBe('Work');
  });

  test('uses the localized empty label when no agents are available', () => {
    expect(getAgentDisplayName([], labels)).toBe('Select agent');
  });
});
