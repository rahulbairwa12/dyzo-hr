import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { setShowLimitModal } from "../../store/planSlice";
import ReactDOM from "react-dom";

const SubscriptionLimitModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showLimitModal } = useSelector((state) => state.plan);
  const userInfo = useSelector((state) => state.auth.user);
  const { subscriptionData } = useSelector((state) => state.plan);
  
  // Check if current path is plans page
  const isPlansPage = location.pathname === '/plans';
  
  // Add event listener to detect header clicks
  useEffect(() => {
    if (isPlansPage && showLimitModal) {
      const handleHeaderClick = (e) => {
        // Check if the click is on the header (any element with class containing 'header' or specific header elements)
        const isHeaderClick = e.target.closest('header') || 
                             e.target.closest('.app-header') || 
                             e.target.closest('nav') ||
                             e.target.closest('.sidebar') ||
                             e.target.closest('.navbar');
        
        if (isHeaderClick) {
          // If header is clicked, navigate back to dashboard or previous page
          navigate(-1);
        }
      };
      
      document.addEventListener('click', handleHeaderClick);
      
      return () => {
        document.removeEventListener('click', handleHeaderClick);
      };
    }
  }, [isPlansPage, showLimitModal, navigate]);
  
  // Add CSS to document to prevent scrolling and interaction with background
  useEffect(() => {
    if (showLimitModal && !isPlansPage) {
      // Disable scrolling and interaction with background elements
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      // Re-enable scrolling and interaction when on plans page
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    
    return () => {
      // Re-enable scrolling and interaction when component unmounts
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [showLimitModal, isPlansPage]);

  // Prevent closing the modal with Escape key
  useEffect(() => {
    const preventEscape = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Prevent right-click context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Prevent F12 and other inspect element shortcuts
    const preventInspect = (e) => {
      // F12 key
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I or Cmd+Option+I
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
          (e.metaKey && e.altKey && e.keyCode === 73)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C or Cmd+Option+C
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 67) || 
          (e.metaKey && e.altKey && e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J or Cmd+Option+J
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 74) || 
          (e.metaKey && e.altKey && e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
    };
    
    if (showLimitModal && !isPlansPage) {
      document.addEventListener("keydown", preventEscape);
      document.addEventListener("keydown", preventInspect);
      document.addEventListener("contextmenu", preventContextMenu);
      
      // Disable browser's default ESC key behavior
      const originalOnKeyDown = window.onkeydown;
      window.onkeydown = (e) => {
        if (e.key === "Escape") {
          return false;
        }
        return originalOnKeyDown ? originalOnKeyDown(e) : true;
      };
    }
    
    return () => {
      document.removeEventListener("keydown", preventEscape);
      document.removeEventListener("keydown", preventInspect);
      document.removeEventListener("contextmenu", preventContextMenu);
      // Restore original behavior
      window.onkeydown = null;
    };
  }, [showLimitModal, isPlansPage]);

  // Don't show modal if on plans page or if showLimitModal is false
  if (!showLimitModal || location.pathname === '/plans') return null;

  const handleUpgradeClick = () => {
    navigate('/plans');
  };

  // Calculate remaining limit for display
  const freeLimit = 2; // Free tier user limit
  const activeUsersCount = subscriptionData?.company_details?.active_users_count || 0;
  const employeeLimit = subscriptionData?.company_details?.employee_limit || 0;
  const isSubscribed = subscriptionData?.subscription_status === "active";
  
  const limitDisplay = isSubscribed 
    ? `${activeUsersCount}/${employeeLimit} users` 
    : `${activeUsersCount}/${freeLimit} users`;

  // Use portal to render modal at the root level of the DOM
  return ReactDOM.createPortal(
    // The modal is rendered at document.body to ensure it appears above all other content
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md transition-opacity" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'all' }}>
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-slate-800" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}>

        {/* Top curved section with logo */}
        <div className="relative h-44 bg-[#f5f3ff] overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 rounded-t-[100%]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="70" height="77" viewBox="0 0 70 77" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_d_1_12)">
                <path d="M65.2122 15.8545C56.9484 14.0932 54.0945 7.34507 53.142 4.3553C50.4599 14.2425 41.735 15.8545 41.735 15.8545C49.3966 17.5798 52.1589 24.8751 53.163 27.8137C55.0376 20.0108 62.2305 16.8383 65.2122 15.8545Z" fill="url(#paint0_linear_1_12)" />
                <path d="M65.2091 4.292C62.1853 3.64757 61.1412 1.17872 60.7937 0.084877C59.8125 3.70222 56.6189 4.292 56.6189 4.292C59.4231 4.92322 60.4329 7.59225 60.7994 8.66742C61.4867 5.81263 64.1172 4.65194 65.2091 4.292Z" fill="url(#paint1_linear_1_12)" />
                <path d="M57.2209 30.485C60.2637 29.4054 63.6731 30.9863 64.1503 34.1626C64.8051 38.508 64.4901 42.9677 63.2016 47.22C61.3461 53.3399 57.5683 58.7085 52.4199 62.5393C47.2733 66.3698 41.0271 68.4615 34.5972 68.5075C28.1671 68.5535 21.8912 66.5513 16.689 62.7947C11.4869 59.038 7.63138 53.7238 5.68769 47.6311C3.744 41.5385 3.81405 34.9871 5.88774 28.9368C7.96162 22.8865 11.9299 17.6554 17.2116 14.0097C20.8814 11.4766 25.0511 9.80133 29.4106 9.07582C32.5972 8.54549 35.1634 11.28 35.0715 14.4905C34.9795 17.701 32.2251 20.1404 29.1282 21.0573C27.2699 21.6075 25.4987 22.4497 23.8855 23.5632C20.6573 25.7918 18.2314 28.9895 16.9638 32.6879C15.6959 36.3864 15.653 40.391 16.8413 44.1154C18.0294 47.8398 20.3862 51.0881 23.5661 53.3844C26.7462 55.6807 30.5825 56.9047 34.5128 56.8767C38.4435 56.8484 42.2616 55.57 45.4083 53.2282C48.5542 50.8869 50.8641 47.605 51.998 43.864C52.5649 41.9949 52.8226 40.0602 52.7749 38.1331C52.6947 34.9222 54.178 31.5645 57.2209 30.485Z" fill="url(#paint2_linear_1_12)" />
              </g>
              <defs>
                <filter id="filter0_d_1_12" x="0.279495" y="0.084877" width="68.9327" height="76.4234" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dy="4" />
                  <feGaussianBlur stdDeviation="2" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_12" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_12" result="shape" />
                </filter>
                <linearGradient id="paint0_linear_1_12" x1="63.2158" y1="-3.27208" x2="51.6547" y2="28.7381" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F6FFF" />
                  <stop offset="1" stopColor="#A026FF" />
                </linearGradient>
                <linearGradient id="paint1_linear_1_12" x1="64.4786" y1="-2.70569" x2="60.2492" y2="9.00589" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F6FFF" />
                  <stop offset="1" stopColor="#A026FF" />
                </linearGradient>
                <linearGradient id="paint2_linear_1_12" x1="59.3624" y1="-10.336" x2="30.2863" y2="71.0564" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F6FFF" />
                  <stop offset="1" stopColor="#A026FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Content section */}
        <div className="px-10 py-8 text-center">
          {userInfo?.isAdmin && (
            <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">UPGRADE NOW</h2>
          )}

          <p className="mb-2 text-lg text-gray-800 dark:text-gray-200">
            {isSubscribed ? (
              <>You've reached your user limit <span className="font-medium text-indigo-600">{limitDisplay}</span></>
            ) : (
              <>We've moved from our beta version to a <span className="border-b border-indigo-600 font-medium">paid plan</span>.</>
            )}
          </p>

          <p className="mb-10 text-gray-600 dark:text-gray-400">
            {isSubscribed ? (
              <>Upgrade your plan to add more users and<br />access all premium features.</>
            ) : (
              <>Upgrade now to continue using Dyzo without losing<br />access to your data and features.</>
            )}
          </p>

          {userInfo?.isAdmin ? (
            <button
              onClick={handleUpgradeClick}
              className="w-full rounded-lg bg-indigo-600 py-3.5 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Upgrade Your Plan!
            </button>
          ) : (
            <button
              className="font-medium text-gray-500 underline hover:text-gray-700"
            >
              Contact Admin
            </button>
          )}
        </div>
      </div>
    </div>
  , document.body
  );
};

export default SubscriptionLimitModal;