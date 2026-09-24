import { getFileExtension } from '@/lib/toolHelpers';

export type WorkArtifactKind = 'document' | 'spreadsheet' | 'presentation';

const WORK_ARTIFACT_KIND_BY_EXTENSION = new Map<string, WorkArtifactKind>([
  ['doc', 'document'],
  ['docx', 'document'],
  ['odt', 'document'],
  ['xls', 'spreadsheet'],
  ['xlsx', 'spreadsheet'],
  ['ods', 'spreadsheet'],
  ['ppt', 'presentation'],
  ['pptx', 'presentation'],
  ['odp', 'presentation'],
]);

export const getWorkArtifactKind = (filePath: string): WorkArtifactKind | null => (
  WORK_ARTIFACT_KIND_BY_EXTENSION.get(getFileExtension(filePath)) ?? null
);
