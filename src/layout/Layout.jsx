import React, { useEffect, Suspense, Fragment, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import Settings from "@/components/partials/settings";
import useWidth from "@/hooks/useWidth";
import useSidebar from "@/hooks/useSidebar";
import useContentWidth from "@/hooks/useContentWidth";
import useMenulayout from "@/hooks/useMenulayout";
import useMenuHidden from "@/hooks/useMenuHidden";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import MobileMenu from "../components/partials/sidebar/MobileMenu";
import useMobileMenu from "@/hooks/useMobileMenu";
import { ToastContainer, toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import Loading from "@/components/Loading";
import { motion, AnimatePresence } from "framer-motion";
import useDarkMode from "@/hooks/useDarkMode";
import keyboardShortcuts, { SHORTCUTS, isEditableElement, getShortcutsList } from "../utils/keyboardShortcuts";
import FreeTrialCountdown from "@/components/ui/FreeTrialCountdown";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Cookies from "js-cookie";
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import WhatsNewModal from "@/components/WhatsNewModal";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { fetchCurrentUserData } from "../usersSlice";

const Layout = () => {

  const { width, breakpoints } = useWidth();
  const [collapsed] = useSidebar();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loggedIn, user } = useSelector((state) => state.auth);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [waitingForSecondKey, setWaitingForSecondKey] = useState(false);
  const [firstKey, setFirstKey] = useState(null);
  const [isDark, setDarkMode] = useDarkMode();
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [employeeDetail, setEmployeeDetail] = useState({});
  const userData = JSON.parse(Cookies.get('userInfo'));
  const { shouldShowWhatsNew, isCheckingVersion, markVersionAsSeen,setShouldShowWhatsNew } = useVersionCheck();

  useEffect(() => {
    if (!loggedIn || !user) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  // Fetch current user data on mount and periodically to check for permission changes
  useEffect(() => {
    if (user && user._id) {
      // Fetch immediately on mount
      dispatch(fetchCurrentUserData());

      // Set up periodic check every 5 minutes (300000ms)
      const intervalId = setInterval(() => {
        dispatch(fetchCurrentUserData());
      }, 300000);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [user, dispatch]);
  // useEffect(() => {
  //   const fetchEmployeeDetail = async () => {
  //     try {
  //       const { data } = await fetchAuthGET(
  //         `${import.meta.env.VITE_APP_DJANGO}/employee/me/${user._id}/`
  //       );
  //       setEmployeeDetail(data);
  //     } catch (error) {
  //       console.error(error.message);
  //     }
  //   };
  //   fetchEmployeeDetail();
  // }, [])

  useEffect(() => {
    if (userData && employeeDetail) {
      const changedEntries = Object.entries(employeeDetail).filter(
        ([key, value]) =>
          key !== 'profile_picture' &&
          key in userData && JSON.stringify(userData[key]) !== JSON.stringify(value)
      );

      if (changedEntries.length > 0) {
        const updatedData = {
          ...userData,
          ...Object.fromEntries(changedEntries),
        };

        const storedExpiry = localStorage.getItem('userInfoExpires');
        if (storedExpiry) {
          Cookies.set('userInfo', JSON.stringify(updatedData), {
            expires: new Date(storedExpiry),
          });
        } else {
          Cookies.set('userInfo', JSON.stringify(updatedData));
        }
      }
    }
  }, [userData, employeeDetail]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input, textarea, or contentEditable element
      if (isEditableElement(e.target)) {
        return;
      }

      // Log the key press for debugging
   
      // If we're waiting for a second key in a sequence
      if (waitingForSecondKey) {
        setWaitingForSecondKey(false);

        // Handle 'g' then 'd' for dashboard
        if (firstKey === 'g' && e.key.toLowerCase() === 'd') {
          navigate("/dashboard");
          toast.info("Shortcut: Go to Dashboard");
          return;
        }

        // Handle 'g' then 'p' for projects
        if (firstKey === 'g' && e.key.toLowerCase() === 'p') {
          navigate("/projects");
          toast.info("Shortcut: Go to Projects");
          return;
        }

        // Handle 'g' then 't' for tasks
        if (firstKey === 'g' && e.key.toLowerCase() === 't') {
          navigate("/tasks");
          toast.info("Shortcut: Go to Tasks");
          return;
        }

        // If second key doesn't match any sequence, reset and process as normal
        setFirstKey(null);
      }

      // Check for first key in a sequence
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        setWaitingForSecondKey(true);
        setFirstKey('g');
        return;
      }

      // Handle single key shortcuts (with modifiers)
      // Check for ADD_TASK shortcut (Ctrl+N)
      if (e.key.toLowerCase() === 'n' && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        navigate("/tasks");
        toast.info("Shortcut: Add New Task");
        return;
      }

      // Check for ADD_PROJECT shortcut (Ctrl+Shift+N)
      if (e.key.toLowerCase() === 'n' && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        navigate("/projects");
        toast.info("Shortcut: Add New Project");
        return;
      }

      // Check for VIEW_REPORTS shortcut (Ctrl+R)
      if (e.key.toLowerCase() === 'r' && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        navigate("/reports");
        toast.info("Shortcut: View Reports");
        return;
      }

      // Check for SEARCH shortcut (Ctrl+/)
      if (e.key === '/' && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        document.querySelector(".search-input")?.focus();
        toast.info("Shortcut: Search");
        return;
      }

      // Check for SHOW_SHORTCUTS shortcut (?)
      if (e.key === '?' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutHelp(true);
        return;
      }

      // Check for TOGGLE_DARK_MODE shortcut (Ctrl+Shift+D)
      if (e.key.toLowerCase() === 'd' && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setDarkMode(!isDark);
        toast.info(`Shortcut: ${isDark ? 'Light' : 'Dark'} Mode Activated`);
        return;
      }

      // Handle single key shortcuts (without modifiers)
      // Only process these if no modifiers are pressed
      if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        // Check for ADD_TASK shortcut (N)
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          navigate("/tasks");
          toast.info("Shortcut: Add New Task");
          return;
        }

        // Check for VIEW_REPORTS shortcut (R)
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          navigate("/reports");
          toast.info("Shortcut: View Reports");
          return;
        }

        // Check for SEARCH shortcut (/)
        if (e.key === '/') {
          e.preventDefault();
          document.querySelector(".search-input")?.focus();
          toast.info("Shortcut: Search");
          return;
        }

        // Check for TOGGLE_FULLSCREEN shortcut (F)
        if (e.key.toLowerCase() === 'f') {
          // This is handled in specific components, but we can show a toast
          toast.info("Shortcut: Toggle Full Screen (in editors)");
          return;
        }
      }
    };

    // Add event listener for keyboard shortcuts
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, waitingForSecondKey, firstKey, isDark, setDarkMode]);

  // Get the list of shortcuts for the help modal
  const shortcutsList = getShortcutsList();

  const switchHeaderClass = () => {
    if (menuType === "horizontal" || menuHidden) {
      return "ltr:ml-0 rtl:mr-0";
    } else if (collapsed) {
      return "ltr:ml-[72px] rtl:mr-[72px]";
    } else {
      return "ltr:ml-[220px] rtl:mr-[220px]";
    }
  };
  // content width
  const [contentWidth] = useContentWidth();
  const [menuType] = useMenulayout();
  const [menuHidden] = useMenuHidden();
  // mobile menu
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const nodeRef = useRef(null);

  return (
    <>
      {/* Display subscription limit modal globally */}
      <SubscriptionLimitModal />

      {/* WhatsNew Modal - Show when version is newer */}
      {shouldShowWhatsNew && (
        <WhatsNewModal 
          shouldShow={shouldShowWhatsNew}
          onClose={() => setShouldShowWhatsNew(false)}
          onVersionSeen={markVersionAsSeen}
        />
      )}

      {/* {showTrialBanner && <FreeTrialCountdown onClose={() => setShowTrialBanner(false)} />} */}
      <Header />
      {menuType === "vertical" && width > breakpoints.lg && !menuHidden && (
        <Sidebar />
      )}

      <MobileMenu
        className={`${width <= breakpoints.lg && mobileMenu
          ? "left-0 visible opacity-100  z-[9999]"
          : "left-[-300px] invisible opacity-0  z-[-999] "
          }`}
      />
      {/* mobile menu overlay*/}
      {width < breakpoints.lg && mobileMenu && (
        <div
          className="overlay bg-slate-900/50 backdrop-filter backdrop-blur-sm opacity-100 fixed inset-0 z-[999]"
          onClick={() => setMobileMenu(false)}
        ></div>
      )}
      <Settings />
      <div
        className={`content-wrapper transition-all duration-150 ${width > breakpoints.lg ? switchHeaderClass() : ""
          }`}
      >
        {/* md:min-h-screen will h-full*/}
        <div className="page-content   page-min-height  ">
          <div
            className={
              contentWidth === "boxed" ? "container mx-auto" : "container-fluid"
            }
          >
            <Suspense fallback={<Loading />}>
              <motion.div
                key={location.pathname}
                initial="pageInitial"
                animate="pageAnimate"
                exit="pageExit"
                variants={{
                  pageInitial: {
                    opacity: 1,
                    y: 50,
                  },
                  pageAnimate: {
                    opacity: 1,
                    y: 0,
                  },
                  pageExit: {
                    opacity: 1,
                    y: -50,
                  },
                }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.5,
                }}
              >
                {/* <Breadcrumbs /> */}
                {<Outlet />}
              </motion.div>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {shortcutsList.map((shortcut) => (
                <div key={shortcut.id} className="flex justify-between">
                  <span className="dark:text-white">{shortcut.description}</span>
                  <span className="font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded dark:text-white">
                    {shortcut.display}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <a
                href="/docs/KEYBOARD_SHORTCUTS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View full documentation
              </a>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator for key sequences */}
      {waitingForSecondKey && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md shadow-lg z-50">
          Pressed <span className="font-mono bg-gray-700 px-2 py-1 rounded">{firstKey.toUpperCase()}</span> - waiting for next key...
        </div>
      )}
    </>
  );
};

export default Layout;
