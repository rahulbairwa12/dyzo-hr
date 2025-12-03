import layout from "./layout";

import email from "../pages/app/email/store";
import chat from "../pages/app/chat/store";

import auth from "./api/auth/authSlice";
import cart from "./api/shop/cartSlice";
import counter from "../store/counterReducer";

import plan from "./planSlice";
import users from "./usersSlice";
import notifications from "./notificationsSlice";


const rootReducer = {
  layout,
  email,
  chat,
  auth,
  cart,
  counter,

  plan,
  users,
  notifications,


};
export default rootReducer;
