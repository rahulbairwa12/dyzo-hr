import React, { useState } from 'react';
import { GoTasklist } from 'react-icons/go';
import { MdPlaylistAdd } from 'react-icons/md';
import { TbListDetails, TbSubtask } from 'react-icons/tb';
import { Link } from 'react-router-dom';

export const TaskSidebar = ({toggleSidebar, isOpen, projects, handleTabChange}) => {

  return (
    <>
      <div id="drawer-navigation" className={`tasksidebar ${isOpen ? 'open' : 'closed'}`}>
        
        <button
          type="button"
          onClick={toggleSidebar}
          aria-controls="drawer-navigation"
          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute top-2.5 end-2.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
        >
         X
        </button>

        <div className="py-4 overflow-y-auto">
            
            <ul className="space-y-2 font-medium pl-3">
                <li class="mt-8">
                    <h5 class="mb-2 text-sm font-semibold tracking-wide text-gray-900 lg:text-xs dark:text-white text-f16">Tasks</h5>
                    <ul class="py-1 list-unstyled fw-normal small">
                        <li>
                            <Link onClick={() => handleTabChange(0) } data-sidebar-item="" class="py-2 transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400 dark:hover:text-white text-f15">
                            <GoTasklist className={`w-6 h-6 me-2 group-hover:text-apptext`}/>All Tasks </Link>
                        </li>
                        <li>
                            <Link onClick={() => handleTabChange(1) } data-sidebar-item="" class="py-2 transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400 dark:hover:text-white text-f15">
                            <MdPlaylistAdd className={`w-6 h-6 me-2 group-hover:text-apptext`}/> My Tasks </Link>
                        </li>
                        <li>
                            <Link onClick={() => handleTabChange(2) } data-sidebar-item="" class="py-2 transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400 dark:hover:text-white text-f15">
                            <TbSubtask className={`w-6 h-6 me-2 group-hover:text-apptext`}/> Assigned Task</Link>
                        </li>
                        <li>
                            <Link onClick={() => handleTabChange(3) } data-sidebar-item="" class="py-2 transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400 dark:hover:text-white text-f15">
                            <TbListDetails className={`w-6 h-6 me-2 group-hover:text-apptext`}/> Mentioned Task </Link>
                        </li>
                    </ul>
                </li>
            </ul>

            <ul className="space-y-2 font-medium pl-3">
                <li>
                    <h5 class="mb-2 text-sm font-semibold tracking-wide text-gray-900 lg:text-xs dark:text-white text-f16">Projects</h5>
                </li>
                {
                    projects.map((project) => {
                        const truncatedName = project.name.length > 18 ? project.name.substring(0, 18) + '...' : project.name;
                        return (<li className='m-0 p-0'>
                            <Link onClick={() => handleTabChange(3) } data-sidebar-item="" class=" transition-colors duration-200 relative flex items-center flex-wrap font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400 dark:hover:text-white text-f15">
                            <TbListDetails className={`w-6 h-6 me-2 group-hover:text-apptext`}/> {truncatedName} </Link>
                        </li>)
                    })
                }
            </ul>

        </div>
      </div>
    </>
  );
};
