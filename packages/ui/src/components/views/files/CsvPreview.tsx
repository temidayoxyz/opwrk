import React from 'react';
import { useI18n } from '@/lib/i18n';
import { parseCsvPreview } from './parseCsvPreview';

type CsvPreviewProps = {
  content: string;
  fileName: string;
};

export const CsvPreview = ({ content, fileName }: CsvPreviewProps) => {
  const { t } = useI18n();
  const { rows, limited } = React.useMemo(() => parseCsvPreview(content), [content]);
  const columnCount = Math.max(0, ...rows.map((row) => row.length));

  return (
    <div className="min-w-full overflow-x-auto p-3">
      {limited ? (
        <p className="mb-3 rounded-md border border-status-warning/20 bg-status-warning/10 px-3 py-2 typography-ui text-status-warning">
          {t('filesView.csv.previewLimited')}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="typography-ui text-muted-foreground">{t('filesView.csv.empty')}</p>
      ) : (
        <table className="w-full min-w-max border-collapse typography-ui text-foreground">
          <caption className="sr-only">{fileName}</caption>
          <thead className="bg-[var(--surface-subtle)]">
            <tr>
              {Array.from({ length: columnCount }, (_, column) => (
                <th key={column} scope="col" className="border border-border/50 px-3 py-2 text-left font-medium whitespace-pre-wrap">
                  {rows[0][column] ?? ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columnCount }, (_, column) => (
                  <td key={column} className="border border-border/50 px-3 py-2 align-top whitespace-pre-wrap">
                    {row[column] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
