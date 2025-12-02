import { fetchPOST, fetchAuthGET } from "@/store/api/apiSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Modal from "../ui/Modal";

const AddCardForm = ({ onAdd, onCancel, getAllTasks }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [project, setProject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const userInfo = useSelector(state => state.auth.user);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getAllEmployees = async () => {
      try {
        const data = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`
        );
        if (data) {
          let processedUsers = data.map(user => ({
            label: user.name,
            value: user._id
          }));
          setEmployees(processedUsers);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    getAllEmployees();
  }, [userInfo]);

  useEffect(() => {
    const getAllProjects = async () => {
      try {
        const { projects } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/project/company/${userInfo?.companyId}/${userInfo?._id}/`);
        setProjects(projects);

      } catch (error) {
        console.error("Error fetching employees", error);
      }
    }

    getAllProjects();
  }, []);


  const handleSubmit = async () => {
    setLoading(true);
    try {
      const createTask = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/create-task/${userInfo._id}/`, { body: { "taskName": title, description, userId: assignee, projectId: project, dueDate } });
      if (createTask.status) {
        toast.success('Task created successfully');
        getAllTasks();
        onCancel();

      }
    } catch (error) {
      toast.error('Error creating task');
    }
    finally {
      setLoading(false);
    }
  }




  return (

    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-1/3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Task</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Task Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Task Name"
          />
          {!title && <span className="text-red-500 text-sm">Title is required</span>}
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Project</label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            {
              projects.map((project) => (
                <option key={project._id} value={project._id} className="capitalize">{project.name}</option>
              )
              )
            }
          </select>
          {!project && <span className="text-red-500 text-sm">Project is required</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Assignee</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            {
              employees.map((employee) => (
                <option key={employee.value} value={employee.value} className="capitalize">{employee.label}</option>
              ))
            }
          </select>
          {!assignee && <span className="text-red-500 text-sm">Assignee is required</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Description"
          />
        </div>
        <div className="flex justify-end">
          <button className="p-2 bg-gray-300 rounded mr-2" onClick={onCancel}>
            Cancel
          </button>
          <button className="p-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCardForm;