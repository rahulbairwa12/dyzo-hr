import { useState } from "react";
import InboxData from "./InboxData";
import MessageDetailPanel from "./MessageDetailPanel";
import { ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";
import { markNotificationRead } from "@/store/notificationsSlice";

const Index = () => {
   const dispatch = useDispatch();
  const [selectedMessage, setSelectedMessage] = useState(null);

  const handleMessageSelect = async(message) => {
    setSelectedMessage(message);
    if (selectedMessage && !selectedMessage.read && selectedMessage.id !== message.id) {
      await dispatch(markNotificationRead({ id: selectedMessage.id }));
    }
  };

  const handleCloseDetail = () => {
    if (selectedMessage && !selectedMessage.read) {
      dispatch(markNotificationRead({ id: selectedMessage.id }));
    }
    
    setSelectedMessage(null);
  };

  return (
    <>
    <ToastContainer/>
    <div className="sm:h-[calc(100vh-80px)] flex">
      <div
        className={`transition-all duration-300 ${
          selectedMessage ? " w-0 hidden sm:block sm:w-[50%] 2xl:w-[60%]" : "w-full"
        }`}
      >
        <InboxData
          onMessageSelect={handleMessageSelect}
          selectedMessage={selectedMessage}
        />
      </div>
      {selectedMessage && (
        <div className=" w-full sm:w-[50%] 2xl:w-[40%] border-l border-gray-200 dark:border-black-600">
          <MessageDetailPanel
            message={selectedMessage}
            onClose={handleCloseDetail}
          />
        </div>
      )}
    </div>
    </>
  );
};

export default Index;
