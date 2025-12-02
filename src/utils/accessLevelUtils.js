// Access level permissions utility
export const ACCESS_LEVELS = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Get user's access level for a specific project
export const getUserAccessLevel = (projectData, userId , isAdmin) => {
  if (!projectData || !userId) return null;
  
   if (isAdmin) {
    return ACCESS_LEVELS.ADMIN; // ✅ force admin role
  }

  // Get access level from access_levels object
  return projectData.accessLevels?.[userId] || ACCESS_LEVELS.VIEWER; // Default to editor if not specified
};

// Check if user has permission for a specific action
export const hasPermission = (projectData, userId, isAdmin , action) => {
  const accessLevel = getUserAccessLevel(projectData, userId , isAdmin);
  if (!accessLevel) return false;

  const permissions = {
    // View permissions
    VIEW_PROJECT_OVERVIEW: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR, ACCESS_LEVELS.VIEWER],//done
    VIEW_TASKS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR, ACCESS_LEVELS.VIEWER],//done
    VIEW_NOTES: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR, ACCESS_LEVELS.VIEWER],//done
    VIEW_ACTIVITY_LOG: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR, ACCESS_LEVELS.VIEWER],//done
    COMMENT_ON_TASKS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR, ACCESS_LEVELS.VIEWER],
    
    // Edit permissions
    EDIT_PROJECT_DETAILS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    CHANGE_PROJECT_COLOR: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    CREATE_EDIT_TASKS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],
    DELETE_TASKS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],
    COMPLETE_REOPEN_TASKS: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],
    EDIT_NOTES: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    DELETE_NOTES: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    
    // Admin permissions
    MANAGE_MEMBERS: [ACCESS_LEVELS.ADMIN],//done
    // CHANGE_MEMBER_ROLES: [ACCESS_LEVELS.ADMIN],
    DELETE_PROJECT: [ACCESS_LEVELS.ADMIN],//done
    // CHANGE_PROJECT_SETTINGS: [ACCESS_LEVELS.ADMIN],
    
    // Editor and Admin permissions
    DUPLICATE_PROJECT: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    SAVE_AS_TEMPLATE: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    IMPORT_CSV: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
    EXPORT_CSV: [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.EDITOR],//done
  };

  return permissions[action]?.includes(accessLevel) || false;
};

// Get all permissions for a user
export const getUserPermissions = (projectData, userId , isAdmin) => {
  const accessLevel = getUserAccessLevel(projectData, userId , isAdmin);
  if (!accessLevel) return {};

  return {
    canViewProjectOverview: hasPermission(projectData, userId, isAdmin , 'VIEW_PROJECT_OVERVIEW'),
    canEditProjectDetails: hasPermission(projectData, userId, isAdmin , 'EDIT_PROJECT_DETAILS'),
    canChangeProjectColor: hasPermission(projectData, userId, isAdmin , 'CHANGE_PROJECT_COLOR'),
    canManageMembers: hasPermission(projectData, userId, isAdmin , 'MANAGE_MEMBERS'),
    // canChangeMemberRoles: hasPermission(projectData, userId, isAdmin , 'CHANGE_MEMBER_ROLES'),
    canDeleteProject: hasPermission(projectData, userId, isAdmin , 'DELETE_PROJECT'),
    canDuplicateProject: hasPermission(projectData, userId, isAdmin , 'DUPLICATE_PROJECT'),
    canSaveAsTemplate: hasPermission(projectData, userId, isAdmin , 'SAVE_AS_TEMPLATE'),
    canImportCSV: hasPermission(projectData, userId, isAdmin , 'IMPORT_CSV'),
    canExportCSV: hasPermission(projectData, userId, isAdmin , 'EXPORT_CSV'),
    canCreateEditTasks: hasPermission(projectData, userId, isAdmin , 'CREATE_EDIT_TASKS'),
    canDeleteTasks: hasPermission(projectData, userId, isAdmin , 'DELETE_TASKS'),
    canCompleteReopenTasks: hasPermission(projectData, userId, isAdmin , 'COMPLETE_REOPEN_TASKS'),
    canCommentOnTasks: hasPermission(projectData, userId, isAdmin , 'COMMENT_ON_TASKS'),
    canViewTasks: hasPermission(projectData, userId, isAdmin , 'VIEW_TASKS'),
    canAccessNotes: hasPermission(projectData, userId, isAdmin , 'VIEW_NOTES'),
    canEditNotes: hasPermission(projectData, userId, isAdmin , 'EDIT_NOTES'),
    canDeleteNotes: hasPermission(projectData, userId, isAdmin , 'DELETE_NOTES'),
    canViewActivityLog: hasPermission(projectData, userId, isAdmin , 'VIEW_ACTIVITY_LOG'),
    // canChangeProjectSettings: hasPermission(projectData, userId, isAdmin , 'CHANGE_PROJECT_SETTINGS'),
  };
};
