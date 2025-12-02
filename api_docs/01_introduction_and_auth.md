# PW Pulse API: Introduction and Authentication

## Overview

This document provides information about the PW Pulse Django backend API's authentication, error handling, and general conventions.

## Authentication

The API uses token-based authentication. Most endpoints require an authentication token to be included in the request header.

### Authentication Header Format

```
Authorization: Token <your_token_here>
```

## Base URL

All API endpoints are relative to the base URL of your deployment.

## Authentication Endpoints

### Login

- **URL**: `/login/`
- **Method**: `POST`
- **Description**: Authenticates an employee and returns a token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "your_auth_token",
    "user": {
      "_id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "isAdmin": false,
      "companyId": 1
    }
  }
  ```

### Google Login

- **URL**: `/api/google-login/`
- **Method**: `POST`
- **Description**: Authenticates a user using Google OAuth
- **Request Body**:
  ```json
  {
    "token": "google_oauth_token"
  }
  ```
- **Response**: Similar to regular login

### Reset Password

- **URL**: `/reset/link/`
- **Method**: `POST`
- **Description**: Sends a password reset link to the user's email
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### Verify Reset Token and Set New Password

- **URL**: `/reset/verify/`
- **Method**: `POST`
- **Description**: Verifies reset token and sets new password
- **Request Body**:
  ```json
  {
    "token": "reset_token",
    "password": "new_password"
  }
  ```

## Error Handling

All API endpoints follow a consistent error handling pattern:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Error responses include a message explaining the error and, when applicable, validation details.

## Pagination

Endpoints that return lists of items support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `page_size`: Number of items per page (default: 10)

Paginated responses include:

```json
{
  "count": 100,
  "next": "https://api.example.com/endpoint?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtering and Sorting

Many list endpoints support filtering and sorting with query parameters:

- Filtering: `field_name=value`
- Sorting: `ordering=field_name` or `ordering=-field_name` (descending)

## Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the current window resets (Unix timestamp)

## Versioning

The API is currently at version 1. The version is implicit in the URL structure.

## Support

For API support, please contact the development team at support@example.com.

## Security Considerations

- All API endpoints that handle sensitive data use HTTPS
- Authentication is required for most endpoints
- Input validation is performed on all endpoints
- Rate limiting is applied to prevent abuse
- CORS is configured to allow requests only from trusted origins
