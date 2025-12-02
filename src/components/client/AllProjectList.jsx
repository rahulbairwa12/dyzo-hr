import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from 'react-table';

const AllProjectList = ({ showAllProjectModal, setShowAllProjectModal, projectList }) => {
  
  const COLUMNS = [
    {
      Header: 'Project Name',
      accessor: 'name',
      Cell: (row) => (
        <div
          className="flex-1 font-medium text-sm leading-4 whitespace-nowrap"
          title={row?.cell?.value}
        >
          {row?.cell?.value.length > 20
            ? row?.cell?.value.substring(0, 20) + '...'
            : row?.cell?.value}
        </div>
      ),
    },
    {
      Header: 'Assignee',
      accessor: 'assignee',
      Cell: (row) => (
        <div>
          <div className="flex justify-end sm:justify-start lg:justify-end xl:justify-start -space-x-1 rtl:space-x-reverse">
            {row?.cell?.value?.length === 0 ? (
              'No Assignee'
            ) : (
              row?.cell?.value?.map((user, userIndex) => (
                <span key={userIndex} className="text-sm">
                  {user.name}
                </span>
              ))
            )}
          </div>
        </div>
      ),
    },
  ];

  const columns = useMemo(() => COLUMNS, []);
  const data = useMemo(() => projectList, [projectList]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
  } = tableInstance;

  return (
    <Modal
      activeModal={showAllProjectModal}
      onClose={() => setShowAllProjectModal(false)}
      title="All Projects"
    >
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
          {...getTableProps()}
        >
          <thead className="bg-slate-100 dark:bg-slate-700">
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    scope="col"
                    className="table-th"
                  >
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
            {...getTableBodyProps()}
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()} className="table-td">
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default AllProjectList;
