import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "../table/react-tables/GlobalFilter";
import { NavLink } from "react-router-dom";
import AdvancedModal from "@/components/ui/AdvancedModal";

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// const IndeterminateCheckbox = ({ indeterminate, ...rest }) => {
//   const ref = React.useRef();

//   React.useEffect(() => {
//     if (ref.current) {
//       ref.current.indeterminate = indeterminate;
//     }
//   }, [indeterminate]);

//   return (
//     <input
//       type="checkbox"
//       {...rest}
//       className="table-checkbox"
//       ref={ref}
//     />
//   );
// };

const VacanciesListTable = ({ vacanciesList, title }) => {
  const COLUMNS = useMemo(
    () => [
      {
        Header: "Job ID",
        accessor: "job_id",
        Cell: ({ cell: { value } }) => <span>{value}</span>,
      },
      {
        Header: "Job Title",
        accessor: "job_title",
        Cell: ({ cell: { value } }) => (
          <Tooltip content={value} placement="top" arrow animation="shift-away">
            <span className="cursor-pointer">{truncateText(value, 25)}</span>
          </Tooltip>
        ),
      },
      {
        Header: "Skills",
        accessor: "skills",
        Cell: ({ cell: { value } }) => (
          <Tooltip content={value} placement="top" arrow animation="shift-away">
            <span className="cursor-pointer">{truncateText(value, 25)}</span>
          </Tooltip>
        ),
      },
      {
        Header: "Status",
        accessor: "is_active",
        Cell: ({ cell: { value } }) => (
          <span className="block w-full">
            <span
              className={`inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${value
                ? "text-success-500 bg-success-500"
                : "text-danger-500 bg-danger-500"
                }`}
            >
              {value ? "Active" : "Inactive"}
            </span>
          </span>
        ),
      },
      {
        Header: "Action",
        accessor: "job_id_duplicate",
        Cell: ({ cell: { value } }) => (
          <div className="flex space-x-3 rtl:space-x-reverse">
            <Tooltip content="View" placement="top" arrow animation="shift-away">
              <NavLink to={`/vacancy/${value}`}>
                <button className="action-btn" type="button">
                  <Icon icon="heroicons:eye" />
                </button>
              </NavLink>
            </Tooltip>
            <Tooltip content="Edit" placement="top" arrow animation="shift-away">
              <NavLink to={`/edit-vacancy/${value}`}>
                <button className="action-btn" type="button">
                  <Icon icon="heroicons:pencil-square" />
                </button>
              </NavLink>
            </Tooltip>
            <Tooltip content="Share" placement="top" arrow animation="shift-away">
              <button
                className="action-btn"
                type="button"
                onClick={() => openShareModal(value)}
              >
                <Icon icon="heroicons:share" />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => vacanciesList, [vacanciesList]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const urlOrigin = window.location.origin;
  const [currentJobId, setCurrentJobId] = useState(null);

  const openShareModal = (thisJobId) => {
    setCurrentJobId(thisJobId);
    setIsShareModalOpen(true);
  };

  const tableInstance = useTable(
    { columns: COLUMNS, data },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    // (hooks) => {
    //   hooks.visibleColumns.push((columns) => [
    //     {
    //       id: "selection",
    //       Header: ({ getToggleAllRowsSelectedProps }) => (
    //         <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
    //       ),
    //       Cell: ({ row }) => (
    //         <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
    //       ),
    //     },
    //     ...columns,
    //   ]);
    // }
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
    state: { globalFilter, pageIndex, pageSize },
    gotoPage,
    pageCount,
    setPageSize,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;

  return (
    <div>
      <Card>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">{title}</h4>
          <div>
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
          </div>
        </div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            {
              vacanciesList.length === 0 ? (<div className="text-center capitalize">No jobs found</div>) : (

                <div className="overflow-hidden">
                  <table
                    className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                    {...getTableProps()}
                  >
                    <thead className="bg-slate-200 dark:bg-slate-700">
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
                      {page.map((row) => {
                        prepareRow(row);
                        return (
                          <tr {...row.getRowProps()}>
                            {row.cells.map((cell) => (
                              <td {...cell.getCellProps()} className="table-td">
                                {cell.render("Cell")}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              )
            }

          </div>


          <AdvancedModal
            activeModal={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            className="max-w-xl"
            title="Share On:"
          >
            <div className="flex justify-around">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  "Check out this job: " + `${urlOrigin}/vacancy/${currentJobId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-white rounded-lg"
              >
                <Icon icon="logos:whatsapp-icon" width="40" height="40" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `${urlOrigin}/vacancy/${currentJobId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-white rounded-lg"
              >
                <Icon icon="logos:facebook" width="40" height="40" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                  `${urlOrigin}/vacancy/${currentJobId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-white rounded-lg"
              >
                <Icon icon="skill-icons:linkedin" width="40" height="40" />
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer" 
                className="px-4 py-2 text-blue rounded-lg hover:cursor-pointer"
                title="Copy Text"
                onClick={() => {
                  navigator.clipboard.writeText(`${urlOrigin}/vacancy/${currentJobId}`);
                }}
              >
                <Icon icon="cil:copy" width="40" height="40" />
              </a>
            </div>
          </AdvancedModal>
        </div>
        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <select
              className="form-control py-2 w-max"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page <span>{pageIndex + 1} of {pageOptions.length}</span>
            </span>
          </div>
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons:chevron-double-left-solid" />
              </button>
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                Prev
              </button>
            </li>
            {pageOptions.map((page, pageIdx) => (
              <li key={pageIdx}>
                <button
                  className={`${pageIdx === pageIndex
                    ? "bg-slate-900 dark:bg-slate-600 dark:text-slate-200 text-white font-medium"
                    : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900 font-normal"
                    } text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                  onClick={() => gotoPage(pageIdx)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                Next
              </button>
            </li>
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Icon icon="heroicons:chevron-double-right-solid" />
              </button>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default VacanciesListTable;
