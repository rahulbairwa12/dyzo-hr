import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import { fetchGET } from "@/store/api/apiSlice";
import { toast, ToastContainer } from "react-toastify";
import Button from "@/components/ui/Button";
import SkeletionTable from "@/components/skeleton/Table";
import ClientProjectList from "@/clientComponent/project/ClientProjectList";
import DeleteClientPopUp from "@/components/client/DeleteClientPopUp";
import ClientAddProject from "@/clientComponent/project/ClientAddProject";
import { formatDateWithMonthName } from "@/helper/helper";
import ClientProjectEditModal from "@/clientComponent/project/ClientProjectEditModal";


const ClientProject = () => {
    const [projects, setProjects] = useState([]);
    const { width, breakpoints } = useWidth();
    const [isLoaded, setIsLoaded] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [data, setData] = useState({});
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchProjects = async () => {
        try {
            setIsLoaded(true);

            const { projects } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/client/${userInfo._id}/projects/`);
            if (projects) {
                setProjects(projects);
            }
        } catch (error) {
            toast.error("Failed to fetch projects");
        } finally {
            setIsLoaded(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [userInfo._id]);

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            const isProjectDeleted = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/api/project/delete/${projectId}/`);
            if (isProjectDeleted.status) {
                toast.success("Project deleted successfully");
                setShowDeleteProjectModal(false);
                setProjectId(null);
                fetchProjects();
            }
        } catch (error) {
            toast.error("Failed to delete project");
        } finally {
            setDeleteLoading(false);
        }
    };


    const downloadProjectsData = (projects) => {
        const projectsCSV = projects.map(project => {
            const formattedDate = formatDateWithMonthName(project.dateAdded);
            return `${project.name},${project.description},${formattedDate}\n`;
        }).join('');

        const csvContent = `Name,Description,Date Added\n${projectsCSV}`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'projects_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <ToastContainer />
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
                    Projects
                </h4>
                <div className={`${width < breakpoints.md ? "space-x-rb" : ""} md:flex md:space-x-4 md:justify-end items-center rtl:space-x-reverse`}>
                    <Button
                        icon="heroicons-outline:download"
                        text="Download"
                        className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
                        iconClass="text-lg"
                        onClick={() => downloadProjectsData(projects)}
                    />
                </div>
            </div>

            {isLoaded && (<SkeletionTable count="20" />)}

            {!isLoaded && (
                <div>
                    <ClientProjectList projects={projects} setData={setData} setShowEditProjectModal={setShowEditProjectModal} />
                </div>
            )}

            <ClientAddProject
                showAddProjectModal={showAddProjectModal}
                setShowAddProjectModal={setShowAddProjectModal}
                fetchProjects={fetchProjects}

            />

            {<ClientProjectEditModal showEditProjectModal={showEditProjectModal} setShowEditProjectModal={setShowEditProjectModal} fetchProjects={fetchProjects} data={data} />}

            {<DeleteClientPopUp showModal={showDeleteProjectModal} onClose={() => { setShowDeleteProjectModal(false) }} handleDa
                ={handleDelete} loading={deleteLoading} />}



        </div>
    );
};

export default ClientProject;
