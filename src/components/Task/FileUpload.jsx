import { useState, useRef, useEffect } from "react"
import { fetchAuthPatch, fetchAuthPatchSumit, fetchAuthPost, fetchAuthPut, uploadtoS3 } from "@/store/api/apiSlice"
import { Icon } from "@iconify/react"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { fetchTaskAttachments, updateRecurringTaskInState } from "@/features/tasks/store/tasksSlice"
import { fetchSectionTaskAttachments } from "@/features/section-task/store/sectionTaskSlice"

const FileUpload = ({ taskId, index, from, task, fetchAttachments, totalAttachments, updateTaskAttachmentCount, isRecurring = false, updateAttachments = null, setIsUploading = null, isSectionTask = false }) => {
  const fileRef = useRef(null)
  const [isUpload, setIsUpload] = useState(false)
  const [isFileClicked, setIsFileClicked] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const userInfo = useSelector((state) => state.auth.user)
  const MAX_FILE_SIZE_MB = 15
  const djangoBaseURL = import.meta.env.VITE_APP_DJANGO
  const dispatch = useDispatch()


  useEffect(() => {
    if (updateTaskAttachmentCount) {
      updateTaskAttachmentCount(taskId, totalAttachments);
    }
  }, [totalAttachments, taskId, updateTaskAttachmentCount]);

  function shortenFilename(filename, maxLength = 25) {
    if (!filename) return
    const extIndex = filename.lastIndexOf(".")
    if (extIndex === -1) return filename

    const name = filename.slice(0, extIndex)
    const ext = filename.slice(extIndex)

    // If it's already short enough, return as-is
    if (filename.length <= maxLength) return filename

    const start = name.slice(0, 15)
    const end = name.slice(-5)

    return `${start}...${end}${ext}`
  }

  const handleFileSelect = (event) => {
    const filesArray = Array.from(event.target.files)
    setIsFileClicked(true)

    // Filter out files larger than MAX_FILE_SIZE_MB
    const validFiles = []
    const errorFiles = []

    filesArray.forEach((file) => {
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        errorFiles.push({
          error: `${shortenFilename(file.name)} exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        })
      } else {
        validFiles.push(file)
      }
    })

    // Show toast for errors if any files were rejected
    if (errorFiles.length > 0) {
      errorFiles.forEach(({ error }) => {
        toast.error(error)
      })
    }

    // Only proceed with upload if there are valid files
    if (validFiles.length > 0) {
      setTotalFiles(validFiles.length)
      setCurrentFileIndex(0)

      if (from === "taskrow") {
        // uploadFilesViaTaskRow(validFiles)
      } else if (from === "taskpanel" || from === "taskpanelTop") {
        uploadFiles(validFiles)
      }
    } else {
      // Reset states if there are no valid files to upload
      setIsFileClicked(false)
      setIsUpload(false)
    }
  }

  const getFileCategory = (file) => {
    const mime = file.type
    if (mime.startsWith("image/")) return "image"
    if (mime === "application/pdf") return "pdf"
    if (
      mime.includes("csv") ||
      mime.includes("excel") ||
      mime.includes("spreadsheet") ||
      file.name.match(/\.(xls|xlsx|csv)$/i)
    )
      return "document"
    if (mime.startsWith("video/")) return "video"
    return "file"
  }

  const getTimestampedFilename = (originalName) => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
    const dot = originalName.lastIndexOf(".");
    if (dot === -1) return `${originalName}_${timestamp}`;
      return `${originalName.slice(0, dot)}_${timestamp}${originalName.slice(dot)}`;
  };

  const uploadFiles = async (files) => {
    try {
      setIsUpload(true)
      setIsFileClicked(true)
      
      // Notify parent component about upload start
      if (setIsUploading && typeof setIsUploading === 'function') {
        setIsUploading(true)
      }

      const attachments = []
      let successfulUploads = 0

      // Initialize progress tracking
      setUploadProgress({ 0: 0 })

      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i)
        const file = files[i]

        try {
          const uploadUrl = "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments"
          const companyId = userInfo?.companyId
          const userId = userInfo?._id
          const taskId = task?.taskId
          const folder = "attachments"
          // const fileName = `${file.name}_${new Date().toISOString().replace(/[-:.TZ]/g, "")}`
          const fileName = getTimestampedFilename(file.name)

          // Reset progress for current file
          setUploadProgress({ [i]: 0 })

          // Upload to S3 with progress tracking
          const uploadedUrl = await uploadtoS3(
            uploadUrl,
            companyId,
            userId,
            taskId,
            folder,
            fileName,
            file,
            (progress) => {
              // Update progress for current file only
              setUploadProgress({ [i]: progress })
            },
          )

          attachments.push({
            url: uploadedUrl,
            type: getFileCategory(file),
            name: file.name,
            folder: "attachments"
          })

          successfulUploads++

          // Show 100% for completed file
          setUploadProgress({ [i]: 100 })

          // Small delay to show 100% completion before moving to next file
          await new Promise((resolve) => setTimeout(resolve, 300))
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
          toast.error(`Failed to upload ${shortenFilename(file.name)}`)
        }
      }
      
      // Safely check if this is a new recurring task by checking string ID
      if(isRecurring && 
         ((typeof task._id === 'string' && task._id.startsWith("new-recurring-")) || 
          (typeof task.id === 'string' && task.id.startsWith("new-recurring-")))) {
        const newAttachments = [...(task.attachments || []), ...attachments];
        dispatch(updateRecurringTaskInState({
          _id: task._id || task.id,
          id: task.id,
          attachments: newAttachments
        }));
        if (updateAttachments && typeof updateAttachments === 'function') {
          updateAttachments(newAttachments);
        }
        return;
      }
      // Submit to Django if there's any valid attachment
      if (attachments.length > 0) {
        let response;
        if (isRecurring) {
           response = await fetchAuthPatchSumit(`${djangoBaseURL}/api/recurring-tasks/${task._id}/attachments/`, {
            body: JSON.stringify({ add_attachments: attachments }),
            contentType: "application/json"  // This is crucial - our fetchAuthPatch uses this property
          })
        } else {
            response = await fetchAuthPost(`${djangoBaseURL}/api/task/${task.taskId}/attachments/`, {
            body: JSON.stringify({ attachments }),
          })
        }
         
        if (response.status) {
          toast.success("Attachments uploaded successfully")
          if (isRecurring) {
            // Update Redux state
            dispatch(updateRecurringTaskInState({
              _id: task._id || task.id,
              id: task.id,
              attachments: response?.attachments
            }));
            
            // Update parent component's local state if callback exists
            if (updateAttachments && typeof updateAttachments === 'function') {

              updateAttachments(response?.attachments);
            }
          } else {
            // Check if this is a section task
            if (isSectionTask) {
              dispatch(fetchSectionTaskAttachments(taskId))
            } else {
              dispatch(fetchTaskAttachments(taskId))
            }
          }
        }
      }
    } catch (error) {
      console.error("Error uploading files or sending attachments:", error)
      toast.error("Upload process failed")
    } finally {
      setIsUpload(false)
      setIsFileClicked(false)
      
      // Notify parent component that upload is complete
      if (setIsUploading && typeof setIsUploading === 'function') {
        setIsUploading(false)
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress({})
        setCurrentFileIndex(0)
        setTotalFiles(0)
      }, 1000)
    }
  }

  return (
    <div>
      <input
        type="file"
        className="hidden"
        ref={fileRef}
        onChange={handleFileSelect}
        multiple={true}
        accept="image/*,application/pdf,.csv,.xls,.xlsx,video/*"
      />

      {/* Display upload progress */}
      {from !== "taskpanelTop" && isUpload && totalFiles > 0 && (
        <div className="mt-2 mb-2 space-y-2">
          <div className="w-full">
            <div className="text-xs text-gray-500">
              {currentFileIndex + 1}/{totalFiles} Uploading... ({uploadProgress[currentFileIndex] || 0}%)
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{
                  width: `${uploadProgress[currentFileIndex] || 0}%`,
                  transition: "width 0.3s ease-in-out",
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Display file count and upload button */}
      <div className="preview flex flex-wrap gap-2 items-center">
        {from === "taskpanelTop" ? (
          <div className="relative">
            {/* {totalAttachments > 0 && (
              <div className="absolute -top-3 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalAttachments}
              </div>
            )} */}
            <span
              onClick={() => !isUpload && fileRef.current.click()}
              className={`cursor-pointer rounded border-1 inline-flex p-1.5 bg-gray-200 dark:bg-slate-700 ${isUpload ? "opacity-50" : ""}`}
              title="Upload files (max 15MB each)"
            >
              {isUpload ? (
                <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin text-blue-500" />
              ) : !isFileClicked ? (
                <Icon icon="entypo:attachment" className="w-4 h-4" />
              ) : (
                <span className="fileblink text-f48">
                  <Icon icon="carbon:dot-mark" className="w-4 h-4" />
                </span>
              )}
            </span>
          </div>
        ) : (
          /* Regular upload button for other modes */
          <span
            onClick={() => !isUpload && fileRef.current.click()}
            className={`cursor-pointer rounded border-1 inline-flex py-2 ${from === "taskpanel" ? "bg-appbg" : "bg-gray-200"
              } px-2 ${isUpload ? "opacity-80" : "border border-[#E1E1E1] dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"}`}
            title="Upload files (max 15MB each)"
          >
            {!isFileClicked ? (
              <Icon icon="entypo:attachment" className={`w-5 h-5 ${from === "taskrow" ? "text-primary" : ""}`} />
            ) : (
              <span className={`fileblink ${from === "taskpanel" ? "text-white" : "text-f48"}`}>
                <Icon icon="carbon:dot-mark" />
              </span>
            )}
          </span>
        )}

        {/* {from !== "taskpanelTop" && totalAttachments > 0 && (
          <div className="text-sm text-gray-600 mr-2">
            {totalAttachments} attached {totalAttachments === 1 ? "file" : "files"}
          </div>
        )} */}
      </div>
    </div>
  )
}

export default FileUpload
