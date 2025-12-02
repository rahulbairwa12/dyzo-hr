import React, { useEffect, useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Menu } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, token, login } from "@/store/api/auth/authSlice";
import { djangoBaseURL, getFullName } from "@/helper/index";
import { intialLetterName } from "@/helper/helper";
import ProgressBar from "@/components/ui/ProgressBar";
import { fetchGET, fetchAuthPatch, fetchPOST, fetchAuthGET } from "@/store/api/apiSlice";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import dayjs from "dayjs";
import Tooltip from "../../../ui/Tooltip";
import { toast } from "react-toastify";

// --- OPTIONAL: If you want real-time logs from Firebase ---
import database from "@/firebase/index";
import { ref, onValue, off } from "firebase/database";
import useWidth from "@/hooks/useWidth";
import { setFilters } from "@/features/tasks";

/* -------------------------------------
 * 1) Define a statusMapping for display
 * -------------------------------------
 */
const statusMapping = {
  Active: { emoji: "🟢", color: "bg-green-400", text: "Active" },
  Away: { emoji: "🕒", color: "bg-yellow-400", text: "Away" },
  "Do not disturb": { emoji: "⛔", color: "bg-red-500", text: "Do not disturb" },
  "In a meeting": { emoji: "📅", color: "bg-blue-500", text: "In a meeting" },
  "Out sick": { emoji: "🤒", color: "bg-pink-500", text: "Out sick" },
  Commuting: { emoji: "🚗", color: "bg-blue-300", text: "Commuting" },
  "On leave": { emoji: "🌴", color: "bg-purple-500", text: "On leave" },
  Focusing: { emoji: "🔕", color: "bg-gray-500", text: "Focusing" },
  "Working remotely": { emoji: "🏠", color: "bg-blue-400", text: "Working remotely" },
  Offline: { emoji: "📴", color: "bg-gray-300", text: "Offline" },
  "Out for Lunch": { emoji: "🍽️", color: "bg-yellow-300", text: "Out for Lunch" },
};

// We assume these are statuses a user may pick manually
const manualStatuses = [
  "On leave",
  "Out for Lunch",
  "Commuting",
  "Working remotely",
  "In a meeting",
  "Do not disturb",
  "Focusing",
  "Out sick",
];

/* -------------------------------------
 * 2) Helpers to figure out "live" status
 * -------------------------------------
 */
function isToday(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * getLiveStatus:
 *  - If latestLog?.status === true => "Active"
 *  - Else if the user's manual status is in manualStatuses => that status
 *  - Else if latestLog?.status === false => "Away" if it's for today, else "Offline"
 *  - Default => "Offline"
 */
function getLiveStatus(manualStatus, latestLog) {
  // 1) If user is actively tracking
  if (latestLog?.status === true) {
    return "Active";
  }
  // 2) If user has a recognized manual status
  if (manualStatus && manualStatuses.includes(manualStatus)) {
    return manualStatus;
  }
  // 3) If they have a log but it's not currently active
  if (latestLog?.status === false) {
    return isToday(latestLog.timestamp) ? "Away" : "Offline";
  }
  // 4) Fallback
  return "Offline";
}

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { width, breakpoints } = useWidth();
  const userInfo = useSelector((state) => state.auth.user);

  // "selectedStatus" is the manual status the user picks (via the dropdown).
  const [selectedStatus, setSelectedStatus] = useState(userInfo?.status || "Offline");
  const [loading, setLoading] = useState(false);

  // For "live" logs from Firebase (optional)
  const [latestLog, setLatestLog] = useState(null);

  // Storage info for admin
  const [storage, setStorage] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showExpireModal, setShowExpireModal] = useState(false);

  // Switch account modal
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);

  // 3) Subscribe to the user's latestLog from Firebase (if you want real-time)
  useEffect(() => {
    if (!userInfo?.companyId || !userInfo?._id) return;
    const logsRef = ref(database, `taskLogs/${userInfo.companyId}/${userInfo._id}/latestLog`);
    const unsub = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        setLatestLog(snapshot.val());
      } else {
        setLatestLog(null);
      }
    });
    return () => off(logsRef, "value", unsub);
  }, [userInfo?.companyId, userInfo?._id]);

  // 4) Final "live" status merges manual status + latestLog
  const finalStatus = getLiveStatus(selectedStatus, latestLog);

  /******************************************
   *  Logout Handler
   ******************************************/
  const handleLogout = () => {
    // Clear Redux state and local storage
    localStorage.removeItem("accounts");
    localStorage.removeItem("loginCredentials");
    localStorage.removeItem("taskFilters")
    sessionStorage.clear();
    dispatch(
      setFilters({
        userId: "",
        projectId: "",
        taskPosition: [],
        dateRange: { startDate: "", endDate: "" },
        priority: "",
      })
    );
    dispatch(logout());

    // Reset URL parameters by navigating to login page with no parameters
    navigate("/login", { replace: true });
  };

  /******************************************
   *  Manual Status Change Handler
   ******************************************/
  const handleStatusChange = async (newStatus) => {
    if (newStatus === selectedStatus) return; // No change
    try {
      setLoading(true);
      const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/employee/${userInfo?._id}/`,
        { body: { status: newStatus } }
      );
      if (response.status) {
        toast.success("Status updated successfully");
        setSelectedStatus(newStatus);
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      toast.error("Status not updated");
      console.error("Status Update Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /******************************************
   *  Switch Accounts
   ******************************************/
  const getRedirectPath = (role, userId = "") => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath;
    } else if (role === "client") {
      return "/client/dashboard";
    } else if (role === "employee") {
      return `/tasks?userId=${userId}`;
    }
    return "/";
  };

  const handleSwitchAccount = async (account) => {
    const encodedCreds = localStorage.getItem("loginCredentials");
    const loginTypeStored = localStorage.getItem("loginType") || "normal";
    if (!encodedCreds) {
      toast.error("No stored credentials found");
      return;
    }
    let credentials;
    try {
      credentials = JSON.parse(atob(encodedCreds));
    } catch (error) {
      console.error("Error decoding credentials:", error);
      toast.error("Failed to decode credentials");
      return;
    }
    const payload = { ...account, ...credentials };
    let response;
    try {
      if (loginTypeStored === "normal") {
        response = await fetchPOST(`${djangoBaseURL}/userlogin/`, { body: payload });
      } else {
        response = await fetchPOST(`${djangoBaseURL}/api/google-userlogin/`, {
          body: { token: credentials, ...payload },
        });
      }
      if (response.status === 1) {
        toast.success(response.message);
        dispatch(token(response.token));
        delete response?.user?.password;
        dispatch(login(response.user));
        setShowSwitchAccountModal(false);
        const redirectPath = getRedirectPath(response?.user?.user_type, response?.user?._id);
        setTimeout(() => navigate(redirectPath), 100);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Account switch error:", error);
      toast.error("Account switch failed. Please try again.");
    }
  };

  /******************************************
   *  Fetch storage data if user is Admin
   ******************************************/
  const fetchData = async () => {
    if (!userInfo?.isAdmin) return;
    try {
      const { data } = await fetchGET(`${djangoBaseURL}/company/${userInfo?.companyId}/storage/`);
      setStorage(data);
      // If storage is full
      if (data.isFull) {
        setShowModal(true);
      }
      // If plan is expired
      if (data.isExpire) {
        setShowExpireModal(true);
      }
      // If plan expires in <=3 days
      const expiryDate = dayjs(data?.latest_payment?.created_at).add(
        data?.latest_payment?.payment_plan === "monthly" ? 1 : 12,
        "month"
      );
      if (dayjs().isAfter(expiryDate.subtract(3, "day")) && dayjs().isBefore(expiryDate)) {
        setShowReminderModal(true);
      }
    } catch (error) {
      console.error("Error fetching storage data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const percentage = storage?.storage_plan?.size_mb
    ? ((storage?.used_storage_mb / storage?.storage_plan?.size_mb) * 100).toFixed(1)
    : 0;
  const storageSizeGB = storage?.storage_plan?.size_mb
    ? (storage?.storage_plan?.size_mb / 1024).toFixed(1)
    : "0.0";
  const usedStorageGB = storage?.used_storage_mb
    ? (storage?.used_storage_mb / 1024).toFixed(1)
    : "0.0";

  const handleNavigation = () => {
    navigate("/plans");
  };

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

  /******************************************
   *  Build ProfileMenu
   ******************************************/
  const storedAccountsEncoded = localStorage.getItem("accounts");
  const hasStoredAccounts = storedAccountsEncoded && storedAccountsEncoded.length > 0;

  let ProfileMenu = [];
  if (userInfo?.user_type === "employee") {
    if (userInfo?.isAdmin) {
      ProfileMenu = [
        {
          label: "Profile",
          icon: "heroicons-outline:user",
          action: () => navigate(`/profile/${userInfo?._id}`),
        },
        {
          label: "What's new!",
          icon: "heroicons-outline:sparkles",
          action: () => navigate("/changelog"),
        },
        {
          label: "Settings",
          icon: "heroicons-outline:cog",
          action: () => navigate("/settings"),
        },
        {
          label: "Billing",
          icon: "stash:billing-info-solid",
          action: () => navigate("/user-transaction-history"),
        },
        {
          label: "Desktop App",
          icon: "mynaui:desktop",
          action: () => {
            navigate("/download")
          }
        },
        {
          label: "Chrome Extension",
          icon: "material-symbols:extension-outline",
          action: () => window.open("https://chromewebstore.google.com/detail/dyzo-task-manager/lajocdihefihpcidhehkiodaibaibjaf", "_blank"),
        },
        {
          label: "Get Support",
          icon: "logos:whatsapp-icon",
          action: () => {
            window.open("https://wa.me/+918852885766?text=Hello%20Dyzo%20team%2C%20I%20need%20help.%20Can%20someone%20assist%20me%3F", "_blank")
          },
        },
        ...(hasStoredAccounts
          ? [
            {
              label: "Switch Account",
              icon: "heroicons-outline:switch-horizontal",
              action: () => setShowSwitchAccountModal(true),
            },
          ]
          : []),
        {
          label: "Logout",
          icon: "heroicons-outline:login",
          action: () => handleLogout(),
        },
      ];
    } else {
      ProfileMenu = [
        {
          label: "Profile",
          icon: "heroicons-outline:user",
          action: () => navigate(`/profile/${userInfo?._id}`),
        },
        {
          label: "What's new!",
          icon: "heroicons-outline:sparkles",
          action: () => navigate("/changelog"),
        },
        {
          label: "Desktop App",
          icon: "mynaui:desktop",
          action: () => {
            navigate("/download")
          }
        },
        {
          label: "Chrome Extension",
          icon: "material-symbols:extension-outline",
          action: () => window.open("https://chromewebstore.google.com/detail/dyzo-task-manager/lajocdihefihpcidhehkiodaibaibjaf", "_blank"),
        },
        {
          label: "Get Support",
          icon: "logos:whatsapp-icon",
          action: () => {
            window.open("https://wa.me/+918852885766?text=Hello%20Dyzo%20team%2C%20I%20need%20help%20with%20selecting%20a%20plan.%20Can%20someone%20assist%20me%3F", "_blank")
          },
        },
        ...(hasStoredAccounts
          ? [
            {
              label: "Switch Account",
              icon: "heroicons-outline:switch-horizontal",
              action: () => setShowSwitchAccountModal(true),
            },
          ]
          : []),
        {
          label: "Logout",
          icon: "heroicons-outline:login",
          action: () => handleLogout(),
        },
      ];
    }
  } else {
    ProfileMenu = [
      {
        label: "Profile",
        icon: "heroicons-outline:user",
        action: () => navigate(`/profile/${userInfo?._id}?name=${userInfo?.name}`),
      },
      {
        label: "What's new!",
        icon: "heroicons-outline:sparkles",
        action: () => navigate("/changelog"),
      },
      {
        label: "Desktop App",
        icon: "mynaui:desktop",
        action: () => {
          navigate("/download")
        }
      },
      {
        label: "Chrome Extension",
        icon: "material-symbols:extension-outline",
        action: () => window.open("https://chromewebstore.google.com/detail/dyzo-task-manager/lajocdihefihpcidhehkiodaibaibjaf", "_blank"),
      },
      {
        label: "Get Support",
        icon: "logos:whatsapp-icon",
        action: () => {
          window.open("https://wa.me/+918852885766?text=Hello%20Dyzo%20team%2C%20I%20need%20help%20with%20selecting%20a%20plan.%20Can%20someone%20assist%20me%3F", "_blank")
        },
      },
      ...(hasStoredAccounts
        ? [
          {
            label: "Switch Account",
            icon: "heroicons-outline:switch-horizontal",
            action: () => setShowSwitchAccountModal(true),
          },
        ]
        : []),
      {
        label: "Logout",
        icon: "heroicons-outline:login",
        action: () => handleLogout(),
      },
    ];
  }

  /******************************************
   *  The dropdown label with finalStatus
   ******************************************/
  const profileLabel = () => {
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    // finalStatus is the merged status (live + manual)
    const userStatus = finalStatus;
    const statusObj = statusMapping[userStatus] || statusMapping["Offline"];

    return (
      <div className="flex items-center group">
        <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
          <div className="lg:h-8 lg:w-8 h-7 w-7 rounded-full">
            {!userInfo?.profile_picture ? (
              <div className="rounded-full relative group">
                <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-xs leading-none w-8 h-8">
                  {intialLetterName(userInfo?.name, userInfo?.first_name, userInfo?.last_name, userInfo?.email)}
                </span>
                {/* Dot + tooltip for status */}

              </div>
            ) : (
              <div className="relative group">
                <img
                  src={`${import.meta.env.VITE_APP_DJANGO}${userInfo?.profile_picture}`}
                  alt="Profile"
                  className="w-[2rem] h-[2rem] object-fit rounded-full transition-all duration-300 ease-in-out"
                />
                <Menu as="div">
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-800 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    {Object.keys(statusMapping).map((statusKey) => (
                      <Menu.Item key={statusKey} >
                        {({ active }) => (
                          <div
                            onClick={() => handleStatusChange(statusKey)}
                            className={`${active ? "bg-gray-100 dark:bg-slate-700" : ""
                              } group flex items-center px-4 py-2 text-sm cursor-pointer`}
                          >
                            <span className="mr-2">{statusMapping[statusKey].emoji}</span>
                            <span className="flex-1">{statusMapping[statusKey].text}</span>
                            {finalStatus === statusKey && (
                              <Icon icon="heroicons:check" className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>
            )}
          </div>
        </div>
        {/* username text */}
        {/* <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block">
            {getFullName(userInfo)}
          </span>
          <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
            <Icon icon="heroicons-outline:chevron-down"></Icon>
          </span>
        </div> */}
      </div>
    );
  };

  /******************************************
   *  Rendering the actual <Profile />
   ******************************************/
  return (
    <>
      <div className="md:block hidden">
        <button
          onClick={() => {
            //cacheApi.clear(); // Cache clear functionality is missing from original code.  Adding a placeholder.
            window.location.reload();
          }}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
          title="Refresh page"
        >
          <Icon icon="heroicons:arrow-path-20-solid" className="h-5 w-5 text-electricBlue-100" />
        </button>
      </div>
      <Dropdown label={profileLabel()} classMenuItems="w-[190px] top-[58px]">
        {ProfileMenu.map((item, index) => (
          <Menu.Item key={index}>
            {({ active }) => (
              <div
                onClick={() => item.action()}
                className={`${active
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                  : "text-slate-600 dark:text-slate-300"
                  } block ${item.hasDivider ? "border-t border-slate-100 dark:border-slate-700" : ""}`}
              >
                <div className={`block cursor-pointer px-4 py-2`}>
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon={item.icon} />
                    </span>
                    <span className="block text-sm">{item.label}</span>
                  </div>
                </div>
              </div>
            )}
          </Menu.Item>
        ))}
      </Dropdown>

      {/* Example: Switch Account Modal */}
      {showSwitchAccountModal && (
        <Modal
          activeModal={showSwitchAccountModal}
          onClose={() => setShowSwitchAccountModal(false)}
          title="Switch Account"
          label="Switch Account"
          labelClass="btn-outline-dark"
        >
          <h4 className="mb-3">Select an account to switch to:</h4>
          <ul className="space-y-4">
            {(() => {
              const encoded = localStorage.getItem("accounts");
              if (!encoded) return null;
              try {
                const accounts = JSON.parse(atob(encoded));
                return accounts.map((account, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSwitchAccount(account)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <span>{account.company_name}</span>
                      <span className="text-sm italic">{account.user_type}</span>
                    </button>
                  </li>
                ));
              } catch (error) {
                console.error("Error decoding accounts:", error);
                return null;
              }
            })()}
          </ul>
        </Modal>
      )}

      {/* If the user is admin, show plan modals, etc. */}
      {userInfo?.isAdmin && (
        <>
          {/* Example: Reminder Modal */}
          <Modal
            activeModal={showReminderModal}
            onClose={() => setShowReminderModal(false)}
            title="Reminder"
            label="Reminder"
            labelClass="btn-outline-light"
            themeClass="bg-slate-600 text-slate-900"
            footerContent={
              <Button
                text="Upgrade Now"
                className="bg-slate-600 text-white"
                onClick={() => {
                  navigate("/upgrade-plan");
                  setShowReminderModal(false);
                }}
              />
            }
          >
            <h4 className="font-medium text-lg mb-3 text-slate-900">
              Storage Plan Expiry Reminder
            </h4>
            <div className="text-base text-slate-600 dark:text-slate-300">
              Your storage plan will expire soon. Please upgrade your plan to continue using Dyzo without interruptions.
            </div>
          </Modal>

          {/* Example: Expired Modal */}
          <Modal
            activeModal={showExpireModal}
            onClose={() => setShowExpireModal(false)}
            title="Plan Expired"
            label="Plan Expired"
            labelClass="btn-outline-danger"
            themeClass="bg-danger-500"
            footerContent={
              <Button
                text="Renew Plan"
                className="btn-danger"
                onClick={() => {
                  navigate("/plans");
                  setShowExpireModal(false);
                }}
              />
            }
          >
            <h4 className="font-medium text-lg mb-3 text-slate-900">
              Storage Plan Expired
            </h4>
            <div className="text-base text-slate-600 dark:text-slate-300">
              Your storage plan has expired. Dyzo has stopped taking screenshots and other functionalities that require storage. Please renew your plan to continue using Dyzo.
            </div>
          </Modal>
        </>
      )}
    </>
  );
};

export default Profile;