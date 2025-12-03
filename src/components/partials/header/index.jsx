import React, { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import SwitchDark from "./Tools/SwitchDark";
import HorizentalMenu from "./Tools/HorizentalMenu";
import useWidth from "@/hooks/useWidth";
import useSidebar from "@/hooks/useSidebar";
import useNavbarType from "@/hooks/useNavbarType";
import useMenulayout from "@/hooks/useMenulayout";
import useSkin from "@/hooks/useSkin";
import Logo from "./Tools/Logo";
import SearchModal from "./Tools/SearchModal";
import Profile from "./Tools/Profile";
import Notification from "./Tools/Notification";
import useRtl from "@/hooks/useRtl";
import useMobileMenu from "@/hooks/useMobileMenu";
import MonoChrome from "./Tools/MonoChrome";
import AddTaskIcon from "./Tools/AddTaskIcon";

import Tooltip from "@/components/ui/Tooltip";
import { Menu } from "@headlessui/react"; // Assuming you're using Headless UI
import Dropdown from "@/components/ui/Dropdown";

import { useNavigate, useLocation, Link } from "react-router-dom";

import InternetStatusIndicator from "@/components/ui/InternetStatusIndicator";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { enforceSubscriptionLimit } from "@/store/planSlice";
import DyzoLogo from "@/assets/images/logo/dyzo-ai-logo.png";

import ModernTooltip from "@/components/ui/ModernTooltip";

const Header = ({ className = "custom-class" }) => {
  const [collapsed, setMenuCollapsed] = useSidebar();
  const { width, breakpoints } = useWidth();
  const [navbarType] = useNavbarType();


  const location = useLocation();
  const isDashboard =
    location.pathname === "/" || location.pathname === "/dashboard";
  const isTasksPage =
    location.pathname === "/tasks" || location.pathname.startsWith("/tasks?");
  const isProjectReportsPage = location.pathname === "/project-reports";


  const userInfo = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();

  const navbarTypeClass = () => {
    switch (navbarType) {
      case "floating":
        return isDashboard
          ? "floating has-sticky-header"
          : "sticky top-0 z-[999]";
      case "sticky":
        return "sticky top-0 z-[999]";
      case "static":
        return "static";
      case "hidden":
        return "hidden";
      default:
        return "sticky top-0";
    }
  };
  const [menuType] = useMenulayout();
  const [skin] = useSkin();
  const [isRtl] = useRtl();
  const navigate = useNavigate();


  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [downloadLink, setDownloadLink] = useState("#");

  const handleOpenMobileMenu = () => {
    setMobileMenu(!mobileMenu);
  };
  useEffect(() => {
    const detectPlatform = () => {
      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("win")) {
        return "windows";
      } else if (platform.includes("mac")) {
        return "mac";
      }
      return "unknown";
    };

    const platform = detectPlatform();

    if (platform === "windows") {
      setDownloadLink(
        "https://staging.api.dyzo.ai/downloads/windows/latest-build",
      );
    } else if (platform === "mac") {
      setDownloadLink(
        "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg",
      );
    }
  }, []);

  const borderSwicthClass = () => {
    if (skin === "bordered" && navbarType !== "floating") {
      return "border-b border-slate-200 dark:border-slate-700";
    } else if (skin === "bordered" && navbarType === "floating") {
      return "border border-slate-200 dark:border-slate-700";
    } else {
      return "dark:border-b dark:border-slate-700 dark:border-opacity-60";
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleDropdownClick = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleMenuAction = (action) => {
    action();
    setDropdownVisible(false); // Close the dropdown after action
  };



  // Function to extract project ID from URL if on project details page
  const getProjectIdFromUrl = () => {
    const pathParts = window.location.pathname.split("/");
    if (pathParts.includes("project-details")) {
      const projectIdIndex = pathParts.indexOf("project-details") + 1;
      if (projectIdIndex < pathParts.length) {
        return pathParts[projectIdIndex];
      }
    }
    return null;
  };



  return (
    <header>
      <div
        className={`app-header md:px-6 px-[15px] py-[6px] w-full fixed z-[999] bg-customPurple-150 dark:bg-slate-700 top-0 `}
      >
        <div
          className={`flex justify-between items-center h-full ${!isDashboard ? "md:flex" : ""}`}
        >
          {/* For Vertical  */}
          {/* {menuType === "vertical" && ( */}
          <div className="flex items-center md:space-x-4 space-x-2 rtl:space-x-reverse md:w-[36%]">
            {width >= breakpoints.lg && (
              <div className="flex items-center gap-4">
                <button
                  className="text-xl text-slate-900 dark:text-white"
                  onClick={() => setMenuCollapsed(!collapsed)}
                >
                  <Icon icon="heroicons:bars-3-20-solid" className="w-7 h-7" />
                </button>
                <Link to="/dashboard">
                  <img src={DyzoLogo} alt="logo" className="h-6" />
                </Link>
              </div>
            )}
            {width <= breakpoints.md && (
              <div
                className="cursor-pointer text-slate-900 dark:text-white text-2xl"
                onClick={handleOpenMobileMenu}
              >
                <Icon icon="heroicons-outline:menu-alt-3" />
              </div>
            )}
            {width <= breakpoints.lg && <Logo />}
            {/* open mobile menu handlaer*/}
            {width <= breakpoints.lg && width >= breakpoints.md && (
              <div
                className="cursor-pointer text-slate-900 dark:text-white text-2xl"
                onClick={handleOpenMobileMenu}
              >
                <Icon icon="heroicons-outline:menu-alt-3" />
              </div>
            )}
          </div>
          {/* // )} */}

          {/* For Horizontal  */}
          {/* {menuType === "horizontal" && (
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Logo />
              {width <= breakpoints.xl && (
                <div
                  className="cursor-pointer text-slate-900 dark:text-white text-2xl"
                  onClick={handleOpenMobileMenu}
                >
                  <Icon icon="heroicons-outline:menu-alt-3" />
                </div>
              )}
            </div>
          )} */}

          {/*  Horizontal  Main Menu */}
          {/* {menuType === "horizontal" && width >= breakpoints.xl ? (
            <HorizentalMenu />
          ) : null} */}

          <div className="w-[50%] md:w-[28%]">
            <SearchModal />
          </div>

          {/* Nav Tools  */}
          <div className="nav-tools flex items-center justify-end lg:space-x-4 space-x-1 rtl:space-x-reverse  md:w-[36%]">
            {/* Internet Status Indicator */}
            <InternetStatusIndicator />

            {/* Add Task button - shown on all pages except where hideButtons is true */}




            {/* Timer App button - displayed only on dashboard */}
            {/* {isDashboard && (
              <Tooltip
                key="DownloadDesktopAppIcon"
                title="Download Desktop App"
                content="Get the Dyzo desktop app"
                placement="top"
                className="btn btn-outline-dark"
                arrow
                animation="shift-away"
              >
                <div className="relative">
                  <a
                    href={downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 p-2 rounded-md cursor-pointer add-project-btn btn-dark dark:bg-slate-800 text-sm font-normal"
                  >
                    <Icon icon="line-md:downloading-loop" className="w-5 h-5 text-white" />
                    <span className="hidden md:inline">Timer App</span>
                  </a>
                </div>
              </Tooltip>
            )} */}

            {/* <Tooltip
              key="Notification"
              title="Notifications"
              content="Notifications"
              placement="top"
              className="btn btn-outline-dark"
              arrow
              animation="shift-away"
            >
              <div>
                <Notification />
              </div>
            </Tooltip> */}

            <Profile />

            {/* {width <= breakpoints.md && (
              <div
                className="cursor-pointer text-slate-900 dark:text-white text-2xl"
                onClick={handleOpenMobileMenu}
              >
                <Icon icon="heroicons-outline:menu-alt-3" />
              </div>
            )} */}
          </div>
        </div>
      </div>





    </header>
  );
};

export default Header;
