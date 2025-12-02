import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchGET , fetchAuthPut  } from "./api/apiSlice";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async ({ companyId, _id, showAll, userInfo }, { rejectWithValue }) => {
    
    try {
      let projects = [];
      const baseURL = import.meta.env.VITE_APP_DJANGO;
     

      // Get the current user ID - first try from userInfo, then from state, then from cookies
      let currentUserId = userInfo?._id;

      // If currentUserId is not available in userInfo, try to get it from cookies
      if (!currentUserId) {
        try {
          const userInfoFromCookie = JSON.parse(
            Cookies.get("userInfo") || "{}"
          );
          currentUserId = userInfoFromCookie._id;
        } catch (error) {
          console.error("Error parsing user info from cookie:", error);
        }
      }

      // If we still don't have a user ID, log an error
      if (!currentUserId) {
        toast.error(
          "User information is missing. Please try logging in again."
        );
        return rejectWithValue("User ID not found");
      }

      // Construct the API URL with the current user ID
      const apiUrl = `${baseURL}/project/company/${companyId}/${_id}/`;

      // Use client-specific API for client users
      if (userInfo?.user_type === "client") {
        const data = await fetchGET(
          `${
            import.meta.env.VITE_APP_DJANGO
          }/project/company/${companyId}/${_id}/`
        );

        if (data && data.projects) {
          projects = data.projects;
        } else {
          console.log(
            "No client projects found or unexpected data structure:",
            data
          );
        }
      }
      // Use company-wide projects API for non-client users
      else {
        const data = await fetchGET(
          `${
            import.meta.env.VITE_APP_DJANGO
          }/project/company/${companyId}/${_id}/`
        );
        if (data && data.projects) {
          projects = data.projects;
        }
      }

      // Filter active projects
      const activeProjects = projects.filter(
        (project) => project.isActive === true
      );

      // Add "All Projects" option if needed
      /* \   if (showAll === true) {
        let allElement = { _id: '0', name: "All Projects" };
        activeProjects.unshift(allElement);
      }
 */
      return activeProjects || [];
    } catch (error) {
      toast.error("Failed to fetch projects");
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

// Thunk for updating members
export const updateProjectMembers = createAsyncThunk(
  "projects/updateProjectMembers",
  async ({ projectId, userId, assignees, accessLevels }, { rejectWithValue }) => {
    try {
      const response = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/project-v2/${projectId}/${userId}/`,
        {
          body: JSON.stringify({
            assignee: assignees,
            accessLevels: accessLevels,
          })
        }
      );
      if (response.status === 1) {
        toast.success("Project members updated successfully");
        return response.data;
      } else {
        toast.error("Failed to update project members");
        return rejectWithValue("Failed");
      }
    } catch (error) {
      toast.error("Error updating project members");
      return rejectWithValue(error.response?.data || "Something went wrong");
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    loading: false,
    error: null,
  },
  reducers: {
    // 👇 Naya reducer
    addProjectToTop: (state, action) => {
      // action.payload = new project object
      state.projects.unshift(action.payload);
    },
    // Update a project by _id with provided changes
    updateProjectInList: (state, action) => {
      const { id, changes } = action.payload || {};
      if (!id || !changes) return;
      const index = state.projects.findIndex((p) => p._id === id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...changes };
      }
    },
    removeProjectFromList: (state, action) => {
      const projectIdToRemove = action.payload;
      state.projects = state.projects.filter(project => project._id !== projectIdToRemove);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProjectMembers.fulfilled, (state, action) => {
        const updatedData = action.payload;
        if (!updatedData?._id) return;
        const index = state.projects.findIndex(p => p._id === updatedData._id);
        if (index !== -1) {
          state.projects[index] = { ...state.projects[index], ...updatedData };
        }
      });
  },
});

// 👇 Export karein action
export const { addProjectToTop, updateProjectInList, removeProjectFromList } = projectsSlice.actions;

export default projectsSlice.reducer;
