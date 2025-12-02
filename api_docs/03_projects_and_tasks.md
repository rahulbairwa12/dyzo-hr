# PW Pulse API: Project and Task Management

## Project Management

### Project List by Company

- **URL**: `/project/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all projects for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of projects with basic details

### Project List with Pagination

- **URL**: `/projects/pagination/company/<int:company_id>/projects/`
- **Method**: `GET`
- **Description**: Lists projects with pagination
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `page`, `page_size`
- **Response**: Paginated list of projects

### Project Detail

- **URL**: `/projects/detail/<int:project_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a project
- **URL Parameters**: `project_id` - ID of the project
- **Response**: Detailed project information including tasks and assignees

### Create Project

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

### Update Project

- **URL**: `/project/<int:_id>/`
- **Method**: `PUT`
- **Description**: Updates project information
- **URL Parameters**: `_id` - ID of the project
- **Request Body**: Project data to update
- **Response**: Updated project details

### Delete Project

- **URL**: `/api/project/delete/<int:_id>/`
- **Method**: `DELETE`
- **Description**: Deletes a project
- **URL Parameters**: `_id` - ID of the project
- **Response**: Success message

## Task Management

### Create Task

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

### Create Task with File

- **URL**: `/api/create-task/file/<int:assignby_id>/`
- **Method**: `POST`
- **Description**: Creates a new task with attached files
- **URL Parameters**: `assignby_id` - ID of the employee creating the task
- **Request Body**: Form data with task details and files
- **Response**: Created task details with file information

### Tasks by Project

- **URL**: `/task/project/<int:project_id>/`
- **Method**: `GET`
- **Description**: Lists all tasks for a project
- **URL Parameters**: `project_id` - ID of the project
- **Response**: List of tasks with details

### Tasks by Project and User

- **URL**: `/api/tasks_by_project_user/<int:project_id>/<int:user_id>/`
- **Method**: `GET`
- **Description**: Lists tasks for a specific project assigned to a specific user
- **URL Parameters**: 
  - `project_id` - ID of the project
  - `user_id` - ID of the user
- **Response**: List of tasks with details

### Update Task

- **URL**: `/task/<int:pk>/<int:userId>/`
- **Method**: `PUT`
- **Description**: Updates task information
- **URL Parameters**: 
  - `pk` - ID of the task
  - `userId` - ID of the user making the update
- **Request Body**: Task data to update
- **Response**: Updated task details

### Update Task Status

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

## Task Logs and Time Tracking

### Create Task Log

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

### Task Logs by Task

- **URL**: `/taskLogs/task/<int:taskId>/`
- **Method**: `GET`
- **Description**: Lists all time logs for a specific task
- **URL Parameters**: `taskId` - ID of the task
- **Response**: List of task logs with details

### Task Total Hours

- **URL**: `/task/user/<int:user_id>/`
- **Method**: `GET`
- **Description**: Retrieves total hours logged by a user across all tasks
- **URL Parameters**: `user_id` - ID of the user
- **Response**: Total hours and breakdown by task

## Screenshot Management

### Screenshots by Task

- **URL**: `/screenshot/task/<int:task_id>/employee/<int:employee_id>/`
- **Method**: `GET`
- **Description**: Lists screenshots for a specific task by an employee
- **URL Parameters**: 
  - `task_id` - ID of the task
  - `employee_id` - ID of the employee
- **Response**: List of screenshots with details

### Create Screenshot

- **URL**: `/screenshot/`
- **Method**: `POST`
- **Description**: Creates a new screenshot record
- **Request Body**: Form data with screenshot image and metadata
- **Response**: Created screenshot details

### Delete Screenshot

- **URL**: `/screenshot/<int:screenshot_id>/`
- **Method**: `DELETE`
- **Description**: Deletes a screenshot
- **URL Parameters**: `screenshot_id` - ID of the screenshot
- **Response**: Success message

## Client Management

### Client List by Company

- **URL**: `/api/clients/by_company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all clients for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of clients with details

### Create Client

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

### Client Detail

- **URL**: `/api/client/<int:client_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a client
- **URL Parameters**: `client_id` - ID of the client
- **Response**: Detailed client information

### Update Client

- **URL**: `/api/update/client/<int:client_id>/`
- **Method**: `PUT`
- **Description**: Updates client information
- **URL Parameters**: `client_id` - ID of the client
- **Request Body**: Client data to update
- **Response**: Updated client details

### Delete Client

- **URL**: `/api/client/delete/<int:pk>/`
- **Method**: `DELETE`
- **Description**: Deletes a client
- **URL Parameters**: `pk` - ID of the client
- **Response**: Success message

## Data Models

### Project Model

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

### Task Model

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

### Client Model

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

## Reporting

### Task Data Between Dates

- **URL**: `/task/period/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves task data for a company between specified dates
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Task data aggregated by date

### Export CSV Report

- **URL**: `/report/company/<int:company_id>/export-csv-report/`
- **Method**: `GET`
- **Description**: Exports company task data as CSV
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: CSV file download

### Details Report Task Log

- **URL**: `/api/tasks/summary-detail/<int:company_id>/`
- **Method**: `GET`
- **Description**: Provides detailed task summary for a company
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `start_date`, `end_date`
- **Response**: Detailed task summary
