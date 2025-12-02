import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
// import Icon from "@/components/ui/Icon";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";

import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import AdvancedModal from "@/components/ui/AdvancedModal";
import { useNavigate } from "react-router-dom";
import { fetchGET } from "@/store/api/apiSlice";

const ViewApplicants = () => {
    const [loading, setLoading] = useState(false);
    const company_id = useSelector((state) => state?.auth?.user?.companyId);
    const [applicantList, setApplicantList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmationInfo, setDeleteConfirmationInfo] = useState();
    const baseURL = import.meta.env.VITE_APP_DJANGO;

    const fetchApplicants = async () => {
        setLoading(true);
        try {
            const response = await fetchGET(`${baseURL}/api/applicants/${company_id}/`);

            if (response) {
                setApplicantList(response.data);
            } else {
            }
        } catch (error) {
            console.error("Error fetching applicants:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicants();
    }, [company_id]);

    const columns = useMemo(() => [
        {
            Header: "Job Title",
            accessor: "job_title",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Applicant Name",
            accessor: "applicant_name",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Email",
            accessor: "applicant_email",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Mobile No.",
            accessor: "mobile_no",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Resume",
            accessor: "upload_resume",
            Cell: (row) => (
                <a href={`${baseURL}${row?.cell?.value}`} download target="_blank" rel="noopener noreferrer">
                    <Icon icon="iconoir:cloud-download" />
                </a>
            ),
        },
        {
            Header: "View",
            accessor: "view",
            Cell: (row) => (
                <Link to={`/ApplicantInfo/${row.row.original.applicationId}`}>
                    <Icon icon="mdi:eye" className="text-blue-500 w-5 h-5" />
                </Link>
            ),
        },
    ], []);

    const data = useMemo(() => applicantList, [applicantList]);

    const tableInstance = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter,
        useSortBy
    );
    const navigate = useNavigate();
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    return (
        <>
            <div className="flex flex-row items-center gap-2 mb-4" >
                <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer' onClick={() => navigate(-1)} />
                <p className="text-black font-semibold text-f20">View Applicants</p>
            </div>
            <Card>
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-x-auto">
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
                                            <td colSpan="6" className="text-center py-5">
                                                No applicants found!
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
                onClose={() => setIsModalOpen(false)}
                className="max-w-xl"
                title="Are you sure want to delete?"
            >
                {deleteConfirmationInfo && (
                    <div className="text-left border my-2">
                        {deleteConfirmationInfo?.job_title && (
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="job_title" className="font-normal">Job Title - </label>
                                <label htmlFor="job_title">{deleteConfirmationInfo?.job_title}</label>
                            </div>
                        )}
                        {deleteConfirmationInfo?.applicant_name && (
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="applicant_name" className="font-normal">Applicant Name - </label>
                                <label htmlFor="applicant_name">{deleteConfirmationInfo?.applicant_name}</label>
                            </div>
                        )}
                        {deleteConfirmationInfo?.email && (
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="email" className="font-normal">Email - </label>
                                <label htmlFor="email">{deleteConfirmationInfo?.email}</label>
                            </div>
                        )}
                        {deleteConfirmationInfo?.mobile_no && (
                            <div className="px-6 py-2 font-semibold text-gray-900">
                                <label htmlFor="mobile_no" className="font-normal">Mobile No. - </label>
                                <label htmlFor="mobile_no">{deleteConfirmationInfo?.mobile_no}</label>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex justify-between py-4">
                    <button className="px-4 py-2 text-white bg-blue-600 rounded-md" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button className="px-4 py-2 text-white bg-red-600 rounded-md" onClick={() => handleDelete(deleteConfirmationInfo?.id)}>Confirm</button>
                </div>
            </AdvancedModal>
        </>
    );
};

export default ViewApplicants;
