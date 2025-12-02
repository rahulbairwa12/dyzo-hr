import React, { useEffect, useState } from 'react';
import { fetchGET, fetchPOST } from '@/store/api/apiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getCurrentDate } from '@/helper/helper';
import { djangoBaseURL } from '@/helper';
import LiveReportTable from './LiveReportTable';
import { ImageCrousal } from '@/components/partials/screenshot/ImageCrousal';
import { ref, onValue, off } from 'firebase/database'; // Ensure you have Firebase set up properly
import database from '@/firebase/index';

const LiveReport = () => {
  const currentDate = getCurrentDate();
  const userInfo = useSelector((state) => state.auth.user);

  // States
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [screenShot, setScreenShot] = useState([]);
  const [loadingScreenShot, setLoadingScreenShot] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [getScreenShotUrl, setGetScreenShotUrl] = useState([]);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [loadingProcessedData, setLoadingProcessedData] = useState(true);

  const itemsPerPage = 3;

  const handleNext = () => {
    if ((currentPage + 1) * itemsPerPage < screenShot?.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentItems = screenShot?.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await fetchPOST(`${djangoBaseURL}/api/company/${userInfo?.companyId}/live/reporting/employees/`, { body: { date: currentDate } });
      if (data) {
        const activeUserData = data.filter((item) => item.status === 'Active');
        setData(activeUserData);
      }
    } catch (error) {
      toast.error('Error fetching data of live report');
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessedData = () => {
    if (!userInfo?.companyId) {
      console.error('User info or company ID is missing');
      setLoadingProcessedData(false);
      return;
    }

    if (!userInfo.isAdmin) {
      console.error('Access denied. Admins only.');
      setLoadingProcessedData(false);
      return;
    }

    const companyLogsRef = ref(database, `taskLogs/${userInfo.companyId}`);
    const handleDataChange = (snapshot) => {
      if (snapshot.exists()) {
        const companyLogsObject = snapshot.val();
        const logsArray = Object.keys(companyLogsObject)
          .map((userId) => {
            const latestLog = companyLogsObject[userId]?.latestLog;
            if (latestLog) {
              return {
                userId,
                userName: `${latestLog.userInfo?.first_name || ''} ${latestLog.userInfo?.last_name || ''}`.trim() || 'Unknown User',
                taskName: latestLog.taskInfo?.label || 'Unknown Task',
                projectName: latestLog.selectedProject?.label || 'Unknown Project',
                status: latestLog.status ? 'Running' : 'Paused',
                profile_picture: latestLog.userInfo?.profile_picture || '',
                startTime: latestLog.timestamp || null,
                endTime: latestLog.endTime || null, // Include endTime
              };
            }
            return null;
          })
          .filter((log) => log !== null);

        setProcessedData(logsArray);
      } else {
        setProcessedData([]);
      }
      setLoadingProcessedData(false);
    };

    onValue(companyLogsRef, handleDataChange, (error) => {
      console.error('Error fetching data:', error);
      setLoadingProcessedData(false);
    });

    return () => {
      off(companyLogsRef, 'value', handleDataChange);
    };
  };

  useEffect(() => {
    fetchData();
    fetchProcessedData();
  }, [userInfo?.companyId]);

  const getScreenShot = async (id) => {
    setLoadingScreenShot(true);
    try {
      const { results: { data } } = await fetchGET(`${djangoBaseURL}/api/employee/${id}/screenshots/${currentDate}/${currentDate}/`);
      setScreenShot(data.length > 0 ? data : []);
    } catch (error) {
      setScreenShot([]);
    } finally {
      setLoadingScreenShot(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  useEffect(() => {
    if (screenShot?.length > 0) {
      const getScreenShotUrl = screenShot.map((item) => `${item?.url}`);
      setGetScreenShotUrl(getScreenShotUrl);
    }
  }, [screenShot]);

  const closeImageViewer = () => setIsImageViewerOpen(false);


  return (
    <main>
      <LiveReportTable
        data={processedData}
        loading={loading}
        expandedRow={expandedRow}
        toggleRow={toggleRow}
        getScreenShot={getScreenShot}
        currentItems={currentItems}
        handleBack={handleBack}
        handleNext={handleNext}
        loadingScreenShot={loadingScreenShot}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        screenShot={screenShot}
        setIsImageViewerOpen={setIsImageViewerOpen}
        setCurrentIndex={setCurrentIndex}
      />

      {isImageViewerOpen && (
        <ImageCrousal
          imageList={getScreenShotUrl}
          initialSlide={currentIndex}
          closeModal={closeImageViewer}
        />
      )}
    </main> 
  );
};

export default LiveReport;