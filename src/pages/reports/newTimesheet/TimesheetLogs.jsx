import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import Card from '@/components/ui/Card';
import { useTable, useSortBy } from 'react-table';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';
import moment from 'moment';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import dayjs from 'dayjs';

const TimesheetLogs = () => {
    const { user: userInfo } = useSelector(state => state.auth);
    const { taskId } = useParams();
    const { state } = useLocation();

    const taskName = state?.task?.taskName;
    const selectedUser = state?.selectedUser || null;
    const selectedUserId = selectedUser?.value || "";
    const initialStartDate = state?.startDate || moment().startOf('month').format('YYYY-MM-DD');
    const initialEndDate = state?.endDate || moment().endOf('month').format('YYYY-MM-DD');
    
    const [logsData, setLogsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalWorkingHours, setTotalWorkingHours] = useState('00:00');
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 30; // As per the project specification
    
    // Date range states
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [ordering, setOrdering] = useState('desc'); // newest first by default

    // Handle start date change
    const handleStartDateChange = (selectedDates) => {
        if (selectedDates.length > 0) {
            const newStartDate = moment(selectedDates[0]).format('YYYY-MM-DD');
            setStartDate(newStartDate);
            setCurrentPage(1); // Reset to first page when changing dates
        }
    };
    
    // Handle end date change
    const handleEndDateChange = (selectedDates) => {
        if (selectedDates.length > 0) {
            const newEndDate = moment(selectedDates[0]).format('YYYY-MM-DD');
            setEndDate(newEndDate);
            setCurrentPage(1); // Reset to first page when changing dates
        }
    };
    
    // Handle ordering change
    const handleOrderingChange = (e) => {
        setOrdering(e.target.value);
        setCurrentPage(1); // Reset to first page when changing sort order
    };

    // Fetch task logs data
    useEffect(() => {
        const fetchTaskLogs = async () => {
            try {
                setLoading(true);
                // Updated API URL with userId, startDate, endDate, and ordering parameters
                const url = `${djangoBaseURL}/taskLogs/task/${taskId}/?userId=${selectedUserId}&startDate=${startDate}&endDate=${endDate}&ordering=${ordering}`;
                const response = await fetchAuthGET(url, false);
                
                if (response?.status === 1) {
                    setLogsData(response?.data);
                    setTotalWorkingHours(response?.total_working_hours);
                    // Calculate total pages based on the data length
                    setTotalPages(Math.ceil(response?.data?.length / itemsPerPage) || 1);
                }
            } catch (error) {
                console.error('Error fetching task logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTaskLogs();
    }, [taskId, selectedUserId, startDate, endDate, ordering, currentPage]);

    // Get current page data
    const getCurrentPageData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return logsData.slice(startIndex, endIndex);
    }, [logsData, currentPage, itemsPerPage]);

    // Table columns configuration
    const columns = useMemo(
        () => [
            {
                Header: 'S. No.',
                accessor: 'serial',
                Cell: ({ row }) => (
                    <div className="text-sm font-medium text-slate-600">
                        {(currentPage - 1) * itemsPerPage + row.index + 1}
                    </div>
                ),
            },
            {
                Header: 'User Name',
                accessor: 'user_name',
                Cell: ({ value, row }) => {
                    const user = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <ProfileCardWrapper userId={user.userId} >
                                <ProfilePicture
                                    user={{
                                        name: user.user_name,
                                        image: user.user_profile_picture ? `${user.user_profile_picture}` : null,
                                    }}
                                    className="min-w-[28px] w-7 h-7 rounded-full border-2 border-white"
                                />
                            </ProfileCardWrapper>
                            <div className="text-xs font-medium text-slate-900 dark:text-white">
                                {value}
                            </div>
                        </div>
                    );
                },
            },
            {
                Header: 'Start Date & Time',
                accessor: 'startTime',
                Cell: ({ value }) => {
                    const date = new Date(value);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC'
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'UTC'
                    });
                    return (
                        <div className="text-xs text-slate-900 dark:text-white flex items-center gap-1">
                            <Icon icon="material-symbols:date-range" className="w-4 h-4" />
                            <span className='w-20'>{formattedDate}</span>
                            <Icon icon="heroicons:clock" className="w-4 h-4" />
                            <span className=''>{formattedTime}</span>
                        </div>
                    );
                },
            },
            {
                Header: 'End Date & Time',
                accessor: 'endTime',
                Cell: ({ value }) => {
                    const date = new Date(value);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC'
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'UTC'
                    });
                    return (
                        <div className="text-xs text-slate-900 dark:text-white flex items-center gap-1">
                            <Icon icon="material-symbols:date-range" className="w-4 h-4" />
                            <span className='w-20'>{formattedDate}</span>
                            <Icon icon="heroicons:clock" className="w-4 h-4" />
                            <span className=''>{formattedTime}</span>
                        </div>
                    );
                },
            },
            {
                Header: 'Duration',
                accessor: 'duration',
                Cell: ({ value }) => (
                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                        {value}
                    </div>
                ),
            },
            {
                Header: 'Status',
                accessor: 'manualAdd',
                Cell: ({ value }) => (
                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                        {value ? 'Manual' : 'Timer'}
                    </div>
                ),
            },
        ],
        [currentPage, itemsPerPage]
    );

    // Table setup
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable(
        {
            columns,
            data: getCurrentPageData,
        },
        useSortBy
    );

    // Handle pagination
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const renderPagination = () => {
        const pages = [];
        
        // Always show page 1
        pages.push(
            <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
                    1 === currentPage
                        ? 'bg-electricBlue-50 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
            >
                1
            </button>
        );
        
        // Add ellipsis if current page is far from start
        if (currentPage > 3) {
            pages.push(
                <span key="start-ellipsis" className=" py-1 mx-1 text-gray-500">
                    ...
                </span>
            );
        }
        
        // Show current page and its neighbors (but not page 1 or last page)
        const startRange = Math.max(2, currentPage - 1);
        const endRange = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = startRange; i <= endRange; i++) {
            // Skip if it's page 1 (already added) or last page (will be added later)
            if (i === 1 || i === totalPages) continue;
            
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
                        i === currentPage
                            ? 'bg-electricBlue-50 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {i}
                </button>
            );
        }
        
        // Add ellipsis if current page is far from end
        if (currentPage < totalPages - 2) {
            pages.push(
                <span key="end-ellipsis" className="py-1 mx-1 text-gray-500">
                    ...
                </span>
            );
        }
        
        // Always show last page (if it's not page 1)
        if (totalPages > 1) {
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
                        totalPages === currentPage
                            ? 'bg-electricBlue-50 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {totalPages}
                </button>
            );
        }

        return (
            <div className="flex items-center justify-center sm:justify-end py-10">
                {/* Start button */}
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                >
                    <Icon icon="material-symbols:first-page" className='w-6 h-6' />
                </button>
                
                {/* Previous button */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                >
                    <Icon icon="ion:caret-back" className='w-6 h-6' />
                </button>
                
                {/* Page numbers */}
                {pages}
                
                {/* Next button */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                >
                    <Icon icon="ion:caret-forward" className='w-6 h-6' />
                </button>
                
                {/* Last button */}
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
                >
                    <Icon icon="material-symbols:last-page" className='w-6 h-6' />
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white min-h-[calc(100vh-80px)] w-full p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-lg font-bold">Task Name: <span className='font-medium'>{taskName}</span></h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Date Pickers */}
                    <div className="flex flex-row gap-2">
                        <div className="relative">
                            <Flatpickr
                                className="form-control py-1.5 px-3 w-32 border border-neutral-50 rounded-md text-sm focus:outline-none  !bg-transparent !text-gray-700 dark:!text-gray-400"
                                value={startDate ? dayjs(startDate).toDate() : ''}
                                onChange={handleStartDateChange}
                                options={{
                                    dateFormat: 'd-m-Y',
                                    allowInput: false,
                                    clickOpens: true,
                                    disableMobile: true
                                }}
                            />
                            <Icon
                                icon="cuida:calendar-outline"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700 dark:text-gray-400 pointer-events-none"
                            />
                        </div>
                        
                        <div className="relative">
                            <Flatpickr
                                className="form-control py-1.5 px-3 w-32 border border-neutral-50 rounded-md text-sm focus:outline-none  !bg-transparent !text-gray-700 dark:!text-gray-400"
                                value={endDate ? dayjs(endDate).toDate() : ''}
                                onChange={handleEndDateChange}
                                options={{
                                    dateFormat: 'd-m-Y',
                                    allowInput: false,
                                    clickOpens: true,
                                    disableMobile: true
                                }}
                            />
                            <Icon
                                icon="cuida:calendar-outline"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700 dark:text-gray-400 pointer-events-none "
                            />
                        </div>
                    </div>
                    
                    <Select
                        id="ordering"
                        value={{ value: ordering, label: ordering === 'desc' ? 'Newest First' : 'Oldest First' }}
                        onChange={(selectedOption) => handleOrderingChange({ target: { value: selectedOption.value } })}
                        options={[
                            { value: 'desc', label: 'Newest First' },
                            { value: 'asc', label: 'Oldest First' }
                        ]}
                        className="w-40 text-sm"
                        styles={{
                            control: (provided) => ({
                                ...provided,
                                borderColor: '#e1e1e1',
                                borderRadius: '0.375rem',
                                boxShadow: 'none',
                                minHeight: '34px',
                                height: '34px',
                                '&:hover': {
                                    borderColor: '#e1e1e1'
                                },
                            }),
                            valueContainer: (provided) => ({
                                ...provided,
                                height: '34px',
                                padding: '0 8px',
                            }),
                            indicatorsContainer: (provided) => ({
                                ...provided,
                                height: '34px',
                            }),
                            option: (provided, state) => ({
                                ...provided,
                                backgroundColor: state.isSelected 
                                    ? '#8e2eff' : 'white',
                                color: state.isSelected ? 'white' : 'inherit', 
                                '&:hover': {
                                    backgroundColor: state.isSelected 
                                    ? "" : '#e1e1e160' 
                                },
                                padding: '4px 12px',
                            }),
                            menu: (provided) => ({
                                ...provided,
                                zIndex: 9999
                            })
                        }}
                    />
                </div>
            </div>
            
            {/* Summary */}
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <div className="text-base font-semibold text-slate-900 dark:text-white">
                        Total Working Hours: <span className='font-medium'>{totalWorkingHours}</span>
                    </div>
                </div>
            </div>
            
            {/* Table */}
            <Card className="mt-6" bodyClass='p-0'>
                <div className="overflow-x-auto">
                    {loading ? (
                        // Skeleton loader table
                        <table className="w-full table-auto">
                            <thead className="bg-gray-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                    </th>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                                    </th>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                                    </th>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                                    </th>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                    </th>
                                    <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                {/* Render 15 skeleton rows */}
                                {[...Array(15)].map((_, index) => (
                                    <tr key={index} className="">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8 animate-pulse"></div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse"></div>
                                                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <>
                            <table {...getTableProps()} className="w-full table-auto">
                                <thead className="bg-gray-100 dark:bg-slate-800">
                                    {headerGroups.map((headerGroup, index) => (
                                        <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                                            {headerGroup.headers.map((column) => (
                                                <th
                                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                                    key={column.id}
                                                    className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {column.render('Header')}
                                                        {column.isSorted && (
                                                            <Icon
                                                                icon={column.isSortedDesc ? 'heroicons:chevron-down' : 'heroicons:chevron-up'}
                                                                className="w-4 h-4"
                                                            />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody {...getTableBodyProps()} className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center">
                                                    <Icon icon="heroicons:document-text" className="w-12 h-12 text-gray-300 mb-2" />
                                                    <p>No task logs found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => {
                                            prepareRow(row);
                                            return (
                                                <tr {...row.getRowProps()} key={row.id} className="">
                                                    {row.cells.map((cell) => (
                                                        <td {...cell.getCellProps()} key={cell.column.id} className="px-3 py-2 whitespace-nowrap">
                                                            {cell.render('Cell')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            {totalPages > 1 && renderPagination()}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TimesheetLogs;