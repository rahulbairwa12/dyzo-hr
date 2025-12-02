import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchGET } from "@/store/api/apiSlice";
import ScreenShotCard from "@/components/partials/screenshot/ScreenShotCard";
import Grid from "@/components/skeleton/Grid";
import { ImageCrousal } from "@/components/partials/screenshot/ImageCrousal";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import DatePickerStartAndEndDate from "@/components/userProfile/DatePickerStartAndEndDate";

const Screenshot = () => {
  const { taskId } = useParams();
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [imageViewModal, setImageViewModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(formattedToday);
  const [endDate, setEndDate] = useState(formattedToday);
  const [currentPage, setCurrentPage] = useState(1);
  const [order, setOrder] = useState("desc");
  const observer = useRef();

  const fetchScreenshots = async (page) => {
    try {
      setLoading(true);
      const response = await fetchGET(
        `${import.meta.env.VITE_APP_DJANGO}/screenshot/task/${taskId}/?startdate=${startDate}&endDate=${endDate}&ordering=${order}&page=${page}`
      );
      if (response.results && response.results.status) {
        setScreenshots((prevScreenshots) => [
          ...prevScreenshots,
          ...response.results.data,
        ]);
        if (response.results.data.length === 0) {
          setHasMore(false);
        }
      } else if (response.detail === "Invalid page.") {
        setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch screenshots", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!taskId) return; 
    setScreenshots([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchScreenshots(1);
  }, [startDate, endDate, taskId, order]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchScreenshots(currentPage);
    }
  }, [currentPage]);

  const lastScreenshotElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const imageList = screenshots.map((item) => item.url);

  const openImageViewModal = (index) => {
    setCurrentIndex(index);
    setImageViewModal(true);
  };

  const handleDateRangeChange = (range) => {
    const [start, end] = range;
    if (start instanceof Date && end instanceof Date) {
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const screenshotByDate = screenshots.reduce((acc, item) => {
    const date = item.dateCreated.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  const orderOptions = [
    { label: "Newest First", value: "desc" },
    { label: "Oldest First", value: "asc" },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-y-4">
        <DatePickerStartAndEndDate
          initialStartDate={startDate}
          initialEndDate={endDate}
          onRangeChange={handleDateRangeChange}
        />
        <Select
          className=" dark:bg-slate-800 h-min text-sm font-normal  md:w-52"
          options={orderOptions}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>

      {loading && currentPage === 1 ? (
        <Grid count="9" />
      ) : (
        <div>
          {Object.keys(screenshotByDate).length > 0 ? (
            Object.keys(screenshotByDate).map((date) => (
              <div key={date} className="mb-6">
                <Card title={date} bodyClass="p-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                    {screenshotByDate[date].length > 0 ? (
                      screenshotByDate[date].map((item, i) => {
                        const imageIndex = screenshots.findIndex(
                          (screenshot) => screenshot._id === item._id
                        );
                        return (
                          <ScreenShotCard
                            ref={
                              i === screenshotByDate[date].length - 1
                                ? lastScreenshotElementRef
                                : null
                            }
                            item={item}
                            key={item._id}
                            index={imageIndex}
                            openImageViewModal={() =>
                              openImageViewModal(imageIndex)
                            }
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
            <p>No screenshots found</p>
          )}
        </div>
      )}

      {loading && currentPage > 1 && <Grid count="3" />}

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

export default Screenshot;


