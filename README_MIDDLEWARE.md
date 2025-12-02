# JWT Authentication Middleware

This middleware provides JWT-based authentication with automatic token refresh functionality for Django REST Framework applications.

## Features

- ✅ **JWT Token Authentication** - Validates access tokens
- ✅ **Automatic Token Refresh** - Refreshes expired access tokens using refresh tokens
- ✅ **Cookie Support** - HTTP-only cookies for secure token storage
- ✅ **Dual Token Sources** - Supports both header and cookie-based refresh tokens
- ✅ **Smart Cookie Management** - Sets cookies only when tokens are refreshed
- ✅ **Public Endpoint Support** - Skip authentication for public endpoints
- ✅ **Employee Model Integration** - Works with custom Employee model using `_id` field
- ✅ **Error Handling** - Comprehensive error responses with error codes
- ✅ **DRF Bypass** - Completely bypasses Django REST Framework authentication

## How It Works

### 1. Token Flow
```
Frontend Request → Middleware → Token Validation → Response
     ↓
[Access Token + Refresh Token] → [Validate/Refresh] → [New Tokens + Data]
```

### 2. Authentication Process
1. **Extract Tokens**: Gets access token from `Authorization` header and refresh token from `X-Refresh-Token` header or cookie
2. **Validate Access Token**: Checks if access token is valid and not expired
3. **Auto Refresh**: If access token is expired, uses refresh token to generate new tokens
4. **Cookie Setting**: Sets new tokens in HTTP-only cookies ONLY when refresh happens
5. **User Authentication**: Validates user exists and is active
6. **Request Processing**: Sets user in request and continues to view

## Configuration

### Headers Required
```http
Authorization: Bearer <access_token>
X-Refresh-Token: <refresh_token>  # Optional - can use cookie instead
```

### Cookies Required (Alternative)
```http
Authorization: Bearer <access_token>
Cookie: refresh_token=<refresh_token>  # HTTP-only cookie
```

### Public Endpoints
The following endpoints skip authentication:
- `/login/`
- `/refresh-token-log/`
- `/google-login/`
- `/apple-login/`
- `/userlogin/`
- `/google-userlogin/`
- `/token-login/`
- `/otp-login/`
- `/company/`
- `/admin/`
- `/swagger/`
- `/redoc/`
- `/api/schema/`
- `/api/google-userlogin/`
- `/verify-email/`
- `/media/`
- `/static/`
- `/live-activity/`
- `/user-task-summary/`

## Response Formats

### Successful Authentication
```json
{
    "status": 1,
    "message": "Token refreshed successfully",
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "user": {
        "id": 804,
        "email": "user@example.com",
        "name": "User Name"
    }
}
```

### Error Responses
```json
{
    "status": 0,
    "message": "Error description",
    "error_code": "ERROR_CODE"
}
```

## Error Codes

| Error Code | Description |
|------------|-------------|
| `NO_ACCESS_TOKEN` | No access token provided |
| `TOKEN_EXPIRED_NO_REFRESH` | Access token expired and no refresh token provided |
| `INVALID_ACCESS_TOKEN` | Invalid access token format |
| `ACCESS_TOKEN_DECODE_FAILED` | Failed to decode access token |
| `REFRESH_FAILED` | Token refresh failed |
| `USER_INACTIVE` | User account is inactive |
| `USER_NOT_FOUND` | User not found in database |
| `AUTH_FAILED` | General authentication failure |

## Frontend Integration

### JavaScript Example (Header-based)
```javascript
// API call function with automatic token refresh
const apiCall = async (url, options = {}) => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Refresh-Token': refreshToken,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // Check if token was refreshed
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');
  
  if (newAccessToken && newRefreshToken) {
    // Update tokens in localStorage
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    
    // If this was a token refresh response, retry the original request
    if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      if (data.status === 1 && data.message === 'Token refreshed successfully') {
        // Retry the original request with new token
        return apiCall(url, options);
      }
    }
  }
  
  return response;
};

// Usage example
const fetchUserData = async () => {
  try {
    const response = await apiCall('/api/user/profile/');
    const data = await response.json();
    console.log('User data:', data);
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

### JavaScript Example (Cookie-based - More Secure)
```javascript
// API call function with cookie-based authentication
const apiCall = async (url, options = {}) => {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: Include cookies in request
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // Check if token was refreshed
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');
  
  if (newAccessToken && newRefreshToken) {
    // Update access token in localStorage (refresh token is in HTTP-only cookie)
    localStorage.setItem('access_token', newAccessToken);
    
    // If this was a token refresh response, retry the original request
    if (response.status === 200 && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      if (data.status === 1 && data.message === 'Token refreshed successfully') {
        // Retry the original request with new token
        return apiCall(url, options);
      }
    }
  }
  
  return response;
};

// Login function that sets cookies
const login = async (email, password) => {
  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      credentials: 'include', // Important: Include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.status === 1) {
      // Store access token (refresh token is in HTTP-only cookie)
      localStorage.setItem('access_token', data.access_token);
      console.log('Login successful');
    }
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Logout function that clears cookies
const logout = async () => {
  try {
    const response = await fetch('/api/logout/', {
      method: 'POST',
      credentials: 'include', // Important: Include cookies in request
    });
    
    // Clear access token from localStorage
    localStorage.removeItem('access_token');
    
    const data = await response.json();
    console.log('Logout successful');
    return data;
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Refresh-Token': refreshToken,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // Handle token refresh
      const newAccessToken = response.headers.get('X-New-Access-Token');
      const newRefreshToken = response.headers.get('X-New-Refresh-Token');
      
      if (newAccessToken && newRefreshToken) {
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        
        if (response.status === 200) {
          const data = await response.json();
          if (data.status === 1 && data.message === 'Token refreshed successfully') {
            return apiCall(url, options);
          }
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
};

export default useApiCall;
```

## Django Settings

### Required Settings
```python
# settings.py
REST_FRAMEWORK = {
    # Disable global authentication to use middleware
    # 'DEFAULT_AUTHENTICATION_CLASSES': [],
    # 'DEFAULT_PERMISSION_CLASSES': [],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'SIGNING_KEY': SECRET_KEY,
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}

# Use custom user model
AUTH_USER_MODEL = 'api.Employee'
```

### Middleware Configuration
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'api.middleware.JWTAuthenticationMiddleware',  # Add this
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## Model Requirements

### Employee Model
Your Employee model should have:
```python
class Employee(models.Model):
    _id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    isActive = models.BooleanField(default=True)
    # ... other fields
```

## Logging

The middleware provides detailed logging for debugging:
- Token validation attempts
- User authentication status
- Token refresh operations
- Error conditions

Logs are written to the configured logger with `INFO` and `ERROR` levels.

## Security Considerations

### Cookie-based Authentication (Recommended)
1. **HTTP-only Cookies**: Refresh tokens stored in HTTP-only cookies (not accessible via JavaScript)
2. **Secure Cookies**: Only send cookies over HTTPS in production
3. **SameSite Protection**: CSRF protection with SameSite=Lax
4. **Token Rotation**: Automatic refresh token rotation on each refresh
5. **Access Token Storage**: Store access tokens in localStorage (short-lived)

### Header-based Authentication
1. **Token Storage**: Store tokens securely in frontend (localStorage/sessionStorage)
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiry**: Set appropriate token lifetimes
4. **Refresh Token Rotation**: Enable refresh token rotation
5. **User Validation**: Always validate user exists and is active

### General Security
1. **HTTPS Only**: Always use HTTPS in production
2. **Token Expiry**: Set appropriate token lifetimes (1 hour for access, 7 days for refresh)
3. **User Validation**: Always validate user exists and is active
4. **Logging**: Monitor authentication attempts and failures
5. **Error Handling**: Don't expose sensitive information in error messages

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Check if Employee model has `_id` field
   - Verify user exists in database
   - Check JWT settings `USER_ID_CLAIM`

2. **"Token decode failed" error**
   - Verify `SECRET_KEY` in settings
   - Check token format and encoding
   - Ensure token is not corrupted

3. **"Refresh failed" error**
   - Check refresh token validity
   - Verify refresh token hasn't expired
   - Ensure refresh token is properly formatted

4. **Middleware not working**
   - Check middleware order in settings
   - Verify middleware is properly installed
   - Check for syntax errors in middleware code

5. **Cookies not being set**
   - Check if `credentials: 'include'` is set in frontend requests
   - Verify CORS settings allow credentials
   - Check if HTTPS is enabled in production

### Debug Mode
Enable debug logging to see detailed middleware operations:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'api.middleware': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## API Examples

### Login Response
```json
{
    "status": 1,
    "message": "Login successful",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 804,
        "email": "user@example.com",
        "name": "User Name"
    }
}
```

### Token Refresh Response
```json
{
    "status": 1,
    "message": "Token refreshed successfully",
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "user": {
        "id": 804,
        "email": "user@example.com",
        "name": "User Name"
    }
}
```

### Error Response
```json
{
    "status": 0,
    "message": "Access token expired and no refresh token provided. Please login again.",
    "error_code": "TOKEN_EXPIRED_NO_REFRESH"
}
```

## Middleware Methods

### Core Methods

#### `__call__(self, request)`
Main middleware entry point that processes each request.

#### `is_public_endpoint(self, path)`
Checks if the requested path is in the public endpoints list.

#### `authenticate_request(self, request)`
Main authentication logic that handles token validation and refresh.

#### `_refresh_access_token(self, refresh_token, request)`
Handles token refresh when access token is expired.

#### `_authenticate_user(self, user_id, request)`
Authenticates user and sets request attributes.

### Helper Methods

#### `set_auth_cookies(self, response, access_token, refresh_token)`
Sets authentication cookies for login responses.

#### `set_refresh_cookies(self, response, access_token, refresh_token, user)`
Sets cookies ONLY when tokens are refreshed (not on every request).

## Performance Considerations

1. **Cookie Setting**: Cookies are only set when tokens are refreshed, not on every request
2. **Token Validation**: Access tokens are validated on every request
3. **Database Queries**: User lookup happens only when needed
4. **Logging**: Detailed logging can be disabled in production

## Version History

- **v1.0** - Initial implementation with basic JWT authentication
- **v2.0** - Added automatic token refresh functionality
- **v2.1** - Enhanced error handling and logging
- **v2.2** - Added public endpoint support and DRF bypass
- **v2.3** - Added cookie-based authentication support
- **v2.4** - Smart cookie management (cookies only on refresh)

## Support

For issues or questions regarding this middleware, please check:
1. Django logs for detailed error messages
2. Middleware configuration in settings.py
3. Token format and validity
4. User model structure and data
5. CORS and cookie settings

---

**Note**: This middleware is designed to work with Django REST Framework and requires proper configuration of JWT settings and user model.
