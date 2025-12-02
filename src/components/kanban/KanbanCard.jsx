import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { calculateDaysBetweenDates, formatDateWithMonthName, intialLetterName } from "@/helper/helper";
import TaskPanel from "../Task/TaskPanel";
import Card from '../ui/Card'
import { fetchGET } from "@/store/api/apiSlice";

const ItemTypes = {
    CARD: "card",
};

const KanbanCard = ({ card, removeCard, users }) => {
    const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
    const [, ref] = useDrag({ type: ItemTypes.CARD, item: { type: ItemTypes.CARD, id: card?.taskId } });

    const [projects, setProjects] = useState([]);
    const userInfo = useSelector((state) => state.auth.user);

    // Fetch projects on component mount
    useEffect(() => {
        const getAllProjects = async () => {
            try {
                const { projects } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/project/company/${userInfo?.companyId}/${userInfo?._id}/`);
                setProjects(projects);
            } catch (error) {
                console.error("Error fetching projects", error);
            }
        };

        getAllProjects();
    }, [userInfo]);

    // Filter users for collaborators and task owner
    const filteredUsers = users.filter(user => card.collaborators.includes(user._id));
    const filterUser = users.filter(user => card.userId === user._id);

    const onClose = () => {
        setIsTaskPanelOpen(false);
    };

    return (

    
            <div ref={ref} className="bg-white p-4 m-2 rounded-lg shadow-lg border border-gray-200 flex flex-col cursor-pointer dark:bg-slate-700" onClick={() => setIsTaskPanelOpen(true)}>
                {/* Card Header */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                            {filterUser[0]?.image ? (
                                <img
                                    src={filterUser[0]?.image}
                                    alt="profile"
                                    className="w-[2rem] h-[2rem] rounded-full"
                                />
                            ) : (
                                <div className="rounded-full">
                                    <span className="bg-[#002D2D] text-white flex justify-center items-center rounded-full mr-2 font-bold text-lg leading-none w-[2rem] h-[2rem]">
                                        {intialLetterName('', '', card?.name)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg ml-2 capitalize">{card.project}</h3>
                    </div>
                    <button className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); removeCard(card?.taskId); }}>
                        <TrashIcon className='w-5 h-5' />
                    </button>
                </div>

                {/* Card Body */}
                <p className="text-gray-600 mb-2 dark:text-white">{card.taskName}</p>
                <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700 my-2 ">
                    <div
                        className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                        style={{ width: `${card.taskCompletionPercentage}% `, maxWidth:"100%" }}
                    />
                </div>

                {/* Card Footer */}
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500 dark:text-white">Start date</span>
                        <span className="text-sm text-gray-500 dark:text-white">{formatDateWithMonthName(card.start_date)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500 dark:text-white">Due date</span>
                        <span className="text-sm text-gray-500 dark:text-white">{formatDateWithMonthName(card.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <span className="text-sm text-gray-500 dark:text-white">Collaborators</span>
                            <div className="flex -space-x-2 mt-1">
                                {filteredUsers.map((user, index) => (
                                    user?.image ? (
                                        <img key={index} className="w-[2rem] h-[2rem] rounded-full border-2 border-white object-cover" src={user?.image} alt="Avatar" />
                                    ) : (
                                        <p key={index} className='w-[2rem] h-[2rem] rounded-full border flex justify-center items-center font-semibold bg-slate-200 text-f13'>
                                            {intialLetterName(user.first_name, user.last_name, user.name)}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                        <div className="text-red-500 text-sm">{calculateDaysBetweenDates(card.start_date, card.dueDate)} days left</div>
                    </div>
                </div>

                {/* Task Panel Modal */}
                {isTaskPanelOpen && <TaskPanel isOpen={isTaskPanelOpen} onClose={onClose} users={users} task={card} projects={projects} />}
            </div>

       

    );
};

export default KanbanCard;
