import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { fetchAuthGET, postAPI } from '@/store/api/apiSlice';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import { djangoBaseURL } from '@/helper';

const AsanaStickyBottomBar = ({ closeBottomBar, selectedTasks }) => {
  const [showModal, setShowModal] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasksWithProject, setTasksWithProject] = useState([]);
  const [bulkUploadLoader, setBulkUploadLoader] = useState(false);
  const navigate = useNavigate();

  const handleProjectChange = (selectedOption) => {
    setSelectedProject(selectedOption.value);
  };

  const handleTasksUpload = () => {
    getAllProjects();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const getAllProjects = async () => {
    try {
      const data = await fetchAuthGET(`${djangoBaseURL}/project/company/${userInfo?.companyId}/${userInfo?._id}/`);
      if (data.status) {
        const ActiveProjects = data.projects.filter(project => project.isActive);
        setProjects(ActiveProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const projectOptions = projects.map(project => ({
    value: project._id.toString(),
    label: project.name
  }));

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ccc',
      '&:hover': { borderColor: 'lightgray' },
      textAlign: 'left',
      backgroundColor: 'var(--input-bg)', // Custom variable for input background
    }),
    singleValue: (provided) => ({
      ...provided,
      textAlign: 'left',
      color: 'var(--input-text)', // Custom variable for input text color
    }),
    option: (provided, state) => ({
      ...provided,
      textAlign: 'left',
      color: 'black',
      backgroundColor: state.isSelected ? 'lightgray' : 'white',
      '&:hover': {
        backgroundColor: 'lightgray'
      }
    })
  };

  const handleBulkUpload = async () => {
    if (selectedProject === null || selectedProject === undefined) {
      toast.error('Please select a project');
      return;
    }
    setBulkUploadLoader(true);
    try {
      const response = await postAPI(`api/bulk-upload-tasks/`, {
        body: {
          tasks: tasksWithProject
        }
      });
      if (response.status === 1) {
        toast.success(response.message);
      } else {
        toast.error('Failed to create tasks');
      }
    } catch (error) {
      console.error('API call error:', error);
    } finally {
      closeModal();
      setBulkUploadLoader(false);
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    }
  };

  useEffect(() => {
    if (selectedTasks && selectedProject && userInfo) {
      const updatedTasks = selectedTasks.map(task => ({
        ...task,
        taskName: task.name,
        projectId: selectedProject,
        userId: userInfo._id,
      }));
      setTasksWithProject(updatedTasks);
    }
  }, [selectedTasks, selectedProject, userInfo]);

  return (
    <>
      <div className="Bbar z-10">
        <div className="BottomBar box-border border rounded-md fixed bottom-20 bg-white dark:bg-gray-800 shadow-md flex items-center justify-between border-t border-gray-200 dark:border-gray-700 max-w-screen-md w-full slide-up mx-auto">
          <div className="flex items-center space-x-4">
            <div className="bg-appbg text-gray-800 dark:text-gray-200 rounded-tl rounded-bl p-5 text-f18">
              {selectedTasks?.length}
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">Items selected</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleTasksUpload} className="flex items-center space-x-2 material-icons flex-col justify-center border-0 pr-5 p-2 cursor-pointer">
              <Icon icon="material-symbols-light:upload-sharp" className="text-gray-800 dark:text-gray-200" />
              <span className="text-gray-800 dark:text-gray-200">Upload on Dyzo</span>
            </button>
            {!showModal &&
              <div onClick={closeBottomBar} className="bg-appbg-600 text-appbg cursor-pointer rounded-tr rounded-br p-5 text-f18 border-l dark:border-gray-700 close-bottomBar">
                <Icon icon="system-uicons:cross" className="text-gray-800 dark:text-gray-200" />
              </div>
            }
          </div>
        </div>
      </div>

      <Modal activeModal={showModal} onClose={closeModal} title=''>
        <div className="py-2 text-left">
          <label htmlFor="select-project" className="py-1 font-medium text-gray-800 dark:text-gray-200">Select Project</label>
          <Select
            value={projectOptions.find(option => option.value === selectedProject)}
            onChange={handleProjectChange}
            options={projectOptions}
            styles={customStyles}
            className="block text-sm text-gray-900 dark:text-gray-200 rounded-lg"
            classNamePrefix="select"
            placeholder="Select Project"
            isSearchable={true}
            noOptionsMessage={() => "No projects available"}
          />
        </div>

        <Button type="submit" text="Submit" className="bg-black-500 text-white mt-2" onClick={handleBulkUpload} />


      </Modal>
    </>
  );
};

export default AsanaStickyBottomBar;
