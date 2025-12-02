import React, {  useMemo } from "react";
import { useDispatch } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useNavigate } from "react-router-dom";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import Icons from "@/components/ui/Icon";
import ProgressBar from "@/components/ui/ProgressBar";
import GlobalFilter from "@/pages/table/react-tables/GlobalFilter";

const ClientProjectList = ({ projects , setData, setShowEditProjectModal,setShowDeleteProjectModal,setProjectId}) => {
  const navigate = useNavigate();

  const COLUMNS = [
    {
      Header: "S/N",
      accessor: "sn",
      Cell: (row) => {
        return (
            <span>{row.row.index + 1}</span>);
      },
    },
    {
      Header: "Name",
      accessor: "name",
      Cell: (row) => {
        return (

          <div className="flex-1 font-medium text-sm leading-4 whitespace-nowrap" title={row?.cell?.value}>
            {row?.cell?.value.length > 20
              ? row?.cell?.value.substring(0, 20) + "..."
              : row?.cell?.value}
          </div>
        );
      },
    },

    
    {
      Header: "assignee",
      accessor: "assignee",
      Cell: (row) => {
       
        return (
          <div>
            <div className="flex justify-end sm:justify-start lg:justify-end xl:justify-start -space-x-1 rtl:space-x-reverse">

              {row?.cell?.value?.length === 0 ? ("No Assigne") : (

                row?.cell?.value?.slice(0, 3)?.map((user, userIndex) => (
                  <div className="h-6 w-6 rounded-full ring-1 ring-slate-100" key={userIndex}
                  >
                    <img
                      src={user.image}
                      alt={user.label}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                ))
             
              )}
            </div>
          </div>
        );
      },
    },

    {
      Header: "Working Hour",
      accessor: "total_hours",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },

    {
      Header: "Status",
      accessor: "progress",
      Cell: (row) => {

        const value = Number(row.row.original.completed_tasks / row.row.original.total_tasks)
        return (
          <>
            <span className="min-w-[220px] block">
              <ProgressBar value={value * 100} className="bg-primary-500" />
              <span className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium mt-3">
                {`${row.row.original.completed_tasks}/${row.row.original.total_tasks} Task Completed`}
              </span>
            </span>

          </>
        );
      },
    },

    {
      Header: "action",
      accessor: "action",
      Cell: (row) => {
        return (
          <div className="flex space-x-2 items-center">
            <span onClick={() => navigate('/dashboard/client/projects-detail', {state : {project : row.row.original}})} ><Icons icon="hugeicons:view" className='w-6 h-6 cursor-pointer' /></span>
            <span onClick={() => {setData(row.row.original); setShowEditProjectModal(true)}} ><Icons icon="heroicons:pencil-square" className='w-6 h-6 cursor-pointer' /></span>
            <span  onClick={() => {setProjectId(row.row.original__id); setShowDeleteProjectModal(true)}} ><Icons icon="ph:trash-light" className='w-6 h-6 cursor-pointer' /></span>
          </div>
        );
      },
    },
  ];
 
  const columns = useMemo(() => COLUMNS, []);
  const data = useMemo(() => projects, [projects]);

  const tableInstance = useTable(
    {
      columns,
      data,
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
    footerGroups,
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
       <div className="w-80 my-4">
        <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
      </div>
      
      <Card noborder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Project List</h4>
        </div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden ">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps}
              >
                <thead className=" bg-slate-100 dark:bg-slate-700">
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
                  {...getTableBodyProps}
                >
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr
                        {...row.getRowProps()}
                        className=" even:bg-slate-100 dark:even:bg-slate-700"
                      >
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
        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
          <div className=" flex items-center space-x-3 rtl:space-x-reverse">
            <span className=" flex space-x-2  rtl:space-x-reverse items-center">
              <span className=" text-sm font-medium text-slate-600 dark:text-slate-300">
                Go
              </span>
              <span>
                <input
                  type="number"
                  className=" form-control py-2"
                  defaultValue={pageIndex + 1}
                  onChange={(e) => {
                    const pageNumber = e.target.value
                      ? Number(e.target.value) - 1
                      : 0;
                    gotoPage(pageNumber);
                  }}
                  style={{ width: "50px" }}
                />
              </span>
            </span>
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
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left" />
              </button>
            </li>
            {pageOptions.map((page, pageIdx) => (
              <li key={pageIdx}>
                <button
                  href="#"
                  aria-current="page"
                  className={` ${pageIdx === pageIndex
                    ? "bg-slate-900 dark:bg-slate-600  dark:text-slate-200 text-white font-medium "
                    : "bg-slate-100  dark:text-slate-400 text-slate-900  font-normal "
                    }    text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                  onClick={() => gotoPage(pageIdx)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" />
              </button>
            </li>
          </ul>
        </div>
      </Card>

      
    </>
  );
};

export default ClientProjectList;
