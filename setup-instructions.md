
# Library Management System - MySQL Backend Setup

## Prerequisites
- Node.js (v16 or higher)
- MySQL Server (v8.0 or higher)
- Git

## Database Setup

### 1. Install MySQL
- Download and install MySQL from [https://dev.mysql.com/downloads/](https://dev.mysql.com/downloads/)
- Start MySQL service
- Access MySQL command line or use MySQL Workbench

### 2. Create Database
Run the SQL script provided in `database/schema.sql`:

```bash
mysql -u root -p < database/schema.sql
```

Or copy and paste the contents into MySQL Workbench and execute.

### 3. Verify Database Setup
```sql
USE library_management_system;
SHOW TABLES;
```

You should see these tables:
- students
- books
- borrow_records
- admin_users
- penalty_records
- book_categories
- library_settings

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_management_system
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Update API Configuration
The frontend is already configured to use `http://localhost:3001/api` as the backend URL.

### 3. Start Frontend
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Testing the Setup

### 1. Test Database Connection
Visit `http://localhost:3001/api/books` - should return empty array initially.

### 2. Test Admin Login
- Email: admin@gmail.com
- Password: admin123

### 3. Test Student Registration
Create a new student account through the signup page.

## API Endpoints

### Authentication
- `POST /api/students/register` - Student registration
- `POST /api/students/login` - Student login

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Add new book (admin only)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)

### Borrowing
- `POST /api/borrow` - Borrow a book
- `PUT /api/borrow/:id/return` - Return a book
- `GET /api/students/:id/borrowed` - Get student's borrowed books

### Dashboard
- `GET /api/dashboard/stats` - Get library statistics

## Database Schema Overview

### Students Table
- Stores student information, login credentials, and library statistics
- Includes face recognition data for biometric login

### Books Table
- Stores book details with availability tracking
- Supports cover images and detailed descriptions

### Borrow Records Table
- Tracks all borrowing transactions
- Automatic penalty calculation for overdue books

### Admin Users Table
- Separate admin authentication system
- Role-based access control

### Penalty Records Table
- Detailed penalty tracking and payment history

## Assumptions Made

1. **Maximum Borrow Limit**: 3 books per student
2. **Default Borrow Period**: 14 days
3. **Penalty Rate**: ₹5 per day for overdue books
4. **Maximum Borrow Period**: 30 days
5. **Grace Period**: 1 day before penalties start
6. **Face Recognition**: Optional biometric login for students
7. **Admin Credentials**: Fixed admin account (admin@gmail.com/admin123)
8. **File Storage**: Book cover images stored as URLs (can be extended to file upload)

## VS Code Development

### Recommended Extensions
- MySQL (for database management)
- REST Client (for API testing)
- Node.js Extension Pack
- MySQL Syntax

### Database Management in VS Code
1. Install MySQL extension
2. Connect to your local MySQL instance
3. Manage tables and data directly from VS Code

## Production Deployment

1. **Environment Variables**: Update all sensitive data in production
2. **Database Security**: Use proper MySQL user with limited privileges
3. **HTTPS**: Enable SSL/TLS for production
4. **Rate Limiting**: Already implemented for API protection
5. **Input Validation**: Add more comprehensive validation
6. **Logging**: Implement proper logging system
7. **Backup**: Set up automated database backups

## Troubleshooting

### Common Issues

1. **MySQL Connection Error**
   - Check MySQL service is running
   - Verify credentials in .env file
   - Check firewall settings

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes using the port

3. **CORS Issues**
   - Verify FRONTEND_URL in .env
   - Check browser console for specific errors

4. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration settings

### Database Reset
To reset the database completely:
```sql
DROP DATABASE library_management_system;
```
Then run the schema.sql again.
