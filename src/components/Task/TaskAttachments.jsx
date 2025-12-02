import React, { useState } from "react";
import FileUpload from "./FileUpload";

export default function TaskAttachments({ task, isOpen, onClose, fetchAttachments, totalAttachments }) {
  const saveStatusToDatabase = async (status) => {
    try {
      // const data = await fetchAuthPatch(`${process.env.REACT_APP_DJANGO}/update_task_status/${rowId}/`, {
      //   body: { action: 'isComplete' }
      // });
      // if (data.status) {
      //   setIsRowComp((prevIds) => prevIds.filter((id) => id !== index));
      //   setIsRowComp((prevIds) => [...prevIds, rowId]);
      //   toast('success', data.msg);
      // }
    } catch (error) { }
  };

  return (
    <div className="relative">
      {task && (
        <FileUpload
          taskId={task.taskId}
          index={task.taskId}
          from="taskpanel"
          task={task}
          isOpen={isOpen}
          onClose={onClose}
          fetchAttachments={fetchAttachments}
          totalAttachments={totalAttachments}
        />
      )}
    </div>
  );
}
