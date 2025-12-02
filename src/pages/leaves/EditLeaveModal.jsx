import React, { Fragment, useState, useEffect } from "react";
import Select from "react-select";
import { Dialog, Transition } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import { fetchGET, fetchAuthFilePut } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";

const styles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, opacity: "0.5" } : base;
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, color: "#626262", paddingRight: 6 }
      : base;
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: "none" } : base;
  },
  option: (provided) => ({
    ...provided,
    fontSize: "14px",
  }),
};

// Enhanced validation schema for edit leave. It now includes conditional rules
// for Short Leave (start/end times) and Direct Contact for Leave (senior selection).
const FormValidationSchema = yup.object({
  leave_type: yup.string().required("Leave type is required"),
  start_date: yup.date().required("Start date is required"),
  end_date: yup
    .date()
    .required("End date is required")
    .min(yup.ref("start_date"), "End date can't be before start date"),
  reason: yup.string().required("Reason is required").min(100, "Reason must be at least 100 characters"),
  short_leave_start_time: yup.string().when("leave_type", {
    is: "Short Leave",
    then: yup.string().required("Start time is required for Short Leave"),
    otherwise: yup.string().notRequired(),
  }),
  short_leave_end_time: yup.string().when("leave_type", {
    is: "Short Leave",
    then: yup
      .string()
      .required("End time is required for Short Leave")
      .test("time-order", "End time must be greater than start time", function (value) {
        const { short_leave_start_time } = this.parent;
        if (short_leave_start_time && value) {
          return value > short_leave_start_time;
        }
        return true;
      }),
    otherwise: yup.string().notRequired(),
  }),
  senior: yup.string().when("leave_type", {
    is: "Direct Contact for Leave",
    then: yup.string().required("Please select your senior"),
    otherwise: yup.string().notRequired(),
  }),
}).required();

const EditLeaveModal = ({
  activeModal,
  onClose,
  leave,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  centered,
  scrollContent,
  themeClass = "bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700",
  title = "Edit Leave",
  fetchLeaves,
  fetchLeaveJourneyData,
}) => {
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [attachedFileName, setAttachedFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector((state) => state?.auth?.user);

  useEffect(() => {
    const fetchEmployeeList = async () => {
      try {
        // Using the dedicated activeUsers endpoint to fetch only active employees
        const { data } = await fetchGET(
          `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`
        );
        // Convert to React-Select options
        const options = data.map((emp) => ({
          value: emp._id,
          label: emp.name,
          image: `${import.meta.env.VITE_APP_DJANGO}${emp.profile_picture}`,
        }));
        setEmployeeOptions(options);
      } catch (error) {
        console.log("Error fetching employees:", error);
      }
    };

    fetchEmployeeList();
  }, [userInfo.companyId]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "onChange", // Validate on every change so errors are shown immediately
    defaultValues: {
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason,
      senior: leave.senior,
      half_day_shift: leave.half_day_shift,
      short_leave_start_time: leave.short_leave_start_time,
      short_leave_end_time: leave.short_leave_end_time,
    },
  });

  useEffect(() => {
    reset({
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason,
      senior: leave.senior,
      half_day_shift: leave.half_day_shift,
      short_leave_start_time: leave.short_leave_start_time,
      short_leave_end_time: leave.short_leave_end_time,
    });
  }, [leave, reset]);

  const leaveType = watch("leave_type");

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();

    formData.append("employee", leave.employee || leave.employee_id);
    formData.append("start_date", moment(data.start_date).format("YYYY-MM-DD"));
    formData.append("end_date", moment(data.end_date).format("YYYY-MM-DD"));
    formData.append("leave_type", data.leave_type);
    formData.append("reason", data.reason);
    if (data.senior) {
      formData.append("senior", data.senior);
    }
    if (attachedFileName) {
      formData.append("attachment", attachedFileName);
    }
    if (data.leave_type === "Half Day" && data.half_day_shift) {
      formData.append("reason", `${data.reason} (${data.half_day_shift.label})`);
    } else if (
      data.leave_type === "Short Leave" &&
      data.short_leave_start_time &&
      data.short_leave_end_time
    ) {
      formData.append(
        "reason",
        `${data.reason} (From ${data.short_leave_start_time} to ${data.short_leave_end_time})`
      );
    }

    try {
      const response = await fetchAuthFilePut(
        `${import.meta.env.VITE_APP_DJANGO}/leave/update/${leave.leaveId}/${userInfo._id}/`,
        { body: formData }
      );
      if (response.status === 1) {
        toast.success("Leave request updated successfully.");
        fetchLeaves();
        if (fetchLeaveJourneyData) fetchLeaveJourneyData();
        onClose();
      } else {
        toast.error("Failed to update leave request.");
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "An error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const leaveTypes = [
    { value: "Half Day", label: "Half Day" },
    { value: "Work from Home", label: "Work from Home" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Sick Leave", label: "Sick Leave" },
    { value: "Unpaid Leave", label: "Unpaid Leave" },
    { value: "Emergency Leave", label: "Emergency Leave" },
    { value: "Personal Leave", label: "Personal Leave" },
    { value: "Short Leave", label: "Short Leave" },
    { value: "Direct Contact for Leave", label: "Direct Contact for Leave" },
  ];

  return (
    <Transition appear show={activeModal} as={Fragment}>
      <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter={noFade ? "" : "duration-300 ease-out"}
          enterFrom={noFade ? "" : "opacity-0"}
          enterTo={noFade ? "" : "opacity-100"}
          leave={noFade ? "" : "duration-200 ease-in"}
          leaveFrom={noFade ? "" : "opacity-100"}
          leaveTo={noFade ? "" : "opacity-0"}
        >
          {!disableBackdrop && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-filter backdrop-blur-sm" />
          )}
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full justify-center text-center p-6 ${centered ? "items-center" : "items-start"}`}
          >
            <Transition.Child
              as={Fragment}
              enter={noFade ? "" : "duration-300 ease-out"}
              enterFrom={noFade ? "" : "opacity-0 scale-95"}
              enterTo={noFade ? "" : "opacity-100 scale-100"}
              leave={noFade ? "" : "duration-200 ease-in"}
              leaveFrom={noFade ? "" : "opacity-100 scale-100"}
              leaveTo={noFade ? "" : "opacity-0 scale-95"}
            >
              <Dialog.Panel
                className={`w-full transform overflow-hidden rounded-md bg-white dark:bg-slate-800 text-left align-middle shadow-xl transition-all ${className}`}
              >
                <div
                  className={`relative overflow-hidden py-4 px-5 text-white flex justify-between ${themeClass}`}
                >
                  <h2 className="capitalize leading-6 tracking-wider font-medium text-base text-white">
                    {title}
                  </h2>
                  <button onClick={onClose} className="text-[22px]">
                    <Icon icon="heroicons-outline:x" />
                  </button>
                </div>
                <div className={`px-6 py-8 ${scrollContent ? "overflow-y-auto max-h-[400px]" : ""}`}>
                  <p className="mb-4">Edit Leave for {leave.employeeName}</p>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="my-2">
                      <label htmlFor="leave_type" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                        Select leave type
                      </label>
                      <div className="mt-2">
                        <Controller
                          name="leave_type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={leaveTypes}
                              styles={styles}
                              className="react-select"
                              classNamePrefix="select"
                              onChange={(option) => {
                                field.onChange(option.value);
                              }}
                              value={leaveTypes.find(option => option.value === field.value)}
                            />
                          )}
                        />
                        {errors.leave_type && <p className="text-red-500 text-sm mt-2">{errors.leave_type.message}</p>}
                      </div>
                    </div>

                    <div className="flex flex-row gap-4 justify-between">
                      <div className="w-1/2">
                        <label htmlFor="start_date" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                          From date
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="start_date"
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                              <Flatpickr
                                className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                placeholder="yyyy, dd M"
                                value={value ? new Date(value) : new Date()}
                                onChange={(date) => {
                                  onChange(moment(date[0]).format("YYYY-MM-DD"));
                                }}
                                onBlur={onBlur}
                                options={{
                                  altInput: true,
                                  altFormat: "F j, Y",
                                  dateFormat: "Y-m-d",
                                }}
                              />
                            )}
                          />
                          {errors.start_date && <p className="text-red-500 text-sm mt-2">{errors.start_date.message}</p>}
                        </div>
                      </div>
                      <div className="w-1/2">
                        <label htmlFor="end_date" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                          To date
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="end_date"
                            control={control}
                            render={({ field: { onChange, onBlur, value } }) => (
                              <Flatpickr
                                className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                placeholder="yyyy, dd M"
                                value={value ? new Date(value) : new Date()}
                                onChange={(date) => {
                                  onChange(moment(date[0]).format("YYYY-MM-DD"));
                                }}
                                onBlur={onBlur}
                                options={{
                                  altInput: true,
                                  altFormat: "F j, Y",
                                  dateFormat: "Y-m-d",
                                }}
                              />
                            )}
                          />
                          {errors.end_date && <p className="text-red-500 text-sm mt-2">{errors.end_date.message}</p>}
                        </div>
                      </div>
                    </div>

                    {leaveType === "Half Day" && (
                      <div>
                        <label htmlFor="half_day_shift" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                          Select shift
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="half_day_shift"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={[
                                  { value: "Morning Shift", label: "Morning Shift" },
                                  { value: "Evening Shift", label: "Evening Shift" },
                                ]}
                                styles={styles}
                                className="react-select"
                                classNamePrefix="select"
                              />
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {leaveType === "Short Leave" && (
                      <>
                        <div className="flex flex-row gap-4 justify-between">
                          <div className="w-1/2">
                            <label htmlFor="short_leave_start_time" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                              Start Time
                            </label>
                            <div className="mt-2">
                              <Controller
                                name="short_leave_start_time"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="time"
                                    className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                    {...field}
                                    onBlur={field.onBlur}
                                  />
                                )}
                              />
                              {errors.short_leave_start_time && (
                                <p className="text-red-500 text-sm mt-2">{errors.short_leave_start_time.message}</p>
                              )}
                            </div>
                          </div>
                          <div className="w-1/2">
                            <label htmlFor="short_leave_end_time" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                              End Time
                            </label>
                            <div className="mt-2">
                              <Controller
                                name="short_leave_end_time"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="time"
                                    className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                    {...field}
                                    onBlur={field.onBlur}
                                  />
                                )}
                              />
                              {errors.short_leave_end_time && (
                                <p className="text-red-500 text-sm mt-2">{errors.short_leave_end_time.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* You can optionally display a static message as well */}
                        {errors.short_leave_end_time && (
                          <p className="text-red-500 text-sm mt-2">End time must be greater than start time.</p>
                        )}
                      </>
                    )}

                    {leaveType === "Direct Contact for Leave" && (
                      <div>
                        <label htmlFor="senior" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                          Select your senior
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="senior"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={employeeOptions}
                                styles={styles}
                                className="react-select"
                                classNamePrefix="select"
                                placeholder="Select a senior"
                              />
                            )}
                          />
                          {errors.senior && <p className="text-red-500 text-sm mt-2">{errors.senior.message}</p>}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="relative">
                        <label htmlFor="reason" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">
                          Leave reason
                        </label>
                        <div className="mt-2">
                          <textarea
                            id="reason"
                            name="reason"
                            placeholder="Please provide a valid reason for your leave application (at least 100 characters)"
                            className="border block w-full rounded-md py-3 px-3 text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm sm:leading-6"
                            {...register("reason")}
                          />
                        </div>
                        {errors.reason && <p className="text-red-500 text-sm mt-2">{errors.reason.message}</p>}
                        <span className="absolute bottom-2 right-3 cursor-pointer">
                          <Icon icon="mdi:sparkles" className="w-6 h-6 dark:text-white" />
                        </span>
                      </div>
                    </div>

                    {leave.attachment && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300">
                          Current Attachment
                        </label>
                        <a
                          href={`${import.meta.env.VITE_APP_DJANGO}${leave.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-500 hover:underline"
                        >
                          {leave.attachment.split("/").pop()}
                        </a>
                      </div>
                    )}

                    <div className="mb-3">
                      <label htmlFor="formFile" className="mb-2 inline-block text-[#747474] dark:text-gray-300">
                        Attach New File (if needed)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          id="formFile"
                          name="attachment"
                          className="relative m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 dark:border-neutral-600 bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-700 dark:text-neutral-200 transition duration-300 ease-in-out"
                          onChange={(e) => setAttachedFileName(e.target.files[0])}
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className="flex justify-center rounded-md bg-[#E6EDF8] dark:bg-gray-700 dark:hover:bg-gray-600 px-6 py-2 text-sm font-semibold hover:bg-[#0046B5] hover:text-white leading-6 text-black dark:text-white shadow-sm"
                        disabled={loading}
                      >
                        {loading ? "Saving Changes..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditLeaveModal;
