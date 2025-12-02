import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import Card from '@/components/ui/Card';
import ListSkeleton from '@/pages/table/ListSkeleton';
import { intialLetterName } from '@/helper/helper';
import { djangoBaseURL } from '@/helper';
import { Icon } from '@iconify/react';

const LiveReportTableTest = ({
  data,
  loading,
  expandedRow,
  toggleRow,
  getScreenShot,
  currentItems,
  handleBack,
  handleNext,
  loadingScreenShot,
  currentPage,
  itemsPerPage,
  screenShot,
  setIsImageViewerOpen,
  setCurrentIndex,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update currentTime every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'SN',
        accessor: (_, rowIndex) => rowIndex + 1,
        Cell: (row) => <span>{row?.cell?.value}</span>,
      },
      {
        Header: 'Employees',
        accessor: 'full_name', // Combine first and last name for display
        Cell: (row) => {
          const profilePicture = row?.row?.original?.profile_picture;
          const fullName = row?.row?.original?.userName;

          return (
            <div className="flex items-center gap-5 min-w-[180px]">
              {profilePicture ? (
                <img
                  src={`${djangoBaseURL}${profilePicture}`}
                  alt={fullName}
                  className="w-[2.5rem] h-[2.5rem] rounded-full"
                />
              ) : (
                <span className="bg-[#002D2D] text-white flex justify-center items-center rounded-full font-bold w-[2.5rem] h-[2.5rem]">
                  {intialLetterName('', '', fullName)}
                </span>
              )}
              <span>{fullName || 'Unknown Employee'}</span>
            </div>
          );
        },
      },
      {
        Header: 'Current Status',
        accessor: 'status',
        Cell: ({ row }) => {
          const endTimeStr = row.original.endTime;
          if (!endTimeStr) {
            // Handle missing endTime
            return (
              <div className="flex items-center justify-center gap-2">
                <Icon icon="svg-spinners:pulse" className="text-red-600 w-4 h-4" />
              </div>
            );
          }
          const endTime = new Date(endTimeStr);
          const diffMs = currentTime - endTime; // Difference in milliseconds
          const diffSeconds = diffMs / 1000; // Convert to seconds

          const isActive = diffSeconds <= 35;

          return (
            <div className="flex items-center justify-center gap-2">
              {isActive ? (
                <Icon icon="svg-spinners:bars-scale" className="text-green-600 w-4 h-4" />
              ) : (
                <Icon icon="svg-spinners:pulse" className="text-red-600 w-4 h-4" />
              )}
            </div>
          );
        },
      },
      {
        Header: 'Time Spent',
        accessor: 'timeSpent',
        Cell: ({ row }) => {
          const { startTime, endTime } = row.original;

          if (!startTime || !endTime) {
            return <span>-</span>;
          }

          const startTimeDate = new Date(startTime);
          const endTimeDate = new Date(endTime);

          // Calculate time since endTime to determine if user is active
          const timeSinceEndTimeMs = currentTime - endTimeDate;
          const timeSinceEndTimeSeconds = timeSinceEndTimeMs / 1000;
          const isActive = timeSinceEndTimeSeconds <= 35;

          // If user is active, calculate time spent from startTime to currentTime
          let timeSpentMinutes;
          if (isActive) {
            const timeSpentMs = currentTime - startTimeDate;
            timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60)); // total minutes
          } else {
            // User is inactive, display '-'
            return <span>-</span>;
          }

          return <span>{timeSpentMinutes} min</span>;
        },
      },
      {
        Header: 'Task',
        accessor: 'taskName',
        Cell: (row) => (
          <span title={row?.cell?.value}>
            {`${row?.cell?.value?.slice(0, 80)}${row?.cell?.value?.length > 80 ? '...' : ''
              }`}
          </span>
        ),
      },
      {
        Header: 'Project',
        accessor: 'projectName',
        Cell: (row) => <span>{row?.cell?.value || 'No Project Assigned'}</span>,
      },
      
      {
        Header: '',
        accessor: 'expand',
        Cell: (row) => (
          <span>
            {expandedRow === row.row.index ? (
              <Icon icon="humbleicons:chevron-up" />
            ) : (
              <Icon icon="humbleicons:chevron-down" />
            )}
          </span>
        ),
      },
    ],
    [expandedRow, currentTime]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useSortBy
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
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
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        scope="col"
                        className="table-th"
                      >
                        <div className="flex justify-between w-full">
                          {column.render('Header')}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? ' 🔽'
                                : ' 🔼'
                              : ''}
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
                {loading ? (
                  <ListSkeleton />
                ) : rows?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      No live user found
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    prepareRow(row);
                    return (
                      <React.Fragment key={index}>
                        <tr
                          className="cursor-pointer"
                          onClick={() => {
                            toggleRow(index);
                            getScreenShot(row?.original?.userId);
                          }}
                        >
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td">
                              {cell.render('Cell')}
                            </td>
                          ))}
                        </tr>
                        {expandedRow === index &&
                          (loadingScreenShot ? (
                            <tr>
                              <td colSpan="7" className="text-center">
                                <ListSkeleton />
                              </td>
                            </tr>
                          ) : currentItems?.length > 0 ? (
                            <tr>
                              <td colSpan="7" className="px-2 md:px-6 py-3">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={handleBack}
                                    disabled={currentPage === 0}
                                    className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-black rounded mr-4"
                                  >
                                    <Icon icon="mi:chevron-left" />
                                  </button>
                                  <div className="grid grid-cols-3 gap-6 m-auto">
                                    {currentItems.map((item, idx) => (
                                      <div
                                        className="flex flex-col items-center gap-2 cursor-pointer"
                                        key={idx}
                                        onClick={() => {
                                          setCurrentIndex(0);
                                        }}
                                      >
                                        <div
                                          className=""
                                          onClick={() =>
                                            setIsImageViewerOpen(true)
                                          }
                                        >
                                          <img
                                            src={item?.url}
                                            alt="screenshot"
                                            className="w-[15rem] h-[15rem] object-contain"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={handleNext}
                                    disabled={
                                      (currentPage + 1) * itemsPerPage >=
                                      screenShot?.length
                                    }
                                    className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-black rounded ml-4"
                                  >
                                    <Icon icon="mi:chevron-right" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="px-2 md:px-6 py-3 text-center"
                              >
                                No Screenshot Found
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LiveReportTableTest;
