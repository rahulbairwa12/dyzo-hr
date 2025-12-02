# PW Pulse API: HR and Leave Management

## Leave Management

### Leave List by Company

- **URL**: `/company/<int:company_id>/leaves/`
- **Method**: `GET`
- **Description**: Lists all leaves in a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of leaves with details

### Employee Leaves

- **URL**: `/employee/<int:employee_id>/leaves/`
- **Method**: `GET`
- **Description**: Lists all leaves for an employee
- **URL Parameters**: `employee_id` - ID of the employee
- **Response**: List of leaves with details

### Create Leave

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

### Approve Leave

- **URL**: `/leave/approve/<int:leave_id>/by/<int:approver_employee_id>/`
- **Method**: `POST`
- **Description**: Approves a leave request
- **URL Parameters**: 
  - `leave_id` - ID of the leave
  - `approver_employee_id` - ID of the approver
- **Response**: Updated leave details

### Reject Leave

- **URL**: `/leave/reject/<int:leave_id>/by/<int:approver_employee_id>/`
- **Method**: `POST`
- **Description**: Rejects a leave request
- **URL Parameters**: 
  - `leave_id` - ID of the leave
  - `approver_employee_id` - ID of the approver
- **Response**: Updated leave details

## Holiday Management

### Upload Holidays

- **URL**: `/upload-holidays/<int:companyId>/`
- **Method**: `POST`
- **Description**: Uploads holidays for a company
- **URL Parameters**: `companyId` - ID of the company
- **Request Body**: Form data with holiday information
- **Response**: Success message

### Get Holidays by Year

- **URL**: `/holidays/<int:companyId>/<int:year>/`
- **Method**: `GET`
- **Description**: Retrieves holidays for a company for a specific year
- **URL Parameters**: 
  - `companyId` - ID of the company
  - `year` - Year
- **Response**: List of holidays

### Update Holiday

- **URL**: `/holiday/update/<int:holidayId>/`
- **Method**: `PUT`
- **Description**: Updates a holiday
- **URL Parameters**: `holidayId` - ID of the holiday
- **Request Body**: Holiday data to update
- **Response**: Updated holiday details

## Feedback Management

### Create Feedback

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

### Feedback by Receiver

- **URL**: `/api/feedbacks/<int:receiver_id>/`
- **Method**: `GET`
- **Description**: Lists all feedback for a receiver
- **URL Parameters**: `receiver_id` - ID of the receiver
- **Response**: List of feedback with details

## Complaint Management

### Create Complaint

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

### Complaints by Company

- **URL**: `/api/complaints/company/<int:company_id>/`
- **Method**: `GET`
- **Description**: Lists all complaints for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of complaints with details

## Reference Management

### Company References

- **URL**: `/api/company/<int:company_id>/references/`
- **Method**: `GET`
- **Description**: Lists all references for a company
- **URL Parameters**: `company_id` - ID of the company
- **Response**: List of references with details

### Create Reference

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

### Reference Detail

- **URL**: `/reference/<int:reference_id>/`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a reference
- **URL Parameters**: `reference_id` - ID of the reference
- **Response**: Detailed reference information

## Global Search

- **URL**: `/api/global-search/<int:company_id>/`
- **Method**: `GET`
- **Description**: Performs a global search across all entities in a company
- **URL Parameters**: `company_id` - ID of the company
- **Query Parameters**: `q` - Search query
- **Response**: Search results grouped by entity type
