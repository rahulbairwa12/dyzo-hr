import React, { useState, useEffect, Fragment } from "react";
import { Tab } from "@headlessui/react";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import AttendanceTable from "./AttendanceTable";
import ExtraInfo from "./ExtraInfo";
import { useSelector } from "react-redux";
import { djangoBaseURL } from "@/helper";
import { toast } from "react-toastify";
import { fetchAuthGET, fetchGET } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";
import Card from "@/components/ui/Card";
import Papa from "papaparse";
import { useParams } from "react-router-dom";

// Helper function to sum up time in "HH:MM" format
const sumWorkingHours = (attendance) => {
    let totalMinutes = 0;

    attendance.forEach(({ totalTimeSpent }) => {
        if (totalTimeSpent && totalTimeSpent !== "00:00") {
            const [hours, minutes] = totalTimeSpent.split(":").map(Number);
            totalMinutes += hours * 60 + minutes;
        }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${String(totalHours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

// Helper function to convert numeric days to names
const getDayNames = (days) => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day) => dayNames[day - 1]).join("-");
};

const Attendance = () => {
    const { userId } = useParams();
    const userInfo = useSelector((state) => state.auth.user);
    const [currentMonth, setCurrentMonth] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidayData, setHolidayData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [daysInMonth, setDaysInMonth] = useState(0);
    const [weekends, setWeekends] = useState([]);
    const [fullDays, setFullDays] = useState([]);
    const [halfDays, setHalfDays] = useState([]);
    const [downloading, setDownloading] = useState(false);
    const [extraInfo, setExtraInfo] = useState([]);
    const [extraInfoNextPage, setExtraInfoNextPage] = useState(null);
    const [extraInfoPrevPage, setExtraInfoPrevPage] = useState(null);
    const [extraInfoCurrentPage, setExtraInfoCurrentPage] = useState(1);
    const [extraInfoTotalPages, setExtraInfoTotalPages] = useState(null);
    const [extraInfoTotalCount, setExtraInfoTotalCount] = useState(null);
    const [extraInfoLoading, setExtraInfoLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("attendance");

    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const currentMonthString = `${year}-${month}`;
        setCurrentMonth(currentMonthString);
        setSelectedMonth(currentMonthString);
        setDaysInMonth(new Date(year, now.getMonth() + 1, 0).getDate());
    }, []);

    const handleMonthChange = (event) => {
        const selectedMonth = event.target.value;
        setSelectedMonth(selectedMonth);
        const [year, month] = selectedMonth.split("-");
        setDaysInMonth(new Date(year, month, 0).getDate());
    };

    const holidaysAttendance = async () => {
        setLoading(true);
        let endpoint = `${djangoBaseURL}/api/holidays/${userInfo?.companyId}/${selectedMonth}`;

        try {
            const response = await fetchGET(endpoint);
            if (response.status) {
                setHolidayData(response.holidays);
            } else {
                toast.error("Failed to fetch attendance data");
            }
        } catch (error) {
            toast.error("Failed to fetch attendance data");
        } finally {
            setLoading(false);
        }
    };

    const emplyeeAttendance = async () => {
        setLoading(true);
        let endpoint = `${djangoBaseURL}/api/single-employee-attendance/${userInfo?.companyId}/${userId}/?year_month=${selectedMonth}`;

        try {
            const response = await fetchGET(endpoint);
            if (response.status) {
                setAttendanceData(response.data);
                holidaysAttendance();
            } else {
                toast.error("Failed to fetch attendance data");
            }
        } catch (error) {
            toast.error("Failed to fetch attendance data");
        } finally {
            setLoading(false);
        }
    };

    const getExtraInfo = async () => {
        setExtraInfoLoading(true);
        let endpoint = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userId}/`;

        try {
            const response = await fetchGET(endpoint);
            if (response.status) {
                setExtraInfo(response.data);
                setExtraInfoNextPage(response.next_page_url);
                setExtraInfoPrevPage(response.prev_page_url);
                setExtraInfoCurrentPage(response.current_page);
                setExtraInfoTotalPages(response.total_pages);
                setExtraInfoTotalCount(response.total_items);
            }
        } catch (error) {
            toast.error("Failed to fetch extra info");
        } finally {
            setExtraInfoLoading(false);
        }
    };

    const getExtraInformation = async (url) => {
        setExtraInfoLoading(true);
        try {
            const response = await fetchAuthGET(url);
            if (response.status) {
                setExtraInfo(response.data);
                setExtraInfoNextPage(response.next_page_url);
                setExtraInfoPrevPage(response.prev_page_url);
                setExtraInfoCurrentPage(response.current_page);
                setExtraInfoTotalPages(response.total_pages);
                setExtraInfoTotalCount(response.total_items);
            }
        } catch (error) {
            toast.error("Failed to fetch extra info");
        } finally {
            setExtraInfoLoading(false);
        }
    };

    const handlePageChange = (url) => {
        if (url) {
            getExtraInformation(url);
        }
    };

    const handlePageInputSubmit = (pageNumber) => {
        let url = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userId}/?page=${pageNumber}`;
        getExtraInformation(url);
    };

    const getCompanySchedule = async () => {
        try {
            const response = await fetchAuthGET(`${djangoBaseURL}/schedule/${userInfo?.companyId}`);
            if (response.status) {
                setWeekends(response.weekends);
                setFullDays(response.full_day_hour);
                setHalfDays(response.half_day_hour);
            }
        } catch (error) {
            setWeekends([]);
            setFullDays([]);
            setHalfDays([]);
        }
    };

    useEffect(() => {
        if (userInfo?.companyId) {
            getCompanySchedule();
        }
    }, [userInfo]);

    useEffect(() => {
        if (selectedMonth !== "") {
            emplyeeAttendance();
            getExtraInfo();
        }
    }, [selectedMonth, userInfo]);

    const fetchAllExtraInfoPages = async () => {
        let allExtraInfo = [];
        let page = 1;
        let url = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userId}/?page=${page}`;

        let hasNextPage = true;

        while (hasNextPage) {
            try {
                const response = await fetchAuthGET(url);
                if (response.status) {
                    allExtraInfo = [...allExtraInfo, ...response.data];
                    url = response.next_page_url;
                    hasNextPage = !!url;
                } else {
                    hasNextPage = false;
                }
            } catch (error) {
                toast.error("Failed to fetch extra info");
                hasNextPage = false;
            }
        }
        return allExtraInfo;
    };

    const downloadCSV = async () => {
        setDownloading(true);
        let csvData = [];
        let headers = [];

        if (activeTab === "attendance") {
            headers = [
                "Employee Name",
                ...Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`),
                "Total Working Hours",
            ];

            csvData = attendanceData.map((employee) => {
                const row = {
                    "Employee Name": employee.employeeName,
                    "Total Working Hours": sumWorkingHours(employee.attendance),
                };
                employee.attendance.forEach((att) => {
                    row[`Day ${att.dayNumber}`] = att.totalTimeSpent;
                });
                return row;
            });
        } else {
            headers = ["Name"];
            if (extraInfo.length > 0) {
                const daysInMonth = extraInfo[0].working_hours.length;
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = extraInfo[0].working_hours[day - 1].date;
                    headers.push(`${date} START`, `${date} END`, `${date} HOURS`);
                }
            }

            const allExtraInfo = await fetchAllExtraInfoPages();

            csvData = allExtraInfo.map((employee) => {
                let rowData = {
                    Name: employee.name,
                };
                employee.working_hours.forEach((work) => {
                    rowData[`${work.date} START`] = work.started_at;
                    rowData[`${work.date} END`] = work.ended_at;
                    rowData[`${work.date} HOURS`] = work.total_hours;
                });
                return rowData;
            });
        }

        const csv = Papa.unparse({ fields: headers, data: csvData });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_${selectedMonth}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloading(false);
    };

    return (
        <main>
            <div className="flex gap-2 justify-between items-center mb-4">
                <Textinput type="month" defaultValue={currentMonth} max={currentMonth} onChange={handleMonthChange} />
                <Button icon="foundation:download" isLoading={downloading} className="btn-primary" onClick={downloadCSV} />
            </div>
            <Tab.Group onChange={(index) => setActiveTab(index === 0 ? "attendance" : "extraInfo")}>
                <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button
                                className={` inline-flex items-start text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                                    ${selected ? "text-primary-500 before:w-full" : "text-slate-500 before:w-0 dark:text-slate-300"}`}
                            >
                                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                                    <Icon icon="arcticons:khatabook" />
                                </span>
                                Attendance
                            </button>
                        )}
                    </Tab>
                    <Tab as={Fragment}>
                        {({ selected }) => (
                            <button
                                className={` inline-flex items-start text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                                    ${selected ? "text-primary-500 before:w-full" : "text-slate-500 before:w-0 dark:text-slate-300"}`}
                            >
                                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                                    <Icon icon="arcticons:pdf-extra" />
                                </span>
                                Extra Info
                            </button>
                        )}
                    </Tab>
                </Tab.List>
                <Tab.Panels className="mt-4">
                    <Tab.Panel>
                        <Card className="mt-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <div className="flex gap-2 items-center">
                                        <Icon icon="mdi:progress-tick" className="text-green-400" />
                                        <h4 className="text-[16px]">Full Day</h4>
                                    </div>
                                    <p className="pl-4">{fullDays}</p>
                                </div>
                                <div>
                                    <div className="flex gap-2 items-center">
                                        <Icon icon="mdi:progress-clock" className="text-yellow-400" />
                                        <h4 className="text-[16px]">Half Day</h4>
                                    </div>
                                    <p className="pl-4">{halfDays}</p>
                                </div>
                                <div>
                                    <div className="flex gap-2 items-center">
                                        <Icon icon="material-symbols-light:weekend-outline" className="text-blue-400" />
                                        <h4 className="text-[16px]">Weekends</h4>
                                    </div>
                                    <p className="pl-4">{getDayNames(weekends)}</p>
                                </div>
                                <div>
                                    <div className="flex gap-2 items-center">
                                        <Icon icon="fontisto:holiday-village" className="text-purple-400" />
                                        <h4 className="text-[16px]">Holidays</h4>
                                    </div>
                                    <p className="pl-4">{holidayData.length}</p>
                                </div>
                            </div>
                        </Card>
                        <div className="pt-4">
                            <AttendanceTable
                                loading={loading}
                                attendanceData={attendanceData}
                                daysInMonth={daysInMonth}
                                weekends={weekends}
                                selectedMonth={selectedMonth}
                                currentMonth={currentMonth}
                                halfDays={halfDays}
                                fullDays={fullDays}
                                holidayData={holidayData}
                            />
                        </div>
                    </Tab.Panel>
                    <Tab.Panel>
                        <ExtraInfo
                            extraInfo={extraInfo}
                            loading={extraInfoLoading}
                            getExtraInfo={getExtraInfo}
                            extraInfoNextPage={extraInfoNextPage}
                            extraInfoPrevPage={extraInfoPrevPage}
                            extraInfoCurrentPage={extraInfoCurrentPage}
                            extraInfoTotalPages={extraInfoTotalPages}
                            extraInfoTotalCount={extraInfoTotalCount}
                            onPageChange={handlePageChange}
                            handlePageInputSubmit={handlePageInputSubmit}
                            holidayData={holidayData}
                        />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </main>
    );
};

export default Attendance;
