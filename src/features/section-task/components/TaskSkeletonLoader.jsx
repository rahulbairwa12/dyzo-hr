import React from "react";

const TaskSkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      {/* Generate 5 skeleton task rows for better loading representation */}
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className="flex items-center space-x-4 p-4 border-b border-slate-200 dark:border-slate-700"
        >
          {/* Task ID */}
          <div className="w-16">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
          </div>
          
          {/* Task Name */}
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
          
          {/* Time */}
          <div className="w-16 text-center">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mx-auto"></div>
          </div>
          
          {/* Assignee */}
          <div className="w-32">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
            </div>
          </div>
          
          {/* Due Date */}
          <div className="w-24">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
          
          {/* Priority */}
          <div className="w-20">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-12"></div>
          </div>
          
          {/* Status */}
          <div className="w-24">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
          </div>
          
          {/* View Button */}
          <div className="w-8">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskSkeletonLoader; 