const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes
const adminRoutes = require('./routes/admin');
const bookRoutes = require('./routes/books');
const borrowRoutes = require('./routes/borrow');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', process.env.FRONTEND_URL || 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased limit
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection with retry logic
const createConnection = () => {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_management_system',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  });

  connection.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect to database...');
      setTimeout(createConnection, 2000);
    }
  });

  return connection;
};

let db;
try {
  db = createConnection();
  console.log('Attempting to connect to MySQL database...');
  
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      console.error('Please check your database configuration:');
      console.error('- Ensure MySQL is running');
      console.error('- Check your .env file for correct database credentials');
      console.error('- Run "node setup.js" to create the database and tables');
      process.exit(1);
    }
    console.log('✅ Connected to MySQL database successfully');
    console.log(`Database: ${process.env.DB_NAME || 'library_management_system'}`);
  });
} catch (error) {
  console.error('Failed to create database connection:', error);
  process.exit(1);
}

// Make db available to routes
app.locals.db = db;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Routes

// Student Registration
app.post('/api/students/register', async (req, res) => {
  try {
    console.log('📝 Student registration request received:', { ...req.body, password: '[HIDDEN]' });
    const { collegeId, fullName, email, course, password } = req.body;

    // Validation
    if (!collegeId || !fullName || !email || !course || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check if student already exists
    const checkQuery = 'SELECT id FROM students WHERE email = ? OR college_id = ?';
    db.query(checkQuery, [email, collegeId], async (err, results) => {
      if (err) {
        console.error('❌ Database error during registration check:', err);
        return res.status(500).json({ success: false, message: 'Database error during registration check' });
      }

      if (results.length > 0) {
        return res.status(400).json({ success: false, message: 'Student with this email or college ID already exists' });
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new student
        const insertQuery = `
          INSERT INTO students (college_id, full_name, email, course, password) 
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [collegeId, fullName, email, course, hashedPassword], (err, result) => {
          if (err) {
            console.error('❌ Database error during student insertion:', err);
            return res.status(500).json({ success: false, message: 'Failed to register student' });
          }

          console.log('✅ Student registered successfully:', { collegeId, fullName, email, course });
          res.status(201).json({ 
            success: true, 
            message: 'Student registered successfully',
            studentId: result.insertId 
          });
        });
      } catch (hashError) {
        console.error('❌ Password hashing error:', hashError);
        return res.status(500).json({ success: false, message: 'Password processing failed' });
      }
    });
  } catch (error) {
    console.error('❌ Server error during registration:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Student Login
app.post('/api/students/login', async (req, res) => {
  try {
    console.log('🔐 Student login request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const query = 'SELECT * FROM students WHERE email = ? AND is_active = TRUE';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('❌ Database error during login:', err);
        return res.status(500).json({ success: false, message: 'Database error during login' });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });
      }

      const student = results[0];
      
      try {
        const isPasswordValid = await bcrypt.compare(password, student.password);

        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ 
          id: student.id, 
          collegeId: student.college_id, 
          email: student.email,
          userType: 'student' 
        }, JWT_SECRET, { expiresIn: '24h' });

        // Remove password from response
        delete student.password;

        console.log('✅ Student login successful:', student.email);
        res.json({ 
          success: true, 
          message: 'Login successful',
          token,
          student: {
            id: student.id,
            collegeId: student.college_id,
            fullName: student.full_name,
            email: student.email,
            course: student.course,
            totalBorrowed: student.total_borrowed,
            totalReturned: student.total_returned,
            penaltyAmount: student.penalty_amount,
            registrationDate: student.registration_date,
            isActive: student.is_active
          }
        });
      } catch (compareError) {
        console.error('❌ Password comparison error:', compareError);
        return res.status(500).json({ success: false, message: 'Authentication processing failed' });
      }
    });
  } catch (error) {
    console.error('❌ Server error during login:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Use route modules
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check request received');
  
  // Test database connection
  db.ping((err) => {
    if (err) {
      console.error('❌ Database health check failed:', err);
      return res.status(503).json({ 
        success: false, 
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      });
    }
    
    console.log('✅ Health check successful - all systems operational');
    res.json({ 
      success: true, 
      message: 'Server is running and database is connected', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong! Please try again.' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 request:', req.method, req.originalUrl);
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 =================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'library_management_system'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log('✅ Server is ready to accept connections');
  console.log('==================================\n');
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop any existing server on this port or change the PORT in your .env file.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    db.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;


