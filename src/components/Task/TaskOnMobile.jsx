import React, { useState, useEffect, useRef } from "react";
import useSpeechToText from 'react-hook-speech-to-text';
import { useSelector } from "react-redux";
import moment from "moment";
import { Icon } from "@iconify/react";
import { fetchAuthFilePost } from "@/store/api/apiSlice";

const TaskOnMobile = ({ setisTaskOnMobile }) => {
  const [isTaskElementVisible, setTaskElementVisible] = useState(false);
  const [message, setMessage] = useState(""); // State to hold the input message
  const [isTaskCreated, isSetTaskCreated] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const taskElementRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      // Check if the click was outside the task element
      if (taskElementRef.current && !taskElementRef.current.contains(event.target)) {
        setTaskElementVisible(false);
      }
    }

    // Add the event listener when the component mounts
    document.addEventListener('mousedown', handleClickOutside);
    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTaskElement = () => {
    setTaskElementVisible(!isTaskElementVisible);
  };

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    crossBrowser: true,
    continuous: false,
    timeout: true,
    useLegacyResults: false,
  });

  // Effect to update the message input with the speech-to-text results
  useEffect(() => {
    if (results.length > 0) {
      setMessage(results[results.length - 1].transcript);
    }
  }, [results]);

  const createNewTask = async (task) => {
    isSetTaskCreated(true);
    let payload = new FormData();
    payload.append("taskName", message);
    payload.append("dueDate", moment().set({ hour: 23, minute: 59 }).format());
    
    // If user is a client, use their ID as both userId and clientId
    if (userInfo.user_type === "client") {
      payload.append("userId", userInfo._id); // This is the client ID
      payload.append("clientId", userInfo._id); // Explicitly set client ID
    } else {
      // For non-client roles (employees), use the user ID as before
      payload.append("userId", userInfo._id);
    }
    
    payload.append("projectId", userInfo?.default_project_id);
    payload.append("collaborators", [userInfo._id]);

    const response = await fetchAuthFilePost(
      `${process.env.REACT_APP_DJANGO}/create-task/${userInfo._id}/`,
      { body: payload }
    );

    if (response.status === 1) {
      setisTaskOnMobile(response.taskId);
      setMessage("");
    }
    isSetTaskCreated(false);
  }

  return (
    <>
      {/* <div className="relative lg:hidden md:hidden sm:hidden block">
        <button
          className="create-task z-50 text-white flex flex-col shrink-0 grow-0 justify-around 
                    fixed bottom-20 right-5 rounded-lg
                    mr-1 mb-5 lg:mr-5 lg:mb-5 xl:mr-10 xl:mb-10"
          onClick={toggleTaskElement}
        >
          <div className="p-5 rounded-full border-4 border-white bg-appbg">
            <Icon icon="ic:outline-plus" /> 
          </div>
        </button>
      </div> */}

      {isTaskElementVisible && (
        <div className="bottom-taskElement m-0 fixed bottom-0 left-0 bg-appbg right-0 border-t-2 border-gray-200 px-2 py-2 sm:mb-0 z-60" ref={taskElementRef}>
          <div className="relative flex">
            <span className="absolute inset-y-0 flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full h-[35px] w-[35px] transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
                onClick={isRecording ? stopSpeechToText : startSpeechToText} // Toggle speech recognition
              >
                {isRecording ? (
                  <Icon icon="mdi:microphone" className="h-8 w-8" />
                ) : (
                  <Icon icon="mdi:microphone-off" className="h-8 w-8" />
                )}
              </button>
            </span>
            <input
              type="text"
              placeholder="Write your message!"
              className="w-full focus:outline-none text-gray-600 placeholder-gray-600 pl-12 rounded-md py-3"
              value={message} // Bind the input value to the message state
              onChange={(e) => setMessage(e.target.value)} // Update message state on change
            />
            <div className="absolute right-0 flex items-center inset-y-0 sm:flex">
              <button
                onClick={createNewTask}
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-4 py-3 transition duration-500 ease-in-out text-white bg-appbg hover:bg-blue-400 focus:outline-none"
              >
                {!isTaskCreated ? <Icon icon="material-symbols:send-sharp" /> : <span className="fileblink text-f48"> <Icon icon="carbon:dot-mark" /></span>}
              </button>
            </div>
          </div>
          {error && <p className="text-red-600">{error.message}</p>}
        </div>
      )}
    </>
  );
};

export default TaskOnMobile;
