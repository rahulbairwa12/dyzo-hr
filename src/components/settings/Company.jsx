import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  fetchAuthGET,
  fetchAuthPut,
  patchUpdateAPI,
} from "@/store/api/apiSlice";
import DatePicker from "./DatePicker";
import Textinput from "../ui/Textinput";
import Button from "../ui/Button";
import Fileinput from "../ui/Fileinput";
import { toast, ToastContainer } from "react-toastify";
import LoaderCircle from "../Loader-circle";

const Company = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const [companyDetail, setCompanyDetail] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedLoading, setUpdateLoading] = useState(false);
  const [updatedTimes, setUpdatedTimes] = useState({});
  const [overtime, setOvertime] = useState("");
  const [casualLeave, setCasualLeave] = useState("");
  const [updateCompanyName, setupdateCompanyName] = useState(null);
  const [companyName, setcompanyName] = useState(null);

  const [id, setId] = useState(null);
  const [error, seterror] = useState(null);

  const handleFileChange2 = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const companyDetail = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/schedule/${userInfo?.companyId}/`
        );
        setId(companyDetail.id);

        const company = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/`
        );
        setcompanyName(company.company_name);

        if (companyDetail.status) {
          setCompanyDetail(companyDetail);
          setOvertime(companyDetail.overtime_bonus_per_hour || "");
          setCasualLeave(companyDetail.casual_leaves_per_month || "");
          if (companyDetail.company_logo) {
            setSelectedFile(companyDetail.company_logo);
          }
          setUpdatedTimes({
            "Company Start Time": companyDetail.start_time,
            "Company End Time": companyDetail.end_time,
            "Break Start Time": companyDetail.break_start_time,
            "Break End Time": companyDetail.break_end_time,
            "Half Day Hours": companyDetail.half_day_hour,
            "Full Day Hours": companyDetail.full_day_hour,
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [userInfo?.companyId]);

  const handleTimeChange = (title, time) => {
    setUpdatedTimes((prevTimes) => ({
      ...prevTimes,
      [title]: time,
    }));
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    const companyData = new FormData();

    // if (casualLeave === "") {
    //   seterror("This field is required");
    //   return;
    // } else {
    //   seterror(null);
    // }

    formData.append("start_time", updatedTimes["Company Start Time"]);
    formData.append("end_time", updatedTimes["Company End Time"]);
    formData.append("break_start_time", updatedTimes["Break Start Time"]);
    formData.append("break_end_time", updatedTimes["Break End Time"]);
    formData.append("half_day_hour", updatedTimes["Half Day Hours"]);
    formData.append("full_day_hour", updatedTimes["Full Day Hours"]);
    formData.append("overtime_bonus_per_hour", overtime);
    formData.append("casual_leaves_per_month", 1);
    formData.append("Update_Company_Name", updateCompanyName);

    if (updateCompanyName) {
      companyData.append("company_name", updateCompanyName);
    }

    try {
      setUpdateLoading(true);
      const isCompanyDetailUpdated = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/schedule/update/${
          userInfo?.companyId
        }/`,
        { body: formData }
      );

      if (companyData.has("company_name")) {
        await patchUpdateAPI(`company/${userInfo?.companyId}/update/`, { body: companyData });
      }

      if (isCompanyDetailUpdated?.status) {
        toast.success("Details updated successfully");
      } else {
        toast.error("Failed to update schedule details");
      }
    } catch (error) {
      toast.error("Failed to update details");
      console.error("Update error:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <ToastContainer/>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Company Details
      </h2>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoaderCircle />
        </div>
      ) : (
        <form className="space-y-4">
          {/* <div className="mb-4">
            <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">
              Update Company Logo
            </label>
            <Fileinput
              name="companyLogo"
              selectedFile={selectedFile}
              onChange={handleFileChange2}
              preview
              disabled={!userInfo.isAdmin}
            />
            {selectedFile && typeof selectedFile !== 'string' && userInfo.isAdmin && (
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded text-sm"
                onClick={handleRemoveFile}
              >
                Remove Logo
              </button>
            )}
          </div> */}

          <div>
            <Textinput
              label="Company Name"
              id="Update_CompanyName"
              type="text"
              placeholder="Company Name"
              value={updateCompanyName}
              defaultValue={companyName}
              onChange={(e) => setupdateCompanyName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={!userInfo.isAdmin}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              title="Company Start Time"
              initialValue={companyDetail.start_time}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            <DatePicker
              title="Company End Time"
              initialValue={companyDetail.end_time}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            <DatePicker
              title="Break Start Time"
              initialValue={companyDetail.break_start_time}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            <DatePicker
              title="Break End Time"
              initialValue={companyDetail.break_end_time}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            <DatePicker
              title="Half Day Hours"
              initialValue={companyDetail.half_day_hour}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            <DatePicker
              title="Full Day Hours"
              initialValue={companyDetail.full_day_hour}
              onTimeChange={handleTimeChange}
              disabled={!userInfo.isAdmin}
            />
            {/* <div>
              <Textinput
                label="Casual leaves per month"
                id="casual_leave"
                type="number"
                placeholder="Casual leaves per month"
                value={casualLeave}
                onChange={(e) => setCasualLeave(e.target.value)}
                defaultValue={casualLeave}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={!userInfo.isAdmin}
              />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>
            <div>
              <Textinput
                label="Overtime Bonus per Hour"
                id="overtime"
                type="number"
                placeholder="Overtime Bonus per hour"
                value={overtime}
                onChange={(e) => setOvertime(e.target.value)}
                defaultValue={overtime}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={!userInfo.isAdmin}
              />
            </div> */}
          </div>

          {userInfo.isAdmin && (
            <div className="mt-6">
              <Button
                text="Update Details"
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium"
                onClick={handleUpdate}
                isLoading={updatedLoading}
              />
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default Company;
