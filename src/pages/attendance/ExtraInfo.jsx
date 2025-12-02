import React, { useMemo, useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { useTable, useSortBy } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { djangoBaseURL } from "@/helper";
import { intialLetterName } from "@/helper/helper";
import { useSelector } from "react-redux";

const ExtraInfo = ({
    extraInfo,
    extraInfoLoading,
    extraInfoNextPage,
    extraInfoPrevPage,
    extraInfoCurrentPage,
    extraInfoTotalPages,
    extraInfoTotalCount,
    onPageChange,
    handlePageInputSubmit,
}) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [pageInput, setPageInput] = useState(extraInfoCurrentPage);
    const tableContainerRef = useRef(null); // Add ref for the table container

    useEffect(() => {
        setPageInput(extraInfoCurrentPage);
    }, [extraInfoCurrentPage]);

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        if (value && !isNaN(value) && value > 0 && value <= extraInfoTotalPages) {
            setPageInput(value);
            handlePageInputSubmit(Number(value));
        } else {
            setPageInput(value);
        }
    };

    const columns = useMemo(() => {
        let dayColumns = [];
        if (extraInfo.length > 0 &&
            Array.isArray(extraInfo[0].working_hours) &&
            extraInfo[0].working_hours.length > 0) {
            const daysInMonth = extraInfo[0].working_hours.length;
            for (let day = 1; day <= daysInMonth; day++) {
                const date = extraInfo[0].working_hours[day - 1].date;

                dayColumns.push({
                    Header: (
                        <div>
                            <div className="flex justify-center">{date}</div>
                            <div className="flex justify-around border-t border-b">
                                <div className="px-2 border-r">START</div>
                                <div className="px-2 border-r">END</div>
                                <div className="px-2">HOURS</div>
                            </div>
                        </div>
                    ),
                    accessor: `day${day}`,
                    Cell: ({ cell: { value } }) => (
                        <div className="flex justify-around border-t border-b">
                            <div className="px-2 border-r">{value.started_at}</div>
                            <div className="px-2 border-r">{value.ended_at}</div>
                            <div className="px-2">{value.total_hours}</div>
                        </div>
                    ),
                });
            }
        }

        return [
            {
                Header: "Name",
                accessor: "name",
                Cell: ({ cell: { value }, row: { original } }) => (
                    <div className="flex items-center min-w-[150px] md:min-w-[200px] ">
                        {original.profile_picture ? (
                            <img
                                src={`${djangoBaseURL}${original.profile_picture}`}
                                alt={value}
                                className="w-7 h-7 md:w-8 md:h-8 rounded-full mr-2"
                            />
                        ) : (
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full mr-2 bg-gray-300 dark:bg-slate-700 flex justify-center items-center">
                                {intialLetterName('', '', value, '')}
                            </div>
                        )}
                        <span className="text-sm md:text-base truncate">{value}</span>
                    </div>
                ),
            },
            ...dayColumns,
        ];
    }, [extraInfo]);

    const data = useMemo(() => {
        // If the current user is NOT admin, skip the filter
        const isAdmin = userInfo?.isAdmin;

        const relevantData = isAdmin
            ? extraInfo.filter(employee => employee.is_client === false)
            : extraInfo;

        return relevantData.map((employee) => {
            let formattedName = employee.name || '';
            if (formattedName.length > 0) {
                formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
            }

            let rowData = {
                name: formattedName,
                profile_picture: employee.profile_picture,
            };

            if (Array.isArray(employee.working_hours)) {
                employee.working_hours.forEach((work, index) => {
                    rowData[`day${index + 1}`] = work;
                });
            }

            return rowData;
        });
    }, [extraInfo, userInfo]);

    const tableInstance = useTable(
        {
            columns,
            data,
            initialState: {
                sortBy: [
                    {
                        id: 'name',
                        desc: false // Ascending order by default
                    }
                ]
            }
        },
        useSortBy
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    return (
        <>
            <Card bodyClass="p-0">
                <div className="relative">
                    {/* Table indicator for mobile */}
                    <div className="md:hidden px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center">
                        <Icon icon="heroicons-outline:finger" className="h-4 w-4 mr-1" />
                        <span>Scroll horizontally to view more data</span>
                    </div>
                    
                    <div
                        ref={tableContainerRef}
                        className="overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[70vh] relative"
                    >
                        <table
                            className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700 border-collapse"
                            {...getTableProps()}
                        >
                            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0 z-30">
                                {headerGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map((column, index) => (
                                            <th
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                scope="col"
                                                className={`table-th px-1 text-xs md:text-sm py-2 md:py-3 ${
                                                    index === 0 
                                                        ? "sticky left-0 bg-slate-200 dark:bg-slate-700 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" 
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex">
                                                    {column.render("Header")}
                                                    <span>
                                                        {column.isSorted
                                                            ? column.isSortedDesc
                                                                ? " 🔽"
                                                                : " 🔼"
                                                            : ""}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody
                                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                                {...getTableBodyProps()}
                            >
                                {extraInfoLoading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="text-center py-5">
                                            <ListSkeleton />
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="text-center py-5">
                                            No extra info found!
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                {row.cells.map((cell, index) => (
                                                    <td
                                                        {...cell.getCellProps()}
                                                        className={`table-td px-1 text-xs md:text-sm py-2 md:py-3 ${
                                                            index === 0 
                                                                ? "sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" 
                                                                : ""
                                                        }`}
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
                    </div>
                </div>
                {userInfo?.isAdmin &&
                    <div className="mt-2 md:mt-4 px-2 md:px-6 py-2">
                        <div className="flex flex-col md:flex-row md:space-y-0 space-y-3 justify-between items-center">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs md:text-sm">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    Showing {extraInfoCurrentPage} to {extraInfoTotalPages} of {extraInfoTotalCount} entries
                                </span>
                            </div>
                            <ul className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""} p-1`}
                                        onClick={() => onPageChange(1)}
                                        disabled={extraInfoCurrentPage <= 1}
                                    >
                                        <Icon icon="heroicons:chevron-double-left-solid" className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </li>
                                <li className="text-xs md:text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""} px-2 py-1`}
                                        onClick={() => onPageChange(extraInfoPrevPage)} disabled={!extraInfoPrevPage}
                                    >
                                        Prev
                                    </button>
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white">
                                    <input
                                        type="number"
                                        min={'1'}
                                        max={extraInfoTotalPages}
                                        className="w-10 md:w-12 py-1 px-1 md:px-2 focus:outline-none rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs md:text-sm"
                                        value={pageInput}
                                        onChange={handlePageInputChange}
                                    />
                                </li>
                                <li className="text-xs md:text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage >= extraInfoTotalPages ? "opacity-50 cursor-not-allowed" : ""} px-2 py-1`}
                                        onClick={() => onPageChange(extraInfoNextPage)} disabled={!extraInfoNextPage}
                                    >
                                        Next
                                    </button>
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage >= extraInfoTotalPages ? "opacity-50 cursor-not-allowed" : ""} p-1`}
                                        onClick={() => onPageChange(extraInfoTotalPages)}
                                        disabled={extraInfoCurrentPage >= extraInfoTotalPages}
                                    >
                                        <Icon icon="heroicons:chevron-double-right-solid" className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                }
            </Card>
        </>
    );
};

export default ExtraInfo;
