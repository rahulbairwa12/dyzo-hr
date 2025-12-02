import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import { fetchGET } from "@/store/api/apiSlice";
import { toast, ToastContainer } from "react-toastify";
import Button from "@/components/ui/Button";
import Grid from "@/components/skeleton/Grid";
import EmployeeGrid from "@/components/employee/EmployeeGrid";
import EmployeeList from "@/components/employee/EmployeeList";
import GlobalFilter from "@/pages/table/react-tables/GlobalFilter";
import { formatDateWithMonthName } from "@/helper/helper";
import Select from "@/components/ui/Select";
import SkeletionTable from "@/components/skeleton/Table";
import { useNavigate } from "react-router-dom";


const options = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
  { value: "inactive", label: "In-Active" },
];

const EmployeeManagement = () => {
  const [employeesList, setEmployeesList] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filler, setFiller] = useState("list");
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(true);
  const [downloadButton, setDownloadButton] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const [filterOption, setFilterOption] = useState("all");
  const navigate = useNavigate()

  const fetchEmployee = async () => {
    try {
      const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`);
      if (data) {
        setEmployeesList(data);
        setFilteredEmployees(data);
      }
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [filler]);

  useEffect(() => {
    if (!filterText) {
      if (filterOption === 'active') {
        setFilteredEmployees(employeesList.filter(employee => employee.isActive));
      } else if (filterOption === 'inactive') {
        setFilteredEmployees(employeesList.filter(employee => !employee.isActive));
      } else {
        setFilteredEmployees(employeesList);
      }
    } else {
      setFilteredEmployees(
        employeesList.filter(employee => {
          if (employee && employee.name) {
            return employee.name.toLowerCase().includes(filterText.toLowerCase());
          }
          return false;
        })
      );
    }
  }, [filterText, employeesList]);

  useEffect(() => {
    let statusFilteredElements;
    if (filterOption === 'all') {
      statusFilteredElements = employeesList;
    } else if (filterOption === 'active') {
      statusFilteredElements = employeesList.filter(employee => employee.isActive);
    } else if (filterOption === 'inactive') {
      statusFilteredElements = employeesList.filter(employee => !employee.isActive);
    } else {
      statusFilteredElements = employeesList;
    }
    setFilteredEmployees(statusFilteredElements);
  }, [filterOption]);


  const downloadEmployeesData = () => {
    setDownloadButton(true);
    const employeesCSV = employeesList.map(employee => {

      const formattedDateOfBirth = employee.date_of_birth ? formatDateWithMonthName(employee.date_of_birth) : "";

      return `${employee.name},${employee.email},${employee.phone},${employee.salary},${formattedDateOfBirth}\n`;

    }).join('');

    const csvContent = `Name,Email,Phone,Salary,Date of Birth,\n${employeesCSV}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadButton(false);
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-black-800 p-2 sm:p-4">
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">Users</h4>
        <div
          className={`${width < breakpoints.md ? "space-x-2" : ""
            } md:flex md:space-x-4 md:justify-end items-center rtl:space-x-reverse`}
        >
          {/* <Button
            icon="heroicons:list-bullet"
            text={`${width < breakpoints.md ? "" : "List view"}`}
            disabled={isLoaded}
            className={`${filler === "list"
              ? "bg-slate-900 dark:bg-slate-700 text-white"
              : " bg-white dark:bg-slate-800 dark:text-slate-300"
              } h-min text-sm font-normal`}
            iconClass="text-lg"
            onClick={() => setFiller("list")}
          /> */}


          {/* <Button
            icon="heroicons-outline:view-grid"
            text={`${width < breakpoints.md ? "" : "Grid view"}`}
            disabled={isLoaded}
            className={`${filler === "grid"
              ? "bg-slate-900 dark:bg-slate-700 text-white"
              : " bg-white dark:bg-slate-800 dark:text-slate-300"
              } h-min text-sm font-normal`}
            iconClass="text-lg"
            onClick={() => setFiller("grid")}
          /> */}

          <Button
            icon="fluent-mdl2:chat-invite-friend"
            text={`${width < breakpoints.md ? "" : "Invite User"}`}
            className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
            iconClass="text-lg"
            onClick={()=>navigate("/invite-user")}
          />

          <Button
            icon="ic:twotone-download"
            text={`${width < breakpoints.md ? "" : "Download"}`}
            className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
            iconClass="text-lg"
            onClick={downloadEmployeesData}
            disabled={downloadButton}
          />
        </div>

      </div>
      <div className="flex justify-between items-center my-4"> 
        <GlobalFilter filter={filterText} setFilter={setFilterText} />
        <Select 
          className="dark:bg-slate-800 h-min text-sm font-normal w-full" 
          options={options} 
          value={filterOption}
          onChange={(e) => setFilterOption(e.target.value)} 
        />
      </div>

      {isLoaded && filler === "grid" && (
        <Grid count="10" />
      )}

      {isLoaded && filler === "list" && (
        <SkeletionTable count='20' />
      )}


      {filler === "grid" && !isLoaded && (
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mt-16">
          {filteredEmployees.map((employee, index) => (
            <EmployeeGrid employee={employee} index={index} />
          ))}
        </div>
      )}

      {filler === "list" && !isLoaded && (
        <div>
          <EmployeeList employeesList={filteredEmployees} />
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
