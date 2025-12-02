import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import axios from "axios";
import axiosInstance from "../../utils/axiosInstance";
import Cookies from "js-cookie";
const apiBaseURL = import.meta.env.VITE_APP_DJANGO;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/",
  }),
  endpoints: (builder) => ({}),
});

import { cacheApi } from '../../utils/apiCache';
import { getAuthToken, getRefreshToken } from '@/utils/authToken';

export const fetchGET = async (url, useCache = true) => {
  try {
    const response = await axiosInstance.get(url);
    if (useCache) {
      cacheApi.set(url, response.data);
    }
    return response.data;
  } catch (error) {
    console.error("Error in fetchGET:", error);
    throw error;
  }
};

// Post Data with authentication token
export const fetchPOST = async (url, data) => {
  try {
    const response = await axiosInstance.post(url, data.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    // Return a structured error object so callers can show precise messages
    console.error("Error in fetchPOST:", {
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return {
      status: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Error in API call",
      error: error.response?.data || error.message,
    };
  }
};

// Post with authorization token (alias for fetchPOST)
export const fetchAuthPost = async (url, data) => {
  try {
    // Check if we need to handle HTML content
    const contentType = data.isHtml ? "text/html" : "application/json";

    const response = await axiosInstance.post(url, data.body, {
      headers: {
        "Content-Type": contentType,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPost:", {
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Return a structured error object instead of throwing
    return {
      status: false,
      message: error.response?.data?.message || error.message || "Error in API call",
      error: error.response?.data || error.message
    };
  }
};

export const fetchAuthFilePost = async (url, data) => {
  try {
    const response = await axiosInstance.post(url, data.body);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthFilePost:", error);
    throw new Error("Error in API call");
  }
};

// GET with authorization token
export const fetchAuthGET = async (url, useCache = true) => {
  try {
    if (useCache) {
      const cachedData = cacheApi.get(url);
      if (cachedData) {
        return cachedData;
      }
    }

    const response = await axiosInstance.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (useCache) {
      cacheApi.set(url, response.data);
    }

    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthGET:", error);
    return { error: true, message: error.message, status: error.response?.status };
  }
};

// PUT with authorization token
export const fetchAuthPut = async (url, data) => {
  try {
    const response = await axiosInstance.put(url, data.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPut:", {
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    // Return a structured error object instead of throwing
    return {
      status: false,
      message: error.response?.data?.message || error.message || "Error in API call",
      error: error.response?.data || error.message
    };
  }
};

export const fetchAuthFilePut = async (url, data) => {
  try {
    const response = await axiosInstance.put(url, data.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthFilePut:", error);
    throw new Error("Error in API call");
  }
};

// PUT with authorization token
export const fetchAuthPutFile = async (url, data) => {
  try {
    const response = await axiosInstance.put(url, data.body);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPutFile:", error);
    throw new Error("Error in API call");
  }
};

export const fetchAuthPatch = async (url, data) => {
  try {
    const response = await axiosInstance.patch(url, data.body);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPatch:", {
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {
      error: true,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    };
  }
};

// my method sumit
export const fetchAuthPatchSumit = async (url, data) => {
  try {
    const contentType = data.contentType || "application/json";

    const response = await axiosInstance.patch(url, data.body, {
      headers: {
        "Content-Type": contentType,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPatchSumit:", {
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {
      error: true,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    };
  }
};


export const fetchAuthPatchFile = async (url, data) => {
  try {
    const response = await axiosInstance.patch(url, data.body);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAuthPatchFile:", error);
    return error;
  }
};

// DELETE with authorization token
export const fetchDelete = async (url) => {
  try {
    const response = await axiosInstance.delete(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchDelete:", error);
    return error;
  }
};

// DELETE with authentication (alias for fetchDelete to maintain consistent naming)
export const fetchAuthDelete = async (url) => {
  try {
    const response = await axiosInstance.delete(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Delete request failed:", error.response || error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// DELETE with authentication and request body
export const fetchAuthDeleteWithBody = async (url, data) => {
  try {
    const response = await axiosInstance.delete(url, {
      headers: {
        "Content-Type": "application/json",
      },
      data: data.body, // Add the request body to the delete request
    });
    return response.data;
  } catch (error) {
    console.error("Delete with body request failed:", error.response || error);
    return {
      status: false,
      message: error.response?.data?.message || error.message || "Error in API call",
      error: error.response?.data || error.message
    };
  }
};

export const deleteAPI = async (endpoint, data) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in deleteAPI:", error);
    return error.response?.data || error;
  }
};

export const isAdmin = () => {
  const userInfoString = Cookies.get("userInfo");
  if (!userInfoString) {
    // If userInfoString is undefined, null, or an empty string, return false
    return false;
  }

  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo?.isAdmin || false;
  } catch (error) {
    // Handle the error or return false if JSON parsing fails
    return false;
  }
};

// Post Data with authorization token
export const postAPI = async (endpoint, data) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.post(url, data.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in postAPI:", error);
    return error;
  }
};
// Post Data with authorization token for file uploads
export const postAPIFiles = async (endpoint, data) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.post(url, data.body, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in postAPIFiles:", error);
    return error;
  }
};
// Get Data with authorization token
export const fetchAPI = async (endpoint) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAPI:", error);
    return error;
  }
};
export const fetchAPIOption = async (endpoint, options = {}) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    // Merge with provided options
    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
      },
    };
    const response = await axiosInstance.get(url, requestOptions);
    return response.data;
  } catch (error) {
    console.error("Error in fetchAPIOption:", error);
    return error.response ? error.response.data : { error: error.message };
  }
};
// Patch Data with authorization token
export const patchAPI = async (endpoint, data) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.patch(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in patchAPI:", error);
    throw error; // Rethrow or handle as needed
  }
};

export const patchUpdateAPI = async (endpoint, { body }) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    const response = await axiosInstance.patch(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error during patchUpdateAPI:", error);
    throw error;
  }
};

export const fetchJsonAuthPatch = async (url, data) => {
  try {
    const response = await axiosInstance.patch(url, data.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in fetchJsonAuthPatch:", error);
    return error;
  }
};

export const exportToCSV = (data, filename, selectedCols, newHeaders) => {
  const csvRows = [];

  // Create the header row using new headers
  csvRows.push(newHeaders.join(","));

  for (const row of data) {
    // Create a row with only the selected columns
    const values = selectedCols.map((col) => {
      const value = row[col];
      // Enclose values in double quotes if they contain commas
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const uploadtoS3 = async (
  uploadUrl,
  companyId,
  userId,
  taskId,
  folder,
  name,
  file,
) => {
  const getPresignedUrl = async () => {
    try {
      const raw = JSON.stringify({
        fileName: `${companyId}/${userId}/${taskId}/${folder}/${name}`,
        fileType: file.type,
      });


      const response = await fetch(uploadUrl, {
        method: "POST",
        body: raw,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to get presigned URL:", errorText);
        throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data.url;
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      throw error;
    }
  };

  try {
    const presignedUrl = await getPresignedUrl();

    

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "max-age=31536000", // 1 year cache
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("S3 upload failed:", errorText);
      throw new Error(`Image upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Extract the direct URL without query parameters
    const directUrl = presignedUrl.split("?")[0];
  
    return directUrl;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

export const fetchAuthAPI = async (endpoint, authToken) => {
  const url = `${apiBaseURL}/${endpoint}`;
  try {
    // If a specific auth token is provided, use regular axios (not interceptor)
    // Otherwise use the axios instance with interceptors
    if (authToken) {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        withCredentials: true,
      });
      return response.data;
    } else {
      const response = await axiosInstance.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    }
  } catch (error) {
    console.error("Error in fetchAuthAPI:", error);
    return error;
  }
};

export const askChatGPT = async (inputText) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      { model: "gpt-4o-mini", messages: [{ role: "user", content: `${inputText}` }] },
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_APP_CHATGPT_API_KEY}`,
        },
      },
    );

    return response;
  } catch (error) {
    return error;
  }
};
