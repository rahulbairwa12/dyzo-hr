import React from "react";

const TaskTableSkeleton = ({ rowCount = 10 }) => {
  return (
    <div className="hidden md:block responsive-table-container min-h-[75vh]">
      <table className="min-w-full animate-pulse">
        {/* Table Header */}
        <thead className="bg-white dark:bg-slate-800 border-b border-[#E1E1E1] dark:border-slate-700">
          <tr>
            {/* Checkbox */}
            <th className="w-10 px-2 py-2">
              <div className="h-3 w-3 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* ID */}
            <th className="w-16 px-2 py-2">
              <div className="h-3 w-8 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Task Name */}
            <th className="px-2 py-2 min-w-[300px] w-[35%]">
              <div className="h-3 w-24 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Project */}
            <th className="px-2 py-2 min-w-[120px] w-[12%]">
              <div className="h-3 w-16 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Time */}
            <th className="w-[70px] px-2 py-2">
              <div className="h-3 w-12 rounded bg-slate-300 dark:bg-slate-600 mx-auto"></div>
            </th>
            {/* Assignees */}
            <th className="w-[160px] px-2 py-2">
              <div className="h-3 w-20 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Priority */}
            <th className="w-[80px] px-2 py-2">
              <div className="h-3 w-14 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Due Date */}
            <th className="w-[100px] px-2 py-2">
              <div className="h-3 w-16 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Status */}
            <th className="w-[120px] px-2 py-2">
              <div className="h-3 w-14 rounded bg-slate-300 dark:bg-slate-600"></div>
            </th>
            {/* Open Icon */}
            <th className="w-[40px] px-2 py-2"></th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-white divide-y divide-[#E1E1E1] dark:bg-slate-800 dark:divide-slate-700">
          {Array(rowCount)
            .fill(0)
            .map((_, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-700/20"}
              >
                {/* Checkbox */}
                <td className="px-2 py-3">
                  <div className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-600"></div>
                </td>

                {/* Task ID */}
                <td className="px-2 py-3">
                  <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-600"></div>
                </td>

                {/* Task Name */}
                <td className="px-2 py-3">
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-600"></div>
                    <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-600"></div>
                  </div>
                </td>

                {/* Project */}
                <td className="px-2 py-3">
                  <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-600"></div>
                </td>

                {/* Time Logged */}
                <td className="px-2 py-3 text-center">
                  <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-600 mx-auto"></div>
                </td>

                {/* Assignees */}
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                  </div>
                </td>

                {/* Priority */}
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                    <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-600"></div>
                  </div>
                </td>

                {/* Due Date */}
                <td className="px-2 py-3">
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-600"></div>
                </td>

                {/* Status */}
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                    <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-600"></div>
                  </div>
                </td>

                {/* Open Icon */}
                <td className="px-2 py-3 text-center">
                  <div className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-600 mx-auto"></div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTableSkeleton;