
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};

// Student registration
router.post('/register', async (req, res) => {
  const { collegeId, fullName, email, course, password } = req.body;
  const db = req.app.locals.db;

  try {
    console.log('📝 Student registration request:', { collegeId, fullName, email, course });

    // Check if student already exists
    const checkQuery = 'SELECT id FROM students WHERE email = ? OR college_id = ?';
    db.query(checkQuery, [email, collegeId], async (err, results) => {
      if (err) {
        console.error('❌ Database error during student check:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Student with this email or college ID already exists' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO students (college_id, full_name, email, course, password)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [collegeId, fullName, email, course, hashedPassword], (err, result) => {
        if (err) {
          console.error('❌ Failed to insert student:', err);
          return res.status(500).json({ success: false, message: 'Failed to register student' });
        }

        console.log('✅ Student registered successfully:', result.insertId);
        res.status(201).json({ 
          success: true, 
          message: 'Student registered successfully',
          studentId: result.insertId
        });
      });
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Student login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  console.log('🔐 Student login attempt:', email);

  const query = 'SELECT id, college_id, full_name, email, course, password, is_active FROM students WHERE email = ?';
  
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('❌ Database error during login:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const student = results[0];

    if (!student.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, student.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: student.id, 
          email: student.email, 
          userType: 'student',
          collegeId: student.college_id
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
      );

      console.log('✅ Student login successful:', student.id);
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: student.id,
          collegeId: student.college_id,
          fullName: student.full_name,
          email: student.email,
          course: student.course,
          userType: 'student'
        }
      });
    } catch (error) {
      console.error('❌ Password verification error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });
});

// Toggle favorite book
router.post('/favorites/toggle', verifyToken, (req, res) => {
  const { bookId } = req.body;
  const studentId = req.user.id;
  const db = req.app.locals.db;

  console.log('⭐ Toggling favorite book:', { studentId, bookId });

  // Check if book is already in favorites
  const checkQuery = 'SELECT id FROM student_favorites WHERE student_id = ? AND book_id = ?';
  
  db.query(checkQuery, [studentId, bookId], (err, results) => {
    if (err) {
      console.error('❌ Database error checking favorites:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      // Remove from favorites
      const deleteQuery = 'DELETE FROM student_favorites WHERE student_id = ? AND book_id = ?';
      db.query(deleteQuery, [studentId, bookId], (err, result) => {
        if (err) {
          console.error('❌ Database error removing favorite:', err);
          return res.status(500).json({ success: false, message: 'Failed to remove favorite' });
        }
        console.log('✅ Book removed from favorites');
        res.json({ success: true, message: 'Book removed from favorites', action: 'removed' });
      });
    } else {
      // Add to favorites
      const insertQuery = 'INSERT INTO student_favorites (student_id, book_id, added_date) VALUES (?, ?, NOW())';
      db.query(insertQuery, [studentId, bookId], (err, result) => {
        if (err) {
          console.error('❌ Database error adding favorite:', err);
          return res.status(500).json({ success: false, message: 'Failed to add favorite' });
        }
        console.log('✅ Book added to favorites');
        res.json({ success: true, message: 'Book added to favorites', action: 'added' });
      });
    }
  });
});

// Get student's favorite books
router.get('/:studentId/favorites', verifyToken, (req, res) => {
  const studentId = req.params.studentId;
  const db = req.app.locals.db;

  console.log('⭐ Fetching favorite books for student:', studentId);

  const query = `
    SELECT b.id, b.title, b.author, b.category, b.cover_image, b.description
    FROM student_favorites sf
    JOIN books b ON sf.book_id = b.id
    WHERE sf.student_id = ?
    ORDER BY sf.added_date DESC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('❌ Database error fetching favorites:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    console.log('✅ Retrieved favorite books:', results.length);
    res.json({ success: true, favoriteBooks: results });
  });
});

module.exports = router;
