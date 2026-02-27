import RDT from 'react-data-table-component';
import { useTheme } from '../../contexts/ThemeContext';
import { lightStyles, darkStyles } from './styles';

export type { TableColumn } from 'react-data-table-component';

/** Sort direction: asc, desc, or origin (no sort / original order). */
export type SortDirection = 'asc' | 'desc' | 'origin';

export interface DataTableProps<T> extends React.ComponentProps<typeof RDT<T>> {
  /** Columns and data are passed through to react-data-table-component */
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { isDark } = useTheme();
  const { customStyles: propsStyles, theme: propsTheme, columns, data = [], ...rest } = props;
  const theme = propsTheme ?? (isDark ? 'dark' : 'light');
  const customStyles = propsStyles ?? (isDark ? darkStyles : lightStyles);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <RDT<T>
        {...rest}
        columns={columns}
        data={data}
        theme={theme}
        customStyles={customStyles}
      />
    </div>
  );
}
