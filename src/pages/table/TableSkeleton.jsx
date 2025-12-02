import React from "react";

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                    <tr>
                        {Array(columns)
                            .fill()
                            .map((_, i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse" />
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array(rows)
                        .fill()
                        .map((_, rowIndex) => (
                            <tr key={rowIndex} className="animate-pulse">
                                {Array(columns)
                                    .fill()
                                    .map((_, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4">
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                        </td>
                                    ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableSkeleton;
