# PW Pulse API: Communication and Integrations

## Notification Management

### Notifications by Recipient

- **URL**: `/notifications/recipient/<int:recipient_id>/`
- **Method**: `GET`
- **Description**: Lists all notifications for a recipient
- **URL Parameters**: `recipient_id` - ID of the recipient
- **Response**: List of notifications with details

### New Notifications by Recipient

- **URL**: `/notifications/new/recipient/<int:recipient_id>/`
- **Method**: `GET`
- **Description**: Lists unread notifications for a recipient
- **URL Parameters**: `recipient_id` - ID of the recipient
- **Response**: List of unread notifications with details

### Mark Notification as Read

- **URL**: `/api/notifications/read/<int:notification_id>/`
- **Method**: `POST`
- **Description**: Marks a notification as read
- **URL Parameters**: `notification_id` - ID of the notification
- **Response**: Updated notification details

### Mark All Notifications as Read

- **URL**: `/mark_notifications_as_read/<int:user_id>/`
- **Method**: `POST`
- **Description**: Marks all notifications for a user as read
- **URL Parameters**: `user_id` - ID of the user
- **Response**: Success message

## Chat Application

### Create Chat Group

- **URL**: `/chat/create-group/`
- **Method**: `POST`
- **Description**: Creates a new chat group
- **Request Body**:
  ```json
  {
    "name": "Group Name",
    "members": [1, 2, 3],
    "created_by": 1
  }
  ```
- **Response**: Created group details

### Send Group Message

- **URL**: `/chat/send-group-message/`
- **Method**: `POST`
- **Description**: Sends a message to a chat group
- **Request Body**:
  ```json
  {
    "group_id": 1,
    "sender_id": 1,
    "content": "Message content",
    "attachment": null
  }
  ```
- **Response**: Created message details

### Send Direct Message

- **URL**: `/chat/send-direct-message/`
- **Method**: `POST`
- **Description**: Sends a direct message to another user
- **Request Body**:
  ```json
  {
    "sender_id": 1,
    "receiver_id": 2,
    "content": "Message content",
    "attachment": null
  }
  ```
- **Response**: Created message details

### Fetch Group Messages

- **URL**: `/chat/fetch-group-messages/<int:group_id>/`
- **Method**: `GET`
- **Description**: Retrieves messages for a chat group
- **URL Parameters**: `group_id` - ID of the chat group
- **Response**: List of messages with details

### Fetch Direct Messages

- **URL**: `/chat/fetch-direct-messages/<int:sender_id>/<int:receiver_id>/`
- **Method**: `GET`
- **Description**: Retrieves direct messages between two users
- **URL Parameters**: 
  - `sender_id` - ID of the sender
  - `receiver_id` - ID of the receiver
- **Response**: List of messages with details

## Calendar Integration

### Google Calendar Auth

- **URL**: `/api/calendar/auth/`
- **Method**: `GET`
- **Description**: Initiates Google Calendar authentication flow
- **Response**: Redirect URL for Google OAuth

### Google Calendar Redirect

- **URL**: `/api/calendar/redirect/`
- **Method**: `GET`
- **Description**: Handles Google Calendar OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message

### Events by Date Range

- **URL**: `/api/calendar/events-by-date-range/`
- **Method**: `GET`
- **Description**: Retrieves calendar events within a date range
- **Query Parameters**: `start_date`, `end_date`
- **Response**: List of calendar events

### Create Event

- **URL**: `/api/calendar/create_event/`
- **Method**: `POST`
- **Description**: Creates a new calendar event
- **Request Body**:
  ```json
  {
    "summary": "Event Summary",
    "description": "Event Description",
    "start": "2023-12-25T10:00:00Z",
    "end": "2023-12-25T11:00:00Z",
    "attendees": ["user@example.com"]
  }
  ```
- **Response**: Created event details

## Asana Integration

### Asana Authorize

- **URL**: `/api/asana/oauth/authorize/`
- **Method**: `GET`
- **Description**: Initiates Asana authentication flow
- **Response**: Redirect URL for Asana OAuth

### Asana Callback

- **URL**: `/api/asana/oauth/callback/`
- **Method**: `GET`
- **Description**: Handles Asana OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message

### Fetch Workspaces

- **URL**: `/api/asana/workspaces/`
- **Method**: `GET`
- **Description**: Retrieves Asana workspaces
- **Response**: List of workspaces

### Fetch Projects

- **URL**: `/api/asana/workspaces/<str:workspace_id>/projects/`
- **Method**: `GET`
- **Description**: Retrieves Asana projects in a workspace
- **URL Parameters**: `workspace_id` - ID of the Asana workspace
- **Response**: List of projects

### Fetch Tasks

- **URL**: `/api/asana/projects/<str:project_id>/tasks/`
- **Method**: `GET`
- **Description**: Retrieves Asana tasks in a project
- **URL Parameters**: `project_id` - ID of the Asana project
- **Response**: List of tasks

## Slack Integration

### Slack Auth

- **URL**: `/slack/auth/`
- **Method**: `GET`
- **Description**: Initiates Slack authentication flow
- **Response**: Redirect URL for Slack OAuth

### Slack OAuth Callback

- **URL**: `/slack/oauth/callback/`
- **Method**: `GET`
- **Description**: Handles Slack OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message

### Slack Events

- **URL**: `/slack/events/`
- **Method**: `POST`
- **Description**: Handles Slack events
- **Request Body**: Slack event data
- **Response**: Acknowledgment

## WebSocket Endpoints

The application also provides real-time functionality through WebSockets.

### Chat WebSocket

- **URL**: `/ws/chat/<str:room_name>/`
- **Description**: WebSocket endpoint for real-time chat
- **Events**:
  - `message`: Sends a message to the chat room
  - `typing`: Indicates a user is typing
  - `read`: Marks messages as read

### Notification WebSocket

- **URL**: `/ws/notifications/<int:user_id>/`
- **Description**: WebSocket endpoint for real-time notifications
- **Events**:
  - `notification`: Sends a notification to the user

## Best Practices for Frontend Integration

1. **Authentication**: Store the authentication token securely and include it in all API requests.
2. **Error Handling**: Implement proper error handling for all API requests.
3. **Loading States**: Show loading indicators during API requests.
4. **Caching**: Cache responses where appropriate to reduce API calls.
5. **Pagination**: Implement pagination controls for list views.
6. **Real-time Updates**: Use WebSockets for real-time features.
7. **Form Validation**: Validate form inputs before submitting to the API.
8. **Responsive Design**: Ensure the UI works well on all device sizes.
