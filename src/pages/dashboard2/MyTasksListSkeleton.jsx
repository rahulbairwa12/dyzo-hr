import React from 'react';

const MyTasksListSkeleton = ({skeletonRows}) => (
  <ul className="list-none p-0 m-0 divide-y divide-gray-100 dark:divide-slate-700 pr-5">
    {skeletonRows.map((_, i) => (
      <li key={i} className="flex justify-between items-center py-3 text-[16px] animate-pulse">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 mr-2 block" />
          <span className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-1 block" />
        </div>
        <span className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded block" />
      </li>
    ))}
  </ul>
);

export default MyTasksListSkeleton; 