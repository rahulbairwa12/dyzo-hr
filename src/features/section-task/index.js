// Main components
export { default as SectionTaskPage } from "./components/SectionTaskPage";
export { default as SectionHeader } from "./components/SectionHeader";
export { default as TaskItem } from "./components/TaskItem";
export { default as SectionTaskHeader } from "./components/SectionTaskHeader";
export { default as SectionTaskTable } from "./components/SectionTaskTable";
export { default as AddTaskForm } from "./components/AddTaskForm";
export { default as AddSectionForm } from "./components/AddSectionForm";
export { default as InlineTaskAdd } from "./components/InlineTaskAdd";
export { default as EditableTaskRow } from "./components/EditableTaskRow";
export { default as SectionTaskPanel } from "./components/SectionTaskPanel";

// Redux store
export { default as sectionTaskReducer } from "./store/sectionTaskSlice";

// Actions
export {
  fetchSectionTasks,
  createTaskInSection,
  updateTaskInSection,
  deleteTaskFromSection,
  moveTaskBetweenSections,
  createNewSection,
  toggleSectionCollapse,
  setSelectedSection,
  toggleTaskSelection,
  selectAllTasksInSection,
  clearSelectedTasks,
  setSelectedTask,
  toggleTaskPanel,
  setFilters,
  resetFilters,
  setSearchResults,
  setSearching,
  setDraggedTask,
  updateTaskLocally,
  reorderTasksInSection,
  updateSectionName,
} from "./store/sectionTaskSlice";

// Selectors
export {
  selectAllSections,
  selectSectionById,
  selectTaskById,
  selectSelectedTasks,
  selectFilters,
  selectIsLoading,
  selectTaskStats,
  selectMetadata,
} from "./store/sectionTaskSlice";
