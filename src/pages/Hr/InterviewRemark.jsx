import React, { useMemo, useState, useEffect } from "react";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import SkeletionTable from "@/components/skeleton/Table";
import { fetchAPI } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";

const InterviewRemark = () => {
    const companyId = useSelector(state => state?.auth?.user?.companyId);
    const [interviewerFeedbacks, setInterviewersFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchInterviewersFeedback = async () => {
        try {
            const response = await fetchAPI(`api/company-interviewer-remarks/${companyId}/`);
            if (response.status) {
                setInterviewersFeedback(response.data);
            } else {
                setInterviewersFeedback([]);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error fetching interviewer feedback:', error);
        }
    };

    useEffect(() => {
        if (companyId !== undefined) {
            fetchInterviewersFeedback();
        }
    }, [companyId]);

    // Define table columns
    const columns = useMemo(() => [
        {
            Header: "S.N.",
            accessor: (_, rowIndex) => rowIndex + 1,
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Applicant Name",
            accessor: "applicationId.applicant_name",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Email",
            accessor: "applicationId.applicant_email",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Job Title",
            accessor: "applicationId.job_title",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Interview Name",
            accessor: "interview_id.interview_name",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Interviewer",
            accessor: "interviewer_name",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Marks",
            accessor: "marks",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "Remarks",
            accessor: "remarks",
            Cell: (row) => <span>{row?.cell?.value}</span>,
        },
        {
            Header: "View",
            accessor: "view",
            Cell: (row) => {
                const feedback = row.row.original;
                return (
                    <Link to={`/view-schedule-interview/${feedback.interview_id?.interview_id}`}>
                        View
                    </Link>
                );
            },
        },
    ], []);

    // Prepare data for table
    const data = useMemo(() => interviewerFeedbacks, [interviewerFeedbacks]);

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
        <div className="md:p-6 p-4 dark:bg-gray-900">
            <div className="flex flex-row items-center gap-2 mb-4">
                <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer dark:text-white' onClick={() => navigate(-1)}/>
                <p className="text-black dark:text-white font-semibold text-f20">Interviewers Feedback</p>
            </div>
            {loading ? (
                <SkeletionTable />
            ) : interviewerFeedbacks.length > 0 ? (
                <div className="overflow-x-auto py-2">
                    <table
                        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md"
                        {...getTableProps()}
                    >
                        <thead className="bg-gray-200 dark:bg-gray-700">
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <th
                                            {...column.getHeaderProps(column.getSortByToggleProps())}
                                            className="py-4 px-2 text-left dark:text-white"
                                        >
                                            <div className="flex items-center">
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
                            className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700"
                            {...getTableBodyProps()}
                        >
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 dark:text-white">
                                        No Interviewers Feedback Found
                                    </td>
                                </tr>
                            ) : (
                                rows.map(row => {
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                            {row.cells.map(cell => (
                                                <td {...cell.getCellProps()} className="py-4 px-2 dark:text-white">
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
            ) : (
                <div>
                    <h5 className="text-center py-6 text-black dark:text-white">No Interviewers Feedback Found</h5>
                </div>
            )}
        </div>
    );
};

export default InterviewRemark;
