import React from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import VacancyLogo from "../../assets/images/hr-module/vacancy.png";
import VacanciesLogo from "../../assets/images/hr-module/vacancies.png";
import ApplicantsLogo from "../../assets/images/hr-module/applicants.png";
import InterviewsLogo from "../../assets/images/hr-module/scheduled.png";
import RemarksLogo from "../../assets/images/hr-module/remark.png";
import VacanciesList from "./VacanciesList";
import { NavLink } from "react-router-dom";

const HRControlDesk = () => {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 lg:grid-cols-3 gap-4 text-center py-4 ">
        <Card className="w-full " bodyClass="px-1 py-2">
          <h3 className="text-base font-semibold  ">Vacancy</h3>
          <img
            src={VacancyLogo}
            alt=""
            className="w-20 h-[80px] mx-auto my-6 dark:invert"
          />
           <NavLink to="/Add-Vacancy">
          <Button text="Add Vacancy" className="btn-dark py-1 w-11/12   " />
          </NavLink>
        </Card>
        <Card className="w-full " bodyClass="px-1 py-2">
          <h3 className="text-base font-semibold ">Vacancies</h3>
          <img
            src={VacanciesLogo}
            alt=""
            className="w-20 h-[80px] mx-auto my-6 dark:invert"
          />
          <NavLink to="/vacancies-list">
            <Button
              text="View Vacancies"
              className="btn-dark py-1 w-11/12   "
            />
          </NavLink>
        </Card>
        <Card className="w-full " bodyClass="px-1 py-2">
          <h3 className="text-base font-semibold ">Applicants</h3>
          <img
            src={ApplicantsLogo}
            alt=""
            className="w-20 h-[80px] mx-auto my-6 dark:invert"
          />
           <NavLink to="/View-Applicants">
          <Button text="View Applicants" className="btn-dark py-1 w-11/12   " />
          </NavLink>
        </Card>
        <Card className="w-full " bodyClass="px-1 py-2">
          <h3 className="text-base font-semibold ">Scheduled Interviews</h3>
          <img
            src={InterviewsLogo}
            alt=""
            className="w-20 h-[80px] mx-auto my-6  dark:invert"
          />
           <NavLink to="/scheduled-interviews">
          <Button text="View Interviews" className="btn-dark py-1 w-11/12   " />
          </NavLink>
        </Card>
        <Card className="w-full " bodyClass="px-1 py-2">
          <h3 className="text-base font-semibold">Interviewers Remarks</h3>
          <img
            src={RemarksLogo}
            alt=""
            className="w-20 h-[80px] mx-auto my-6 dark:invert"
          />
          <NavLink to="/Interview-remark">
          <Button text="View Remarks" className="btn-dark py-1 w-11/12 " />
          </NavLink>
        </Card>
      </div>
      <VacanciesList />
    </div>
  );
};

export default HRControlDesk;
