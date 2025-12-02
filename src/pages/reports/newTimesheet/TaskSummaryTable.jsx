import React from "react";
import { Icon } from "@iconify/react";
import Card from "@/components/ui/Card";

const TaskSummaryTable = ({
  loading,
  getTableProps,
  getTableBodyProps,
  headerGroups,
  rows,
  prepareRow,
  columns,
  totalPages,
  renderPagination,
}) => {
  return (
    <Card className="mt-6" bodyClass="p-0">
      <div className="overflow-x-auto">
        {loading ? (
          // Skeleton Loader Table
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-slate-800">
              <tr>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="px-3 py-3 text-left text-sm">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {[...Array(15)].map((_, index) => (
                <tr key={index}>
                  {[...Array(7)].map((_, i) => (
                    <td key={i} className="px-3 py-2 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table {...getTableProps()} className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-slate-800">
              {headerGroups.map((headerGroup, i) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={column.id}
                      className="px-3 py-3 text-left text-sm font-semibold text-black-500 dark:text-gray-400 tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {column.render("Header")}
                        {column.isSorted && (
                          <Icon
                            icon={
                              column.isSortedDesc
                                ? "heroicons:chevron-down"
                                : "heroicons:chevron-up"
                            }
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700"
            >
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <Icon
                        icon="heroicons:document-text"
                        className="w-12 h-12 text-gray-300 mb-2"
                      />
                      <p>No tasks found for the selected criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} key={row.id}>
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          key={cell.column.id}
                          className="px-3 py-2 whitespace-nowrap"
                        >
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && renderPagination()}
    </Card>
  );
};

export default TaskSummaryTable;
