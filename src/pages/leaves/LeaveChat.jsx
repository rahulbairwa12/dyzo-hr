import React, { useState, useCallback } from 'react';
import { fetchAuthPost } from "@/store/api/apiSlice";
import { intialLetterName } from '@/helper/helper';

const LeaveChat = ({ leaveChat, leaveId }) => {
  const [input, setInput] = useState("");
  const [mentionedEmails, setMentionedEmails] = useState([]);
  const [users, setUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    // Handle mentions and suggestions
  };

  const sendMessage = async () => {
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;
    try {
      const formData = new FormData();
      formData.append("message", trimmedMessage);
      formData.append("mentionedEmails", JSON.stringify(mentionedEmails));
      const data = await fetchAuthPost(`${baseURL}/api/${leaveId}/leave-chat/`, { body: formData });
      if (data.status) {
        // Fetch updated chat messages
        setInput("");
        setMentionedEmails([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderChatMessage = (chat) => {
    const messageDate = new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <div key={chat.id} className={`flex ${chat.sender === leaveId ? "justify-end" : "justify-start"}`}>
        <div className="flex items-start gap-2">
          {chat.profile_url ? (
            <img className="w-10 h-10 rounded-full" src={`${baseURL}${chat.profile_url}`} alt="Profile" />
          ) : (
            <span className="bg-primary text-white w-10 h-10 flex justify-center items-center rounded-full font-bold">{intialLetterName('', '', chat.sender_name)}</span>
          )}
          <div className="flex flex-col gap-1 max-w-xs">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">{chat.sender_name}</span>
              <span className="text-sm text-gray-500">{messageDate}</span>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <p className="text-sm">{chat.message}</p>
            </div>
            <span className="text-sm text-gray-500">Delivered</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {leaveChat.map(chat => renderChatMessage(chat))}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-gray-100 border-t border-gray-300">
        <div className="flex items-center max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            className="flex-grow p-2 border border-gray-300 rounded-lg"
            placeholder="Type your message..."
          />
          <button onClick={sendMessage} className="p-2 bg-blue-500 text-white rounded-lg ml-2">
            <span className="iconify" data-icon="icon-sets.iconify:paper-airplane" data-width="24" data-height="24"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveChat;
