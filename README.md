# Task Management API Server

A comprehensive RESTful API server built with Node.js, Express, and MongoDB that provides task management functionality with full CRUD operations. Includes an optional React frontend for easy interaction with the APIs.

## 🚀 Features

- **Custom API Endpoints**: 4+ RESTful endpoints for complete task management
- **Database Integration**: MongoDB for persistent data storage
- **CRUD Operations**: Create, Read, Update, Delete tasks and users
- **Frontend Interface**: React-based web application (optional)
- **API Documentation**: Comprehensive endpoint documentation
- **Error Handling**: Robust error handling and validation
- **CORS Support**: Cross-origin resource sharing enabled

## 📁 Project Structure

```
task-management-api/
├── server/
│   ├── models/
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   └── validation.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   └── package.json
├── frontend/ (optional)
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   ├── public/
│   └── package.json
├── README.md
└── .env.example
```

## 🛠 Technologies Used

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend (Optional)
- **React**: Frontend library
- **Axios**: HTTP client for API calls
- **CSS3**: Styling

## 📊 Database Schema

### Task Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  status: String (enum: ['pending', 'in-progress', 'completed']),
  priority: String (enum: ['low', 'medium', 'high']),
  assignedTo: ObjectId (ref: User),
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  role: String (enum: ['admin', 'user']),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 API Endpoints

### Tasks API

#### 1. Get All Tasks
- **Endpoint**: `GET /api/tasks`
- **Description**: Retrieve all tasks with optional filtering
- **Query Parameters**: 
  - `status` (optional): Filter by task status
  - `priority` (optional): Filter by priority
  - `assignedTo` (optional): Filter by assigned user ID
- **Sample Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Complete API Documentation",
      "description": "Write comprehensive API documentation",
      "status": "in-progress",
      "priority": "high",
      "assignedTo": "64a1b2c3d4e5f6g7h8i9j0k2",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 2. Get Task by ID
- **Endpoint**: `GET /api/tasks/:id`
- **Description**: Retrieve a specific task by its ID
- **Sample Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Complete API Documentation",
    "description": "Write comprehensive API documentation",
    "status": "in-progress",
    "priority": "high",
    "assignedTo": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "dueDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### 3. Create New Task
- **Endpoint**: `POST /api/tasks`
- **Description**: Create a new task
- **Request Body**:
```json
{
  "title": "New Task Title",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "assignedTo": "64a1b2c3d4e5f6g7h8i9j0k2",
  "dueDate": "2024-02-01T00:00:00.000Z"
}
```
- **Sample Response**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
    "title": "New Task Title",
    "description": "Task description",
    "status": "pending",
    "priority": "medium",
    "assignedTo": "64a1b2c3d4e5f6g7h8i9j0k2",
    "dueDate": "2024-02-01T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### 4. Update Task
- **Endpoint**: `PUT /api/tasks/:id`
- **Description**: Update an existing task
- **Request Body**: (All fields optional)
```json
{
  "title": "Updated Task Title",
  "status": "completed",
  "priority": "high"
}
```
- **Sample Response**:
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Updated Task Title",
    "description": "Task description",
    "status": "completed",
    "priority": "high",
    "assignedTo": "64a1b2c3d4e5f6g7h8i9j0k2",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T11:30:00.000Z"
  }
}
```

#### 5. Delete Task
- **Endpoint**: `DELETE /api/tasks/:id`
- **Description**: Delete a task by its ID
- **Sample Response**:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Users API

#### 6. Get All Users
- **Endpoint**: `GET /api/users`
- **Description**: Retrieve all users
- **Sample Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T09:00:00.000Z",
      "updatedAt": "2024-01-01T09:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 7. Create New User
- **Endpoint**: `POST /api/users`
- **Description**: Create a new user
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "user"
}
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/DebarjunPal/task-management-api.git
cd task-management-api
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Environment Configuration**
Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanagement
NODE_ENV=development
```

4. **Start MongoDB**
Make sure MongoDB is running on your system:
```bash
# For local MongoDB installation
mongod

# Or use MongoDB Atlas connection string in .env
```

5. **Run the server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will be running at `http://localhost:5000`

### Frontend Setup (Optional)

1. **Install frontend dependencies**
```bash
cd frontend
npm install
```

2. **Start the frontend**
```bash
npm start
```

The frontend will be running at `http://localhost:3000`

## 🧪 Testing the API

### Using cURL

**Create a new user:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

**Get all users:**
```bash
curl -X GET http://localhost:5000/api/users
```

**Create a new task:**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete API Testing",
    "description": "Test all API endpoints thoroughly",
    "status": "pending",
    "priority": "high",
    "assignedTo": "USER_ID_HERE",
    "dueDate": "2024-01-15T00:00:00.000Z"
  }'
```

**Get all tasks:**
```bash
curl -X GET http://localhost:5000/api/tasks
```

**Get tasks by status:**
```bash
curl -X GET "http://localhost:5000/api/tasks?status=pending"
```

**Update a task:**
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "priority": "medium"
  }'
```

**Delete a task:**
```bash
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID_HERE
```

### Using Postman

1. Import the API endpoints into Postman
2. Set the base URL to `http://localhost:5000`
3. Use the endpoint documentation above for testing each route

## 🗂 API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "count": 1 // for list endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🔧 Error Handling

The API implements comprehensive error handling for:
- Validation errors (400 Bad Request)
- Resource not found (404 Not Found)
- Database connection errors (500 Internal Server Error)
- Duplicate entries (409 Conflict)

## 🚀 Deployment

### Environment Variables for Production
```env
PORT=5000
MONGODB_URI
NODE_ENV=production
```

### Deployment Options
- **Heroku**: Easy deployment with MongoDB Atlas
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2 or Elastic Beanstalk
- **Vercel**: For full-stack deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For any questions or issues, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Contact the maintainers

## 🎯 Future Enhancements

- Authentication and authorization (JWT)
- Real-time updates with WebSockets
- File upload functionality
- Email notifications
- Task comments and attachments
- Advanced filtering and search
- API rate limiting
- Comprehensive test suite

---

**Made with ❤️ using Node.js, Express, and MongoDB**
