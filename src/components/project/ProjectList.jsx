import React, { useMemo } from "react";
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
import ProgressBar from "@/components/ui/ProgressBar";
import { intialLetterName } from "@/helper/initialLetterName";
import Select from "react-select";
import { ProfilePicture } from '@/components/ui/profilePicture';
import ModernTooltip from '@/components/ui/ModernTooltip';

const ProjectList = ({
  projects,
  setData,
  setShowEditProjectModal,
  setShowDeleteProjectModal,
  setProjectId,
  pageSize,
  setPageSize,
  pageSizeOptions,
  totalProjects,
  pageNo,
  setPageNo,
  userInfo,
  toggleHideProject
}) => {
  const navigate = useNavigate();

  const COLUMNS = [
    {
      Header: "",
      accessor: "projectColor",
      Cell: (row) => (
        <div className="flex items-center">
          <span
            className="inline-block h-4 w-4 rounded-sm"
            style={{ backgroundColor: row?.row?.original?.projectColor || "#CBD5E1" }}
            title="Project color"
          />
        </div>
      ),
    },
    {
      Header: "Name",
      accessor: "name",
      Cell: (row) => {
        const isFavouriteProject = userInfo?.fav_projects?.includes(row?.cell?.row?.original?._id)
        return (
          <div
            className="flex-1 font-medium text-sm leading-4 whitespace-nowrap flex items-center gap-2"
            title={row?.cell?.value}
          >
            {row?.cell?.value.length > 20
              ? row?.cell?.value.substring(0, 20) + "..."
              : row?.cell?.value}

            {/* {isFavouriteProject && (
              <Icon
                icon="heroicons:star-16-solid"
                className="w-4 h-4 text-favStar-100"
                title="Favourite Project"
              />
            )} */}
          </div>
        );
      },
    },
    {
      Header: "Assignee",
      accessor: "assignee_details",
      Cell: (row) => {
        return (
          <div>
            <div className="flex justify-end sm:justify-start lg:justify-end xl:justify-start -space-x-1 rtl:space-x-reverse">
              {row?.cell?.value?.length === 0 ? (
                "No Assignee"
              ) : (
                <ModernTooltip
                  content={
                    <div className="flex flex-col gap-2 max-w-[250px]">
                      <span className="text-sm font-semibold mb-1">Assigned to ({row?.cell?.value?.length}):</span>
                      {row?.cell?.value?.map((user, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <ProfilePicture
                            user={user}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm font-medium">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.name || "Unknown User"}
                          </span>
                        </div>
                      ))}
                    </div>
                  }
                  theme="custom-light"
                  placement="top"
                >
                  <div className="flex -space-x-1 rtl:space-x-reverse cursor-pointer" onClick={(e)=>{
                    e.stopPropagation(); 
                    navigate(`/project/${row?.row?.original?._id}?tab=members`);
                  }}>
                    {row?.cell?.value?.slice(0, 3)?.map((user, userIndex) => (
                      <div key={userIndex} className="h-6 w-6 rounded-full ring-1 ring-slate-100 transition-all">
                        <ProfilePicture 
                          user={user}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                    ))}
                    {row?.cell?.value?.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-300 text-xs ring-2 ring-slate-100 dark:ring-slate-700 flex items-center justify-center  transition-all">
                        +{row?.cell?.value?.length - 3}
                      </div>
                    )}
                  </div>
                </ModernTooltip>
              )}
            </div>
          </div>
        );
      },
    },
    {
      Header: "Working Hour",
      accessor: "total_hours",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Status",
      accessor: "progress",
      Cell: (row) => {
        const total_tasks = row.row.original.total_tasks;
        const completed_tasks = row.row.original.completed_tasks;
        const in_progress_tasks = row.row.original.in_progress_tasks || 0;
        const completedPercentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;
        const inProgressPercentage = total_tasks > 0 ? Math.round((in_progress_tasks / total_tasks) * 100) : 0;
        
        return (
          <>
            <span className="min-w-[220px] block">
              {total_tasks === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Ready to get started
                </div>
              ) : (
                <div className="h-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-lg w-full relative">
                  {/* Completed tasks segment */}
                  {completedPercentage > 0 && (
                    <ModernTooltip
                      content={`Completed: ${completedPercentage}%`}
                      theme="custom-light"
                      placement="top"
                    >
                      <div
                        className={`bg-electricBlue-50/80 h-3 absolute top-0 left-0 ${inProgressPercentage > 0 ? 'rounded-l-lg' : 'rounded-lg'} flex items-center justify-center cursor-pointer`}
                        style={{ width: `${completedPercentage}%`, transition: 'width 0.3s' }}
                      >
                        {completedPercentage > 8 && (
                          <span className="text-white text-[10px] font-semibold">{completedPercentage}%</span>
                        )}
                      </div>
                    </ModernTooltip>
                  )}
                  {/* In-progress tasks segment */}
                  {inProgressPercentage > 0 && (
                    <ModernTooltip
                      content={`In Progress: ${inProgressPercentage}%`}
                      theme="custom-light"
                      placement="top"
                    >
                      <div
                        className={`bg-electricBlue-50/50 h-3 absolute top-0 ${completedPercentage > 0 ? 'rounded-r-lg' : 'rounded-lg'} flex items-center justify-center cursor-pointer`}
                        style={{ left: `${completedPercentage}%`, width: `${inProgressPercentage}%`, transition: 'width 0.3s, left 0.3s' }}
                      >
                        {inProgressPercentage > 8 && (
                          <span className="text-white text-[10px] font-semibold">{inProgressPercentage}%</span>
                        )}
                      </div>
                    </ModernTooltip>
                  )}
                </div>
              )}
              <span className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium mt-3">
                {`${completed_tasks}/${total_tasks} Task Completed`}
              </span>
            </span>
          </>
        );
      },
    },
    {
      Header: "Action",
      accessor: "action",
      Cell: (row) => {
        const isHidden = userInfo?.hidden_projects?.includes(row?.cell?.row?.original?._id)
        return (
          <div className="flex space-x-2 items-center">
            <span
              title="Open"
              onClick={() =>
                navigate(
                  `/project/${row.row.original._id}`
                )
              }
            >
              <Icon icon="majesticons:open" className="w-6 h-6 cursor-pointer" />
            </span>
            <span
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setProjectId(row.row.original._id);
                setData(row.row.original);
                setShowEditProjectModal(true);
              }}
            >
              <Icon
                icon="heroicons:pencil-square"
                className="w-6 h-6 cursor-pointer"
              />
            </span>
            {
              (row?.row?.original?._id !== Number(userInfo?.default_project_id) && row?.row?.original?._id !== userInfo?.default_project) &&  
            <span
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                setProjectId(row.row.original._id);
                setShowDeleteProjectModal(true);
              }}
            >
              <Icon icon="ph:trash-light" className="w-6 h-6 cursor-pointer" />
            </span>
            }
            {
              isHidden ?
              <span
                title="Show On Dashboard"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideProject(row.row.original._id);
                }}
              >
                <Icon
                  icon="bx:show"
                  className="w-6 h-6 cursor-pointer"
                />
              </span>
            :
              <span
                title="Hide From Dashboard"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideProject(row.row.original._id);
                }}
              >
                <Icon
                  icon="bx:hide"
                  className="w-6 h-6 cursor-pointer"
                />
              </span>
            }
          </div>
        );
      },
    },
  ];

  const columns = useMemo(() => COLUMNS, [userInfo]);
  const data = useMemo(() => projects, [projects]);

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      pageCount: Math.ceil(totalProjects / pageSize),
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
    prepareRow,
  } = tableInstance;

  return (
    <>
      {projects.length === 0 ? (
        <p className="text-center capitalize">No Project Found</p>
      ) : (
        <Card noborder>
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table
                  className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                  {...getTableProps()}
                >
                  <thead className=" bg-slate-100 dark:bg-slate-700">
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps(
                              column.getSortByToggleProps()
                            )}
                            scope="col"
                            className=" table-th "
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/project/${
                                row.original._id}`
                            );
                          }}
                          className=" even:bg-slate-100 dark:even:bg-slate-700 cursor-pointer"
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
          <div className="flex items-center justify-center md:justify-between mt-6 flex-wrap">
            <div className="flex flex-wrap items-center justify-center md:justify-normal gap-2 md:gap-5">
              <div className="flex items-center space-x-3 rtl:space-x-reverse text-sm font-medium text-slate-600 dark:text-slate-300">
                Showing {(pageNo - 1) * pageSize + 1} to{" "}
                {Math.min(pageNo * pageSize, totalProjects)} of {totalProjects}{" "}
                projects
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Show
                </span>
                <Select
                  value={pageSizeOptions.find(
                    (option) => option.value === pageSize
                  )}
                  onChange={(selectedOption) =>
                    setPageSize(selectedOption.value)
                  }
                  options={pageSizeOptions}
                  className="w-[90px]"
                  classNamePrefix="select"
                  isSearchable={false}
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  entries
                </span>
              </div>
            </div>
            <ul className="flex items-center space-x-3 mt-2 md:mt-0">
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={`${
                    pageNo <= 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => setPageNo(pageNo - 1)}
                  disabled={pageNo <= 1}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              {[...Array(Math.ceil(totalProjects / pageSize))].map(
                (_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === Math.ceil(totalProjects / pageSize) ||
                    (pageNumber >= pageNo - 1 && pageNumber <= pageNo + 1)
                  ) {
                    return (
                      <li key={pageNumber}>
                        <button
                          className={`${
                            pageNumber === pageNo
                              ? "bg-blue-500 text-white"
                              : "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-300"
                          } border border-gray-300 dark:border-slate-700 rounded h-min text-sm font-normal px-3 py-1`}
                          onClick={() => setPageNo(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  } else if (
                    (pageNumber === pageNo - 2 && pageNo > 3) ||
                    (pageNumber === pageNo + 2 &&
                      pageNo < Math.ceil(totalProjects / pageSize) - 2)
                  ) {
                    return (
                      <li key={pageNumber}>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          ...
                        </span>
                      </li>
                    );
                  }
                  return null;
                }
              )}
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={`${
                    pageNo >= Math.ceil(totalProjects / pageSize)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() => setPageNo(pageNo + 1)}
                  disabled={pageNo >= Math.ceil(totalProjects / pageSize)}
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

export default ProjectList;
