import React, { useMemo } from "react";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import Icon from "@/components/ui/Icon";
import { intialLetterName } from "@/helper/helper"; // Adjust the import path as needed

const COLUMNS = [
  {
    Header: "Task Name",
    accessor: "taskName",
    Cell: (row) => {
      const profilePic = row?.row?.original?.user_profile_pic;
      const firstName = row?.row?.original?.firstName;
      const lastName = row?.row?.original?.lastName;
      const name = row?.row?.original?.name;
      const email = row?.row?.original?.email;
      const userName = intialLetterName(firstName, lastName, name, email);

      return (
        <span className="flex items-center">
          <div className="flex-none">
            {profilePic ? (
              <div className="w-8 h-8 rounded-[100%] ltr:mr-3 rtl:ml-3">
                <img
                  src={`${import.meta.env.VITE_APP_DJANGO}${profilePic}`}
                  alt=""
                  className="w-full h-full rounded-[100%] object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-[100%] ltr:mr-3 rtl:ml-3 bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">
                  {userName}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 text-start">
            <h4 className="text-sm font-medium text-slate-600 whitespace-nowrap">
              {row?.row?.original?.taskName}
            </h4>
            <div className="text-xs font-normal text-slate-600 dark:text-slate-400">
              {row?.row?.original?.projectName}
            </div>
          </div>
        </span>
      );
    },
  },
  {
    Header: "Due Date",
    accessor: "dueDate",
    Cell: (row) => {
      return <span>{new Date(row.cell.value).toLocaleDateString()}</span>;
    },
  },
  {
    Header: "Performances",
    accessor: "time_difference",
    Cell: (row) => {
      const value = row?.cell?.value;
      return (
        <div className="flex space-x-6 items-center rtl:space-x-reverse">
          <span className={value > 0 ? "text-success-500" : "text-danger-500"}>
            {value}
          </span>
          <span className={`text-xl ${value > 0 ? "text-success-500" : "text-danger-500"}`}>
            {value > 0 ? (
              <Icon icon="heroicons:arrow-trending-up" />
            ) : (
              <Icon icon="heroicons:arrow-trending-down" />
            )}
          </span>
        </div>
      );
    },
  },
  {
    Header: "Priority",
    accessor: "priority",
    Cell: (row) => {
      return <span>{row?.cell?.value}</span>;
    },
  },
  {
    Header: "Assigned By",
    accessor: "assignByName",
    Cell: (row) => {
      return <span>{row?.cell?.value}</span>;
    },
  },
];

const CompanyTable = ({ data }) => {
  const columns = useMemo(() => COLUMNS, []);
  const tableData = useMemo(() => data || [], [data]);

  const tableInstance = useTable(
    {
      columns,
      data: tableData,
      initialState: {
        pageSize: 6,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    state,
    gotoPage,
    pageCount,
    setPageSize,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;

  const { pageIndex, pageSize } = state;

  return (
    <>
      <div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden ">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className=" bg-slate-200 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                          scope="col"
                          className=" table-th "
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? " 🔽"
                                : " 🔼"
                              : ""}
                          </span>
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
                              {cell.render("Cell")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="md:flex md:space-y-0 space-y-5 justify-center mt-6 items-center">
          <ul className="flex items-center space-x-3 rtl:space-x-reverse overflow-auto">
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${
                  !canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left" />
              </button>
            </li>
            {pageOptions.map((page, pageIdx) => (
              <li key={pageIdx}>
                <button
                  aria-current="page"
                  className={` ${
                    pageIdx === pageIndex
                      ? "bg-slate-900 dark:bg-slate-600  dark:text-slate-200 text-white font-medium "
                      : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900  font-normal  "
                  } text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                  onClick={() => gotoPage(pageIdx)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${
                  !canNextPage ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default CompanyTable;
