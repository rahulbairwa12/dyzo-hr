import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import ClientChart from "./ClientChart";
import Card from "@/components/ui/Card";
import ProfileImage from "@/assets/images/users/user-1.jpg";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { getAuthToken } from "@/utils/authToken";


const ClientProfile = () => {
  const { clientId } = useParams();
  const [clientData, setClientData] = useState(null);
  const [companyData, setCompanyData] = useState("");
  const [loading, setLoading] = useState(true);
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [workingHours, setWorkingHours] = useState({});
  const [totalworkingHours, settotalWorkingHours] = useState(null)
  const [totalActiveProjects, setActiveProjects] = useState(null)

  const baseURL = import.meta.env.VITE_APP_DJANGO;

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${baseURL}/api/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setClientData(result.data);
      settotalWorkingHours(result.total_working_hours)
      setActiveProjects(result.total_active_projects)
    } catch (error) {
      console.error("Error fetching client data:", error);
      setClientData(null);
      settotalWorkingHours(null)
      setActiveProjects(null)
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async (companyId) => {
    try {
      // Use authenticated API call for company data
      const token = getAuthToken();
      const response = await fetch(`${baseURL}/api/company/${companyId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setCompanyData(result.company_name || result.name || "No Data");
    } catch (error) {
      console.error("Error fetching company data:", error);
      setCompanyData("No Data");
    }
  };

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${baseURL}/api/client/${clientId}/projects/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setProjectsData(result.projects || []);
    } catch (error) {
      console.error("Error fetching projects data:", error);
      setProjectsData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkingHour = async () => {
    const currentYear = new Date().getFullYear(); // Get current year dynamically
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${baseURL}/client/${clientId}/working-hours/${currentYear}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();

      setWorkingHours(result.data); // Assuming result.data is the array to be set
    } catch (error) {
      console.error("Error fetching working hours data:", error);
      setWorkingHours([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  useEffect(() => {
    fetchWorkingHour();
  }, [clientId]);

  useEffect(() => {
    if (clientData && clientData.companyId) {
      fetchCompanyData(clientData.companyId);
    }
  }, [clientData]);

  useEffect(() => {
    fetchProjectsData();
  }, [clientId]);

  const columns = useMemo(() => [
    {
      Header: "S.N.",
      accessor: (_, rowIndex) => rowIndex + 1,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Project Name",
      accessor: "name",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Start Date",
      accessor: "dateAdded",
      Cell: ({ cell: { value } }) => <span>{new Date(value).toLocaleString()}</span>,
    },
    {
      Header: "End Date",
      accessor: "dueDate",
      Cell: ({ cell: { value } }) => <span>{new Date(value).toLocaleString()}</span>,
    },
    {
      Header: "Status",
      accessor: "isActive",
      Cell: (row) => <span>{row.cell.value ? "Active" : "Not Active"}</span>,
    },
    {
      Header: "View",
      accessor: "_id",
      Cell: ({ cell: { value } }) => (
        <Link to={`/projects/${value}`}>
          <button className="text-blue-500">
            <Icon icon="mdi:eye" className='text-blue-500 w-5 h-5' />
          </button>
        </Link>
      ),
    },
  ], [projectsData]);

  const data = useMemo(() => projectsData, [projectsData]);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!clientData) {
    return <div>No client data found</div>;
  }

  return (
    <div>
      <div className="space-y-5 profile-page">
        <div className="profile-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-[1]">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                  <img
                    src={clientData.profile ? clientData.profile : `${import.meta.env.VITE_APP_DJANGO}/media/images/defalut.jpg`}
                    alt={clientData.clientName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="flex-column">
                <div className="flex-1">
                  <div className="text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px]">
                    {clientData.clientName}
                  </div>
                  <div className="text-sm font-light text-slate-600 dark:text-slate-400">
                    {clientData.email}
                  </div>
                </div>
                <div className="text-sm justify-center md:justify-start font-light text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-3">
                  <Link to={clientData.email ? `mailto:${clientData?.email}` : ""}>
                    <Icon icon='heroicons:envelope' className='w-6 h-6' />
                  </Link>
                  <Link to={clientData.phone ? `tel:${clientData?.phone}` : ""}>
                    <Icon icon='heroicons:phone-arrow-up-right' className='w-5 h-5' />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-500 md:flex md:text-start text-center flex-1 max-w-[516px] md:space-y-0 space-y-4">
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {totalworkingHours}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Total Working Hours
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {clientData.pay_per_month ? clientData.pay_per_month : "No Data"}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Pay Per Month
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {totalActiveProjects ? totalActiveProjects : "No Waiting"}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Active Project
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-4 col-span-12">
            <Card title="Info">
              <ul className="list space-y-8">
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:envelope" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      EMAIL
                    </div>
                    <a
                      href={clientData.email ? `mailto:${clientData.email}` : "#"}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {clientData.email}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:phone" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      PHONE
                    </div>
                    <a
                      href={clientData.phone ? `tel:${clientData.phone}` : "#"}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {clientData.phone ? clientData.phone : " "}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:building-office" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Company
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {companyData}
                    </div>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:home" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Address
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {clientData.address ? clientData.address : " "}
                    </div>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:calendar" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Joining Date
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {clientData.created_date ? new Date(clientData.created_date).toLocaleDateString() : "No Data"}
                    </div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-8 col-span-12">
            <Card title="Performance" bodyClass="p-0" headerClass="border-b-0 px-6 py-4">
              <ClientChart data={workingHours} />
            </Card>
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12">
          <Card title="Projects">
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="table-th"
                        >
                          {column.render('Header')}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? ' ↓' : ' ↑') : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()} className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-6 text-center text-slate-500 dark:text-slate-400">
                        No projects data found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="hover:bg-slate-100 dark:hover:bg-slate-700">
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td">
                              {cell.render('Cell')}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {loading && <ListSkeleton />}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default ClientProfile;
