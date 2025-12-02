import { sendNotification } from "./helper";
import moment from "moment";
export const notifyAssignee = async (field, value, task) => {

    try {
        // Determine the message based on the field updated
        let message = "";
        let title = task.taskName.length > 40 ? `${task.taskName.slice(0, 40)}... - Task Updated` : `${task.taskName} - Task Updated`;
        switch (field) {
            case "taskName":
                message = `Task name has been updated to "${value}".`;
                break;
            case "description":
                message = `Task description has been updated.`;
                break;
            case "priority":
                message = `Task priority has been set to "${value}".`;
                break;
            case "dueDate":
                message = `Task due date has been changed to ${moment.utc(value).local().format("MMM DD, YYYY")}.`;
                break;
            case "taskPosition":
                message = `Task status has been marked as "${value}".`;
                break;
            case "projectId":
                const projectName = task?.project_name || "a project";
                message = `Task has been moved to the project "${projectName}".`;
                break;
            case "collaborators":
                message = `Collaborators have been updated for this task.`;
                break;
            default:
                message = `Task has been updated.`;
        }

        // Update the URL format to match the tasks page expectation
        const url = `${window.location.origin}/tasks?taskId=${task?.taskId}`;

        // Send notification to the assignee
        await sendNotification(
            message,
            title,
            "userId",
            task.userId,
            { taskId: task.taskId },
            url
        );
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};