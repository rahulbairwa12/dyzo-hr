import React, { useState } from "react";
import { Icon } from "@iconify/react";
import DeleteClientPopUp from "../client/DeleteClientPopUp";
import BulkUpdateModal from "./BulkUpdateModal";

const BottomBar = ({
  selectedTasks,
  deleteTasks,
  exportTasks,
  copyTasks,
  closeBottomBar,
  bulkLoading,
  modalIsOpen,
  setModalIsOpen,
  handleBulkUpdate,
  projects,
  users,
  taskPositions, // pass your taskStatuses array here 
  isCopy
}) => {
  // We'll use modalIsOpen state for two different modals: "delete" and "update".
  const openDeleteModal = () => setModalIsOpen("delete");
  const openUpdateModal = () => setModalIsOpen("update");
  const closeModal = () => setModalIsOpen("");


  return (
    <div className="Bbar">
      <div className="BottomBar box-border border rounded-md shadow-[0px_15px_50px_rgba(0,0,0,0.3)] fixed bottom-12 md:bottom-20 bg-white flex flex-wrap md:flex-nowrap items-center justify-between border-t border-gray-200 max-w-screen-md w-96 md:w-full slide-up mx-auto dark:bg-slate-800 ">
        <div className="flex items-center md:space-x-4">
          <div className="bg-appbg text-black-500 dark:text-white rounded-tl rounded-bl p-3 md:p-5 text-f18">
            {selectedTasks?.length}
          </div>
          <span className="font-semibold">{selectedTasks?.length > 1 ? "Tasks selected" : "Task selected"}</span>
        </div>
        <div className="flex items-center w-full md:w-auto justify-evenly md:space-x-4 ">
          <button
            className="flex items-center space-x-2 material-icons flex-col justify-center border-0 pr-5 p-2 cursor-pointer"
            onClick={copyTasks}
            disabled={selectedTasks?.length === 0}
          >
            <Icon icon="uil:copy" className="text-f24 hover:text-apptext " />
            <span>{isCopy ? "Copied" : "Copy"}</span>
          </button>
          <button
            className="flex items-center space-x-2 material-icons flex-col justify-center border-0 pr-5 p-2 cursor-pointer"
            onClick={exportTasks}
            disabled={selectedTasks?.length === 0}
          >
            <Icon icon="icon-park-outline:excel" className="text-f24 hover:text-apptext" />
            <span>Export</span>
          </button>
          <button
            className="flex items-center space-x-2 material-icons flex-col justify-center p-2 cursor-pointer"
            onClick={openUpdateModal}
            disabled={selectedTasks?.length === 0}
          >
            <Icon icon="fluent:edit-16-regular" className="text-f24 hover:text-apptext" />
            <span>Update</span>
          </button>
          <button
            className="flex items-center space-x-2 material-icons flex-col justify-center p-2 cursor-pointer"
            onClick={openDeleteModal}
            disabled={selectedTasks?.length === 0}
          >
            <Icon icon="fluent:delete-16-regular" className="text-f24 hover:text-apptext" />
            <span>Delete</span>
          </button>
          <div
            onClick={closeBottomBar}
            className="bg-appbg-600 text-appbg cursor-pointer rounded-tr rounded-br p-2 md:p-5 text-f18 border-l close-bottomBar"
          >
            <Icon icon="material-symbols-light:close" className="m-0 p-0 w-8 h-8" />
          </div>
        </div>
      </div>

      {modalIsOpen === "delete" && (
        <DeleteClientPopUp
          showModal={true}
          onClose={closeModal}
          handleDelete={deleteTasks}
          loading={bulkLoading}
        />
      )}

      {modalIsOpen === "update" && (
        <BulkUpdateModal
          showModal={true}
          onClose={closeModal}
          handleBulkUpdate={handleBulkUpdate}
          loading={bulkLoading}
          projects={projects}
          users={users}
          taskPositions={taskPositions}
        />
      )}
    </div>
  );
};

export default BottomBar;
