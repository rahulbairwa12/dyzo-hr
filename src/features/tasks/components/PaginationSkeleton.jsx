import React from "react";

const PaginationSkeleton = () => {
  return (
    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-600"></div>
          
          <div className="flex items-center space-x-2">
            <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-600"></div>
            <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-600"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
          
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-600"></div>
            ))}
          </div>
          
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
        </div>
      </div>
    </div>
  );
};

export default PaginationSkeleton; 