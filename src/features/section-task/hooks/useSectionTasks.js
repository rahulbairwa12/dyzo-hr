import { useSelector, useDispatch } from "react-redux";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  fetchSectionTasks,
  createNewSection,
  createTaskInSection,
  updateTaskInSection,
  deleteTaskFromSection,
  swapSectionOrder,
  swapSectionOrderOptimistic,
  changeTaskSection,
  toggleSectionCollapse,
  toggleTaskSelection,
  clearSelectedTasks,
  setSelectedTask,
  toggleTaskPanel,
  setFilters,
  resetFilters,
  selectAllSections,
  selectSelectedTasks,
  selectIsLoading,
  selectFilters,
  selectMetadata,
  selectTaskById,
  selectSectionById,
  // 🆕 Separate APIs for sections and tasks
  fetchSectionsPaginated,
  fetchTasksPaginated,
  applyFiltersToAllExpandedSections,
  // 🆕 Bulk operations
  bulkDeleteTasksAsync,
  bulkUpdateTasksAsync,
} from "../store/sectionTaskSlice";
import { updateTask as updateTaskAPI } from "@/features/tasks/store/tasksSlice";
import { getDefaultProjectId } from "../utils/apiUtils";

/**
 * Custom hook for managing section tasks
 * Provides a clean interface for components to interact with section tasks
 */
export const useSectionTasks = (projectId = getDefaultProjectId()) => {
  const dispatch = useDispatch();

  // Selectors
  const sections = useSelector(selectAllSections);
  const selectedTasks = useSelector(selectSelectedTasks);
  const isLoading = useSelector(selectIsLoading);
  const filters = useSelector(selectFilters);
  const metadata = useSelector(selectMetadata);



  // Computed values
  const totalTasks = useMemo(() => {
    return sections.reduce((total, section) => total + section.tasks.length, 0);
  }, [sections]);

  const totalSections = useMemo(() => sections.length, [sections]);

  const hasSelectedTasks = useMemo(
    () => selectedTasks.length > 0,
    [selectedTasks],
  );

  const selectedTasksCount = useMemo(
    () => selectedTasks.length,
    [selectedTasks],
  );

  // Get tasks by section
  const getTasksBySection = useCallback(
    (sectionId) => {
      const section = sections.find((s) => s.id === sectionId);
      return section?.tasks || [];
    },
    [sections],
  );

  // Get section by ID
  const getSectionById = useCallback(
    (sectionId) => {
      return sections.find((s) => s.id === sectionId);
    },
    [sections],
  );

  // Get task by ID (searches across all sections)
  const getTaskById = useCallback(
    (taskId) => {
      for (const section of sections) {
        // Try multiple matching strategies
        const task = section.tasks.find(
          (task) => 
            task._id === taskId || 
            task.taskId === taskId ||
            task._id === taskId.toString() ||
            task.taskId === taskId.toString() ||
            task._id === parseInt(taskId) ||
            task.taskId === parseInt(taskId)
        );
        if (task) {
          return task;
        }
      }
      return null;
    },
    [sections],
  );

  // Actions
  const actions = useMemo(
    () => ({
      // Fetch operations - 🆕 Using separate APIs
      fetchSections: () => dispatch(fetchSectionsPaginated({ 
        projectId, 
        filters: {},
        /* page: 1,
        pageSize: 3, */
        append: false 
      })),
      refreshSections: () => dispatch(fetchSectionsPaginated({ 
        projectId, 
        filters: {},
        page: 1,
        pageSize: 20,
        append: false 
      })),

      // Section operations
      createSection: (sectionData) =>
        dispatch(
          createNewSection({
            ...sectionData,
            projectId,
          }),
        ),

      swapSections: async (firstSectionId, secondSectionId) => {
        try {
          // Optimistic update first
          dispatch(
            swapSectionOrderOptimistic({
              firstSectionId,
              secondSectionId,
            }),
          );

          // API call in background
          await dispatch(
            swapSectionOrder({
              firstSectionId,
              secondSectionId,
              projectId,
            }),
          ).unwrap();

          toast.success("Section order updated successfully");
          return true;
        } catch (error) {
          toast.error("Failed to update section order");
          console.error("Section swap failed:", error);
          return false;
        }
      },

      toggleSectionCollapse: (sectionId) =>
        dispatch(toggleSectionCollapse(sectionId)),

      // Task operations
      createTask: async (sectionId, taskData) => {
        try {
          await dispatch(createTaskInSection({ sectionId, taskData })).unwrap();
          return true;
        } catch (error) {
          console.error("Failed to create task:", error);
          return false;
        }
      },

      updateTask: async (taskId, updates) => {
        try {
          await dispatch(updateTaskInSection({ taskId, updates })).unwrap();
          toast.success("Task updated successfully");
          return true;
        } catch (error) {
          toast.error(error || "Failed to update task");
          console.error("Task update failed:", error);
          return false;
        }
      },

      updateTaskWithAPI: async (taskId, updates) => {
        try {
          // Use the main tasks API for backend updates
          await dispatch(updateTaskAPI({ taskId, data: updates })).unwrap();

          // Also update the local section-task state with forceUpdate flag
          await dispatch(updateTaskInSection({ taskId, updates, forceUpdate: true })).unwrap();

          toast.success("Task updated successfully");
          return true;
        } catch (error) {
          toast.error(error || "Failed to update task");
          console.error("Task update failed:", error);
          return false;
        }
      },

      toggleTaskComplete: async (taskId, taskObject = null) => {
        // Use the task object if provided, otherwise look it up
        let task = taskObject;
        if (!task) {
          task = getTaskById(taskId);
        }
      
        
        if (!task) {
          console.error("Task not found for ID:", taskId);
          return false;
        }
        
        const isCurrentlyComplete = task.taskPosition === "completed";
        const newIsComplete = !isCurrentlyComplete;
        const newTaskPosition = newIsComplete ? "completed" : "pending";
        
        const updates = {
          isComplete: newIsComplete,
          taskPosition: newTaskPosition,
        };

        try {
          const result = await dispatch(updateTaskInSection({ taskId: task._id, updates,skipChangeDetection: true,forceUpdate: true})).unwrap();
          toast.success(
            `Task marked as ${newTaskPosition === "completed" ? "completed" : "incomplete"}`,
          );
          return result;
        } catch (error) {
          console.error("Task status update failed:", error);
          toast.error("Failed to update task status");
          return false;
        }
      },

      updateTaskPriority: async (taskId, priority) => {
        try {
          await dispatch(
            updateTaskInSection({
              taskId,
              updates: { priority },
            }),
          ).unwrap();
          toast.success(`Task priority updated to ${priority}`);
          return true;
        } catch (error) {
          toast.error("Failed to update task priority");
          console.error("Task priority update failed:", error);
          return false;
        }
      },

      updateTaskDueDate: async (taskId, dueDate) => {
        try {
          await dispatch(
            updateTaskInSection({
              taskId,
              updates: { dueDate },
            }),
          ).unwrap();
          toast.success("Task due date updated");
          return true;
        } catch (error) {
          toast.error("Failed to update task due date");
          console.error("Task due date update failed:", error);
          return false;
        }
      },

      deleteTask: (taskId) => dispatch(deleteTaskFromSection({ taskId })),

      moveTaskToSection: async (taskId, newSectionId, oldSectionId) => {
        try {
          await dispatch(
            changeTaskSection({ taskId, newSectionId, oldSectionId }),
          ).unwrap();
          const newSection = getSectionById(newSectionId);
          toast.success(`Task moved to ${newSection?.name || "new section"}`);
          return true;
        } catch (error) {
          toast.error("Failed to move task to new section");
          console.error("Task move failed:", error);
          return false;
        }
      },

      // Selection operations
      selectTask: (taskId) => dispatch(toggleTaskSelection(taskId)),

      clearSelectedTasks: () => dispatch(clearSelectedTasks()),

      setSelectedTask: (task) => dispatch(setSelectedTask(task)),

      // Panel operations
      openTaskPanel: (task) => {
        dispatch(setSelectedTask(task));
        dispatch(toggleTaskPanel(true));
      },

      closeTaskPanel: () => {
        dispatch(setSelectedTask(null));
        dispatch(toggleTaskPanel(false));
      },

      // Filter operations - 🆕 Using server-side filtering
      applyFilters: (filterData) => dispatch(applyFiltersToAllExpandedSections(filterData)),

      resetFilters: () => {
        dispatch(resetFilters());
        // Also fetch fresh data without filters for expanded sections
        const expandedSections = sections.filter(section => !section.isCollapsed);
        expandedSections.forEach(section => {
          dispatch(fetchTasksPaginated({
            sectionId: section.id,
            filters: {},
            page: 1, // Always start with page 1 for tasks
            pageSize: 15, // Fixed page size for tasks
            append: false
          }));
        });
      },

      // 🆕 Load more operations using separate APIs
      loadMoreSections: () => dispatch(fetchSectionsPaginated({
        projectId,
        filters: filters || {},
        page: 1, // Will be calculated in the thunk
        pageSize: 20,
        append: true
      })),

                loadMoreTasksInSection: (sectionId) => dispatch(fetchTasksPaginated({
        sectionId,
        filters: filters || {},
        page: 1, // Will be calculated in the thunk based on current state
        pageSize: 15, // Fixed page size for tasks
        append: true
      })),

      // 🆕 Bulk operations
      bulkDeleteTasks: async (taskIds) => {
        try {
          // The thunk now handles filtering temp vs real tasks
          await dispatch(bulkDeleteTasksAsync({ taskIds })).unwrap();
          return true;
        } catch (error) {
          console.error("Failed to delete tasks:", error);
          return false;
        }
      },

      bulkUpdateTasks: async (taskIds, updates) => {
        try {
          // The thunk now handles filtering temp vs real tasks
          await dispatch(bulkUpdateTasksAsync({ taskIds, updates })).unwrap();
          return true;
        } catch (error) {
          console.error("Failed to update tasks:", error);
          return false;
        }
      },
    }),
    [dispatch, projectId],
  );

  // 🚫 REMOVED CLIENT-SIDE FILTERING - Now handled by server
  // Tasks are already filtered by the API, so we return sections directly
  const filteredSections = sections;

  // Get statistics
  const statistics = useMemo(() => {
    const stats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      notStarted: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    };

    sections.forEach((section) => {
      section.tasks.forEach((task) => {
        stats.total++;

        // Count by status
        switch (task.taskPosition) {
          case "completed":
            stats.completed++;
            break;
          case "in_progress":
            stats.inProgress++;
            break;
          case "pending":
            stats.pending++;
            break;
          case "not_started_yet":
            stats.notStarted++;
            break;
        }

        // Count by priority
        switch (task.priority) {
          case "high":
            stats.highPriority++;
            break;
          case "medium":
            stats.mediumPriority++;
            break;
          case "low":
            stats.lowPriority++;
            break;
        }
      });
    });

    return stats;
  }, [sections]);

  // Utility functions
  const utils = useMemo(
    () => ({
      // Check if a task is selected
      isTaskSelected: (taskId) => selectedTasks.includes(taskId),

      // Get selected tasks data
      getSelectedTasksData: () => {
        return selectedTasks
          .map((taskId) => getTaskById(taskId))
          .filter(Boolean);
      },

      // Check if section is collapsed
      isSectionCollapsed: (sectionId) => {
        const section = getSectionById(sectionId);
        return section?.isCollapsed || false;
      },

      // Get tasks count by status
      getTaskCountByStatus: (status) => {
        return sections.reduce((count, section) => {
          return (
            count +
            section.tasks.filter((task) => task.taskPosition === status).length
          );
        }, 0);
      },

      // Get tasks count by priority
      getTaskCountByPriority: (priority) => {
        return sections.reduce((count, section) => {
          return (
            count +
            section.tasks.filter((task) => task.priority === priority).length
          );
        }, 0);
      },



      // Get task validation errors
      validateTask: (task) => {
        const errors = [];
        if (!task.taskName?.trim()) {
          errors.push("Task name is required");
        }
        if (task.taskName && task.taskName.length > 200) {
          errors.push("Task name is too long");
        }
        if (task.dueDate && new Date(task.dueDate) < new Date()) {
          errors.push("Due date cannot be in the past");
        }
        return errors;
      },
    }),
    [sections, selectedTasks, getTaskById, getSectionById],
  );

  return {
    // Data
    sections: filteredSections,
    allSections: sections, // Unfiltered sections
    selectedTasks,
    filters,
    metadata,
    statistics,

    // State
    isLoading,
    hasSelectedTasks,
    selectedTasksCount,
    totalTasks,
    totalSections,

    // Actions
    ...actions,

    // Getters
    getTasksBySection,
    getSectionById,
    getTaskById,

    // Utilities
    ...utils,
  };
};

// Hook for a specific section
export const useSection = (sectionId) => {
  const dispatch = useDispatch();
  const section = useSelector(selectSectionById(sectionId));
  const isLoading = useSelector(selectIsLoading);

  const actions = useMemo(
    () => ({
      toggleCollapse: () => dispatch(toggleSectionCollapse(sectionId)),
      createTask: (taskData) =>
        dispatch(createTaskInSection({ sectionId, taskData })),
      updateSection: (updates) => {
        // This would need to be implemented in the slice
      },
    }),
    [dispatch, sectionId],
  );

  return {
    section,
    isLoading,
    tasks: section?.tasks || [],
    tasksCount: section?.tasks?.length || 0,
    isCollapsed: section?.isCollapsed || false,
    ...actions,
  };
};

// Hook for a specific task
export const useTask = (taskId) => {
  const dispatch = useDispatch();
  const task = useSelector(selectTaskById(taskId));
  const isLoading = useSelector(selectIsLoading);

  const actions = useMemo(
    () => ({
      update: (updates) => dispatch(updateTaskInSection({ taskId, updates })),
      delete: () => dispatch(deleteTaskFromSection({ taskId })),
      select: () => dispatch(setSelectedTask(task)),
      moveToSection: (newSectionId, oldSectionId) =>
        dispatch(changeTaskSection({ taskId, newSectionId, oldSectionId })),
    }),
    [dispatch, taskId, task],
  );

  return {
    task,
    isLoading,
    exists: !!task,
    ...actions,
  };
};

export default useSectionTasks;
