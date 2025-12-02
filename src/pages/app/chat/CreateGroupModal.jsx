import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";

const CreateGroupModal = ({ userInfo, baseURL, onClose }) => {
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

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

  useEffect(() => {
    getAllEmployee();
  }, [userInfo, baseURL]);

  const handleCreateGroup = async () => {
    const payload = {
      name: groupName,
      members: selectedMembers,
      group_admin: userInfo._id,
    };
    try {
      const data = await fetchAuthPost(`${baseURL}/api/chat_group/create`, {
        body: payload,
      });
      if (data.status === 'success') {
        // Handle success
        onClose();
      } else {
        // Handle error
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  return (
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
          <Button text="Cancel" onClick={onClose} className="mr-2" />
          <Button text="Create" onClick={handleCreateGroup} />
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
