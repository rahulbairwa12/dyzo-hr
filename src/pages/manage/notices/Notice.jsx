import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import { fetchGET } from "@/store/api/apiSlice";
import { toast, ToastContainer } from "react-toastify";
import Button from "@/components/ui/Button";
import AddNoticeModal from "@/components/notice/AddNoticeModal";
import NoticeList from "@/components/notice/NoticeList";
import SkeletionTable from "@/components/skeleton/Table";
import Icon from "@/components/ui/Icon";

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(true);
  const userInfo = useSelector((state) => state.auth.user);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const isMobile = width < breakpoints.md;

  const fetchNoices = async () => {
    try {
      const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/notices/${userInfo?.companyId}/`);
      if (data) {
        setNotices(data);
      }
    } catch (error) {
      toast.error("Failed to fetch notices");
    } finally {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    fetchNoices();
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
          Notices
        </h4>
        <div className="flex items-center">
          <Button
            icon="heroicons-outline:plus"
            text={isMobile ? "" : "Add Notice"}
            disabled={isLoaded}
            className={`bg-slate-900 dark:bg-slate-700 text-white h-min text-sm font-normal ${isMobile ? 'p-2' : ''}`}
            iconClass={`${isMobile ? 'text-base' : 'text-lg'}`}
            onClick={() => setShowAddNoticeModal(true)}
          />
        </div>
      </div>

      {isLoaded ? (
        <SkeletionTable count='20' />
      ) : (
        <div className={`${isMobile ? 'overflow-x-auto -mx-4 px-4' : ''}`}>
          {notices.length > 0 ? (
            <NoticeList notices={notices} fetchNoices={fetchNoices} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Icon icon="heroicons-outline:document-text" className="text-4xl text-slate-300" />
              <p className="text-center text-slate-500">No notices found</p>
              <Button
                icon="heroicons-outline:plus"
                text="Add Notice" 
                className="btn-dark dark:bg-slate-700 h-min text-sm"
                onClick={() => setShowAddNoticeModal(true)}
              />
            </div>
          )}
        </div>
      )}

      {showAddNoticeModal && (
        <AddNoticeModal 
          showAddNoticeModal={showAddNoticeModal} 
          setShowAddNoticeModal={setShowAddNoticeModal} 
          fetchNoices={fetchNoices} 
        />
      )}
    </div>
  );
};

export default Notice;
