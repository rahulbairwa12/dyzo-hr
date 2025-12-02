import React, { useMemo, useState, useEffect } from "react";
import { useTable, useSortBy } from "react-table";
import Card from "@/components/ui/Card";
import ListSkeleton from "@/pages/table/ListSkeleton";
import Tooltip from "@/components/ui/Tooltip";
import Badge from "@/components/ui/Badge"; // Ensure Badge is imported
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

const CheckInBased = ({ 
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
    const [isMobile, setIsMobile] = useState(false);
    const [expandedEmployees, setExpandedEmployees] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);
    
    // Check if device is mobile
    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }, []);

    // Get current date if the selectedMonth is the currentMonth
    const now = new Date();
    const currentDay = now.getDate();
    
    // Set initial selected day to current day or first day of month
    useEffect(() => {
      if (!selectedDay) {
        if (selectedMonth === currentMonth) {
          setSelectedDay(currentDay);
        } else {
          setSelectedDay(1);
        }
      }
    }, [selectedMonth, currentMonth, currentDay, selectedDay]);

    // Toggle employee expanded state
    const toggleEmployee = (employeeId) => {
      setExpandedEmployees(prev => ({
        ...prev,
        [employeeId]: !prev[employeeId]
      }));
    };

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
                id: employee.id || employee._id || Date.now().toString(),  // Add an ID for React keys
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

    // Get days array for mobile view
    const getDaysArray = () => {
        const days = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const isWeekendDay = isWeekend(day, selectedMonth, weekends);
            const holiday = isHoliday(day, selectedMonth, holidayData);
            
            days.push({
                day,
                date,
                isWeekend: isWeekendDay,
                holiday,
                isFuture: selectedMonth === currentMonth && day > currentDay
            });
        }
        return days;
    };
    
    // Render attendance status icon
    const renderAttendanceIcon = (employee, day) => {
        const dayKey = `day${day}`;
        const hours = employee[dayKey] || "00:00";
        const isWeekendDay = isWeekend(day, employee.yearMonth, weekends);
        const holiday = isHoliday(day, employee.yearMonth, holidayData);
        const isFutureDate = selectedMonth === currentMonth && day > currentDay;
        
        let icon;
        let colorClass;
        let tooltipContent;
        let statusText;

        if (isFutureDate) {
            icon = "pepicons-print:line-x";
            colorClass = "text-gray-400";
            tooltipContent = "Future Date";
            statusText = "Future";
        } else if (holiday) {
            icon = "fontisto:holiday-village";
            colorClass = "text-purple-400";
            tooltipContent = `${holiday.name} - ${hours}`;
            statusText = "Holiday";
        } else if (isWeekendDay) {
            icon = "material-symbols-light:weekend-outline";
            colorClass = "text-blue-400";
            tooltipContent = "Weekend";
            statusText = "Weekend";
        } else if (hours >= fullDays) {
            icon = "mdi:progress-tick";
            colorClass = "text-green-400";
            tooltipContent = hours;
            statusText = "Present";
        } else if (hours < fullDays && hours >= halfDays) {
            icon = "mdi:progress-clock";
            colorClass = "text-yellow-400";
            tooltipContent = hours;
            statusText = "Half Day";
        } else {
            icon = "system-uicons:cross-circle";
            colorClass = "text-red-400";
            tooltipContent = hours;
            statusText = "Absent";
        }

        return (
            <div className="flex items-center">
                <Icon icon={icon} className={`${colorClass} w-5 h-5 mr-2`} />
                <div className="flex flex-col">
                    <span className={`${colorClass} font-medium`}>{statusText}</span>
                    <span className="text-xs text-gray-500">{hours}</span>
                </div>
            </div>
        );
    };

    // Render mobile view
    const renderMobileView = () => {
        if (loading) {
            return (
                <div className="p-4 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500">
                    No attendance data found!
                </div>
            );
        }

        const days = getDaysArray();

        return (
            <div className="p-2">
                {/* Day selector */}
                <div className="mb-4">
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Select Day:</div>
                    <div className="flex overflow-x-auto pb-2">
                        {days.map((day) => {
                            const isSelected = selectedDay === day.day;
                            let dayClass = "px-3 py-1.5 mr-2 text-sm rounded-lg whitespace-nowrap ";
                            
                            // Base styling based on selection
                            if (isSelected) {
                                dayClass += "bg-primary-600 text-white ";
                            } else {
                                dayClass += "bg-gray-100 dark:bg-slate-700 ";
                            }
                            
                            // Status indicator
                            if (day.holiday) {
                                dayClass += isSelected ? "" : "text-purple-600 dark:text-purple-400 ";
                            } else if (day.isWeekend) {
                                dayClass += isSelected ? "" : "text-blue-600 dark:text-blue-400 ";
                            } else if (day.isFuture) {
                                dayClass += isSelected ? "" : "text-gray-400 dark:text-gray-500 ";
                            } else {
                                dayClass += isSelected ? "" : "text-gray-700 dark:text-gray-300 ";
                            }
                            
                            return (
                                <button
                                    key={day.day}
                                    onClick={() => setSelectedDay(day.day)}
                                    className={dayClass}
                                >
                                    {day.day}
                                    {day.holiday && <span className="ml-1 text-xs">🌟</span>}
                                    {day.isWeekend && <span className="ml-1 text-xs">🔵</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Employee cards */}
                {data.map((employee) => (
                    <Card key={employee.id} className="mb-3">
                        <div className="p-3">
                            {/* Employee info with toggle */}
                            <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleEmployee(employee.id)}
                            >
                                <div className="flex items-center">
                                    {employee.profilePicture ? (
                                        <img
                                            src={`${djangoBaseURL}${employee.profilePicture}`}
                                            alt={employee.employeeName}
                                            className="w-10 h-10 rounded-full mr-3"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                                            {intialLetterName('', '', employee.employeeName, '')}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{employee.employeeName}</div>
                                        <div className="flex space-x-1 mt-1">
                                            <Badge label={`WD: ${employee.totalWorkingDays}`} className="bg-info-500 text-white text-xs" />
                                            <Badge label={`P: ${employee.totalPresent}`} className="bg-success-500 text-white text-xs" />
                                            <Badge label={`H: ${employee.totalHalfDays}`} className="bg-warning-500 text-white text-xs" />
                                            <Badge label={`A: ${employee.totalAbsent}`} className="bg-danger-500 text-white text-xs" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-xs text-gray-500 mb-1">Total Hours</div>
                                    <div className="font-medium">{employee.totalWorkingHours}</div>
                                    <Icon 
                                        icon={expandedEmployees[employee.id] ? "heroicons:chevron-up" : "heroicons:chevron-down"} 
                                        className="text-gray-500 w-5 h-5 mt-1" 
                                    />
                                </div>
                            </div>

                            {/* Attendance details (when expanded) */}
                            {expandedEmployees[employee.id] && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    {/* Show attendance for selected day */}
                                    <div className="mb-2 text-sm font-medium">
                                        Day {selectedDay} Attendance
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                        {renderAttendanceIcon(employee, selectedDay)}
                                    </div>
                                    
                                    {/* Weekly summary */}
                                    <div className="mt-4 mb-2 text-sm font-medium">Weekly Summary</div>
                                    <div className="grid grid-cols-7 gap-1 text-center">
                                        {Array.from({ length: 7 }).map((_, idx) => {
                                            const day = selectedDay - 3 + idx; // Show 3 days before and 3 days after
                                            if (day < 1 || day > daysInMonth) {
                                                return (
                                                    <div key={idx} className="py-2 bg-gray-100 dark:bg-slate-800 rounded opacity-30">
                                                        -
                                                    </div>
                                                );
                                            }
                                            
                                            const isDay = day === selectedDay;
                                            const bgClass = isDay ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700" : "bg-gray-50 dark:bg-slate-700";
                                            
                                            return (
                                                <div key={idx} className={`p-1 ${bgClass} rounded text-xs flex flex-col items-center`}>
                                                    <span className={`font-medium ${isDay ? "text-primary-600 dark:text-primary-400" : ""}`}>{day}</span>
                                                    <Icon 
                                                        icon={getIconForDay(employee, day)} 
                                                        className={getColorForDay(employee, day)} 
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    // Helper functions for icons in mobile view
    const getIconForDay = (employee, day) => {
        const dayKey = `day${day}`;
        const hours = employee[dayKey] || "00:00";
        const isWeekendDay = isWeekend(day, employee.yearMonth, weekends);
        const holiday = isHoliday(day, employee.yearMonth, holidayData);
        const isFutureDate = selectedMonth === currentMonth && day > currentDay;
        
        if (isFutureDate) return "pepicons-print:line-x";
        if (holiday) return "fontisto:holiday-village";
        if (isWeekendDay) return "material-symbols-light:weekend-outline";
        if (hours >= fullDays) return "mdi:progress-tick";
        if (hours < fullDays && hours >= halfDays) return "mdi:progress-clock";
        return "system-uicons:cross-circle";
    };
    
    const getColorForDay = (employee, day) => {
        const dayKey = `day${day}`;
        const hours = employee[dayKey] || "00:00";
        const isWeekendDay = isWeekend(day, employee.yearMonth, weekends);
        const holiday = isHoliday(day, employee.yearMonth, holidayData);
        const isFutureDate = selectedMonth === currentMonth && day > currentDay;
        
        if (isFutureDate) return "text-gray-400";
        if (holiday) return "text-purple-400";
        if (isWeekendDay) return "text-blue-400";
        if (hours >= fullDays) return "text-green-400";
        if (hours < fullDays && hours >= halfDays) return "text-yellow-400";
        return "text-red-400";
    };

    // Render desktop view
    const renderDesktopView = () => (
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
    );

    return (
        <Card bodyClass={`px-1 ${isMobile ? 'p-0' : ''}`}>
            {isMobile ? renderMobileView() : renderDesktopView()}
        </Card>
    );
};

export default CheckInBased;
