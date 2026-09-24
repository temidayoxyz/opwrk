const MAX_PREVIEW_CHARS = 200_000;
const MAX_PREVIEW_ROWS = 100;
const MAX_PREVIEW_COLUMNS = 30;
const MAX_CELL_CHARS = 1_000;

export type CsvPreviewData = {
  rows: string[][];
  limited: boolean;
};

/** Read only a bounded preview; the editor retains the complete CSV draft. */
export const parseCsvPreview = (content: string): CsvPreviewData => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let hasRecordContent = false;
  let limited = content.length > MAX_PREVIEW_CHARS;
  const end = Math.min(content.length, MAX_PREVIEW_CHARS);

  const finishField = () => {
    if (row.length < MAX_PREVIEW_COLUMNS) {
      row.push(field);
    } else {
      limited = true;
    }
    field = '';
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
    hasRecordContent = false;
  };
  const append = (character: string) => {
    if (field.length < MAX_CELL_CHARS) {
      field += character;
    } else {
      limited = true;
    }
  };

  let index = 0;
  while (index < end && rows.length < MAX_PREVIEW_ROWS) {
    const character = content[index];
    if (inQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"' && index + 1 < end) {
          append('"');
          index++;
        } else {
          inQuotes = false;
        }
      } else {
        append(character);
      }
    } else if (character === '"' && field.length === 0) {
      inQuotes = true;
      hasRecordContent = true;
    } else if (character === ',') {
      finishField();
      hasRecordContent = true;
    } else if (character === '\n') {
      finishRow();
    } else if (character !== '\r' || content[index + 1] !== '\n') {
      append(character);
      hasRecordContent = true;
    }
    index++;
  }

  if (index === content.length && (hasRecordContent || row.length > 0)) {
    finishRow();
  }
  if (index < content.length) {
    limited = true;
  }

  return { rows, limited };
};
