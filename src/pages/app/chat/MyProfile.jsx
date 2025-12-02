import React, { useRef, useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { CSSTransition } from "react-transition-group";
import { useSelector, useDispatch } from "react-redux";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Radio from "@/components/ui/Radio";
import { toggleProfile } from "./store";
import SimpleBar from "simplebar-react";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";

const allStatus = [
  {
    value: "Active",
    label: "Active",
    activeClass: "ring-success-500 border-success-500",
  },
  {
    value: "Away",
    label: "Away",
    activeClass: "ring-danger-500 border-danger-500",
  },
  {
    value: "busy",
    label: "busy",
    activeClass: "ring-warning-500 border-warning-500",
  },
  {
    value: "On leave",
    label: "On leave",
    activeClass: "ring-warning-500 border-warning-500",
  },
];

const MyProfile = () => {
  const { openProfile } = useSelector((state) => state.chat);
  const userInfo = useSelector((state) => state?.auth.user);
  const [status, setStatus] = useState(userInfo?.status);
  const nodeRef = useRef(null);
  const dispatch = useDispatch();
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  // New state for dropdown and modal
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    const getAllEmployee = async () => {
      try {
        let data;
        if (userInfo?.isAdmin) {
          data = await fetchAuthGET(`${baseURL}/employee/list/${userInfo?.companyId}`);
        } else if (userInfo?.team_leader) {
          data = await fetchAuthGET(`${baseURL}/api/team/members/${userInfo?._id}`);
        }

        if (data.status && data.data.length > 0) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    if (userInfo) {
      getAllEmployee();
    }
  }, [userInfo, baseURL]);

  const handleCreateGroup = async () => {
    const payload = {
      name: groupName,
      members: selectedMembers,
      group_admin: userInfo._id,
    };
    try {
      const data = await fetchAuthPost(`${baseURL}/chat/create-group/`, {
        body: payload,
      });
      if (data.status === 'success') {
        // Handle success
        setShowModal(false);
      } else {
        // Handle error
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  return (
    <div>
      <header>
        <div className="flex px-6 pt-6">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full">
                  <img
                    src={baseURL + userInfo?.profile_picture}
                    alt=""
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px]">
                  {userInfo?.name}
                  <span className="status bg-success-500 inline-block h-[10px] w-[10px] rounded-full ml-3"></span>
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">
                  {userInfo?.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-none relative">
            <div
              className="h-8 w-8 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Icon icon="heroicons-outline:dots-horizontal" />
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50">
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowModal(true);
                  }}
                >
                  Create Group
                </div>
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => {
                    setShowDropdown(false);
                    dispatch(toggleProfile(true));
                  }}
                >
                  Profile
                </div>
              </div>
            )}
          </div>
        </div>
        <CSSTransition
          in={openProfile}
          timeout={300}
          nodeRef={nodeRef}
          classNames="profileAnimation"
          unmountOnExit
        >
          <div
            ref={nodeRef}
            className="absolute bg-white dark:bg-slate-800 rounded-md h-full left-0 top-0 bottom-0  w-full z-[9]"
          >
            <SimpleBar className="h-full p-6">
              <div className="text-right">
                <div
                  className="h-8 w-8 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 inline-flex ml-auto flex-col justify-center items-center text-xl rounded-full cursor-pointer"
                  onClick={() => dispatch(toggleProfile(false))}
                >
                  <Icon icon="heroicons-outline:x" />
                </div>
              </div>
              <header className="mx-auto max-w-[200px] mt-6 text-center">
                <div className="h-16 w-16 rounded-full border border-slate-400 p-[2px] shadow-md mx-auto mb-3 relative">
                  <img
                    src={baseURL + userInfo?.profile_picture}
                    alt=""
                    className="block w-full h-full rounded-full object-contain"
                  />
                  <span
                    className={`status inline-block h-3 w-3 rounded-full absolute -right-1 top-3 border border-white
                    ${status === "Active" ? "bg-success-500" : ""}
                    ${status === "Away" ? "bg-warning-500" : ""}
                    ${status === "busy" ? "bg-danger-500" : ""}
                    ${status === "On leave" ? "bg-secondary-500" : ""}
                    `}
                  ></span>
                </div>
                <span className="block text-slate-600 dark:text-slate-300 text-sm">
                  {userInfo?.name}
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs">
                  {userInfo?.designation}
                </span>
              </header>
              <div className="my-8">
                <Textarea label="About" placeholder="About yourself" />
              </div>
              <div className="mb-8">
                <span className="form-label">Status</span>
                {allStatus?.map((item) => (
                  <Radio
                    key={item.value}
                    label={item.label}
                    name="status"
                    value={item.value}
                    checked={status === item.value}
                    onChange={(e) => setStatus(e.target.value)}
                    activeClass={item.activeClass}
                  />
                ))}
              </div>
              <Button text="Logout" className="btn-dark " />
            </SimpleBar>
          </div>
        </CSSTransition>
      </header>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-md shadow-md w-1/3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-4">Create Group</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Members</label>
              <select
                multiple
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
                value={selectedMembers}
                onChange={(e) => setSelectedMembers([...e.target.selectedOptions].map(o => o.value))}
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button text="Cancel" onClick={() => setShowModal(false)} className="mr-2" />
              <Button text="Create" onClick={handleCreateGroup} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
