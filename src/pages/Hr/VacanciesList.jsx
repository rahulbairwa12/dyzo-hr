import React, { Fragment, useState, useMemo, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { useSelector } from "react-redux";
import { fetchGET } from "@/store/api/apiSlice";
import VacanciesListTable from "./VacanciesListTable";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

const buttons = [
  {
    title: "Active Jobs",
  },
  {
    title: "Inactive Jobs",
  },
];

const VacanciesList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const { user } = useSelector((state) => state.auth);
  const [vacanciesList, setVacanciesList] = useState([]);

  useEffect(() => {
    fetchVacanciesList();
  }, []);

  const fetchVacanciesList = async () => {
    try {
      const response = await fetchGET(
        `${baseURL}/api/recruitments/?companyId=${user.companyId}`
      );
      if (response.status === 1) {
        setVacanciesList(response.data);
      }
    } catch (error) {
      toast.error(error);
    }
  };

  const transformedData = vacanciesList.map((item) => ({
    ...item,
    job_id_duplicate: item.job_id,
  }));

  const activeJobs =
    transformedData &&
    transformedData.filter((data) => data.is_active === true);

  const inactiveJobs =
    transformedData &&
    transformedData.filter((data) => data.is_active === false);

  return (
    <div className="my-5">
      <h2
        className={`text-xl ${
          location.pathname === "/hr-control-desk/vacancies-list"
            ? "flex items-center gap-2"
            : ""
        } `}
      >
        {location.pathname === "/hr-control-desk/vacancies-list" ? (
          <Icon
            icon="heroicons-arrow-left-circle"
            className="w-10 h-10 cursor-pointer rounded-full "
            onClick={() => {
              navigate(-1);
            }}
          />
        ) : (
          ""
        )} 
        Vacancies List
      </h2>
      <div className="my-5">
        <Tab.Group>
          <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
            {buttons.map((item, i) => (
              <Tab as={Fragment} key={i}>
                {({ selected }) => (
                  <button
                    className={` text-sm font-medium mb-7 capitalize
              ring-0 foucs:ring-0 focus:outline-none px-2
              transition duration-150 before:transition-all before:duration-150 relative 
              before:absolute before:left-1/2 before:bottom-[-6px] before:h-[1.5px] before:bg-primary-500 
              before:-translate-x-1/2 
              ${
                selected
                  ? "text-primary-500 before:w-full"
                  : "text-slate-500 before:w-0 dark:text-slate-300"
              }
              `}
                  >
                    {item.title}
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <VacanciesListTable
                vacanciesList={activeJobs}
                title={"Active Jobs"}
              />
            </Tab.Panel>
            <Tab.Panel>
              <VacanciesListTable
                vacanciesList={inactiveJobs}
                title={"Inactive Jobs"}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default VacanciesList;
