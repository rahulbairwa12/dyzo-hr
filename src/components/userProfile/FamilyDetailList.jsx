import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import { Icon } from "@iconify/react";
import { fetchDelete } from "@/store/api/apiSlice";
import { toast } from "react-toastify";

const FamilyDetailList = ({ familyInformation, fetchFamilyInfo }) => {
    const [showDeletePopUp, setShowDeletePopUp] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            const isUserDeleted = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/family-details/delete/${deleteId}/`);
            if (isUserDeleted.status) {
                toast.success('Family member deleted successfully');
                setShowDeletePopUp(false);
                fetchFamilyInfo();
            }
        } catch (error) {
            toast.error('Failed to delete family member');
        } finally {
            setDeleteLoading(false);
        }

    }

    const COLUMNS = [
        {
            Header: "SN",
            Cell: (row) => {
                return row.row.index + 1;
            },
        },

        {
            Header: "Name",
            accessor: "name",
            Cell: (row) => {
                return <span>{row?.cell?.value}</span>;
            },
        },
        {
            Header: "Relation",
            accessor: "relationship",
            Cell: (row) => {
                return <span>{row?.cell?.value}</span>;
            },
        },
        {
            Header: "Mobile",
            accessor: "mobile_number",
            Cell: (row) => {
                return <span>{row?.cell?.value}</span>;
            },
        },

        {
            Header: "Action",
            accessor: "action",
            Cell: (row) => {
                return (
                    <div className="flex space-x-2 items-center">
                        {/* <span >
                            <Icon icon="heroicons:pencil-square" className='w-6 h-6 cursor-pointer' />
                        </span> */}

                        <span onClick={() => { setDeleteId(row.row.original.id); setShowDeletePopUp(true) }}>
                            <Icon icon="ph:trash-light" className='w-6 h-6 cursor-pointer' />
                        </span>
                    </div>
                )
            },
        },

    ];

    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => familyInformation, [familyInformation]);

    const tableInstance = useTable(
        { columns, data },
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
        <>
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
                                        <tr {...headerGroup.getHeaderGroupProps()}>
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
                                                className="dark:even:bg-slate-700 cursor-pointer"

                                            >
                                                {row.cells.map((cell) => {
                                                    return (
                                                        <td {...cell.getCellProps()} className="table-td">
                                                            {cell.render("Cell")}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </Card>
        </>
    );
};

export default FamilyDetailList;
