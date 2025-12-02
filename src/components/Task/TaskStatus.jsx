import { useState, useRef, useEffect } from "react"
import Select from "react-select"
import { Icon } from "@iconify/react"
import { HexColorPicker } from "react-colorful"
import { fetchAuthPost, fetchAuthPut, fetchAuthDelete } from "@/store/api/apiSlice"
import { toast } from "react-toastify"
import { djangoBaseURL } from "@/helper"
import { useSelector } from "react-redux"

const CustomSingleValue = ({ data }) => (
  <div className="flex items-center gap-2 justify-start">
    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
    {data.label}
  </div>
)

const CustomOption = (props) => {
  const { data, innerRef, innerProps } = props
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-customGray-200 cursor-pointer dark:text-white bg-white dark:bg-customBlack-200"
    >
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></span>
      {data.label}
    </div>
  )
}

export default function TaskStatus({ task, updateTaskDetails, from }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [taskStatuses, setTaskStatuses] = useState(task?.project_status || [])
  const dropdownRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [editStatus, setEditStatus] = useState(null)
  const [form, setForm] = useState({ name: "", color: "#76dfff" })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const inputRef = useRef(null)
  const selectRef = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const userInfo = useSelector((state) => state.auth.user);
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [permissionError, setPermissionError] = useState("")

  const showPermissionError = (action) => {
    setPermissionError(`You don't have permission to ${action} status. Please contact your TL and Admin.`)
    setShowPermissionModal(true)
  }

  const toggleDropdown = () => setIsOpen(!isOpen)
  const statusOptions =
    taskStatuses.map((status) => ({
      value: status.value,
      label: status.name,
      color: status.color,
      id: status.id,
    })) || []

  const handleStatusSelect = async (selectedOption) => {
    if (selectedOption.value === "add_status") {
      if (!userInfo?.permissions?.permissions?.Project?.Status) {
        showPermissionError("add")
        return
      }
      openAdd()
      return
    } else if (selectedOption.action === "edit") {
      if (!userInfo?.permissions?.permissions?.Project?.Status) {
        showPermissionError("edit")
        return
      }
      openEdit(selectedOption.status)
      return
    } else if (selectedOption.action === "delete") {
      if (!userInfo?.permissions?.permissions?.Project?.Status) {
        showPermissionError("delete")
        return
      }
      handleDelete(selectedOption.status)
      return
    }

    setMenuIsOpen(false);

    const statusValue = selectedOption.value
    const selectedStatusOption = statusOptions.find((option) => option.value === statusValue)

    if (from === "taskrow") {
      const updatedTask = { ...task, taskPosition: statusValue }
      if (selectedStatusOption) updatedTask.color = selectedStatusOption.color
      setSelectedStatus(selectedStatusOption)
      await updateTaskDetails(updatedTask, "taskPosition")
    } else {
      if (selectedStatusOption) {
        setSelectedStatus(selectedStatusOption)
      }
      await updateTaskDetails(statusValue, "taskPosition")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userInfo?.permissions?.permissions?.Project?.Status) {
      showPermissionError("add")
      return
    }

    const projectId = task?.projectId
    if (!projectId) {
      console.error("Project ID is not available.")
      return
    }

    if (editStatus) {
      try {
        const res = await fetchAuthPut(`${djangoBaseURL}/api/projects/${projectId}/status/${editStatus.id}/update/`, {
          body: JSON.stringify({ ...form, value: editStatus.value }),
        })
        toast.success(res.message)
        if (res.statuses) {
          setTaskStatuses(res.statuses)
          const updatedSelectedStatus = res.statuses.find((status) => status.id === editStatus.id)
          if (selectedStatus?.id === editStatus.id && updatedSelectedStatus) {
            setSelectedStatus({
              value: updatedSelectedStatus.value,
              label: updatedSelectedStatus.name,
              color: updatedSelectedStatus.color,
              id: updatedSelectedStatus.id,
            })
          }
        }
        // Refresh page after successful edit
        window.location.reload()
      } catch (error) {
        toast.error("Failed to update status.")
        console.error("Error updating status:", error)
      }
    } else {
      try {
        const res = await fetchAuthPost(`${djangoBaseURL}/api/projects/${projectId}/status/add/`, {
          body: JSON.stringify(form),
        })
        toast.success("Status added")
        if (res.status) {
          const newStatus = {
            value: res.status.value,
            label: res.status.name,
            color: res.status.color,
            id: res.status.id,
          }
          setTaskStatuses((prev) => [...prev, newStatus])
        }
        // Refresh page after successful add
        window.location.reload()
      } catch (error) {
        toast.error("Failed to add status.")
        console.error("Error adding status:", error)
      }
    }
    setShowForm(false)
    setEditStatus(null)
    setForm({ name: "", color: "#76dfff" })
    setShowColorPicker(false)
    setMenuIsOpen(false)
  }

  const handleDelete = async (status) => {
    if (!userInfo?.permissions?.permissions?.Project?.Status) {
      showPermissionError("delete")
      return
    }

    const projectId = task?.projectId
    if (!projectId) {
      console.error("Project ID is not available.")
      return
    }

    try {
      const res = await fetchAuthDelete(`${djangoBaseURL}/api/projects/${projectId}/status/${status.id}/delete/`)
      toast.success(res.message)
      if (res.statuses) {
        setTaskStatuses(res.statuses)
        if (selectedStatus?.id === status.id) {
          setSelectedStatus(null)
        }
      }
      // Refresh page after successful delete
      window.location.reload()
    } catch (error) {
      toast.error("Failed to delete status.")
      console.error("Error deleting status:", error)
    }
  }

  const openEdit = (status) => {
    setEditStatus(status)
    setForm({ name: status.label, color: status.color })
    setShowForm(true)
    setMenuIsOpen(true) // Keep menu open
    // Focus input after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const openAdd = () => {
    if (!userInfo?.permissions?.permissions?.Project?.Status) {
      showPermissionError("add")
      return
    }
    setEditStatus(null)
    setForm({ name: "", color: "#76dfff" })
    setShowForm(true)
    setMenuIsOpen(true) // Keep menu open
    // Focus input after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditStatus(null)
    setForm({ name: "", color: "#76dfff" })
    setShowColorPicker(false)
    setMenuIsOpen(false) // Close menu when form closes
  }

  // Handle input events properly
  const handleInputChange = (e) => {
    e.stopPropagation()
    setForm({ ...form, name: e.target.value })
  }

  const handleInputClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleInputKeyDown = (e) => {
    e.stopPropagation()
    if (e.key === "Enter") {
      handleSubmit(e)
    } else if (e.key === "Escape") {
      handleFormClose()
    }
  }

  useEffect(() => {
    setTaskStatuses(task?.project_status || [])
  }, [task?.project_status])

  useEffect(() => {
    const currentStatus = task?.taskStatus || task?.taskPosition
    if (currentStatus && taskStatuses?.length > 0) {
      const initialSelected = statusOptions.find((item) => item.value === currentStatus)
      setSelectedStatus(initialSelected || null)
    } else if (taskStatuses?.length > 0) {
      setSelectedStatus(statusOptions[0] || null)
    } else {
      setSelectedStatus(null)
    }

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowForm(false)
        setShowColorPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [task, taskStatuses])

  const CustomMenuList = (props) => {
    const { options, innerRef, selectProps } = props

    return (
      <div ref={innerRef}>
        {options.map((option, index) =>
          selectProps.components.Option({
            ...props,
            data: option,
            options: options,
            innerRef: undefined,
            innerProps: {
              ...props.innerProps,
              key: `option-${index}`,
              onClick: () => handleStatusSelect(option),
            },
            isFocused: props.isFocused,
            isSelected: props.isSelected,
            isEditing: editStatus?.id === option.id,
          }),
        )}

        {showForm && (
          <div
            className="p-2 px-3 bg-[#FFFBEA] border-t border-gray-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded border-none"
                  style={{ background: form.color }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowColorPicker((v) => !v)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* <Icon icon="mdi:label-outline" color="#fff" /> */}
                </button>
                {showColorPicker && (
                  <div
                    className="absolute z-[9999] -top-64 left-0 shadow-lg rounded-lg bg-white"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <HexColorPicker color={form.color} onChange={(color) => setForm({ ...form, color })} />
                    <input
                      className="border rounded-b-lg px-2 py-1 w-full text-gray-800"
                      value={form.color}
                      onChange={(e) => {
                        e.stopPropagation()
                        setForm({ ...form, color: e.target.value })
                      }}
                      onClick={handleInputClick}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                name="name"
                placeholder={editStatus ? "Edit status" : "Add status"}
                value={form.name}
                onChange={handleInputChange}
                onClick={handleInputClick}
                onKeyDown={handleInputKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                required
                className="flex-1 border border-gray-300 rounded px-2 py-[3px] outline-none bg-white text-gray-800 placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                style={{ minWidth: "90px" }}
                autoFocus
              />
              <button
                type="submit"
                className="p-1 text-blue-600 text-sm hover:bg-blue-50 rounded border-none bg-transparent cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {editStatus ? "Save" : "Add"}
              </button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFormClose()
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Icon icon="mdi:close" />
              </button>
            </form>
          </div>
        )}

        {!showForm && (
          <div
            className="flex items-center justify-center rounded border border-gray-300 px-3 py-2 bg-[#F5F5F5] text-blue-600 text-sm cursor-pointer m-2 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              openAdd()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <Icon icon="mdi:plus" />
            <span className="ml-1">New label</span>
          </div>
        )}
      </div>
    )
  }

  const CustomOptionWithActions = (props) => {
    const { data, innerRef, innerProps, isEditing } = props
    const [isHovered, setIsHovered] = useState(false)
    const hasPermission = userInfo?.permissions?.permissions?.Project?.Status

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-customGray-200 cursor-pointer dark:text-white bg-white dark:bg-customBlack-200 ${isEditing ? "bg-[#FFFBEA] dark:bg-customGray-200" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2 flex-grow">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }}></span>
          <span className="truncate">{data.label}</span>
        </div>
        {(isHovered || isEditing) && data.value !== selectedStatus?.value && !showForm && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              className="hover:bg-white/20 rounded p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white border-none bg-transparent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (!hasPermission) {
                  showPermissionError("edit")
                  return
                }
                openEdit(data)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <Icon icon="mdi:pencil-outline" width="16" height="16" />
            </button>
            <button
              className="hover:bg-white/20 rounded p-1 text-red-600 hover:text-red-900 dark:text-red-300 dark:hover:text-red-500 border-none bg-transparent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (!hasPermission) {
                  showPermissionError("delete")
                  return
                }
                handleDelete(data)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <Icon icon="mdi:delete-outline" width="16" height="16" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    task && (
      <>
        <div ref={dropdownRef}>
          <Select
            ref={selectRef}
            options={statusOptions}
            value={selectedStatus}
            onChange={(selectedOption) => handleStatusSelect(selectedOption)}
            getOptionLabel={(e) => (
              <div className="flex items-center gap-2 justify-center">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }}></span>
                {e.label}
              </div>
            )}
                          components={{
                SingleValue: CustomSingleValue,
                Option: CustomOptionWithActions,
                MenuList: CustomMenuList,
                DropdownIndicator: ({ selectProps }) => (
                  <div className="flex items-center pr-2">
                    <Icon
                      icon="heroicons-outline:chevron-down"
                      className={`transition-transform duration-200 w-4 h-4 text-gray-500 ${selectProps.menuIsOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                ),
              }}
            className={`text-sm font-semibold custom-react-select  ${from === "taskrow" ? 'w-50':'w-56'}`}
            isSearchable={false}
            classNamePrefix="custom-select"
            menuIsOpen={menuIsOpen || showForm}
            onMenuOpen={() => setMenuIsOpen(true)}
            onMenuClose={() => {
              if (!showForm) {
                setMenuIsOpen(false)
              }
            }}
            styles={{
              control: (base) => ({
                ...base,
                border: "none",
                boxShadow: "none",
                backgroundColor: "transparent",
                display: "flex",
                justifyContent: from === "taskrow" ? "start" : "center",
                minHeight: "auto",
                cursor: "pointer",
              }),
              valueContainer: (base) => ({
                ...base,
                padding: from === "taskrow" ? "0 4px" : "0",
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }),
              indicatorSeparator: () => ({
                display: "none",
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: "gray",
                padding: from === "taskrow" ? "0 8px 0 0" : "0 8px",
              }),
              menuList: (provided) => ({
                ...provided,
                maxHeight: "500px",
                overflowY: "auto",
                padding: 0,
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isFocused ? "rgba(0, 0, 0, 0.05)" : "white",
                color: "black",
                padding: "8px 12px",
                alignItems: "center",
                cursor: "pointer",
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999,
              }),
            }}
          />
        </div>

        {/* Permission Error Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPermissionModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon icon="mdi:shield-alert" width="18" height="18" className="text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-sm">Access Denied</h3>
                  </div>
                  <button
                    onClick={() => setShowPermissionModal(false)}
                    className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
                  >
                    <Icon icon="mdi:close" width="16" height="16" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{permissionError}</p>

                {/* Action Button */}
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  )
}
