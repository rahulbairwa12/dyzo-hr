import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import avatar1 from "@/assets/images/avatar/av-1.svg";
import avatar2 from "@/assets/images/avatar/av-2.svg";
import avatar3 from "@/assets/images/avatar/av-3.svg";
import avatar4 from "@/assets/images/avatar/av-4.svg";

export const appProjectSlice = createSlice({
  name: "approject",
  initialState: {
    openProjectModal: false,
    isLoading: null,
    editItem: {},
    projects: [
      {
        id: uuidv4(),
        assignee: [
          { image: avatar1, label: "Mahedi Amin" },
          { image: avatar2, label: "Sovo Haldar" },
          { image: avatar3, label: "Rakibul Islam" },
        ],
        name: "Management Dashboard",
        des: "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.",
        startDate: "2022-10-03",
        endDate: "2022-10-06",
        progress: 75,
        category: [
          { value: "team", label: "team" },
          { value: "low", label: "low" },
        ],
      },
      {
        id: uuidv4(),
        assignee: [
          { image: avatar1, label: "Mahedi Amin" },
          { image: avatar2, label: "Sovo Haldar" },
          { image: avatar3, label: "Rakibul Islam" },
        ],
        name: "Business Dashboard",
        des: "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.",
        startDate: "2022-10-03",
        endDate: "2022-10-10",
        progress: 50,
        category: [
          { value: "team", label: "team" },
          { value: "low", label: "low" },
        ],
      },
    ],
  },
  reducers: {
    toggleAddModal: (state, action) => {
      state.openProjectModal = action.payload;
    },
    setEditItem: (state, action) => {
      state.editItem = action.payload;
    },
    pushProject: (state, action) => {
      state.projects.unshift(action.payload);
      toast.success("Add Successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter(item => item.id !== action.payload);
      toast.warning("Remove Successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    },
    updateProject: (state, action) => {
      const { id, name, des, startDate, endDate, assignee, progress, category } = action.payload;
      const index = state.projects.findIndex(item => item.id === id);
      if (index >= 0) {
        state.projects[index] = {
          id, name, des, startDate, endDate, assignee, progress, category
        };
      }
      toast.success("Update Successfully", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    },
  },
});

export const {
  pushProject,
  toggleAddModal,
  removeProject,
  setEditItem,
  updateProject,
} = appProjectSlice.actions;
export default appProjectSlice.reducer;
