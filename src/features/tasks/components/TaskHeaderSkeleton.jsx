import React from "react";

const TaskHeaderSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      {/* Tabs Skeleton */}
      <div className="flex border-b border-[#E1E1E1] dark:border-slate-700">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="px-1.5 py-2.5 flex items-center">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
        ))}
        
        <div className="ml-auto flex items-center gap-2">
          {/* Filter Tags Skeleton */}
          <div className="flex items-center gap-2">
            {[1, 2].map((index) => (
              <div key={index} className="inline-flex items-center rounded-full bg-white border border-slate-200 dark:border-slate-700 px-3 py-0.5">
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-600"></div>
              </div>
            ))}
          </div>
          
          {/* Filter Button Skeleton */}
          <div className="flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5">
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
          
          {/* Add Task Button Skeleton */}
          <div className="flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded-full px-3 py-1.5">
            <div className="h-4 w-20 rounded bg-slate-300 dark:bg-slate-500"></div>
          </div>
        </div>
      </div>
      
      {/* Search Bar Skeleton */}
      <div className="flex flex-wrap gap-3 mt-4 mb-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="w-full max-w-[300px] h-9 rounded-md bg-slate-200 dark:bg-slate-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskHeaderSkeleton; 