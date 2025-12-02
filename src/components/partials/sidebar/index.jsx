import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
import { menuItems, clientMenuItems, employeeMenuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import { useSelector } from "react-redux";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { djangoBaseURL } from "@/helper";
import { fetchGET } from "@/store/api/apiSlice";
import ProgressBar from "@/components/ui/ProgressBar";
import Icons from "@/components/ui/Icon";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";

// Sidebar component
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const [sidebarMenuItem, setSidebarMenuItem] = useState([]);
  const [storage, setStorage] = useState({});
  // superAdminEmails defined as a state (or could be a constant)
  const [superAdminEmails] = useState(["cg@prpwebs.com"]);

  // If needed, define the following modal states (if they aren’t defined elsewhere)
  // const [showModal, setShowModal] = useState(false);
  // const [showExpireModal, setShowExpireModal] = useState(false);
  // const [showReminderModal, setShowReminderModal] = useState(false);

  // Redirect users who are not super admins when they try to visit '/company-list'
  useEffect(() => {
    // Treat undefined user_type as employee for invited users
    const userType = userInfo?.user_type || "employee";
    const isSuperAdmin =
      userType === "employee" &&
      userInfo?.isAdmin &&
      superAdminEmails.includes(userInfo?.email);
    if (location.pathname === "/company-list" && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [location, userInfo, navigate, superAdminEmails]);

  // Set the sidebar menu items without mutating the imported array
  useEffect(() => {
    const checkUserType = () => {
      // If user_type is undefined or null, treat as employee (for invited users)
      const userType = userInfo?.user_type || "employee";

      if (userType === "employee") {
        // Start with a copy of menuItems (for admin or team_leader)
        let updatedMenuItems = [...menuItems];

        if (userInfo?.isAdmin || userInfo?.team_leader) {
          // For super admins add the extra menu item only once
          if (userInfo?.isAdmin && superAdminEmails.includes(userInfo?.email)) {
            if (
              !updatedMenuItems.some((item) => item.title === "Super Admin")
            ) {
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

  // Fetch storage data (for admin users)
  const fetchData = async () => {
    if (userInfo?.isAdmin) {
      try {
        const { data } = await fetchGET(
          `${djangoBaseURL}/company/${userInfo?.companyId}/storage/`
        );
        setStorage(data);

        // Calculate expiry date based on the payment plan
        const expiryDate = dayjs(data?.latest_payment?.created_at).add(
          data?.latest_payment?.payment_plan === "monthly" ? 1 : 12,
          "month"
        );

        // Example modal logic (ensure you have these states defined if used)
        if (data.isFull) {
          // setShowModal(true);
        }
        if (data.isExpire) {
          // setShowExpireModal(true);
        }
        if (
          dayjs().isAfter(expiryDate.subtract(3, "day")) &&
          dayjs().isBefore(expiryDate)
        ) {
          // setShowReminderModal(true);
        }
      } catch (error) {
        console.error("Error fetching storage data", error);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate storage progress
  const percentage = (
    (storage?.used_storage_mb / storage?.user_plan?.storage) *
    100
  ).toFixed(1);
  const storageSizeGB = (storage?.user_plan?.storage / 1024).toFixed(1);
  const usedStorageGB = (storage?.used_storage_mb / 1024).toFixed(1);

  const handleNavigation = () => {
    navigate("/upgrade-plan");
  };

  // Add scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    const currentNode = scrollableNodeRef.current;
    currentNode.addEventListener("scroll", handleScroll);
    return () => {
      currentNode.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();
  const [disableHover, setDisableHover] = useState(false);

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800 pt-4 ${collapsed ? "w-[72px] close_sidebar" : "w-[220px]"
          } ${menuHover ? "sidebar-hovered" : ""} ${skin === "bordered"
            ? "border-r border-slate-200 dark:border-slate-700"
            : ""
          }`}
        onMouseEnter={() => {
          if (!disableHover) setMenuHover(true);
        }}
        onMouseLeave={() => {
          if (!disableHover) setMenuHover(false);
        }}
      >
        {/* <SidebarLogo menuHover={menuHover} setMenuHover={setMenuHover} setDisableHover={setDisableHover} /> */}
        {/* <div
          className={`h-[60px] absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${
            scroll ? " opacity-100" : " opacity-0"
          }`}
        ></div> */}

        <SimpleBar
          className="sidebar-menu px-4 h-[calc(100vh-200px)]"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          <Navmenu menus={sidebarMenuItem} sidebarHovered={menuHover} />
        </SimpleBar>
        {
          !collapsed && userInfo?.isAdmin &&
          <div className="mx-auto w-44 space-y-2 flex flex-col items-end h-24">
            <Link to="/plans" className="w-full flex justify-center bg-electricBlue-100 text-white font-medium py-2 rounded-md text-sm mt-auto">
              Upgrade
            </Link>
            {
              userInfo?.permissions?.permissions?.InviteEmployee?.Invite &&
              <Link to="/invite-user" className="w-full text-black font-medium py-2 rounded-md border-2 border-gray-300 flex items-center justify-center gap-2 text-sm mt-auto">
                <Icon icon="streamline:user-add-plus" className="w-5 h-5" />
                <span>Invite User</span>
              </Link>
            }
          </div>
        }
      </div>
    </div>
  );
};

export default Sidebar;
