import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';
import { ProfilePicture } from '@/components/ui/profilePicture';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { useSelector } from 'react-redux';
import { fetchUsers } from "@/store/usersSlice";
import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import AddMemberModal from './AddMemberModal';
import { fetchAuthPut } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { updateProjectMembers } from '@/store/projectsSlice';

const PERMISSION_COLORS = {
  admin: 'text-red-600 bg-red-100',
  editor: 'text-purple-600 bg-purple-100',
  viewer: 'text-blue-600 bg-blue-100',
  default: 'text-gray-600 bg-gray-100',
};

const ACCESS_LEVEL_ICONS = {
  editor: 'system-uicons:pen',
  admin: 'eos-icons:admin',
  viewer: 'la:eye-solid',
};

function getAssignedUsersWithAccessLevel(users, projectData) {
  return users
    .filter(user => projectData.assignee.includes(user._id))
    .map(user => ({
      ...user,
      accessLevel: projectData.accessLevels[user._id] || 'viewer'
    }));
}

const SkeletonCard = () => (
  <div className="flex items-center gap-4 p-4 rounded-lg animate-pulse">
    <div className="w-16 h-16 rounded-full bg-gray-200" />
    <div className="flex-1">
      <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function ProjectMembers({ projectData, setProjectData, permissions }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state) => state.users);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [accessLevels, setAccessLevels] = useState({});
  const [search, setSearch] = useState('');
  const isInitialized = useRef(false);
  const hasChanges = useRef(false);
  const userInfo = useSelector((state) => state.auth.user);
  // console.log("projectData", projectData);
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Initialize assignees and accessLevels from projectData
  useEffect(() => {
    if (projectData?.assignee_details && projectData?.accessLevels) {
      setAssignees(projectData.assignee_details);
      setAccessLevels(projectData.accessLevels);
      isInitialized.current = true;
    }
  }, [projectData]);
  function isProjectMembersChanged() {
    const originalIds = (projectData.assignee || []).slice().sort();
    const newIds = (assignees.map(u => u._id) || []).slice().sort();
    const assigneesChanged = originalIds.length !== newIds.length ||
      originalIds.some((id, i) => id !== newIds[i]);
    const originalAccess = projectData.accessLevels || {};
    const accessChanged = Object.keys(accessLevels).length !== Object.keys(originalAccess).length ||
      Object.entries(accessLevels).some(([k, v]) => originalAccess[k] !== v);

    return assigneesChanged || accessChanged;
  }
  const handleModalClose = async () => {
    if (!isProjectMembersChanged()) {
      setShowAddMemberModal(false);
      return; // Don't call API if nothing changed
    }
    setShowAddMemberModal(false);
    if (!projectData) return;
    try {
      const result = await dispatch(updateProjectMembers({
        projectId: projectData._id,
        userId: userInfo._id,
        assignees: assignees.map(u => u._id),
        accessLevels: accessLevels
      })).unwrap();

      // Update local projectData state with the response to persist across tab changes
      if (result && setProjectData) {
        const updatedProject = {
          ...projectData,
          ...result,
          // Ensure assignee_details is included
          assignee_details: result.assignee_details || assignees,
          assignee: result.assignee || assignees.map(u => u._id),
          accessLevels: result.accessLevels || accessLevels
        };
        setProjectData(updatedProject);
      }
    } catch (error) {
      console.error("Error updating project members:", error);
      toast.error("Error updating project members");
    }
  };

  // Track changes to assignees and accessLevels
  useEffect(() => {
    if (isInitialized.current) {
      hasChanges.current = true;
    }
  }, [assignees, accessLevels]);

  // Filter assigned users by search
  const assignedUsers = assignees
    .map(user => ({
      ...user,
      accessLevel: accessLevels[user._id] || 'viewer'
    }))
    .filter(user => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q))
      );
    });

  // Helper to capitalize permission
  const formatPermission = (perm) => perm ? perm.charAt(0).toUpperCase() + perm.slice(1) : '';

  // Handle invite function to update project
  const handleInvite = async () => {
    try {
      // Prepare updated project data
      const updatedProjectData = {
        ...projectData,
        assignee: assignees.map(user => user._id),
        assignee_details: assignees,
        accessLevels: accessLevels
      };

      // Call the update function passed from parent
      if (setProjectData) {
        await setProjectData(updatedProjectData);
      }

      // Close modal after successful update
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error updating project members:', error);
      // You can add error handling here (toast notification, etc.)
    }
  };

  return (
    <div className="">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">
          <Icon icon="iconamoon:search-light" width={20} height={20} />
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Quick search: Member, Mail ID"
          className="w-full text-sm pl-10 pr-4 py-2 border border-neutral-50 dark:border-slate-700 rounded-md focus:outline-none bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50 placeholder-gray-400 dark:placeholder-slate-400 focus:ring-1 focus:ring-[#A259D6] focus:border-transparent "
        />
      </div>
      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
        {/* Add Members Card */}
        {
          permissions && permissions?.canManageMembers &&
          <div className="flex items-center gap-4 p-4 rounded-lg cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-colors bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700"
            onClick={() => setShowAddMemberModal(true)}
          >
            <div className="w-16 h-16 border-2 bg-gray-50 dark:bg-slate-700 border-dashed border-black-500  dark:border-slate-700 rounded-full flex items-center justify-center">
              <Icon icon="basil:plus-outline" width="24" height="24" />
            </div>
            <span className="font-semibold text-sm text-customBlack-50 dark:text-customWhite-50">Add Members</span>
          </div>
        }

        {/* Loading Skeletons */}
        {loading && Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)}

        {/* Member Cards */}
        {!loading && assignedUsers.map((member) => {
          const permission = member.accessLevel || 'viewer';
          const permissionColor = PERMISSION_COLORS[permission] || PERMISSION_COLORS.default;
          const iconName = ACCESS_LEVEL_ICONS[permission] || null;
          return (
            <div key={member._id} className="flex items-start gap-4 p-4 rounded-lg cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-colors bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 relative group">
              <ProfileCardWrapper userId={member._id}>
                <div
                  className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden"
                  onClick={() => navigate(`/profile/${member._id}`)}
                >
                  <ProfilePicture user={member} />
                </div>
              </ProfileCardWrapper>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-col gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${permissionColor} dark:bg-slate-700 dark:text-slate-300`}>
                    {iconName && <Icon icon={iconName} className="w-4 h-4 mr-1" />}
                    {formatPermission(permission)}
                  </span>
                  <h3
                    className="font-semibold text-sm text-customBlack-50 dark:text-customWhite-50 hover:underline"
                    onClick={() => navigate(`/profile/${member._id}`)}
                  >
                    {member.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  {member.designation || ''}
                </p>
              </div>
              {/* Edit Button */}
              {
                permissions && permissions?.canManageMembers &&
                <button
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMemberModal(true);
                  }}
                  title="Edit member"
                >
                  <Icon icon="mdi:pencil-outline" className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                </button>
              }
            </div>
          );
        })}
      </div>
      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMemberModal}
        onClose={handleModalClose}
        assignees={assignees}
        setAssignees={setAssignees}
        accessLevels={accessLevels}
        setAccessLevels={setAccessLevels}
        onInvite={handleInvite}
        projectId={projectData?._id}
      />
    </div>
  );
}

ProjectMembers.propTypes = {
  projectData: PropTypes.object.isRequired,
  setProjectData: PropTypes.func,
};