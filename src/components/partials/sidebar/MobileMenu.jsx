import React, { useRef, useEffect, useState } from "react";

import Navmenu from "./Navmenu";
import { menuItems, clientMenuItems, employeeMenuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import useDarkMode from "@/hooks/useDarkMode";
import { Link, useNavigate } from "react-router-dom";
import useMobileMenu from "@/hooks/useMobileMenu";
import Icon from "@/components/ui/Icon";

// import images
import MobileLogo from "@/assets/images/logo/dyzo-ai-logo.png";
import MobileLogoWhite from "@/assets/images/common/app-icon-white.png";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import { djangoBaseURL, isAdmin } from "@/helper";
import { fetchGET } from "@/store/api/apiSlice";
import ProgressBar from "@/components/ui/ProgressBar";
import Icons from "@/components/ui/Icon";
import dayjs from "dayjs"; // Import dayjs for date handling
import { useSelector } from "react-redux";


const MobileMenu = ({ className = "custom-class" }) => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const [storage, setStorage] = useState({});
  const userInfo = useSelector((state) => state.auth.user);
  const [sidebarMenuItem, setSidebarMenuItem] = useState([]);
  const [superAdminEmails] = useState(['cg@prpwebs.com']);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    const currentRef = scrollableNodeRef.current;
    
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      
      // Return cleanup function
      return () => {
        currentRef.removeEventListener("scroll", handleScroll);
      };
    }
  }, [scrollableNodeRef]);

  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();
  const [isDark] = useDarkMode();
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const navigate = useNavigate()
  const fetchData = async () => {
    if (userInfo?.isAdmin) {
      try {
        const { data } = await fetchGET(`${djangoBaseURL}/company/${userInfo?.companyId}/storage/`);
        setStorage(data);

        // Calculate expiry date based on the payment plan
        const expiryDate = dayjs(data?.latest_payment?.created_at).add(
          data?.latest_payment?.payment_plan === "monthly" ? 1 : 12,
          "month"
        );

        // Show the modal if storage is full
        if (data.isFull) {
          setShowModal(true);
        }

        // Show the plan expiry modal if the plan is expired
        if (data.isExpire) {
          setShowExpireModal(true);
        }

        // Check if the current date is within 3 days of the expiry date
        if (dayjs().isAfter(expiryDate.subtract(3, "day")) && dayjs().isBefore(expiryDate)) {
          setShowReminderModal(true);
        }
      } catch (error) {
        console.error("Error fetching storage data", error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkUserType = () => {
      if (userInfo?.user_type === "employee") {
        // Start with a copy of menuItems (for admin or team_leader)
        let updatedMenuItems = [...menuItems];

        if (userInfo?.isAdmin || userInfo?.team_leader) {
          // For super admins add the extra menu item only once
          if (userInfo?.isAdmin && superAdminEmails.includes(userInfo?.email)) {
            if (!updatedMenuItems.some(item => item.title === "Super Admin")) {
              updatedMenuItems.push({
                title: "Super Admin",
                link: "/company-list",
                icon: "clarity:employee-group-line",
                isHide: false,
              });
            }
          }
          setSidebarMenuItem(updatedMenuItems);
        } else {
          // Regular employee (non-admin, non-team_leader)
          setSidebarMenuItem(employeeMenuItems);
        }
      } else {
        // Non-employee (assumed client)
        setSidebarMenuItem(clientMenuItems);
      }
    };

    checkUserType();
  }, [userInfo, superAdminEmails]);

  const percentage = ((storage?.used_storage_mb / storage?.user_plan?.storage) * 100).toFixed(1);
  const storageSizeGB = (storage?.user_plan?.storage / 1024).toFixed(1);
  const usedStorageGB = (storage?.used_storage_mb / 1024).toFixed(1);
  const handleNavigation = () => {
    navigate('/upgrade-plan');
  };

  return (
    <div
      className={`${className} fixed  top-0 bg-white dark:bg-slate-800 shadow-lg  h-full   w-[220px]`}
    >
      <div className="logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-[9] h-[85px]  px-4 ">
        <Link to="/dashboard">
          <div className="flex items-center space-x-4">
            <div className="logo-icon">
              {!isDark && !isSemiDark ? (
                <img src={MobileLogo} alt="" className="w-6" />
              ) : (
                <img src={MobileLogoWhite} alt="" className="w-6" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Dyzo
              </h1>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="cursor-pointer text-slate-900 dark:text-white text-2xl"
        >
          <Icon icon="heroicons:x-mark" />
        </button>
      </div>

      <div
        className={`h-[60px]  absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${scroll ? " opacity-100" : " opacity-0"
          }`}
      ></div>
      <SimpleBar
        className="sidebar-menu px-4 h-[calc(100%-80px)]"
        scrollableNodeProps={{ ref: scrollableNodeRef }}
      >
        <Navmenu menus={sidebarMenuItem} />
        {/* {(userInfo?.isAdmin) && (
          <div onClick={handleNavigation} className="block cursor-pointer px-4 py-2">
            <div className="flex items-center">
              <span className="block text-xl ltr:mr-3 rtl:ml-3">
                <Icons icon="clarity:storage-solid" />
              </span>
              <span className="block text-sm">
                <ProgressBar value={percentage} title="Storage" />
                {`${usedStorageGB} GB of ${storageSizeGB} GB`}
              </span>
            </div>
          </div>
        )} */}
        {/* <div className="bg-slate-900 mb-24 lg:mb-10 mt-24 p-4 relative text-center rounded-2xl text-white" onClick={() => navigate('/upgrade-plan')}>
          <img
            src={svgRabitImage}
            alt=""
            className="mx-auto relative -mt-[73px]"
          />
          <div className="max-w-[160px] mx-auto mt-6">
            <div className="widget-title">Unlimited Access</div>
            <div className="text-xs font-light">
              Upgrade your system to business plan
            </div>
          </div>
          <div className="mt-6">
            <button className="btn bg-white hover:bg-opacity-80 text-slate-900 btn-sm w-full block">
              Upgrade
            </button>
          </div>
        </div> */}
      </SimpleBar>
    </div>
  );
};

export default MobileMenu;
