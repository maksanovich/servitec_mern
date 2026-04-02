/** Styles compatible with react-data-table-component customStyles prop */
const lightHeadBg = 'rgb(241 245 249)';
const darkHeadBg = 'rgb(30 41 59)';

export const lightStyles = {
  table: {
    style: {
      /** Let columns keep their min widths; parent scrolls horizontally when needed (fixed+100% squeezed all columns). */
      minWidth: '100%',
      width: 'max-content',
      tableLayout: 'auto' as const,
    },
  },
  tableWrapper: {
    style: {
      width: '100%',
      maxWidth: '100%',
      overflow: 'auto',
      overflowX: 'auto' as const,
    },
  },
  headRow: {
    style: {
      backgroundColor: lightHeadBg,
    },
  },
  headCells: {
    style: {
      backgroundColor: lightHeadBg,
      color: 'rgb(15 23 42)',
      fontWeight: 600,
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
    },
  },
  cells: {
    style: {
      fontSize: '0.875rem',
      padding: '0.75rem 1rem',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'rgb(241 245 249)',
      borderTop: '1px solid rgb(226 232 240)',
      minHeight: '52px',
      padding: '0.75rem 0',
    },
  },
  paginationWrapper: {
    style: {
      padding: '0',
    },
  },
  paginationRowsPerPage: {
    style: {
      paddingLeft: '0',
    },
  },
};

export const darkStyles = {
  table: {
    style: {
      minWidth: '100%',
      width: 'max-content',
      tableLayout: 'auto' as const,
      backgroundColor: darkHeadBg,
    },
  },
  tableWrapper: {
    style: {
      width: '100%',
      maxWidth: '100%',
      overflow: 'auto',
      overflowX: 'auto' as const,
    },
  },
  headRow: {
    style: {
      backgroundColor: darkHeadBg,
    },
  },
  headCells: {
    style: {
      backgroundColor: darkHeadBg,
      color: 'rgb(248 250 252)',
      fontWeight: 600,
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
    },
  },
  cells: {
    style: {
      fontSize: '0.875rem',
      padding: '0.75rem 1rem',
      color: 'rgb(226 232 240)',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
      backgroundColor: 'rgb(15 23 42)',
      '&:hover': {
        backgroundColor: 'rgb(30 41 59)',
      },
    },
  },
  pagination: {
    style: {
      backgroundColor: 'rgb(30 41 59)',
      borderTop: '1px solid rgb(51 65 85)',
      minHeight: '52px',
      padding: '0.75rem 0',
    },
  },
  paginationWrapper: {
    style: {
      padding: '0',
    },
  },
  paginationRowsPerPage: {
    style: {
      paddingLeft: '0',
    },
  },
  noData: {
    style: {
      backgroundColor: darkHeadBg,
    },
  },
};
