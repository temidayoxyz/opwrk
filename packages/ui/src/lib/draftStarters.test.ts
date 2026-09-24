import { describe, expect, test } from 'bun:test';

import { DEFAULT_GLOBAL_STARTERS, getBuiltInStarter } from './draftStarters';

describe('OpWrk draft starters', () => {
    test('defaults to artifact-first work instead of coding commands', () => {
        expect(DEFAULT_GLOBAL_STARTERS.map((starter) => starter.name)).toEqual([
            'research',
            'analyze-files',
            'create-document',
            'create-spreadsheet',
            'create-presentation',
            'create-image',
            'craft-goal',
            'schedule-task',
        ]);
    });

    test('keeps inherited developer commands available outside the default set', () => {
        expect(getBuiltInStarter('debug')?.command).toBe('/debug');
        expect(DEFAULT_GLOBAL_STARTERS.some((starter) => starter.name === 'debug')).toBe(false);
    });

    test('starts general work with a clarifying prompt rather than a slash command', () => {
        const research = getBuiltInStarter('research');
        expect(research?.command.startsWith('/')).toBe(false);
        expect(research?.command).toContain('source-cited report');
    });
});
