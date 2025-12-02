import React, { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import database from '@/firebase/index';
import { useSelector } from 'react-redux';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { capitalizeName } from '@/helper/helper';
import Button from '@/components/ui/Button';
import { fetchAuthGET } from '@/store/api/apiSlice';
import AttachmentViewer from '@/components/Task/AttachmentViewer';
import { Icon } from '@iconify/react';
import ModernTooltip from '@/components/ui/ModernTooltip';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';


function useIs2XL() {
  const [is2XL, setIs2XL] = useState(window.innerWidth >= 1280);
  useEffect(() => {
    const onResize = () => setIs2XL(window.innerWidth >= 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return is2XL;
}

const GreenWave = () => (
  <div style={{ display: "flex", alignItems: "center", height: 18 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          width: 2,
          height: 6 + 5 * Math.abs(Math.sin(Date.now() / 200 + i)),
          background: "#22c55e",
          margin: "0 1px",
          borderRadius: 2,
          animation: `waveAnim 1s ${i * 0.1}s infinite ease-in-out`,
        }}
        className="green-wave-bar"
      />
    ))}
    <style>{`
      @keyframes waveAnim {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.7); }
      }
    `}</style>
  </div>
);

const LiveReport = ({ setAttachmentsForView, handleAttachmentOpen }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const [processedData, setProcessedData] = useState([]);
  const [loadingProcessedData, setLoadingProcessedData] = useState(true);
  const [modalImg, setModalImg] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userScreenshot, setUserScreenshot] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [thumbStartIdx, setThumbStartIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { users, loading } = useSelector((state) => state.users);

  const fetchProcessedData = () => {
    if (!userInfo?.companyId) {
      console.error("User info or company ID is missing");
      setLoadingProcessedData(false);
      return;
    }

    // if (!userInfo.isAdmin) {
    //   console.error('Access denied. Admins only.');
    //   setLoadingProcessedData(false);
    //   return;
    // }

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
                userName:
                  `${latestLog.userInfo?.first_name || ""} ${latestLog.userInfo?.last_name || ""}`.trim() ||
                  "Unknown User",
                taskName: latestLog.taskInfo?.label || "Unknown Task",
                projectName:
                  latestLog.selectedProject?.label || "Unknown Project",
                status: latestLog.status ? "Running" : "Paused",
                profile_picture: latestLog.userInfo?.profile_picture || "",
                startTime: latestLog.timestamp || null,
                endTime: latestLog.endTime || null,
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
      console.error("Error fetching data:", error);
      setLoadingProcessedData(false);
    });

    return () => {
      off(companyLogsRef, "value", handleDataChange);
    };
  };

  useEffect(() => {
    fetchProcessedData();
  }, [userInfo?.companyId]);

  const handleUserClick = async (userId) => {
    if (selectedUserId === userId) {
      // If clicking the same user, collapse/close
      setSelectedUserId(null);
      setUserScreenshot(null);
      setModalImg(null);
      return;
    }
    setSelectedUserId(userId);
    setUserScreenshot(null);
    setScreenshotLoading(true);
    setThumbStartIdx(0);

    const today = new Date().toISOString().split("T")[0];
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    try {
      const response = await fetchAuthGET(
        `https://api.dyzo.ai/api/employee/${userId}/screenshots/${today}/${today}/?page=1&ordering=desc`,
      );
      if (
        response.results &&
        response.results.data &&
        response.results.data.length > 0
      ) {
        setUserScreenshot(
          response.results.data.map((ss) => ({
            url: ss.url,
            createdTime: ss.createdTime,
          })),
        );
      } else {
        setUserScreenshot([]);
      }
    } catch (e) {
      setUserScreenshot([]);
    }
    setScreenshotLoading(false);
  };

  // to get the time in 24 hour format
  function getTimeIn24HourUTC(isoString) {
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function cleanIsoTimestamp(isoTimestamp) {
    if (isoTimestamp) {
      return getTimeIn24HourUTC(isoTimestamp);
    } else {
      return "";
    }
  }
  const truncate = (str, n) =>
    str && str.length > n ? str.slice(0, n) + "..." : str;
  const is2XL = useIs2XL();

  // Helper to format duration in ms to 'Xh Ym Zs'
  function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  const filteredUsers = processedData.filter((user) => {
    const found = users.some(
      (u) => u.isActive && u._id.toString() === user.userId,
    );
    const matchesSearch = user.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    return found && matchesSearch;
  });
  // Split filteredUsers into active and inactive, then sort accordingly
  const now = new Date();
  const activeUsers = filteredUsers
    .filter((user) => {
      const endTimeDate = new Date(user.endTime);
      const diffMinutes = Math.floor((now - endTimeDate) / (1000 * 60));
      return !(user.status.toLowerCase() === "paused" || diffMinutes >= 5);
    })
    .sort((a, b) => {
      // Sort by how long they've been active (longest first)
      const aActiveMs = now - new Date(a.startTime);
      const bActiveMs = now - new Date(b.startTime);
      return bActiveMs - aActiveMs;
    });
  const inactiveUsers = filteredUsers
    .filter((user) => {
      const endTimeDate = new Date(user.endTime);
      const diffMinutes = Math.floor((now - endTimeDate) / (1000 * 60));
      return user.status.toLowerCase() === "paused" || diffMinutes >= 5;
    })
    .sort((a, b) => {
      // Sort by endTime (most recent last activity first)
      return new Date(b.endTime) - new Date(a.endTime);
    });
  const sortedUsers = [...activeUsers, ...inactiveUsers];
  return (
    <div className="rounded-xl p-5 pr-1 min-h-[508px] border-2 border-neutral-50 dark:bg-slate-800 bg-white dark:border-slate-700 dark:border">
      <div className="flex md:flex-row flex-col md:justify-between md:items-center mb-4 pr-5 gap-3">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="font-semibold xl:text-xl text-lg text-customBlack-50 dark:text-customWhite-50">
              Live Report
            </div>
          </div>
          <div className='flex md:hidden gap-4 items-center'>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="35"
              height="31"
              viewBox="0 0 35 31"
              fill="none"
            >
              <path
                d="M1.80859 8.12427L1.80859 22.5143"
                stroke="#14D020"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M9.80859 5.12427L9.80859 25.5143"
                stroke="#14D020"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M17.8086 1.62427L17.8086 29.0143"
                stroke="#14D020"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M25.8086 5.12427L25.8086 25.5143"
                stroke="#14D020"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M33.8086 8.12427L33.8086 22.5143"
                stroke="#14D020"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
        <div className='flex gap-4 items-center w-full md:w-auto'>
          <div className="relative w-full md:w-48">
            <input
              type="text"
              placeholder="Search report by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-neutral-50 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-customBlack-50 dark:text-customWhite-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-electricBlue-50 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
          <svg
            className="hidden md:block"
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="31"
            viewBox="0 0 35 31"
            fill="none"
          >
            <path
              d="M1.80859 8.12427L1.80859 22.5143"
              stroke="#14D020"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M9.80859 5.12427L9.80859 25.5143"
              stroke="#14D020"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M17.8086 1.62427L17.8086 29.0143"
              stroke="#14D020"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M25.8086 5.12427L25.8086 25.5143"
              stroke="#14D020"
              stroke-width="2"
              stroke-linecap="round"
            />
            <path
              d="M33.8086 8.12427L33.8086 22.5143"
              stroke="#14D020"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
      {/* Description and CTA button for empty state */}
      {!loadingProcessedData && processedData.length === 0 && (
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="text-sm xl:text-base font-semibold text-customGray-300 dark:text-customGray-150 text-center mb-4 max-w-md">
            Use our <b>Desktop Timer App</b> to track activity in real-time and
            generate live reports — perfect for managing remote teams.
          </div>
          <Button
            className="bg-electricBlue-100 transition text-white rounded-md px-6 py-2 font-medium text-base mb-4"
            text="Try It Now"
            onClick={() =>
              window.open(
                "https://staging.api.dyzo.ai/downloads/windows/latest-build",
                "_blank",
              )
            }
          />
        </div>
      )}
      <div className="max-h-[400px] overflow-y-auto pr-2 bg-white dark:bg-slate-800">
        {loadingProcessedData ? (
          <>
            {[...Array(7)].map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-3 border-2 border-neutral-50 dark:border-slate-700 rounded-lg p-2 animate-pulse bg-white dark:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-600 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-slate-600 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-slate-600 rounded"></div>
              </div>
            ))}
          </>
        ) : filteredUsers.length === 0 ? (
          // Show 3 skeleton cards to mimic empty user list
          <>
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between mb-3 border-2 border-neutral-50 dark:border-slate-700 rounded-lg p-2 animate-pulse bg-white dark:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-600 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-slate-600 rounded"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-slate-600 rounded"></div>
              </div>
            ))}
          </>
        ) : (
          sortedUsers.map((user, i) => {
            const currentTime = new Date();
            const endTimeDate = new Date(user.endTime);
            const diffMinutes = Math.floor(
              (currentTime - endTimeDate) / (1000 * 60),
            );
            const isActive = !(
              user.status.toLowerCase() === "paused" || diffMinutes >= 5
            );

            return (
              <div className="flex flex-col  justify-between mb-3 border-2 border-neutral-50 rounded-lg p-2 bg-white dark:border-slate-700 dark:bg-slate-800 dark:border cursor-pointer">
                <div
                  className="flex items-center justify-between"
                  key={i}
                  onClick={() => handleUserClick(user.userId)}
                >
                  <div className="flex items-top gap-2">
                    <ProfileCardWrapper userId={user?.userId} >
                      <div className="relative min-w-[44px] min-h-[44px] w-11 h-11 min-w-10 min-h-10  rounded-full border-2 dark:border-slate-700 dark:border border-white object-cover">
                        <ProfilePicture
                          user={{ name: user.userName, profile_picture: user.profile_picture }}
                        />
                      </div>
                    </ProfileCardWrapper>
                    <div>
                      <div className="font-semibold xl:text-base text-sm text-customBlack-50 dark:text-customWhite-50">
                        {capitalizeName(user.userName)}
                      </div>
                      <ModernTooltip
                        content={<span className='dark:text-white font-normal'>{`${user.projectName} > ${user.taskName}`}</span>}
                        placement="top"
                        theme="custom-light"
                      >
                        <div className="xl:text-sm text-xs text-neutral-300 dark:text-white">
                          {`${truncate(user.projectName, is2XL ? 26 : 13)} > ${truncate(user.taskName, is2XL ? 26 : 13)}`}
                        </div>
                      </ModernTooltip>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 font-medium text-right xl:text-sm text-xs`}
                  >
                    {(() => {
                      if (!isActive) return "";
                      const durationMs = currentTime - new Date(user.startTime);
                      const durationMins = Math.floor(durationMs / 60000);
                      const formatted = formatDuration(durationMs);
                      return (
                        <ModernTooltip
                          content={<span className=' dark:text-white font-normal'>{`Working since: ${formatted}`}</span>}
                          placement="top"
                          theme="custom-light"
                        >
                          <span className={"text-green-500"}>{formatted}</span>
                        </ModernTooltip>
                      );
                    })()}
                    {isActive ? (
                      <GreenWave />
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full bg-red-400 pulse-red-dot"></span>
                    )}
                    <style>{`
                        .pulse-red-dot {
                          animation: pulseRedDot 1s infinite;
                        }
                        @keyframes pulseRedDot {
                          0%, 100% { transform: scale(1); }
                          50% { transform: scale(1.5); }
                        }
                      `}</style>
                  </div>
                </div>
                {selectedUserId === user.userId &&
                  (screenshotLoading ? (
                    <div className="w-12 h-8 mt-2 flex items-center justify-center ml-2">
                      Loading...
                    </div>
                  ) : userScreenshot && userScreenshot.length > 0 ? (
                    <div
                      className="flex items-center gap-1 mt-2 justify-start overflow-x-auto w-full px-2"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {userScreenshot.map((ss, idx) => (
                        <div
                          key={ss.url}
                          className="flex flex-col items-center min-w-[200px] min-h-[120px] scroll-snap-align-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <img
                            src={ss.url}
                            alt={`Screenshot ${thumbStartIdx + idx + 1}`}
                            className="min-w-[200px] min-h-[120px] rounded object-contain border cursor-pointer bg-gray-50 dark:bg-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              // setModalImg(thumbStartIdx + idx);
                              setAttachmentsForView(userScreenshot.map((ss) => ({
                                url: ss.url,
                                type: "image",
                                createdTime: ss.createdTime,
                                name: ss.url.substring(ss.url.lastIndexOf('/') + 1)
                              })));
                              handleAttachmentOpen(idx);
                            }}
                          />
                          <span className="mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {cleanIsoTimestamp(ss.createdTime)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-12 h-8 flex items-center justify-center ml-2 text-xs text-gray-400">
                      No Img
                    </div>
                  ))}
                {/* {modalImg !== null &&
                  userScreenshot &&
                  userScreenshot.length > 0 && (
                    <AttachmentViewer
                      attachments={userScreenshot.map((ss) => ({
                        url: ss.url,
                        type: "image",
                        createdTime: ss.createdTime,
                        name:ss.url.substring(ss.url.lastIndexOf('/') + 1)
                      }))}
                      initialIndex={modalImg}
                      open={true}
                      onClose={() => setModalImg(null)}
                    />
                  )} */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveReport;
