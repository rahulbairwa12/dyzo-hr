import React, { useEffect, useMemo, useState } from "react";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import { intialLetterName } from "@/helper/initialLetterName";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import LoaderCircle from "@/components/Loader-circle";
import SkeletionTable from "@/components/skeleton/Table";
import { useParams } from "react-router-dom";

const COLUMNS = [
  {
    Header: "Assignee",
    accessor: "name",
    Cell: ({ row }) => {
      const { profile_picture, name } = row.original;
      return (
        <span className="flex items-center min-w-[150px]">
          <span className="w-8 h-8 rounded-full ltr:mr-3 rtl:ml-3 flex-none">
            {profile_picture ? (
              <img
                src={`${import.meta.env.VITE_APP_DJANGO}${profile_picture}`}
                alt={name}
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              <div className="rounded-full">
                <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-lg leading-none w-8 h-8 bg-cover bg-center">
                  {intialLetterName("", "", name)}
                </span>
              </div>
            )}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
            {name}
          </span>
        </span>
      );
    },
  },
  {
    Header: "Total Hours Spent",
    accessor: "total_hours_spent",
    Cell: ({ cell }) => <span>{cell.value}</span>,
  },
];

const TeamTable = () => {
  const { projectId } = useParams();
  const [assignee, setAssignee] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/api/project/${projectId}/employees-time-spent/`);
        if (data) {
          setAssignee(data);
        }
      } catch (error) {
        toast.error('Failed to fetch assignee');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignee();
  }, [projectId]);

  const columns = useMemo(() => COLUMNS, []);
  const data = useMemo(() => assignee, [assignee]);

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 4,
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
    prepareRow,
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
  } = tableInstance;

  const { pageIndex, pageSize } = state;

  return (
    <>
      <div>
        <div className="overflow-x-auto max-h-64  -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
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
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length}>
                        <SkeletionTable count="4" />
                      </td>
                    </tr>
                  ) : assignee.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length}>
                        <p className="text-center capitalize">No assignee found</p>
                      </td>
                    </tr>
                  ) : (
                    page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell) => (
                            <td
                              {...cell.getCellProps()}
                              className="table-td py-2"
                            >
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-6 items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <select
              className="form-control py-2 w-max"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[4, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page{" "}
              <span>
                {pageIndex + 1} of {pageOptions.length}
              </span>
            </span>
          </div>
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">

            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left"  className="w-5 h-5"/>
              </button>
            </li>

            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" className="w-5 h-5"/>

              </button>
            </li>

          </ul>
        </div>
      </div>
    </>
  );
};

export default TeamTable;
