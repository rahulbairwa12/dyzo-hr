import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import image1 from "@/assets/images/users/user-1.jpg";
import { fetchAuthGET, fetchAuthFilePost, fetchAuthDelete } from "@/store/api/apiSlice";
const baseURL = import.meta.env.VITE_APP_DJANGO;
// const baseURL = "http://127.0.0.1:8000";
let id = null;

export const fetchContacts = createAsyncThunk('appchat/fetchContacts', async ({ companyId, userId }) => {
  id = userId;
  const response = await fetchAuthGET(`${baseURL}/chat/api/employees/${companyId}/${userId}/`);
  return response.data?.data;

});

export const fetchMessages = createAsyncThunk('appchat/fetchMessages', async (receiverId) => {

  let page = 1;

  if (typeof receiverId === 'object' && receiverId !== null) {
    page = receiverId.page; // Set page first before modifying receiverId
    receiverId = receiverId.receiverId; // Modify receiverId

  }

  const response = await fetchAuthGET(`${baseURL}/chat/fetch-direct-messages/${id}/${receiverId}/?page=${page}`);
  const data = response.data;
  return { data, page, receiverId };
});

export const sendMessageAPI = createAsyncThunk('appchat/sendMessage', async ({ sender_id, receiver_id, message, images }) => {
  const formData = new FormData();
  formData.append('sender_id', sender_id);
  formData.append('receiver_id', receiver_id);
  formData.append('message', message);
  if (images) {
    images.forEach(image => formData.append('images', image));
  }
  const response = await fetchAuthFilePost(`${baseURL}/chat/send-direct-message/`, { body: formData });
  return response.data?.messages;
});

export const deleteMessageAPI = createAsyncThunk('appchat/deleteMessage', async (messageId) => {
  const response = await fetchAuthDelete(`${baseURL}/chat/api/message/delete/${messageId}/`);
  return response.data;
});

export const appChatSlice = createSlice({
  name: "appchat",
  initialState: {
    openProfile: false,
    openinfo: true,
    activechat: false,
    searchContact: "",
    mobileChatSidebar: false,
    profileinfo: {},
    messFeed: [],
    user: {},
    contacts: [],
    chats: [],
    currentPage: 1,
    hasNextPage: true,
  },
  reducers: {
    openChat: (state, action) => {
      state.activechat = action.payload.activechat;
      state.mobileChatSidebar = !state.mobileChatSidebar;
      state.user = action.payload.contact;
    },
    toggleMobileChatSidebar: (state, action) => {
      state.mobileChatSidebar = action.payload;
    },
    infoToggle: (state, action) => {
      state.openinfo = action.payload;
    },
    addMessage: (state, action) => {
      state.messFeed.push(action.payload);
    },
    updateMessageReadStatus: (state, action) => {
      const { messageId, is_read } = action.payload;
      const message = state.messFeed.find(msg => msg.id === messageId);
      if (message) {
        message.is_read = is_read;
      }
    },
    toggleProfile: (state, action) => {
      state.openProfile = action.payload;
    },
    setContactSearch: (state, action) => {
      state.searchContact = action.payload;
    },
    toggleActiveChat: (state, action) => {
      state.activechat = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.contacts = action.payload;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      const { data, page, receiverId } = action.payload;
      if (page === 1) {
        state.messFeed = data.messages.map(message => ({
          id: message.id,
          img: message.sender_profile,
          content: message.message,
          time: new Date(message.timestamp).toLocaleTimeString(),
          sender: message.senderId === id ? "me" : "them",
          receiverId: message.receiverId,
          image: message.image,
          is_read: message.is_read,
        }));
      } else {
        state.messFeed = [
          ...data.messages.map(message => ({
            id: message.id,
            img: message.sender_profile,
            content: message.message,
            time: new Date(message.timestamp).toLocaleTimeString(),
            sender: message.senderId === id ? "me" : "them",
            receiverId: message.receiverId,
            image: message.image,
            is_read: message.is_read,
          })),
          ...state.messFeed
        ];
      }
      state.hasNextPage = data.has_next;
      state.currentPage = page;
    });
    builder.addCase(sendMessageAPI.fulfilled, (state, action) => {
      action.payload.forEach(message => {
        const newMessage = {
          id: message.id,
          img: image1,
          content: message.message,
          time: new Date(message.timestamp).toLocaleTimeString(),
          sender: "me",
          receiverId: message.receiverId,
          image: message.image,
          is_read: message.is_read,
        };
        state.messFeed.push(newMessage);
      });
    });
    builder.addCase(deleteMessageAPI.fulfilled, (state, action) => {
      state.messFeed = state.messFeed.filter(message => message.id !== action.meta.arg);
    });
  }
});

export const {
  openChat,
  toggleMobileChatSidebar,
  infoToggle,
  addMessage,
  updateMessageReadStatus,
  toggleProfile,
  setContactSearch,
  toggleActiveChat,
} = appChatSlice.actions;

export default appChatSlice.reducer;
