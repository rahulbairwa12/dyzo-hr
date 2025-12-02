import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTable, useSortBy } from "react-table";
import Card from "@/components/ui/Card";
import ListSkeleton from "@/pages/table/ListSkeleton";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge";
import { Icon } from "@iconify/react";
import { djangoBaseURL } from "@/helper";
import { intialLetterName } from "@/helper/helper";
import { fetchGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";

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

// Function to check if a day is a holiday
const isHoliday = (day, yearMonth, holidayData) => {
    const date = `${yearMonth}-${String(day).padStart(2, "0")}`;
    return holidayData.find((holiday) => holiday.date === date);
};

// Function to check if a day is a weekend
const isWeekend = (day, yearMonth, weekends) => {
    const date = new Date(`${yearMonth}-${String(day).padStart(2, "0")}`);
    const dayOfWeek = date.getDay();
    return weekends.includes(dayOfWeek + 1);
};

// Function to calculate attendance statistics
const calculateAttendanceStats = (
    attendance,
    yearMonth,
    fullDays,
    halfDays,
    holidayData,
    weekends,
    currentDay,
    selectedMonth,
    currentMonth
) => {
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let workingDaysCount = 0;

    attendance.forEach((att) => {
        const hours = att.totalTimeSpent;
        const day = att.dayNumber;

        // Skip holidays and weekends
        if (isHoliday(day, yearMonth, holidayData) || isWeekend(day, yearMonth, weekends)) return;

        // Skip future dates
        const isFutureDate = selectedMonth === currentMonth && day > currentDay;
        if (isFutureDate) return;

        workingDaysCount++;
        if (hours >= fullDays) {
            presentCount++;
        } else if (hours >= halfDays && hours < fullDays) {
            halfDayCount++;
        } else {
            absentCount++;
        }
    });

    return {
        totalWorkingDays: workingDaysCount,
        totalPresent: presentCount,
        totalHalfDays: halfDayCount,
        totalAbsent: absentCount,
    };
};

const AttendanceTable = ({
    daysInMonth,
    weekends,
    selectedMonth,
    currentMonth,
    halfDays,
    fullDays,
    holidayData,
}) => {
    const now = new Date();
    const currentDay = now.getDate();
    const userInfo = useSelector((state) => state.auth.user);
    const [attendance, setAttendance] = useState([]);
    const hasNext = useRef(false);
    const currentPage = useRef(1);
    const [isFetching, setIsFetching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isFetchingRef = useRef(false); // Ref to track fetching state
    const tableContainerRef = useRef(null); // Add ref for the table container

    const fetchAttendance = useCallback(async (page = 1) => {
        if (isFetchingRef.current) return; // Prevent fetch if already fetching

        try {
            isFetchingRef.current = true;
            setIsFetching(true);
            setIsLoading(page === 1); // Show loader only for the first page
            const attendanceURL = userInfo?.isAdmin
                ? `${djangoBaseURL}/api/employee-pagination-attendance/${userInfo?.companyId}/?year_month=${selectedMonth}&page=${page}`
                : `${djangoBaseURL}/api/employee-pagination-attendance/${userInfo?.companyId}/?year_month=${selectedMonth}&page=${page}&user_id=${userInfo?._id}`

            const response = await fetchGET(attendanceURL);
            if (response.status) {
                setAttendance((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
                hasNext.current = response.pagination.hasNext;
                currentPage.current = response.pagination.currentPage;
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error.message);
        } finally {
            isFetchingRef.current = false;
            setIsFetching(false);
            setIsLoading(false);
        }
    }, [selectedMonth, userInfo?.companyId]);


    useEffect(() => {
        fetchAttendance(1);
        // Reset currentPage when selectedMonth changes
        currentPage.current = 1;
    }, [fetchAttendance, selectedMonth]);

    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        const onScroll = () => {
            const scrollPosition = container.scrollTop + container.clientHeight;
            const scrollHeight = container.scrollHeight;

            if (hasNext.current && !isFetchingRef.current && scrollPosition >= scrollHeight * 0.9) {
                fetchAttendance(currentPage.current + 1);
            }
        };

        container.addEventListener("scroll", onScroll);
        return () => container.removeEventListener("scroll", onScroll);
    }, [fetchAttendance]);

    const columns = useMemo(() => {
        let dayColumns = [];
        for (let day = 1; day <= daysInMonth; day++) {
            dayColumns.push({
                Header: day.toString(),
                accessor: `day${day}`,
                Cell: ({ cell: { value }, row: { original } }) => {
                    const isWeekendDay = isWeekend(day, original.yearMonth, weekends);
                    const holiday = isHoliday(day, original.yearMonth, holidayData);
                    const content = value || "00:00";
                    let icon;
                    let colorClass;
                    let tooltipContent;

                    const isFutureDate = selectedMonth === currentMonth && day > currentDay;

                    if (isFutureDate) {
                        icon = "pepicons-print:line-x";
                        colorClass = "text-gray-400";
                        tooltipContent = "Future Date";
                    } else if (holiday) {
                        icon = "fontisto:holiday-village";
                        colorClass = "text-purple-400";
                        tooltipContent = `${holiday.name} - ${content}`;
                    } else {
                        if (isWeekendDay) {
                            icon = "material-symbols-light:weekend-outline";
                            colorClass = "text-blue-400";
                            tooltipContent = "Weekend";
                        } else if (content >= fullDays) {
                            icon = "mdi:progress-tick";
                            colorClass = "text-green-400";
                            tooltipContent = content;
                        } else if (content < fullDays && content >= halfDays) {
                            icon = "mdi:progress-clock";
                            colorClass = "text-yellow-400";
                            tooltipContent = content;
                        } else {
                            icon = "system-uicons:cross-circle";
                            colorClass = "text-red-400";
                            tooltipContent = content;
                        }
                    }

                    return (
                        <Tooltip content={tooltipContent}>
                            <span className="cursor-pointer">
                                <Icon icon={icon} className={colorClass} />
                            </span>
                        </Tooltip>
                    );
                },
            });
        }

        dayColumns.push({
            Header: "Tot. Working",
            accessor: "totalWorkingHours",
            Cell: ({ cell: { value } }) => <p className="text-center">{value}</p>,
        });

        return [
            {
                Header: "Employee Name",
                accessor: "employeeName",
                Cell: ({ cell: { value }, row: { original } }) => (
                    <div className="flex flex-col items-start">
                        <div className="flex items-center">
                            {original.profilePicture ? (
                                <img
                                    src={`${djangoBaseURL}${original.profilePicture}`}
                                    alt={value}
                                    className="w-7 h-7 md:w-8 md:h-8 rounded-full mr-2"
                                />
                            ) : (
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full mr-2 bg-gray-300 dark:bg-slate-700 flex justify-center items-center">
                                    {intialLetterName("", "", value, "")}
                                </div>
                            )}
                            <span className="text-sm md:text-base truncate">{value}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            <Tooltip content="Total Working Days">
                                <div>
                                    <Badge label={original.totalWorkingDays} className="bg-info-500 text-white pill text-xs md:text-sm" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Present">
                                <div>
                                    <Badge label={original.totalPresent} className="bg-success-500 text-white pill text-xs md:text-sm" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Half Days">
                                <div>
                                    <Badge label={original.totalHalfDays} className="bg-warning-500 text-white pill text-xs md:text-sm" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Absent">
                                <div>
                                    <Badge label={original.totalAbsent} className="bg-danger-500 text-white pill text-xs md:text-sm" />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                ),
            },
            ...dayColumns,
        ];
    }, [daysInMonth, weekends, selectedMonth, currentMonth, currentDay, fullDays, halfDays, holidayData]);

    const data = useMemo(() => {
        const filteredAttendance = userInfo?.isAdmin
            ? attendance.filter(employee => employee.is_client === false)
            : attendance; // Don't filter for non-admin users

        return filteredAttendance.map((employee) => {
            const stats = calculateAttendanceStats(
                employee.attendance,
                selectedMonth,
                fullDays,
                halfDays,
                holidayData,
                weekends,
                currentDay,
                selectedMonth,
                currentMonth
            );
            let formattedName = employee.employeeName || '';
            if (formattedName.length > 0) {
                formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
            }

            return {
                employeeName: formattedName,
                profilePicture: employee.profilePicture,
                yearMonth: selectedMonth,
                totalWorkingHours: sumWorkingHours(employee.attendance),
                totalWorkingDays: stats.totalWorkingDays,
                totalPresent: stats.totalPresent,
                totalHalfDays: stats.totalHalfDays,
                totalAbsent: stats.totalAbsent,
                ...employee.attendance.reduce((acc, att) => {
                    if (!acc[`day${att.dayNumber}`]) {
                        acc[`day${att.dayNumber}`] = att.totalTimeSpent;
                    }
                    return acc;
                }, {}),
            };
        });
    }, [attendance, selectedMonth, fullDays, halfDays, holidayData, weekends, currentDay, currentMonth, userInfo?.isAdmin]);

    const tableInstance = useTable({ columns, data }, useSortBy);

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    return (
        <Card bodyClass={`p-0`}>
            <div className="relative">
                {/* Table indicator for mobile */}
                <div className="md:hidden px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <Icon icon="heroicons-outline:finger" className="h-4 w-4 mr-1" />
                    <span>Scroll horizontally to view more data</span>
                </div>
                
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[70vh] relative"
                >
                    <table
                        className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700 border-collapse"
                        {...getTableProps()}
                    >
                        <thead className="bg-slate-200 dark:bg-slate-700 attendance-thead sticky top-0 z-30">
                            {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                                    {headerGroup.headers.map((column, index) => (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className={`table-th px-1 text-xs md:text-sm py-2 md:py-3 ${
                                                index === 0 
                                                    ? "sticky left-0 bg-slate-200 dark:bg-slate-700 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" 
                                                    : ""
                                            }`}
                                            style={{ cursor: "pointer", minWidth: column.Header === "Employee Name" ? "150px" : "auto" }}
                                            key={column.id}
                                        >
                                            <div className="flex items-center">
                                                {column.render("Header")}
                                                <span>
                                                    {column.isSorted
                                                        ? column.isSortedDesc
                                                            ? " 🔽"
                                                            : " 🔼"
                                                        : ""}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody
                            className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700 attendance-tbody"
                            {...getTableBodyProps()}
                        >
                            {isLoading ? (
                                <tr>
                                    <td colSpan={daysInMonth + 2} className="text-center py-5">
                                        <ListSkeleton rows={5} />
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 2} className="text-center py-5">
                                        No Attendance Data found!
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()} key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            {row.cells.map((cell, index) => (
                                                <td
                                                    {...cell.getCellProps()}
                                                    className={`table-td px-1 text-xs md:text-sm py-2 md:py-3 ${
                                                        index === 0 
                                                            ? "sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" 
                                                            : ""
                                                    }`}
                                                    key={cell.column.id}
                                                >
                                                    {cell.render("Cell")}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                            {isFetching && !isLoading && (
                                <tr>
                                    <td colSpan={daysInMonth + 2} className="text-center py-5 text-xs md:text-sm">
                                        Loading more data...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};

export default AttendanceTable;
