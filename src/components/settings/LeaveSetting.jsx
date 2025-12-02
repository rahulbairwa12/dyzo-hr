import React, { useState, useEffect } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchAuthPut, fetchAuthGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";

// Validation schema
const FormValidationSchema = yup
  .object({
    casual_leaves_per_month: yup
      .string()
      .required("Casual Leave Per Month is required"),
    casual_leave_apply_before: yup
      .string()
      .required("Casual Leave Apply Before is required"),
    leave_approval_person: yup
      .string()
      .required("Leave Approval Required is required"),
    leave_approval_by: yup
      .mixed()
      .required("Who can approve leave is required"),
  })
  .required();

const LeaveSetting = () => {
  const [updating, setUpdating] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    control,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
  });

  const leaveApprovalOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Team Leader", label: "Team Leader" },
    {
      value: "Admin and Team Leader both",
      label: "Admin and Team Leader both",
    },
  ];

  const getSchedule = async () => {
    try {
      const data = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/schedule/${userInfo?.companyId}/`
      );
      if (data.status) {
        setValue("casual_leaves_per_month", data.casual_leaves_per_month);
        setValue("casual_leave_apply_before", data.casual_leave_apply_before);
        setValue("leave_approval_person", data.leave_approval_person);

        const selectedLeaveApprovalOption = leaveApprovalOptions.find(
          (option) => option.value === data.leave_approval_by
        );

        if (selectedLeaveApprovalOption) {
          setValue("leave_approval_by", selectedLeaveApprovalOption);
        } else {
          setValue("leave_approval_by", null);
        }
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to fetch leave settings.");
    }
  };

  useEffect(() => {
    getSchedule();
  }, []);

  const updateLeaveSettingsAPI = async (data) => {
    try {
      setUpdating(true);
      const leaveSettingsData = {
        casual_leaves_per_month: data.casual_leaves_per_month,
        casual_leave_apply_before: data.casual_leave_apply_before,
        leave_approval_person: data.leave_approval_person,
        leave_approval_by: data.leave_approval_by.value,
      };
      const response = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/schedule/update/${
          userInfo?.companyId
        }/`,
        {
          body: leaveSettingsData,
        }
      );
      if (response.status) {
        toast.success("Leave Settings Updated Successfully!");
      } else {
        toast.error(response.message || "Failed to update leave settings.");
      }
    } catch (error) {
      console.error("Error updating leave settings:", error);
      toast.warning("Error updating leave settings.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Leave Settings</h2>
      <form
        onSubmit={handleSubmit(updateLeaveSettingsAPI)}
        className="grid gap-4"
      >
        <div className="relative">
          <Textinput
            name="casual_leaves_per_month"
            label="Casual Leave Per Month"
            register={register}
            error={errors.casual_leaves_per_month}
            placeholder="Casual Leave Per Month"
            disabled={!userInfo?.isAdmin}
          />
        </div>

        <div className="relative">
          <Textinput
            name="casual_leave_apply_before"
            label="Casual Leave Apply Before"
            register={register}
            error={errors.casual_leave_apply_before}
            placeholder="Casual Leave Apply Before"
            disabled={!userInfo?.isAdmin}
          />
        </div>

        <div className="relative">
          <Textinput
            name="leave_approval_person"
            label="Leave Approval Required"
            register={register}
            error={errors.leave_approval_person}
            placeholder="Leave Approval Required"
            disabled={!userInfo?.isAdmin}
          />
        </div>

        <div className="relative">
          <label className="form-label" htmlFor="leave_approval_by">
            Who can approve leave
          </label>
          <Controller
            name="leave_approval_by"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={leaveApprovalOptions}
                className="react-select"
                classNamePrefix="select"
                isMulti={false}
                onChange={(option) => field.onChange(option)}
                value={field.value}
                id="leave_approval_by"
                isDisabled={!userInfo?.isAdmin}
              />
            )}
          />
          {errors.leave_approval_by && (
            <p className="text-red-600">{errors.leave_approval_by.message}</p>
          )}
        </div>

        {userInfo?.isAdmin && (
          <div className="col-span-1">
            <div className="ltr:text-left rtl:text-left">
              <button
                className="text-center w-40 bg-[#4669fa] text-md p-4 text-white rounded-md hover:bg-[#4669fa] transition duration-200 ease-in-out"
                type="submit"
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Settings"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default LeaveSetting;
