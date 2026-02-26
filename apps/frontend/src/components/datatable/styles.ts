/** Styles compatible with react-data-table-component customStyles prop */
export const lightStyles = {
  headCells: {
    style: {
      backgroundColor: 'rgb(241 245 249)',
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
  headCells: {
    style: {
      backgroundColor: 'rgb(30 41 59)',
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
};
