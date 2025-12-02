# PW Pulse API: Company and Employee Management

## Company Management

### Company Detail

- **URL**: `/dashboard/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: Company details including projects, employees, and statistics

### Update Company

- **URL**: `/company/<int:company_id>/update/`
- **Method**: `PUT`
- **Description**: Updates company information
- **URL Parameters**: `company_id` - ID of the company
- **Request Body**: Company data to update
- **Response**: Updated company details

### Add Company Logo

- **URL**: `/api/company/<int:pk>/add_logo/`
- **Method**: `POST`
- **Description**: Uploads and sets a company logo
- **URL Parameters**: `pk` - ID of the company
- **Request Body**: Form data with image file
- **Response**: Updated company details with logo URL

## Employee Management

### Employee List

- **URL**: `/employee/list/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all employees in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of employees with their details

### Employee Detail

- **URL**: `/employee/me/<int:_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about an employee
- **URL Parameters**: `_id` - ID of the employee
- **Response**: Detailed employee information

### Create Employee

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

### Update Employee

- **URL**: `/employee/<int:_id>/`
- **Method**: `PUT`
- **Description**: Updates employee information
- **URL Parameters**: `_id` - ID of the employee
- **Request Body**: Employee data to update
- **Response**: Updated employee details

### Delete Employee

- **URL**: `/employee/<int:_id>/`
- **Method**: `DELETE`
- **Description**: Deactivates an employee (soft delete)
- **URL Parameters**: `_id` - ID of the employee
- **Response**: Success message

## Team Management

### Company Teams

- **URL**: `/company/<int:company_id>/teams/list/`
- **Method**: `GET`
- **Description**: Lists all teams in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of teams with members

### Team Details

- **URL**: `/teams/<int:team_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a team
- **URL Parameters**: `team_id` - ID of the team
- **Response**: Detailed team information including members

### Create Team

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

### Update Team

- **URL**: `/api/update/team/<int:pk>/<int:employee_id>/`
- **Method**: `PUT`
- **Description**: Updates team information
- **URL Parameters**: 
  - `pk` - ID of the team
  - `employee_id` - ID of the employee making the update
- **Request Body**: Team data to update
- **Response**: Updated team details

### Add Team Member

- **URL**: `/team/<int:team_id>/add_member/<int:member_id>/`
- **Method**: `POST`
- **Description**: Adds a member to a team
- **URL Parameters**: 
  - `team_id` - ID of the team
  - `member_id` - ID of the employee to add
- **Response**: Updated team details

### Remove Team Member

- **URL**: `/team/<int:team_id>/remove_member/<int:member_id>/`
- **Method**: `DELETE`
- **Description**: Removes a member from a team
- **URL Parameters**: 
  - `team_id` - ID of the team
  - `member_id` - ID of the employee to remove
- **Response**: Updated team details

## Data Models

### Company Model

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

### Employee Model

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

### Team Model

```json
{
  "id": 1,
  "name": "Team Name",
  "members": [1, 2, 3],
  "team_leader": 1
}
```

## Additional HR Functions

### Attendance Management

#### Employee Working Hours

- **URL**: `/api/employee/<int:employee_id>/working-hours/<str:year_month>/`
- **Method**: `GET`
- **Description**: Retrieves monthly working hours for an employee
- **URL Parameters**: 
  - `employee_id` - ID of the employee
  - `year_month` - Month in format "YYYY-MM"
- **Response**: Monthly working hours data

#### Company Employee Working Hours

- **URL**: `/api/attendance/<str:year_month>/<int:company_id>/`
- **Method**: `GET`
- **Description**: Retrieves working hours for all employees in a company for a specific month
- **URL Parameters**: 
  - `year_month` - Month in format "YYYY-MM"
  - `company_id` - ID of the company
- **Response**: Working hours data for all employees

### Salary Management

#### Company Employees Salary

- **URL**: `/api/employees/salary/<int:company_id>/<str:year_month>/`
- **Method**: `GET`
- **Description**: Retrieves salary information for all employees in a company for a specific month
- **URL Parameters**: 
  - `company_id` - ID of the company
  - `year_month` - Month in format "YYYY-MM"
- **Response**: Salary data for all employees

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
