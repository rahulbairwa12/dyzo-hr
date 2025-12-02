import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import { formatDateWithMonthName } from "@/helper/helper";

const HolidayList = ({ holidayList, handleSetDeleteId, setData, setHolidayId, setShowHolidayEditModal }) => {

    const COLUMNS = [
        {
            Header: "",
            id: "checkbox",
            Cell: ({ row }) => (
                <input type="checkbox" className="w-4 h-4" onChange={() => handleSetDeleteId(row.original.id)} />
            ),
        },
        {
            Header: "S.N",
            id: "sn",
            Cell: ({ row }) => row.index + 1,
        },
        {
            Header: "Name",
            accessor: "name",
            Cell: (row) => (
                <div className="flex-1 font-medium text-sm leading-4 whitespace-nowrap" title={row?.cell?.value}>
                    {row?.cell?.value.length > 20
                        ? row?.cell?.value.substring(0, 20) + "..."
                        : row?.cell?.value}
                </div>
            ),
        },
        {
            Header: "Date",
            accessor: "date",
            Cell: (row) => <span>{formatDateWithMonthName(row?.cell?.value)}</span>,
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: (row) => (
                <div className="flex space-x-2 items-center">

                    <span onClick={() => { setData(row.row.original); setHolidayId(row.row.original.id); setShowHolidayEditModal(true) }}>
                        <Icon icon="heroicons:pencil-square" className='w-6 h-6 cursor-pointer' />
                    </span>
                </div>
            ),
        },
    ];

    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => holidayList, [holidayList]);

    const tableInstance = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter,
        useSortBy,
        usePagination,
        useRowSelect
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        state,
        gotoPage,
        pageCount,
        setPageSize,
        setGlobalFilter,
        prepareRow,
    } = tableInstance;

    const { globalFilter, pageIndex, pageSize } = state;
    return (

        <Card noborder>
            <div className="overflow-x-auto -mx-6">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                        <table
                            className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                            {...getTableProps()}
                        >
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                {headerGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()} >
                                        {headerGroup.headers.map((column) => (
                                            <th
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                scope="col"
                                                className="table-th"
                                            >
                                                {column.render("Header")}
                                                <span>
                                                    {column.isSorted
                                                        ? column.isSortedDesc
                                                            ? " 🔽"
                                                            : " 🔼"
                                                        : ""}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody
                                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                                {...getTableBodyProps()}
                            >
                                {page.map((row) => {
                                    prepareRow(row);
                                    return (
                                        <tr
                                            {...row.getRowProps()}

                                            className="even:bg-slate-100 dark:even:bg-slate-700 cursor-pointer"
                                        >
                                            {row.cells.map((cell) => (
                                                <td {...cell.getCellProps()} className="table-td">
                                                    {cell.render("Cell")}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-6 items-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <span className="flex space-x-2 rtl:space-x-reverse items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Go
                        </span>
                        <span>
                            <input
                                type="number"
                                className="form-control py-2"
                                defaultValue={pageIndex + 1}
                                onChange={(e) => {
                                    const pageNumber = e.target.value
                                        ? Number(e.target.value) - 1
                                        : 0;
                                    gotoPage(pageNumber);
                                }}
                                style={{ width: "50px" }}
                            />
                        </span>
                    </span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Page{" "}
                        <span>
                            {pageIndex + 1} of {pageOptions.length}
                        </span>
                    </span>
                </div>
                <ul className="flex items-center space-x-3 rtl:space-x-reverse">
                    <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                        <button
                            className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => previousPage()}
                            disabled={!canPreviousPage}
                        >
                            <Icon icon="heroicons-outline:chevron-left" />
                        </button>
                    </li>
                    {/* {pageOptions.map((page, pageIdx) => (
                        <li key={pageIdx}>
                            <button
                                aria-current="page"
                                className={`${pageIdx === pageIndex
                                    ? "bg-slate-900 dark:bg-slate-600 dark:text-slate-200 text-white font-medium "
                                    : "bg-slate-100 dark:text-slate-400 text-slate-900 font-normal "
                                    } text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
                                onClick={() => gotoPage(pageIdx)}
                            >
                                {page + 1}
                            </button>
                        </li>
                    ))} */}
                    <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                        <button
                            className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => nextPage()}
                            disabled={!canNextPage}
                        >
                            <Icon icon="heroicons-outline:chevron-right" />
                        </button>
                    </li>
                </ul>
            </div>
        </Card>
    );
};

export default HolidayList;
