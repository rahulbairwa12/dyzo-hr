import React, { useState, useEffect, memo, useRef } from 'react';
import MyTasks from './MyTasks';
import Projects from './Projects';
import People from './People';
import LiveReport from './LiveReport';
import { useSelector } from 'react-redux';
import { getGreetingWithDate } from '@/helper/helper';
import { Icon } from '@iconify/react';
import { ToastContainer } from 'react-toastify';
import useDarkmode from '@/hooks/useDarkMode';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import { useDispatch } from 'react-redux';
import { fetchProjects } from '@/store/projectsSlice';
import { updateTaskCommentCount } from '@/features/tasks/store/tasksSlice';
import { TaskPanel } from '@/features/tasks';
import AttachmentViewer from '@/components/Task/AttachmentViewer';
import { useLocation, useNavigate } from 'react-router-dom';

// Separate Clock component to prevent unnecessary re-renders
const Clock = memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="text-center mb-2 text-xl font-bold text-customBlack-50 dark:text-customWhite-50">
      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  );
});

const Dashboard2 = () => {


  const [isDark] = useDarkmode();
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const { projects , loading } = useSelector((state) => state.projects);
  const { subscriptionData } = useSelector((state) => state.plan);
  const companyDetails = subscriptionData?.company_details;
  const [activeTab, setActiveTab] = useState(0);
  const [quote, setQuote] = useState({ text: '', author_name: '' });
  const [openedTask, setOpenedTask] = useState(null)
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);
  const { users } = useSelector((state) => state.users);
  const [user, setUser] = useState(null);
  
  // Preserve main dashboard scroll position
  const dashboardScrollPosition = useRef(0);
  
  // Save scroll position when AttachmentViewer opens/closes
  useEffect(() => {
    const handleScroll = () => {
      // Don't save scroll position when attachment viewer is open
      if (!isAttachmentViewerOpen) {
        dashboardScrollPosition.current = window.scrollY;

      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAttachmentViewerOpen]);
  
  // Restore scroll position after re-renders with delay
  useEffect(() => {
    if (dashboardScrollPosition.current > 0) {
    
      // Use setTimeout to ensure DOM is fully updated before scrolling
      setTimeout(() => {
        window.scrollTo(0, dashboardScrollPosition.current);
       
      }, 0);
    }
  });
  
  const fetchQuote = async () => {
    try {
      const response = await fetchAuthGET(`${djangoBaseURL}/get-random-quote/`, false);
      if (response.status === 1) {
        const data = response.data;
        setQuote(data);
      } else {
        setQuote({
          text: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.",
          author_name: 'Jimmy Dean',
        });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Fallback quote
      setQuote({
        text: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.",
        author_name: 'Jimmy Dean',
      });
    }
  };

 

  useEffect(() => {
    fetchQuote();
    dispatch(fetchProjects());
    
  }, []);


  const handleCommentCountUpdate = (taskId, newCount) => {
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  // Function to update task fields from child components
  const handleTaskUpdate = (taskId, field, value) => {
    setOpenedTask(prevTask => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        [field]: value
      };
    });
  };

  const handleAttachmentOpen = (index) => {
  
    dashboardScrollPosition.current = window.scrollY;
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  const handleTaskClose = () => {
    setOpenedTask(null)
    const params = new URLSearchParams(location.search);
    params.delete("isFocused");
    navigate({ search: params.toString() }, { replace: true });
  };

  return (
    <div className="font-lato bg-white dark:bg-slate-800 min-h-screen p-4 py-8 xl:px-20 xl:pt-10  md:p-6 md:px-4 md:pt-4">
      <ToastContainer />
      <div className="text-center mb-2 text-lg text-customBlack-50 dark:text-customWhite-50">
        {getGreetingWithDate(companyDetails?.company_timezone).formattedDate}
      </div>
      <Clock />
      <h2 className="text-center font-bold mb-8 text-2xl md:text-3xl lg:text-4xl text-customBlack-50 dark:text-customWhite-50">
        {getGreetingWithDate(companyDetails?.company_timezone).greeting}, <span className="capitalize">{userInfo?.first_name}</span>!
      </h2>
      {/* Left: My Tasks & People */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:gap-6 gap-3">
        <MyTasks
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setOpenedTask={setOpenedTask}
          handleTaskClose={handleTaskClose}
        />
        <Projects projectsData={projects} projectLoading={loading}/>
        <People />
        <LiveReport 
          handleAttachmentOpen={handleAttachmentOpen}
          setAttachmentsForView={setAttachmentsForView}
        />
      </div>
      <div className="text-center md:mt-12 mt-6  text-gray-500 dark:text-slate-400 text-sm flex flex-col items-center">
        <div className='text-lg mb-2  md:w-[70%] w-full flex flex-col items-center'>
          <span className="text-2xl block mb-2">
            <Icon icon="bxs:quote-alt-left" className='text-customGray-150 dark:text-slate-400' width="24" height="24" />
          </span>
          <div className=" md:text-lg text-base mb-2 text-customBlack-50 dark:text-customWhite-50 ">
            {quote && quote.text ? (
              <>
                <div className='italic'>
                  "{quote.text}"
                </div>
                <div className='md:text-base text-sm'>~ {quote.author_name}</div>
              </>
            ) : (
              "Loading quote..."
            )}
          </div>
        </div>
      </div>
      {
        openedTask &&
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black-500/70 backdrop-blur-sm w-full h-screen"
        >
          <div
            className="w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskPanel
              task={openedTask}
              isOpen={true}
              projects={projects}
              onClose={handleTaskClose}
              onUpdateCommentCount={handleCommentCountUpdate}
              handleAttachmentOpen={handleAttachmentOpen}
              setAttachmentsForView={setAttachmentsForView}
              isAttachmentViewerOpen={isAttachmentViewerOpen}
              from="dashboard"
              setTask={setOpenedTask}
              updateTaskFields={handleTaskUpdate}
            />
          </div>
        </div>
      }
      {isAttachmentViewerOpen && (
        <AttachmentViewer
          attachments={attachmentsForView && attachmentsForView}
          initialIndex={currentAttachment}
          open={isAttachmentViewerOpen}
          onClose={() => {
           
            setIsAttachmentViewerOpen(false);
          }}
        />
      )}

    </div>
  );
};

export default Dashboard2;