import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '@/components/ui/Modal';

export const DeleteRecurringTaskPopUp = ({ showModal, onClose, handleDelete, loading, taskCount = 0, selectedTasks = [] }) => {
  if (!showModal) return null;
  
  // Determine if we should show task details or just the count
  const showTaskDetails = selectedTasks && selectedTasks.length > 0 && selectedTasks.length <= 200;
  
  return (
    <div className="fixed inset-0 z-[112]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-10 text-center">
          <div className="rel12tive p-8 px-12 dark:bg-customBlack-200 dark:text-customWhite-50 transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-[400px] mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-[#FFEAE7] rounded-full p-1.5 mb-5">
                <div className="flex items-center justify-center p-1 rounded-full bg-[#F6D7D6]">
                  <Icon icon="fluent:error-circle-48-regular" className="text-customRed-50" width="30" height="30" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-customBlack-50 dark:text-customWhite-50" id="modal-title">Delete Recurring Tasks</h3>
              <div className="mt-2">
                <p className="text-base text-center text-customBlack-100 dark:text-customWhite-50">
                  Are you sure you want to delete {taskCount} recurring {taskCount === 1 ? 'task' : 'tasks'}?
                  <br />
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            {/* Show warning about many tasks */}
            {!showTaskDetails && taskCount > 5 && (
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-md text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icon icon="heroicons:information-circle" className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                  </div>
                  <div className="ml-2 md:ml-3">
                    <p>You are about to delete {taskCount} recurring tasks. Please review your selection carefully.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Task summary card for many tasks */}
            {!showTaskDetails && taskCount > 5 && selectedTasks && selectedTasks.length > 0 && (
              <div className="mt-3 md:mt-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-2 md:p-3">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Summary</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Projects summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:folder" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-indigo-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Projects</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.map(t => t.projectName || t.project).filter(Boolean)).size || '?'}
                      </div>
                    </div>
                    
                    {/* Frequency summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:arrow-path" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Frequencies</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.map(t => t.frequency).filter(Boolean)).size || '?'}
                      </div>
                    </div>
                    
                    {/* Assignees summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:user" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-green-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Assignees</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.flatMap(t => t.assigned_users || []).filter(Boolean)).size || '?'}
                      </div>
                    </div>
                    
                    {/* Total count */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:flag" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-red-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {taskCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-7 gap-5 sm:flex-row flex-col">
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 px-10 py-1.5 bg-neutral-150 text-customBlack-100 font-bold shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md px-10 py-1.5 bg-red-600 text-white font-semibold shadow-sm hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecurringTaskBottomBar = ({
  selectedTasks,
  deleteRecurringTasks,
  exportTasks,
  closeBottomBar,
  bulkLoading,
  modalIsOpen,
  setModalIsOpen,
  closePanel, // Added closePanel prop
  selectedTaskId, // Added selectedTaskId prop
}) => {
  // Ensure selectedTasks is always an array
  const normalizedSelectedTasks = Array.isArray(selectedTasks) ? selectedTasks : [];
  
  // Calculate task count once
  const taskCount = normalizedSelectedTasks.length;

  // We'll use modalIsOpen state for delete modal
  const openDeleteModal = () => {
    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("delete");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };
  
  const closeModal = () => {
    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  // Handle button click with safety checks
  const handleDeleteClick = () => {
    if (taskCount === 0) {
      toast.error("No tasks selected for deletion");
      return;
    }
    openDeleteModal();
  };

  // Modified to include refresh after operation
  const handleDeleteConfirm = async () => {
    if (typeof deleteRecurringTasks !== 'function') {
      console.error("deleteRecurringTasks is not a function");
      toast.error("Delete functionality is not available");
      return;
    }
    
    try {
      // Save the tasks being deleted
      const deletedIds = [...normalizedSelectedTasks];
      await deleteRecurringTasks();
      // Only close the panel if the open panel's task is among the deleted
      if (typeof closePanel === 'function' && deletedIds.includes(selectedTaskId)) {
        closePanel();
      } else {
        closeModal();
      }
    } catch (error) {
      console.error("Error deleting recurring tasks:", error);
      toast.error("Failed to delete tasks. Please try again.");
    }
  };

  const handleExportClick = () => {
    if (typeof exportTasks !== 'function') {
      console.error("exportTasks is not a function");
      toast.error("Export functionality is not available");
      return;
    }
    exportTasks();
  };

  const handleCloseClick = () => {
    if (typeof closeBottomBar !== 'function') {
      console.error("closeBottomBar is not a function");
      return;
    }
    closeBottomBar();
  };

  // Don't render if no tasks are selected
  if (taskCount === 0) {
    return null;
  }

  return (
    <div className="Bbar">
      <div className="BottomBar box-border border rounded-md shadow-[0px_15px_50px_rgba(0,0,0,0.3)] fixed bottom-0 md:bottom-20 bg-white flex flex-wrap md:flex-nowrap items-center justify-between border-t border-gray-200 w-full md:max-w-screen-md slide-up mx-auto dark:bg-slate-800 dark:border-slate-700 z-40">
        {/* Mobile view - Two rows layout */}
        <div className="flex flex-col w-full md:hidden">
          {/* Top row with count and close button */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 w-full">
            <div className="flex items-center">
              <div className="bg-appbg text-black-500 dark:text-white p-3 text-f16 font-semibold">
                {taskCount}
              </div>
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300 ml-2">
                {taskCount > 1 ? "Recurring tasks selected" : "Recurring task selected"}
              </span>
            </div>
            <div
              onClick={handleCloseClick}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Icon icon="material-symbols-light:close" className="w-6 h-6" />
            </div>
          </div>
          
          {/* Bottom row with action buttons */}
          <div className="grid grid-cols-2 w-full">
          
            <button
              className="flex flex-col items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleDeleteClick}
              disabled={taskCount === 0}
            >
              <Icon icon="fluent:delete-16-regular" className="text-f20 text-red-500 dark:text-red-400" />
              <span className="text-xs mt-1 text-red-500 dark:text-red-400">Delete</span>
            </button>
          </div>
        </div>
        
        {/* Desktop view */}
        <div className="hidden md:flex items-center md:space-x-4">
          <div className="bg-appbg text-black-500 dark:text-white rounded-tl rounded-bl p-3 md:p-5 text-f18 font-semibold">
            {taskCount}
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {taskCount > 1 ? "Recurring tasks selected" : "Recurring task selected"}
          </span>
        </div>
        <div className="hidden md:flex items-center w-auto justify-evenly md:space-x-4">
         
          <button
            className="flex items-center space-x-2 material-icons flex-col justify-center p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-red-600 dark:hover:text-red-400"
            onClick={handleDeleteClick}
            disabled={taskCount === 0}
          >
            <Icon icon="fluent:delete-16-regular" className="text-f24" />
            <span className="text-sm">Delete</span>
          </button>
          <div
            onClick={handleCloseClick}
            className="bg-appbg-600 text-appbg cursor-pointer rounded-tr rounded-br p-2 md:p-5 text-f18 border-l close-bottomBar hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon icon="material-symbols-light:close" className="m-0 p-0 w-8 h-8" />
          </div>
        </div>
      </div>

      {modalIsOpen === "delete" && (
        <DeleteRecurringTaskPopUp
          showModal={true}
          onClose={closeModal}
          handleDelete={handleDeleteConfirm}
          loading={bulkLoading}
          taskCount={taskCount}
          selectedTasks={normalizedSelectedTasks}
        />
      )}
    </div>
  );
};

export default RecurringTaskBottomBar; 