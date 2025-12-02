import layout from "./layout";

import email from "../pages/app/email/store";
import chat from "../pages/app/chat/store";
import kanban from "../pages/app/kanban/store";
import auth from "./api/auth/authSlice";
import cart from "./api/shop/cartSlice";
import counter from "../store/counterReducer";
import projects from "./projectsSlice";
import plan from "./planSlice";
import users from "./usersSlice";
import notifications from "./notificationsSlice";
import trash from "./trashSlice";
import {
  tasksReducer as tasks,
  taskStatusReducer as taskStatus,
} from "../features/tasks";
import sectionTasks from "../features/section-task/store/sectionTaskSlice";

const rootReducer = {
  layout,
  email,
  chat,
  kanban,
  auth,
  cart,
  counter,
  projects,
  plan,
  users,
  notifications,
  trash,
  tasks,
  taskStatus,
  sectionTasks,
};
export default rootReducer;
