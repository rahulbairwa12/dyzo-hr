import { Icon } from '@iconify/react'
import React, { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import { fetchAuthDelete, fetchAuthGET, fetchAuthPost, fetchAuthPut, uploadtoS3 } from '@/store/api/apiSlice'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { ProfilePicture } from '../ui/profilePicture'
import DeletePopup from '@/pages/inviteemployee/DeletePopup'
import Tooltip from '../ui/Tooltip'
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";
import AttachmentViewer from '../Task/AttachmentViewer'
import ProfileCardWrapper from '../ui/ProfileCardWrapper'
import DOMPurify from "dompurify";

const ProjectNotes = ({ projectData, users, permissions }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const { deletedUserIds, deletedData } = useSelector((state) => state.users || { deletedUserIds: [], deletedData: [] });
  const [showAddNoteBox, setShowAddNoteBox] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editNoteId, setEditNoteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null)
  const [isUpload, setIsUpload] = useState(false)
  const [isFileClicked, setIsFileClicked] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const MAX_FILE_SIZE_MB = 15
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);
  const editorRef = useRef(null);
  const [isNoteEmpty, setIsNoteEmpty] = useState(true);
  const titleRef = useRef(null);

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  // Fetch notes from API
  const fetchNotes = async () => {
    if (!projectData?._id) return;
    setLoadingNotes(true)
    try {
      const response = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/project-notes/project/${projectData?._id}/`, false)
      if (response?.status) {
        setNotes(response?.notes)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNotes(false)
    }
  }

  const setCaretToEnd = (el) => {
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // Populate editor only when opening the add/edit panel or when switching notes.
  // Do NOT run on every noteText change (that was resetting caret).
  useEffect(() => {
    if (!showAddNoteBox) return;
    const el = editorRef.current;

    // Only act when the add/edit panel is visible
    if (editMode) {
      // When editing, populate the editor and focus/caret
      if (el) {
        el.innerHTML = noteText || "";
        setIsNoteEmpty((el.textContent || "").trim().length === 0);
        setTimeout(() => setCaretToEnd(el), 0);
      }
    } else {
      // Adding a new note: clear editor & focus title
      if (el) {
        el.innerHTML = "";
        setIsNoteEmpty(true);
      }
      if (titleRef.current) {
        setTimeout(() => titleRef.current.focus(), 0); // Ensure after render
      }
    }
  }, [showAddNoteBox, editMode, editNoteId]);

  const normalizeEditorHTML = (html) => {
    if (!html) return "";
    let normalized = html
      .replace(/<div><br><\/div>/g, "<br>") // empty divs
      .replace(/<div>/g, "")                // open div → nothing
      .replace(/<\/div>/g, "<br>")          // close div → line break
      .replace(/&nbsp;/g, " ");             // non-breaking spaces
    // additionally, replace newline characters in raw input with <br>
    normalized = normalized.replace(/\n/g, "<br>")
    return normalized;
  };

  // Add note
  const handleAddNote = async () => {
    if (!projectData?._id && !userInfo?._id) return;
    if (title.trim() === "") {
      toast.error("Please enter a title for your note");
      return;
    }
    if (noteText.trim() === "") {
      toast.error("Please enter some text for your note");
      return;
    }
    let currentHTML = editorRef.current?.innerHTML || "";
    currentHTML = autolink(normalizeEditorHTML(currentHTML));
    try {
      // ✅ Transform links before saving
      let finalNoteText = currentHTML;
      try {
        const transformed = await transformLinks(currentHTML);
        finalNoteText = transformed || currentHTML;
      } catch (_) { }

      const payload = {
        project: projectData?._id,
        employee: userInfo?._id,
        title,
        noteText: finalNoteText,
        attachments,
      };

      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/project-notes/`,
        { body: payload }
      );

      if (response.status) {
        setShowAddNoteBox(false);
        toast.success(response?.message || "Note Added Successfully");
        setNotes([response?.data, ...notes]);
        setTitle("");
        setNoteText("");
        setAttachments([]);
      } else {
        toast.error("Failed to Add Note");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Edit note
  const handleEditNote = async () => {
    try {
      if (!projectData?._id && !userInfo?._id) return;
      if (!editNoteId) return;
      if (title.trim() === "") {
        toast.error("Please enter a title for your note");
        return;
      }
      if (noteText.trim() === "") {
        toast.error("Please enter some text for your note");
        return;
      }
      let currentHTML = editorRef.current?.innerHTML || "";
      currentHTML = autolink(normalizeEditorHTML(currentHTML));

      // ✅ Transform links before saving
      let finalNoteText = currentHTML;
      try {
        const transformed = await transformLinks(currentHTML);
        finalNoteText = transformed || currentHTML;
      } catch (_) { }

      const payload = {
        project: projectData?._id,
        employee: userInfo?._id,
        title,
        noteText: finalNoteText,
        attachments,
      };

      const response = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/project-notes/${editNoteId}/`,
        { body: payload }
      );

      if (response.status) {
        toast.success(response?.message || "Note Updated Successfully");
        setNotes(
          notes.map((note) =>
            note.noteId === editNoteId ? response?.data : note
          )
        );
        setTitle("");
        setNoteText("");
        setAttachments([]);
        setEditMode(false);
        setEditNoteId(null);
        setShowAddNoteBox(false);
      } else {
        toast.error("Failed to Update Note");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete note
  const handleDeleteClick = (id) => {
    setDeletingNoteId(id);
    setShowDeleteModal(true);
  }

  const handleDeleteNote = async () => {
    if (!deletingNoteId) return;
    setIsDeleting(true)
    try {
      const response = await fetchAuthDelete(`${import.meta.env.VITE_APP_DJANGO}/project-notes/${deletingNoteId}/`)
      if (response.status) {
        toast.success(response?.message || "Note Deleted Successfully");
        setNotes(notes.filter(note => note.noteId !== deletingNoteId));
      } else {
        toast.error(response?.message || "Failed to Delete Note");
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false);
    }
  }

  function shortenFilename(filename, maxLength = 20) {
    if (!filename) return
    const extIndex = filename.lastIndexOf(".")
    if (extIndex === -1) return filename

    const name = filename.slice(0, extIndex)
    const ext = filename.slice(extIndex)

    // If it's already short enough, return as-is
    if (filename.length <= maxLength) return filename

    const start = name.slice(0, 12)
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
      setCurrentFileIndex(0)

      uploadFiles(validFiles)

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

      const newAttachments = []
      let successfulUploads = 0

      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i)
        const file = files[i]

        try {
          const uploadUrl = "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments"
          const companyId = userInfo?.companyId
          const userId = userInfo?._id
          const projectId = projectData?._id
          const folder = "project-attachments"
          // const fileName = `${file.name}_${new Date().toISOString().replace(/[-:.TZ]/g, "")}`
          const fileName = getTimestampedFilename(file.name)

          // Upload to S3 with progress tracking
          const uploadedUrl = await uploadtoS3(
            uploadUrl,
            companyId,
            userId,
            projectId,
            folder,
            fileName,
            file,
          )

          newAttachments.push({
            url: uploadedUrl,
            type: getFileCategory(file),
            name: file.name,
            folder: "project-attachments"
          })

          successfulUploads++

          // Small delay to show 100% completion before moving to next file
          await new Promise((resolve) => setTimeout(resolve, 300))
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
          toast.error(`Failed to upload ${shortenFilename(file.name)}`)
        }
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments])
      }
    } catch (error) {
      console.error("Error uploading files or sending attachments:", error)
      toast.error("Upload process failed")
    } finally {
      setIsUpload(false)
      setIsFileClicked(false)
      setCurrentFileIndex(0)
    }
  }

  if (loadingNotes) {
    return <>
      {[...Array(10)].map((_, idx) => (
        <div key={idx} className="p-4 border-b border-neutral-50 dark:border-slate-700 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-5 w-5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
              <div className="h-5 w-5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  }

  function formatTimestamp(isoString) {
    const date = new Date(isoString);

    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    return `${day} ${month} ${year}  ${hours}:${minutes} ${ampm}`;
  }

  // Transform links via API (similar to TaskDescriptionComments)
  const transformLinks = async (content) => {
    if (!content) return content;
    try {
      const data = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/change-message/`, {
        body: { message: content }
      });
      if (data.status === 1) {
        return data.message;
      }
      return content;
    } catch (error) {
      console.error("Error transforming links:", error);
      return content;
    }
  };

  function autolink(html) {
    // Replace plain URLs with anchor tags within the HTML string
    if (!html) return "";
    // This will cover http(s) links not already inside anchor tags
    return html.replace(
      /(?:^|[\s>])((https?:\/\/[^\s<>]+))/gi,
      (match, url) => {
        // If already inside an anchor, ignore
        if (match.includes('<a')) return match;
        // If preceded by whitespace or html close
        const prefix = match.startsWith(" ") ? " " : "";
        return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }
    );
  }

  return (
    <div className="">
      <div className="flex items-center gap-2 border-b border-neutral-50 dark:border-slate-700 pb-4 mb-4">
        <Icon className="w-6 h-6 text-electricBlue-50 dark:text-slate-300 " icon="hugeicons:note-edit" />
        <h6 className="text-base sm:text-lg font-bold text-customBlack-50 dark:text-customWhite-50">Notes</h6>
      </div>

      <div className="grid grid-cols-12 gap-4 ">
        <div className={`${showAddNoteBox ? "hidden md:block md:col-span-7" : "col-span-12 md:col-span-12"} `}>
          <div className={`${showAddNoteBox ? "md:min-h-[600px] md:max-h-[70vh] overflow-y-auto " : ""} space-y-4`}>
            {Array.isArray(notes) && notes.length > 0 ? (
              notes.map((note, index) => {
                const employeeId = note?.employee;

                // Check if employee is in deleted users list
                const isDeletedUser = deletedUserIds?.includes(employeeId) || deletedUserIds?.includes(String(employeeId));

                // Find user in active users array
                const activeUser = users && users?.find((user) => user?._id === employeeId);

                // Find user in deleted users data if deleted
                const deletedUser = deletedData?.find((user) => user?._id === employeeId || user?._id === String(employeeId));

                // Use active user if found, otherwise use deleted user
                const user = activeUser || deletedUser;

                // Check if user is deleted
                const isUserDeleted = isDeletedUser || !activeUser || user?.is_deleted || user?.name?.toLowerCase().includes("(deleted)");

                return (
                  <div key={index} className="border border-neutral-50 dark:border-slate-700 p-4 rounded-md space-y-2 bg-white dark:bg-slate-800">
                    <div className="flex items-start justify-between">
                      <h6 className="text-base sm:text-lg font-semibold text-customBlack-50 dark:text-customWhite-50">{note?.title}</h6>
                      <div className="flex items-center gap-1">
                        {
                          permissions?.canEditNotes &&
                          <span title="Edit"
                            onClick={() => {
                              setTitle(note?.title || "");
                              setNoteText(note?.noteText || "");
                              setAttachments(note?.attachments || [])
                              setEditMode(true);
                              setEditNoteId(note?.noteId);
                              setShowAddNoteBox(true);
                            }}>
                            <Icon icon="fe:edit" className="w-7 h-7 text-gray-600 dark:text-slate-400 cursor-pointer p-1 hover:bg-black-200 dark:hover:bg-slate-700 rounded-md" />
                          </span>
                        }
                        {
                          permissions?.canDeleteNotes &&
                          <span title="Delete">
                            <Icon icon="hugeicons:delete-01" className="w-7 h-7 text-red-500 cursor-pointer p-1 hover:bg-red-500/10 dark:hover:bg-red-900/20 rounded-md"
                              onClick={() => handleDeleteClick(note?.noteId)}
                            />
                          </span>
                        }
                      </div>
                    </div>
                    {/* <p className="text-sm  text-gray-700 dark:text-slate-300">{note?.noteText}</p> */}
                    <div
                      className="text-sm text-gray-700 dark:text-slate-300 prose dark:prose-invert max-w-none break-words"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(note?.noteText || "", {
                          ALLOWED_TAGS: [
                            "b", "i", "em", "strong", "a", "p", "div", "span", "br", "ul", "ol", "li", "code", "pre"
                          ],
                          ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
                        })
                      }}
                    />

                    {
                      note?.attachments && note?.attachments?.length > 0 &&
                      <div className='grid grid-cols-12 gap-2 pt-2'>
                        {
                          note?.attachments.map((attachment, index) =>
                            <div
                              key={index}
                              onClick={() => {
                                setAttachmentsForView(note?.attachments);
                                handleAttachmentOpen(index);
                              }}
                              className={`${showAddNoteBox ? "col-span-12 xl:col-span-6 " : "col-span-12 sm:col-span-6 lg:col-span-4 2xl:col-span-3"} border border-neutral-50 dark:border-slate-700 p-2 rounded-md bg-white dark:bg-slate-700 mb-2 cursor-pointer ${attachment?.type === "image"
                                ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                : attachment?.type === "document"
                                  ? "hover:bg-sky-50 dark:hover:bg-sky-900/20"
                                  : attachment?.type === "pdf"
                                    ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                                    : attachment?.type === "video"
                                      ? "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                      : ""
                                }`} >
                              <div className="flex items-center gap-2">
                                <div>
                                  {attachment?.type === "image" && (
                                    <img
                                      src={attachment?.url}
                                      alt=""
                                      className="w-8 h-8 object-contain"
                                    />
                                  )}
                                  {attachment?.type === "document" && (
                                    <img
                                      src={documentIcon}
                                      alt=""
                                      className="w-8 h-8"
                                    />
                                  )}
                                  {attachment?.type === "pdf" && (
                                    <img src={pdfIcon} alt="" className="w-8 h-8" />
                                  )}
                                  {attachment?.type === "video" && (
                                    <img src={videoIcon} alt="" className="w-8 h-8" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm sm:text-base">
                                    {shortenFilename(attachment?.name)}
                                  </p>
                                  <p className="text-xs">
                                    {attachment?.type}
                                    <span className="mx-1">•</span>
                                    <span>
                                      {(attachment?.name)
                                        .split(".")
                                        .pop()
                                        .toLowerCase()}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    }
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ProfileCardWrapper userId={user?._id}>
                          <ProfilePicture
                            user={isUserDeleted ? (user ? { ...user, name: user?.name || "(deleted)", is_deleted: true } : { name: "(deleted)", is_deleted: true }) : user}
                            className="w-7 h-7 rounded-full border-2 dark:border-slate-700 border-white object-cover"
                          />
                        </ProfileCardWrapper>
                        <span className="text-xs capitalize text-gray-400 dark:text-slate-500">
                          {isUserDeleted ? (user?.name ? `${user?.name} (Deleted)` : "(Deleted)") : (user?.name || "Unknown User")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        <span>{formatTimestamp(note?.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                <div className="flex flex-col items-center justify-center text-center px-6 py-12">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-700/50 mb-3">
                    <Icon icon="hugeicons:note-edit" className="w-7 h-7 text-electricBlue-100 dark:text-slate-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">No notes yet</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">Add your first note to capture ideas, meeting summaries, and important details for this project.</p>
                  <div className="mt-5">
                    <Button
                      text="Add Note"
                      className="bg-electricBlue-100 text-white px-3 py-1.5 hover:bg-electricBlue-50"
                      icon="hugeicons:note-edit"
                      onClick={() => setShowAddNoteBox(true)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {
          showAddNoteBox &&
          <div className="col-span-12 md:col-span-5 p-4 border border-neutral-50 dark:border-slate-700 md:min-h-[600px] rounded-md space-y-4 bg-white dark:bg-slate-800 ">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between ">
                <h6 className="text-base font-semibold text-customBlack-50 dark:text-customWhite-50">{editMode ? "Edit Note" : "Add New Note"}</h6>
                <Icon icon="heroicons:x-mark-20-solid" className="w-8 h-8 cursor-pointer hover:bg-black-200 rounded-full p-0.5"
                  onClick={() => {
                    setShowAddNoteBox(false);
                    setEditMode(false);
                    setEditNoteId(null);
                    setTitle("");
                    setNoteText("");
                    setAttachments([]);
                    if (editorRef.current) editorRef.current.innerHTML = "";
                  }} />
              </div>
              <div className="space-y-4">
                <textarea className="w-full p-2 rounded-md focus:outline-none text-base sm:text-lg resize-none border border-neutral-50 dark:border-slate-700 bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={2}
                  autoFocus={!editMode}
                  ref={titleRef}
                />
                {/* <textarea className="w-full p-2 rounded-md focus:outline-none text-sm sm:text-base resize-none border border-neutral-50 dark:border-slate-700 bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50"
                    placeholder="Type your note"
                    rows={16}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  /> */}
                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.execCommand("insertLineBreak");
                        setTimeout(() => {
                          const el = editorRef.current;
                          if (!el) return;
                          const { scrollTop, scrollHeight, clientHeight } = el;
                          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
                          if (isAtBottom) {
                            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                          }
                        }, 0);
                      }
                    }}
                    onPaste={async (e) => {
                      e.preventDefault();
                      const pasteText = e.clipboardData?.getData("text");
                      if (!pasteText) return;

                      const el = editorRef.current;
                      if (!el) return;

                      const { scrollTop, scrollHeight, clientHeight } = el;
                      const wasAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

                      // Step 1: Autolink pasted text
                      let htmlToInsert = autolink(pasteText);
                      if (/https?:\/\/[^\s]+/i.test(pasteText)) {
                        try { htmlToInsert = await transformLinks(pasteText); } catch (_) { }
                      }

                      // Step 2: Insert as HTML at caret
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount) {
                        sel.deleteFromDocument();
                        const range = sel.getRangeAt(0);
                        range.insertNode(range.createContextualFragment(htmlToInsert));
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }

                      // Step 3: Run autolink on the *whole editor content* to catch any missed URLs (optional, but safest)
                      const html = autolink(el.innerHTML || "");
                      if (el.innerHTML !== html) {
                        el.innerHTML = html;
                        setCaretToEnd(el); // maintain UX, caret at end
                      }
                      setNoteText(el.innerHTML);
                      setIsNoteEmpty((el.textContent || "").trim().length === 0);

                      if (wasAtBottom) {
                        setTimeout(() => {
                          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
                        }, 0);
                      }
                    }}
                    onInput={() => {
                      const el = editorRef.current;
                      if (!el) return;
                      // Optionally, autolink on every input for maximum UX,
                      // Or you can just do this before save/onBlur for less re-render.
                      // If you want to avoid "cursor jump," only apply on save/onBlur.
                      // Here's how to autolink right away:
                      const html = el.innerHTML;
                      const linked = autolink(html);
                      if (linked !== html) {
                        el.innerHTML = linked;
                        setCaretToEnd(el);
                      }
                      setNoteText(el.innerHTML);
                      setIsNoteEmpty((el.textContent || "").trim().length === 0);
                    }}
                    className="w-full p-2 border border-neutral-50 rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50 text-sm bg-transparent prose dark:prose-invert max-w-none h-[300px] focus:outline-none overflow-y-auto break-words"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                  {isNoteEmpty && (
                    <span className="pointer-events-none absolute left-2 top-2 text-gray-400 text-sm select-none">
                      Type your note...
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap py-2">
                {attachments?.length > 0 &&
                  attachments?.map((attachment, i) => (
                    <Tooltip
                      key={i}
                      animation="shift-away"
                      placement="top"
                      theme="custom-light"
                      content={
                        <div className="text-xs text-center">
                          <p className="font_medium">
                            {shortenFilename(attachment?.name)}
                          </p>
                          <p className="opacity-80">
                            {attachment?.type} •{" "}
                            {attachment?.name?.split(".").pop()?.toLowerCase()}
                          </p>
                        </div>
                      }
                    >
                      <div
                        className={`relative cursor-pointer border border-slate-300 dark:border-slate-600 rounded-lg flex items-center bg-white dark:bg-slate-700 shadow-sm hover:shadow-md transition group
                ${attachment?.type === "image"
                            ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            : attachment?.type === "document"
                              ? "hover:bg-sky-50 dark:hover:bg-sky-900/20"
                              : attachment?.type === "pdf"
                                ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                                : attachment?.type === "video"
                                  ? "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  : ""
                          }`}
                        onClick={() => {
                          setAttachmentsForView(attachments);
                          handleAttachmentOpen(i);
                        }}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachments((prev) => prev.filter((_, index) => index !== i));
                          }}
                          className="absolute -top-2 -right-2 text-sm bg-red-600 rounded-full p-0.5  text-white hidden group-hover:block hover:scale-110"
                          title="Delete"
                        >
                          <Icon icon="fe:close" className="w-4 h-4" />
                        </button>

                        <div className="p-1">
                          {attachment?.type === "image" && (
                            <img
                              src={attachment?.url || imageIcon}
                              alt=""
                              className="w-8 h-8 object-contain rounded-md "
                            />
                          )}
                          {attachment?.type === "document" && (
                            <img src={documentIcon} alt="" className="w-8 h-8" />
                          )}
                          {attachment?.type === "pdf" && (
                            <img src={pdfIcon} alt="" className="w-8 h-8" />
                          )}
                          {attachment?.type === "video" && (
                            <img src={videoIcon} alt="" className="w-8 h-8" />
                          )}
                        </div>
                      </div>
                    </Tooltip>
                  ))}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileRef}
                    onChange={handleFileSelect}
                    multiple={true}
                    accept="image/*,application/pdf,.csv,.xls,.xlsx,video/*"
                  />
                  <span
                    onClick={() => fileRef.current.click()}
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
                <Button
                  text="Save"
                  className="flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer text-electricBlue-100 bg-white text-sm font-medium border-2 border-electricBlue-100/20"
                  icon="hugeicons:note-edit"
                  onClick={editMode ? handleEditNote : handleAddNote}
                />
              </div>
            </div>
          </div>
        }
      </div>

      {
        !showAddNoteBox && Array.isArray(notes) && notes.length > 0 &&
        <div className="fixed bottom-6 right-6 ">
          <Button
            text="Add Note"
            className="bg-electricBlue-100 text-white px-3 py-1.5 hover:bg-electricBlue-50"
            icon="hugeicons:note-edit"
            onClick={() => setShowAddNoteBox(true)}
          />
        </div>
      }

      {showDeleteModal && (
        <DeletePopup
          title="Delete Note"
          description={`Are you sure you want to delete this note?\nThis action cannot be undone.`}
          setOpen={setShowDeleteModal}
          setLoading={setIsDeleting}
          loading={isDeleting}
          onConfirm={handleDeleteNote}
        />
      )}

      {isAttachmentViewerOpen && (
        <AttachmentViewer
          attachments={attachmentsForView && attachmentsForView}
          initialIndex={currentAttachment}
          open={isAttachmentViewerOpen}
          onClose={() => setIsAttachmentViewerOpen(false)}
        />
      )}
    </div>
  )
}

export default ProjectNotes
