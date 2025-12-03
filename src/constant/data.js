// export const clientMenuItems = [
//   {
//     title: "Dashboard",
//     icon: "heroicons-outline:home",
//     isHide: false,
//     link: "client/dashboard",
//   },
//   {
//     title: "Tasks",
//     icon: "hugeicons:task-add-02",
//     link: "task/client",
//     isHide: false,
//   },

//   {
//     title: "Timesheet",
//     icon: "tabler:report-analytics",
//     link: "timesheet/client",
//     isHide: false,
//   },

//   {
//     title: "Notification",
//     icon: "mingcute:notification-line",
//     link: "inbox",
//     isHide: false,
//   },
// ];

export const menuItems = [
  {
    title: "Home",
    icon: "heroicons:home",
    isHide: false,
    link: "dashboard",
  },
  {
    title: "Inbox",
    icon: "basil:notification-on-outline",
    link: "inbox",
    isHide: false,
  },
  {
    title: "Users",
    icon: "clarity:employee-group-line",
    link: "employees",
    isHide: false,
  },
  {
    title: "Manage",
    icon: "material-symbols:folder-managed",
    link: "#",
    isHide: false,
    child: [
      {
        childtitle: "Notices",
        childlink: "notices-management",
      },
      {
        childtitle: "Expense",
        childlink: "expense",
      },
      {
        childtitle: "Complain",
        childlink: "complain",
      },
      {
        childtitle: "Reference",
        childlink: "reference",
      },
      {
        childtitle: "Salary",
        childlink: "salary-management",
      },
      {
        childtitle: "Holiday",
        childlink: "holiday",
      },
      {
        childtitle: "HR",
        childlink: "HR-contrl-desk",
      },
    ],
  },
  {
    title: "Leaves",
    icon: "fluent-mdl2:vacation",
    link: "leaves",
    isHide: false,
  },
  {
    title: "Attendance",
    icon: "fluent:people-audience-20-regular",
    link: "attendance",
    isHide: false,
  },
  {
    title: "Calendar",
    icon: "heroicons-outline:calendar",
    link: "calendar",
    isHide: false,
  },
  {
    title: "Invite User",
    icon: "fluent-mdl2:chat-invite-friend",
    link: "invite-user",
    isHide: false,
  },
  {
    title: "Settings",
    icon: "weui:setting-outlined",
    link: "settings",
    isHide: false,
  },
];

export const permissionItemMunu = [
  {
    title: "Leaves",
    icon: "fluent-mdl2:vacation",
    link: "leaves",
    isHide: false,
  },
  {
    title: "Users",
    icon: "clarity:employee-group-line",
    link: "employees",
    isHide: false,
  },
  {
    title: "Invite User",
    icon: "fluent-mdl2:chat-invite-friend",
    link: "invite-user",
    isHide: false,
  },
];

export const employeeMenuItems = [
  {
    title: "Home",
    icon: "heroicons-outline:home",
    isHide: false,
    link: "dashboard",
  },
  {
    title: "Inbox",
    icon: "basil:notification-on-outline",
    link: "inbox",
    isHide: false,
  },
  {
    title: "Leaves",
    icon: "fluent-mdl2:vacation",
    link: "leaves",
    isHide: false,
  },
  {
    title: "Attendance",
    icon: "fluent:people-audience-20-regular",
    link: "attendance",
    isHide: false,
  },
  {
    title: "Calendar",
    icon: "heroicons-outline:calendar",
    link: "calendar",
    isHide: false,
  },
  {
    title: "Settings",
    icon: "weui:setting-outlined",
    link: "settings",
    isHide: false,
  },
];

export const clientMenuItems = [];

export const topMenu = [


  {
    title: "Manage",
    icon: "heroicons-outline:chip",
    link: "#",
    child: [
      {
        childtitle: "Teams",
        childlink: "teams",
        childicon: "mingcute:group-3-line",
      },
      // {
      //   childtitle: "Tasks",
      //   childlink: "tasks",
      //   childicon: "hugeicons:task-add-02",
      // },
      {
        childtitle: "Analytics",
        childlink: "dashboard",
        childicon: "tabler:report-analytics",
      },


      {
        childtitle: "Users",
        childlink: "employees",
        childicon: "clarity:employee-group-line",
      },

      {
        childtitle: "Clients",
        childlink: "clients",
        childicon: "la:user-tie",
      },
      {
        childtitle: "Leaves",
        childlink: "leaves",
        childicon: "fluent-mdl2:vacation",
      },

      // {
      //   childtitle: "HR",
      //   childlink: "HR-contrl-desk",
      //   childicon: "ic:outline-person",
      // },

      {
        childtitle: "Calendar",
        childicon: "heroicons-outline:calendar",
        childlink: "calendar",
      },

      {
        childtitle: "Attendance",
        childlink: "attendance",
        childicon: "fluent:people-audience-20-regular",
      },
    ],
  },



  {
    title: "Extra",
    icon: "heroicons-outline:template",

    child: [
      {
        childtitle: "Invite User",
        childlink: "invite-user",
        childicon: "fluent-mdl2:chat-invite-friend",
      },

      {
        childtitle: "Notices",
        childlink: "notices-management",
        childicon: "fe:notice-active",
      },

      // {
      //   childtitle: "Expense",
      //   childlink: "expense",
      //   childicon: "tabler:report-money",
      // },

      // {
      //   childtitle: "Complain",
      //   childlink: "complain",
      //   childicon: "hugeicons:complaint",
      // },
      // {
      //   childtitle: "Reference",
      //   childlink: "reference",
      //   childicon: "ic:outline-person",
      // },
      // {
      //   childtitle: "Salary",
      //   childlink: "salary-management",
      //   childicon: "ph:money",
      // },
      {
        childtitle: "Holiday",
        childlink: "holiday",
        childicon: "clarity:on-holiday-line",
      },

      {
        childtitle: "Settings",
        childicon: "weui:setting-outlined",
        childlink: "settings",
      },
    ],
  },
  // {
  //   title: "Premium",
  //   icon: "heroicons-outline:template",

  //   child: [
  //     {
  //       childtitle: "HR",
  //       childlink: "HR-contrl-desk",
  //       childicon: "ic:outline-person",
  //     },
  //     {
  //       childtitle: "Expense",
  //       childlink: "expense",
  //       childicon: "tabler:report-money",
  //     },
  //     {
  //       childtitle: "Teams",
  //       childlink: "teams",
  //       childicon: "mingcute:group-3-line",
  //     },
  //     {
  //       childtitle: "Complain",
  //       childlink: "complain",
  //       childicon: "hugeicons:complaint",
  //     },
  //     {
  //       childtitle: "Reference",
  //       childlink: "reference",
  //       childicon: "ic:outline-person",
  //     },

  //   ],
  // },

  // {
  //   title: "Chat",
  //   icon: "heroicons-outline:chat",
  //   link: "chat",
  // },

  {
    title: "Upgrade",
    icon: "majesticons:creditcard-line",
    link: "upgrade-plan",
  },
];

export const topMenuEmployee = [
  // {
  //   title: "Dashboard",
  //   icon: "heroicons-outline:home",
  //   link: "dashboard",
  // },


  {
    title: " Timesheet",
    icon: "tabler:report-analytics",
    link: "timesheet-report",
  },

  // {
  //   title: "Chat",
  //   icon: "heroicons-outline:chat",
  //   link: "chat",
  // },

  {
    title: "Manage",
    icon: "heroicons-outline:chip",
    link: "#",
    child: [
      {
        childtitle: "Teams",
        childlink: "teams",
        childicon: "mingcute:group-3-line",
      },
      // {
      //   childtitle: "Tasks",
      //   childlink: "tasks",
      //   childicon: "hugeicons:task-add-02",
      // },
      /*  {
         childtitle: "Analytics",
         childlink: "dashboard",
         childicon: "tabler:report-analytics",
       }, */

      // {
      //   childtitle: "Employees",
      //   childlink: "employees",
      //   childicon: "clarity:employee-group-line",
      // },

      /* {
        childtitle: "Leaves",
        childlink: "leaves",
        childicon: "fluent-mdl2:vacation",
      }, */

      /*  {
         childtitle: "Attendance",
         childlink: "attendance",
         childicon: "fluent:people-audience-20-regular",
       },
  */
      // {
      //   childtitle: "HR",
      //   childlink: "HR-contrl-desk",
      //   childicon: "ic:outline-person",
      // },
      /*  {
         childtitle: "Calendar",
         childicon: "heroicons-outline:calendar",
         childlink: "calendar",
       }, */
    ],
  },
  {
    title: "Settings",
    icon: "weui:setting-outlined",
    link: "settings",
  },
];

export const colors = {
  primary: "#4669FA",
  secondary: "#A0AEC0",
  danger: "#F1595C",
  black: "#111112",
  warning: "#FA916B",
  info: "#0CE7FA",
  light: "#425466",
  success: "#50C793",
  "gray-f7": "#F7F8FC",
  dark: "#1E293B",
  "dark-gray": "#0F172A",
  gray: "#68768A",
  gray2: "#EEF1F9",
  "dark-light": "#CBD5E1",
};

export const topFilterLists = [
  {
    name: "Inbox",
    value: "all",
    icon: "uil:image-v",
  },
  {
    name: "Starred",
    value: "fav",
    icon: "heroicons:star",
  },
  {
    name: "Sent",
    value: "sent",
    icon: "heroicons-outline:paper-airplane",
  },

  {
    name: "Drafts",
    value: "drafts",
    icon: "heroicons-outline:pencil-alt",
  },
  {
    name: "Spam",
    value: "spam",
    icon: "heroicons:information-circle",
  },
  {
    name: "Trash",
    value: "trash",
    icon: "heroicons:trash",
  },
];

export const bottomFilterLists = [
  {
    name: "personal",
    value: "personal",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Social",
    value: "social",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Promotions",
    value: "promotions",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Business",
    value: "business",
    icon: "heroicons:chevron-double-right",
  },
];
