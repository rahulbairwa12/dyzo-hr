import { ImageCrousal } from '@/components/partials/screenshot/ImageCrousal';
import ScreenShotCard from '@/components/partials/screenshot/ScreenShotCard';
import Grid from '@/components/skeleton/Grid';
import { fetchAuthGET } from '@/store/api/apiSlice';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePickerStartAndEndDate from '@/components/userProfile/DatePickerStartAndEndDate';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

const TaskLogScreenShots = () => {
    const { taskId, userId } = useParams();
    const { state } = useLocation();
    const [taskLogScreenShots, setTaskLogScreenShots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [imageViewModal, setImageViewModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [startDate, setStartDate] = useState(
        state?.filters?.startDate || new Date().toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        state?.filters?.endDate || new Date().toISOString().split('T')[0]
    );
    const [order, setOrder] = useState('desc');
    const observer = useRef();

    const fetchTaskLogScreenShots = async (page) => {
        try {
            setLoading(true);
            const url = userId == 0
                ? `${import.meta.env.VITE_APP_DJANGO}/screenshot/task/${state?.task?._id || state?.task?.taskId}/?page=${page}&startDate=${startDate}&endDate=${endDate}&ordering=${order}&limit=9`
                : `${import.meta.env.VITE_APP_DJANGO}/screenshot/task/${state?.task?._id}/employee/${userId}/?page=${page}&startDate=${startDate}&endDate=${endDate}&ordering=${order}&limit=9`;

            const { results } = await fetchAuthGET(url);

            if (results && results.status && results.data) {
                setTaskLogScreenShots(prev => [...prev, ...results.data]);
                if (results.data.length < 9) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            setHasMore(false);
            toast.error('Failed to fetch screenshots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTaskLogScreenShots([]);
        setCurrentPage(1);
        setHasMore(true);
        fetchTaskLogScreenShots(1);
    }, [taskId, userId, startDate, endDate, order]);

    useEffect(() => {
        if (currentPage > 1) {
            fetchTaskLogScreenShots(currentPage);
        }
    }, [currentPage]);

    const lastScreenshotElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const imageList = taskLogScreenShots.map((item) => item.url);

    const openImageViewModal = (index) => {
        setCurrentIndex(index);
        setImageViewModal(true);
    };

    const handleDateRangeChange = (range) => {
        const [start, end] = range;
        if (start instanceof Date && end instanceof Date) {
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
    };

    const orderOptions = [
        { label: 'Newest First', value: 'desc' },
        { label: 'Oldest First', value: 'asc' }
    ];

    const screenshotByDate = Object.groupBy(taskLogScreenShots, ({ dateCreated }) => dateCreated.split('T')[0]);

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-y-4">
                <DatePickerStartAndEndDate initialStartDate={startDate} initialEndDate={endDate} onRangeChange={handleDateRangeChange} />
                <Select className="dark:bg-slate-800 h-min text-sm font-normal md:w-52" options={orderOptions} onChange={(e) => setOrder(e.target.value)} />
            </div>

            {loading && currentPage === 1 ? (
                <Grid />
            ) : (
                <div>
                    {Object.keys(screenshotByDate).length > 0 ? (
                        Object.keys(screenshotByDate).map((date) => (
                            <div key={date} className="mb-6">
                                <Card title={date} bodyClass="p-1">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                                        {screenshotByDate[date].length > 0 ? (
                                            screenshotByDate[date].map((item, i) => {
                                                const imageIndex = taskLogScreenShots.findIndex(screenshot => screenshot._id === item._id);
                                                return (
                                                    <ScreenShotCard
                                                        ref={i === screenshotByDate[date].length - 1 ? lastScreenshotElementRef : null}
                                                        item={item}
                                                        key={item._id}
                                                        index={imageIndex}
                                                        openImageViewModal={() => openImageViewModal(imageIndex)}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <p>No screenshots found</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ))
                    ) : (
                        <p className="text-center capitalize">No screenshot found</p>
                    )}
                </div>
            )}

            {loading && currentPage > 1 && (
                <div className="flex justify-center items-center mt-4">
                    <Grid count="3" />
                </div>
            )}

            {imageViewModal && (
                <ImageCrousal
                    imageList={imageList}
                    initialSlide={currentIndex}
                    closeModal={() => setImageViewModal(false)}
                />
            )}
        </>
    );
};

export default TaskLogScreenShots;
