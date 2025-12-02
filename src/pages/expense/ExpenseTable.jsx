import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";

import { useTable, useSortBy, useGlobalFilter } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { Link } from "react-router-dom";
import AdvancedModal from "@/components/ui/AdvancedModal";
import { getAuthToken } from "@/utils/authToken";

const ExpensesTable = () => {
    const [loading, setLoading] = useState(false);
    const companyId = useSelector((state) => state?.auth?.user?.companyId);
    const [expensesData, setExpensesData] = useState([]);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmationInfo, setDeleteConfirmationInfo] = useState();
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = (expense) => {
        setDeleteConfirmationInfo(expense);
        setShowDeleteConfirmation(true);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
    };
    const closeDeleteConfirmation = () => setShowDeleteConfirmation(false);
    const openDeleteModal = (expenseinfo) => {
        setDeleteConfirmationInfo(expenseinfo);
        setShowDeleteConfirmation(true);
    }
    const formatUtcToLocal = (utcDateString) => {
        const date = new Date(utcDateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        return formatter.format(date);
    }

    // Fetch expenses data from API
    const fetchExpenses = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${baseURL}/api/expenses-list/${companyId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setExpensesData(data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle deleting an expense
    const handleDelete = async (expenseId) => {
        try {
            await fetch(`${baseURL}/api/company-expense/delete/${companyId}/${expenseId}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            });
            fetchExpenses(); // Reload the expenses data
            closeModal(); // Close the modal
            setExpensesData((prevData) => prevData.filter((expense) => expense.id !== expenseId));
            closeDeleteConfirmation();
        } catch (error) {
            console.error("Error deleting expense:", error);
        }
    };

    // Fetch expenses on component mount
    useEffect(() => {
        fetchExpenses();
    }, []);

    // Define table columns
    const columns = useMemo(() => [
        {
            Header: "S.N.",
            accessor: (_, rowIndex) => rowIndex + 1,
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Vendor",
            accessor: "vendor_name",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Account",
            accessor: "account",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Amount",
            accessor: "amount",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: (row) => {
                const expense = row.row.original;
                return (
                    <div className="flex space-x-3 rtl:space-x-reverse">
                        {/* <Tooltip content="Delete Expense" placement="top" arrow animation="shift-away">
                            <button
                                title="Delete Expense"
                                onClick={() => openDeleteModal(expense)}
                                className="text-red-600"
                            >
                                <Icon icon="heroicons:trash-solid" />
                            </button>
                            
                        </Tooltip> */}
                        <button onClick={() => openModal(expense)} className="text-red-600 ">
                            <Icon icon="ph:trash-bold" className="w-5 h-5" />
                        </button>

                        <Link to={`/expense/edit/${expense.expense_id}`}><Icon icon="carbon:pen" className="w-5 h-5" /></Link>
                        <Link
                            to={`/expense/${expense.expense_id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Icon icon="mdi:eye" className="text-blue-500 w-5 h-5" />
                        </Link>
                    </div>
                );
            },
        },
    ], []);

    // Prepare data for table
    const data = useMemo(() => expensesData, [expensesData]);

    // Create table instance
    const tableInstance = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter,
        useSortBy
    );

    // Destructure table instance properties
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
                        <div className="overflow-x-auto mb-20">
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
                                                    className="table-th"
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
                                    {loading ? (
                                        <ListSkeleton />
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                No expenses found!
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => {
                                            prepareRow(row);
                                            return (
                                                <tr {...row.getRowProps()} className="cursor-pointer relative">
                                                    {row.cells.map((cell) => (
                                                        <td {...cell.getCellProps()} className="table-td">
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
            </Card>

            <AdvancedModal
                activeModal={isModalOpen}
                onClose={closeModal}
                className="max-w-xl"
                title="Are you sure want to delete?"

            >

                {deleteConfirmationInfo &&
                    <div className="text-left border my-2">
                        {deleteConfirmationInfo?.vendor_name &&
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="vendor_name" className="font-normal">Vendor - </label>
                                <label htmlFor="vendor_name">{deleteConfirmationInfo?.vendor_name}</label>
                            </div>
                        }
                        {deleteConfirmationInfo?.account &&
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="account" className="font-normal">Account - </label>
                                <label htmlFor="account">{deleteConfirmationInfo?.account}</label>
                            </div>
                        }
                        {deleteConfirmationInfo?.description &&
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="description" className="font-normal">Description - </label>
                                <label htmlFor="description">{deleteConfirmationInfo?.description}</label>
                            </div>
                        }
                        {deleteConfirmationInfo?.dateAdded &&
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="dateAdded" className="font-normal">Added Date - </label>
                                <label htmlFor="dateAdded">{formatUtcToLocal(deleteConfirmationInfo?.dateAdded)}</label>
                            </div>
                        }
                    </div>
                }
                <div className="flex justify-between py-4">
                    <button className="px-4 py-2 text-white bg-blue-600 rounded-md" onClick={closeModal}>Cancel</button>
                    <button className="px-4 py-2 text-white bg-red-600 rounded-md" onClick={() => handleDelete(deleteConfirmationInfo?.expense_id)}>Confirm</button>
                </div>
            </AdvancedModal>

        </>
    );
};

export default ExpensesTable;
