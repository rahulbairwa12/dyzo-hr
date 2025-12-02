import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import moment from 'moment';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { useSelector } from 'react-redux';
import AttachmentViewer from '@/components/Task/AttachmentViewer';
import Select from 'react-select';
import dayjs from 'dayjs';

const UserScreenshots = ({employeeDetail}) => {
    // const { user : userInfo } = useSelector(state => state.auth);
    
    // Extract user id, start date, end date from state if available
    const initialStartDate = moment().startOf('month').format('YYYY-MM-DD');
    const initialEndDate = moment().endOf('month').format('YYYY-MM-DD');

    // State for screenshots data
    const [screenshotsData, setScreenshotsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [ordering, setOrdering] = useState('desc'); // newest first by default
    
    // AttachmentViewer state
    const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
    const [attachmentViewerIndex, setAttachmentViewerIndex] = useState(0);
    
    // Date range states
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    
    // Default limit
    const limit = 24;

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
    
    // Fetch screenshots data
    useEffect(() => {
        const fetchScreenshots = async () => {
            
            if (!employeeDetail?._id) return;
            
            try {
                setLoading(true);
                const url = `${djangoBaseURL}/api/employee/${employeeDetail?._id}/screenshots/${startDate}/${endDate}/?page=${currentPage}&ordering=${ordering}&page_size=${limit}`;
                const response = await fetchAuthGET(url, false);
                
                if (response?.results?.status === 1) {
                    // Updated to handle new API response structure
                    setScreenshotsData(response.results.data);
                    setTotalItems(response.count || 0);
                    // Calculate totalPages based on count and limit
                    setTotalPages(Math.ceil(response.count / limit) || 1);
                }
            } catch (error) {
                console.error('Error fetching screenshots:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScreenshots();
    }, [currentPage, startDate, endDate, ordering]);
    
    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };
    
    // Handle ordering change
    const handleOrderingChange = (e) => {
        setOrdering(e.target.value);
        setCurrentPage(1); // Reset to first page when changing sort order
    };
    
    // Handle image click to open AttachmentViewer
    const handleImageClick = (index) => {
        setAttachmentViewerIndex(index);
        setIsAttachmentViewerOpen(true);
    };
    
    // Handle closing AttachmentViewer
    const handleAttachmentViewerClose = () => {
        setIsAttachmentViewerOpen(false);
    };
    
    // Render pagination
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
                <span key="start-ellipsis" className="py-1 mx-1 text-gray-500">
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
            <div className="flex items-center justify-center sm:justify-end py-6">
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
    <div className="border rounded-lg p-4 my-4 space-y-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Date Pickers */}
                <div className="flex flex-row gap-3">
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
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-700 dark:text-gray-400 pointer-events-none"
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
        {loading ? (
            // Skeleton loader for screenshots
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden animate-pulse">
                        <div className="aspect-video bg-gray-200 dark:bg-slate-700"></div>
                        <div className="p-3">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {screenshotsData.length > 0 ? (
                        screenshotsData.map((screenshot, index) => (
                            <div key={index} className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 p-2">
                                <div className="space-y-1">
                                    {/* Updated to use screenshot.url directly */}
                                    <img 
                                        src={screenshot.url}
                                        alt="Screenshot" 
                                        className="w-full object-cover rounded-md aspect-video cursor-pointer hover:border border-electricBlue-50 hover:p-0.5"
                                        onClick={() => handleImageClick(index)}
                                    />
                                    <div className="flex items-center justify-between text-xs gap-2">
                                        <div className="text-sm font-bold truncate capitalize" title={screenshot?.project_name}>{screenshot?.project_name}</div>
                                        {
                                            screenshot?.createdTime && 
                                            <div className="flex items-center gap-1 w-20">
                                                <Icon icon="cuida:calendar-outline" className="w-4 h-4" />
                                                <span className="whitespace-nowrap">{moment.utc(screenshot?.createdTime).format('DD/MM/YYYY')}</span>
                                            </div>
                                        }
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                            <div className="text-xs truncate" title={screenshot?.taskName}>{screenshot?.taskName}</div>
                                            {
                                                screenshot?.createdTime &&
                                                <div className="flex items-center gap-1 w-20">
                                                    <Icon icon="heroicons:clock" className="w-4 h-4" />
                                                    <span className="whitespace-nowrap">{moment.utc(screenshot?.createdTime).format('HH:mm:ss')}</span>
                                                </div>
                                            }
                                    </div>
                                    <div className="mt-1 relative">
                                        <div className="w-full bg-electricBlue-50/20 rounded-full h-4 ">
                                            <div 
                                                className="bg-electricBlue-50 h-4 rounded-full transition-all duration-300" 
                                                style={{ width: `${screenshot.productivity}%` }}
                                            ></div>
                                        </div>
                                            <p className='text-[10px] text-white absolute top-0 text-center w-full'>{Math.round(screenshot.productivity)}%</p>
                                    </div>
                                </div>
                                
                                
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <Icon icon="heroicons:document-text" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No screenshots found</p>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && renderPagination()}
                
                {/* Attachment Viewer */}
                {isAttachmentViewerOpen && (
                    <AttachmentViewer
                        key={`attachment-viewer-${attachmentViewerIndex}`}
                        attachments={screenshotsData.map(s => ({
                            url: s.url,
                            name: `Screenshot ${moment(s.dateCreated).format('DD/MM/YYYY HH:mm:ss')}`,
                            type: 'image'
                        }))}
                        initialIndex={attachmentViewerIndex}
                        open={isAttachmentViewerOpen}
                        onClose={handleAttachmentViewerClose}
                    />
                )}
            </>
        )}
    </div>
  )
}

export default UserScreenshots