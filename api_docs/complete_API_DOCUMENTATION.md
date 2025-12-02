# PW Pulse Django API Documentation

## Overview

This document provides comprehensive documentation for the PW Pulse Django backend API. It is intended for frontend developers to understand and integrate with the available endpoints.

## Authentication

The API uses token-based authentication. Most endpoints require an authentication token to be included in the request header.

### Authentication Header Format

```
Authorization: Token <your_token_here>
```

## Base URL

All API endpoints are relative to the base URL of your deployment.

## API Endpoints

### Authentication & User Management

#### Login

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
- **Logic**: Validates credentials, generates authentication token, returns user details

#### Google Login

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
- **Logic**: Verifies Google token, finds or creates user account, returns authentication token

#### Reset Password

- **URL**: `/reset/link/`
- **Method**: `POST`
- **Description**: Sends a password reset link to the user's email
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**: Success message
- **Logic**: Validates email, generates reset token, sends email with reset link

#### Verify Reset Token and Set New Password

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
- **Response**: Success message
- **Logic**: Validates token, updates password, invalidates token

### Company Management

#### Company Detail

- **URL**: `/dashboard/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: Company details including projects, employees, and statistics
- **Logic**: Fetches company record, aggregates related data, calculates statistics

#### Update Company

- **URL**: `/company/<int:company_id>/update/`
- **Method**: `PUT`
- **Description**: Updates company information
- **URL Parameters**: `company_id` - ID of the company
- **Request Body**: Company data to update
- **Response**: Updated company details
- **Logic**: Validates input, updates company record

#### Add Company Logo

- **URL**: `/api/company/<int:pk>/add_logo/`
- **Method**: `POST`
- **Description**: Uploads and sets a company logo
- **URL Parameters**: `pk` - ID of the company
- **Request Body**: Form data with image file
- **Response**: Updated company details with logo URL
- **Logic**: Validates image, processes upload, updates company record

### Employee Management

#### Employee List

- **URL**: `/employee/list/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all employees in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of employees with their details
- **Logic**: Queries employees by company ID, formats response

#### Employee Detail

- **URL**: `/employee/me/<int:_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about an employee
- **URL Parameters**: `_id` - ID of the employee
- **Response**: Detailed employee information
- **Logic**: Fetches employee record, includes related data

#### Create Employee

- **URL**: `/employee/add/`
- **Method**: `POST`
- **Description**: Creates a new employee
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "companyId": 1,
    "isAdmin": false
  }
  ```
- **Response**: Created employee details
- **Logic**: Validates input, creates employee record, sends welcome email

#### Update Employee

- **URL**: `/employee/<int:_id>/`
- **Method**: `PUT`
- **Description**: Updates employee information
- **URL Parameters**: `_id` - ID of the employee
- **Request Body**: Employee data to update
- **Response**: Updated employee details
- **Logic**: Validates input, updates employee record

#### Delete Employee

- **URL**: `/employee/<int:_id>/`
- **Method**: `DELETE`
- **Description**: Deactivates an employee (soft delete)
- **URL Parameters**: `_id` - ID of the employee
- **Response**: Success message
- **Logic**: Sets employee as inactive rather than deleting the record

### Project Management

#### Project List by Company

- **URL**: `/project/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all projects for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of projects with basic details
- **Logic**: Queries projects by company ID, formats response

#### Project List with Pagination

- **URL**: `/projects/pagination/company/<int:company_id>/projects/`
- **Method**: `GET`
- **Description**: Lists projects with pagination
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `page`, `page_size`
- **Response**: Paginated list of projects
- **Logic**: Queries projects, applies pagination, formats response

#### Project Detail

- **URL**: `/projects/detail/<int:project_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a project
- **URL Parameters**: `project_id` - ID of the project
- **Response**: Detailed project information including tasks and assignees
- **Logic**: Fetches project record, includes related data

#### Create Project

- **URL**: `/project/`
- **Method**: `POST`
- **Description**: Creates a new project
- **Request Body**:
  ```json
  {
    "name": "Project Name",
    "description": "Project Description",
    "companyId": 1,
    "client": 1,
    "dueDate": "2023-12-31T00:00:00Z",
    "priority": "medium",
    "project_leader": 1,
    "assignee": [1, 2, 3]
  }
  ```
- **Response**: Created project details
- **Logic**: Validates input, creates project record, assigns team members

#### Update Project

- **URL**: `/project/<int:_id>/`
- **Method**: `PUT`
- **Description**: Updates project information
- **URL Parameters**: `_id` - ID of the project
- **Request Body**: Project data to update
- **Response**: Updated project details
- **Logic**: Validates input, updates project record

#### Delete Project

- **URL**: `/api/project/delete/<int:_id>/`
- **Method**: `DELETE`
- **Description**: Deletes a project
- **URL Parameters**: `_id` - ID of the project
- **Response**: Success message
- **Logic**: Validates permissions, deletes project record

### Task Management

#### Create Task

- **URL**: `/create-task/<int:assignby_id>/`
- **Method**: `POST`
- **Description**: Creates a new task
- **URL Parameters**: `assignby_id` - ID of the employee creating the task
- **Request Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task Description",
    "project": 1,
    "assignee": 2,
    "dueDate": "2023-12-31T00:00:00Z",
    "priority": "medium",
    "estimated_time": 8
  }
  ```
- **Response**: Created task details
- **Logic**: Validates input, creates task record, sends notifications

#### Create Task with File

- **URL**: `/api/create-task/file/<int:assignby_id>/`
- **Method**: `POST`
- **Description**: Creates a new task with attached files
- **URL Parameters**: `assignby_id` - ID of the employee creating the task
- **Request Body**: Form data with task details and files
- **Response**: Created task details with file information
- **Logic**: Validates input, creates task record, processes file uploads

#### Tasks by Project

- **URL**: `/task/project/<int:project_id>/`
- **Method**: `GET`
- **Description**: Lists all tasks for a project
- **URL Parameters**: `project_id` - ID of the project
- **Response**: List of tasks with details
- **Logic**: Queries tasks by project ID, formats response

#### Tasks by Project and User

- **URL**: `/api/tasks_by_project_user/<int:project_id>/<int:user_id>/`
- **Method**: `GET`
- **Description**: Lists tasks for a specific project assigned to a specific user
- **URL Parameters**: 
  - `project_id` - ID of the project
  - `user_id` - ID of the user
- **Response**: List of tasks with details
- **Logic**: Queries tasks by project ID and assignee ID, formats response

#### Update Task

- **URL**: `/task/<int:pk>/<int:userId>/`
- **Method**: `PUT`
- **Description**: Updates task information
- **URL Parameters**: 
  - `pk` - ID of the task
  - `userId` - ID of the user making the update
- **Request Body**: Task data to update
- **Response**: Updated task details
- **Logic**: Validates input, updates task record, logs changes

#### Update Task Status

- **URL**: `/update_task_status/<int:taskId>/`
- **Method**: `PUT`
- **Description**: Updates the completion status of a task
- **URL Parameters**: `taskId` - ID of the task
- **Request Body**:
  ```json
  {
    "status": "completed"
  }
  ```
- **Response**: Updated task details
- **Logic**: Validates input, updates task status, logs changes

### Task Logs and Time Tracking

#### Create Task Log

- **URL**: `/create_task_log/`
- **Method**: `POST`
- **Description**: Logs time spent on a task
- **Request Body**:
  ```json
  {
    "task": 1,
    "employee": 1,
    "hours_spent": 2.5,
    "description": "Implemented feature X"
  }
  ```
- **Response**: Created task log details
- **Logic**: Validates input, creates task log record

#### Task Logs by Task

- **URL**: `/taskLogs/task/<int:taskId>/`
- **Method**: `GET`
- **Description**: Lists all time logs for a specific task
- **URL Parameters**: `taskId` - ID of the task
- **Response**: List of task logs with details
- **Logic**: Queries task logs by task ID, formats response

#### Task Total Hours

- **URL**: `/task/user/<int:user_id>/`
- **Method**: `GET`
- **Description**: Retrieves total hours logged by a user across all tasks
- **URL Parameters**: `user_id` - ID of the user
- **Response**: Total hours and breakdown by task
- **Logic**: Aggregates task log hours by user ID, formats response

### Client Management

#### Client List by Company

- **URL**: `/api/clients/by_company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all clients for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of clients with details
- **Logic**: Queries clients by company ID, formats response

#### Create Client

- **URL**: `/api/clients/create/`
- **Method**: `POST`
- **Description**: Creates a new client
- **Request Body**:
  ```json
  {
    "clientName": "Client Name",
    "contact_person": "Contact Person",
    "email": "client@example.com",
    "phone": "1234567890",
    "address": "Client Address",
    "companyId": 1,
    "pay_per_month": 1000.00
  }
  ```
- **Response**: Created client details
- **Logic**: Validates input, creates client record

#### Client Detail

- **URL**: `/api/client/<int:client_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a client
- **URL Parameters**: `client_id` - ID of the client
- **Response**: Detailed client information
- **Logic**: Fetches client record, includes related data

#### Update Client

- **URL**: `/api/update/client/<int:client_id>/`
- **Method**: `PUT`
- **Description**: Updates client information
- **URL Parameters**: `client_id` - ID of the client
- **Request Body**: Client data to update
- **Response**: Updated client details
- **Logic**: Validates input, updates client record

#### Delete Client

- **URL**: `/api/client/delete/<int:pk>/`
- **Method**: `DELETE`
- **Description**: Deletes a client
- **URL Parameters**: `pk` - ID of the client
- **Response**: Success message
- **Logic**: Validates permissions, deletes client record

### Team Management

#### Company Teams

- **URL**: `/company/<int:company_id>/teams/list/`
- **Method**: `GET`
- **Description**: Lists all teams in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of teams with members
- **Logic**: Queries teams by company ID, includes team members, formats response

#### Team Details

- **URL**: `/teams/<int:team_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a team
- **URL Parameters**: `team_id` - ID of the team
- **Response**: Detailed team information including members
- **Logic**: Fetches team record, includes team members, formats response

#### Create Team

- **URL**: `/teams/create/<int:leader_id>/`
- **Method**: `POST`
- **Description**: Creates a new team
- **URL Parameters**: `leader_id` - ID of the team leader
- **Request Body**:
  ```json
  {
    "name": "Team Name",
    "members": [1, 2, 3]
  }
  ```
- **Response**: Created team details
- **Logic**: Validates input, creates team record, assigns members

#### Update Team

- **URL**: `/api/update/team/<int:pk>/<int:employee_id>/`
- **Method**: `PUT`
- **Description**: Updates team information
- **URL Parameters**: 
  - `pk` - ID of the team
  - `employee_id` - ID of the employee making the update
- **Request Body**: Team data to update
- **Response**: Updated team details
- **Logic**: Validates permissions, updates team record

#### Add Team Member

- **URL**: `/team/<int:team_id>/add_member/<int:member_id>/`
- **Method**: `POST`
- **Description**: Adds a member to a team
- **URL Parameters**: 
  - `team_id` - ID of the team
  - `member_id` - ID of the employee to add
- **Response**: Updated team details
- **Logic**: Validates input, adds member to team

#### Remove Team Member

- **URL**: `/team/<int:team_id>/remove_member/<int:member_id>/`
- **Method**: `DELETE`
- **Description**: Removes a member from a team
- **URL Parameters**: 
  - `team_id` - ID of the team
  - `member_id` - ID of the employee to remove
- **Response**: Updated team details
- **Logic**: Validates input, removes member from team

### Leave Management

#### Leave List by Company

- **URL**: `/company/<int:company_id>/leaves/`
- **Method**: `GET`
- **Description**: Lists all leaves in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of leaves with details
- **Logic**: Queries leaves by company ID, formats response

#### Employee Leaves

- **URL**: `/employee/<int:employee_id>/leaves/`
- **Method**: `GET`
- **Description**: Lists all leaves for an employee
- **URL Parameters**: `employee_id` - ID of the employee
- **Response**: List of leaves with details
- **Logic**: Queries leaves by employee ID, formats response

#### Create Leave

- **URL**: `/leave-create/<int:employee_id>/`
- **Method**: `POST`
- **Description**: Creates a new leave request
- **URL Parameters**: `employee_id` - ID of the employee
- **Request Body**:
  ```json
  {
    "start_date": "2023-12-25",
    "end_date": "2023-12-31",
    "reason": "Vacation",
    "leave_type": "paid"
  }
  ```
- **Response**: Created leave details
- **Logic**: Validates input, creates leave record

#### Approve Leave

- **URL**: `/leave/approve/<int:leave_id>/by/<int:approver_employee_id>/`
- **Method**: `POST`
- **Description**: Approves a leave request
- **URL Parameters**: 
  - `leave_id` - ID of the leave
  - `approver_employee_id` - ID of the approver
- **Response**: Updated leave details
- **Logic**: Validates permissions, updates leave status, sends notifications

#### Reject Leave

- **URL**: `/leave/reject/<int:leave_id>/by/<int:approver_employee_id>/`
- **Method**: `POST`
- **Description**: Rejects a leave request
- **URL Parameters**: 
  - `leave_id` - ID of the leave
  - `approver_employee_id` - ID of the approver
- **Response**: Updated leave details
- **Logic**: Validates permissions, updates leave status, sends notifications

### Notification Management

#### Notifications by Recipient

- **URL**: `/notifications/recipient/<int:recipient_id>/`
- **Method**: `GET`
- **Description**: Lists all notifications for a recipient
- **URL Parameters**: `recipient_id` - ID of the recipient
- **Response**: List of notifications with details
- **Logic**: Queries notifications by recipient ID, formats response

#### New Notifications by Recipient

- **URL**: `/notifications/new/recipient/<int:recipient_id>/`
- **Method**: `GET`
- **Description**: Lists unread notifications for a recipient
- **URL Parameters**: `recipient_id` - ID of the recipient
- **Response**: List of unread notifications with details
- **Logic**: Queries unread notifications by recipient ID, formats response

#### Mark Notification as Read

- **URL**: `/api/notifications/read/<int:notification_id>/`
- **Method**: `POST`
- **Description**: Marks a notification as read
- **URL Parameters**: `notification_id` - ID of the notification
- **Response**: Updated notification details
- **Logic**: Updates notification read status

#### Mark All Notifications as Read

- **URL**: `/mark_notifications_as_read/<int:user_id>/`
- **Method**: `POST`
- **Description**: Marks all notifications for a user as read
- **URL Parameters**: `user_id` - ID of the user
- **Response**: Success message
- **Logic**: Updates read status for all user notifications

### Screenshot Management

#### Screenshots by Task

- **URL**: `/screenshot/task/<int:task_id>/employee/<int:employee_id>/`
- **Method**: `GET`
- **Description**: Lists screenshots for a specific task by an employee
- **URL Parameters**: 
  - `task_id` - ID of the task
  - `employee_id` - ID of the employee
- **Response**: List of screenshots with details
- **Logic**: Queries screenshots by task ID and employee ID, formats response

#### Create Screenshot

- **URL**: `/screenshot/`
- **Method**: `POST`
- **Description**: Creates a new screenshot record
- **Request Body**: Form data with screenshot image and metadata
- **Response**: Created screenshot details
- **Logic**: Processes image upload, creates screenshot record

#### Delete Screenshot

- **URL**: `/screenshot/<int:screenshot_id>/`
- **Method**: `DELETE`
- **Description**: Deletes a screenshot
- **URL Parameters**: `screenshot_id` - ID of the screenshot
- **Response**: Success message
- **Logic**: Validates permissions, deletes screenshot record

### Reporting

#### Task Data Between Dates

- **URL**: `/task/period/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves task data for a company between specified dates
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Task data aggregated by date
- **Logic**: Queries tasks within date range, aggregates data, formats response

#### Export CSV Report

- **URL**: `/report/company/<int:company_id>/export-csv-report/`
- **Method**: `GET`
- **Description**: Exports company task data as CSV
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: CSV file download
- **Logic**: Queries task data, formats as CSV, returns file

#### Details Report Task Log

- **URL**: `/api/tasks/summary-detail/<int:company_id>/`
- **Method**: `GET`
- **Description**: Provides detailed task summary for a company
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Detailed task summary
- **Logic**: Queries task logs, aggregates data, formats response

### Calendar Integration

#### Google Calendar Auth

- **URL**: `/api/calendar/auth/`
- **Method**: `GET`
- **Description**: Initiates Google Calendar authentication flow
- **Response**: Redirect URL for Google OAuth
- **Logic**: Generates OAuth URL with appropriate scopes

#### Google Calendar Redirect

- **URL**: `/api/calendar/redirect/`
- **Method**: `GET`
- **Description**: Handles Google Calendar OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message
- **Logic**: Processes OAuth response, stores credentials

#### Events by Date Range

- **URL**: `/api/calendar/events-by-date-range/`
- **Method**: `GET`
- **Description**: Retrieves calendar events within a date range
- **Query Parameters**: `start_date`, `end_date`
- **Response**: List of calendar events
- **Logic**: Queries Google Calendar API, formats response

#### Create Event

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
- **Logic**: Formats event data, calls Google Calendar API

### Asana Integration

#### Asana Authorize

- **URL**: `/api/asana/oauth/authorize/`
- **Method**: `GET`
- **Description**: Initiates Asana authentication flow
- **Response**: Redirect URL for Asana OAuth
- **Logic**: Generates OAuth URL with appropriate scopes

#### Asana Callback

- **URL**: `/api/asana/oauth/callback/`
- **Method**: `GET`
- **Description**: Handles Asana OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message
- **Logic**: Processes OAuth response, stores credentials

#### Fetch Workspaces

- **URL**: `/api/asana/workspaces/`
- **Method**: `GET`
- **Description**: Retrieves Asana workspaces
- **Response**: List of workspaces
- **Logic**: Calls Asana API, formats response

#### Fetch Projects

- **URL**: `/api/asana/workspaces/<str:workspace_id>/projects/`
- **Method**: `GET`
- **Description**: Retrieves Asana projects in a workspace
- **URL Parameters**: `workspace_id` - ID of the Asana workspace
- **Response**: List of projects
- **Logic**: Calls Asana API, formats response

#### Fetch Tasks

- **URL**: `/api/asana/projects/<str:project_id>/tasks/`
- **Method**: `GET`
- **Description**: Retrieves Asana tasks in a project
- **URL Parameters**: `project_id` - ID of the Asana project
- **Response**: List of tasks
- **Logic**: Calls Asana API, formats response

### Chat Application

#### Create Chat Group

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
- **Logic**: Validates input, creates group record

#### Send Group Message

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
- **Logic**: Validates input, creates message record, broadcasts to group members

#### Send Direct Message

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
- **Logic**: Validates input, creates message record, broadcasts to receiver

#### Fetch Group Messages

- **URL**: `/chat/fetch-group-messages/<int:group_id>/`
- **Method**: `GET`
- **Description**: Retrieves messages for a chat group
- **URL Parameters**: `group_id` - ID of the chat group
- **Response**: List of messages with details
- **Logic**: Queries messages by group ID, formats response

#### Fetch Direct Messages

- **URL**: `/chat/fetch-direct-messages/<int:sender_id>/<int:receiver_id>/`
- **Method**: `GET`
- **Description**: Retrieves direct messages between two users
- **URL Parameters**: 
  - `sender_id` - ID of the sender
  - `receiver_id` - ID of the receiver
- **Response**: List of messages with details
- **Logic**: Queries direct messages between users, formats response

### Slack Integration

#### Slack Auth

- **URL**: `/slack/auth/`
- **Method**: `GET`
- **Description**: Initiates Slack authentication flow
- **Response**: Redirect URL for Slack OAuth
- **Logic**: Generates OAuth URL with appropriate scopes

#### Slack OAuth Callback

- **URL**: `/slack/oauth/callback/`
- **Method**: `GET`
- **Description**: Handles Slack OAuth callback
- **Query Parameters**: OAuth response parameters
- **Response**: Authentication success message
- **Logic**: Processes OAuth response, stores credentials

#### Slack Events

- **URL**: `/slack/events/`
- **Method**: `POST`
- **Description**: Handles Slack events
- **Request Body**: Slack event data
- **Response**: Acknowledgment
- **Logic**: Processes Slack events, triggers appropriate actions

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

## Data Models

### Company

The Company model represents an organization in the system.

```json
{
  "_id": 1,
  "company_name": "Example Company",
  "interval_time": 15,
  "screenshot_time": 30,
  "country_code": "US",
  "currency": "USD",
  "Screenshot_module": true,
  "Ai_module": true,
  "Report_module": true,
  "Attendance_module": true,
  "active": true,
  "company_logo": "https://example.com/logo.png",
  "company_timezone": "UTC",
  "company_size": "11-50",
  "screenshot_mode": "random_taken_screenshot_mode",
  "company_address": "123 Main St, City, Country",
  "total_employees": 25,
  "employee_limit": 50,
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Employee

The Employee model represents a user in the system.

```json
{
  "_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "salary": 5000.00,
  "isAdmin": false,
  "isSuperAdmin": false,
  "companyId": 1,
  "date_of_birth": "1990-01-01",
  "date_of_joining": "2022-01-01",
  "gender": "male",
  "profile_picture": "https://example.com/profile.jpg",
  "team_leader": false,
  "designation": "Software Developer",
  "country_code": "+1",
  "isActive": true,
  "status": "Active",
  "created_date": "2022-01-01T00:00:00Z"
}
```

### Project

The Project model represents a project in the system.

```json
{
  "_id": 1,
  "companyId": 1,
  "name": "Project Name",
  "description": "Project Description",
  "dateAdded": "2023-01-01T00:00:00Z",
  "client": 1,
  "dueDate": "2023-12-31T00:00:00Z",
  "priority": "medium",
  "project_leader": 1,
  "isActive": true,
  "assignee": [1, 2, 3],
  "stagingServerURL": "https://staging.example.com",
  "liveServerURL": "https://live.example.com",
  "budget": 10000.00,
  "currencyType": "USD"
}
```

### Task

The Task model represents a task in the system.

```json
{
  "_id": 1,
  "title": "Task Title",
  "description": "Task Description",
  "project": 1,
  "assignee": 1,
  "assignby": 2,
  "dueDate": "2023-12-31T00:00:00Z",
  "priority": "medium",
  "status": "in_progress",
  "estimated_time": 8,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-02T00:00:00Z"
}
```

### Client

The Client model represents a client in the system.

```json
{
  "_id": 1,
  "clientName": "Client Name",
  "contact_person": "Contact Person",
  "email": "client@example.com",
  "phone": "1234567890",
  "address": "Client Address",
  "companyId": 1,
  "pay_per_month": 1000.00,
  "isActive": true,
  "reportByMail": false,
  "created_date": "2023-01-01T00:00:00Z"
}
```

### Team

The Team model represents a team in the system.

```json
{
  "id": 1,
  "name": "Team Name",
  "members": [1, 2, 3],
  "team_leader": 1
}
```

## Additional Endpoints

### Attendance Management

#### Employee Working Hours

- **URL**: `/api/employee/<int:employee_id>/working-hours/<str:year_month>/`
- **Method**: `GET`
- **Description**: Retrieves monthly working hours for an employee
- **URL Parameters**: 
  - `employee_id` - ID of the employee
  - `year_month` - Month in format "YYYY-MM"
- **Response**: Monthly working hours data
- **Logic**: Aggregates attendance records, calculates working hours

#### Company Employee Working Hours

- **URL**: `/api/attendance/<str:year_month>/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves working hours for all employees in a company for a specific month
- **URL Parameters**: 
  - `year_month` - Month in format "YYYY-MM"
  - `company_id` - ID of the company
- **Response**: Working hours data for all employees
- **Logic**: Aggregates attendance records for all employees, calculates working hours

### Salary Management

#### Company Employees Salary

- **URL**: `/api/employees/salary/<int:company_id>/<str:year_month>/`
- **Method**: `GET`
- **Description**: Retrieves salary information for all employees in a company for a specific month
- **URL Parameters**: 
  - `company_id` - ID of the company
  - `year_month` - Month in format "YYYY-MM"
- **Response**: Salary data for all employees
- **Logic**: Retrieves employee records with salary information

#### Create Salary Payment

- **URL**: `/api/employee/<int:employee_id>/salary/<str:year_month>/`
- **Method**: `POST`
- **Description**: Creates a salary payment record for an employee
- **URL Parameters**: 
  - `employee_id` - ID of the employee
  - `year_month` - Month in format "YYYY-MM"
- **Request Body**:
  ```json
  {
    "amount": 5000.00,
    "payment_date": "2023-01-31",
    "payment_method": "bank_transfer",
    "notes": "Salary for January 2023"
  }
  ```
- **Response**: Created salary payment details
- **Logic**: Validates input, creates salary payment record

### Reference Management

#### Company References

- **URL**: `/api/company/<int:company_id>/references/`
- **Method**: `GET`
- **Description**: Lists all references for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of references with details
- **Logic**: Queries references by company ID, formats response

#### Create Reference

- **URL**: `/api/references/`
- **Method**: `POST`
- **Description**: Creates a new reference
- **Request Body**:
  ```json
  {
    "name": "Reference Name",
    "email": "reference@example.com",
    "phone": "1234567890",
    "position": "Position",
    "company": "Company",
    "referred_by": 1,
    "companyId": 1
  }
  ```
- **Response**: Created reference details
- **Logic**: Validates input, creates reference record

#### Reference Detail

- **URL**: `/reference/<int:reference_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a reference
- **URL Parameters**: `reference_id` - ID of the reference
- **Response**: Detailed reference information
- **Logic**: Fetches reference record, includes related data

### Holiday Management

#### Upload Holidays

- **URL**: `/upload-holidays/<int:companyId>/`
- **Method**: `POST`
- **Description**: Uploads holidays for a company
- **URL Parameters**: `companyId` - ID of the company
- **Request Body**: Form data with holiday information
- **Response**: Success message
- **Logic**: Processes holiday data, creates holiday records

#### Get Holidays by Year

- **URL**: `/holidays/<int:companyId>/<int:year>/`
- **Method**: `GET`
- **Description**: Retrieves holidays for a company for a specific year
- **URL Parameters**: 
  - `companyId` - ID of the company
  - `year` - Year
- **Response**: List of holidays
- **Logic**: Queries holidays by company ID and year, formats response

#### Update Holiday

- **URL**: `/holiday/update/<int:holidayId>/`
- **Method**: `PUT`
- **Description**: Updates a holiday
- **URL Parameters**: `holidayId` - ID of the holiday
- **Request Body**: Holiday data to update
- **Response**: Updated holiday details
- **Logic**: Validates input, updates holiday record

### Feedback Management

#### Create Feedback

- **URL**: `/feedback/`
- **Method**: `POST`
- **Description**: Creates a new feedback
- **Request Body**:
  ```json
  {
    "sender_id": 1,
    "receiver_id": 2,
    "rating": 4,
    "feedback_text": "Great work on the project!",
    "feedback_type": "positive"
  }
  ```
- **Response**: Created feedback details
- **Logic**: Validates input, creates feedback record

#### Feedback by Receiver

- **URL**: `/api/feedbacks/<int:receiver_id>/`
- **Method**: `GET`
- **Description**: Lists all feedback for a receiver
- **URL Parameters**: `receiver_id` - ID of the receiver
- **Response**: List of feedback with details
- **Logic**: Queries feedback by receiver ID, formats response

### Complaint Management

#### Create Complaint

- **URL**: `/api/complaints/create/`
- **Method**: `POST`
- **Description**: Creates a new complaint
- **Request Body**:
  ```json
  {
    "title": "Complaint Title",
    "description": "Complaint Description",
    "employee_id": 1,
    "company_id": 1,
    "severity": "medium"
  }
  ```
- **Response**: Created complaint details
- **Logic**: Validates input, creates complaint record

#### Complaints by Company

- **URL**: `/api/complaints/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all complaints for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of complaints with details
- **Logic**: Queries complaints by company ID, formats response

### Global Search

- **URL**: `/api/global-search/<int:company_id>/`
- **Method**: `GET`
- **Description**: Performs a global search across all entities in a company
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `q` - Search query
- **Response**: Search results grouped by entity type
- **Logic**: Performs search across multiple models, formats response

## Websocket Endpoints

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

## Integration with Third-Party Services

### Google Integration

The API integrates with Google services for authentication and calendar functionality.

### Asana Integration

The API integrates with Asana for project and task management.

### Slack Integration

The API integrates with Slack for notifications and task creation.

## Security Considerations

- All API endpoints that handle sensitive data use HTTPS.
- Authentication is required for most endpoints.
- Input validation is performed on all endpoints.
- Rate limiting is applied to prevent abuse.
- CORS is configured to allow requests only from trusted origins.

## Best Practices for Frontend Integration

1. **Authentication**: Store the authentication token securely and include it in all API requests.
2. **Error Handling**: Implement proper error handling for all API requests.
3. **Loading States**: Show loading indicators during API requests.
4. **Caching**: Cache responses where appropriate to reduce API calls.
5. **Pagination**: Implement pagination controls for list views.
6. **Real-time Updates**: Use WebSockets for real-time features.
7. **Form Validation**: Validate form inputs before submitting to the API.
8. **Responsive Design**: Ensure the UI works well on all device sizes.

## Conclusion

This API documentation provides a comprehensive guide to integrating with the PW Pulse Django backend. For any questions or issues, please contact the development team. 