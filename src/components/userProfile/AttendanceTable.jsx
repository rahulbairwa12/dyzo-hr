import React, { useMemo } from "react";
import { useTable, useSortBy } from "react-table";
import Card from "@/components/ui/Card";
import ListSkeleton from "@/pages/table/ListSkeleton";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge";
import { Icon } from "@iconify/react";
import { djangoBaseURL } from "@/helper";
import { intialLetterName } from "@/helper/helper";

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
    return `${String(totalHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
};

// Function to check if a day is a holiday
const isHoliday = (day, yearMonth, holidayData) => {
    const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
    return holidayData.find(holiday => holiday.date === date);
};

// Function to check if a day is a weekend
const isWeekend = (day, yearMonth, weekends) => {
    const date = new Date(`${yearMonth}-${String(day).padStart(2, '0')}`);
    const dayOfWeek = date.getDay(); 
    return weekends.includes(dayOfWeek + 1); 
};

// Function to calculate attendance statistics
const calculateAttendanceStats = (attendance, yearMonth, fullDays, halfDays, holidayData, weekends) => {
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let workingDaysCount = 0;

    attendance.forEach(att => {
        const hours = att.totalTimeSpent;
        const day = att.dayNumber;

        if (isHoliday(day, yearMonth, holidayData) || isWeekend(day, yearMonth, weekends)) return;

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
    loading, 
    attendanceData, 
    daysInMonth, 
    weekends, 
    selectedMonth, 
    currentMonth,
    halfDays,
    fullDays,
    holidayData 
}) => {
    // Get current date if the selectedMonth is the currentMonth
    const now = new Date();
    const currentDay = now.getDate();

    // Define columns
    const columns = useMemo(() => {
        let dayColumns = [];
        for (let day = 1; day <= daysInMonth; day++) {
            dayColumns.push({
                Header: day.toString(),
                accessor: `day${day}`,
                Cell: ({ cell: { value }, row: { original } }) => {
                    const isWeekendDay = isWeekend(day, original.yearMonth, weekends);
                    const holiday = isHoliday(day, original.yearMonth, holidayData);
                    const content = value ? value : "00:00";
                    let icon;
                    let colorClass;
                    let tooltipContent;

                    // Determine if current month is the same as selected month and the day is greater than current day
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
                }
            });
        }

        // Add Total Working Hours column
        dayColumns.push({
            Header: "Tot. Working",
            accessor: "totalWorkingHours",
            Cell: ({ cell: { value } }) => (
                <p className="text-center">{value}</p>
            )
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
                                    className="w-8 h-8 rounded-full mr-2"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 dark:bg-slate-700 flex justify-center items-center">
                                    {intialLetterName('', '', value, '')}
                                </div>
                            )}
                            <span>{value}</span>
                        </div>
                        <div className="mt-1 flex space-x-1">
                            <Tooltip content="Total Working Days">
                                <div>
                                    <Badge label={original.totalWorkingDays} className="bg-info-500 text-white pill" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Present">
                                <div>
                                    <Badge label={original.totalPresent} className="bg-success-500 text-white pill" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Half Days">
                                <div>
                                    <Badge label={original.totalHalfDays} className="bg-warning-500 text-white pill" />
                                </div>
                            </Tooltip>
                            <Tooltip content="Total Absent">
                                <div>
                                    <Badge label={original.totalAbsent} className="bg-danger-500 text-white pill" />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                )
            },
            ...dayColumns
        ];
    }, [daysInMonth, weekends, selectedMonth, currentMonth, currentDay, fullDays, halfDays, holidayData]);

    // Transform the data
    const data = useMemo(() => {
        return attendanceData?.map((employee) => {
            const stats = calculateAttendanceStats(employee.attendance, selectedMonth, fullDays, halfDays, holidayData, weekends);
            return {
                employeeName: employee.employeeName,
                profilePicture: employee.profilePicture,
                yearMonth: selectedMonth,
                totalWorkingHours: sumWorkingHours(employee.attendance),
                totalWorkingDays: stats.totalWorkingDays,
                totalPresent: stats.totalPresent,
                totalHalfDays: stats.totalHalfDays,
                totalAbsent: stats.totalAbsent,
                ...employee.attendance.reduce((acc, att) => {
                    acc[`day${att.dayNumber}`] = att.totalTimeSpent;
                    return acc;
                }, {})
            };
        });
    }, [attendanceData, selectedMonth, fullDays, halfDays, holidayData, weekends]);

    // Use react-table
    const tableInstance = useTable(
        { columns, data },
        useSortBy // Add the useSortBy hook here
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow
    } = tableInstance;

    return (
        <Card bodyClass={`px-1`}>
            <div className="overflow-x-auto">
                <table
                    className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                    {...getTableProps()}
                >
                    <thead className="bg-slate-200 dark:bg-slate-700 attendance-thead">
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th
                                        {...column.getHeaderProps(column.getSortByToggleProps())} // Add sorting props
                                        className="table-th px-1"
                                        style={{ minWidth: column.Header === "Employee Name" ? "190px" : "auto" }}
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
                        {loading ? (
                            <ListSkeleton />
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={daysInMonth + 2} className="text-center py-5"> {/* Add 2 for the Total Working Hours and Employee Name columns */}
                                    No Attendance Data found!
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map((cell) => (
                                            <td {...cell.getCellProps()} className="table-td px-1" style={{ minWidth: cell.column.Header === "Employee Name" ? "190px" : "auto" }}>
                                                {cell.render("Cell")}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AttendanceTable;
