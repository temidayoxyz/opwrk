import type { IconName } from "@/components/icon/icons";
import type { I18nKey } from "@/lib/i18n";

// A draft starter is a reference to an existing command or skill, pinned to the
// onboarding/draft welcome screen as a one-click chip. Scope (global vs project)
// is NOT stored here — it is encoded by which list the ref lives in (global =
// settings.json, project = project config), derived from the command/skill's own
// scope when pinned.
export type DraftStarterType = 'command' | 'skill';

export type DraftStarterRef = {
    type: DraftStarterType;
    name: string;
};

// OpWrk's built-in work starters and inherited session commands. They stay
// available to pin, while DEFAULT_GLOBAL_STARTERS defines the work-first set
// shown to a new user.
type BuiltInStarter = {
    name: string;
    icon: IconName;
    labelKey: I18nKey;
    command: string;
};

export const BUILTIN_STARTERS: readonly BuiltInStarter[] = [
    {
        name: 'research',
        icon: 'search-eye',
        labelKey: 'chat.draftPresets.research.label',
        command: 'Help me research a topic and create a source-cited report. First ask what topic, audience, scope, and output format I need.',
    },
    {
        name: 'analyze-files',
        icon: 'file-search',
        labelKey: 'chat.draftPresets.analyzeFiles.label',
        command: 'Analyze the files in this workspace. First ask what question I want answered or outcome I need.',
    },
    {
        name: 'create-document',
        icon: 'file-text',
        labelKey: 'chat.draftPresets.createDocument.label',
        command: 'Create a polished document. First ask what type of document, audience, source material, and output format I need.',
    },
    {
        name: 'create-spreadsheet',
        icon: 'bar-chart-box',
        labelKey: 'chat.draftPresets.createSpreadsheet.label',
        command: 'Create a spreadsheet with an appropriate structure and formulas. First ask what data, calculations, and output format I need.',
    },
    {
        name: 'create-presentation',
        icon: 'booklet',
        labelKey: 'chat.draftPresets.createPresentation.label',
        command: 'Create a clear presentation. First ask about the audience, purpose, source material, slide count, and output format.',
    },
    {
        name: 'create-image',
        icon: 'file-image',
        labelKey: 'chat.draftPresets.createImage.label',
        command: 'Create an image. First ask about its purpose, dimensions, content, and visual style.',
    },
    { name: 'explore', icon: 'compass-3', labelKey: 'chat.draftPresets.explore.label', command: '/explore' },
    { name: 'catch-up', icon: 'history', labelKey: 'chat.draftPresets.catchup.label', command: '/catch-up' },
    { name: 'weigh', icon: 'scales-3', labelKey: 'chat.draftPresets.weigh.label', command: '/weigh' },
    { name: 'plan-feature', icon: 'survey', labelKey: 'chat.draftPresets.plan.label', command: '/plan-feature' },
    { name: 'craft-goal', icon: 'target', labelKey: 'chat.draftPresets.craftGoal.label', command: '/craft-goal' },
    { name: 'schedule-task', icon: 'calendar-schedule', labelKey: 'chat.draftPresets.scheduleTask.label', command: '/schedule-task' },
    { name: 'debug', icon: 'bug', labelKey: 'chat.draftPresets.debug.label', command: '/debug' },
    { name: 'review', icon: 'search-eye', labelKey: 'chat.draftPresets.review.label', command: '/workspace-review' },
];

const BUILTIN_BY_NAME = new Map<string, BuiltInStarter>(BUILTIN_STARTERS.map((s) => [s.name, s]));

export const getBuiltInStarter = (name: string): BuiltInStarter | undefined => BUILTIN_BY_NAME.get(name);

// Default global starter set (used until the user customizes the global list).
export const DEFAULT_GLOBAL_STARTERS: readonly DraftStarterRef[] = [
    { type: 'command', name: 'research' },
    { type: 'command', name: 'analyze-files' },
    { type: 'command', name: 'create-document' },
    { type: 'command', name: 'create-spreadsheet' },
    { type: 'command', name: 'create-presentation' },
    { type: 'command', name: 'create-image' },
    { type: 'command', name: 'craft-goal' },
    { type: 'command', name: 'schedule-task' },
];

// Fallback icons for user-defined starters, matching the Settings sections.
export const COMMAND_FALLBACK_ICON: IconName = 'terminal-box';
export const SKILL_FALLBACK_ICON: IconName = 'book-open';

export const starterKey = (ref: DraftStarterRef): string => `${ref.type}:${ref.name}`;

export const sameStarter = (a: DraftStarterRef, b: DraftStarterRef): boolean =>
    a.type === b.type && a.name === b.name;

// Turn a command/skill name into a human chip label: "/simplify-code" -> "Simplify code".
export const normalizeStarterLabel = (name: string): string => {
    const base = name
        .replace(/^\//, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!base) return name;
    return base.charAt(0).toUpperCase() + base.slice(1);
};

// Parse persisted starter refs (from settings.json or project config) defensively.
export const sanitizeStarterRefs = (value: unknown): DraftStarterRef[] => {
    if (!Array.isArray(value)) return [];
    const out: DraftStarterRef[] = [];
    const seen = new Set<string>();
    for (const entry of value) {
        if (!entry || typeof entry !== 'object') continue;
        const record = entry as Record<string, unknown>;
        const type = record.type === 'command' || record.type === 'skill' ? record.type : null;
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        if (!type || !name) continue;
        const key = `${type}:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ type, name });
    }
    return out;
};
