import React, { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import Card from '@/components/ui/Card';
import ListSkeleton from '@/pages/table/ListSkeleton';
import { intialLetterName } from '@/helper/helper';
import { djangoBaseURL } from '@/helper';
import { Icon } from '@iconify/react';
import Badge from '@/components/ui/Badge';
import { ProfilePicture } from '@/components/ui/profilePicture';

const LiveReportTable = ({
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
  // Helper function to format date and time
  const formatScreenshotDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Check if the date is today
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Check if the date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], optionsTime)}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], optionsTime)}`;
    } else {
      const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return `${date.toLocaleDateString([], optionsDate)} at ${date.toLocaleTimeString([], optionsTime)}`;
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: 'SN',
        accessor: (_, rowIndex) => rowIndex + 1,
        Cell: (row) => <span>{row?.cell?.value}</span>,
      },
      {
        Header: 'Employees',
        accessor: 'full_name',
        Cell: (row) => {
          const userName = row?.row?.original?.userName;
          const profilePicture = row?.row?.original?.profile_picture;

          const user = {
            name: userName || 'User',
            profile_picture: profilePicture
          };

          return (
            <div className="flex items-center gap-5 min-w-[180px]">
              <ProfilePicture
                user={user}
                className="w-[2rem] h-[2rem] rounded-full"
              />
              <span>{userName || 'Unknown Employee'}</span>
            </div>
          );
        },
      },
      {
        Header: 'Status',
        accessor: 'status',
        // Custom sort to show active users on top
        sortType: (rowA, rowB, columnId) => {
          const currentTime = new Date();
          const aStatus = rowA.original.status;
          const bStatus = rowB.original.status;
          const aDiff = Math.floor((currentTime - new Date(rowA.original.endTime)) / (1000 * 60));
          const bDiff = Math.floor((currentTime - new Date(rowB.original.endTime)) / (1000 * 60));

          // A user is active if not paused and less than 5 minutes passed
          const aActive = !((aStatus && aStatus.toLowerCase() === 'paused') || aDiff >= 5);
          const bActive = !((bStatus && bStatus.toLowerCase() === 'paused') || bDiff >= 5);

          // If both are either active or inactive, consider them equal.
          if (aActive === bActive) return 0;
          // Active users come first.
          return aActive ? -1 : 1;
        },
        Cell: ({ row }) => {
          const { status, endTime } = row.original;
          const currentTime = new Date();
          const endTimeDate = new Date(endTime);
          const diffMinutes = Math.floor((currentTime - endTimeDate) / (1000 * 60));

          if ((status && status.toLowerCase() === 'paused') || diffMinutes >= 5) {
            return <Icon icon="svg-spinners:pulse" className="text-red-600 w-4 h-4" />;
          } else {
            return <Icon icon="svg-spinners:bars-scale" className="text-green-600 w-4 h-4" />;
          }
        },
      },
      {
        Header: () => (
          <span>
            {/* Show "Time" on small screens, "Time Spent" on larger screens */}
            <span className="2xl:hidden">Time</span>
            <span className="hidden 2xl:inline">Time Spent</span>
          </span>
        ),
        accessor: 'timeSpent',
        Cell: ({ row }) => {
          const { status, endTime, startTime } = row.original;
          const currentTime = new Date();
          const endTimeDate = new Date(endTime);
          const diffMinutes = Math.floor((currentTime - endTimeDate) / (1000 * 60));

          if ((status && status.toLowerCase() === 'paused') || diffMinutes >= 5) {
            return <span>-</span>;
          } else {
            const startTimeDate = new Date(startTime);
            const timeSpentMinutes = Math.floor((currentTime - startTimeDate) / (1000 * 60));
            return <span>{timeSpentMinutes <= 0 ? 0 : timeSpentMinutes} min</span>;
          }
        },
      },
      {
        Header: 'Task',
        accessor: 'taskName',
        Cell: (row) => (
          <span title={row?.cell?.value}>
            {`${row?.cell?.value?.slice(0, 80)}${row?.cell?.value?.length > 80 ? '...' : ''}`}
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
    [expandedRow]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [{ id: 'status', desc: false }],
      },
    },
    useSortBy
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

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
                        scope="col"
                        className="table-th"
                      >
                        <div className="flex justify-between w-full">
                          {column.render('Header')}
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
                                          setCurrentIndex(idx);
                                          setIsImageViewerOpen(true);
                                        }}
                                      >
                                        <img
                                          src={item?.url}
                                          alt="screenshot"
                                          className="w-[15rem]  object-contain"
                                        />
                                        <Badge
                                          label={formatScreenshotDateTime(item.dateCreated)}
                                          className="bg-blue-500 text-white"
                                        />
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

export default LiveReportTable;
