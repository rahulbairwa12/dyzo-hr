// ------------------------------------------------------------------
// statusHelper.js
// ------------------------------------------------------------------

import { ref, onValue, off } from "firebase/database";
import database from "@/firebase/index"; // adjust to your firebase setup
import { fetchPOST } from "@/store/api/apiSlice"; // or your own fetch method
import { djangoBaseURL } from "@/helper"; // adjust as needed

/**
 * 1) A mapping of final statuses (Active, Away, etc.)
 *    to their respective emoji, color class, and text label.
 */
export const statusMapping = {
  Active: { emoji: "🟢", color: "bg-green-400", text: "Active" },
  Away: { emoji: "🕒", color: "bg-yellow-400", text: "Away" },
  "Do not disturb": { emoji: "⛔", color: "bg-red-500", text: "Do not disturb" },
  "In a meeting": { emoji: "📅", color: "bg-blue-500", text: "In a meeting" },
  "Out sick": { emoji: "🤒", color: "bg-pink-500", text: "Out sick" },
  Commuting: { emoji: "🚗", color: "bg-blue-300", text: "Commuting" },
  "On leave": { emoji: "🌴", color: "bg-purple-500", text: "On leave" },
  Focusing: { emoji: "🔕", color: "bg-gray-500", text: "Focusing" },
  "Working remotely": { emoji: "🏠", color: "bg-blue-400", text: "Working remotely" },
  Offline: { emoji: "📴", color: "bg-gray-300", text: "Offline" },
  "Out for Lunch": { emoji: "🍽️", color: "bg-yellow-300", text: "Out for Lunch" },
};

/**
 * 2) Helper: check if a timestamp (string) is "today".
 */
function isToday(timestamp) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * 3) Combine "manual" status from Django with "latestLog" from Firebase
 *    to derive a final "live" status string, e.g. "Active", "Away", "Offline", etc.
 */
export function getLiveStatus(employee = {}) {
  // Manual statuses that user can set themselves
  const manualStatuses = [
    "On leave",
    "Out for Lunch",
    "Commuting",
    "Working remotely",
    "In a meeting",
    "Do not disturb",
    "Focusing",
    "Out sick",
  ];

  const manualStatus = employee?.status; // from Django (or your DB)
  const latestLog = employee?.latestLog; // from Firebase
  const logStatus = latestLog?.status;   // boolean
  const logTimestamp = latestLog?.timestamp;

  // 1) If actively tracking
  if (logStatus === true) {
    return "Active";
  }

  // 2) Else if there's a recognized manual status
  if (manualStatus && manualStatuses.includes(manualStatus)) {
    return manualStatus;
  }

  // 3) If not active, check if they've worked today => "Away" or "Offline"
  if (logStatus === false) {
    return isToday(logTimestamp) ? "Away" : "Offline";
  }

  // 4) Default
  return "Offline";
}

/**
 * 4) Fetch "live reporting" from Django (or your backend).
 *    Adjust the URL/fetch method as needed. Returns an array of employees.
 */
export async function fetchDjangoData(companyId) {
  try {
    const res = await fetchPOST(`${djangoBaseURL}/api/company/${companyId}/live/reporting/employees/`);
    // The response is typically { status: 1, data: [ ... ] }
    // Adjust to your structure if needed:
    if (res?.data) {
      return res.data; // e.g. array of employee objects
    }
    return [];
  } catch (error) {
    console.error("Error fetching Django data:", error);
    return [];
  }
}

/**
 * Simple debounce function to limit frequent updates
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * 5) Watch Firebase logs in real-time with debouncing to prevent excessive updates.
 *    Returns an unsubscribe function so you can stop listening when component unmounts.
 */
/* export function watchFirebaseLogs(companyId, setFirebaseLogs) {
  console.log("watchFirebaseLogs")
  const logsRef = ref(database, `taskLogs/${companyId}`);
  
  // Create a debounced update function (500ms delay)
  const debouncedUpdate = debounce((data) => {
    setFirebaseLogs(data);
  }, 5000);
  
  const listener = onValue(
    logsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        // Use debounced update instead of direct update
        debouncedUpdate(snapshot.val());
      } else {
        debouncedUpdate({});
      }
    },
    (error) => {
      console.error("Firebase error:", error);
    }
  );
  
  // Return unsub so you can call it in cleanup
  return () => {
    off(logsRef, "value", listener);
  };
} */

/**
 * 6) Merge an employee with the data from Django & Firebase logs.
 *    - We match by user ID (emp._id).
 *    - We find manual status from the Django array (which might have "status", "start_time", etc.)
 *    - We find latestLog from firebaseData.
 *    - Return a combined object that includes "status" and "latestLog".
 */
export function combineEmployeeData(emp, djangoData, firebaseData) {
  if (!emp) return null;
  // Find the matching Django record
  const djangoEmp = djangoData.find((d) => d.id === emp._id);
  // Find the matching Firebase log
  const fireLog = firebaseData?.[emp._id]?.latestLog || null;

  return {
    ...emp,
    // If your "users" array already has a "status" field, decide which to prefer:
    // We'll take from Django if available, else fallback to emp.status
    status: djangoEmp?.status || emp.status,
    // Attach the firebase log info
    latestLog: fireLog,
  };
}
