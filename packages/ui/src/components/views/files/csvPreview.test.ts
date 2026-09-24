import { expect, test } from 'bun:test';
import { parseCsvPreview } from './parseCsvPreview';

test('parses quoted commas, escaped quotes, multiline cells, and trailing empty cells', () => {
  expect(parseCsvPreview('Name,Notes,Extra\r\n"A, B","Line 1\nLine ""2""",\r\n').rows).toEqual([
    ['Name', 'Notes', 'Extra'],
    ['A, B', 'Line 1\nLine "2"', ''],
  ]);
});

test('does not invent a row for an empty file or a trailing newline', () => {
  expect(parseCsvPreview('').rows).toEqual([]);
  expect(parseCsvPreview('one,two\n').rows).toEqual([['one', 'two']]);
  expect(parseCsvPreview('""').rows).toEqual([['']]);
});

test('bounds preview work without changing the original content', () => {
  const content = `one,two\n${'value,other\n'.repeat(150)}`;
  const preview = parseCsvPreview(content);
  expect(preview.rows.length).toBe(100);
  expect(preview.limited).toBe(true);
  expect(content.endsWith('value,other\n')).toBe(true);

  const wide = parseCsvPreview(Array.from({ length: 40 }, (_, index) => String(index)).join(','));
  expect(wide.rows[0].length).toBe(30);
  expect(wide.limited).toBe(true);
});
