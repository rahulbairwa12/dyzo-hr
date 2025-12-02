import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { useTable, useSortBy } from 'react-table';
import Card from '@/components/ui/Card';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { fetchAuthPost } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';
import moment from 'moment';

const EmployeeSummaryTable = ({ 
  selectedProject, 
  selectedUser, 
  value, 
  userInfo 
}) => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalSumTime, setTotalSumTime] = useState('00:00');
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Fetch employee working hours data
  const fetchEmployeeData = async () => {
    if (!userInfo?.companyId || !value.startDate || !value.endDate) {
      setEmployeeData([]);
      return;
    }

    setLoading(true);
    try {
      let url;
      
      // Determine API endpoint based on project selection
      if (selectedProject && selectedProject.value !== '') {
        url = `${djangoBaseURL}/api/company/${userInfo.companyId}/project/${selectedProject.value}/working-hours/`;
      } else {
        url = `${djangoBaseURL}/api/company/${userInfo.companyId}/working-hours/`;
      }

      const payload = {
        startDate: value.startDate,
        endDate: value.endDate,
      };

      // Add userId to payload if specific user is selected
      if (selectedUser && selectedUser.value !== '') {
        payload.userId = selectedUser.value;
      }

      const response = await fetchAuthPost(url, {body: payload});
      
      if (response?.status === 1 && response?.data) {
        setEmployeeData(response.data);
        setTotalSumTime(response.totalSumTime || '00:00');
      } else {
        setEmployeeData([]);
        setTotalSumTime('00:00');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setEmployeeData([]);
      setTotalSumTime('00:00');
    } finally {
      setLoading(false);
    }
  };

  // Generate array of dates between startDate and endDate
  const dateRange = useMemo(() => {
    if (!value.startDate || !value.endDate) return [];
    
    const dates = [];
    const start = moment(value.startDate);
    const end = moment(value.endDate);
    
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      dates.push(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }
    
    return dates;
  }, [value.startDate, value.endDate]);

  // Fetch data when filters change
  useEffect(() => {
    fetchEmployeeData();
  }, [selectedProject, selectedUser, value.startDate, value.endDate, userInfo?.companyId]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  // Check scroll position on mount and data change
  useEffect(() => {
    checkScrollPosition();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', checkScrollPosition);
      }
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [employeeData, dateRange]);

  // Table columns configuration - dynamic based on date range
  const columns = useMemo(
    () => {
      const baseColumns = [
        {
          Header: 'S.No',
          accessor: 'index',
          Cell: ({ row }) => (
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {row.index + 1}
            </div>
          ),
        },
        {
          Header: 'Name',
          accessor: 'name',
          Cell: ({ value, row }) => (
            <div className="flex items-center gap-3">
              <ProfileCardWrapper userId={row.original.userId} >
                <ProfilePicture
                  user={{
                    name: value,
                    image: row.original.profilePictureUrl,
                  }}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              </ProfileCardWrapper>
              <div className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                {value}
              </div>
            </div>
          ),
        },
      ];

      // Add date columns dynamically
      const dateColumns = dateRange.map((date) => ({
        Header: moment(date).format('DD MMM'),
        accessor: `date_${date}`,
        Cell: ({ row }) => {
          const dailyData = row.original.dailyData || [];
          const dayData = dailyData.find(d => d.date === date);
          return (
            <div className="text-xs font-medium text-slate-900 dark:text-white text-center">
              {dayData?.totalTime || '0:00'}
            </div>
          );
        },
      }));

      const totalColumns = [
        {
          Header: 'Total Time',
          accessor: 'totalSumTime',
          sortType: 'basic',
          Cell: ({ value }) => (
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {value || '00:00'}
            </div>
          ),
        },
        {
          Header: 'Total (Decimal)',
          accessor: 'totalTimeSpentInDecimal',
          sortType: 'basic',
          Cell: ({ row }) => {
            // Calculate total decimal from dailyData
            const dailyData = row.original.dailyData || [];
            const total = dailyData.reduce((sum, day) => sum + (day.totalTimeSpentInDecimal || 0), 0);
            return (
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {total.toFixed(2)} hrs
              </div>
            );
          },
        },
      ];

      return [...baseColumns, ...dateColumns, ...totalColumns];
    },
    [dateRange]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: employeeData,
    },
    useSortBy
  );

  return (
    <Card className="mt-6" bodyClass="p-0">
      {/* Scroll Arrow Buttons */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            disabled={!showLeftArrow}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showLeftArrow
                ? 'bg-electricBlue-50 hover:bg-electricBlue-100 text-white dark:bg-electricBlue-50 dark:hover:bg-electricBlue-100'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <Icon icon="heroicons:chevron-left" className="w-5 h-5" />
          </button>
          <button
            onClick={scrollRight}
            disabled={!showRightArrow}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showRightArrow
                ? 'bg-electricBlue-50 hover:bg-electricBlue-100 text-white dark:bg-electricBlue-50 dark:hover:bg-electricBlue-100'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <Icon icon="heroicons:chevron-right" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto relative"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#94a3b8 #e2e8f0'
        }}
      >
        <style>
          {`
            .overflow-x-auto::-webkit-scrollbar {
              height: 8px;
            }
            .overflow-x-auto::-webkit-scrollbar-track {
              background: #e2e8f0;
              border-radius: 4px;
            }
            .dark .overflow-x-auto::-webkit-scrollbar-track {
              background: #1e293b;
            }
            .overflow-x-auto::-webkit-scrollbar-thumb {
              background: #94a3b8;
              border-radius: 4px;
            }
            .dark .overflow-x-auto::-webkit-scrollbar-thumb {
              background: #475569;
            }
            .overflow-x-auto::-webkit-scrollbar-thumb:hover {
              background: #64748b;
            }
            
            /* Sticky columns for header */
            thead .sticky-col-sno,
            thead .sticky-col-name {
              position: sticky;
              z-index: 30;
            }
            thead .sticky-col-sno {
              left: 0;
              background: #f3f4f6 !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
            }
            thead .sticky-col-name {
              left: 60px;
              background: #f3f4f6 !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
            }
            .dark thead .sticky-col-sno,
            .dark thead .sticky-col-name {
              background: #1e293b !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
            }
            
            /* Sticky columns for body */
            tbody .sticky-col-sno,
            tbody .sticky-col-name {
              position: sticky;
              z-index: 20;
            }
            tbody .sticky-col-sno {
              left: 0;
              background: #ffffff !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
            }
            tbody .sticky-col-name {
              left: 60px;
              background: #ffffff !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
            }
            .dark tbody .sticky-col-sno,
            .dark tbody .sticky-col-name {
              background: #0f172a !important;
              box-shadow: 2px 0 4px rgba(0, 0, 0, 0.2);
            }
            
            /* Border separator */
            .sticky-col-name::after {
              content: '';
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 1px;
              background: rgba(229, 231, 235, 1);
            }
            .dark .sticky-col-name::after {
              background: rgba(51, 65, 85, 1);
            }
          `}
        </style>
        {loading ? (
          // Skeleton Loader Table
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100 dark:bg-slate-800">
              <tr>
                {[...Array(Math.min(dateRange.length + 4, 10))].map((_, i) => (
                  <th key={i} className={`px-3 py-3 text-left text-sm ${i === 0 ? 'sticky-col-sno' : i === 1 ? 'sticky-col-name' : ''}`}>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {[...Array(10)].map((_, index) => (
                <tr key={index}>
                  {[...Array(Math.min(dateRange.length + 4, 10))].map((_, i) => (
                    <td key={i} className={`px-3 py-2 whitespace-nowrap ${i === 0 ? 'sticky-col-sno' : i === 1 ? 'sticky-col-name' : ''}`}>
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table {...getTableProps()} className="w-full table-auto border-collapse">
            <thead className="bg-gray-100 dark:bg-slate-800">
              {headerGroups.map((headerGroup, i) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                  {headerGroup.headers.map((column, colIndex) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={column.id}
                      className={`px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 ${
                        colIndex === 0 ? 'sticky-col-sno' : 
                        colIndex === 1 ? 'sticky-col-name' : 
                        ''
                      }`}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {column.render("Header")}
                        {column.isSorted && (
                          <Icon
                            icon={
                              column.isSortedDesc
                                ? "heroicons:chevron-down"
                                : "heroicons:chevron-up"
                            }
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700"
            >
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <Icon
                        icon="flowbite:users-group-outline"
                        className="w-12 h-12 text-gray-300 mb-2"
                      />
                      <p>No employee data found for the selected criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} key={row.id}>
                      {row.cells.map((cell, cellIndex) => (
                        <td
                          {...cell.getCellProps()}
                          key={cell.column.id}
                          className={`px-3 py-2 whitespace-nowrap ${
                            cellIndex === 0 ? 'sticky-col-sno' : 
                            cellIndex === 1 ? 'sticky-col-name' : 
                            ''
                          }`}
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
        )}
      </div>
    </Card>
  );
};

export default EmployeeSummaryTable;