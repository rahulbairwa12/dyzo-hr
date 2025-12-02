import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import { formatDateWithMonthName, intialLetterName } from "@/helper/helper";
import DeleteClientPopUp from "../client/DeleteClientPopUp";
import { fetchDelete } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import ShowTextModal from "./ShowTextModal";

const NoticeList = ({ notices, fetchNoices }) => {
    const [showNoticeDeleteModal, setShowNoticeDeleteModal] = useState(false);
    const [noticeId, setNoticeId] = useState(null);
    const [deleteLoading, setdeleteLoading] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [description, setDescription] = useState('');

    const handleDelete = async () => {
        try {
            setdeleteLoading(true);
            const isNoticeDeleted = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/delete-notice/${noticeId}`);
            if (isNoticeDeleted.status) {
                fetchNoices();
                setShowNoticeDeleteModal(false);
                toast.success("Successfully deleted the notice");
                setNoticeId(null);
            }
        } catch (error) {
            toast.error('Unable to delete the notice');
        } finally {
            setdeleteLoading(false);
        }
    };

    const COLUMNS = [
        {
            Header: "SN",
            Cell: (row) => {
                return row.row.index + 1;
            },
        },
        {
            Header: "Created",
            accessor: "employee_name",
            Cell: (row) => {
                const profilePic = row.row.original.employee_profile_picture;
                return (
                    <div className="flex space-x-3 items-center text-left rtl:space-x-reverse">
                        <div className="flex-none">
                            {profilePic ? (
                                <img src={`${import.meta.env.VITE_APP_DJANGO}${profilePic}`} alt="Profile" className="h-10 w-10 rounded-full object-cover dark:border-2 dark:border-white" />
                            ) : (
                                <div className="h-10 w-10 rounded-full text-sm  bg-[#002D2D] text-white dark:bg-[#002D2D] flex flex-col items-center justify-center font-medium -tracking-[1px] dark:border-2 dark:border-white">
                                    {intialLetterName('', '', row?.cell?.value)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 font-medium text-sm leading-4 whitespace-nowrap">
                            {row?.cell?.value?.length > 20
                                ? row?.cell?.value.substring(0, 20) + "..."
                                : row?.cell?.value || ""}
                        </div>
                    </div>
                );
            },
        },
        {
            Header: "Title",
            accessor: "title",
            Cell: (row) => {
                return <span>{row?.cell?.value || ""}</span>;
            },
        },
        {
            Header: "Date",
            accessor: "created_at",
            Cell: (row) => {
                return <span className="normal-case">{formatDateWithMonthName(row?.cell?.value)}</span>;
            },
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: (row) => {
                return (
                    <span onClick={(event) => { event.stopPropagation(); setShowNoticeDeleteModal(true); setNoticeId(row.row.original.id); }}>
                        <Icon icon="ph:trash-light" className='w-6 h-6 cursor-pointer' />
                    </span>
                );
            },
        },
    ];

    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => notices, [notices]);

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
                                                onClick={() => { setShowTextModal(true); setDescription(row.original.note); }}
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
                                className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => previousPage()}
                                disabled={!canPreviousPage}
                            >
                                <Icon icon="heroicons-outline:chevron-left" />
                            </button>
                        </li>
                      
                        <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                            <button
                                className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => nextPage()}
                                disabled={!canNextPage}
                            >
                                <Icon icon="heroicons-outline:chevron-right" />
                            </button>
                        </li>
                    </ul>
                </div>
            </Card>

            <DeleteClientPopUp showModal={showNoticeDeleteModal} onClose={() => setShowNoticeDeleteModal(false)} handleDelete={handleDelete} loading={deleteLoading} />

            <ShowTextModal showTextModal={showTextModal} setShowTextModal={setShowTextModal} description={description} />
        </>
    );
};

export default NoticeList;
