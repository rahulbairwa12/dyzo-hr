import React from "react";
import { Icon } from "@iconify/react";

const TaskPanelSkeleton = ({from="task"}) => {
  return (
    <div className={`${from === "inbox" ? "w-full h-full" : from === "dashboard" ? "w-full sm:w-[90%] xl:w-2/3 h-[100vh] sm:h-[calc(100vh-120px)] mx-auto" : "fixed top-0 right-0 h-screen w-full sm:w-[600px]"} bg-white dark:bg-slate-800 shadow-xl z-50 overflow-hidden flex flex-col animate-pulse`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-600"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Task Title */}
        <div className="h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-600 mb-6"></div>

        {/* Task Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-600 mr-2"></div>
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
          <div className="flex items-center">
            <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-600 mr-2"></div>
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
          <div className="flex items-center">
            <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-600 mr-2"></div>
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-600 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-600"></div>
            <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-600"></div>
            <div className="h-4 w-4/6 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
        </div>

        {/* Comments */}
        <div>
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-600 mb-3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 mr-2"></div>
                  <div>
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-600 mb-1"></div>
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-600"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-600"></div>
                  <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-600"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="h-24 w-full rounded bg-slate-200 dark:bg-slate-600"></div>
        <div className="flex justify-end mt-2">
          <div className="h-10 w-24 rounded bg-slate-200 dark:bg-slate-600"></div>
        </div>
      </div>
    </div>
  );
};

export default TaskPanelSkeleton; 