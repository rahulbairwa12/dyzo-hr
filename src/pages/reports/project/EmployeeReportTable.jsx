import React, { useState, useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import { intialLetterName } from "@/helper/helper";
import ListSkeleton from "@/pages/table/ListSkeleton";
import { djangoBaseURL } from "@/helper";
import { ProfilePicture } from '@/components/ui/profilePicture';

const EmployeeReportTable = ({
  employeeData,
  loading,
  dataLoading,
}) => {
  const [sortedEmployees, setSortedEmployees] = useState([]);

  useEffect(() => {
    setSortedEmployees(employeeData);
  }, [employeeData]);

  const columns = useMemo(() => [
    {
      Header: "SN",
      accessor: (_, rowIndex) => rowIndex + 1,
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Employee",
      accessor: "name",
      Cell: (row) => {
        const fullName = row?.cell?.value;
        const firstName = row?.row?.original?.first_name;
        const lastName = row?.row?.original?.last_name;
        const profilePictureUrl = row?.row?.original?.profilePictureUrl;
        
        const user = {
          name: fullName || `${firstName || ''} ${lastName || ''}`.trim(),
          profile_picture: profilePictureUrl
        };
        
        return (
          <div className="flex items-center gap-5 min-w-[180px]">
            <ProfilePicture 
              user={user}
              className="w-[2.5rem] h-[2.5rem] rounded-full"
            />
            <span>{fullName}</span>
          </div>
        );
      },
    },
    {
      Header: "Working Hours",
      accessor: "totalTime",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
    {
      Header: "Working Hours (Decimal)",
      accessor: "totalTimeSpentInDecimal",
      Cell: (row) => <span>{row?.cell?.value}</span>,
    },
  ], []);

  const data = useMemo(() => sortedEmployees, [sortedEmployees]);

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

  return (
    <>
      <Card>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
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
                          className=" table-th "
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
                  {loading || dataLoading ? (
                    <ListSkeleton />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        No Employees were found!
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
    </>
  );
};

export default EmployeeReportTable;
