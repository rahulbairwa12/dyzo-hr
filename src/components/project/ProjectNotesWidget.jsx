import React, { useState, useEffect, useCallback } from 'react';
import Card from "@/components/ui/Card";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { toast } from "react-toastify";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import axios from 'axios';
import Cookies from 'js-cookie';

// We'll keep the EditNoteForm component but use it inline
const EditNoteForm = ({ note, onCancel, onSave, loading }) => {
  const [text, setText] = useState('');

  // Initialize text when component mounts or note changes
  useEffect(() => {
  
    setText(note.noteText || '');
  }, [note]);

  return (
    <div>
      <Textarea
        placeholder="Edit your note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mb-3"
        rows={3}
      />
      <div className="flex justify-end space-x-2">
        <Button
          text="Cancel"
          className="btn-sm border border-slate-200 dark:border-slate-700"
          onClick={onCancel}
        />
        <Button
          icon="heroicons-outline:save"
          text="Update"
          className="btn-sm bg-primary-500 text-white"
          onClick={() => onSave(text)}
          disabled={loading}
        />
      </div>
    </div>
  );
};

const ProjectNotesWidget = ({ projectId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Fetch project notes
  const fetchProjectNotes = useCallback(async () => {
    if (!userInfo?._id || !projectId) return;

    try {
      setLoading(true);
      const response = await fetchAuthGET(`${baseURL}/api/projectnotes/${userInfo._id}/${projectId}/`);

  

      // The API returns the notes directly as an array
      if (Array.isArray(response)) {
        setNotes(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback if the response is wrapped in a data property
        setNotes(response.data);
      } else if (response && response.status && Array.isArray(response.data)) {
        // Another possible response format
        setNotes(response.data);
      } else {
        console.warn("Unexpected notes response format:", response);
        setNotes([]);
      }
    } catch (error) {
      console.error("Error fetching project notes:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userInfo, projectId, baseURL]);

  // Fetch notes when component mounts
  useEffect(() => {
    fetchProjectNotes();
  }, [fetchProjectNotes]);

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

  

    if (!userInfo?._id) {
      console.error("User ID is missing");
      toast.error("User information is missing. Please try again after logging in.");
      return;
    }

    if (!projectId) {
      console.error("Project ID is missing");
      toast.error("Project information is missing. Please try again.");
      return;
    }

    try {
      setLoading(true);
      // Use the correct endpoint for adding notes
      const apiUrl = `${baseURL}/api/add/projectnotes/${userInfo._id}/${projectId}/`;
      console.log("API URL:", apiUrl);

      // Use the correct field name (noteText) as confirmed by the API response
      const payload = {
        body: {
          noteText: newNote,
          project_id: parseInt(projectId, 10)
        }
      };
      console.log("Request payload:", payload);

      const response = await fetchAuthPost(apiUrl, payload);
      console.log("API response:", response);

      // Check if the response contains the expected fields from a successful note creation
      if (response && (response.status || response.noteId)) {
        toast.success("Note added successfully");
        setNewNote('');
        setIsAddingNote(false);
        fetchProjectNotes();
      } else {
        toast.error(response.message || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  // Update an existing note
  const handleUpdateNote = async (newText) => {
    if (!editingNoteId) {
      console.error("No note selected for editing");
      return;
    }

    if (!newText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = `${baseURL}/api/add/projectnotes/${userInfo._id}/${projectId}/`;
      console.log("Update note API URL:", apiUrl);

      const payload = {
        body: {
          noteText: newText,
          project_id: parseInt(projectId, 10),
          noteId: editingNoteId
        }
      };
      console.log("Update note payload:", payload);

      const response = await fetchAuthPost(apiUrl, payload);
      console.log("Update note response:", response);

      // Check if the response contains the expected fields from a successful note update
      if (response && (response.status || response.noteId)) {
        toast.success("Note updated successfully");
        setEditingNoteId(null);
        fetchProjectNotes();
      } else {
        toast.error(response.message || "Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setLoading(true);
      const apiUrl = `${baseURL}/api/add/projectnotes/${userInfo._id}/${projectId}/`;
      console.log("Delete note API URL:", apiUrl);

      const payload = {
        body: {
          noteId: noteId,
          project_id: parseInt(projectId, 10),
          delete: true
        }
      };
      console.log("Delete note payload:", payload);

      const response = await fetchAuthPost(apiUrl, payload);
      console.log("Delete note response:", response);

      // Check if the response indicates success
      if (response && (response.status || response.success)) {
        toast.success("Note deleted successfully");
        fetchProjectNotes();
      } else {
        toast.error(response.message || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setLoading(false);
    }
  };

  // Custom title component with Add Note button
  const CustomTitle = () => (
    <div className="flex items-center justify-between relative">
      <h3 className="card-title">Project Notes</h3>
      {!isAddingNote && (
        <Button
          icon="heroicons-outline:plus"
          text={isMobile ? "Add Note" : "Add Note"}
          className="btn-sm bg-primary-500 text-white h-min py-1.5 absolute -right-44"
          iconClass="text-base"
          onClick={() => setIsAddingNote(true)}
        />
      )}
    </div>
  );

  // Render loading state
  if (loading && notes.length === 0) {
    return (
      <Card title={<CustomTitle />} className="h-full">
        <div className="animate-pulse p-3 md:p-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 w-1/2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={<CustomTitle />} className="h-full" bodyClass={isMobile ? "p-6" : ""}>
      <div className="p-3 md:p-4">
        {isAddingNote && (
          <div className="mb-3 md:mb-4 border border-slate-200 dark:border-slate-700 rounded-md p-2 md:p-3">
            <Textarea
              label="New Note"
              placeholder="Type your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-2 md:mb-3"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button
                text="Cancel"
                className="btn-sm border border-slate-200 dark:border-slate-700 text-xs md:text-sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote('');
                }}
              />
              <Button
                icon="heroicons-outline:save"
                text="Save"
                className="btn-sm bg-primary-500 text-white text-xs md:text-sm"
                onClick={handleAddNote}
                disabled={loading}
              />
            </div>
          </div>
        )}

        <SimpleBar className={`h-[300px]  ${isMobile ? "w-[300px] p-0 -ml-5" : "w-full"} md:h-[350px]  `}>
          {notes.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {notes.map((note) => (
                <div
                  key={note.noteId}
                  className="border border-slate-200 dark:border-slate-700 rounded-md p-2 md:p-3"
                >
                  {editingNoteId === note.noteId ? (
                    <EditNoteForm
                      note={note}
                      onCancel={() => setEditingNoteId(null)}
                      onSave={handleUpdateNote}
                      loading={loading}
                    />
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2 ">
                        <div className="flex items-center">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs mr-2">
                            {userInfo?._id === note.employee ? userInfo?.name?.charAt(0).toUpperCase() || 'Y' : 'U'}
                          </div>
                          <div>
                            <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-white">
                              {userInfo?._id === note.employee ? userInfo?.name || 'You' : `User ${note.employee}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {userInfo?._id === note.employee && (
                            <>
                              <button
                                className="text-slate-400 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-500"
                                onClick={() => {
                                  console.log("Edit button clicked for note:", note);
                                  setEditingNoteId(note.noteId);
                                }}
                              >
                                <Icon icon="heroicons-outline:pencil" className="text-base md:text-lg" />
                              </button>
                              <button
                                className="text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500"
                                onClick={() => handleDeleteNote(note.noteId)}
                              >
                                <Icon icon="heroicons-outline:trash" className="text-base md:text-lg" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {note.noteText}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 md:py-8">
              <Icon icon="heroicons-outline:document-text" className="text-4xl md:text-5xl text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">No notes for this project yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add a note to keep track of important information</p>
            </div>
          )}
        </SimpleBar>
      </div>
    </Card>
  );
};

export default ProjectNotesWidget; 