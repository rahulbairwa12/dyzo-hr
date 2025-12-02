import React, { useEffect, useState } from "react";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import { fetchAuthPatch } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Switch from "@/components/ui/Switch";
import { useDispatch } from "react-redux";
import { update } from "@/store/api/auth/authSlice";
import { useSelector } from "react-redux";
import { fetchUsers } from "@/store/usersSlice";
import Cookies from "js-cookie";

const styles = {
  multiValue: (base, state) =>
    state.data.isFixed ? { ...base, opacity: "0.5" } : base,
  multiValueLabel: (base, state) =>
    state.data.isFixed ? { ...base, color: "#626262", paddingRight: 6 } : base,
  multiValueRemove: (base, state) =>
    state.data.isFixed ? { ...base, display: "none" } : base,
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const options = [
  { value: "male", label: "male" },
  { value: "female", label: "female" },
  { value: "other", label: "other" },
];

const countrycode = [
  { value: "+91", label: "+91" },
  { value: "+1", label: "+1" },
  { value: "+82", label: "+82" },
  { value: "+52", label: "+52" },
  { value: "+32", label: "+32" },
  { value: "+42", label: "+42" },
  { value: "+90", label: "+90" },
  { value: "+72", label: "+72" },
];

const EmployeeDetailModal = ({
  employeeDetail,
  showPersonalInfoModal,
  setShowPersonalInfoModal,
  fetchEmployeeDetail,
}) => {
  const [sendNotification, setSendNotification] = useState(false);
  const [localNumber, setLocalNumber] = useState(null);
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.user);

  const formatDate = (date) => {
    if (!date) return "";

    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const dateObj = typeof date === "string" ? new Date(date) : date;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const FormValidationSchema = yup
    .object({
      first_name: yup
        .string()
        .required("First Name is required")
        .matches(
          /^[A-Za-z\s]+$/,
          "First Name must contain only letters and spaces"
        )
        .max(50, "First Name cannot exceed 50 characters"),

      last_name: yup.string().optional(),

      email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"), // Already handled as disabled in the form

      phone: yup
        .string()
        .nullable() // Allows null as a valid value
        .test(
          "is-valid-phone",
          "Phone number must be between 10 and 15 digits",
          (value) => {
            if (!value) return true; // If the value is null or undefined, skip validation
            return /^\d{10,15}$/.test(value); // Check if it's between 10 and 15 digits
          }
        ),

      designation: yup
        .string()
        .nullable() // Allows null as a valid value
        .matches(
          /^[A-Za-z\s]*$/,
          "Designation must contain only letters and spaces or be empty"
        )
        .max(100, "Designation cannot exceed 100 characters"),
      // .notRequired(), // Makes the field optional (null or undefined is valid)
    })
    .required();

  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      first_name: employeeDetail?.first_name || "",
      last_name: employeeDetail?.last_name || "",
      email: employeeDetail?.email || "",
      date_of_birth: employeeDetail?.date_of_birth
        ? formatDate(new Date(employeeDetail.date_of_birth))
        : "",
      date_of_joining: employeeDetail?.date_of_joining
        ? formatDate(new Date(employeeDetail.date_of_joining))
        : "",
      gender: employeeDetail?.gender || "",
      phone: employeeDetail?.phone || "",
      designation: employeeDetail?.designation || "",
      country_code: employeeDetail?.country_code || "",
    },
  });

  useEffect(() => {
    reset({
      first_name: employeeDetail?.first_name || "",
      last_name: employeeDetail?.last_name || "",
      email: employeeDetail?.email || "",
      date_of_birth: employeeDetail?.date_of_birth
        ? formatDate(new Date(employeeDetail.date_of_birth))
        : "",
      date_of_joining: employeeDetail?.date_of_joining
        ? formatDate(new Date(employeeDetail.date_of_joining))
        : "",
      gender: employeeDetail?.gender || "",
      phone: employeeDetail?.phone || "",
      designation: employeeDetail?.designation || "",
      country_code: employeeDetail?.country_code || "",
    });
  }, [employeeDetail, reset, localNumber]);

  const onSubmit = async (data) => {

    const formattedData = {
      ...data,
      phone: data.phone ? data.phone : "",
      date_of_birth: data.date_of_birth ? formatDate(data.date_of_birth) : null,
      date_of_joining: data.date_of_joining
        ? formatDate(data.date_of_joining)
        : null,
      getEmail: sendNotification,
    };
    try {
      const isDetailUpdate = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail?._id}/`,
        { body: formattedData }
      );
      if (isDetailUpdate.status) {
        if (employeeDetail?._id === userInfo?._id) {
          // Update auth state if the logged-in user updated their own profile
          const updatedUser = isDetailUpdate.data || isDetailUpdate.user || null;
          if (updatedUser) {
            //  dispatch(update(updatedUser));
            // (userInfo)
            //  dispatch(update({
            //   ...userInfo, // Keep existing data
            //   name: `${data.first_name} ${data.last_name}`.trim(), // Update full name
            //   first_name: data.first_name, // Update first name
            //   last_name: data.last_name, // Update last name
            // }));
            // console.log(userInfo)
         
            const mergedUser = {
              ...updatedUser,
              name: updatedUser.name,
              first_name: data.first_name,
              last_name: data.last_name,
            };
            dispatch(update(mergedUser));
            // Update userInfo cookie as in Layout.jsx
            const userInfoCookie = Cookies.get('userInfo');
            let userInfoData = {};
            try {
              userInfoData = userInfoCookie ? JSON.parse(userInfoCookie) : {};
            } catch (e) {
              userInfoData = {};
            }
            // Merge updated fields (except profile_picture)
            const changedEntries = Object.entries(mergedUser).filter(
              ([key, value]) =>
                key !== 'profile_picture' &&
                key in userInfoData && JSON.stringify(userInfoData[key]) !== JSON.stringify(value)
            );
            if (changedEntries.length > 0) {
              const updatedData = {
                ...userInfoData,
                ...Object.fromEntries(changedEntries),
              };

              Cookies.set('userInfo', JSON.stringify(updatedData));

            }
          }
        }

        dispatch(fetchUsers())
        fetchEmployeeDetail();

        toast.success("Details updated successfully");

        setShowPersonalInfoModal(false);
        setLocalNumber("");

      }
    } catch (error) {
      toast.error("Failed to update details");
    }
  };

  return (
    <div>
      <Modal
        title="Edit Details"
        labelclassName="btn-outline-dark"
        activeModal={showPersonalInfoModal}
        onClose={() => setShowPersonalInfoModal(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
            <Textinput
              name="first_name"
              label="First Name"
              placeholder="First Name"
              register={register}
              error={errors.first_name}
            />

            <Textinput
              name="last_name"
              label="Last Name"
              placeholder="Last Name"
              register={register}
              error={errors.last_name}
            />

            <Textinput
              name="email"
              label="Email"
              className="dark:text-slate-400"
              placeholder="Email"
              register={register}
              error={errors.email}
              disabled={true}
            />

            <FormGroup label="Date Of Birth" id="default-picker2">
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <Flatpickr
                    className="form-control py-2"
                    id="default-picker2"
                    placeholder="dd-mm-yyyy"
                    value={field.value || ""}
                    onChange={(date) => {
                      field.onChange(
                        date.length > 0 ? formatDate(date[0]) : ""
                      );
                    }}
                    options={{
                      altInput: true,
                      altFormat: "d/m/Y",
                      dateFormat: "Y-m-d",
                      allowInput: true,
                    }}
                  />
                )}
              />
            </FormGroup>

            <div>
              <label className="form-label" htmlFor="gender">
                Gender
              </label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={options}
                    styles={styles}
                    className="react-select"
                    classNamePrefix="select"
                    isMulti={false}
                    onChange={(option) =>
                      field.onChange(option ? option.value : "")
                    }
                    value={options.find(
                      (option) => option.value === field.value
                    )}
                    id="gender"
                  />
                )}
              />
            </div>
            <div className="w-full">
              <div className="form-label">
                <label>Mobile No.</label>
              </div>
              <div className="flex">
                <Controller
                  name="country_code"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={countrycode}
                      className="w-[140px] md:w-[128px]"
                      classNamePrefix="select"
                      isMulti={false}
                      onChange={(option) =>
                        field.onChange(option ? option.value : "")
                      }
                      value={countrycode.find(
                        (option) => option.value === field.value
                      )}
                      menuPlacement="top"
                    />
                  )}
                />
                <Textinput
                  name="phone"
                  className=""
                  placeholder="Phone"
                  register={register}
                  error={errors.phone}
                  inputMode="numeric" // This ensures numeric keyboard on mobile devices
                />
              </div>
            </div>
            <Textinput
              name="designation"
              label="Role"
              placeholder="Role"
              register={register}
              error={errors.designation}
              defaultValue=""
            />

            {/* <div className="flex items-end justify-between">
              <div className="pb-2">
                <Switch
                  label="Send Notification"
                  activeClass="bg-primary-500"
                  value={sendNotification}
                  onChange={() => setSendNotification(!sendNotification)}
                  badge
                  prevIcon="material-symbols-light:mail-outline"
                  nextIcon="material-symbols-light:mail-off-outline"
                />
              </div>
            </div> */}
          </div>

          <div className="ltr:text-right rtl:text-left">
            <button className="btn bg-electricBlue-100 hover:bg-electricBlue-50 text-center text-white py-1.5 px-4">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeDetailModal;
