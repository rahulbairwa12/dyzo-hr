import React from "react";

const ListSkeleton = () => {
  return (
    <div className="w-full">
      {Array(4)
        .fill()
        .map((_, index) => (
          <div key={index} className="mb-4 p-3 border-b border-slate-100 dark:border-slate-700">
            <div role="status" className="w-full animate-pulse mx-2">
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 max-w-[280px] mb-2.5"></div>
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 max-w-[150px] mb-2.5"></div>
              <div className="h-[10px] bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>

              <div className="flex items-center justify-between pt-4 mt-5">
                <div>
                  <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                  <div className="w-32 h-[10px] bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-5">
                <div>
                  <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                  <div className="w-32 h-[10px] bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-5">
                <div>
                  <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
                  <div className="w-32 h-[10px] bg-gray-200 rounded-full dark:bg-gray-700"></div>
                </div>
                <div className="h-[10px] bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default ListSkeleton;
