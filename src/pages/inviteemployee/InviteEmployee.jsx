import React, { useState, useEffect, useRef } from "react";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import { fetchPOST, fetchAuthPost, fetchAuthGET } from "@/store/api/apiSlice";
import Button from "@/components/ui/Button";
import InvitedEmployeeList from "./InvitedEmployeeList ";
import Switch from "@/components/ui/Switch";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { enforceSubscriptionLimit } from "@/store/planSlice";
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import Select from "react-select";
import { Icon } from "@iconify/react";

const InviteEmployee = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isClientParam = queryParams.get("is_client");
  // Toggle state for inviting as client; if URL has is_client=true, initialize toggle as true.
  const [inviteAsClient, setInviteAsClient] = useState(isClientParam === "true");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ message: '', companyId: '', cname: '' });
  const [emails, setEmails] = useState([]);
  const [editingEmail, setEditingEmail] = useState(null); // For editing emails
  const [newInvitedEmployees, setNewInvitedEmployees] = useState([]);

  const dispatch = useDispatch();
  const { subscriptionData } = useSelector((state) => state.plan);
  const errorTimeoutRef = useRef(null); // To manage error timeout
  const [refreshInvitations, setRefreshInvitations] = useState(0);
  const userInfo = useSelector((state) => state.auth.user);
  const refetchListRef = useRef(null);
  // helper to enforce subscription limit
  const checkLimit = () => dispatch(enforceSubscriptionLimit());
  const allProjects = useSelector(state => state.projects.projects);

  // ✅ Filter out default project
  const defaultProjectId =  userInfo?.default_project;

  const projects = allProjects
    .filter(proj => {
      if (!defaultProjectId) return true;
      
      // Compare as both string and number to handle type mismatches
      return String(proj._id) !== String(defaultProjectId) && 
             proj._id !== defaultProjectId;
    })
    .map(proj => ({
      value: proj._id,
      label: proj.name,
    }));
  const [selectedProject, setSelectedProject] = useState(null);
  const [hasSetInitialProject, setHasSetInitialProject] = useState(false);
  const [hasSetInitialEmail, setHasSetInitialEmail] = useState(false);

  // Safely extract company_details
  const activeUsersCount = subscriptionData?.company_details?.active_users_count || 0;
  const employeeLimit = subscriptionData?.company_details?.employee_limit || 0;
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  // ✅ State for remaining slots
  const [remainingSlots, setRemainingSlots] = useState(0);

  // ✅ Update remainingSlots when dependencies change
  useEffect(() => {
    const activeUsers = subscriptionData?.company_details?.active_users_count || 0;
    const limit = subscriptionData?.company_details?.employee_limit || 0;
    const calculated = Math.max(limit - activeUsers - pendingInvitesCount, 0);

    
    setRemainingSlots(calculated);
  }, [
    subscriptionData?.company_details?.active_users_count, 
    subscriptionData?.company_details?.employee_limit, 
    pendingInvitesCount
  ]);

  // Validation Schema
  const FormValidationSchema = yup.object({
    emails: yup.array().of(
      yup.string().email("Invalid email format")
    ).min(1, "At least one valid email is required"),
  });

  const { register, handleSubmit, formState: { errors }, setValue, reset, clearErrors } = useForm({
    resolver: yupResolver(FormValidationSchema),
  });

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Handle error messages visibility
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        clearErrors();
      }, 3000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [errors, clearErrors]);

  // Initialize form data with user info
  useEffect(() => {
    if (userInfo) {
      const companyName = userInfo?.company_name;

      setFormData({
        ...formData,
        companyId: userInfo.companyId,
        cname: userInfo._id,
        message: `${userInfo.name} Invites You To Join ${companyName} At Dyzo`
      });
      // Also set default value for react-hook-form
      setValue('message', `${userInfo.name} Invites You To Join ${companyName} At Dyzo`);
    }
  }, [userInfo]);

  // Submit Handler: include is_client toggle value in payload.
  const onSubmit = async (data) => {
    // Check subscription limits before inviting users

    if ((activeUsersCount + data.emails.length) > employeeLimit) {
      // The hook will automatically show the limit modal for regular employees
      // We don't check limits for clients
      toast.error("Please Upgrade you Plan")
      return;
    }
    if ((activeUsersCount + pendingInvitesCount) > employeeLimit - 1) {
      toast.error("Please Upgrade your Plan");
      return;
    }
    if (!selectedProject || selectedProject.length === 0) {
      toast.error("Please select at least one project.");
      return;
    }


    try {
      setLoading(true);
      // setRefreshInvitations(prev => prev + 1);
      const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/invite/`, {
        body: {
          cname: formData.cname,
          companyId: formData.companyId,
          message: "",
          email: data.emails,
          is_client: inviteAsClient,
          projectIds: selectedProject.map(p => p.value),
        }
      });

      if (response.status == 1) {

        toast.success(response.message);

        setEmails([]);
        reset({ emails: [] });
        setSelectedProject([]);
      
        if (response.invited_employees && response.invited_employees.length > 0) {
          setNewInvitedEmployees(response.invited_employees);
          setPendingInvitesCount(prev => prev + response.invited_employees.length);
        }
      } else if (response.status == 0) {
        toast.error(response.message || 'Failed to send invite');
        setEmails([]);
        reset({ emails: [] });
             
      }
      else if (response.status == 2) {
        toast.success(response.message1);
        toast.error(response.message2 || 'Failed to send invite');
        setEmails([]);
        reset({ emails: [] });
        
        // Append successful invites even on partial success (no API refresh)
        if (response.invited_employees && response.invited_employees.length > 0) {
          setNewInvitedEmployees(response.invited_employees);
          setPendingInvitesCount(prev => prev + response.invited_employees.length);
        }
      }
    } catch (error) {
      toast.error('Failed to send invite');

    } finally {
      setLoading(false);
    }
  };

  // Validate email
  const isValid = (email) => {
    if (isInList(email)) {
      toast.error(`${email} has already been added.`);
      return false;
    }
    if (!isEmail(email)) {
      toast.error(`${email} is not a valid email address.`);
      return false;
    }
    return true;
  };

  const isInList = (email) => emails.includes(email);

  const isEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Add email to list
  const addEmail = (email) => {
    if (isValid(email)) {
      const updatedEmails = [...emails, email];
      setEmails(updatedEmails);
      setValue("emails", updatedEmails);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (evt) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      const trimmedValue = evt.target.value.trim();
      if (trimmedValue) {
        addEmail(trimmedValue);
        evt.target.value = "";
      }
    }
  };

  // Handle Paste event
  const handlePaste = (evt) => {
    evt.preventDefault();
    const paste = evt.clipboardData.getData('text');
    const pastedEmails = paste.split(/[\s,]+/).map(email => email.trim()).filter(email => email);
    let validEmails = [];
    pastedEmails.forEach(email => {
      if (isValid(email)) {
        validEmails.push(email);
      }
    });
    if (validEmails.length > 0) {
      const updatedEmails = [...emails, ...validEmails];
      setEmails(updatedEmails);
      setValue("emails", updatedEmails);
    }
  };

  // Handle Auto-add on Blur
  const handleBlur = (evt) => {
    const trimmedValue = evt.target.value.trim();
    if (trimmedValue) {
      addEmail(trimmedValue);
      evt.target.value = "";
    }
  };

  // Handle Delete Email
  const handleDelete = (email) => {
    const updatedEmails = emails.filter(e => e !== email);
    setEmails(updatedEmails);
    setValue("emails", updatedEmails);
  };

  // Handle Edit Email
  const handleEdit = (email) => setEditingEmail(email);

  // Save Edited Email
  const saveEditedEmail = (oldEmail, newEmail) => {
    if (newEmail === oldEmail) {
      setEditingEmail(null);
      return;
    }
    if (!isEmail(newEmail)) {
      toast.error(`${newEmail} is not a valid email address.`);
      return;
    }
    if (isInList(newEmail)) {
      toast.error(`${newEmail} has already been added.`);
      return;
    }
    const updatedEmails = emails.map(e => e === oldEmail ? newEmail : e);
    setEmails(updatedEmails);
    setValue("emails", updatedEmails);
    setEditingEmail(null);
  };
  const fetchPendingInvites = async () => {

    try {
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/invited-employees/`
      );
      const data = response.data;

      if (response && response.pending_count !== undefined) {
        setPendingInvitesCount(response.pending_count);
      }
    } catch (e) {
      setPendingInvitesCount(0);
    }
  };

  useEffect(() => {

    if (userInfo?.companyId) fetchPendingInvites();
  }, [userInfo?.companyId, refreshInvitations]);



  const handleFetchPendingInvites = (pendingCount) => {
    if ((activeUsersCount + pendingCount) > employeeLimit) {
      toast.error("Please Upgrade your Plan");

      return;
    }
    fetchPendingInvites();
  };

  useEffect(() => {
    if (hasSetInitialProject) return;
    const params = new URLSearchParams(location.search);
    const projectIdParam = params.get("projectId");
    if (projectIdParam && projects.length > 0) {
      const ids = projectIdParam.split(",").map(id => id.trim());
      const selected = projects.filter(proj => ids.includes(String(proj.value)));
      setSelectedProject(selected);
      setHasSetInitialProject(true);
    }
  }, [location.search, projects, hasSetInitialProject]);

  // Auto-populate email in text input from URL parameter
  useEffect(() => {
    if (hasSetInitialEmail) return;
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      const trimmedEmail = emailParam.trim();
      // Set the email in the text input field
      const emailInput = document.querySelector('input[name="email"]');
      if (emailInput) {
        emailInput.value = trimmedEmail;
        // Focus the input field and move cursor to the end
        emailInput.focus();
        emailInput.setSelectionRange(trimmedEmail.length, trimmedEmail.length);
      }
      setHasSetInitialEmail(true);
    }
  }, [location.search, hasSetInitialEmail]);

  return (
    <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 ">
      <ToastContainer />
      <button className="bg-gray-200 rounded-full p-2 group flex items-center gap-1" onClick={() => navigate(-1)}>
        <Icon icon="ion:arrow-back" className="w-4 h-4" /> <span className="hidden group-hover:inline text-xs">Back</span>
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 my-2 w-full">
        {remainingSlots > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center w-full bg-blue-100 dark:bg-slate-700 p-2 relative">
            <span className="ml-0 sm:ml-2 text-primary-800 dark:text-slate-200 mr-0 sm:mr-2 text-sm text-center sm:text-left">
              <b>{remainingSlots}</b> out of <b>{employeeLimit}</b> invites remaining!
              <b className="ml-1">Upgrade to add more members.</b>
            </span>
            <div className="mt-2 sm:mt-0 sm:ml-20 w-full sm:w-auto self-stretch flex justify-center sm:block">
              <button
                className="w-full sm:w-auto h-full bg-blue-600 hover:bg-blue-900 text-white px-4 py-2 rounded shadow-lg font-semibold text-sm uppercase tracking-wide transition duration-200"
                onClick={() => navigate('/plans')}
              >
                Upgrade
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center w-full bg-blue-100 dark:bg-slate-700 p-2 relative">
            <span className="text-primary-800 dark:text-slate-200 mr-0 sm:mr-2 text-sm ml-0 sm:ml-2 text-center sm:text-left">
              This team is full. <b >Upgrade it!</b>
            </span>
            <div className="mt-2 sm:mt-0 sm:ml-20 w-full sm:w-auto self-stretch flex justify-center sm:block">
              <button
                className="w-full sm:w-auto h-full bg-blue-600 hover:bg-blue-900 text-white px-4 py-2 rounded shadow-lg font-semibold text-sm uppercase tracking-wide transition duration-200"
                onClick={() => navigate('/plans')}
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </div>


      <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4 text-center sm:text-left">Invite People</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="InviteEmployee space-y-4 invite-user-form px-2 sm:px-0">
        {/* Email and Project selection in a flex container */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Email input - equal width */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Enter Team Member's Email Address
            </label>
            <Textinput
              type="text"
              label=""
              name="email"
              register={register}
              error={errors.emails ? errors.emails.message : ""}
              placeholder="Enter email addresses separated by Enter"
              onKeyDown={handleKeyDown}
              //onPaste={handlePaste}
              onBlur={handleBlur}
              className="border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 dark:bg-slate-800"
            />
            <p className="text-xs text-gray-400 mt-1">
              Press <span className="font-semibold">Enter</span> to add an email
            </p>
          </div>

          {/* Project selection - equal width */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select Project(s) <span className="text-red-500">*</span>
            </label>
            <Select
              options={projects}
              value={selectedProject}
              onChange={setSelectedProject}
              placeholder="Choose project(s) to assign..."
              isClearable
              isMulti
              className="w-full"
              classNamePrefix="react-select"
              classNames={{
                control: (state) =>
                  `min-h-[44px] border-2 rounded-lg transition-all duration-200 ease-in-out ${state.isFocused
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-white dark:bg-slate-700'
                    : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
                  }`,
                valueContainer: () => 'px-3 py-2 flex flex-wrap gap-2 min-h-[28px]',
                input: () => 'text-gray-800 dark:text-slate-200 text-sm m-0 p-0',
                placeholder: () => 'text-gray-500 dark:text-slate-400 text-sm',
                multiValue: () => 'bg-[#111827] text-white rounded-md px-2 py-1 flex items-center shadow-sm border border-[#111827]', // dark navy background
                multiValueLabel: () => 'text-white !important font-medium text-sm pr-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]',
                multiValueRemove: () => 'text-white hover:bg-white/20 rounded px-1 ml-1 transition-colors',
                option: (state) =>
                  `px-3 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-slate-600 last:border-b-0 transition-colors ${state.isSelected
                    ? 'bg-blue-500 text-white font-semibold'
                    : state.isFocused
                      ? 'bg-blue-50 dark:bg-slate-600 text-gray-800 dark:text-slate-200'
                      : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-600'
                  }`,
                menu: () => 'border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg bg-white dark:bg-slate-700 overflow-hidden z-50',
                menuList: () => 'py-1 max-h-[200px]',
                indicatorsContainer: () => 'pr-2',
                indicatorSeparator: () => 'bg-gray-300 dark:bg-slate-600 my-2',
                dropdownIndicator: (state) =>
                  `text-gray-500 dark:text-slate-400 transition-transform duration-200 ${state.selectProps.menuIsOpen ? 'rotate-180' : 'rotate-0'
                  } hover:text-blue-500 dark:hover:text-blue-400`,
                clearIndicator: () => 'text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors',
                noOptionsMessage: () => 'text-gray-500 dark:text-slate-400 text-sm px-3 py-4',
                singleValue: () => 'text-gray-800 dark:text-slate-200 font-medium text-sm',
              }}
              styles={{
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#fff", // force white text
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#fff",
                  ":hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                  },
                }),
              }}
            />
            {(!selectedProject || selectedProject.length === 0) && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Select at least one project to assign the invite
              </p>
            )}
          </div>
        </div>

        {/* Toggle switch to invite as client */}
        {/*         <div className="my-2 sm:my-4">
          <Switch
            label="Invite as Client?"
            value={inviteAsClient}
            onChange={() => setInviteAsClient(!inviteAsClient)}
          />
        </div> */}

        <div className="flex flex-wrap gap-2">
          {emails.map(email => (
            <div key={email} className="bg-gray-200 dark:bg-black-500 rounded-lg p-2 flex items-center w-full sm:w-auto">
              {editingEmail === email ? (
                <input
                  type="text"
                  defaultValue={email}
                  className="border border-gray-300 dark:border-gray-700 rounded p-1 mr-2 bg-white dark:bg-gray-700 text-black dark:text-white w-full sm:w-auto"
                  onBlur={(e) => saveEditedEmail(email, e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveEditedEmail(email, e.target.value.trim());
                    }
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <span className="mr-2 break-all">{email}</span>
                  <button
                    type="button"
                    className="text-blue-500 dark:text-blue-300 focus:outline-none mr-1"
                    onClick={() => handleEdit(email)}
                    title="Edit Email"
                  >
                    &#9998;
                  </button>
                  <button
                    type="button"
                    className="text-red-500 dark:text-red-300 focus:outline-none"
                    onClick={() => handleDelete(email)}
                    title="Delete Email"
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {errors.emails && (
          <p className="text-red-500">{errors.emails.message}</p>
        )}

        <div className="ltr:text-left rtl:text-left">
          <Button
            type="submit"
            className="btn-dark dark:bg-slate-900 dark:hover:bg-slate-700 h-min text-sm font-normal w-full sm:w-auto"
            disabled={loading || remainingSlots === 0}
          >
            {loading ? 'Inviting...' : remainingSlots === 0 ? "Upgrade" : "Invite"}
          </Button>
        </div>
      </form>
      <InvitedEmployeeList refreshInvitations={refreshInvitations } setPendingInvitesCount={setPendingInvitesCount} fetchPendingInvites={fetchPendingInvites} newInvitedEmployees={newInvitedEmployees} />

      {/* Include subscription limit modal */}
      <SubscriptionLimitModal />
    </div>
  );
};

export default InviteEmployee;  
