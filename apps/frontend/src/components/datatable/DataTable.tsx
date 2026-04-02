import React, { useMemo } from 'react';
import RDT from 'react-data-table-component';
import { useTheme } from '../../contexts/ThemeContext';
import { lightStyles, darkStyles } from './styles';

export type { TableColumn } from 'react-data-table-component';

/** Sort direction: asc, desc, or origin (no sort / original order). */
export type SortDirection = 'asc' | 'desc' | 'origin';

export interface DataTableProps<T> extends React.ComponentProps<typeof RDT<T>> {
  /** Columns and data are passed through to react-data-table-component */
}

type RDTColumns<T> = React.ComponentProps<typeof RDT<T>>['columns'];

/** Strip minWidth/maxWidth from column props and move them into style so they are not forwarded to DOM (avoids React warning). */
function sanitizeColumns<T>(columns: RDTColumns<T>): RDTColumns<T> {
  if (!columns?.length) return columns;
  return columns.map((col) => {
    const { minWidth, maxWidth, style, ...rest } = col as Record<string, unknown>;
    if (minWidth == null && maxWidth == null) return col;
    const baseStyle = (style && typeof style === 'object' && !Array.isArray(style)) ? (style as Record<string, unknown>) : {};
    return {
      ...rest,
      style: {
        ...baseStyle,
        ...(minWidth != null && { minWidth }),
        ...(maxWidth != null && { maxWidth }),
      },
    } as (typeof columns)[number];
  }) as RDTColumns<T>;
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { isDark } = useTheme();
  const { customStyles: propsStyles, theme: propsTheme, columns, data = [], ...rest } = props;
  const theme = propsTheme ?? (isDark ? 'dark' : 'light');
  const customStyles = propsStyles ?? (isDark ? darkStyles : lightStyles);
  const sanitizedColumns = useMemo(() => sanitizeColumns(columns), [columns]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-auto">
      <RDT<T>
        {...rest}
        columns={sanitizedColumns}
        data={data}
        theme={theme}
        customStyles={customStyles}
      />
    </div>
  );
}
