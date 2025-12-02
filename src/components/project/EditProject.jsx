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
import { fetchAPI, fetchAuthPut, fetchGET } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { intialLetterName } from "@/helper/helper";
import Switch from "@/components/ui/Switch";
import { Icon } from "@iconify/react";
import StatusManager from "./StatusManager";
import CustomMenuList from "../ui/CustomMenuList";
import AddClientModal from "../client/AddClientModal";

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
  {
    value: "low",
    label: "low",
  },
  {
    value: "medium",
    label: "medium",
  },
  {
    value: "high",
    label: "high",
  },
];



const OptionComponent = ({ data, ...props }) => {
  return (
    <components.Option {...props}>
      <span className="flex items-center space-x-4">
        <div className="flex-none">
          <div className="h-7 w-7 rounded-full">
            {data.image === "null" ? (
              <span className="h-7 w-7 rounded-full text-sm bg-[#002D2D] text-white dark:bg-[#002D2D] flex flex-col items-center justify-center font-medium -tracking-[1px]">
               {intialLetterName(data?.label,data?.label,data?.label?.split(' ')[1],data?.label)}
              </span>
            ) : (
              <img
                src={`${import.meta.env.VITE_APP_DJANGO}${data.image}`}
                alt=""
                className="w-full h-full rounded-full"
              />
            )}
          </div>
        </div>
        <span className="flex-1">{data.label}</span>
      </span>
    </components.Option>
  );
};

const EditProject = ({
  showEditProjectModal,
  setShowEditProjectModal,
  fetchProjects,
  data,
  projectId,
  setProjectId,
  setSelectedProject,
}) => {

  const userInfo = useSelector((state) => state.auth.user);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [client, setClient] = useState([]);
  const [isActive, setIsActive] = useState(data?.isActive);
  const [isProject, setisProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Fetch statuses
  const fetchStatuses = async () => {
    const res = await fetchAPI(`api/projects/${projectId}/status/`);
    setStatuses(res?.statuses || []);
  };

  useEffect(() => {
    fetchStatuses();
  }, [projectId]);
  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    const fetchEmployeeList = async () => {
      try {
        const { data } = await fetchGET(
          `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`
        );
        const onlyEmployees = data
          .filter(emp => !emp.is_client)
          .map((emp) => ({
            id: emp._id,
            value: emp._id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            label: emp.name,
            image: `${emp.profile_picture}`,
            is_client: emp.is_client,
          }));
        setAssigneeOptions(onlyEmployees);

        const activeClients = data
          .filter(emp => emp.is_client)
          .map((emp) => ({
            value: emp._id,
            label: emp.name,
            image: `${emp.profile_picture}`,
          }));
        setClient(activeClients);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployeeList();
  }, [userInfo]);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Title is required"),
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
      name: data?.name,
      dueDate: data?.dueDate,
      clientAssignee: data?.client_assignee_details?.map((client) => client?._id),
      priority: data?.priority,
      stagingServerURL: data?.stagingServerURL,
      liveServerURL: data?.liveServerURL,
      currencyType: data?.currencyType||"",
      budget: data?.budget,
      description: data?.description,
      assignee: data?.assignee_details?.map((assignee) => assignee?._id),
    },
  });

  useEffect(() => {
    reset({
      name: data?.name,
      dueDate: data?.dueDate,
      clientAssignee: data?.client_assignee_details?.map((client) => client?._id),
      priority: data?.priority,
      stagingServerURL: data?.stagingServerURL,
      liveServerURL: data?.liveServerURL,
      currencyType: data?.currencyType||"",
      budget: data?.budget,
      description: data?.description,
      assignee: data?.assignee_details?.map((assignee) => assignee?._id),
      isActive: data?.isActive,
    });
    setIsActive(data?.isActive);
  }, [data]);

  const onSubmit = async (formData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const formattedData = {
      ...formData,
      companyId: userInfo.companyId,
      currencyType: formData.currencyType||"",
      dueDate: formData.dueDate,
      priority: formData.priority,
      isActive: isActive,
    };

    try {
      const response = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/project/${projectId}/`,
        {
          body: JSON.stringify(formattedData),
        }
      );
      if (response.status == 1) {
        if (setSelectedProject && typeof setSelectedProject === "function") {
          setSelectedProject(response);
        }
        toast.success("Project updated successfully");
        if (fetchProjects) fetchProjects();
        setShowEditProjectModal(false);
        if (setProjectId) setProjectId(null);
      } else {
        toast.error("Failed to update project");
      }
    } catch (error) {
      toast.error("Internal server error while updating project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceSettings = () => {
    setisProject(!isProject);
  };

  const handleAddClient = () => {
    setShowAddClientModal(true);
  };

  const fetchClientList = async () => {
    try {
      const { data } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`);
      const activeClients = data
        .filter(emp => emp.is_client)
        .map((emp) => ({
          value: emp._id,
          label: emp.name,
          image: `${emp.profile_picture}`,
        }));
      setClient(activeClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchClientList();
  }, [userInfo,showAddClientModal]);

  return (
    <div>
      <Modal
        title="Edit Project"
        labelclassName="btn-outline-dark"
        activeModal={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="name"
            label="Project Name"
            placeholder="Project Name"
            register={register}
            error={errors.name}
          />

          <div className="w-[150px]">
            <label className="form-label flex items-center text-blue-500" onClick={handleAdvanceSettings}>
            Advanced Settings {isProject ? <Icon icon="eva:arrow-down-fill" className="text-xl text-blue-600" /> :
                <Icon icon="eva:arrow-right-fill" className="text-xl text-blue-600" />}
            </label>
          </div>

          {isProject &&
            <div>
              <div className="grid lg:grid-cols-2 gap-4 grid-cols-1">
                <div>
                  <label className="form-label" htmlFor="icon_s">
                    Client
                  </label>
                  <Controller
                    name="clientAssignee"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={client}
                        styles={{
                          ...styles,
                          menuList: (base) => ({
                            ...base,
                            padding: '8px',
                            maxHeight: '300px'
                          })
                        }}
                        className="react-select capitalize"
                        classNamePrefix="select"
                        isMulti
                        components={{ 
                          Option: OptionComponent,
                          MenuList: (props) => (
                            <div className="relative">
                              <CustomMenuList {...props} onButtonClick={handleAddClient} buttonText="Add Client" />
                            </div>
                          )
                        }}
                        onChange={(selectedOptions) =>
                          field.onChange(selectedOptions.map((option) => option.value))
                        }
                        value={client.filter((option) =>
                          field?.value?.includes(option?.value)
                        )}
                      />
                    )}
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
                        placeholder="DD/MM/YYYY"
                        value={field.value ? new Date(field.value) : new Date()}
                        onChange={(date) => {
                          const utcDate = new Date(
                            date[0].getTime() - date[0].getTimezoneOffset() * 60000
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
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={assigneeOptions}
                        styles={styles}
                        className="react-select"
                        classNamePrefix="select"
                        isMulti
                        components={{ Option: OptionComponent }}
                        onChange={(selectedOptions) =>
                          field.onChange(selectedOptions.map((option) => option.value))
                        }
                        value={assigneeOptions.filter((option) =>
                          field?.value?.includes(option.value)
                        )}
                        id="icon_s"
                      />
                    )}
                  />
                </div>

                <Textinput
                  name="stagingServerURL"
                  label="Staging Server Url"
                  placeholder="https://example.com"
                  register={register}
                />

                <Textinput
                  name="liveServerURL"
                  label="Live Server Url"
                  placeholder="https://example.com"
                  register={register}
                />

              </div>

              <Textarea
                label="Description"
                name="description"
                register={register}
                placeholder="Description"
              />
              <div className="relative mt-5">
                {/* Dropdown summary (closed state) */}
                {!showStatusDropdown && (
                  <div
                    className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer justify-between"
                    onClick={() => setShowStatusDropdown(true)}
                  >
                    <div className="flex items-center gap-2 rounded cursor-pointer">
                      {statuses.slice(0, 3).map((status) => (
                        <span
                          key={status.id}
                          className="px-2 py-1 rounded text-sm"
                          style={{ background: status.color, color: "#fff" }}
                        >
                          {status.name}
                        </span>
                      ))}
                      {statuses.length > 3 && (
                        <span className="px-2 py-1 rounded bg-gray-200 text-sm text-gray-700">
                          +{statuses.length - 3} more
                        </span>
                      )}
                    </div>
                    <div>
                      <Icon icon="mdi:chevron-down" className="ml-1 font-semibold text-lg" />
                    </div>
                  </div>
                )}

                {/* Dropdown open state */}
                {showStatusDropdown && (
                  <div className="z-20 bg-white rounded  mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Statuses</span>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setShowStatusDropdown(false)}
                      >
                        <Icon icon="mdi:close" />
                      </button>
                    </div>
                    {/* StatusManager pura yahan render karo */}
                    <StatusManager projectId={projectId} baseUrl={import.meta.env.VITE_APP_DJANGO} statuses={statuses} setStatuses={setStatuses} />
                  </div>
                )}
              </div>
              <div className="pt-4">
                <Switch
                  label="Active Status"
                  activeClass="bg-customGreen-50"
                  value={isActive}
                  onChange={() => setIsActive(!isActive)}
                  badge
                  prevIcon="heroicons-outline:lock-closed"
                  nextIcon="heroicons-outline:lock-open"
                />
              </div>

            </div>}
          <div className="ltr:text-right rtl:text-left">
            <button className="btn btn-dark text-center" type="submit">Update</button>
          </div>
        </form>
      </Modal>

      <AddClientModal
        showAddClientModal={showAddClientModal}
        setShowAddClientModal={setShowAddClientModal}
        fetchClient={fetchClientList}
      />
    </div>
  );
};

export default EditProject;