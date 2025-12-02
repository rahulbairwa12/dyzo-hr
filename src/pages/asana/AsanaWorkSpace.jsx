import React, { useEffect, useState } from "react";
import { fetchAPI, fetchAuthAPI } from "@/store/api/apiSlice";
import Cookies from "js-cookie";
import Select from "react-select";
import AsanaStickyBottomBar from "./AsanaStickyBottomBar";
import { ToastContainer, toast } from "react-toastify";

const AsanaWorkSpace = () => {
  const [loading, setLoading] = useState(false);
  const [workspaceLoaderCircle, setWorkspaceLoaderCircle] = useState(false);
  const [projectLoaderCircle, setProjectLoaderCircle] = useState(false);
  const [taskLoaderCircle, setTaskLoaderCircle] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("alltasks");
  const [selectedTasks, setSelectedTasks] = useState([]);

  const authToken = new URLSearchParams(window.location.search).get("code");
  const asanaAccessToken = Cookies.get("asana_access_token");
  const [isBottomBarVisible, setBottomBarVisible] = useState(false);

  useEffect(() => {
    if (
      authToken !== undefined &&
      authToken !== null &&
      authToken !== "" &&
      asanaAccessToken === undefined
    ) {
      getAccessToken(authToken);
    } else {
      setAccessToken(asanaAccessToken);
      fetchWorkspaces(asanaAccessToken);
    }
  }, [authToken]);

  const getAccessToken = async (authToken) => {
    setLoading(true);
    try {
      const response = await fetchAPI(
        `api/asana/oauth/callback/?code=${authToken}`
      );
      if (response.status === 1) {
        setAccessToken(response.access_token);
        Cookies.set("asana_access_token", response.access_token);
        fetchWorkspaces(response.access_token);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async (token) => {
    setWorkspaceLoaderCircle(true);
    try {
      const response = await fetchAuthAPI(`api/asana/workspaces/`, token);
      if (response.status) {
        setWorkspaces(response.workspaces);
      } else {
        Cookies.remove("asana_access_token");
        getAccessToken(authToken);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWorkspaceLoaderCircle(false);
    }
  };

  const fetchProjects = async (workspaceId) => {
    setProjectLoaderCircle(true);
    try {
      const response = await fetchAuthAPI(
        `api/asana/workspaces/${workspaceId}/projects/`,
        accessToken
      );
      if (response.status) {
        setProjects(response.projects);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProjectLoaderCircle(false);
    }
  };

  const fetchTasks = async (projectId) => {
    setTaskLoaderCircle(true);
    try {
      const response = await fetchAuthAPI(
        `api/asana/projects/${projectId}/tasks/`,
        accessToken
      );
      setTasks(response.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setTaskLoaderCircle(false);
    }
  };

  const fetchTasksOnStatus = async (projectId, taskStatus) => {
    setTaskLoaderCircle(true);
    try {
      const response = await fetchAuthAPI(
        `api/asana/projects/${projectId}/tasks/?status=${taskStatus}`,
        accessToken
      );
      setTasks(response.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setTaskLoaderCircle(false);
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
    setTasks([]);
    fetchProjects(workspace.gid);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    fetchTasks(project.gid);
  };

  const handleTaskStatus = (status) => {
    setActiveTab(status);
    if (status === "incompletetasks") {
      fetchTasksOnStatus(selectedProject.gid, "not_completed");
    } else if (status === "completetasks") {
      fetchTasksOnStatus(selectedProject.gid, "completed");
    } else {
      fetchTasks(selectedProject.gid);
    }
  };

  const handleTaskSelection = (taskId, taskName) => {
    setSelectedTasks((prevSelectedTasks) => {
      const isSelected = prevSelectedTasks.some((task) => task.gid === taskId);
      let newSelectedTasks;
      if (isSelected) {
        newSelectedTasks = prevSelectedTasks.filter(
          (task) => task.gid !== taskId
        );
      } else {
        newSelectedTasks = [
          ...prevSelectedTasks,
          { gid: taskId, name: taskName },
        ];
      }
      setBottomBarVisible(newSelectedTasks.length > 0);
      return newSelectedTasks;
    });
  };

  const handleSelectAllTasks = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
      setBottomBarVisible(false);
    } else {
      const allTasks = tasks.map((task) => ({
        gid: task.gid,
        name: task.name,
      }));
      setSelectedTasks(allTasks);
      setBottomBarVisible(true);
    }
  };

  const closeBottomBar = () => {
    setBottomBarVisible(false);
  };

  const workspaceOptions = workspaces.map((workspace) => ({
    value: workspace.gid,
    label: workspace.name,
  }));
  const projectOptions = projects.map((project) => ({
    value: project.gid,
    label: project.name,
  }));

  return (
    <main className="md:p-6 p-4 mb-24">
      <ToastContainer />
      {isBottomBarVisible && (
        <AsanaStickyBottomBar
          closeBottomBar={closeBottomBar}
          selectedTasks={selectedTasks}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-full">
          Loading...
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col sm:w-1/3">
            <div className="bg-white dark:bg-gray-800 p-3 my-2 rounded-lg flex-1">
              <div>
                <h6 className="text-gray-800 dark:text-gray-200">Choose Workspace</h6>
              </div>
              <div className="py-2 block sm:hidden">
                {workspaceLoaderCircle ? (
                  <div className="flex justify-center">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <Select
                    options={workspaceOptions}
                    onChange={(selectedOption) =>
                      handleWorkspaceSelect({
                        gid: selectedOption.value,
                        name: selectedOption.label,
                      })
                    }
                    value={
                      selectedWorkspace
                        ? {
                          value: selectedWorkspace.gid,
                          label: selectedWorkspace.name,
                        }
                        : null
                    }
                    isClearable
                  />
                )}
              </div>
              <div className="py-2 hidden sm:block max-h-96 overflow-auto">
                {workspaceLoaderCircle ? (
                  <div className="flex justify-center">Loading...</div>
                ) : (
                  <ul className="space-y-2">
                    {workspaces.map((workspace) => (
                      <li
                        key={workspace.gid}
                        className={`p-2 rounded-md cursor-pointer ${selectedWorkspace &&
                            selectedWorkspace.gid === workspace.gid
                            ? "bg-blue-200 dark:bg-blue-600"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        onClick={() => handleWorkspaceSelect(workspace)}
                      >
                        {workspace.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {selectedWorkspace && (
              <div className="bg-white dark:bg-gray-800 p-3 my-2 rounded-lg flex-1">
                <div>
                  <h6 className="text-gray-800 dark:text-gray-200">Choose Project</h6>
                </div>
                <div className="py-2 block sm:hidden">
                  {projectLoaderCircle ? (
                    <div className="flex justify-center">
                      <p>Loading...</p>
                    </div>
                  ) : (
                    <Select
                      options={projectOptions}
                      onChange={(selectedOption) =>
                        handleProjectSelect({
                          gid: selectedOption?.value,
                          name: selectedOption?.label,
                        })
                      }
                      value={
                        selectedProject
                          ? {
                            value: selectedProject?.gid,
                            label: selectedProject?.name,
                          }
                          : null
                      }
                      isClearable
                    />
                  )}
                </div>
                <div className="py-2 hidden sm:block max-h-96 overflow-auto">
                  {projectLoaderCircle ? (
                    <div className="flex justify-center">Loading...</div>
                  ) : (
                    <ul className="space-y-2">
                      {projects?.map((project) => (
                        <li
                          key={project?.gid}
                          className={`p-2 rounded-md cursor-pointer ${selectedProject &&
                              selectedProject?.gid === project?.gid
                              ? "bg-blue-200 dark:bg-blue-600"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          onClick={() => handleProjectSelect(project)}
                        >
                          {project?.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:w-2/3">
            {selectedProject && (
              <div className="bg-white dark:bg-gray-800 p-3 my-2 rounded-lg flex-1">
                <div>
                  <div className="flex mb-4">
                    <button
                      className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === "alltasks"
                          ? "text-blue-600 dark:text-blue-300 border-blue-600 dark:border-blue-300"
                          : "text-black dark:text-gray-200 border-transparent hover:text-gray-600 dark:hover:text-gray-400 hover:border-gray-300"
                        }`}
                      onClick={() => handleTaskStatus("alltasks")}
                    >
                      All Tasks
                    </button>
                    <button
                      className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === "incompletetasks"
                          ? "text-blue-600 dark:text-blue-300 border-blue-600 dark:border-blue-300"
                          : "text-black dark:text-gray-200 border-transparent hover:text-gray-600 dark:hover:text-gray-400 hover:border-gray-300"
                        }`}
                      onClick={() => handleTaskStatus("incompletetasks")}
                    >
                      Incompleted Tasks
                    </button>
                    <button
                      className={`inline-block p-4 rounded-t-lg border-b-2 ${activeTab === "completetasks"
                          ? "text-blue-600 dark:text-blue-300 border-blue-600 dark:border-blue-300"
                          : "text-black dark:text-gray-200 border-transparent hover:text-gray-600 dark:hover:text-gray-400 hover:border-gray-300"
                        }`}
                      onClick={() => handleTaskStatus("completetasks")}
                    >
                      Completed Tasks
                    </button>
                  </div>
                </div>
                <div className="py-2">
                  {taskLoaderCircle ? (
                    <div className="flex justify-center">Loading...</div>
                  ) : (
                    <div>
                      <div className="flex items-center mb-2 p-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.length === tasks.length}
                          onChange={handleSelectAllTasks}
                          className="mr-2"
                        />
                        <span className="text-gray-800 dark:text-gray-200">Select All Tasks</span>
                      </div>
                      <ul className="space-y-2 overflow-y-auto max-h-[608px]">
                        {tasks?.map((task) => (
                          <li
                            key={task?.gid}
                            className={`p-2 rounded-md cursor-pointer flex items-center ${task.completed ? "bg-green-100 dark:bg-green-600" : "bg-yellow-100 dark:bg-yellow-600"
                              }`}
                            onClick={() =>
                              handleTaskSelection(task.gid, task.name)
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selectedTasks.some(
                                (selectedTask) => selectedTask.gid === task.gid
                              )}
                              readOnly
                              className="mr-2"
                            />
                            <span className="text-gray-800 dark:text-gray-200">{task?.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default AsanaWorkSpace;
