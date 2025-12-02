# API Utilities Documentation

This document provides information on how to use the standardized API utilities in this project.

## Table of Contents
- [Introduction](#introduction)
- [Available Hooks](#available-hooks)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [Non-Hook API Calls](#non-hook-api-calls)
- [Migration Guide](#migration-guide)

## Introduction

The API utilities provide a standardized way to make API calls throughout the application, with built-in:
- Loading states
- Error handling
- Caching
- Authentication
- Consistent response format

## Available Hooks

The following hooks are available:

- `useGet(endpoint, options)`: For GET requests
- `usePost(endpoint, options)`: For POST requests
- `usePut(endpoint, options)`: For PUT requests
- `usePatch(endpoint, options)`: For PATCH requests
- `useDelete(endpoint, options)`: For DELETE requests
- `useApi(options)`: Advanced hook for custom requests

For one-off API calls without hooks:
- `apiRequest(options)`: Promise-based API call

## Basic Usage

### GET Example
```jsx
import { useGet } from '@/utils/useApi';

function MyComponent() {
  const { 
    data, 
    loading, 
    error, 
    refresh 
  } = useGet('api/projects');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### POST Example
```jsx
import { usePost } from '@/utils/useApi';

function CreateForm() {
  const {
    loading,
    error,
    fetchData: createProject
  } = usePost('api/projects');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      name: e.target.name.value,
      description: e.target.description.value
    };
    
    const result = await createProject({}, formData);
    
    if (!result.isError) {
      // Success!
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

## Advanced Usage

### With Query Parameters
```jsx
const { data } = useGet('api/projects', {
  params: {
    status: 'active',
    sortBy: 'date',
    page: 1
  }
});
```

### With Custom URL
```jsx
const { data } = useGet(null, {
  url: 'https://api.example.com/data',
  useAuth: false
});
```

### File Upload
```jsx
const { fetchData } = usePost('api/upload', {
  useCache: false
});

const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  await fetchData({}, formData);
};
```

## Error Handling

All hooks provide standardized error objects:

```jsx
const { error } = useGet('api/data');

// Error structure:
// {
//   message: 'User-friendly error message',
//   status: 404, // HTTP status code if available
//   data: {...}, // Original error response data
//   isError: true
// }
```

## Caching

GET requests are cached by default. You can control caching behavior:

```jsx
// Disable caching
const { data } = useGet('api/data', { useCache: false });

// Custom cache TTL (milliseconds)
const { data } = useGet('api/data', { cacheTTL: 60000 }); // 1 minute

// Clear cache and refresh
const { clearCache, refresh } = useGet('api/data');
```

## Non-Hook API Calls

For one-off API calls:

```jsx
import { apiRequest } from '@/utils/useApi';

const handleAction = async () => {
  try {
    const data = await apiRequest({
      endpoint: 'api/projects/123/archive',
      method: 'PATCH'
    });
    
    // Success!
  } catch (error) {
    // Handle error
    console.error(error.message);
  }
};
```

## Migration Guide

### From Direct fetch/axios:

Before:
```javascript
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${baseURL}/api/data`);
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

After:
```javascript
const { data, loading, error } = useGet('api/data');
```

### From Old apiSlice.js Utilities:

Before:
```javascript
const fetchData = async () => {
  try {
    const data = await fetchAuthGET(`${apiBaseURL}/api/data`);
    setData(data);
  } catch (error) {
    console.error(error);
  }
};
```

After:
```javascript
const { data, loading, error } = useGet('api/data');
```

Or for non-hook use:
```javascript
const handleAction = async () => {
  try {
    const data = await apiRequest({
      endpoint: 'api/data',
      useAuth: true
    });
    // Use data
  } catch (error) {
    // Handle error
  }
};
```