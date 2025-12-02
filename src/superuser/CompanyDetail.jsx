import LoaderCircle from "@/components/Loader-circle";
import Card from "@/components/ui/Card";
import { fetchAuthGET } from "@/store/api/apiSlice";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CompanyEmployeeList from "./CompanyEmployeeList";

const CompanyDetail = () => {
  const { companyId } = useParams();
  const [companyDetail, setCompanyDetail] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanyDetail = async () => {
      try {
        setLoading(true);
        const response = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/super/company/${companyId}/`
        );
        // Check that the response has content before setting state
        if (response && Object.keys(response).length > 0) {
          setCompanyDetail(response);
        }
      } catch (error) {
        toast.error("Error fetching company details");
        console.error("Error in company detail fetching", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyDetail();
  }, [companyId]);

  // Destructure the company fields from the companyDetail response
  const {
    company_name,
    company_address,
    company_size,
    created_at,
    total_employees,
    total_projects,
  } = companyDetail;

  return (
    <div className="space-y-5">
      {loading ? (
        <LoaderCircle />
      ) : (

        <>
          <Card title={company_name || "Company Detail"}>
          
              <div className="bg-slate-100 dark:bg-slate-700 rounded px-4 py-4 flex flex-wrap justify-between">
                {/* Company Address */}
                <div className="mr-3 mb-3 space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Company Address
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {company_address || "Not Provided"}
                  </div>
                </div>

                {/* Company Size */}
                <div className="mr-3 mb-3 space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Company Size
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {company_size || "N/A"}
                  </div>
                </div>

                {/* Created At */}
                <div className="mr-3 mb-3 space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Created At
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {moment(created_at).format("DD-MMM-YYYY")}
                  </div>
                </div>

                {/* Total Employees */}
                <div className="mr-3 mb-3 space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Total Employees
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {total_employees !== undefined ? total_employees : "N/A"}
                  </div>
                </div>

                {/* Total Projects */}
                <div className="mr-3 mb-3 space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Total Projects
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {total_projects !== undefined ? total_projects : "N/A"}
                  </div>
                </div>
              </div>
           
          </Card>
            <CompanyEmployeeList />

        </>



      )}
    </div>
  );
};

export default CompanyDetail;
