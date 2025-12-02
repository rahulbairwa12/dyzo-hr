import { fetchAuthGET } from '@/store/api/apiSlice';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePickerStartAndEndDate from '../userProfile/DatePickerStartAndEndDate';
import Grid from '../skeleton/Grid';
import ScreenShotCard from '../partials/screenshot/ScreenShotCard';
import { ImageCrousal } from '../partials/screenshot/ImageCrousal';
import Card from '../ui/Card';
import Select from '../ui/Select';

const AllScreenshot = () => {
  const { projectId } = useParams();
  const [screenshot, setScreenshot] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [modalImage, setModalImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [order, setOrder] = useState('desc');
  const observer = useRef();

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(formattedToday);
  const [endDate, setEndDate] = useState(formattedToday);

  const fetchProjectScreenshots = async (page) => {
    try {
      setLoading(true);
      const { results : {data} } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/project/${projectId}/screenshots/${startDate}/${endDate}/?ordering=${order}&page=${page}`);
      if (data && data.length > 0) {
        setScreenshot((prev) => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error('Unable to fetch the screenshots');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setScreenshot([]); // Reset screenshots when filters change
    setCurrentPage(1);
    setHasMore(true);
    fetchProjectScreenshots(1);
  }, [startDate, endDate, projectId, order]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchProjectScreenshots(currentPage);
    }
  }, [currentPage]);

  const lastScreenshotElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const openImageViewModal = (index) => {
    setCurrentImageIndex(index);
    setModalImage(true);
  };

  const imgUrl = screenshot.map((item) => item.url);

  const handleDateRangeChange = (range) => {
    const [start, end] = range;
    if (start instanceof Date && end instanceof Date) {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const groupedScreenshotByDate = screenshot.reduce((acc, item) => {
    const date = item.dateCreated.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  const orderOptions = [
    { label: 'Newest First', value: 'desc' },
    { label: 'Oldest First', value: 'asc' },
  ];

  return (
    <div>
      <div className='flex flex-col md:flex-row justify-between items-center mb-4 gap-y-4'>
        <DatePickerStartAndEndDate
          initialStartDate={startDate}
          initialEndDate={endDate}
          onRangeChange={handleDateRangeChange}
        />
        <Select
          className="dark:bg-slate-800 h-min text-sm font-normal md:w-52"
          options={orderOptions}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>

      <div className='my-6'>
        {loading && currentPage === 1 ? (
          <Grid count='9' />
        ) : (
          Object.keys(groupedScreenshotByDate).length > 0 ? (
            Object.keys(groupedScreenshotByDate).map((date, index) => (
              <Card title={date} key={index}>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                  {groupedScreenshotByDate[date].map((item, i) => {
                    const overallIndex = screenshot.findIndex((s) => s._id === item._id);

                    return (
                      <ScreenShotCard
                        key={item._id}
                        item={item}
                        index={overallIndex}
                        openImageViewModal={() => openImageViewModal(overallIndex)}
                        ref={
                          i === groupedScreenshotByDate[date].length - 1
                            ? lastScreenshotElementRef
                            : null
                        }
                      />
                    );
                  })}
                </div>
              </Card>
            ))
          ) : (
            <p className='text-center'>No screenshot found</p>
          )
        )}

        {loading && currentPage > 1 && <Grid count='3' />}
      </div>

      {modalImage && (
        <ImageCrousal
          imageList={imgUrl}
          initialSlide={currentImageIndex}
          closeModal={() => setModalImage(false)}
        />
      )}
    </div>
  );
};

export default AllScreenshot;
