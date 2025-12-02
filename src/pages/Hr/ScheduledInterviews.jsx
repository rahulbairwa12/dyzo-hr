import React, { useState, useEffect, useMemo } from "react";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { fetchAPI } from "@/store/api/apiSlice";
// import { LuExternalLink
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// import { formatUTCTime, convertToLocalTime, capitalizeFirstLetter} from 
import ListSkeleton from "@/pages/table/ListSkeleton";
import { Icon } from "@iconify/react";
import Card from "@/components/ui/Card";



const ScheduledInterviewsInfo = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [interviewData, setInterviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const companyId = useSelector(state => state?.auth?.user?.companyId);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        fetchScheduledInterview(tab);
    };

    const fetchScheduledInterview = async (tab) => {
        setLoading(true);
        let statusParam = '';
        switch (tab) {
            case 'upcoming':
                statusParam = 'upcoming-interview';
                break;
            case 'completed':
                statusParam = 'completed-interview';
                break;
            case 'cancelled':
                statusParam = 'cancelled-interview';
                break;
            default:
                statusParam = 'upcoming-interview';
        }

        try {
            const response = await fetchAPI(`api/interviews-by-status/${companyId}/?status=${statusParam}`);
            if (response.status) {
                setInterviewData(response.data); // Assuming the response is structured this way
            } else {
                setInterviewData([]);
            }
        } catch (error) {
            setInterviewData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScheduledInterview(activeTab); // Initial fetch when the component mounts
    }, []);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return date.toLocaleDateString('en-US', options).toUpperCase();
    }

    // Define table columns
    const columns = useMemo(() => [
        {
            Header: "Applicant Name",
            accessor: "applicationId.applicant_name",
            Cell: ({ value }) => <span>{value}</span>,
        },
        {
            Header: "Job Title",
            accessor: "jobid.job_title",
            Cell: ({ value }) => <span>{value}</span>,
        },
        {
            Header: "Interview Name",
            accessor: "interview_name",
            Cell: ({ value }) => <span>{value}</span>,
        },
        {
            Header: "Interviewers",
            accessor: "interviewers",
            Cell: ({ value }) => <span>{value.map(interviewer => interviewer.name).join(', ')}</span>,
        },
        {
            Header: "Time",
            accessor: "interview_timing",
            Cell: ({ value }) => <span>{formatDate(value)} </span>,
        },
        {
            Header: "Mode",
            accessor: "interview_mode",
            Cell: ({ value }) => <span>{(value)}</span>,
        },
        {
            Header: "Action",
            accessor: "interview_id",
            Cell: ({ value }) => (
                <button onClick={()=>navigate(`/view-schedule-interview/${value}`)}>
               <Icon icon="mdi:eye" />
               </button>
                
            ),
        },
    ], []);

    // Prepare data for table
    const data = useMemo(() => interviewData, [interviewData]);

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
        <main className="md:p-6 p-4">
            
            <div className="text-black rounded-2 flex flex-row items-center gap-2">
            <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer' onClick={() => navigate(-1)}/>
                <p className="text-black font-semibold text-f20 flex">Scheduled Interviews</p>
            </div>
            <div className="border-b border-gray-200">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                    <li className="mr-2" role="presentation">
                        <button
                            className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === 'upcoming' ? 'text-blue-600 border-blue-600' : 'text-black border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                            role="tab"
                            onClick={() => handleTabClick('upcoming')}
                        >
                            Upcoming Interviews
                        </button>
                    </li>
                    <li className="mr-2" role="presentation">
                        <button
                            className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === 'completed' ? 'text-blue-600 border-blue-600' : 'text-black border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                            role="tab"
                            onClick={() => handleTabClick('completed')}
                        >
                            Completed Interviews
                        </button>
                    </li>
                    <li className="mr-2" role="presentation">
                        <button
                            className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === 'cancelled' ? 'text-blue-600 border-blue-600' : 'text-black border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                            role="tab"
                            onClick={() => handleTabClick('cancelled')}
                        >
                            Cancelled Interviews
                        </button>
                    </li>
                </ul>
            </div>
            <Card>
    <div className="overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle">
            <div className="overflow-x-auto mb-5">
                <table
                    className="min-w-full table-auto divide-y divide-slate-100 dark:divide-slate-700"
                    {...getTableProps()}
                >
                    <thead className="bg-slate-200 dark:bg-slate-700">
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th
                                        {...column.getHeaderProps(column.getSortByToggleProps())}
                                        scope="col"
                                        className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 min-w-[120px] sm:min-w-[150px] md:min-w-[180px]"  // Min-width ensures the columns don't shrink too much
                                    >
                                        <div className="flex items-center">
                                            {column.render("Header")}
                                            <span className="ml-1">
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
                                <td colSpan="7" className="text-center py-5">
                                    No interviews found!
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()} className="cursor-pointer relative">
                                        {row.cells.map((cell) => (
                                            <td {...cell.getCellProps()} className="p-4 text-sm text-gray-500 dark:text-gray-300">
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

        </main>
    );
};

export default ScheduledInterviewsInfo;
