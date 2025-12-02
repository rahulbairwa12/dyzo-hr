import React, { useMemo, useState, useEffect } from "react";
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
    handlePageInputSubmit
}) => {
    const userInfo = useSelector((state) => state.auth.user);
    const [pageInput, setPageInput] = useState(extraInfoCurrentPage);

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
        if (extraInfo.length > 0) {
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
                    <div className="flex items-center min-w-[200px]">
                        {original.profile_picture ? (
                            <img
                                src={`${djangoBaseURL}${original.profile_picture}`}
                                alt={value}
                                className="w-8 h-8 rounded-full mr-2"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full mr-2 bg-gray-300 dark:bg-slate-700 flex justify-center items-center">
                                {intialLetterName('', '', value, '')}
                            </div>
                        )}
                        <span>{value}</span>
                    </div>
                ),
            },
            ...dayColumns,
        ];
    }, [extraInfo]);

    const data = useMemo(() => {
        return extraInfo.map((employee) => {
            let rowData = {
                name: employee.name,
                profile_picture: employee.profile_picture,
            };
            employee.working_hours.forEach((work, index) => {
                rowData[`day${index + 1}`] = work;
            });
            return rowData;
        });
    }, [extraInfo]);

    const tableInstance = useTable(
        { columns, data },
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
            <Card>
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            <table
                                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                                {...getTableProps()}
                            >
                                <thead className="bg-slate-200 dark:bg-slate-700">
                                    {headerGroups.map((headerGroup) => (
                                        <tr {...headerGroup.getHeaderGroupProps()}>
                                            {headerGroup.headers.map((column) => (
                                                <th
                                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                                    scope="col"
                                                    className=" table-th px-1"
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
                                        <ListSkeleton />
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                No extra info found!
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => {
                                            prepareRow(row);
                                            return (
                                                <tr {...row.getRowProps()} className="cursor-pointer relative">
                                                    {row.cells.map((cell) => (
                                                        <td {...cell.getCellProps()} className="table-td px-1">
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
                </div>
                {userInfo?.isAdmin &&
                    <div className="mt-4">
                        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Showing {extraInfoCurrentPage} to {extraInfoTotalPages} of {extraInfoTotalCount} entries
                                </span>
                            </div>
                            <ul className="flex items-center space-x-3 rtl:space-x-reverse">
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => onPageChange(1)}
                                        disabled={extraInfoCurrentPage <= 1}
                                    >
                                        <Icon icon="heroicons:chevron-double-left-solid" />
                                    </button>
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => onPageChange(extraInfoPrevPage)} disabled={!extraInfoPrevPage}
                                    >
                                        Prev
                                    </button>
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <input 
                                        type="number" 
                                        min={'1'} 
                                        max={extraInfoTotalPages} 
                                        className="py-1 px-2 focus:outline-none rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                        value={pageInput} 
                                        onChange={handlePageInputChange} 
                                    />
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage >= extraInfoTotalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => onPageChange(extraInfoNextPage)} disabled={!extraInfoNextPage}
                                    >
                                        Next
                                    </button>
                                </li>
                                <li className="text-sm leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                                    <button
                                        className={`${extraInfoCurrentPage >= extraInfoTotalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => onPageChange(extraInfoTotalPages)}
                                        disabled={extraInfoCurrentPage >= extraInfoTotalPages}
                                    >
                                        <Icon icon="heroicons:chevron-double-right-solid" />
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
