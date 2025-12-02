import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { intialLetterName } from "@/helper/helper";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { djangoBaseURL } from "@/helper";
import { Link, useNavigate } from "react-router-dom";
import { getStatusByCode } from '../../../utils/taskStatusStyles';
import StatusBadge from '../../../components/ui/StatusBadge';

const ProjectReportTable = ({
  tasksData,
  loading,
  dataLoading,
  nextPage,
  prevPage,
  onPageChange,
  CurrentUserId,
  screenshotAllow,
  currentPageOfTable,
  totalPageOfTable,
  totalEntriesOfTable,
  selectedProject,
  startDate,
  endDate,
  selectedTimePeriod,
  selectedClient,
  filterType,
  handlePageInputSubmit,
  searchQuery
}) => {
  const companyId = tasksData && tasksData[0]?.companyId ? tasksData[0].companyId : "2";
  
  let firstPage = `${djangoBaseURL}/api/tasks/summary-detail/${companyId}/?startDate=${startDate}&endDate=${endDate}&page=1`;
  let lastPage = `${djangoBaseURL}/api/tasks/summary-detail/${companyId}/?startDate=${startDate}&endDate=${endDate}&page=${totalPageOfTable}`;
  
  if (selectedProject !== "0") {
    firstPage += `&projectId=${selectedProject}`;
    lastPage += `&projectId=${selectedProject}`;
  }
  
  if (searchQuery) {
    firstPage += `&taskName=${searchQuery}`;
    lastPage += `&taskName=${searchQuery}`;
  }
  
  if (CurrentUserId !== "0") {
    firstPage += `&employeeId=${CurrentUserId}`;
    lastPage += `&employeeId=${CurrentUserId}`;
  }
  
  const [pageInput, setPageInput] = useState(currentPageOfTable);
  const navigate = useNavigate()

  useEffect(() => {
    setPageInput(currentPageOfTable);
  }, [currentPageOfTable]);

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    if (value && !isNaN(value) && value > 0 && value <= totalPageOfTable) {
      setPageInput(value);
      handlePageInputSubmit(Number(value));
    } else {
      setPageInput(value);
    }
  };

  const columns = useMemo(() => [
    {
      Header: "SN",
      accessor: (_, rowIndex) => rowIndex + 1,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Task",
      accessor: "taskName",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Name",
      accessor: "name",
      Cell: (row) => (
        <>


          <div className="flex items-center">
            <img
              src={`${djangoBaseURL}${row.rows[0].original.workingEmployees[0].profilePicUrl}`}
              alt={row.rows[0].original.workingEmployees[0].name}
              className="w-[2rem] h-[2rem] mr-2 rounded-full"
            />
            <span>{row.rows[0].original.workingEmployees[0].name}</span>
          </div>

        </>
      )
    },
    {
      Header: "Project",
      accessor: "projectName",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Time",
      accessor: "totalTimeSpent",
      Cell: (row) => {
        const [hours, minutes] = row?.cell?.value?.split(":")
        return (
          <span>{hours}H {minutes}M</span>
        );
      },
    },
    {
      Header: "Status",
      accessor: "taskPosition",
      Cell: (row) => {
        return <StatusBadge status={row?.cell?.value} size="sm" />;
      },
    },
  ], []);

  const data = useMemo(() => tasksData, [tasksData]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <>
      <Card>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-200 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()} >
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          scope="col"
                          className=" table-th "
                        >
                          <div className="flex">
                            {column.render("Header")}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {loading || dataLoading ? (
                    <ListSkeleton />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        No Tasks were found!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      prepareRow(row);
                      return (

                        <tr {...row.getRowProps()} className="cursor-pointer relative" onClick={() => {
                          navigate(`/tasks?userId=2&taskId=${row.original._id}`)
                        }}>
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td">
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
        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Showing {currentPageOfTable} to {totalPageOfTable} of {totalEntriesOfTable} entries
            </span>
          </div>
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${currentPageOfTable <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => onPageChange(firstPage)}
                disabled={currentPageOfTable <= 1}
              >
                <Icon icon="heroicons:chevron-double-left-solid" />
              </button>
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${currentPageOfTable <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => onPageChange(prevPage)} disabled={!prevPage}
              >
                Prev
              </button>
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <input
                type="number"
                min={'1'}
                max={totalPageOfTable}
                className="py-1 px-2 focus:outline-none rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                value={pageInput}
                onChange={handlePageInputChange}
              />
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${currentPageOfTable >= totalPageOfTable ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => onPageChange(nextPage)} disabled={!nextPage}
              >
                Next
              </button>
            </li>
            <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${currentPageOfTable >= totalPageOfTable ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => onPageChange(lastPage)}
                disabled={currentPageOfTable >= totalPageOfTable}
              >
                <Icon icon="heroicons:chevron-double-right-solid" />
              </button>
            </li>
          </ul>
        </div>
      </Card>
    </>
  );
};

export default ProjectReportTable;
