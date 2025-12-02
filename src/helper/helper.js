export const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
export const formatUTCTime = (utcTimeString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  const date = new Date(utcTimeString);
  const formattedDate = date.toLocaleString("en-US", {
    ...options,
    timeZone: "UTC",
  });

  const parts = formattedDate.match(/(\w+) (\d+), (\d+), (\d+:\d+ [AP]M)/);
  if (parts) {
    return `${parts[2]} ${parts[1].toUpperCase()} ${parts[3]}, ${parts[4]}`;
  }
  return formattedDate;
};
export const convertToLocalTime = (utcTimeString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  const date = new Date(utcTimeString);
  const formattedDate = date.toLocaleString("en-US", options);
  const parts = formattedDate.match(/(\w+) (\d+), (\d+), (\d+:\d+ [AP]M)/);
  if (parts) {
    return `${parts[2]} ${parts[1].toUpperCase()} ${parts[3]}, ${parts[4]}`;
  }
  return formattedDate;
};
// Input pulse get "Pulse"
export const capitalizeFirstLetter = (inputString) => {
  if (!inputString) return "";
  return inputString.charAt(0).toUpperCase() + inputString.slice(1);
};
// Get Intial letter of firstname, lastname and name
export const intialLetterName = (fullName, firstName, lastName, email) => {
  if (fullName) {
    if (firstName && lastName) {
      return `${firstName[0]?.toUpperCase()}${lastName[0]?.toUpperCase()}`;
    } else if (firstName && !lastName) {
      return `${firstName[0]?.toUpperCase()}`;
    } else if (!firstName && !lastName && fullName) {
      const nameArray = fullName.split(" ");
      if (nameArray.length === 2) {
        return `${nameArray[0][0]?.toUpperCase()}${nameArray[1][0]?.toUpperCase()}`;
      } else {
        return `${nameArray[0][0]?.toUpperCase()}`;
      }
    } else if (email) {
      return `${email[0]?.toUpperCase()}`;
    }
  }
  return '??';
};
export const truncateString = (str, num) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

// Greeting Function on the basis of local time.
export const Greeting = (hour) => {
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Evening";
  }
};

export const localtimeToUTC = (localtime) => {
  const date = new Date(localtime);
  const utcString = date.toISOString();
  return utcString.replace(/\.\d+Z$/, "Z");
};

// Jun 03, 2024, 12:07 PM GMT+5:30
export const formatUtcToLocal = (utcDateString) => {
  const date = new Date(utcDateString);
  const options = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  return formatter.format(date);
};

export const formatDate = (date) => {
  let d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  // Ensure month and day are two digits (e.g., '02' instead of '2')
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};
export const sendNotification = async (
  message,
  title,
  tag,
  userID,
  jsonData,
  url
) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${import.meta.env.VITE_APP_ONESIGNAL_REST_API_KEY}`,
  };

  const data = {
    app_id: import.meta.env.VITE_APP_ONESIGNAL_APP_ID,
    filters: [{ field: "tag", key: tag, relation: "=", value: userID }],
    data: jsonData,
    contents: { en: message },
    headings: { en: title },
    url: url, // Add the URL here
  };

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  return response.json();
};

export function formatDateWithTime(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()]; // Ensure monthNames is defined or accessible
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}-${month}-${year} , ${hours}:${minutes}`;
}

export function formatDateWithLocalTime(dateString) {
  const date = new Date(dateString); // This will treat the input as UTC because of the 'Z'

  const day = String(date.getUTCDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getUTCMonth()]; // Get UTC month
  const year = date.getUTCFullYear(); // Get UTC year

  const hours = String(date.getUTCHours()).padStart(2, "0"); // Get UTC hours
  const minutes = String(date.getUTCMinutes()).padStart(2, "0"); // Get UTC minutes

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
export function formatTime(dateString) {
  const date = new Date(dateString);
  const utcHours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const ampm = utcHours >= 12 ? "PM" : "AM";

  let hours = utcHours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, "0");

  return `${strHours}:${minutes}:${seconds} ${ampm}`;
}

export function formatDateWithMonthName(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "Jun",
    "Jul",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()]; // Ensure monthNames is defined or accessible
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
export function formatDateWithShortMonthName(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()]; // Ensure monthNames is defined or accessible
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export const formatLocalDateToDayMonth = (localDateString) => {
  const date = new Date(localDateString); // Keep the date as is
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

export const formatLocalTime = (localDateTimeString) => {
  const date = new Date(localDateTimeString); // Keep the date as is
  let hours = date.getUTCHours(); // Get UTC hours
  const minutes = date.getUTCMinutes(); // Get UTC minutes
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12; // Convert to 12-hour format
  hours = hours ? hours : 12; // Ensure '0' is converted to '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

export const NewformatDateTime = (startTime, endTime) => {
  const startFormattedDate = formatLocalDateToDayMonth(startTime);
  const startFormattedTime = formatLocalTime(startTime);
  const endFormattedTime = formatLocalTime(endTime);

  return `${startFormattedDate} ${startFormattedTime} - ${endFormattedTime}`;
};

// Usage example
// sendNotification('Your message', 'Your title', 'yourTag', 'externalId', { key: 'value' }, 'https://example.com')
//     .then(data => {
//     })
//     .catch(error => {
//         console.error('Error sending push notification:', error);
//     });

export const formatUTCDateToLocalDayMonth = (utcDateString) => {
  // Check if the input is a valid date string
  if (!utcDateString || isNaN(Date.parse(utcDateString))) {
    return null;
  }
  const date = new Date(utcDateString);
  // Ensure the date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

export const formatUTCToLocalTime = (dateTimeString) => {
  // Parse the input date-time string as a Date object
  const date = new Date(dateTimeString);

  // Get the local hours and minutes
  let hours = date.getHours();
  const minutes = date.getMinutes();

  // Determine AM or PM suffix
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Pad minutes with leading zero if needed
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  // Return the formatted time
  return `${hours}:${minutesStr} ${ampm}`;
};

// June 03, 2024, 12:07PM
export function formatToLocalTime(isoDateString) {
  const date = new Date(isoDateString);
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  };
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions).format(
    date
  );
  let formattedTime = new Intl.DateTimeFormat("en-US", timeOptions).format(
    date
  );

  formattedTime = formattedTime.replace(" AM", "AM").replace(" PM", "PM");

  return `${formattedDate}, ${formattedTime}`;
}

export function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateNumberOfDays(startDate, endDate) {
  // Parse the start and end dates to create Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in milliseconds
  const difference = end - start;

  // Convert the difference from milliseconds to days
  const days = difference / (1000 * 60 * 60 * 24);

  // Return the number of days
  return Math.round(days);
}

export function currentStatus(selectedStatus) {
  switch (selectedStatus) {
    case "Active":
      return "🟢";

    case "In a meeting":
      return "🗓️";

    case "Focusing":
      return "🎯";

    case "Commuting":
      return "🚎";

    case "Out sick":
      return "🤒";

    case "Working remotely":
      return "🏡";

    case "Away":
      return "🕒";

    case "Do not disturb":
      return "⛔";

    case "Out for Lunch":
      return "🍽️";

    case "Offline":
      return "📴";

    default:
      return "🟢";
  }
}

export const isRequired = (value, fieldName) => {
  if (!value) {
    return `${fieldName} is required.`;
  }
  return null;
};

export const isPhoneNumber = (value) => {
  const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;
  if (!phoneRegExp.test(value)) {
    return "Invalid phone number.";
  }
  return null;
};

export const isNumber = (value) => {
  if (isNaN(value)) {
    return "This field must be a number.";
  }
  return null;
};

export const isEmail = (value) => {
  const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegExp.test(value)) {
    return "Invalid email format.";
  }
  return null;
};

export function calculateDaysBetweenDates(startDate, endDate) {
  // Parse the start and end dates to create Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the difference in milliseconds
  const difference = end - start;

  // Convert the difference from milliseconds to days
  const days = difference / (1000 * 60 * 60 * 24);

  // Return the number of days
  return Math.abs(Math.round(days));
}

export async function createEvent(response, authInfo) {
  try {
    // const authInfo = JSON.parse(Cookies.get('calendarAuth_credentials'));
    const response = await postAPI(`api/calendar/create_event/`, {
      body: {
        summary: response.taskName,
        start_dateTime: response.dateCreated,
        end_dateTime: response.dueDate,
        credentials: authInfo,
      },
    });

    if (response.status === 1) {
      return response.status;
    } else {
      return response.error;
    }
  } catch (error) {
    return error.message;
  }
}

export function getGreetingWithDate(timezone = 'Asia/Kolkata') {
  let localTime;
  try {
    if (timezone && typeof timezone === 'string' && timezone.includes('/')) {
      localTime = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
    } else {
      localTime = new Date();
    }
  } catch (e) {
    localTime = new Date();
  }

  const hour = localTime.getHours();
  let greeting;
  if (hour >= 5 && hour < 12) {
    greeting = 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  const formattedDate = localTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return { greeting, formattedDate };
}

export const capitalizeName = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

// Format date to "dd mmm yyyy" format (e.g., "1 Jan, 2025")
export const formatDateToDayMonthYear = (dateString) => {
  if (!dateString || isNaN(Date.parse(dateString))) {
    return '';
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  
  return `${day} ${month}, ${year}`;
};

// Generate initials with background color for avatar
export const generateInitialsAvatar = (name) => {
  if (!name) return { initials: "U", bgColor: "bg-blue-500" };

  // Get initials from name
  const nameArray = name.trim().split(" ");
  let initials = "";

  if (nameArray.length >= 2) {
    initials = `${nameArray[0][0]?.toUpperCase()}${nameArray[1][0]?.toUpperCase()}`;
  } else {
    initials = nameArray[0][0]?.toUpperCase() || "U";
  }

  // Color mapping based on first letter
  const colorMap = {
    A: "bg-red-500",
    B: "bg-blue-500",
    C: "bg-green-500",
    D: "bg-yellow-500",
    E: "bg-purple-500",
    F: "bg-pink-500",
    G: "bg-indigo-500",
    H: "bg-teal-500",
    I: "bg-orange-500",
    J: "bg-cyan-500",
    K: "bg-emerald-500",
    L: "bg-violet-500",
    M: "bg-rose-500",
    N: "bg-sky-500",
    O: "bg-lime-500",
    P: "bg-amber-500",
    Q: "bg-fuchsia-500",
    R: "bg-slate-500",
    S: "bg-stone-500",
    T: "bg-zinc-500",
    U: "bg-neutral-500",
    V: "bg-red-600",
    W: "bg-blue-600",
    X: "bg-green-600",
    Y: "bg-yellow-600",
    Z: "bg-purple-600",
  };

  const firstLetter = initials[0]?.toUpperCase();
  const bgColor = colorMap[firstLetter] || "bg-blue-500";

  return { initials, bgColor };
};
