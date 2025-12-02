import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useNavigate } from "react-router-dom";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "@/pages/leaves/GlobalFilter";
import moment from "moment";



const CompanyListTable = ({ companyList }) => {
  const navigate = useNavigate();

  // Define table columns
  const COLUMNS = [
    {
      Header: "S.N",
      accessor: "sn",
      Cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      Header: "Company Name",
      accessor: "company_name",
      Cell: ({ cell: { value } }) => (
        <div
          className="flex-1 font-medium text-sm leading-4 whitespace-nowrap"
          title={value}
        >
          {value && value.length > 20 ? `${value.substring(0, 20)}...` : value}
        </div>
      ),
    },
    {
      Header: "Created At",
      accessor: "created_at",
      sortDescFirst: true,
      Cell: ({ cell: { value } }) => {
        const date = new Date(value);
        return <span>{moment(date).format("DD-MMM-YYYY")}</span>;
      },
    },
    {
      Header: "Active Employees",
      accessor: "active_employees",
      Cell: ({ cell: { value } }) => <span>{value}</span>,
    },
    {
      Header: "Inactive Employees",
      accessor: "inactive_employees",
      Cell: ({ cell: { value } }) => <span>{value !== undefined ? value : 0}</span>,
    },
    {
      Header: "Total Employees",
      accessor: "total_employees",
      Cell: ({ cell: { value } }) => <span>{value}</span>,
    },
    {
      Header: "Status",
      accessor: "isActive",
      Cell: ({ cell: { value } }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      Header: "Action",
      accessor: "action",
      Cell: ({ row }) => {
        return (
          <div className="flex space-x-2 items-center">
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/company-detail/${row.original._id}`);
              }}
            >
              <Icon icon="hugeicons:view" className="w-6 h-6 cursor-pointer" />
            </span>
          </div>
        );
      },
    },
  ];

  // Memoize columns and data
  const columns = useMemo(() => COLUMNS, []);
  const data = useMemo(
    () => (Array.isArray(companyList) ? companyList : []),
    [companyList]
  );

  // Initialize table instance with global filter and pagination
  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [
          {
            id: 'created_at',
            desc: true
          }
        ]
      }
    },
    useGlobalFilter, // This adds the global filter functionality
    useSortBy,
    usePagination
  );

  // Destructure table instance state and methods
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
    prepareRow,
    setGlobalFilter, // function to update the global filter
  } = tableInstance;

  const { pageIndex, globalFilter } = state;

  return (
    <>
      {data.length === 0 ? (
        <p className="text-center capitalize">No Company Found</p>
      ) : (
        <Card noborder>
         <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Company List</h4>
          <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
        </div>
        
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table
                  className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                  {...getTableProps()}
                >
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    {headerGroups.map((headerGroup) => (
                      <tr key={headerGroup.id} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th
                            key={column.id}
                            {...column.getHeaderProps(column.getSortByToggleProps())}
                            scope="col"
                            className="table-th"
                          >
                            {column.render("Header")}
                            <span>
                              {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
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
                          key={row.id}
                          {...row.getRowProps()}
                          onClick={() => navigate(`/company-detail/${row.original._id}`)}
                          className="even:bg-slate-100 dark:even:bg-slate-700 cursor-pointer"
                        >
                          {row.cells.map((cell) => (
                            <td key={cell.column.id} {...cell.getCellProps()} className="table-td">
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

          <div className="justify-between mt-6 items-center flex px-4 pb-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="flex space-x-2 rtl:space-x-reverse items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Go</span>
                <input
                  type="number"
                  className="form-control py-2"
                  defaultValue={pageIndex + 1}
                  onChange={(e) => {
                    const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                    gotoPage(pageNumber);
                  }}
                  style={{ width: "50px" }}
                />
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page <span>{pageIndex + 1} of {pageOptions.length}</span>
              </span>
            </div>
            <ul className="flex items-center space-x-3">
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={!canNextPage ? "opacity-50 cursor-not-allowed" : ""}
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
              </li>
            </ul>
          </div>
        </Card>
      )}
    </>
  );
};

export default CompanyListTable;
