import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { useTable, useSortBy } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { djangoBaseURL } from "@/helper";
import moment from "moment";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { intialLetterName } from "@/helper/helper";
import { getAuthToken } from "@/utils/authToken";
import EditAttendanceModal from "./EditAttendanceModal";
import TableSkeleton from "../table/TableSkeleton";
import { Icon } from "@iconify/react";

const CheckInOutTable = ({ checkInOutData, loading, refreshData }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedEmployees, setExpandedEmployees] = useState({});

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

  // Modal state for creating/updating logs
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalMode, setModalMode] = useState("edit"); // "edit" or "create"
  const [currentType, setCurrentType] = useState(""); // "checkin" or "checkout"
  const [selectedRow, setSelectedRow] = useState(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    return moment(timestamp).format("hh:mm A");
  };

  // When a cell's button is clicked, set up the modal's data.
  const handleLogAction = (type, cellValue, rowData) => {
    if (!userInfo?.isAdmin) return;
    setSelectedRow(rowData);
    setCurrentType(type);
    if (type === "checkin") {
      if (cellValue.first_checkin_log) {
        setModalMode("edit");
        setSelectedLog({
          ...cellValue.first_checkin_log,
          date: cellValue.date,
          company: rowData.employee.companyId,
          employee: rowData.employee._id,
        });
      } else {
        setModalMode("create");
        setSelectedLog({
          status: "checkin",
          date: cellValue.date, // Auto-fill the clicked date
          timestamp: new Date().toISOString(),
          company: rowData.employee.companyId,
          employee: rowData.employee._id,
        });
      }
    } else if (type === "checkout") {
      if (cellValue.last_checkout_log) {
        setModalMode("edit");
        setSelectedLog({
          ...cellValue.last_checkout_log,
          date: cellValue.date,
          company: rowData.employee.companyId,
          employee: rowData.employee._id,
        });
      } else {
        setModalMode("create");
        setSelectedLog({
          status: "checkout",
          date: cellValue.date, // Auto-fill the clicked date
          timestamp: new Date().toISOString(),
          company: rowData.employee.companyId,
          employee: rowData.employee._id,
        });
      }
    }
    setModalOpen(true);
  };

  const deleteCheckInOutData = async (inId) => {
    if (!userInfo?.isAdmin) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/api/attendance-logs/${inId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}
        }`,
        }
      })
      if (response.ok) {
        toast.success("Attendance log delete successfully");
        refreshData()
      } else {
        toast.error("Failed to delete task attendance");
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLog(null);
    setSelectedRow(null);
  };

  const handleModalSave = (updatedLog) => {
    toast.success("Attendance log saved successfully!");
    setModalOpen(false);
    refreshData(); // Refresh the table data
  };

  const toggleEmployee = (empId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  // Get unique dates from attendance data
  const getUniqueDates = () => {
    if (!checkInOutData || checkInOutData.length === 0) return [];

    const dates = [];
    const firstEmployee = checkInOutData[0];
    if (firstEmployee?.attendance_info && Array.isArray(firstEmployee.attendance_info)) {
      firstEmployee.attendance_info.forEach(info => {
        if (info.date) {
          dates.push({
            value: info.date,
            label: moment(info.date).format('MMM D (ddd)')
          });
        }
      });
    }
    return dates;
  };

  const uniqueDates = getUniqueDates();

  // If no selected date, set to today or the first date
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      const today = moment().format('YYYY-MM-DD');
      const todayDate = uniqueDates.find(d => d.value === today);
      setSelectedDate(todayDate ? todayDate.value : uniqueDates[0].value);
    }
  }, [uniqueDates, selectedDate]);

  const columns = useMemo(() => {
    if (!checkInOutData || checkInOutData.length === 0) return [];

    // Use the first employee's attendance_info to build dynamic day columns.
    const sampleAttendance = checkInOutData[0]?.attendance_info || [];
    const dayColumns = sampleAttendance.map((entry, index) => ({
      Header: (
        <div data-date={entry.date}>
          <div className="flex justify-center font-semibold">{entry.date}</div>
          <div className="flex justify-around border-t border-b mt-1 text-gray-600">
            <div className="px-4 border-r">IN</div>
            <div className="px-4 border-r">OUT</div>
            <div className="px-4">HOURS</div>
            <div className="px-4">Distance</div>
          </div>
        </div>
      ),
      accessor: `day${index}`,
      Cell: ({ cell: { value }, row }) => (
        <div className="flex flex-col">
          <div className="flex justify-around border-t border-b py-2">
            <div className="px-4 border-r">
              <div>{formatTime(value?.first_checkin)}</div>
              {userInfo?.isAdmin && (
                <button
                  className="text-blue-500 text-xs mt-1"
                  onClick={() => handleLogAction("checkin", value, row.original)}
                >
                  {value?.first_checkin ? "Edit" : "Add"}
                </button>
              )}
            </div>
            <div className="px-4 border-r">
              <div>{formatTime(value?.last_checkout)}</div>
              {userInfo?.isAdmin && (
                <button
                  className="text-blue-500 text-xs mt-1"
                  onClick={() => handleLogAction("checkout", value, row.original)}
                >
                  {value?.last_checkout ? "Edit" : "Add"}
                </button>
              )}
            </div>
            <div>
              <div className="flex  ">
                <div className="px-4">{value?.total_hours || "-"}</div>
                <div className="px-4">{value?.distance || "-"}</div>
              </div>
              {
                userInfo?.isAdmin && value?.first_checkin && (
                  <button
                    className="text-blue-500 text-xs mt-1"
                    onClick={() => deleteCheckInOutData(value?.first_checkin_log?.checkin_log_id
                    )}
                  >
                    Delete
                  </button>
                )
              }
            </div>
          </div>
        </div>
      ),
    }));

    return [
      {
        Header: "Employee Name",
        accessor: "name",
        Cell: ({ cell: { value }, row: { original } }) => (
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => navigate(`/profile/${original.employee._id}`)}
          >
            {original.profile_picture ? (
              <img
                src={`${djangoBaseURL}${original.profile_picture}`}
                alt={value}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                {intialLetterName("", "", value, "")}
              </div>
            )}
            <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
          </div>
        ),
      },
      ...dayColumns,
    ];
  }, [checkInOutData, navigate]);

  // Map the incoming data into table rows.
  const data = useMemo(() => {
    if (!checkInOutData || !Array.isArray(checkInOutData)) return [];
    return checkInOutData.map((employeeData) => {
      const { employee, attendance_info } = employeeData;
      let formattedName = employee.name || '';
      if (formattedName && formattedName.length > 0) {
        formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
      }
      const rowData = {
        name: formattedName, // Use the formatted name instead of the raw name
        profile_picture: employee.profile_picture,
        employee: employee,
      };

      attendance_info.forEach((entry, index) => {
        const logs = entry.attendance_logs || [];
        const firstCheckin = logs.length > 0 ? logs[0].checkin_timestamp : null;
        const lastCheckout = logs.length > 0 ? logs[logs.length - 1].checkout_timestamp : null;
        const totalHours =
          firstCheckin && lastCheckout
            ? `${Math.floor((new Date(lastCheckout) - new Date(firstCheckin)) / (1000 * 60 * 60))} hrs`
            : "-";

        rowData[`day${index}`] = {
          date: entry.date,
          first_checkin: firstCheckin,
          last_checkout: lastCheckout,
          total_hours: totalHours,
          distance: logs.length > 0 ? logs[0].checkin_distance || "-" : "-",
          first_checkin_log: logs.length > 0 ? logs[0] : null,
          last_checkout_log: logs.length > 0 ? logs[logs.length - 1] : null,
        };
      });
      return rowData;
    });
  }, [checkInOutData]);

  // Set initial sort state to sort by name in ascending order
  const initialState = {
    sortBy: [
      {
        id: 'name',
        desc: false
      }
    ]
  };

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState // Add the initial state for default sorting
    },
    useSortBy
  );
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  useEffect(() => {
    if (tableContainerRef.current && checkInOutData.length > 0) {
      const todayDate = moment().format("YYYY-MM-DD");
      const headerEl = tableContainerRef.current.querySelector(`th div[data-date="${todayDate}"]`);
      if (headerEl) {
        headerEl.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [checkInOutData]);

  // Mobile view: Find attendance data for a specific date
  const getAttendanceForDate = (date) => {
    return data.map(employee => {
      const dayKey = Object.keys(employee).find(key =>
        key.startsWith('day') && employee[key]?.date === date
      );
      return {
        ...employee,
        attendance: employee[dayKey] || null
      };
    });
  };

  const selectedDateData = selectedDate ? getAttendanceForDate(selectedDate) : [];

  // Render mobile card view
  const renderMobileView = () => {
    if (loading) {
      return (
        <div className="p-4 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!checkInOutData || checkInOutData.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No data available
        </div>
      );
    }

    return (
      <div className="p-2">
        {/* Date Selector */}
        <div className="mb-4">
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Select Date:</div>
          <div className="flex overflow-x-auto pb-2">
            {uniqueDates.map((date) => (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`px-3 py-1.5 mr-2 text-sm rounded-lg whitespace-nowrap ${selectedDate === date.value
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                  }`}
              >
                {date.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee Cards */}
        {selectedDateData.map((employee, index) => (
          <Card key={`${employee.employee._id}-${index}`} className="mb-3">
            <div className="p-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleEmployee(employee.employee._id)}
              >
                <div className="flex items-center">
                  {employee.profile_picture ? (
                    <img
                      src={`${djangoBaseURL}${employee.profile_picture}`}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                      {intialLetterName("", "", employee.name, "")}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">{employee.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedDate && moment(selectedDate).format('MMM D, YYYY')}
                    </div>
                  </div>
                </div>
                <Icon
                  icon={expandedEmployees[employee.employee._id] ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                  className="text-gray-500 w-5 h-5"
                />
              </div>

              {expandedEmployees[employee.employee._id] && employee.attendance && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Check In</div>
                      <div className="font-semibold">{formatTime(employee.attendance.first_checkin)}</div>
                      {userInfo?.isAdmin && (
                        <button
                          className="text-blue-500 text-xs mt-1"
                          onClick={() => handleLogAction("checkin", employee.attendance, employee)}
                        >
                          {employee.attendance.first_checkin ? "Edit" : "Add"}
                        </button>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Check Out</div>
                      <div className="font-semibold">{formatTime(employee.attendance.last_checkout)}</div>
                      {userInfo?.isAdmin && (
                        <button
                          className="text-blue-500 text-xs mt-1"
                          onClick={() => handleLogAction("checkout", employee.attendance, employee)}
                        >
                          {employee.attendance.last_checkout ? "Edit" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hours Worked</div>
                      <div className="font-semibold">{employee.attendance.total_hours || "-"}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Distance</div>
                      <div className="font-semibold">{employee.attendance.distance || "-"}</div>
                    </div>
                  </div>
                  {userInfo?.isAdmin && employee.attendance.first_checkin && (
                    <div className="mt-3 text-right">
                      <button
                        className="text-red-500 text-xs"
                        onClick={() => deleteCheckInOutData(employee.attendance.first_checkin_log?.checkin_log_id)}
                      >
                        Delete Attendance
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Render desktop table view
  const renderDesktopView = () => (
    <div ref={tableContainerRef} className="overflow-auto max-h-[70vh]">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-md table-fixed"
        {...getTableProps()}
      >
        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, index) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${index === 0 ? "sticky left-0 bg-gray-100 dark:bg-gray-700 z-[9999]" : ""
                    } `}
                >
                  {column.render("Header")}
                  <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody
          className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700"
          {...getTableBodyProps()}
        >
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-6">
                <TableSkeleton rows={15} columns={30} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.cells.map((cell, index) => (
                    <td
                      {...cell.getCellProps()}
                      className={`px-6 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap ${index === 0 ? "sticky left-0 bg-white dark:bg-gray-800 z-1" : ""
                        } `}
                    >
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
    <>
      <Card className="shadow-md" bodyClass="p-0">
        {isMobile ? renderMobileView() : renderDesktopView()}
      </Card>
      {modalOpen && selectedLog && (
        <EditAttendanceModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          attendanceLog={selectedLog}
          mode={modalMode}
          type={currentType}
          onSave={handleModalSave}
          showAdvanced={true}
        />
      )}
    </>
  );
};

export default CheckInOutTable;
