import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "@/pages/table/react-tables/GlobalFilter";
import { fetchGET } from "@/store/api/apiSlice";
import { DateWithMonthName } from "@/helper/DateFormatWithMonthName";
import { intialLetterName } from "@/helper/initialLetterName";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";


const TaskLists = ({ title }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const COLUMNS = [
    {
      Header: "S.No",
      accessor: "sno",
      Cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      Header: "Task Name",
      accessor: "taskName",
      Cell: ({ cell }) => <span>{cell.value}</span>,
    },
    {
      Header: "Assign To",
      accessor: "assign",
      Cell: ({ cell }) => (
        <div>
          <span className="inline-flex items-center">
            <span className="w-7 h-7 rounded-full ltr:mr-3 rtl:ml-3 flex-none bg-slate-600">

              {
                cell.value.image ?
                  <img src={cell.value.image} alt="" className="object-cover w-full h-full rounded-full" />
                  :
                  <span className="w-8 h-8 rounded-full ring-2 ring-white bg-[#002D2D] text-white flex justify-center items-center font-bold text-lg leading-none custom-avatar cursor-pointer">
                    {
                      cell.value.name ? intialLetterName("", "", cell.value.name) : ""
                    }
                  </span>
              }

            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
              {cell.value.name}
            </span>
          </span>
        </div>
      ),
    },
    {
      Header: "Due Date",
      accessor: "dueDate",
      Cell: ({ cell }) => <span>{DateWithMonthName(cell.value)}</span>,
    },
    {
      Header: "Status",
      accessor: "taskPosition",
      Cell: ({ cell }) => (
        <span className="block w-full text-center">
          <StatusBadge status={cell.value} size="md" />
        </span>
      ),
    },
    {
      Header: "Action",
      accessor: "action",
      Cell: ({ row }) => (
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Tooltip content="Screenshot" placement="top" arrow animation="shift-away">
            <span className="action-btn" type="button" onClick={() => navigate(`/screenshots/${row.original.taskId}`)}>
              <Icon icon="material-symbols:camera" />
            </span>
          </Tooltip>
          <Tooltip content="Logs" placement="top" arrow animation="shift-away">
            <span className="action-btn" type="button">
              <Icon icon="icon-park-twotone:log" />
            </span>
          </Tooltip>
        </div>
      ),
    }

  ];

  const columns = useMemo(() => COLUMNS, []);
  const [taskList, setTaskList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  useEffect(() => {
    const fetchProjectTaskDetails = async () => {
      try {
        const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/paginated-tasks-allData/${projectId}/?page=${currentPage}`);
        if (response.results) {
          const tasks = response.results.map(task => ({
            taskId: task.taskId,
            taskName: task.taskName,
            assign: {
              name: task.assign_name,
              image: task.assign_profile_pic ? `${import.meta.env.VITE_APP_DJANGO}${task.assign_profile_pic}`
                : null,
            },
            dueDate: task.dueDate,
            taskPosition: task.taskPosition,
          }));
          setTaskList(tasks);
          setTotalPage(() => Math.ceil(response.count / 10));
        }
      } catch (error) {
        console.error("Error fetching project tasks:", error);
      }
    };

    fetchProjectTaskDetails();
  }, [projectId, currentPage]);

  const tableInstance = useTable(
    {
      columns,
      data: taskList,
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

  const { globalFilter, pageIndex, pageSize } = state;

  return (
    <>
      <Card>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">{title}</h4>
          <div>
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
          </div>
        </div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden ">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-200 dark:bg-slate-700">
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
                  {taskList.length > 0 ? (
                    page.map((row) => {
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
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4">
                        No task data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
          <div className=" flex items-center space-x-3 rtl:space-x-reverse">
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
              Page{" "}
              <span>
                {pageIndex + 1} of {pageOptions.length}
              </span>
            </span>
          </div>
          <ul className="flex items-center  space-x-3  rtl:space-x-reverse">
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons:chevron-double-left-solid" />
              </button>
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                Prev
              </button>
            </li>
            {pageOptions.map((page, pageIdx) => (
              <li key={pageIdx}>
                <button
                  aria-current="page"
                  className={` ${pageIdx === pageIndex
                    ? "bg-slate-900 dark:bg-slate-600  dark:text-slate-200 text-white font-medium "
                    : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900  font-normal  "
                    }    text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                  onClick={() => gotoPage(pageIdx)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${(currentPage === totalPage) ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => { nextPage(); setCurrentPage(currentPage + 1) }}
                disabled={currentPage === totalPage}
              >
                Next
              </button>
            </li>
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
                className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                <Icon icon="heroicons:chevron-double-right-solid" />
              </button>
            </li>
          </ul>
        </div>
        {/*end*/}
      </Card>
    </>
  );
};

export default TaskLists;
