import React, { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Dropdown from "@/components/ui/Dropdown";
import { Menu } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useTable, useSortBy, useGlobalFilter, usePagination } from "react-table";
import GlobalFilter from "./GlobalFilter";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { fetchDelete } from "@/store/api/apiSlice";
import EditLeaveModal from "./EditLeaveModal";
import { intialLetterName } from "@/helper/helper";

import { set } from "react-hook-form";
import { useSelector } from "react-redux";
import { ProfilePicture } from "@/components/ui/profilePicture";

const LeaveTable = ({ data, fetchLeaves }) => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDeleteLeaveModal, setShowDeleteLeaveModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteLeaveId, setDeleteLeaveId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);

  // Reference for the table container
  const tableContainerRef = React.useRef(null);

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

  // Function to handle scroll events
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;

      // Horizontal scroll checks
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer

      // Force redraw of sticky elements on scroll to fix rendering issues
      const stickyElements = tableContainerRef.current.querySelectorAll('.sticky');
      stickyElements.forEach(el => {
        el.style.transform = 'translateZ(0)';
      });
    }
  };

  // Function to scroll table horizontally
  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      const columnWidth = isMobile ? 100 : 130;
      const currentScroll = tableContainerRef.current.scrollLeft;
      tableContainerRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - columnWidth : currentScroll + columnWidth,
        behavior: 'smooth'
      });

      // Small delay to ensure proper redraw of borders after scrolling
      setTimeout(() => {
        handleScroll();
      }, 100);
    }
  };

  // Check scroll possibility on data load or window resize
  useEffect(() => {
    if (data.length > 0 && tableContainerRef.current) {
      handleScroll();

      // Add event listener for scroll
      const scrollContainer = tableContainerRef.current;
      scrollContainer.addEventListener('scroll', handleScroll);

      // Add resize event listener
      window.addEventListener('resize', handleScroll);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [data]);

  const handleDeleteLeave = async (leaveId) => {
    try {
      setDeleteLoading(true);
      const data = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/leave/delete/${deleteLeaveId}/`);
      if (data.status) {
        toast.success(data.message);
        setShowDeleteLeaveModal(false);
        setDeleteLeaveId(null);
        fetchLeaves();
      } else {
        toast.error(data.response.data.error);
      }
    } catch (error) {
      toast.error("Error deleting leave");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditLeave = (leave) => {
    setSelectedLeave(leave);
    setActiveModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    if (isMobile) {
      // Simpler date format for mobile
      return `${day} ${month.substr(0, 3)} ${year}`;
    }

    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
    return `${dayOfWeek}, ${day} ${month} ${year}`;
  };


  const COLUMNS = useMemo(
    () => [
      {
        Header: "S.N",
        accessor: "S.N",
        Cell: (row) => <div>{row.row.index + 1}</div>,
        width: isMobile ? 40 : 50,
      },
      {
        Header: "Employee",
        accessor: "employeeName",
        Cell: ({ cell: { value }, row: { original } }) => (
          <div>
            <span className="inline-flex items-center">
              <span className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} rounded-full ltr:mr-2 md:ltr:mr-3 rtl:ml-3 flex-none bg-slate-600`}>
                <ProfilePicture
                  user={{
                    name: original.employeeName || original.name,
                    profile_picture: original.employeeProfilePic || original.employeeProfilePicture,
                    first_name: original.first_name,
                    last_name: original.last_name,
                    email: original.email
                  }}
                  className="object-cover w-full h-full rounded-full"
                />
              </span>
              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300 capitalize">{value}</span>
            </span>
          </div>
        ),
        width: isMobile ? 130 : 180,
      },
      {
        Header: "Leave Type",
        accessor: "leave_type",
        Cell: ({ cell: { value } }) => <span className="text-xs md:text-sm">{value}</span>,
        width: isMobile ? 110 : 150,
      },
      {
        Header: "From",
        accessor: "start_date",
        Cell: ({ cell: { value } }) => <span className="text-xs md:text-sm">{formatDate(value)}</span>,
        width: isMobile ? 140 : 220,
      },
      {
        Header: "To",
        accessor: "end_date",
        Cell: ({ cell: { value } }) => <span className="text-xs md:text-sm">{formatDate(value)}</span>,
        width: isMobile ? 140 : 220,
      },
      {
        Header: "Days",
        accessor: "num_days",
        Cell: ({ cell: { value }, row: { original } }) => {
          const startDate = dayjs(original.start_date);
          const endDate = dayjs(original.end_date);
          const numDays = endDate.diff(startDate, "day") + 1;
          return <span className="text-xs md:text-sm">{numDays} {numDays > 1 ? "Days" : "Day"}</span>;
        },
        width: isMobile ? 80 : 110,
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ cell: { value } }) => (
          <span className="block w-full">
            <span
              className={`inline-block px-2 md:px-3 min-w-[70px] md:min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 text-xs md:text-sm ${value === "Approved" ? "text-success-500 bg-success-500" : ""
                } ${value === "Pending" ? "text-warning-500 bg-warning-500" : ""} ${value === "Rejected" ? "text-danger-500 bg-danger-500" : ""
                }`}
            >
              {value}
            </span>
          </span>
        ),
        width: isMobile ? 100 : 120,
      },

      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row: { original } }) => {
          return (
            <div className="flex space-x-1 md:space-x-2 items-center justify-center">
              {/* View Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/leaves/leave-detail/${original.leaveId}`);
                }}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="View Leave Details"
              >
                <Icon icon="hugeicons:view" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </button>

              {/* Edit and Delete Buttons with Combined Conditions */}
              {userInfo?.isAdmin && (
                <>
                  {/* Edit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLeave(original);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    aria-label="Edit Leave"
                  >
                    <Icon icon="heroicons:pencil-square" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteLeaveModal(true);
                      setDeleteLeaveId(original.leaveId);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    aria-label="Delete Leave"
                  >
                    <Icon icon="ph:trash-light" className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  </button>
                </>
              )}
            </div>
          );
        },
        width: isMobile ? 90 : 120,
      },

    ],
    [navigate, isMobile]
  );

  const tableInstance = useTable(
    { columns: COLUMNS, data },
    useGlobalFilter,
    useSortBy,
    usePagination
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
      <Card noborder>
        <div className="md:flex justify-between items-center mb-4 md:mb-6">
          <h4 className="card-title mb-3 md:mb-0">Leaves Table</h4>
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
            <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />

            {isMobile && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => scrollTable('left')}
                  disabled={!canScrollLeft}
                  className={`p-1.5 rounded-md ${canScrollLeft ? 'text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
                  aria-label="Scroll left"
                >
                  <Icon icon="heroicons:chevron-left" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollTable('right')}
                  disabled={!canScrollRight}
                  className={`p-1.5 rounded-md ${canScrollRight ? 'text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
                  aria-label="Scroll right"
                >
                  <Icon icon="heroicons:chevron-right" className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="overflow-x-auto -mx-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-600"
          ref={tableContainerRef}
        >
          <div className={`inline-block min-w-full align-middle ${isMobile ? 'pb-4' : ''}`}>
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          scope="col"
                          className="table-th whitespace-nowrap text-xs md:text-sm"
                          style={column.width ? { width: column.width } : {}}
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {page.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length} className="text-center p-4 text-sm">
                        No leaves found
                      </td>
                    </tr>
                  ) : (
                    page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr
                          {...row.getRowProps()}
                          onClick={() => navigate(`/leaves/leave-detail/${row.original.leaveId}`)}
                          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          {row.cells.map((cell) => (
                            <td
                              {...cell.getCellProps()}
                              className="table-td whitespace-nowrap py-2 md:py-3"
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
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between mt-4 md:mt-6 items-center gap-3 md:gap-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="flex space-x-2 rtl:space-x-reverse items-center">
              <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">Go</span>
              <input
                type="number"
                className="form-control py-1 md:py-2 w-12 md:w-16"
                defaultValue={pageIndex + 1}
                onChange={(e) => {
                  const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(pageNumber);
                }}
              />
            </span>
            <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300">
              Page <span>{pageIndex + 1} of {pageOptions.length}</span>
            </span>
          </div>
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left" className="text-base md:text-lg" />
              </button>
            </li>
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" className="text-base md:text-lg" />
              </button>
            </li>
          </ul>
        </div>
      </Card>

      {selectedLeave && (
        <EditLeaveModal
          activeModal={activeModal}
          onClose={() => setActiveModal(false)}
          leave={selectedLeave}
          fetchLeaves={fetchLeaves}
        />
      )}


    </>
  );
};

export default LeaveTable;
