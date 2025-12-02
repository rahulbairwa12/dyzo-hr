import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import { intialLetterName } from "@/helper/helper";
import { useNavigate } from "react-router-dom";
import Tooltip from "@/components/ui/Tooltip"; // Assuming you have a Tooltip component
import { fetchAuthPatch } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { ProfilePicture } from "@/components/ui/profilePicture";

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

// Define a custom sortType for case-insensitive sorting
const caseInsensitiveSort = (rowA, rowB, columnId) => {
  const a = rowA.values[columnId]?.toLowerCase() || "";
  const b = rowB.values[columnId]?.toLowerCase() || "";

  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
};

const EmployeeList = ({ employeesList }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(employeesList);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableContainerRef = React.useRef(null);
  
  // Keep employees state in sync with props
  useEffect(() => {
    setEmployees(employeesList);
  }, [employeesList]);

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

  // Function to handle scroll events and check scroll possibility
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer
    }
  };

  // Check scroll possibility on resize or data load
  useEffect(() => {
    if (tableContainerRef.current) {
      handleScroll();
      
      // Add event listener for scroll
      tableContainerRef.current.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
      
      // Cleanup
      return () => {
        if (tableContainerRef.current) {
          tableContainerRef.current.removeEventListener('scroll', handleScroll);
        }
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [employees]);

  const handleToggleStatus = async (e, userId, currentStatus) => {
    e.stopPropagation(); // Prevent triggering row click
    try {
      const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/`, 
        { body: { isActive: !currentStatus } }
      );

      if (response && response.message) {
        // Update local state to reflect the change
        setEmployees(prev => 
          prev.map(emp => emp._id === userId ? {...emp, isActive: !currentStatus} : emp)
        );
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const COLUMNS = useMemo(
    () => [
      {
        Header: "SN",
        Cell: ({ row }) => <div className="text-xs md:text-sm text-right pr-5">{row.index + 1}</div>,
        width: isMobile ? 25 : 40,
      },
      {
        Header: "Name",
        accessor: (row) => row.name || `${row.first_name} ${row.last_name}`, // Computed accessor
        sortType: caseInsensitiveSort, // Apply the custom sortType
        Cell: ({ row, cell }) => {
          const { profile_picture, status, name } = row.original;
          const displayName = name || `${row.original.first_name} ${row.original.last_name}`;
          return (
            <div className="flex space-x-1.5 md:space-x-3 items-center text-left rtl:space-x-reverse">
              <div className="flex-none relative">
                {/* Use ProfilePicture component instead of conditional rendering */}
                <ProfilePicture 
                  user={row.original}
                  className="h-7 w-7 md:h-10 md:w-10 rounded-full object-cover"
                />
              </div>

              {/* Employee Name */}
              <div className="flex-1 font-medium text-xs md:text-sm leading-4 whitespace-nowrap">
                {isMobile 
                  ? (displayName.length > 10 ? `${displayName.substring(0, 10)}...` : displayName)
                  : (displayName.length > 20 ? `${displayName.substring(0, 20)}...` : displayName)
                }
              </div>
            </div>
          );
        },
        width: isMobile ? 110 : 200,
      },
      {
        Header: "Designation",
        accessor: "designation",
        Cell: ({ cell }) => {
          return <span className="text-xs md:text-sm truncate block max-w-full">{cell.value || ""}</span>;
        },
        width: isMobile ? 80 : 150,
      },
      {
        Header: "Email",
        accessor: "email",
        Cell: ({ cell }) => {
          return <span className="normal-case text-xs md:text-sm truncate block max-w-full">{cell.value}</span>;
        },
        width: isMobile ? 120 : 200,
      },
      {
        Header: "Mobile",
        accessor: "phone",
        Cell: ({ cell }) => {
          return <span className="text-xs md:text-sm">{cell.value || ""}</span>;
        },
        width: isMobile ? 90 : 150,
      },
      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => {
          const isActive = row.original.isActive !== undefined ? row.original.isActive : true;
          
          return (
            <div className="flex items-center space-x-1 md:space-x-3">
              <span
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                  navigate(
                    `/profile/${row.original._id}?name=${row.original.name
                      .replace(/ /g, "-")
                      .toLowerCase()}`
                  );
                }}
              >
                <Icon icon="heroicons-outline:eye" className="w-5 h-5 md:w-6 md:h-6 cursor-pointer" />
              </span>
              
              <Tooltip
                title={isActive ? "Deactivate User" : "Activate User"}
                content={isActive ? "Deactivate User" : "Activate User"}
                placement="top"
                arrow
                animation="shift-away"
                theme="custom-light"
              >
                <button
                  onClick={(e) => handleToggleStatus(e, row.original._id, isActive)}
                  className={`w-8 md:w-10 h-4 md:h-5 rounded-full flex items-center transition-all duration-300 ease-in-out ${
                    isActive ? "bg-success-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className={`h-3 md:h-4 w-3 md:w-4 rounded-full bg-white m-0.5`}></span>
                </button>
              </Tooltip>
            </div>
          );
        },
        width: isMobile ? 70 : 100,
      },
    ],
    [navigate, employees, isMobile]
  );

  const columns = COLUMNS;
  const data = useMemo(() => employees, [employees]);

  const tableInstance = useTable(
    { columns, data },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    state,
    gotoPage,
    pageCount,
    setPageSize,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;

  const { globalFilter, pageIndex, pageSize } = state;

  return (
    <>
      <Card noborder className="overflow-hidden">
        {/* Mobile scroll indicator */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Icon icon="heroicons-outline:finger" className="h-4 w-4 mr-1" />
              <span>Scroll horizontally to view more</span>
            </div>
            {canScrollRight && (
              <div className="animate-pulse">
                <Icon icon="heroicons-outline:chevron-right" className="h-4 w-4 text-blue-500" />
              </div>
            )}
          </div>
        )}
        
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600"
        >
          <table
            className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
            {...getTableProps()}
          >
            <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-10 ">
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, index) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      scope="col"
                      className={`table-th text-xs md:text-sm py-2 md:py-3 ${
                        index < 2 ? "sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" : ""
                      } ${index === 0 ? "left-0" : index === 1 ? "left-[25px] md:left-[40px]" : ""} ${
                        index < 2 ? "bg-slate-100 dark:bg-slate-700" : ""
                      }`}
                      style={column.width ? { width: column.width } : {}}
                    >
                      <div className="flex items-center whitespace-nowrap">
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
              className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
              {...getTableBodyProps()}
            >
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className="dark:even:bg-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/70"
                    onClick={() =>
                      navigate(
                        `/profile/${row.original._id}?name=${row.original.name
                          .replace(/ /g, "-")
                          .toLowerCase()}`
                      )
                    }
                  >
                    {row.cells.map((cell, index) => (
                      <td 
                        {...cell.getCellProps()} 
                        className={`table-td px-2 md:px-4 py-1.5 md:py-3 ${
                          index < 2 ? "sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" : ""
                        } ${index === 0 ? "left-0" : index === 1 ? "left-[25px] md:left-[40px]" : ""} ${
                          index < 2 ? "bg-white dark:bg-slate-800 dark:even:bg-slate-700/50" : ""
                        } ${row.index % 2 !== 0 && index < 2 ? "bg-gray-50 dark:bg-slate-700/30" : ""}`}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between mt-4 md:mt-6 items-center space-y-3 md:space-y-0 px-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="flex space-x-1 rtl:space-x-reverse items-center">
              <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">Go</span>
              <span>
                <input
                  type="number"
                  className="form-control py-1 md:py-2 text-xs md:text-sm"
                  defaultValue={pageIndex + 1}
                  onChange={(e) => {
                    const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                    gotoPage(pageNumber);
                  }}
                  style={{ width: "50px" }}
                />
              </span>
            </span>
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">
              Page <span>{pageIndex + 1} of {pageOptions.length}</span>
            </span>
          </div>
          <ul className="flex items-center space-x-2 rtl:space-x-reverse">
            <li className="text-lg md:text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""} p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </li>
            <li className="text-lg md:text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""} p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </li>
          </ul>
        </div>
      </Card>
    </>
  );
}; 

export default EmployeeList; 
