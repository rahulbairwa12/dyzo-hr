import React, { useState, useEffect } from "react";
import moment from "moment";
import { djangoBaseURL } from "@/helper";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react"; // Ensure you have installed and imported this icon library
import { fetchAuthPost } from "@/store/api/apiSlice";

const EditAttendanceModal = ({ isOpen, onClose, attendanceLog, mode, type, onSave }) => {
  const userInfo = useSelector((state) => state.auth.user);

  // Initial state for the form.
  const [formData, setFormData] = useState({
    date: "",
    timestamp: "",
    checkin_lat_coordinates: "",
    checkin_long_coordinates: "",
    checkout_lat_coordinates: "",
    checkout_long_coordinates: "",
    checkin_address: "",
    checkout_address: "",
    distance: "",
    log_number: 1,
    status: type, // "checkin" or "checkout"
    company: "",
    employee: "",
  });

  // State to toggle advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false);

  // When the modal opens, pre-fill the form.
  useEffect(() => {
    if (attendanceLog) {
      // Determine the correct timestamp property based on type
      const logTime =
        type === "checkin"
          ? attendanceLog.checkin_timestamp
          : attendanceLog.checkout_timestamp;

      const localTime = logTime
        ? moment.utc(logTime).local().format("YYYY-MM-DDTHH:mm")
        : moment().format("YYYY-MM-DDTHH:mm");

      // Format the time to 12-hour AM/PM format for the time input field
      const formattedTime = logTime
        ? moment.utc(logTime).local().format("hh:mm A")
        : moment().format("hh:mm A");

      // Use the provided date from the cell or fallback to today's date.
      const localDate = attendanceLog.date
        ? moment(attendanceLog.date).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");

      setFormData({
        date: localDate,
        timestamp: formattedTime, // use the 12-hour formatted time here
        checkin_lat_coordinates: attendanceLog.checkin_lat_coordinates || "",
        checkin_long_coordinates: attendanceLog.checkin_long_coordinates || "",
        checkout_lat_coordinates: attendanceLog.checkout_lat_coordinates || "",
        checkout_long_coordinates: attendanceLog.checkout_long_coordinates || "",
        checkin_address: attendanceLog.checkin_address || "",
        checkout_address: attendanceLog.checkout_address || "",
        distance: attendanceLog.distance || "",
        log_number: attendanceLog.log_number || 1,
        status: attendanceLog.status || type,
        company: userInfo.companyId,
        employee: attendanceLog.employee || "",
        id: attendanceLog.id || undefined,
      });
    } else {
      // For create mode, pre-fill with current date and time.
      setFormData({
        date: moment().format("YYYY-MM-DD"),
        timestamp: moment().format("hh:mm A"), // 12-hour format
        checkin_lat_coordinates: "",
        checkin_long_coordinates: "",
        checkout_lat_coordinates: "",
        checkout_long_coordinates: "",
        checkin_address: "",
        checkout_address: "",
        distance: "",
        log_number: 1,
        status: type,
        company: userInfo.companyId,
        employee: "",
      });
    }
  }, [attendanceLog, type, userInfo.companyId]);

  // Update formData on input change.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // When saving, combine date and time then convert to UTC before sending.
  const handleSave = async () => {
    try {
      // Combine the date and time inputs to form the complete datetime.
      const combinedDateTime = moment(
        `${formData.date} ${formData.timestamp}`,
        "YYYY-MM-DD hh:mm A"
      )
        .utc()
        .format("YYYY-MM-DDTHH:mm");

      const payload = {
        ...formData,
        timestamp: combinedDateTime, // Now contains the proper date and time
      };

      const baseURL = djangoBaseURL || "";
      const response = await fetchAuthPost(`${baseURL}/api/company/attendance-log/`, { body: payload });
      onSave(); // callback to refresh parent data
      onClose();
    } catch (error) {
      console.error("Error saving attendance log:", error);
      // Optionally show an error message here.
    }
  };

  if (!isOpen) return null;

  // Determine if current user is "self" or an admin (for advanced settings toggle).
  const isSelf = userInfo && formData.employee && userInfo._id === formData.employee;
  const isAdmin = userInfo && userInfo.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl relative z-10 max-w-lg w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {mode === "edit" ? "Edit" : "Add"} {type === "checkin" ? "Check-In" : "Check-Out"}
        </h3>
        <div className="space-y-4">
          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          {/* Time Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time
            </label>
            <input
              type="text"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="hh:mm AM/PM"
            />
          </div>

          {/* Advanced Settings Toggle (shown for admin) */}
          {(userInfo.isAdmin) && (
            <div className="w-[150px] mt-4">
              <label
                className="form-label flex items-center text-blue-600 cursor-pointer select-none"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                Advanced Setting{" "}
                {showAdvanced ? (
                  <Icon icon="eva:arrow-down-fill" className="text-xl text-blue-600" />
                ) : (
                  <Icon icon="eva:arrow-right-fill" className="text-xl text-blue-600" />
                )}
              </label>
            </div>
          )}

          {/* Advanced Fields */}
          {showAdvanced && (
            <>
              {type === "checkin" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-In Latitude
                    </label>
                    <input
                      type="text"
                      name="checkin_lat_coordinates"
                      value={formData.checkin_lat_coordinates}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-In Longitude
                    </label>
                    <input
                      type="text"
                      name="checkin_long_coordinates"
                      value={formData.checkin_long_coordinates}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-In Address
                    </label>
                    <textarea
                      name="checkin_address"
                      value={formData.checkin_address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    ></textarea>
                  </div>
                </>
              )}
              {type === "checkout" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-Out Latitude
                    </label>
                    <input
                      type="text"
                      name="checkout_lat_coordinates"
                      value={formData.checkout_lat_coordinates}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-Out Longitude
                    </label>
                    <input
                      type="text"
                      name="checkout_long_coordinates"
                      value={formData.checkout_long_coordinates}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Check-Out Address
                    </label>
                    <textarea
                      name="checkout_address"
                      value={formData.checkout_address}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    ></textarea>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distance (meters)
                </label>
                <input
                  type="text"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </>
          )}
        </div>
        {/* Footer Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
