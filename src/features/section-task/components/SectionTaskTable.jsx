import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
  useTransition,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import moment from "moment";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Tooltip from "@/components/ui/Tooltip";
import { intialLetterName } from "@/helper/helper";
import {
  toggleTaskSelection,
  selectAllTasksInSection,
  toggleSectionCollapse,
  setSelectedTask,
  toggleTaskPanel,
  updateTaskInSection,
  updateSectionName,
  updateSectionNameAsync,
  swapTaskOrderOptimistic,
  swapTaskOrderAsync,
  swapSectionOrderOptimistic,
  reorderSectionsOptimistic,
  reorderTasksInSectionOptimistic,
  swapSectionOrder,
  reorderSections,
  reorderTasksInSectionAsync,
  moveTaskBetweenSectionsWithOrder,
  moveTaskBetweenSectionsOptimistic,
  selectSectionLoadingTasks,
  selectHasMoreTasks,
  // 🆕 Using separate APIs
  fetchSectionsPaginated,
  fetchTasksPaginated,
  deleteSection,
  bulkDeleteTasksAsync,
  // New actions for temporary tasks
  addTemporaryTask,
  updateTaskInState,
  removeTemporaryTask,
  createTaskInSection,
  // Section toggle action
  toggleSectionCollapseAsync,
} from "../store/sectionTaskSlice";
import { useSectionTasks } from "../hooks/useSectionTasks";
import { useDebounce } from "../hooks/useDebounce";
import EditableTaskRow from "./EditableTaskRow";
import TaskSkeletonLoader from "./TaskSkeletonLoader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CreateSectionModal from "./CreateSectionModal";

import "./dragDrop.css";
import ContextMenu from "@/components/ui/ContextMenu";
import { toast } from "react-toastify";
import { setShowLimitModal } from "@/store/planSlice";
import ModernTooltip from "@/components/ui/ModernTooltip";

// Sortable Section Wrapper
const SortableSection = ({ section, children, sectionIndex }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section-${section.id}`,
    data: {
      type: "section",
      section,
      index: sectionIndex,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Make original section semi-transparent while dragging
  };

  return children({
    ref: setNodeRef,
    style,
    isDragging,
    dragHandleProps: listeners,
    dragAttributes: attributes,
  });
};

// Sortable Task Wrapper - OPTIMIZED with minimal listeners
const SortableTask = ({ task, taskIndex, section, children }) => {
  const taskId = task._id || task.taskId || `temp-${taskIndex}`;
  const uniqueTaskId = `section-${section.id}-task-${taskId}-index-${taskIndex}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: uniqueTaskId,
    data: {
      type: "task",
      task,
      taskId,
      sectionId: section.id,
      index: taskIndex,
    },
    disabled: task.initial, // Disable dragging for initial/temporary tasks
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Only attach drag listeners to the drag handle, not the entire row
  return React.cloneElement(children, {
    ref: setNodeRef,
    style,
    isDragging,
    dragHandleProps: listeners, // This will be applied only to the drag handle icon
    dragAttributes: attributes,
  });
};

// Virtualized Task List Component for each section
const VirtualizedTaskList = memo(({ section, initialLoadingSections, getSortedTasks, renderTask }) => {
  const sortedTasks = getSortedTasks(section.tasks || []);

  // Show skeleton loader only for initial loading
  if (initialLoadingSections.has(section.id)) {
    return (
      <tr>
        <td colSpan="9" className="p-0">
          <div style={{ minHeight: "40px" }}>
            <TaskSkeletonLoader />
          </div>
        </td>
      </tr>
    );
  }

  // Empty state
  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <tr>
        <td colSpan="9" className="p-0">
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <div className="flex items-center justify-center mr-2">
                <Icon
                  icon="hugeicons:task-add-02"
                  className="w-6 h-6 text-slate-400 dark:text-slate-500"
                />
              </div>
              <span className="text-sm font-medium">No tasks Found</span>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // 🎯 PERFORMANCE OPTIMIZATION:
  // Small sections (< 20 tasks): 
  //   - Render all tasks normally (simple, fast, great DnD support)
  //   - Uses main container scroll for pagination
  // 
  // Large sections (20+ tasks):
  //   - Virtual scrolling (only renders ~10-20 visible tasks)
  //   - Own scroll container with pagination
  //   - Starts from index 0, loads more on scroll
  //   - Dropdowns use portals to avoid clipping
  if (sortedTasks.length < 20) {
    return (
      <tr>
        <td colSpan="9" className="p-0">
          <SortableContext
            items={sortedTasks.map((task, idx) => {
              const taskId = task._id || task.taskId || `temp-${idx}`;
              return `section-${section.id}-task-${taskId}-index-${idx}`;
            })}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full table-fixed" style={{ minHeight: "40px" }}>
              <tbody className="bg-white divide-y divide-[#E1E1E1] dark:bg-slate-800 dark:divide-slate-700">
                {sortedTasks.map((task, taskIndex) =>
                  renderTask(task, taskIndex, section)
                )}

                {/* Loading indicator for non-virtualized sections */}
                {section.isLoadingTasks && (
                  <tr>
                    <td colSpan="9" className="p-0">
                      <div className="flex justify-center items-center py-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Loading more tasks...</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </td>
      </tr>
    );
  }

  // For large lists (50+ tasks), use virtualization
  return <VirtualizedLargeTaskList section={section} sortedTasks={sortedTasks} renderTask={renderTask} />;
});

// Virtualized list for sections with 50+ tasks
const VirtualizedLargeTaskList = memo(({ section, sortedTasks, renderTask }) => {
  const parentRef = useRef(null);
  const dispatch = useDispatch();
  const taskPagination = useSelector((state) => state.sectionTasks.pagination.tasks);
  const taskFilters = useSelector((state) => state.sectionTasks.filters);
  const isLoadingRef = useRef(false);

  const rowVirtualizer = useVirtualizer({
    count: sortedTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 8,
  });

  // Handle scroll for pagination within virtualized container
  const handleVirtualScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Load more when scrolling near bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100 && !isLoadingRef.current) {
      const sectionPagination = taskPagination[section.id];
      const hasMoreTasks = sectionPagination && sectionPagination.currentPage < sectionPagination.totalPages;

      if (hasMoreTasks && !section.isLoadingTasks) {
        isLoadingRef.current = true;

        dispatch(fetchTasksPaginated({
          sectionId: section.id,
          filters: {
            search: taskFilters?.search || "",
            userId: taskFilters?.userId || "",
            taskPosition: Array.isArray(taskFilters?.taskPosition)
              ? taskFilters.taskPosition
              : (Array.isArray(taskFilters?.status) ? taskFilters.status : []),
            priority: taskFilters?.priority || "",
            dateRange: taskFilters?.dateRange || { startDate: "", endDate: "" }
          },
          pageSize: 20,
          append: true
        })).finally(() => {
          isLoadingRef.current = false;
        });
      }
    }
  }, [dispatch, section.id, section.isLoadingTasks, taskPagination, taskFilters]);

  // Attach scroll listener to virtualized container
  useEffect(() => {
    const container = parentRef.current;
    if (container) {
      container.addEventListener('scroll', handleVirtualScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleVirtualScroll);
      }
    };
  }, [handleVirtualScroll]);

  return (
    <tr>
      <td colSpan="9" className="p-0">
        <SortableContext
          items={sortedTasks.map((task, idx) => {
            const taskId = task._id || task.taskId || `temp-${idx}`;
            return `section-${section.id}-task-${taskId}-index-${idx}`;
          })}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={parentRef}
            className="virtualized-task-container"
            style={{
              height: '469px',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <div style={{
              height: `${rowVirtualizer.getTotalSize() + (section.isLoadingTasks ? 40 : 0)}px`,
              position: 'relative'
            }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const task = sortedTasks[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <table className="w-full table-fixed">
                      <tbody className="bg-white divide-y divide-[#E1E1E1] dark:bg-slate-800 dark:divide-slate-700">
                        {renderTask(task, virtualRow.index, section)}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Loading indicator at bottom of virtual list */}
              {section.isLoadingTasks && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '40px',
                  }}
                  className="flex justify-center items-center bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700"
                >
                  <div className="text-sm text-slate-500 dark:text-slate-400">Loading more tasks...</div>
                </div>
              )}
            </div>
          </div>
        </SortableContext>
      </td>
    </tr>
  );
});

const SectionHeader = memo(({
  section,
  onToggle,
  onSelectAll,
  onAddTask,
  selectedCount,
  totalCount,
  isDragging,
  dragHandleProps,
  dragAttributes,
  className = "", // Add this prop
  canCreateTasks = true,
}) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState("section_only");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef(null);
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;


  // Debounced value for API calls (200ms delay)
  const debouncedSectionName = useDebounce(sectionName, 1000);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Update section name in local state when section prop changes
  useEffect(() => {
    setSectionName(section.name);
  }, [section.name]);

  // Debounced API call when section name changes
  // useEffect(() => {
  //   if (
  //     isEditing &&
  //     debouncedSectionName &&
  //     debouncedSectionName.trim() !== section.name &&
  //     debouncedSectionName.trim() !== "" &&
  //     debouncedSectionName !== section.name // Prevent loop
  //   ) {
  //     // API call with optimistic update
  //     dispatch(
  //       updateSectionNameAsync({
  //         sectionId: section.id,
  //         newName: debouncedSectionName.trim(),
  //       }),
  //     );
  //   }
  // }, [debouncedSectionName, section.id, section.name, dispatch, isEditing]);

  const handleSectionNameSubmit = () => {
    const trimmedName = sectionName.trim();
    if (trimmedName && trimmedName !== section.name) {
      // API call
      dispatch(
        updateSectionNameAsync({
          sectionId: section.id,
          newName: trimmedName,
        }),
      );
    } else if (!trimmedName) {
      // Reset to original name if empty
      setSectionName(section.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSectionNameSubmit();
    } else if (e.key === "Escape") {
      setSectionName(section.name);
      setIsEditing(false);
    }
  };

  const handleSectionNameChange = (value) => {
    setSectionName(value);
  };

  const handleSectionNameBlur = () => {
    const trimmedName = sectionName.trim();
    if (trimmedName && trimmedName !== section.name) {
      // Submit changes on blur
      dispatch(
        updateSectionNameAsync({
          sectionId: section.id,
          newName: trimmedName,
        }),
      );
    } else if (!trimmedName) {
      // Reset to original name if empty
      setSectionName(section.name);
    }
    setIsEditing(false);
  };

  // Handle delete section
  const handleDeleteSection = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteSection({ sectionId: section.id, deleteType })).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete section:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate task counts
  const completedTasks = section.tasks?.filter(task => task.isComplete)?.length || 0;
  const incompleteTasks = (section.tasks?.length || 0) - completedTasks;

  return (
    <>
      <div
        {...dragAttributes}
        {...dragHandleProps}
        className={`group section-row border-b border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-full cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50" : ""
          } ${className}`}

      >
        <div className="flex items-center justify-between w-full px-1 py-1">
          <div className="flex items-center space-x-3">
            {/* Drag Handle Icon - Now just visual indicator */}
            <div
              className="p-1 text-slate-400 dark:text-slate-500 rounded transition-colors"
            >
              <Icon icon="heroicons:bars-3" className="w-4 h-4" />
            </div>

            {/* Section Checkbox */}
            {
              !section.isCollapsed && canCreateTasks && // Add canCreateTasks check here
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={(e) => onSelectAll(section.id, e.target.checked)}
                className="rounded border-gray-300 text-[#8E2EFF] focus:ring-[#8E2EFF]"
              />
            }

            {/* Section Name */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={sectionName}
                onChange={(e) => handleSectionNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSectionNameBlur}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E2EFF]"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-left min-w-[170px] hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {sectionName || section.name}

                </h3>

              </button>
            )}
            {/* Task Count Badge - Fixed column */}

            <div className="flex justify-center">
              {section.taskCount !== undefined ? (
                <span className="inline-flex items-center justify-center min-w-[40px] h-5 px-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                  {section.taskCount}
                </span>
              ) : (
                <div className="w-6 h-5"></div> // Placeholder to maintain alignment
              )}
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => onToggle(section.id)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <Icon
                icon={
                  section.isCollapsed
                    ? "heroicons:chevron-right"
                    : "heroicons:chevron-down"
                }
                className="w-4 h-4 text-slate-600 dark:text-slate-400"
              />
            </button>

            {/* Add Task Button - Improved styling */}
            <ModernTooltip
              content={!canCreateTasks ? "🚫 Access Restricted" : "Add task to this section"}
              placement="top"
              theme="custom-light"
            >
              <div className="inline-block">
                <button
                  onClick={() => canCreateTasks && onAddTask && onAddTask(section.id)}
                  disabled={!canCreateTasks}
                  className={`add-task-btn flex items-center gap-1 px-1 py-1 text-xs rounded transition-all duration-200 shadow-sm ${!canCreateTasks
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60"
                    : !section.isCollapsed
                      ? "bg-[#7A39FF] text-white border border-[#7A39FF] shadow-md hover:bg-[#6A2FFF]"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                    }`}
                >
                  <Icon icon="heroicons:plus" className="w-4 h-4" />
                </button>
              </div>
            </ModernTooltip>

            {selectedCount > 0 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                {selectedCount} selected
              </span>
            )}
          </div>
          {section?.canDelete === true && canCreateTasks && // Add canCreateTasks check here

            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete section"
              >
                <Icon icon="tabler:trash" className="w-4 h-4" />
              </button>

            </div>
          }

        </div>
      </div>

      {/* Delete Section Confirmation Modal */}
      <Modal
        activeModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Are you sure you want to delete this section?"
        centered
        className="max-w-md"
      >
        <div className="space-y-4">


          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="deleteType"
                value="section_only"
                checked={deleteType === "section_only"}
                onChange={(e) => setDeleteType(e.target.value)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Delete only this section, but keep all tasks inside it.
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="deleteType"
                value="with_tasks"
                checked={deleteType === "with_tasks"}
                onChange={(e) => setDeleteType(e.target.value)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Delete this section along with all its tasks.


              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSection}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete section"}
          </Button>
        </div>
      </Modal>
    </>
  );
});

const SectionTaskTable = ({
  sections,
  selectedTasks,
  onTaskSelect,
  onTaskClick,
  onSectionToggle,
  addingTaskToSection,
  onAddTaskToSection,
  onTaskAddComplete,
  projectMembers = [],
  projectStatus = [],
  canCreateTasks = true,
}) => {
  const dispatch = useDispatch();
  const selectedTask = useSelector((state) => state.sectionTasks.selectedTask);
  // Use current applied filters from redux so pagination respects filters
  const taskFilters = useSelector((state) => state.sectionTasks.filters);
  const { updateTask, toggleTaskComplete } = useSectionTasks();
  const [isPending, startTransition] = useTransition();
  const userInfo = useSelector((state) => state.auth.user);

  const [successMessage, setSuccessMessage] = useState(null);
  const [dragFeedback, setDragFeedback] = useState(null);
  const [scrollLoading, setScrollLoading] = useState({});
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [initialLoadingSections, setInitialLoadingSections] = useState(new Set());
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const { subscriptionData } = useSelector((state) => state.plan);

  // State for task creation
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [savingTasks, setSavingTasks] = useState(new Set()); // Track which tasks are being saved
  const inputRefs = useRef({});
  const taskCreationMapRef = useRef({});
  const cursorPositionRef = useRef({}); // Track cursor positions for each task
  const lastAddedSectionRef = useRef(null); // Track last processed section to prevent loops


  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null, // 'id', 'name', 'priority', 'dueDate'
    direction: 'asc' // 'asc' or 'desc'
  });

  // Context Menu
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
  });

  // Delete Task
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized sorted sections
  const sortedSections = useMemo(() =>
    sections
      .filter((section) => section && section.id), [sections]
  );

  // Get pagination data for scroll loading - memoized
  const taskPagination = useSelector((state) => state.sectionTasks.pagination.tasks);
  const paginationData = useMemo(() => {
    const pagination = {};
    sections.forEach(section => {
      pagination[section.id] = taskPagination[section.id];
    });
    return pagination;
  }, [sections, taskPagination]);

  const scrollContainersRef = useRef({});
  const isRestoringScrollRef = useRef(false);
  const previousTaskCountsRef = useRef({});
  const [mainScrollPosition, setMainScrollPosition] = useState(0);

  // Debounced scroll handler to prevent multiple rapid calls
  const scrollTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);
  const loadingSectionsRef = useRef(new Set()); // Track which sections are currently loading
  const initialLoadCompletedRef = useRef(false); // Track if initial load is completed

  // Scroll event handler for infinite loading
  const handleScroll = useCallback((event) => {
    // Skip if we're programmatically restoring scroll position
    if (isRestoringScrollRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Store current scroll position
    setMainScrollPosition(scrollTop);

    // Determine scroll direction
    const scrollingDown = scrollTop > lastScrollTop;
    setIsScrollingDown(scrollingDown);
    setLastScrollTop(scrollTop);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Only load more when scrolling DOWN and near the bottom (within 200px for earlier trigger)
    if (scrollingDown && scrollHeight - scrollTop - clientHeight < 200) {
      // Debounce the scroll loading to prevent duplicate calls
      scrollTimeoutRef.current = setTimeout(() => {
        // Double-check we're not already loading
        if (isLoadingRef.current) {
          return;
        }

        // Find which section is currently visible or needs loading
        // We'll load tasks for the first expanded section that has more tasks
        const expandedSections = sections.filter(section => !section.isCollapsed);

        for (const section of expandedSections) {
          // Check both scrollLoading state, section loading state, and our loading ref
          if (!scrollLoading[section.id] && !section.isLoadingTasks && !loadingSectionsRef.current.has(section.id)) {
            const sectionPagination = paginationData[section.id];
            const hasMoreTasks = sectionPagination && sectionPagination.currentPage < sectionPagination.totalPages;

            if (hasMoreTasks) {
              // Set loading flags immediately to prevent duplicate calls
              isLoadingRef.current = true;
              loadingSectionsRef.current.add(section.id);
              setScrollLoading(prev => ({ ...prev, [section.id]: true }));

              dispatch(fetchTasksPaginated({
                sectionId: section.id,


                // Pass current filters so subsequent pages are consistent with applied filters
                filters: {
                  search: taskFilters?.search || "",
                  userId: taskFilters?.userId || "",
                  // Prefer taskPosition if available; fallback to status array if present
                  taskPosition: Array.isArray(taskFilters?.taskPosition)
                    ? taskFilters.taskPosition
                    : (Array.isArray(taskFilters?.status) ? taskFilters.status : []),
                  priority: taskFilters?.priority || "",
                  dateRange: taskFilters?.dateRange || { startDate: "", endDate: "" }
                },
                pageSize: 20,
                append: true
              })).finally(() => {
                // Clear loading flags
                isLoadingRef.current = false;
                loadingSectionsRef.current.delete(section.id);
                setScrollLoading(prev => ({ ...prev, [section.id]: false }));
              });
              break; // Only load one section at a time
            }
          }
        }
      }, 300); // Increased debounce delay to 300ms to prevent rapid calls
    }
  }, [scrollLoading, dispatch, paginationData, lastScrollTop, sections, taskFilters]);

  // Attach scroll listener only once
  useEffect(() => {
    const mainContainer = scrollContainersRef.current['main'];
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Cleanup scroll timeout and loading refs on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Clear loading refs
      loadingSectionsRef.current.clear();
      isLoadingRef.current = false;
      initialLoadCompletedRef.current = false;
    };
  }, []);

  // Restore scroll position after new data is loaded
  useEffect(() => {
    let hasNewTasks = false;
    let totalNewTasks = 0;

    sections.forEach(section => {
      const currentTaskCount = section.tasks?.length || 0;
      const previousTaskCount = previousTaskCountsRef.current[section.id] || 0;

      // Check if any section got new tasks
      if (currentTaskCount > previousTaskCount) {
        hasNewTasks = true;
        totalNewTasks += (currentTaskCount - previousTaskCount);
      }

      // Update the previous task count
      previousTaskCountsRef.current[section.id] = currentTaskCount;
    });

    // Restore scroll position if new tasks were loaded
    if (hasNewTasks && mainScrollPosition > 0) {
      const mainScrollContainer = scrollContainersRef.current['main'];
      if (mainScrollContainer) {
        // Use a longer delay to ensure DOM is fully updated
        setTimeout(() => {
          isRestoringScrollRef.current = true;
          mainScrollContainer.scrollTop = mainScrollPosition;
          // Reset the flag after a short delay
          setTimeout(() => {
            isRestoringScrollRef.current = false;
          }, 50);
        }, 150);
      }
    }
  }, [sections, mainScrollPosition]);

  // Track initial loading for sections and clear when collapsed
  useEffect(() => {
    sections.forEach(section => {
      if (section.isCollapsed) {
        // Clear the previous task count
        delete previousTaskCountsRef.current[section.id];
        // Remove from initial loading set when collapsed
        setInitialLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(section.id);
          return newSet;
        });
      } else if (!section.isCollapsed && section.isLoadingTasks && !section.tasks?.length) {
        // Add to initial loading set when section is expanded and loading for first time
        setInitialLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.add(section.id);
          return newSet;
        });
      } else if (!section.isCollapsed && !section.isLoadingTasks) {
        // Remove from initial loading set when loading is complete (whether tasks exist or not)
        setInitialLoadingSections(prev => {
          const newSet = new Set(prev);
          newSet.delete(section.id);
          return newSet;
        });
      }
    });
  }, [sections]);

  // Track sections that have already been fetched to prevent infinite calls
  const fetchedSectionsRef = useRef(new Set());

  // Fetch tasks for expanded sections on initial load
  useEffect(() => {
    sections.forEach(section => {
      // Check if section is expanded, doesn't have tasks loaded yet, not currently loading,
      // and hasn't been fetched before
      if (!section.isCollapsed &&
        (!section.tasks || section.tasks.length === 0) &&
        !section.isLoadingTasks &&
        !fetchedSectionsRef.current.has(section.id)) {

        // Check if there are active filters
        const hasActiveFilters =
          (taskFilters?.search && taskFilters.search.trim() !== "") ||
          (taskFilters?.userId && taskFilters.userId !== "") ||
          (taskFilters?.taskPosition && taskFilters.taskPosition.length > 0) ||
          (taskFilters?.priority && taskFilters.priority !== "") ||
          (taskFilters?.dateRange && (taskFilters.dateRange.startDate || taskFilters.dateRange.endDate));

        // Mark this section as being fetched to prevent duplicate requests
        fetchedSectionsRef.current.add(section.id);

        // Fetch tasks for this expanded section with current filters
        dispatch(fetchTasksPaginated({
          sectionId: section.id,
          filters: hasActiveFilters ? {
            search: taskFilters?.search || "",
            userId: taskFilters?.userId || "",
            taskPosition: taskFilters?.taskPosition || [],
            priority: taskFilters?.priority || "",
            dateRange: taskFilters?.dateRange || { startDate: "", endDate: "" }
          } : {
            search: "",
            userId: "",
            taskPosition: [],
            priority: "",
            dateRange: { startDate: "", endDate: "" }
          },
          pageSize: 20,
          append: false
        }));
      }
    });
  }, [sections, dispatch, taskFilters]);

  // Reset fetched sections when filters change to allow refetching with new filters
  useEffect(() => {
    fetchedSectionsRef.current.clear();
  }, [taskFilters]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(
    async (task) => {
      const result = await toggleTaskComplete(task._id, task);

      // After toggling, check if task still matches filters
      if (result && taskFilters?.taskPosition && Array.isArray(taskFilters.taskPosition) && taskFilters.taskPosition.length > 0) {
        // Determine the new status after toggle
        const isCurrentlyComplete = task.taskPosition === "completed";
        const newTaskPosition = isCurrentlyComplete ? "pending" : "completed";

        // Find which section this task belongs to
        const section = sections.find(s =>
          s.tasks?.some(t => t._id === task._id || t.taskId === task.taskId)
        );

        if (section) {
          // Wait for Redux state to update before checking filter
          requestAnimationFrame(() => {
            setTimeout(() => {
              // Check if the new status matches the current filter
              // Normalize both values for comparison (handle case sensitivity)
              const normalizedNewPosition = newTaskPosition?.toString().toLowerCase();
              const matchesFilter = taskFilters.taskPosition.some(
                filterStatus => filterStatus?.toString().toLowerCase() === normalizedNewPosition
              );

              // If task doesn't match filter anymore, remove it from view
              if (!matchesFilter) {
                dispatch(removeTemporaryTask({
                  sectionId: section.id,
                  taskId: task._id || task.taskId
                }));
              }
            }, 100); // Small delay to ensure Redux state is updated
          });
        }
      }

      return result;
    },
    [toggleTaskComplete, taskFilters, sections, dispatch],
  );

  // Handle section select all
  const handleSectionSelectAll = useCallback(
    (sectionId, shouldSelect) => {
      dispatch(selectAllTasksInSection({ sectionId, shouldSelect }));
    },
    [dispatch],
  );

  // Handle task row click
  const handleTaskRowClick = useCallback(
    (task, e, taskId, targetTab = null) => {
      // ⛔ Validation: Don't open task panel for temporary tasks
      const isTempTask = task._id?.toString().startsWith('new-') || task.initial || task.isOptimistic;

      if (isTempTask) {
        toast.success("Task Created Successfully", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      if (e?.ctrlKey || e?.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(toggleTaskSelection(task._id || task.taskId)); // same as TaskTable
        return;
      }
      // If a specific tab is requested, set the active tab in the task panel
      if (targetTab) {
        let activeTabIndex = -1;
        switch (targetTab) {
          case "comments":
            activeTabIndex = 0;
            break;
          case "attachments":
            activeTabIndex = 2;
            break;
          case "time-logs":
            activeTabIndex = 3;
            break;
          case "subtasks":
            // Subtasks are not a tab in TaskDescriptionComments, they're displayed above it
            // We'll handle subtask scrolling separately in SectionTaskPanel
            activeTabIndex = -1;
            break;
          default:
            activeTabIndex = -1;
        }



        // Store the target tab index in sessionStorage so the task panel can read it
        if (activeTabIndex !== -1) {
          sessionStorage.setItem('sectionTaskActiveTabIndex', activeTabIndex.toString());
        } else if (targetTab === "subtasks") {
          // For subtasks, set a special flag to trigger subtask scrolling
          sessionStorage.setItem('scrollToSubtasks', 'true');
        }
      }

      dispatch(setSelectedTask(task));
      dispatch(toggleTaskPanel(true));
    },
    [dispatch],
  );

  // Handle task selection
  const handleTaskSelect = useCallback(
    (taskId) => {
      if (!canCreateTasks) return; // Prevent task selection for viewers
      startTransition(() => {
        dispatch(toggleTaskSelection(taskId));
      });
    },
    [dispatch, startTransition, canCreateTasks],
  );

  // Helper function to extract task ID from draggableId
  const extractTaskIdFromDraggableId = useCallback((draggableId) => {
    // Format: "section-{sectionId}-task-{taskId}-index-{index}"
    const match = draggableId.match(/^section-\d+-task-(.+)-index-\d+$/);
    return match ? match[1] : null;
  }, []);

  // Helper function to find task by ID in a section
  const findTaskById = useCallback((tasks, taskId) => {
    return tasks.find(task =>
      (task._id && task._id.toString() === taskId.toString()) ||
      (task.taskId && task.taskId.toString() === taskId.toString())
    );
  }, []);

  // @dnd-kit sensors - Optimized to reduce event listener overhead
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Active drag state for overlay
  const [activeId, setActiveId] = useState(null);
  const [activeData, setActiveData] = useState(null);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveData(active.data.current);

    // Set feedback message
    if (active.data.current?.type === "section") {
      const sectionName = active.data.current.section?.name || "Section";
      setDragFeedback(`Moving "${sectionName}" section`);
    } else if (active.data.current?.type === "task") {
      const taskName = active.data.current.task?.taskName || "Task";
      setDragFeedback(`Moving "${taskName}" task`);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveData(null);
      setDragFeedback(null);

      if (!over) {
        return;
      }

      // If dropped in the same position
      if (active.id === over.id) {
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle section reordering
      if (activeData?.type === "section" && overData?.type === "section") {
        const activeIndex = activeData.index;
        const overIndex = overData.index;

        if (activeIndex !== overIndex) {
          const draggedSection = activeData.section;
          const draggedSectionId = draggedSection?.id;

          if (draggedSection && draggedSectionId) {
            // Optimistic update first for immediate UI feedback
            dispatch(
              reorderSectionsOptimistic({
                draggedSectionId: draggedSection.id,
                sourceIndex: activeIndex,
                destinationIndex: overIndex,
              }),
            );

            // API call in background with proper payload
            dispatch(
              reorderSections({
                sections,
                draggedSectionId,
                destinationIndex: overIndex,
                sourceIndex: activeIndex,
              }),
            )
              .then(() => { })
              .catch((error) => {
                console.error("❌ Failed to update section order:", error);
              });

            setSuccessMessage("Section reordered successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        }
        return;
      }

      // Handle task drag and drop
      if (activeData?.type === "task") {
        const activeSectionId = activeData.sectionId;
        const activeTaskId = activeData.taskId;
        const activeTask = activeData.task;
        const activeIndex = activeData.index;

        // Determine destination section and index
        let destSectionId;
        let destIndex;

        if (overData?.type === "task") {
          // Dropped on another task
          destSectionId = overData.sectionId;
          destIndex = overData.index;
        } else if (overData?.type === "section") {
          // Dropped on a section header (collapsed section)
          destSectionId = overData.section.id;
          destIndex = 0; // Add to top
        } else {
          // Invalid drop target
          return;
        }

        const sourceSection = sections.find(
          (s) => s.id.toString() === activeSectionId.toString() || s.id === activeSectionId
        );
        const destSection = sections.find(
          (s) => s.id.toString() === destSectionId.toString() || s.id === destSectionId
        );

        if (!sourceSection || !destSection) {
          return;
        }

        // Same section reordering
        if (activeSectionId === destSectionId) {
          // Reorder tasks within the same section
          if (activeIndex !== destIndex && sourceSection.tasks) {
            const draggedTaskId = activeTask?.taskId || activeTask?._id;

            if (activeTask && draggedTaskId) {
              // Optimistic update first for immediate UI feedback
              dispatch(
                reorderTasksInSectionOptimistic({
                  sectionId: sourceSection.id,
                  draggedTaskId,
                  sourceIndex: activeIndex,
                  destinationIndex: destIndex,
                }),
              );

              // API call in background with proper payload
              dispatch(
                reorderTasksInSectionAsync({
                  sectionId: sourceSection.id,
                  tasks: sourceSection.tasks,
                  draggedTaskId,
                  destinationIndex: destIndex,
                  sourceIndex: activeIndex,
                }),
              )
                .then(() => { })
                .catch((error) => {
                  console.error("❌ Failed to update task order:", error);
                  // Rollback optimistic update on failure
                  dispatch(
                    reorderTasksInSectionOptimistic({
                      sectionId: sourceSection.id,
                      draggedTaskId,
                      sourceIndex: destIndex,
                      destinationIndex: activeIndex,
                    }),
                  );
                  toast.error("Failed to update task order. Changes have been reverted.");
                });

              setSuccessMessage("Task reordered successfully!");
              setTimeout(() => setSuccessMessage(null), 3000);
            }
          }
        } else {
          // Move task between sections
          const taskId = activeTask?._id || activeTask?.taskId;
          const destTasks = destSection.tasks || [];

          if (activeTask && taskId) {
            // Perform optimistic update immediately for better UX
            dispatch(
              moveTaskBetweenSectionsOptimistic({
                taskId,
                sourceSectionId: activeSectionId,
                destinationSectionId: destSectionId,
                sourceIndex: activeIndex,
                destinationIndex: destIndex,
              }),
            );

            // API call in background with proper payload
            dispatch(
              moveTaskBetweenSectionsWithOrder({
                taskId,
                sourceSectionId: activeSectionId,
                destinationSectionId: destSectionId,
                destinationIndex: destIndex,
                destinationTasks: destTasks,
              }),
            )
              .then(() => { })
              .catch((error) => {
                console.error("❌ Failed to move task:", error);
                // Rollback optimistic update on failure
                dispatch(
                  moveTaskBetweenSectionsOptimistic({
                    taskId,
                    sourceSectionId: destSectionId,
                    destinationSectionId: activeSectionId,
                    sourceIndex: destIndex,
                    destinationIndex: activeIndex,
                  }),
                );
                toast.error("Failed to move task. Changes have been reverted.");
              });

            setSuccessMessage(`Task moved to ${destSection.name}!`);
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        }
      }
    },
    [dispatch, sections],
  );

  // Handle drag over for visual feedback
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    if (!over) return;

    const overData = over.data.current;
    if (overData?.type === "section") {
      setDragFeedback(`Moving to ${overData.section?.name || "section"}`);
    } else if (overData?.type === "task") {
      const section = sections.find(s => s.id === overData.sectionId);
      setDragFeedback(`Moving to ${section?.name || "section"}`);
    }
  }, [sections]);

  // Format date
  const formatDate = useCallback((date) => {
    if (!date) return "No due date";
    return moment(date).format("MMM DD, YYYY");
  }, []);

  // Get selected tasks count for a section - memoized
  const getSectionSelectedCount = useCallback((sectionTasks) => {
    return sectionTasks.filter((task) => selectedTasks.includes(task._id))
      .length;
  }, [selectedTasks]);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Sort tasks by selected criteria; otherwise keep original order to allow infinite scroll to append at bottom
  const getSortedTasks = useCallback((tasks) => {
    if (!sortConfig.key) {
      return tasks;
    }

    const sortedTasks = [...tasks];

    return sortedTasks.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'id':
          aValue = a.taskId || a._id || '';
          bValue = b.taskId || b._id || '';
          break;
        case 'name':
          aValue = (a.taskName || '').toLowerCase();
          bValue = (b.taskName || '').toLowerCase();
          break;
        case 'priority':
          // Priority order: high = 3, medium = 2, low = 1, None = 0
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'dueDate':
          // Handle due date sorting: tasks with no due date go to the end
          const aHasDate = a.dueDate && a.dueDate !== null && a.dueDate !== undefined;
          const bHasDate = b.dueDate && b.dueDate !== null && b.dueDate !== undefined;

          if (!aHasDate && !bHasDate) {
            return 0; // Both have no due date, maintain original order
          }
          if (!aHasDate) {
            return sortConfig.direction === 'asc' ? 1 : -1; // Tasks without due date go to end for asc, beginning for desc
          }
          if (!bHasDate) {
            return sortConfig.direction === 'asc' ? -1 : 1; // Tasks without due date go to end for asc, beginning for desc
          }

          // Both have due dates, compare them
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'time':
          // Handle time sorting: convert time to seconds for comparison
          const parseTime = (task) => {
            // Check total_time first (format: "HH:MM:SS" or "00:00:00")
            if (task.total_time && task.total_time !== "00:00:00") {
              const parts = task.total_time.split(':');
              const hours = parseInt(parts[0] || 0, 10);
              const minutes = parseInt(parts[1] || 0, 10);
              const seconds = parseInt(parts[2] || 0, 10);
              return hours * 3600 + minutes * 60 + seconds;
            }
            // Fallback to timeLogged (in minutes)
            if (task.timeLogged && task.timeLogged > 0) {
              return task.timeLogged * 60; // Convert minutes to seconds
            }
            return 0;
          };

          aValue = parseTime(a);
          bValue = parseTime(b);
          break;
        default:
          return 0;
      }

      // For non-dueDate cases, use standard comparison
      if (sortConfig.key !== 'dueDate') {
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      } else {
        // For dueDate, comparison is already handled above
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  }, [sortConfig]);

  // Handle add task to section (moved before renderTask)
  const handleAddTaskToSection = useCallback(
    async (sectionId) => {
      if (!canCreateTasks) {
        return null; // Permission denied
      }
      if (subscriptionData?.subscription_status !== "active") {
        dispatch(setShowLimitModal(true));
        return null;
      }

      // Find the section
      const section = sections.find(s => s.id === sectionId);

      // Check if there are any unsaved tasks in this section
      const hasUnsavedTasks = section?.tasks?.some(task => task.initial === true);

      if (hasUnsavedTasks) {
        toast.warning("Please save the current task before adding a new one", {
          position: "top-center",
          autoClose: 500,
        });

        // Focus on the unsaved task
        const unsavedTask = section.tasks.find(task => task.initial === true);
        if (unsavedTask && inputRefs.current[unsavedTask._id]) {
          inputRefs.current[unsavedTask._id].focus();
        }

        return null;
      }

      // Create temporary task ID
      const tempId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const wasCollapsed = section?.isCollapsed;

      // Add temporary task to section
      dispatch(addTemporaryTask({
        sectionId,
        task: {
          _id: tempId,
          taskName: "",
          initial: true,
          assigned_users: [],
          priority: "low",
          taskPosition: "not_started_yet",
          dueDate: null,
        }
      }));

      // Set editing state
      setEditingTaskId(tempId);

      // If section was collapsed, expand it and fetch tasks
      if (wasCollapsed) {
        try {
          // Expand the section
          const result = await dispatch(toggleSectionCollapseAsync(sectionId));

          if (result.type === 'sectionTasks/toggleSectionCollapseAsync/fulfilled') {
            // Fetch tasks for the newly expanded section
            setTimeout(() => {
              dispatch(fetchTasksPaginated({
                sectionId,
                filters: {
                  search: taskFilters?.search || "",
                  userId: taskFilters?.userId || "",
                  taskPosition: taskFilters?.taskPosition || [],
                  priority: taskFilters?.priority || "",
                  dateRange: taskFilters?.dateRange || { startDate: "", endDate: "" }
                },
                page: 1,
                pageSize: 20,
                append: false
              }));
            }, 100); // Small delay to prevent rapid API calls
          }
        } catch (error) {
          console.error('Failed to expand section:', error);
        }
      }
    },
    [canCreateTasks, subscriptionData?.subscription_status, dispatch, sections, taskFilters],
  );

  // Handle addingTaskToSection prop changes from parent
  useEffect(() => {
    if (addingTaskToSection && lastAddedSectionRef.current !== addingTaskToSection) {
      lastAddedSectionRef.current = addingTaskToSection;

      // Call the async function and handle completion
      handleAddTaskToSection(addingTaskToSection).finally(() => {
        // Notify parent that task creation has been triggered
        if (onTaskAddComplete) {
          setTimeout(() => {
            onTaskAddComplete();
            // Reset the ref after completion to allow re-adding to the same section later
            setTimeout(() => {
              lastAddedSectionRef.current = null;
            }, 500);
          }, 100);
        }
      });
    }
  }, [addingTaskToSection, handleAddTaskToSection, onTaskAddComplete]);

  // Save callback for creating task with all current data
  const saveTaskCallback = useCallback(
    async (taskId, taskName, sectionId, updatedTaskData = null) => {
      // Check if already creating this task
      if (taskCreationMapRef.current[taskId]) {
        throw new Error("Task is already being saved");
      }

      if (!taskName || !taskName.trim()) {
        toast.warning("Please enter a task name before saving", {
          position: "top-center",
          autoClose: 2000,
        });
        throw new Error("Task name is required");
      }

      // Mark as being created and saving
      taskCreationMapRef.current[taskId] = true;
      setSavingTasks(prev => new Set([...prev, taskId]));

      try {
        const section = sections.find(s =>
          s.tasks?.some(t => t._id === taskId)
        );

        if (!section) {
          throw new Error("Section not found");
        }

        const task = section.tasks.find(t => t._id === taskId);
        if (!task) {
          throw new Error("Task not found");
        }

        // Merge task data from state with any updated values passed in
        const taskData = {
          taskName: taskName.trim(),
          description: "",
          priority: updatedTaskData?.priority || task.priority || "low",
          dueDate: updatedTaskData?.dueDate || task.dueDate || null,
          assigned_users: updatedTaskData?.assigned_users || task.assigned_users || [],
          taskPosition: updatedTaskData?.taskPosition || task.taskPosition || "not_started_yet",
        };

        const result = await dispatch(
          createTaskInSection({
            sectionId: section.id,
            taskData,
            tempId: taskId // Pass the temp task ID so reducer can update in place
          })
        ).unwrap();

        if (result && result.task) {
          // ✅ SMOOTH FLOW: The reducer has updated the task in place
          // The same row now has the real ID and task code from server
          // We just need to transfer our local refs to track the new ID
          // No DOM removal/re-add = no flicker, smooth UX!

          // Transfer input refs and cursor position to new task ID
          if (inputRefs.current[taskId]) {
            inputRefs.current[result.task._id] = inputRefs.current[taskId];
            delete inputRefs.current[taskId];
          }

          // Transfer cursor position
          if (cursorPositionRef.current[taskId] !== undefined) {
            cursorPositionRef.current[result.task._id] = cursorPositionRef.current[taskId];
            delete cursorPositionRef.current[taskId];
          }

          // Update editing task ID and maintain focus
          setEditingTaskId(result.task._id);

          // Clear saving state for both old and new task ID
          setSavingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            newSet.delete(result.task._id);
            return newSet;
          });

          // Restore focus and cursor position
          setTimeout(() => {
            const input = inputRefs.current[result.task._id];
            if (input) {
              input.focus();
              const cursorPos = cursorPositionRef.current[result.task._id];
              if (cursorPos !== undefined) {
                input.setSelectionRange(cursorPos, cursorPos);
              }
            }
          }, 50);
        }
      } catch (error) {
        console.error("Error creating task:", error);
        toast.error("Failed to create task");
        throw error; // Re-throw to prevent creating new row
      } finally {
        delete taskCreationMapRef.current[taskId];
        setSavingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
    },
    [dispatch, sections]
  );

  // Handle input change (updates local state only, no auto-save)
  const handleTaskNameInput = useCallback(
    (taskId, value, cursorPosition) => {
      // Store cursor position
      if (typeof cursorPosition === 'number') {
        cursorPositionRef.current[taskId] = cursorPosition;
      }

      // Update local state immediately (prevents UI jitter)
      dispatch(updateTaskInState({ _id: taskId, taskName: value }));

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        const inputElement = inputRefs.current[taskId];
        if (inputElement && cursorPositionRef.current[taskId] !== undefined) {
          const pos = cursorPositionRef.current[taskId];
          inputElement.setSelectionRange(pos, pos);
        }
      });

      // Don't save automatically - only save on Enter/Tab
    },
    [dispatch]
  );

  // Handle task name blur (no action - keep row visible)
  const handleTaskNameBlur = useCallback(
    (taskId) => {
      // Don't save on blur - only save when user presses Enter/Tab
      // This keeps the row visible even when clicking outside
    },
    []
  );

  // Handle Enter/Tab key (save and create next)
  const handleTaskKeyDown = useCallback(
    (e, taskId) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        const section = sections.find(s =>
          s.tasks?.some(t => t._id === taskId)
        );

        if (!section) return;

        const task = section.tasks.find(t => t._id === taskId);
        if (!task || !task.taskName || !task.taskName.trim()) {
          toast.warning("Please enter a task name", {
            position: "top-center",
            autoClose: 2000,
          });
          return;
        }

        // Save current task - only create new row if save succeeds
        saveTaskCallback(taskId, task.taskName, section.id)
          .then(() => {
            // Create new task and get its ID
            const newTempId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Add temporary task to section
            dispatch(addTemporaryTask({
              sectionId: section.id,
              task: {
                _id: newTempId,
                taskName: "",
                initial: true,
                assigned_users: [],
                priority: "low",
                taskPosition: "not_started_yet",
                dueDate: null,
              }
            }));

            // Set editing state
            setEditingTaskId(newTempId);

            // Focus on new task input after DOM update
            requestAnimationFrame(() => {
              setTimeout(() => {
                const newInput = inputRefs.current[newTempId];
                if (newInput) {
                  newInput.focus();
                  newInput.setSelectionRange(0, 0);
                } else {
                  // Retry after a bit more time if element not found
                  setTimeout(() => {
                    const retryInput = inputRefs.current[newTempId];
                    if (retryInput) {
                      retryInput.focus();
                      retryInput.setSelectionRange(0, 0);
                    }
                  }, 100);
                }
              }, 50);
            });
          })
          .catch((error) => {
            // Don't create new row if save failed
            console.error("Failed to save task:", error);
            // Focus back on the current input
            const currentInput = inputRefs.current[taskId];
            if (currentInput) {
              currentInput.focus();
            }
          });
      } else if (e.key === "Tab") {
        e.preventDefault();

        const section = sections.find(s =>
          s.tasks?.some(t => t._id === taskId)
        );

        if (!section) return;

        const task = section.tasks.find(t => t._id === taskId);
        if (!task || !task.taskName || !task.taskName.trim()) {
          toast.warning("Please enter a task name", {
            position: "top-center",
            autoClose: 2000,
          });
          return;
        }

        // Save current task without creating new row
        saveTaskCallback(taskId, task.taskName, section.id)
          .then(() => {
            setEditingTaskId(null);
          })
          .catch((error) => {
            console.error("Failed to save task:", error);
            // Keep focus on current input
            const currentInput = inputRefs.current[taskId];
            if (currentInput) {
              currentInput.focus();
            }
          });
      } else if (e.key === "Escape") {
        // Cancel and remove temporary task
        const section = sections.find(s =>
          s.tasks?.some(t => t._id === taskId)
        );
        if (section) {
          dispatch(removeTemporaryTask({ sectionId: section.id, taskId }));
        }
        setEditingTaskId(null);
      }
    },
    [dispatch, sections, saveTaskCallback, inputRefs]
  );

  // Memoized task rendering to prevent unnecessary re-renders
  const renderTask = useCallback((task, taskIndex, section) => {
    const taskId = task._id || task.taskId || `temp-${taskIndex}`;
    const uniqueTaskId = `section-${section.id}-task-${taskId}-index-${taskIndex}`;

    return (
      <SortableTask
        key={uniqueTaskId}
        task={task}
        taskIndex={taskIndex}
        section={section}
      >
        <EditableTaskRow
          task={task}
          isSelected={selectedTasks.includes(task._id)}
          onSelect={handleTaskSelect}
          onTaskClick={handleTaskRowClick}
          onToggleComplete={handleToggleComplete}
          formatDate={formatDate}
          isEven={taskIndex % 2 === 0}
          isOpen={
            selectedTask &&
            (selectedTask._id === task._id || selectedTask.taskId === task.taskId)
          }
          onRowClick={handleTaskRowClick}
          onCreateNewTask={handleAddTaskToSection}
          onSaveTask={(taskId, taskName, updatedTaskData) => saveTaskCallback(taskId, taskName, section.id, updatedTaskData)}
          projectMembers={projectMembers}
          projectStatus={projectStatus}
          handleContextMenu={handleContextMenu}
          canCreateTasks={canCreateTasks}
          isSaving={savingTasks.has(task._id)}
          inputRefs={inputRefs}
          editingTaskId={editingTaskId}
          onTaskNameInput={handleTaskNameInput}
          onTaskNameBlur={handleTaskNameBlur}
          onTaskKeyDown={handleTaskKeyDown}
          taskFilters={taskFilters}
          sectionId={section.id}
        />
      </SortableTask>
    );
  }, [selectedTasks, selectedTask, handleTaskSelect, handleTaskRowClick, handleToggleComplete, formatDate, projectStatus, canCreateTasks, editingTaskId, handleTaskNameInput, handleTaskNameBlur, handleTaskKeyDown, saveTaskCallback, taskFilters]);

  // Handle task add complete
  const handleTaskAddComplete = useCallback(() => {
    onTaskAddComplete && onTaskAddComplete();
  }, [onTaskAddComplete]);

  // Handle right-click event
  const handleContextMenu = (e, task) => {
    if (!canCreateTasks) {
      e.preventDefault(); // Prevent context menu for viewers
      return;
    }
    e.preventDefault(); // Prevent default browser context menu
    e.stopPropagation(); // Stop event bubbling

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }, // Mouse position
      task: task,
    });
  };

  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      task: null,
    });
  };

  // Define what menu items to show
  const getContextMenuItems = (task) => {
    // Return empty array if task is null
    if (!task) return [];

    // Check if it's a temporary task
    const isTempTask = task._id?.toString().startsWith('new-') || task.initial || task.isOptimistic;

    // For temp tasks, only show delete option
    if (isTempTask) {
      return [
        {
          label: "Delete task",
          icon: "heroicons:trash",
          onClick: (task) => {
            setTaskToDelete(task);
            setShowDeleteModal(true);
          },
        },
      ];
    }

    // For real tasks, show all options
    return [
      {
        label: "Open task detail",
        icon: "heroicons:eye",
        onClick: (task) => onTaskClick(task),
      },
      {
        label: "Open in new tab",
        icon: "majesticons:open",
        onClick: (task) => {
          const taskUrl = `${window.location.origin}/tasks?taskId=${task?._id}&isFocused=true`;
          window.open(taskUrl, "_blank", "noopener,noreferrer");
        },
      },
      {
        label: "Copy task link",
        icon: "heroicons:link",
        onClick: (task) => {
          const taskUrl = `${window.location.origin}/tasks?taskId=${task?._id}&isFocused=true`;
          navigator.clipboard.writeText(taskUrl);
          toast.success("Task link copied to clipboard");
        },
      },
      {
        label: "Delete task",
        icon: "heroicons:trash",
        onClick: (task) => {
          setTaskToDelete(task);
          setShowDeleteModal(true);
        },
      },
    ];
  };

  // Handle outside clicks and escape key to close context menu
  useEffect(() => {
    if (!contextMenu.isOpen) return;

    // Add a small delay to prevent immediate closing when context menu opens
    // This prevents the right-click event from immediately triggering a click that closes the menu
    const handleClickOutside = (e) => {
      // Don't close if clicking inside the context menu
      if (e.target.closest('.context-menu-container')) {
        return;
      }
      closeContextMenu();
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    // Attach listeners after a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("keydown", handleEscapeKey);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [contextMenu.isOpen]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);

    try {
      // Check if it's a temporary task (not yet saved to server)
      const isTempTask = taskToDelete._id?.toString().startsWith('new-') ||
        taskToDelete.initial ||
        taskToDelete.isOptimistic;

      if (isTempTask) {
        // For temp tasks, just remove from state (no API call needed)
        const section = sections.find(s =>
          s.tasks?.some(t => t._id === taskToDelete._id)
        );

        if (section) {
          dispatch(removeTemporaryTask({
            sectionId: section.id,
            taskId: taskToDelete._id
          }));

        }
      } else {
        // For real tasks, delete from server
        await dispatch(
          bulkDeleteTasksAsync({ taskIds: [taskToDelete._id] })
        ).unwrap();

      }

      // Close modal + reset
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error || "Failed to delete task", { autoClose: 3000 });
    } finally {
      setIsDeleting(false);
    }
  };

  // Event delegation handler for table interactions - OPTIMIZED
  const handleTableClick = useCallback((e) => {
    const target = e.target;
    const taskRow = target.closest('.task-row');

    if (!taskRow) return;

    // Get task ID from data attribute
    const taskId = taskRow.dataset.taskId;
    if (!taskId) return;

    // Handle specific element clicks using event delegation
    const clickedElement = target.closest('[data-action]');
    if (clickedElement) {
      const action = clickedElement.dataset.action;

      // Find the task only when needed
      let task = null;
      for (const section of sections) {
        task = section.tasks?.find(t =>
          (t._id && t._id.toString() === taskId) ||
          (t.taskId && t.taskId.toString() === taskId)
        );
        if (task) break;
      }

      if (!task) return;

      switch (action) {
        case 'select':
          if (canCreateTasks) {
            e.stopPropagation();
            handleTaskSelect(taskId);
          }
          break;
        case 'toggle-complete':
          e.stopPropagation();
          handleToggleComplete(task);
          break;
        case 'open-comments':
          e.stopPropagation();
          handleTaskRowClick(task, e, null, "comments");
          break;
        case 'open-attachments':
          e.stopPropagation();
          handleTaskRowClick(task, e, null, "attachments");
          break;
        case 'open-subtasks':
          e.stopPropagation();
          handleTaskRowClick(task, e, null, "subtasks");
          break;
        case 'open-time-logs':
          e.stopPropagation();
          handleTaskRowClick(task, e, null, "time-logs");
          break;
        case 'open-task':
          e.stopPropagation();
          handleTaskRowClick(task, e);
          break;
        default:
          break;
      }
    }
  }, [canCreateTasks, sections, handleTaskSelect, handleToggleComplete, handleTaskRowClick]);

  return (
    <div
      className="bg-white dark:bg-gray-800 shadow sm:rounded-lg section-task-container"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <Icon icon="heroicons:check-circle" className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Drag Feedback */}
      {/*  {dragFeedback && (
        <div className="drag-feedback">
          <Icon icon="heroicons:arrows-pointing-out" className="w-4 h-4" />
          <span>{dragFeedback}</span>
        </div>
      )} */}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div
          className="flex-1 overflow-y-auto"
          ref={(el) => {
            scrollContainersRef.current['main'] = el;
          }}
        >
          <table className="min-w-full table-fixed" onClick={handleTableClick}>
            <thead className="bg-white sticky top-0 z-10 h-12 dark:bg-slate-800 border-b border-[#E1E1E1] dark:border-slate-700">
              <tr>

                <th className="w-[3.5%] pl-14 pr-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('id')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    ID
                    {sortConfig.key === 'id' && (
                      <Icon
                        icon={sortConfig.direction === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </button>
                </th>
                <th className="w-[calc(100%-480px)] pl-8 pr-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center uppercase gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Name
                    {sortConfig.key === 'name' && (
                      <Icon
                        icon={sortConfig.direction === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </button>
                </th>
                <th className="w-[50px] px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  <button
                    onClick={() => handleSort('time')}
                    className="flex items-center justify-center uppercase gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mx-auto"
                  >
                    Time
                    {sortConfig.key === 'time' && (
                      <Icon
                        icon={sortConfig.direction === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </button>
                </th>
                <th className="w-[110px] px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Assignee
                </th>
                <th className="w-[100px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center uppercase gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Due Date
                    {sortConfig.key === 'dueDate' && (
                      <Icon
                        icon={sortConfig.direction === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </button>
                </th>
                <th className="w-[70px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 uppercase hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Priority
                    {sortConfig.key === 'priority' && (
                      <Icon
                        icon={sortConfig.direction === 'asc' ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-3 h-3"
                      />
                    )}
                  </button>
                </th>
                <th className="w-[90px] pl-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="w-[35px] px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  View
                </th>
              </tr>
            </thead>

            <SortableContext
              items={sortedSections.map(s => `section-${s.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white dark:bg-gray-800">
                {sortedSections.map((section, sectionIndex) => (
                  <SortableSection
                    key={section.id?.toString() || `temp-section-${sectionIndex}`}
                    section={section}
                    sectionIndex={sectionIndex}
                  >
                    {(sortableProps) => (
                      <React.Fragment>
                        {/* Section Header */}
                        <tr ref={sortableProps.ref} style={sortableProps.style}>
                          <td colSpan="9" className="p-0">
                            <SectionHeader
                              section={section}
                              onToggle={onSectionToggle}
                              onSelectAll={handleSectionSelectAll}
                              onAddTask={handleAddTaskToSection}
                              selectedCount={getSectionSelectedCount(
                                section.tasks || [],
                              )}
                              totalCount={section.tasks?.length || 0}
                              canCreateTasks={canCreateTasks}
                              isDragging={sortableProps.isDragging}
                              dragHandleProps={sortableProps.dragHandleProps}
                              dragAttributes={sortableProps.dragAttributes}
                            />
                          </td>
                        </tr>

                        {/* Section Tasks */}
                        {!section.isCollapsed && (
                          <VirtualizedTaskList
                            section={section}
                            initialLoadingSections={initialLoadingSections}
                            getSortedTasks={getSortedTasks}
                            renderTask={renderTask}
                          />
                        )}
                      </React.Fragment>
                    )}
                  </SortableSection>
                ))}

                {/* Empty State */}
                {(!sections || sections.length === 0) && (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center">
                      <div className="text-slate-500 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
                          <Icon
                            icon="heroicons:folder-open"
                            className="w-12 h-12 text-slate-400 dark:text-slate-500"
                          />
                        </div>
                        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">
                          No sections found
                        </h3>
                        <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                          Create your first section to organize and manage your tasks effectively
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>

          {/* Add Section Row - Styled like a table row */}
          <div className="flex items-center w-full px-6 py-0 " >
            {/* Add section button */}

            <ModernTooltip
              content={
                !canCreateTasks
                  ? "🚫 Access Restricted:"
                  : "Add new section"
              }
              placement="top"
              theme="custom-light"
            >
              <div className="inline-block">
                <button
                  onClick={() => canCreateTasks && setShowCreateSectionModal(true)}
                  disabled={!canCreateTasks}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${canCreateTasks
                    ? "text-[#7A39FF] hover:text-[#6A2FFF] hover:bg-[#7A39FF]/10 dark:hover:bg-[#7A39FF]/20 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                >
                  <Icon icon="heroicons:plus" className="w-5 h-5" />
                  Add section
                </button>
              </div>
            </ModernTooltip>
          </div>


        </div>

        {/* Drag Overlay for visual feedback */}
        <DragOverlay dropAnimation={null}>
          {activeId && activeData ? (
            activeData.type === "section" ? (
              // Section drag overlay
              <div className="bg-white dark:bg-slate-800 shadow-xl rounded border border-blue-500 opacity-95">
                <div className="group section-row border-b border-slate-100 dark:border-gray-700 bg-white dark:bg-slate-800 w-full">
                  <div className="flex items-center justify-between w-full px-1 py-1">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 text-slate-400 dark:text-slate-500 rounded">
                        <Icon icon="heroicons:bars-3" className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {activeData.section?.name || "Section"}
                      </h3>
                      <span className="inline-flex items-center justify-center min-w-[40px] h-5 px-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                        {activeData.section?.taskCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Task drag overlay - render actual task row
              <table className="min-w-full table-fixed bg-white dark:bg-slate-800 shadow-xl rounded border-2 border-blue-500 opacity-95">
                <tbody>
                  <tr className="bg-white dark:bg-slate-800">
                    {/* Checkbox */}
                    <td className="px-1 py-1 whitespace-nowrap w-6 hidden md:table-cell">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox rounded text-blue-500 w-3 h-3"
                          disabled
                        />
                      </div>
                    </td>

                    {/* Task ID */}
                    <td className="pl-1 pr-1 py-1 whitespace-nowrap w-20">
                      <div className="flex items-center space-x-1">
                        <div className="cursor-grab p-0.5 text-slate-400 rounded">
                          <Icon icon="heroicons:bars-3" className="w-3 h-3" />
                        </div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {activeData.task?.taskCode || ""}
                        </div>
                      </div>
                    </td>

                    {/* Task Name */}
                    <td className="pl-2 pr-2 py-1 md:pl-2 md:pr-2">
                      <div className="flex items-center w-full">
                        <div className="min-w-[28px] mr-1.5 flex justify-center">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                        </div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {activeData.task?.taskName || "Task"}
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="w-[50px] px-1 py-1 text-center hidden md:table-cell">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {activeData.task?.total_time || "00:00:00"}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="w-[110px] px-4 py-1 hidden md:table-cell">
                      <div className="flex -space-x-2">
                        {activeData.task?.assigned_users?.slice(0, 3).map((user, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300"
                          >
                            {user.first_name?.[0] || user.username?.[0] || "?"}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="w-[100px] px-2 py-1 hidden md:table-cell">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {activeData.task?.dueDate ? moment(activeData.task.dueDate).format("MMM DD, YYYY") : "No due date"}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="w-[70px] px-2 py-1 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${activeData.task?.priority === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        : activeData.task?.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        }`}>
                        {activeData.task?.priority || "low"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="w-[90px] pl-2 py-1 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                        {activeData.task?.taskPosition || "pending"}
                      </span>
                    </td>

                    {/* View */}
                    <td className="w-[35px] px-1 py-1 text-center hidden md:table-cell">
                      <Icon icon="heroicons:eye" className="w-4 h-4 text-slate-400 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Section Modal */}
      <CreateSectionModal
        isOpen={showCreateSectionModal}
        onClose={() => setShowCreateSectionModal(false)}
      />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={getContextMenuItems(contextMenu.task)}
        task={contextMenu.task}
      />

      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 z-[112] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="bg-[#FFEAE7] rounded-full p-2 mb-4">
                <Icon
                  icon="fluent:error-circle-48-regular"
                  className="text-customRed-50"
                  width="30"
                  height="30"
                />
              </div>
              <h3 className="text-lg font-bold mb-2 text-center">
                Delete Task
              </h3>
              <p className="text-sm text-center mb-4">
                Are you sure you want to delete{" "}
                <b>{taskToDelete.taskName || "this task"}</b>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🚀 OPTIMIZED WITH MEMO - Only re-renders when sections or props change
export default memo(SectionTaskTable, (prevProps, nextProps) => {
  // Compare sections prop
  const sectionsEqual = JSON.stringify(prevProps.sections || []) === JSON.stringify(nextProps.sections || []);

  // Compare selectedTasks prop
  const selectedTasksEqual = JSON.stringify(prevProps.selectedTasks || []) === JSON.stringify(nextProps.selectedTasks || []);

  // Compare projectMembers prop (important for assignee dropdown)
  const projectMembersEqual = JSON.stringify(prevProps.projectMembers || []) === JSON.stringify(nextProps.projectMembers || []);

  // Compare projectStatus prop (important for status dropdown options)
  const projectStatusEqual = JSON.stringify(prevProps.projectStatus || []) === JSON.stringify(nextProps.projectStatus || []);

  // Compare other props
  const otherPropsEqual =
    prevProps.onTaskSelect === nextProps.onTaskSelect &&
    prevProps.onTaskClick === nextProps.onTaskClick &&
    prevProps.onSectionToggle === nextProps.onSectionToggle &&
    prevProps.addingTaskToSection === nextProps.addingTaskToSection &&
    prevProps.onAddTaskToSection === nextProps.onAddTaskToSection &&
    prevProps.onTaskAddComplete === nextProps.onTaskAddComplete &&
    prevProps.handleContextMenu === nextProps.handleContextMenu &&
    prevProps.canCreateTasks === nextProps.canCreateTasks;

  // Only re-render if any of these props actually changed
  return sectionsEqual && selectedTasksEqual && projectMembersEqual && projectStatusEqual && otherPropsEqual;
});
