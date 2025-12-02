import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useNavigate } from "react-router-dom";
import {
    useTable,
    useRowSelect,
    useSortBy,
    useGlobalFilter,
    usePagination,
} from "react-table";
import Icons from "@/components/ui/Icon";
import DeleteClientPopUp from "@/components/client/DeleteClientPopUp";
import { toast } from "react-toastify";
import { fetchDelete } from "@/store/api/apiSlice";
import EditClientModal from "@/components/client/EditClientModal";
import GlobalFilter from "@/pages/table/react-tables/GlobalFilter";
import AllProjectList from "./AllProjectList";
import { set } from "react-hook-form";

const ClientList = ({ clients, fetchClient }) => {
    const [showDeleteClientPopUp, setShowDeleteClientPopUp] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [selectedClientData, setSelectedClientData] = useState(null);
    const [showAllProjectModal, setShowAllProjectModal] = useState(false);
    const [projectList, setProjectList] = useState([]);
    const navigate = useNavigate();
    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            const isClientDeleted = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/api/client/delete/${selectedClient}`);
            if (isClientDeleted.status) {
                toast.success("Client deleted successfully");
                setShowDeleteClientPopUp(false);
                setSelectedClient(null);
                fetchClient();
            }
        } catch (error) {
            toast.error("Failed to delete client");
        } finally {
            setDeleteLoading(false);
        }
    };

    const COLUMNS = [
        {
            Header: "S.N",
            accessor: "S.N",
            Cell: (row) => <div>{row.row.index + 1}</div>,
        },
        {
            Header: "Name",
            accessor: "name",
            Cell: (row) => (

                <span className="text-sm font-medium text-slate-900 dark:text-slate-300">
                    {row?.cell?.value}
                </span>

            ),
        },
        {
            Header: "Project",
            accessor: "project",
            Cell: ({ row }) => (
                <>
                    {
                        row.original.projects?.length > 0 ? (
                            <p onClick={(event) => {event.stopPropagation(); setShowAllProjectModal(true); setProjectList(row.original.projects)}}>{`${row.original.projects[0].name} ${row.original.projects.length > 1 ? `+${row.original.projects.length - 1}` : ''}`}</p>
                        ) : (<p>No project</p>)
                    }

                </>
            ),
        },
        {
            Header: "Email",
            accessor: "email",
            Cell: (row) => (

                <div className="normal-case">{row?.cell?.value}</div>

            ),
        },
        {
            Header: "Phone",
            accessor: "phone",
            Cell: (row) => (

                <div>{row?.cell?.value || 'N/A'}</div>

            ),
        },
        {
            Header: "Notification",
            accessor: "getEmail",
            Cell: (row) => (

                <div>
                    {row?.cell?.value ? (
                        <Icon icon="iconoir:check" className="w-6 h-6" />
                    ) : (
                        <Icon icon="heroicons:x-mark-solid" className="w-6 h-6" />
                    )}
                </div>

            ),
        },
        {
            Header: "Active",
            accessor: "isActive",
            Cell: (row) => (

                <div>
                    {row?.cell?.value ? (
                        <Icon icon="iconoir:check" className="w-6 h-6" />
                    ) : (
                        <Icon icon="heroicons:x-mark-solid" className="w-6 h-6" />
                    )}
                </div>

            ),
        },
        {
            Header: "Action",
            accessor: "_id",
            Cell: (row) => (
                <div className="flex space-x-2 items-center">
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowEditClientModal(true);
                            setSelectedClientData(row.cell.row.original);
                        }}
                    >
                        <Icons icon="heroicons:pencil-square" className="w-6 h-6 cursor-pointer" />
                    </span>
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteClientPopUp(true);
                            setSelectedClient(row?.cell?.value);
                        }}
                    >
                        <Icons icon="ph:trash-light" className="w-6 h-6 cursor-pointer" />
                    </span>
                </div>
            ),
        },
    ];

    const columns = useMemo(() => COLUMNS, []);
    const data = useMemo(() => clients, [clients]);

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
        <>
            <div className="w-80 my-4">
                <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
            </div>

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
                                                    {...column.getHeaderProps(
                                                        column.getSortByToggleProps()
                                                    )}
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
                                                onClick={() => navigate(`/client-profile/${row.original._id}?name=${row.original.clientName.replace(/ /g, "-")}`)}
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
                                className={`${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                onClick={() => previousPage()}
                                disabled={!canPreviousPage}
                            >
                                <Icons icon="heroicons-outline:chevron-left" />
                            </button>
                        </li>
                        <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                            <button
                                className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                onClick={() => nextPage()}
                                disabled={!canNextPage}
                            >
                                <Icons icon="heroicons-outline:chevron-right" />
                            </button>
                        </li>
                    </ul>
                </div>
            </Card>
            {<DeleteClientPopUp showModal={showDeleteClientPopUp} onClose={() => setShowDeleteClientPopUp(false)} handleDelete={handleDelete} fetchClient={fetchClient} loading={deleteLoading} />}

            {<EditClientModal showEditClientModal={showEditClientModal} setShowEditClientModal={setShowEditClientModal} fetchClient={fetchClient} selectedClientData={selectedClientData} />}

            <AllProjectList  showAllProjectModal={showAllProjectModal} setShowAllProjectModal={setShowAllProjectModal} projectList={projectList} />

        </>
    );
};

export default ClientList;
