import { useMemo, useState, useEffect, useRef } from "react";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { intialLetterName } from "@/helper/helper";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Datepicker from "react-tailwindcss-datepicker";
import DeletePopup from "./DeletePopup";
import { fetchAuthGET, fetchAuthDelete } from "@/store/api/apiSlice";

// Mapping for inviter status
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

// Helper function to format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return `${day} ${month} ${year} at ${time}`;
};

const InvitedEmployeeList = ({ refreshInvitations, setPendingInvitesCount, fetchPendingInvites ,newInvitedEmployees}) => {
  const [invitedEmployees, setInvitedEmployees] = useState([]);
  const prevNewInvitesRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const fetchInvitedEmployeesRef = useRef(null);

  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const isInitialMount = useRef(true);
  const prevFilters = useRef({ statusFilter, dateRange, searchValue });

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async (id) => {

    try {
      const response = await fetchAuthDelete(`${import.meta.env.VITE_APP_DJANGO}/invitation/${id}/`);
      if (response?.status || response) {
        toast.success("Invitation deleted successfully.");
        setInvitedEmployees((current) =>
          current.filter((employee) => employee.id !== id)
        );
        setTotalRecords((prev) => prev - 1);
        if (fetchPendingInvites) fetchPendingInvites(); // Ensure count updates after delete
      } else {
        toast.error(response?.message || "Failed to delete invitation.");
      }
    } catch (error) {
      const errorMessage =
        error?.message ||
        "An error occurred while deleting the invitation.";
      toast.error(errorMessage);

    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetchAuthDelete(`${import.meta.env.VITE_APP_DJANGO}/invitation/${deleteId}/`);
      if (response?.status && response.status == 1) {
        toast.success(response.message);
        setInvitedEmployees((current) =>
          current.filter((employee) => employee.id !== deleteId)
        );
        setTotalRecords((prev) => prev - 1);
        setPendingInvitesCount((prev) => prev - 1);
 
        // fetchPendingInvites()
      

      } else {
        toast.error(response?.message || "Failed to delete invitation.");
      }
    } catch (error) {
      const errorMessage =
        error?.message ||
        "An error occurred while deleting the invitation.";
      toast.error(errorMessage);
    }
    setDeleteLoading(false);
    setShowDeletePopup(false);
  };

  const COLUMNS = [
    {
      Header: "S.N",
      Cell: ({ row, state: { pageIndex, pageSize } }) => <div>{pageIndex * pageSize + row.index + 1}</div>,
    },
    {
      Header: "Email",
      accessor: "email",
      Cell: ({ cell }) => {
        const email = cell.value || '';
        return <div className="text-sm" style={{ textTransform: 'lowercase' }}>{email}</div>;
      },
    },
    {
      Header: "Invited Date",
      accessor: "created_date",
      Cell: ({ cell }) => <div>{formatDateTime(cell.value)}</div>,
    },
    {
      Header: "Invited By",
      accessor: "invited_by_name",
      Cell: ({ row, cell }) => {
        const profile_picture = row.original.invited_by_profile_picture;
        const displayName = cell.value;
        const status = row.original.invited_by_status;
        return (
          <div className="flex space-x-3 items-center text-left rtl:space-x-reverse">
            <div className="relative">
              {profile_picture ? (
                <img
                  src={`${profile_picture}`}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#002D2D] text-white flex justify-center items-center font-bold text-sm">
                  {intialLetterName(
                    row.original.name || displayName,
                    row.original.first_name,
                    row.original.last_name,
                    row.original.email
                  )}
                </div>
              )}
              {status && statusMapping[status] && (
                <Tooltip
                  title={`${statusMapping[status].emoji} ${statusMapping[status].text}`}
                  content={`${statusMapping[status].text}${statusMapping[status].emoji}`}
                  placement="right"
                  arrow
                  animation="shift-away"
                >
                  <span
                    className={`absolute bottom-0 right-0 block w-2 h-2 rounded-full ring-2 ring-white ${statusMapping[status].color}`}
                  ></span>
                </Tooltip>
              )}
            </div>
            <span className="text-sm font-medium">{displayName}</span>
          </div>
        );
      },
    },
    {
      Header: "Accepted Date",
      accessor: "accepted_date",
      Cell: ({ cell }) =>
        cell.value ? (
          <div>{formatDateTime(cell.value)}</div>
        ) : (
          <div>Not Accepted</div>
        ),
    },
    {
      Header: "Invitation Status",
      accessor: "is_accepted",
      Cell: ({ cell, row }) => {
        if (row.original.is_expired) {
          return <span className="text-red-600 font-medium">Expired</span>;
        }
        return cell.value ? (
          <span className="text-green-600 font-medium">Accepted</span>
        ) : (
          <span className="text-yellow-600 font-medium">Pending</span>
        );
      },
    },
    {
      Header: "Action",
      accessor: "action",
      Cell: ({ row }) => (
        <div>
          <Tooltip
            content="Delete Invitation"
            placement="top"
            arrow
            animation="shift-away"
          >
            <button
              onClick={() => {
                setDeleteId(row.original.id);
                setShowDeletePopup(true);
              }}
              className="action-btn text-danger-500"
              type="button"
            >
              <Icon icon="heroicons-outline:trash" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const columns = useMemo(() => COLUMNS, []);

  const tableInstance = useTable(
    {
      columns,
      data: invitedEmployees,
      initialState: { pageIndex: 0, pageSize: 10 },
      manualPagination: true,
      pageCount: pageCount,
      autoResetPage: false,
    },
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
    prepareRow,
  } = tableInstance;

  const { pageIndex, pageSize } = state;

  const { startDate, endDate } = dateRange || {};

  useEffect(() => {
    // Only reset to first page if filters actually changed
    const filtersChanged =
      prevFilters.current.statusFilter !== statusFilter ||
      prevFilters.current.dateRange.startDate !== startDate ||
      prevFilters.current.dateRange.endDate !== endDate ||
      prevFilters.current.searchValue !== searchValue;


    if (filtersChanged && !isInitialMount.current) {
      gotoPage(0);
    }

    prevFilters.current = { statusFilter, dateRange: { startDate, endDate }, searchValue };
  }, [statusFilter, startDate, endDate, searchValue]);

  useEffect(() => {
    isInitialMount.current = false;
  }, []);
  useEffect(() => {
    if (newInvitedEmployees && newInvitedEmployees.length > 0) {
      // Check if these are actually new (not already processed)
      const newInvites = newInvitedEmployees.filter(
        newInv => !prevNewInvitesRef.current.some(prev => prev.id === newInv.id)
      );

      if (newInvites.length > 0) {
        setInvitedEmployees(prev => {
          // Remove duplicates based on email
          const existingEmails = new Set(prev.map(inv => inv.email?.toLowerCase()));
          const uniqueNewInvites = newInvites.filter(
            inv => !existingEmails.has(inv.email?.toLowerCase())
          );
          
          // Append to TOP of list
          return [...uniqueNewInvites, ...prev];
        });

        // Update ref outside setState
        prevNewInvitesRef.current = [...prevNewInvitesRef.current, ...newInvites];
        
        // Update total records
        setTotalRecords(prev => prev + newInvites.length);
        
  
      }
    }
  }, [newInvitedEmployees, fetchPendingInvites]);
  useEffect(() => {
    const fetchInvitedEmployees = async () => {
      setIsLoaded(false);
      try {
    
        let url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/invited-employees/`;
        const params = new URLSearchParams();

        if (startDate) params.append('startdate', startDate);
        if (endDate) params.append('enddate', endDate);
        if (statusFilter && statusFilter !== 'all') {
          if (statusFilter === 'accepted') {
            params.append('status', 'true');
          } else if (statusFilter === 'pending') {
            params.append('status', 'false');
          } else if (statusFilter === 'expired') {
            params.append('status', 'expired');
          }
        }
        if (searchValue) params.append('search', searchValue);

        params.append('page', pageIndex + 1);
        params.append('page_size', pageSize);
        // Add timestamp to bypass cache when refreshing
        params.append('_t', Date.now());

        url += `?${params.toString()}`;

        // Disable cache for this fetch to ensure fresh data
        const response = await fetchAuthGET(url, false);

        // Check if there's an error in the response
        if (response.error) {
          toast.error(response.message || "Failed to fetch invited employees");
          return;
        }

        // response is already the API response data from fetchAuthGET
        if (response.status === 1) {
          setInvitedEmployees(response.data);
          if (response.pagination) {
            setTotalRecords(response.pagination.total);
            setPageCount(response.pagination.total_pages);
          } else {
            setTotalRecords(response.data.length);
            setPageCount(1);
          }
        } else {
          toast.error(response.message || "Failed to fetch invited employees");
        }
      } catch (error) {
        toast.error("Error fetching invited employees");
      } finally {
        setIsLoaded(true);
      }
    };

    if (userInfo?.companyId) {
      fetchInvitedEmployees();
    }
    
    // Store the fetch function in ref for external calls
    fetchInvitedEmployeesRef.current = fetchInvitedEmployees;
  }, [pageIndex, pageSize, refreshInvitations, userInfo.companyId, statusFilter, startDate, endDate, searchValue]);

  const resetAllFilters = () => {
    setDateRange({ startDate: null, endDate: null });
    setStatusFilter('all');
    setSearchValue('');
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };


  return (
    <>
      <div className="flex justify-end items-center gap-2 ml-2 mt-6 mb-4">
        <Button
          type="button"
          className="btn-dark dark:bg-slate-800 h-min text-sm font-normal flex items-center gap-2"
          onClick={toggleFilters}
        >
          <Icon icon="heroicons-outline:funnel" className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow mb-4">
          <div className="flex flex-wrap w-full gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by email"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-[9px] text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Datepicker
                value={dateRange}
                onChange={setDateRange}
                inputClassName="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-[9px] text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition"
                placeholder="Select date range"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-[9px] text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 font-medium px-5 py-[9px] rounded-md text-sm shadow-sm transition"
              onClick={resetAllFilters}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      )}


      <Card noborder>
        <div className="overflow-x-auto -mx-2 sm:-mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-100 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="table-th px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                          <div className="flex items-center gap-1">
                            {column.render("Header")}
                            <span className="text-slate-400">
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
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr
                          {...row.getRowProps()}
                          className="even:bg-slate-50 dark:even:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                        >
                          {row.cells.map((cell) => (
                            <td
                              {...cell.getCellProps()}
                              className="table-td px-3 py-2 sm:px-4 sm:py-3 text-sm"
                            >
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="table-td text-center text-sm sm:text-base text-slate-500 dark:text-slate-400 py-4"
                      >
                        {isLoaded ? "No invited employees found" : "Loading..."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls - ClientList style */}
        <div className="flex justify-between mt-6 items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="flex space-x-2 rtl:space-x-reverse items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Go
              </span>
              <span>
                <input
                  type="number"
                  className="form-control py-2"
                  min={1}
                  max={pageCount}
                  value={pageIndex + 1}
                  onChange={(e) => {
                    let pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                    if (pageNumber < 0) pageNumber = 0;
                    if (pageNumber >= pageCount) pageNumber = pageCount - 1;
                    gotoPage(pageNumber);
                  }}
                  style={{ width: "50px" }}
                />
              </span>
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Page <span>{pageIndex + 1} of {pageCount}</span>
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              | Total: {totalRecords}
            </span>
          </div>
          <ul className="flex items-center space-x-3 rtl:space-x-reverse">
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <Icon icon="heroicons-outline:chevron-left" />
              </button>
            </li>
            <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
              <button
                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => nextPage()}
                disabled={!canNextPage}
              >
                <Icon icon="heroicons-outline:chevron-right" />
              </button>
            </li>
          </ul>
        </div>
      </Card>
      {showDeletePopup && (
        <DeletePopup
          title="Delete Invitation"
          description="Are you sure you want to delete this invitation? This action cannot be undone."
          setOpen={setShowDeletePopup}
          setLoading={setDeleteLoading}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default InvitedEmployeeList;