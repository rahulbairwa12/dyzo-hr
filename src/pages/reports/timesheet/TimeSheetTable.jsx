import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip"; // Ensure correct import
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { intialLetterName } from "@/helper/helper";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { djangoBaseURL } from "@/helper";
import { Link, useNavigate } from "react-router-dom";
import { getStatusByCode } from '../../../utils/taskStatusStyles';
import StatusBadge from '../../../components/ui/StatusBadge';
import { ProfilePicture } from '@/components/ui/profilePicture';

const TimeSheetTable = ({
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
  handlePageInputSubmit
}) => {
  const firstPage = `${djangoBaseURL}/api/tasks/summary-detail/2/?startDate=${startDate}&endDate=${endDate}&page=1`;
  const lastPage = `${djangoBaseURL}/api/tasks/summary-detail/2/?startDate=${startDate}&endDate=${endDate}&page=${totalPageOfTable}`;
  const [pageInput, setPageInput] = useState(currentPageOfTable);
  const navigate = useNavigate()

  const STATUS_COLORS = {
    'Active': 'bg-green-400',
    'Away': 'bg-yellow-400',
    'Do not disturb': 'bg-red-400',
    'In a meeting': 'bg-blue-400',
    'Out sick': 'bg-gray-400',
    'Commuting': 'bg-purple-400',
    'On leave': 'bg-orange-400',
    'Focusing': 'bg-pink-400',
    'Working remotely': 'bg-indigo-400',
    'Offline': 'bg-gray-300',
    'Out for Lunch': 'bg-lime-400',
  };

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
      Cell: (row) => <span className="text-sm sm:text-base">{row?.cell?.value}</span>,
    },
    {
      Header: "Task",
      accessor: "taskName",
      Cell: (row) => <span className="text-sm sm:text-base">{row?.cell?.value}</span>,
    },
    {
      Header: "Employee's",
      accessor: "workingEmployees",
      Cell: (row) => (
        <div className="flex flex-wrap gap-3">
          {row?.cell?.value.map((employee, empIndex) => {
            const statusColor = STATUS_COLORS[employee.status] || 'bg-gray-400';
    
            return (
              <Tooltip
                key={empIndex}
                content={`Time spent ${employee.totalTimeSpent}`}
                placement="top"
                arrow
                animation="shift-away"
              >
                <div
                  className="group flex items-center space-x-2 sm:space-x-3"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/profile/${employee?.id}`);
                  }}
                >
                  <div className="relative">
                    <ProfilePicture 
                      user={{
                        name: employee.name,
                        profile_picture: employee.profilePicUrl
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                    />
                  </div>
                  <h3 className="text-sm text-slate-600 dark:text-white">
                    {employee.name}
                  </h3>
                </div>
              </Tooltip>
            );
          })}
        </div>
      ),
    },
    {
      Header: "Project",
      accessor: "projectName",
      Cell: (row) => <span className="text-sm sm:text-base">{row?.cell?.value}</span>,
    },
    {
      Header: "Time",
      accessor: "totalTimeSpent",
      Cell: (row) => {
        const [hours, minutes] = row?.cell?.value?.split(":")
        return (
          <span className="text-sm sm:text-base">{hours}H {minutes}M</span>
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
    {
      
      Header: "Action",
      accessor: "action",
      Cell: (row) => {
        const task = row.row.original;
        return (
          <div className="flex space-x-3 sm:space-x-4 rtl:space-x-reverse">
            <Tooltip content="Task Logs" placement="top" arrow animation="shift-away">
              <Link
                title="Task Logs"
                to={`/timesheet/task-logs/${task._id}`}
                state={{ task: task, filters: { selectedProject, CurrentUserId, startDate, endDate, selectedTimePeriod, selectedClient }, filterType: filterType }}
                className=""
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon="icon-park-twotone:log" className='w-6 h-6 sm:w-7 sm:h-7 cursor-pointer' />
              </Link>
            </Tooltip>
            <Tooltip content="Task Screenshots" placement="top" arrow animation="shift-away">
              <Link
                title="Task Screenshots"
                to={`/timesheet/task-logs/${task?._id}/${CurrentUserId}`}
                state={{ task: task, filters: { selectedProject, CurrentUserId, startDate, endDate, selectedTimePeriod, selectedClient }, filterType: filterType }}
                className=""
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon="material-symbols:camera" className='w-6 h-6 sm:w-7 sm:h-7 cursor-pointer' />
              </Link>
            </Tooltip>
          </div>
        );
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
        <div className="overflow-x-auto -mx-4 sm:-mx-6">
          <div className="inline-block min-w-full align-middle">
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
                          className="table-th px-3 sm:px-5 py-3 sm:py-4 text-sm"
                        >
                          <div className="flex items-center">
                            {column.render("Header")}
                            <span className="ml-2">
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
                      <td colSpan="7" className="text-center py-5 text-sm sm:text-base">
                        No Tasks were found!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="cursor-pointer relative">
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td px-3 sm:px-5 py-3 sm:py-4">
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
                <Icon icon="heroicons:chevron-double-left-solid" className='w-5 h-5'  />
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
                <Icon icon="heroicons:chevron-double-right-solid" className='w-5 h-5' />
              </button>
            </li>
          </ul>
        </div>
      </Card>
    </>
  );
};

export default TimeSheetTable;
