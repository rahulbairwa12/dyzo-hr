// Import components
import TasksPage from './components/TasksPage';
import TaskTable from './components/TaskTable';
import TaskRow from './components/TaskRow';
import TaskPanel from './components/TaskPanel';
import TaskHeader from './components/TaskHeader';
import RecurringTaskTable from './components/RecurringTaskTable';
import RecurringTaskRow from './components/RecurringTaskRow';
import RecurringTaskBottomBar from './components/RecurringTaskBottomBar';
import RecurringTaskPanel from './components/RecurringTaskPanel';

// Re-export components
export {
  TasksPage,
  TaskTable,
  TaskRow,
  TaskPanel,
  TaskHeader,
  RecurringTaskTable,
  RecurringTaskRow,
  RecurringTaskBottomBar,
  RecurringTaskPanel,
};



export { default as TaskStatus } from './components/TaskStatus';
export { default as BottomBar } from './components/BottomBar';

// Export Redux slice and actions
export { 
  default as tasksReducer,
  setSelectedTask, 
  toggleTaskPanel,
  togglePanelVisibility,
  toggleTaskSelection, 
  selectAllTasks,
  setFilters,
  setActiveTab,
  setPage,
  setPageSize,
  updateTaskProperty,
  fetchTasks,
  fetchRecurringTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from './store/tasksSlice'; 

// Export task status slice and actions
export { 
  default as taskStatusReducer,
  fetchTaskStatuses 
} from './store/taskStatusSlice'; 