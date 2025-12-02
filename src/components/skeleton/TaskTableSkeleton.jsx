import React from 'react';

const TaskTableSkeleton = ({ rows = 10 }) => {
  return (
    <div className="animate-pulse">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
            <th className="w-[50px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-4"></div>
            </th>
            <th className="w-[80px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </th>
            <th className="w-[300px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </th>
            <th className="w-[200px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </th>
            <th className="w-[150px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </th>
            <th className="w-[150px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </th>
            <th className="w-[100px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-4"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTableSkeleton; 