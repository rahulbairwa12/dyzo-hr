import React, { useEffect, useState } from "react";
import Select, { components } from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormGroup from "@/components/ui/FormGroup";
import { fetchGET, fetchPOST } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { intialLetterName } from "@/helper/helper";
import CustomMenuList from "../ui/CustomMenuList";
import AddClientModal from "../client/AddClientModal";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { checkUserLimit, setShowLimitModal } from "@/store/planSlice";
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import { fetchProjects } from "@/store/projectsSlice";
import { useDispatch } from "react-redux";
import { ProfilePicture } from "../ui/profilePicture";

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
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const options = [
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
];

const OptionComponent = ({ data, ...props }) => {
  // Create a new data object with the full image URL
  
  const dataWithFullImageUrl = {
      ...data,
      image: data?.image && !data.image.startsWith('http') && !data.image.includes('null')
          ? `${import.meta.env.VITE_APP_DJANGO}${data.image}` 
          : data?.image,
  };

 
  return (
    <components.Option {...props}>
      <span className="flex items-center space-x-4">
        <div className="flex-none">
          <div className="h-7 w-7 rounded-full">
            <ProfilePicture user={dataWithFullImageUrl} />
          </div>
        </div>
        <span className="flex-1">{data.label}</span>
      </span>
    </components.Option>
  );
};

const AddProject = ({ showAddProjectModal, setShowAddProjectModal }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [client, setClient] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const navigate = useNavigate();
  const [isProject, setisProject] = useState(false);
  const dispatch = useDispatch();

  const canAddTask = useSelector((state) => state.plan.canAddTask);

  useEffect(() => {
    const fetchEmployeeList = async () => {
      try {
        const { data } = await fetchGET(
          `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${
            userInfo.companyId
          }/`,
        );
        const onlyEmployees = data.map((emp) => ({
          value: emp._id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          label: emp.name,
          image: `${emp.profile_picture}`,
          is_client: emp.is_client, // Added property to filter clients
        }));
        setAssigneeOptions(onlyEmployees);
      } catch (error) {
        // Handle error if needed
      }
    };
    fetchEmployeeList();
  }, [userInfo]);

  const fetchClientList = async () => {
    try {
      const { data } = await fetchGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/clients/by_company/${
          userInfo.companyId
        }/`,
      );
      const options = data.map((emp) => ({
        value: emp._id,
        label: emp.clientName,
        image: null,
      }));
      setClient(options);
    } catch (error) {
      // Handle error if needed
    }
  };

  useEffect(() => {
    fetchClientList();
  }, []);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Project name is required").trim(),
      stagingServerURL: yup.string().url("Please enter a valid URL").nullable(),
      liveServerURL: yup.string().url("Please enter a valid URL").nullable(),
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
  });

  const onSubmit = async (data) => {
    // Check subscription limits before creating project
    dispatch(checkUserLimit());
    if (!canAddTask) {
      dispatch(setShowLimitModal(true));
      return;
    }

    const formattedData = {
      ...data,
      companyId: userInfo.companyId,
      clientAssignee: data.clientAssignee ? data.clientAssignee : [], // Updated payload key with multi-select array of IDs
      currencyType: data.currencyType || "",
      dueDate: data.dueDate,
      priority: data.priority,
      assignee: data.assignee
        ? data.assignee.map((assignee) => assignee.value)
        : [],
    };

    try {
      setLoading(true);
      const response = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/project/`,
        {
          body: JSON.stringify(formattedData),
        },
      );
      // handleFetchProjects(response);
      if (response) {
        toast.success("Project created successfully");

        setShowAddProjectModal(false);
        reset();
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to create project, " + error.message);
    } finally {
      setLoading(false);
      dispatch(
        fetchProjects({
          companyId: userInfo.companyId,
          _id: userInfo._id,
          showAll: false,
          userInfo: userInfo,
        }),
      );
    }
  };

  const handleAddClient = () => {
    setShowAddClientModal(true);
  };

  const handleAddEmployee = () => {
    navigate("/invite-user");
  };

  const handleAdvanceSettings = () => {
    setisProject((prev) => !prev);
  };

  return (
    <div>
      <Modal
        title="Create Project"
        labelclassName="btn-outline-dark"
        activeModal={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 project-form"
        >
          <Textinput
            name="name"
            label="Project Name"
            placeholder="Project Name"
            register={register}
            error={errors.name}
          />

          <div className="w-[150px]">
            <label
              className="form-label flex items-center text-blue-600"
              onClick={handleAdvanceSettings}
            >
              Advanced Settings{" "}
              {isProject ? (
                <Icon
                  icon="eva:arrow-down-fill"
                  className="text-xl text-blue-600"
                />
              ) : (
                <Icon
                  icon="eva:arrow-right-fill"
                  className="text-xl text-blue-600"
                />
              )}
            </label>
          </div>

          {isProject && (
            <div>
              <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
                <div>
                  <label className="form-label" htmlFor="icon_s">
                    Client
                  </label>
                  <Controller
                    name="clientAssignee"
                    control={control}
                    render={({ field }) => {
                      const clientOptions = assigneeOptions.filter(
                        (option) => option.is_client,
                      );
                      return (
                        <Select
                          {...field}
                          options={clientOptions}
                          styles={styles}
                          className="react-select capitalize"
                          classNamePrefix="select"
                          isMulti
                          onChange={(selected) =>
                            field.onChange(
                              selected
                                ? selected.map((option) => option.value)
                                : [],
                            )
                          }
                          value={clientOptions.filter(
                            (option) =>
                              field.value && field.value.includes(option.value),
                          )}
                          id="icon_s"
                          components={{
                            MenuList: (props) => (
                              <CustomMenuList
                                {...props}
                                onButtonClick={handleAddClient}
                                buttonText="Add Client"
                              />
                            ),
                          }}
                        />
                      );
                    }}
                  />
                </div>

                <FormGroup label="Due Date" id="default-picker2">
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <Flatpickr
                        className="form-control py-2"
                        id="default-picker2"
                        placeholder="dd, M Y"
                        value={field.value ? new Date(field.value) : new Date()}
                        onChange={(date) => {
                          const utcDate = new Date(
                            date[0].getTime() -
                              date[0].getTimezoneOffset() * 60000,
                          );
                          field.onChange(utcDate.toISOString().split("T")[0]);
                        }}
                        options={{
                          altInput: true,
                          altFormat: "d M, Y",
                          dateFormat: "Y-m-d",
                          minDate: "today",
                        }}
                      />
                    )}
                  />
                </FormGroup>

                <div>
                  <label className="form-label" htmlFor="icon_s">
                    Assignee
                  </label>
                  <Controller
                    name="assignee"
                    control={control}
                    render={({ field }) => {
                      const employees = assigneeOptions.filter(
                        (option) => !option.is_client,
                      );
                      return (
                        <Select
                          {...field}
                          options={employees}
                          styles={styles}
                          className="react-select"
                          classNamePrefix="select"
                          isMulti
                          components={{
                            Option: OptionComponent,
                            MenuList: (props) => (
                              <CustomMenuList
                                {...props}
                                onButtonClick={handleAddEmployee}
                                buttonText="Add Employee"
                              />
                            ),
                          }}
                          id="icon_s"
                        />
                      );
                    }}
                  />
                </div>

                <Textinput
                  name="stagingServerURL"
                  label="Staging Server Url"
                  placeholder="https://example.com"
                  register={register}
                  error={errors.stagingServerURL}
                />

                <Textinput
                  name="liveServerURL"
                  label="Live Server Url"
                  placeholder="https://example.com"
                  register={register}
                  error={errors.liveServerURL}
                />
              </div>
              <Textarea
                label="Description"
                name="description"
                register={register}
                placeholder="Description"
              />
            </div>
          )}

          <div className="flex justify-center ">
            <button
              className="btn mt-2.5 btn-dark text-center px-6 py-2.5 bg-electricBlue-50"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Project"}
            </button>
          </div>
        </form>
      </Modal>

      <AddClientModal
        showAddClientModal={showAddClientModal}
        setShowAddClientModal={setShowAddClientModal}
        fetchClient={fetchClientList}
      />

      {/* Include subscription limit modal */}
      <SubscriptionLimitModal />
    </div>
  );
};

export default AddProject;
