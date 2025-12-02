import React, { useState, useEffect, useRef } from "react";
import { fetchAuthPost, fetchAuthPut, fetchAuthDelete } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { Icon } from "@iconify/react";
import { HexColorPicker } from "react-colorful";
import { useSelector } from "react-redux";

const defaultStatus = ["not_started_yet", "in_progress" , "completed" ,"pending" , "archive"]

const StatusManager = ({ projectId, baseUrl, statuses, setStatuses,setProjectData,refreshJourney }) => {
  const [editStatus, setEditStatus] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#000000" });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const [pickerSide, setPickerSide] = useState("right"); // right | left
  const [pickerVertical, setPickerVertical] = useState("below"); // below | above
  const userInfo = useSelector((state) => state.auth.user);
  const getClippingAncestor = (el) => {
    let node = el?.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      const overflowAll = `${style.overflow}${style.overflowX}${style.overflowY}`;
      if (/(hidden|auto|scroll)/.test(overflowAll)) return node;
      node = node.parentElement;
    }
    return window; // fallback to viewport
  };

  // Close color picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  // Decide which side to open the picker to avoid clipping by modal edges
  useEffect(() => {
    if (!showColorPicker) return;
    const REQUIRED_WIDTH_PX = 230; // approximate picker width incl. padding
    const REQUIRED_HEIGHT_PX = 280; // approximate picker height incl. input + padding

    const updatePlacement = () => {
      const anchor = colorPickerRef.current;
      if (!anchor) return;
      const container = getClippingAncestor(anchor);

      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container === window
        ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
        : container.getBoundingClientRect();

      const spaceRight = containerRect.right - anchorRect.right;
      const spaceLeft = anchorRect.left - containerRect.left;
      const spaceBelow = containerRect.bottom - anchorRect.bottom;
      const spaceAbove = anchorRect.top - containerRect.top;

      // Horizontal
      if (spaceRight >= REQUIRED_WIDTH_PX) setPickerSide("right");
      else if (spaceLeft >= REQUIRED_WIDTH_PX) setPickerSide("left");
      else setPickerSide(spaceRight >= spaceLeft ? "right" : "left");

      // Vertical
      if (spaceBelow >= REQUIRED_HEIGHT_PX) setPickerVertical("below");
      else if (spaceAbove >= REQUIRED_HEIGHT_PX) setPickerVertical("above");
      else setPickerVertical(spaceBelow >= spaceAbove ? "below" : "above");
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    return () => window.removeEventListener("resize", updatePlacement);
  }, [showColorPicker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editStatus) {
        // Edit
        const res = await fetchAuthPut(
          `${baseUrl}/api/projects/${projectId}/status/${editStatus.id}/update/?user=${userInfo._id}`,
          { body: JSON.stringify({ ...form, value: editStatus.value }) }
        );
        setStatuses(res.statuses);
        setProjectData(prev => ({ ...prev, status: res.statuses }));

      } else {
        // Add
        const res = await fetchAuthPost(
          `${baseUrl}/api/projects/${projectId}/status/add/?user=${userInfo._id}`,
          { body: JSON.stringify(form) }
        );
        setStatuses(res.status);
         setProjectData(prev => ({ ...prev, status: res.status }));
      }
      setEditStatus(null);
      setForm({ name: "", color: "#000000" });
      setShowColorPicker(false);
      refreshJourney();
    } catch (error) {
      // toast.error("Failed to save status");
    }
  };

  // Delete status
  const handleDelete = async (status) => {
    try {
      const res = await fetchAuthDelete(
        `${baseUrl}/api/projects/${projectId}/status/${status.id}/delete/?user=${userInfo._id}`
      );
      setStatuses(res.statuses);
      setProjectData(prev => ({ ...prev, status: res.statuses }));
      refreshJourney();
    } catch (error){
      // toast.error("Failed to delete status");
    }
  };

  // Open for edit
  const openEdit = (status) => {
    setEditStatus(status);
    setForm({ name: status.name, color: status.color });
    setShowColorPicker(false);
  };

  // Color for pill border/text
  const getPillStyle = (color) => {
    let border = color;
    let text = color;
    if (color.toLowerCase() === "#ffdddd" || color.toLowerCase() === "#ff0000" || color.toLowerCase().includes("red")) {
      border = "#ffdddd";
      text = "#e53935";
    } else if (color.toLowerCase() === "#d4f5e9" || color.toLowerCase() === "#4caf50" || color.toLowerCase().includes("green")) {
      border = "#d4f5e9";
      text = "#388e3c";
    } else if (color.toLowerCase() === "#fff4e5" || color.toLowerCase() === "#ff9800" || color.toLowerCase().includes("orange")) {
      border = "#fff4e5";
      text = "#f57c00";
    } else if (color.toLowerCase() === "#e3e3e3" || color.toLowerCase() === "#9e9e9e" || color.toLowerCase().includes("gray")) {
      border = "#e3e3e3";
      text = "#616161";
    } else if (color.toLowerCase() === "#e3f2fd" || color.toLowerCase() === "#2196f3" || color.toLowerCase().includes("blue")) {
      border = "#e3f2fd";
      text = "#1976d2";
    }
    return { borderColor: border, color: text, background: color + "20" };
  };

  const horizontalClass = pickerSide === "right" ? "left-full ml-2" : "right-full mr-2";
  const verticalClass = pickerVertical === "below" ? "top-full mt-2" : "bottom-full mb-2";

  const previewTextColor = getPillStyle(form.color).color;

  return (
    <div className="border border-neutral-50 dark:border-slate-700 rounded-lg p-3 bg-white flex flex-col gap-2 overflow-visible">
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => {
          const isDefault = defaultStatus.includes(status.value);
          return(
          <div
            key={status.id}
            className="flex items-center gap-1 px-3 py-1 rounded-md border text-sm font-medium bg-white"
            style={getPillStyle(status.color)}
          >
            <span className="font-medium" style={{ color: getPillStyle(status.color).color }}>{status.name}</span>
            {!isDefault && 
              <button
                className="ml-1 p-0.5 hover:bg-gray-100 rounded-full"
                onClick={() => openEdit(status)}
                type="button"
                tabIndex={-1}
              >
                <Icon icon="mdi:pencil-outline" className="w-4 h-4" style={{ color: getPillStyle(status.color).color }} />
              </button>
            }
            {
              !isDefault && 
              <button
                className="ml-1 p-0.5 hover:bg-gray-100 rounded-full"
                onClick={() => handleDelete(status)}
                type="button"
                tabIndex={-1}
              >
                <Icon icon="mdi:delete-outline" className="w-4 h-4" style={{ color: getPillStyle(status.color).color }} />
              </button>
            }
          </div>
        )})}
      </div>
      {/* Add/Edit Label pill */}
      <form className="flex items-center gap-2 mt-2" onSubmit={handleSubmit}>
        <div
          className="relative overflow-visible flex items-center px-3 py-1 rounded-md border bg-gray-50 text-gray-500 text-sm w-full max-w-xs"
          style={{ borderColor: form.color }}
        >
          <input
            type="text"
            placeholder="Add Label"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="flex-1 bg-transparent outline-none placeholder-gray-400 text-sm"
            style={{ minWidth: 0, color: previewTextColor }}
          />
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              className="ml-1 p-0.5 hover:bg-gray-100 rounded-full"
              onClick={() => setShowColorPicker((v) => !v)}
              tabIndex={-1}
            >
              <Icon icon="mdi:palette-outline" className="w-4 h-4" style={{ color: previewTextColor }} />
            </button>
            {showColorPicker && (
              <div className={`absolute ${horizontalClass} ${verticalClass} z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3`}>
                <HexColorPicker
                  color={form.color}
                  onChange={color => setForm({ ...form, color })}
                  className="w-32 h-32"
                />
                <input
                  className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="ml-2 text-gray-400 hover:text-blue-600 text-lg font-bold"
            tabIndex={-1}
          >
            <Icon icon={editStatus ? "mdi:check" : "mdi:plus"} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default StatusManager;