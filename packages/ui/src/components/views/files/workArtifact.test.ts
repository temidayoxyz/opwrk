import { describe, expect, test } from 'bun:test';

import { getWorkArtifactKind } from './workArtifact';

describe('getWorkArtifactKind', () => {
  test('recognizes office and OpenDocument deliverables', () => {
    expect(getWorkArtifactKind('/work/report.docx')).toBe('document');
    expect(getWorkArtifactKind('/work/budget.XLSX')).toBe('spreadsheet');
    expect(getWorkArtifactKind('/work/pitch.odp')).toBe('presentation');
  });

  test('leaves unrelated binary files on the generic path', () => {
    expect(getWorkArtifactKind('/work/archive.zip')).toBeNull();
    expect(getWorkArtifactKind('/work/report.pdf')).toBeNull();
  });
});
