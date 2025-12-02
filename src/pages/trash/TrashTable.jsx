import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDeletedTasks, restoreTask, bulkRestoreTasks, permanentDeleteTasks, toggleTaskSelection, selectAllTasks } from "../../store/trashSlice";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import Loading from "../../components/Loading";
import { toast } from "react-toastify";
import Tooltip from "@/components/ui/Tooltip";
import DeletePopup from "../inviteemployee/DeletePopup";
import { useTable, useSortBy } from 'react-table';

const TrashTable = () => {
  const dispatch = useDispatch();
  const { deletedTasks, loading, count, selectedTasks, restoring, restoringTasks, deletingTasks, needsReload } = useSelector((state) => state.trash);
  const userInfo = useSelector((state) => state.auth.user);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // Add search state
  const [lastDeletedCount, setLastDeletedCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  useEffect(() => {
    // If we have no tasks, but there are still more tasks available, and not on the first page
    if (deletedTasks.length === 0 && count > 0 && !loading) {
      // If not already at the first page, go to the previous page
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // If you're on the first page, just reload data
        reloadData();
      }
    }
  }, [deletedTasks.length, count, loading, currentPage]);

  // Function to reload data from the beginning
  const reloadData = () => {
    if (userInfo && userInfo._id) {
      dispatch(fetchDeletedTasks({ userId: userInfo._id, page: currentPage, params: { search: searchQuery } }));
    }
  };
  
  // Initial data loading - always fetch fresh data when component mounts
  useEffect(() => {
    // Fetch data whenever the component mounts if we have a valid user ID
    if (userInfo && userInfo._id) {
      dispatch(fetchDeletedTasks({ userId: userInfo._id, page: currentPage, params: { search: searchQuery } }));
    }
  }, [dispatch, userInfo, currentPage, searchQuery]); // Add searchQuery to dependencies
  
  // Monitor for when tasks are deleted and reload data if current page becomes empty
  useEffect(() => {
    // If we have no tasks but there are still more tasks available, reload data
    if (deletedTasks.length === 0 && count > 0 && !loading) {
      reloadData();
    }
  }, [deletedTasks.length, count, loading]);
  
  // Monitor for needsReload flag from Redux
  useEffect(() => {
    if (needsReload && !loading) {
      reloadData();
    }
  }, [needsReload, loading]);
  
  const handleRestore = (taskId) => {
    if (userInfo && userInfo._id) {
      dispatch(restoreTask({ taskId, userId: userInfo._id }))
        .unwrap()
        .then(() => {
          toast.success("Task restored successfully");
        })
        .catch((error) => {
          toast.error(`Failed to restore task: ${error}`);
        });
    } else {
      console.error("Cannot restore task - no user ID available");
      toast.error("Cannot restore task - user information missing");
    }
  };
  
  const handleBulkRestore = () => {
    if (selectedTasks.length === 0) return;
    
    if (userInfo && userInfo._id) {
     
      dispatch(bulkRestoreTasks({ taskIds: selectedTasks, userId: userInfo._id }))
        .unwrap()
        .then(() => {
          toast.success(`${selectedTasks.length} ${selectedTasks.length === 1 ? "task" : "tasks"} restored successfully`);
        })
        .catch((error) => {
          toast.error(`Failed to restore tasks: ${error}`);
        });
    } else {
      console.error("Cannot bulk restore tasks - no user ID available");
      toast.error("Cannot restore tasks - user information missing");
    }
  };
  
  const handleBulkPermanentDelete = () => {
    if (selectedTasks.length === 0) return;

    setIsBulkDelete(true);
    setShowDeleteModal(true);
  };
  
  const handlePermanentDelete = (taskId) => {
    setIsBulkDelete(false)
    setDeletingTaskId(taskId);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = () => {
    const taskIdsToDelete = isBulkDelete ? selectedTasks : [deletingTaskId];

    if (!taskIdsToDelete.length || !userInfo?._id) return;

    setIsDeleting(true);
    setLastDeletedCount(taskIdsToDelete.length);

    dispatch(permanentDeleteTasks({ taskIds: taskIdsToDelete, userId: userInfo._id }))
      .unwrap()
      .then(() => {
        toast.success(`${taskIdsToDelete.length} ${taskIdsToDelete.length === 1 ? "task" : "tasks"} permanently deleted`);
        setShowDeleteModal(false);
        setDeletingTaskId(null);
      })
      .catch((error) => {
        toast.error(`Failed to permanently delete tasks: ${error}`);
      })
      .finally(() => {
        setIsDeleting(false);
        setIsBulkDelete(false); // reset
      });
  };

  
  const handleToggleSelect = (taskId) => {
    dispatch(toggleTaskSelection(taskId));
  };
  
  const handleSelectAll = () => {
    dispatch(selectAllTasks());
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };
  
  // Check if a specific task is currently being restored
  const isTaskRestoring = (taskId) => {
    return restoringTasks.includes(taskId);
  };
  
  // Check if a specific task is currently being deleted
  const isTaskDeleting = (taskId) => {
    return deletingTasks.includes(taskId);
  };
  
  // Check if any of the selected tasks are currently being restored
  const isAnySelectedTaskRestoring = () => {
    return selectedTasks.some(taskId => restoringTasks.includes(taskId));
  };
  
  // Check if any of the selected tasks are currently being deleted
  const isAnySelectedTaskDeleting = () => {
    return selectedTasks.some(taskId => deletingTasks.includes(taskId));
  };
  
  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        Header: () => (
          <input
            type="checkbox"
            className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
            checked={selectedTasks.length > 0 && selectedTasks.length === deletedTasks.length}
            onChange={handleSelectAll}
          />
        ),
        accessor: "selection",
        disableSortBy: true, // Disable sorting for checkbox column
        Cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="px-3 py-2 whitespace-nowrap">
              <input
                type="checkbox"
                className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
                checked={selectedTasks.includes(task.taskId)}
                onChange={() => handleToggleSelect(task.taskId)}
                disabled={isTaskRestoring(task.taskId) || isTaskDeleting(task.taskId)}
              />
            </div>
          );
        },
      },
      {
        Header: 'Task Id',
        accessor: 'taskCode',
        Cell: ({ value }) => (
          <div className="text-xs font-medium text-slate-600 px-3 py-2 whitespace-nowrap">
            {value}
          </div>
        ),
      },
      {
        Header: 'Task Name',
        accessor: 'taskName',
        Cell: ({ value, row }) => {
          const task = row.original;
          return (
            <div className="text-xs font-semibold text-slate-900 dark:text-white px-3 py-2 whitespace-break-spaces min-w-[300px] ">
              {value} <span className="sm:hidden text-gray-500">{task.project_name}</span>
            </div>
          );
        },
      },
      {
        Header: 'Project',
        accessor: 'project_name',
        headerClassName: "hidden sm:table-cell",
        Cell: ({ value }) => (
          <div className="text-xs font-medium text-slate-600 px-3 py-2 whitespace-nowrap hidden sm:table-cell">
            {value}
          </div>
        ),
      },
      {
        Header: 'Priority',
        accessor: 'priority',
        headerClassName: "hidden sm:table-cell",
        Cell: ({ value }) => (
          <div className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
            <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              (value || "").toLowerCase() === "high"
                ? "bg-red-500/20 text-red-500"
                : (value || "").toLowerCase() === "medium"
                ? "bg-orange-500/20 text-orange-500"
                : "bg-green-500/20 text-green-500"
            }`}>
              {value}
            </span>
          </div>
        ),
      },
      {
        Header: 'Due Date',
        accessor: 'dueDate',
        headerClassName: "hidden sm:table-cell",
        Cell: ({ value }) => (
          <div className="text-xs font-medium text-slate-900 dark:text-white px-3 py-2 whitespace-nowrap hidden sm:table-cell">
            {formatDate(value)}
          </div>
        ),
      },
      {
        Header: 'Action',
        Cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="px-3 py-2 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Tooltip
                  content="Restore Task"
                  theme="custom-light"
                  animation="shift-away"
                >
                  <Button
                    icon="heroicons:arrow-path"
                    iconClass="text-[16px] text-electricBlue-50"
                    text=""
                    className="bg-electricBlue-50/10 hover:bg-electricBlue-50/20 text-white py-1 px-2 text-xs font-medium rounded-md transition-all duration-300"
                    disabled={isTaskRestoring(task.taskId) || isTaskDeleting(task.taskId)}
                    onClick={() => handleRestore(task.taskId)}
                  />
                </Tooltip>

                <Tooltip
                  content="Permanently Delete"
                  theme="custom-light"
                  animation="shift-away"
                >
                  <Button
                    icon="heroicons:trash"
                    iconClass="text-[16px] text-red-500"
                    text=""
                    className="bg-red-500/10 hover:bg-red-500/20 text-white py-1 px-2 text-xs font-medium rounded-md transition-all duration-300"
                    disabled={isTaskRestoring(task.taskId) || isTaskDeleting(task.taskId) || showDeleteModal}
                    onClick={() => handlePermanentDelete(task.taskId)}
                  />
                </Tooltip>
              </div>
            </div>
          );
        },
      },
    ],
    [selectedTasks, restoringTasks, deletingTasks]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: deletedTasks,
    },
    useSortBy
  );

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Debounce search to avoid excessive API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Calculate total pages based on count and items per page 
  useEffect(() => {
    setTotalPages(Math.ceil(count / 20));
  }, [count]);

  const renderPagination = () => {
    const pages = [];
    
    // Always show page 1
    pages.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
          1 === currentPage
            ? 'bg-electricBlue-50 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
        }`}
      >
        1
      </button>
    );
    
    // Add ellipsis if current page is far from start
    if (currentPage > 3) {
      pages.push(
        <span key="start-ellipsis" className=" py-1 mx-1 text-gray-500">
          ...
        </span>
      );
    }
    
    // Show current page and its neighbors (but not page 1 or last page)
    const startRange = Math.max(2, currentPage - 1);
    const endRange = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startRange; i <= endRange; i++) {
      // Skip if it's page 1 (already added) or last page (will be added later)
      if (i === 1 || i === totalPages) continue;
      
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
            i === currentPage
              ? 'bg-electricBlue-50 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="end-ellipsis" className=" py-1 mx-1 text-gray-500">
          ...
        </span>
      );
    }
    
    // Always show last page (if it's not page 1)
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${
            totalPages === currentPage
              ? 'bg-electricBlue-50 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center sm:justify-end py-10">
        {/* Start button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="material-symbols:first-page" className='w-6 h-6' />
        </button>
        
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="ion:caret-back" className='w-6 h-6' />
        </button>
        
        {/* Page numbers */}
        {pages}
        
        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="ion:caret-forward" className='w-6 h-6' />
        </button>
        
        {/* Last button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed  hidden sm:block"
        >
          <Icon icon="material-symbols:last-page" className='w-6 h-6' />
        </button>
      </div>
    );
  };
  
  if (loading && deletedTasks.length === 0) {
    return <Loading />;
  }
  
  return (
    <>
      <div className="bg-white flex justify-between items-center flex-wrap gap-2 ">
        <div className="flex justify-between flex-wrap items-center">
          <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block">
            Trash
          </h4>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <div className="relative">
            <Icon 
              icon="heroicons:magnifying-glass" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search Tasks..."
              value={searchQuery}
              onChange={handleSearchChange} // Use debounced search handler
              className="pl-10 pr-4 py-2 w-80 border border-neutral-50 rounded-md text-sm focus:outline-none focus:border-electricBlue-50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1); // Reset to first page when clearing search
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon icon="heroicons:x-mark" className="w-4 h-4" />
              </button>
            )}
          </div>
          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2"> 
              <Button
                text={`Restore ${selectedTasks.length} ${selectedTasks.length === 1 ? "Task" : "Tasks"}`}
                className="bg-electricBlue-50/10 hover:bg-electricBlue-50/20 text-electricBlue-50 py-2 px-3 text-sm font-medium rounded-md transition-all duration-300"
                icon="heroicons:arrow-path"
                disabled={isAnySelectedTaskRestoring() || isAnySelectedTaskDeleting()}
                onClick={handleBulkRestore}
              />
              <Button
                text={`Delete ${selectedTasks.length} ${selectedTasks.length === 1 ? "Task" : "Tasks"}`}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 px-3 text-sm font-medium rounded-md transition-all duration-300"
                icon="heroicons:trash"
                disabled={isAnySelectedTaskRestoring() || isAnySelectedTaskDeleting()}
                onClick={handleBulkPermanentDelete}
              />
            </div>
          )}
        </div>
      </div>
      <div className="pb-6 w-full">
        <div className="overflow-x-auto">
          <Card className="" bodyClass='p-0'>
            <div className="overflow-x-auto">
              {loading ? (
                // Skeleton loader table
                <table className="w-full table-auto">
                  <thead className="bg-gray-100 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {/* Render 10 skeleton rows */}
                    {[...Array(10)].map((_, index) => (
                      <tr key={index} className="">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse"></div>
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 animate-pulse"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table {...getTableProps()} className="w-full table-auto">
                  <thead className="bg-gray-100 dark:bg-slate-800">
                    {headerGroups.map((headerGroup, index) => (
                      <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps(column.getSortByToggleProps())}
                            key={column.id}
                            className={`px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 whitespace-nowrap ${column.headerClassName || ""}`}
                          >
                            <div className="flex items-center gap-2">
                              {column.render('Header')}
                              {column.isSorted && (
                                <Icon
                                  icon={column.isSortedDesc ? 'heroicons:chevron-down' : 'heroicons:chevron-up'}
                                  className="w-4 h-4"
                                />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()} className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center">
                            <Icon icon="heroicons:trash" className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No deleted tasks found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        prepareRow(row);
                        return (
                          <tr {...row.getRowProps()} key={row.id} className="">
                            {row.cells.map((cell) => {
                              const headerClass = cell.column.headerClassName || "";
                              return (
                              <td {...cell.getCellProps()} key={cell.column.id} className={`px-0 py-0 whitespace-nowrap ${headerClass}`}>
                                {cell.render('Cell')}
                              </td>
                            )})}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && renderPagination()}
          </Card>
        </div>
      </div>

      {showDeleteModal && (
        <DeletePopup
          title={`Delete ${isBulkDelete ? `${selectedTasks.length} Task${selectedTasks.length > 1 ? "s" : ""}` : "Task"}`}
          description={
            isBulkDelete
              ? `Are you sure you want to permanently delete ${selectedTasks.length === 1 ? "this task" : "these tasks"}?\nThis action cannot be undone.`
              : "Are you sure you want to permanently delete this task?\nThis action cannot be undone."
          }
          setOpen={setShowDeleteModal}
          setLoading={setIsDeleting}
          loading={isDeleting}
          onConfirm={confirmPermanentDelete}
        />
      )}

    </>
  );
};

export default TrashTable;