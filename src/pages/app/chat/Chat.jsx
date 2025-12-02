import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleMobileChatSidebar, infoToggle, fetchMessages, addMessage, deleteMessageAPI, updateMessageReadStatus } from "./store";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import Dropdown from "./Dropdown";
import EmojiPicker from 'emoji-picker-react';
import { Icon as Iconify } from '@iconify/react';
import { fetchAuthPost } from "@/store/api/apiSlice";

const Chat = () => {
  const { activechat, openinfo, mobileChatSidebar, messFeed, user, currentPage, hasNextPage } = useSelector((state) => state.chat);
  const userInfo = useSelector((state) => state?.auth.user);
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [receiverTyping, setReceiverTyping] = useState(false);
  const chatheight = useRef(null);
  const emojiPickerRef = useRef(null);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  const chatSocket = useRef(null);

  const connectWebSocket = (userId) => {
    if (chatSocket.current) {
      chatSocket.current.close();
    }

    chatSocket.current = new WebSocket(`ws://127.0.0.1:8080/ws/chat/${userInfo._id}/${userId}/`);

    chatSocket.current.onopen = () => {
    };

    chatSocket.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) {
        console.error("WebSocket error:", data.error);
      } else if (data.message) {
        const newMessage = {
          id: data.id,
          img: data.senderId === userInfo._id ? baseURL + userInfo.profile_picture : data.sender_profile,
          content: data.message,
          time: new Date(data.timestamp).toLocaleTimeString(),
          sender: data.senderId == userInfo._id ? "me" : "them",
          receiverId: data.receiverId,
          image: data.image,
          is_read: data.is_read,
        };
        dispatch(addMessage(newMessage));
      } else if (data.typing) {
        setReceiverTyping(data.is_typing && data.sender_id !== userInfo._id);
      } else if (data.read) {
        dispatch(updateMessageReadStatus({
          messageId: data.message_id,
          is_read: true,
        }));
      }
    };

    chatSocket.current.onclose = (e) => {
      console.error("Chat socket closed unexpectedly", e);
      setTimeout(() => {
        if (activechat) {
          connectWebSocket(userId);
        }
      }, 3000);
    };

    chatSocket.current.onerror = (e) => {
      console.error("WebSocket error observed:", e);
    };
  };

  useEffect(() => {
    if (activechat) {
      connectWebSocket(user.id);
    }

    return () => {
      if (chatSocket.current) {
        chatSocket.current.close();
      }
    };
  }, [activechat, user.id]);

  const handleSendMessage = () => {
    if ((newMessage.trim() || selectedImages.length > 0) && chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
      const messageData = {
        sender_id: userInfo._id,
        receiver_id: user.id,
        message: newMessage,
        image: selectedImages.length > 0 ? null : null
      };

      if (selectedImages.length > 0) {
        const reader = new FileReader();
        reader.onload = () => {
          messageData.image = reader.result;
          chatSocket.current.send(JSON.stringify(messageData));
          setNewMessage("");
          setSelectedImages([]);
        };
        reader.readAsDataURL(selectedImages[0]);
      } else {
        chatSocket.current.send(JSON.stringify(messageData));
        setNewMessage("");
        setSelectedImages([]);
      }
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  useEffect(() => {
    if (chatheight.current) {
      chatheight.current.scrollTop = chatheight.current.scrollHeight;
    }
  }, [messFeed]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(filesArray);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedImages(filesArray);
    }
  };

  const removeSelectedImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  const handleImageClick = (image) => {
    setZoomedImage(image);
  };

  const closeZoomedImage = () => {
    setZoomedImage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await dispatch(deleteMessageAPI(messageId)).unwrap();
      dispatch(fetchMessages(user.id));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleDownloadImage = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkAsRead = async (messageId) => {
    const data = await fetchAuthPost(`${baseURL}/chat/chat/mark-as-read/`, {
      body: {
        message_id: messageId,
        receiver_id: userInfo._id,
      },
    });

    if (data.status === 'success') {
      chatSocket.current.send(JSON.stringify({
        read: true,
        message_id: messageId,
        is_read: true,
      }));
    }
  };

  useEffect(() => {
    messFeed.forEach(message => {
      if (message.sender === "them" && !message.is_read) {
        handleMarkAsRead(message.id);
      }
    });
  }, [messFeed]);

  const handleTyping = (typing) => {
    if (chatSocket.current && chatSocket.current.readyState === WebSocket.OPEN) {
      chatSocket.current.send(JSON.stringify({
        typing: true,
        is_typing: typing,
      }));
    }
  };

  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      handleTyping(false);
    }, 3000);

    if (newMessage.length > 0) {
      handleTyping(true);
    } else {
      handleTyping(false);
    }

    return () => clearTimeout(typingTimeout);
  }, [newMessage]);

  const chatAction = (message) => [
    {
      label: "Remove",
      onClick: () => handleDeleteMessage(message.id),
      disabled: message.sender !== userInfo._id,
    },
    message.image && {
      label: "Download",
      link: message.image,
      download: `image_${message.id}.jpg`,
      disabled: false
    }
  ].filter(Boolean);

  const handleScroll = () => {
    if (chatheight.current.scrollTop === 0 && hasNextPage) {
      const scrollHeightBeforeFetch = chatheight.current.scrollHeight;

      dispatch(fetchMessages({ receiverId: user.id, page: currentPage + 1 })).then(() => {
        const scrollHeightAfterFetch = chatheight.current.scrollHeight;
        chatheight.current.scrollTop = scrollHeightAfterFetch - scrollHeightBeforeFetch;
      });
    }
  };

  useEffect(() => {
    const chatHeightRef = chatheight.current;
    if (chatHeightRef) {
      chatHeightRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatHeightRef) {
        chatHeightRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasNextPage, currentPage]);

  const handlePhoneCall = () => {
    window.location.href = `tel:${user.phone}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${user.email}`;
  };

  const handleViewContact = () => {
    navigate(`/profile/${user.id}`);
  };

  const dropdownItems = [
    {
      label: "Media and Info",
      onClick: () => dispatch(infoToggle(!openinfo)),
    },
    {
      label: "View Contact",
      onClick: handleViewContact,
    },
    {
      label: "Clear Chat",
      onClick: () => {
        dispatch(fetchMessages(user.id));
      },
    },
  ];

  return (
    <div className="h-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {width <= breakpoints.lg && (
                <span onClick={() => dispatch(toggleMobileChatSidebar(true))}
                  className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3">
                  <Icon icon="heroicons-outline:menu-alt-1" />
                </span>
              )}
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full relative">
                  <span className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0
                  ${user.status === "active" ? "bg-success-500" : "bg-secondary-500"}`} />
                  <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">
                  {user.fullName}
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">
                  {receiverTyping ? `${user.status} typing...` : user.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse">
            <div className="msg-action-btn" onClick={handlePhoneCall}><Icon icon="heroicons-outline:phone" /></div>
            <div className="msg-action-btn" onClick={handleEmail}><Icon icon="heroicons:envelope" /></div>
            <div className="msg-action-btn">
              <Dropdown classMenuItems="w-[100px] top-0" items={dropdownItems}
                label={<div className="h-8 w-8 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-900 flex flex-col justify-center items-center text-xl rounded-full">
                  <Icon icon="heroicons-outline:dots-horizontal" />
                </div>}
              />
            </div>
          </div>
        </div>
      </header>
      <div className="chat-content parent-height">
        <div className="msgs overflow-y-auto msg-height pt-6 space-y-6" ref={chatheight}>
          {messFeed.map((item, i) => (
            <div className="block md:px-6 px-4" key={i}>
              {item.sender === "them" ? (
                <div className="flex space-x-2 items-start group rtl:space-x-reverse">
                  <div className="flex-none">
                    <div className="h-8 w-8 rounded-full">
                      <img src={item.img} alt="" className="block w-full h-full object-cover rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 flex space-x-4 rtl:space-x-reverse">
                    <div>
                      <div className="text-contrent p-3 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 text-sm font-normal mb-1 rounded-md flex-1 whitespace-pre-wrap break-all">
                        {item.content}
                        {item.image && <img src={item.image} alt="uploaded" className="mt-2 max-h-40 cursor-pointer" onClick={() => handleImageClick(item.image)} />}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-normal text-xs text-slate-400 dark:text-slate-400">{item.time}</span>
                        {item.is_read ? (
                          <Iconify icon="mdi:check-bold" className="text-xs text-green-500" />
                        ) : (
                          <Iconify icon="mdi:check" className="text-xs text-gray-500" />
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                      <Dropdown classMenuItems="w-[100px] top-0" items={chatAction(item)}
                        label={<div className="h-8 w-8 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-900 flex flex-col justify-center items-center text-xl rounded-full">
                          <Icon icon="heroicons-outline:dots-horizontal" />
                        </div>}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 items-start justify-end group w-full rtl:space-x-reverse">
                  <div className="no flex space-x-4 rtl:space-x-reverse">
                    <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                      <Dropdown classMenuItems="w-[100px] left-0 top-0" items={chatAction(item)}
                        label={<div className="h-8 w-8 bg-slate-300 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full text-slate-900">
                          <Icon icon="heroicons-outline:dots-horizontal" />
                        </div>}
                      />
                    </div>
                    <div className="whitespace-pre-wrap break-all">
                      <div className="text-contrent p-3 bg-slate-300 dark:bg-slate-900 dark:text-slate-300 text-slate-800 text-sm font-normal rounded-md flex-1 mb-1">
                        {item.content}
                        {item.image && <img src={item.image} alt="uploaded" className="mt-2 max-h-40 cursor-pointer" onClick={() => handleImageClick(item.image)} />}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-normal text-xs text-slate-400">{item.time}</span>
                        {item.is_read ? (
                          <Iconify icon="mdi:check-bold" className="text-xs text-green-500" />
                        ) : (
                          <Iconify icon="mdi:check" className="text-xs text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-none">
                    <div className="h-8 w-8 rounded-full">
                      <img src={baseURL + userInfo?.profile_picture} alt="" className="block w-full h-full object-cover rounded-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <footer className="md:px-6 px-4 sm:flex md:space-x-4 sm:space-x-2 rtl:space-x-reverse border-t md:pt-6 pt-4 border-slate-100 dark:border-slate-700">
        <div className="flex-none sm:flex hidden md:space-x-3 space-x-1 rtl:space-x-reverse">
          <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className="cursor-pointer">
              <Icon icon="heroicons-outline:photograph" />
            </label>
          </div>
          <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Icon icon="heroicons-outline:emoji-happy" />
          </div>
        </div>
        <div className="flex-1 relative flex space-x-3 rtl:space-x-reverse">
          <div className="flex-1">
            <textarea type="text" placeholder="Type your message..." value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            {selectedImages.length > 0 && (
              <div className="absolute bottom-20 bg-white border border-gray-300 p-2 rounded shadow-md">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative inline-block mr-2">
                    <img src={URL.createObjectURL(image)} alt="selected" className="max-h-40" />
                    <button onClick={() => removeSelectedImage(index)} className="absolute top-0 right-0 bg-gray-800 text-white rounded-full p-1">
                      <Icon icon="heroicons-outline:x" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-none md:pr-0 pr-3">
            <button type="button" className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"
              onClick={handleSendMessage}>
              <Icon icon="heroicons-outline:paper-airplane" />
            </button>
          </div>
        </div>
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-20 bg-white border border-gray-300 p-2 rounded shadow-md">
            <div className="flex justify-end">
              <button onClick={() => setShowEmojiPicker(false)} className="text-gray-500 hover:text-gray-700">
                <Icon icon="heroicons-outline:x" />
              </button>
            </div>
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </footer>

      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <img src={zoomedImage} alt="zoomed" className="max-h-[80vh] max-w-[70vw]" />
            <button onClick={closeZoomedImage} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2">
              <Icon icon="heroicons-outline:x" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;